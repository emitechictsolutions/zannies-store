// Client-callable server functions for checkout with Stripe & PayPal.
import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CartItemSchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  product_image: z.string().optional().nullable(),
  variant: z.string().optional().nullable(),
  qty: z.number().int().positive(),
  unit_price_pence: z.number().int().nonnegative(),
});

const InputSchema = z.object({
  provider: z.enum(["stripe", "paypal"]),
  address_id: z.string().uuid(),
  coupon_code: z.string().optional().nullable(),
  items: z.array(CartItemSchema).min(1),
});

const COUPONS: Record<string, number> = { WELCOME10: 0.1, ZANNIES15: 0.15 };
const SHIPPING_PENCE = 500;

function origin(): string {
  const host = getRequestHost();
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export const createPaymentSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof InputSchema>) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load address (user-scoped, RLS enforced)
    const { data: addr, error: addrErr } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", data.address_id)
      .maybeSingle();
    if (addrErr || !addr) throw new Error("Address not found");

    const subtotal = data.items.reduce((s, i) => s + i.unit_price_pence * i.qty, 0);
    const discount = data.coupon_code && COUPONS[data.coupon_code] ? Math.round(subtotal * COUPONS[data.coupon_code]) : 0;
    const shipping = SHIPPING_PENCE;
    const total = subtotal - discount + shipping;
    const orderNumber = `ZNS-${Date.now().toString(36).toUpperCase()}`;

    // Insert order + items via admin (we already validated user)
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: "pending",
        subtotal_pence: subtotal,
        discount_pence: discount,
        shipping_pence: shipping,
        total_pence: total,
        currency: "GBP",
        coupon_code: data.coupon_code ?? null,
        shipping_address: addr as any,
      } as any)
      .select()
      .single();
    if (oErr || !order) throw new Error(oErr?.message || "Could not create order");

    await supabaseAdmin.from("order_items").insert(
      data.items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_image: i.product_image ?? null,
        variant: i.variant ?? null,
        quantity: i.qty,
        unit_price_pence: i.unit_price_pence,
        line_total_pence: i.unit_price_pence * i.qty,
      })),
    );

    const base = origin();
    const successUrl = `${base}/checkout/success?order=${encodeURIComponent(orderNumber)}&provider=${data.provider}`;
    const cancelUrl = `${base}/checkout/failed?order=${encodeURIComponent(orderNumber)}&reason=cancelled`;

    if (data.provider === "stripe") {
      const stripeKey = process.env.STRIPE_LIVE_API_KEY;
      if (!stripeKey) throw new Error("Stripe not configured");
      const body = new URLSearchParams();
      body.set("mode", "payment");
      body.set("success_url", `${successUrl}&session={CHECKOUT_SESSION_ID}`);
      body.set("cancel_url", cancelUrl);
      body.set("client_reference_id", order.id);
      body.set("metadata[order_id]", order.id);
      body.set("metadata[order_number]", orderNumber);
      body.set("customer_email", ""); // Stripe will collect
      data.items.forEach((i, idx) => {
        body.set(`line_items[${idx}][price_data][currency]`, "gbp");
        body.set(`line_items[${idx}][price_data][unit_amount]`, String(i.unit_price_pence));
        body.set(`line_items[${idx}][price_data][product_data][name]`, i.product_name);
        body.set(`line_items[${idx}][quantity]`, String(i.qty));
      });
      // Discount + shipping as adjustment line items
      if (discount > 0) {
        const idx = data.items.length;
        body.set(`line_items[${idx}][price_data][currency]`, "gbp");
        body.set(`line_items[${idx}][price_data][unit_amount]`, String(-discount));
        body.set(`line_items[${idx}][price_data][product_data][name]`, `Discount (${data.coupon_code})`);
        body.set(`line_items[${idx}][quantity]`, "1");
      }
      const shipIdx = data.items.length + (discount > 0 ? 1 : 0);
      body.set(`line_items[${shipIdx}][price_data][currency]`, "gbp");
      body.set(`line_items[${shipIdx}][price_data][unit_amount]`, String(shipping));
      body.set(`line_items[${shipIdx}][price_data][product_data][name]`, "Shipping");
      body.set(`line_items[${shipIdx}][quantity]`, "1");

      // Stripe rejects empty customer_email — remove if blank
      body.delete("customer_email");

      const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const json: any = await resp.json();
      if (!resp.ok) {
        console.error("[stripe] session error", json);
        throw new Error(json.error?.message || "Stripe session failed");
      }
      await supabaseAdmin.from("payments").insert({
        order_id: order.id,
        user_id: userId,
        provider: "stripe",
        status: "pending",
        amount_pence: total,
        currency: "GBP",
        provider_session_id: json.id,
      });
      return { url: json.url as string, order_number: orderNumber };
    }

    // PayPal
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const mode = (process.env.PAYPAL_MODE || "live").toLowerCase();
    if (!clientId || !secret) throw new Error("PayPal not configured");
    const ppBase = mode === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    const auth = btoa(`${clientId}:${secret}`);

    const ppRes = await fetch(`${ppBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id,
            invoice_id: orderNumber,
            amount: {
              currency_code: "GBP",
              value: (total / 100).toFixed(2),
              breakdown: {
                item_total: { currency_code: "GBP", value: (subtotal / 100).toFixed(2) },
                shipping: { currency_code: "GBP", value: (shipping / 100).toFixed(2) },
                discount: { currency_code: "GBP", value: (discount / 100).toFixed(2) },
              },
            },
            items: data.items.map((i) => ({
              name: i.product_name.slice(0, 127),
              quantity: String(i.qty),
              unit_amount: { currency_code: "GBP", value: (i.unit_price_pence / 100).toFixed(2) },
            })),
          },
        ],
        application_context: {
          brand_name: "Zannies Collections",
          user_action: "PAY_NOW",
          return_url: `${base}/api/public/paypal/capture?order=${order.id}`,
          cancel_url: cancelUrl,
        },
      }),
    });
    const pp: any = await ppRes.json();
    if (!ppRes.ok) {
      console.error("[paypal] order error", pp);
      throw new Error(pp.message || "PayPal order failed");
    }
    const approve = pp.links?.find((l: any) => l.rel === "approve")?.href;
    if (!approve) throw new Error("PayPal approval URL missing");

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      user_id: userId,
      provider: "paypal",
      status: "pending",
      amount_pence: total,
      currency: "GBP",
      provider_order_id: pp.id,
    });

    return { url: approve as string, order_number: orderNumber };
  });
