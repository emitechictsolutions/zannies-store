// PayPal return handler: captures the approved order, updates DB, sends receipt, redirects.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/paypal/capture")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token"); // PayPal order id
        const orderId = url.searchParams.get("order");
        const origin = `${url.protocol}//${url.host}`;
        if (!token || !orderId) {
          return Response.redirect(`${origin}/checkout/failed?reason=missing_token`, 302);
        }

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const secret = process.env.PAYPAL_SECRET;
        const mode = (process.env.PAYPAL_MODE || "live").toLowerCase();
        const ppBase = mode === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
        if (!clientId || !secret) {
          return Response.redirect(`${origin}/checkout/failed?reason=paypal_not_configured`, 302);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const auth = btoa(`${clientId}:${secret}`);

        try {
          const capRes = await fetch(`${ppBase}/v2/checkout/orders/${token}/capture`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
          });
          const cap: any = await capRes.json();
          const status = cap.status;
          const capId = cap.purchase_units?.[0]?.payments?.captures?.[0]?.id;

          if (!capRes.ok || status !== "COMPLETED") {
            await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", orderId);
            await supabaseAdmin
              .from("payments")
              .update({ status: "failed" })
              .eq("provider_order_id", token);
            const { data: o } = await supabaseAdmin
              .from("orders")
              .select("order_number")
              .eq("id", orderId)
              .maybeSingle();
            return Response.redirect(
              `${origin}/checkout/failed?order=${encodeURIComponent(o?.order_number ?? "")}&reason=${encodeURIComponent(status || "payment_failed")}`,
              302,
            );
          }

          await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId);
          await supabaseAdmin
            .from("payments")
            .update({ status: "succeeded", provider_ref: capId ? String(capId) : null })
            .eq("provider_order_id", token);

          const { data: o } = await supabaseAdmin
            .from("orders")
            .select("order_number")
            .eq("id", orderId)
            .maybeSingle();

          const { sendReceiptForOrder } = await import("@/lib/receipts/dispatch.server");
          try {
            await sendReceiptForOrder(orderId);
          } catch (e) {
            console.error("[paypal capture] receipt error", e);
          }

          throw redirect({
            href: `${origin}/checkout/success?order=${encodeURIComponent(o?.order_number ?? "")}&provider=paypal`,
          });
        } catch (err: any) {
          if (err instanceof Response) return err;
          if (err && typeof err === "object" && "href" in err) {
            return Response.redirect(err.href as string, 302);
          }
          console.error("[paypal capture] error", err);
          return Response.redirect(`${origin}/checkout/failed?reason=capture_error`, 302);
        }
      },
    },
  },
});
