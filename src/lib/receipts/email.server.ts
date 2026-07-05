// Server-only: send an order receipt via Resend with an invoice PDF attachment.
export interface ReceiptInput {
  to: string;
  bcc?: string;
  order_number: string;
  customer_name: string;
  total_display: string;
  items: { name: string; qty: number; total: string }[];
  invoice_url?: string;
  pdf_base64: string;
}

export async function sendReceiptEmail(input: ReceiptInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[receipt] RESEND_API_KEY missing, skipping email");
    return;
  }

  const rows = input.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${escape(i.name)} <span style="color:#888">× ${i.qty}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee">${escape(i.total)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="font-family:Georgia,serif;background:#faf7f0;padding:32px;color:#141416">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #eadfc4;padding:40px">
    <p style="letter-spacing:0.35em;font-size:11px;color:#b8871f;margin:0">ZANNIES COLLECTIONS</p>
    <h1 style="font-size:28px;margin:12px 0 4px">Thank you, ${escape(input.customer_name || "friend")}.</h1>
    <p style="color:#666;margin:0 0 24px">Your order <strong>${escape(input.order_number)}</strong> is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
      <tr><td style="padding-top:16px;font-weight:bold;font-size:16px">Total</td><td align="right" style="padding-top:16px;font-weight:bold;font-size:16px;color:#b8871f">${escape(input.total_display)}</td></tr>
    </table>
    <p style="margin-top:32px;font-size:13px;color:#666">A copy of your invoice is attached to this email${input.invoice_url ? ` and available <a href="${input.invoice_url}" style="color:#b8871f">here</a>` : ""}.</p>
    <hr style="border:none;border-top:1px solid #eadfc4;margin:32px 0" />
    <p style="font-size:11px;color:#999;line-height:1.6">Zannies Collections · 66 Paul Street, Greater London, EC2A 4NA, England<br/>hello@zanniescollections.com · +44 7746 930857</p>
  </div></body></html>`;

  const from = process.env.RECEIPT_EMAIL
    ? `Zannies Collections <${process.env.RECEIPT_EMAIL}>`
    : "Zannies Collections <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      bcc: input.bcc ? [input.bcc] : undefined,
      subject: `Your Zannies order ${input.order_number}`,
      html,
      attachments: [
        { filename: `invoice-${input.order_number}.pdf`, content: input.pdf_base64 },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[receipt] resend error", res.status, body);
  }
}

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
