import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ code: "", amount: 10, usage_limit: 100 });
  const { data: coupons } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => (await supabase.from("coupons").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase(),
        amount: form.amount,
        kind: "percent",
        usage_limit: form.usage_limit,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Coupon created"); setForm({ code: "", amount: 10, usage_limit: 100 }); qc.invalidateQueries({ queryKey: ["admin-coupons"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ active }).eq("id", id); if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("coupons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">Coupons</h2>
      <div className="grid gap-3 border border-gold/40 bg-secondary/30 p-5 sm:grid-cols-4">
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CODE" className="border border-border bg-background px-3 py-2 text-sm uppercase" />
        <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} placeholder="% off" className="border border-border bg-background px-3 py-2 text-sm" />
        <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: +e.target.value })} placeholder="Max uses" className="border border-border bg-background px-3 py-2 text-sm" />
        <button onClick={() => add.mutate()} className="btn-gold inline-flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> Add</button>
      </div>
      <ul className="divide-y divide-border border border-border">
        {coupons?.map((c: any) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{c.code}</p>
              <p className="text-xs text-muted-foreground">{c.amount}{c.kind === "percent" ? "%" : "p"} off · {c.usage_count ?? 0}/{c.usage_limit ?? "∞"} used</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs"><input type="checkbox" checked={c.active} onChange={(e) => toggle.mutate({ id: c.id, active: e.target.checked })} /> Active</label>
              <button onClick={() => del.mutate(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
        {coupons?.length === 0 && <li className="px-4 py-10 text-center text-muted-foreground">No coupons yet.</li>}
      </ul>
    </div>
  );
}
