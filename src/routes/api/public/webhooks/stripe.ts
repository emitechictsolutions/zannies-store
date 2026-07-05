// Stripe webhook: verifies signature and finalises orders.
import { createFileRoute } from "@tanstack/react-router";

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=").map((x) => x.trim()) as [string, string]));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(hex, v1);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const sig = request.headers.get("stripe-signature");
        const raw = await request.text();
        if (!secret || !sig) return new Response("Missing signature/secret", { status: 400 });
        const ok = await verifyStripeSignature(raw, sig, secret);
        if (!ok) return new Response("Invalid signature", { status: 401 });

        const event = JSON.parse(raw);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
            const session = event.data.object;
            const orderId: string | undefined = session.metadata?.order_id || session.client_reference_id;
            if (!orderId) return new Response("no order_id", { status: 200 });
            await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId);
            await supabaseAdmin
              .from("payments")
              .update({
                status: "succeeded",
                provider_ref: String(session.payment_intent ?? session.id),
              })
              .eq("provider_session_id", String(session.id));

            const { sendReceiptForOrder } = await import("@/lib/receipts/dispatch.server");
            try {
              await sendReceiptForOrder(orderId);
            } catch (e) {
              console.error("[stripe webhook] receipt error", e);
            }
          } else if (
            event.type === "checkout.session.expired" ||
            event.type === "checkout.session.async_payment_failed" ||
            event.type === "payment_intent.payment_failed"
          ) {
            const session = event.data.object;
            const orderId: string | undefined = session.metadata?.order_id || session.client_reference_id;
            if (orderId) {
              await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", orderId);
              await supabaseAdmin
                .from("payments")
                .update({ status: "failed" })
                .eq("provider_session_id", session.id);
            }
          }
        } catch (err) {
          console.error("[stripe webhook] error", err);
          return new Response("error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
