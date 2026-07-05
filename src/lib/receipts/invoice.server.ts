// Server-only: generate an invoice PDF using pdf-lib.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface InvoiceItem {
  name: string;
  qty: number;
  unit_price_pence: number;
}

export interface InvoiceInput {
  order_number: string;
  date: string;
  customer_name: string;
  customer_email: string;
  shipping_address?: string;
  items: InvoiceItem[];
  subtotal_pence: number;
  discount_pence: number;
  shipping_pence: number;
  total_pence: number;
  currency: string;
}

const fmt = (p: number, cur: string) =>
  `${cur === "GBP" ? "£" : cur + " "}${(p / 100).toFixed(2)}`;

export async function buildInvoicePdf(inv: InvoiceInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const gold = rgb(0.72, 0.53, 0.15);
  const ink = rgb(0.09, 0.09, 0.11);
  const grey = rgb(0.45, 0.45, 0.5);
  let y = 800;

  page.drawText("ZANNIES COLLECTIONS", { x: 40, y, size: 16, font: bold, color: ink });
  page.drawText("Luxury · Beauty · Elegance", { x: 40, y: y - 16, size: 9, font, color: gold });
  page.drawText("INVOICE", { x: 480, y, size: 18, font: bold, color: gold });
  y -= 60;

  page.drawText("66 Paul Street, Greater London, EC2A 4NA, England", { x: 40, y, size: 9, font, color: grey });
  page.drawText("hello@zanniescollections.com  ·  +44 7746 930857", { x: 40, y: y - 12, size: 9, font, color: grey });
  y -= 40;

  page.drawText(`Invoice #: ${inv.order_number}`, { x: 40, y, size: 10, font: bold, color: ink });
  page.drawText(`Date: ${inv.date}`, { x: 40, y: y - 14, size: 10, font, color: ink });
  y -= 40;

  page.drawText("BILL TO", { x: 40, y, size: 8, font: bold, color: gold });
  y -= 14;
  page.drawText(inv.customer_name, { x: 40, y, size: 10, font, color: ink });
  y -= 12;
  page.drawText(inv.customer_email, { x: 40, y, size: 9, font, color: grey });
  if (inv.shipping_address) {
    y -= 12;
    for (const line of inv.shipping_address.split("\n")) {
      page.drawText(line.slice(0, 80), { x: 40, y, size: 9, font, color: grey });
      y -= 11;
    }
  }
  y -= 20;

  // Table header
  page.drawRectangle({ x: 40, y: y - 4, width: 515, height: 22, color: rgb(0.96, 0.94, 0.87) });
  page.drawText("ITEM", { x: 48, y: y + 4, size: 9, font: bold, color: ink });
  page.drawText("QTY", { x: 360, y: y + 4, size: 9, font: bold, color: ink });
  page.drawText("PRICE", { x: 410, y: y + 4, size: 9, font: bold, color: ink });
  page.drawText("TOTAL", { x: 490, y: y + 4, size: 9, font: bold, color: ink });
  y -= 24;

  for (const it of inv.items) {
    page.drawText(it.name.slice(0, 60), { x: 48, y, size: 10, font, color: ink });
    page.drawText(String(it.qty), { x: 360, y, size: 10, font, color: ink });
    page.drawText(fmt(it.unit_price_pence, inv.currency), { x: 410, y, size: 10, font, color: ink });
    page.drawText(fmt(it.unit_price_pence * it.qty, inv.currency), { x: 490, y, size: 10, font, color: ink });
    y -= 18;
  }

  y -= 20;
  const rows: [string, number][] = [
    ["Subtotal", inv.subtotal_pence],
    ["Discount", -inv.discount_pence],
    ["Shipping", inv.shipping_pence],
  ];
  for (const [label, val] of rows) {
    if (label === "Discount" && val === 0) continue;
    page.drawText(label, { x: 400, y, size: 10, font, color: grey });
    page.drawText(fmt(val, inv.currency), { x: 490, y, size: 10, font, color: ink });
    y -= 14;
  }
  y -= 4;
  page.drawLine({ start: { x: 400, y }, end: { x: 555, y }, thickness: 0.5, color: grey });
  y -= 16;
  page.drawText("TOTAL", { x: 400, y, size: 11, font: bold, color: gold });
  page.drawText(fmt(inv.total_pence, inv.currency), { x: 490, y, size: 11, font: bold, color: gold });

  y -= 60;
  page.drawText("Thank you for shopping with Zannies Collections.", { x: 40, y, size: 9, font, color: grey });
  page.drawText("Payments are processed securely by Stripe / PayPal.", { x: 40, y: y - 12, size: 8, font, color: grey });

  return doc.save();
}
