import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: cats } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async (n: string) => {
      const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { error } = await supabase.from("categories").insert({ name: n, slug });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Added"); setName(""); qc.invalidateQueries({ queryKey: ["admin-cats"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cats"] }),
  });
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">Categories</h2>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="flex-1 border border-border bg-background px-3 py-2 text-sm" />
        <button onClick={() => name && add.mutate(name)} className="btn-gold inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Add</button>
      </div>
      <ul className="divide-y divide-border border border-border">
        {cats?.map((c: any) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{c.name} <span className="text-xs text-muted-foreground">/{c.slug}</span></span>
            <button onClick={() => del.mutate(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {cats?.length === 0 && <li className="px-4 py-10 text-center text-muted-foreground">No categories.</li>}
      </ul>
    </div>
  );
}
