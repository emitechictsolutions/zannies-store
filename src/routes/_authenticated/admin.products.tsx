import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const qc = useQueryClient();
  const { format } = useCurrency();
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name, slug)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*")).data ?? [],
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Product deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Products</h2>
        <button onClick={() => { setCreating(true); setEditing(null); }} className="btn-gold inline-flex items-center gap-2"><Plus className="h-4 w-4" /> New product</button>
      </div>

      {(creating || editing) && (
        <ProductForm
          product={editing}
          categories={categories ?? []}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); qc.invalidateQueries({ queryKey: ["admin-products"] }); }}
        />
      )}

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-[0.65rem] uppercase tracking-[0.2em]">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products?.map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {Array.isArray(p.images) && p.images[0] && <img src={String(p.images[0])} className="h-10 w-10 object-cover" />}
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <p className="text-xs text-muted-foreground">{p.sku ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.categories?.name ?? "—"}</td>
                <td className="px-4 py-3">{format(p.price_pence)}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 text-[0.6rem] uppercase tracking-[0.2em] ${p.is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-200"}`}>{p.is_active ? "Live" : "Hidden"}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(p); setCreating(false); }} className="text-gold hover:underline mr-3"><Edit className="inline h-3.5 w-3.5" /></button>
                  <button onClick={() => del.mutate(p.id)} className="text-destructive hover:underline"><Trash2 className="inline h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
            {products?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: { product?: any; categories: any[]; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(product?.images?.[0] ?? "");
  const qc = useQueryClient();

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      setImageUrl(pub.publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload: any = {
      name: String(fd.get("name")),
      slug: String(fd.get("slug")),
      description: String(fd.get("description") || ""),
      price_pence: Math.round(parseFloat(String(fd.get("price") || "0")) * 100),
      original_price_pence: fd.get("original_price") ? Math.round(parseFloat(String(fd.get("original_price") || "0")) * 100) : null,
      images: imageUrl ? [imageUrl] : [],
      category_id: String(fd.get("category_id") || "") || null,
      subcategory: String(fd.get("subcategory") || ""),
      sku: String(fd.get("sku") || ""),
      label: String(fd.get("label") || "") || null,
      is_active: fd.get("is_active") === "on",
    };
    try {
      const op = product
        ? supabase.from("products").update(payload).eq("id", product.id)
        : supabase.from("products").insert(payload);
      const { error } = await op;
      if (error) throw error;
      toast.success("Saved");
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 border border-gold/40 bg-secondary/30 p-5 sm:grid-cols-2">
      <In name="name" label="Name" def={product?.name} required />
      <In name="slug" label="Slug" def={product?.slug} required />
      <In name="price" label="Price (pence)" type="number" def={product?.price_pence?.toString()} required />
      <In name="original_price" label="Original Price (pence)" type="number" def={product?.original_price_pence?.toString()} />
      <In name="sku" label="SKU" def={product?.sku} />
      <In name="subcategory" label="Subcategory" def={product?.subcategory} />

      {/* Image upload */}
      <div className="sm:col-span-2">
        <span className="block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">Product Image</span>
        <div className="mt-2 flex items-center gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 border border-gold bg-gold px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload Image"}
            <input type="file" accept="image/*" onChange={onFileUpload} disabled={uploading} className="hidden" />
          </label>
          {imageUrl && (
            <div className="flex items-center gap-3">
              <img src={imageUrl} className="h-16 w-16 object-cover border border-border" />
              <button type="button" onClick={() => setImageUrl("")} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
          )}
        </div>
        <input
          name="image_url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Or paste image URL"
          className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold outline-none"
        />
      </div>

      <label className="block">
        <span className="block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">Category</span>
        <select name="category_id" defaultValue={product?.category_id || ""} className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm">
          <option value="">—</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">Label</span>
        <select name="label" defaultValue={product?.label || ""} className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm">
          <option value="">None</option>
          <option value="New">New</option>
          <option value="Hot">Hot</option>
          <option value="Sale">Sale</option>
          <option value="Best Seller">Best Seller</option>
        </select>
      </label>

      <label className="sm:col-span-2 block">
        <span className="block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">Description</span>
        <textarea name="description" defaultValue={product?.description} rows={3} className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm" />
      </label>

      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} /> Active</label>

      <div className="sm:col-span-2 flex gap-2">
        <button disabled={busy || uploading} className="btn-gold disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-sm">Cancel</button>
      </div>
    </form>
  );
}

function In({ name, label, def, type = "text", required, full }: any) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input name={name} type={type} defaultValue={def ?? ""} required={required} className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold outline-none" />
    </label>
  );
}
