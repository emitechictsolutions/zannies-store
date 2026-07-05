import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Star, StarOff, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/admin/featured")({
  head: () => ({ meta: [{ title: "Featured Products — Admin" }] }),
  component: FeaturedAdmin,
});

function FeaturedAdmin() {
  const qc = useQueryClient();
  const { format } = useCurrency();
  const [search, setSearch] = useState("");

  const { data: featured } = useQuery({
    queryKey: ["admin-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price_pence, images, featured_order, is_active")
        .eq("is_featured", true)
        .order("featured_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pool } = useQuery({
    queryKey: ["admin-featured-pool", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, price_pence, images, is_featured")
        .eq("is_featured", false)
        .eq("is_active", true)
        .limit(20);
      if (search) q = q.ilike("name", `%${search}%`);
      return (await q).data ?? [];
    },
  });

  const setFeatured = useMutation({
    mutationFn: async ({ id, on, order }: { id: string; on: boolean; order?: number | null }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: on, featured_order: on ? order ?? 999 : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-featured"] });
      qc.invalidateQueries({ queryKey: ["admin-featured-pool"] });
      qc.invalidateQueries({ queryKey: ["home-featured"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reorder = async (idx: number, dir: -1 | 1) => {
    if (!featured) return;
    const target = idx + dir;
    if (target < 0 || target >= featured.length) return;
    const a = featured[idx];
    const b = featured[target];
    const aOrder = a.featured_order ?? idx;
    const bOrder = b.featured_order ?? target;
    await Promise.all([
      supabase.from("products").update({ featured_order: bOrder }).eq("id", a.id),
      supabase.from("products").update({ featured_order: aOrder }).eq("id", b.id),
    ]);
    qc.invalidateQueries({ queryKey: ["admin-featured"] });
    qc.invalidateQueries({ queryKey: ["home-featured"] });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl">Homepage featured products</h2>
        <p className="mt-1 text-sm text-muted-foreground">Curate what appears in the "Best Sellers" strip on the homepage.</p>
      </div>

      <section>
        <h3 className="text-[0.65rem] uppercase tracking-[0.3em] text-gold">Currently featured ({featured?.length ?? 0})</h3>
        <div className="mt-3 border border-border">
          {(featured ?? []).map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
              <img src={String((p.images as any)?.[0] ?? "")} className="h-14 w-14 object-cover" />
              <div className="flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{format(p.price_pence)} · order {p.featured_order ?? "—"}</p>
              </div>
              <button onClick={() => reorder(i, -1)} disabled={i === 0} className="rounded border border-border p-1 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => reorder(i, 1)} disabled={i === (featured?.length ?? 0) - 1} className="rounded border border-border p-1 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button onClick={() => setFeatured.mutate({ id: p.id, on: false })} className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"><StarOff className="h-3.5 w-3.5" /> Remove</button>
            </div>
          ))}
          {featured?.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing featured yet.</p>}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[0.65rem] uppercase tracking-[0.3em] text-gold">Add from catalog</h3>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(pool ?? []).map((p) => (
            <div key={p.id} className="flex items-center gap-3 border border-border p-3">
              <img src={String((p.images as any)?.[0] ?? "")} className="h-12 w-12 object-cover" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{format(p.price_pence)}</p>
              </div>
              <button onClick={() => setFeatured.mutate({ id: p.id, on: true, order: (featured?.length ?? 0) + 1 })} className="inline-flex items-center gap-1 text-xs text-gold hover:underline"><Star className="h-3.5 w-3.5" /> Feature</button>
            </div>
          ))}
          {pool?.length === 0 && <p className="col-span-full py-6 text-center text-sm text-muted-foreground">No matching products.</p>}
        </div>
      </section>
    </div>
  );
}
