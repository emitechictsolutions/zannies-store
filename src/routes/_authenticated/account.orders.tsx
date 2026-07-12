import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/account/orders")({
  component: OrdersPage,
});

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    processing: "bg-sky-100 text-sky-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-gray-200 text-gray-700",
    refunded: "bg-purple-100 text-purple-800",
    failed: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] ${map[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}

function OrdersPage() {
  const { format } = useCurrency();
  const qc = useQueryClient();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pending order cancelled"); qc.invalidateQueries({ queryKey: ["my-orders"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading orders…</p>;
  if (!orders?.length)
    return (
      <div className="border border-border p-10 text-center">
        <Package className="mx-auto h-10 w-10 text-gold" />
        <h2 className="mt-4 font-display text-xl">No orders yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">When you place an order it'll appear here.</p>
        <Link to="/shop" className="btn-gold mt-6 inline-flex">Start shopping</Link>
      </div>
    );

  return (
    <div className="space-y-4">
      {orders.map((o: any) => (
        <div key={o.id} className="border border-border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">{o.order_number}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
            </div>
            <StatusBadge status={o.status} />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-display">{format(o.total_pence)}</p>
                <p className="text-xs text-muted-foreground">{o.order_items?.length ?? 0} item(s)</p>
              </div>
              {o.status === "pending" && (
                <button
                  onClick={() => { if (confirm("Cancel this pending order?")) cancel.mutate(o.id); }}
                  className="inline-flex items-center gap-1 border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive hover:text-white transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-border">
            {o.order_items?.map((i: any) => (
              <div key={i.id} className="flex items-center gap-4 px-5 py-3">
                {i.product_image && <img src={i.product_image} alt="" className="h-16 w-16 object-cover border border-border" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{i.product_name}</p>
                  {i.product_description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{i.product_description}</p>}
                  {i.variant && <p className="text-xs text-muted-foreground">Variant: {i.variant}</p>}
                  <p className="text-xs text-muted-foreground">Qty {i.quantity} · {format(i.unit_price_pence)}</p>
                </div>
                <p className="text-sm font-medium">{format(i.line_total_pence)}</p>
              </div>
            ))}
          </div>
          {o.shipping_address && (
            <div className="border-t border-border bg-secondary/10 px-5 py-3 text-xs">
              <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold">Shipped to</p>
              <p className="mt-1 font-medium text-foreground">{o.shipping_address.full_name}</p>
              <p className="text-muted-foreground">
                {o.shipping_address.line1}{o.shipping_address.line2 ? `, ${o.shipping_address.line2}` : ""}, {o.shipping_address.city}
                {o.shipping_address.region ? `, ${o.shipping_address.region}` : ""} {o.shipping_address.postal_code}, {o.shipping_address.country}
              </p>
              {o.shipping_address.phone && <p className="text-muted-foreground">{o.shipping_address.phone}</p>}
            </div>
          )}
          {o.payments?.[0] && (
            <div className="border-t border-border bg-secondary/20 px-5 py-2 text-xs text-muted-foreground">
              Payment: <span className="font-medium capitalize text-foreground">{o.payments[0].provider}</span>
              {" · "}<span className="capitalize">{o.payments[0].status}</span>
              {o.payments[0].last_error && <span className="text-destructive"> · {o.payments[0].last_error}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
