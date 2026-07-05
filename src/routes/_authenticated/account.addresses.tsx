import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/account/addresses")({
  component: AddressesPage,
});

function AddressesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").order("is_default", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Address removed");
      qc.invalidateQueries({ queryKey: ["my-addresses"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not delete address"),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      const upd1 = await supabase.from("addresses").update({ is_default: false }).neq("id", id);
      if (upd1.error) throw upd1.error;
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Default address updated");
      qc.invalidateQueries({ queryKey: ["my-addresses"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not update default"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Shipping addresses</h2>
        <button onClick={() => { setAdding(true); setEditing(null); }} className="btn-outline-gold inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add address
        </button>
      </div>

      {(adding || editing) && (
        <AddressForm
          address={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => { setAdding(false); setEditing(null); qc.invalidateQueries({ queryKey: ["my-addresses"] }); }}
        />
      )}

      {addresses?.length === 0 && !adding && (
        <div className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          You haven't saved any addresses yet.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {addresses?.map((a) => (
          <div key={a.id} className="relative border border-border p-5">
            {a.is_default && (
              <span className="absolute right-3 top-3 bg-gold px-2 py-1 text-[0.55rem] uppercase tracking-[0.2em] text-ink">Default</span>
            )}
            <p className="font-medium">{a.full_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
            <p className="text-sm text-muted-foreground">{a.city}{a.region ? `, ${a.region}` : ""} {a.postal_code}</p>
            <p className="text-sm text-muted-foreground">{a.country}</p>
            <p className="mt-1 text-xs text-muted-foreground">{a.phone}</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setEditing(a); setAdding(false); }} className="text-xs text-gold hover:underline inline-flex items-center gap-1"><Edit className="h-3 w-3" /> Edit</button>
              {!a.is_default && (
                <button onClick={() => setDefault.mutate(a.id)} className="text-xs hover:underline inline-flex items-center gap-1"><Check className="h-3 w-3" /> Set default</button>
              )}
              <button
                disabled={del.isPending}
                onClick={() => { if (confirm("Delete this address?")) del.mutate(a.id); }}
                className="ml-auto text-xs text-destructive hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              ><Trash2 className="h-3 w-3" /> {del.isPending ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AddressSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(100),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(30),
  line1: z.string().trim().min(3, "Address line 1 is required").max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2, "City is required").max(100),
  region: z.string().trim().max(100).optional().nullable(),
  postal_code: z.string().trim().min(3, "Postal code is required").max(20),
  country: z.string().trim().length(2, "Use 2-letter country code (e.g. GB)").toUpperCase(),
  is_default: z.boolean().optional(),
});

export function AddressForm({ address, onClose, onSaved }: { address?: any; onClose: () => void; onSaved: (savedId?: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = {
      full_name: String(fd.get("full_name") || ""),
      phone: String(fd.get("phone") || ""),
      line1: String(fd.get("line1") || ""),
      line2: String(fd.get("line2") || "") || null,
      city: String(fd.get("city") || ""),
      region: String(fd.get("region") || "") || null,
      postal_code: String(fd.get("postal_code") || ""),
      country: String(fd.get("country") || ""),
      is_default: fd.get("is_default") === "on",
    };
    const parsed = AddressSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setBusy(true);
    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr || !u.user) {
      toast.error("You need to be signed in to save an address.");
      setBusy(false);
      return;
    }
    const payload = { ...parsed.data, user_id: u.user.id };
    try {
      if (payload.is_default) {
        await supabase.from("addresses").update({ is_default: false }).neq("id", address?.id || "00000000-0000-0000-0000-000000000000");
      }
      let savedId: string | undefined = address?.id;
      if (address) {
        const { error } = await supabase.from("addresses").update(payload).eq("id", address.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from("addresses").insert(payload).select("id").single();
        if (error) throw error;
        savedId = inserted?.id;
      }
      toast.success(address ? "Address updated" : "Address saved");
      onSaved(savedId);
    } catch (err: any) {
      toast.error(err?.message || "Could not save address");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={onSubmit} className="grid gap-3 border border-gold/40 bg-secondary/30 p-5 sm:grid-cols-2" noValidate>
      <Input name="full_name" label="Full name" defaultValue={address?.full_name} required error={errors.full_name} />
      <Input name="phone" label="Phone" defaultValue={address?.phone} required error={errors.phone} />
      <Input name="line1" label="Address line 1" defaultValue={address?.line1} required full error={errors.line1} />
      <Input name="line2" label="Address line 2" defaultValue={address?.line2} full error={errors.line2} />
      <Input name="city" label="City" defaultValue={address?.city} required error={errors.city} />
      <Input name="region" label="Region / State" defaultValue={address?.region} error={errors.region} />
      <Input name="postal_code" label="Postal code" defaultValue={address?.postal_code} required error={errors.postal_code} />
      <Input name="country" label="Country code (2 letters)" defaultValue={address?.country || "GB"} required error={errors.country} />
      <label className="sm:col-span-2 flex items-center gap-2 text-xs">
        <input type="checkbox" name="is_default" defaultChecked={address?.is_default} /> Set as default
      </label>
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={busy} className="btn-gold disabled:opacity-50">{busy ? "Saving…" : address ? "Update address" : "Save address"}</button>
        <button type="button" onClick={onClose} disabled={busy} className="btn-outline-gold disabled:opacity-50">Cancel</button>
      </div>
    </form>
  );
}

function Input({ name, label, defaultValue, required, full, error }: { name: string; label: string; defaultValue?: string; required?: boolean; full?: boolean; error?: string }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</span>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        aria-invalid={!!error}
        className={`mt-1 w-full border bg-background px-3 py-2 text-sm outline-none focus:border-gold ${error ? "border-destructive" : "border-border"}`}
      />
      {error && <span className="mt-1 block text-[0.65rem] text-destructive">{error}</span>}
    </label>
  );
}
