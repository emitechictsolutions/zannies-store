// Server-only: fetch a paid order, build invoice PDF, upload to storage, email receipt.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildInvoicePdf } from "./invoice.server";
import { sendReceiptEmail } from "./email.server";

const fmt = (p: number, cur = "GBP") =>
  `${cur === "GBP" ? "£" : cur + " "}${(p / 100).toFixed(2)}`;

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // btoa exists in Workers
  return btoa(bin);
}

export async function sendReceiptForOrder(orderId: string): Promise<{ invoice_url: string | null }> {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) throw new Error("Order not found");
  if (order.receipt_sent_at) return { invoice_url: order.invoice_url ?? null };

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_name, quantity, unit_price_pence")
    .eq("order_id", orderId);

  const { data: user } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
  const email = user?.user?.email;
  const meta = (user?.user?.user_metadata ?? {}) as { first_name?: string; last_name?: string };
  const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || email?.split("@")[0] || "Customer";

  const addr = order.shipping_address as any;
  const addressLines = addr
    ? `${addr.full_name ?? ""}\n${addr.line1 ?? ""}${addr.line2 ? ", " + addr.line2 : ""}\n${addr.city ?? ""} ${addr.postal_code ?? ""}\n${addr.country ?? ""}`
    : undefined;

  const pdfBytes = await buildInvoicePdf({
    order_number: order.order_number,
    date: new Date(order.created_at).toDateString(),
    customer_name: name,
    customer_email: email ?? "",
    shipping_address: addressLines,
    items: (items ?? []).map((i) => ({
      name: i.product_name,
      qty: i.quantity,
      unit_price_pence: i.unit_price_pence,
    })),
    subtotal_pence: order.subtotal_pence,
    discount_pence: order.discount_pence ?? 0,
    shipping_pence: order.shipping_pence ?? 0,
    total_pence: order.total_pence,
    currency: order.currency ?? "GBP",
  });

  // Upload PDF to storage
  const path = `invoices/${order.order_number}.pdf`;
  let invoice_url: string | null = null;
  const { error: upErr } = await supabaseAdmin.storage
    .from("site-assets")
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
  if (!upErr) {
    const { data: signed } = await supabaseAdmin.storage
      .from("site-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    invoice_url = signed?.signedUrl ?? null;
  } else {
    console.error("[receipt] upload error", upErr);
  }

  if (email) {
    await sendReceiptEmail({
      to: email,
      bcc: process.env.RECEIPT_EMAIL,
      order_number: order.order_number,
      customer_name: name,
      total_display: fmt(order.total_pence, order.currency),
      items: (items ?? []).map((i) => ({
        name: i.product_name,
        qty: i.quantity,
        total: fmt(i.unit_price_pence * i.quantity, order.currency),
      })),
      invoice_url: invoice_url ?? undefined,
      pdf_base64: toBase64(pdfBytes),
    });
  }

  await supabaseAdmin
    .from("orders")
    .update({ invoice_url, receipt_sent_at: new Date().toISOString() })
    .eq("id", orderId);

  return { invoice_url };
}
