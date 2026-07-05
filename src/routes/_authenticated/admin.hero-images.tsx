import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { slug: "men-clothing", label: "Men's Clothing" },
  { slug: "women-clothing", label: "Women's Clothing" },
  { slug: "kids-clothing", label: "Kids' Clothing" },
  { slug: "jewellery", label: "Jewellery" },
  { slug: "hair", label: "Hair" },
  { slug: "beauty", label: "Beauty" },
  { slug: "clothing", label: "Clothing (parent)" },
];

export const Route = createFileRoute("/_authenticated/admin/hero-images")({
  head: () => ({ meta: [{ title: "Hero Images — Admin" }] }),
  component: HeroImagesAdmin,
});

function HeroImagesAdmin() {
  const [slug, setSlug] = useState("men-clothing");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl">Category hero images</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upload, reorder, and toggle hero photos shown at the top of each category landing page.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setSlug(c.slug)}
            className={`border px-3 py-2 text-xs uppercase tracking-[0.2em] ${slug === c.slug ? "border-gold bg-gold text-ink" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <HeroPanel key={slug} slug={slug} />
    </div>
  );
}

function HeroPanel({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [meta, setMeta] = useState({ alt: "", headline: "", subheadline: "" });

  const { data: rows } = useQuery({
    queryKey: ["admin-hero-images", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_images")
        .select("*")
        .eq("category_slug", slug)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-hero-images", slug] });
    qc.invalidateQueries({ queryKey: ["hero-images", slug] });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `hero/${slug}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      const nextOrder = (rows?.length ?? 0);
      const { error: insErr } = await supabase.from("hero_images").insert({
        category_slug: slug,
        image_url: pub.publicUrl,
        alt_text: meta.alt || null,
        headline: meta.headline || null,
        subheadline: meta.subheadline || null,
        sort_order: nextOrder,
        active: true,
      });
      if (insErr) throw insErr;
      toast.success("Hero image added");
      setMeta({ alt: "", headline: "", subheadline: "" });
      invalidateAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const del = useMutation({
    mutationFn: async (row: any) => {
      // Try to remove from storage too
      try {
        const url = new URL(row.image_url);
        const idx = url.pathname.indexOf("/site-assets/");
        if (idx >= 0) {
          const key = url.pathname.slice(idx + "/site-assets/".length);
          await supabase.storage.from("site-assets").remove([key]);
        }
      } catch { /* ignore */ }
      const { error } = await supabase.from("hero_images").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); invalidateAll(); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = async (row: any) => {
    await supabase.from("hero_images").update({ active: !row.active }).eq("id", row.id);
    invalidateAll();
  };

  const reorder = async (idx: number, dir: -1 | 1) => {
    if (!rows) return;
    const target = idx + dir;
    if (target < 0 || target >= rows.length) return;
    const a = rows[idx], b = rows[target];
    await Promise.all([
      supabase.from("hero_images").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("hero_images").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    invalidateAll();
  };

  return (
    <div className="space-y-6">
      <div className="border border-gold/40 bg-secondary/30 p-5">
        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-gold">Upload new hero for {slug}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input placeholder="Alt text" value={meta.alt} onChange={(e) => setMeta({ ...meta, alt: e.target.value })} className="border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold" />
          <input placeholder="Headline (optional)" value={meta.headline} onChange={(e) => setMeta({ ...meta, headline: e.target.value })} className="border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold" />
          <input placeholder="Subheadline (optional)" value={meta.subheadline} onChange={(e) => setMeta({ ...meta, subheadline: e.target.value })} className="border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold" />
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 border border-gold bg-gold px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Choose image"}
          <input type="file" accept="image/*" onChange={onFile} disabled={uploading} className="hidden" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(rows ?? []).map((r, i) => (
          <div key={r.id} className={`border ${r.active ? "border-border" : "border-dashed border-muted-foreground/40 opacity-60"}`}>
            <img src={r.image_url} alt={r.alt_text ?? ""} className="aspect-[16/9] w-full object-cover" />
            <div className="p-3">
              {r.headline && <p className="font-display text-sm">{r.headline}</p>}
              {r.subheadline && <p className="text-xs text-muted-foreground">{r.subheadline}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => reorder(i, -1)} disabled={i === 0} className="rounded border border-border p-1 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => reorder(i, 1)} disabled={i === (rows?.length ?? 0) - 1} className="rounded border border-border p-1 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button onClick={() => toggleActive(r)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  {r.active ? <><Eye className="h-3.5 w-3.5" /> Live</> : <><EyeOff className="h-3.5 w-3.5" /> Hidden</>}
                </button>
                <button onClick={() => del.mutate(r)} className="ml-auto inline-flex items-center gap-1 text-xs text-destructive hover:underline"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </div>
          </div>
        ))}
        {rows?.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No hero images yet for this category.</p>}
      </div>
    </div>
  );
}
