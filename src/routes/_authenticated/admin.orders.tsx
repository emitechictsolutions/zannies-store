import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded", "failed"];

function AdminOrders() {
  const qc = useQueryClient();
  const { format } = useCurrency();
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, profiles(first_name, last_name)").order("created_at", { ascending: false })).data ?? [],
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from("orders") as any).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); },
  });

  return (
    <div>
      <h2 className="font-display text-2xl">Orders</h2>
      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-[0.65rem] uppercase tracking-[0.2em]">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders?.map((o: any) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-medium">{o.order_number}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.profiles?.first_name ?? ""} {o.profiles?.last_name ?? ""}<br /><span className="text-xs">{o.email}</span></td>
                <td className="px-4 py-3">{format(o.total_pence)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value })}
                    className="border border-border bg-background px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {orders?.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
