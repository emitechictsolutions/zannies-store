import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const qc = useQueryClient();
  const { data: reviews } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => (await supabase.from("reviews").select("*, products(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const approve = useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      const { error } = await supabase.from("reviews").update({ hidden }).eq("id", id); if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("reviews").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });
  const reply = async (id: string, current: string | null) => {
    const text = window.prompt("Admin reply:", current ?? "");
    if (text === null) return;
    await supabase.from("reviews").update({ admin_reply: text }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Reviews</h2>
      {reviews?.map((r: any) => (
        <div key={r.id} className="border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{r.products?.name ?? "—"}</p>
              <div className="mt-1 flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-current" : "opacity-30"}`} />)}
              </div>
              <p className="mt-2 text-sm">{r.body}</p>
              {r.admin_reply && <p className="mt-2 border-l-2 border-gold bg-secondary p-2 text-xs">↳ {r.admin_reply}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <label className="text-xs"><input type="checkbox" checked={!r.hidden} onChange={(e) => approve.mutate({ id: r.id, hidden: !e.target.checked })} /> Published</label>
              <button onClick={() => reply(r.id, r.admin_reply)} className="text-xs text-gold hover:underline">Reply</button>
              <button onClick={() => del.mutate(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}
      {reviews?.length === 0 && <p className="border border-dashed border-border p-10 text-center text-muted-foreground">No reviews yet.</p>}
    </div>
  );
}
