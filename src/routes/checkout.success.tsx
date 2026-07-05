import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { Check, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: z.object({
    order: z.string().optional(),
    provider: z.string().optional(),
    session: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Order Confirmed — Zannies Collections" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { order, provider } = useSearch({ from: "/checkout/success" });
  const [invoice, setInvoice] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;
    let mounted = true;
    // Poll briefly — webhook processing may take a second or two
    const tick = async () => {
      const { data } = await supabase
        .from("orders")
        .select("status, invoice_url")
        .eq("order_number", order)
        .maybeSingle();
      if (!mounted || !data) return;
      setStatus(data.status);
      if (data.invoice_url) setInvoice(data.invoice_url);
    };
    tick();
    const iv = setInterval(tick, 3000);
    const stop = setTimeout(() => clearInterval(iv), 30_000);
    return () => { mounted = false; clearInterval(iv); clearTimeout(stop); };
  }, [order]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 pt-28">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold">
          <Check className="h-8 w-8 text-ink" />
        </div>
        <p className="mt-6 text-[0.65rem] uppercase tracking-[0.4em] text-gold">Thank you</p>
        <h1 className="mt-3 font-display text-4xl">Order placed</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A confirmation email with your receipt is on its way to your inbox.
        </p>
        {order && (
          <p className="mt-6 border border-gold/40 bg-secondary p-4 text-sm">
            Order reference: <span className="font-medium">{order}</span>
            {provider && <span className="block text-xs text-muted-foreground mt-1">Paid with {provider}</span>}
            {status && <span className="block text-xs text-muted-foreground mt-1">Status: {status}</span>}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {invoice && (
            <a href={invoice} target="_blank" rel="noreferrer" className="btn-outline-gold inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> Invoice PDF
            </a>
          )}
          <Link to="/account/orders" className="btn-gold">View my orders</Link>
          <Link to="/shop" className="btn-outline-gold">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
