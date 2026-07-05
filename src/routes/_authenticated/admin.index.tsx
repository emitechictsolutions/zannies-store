import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { format } = useCurrency();
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [orders, customers, products, revenue] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_pence").eq("status", "paid"),
      ]);
      const total = (revenue.data ?? []).reduce((s, o: any) => s + (o.total_pence || 0), 0);
      return {
        orders: orders.count ?? 0,
        customers: customers.count ?? 0,
        products: products.count ?? 0,
        revenue: total,
      };
    },
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Revenue" value={format(data?.revenue ?? 0)} />
      <Stat label="Orders" value={String(data?.orders ?? 0)} />
      <Stat label="Customers" value={String(data?.customers ?? 0)} />
      <Stat label="Products" value={String(data?.products ?? 0)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-6">
      <p className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl">{value}</p>
    </div>
  );
}
