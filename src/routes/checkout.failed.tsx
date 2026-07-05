import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/checkout/failed")({
  validateSearch: z.object({ reason: z.string().optional(), order: z.string().optional() }),
  head: () => ({ meta: [{ title: "Payment Failed — Zannies Collections" }] }),
  component: FailedPage,
});

function FailedPage() {
  const { reason, order } = useSearch({ from: "/checkout/failed" });
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 pt-28">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="mt-6 text-[0.65rem] uppercase tracking-[0.4em] text-destructive">Payment unsuccessful</p>
        <h1 className="mt-3 font-display text-4xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Don't worry — your order has been saved as pending. You can retry payment from your dashboard. No charges were made.
        </p>
        {(reason || order) && (
          <p className="mt-6 border border-destructive/30 bg-secondary p-4 text-left text-xs">
            {order && <><span className="font-medium">Order:</span> {order}<br /></>}
            {reason && <><span className="font-medium">Reason:</span> {reason}</>}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/cart" className="btn-gold">Try again</Link>
          <Link to="/account/orders" className="btn-outline-gold">View orders</Link>
        </div>
      </div>
    </div>
  );
}
