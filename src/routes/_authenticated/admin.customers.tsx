import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const { data: customers } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div>
      <h2 className="font-display text-2xl">Customers</h2>
      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-[0.65rem] uppercase tracking-[0.2em]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Marketing</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers?.map((c: any) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-xs">{c.marketing_opt_in ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            {customers?.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
