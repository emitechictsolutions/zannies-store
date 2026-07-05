import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [profile, setProfile] = useState<any>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { toast.error("You need to be signed in"); return; }
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const first = String(fd.get("first_name") || "").trim();
    const last = String(fd.get("last_name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    if (!first) { toast.error("First name is required"); setSaving(false); return; }
    const payload = {
      id: user.id,
      first_name: first,
      last_name: last,
      phone,
      marketing_opt_in: fd.get("marketing_opt_in") === "on",
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile updated");
      setProfile({ ...(profile ?? {}), ...payload });
      qc.invalidateQueries();
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <h2 className="font-display text-2xl">Profile</h2>
      <p className="text-xs text-muted-foreground">This information is used to personalise your account and appears on your order receipts.</p>
      <Field name="first_name" label="First name" defaultValue={profile?.first_name} />
      <Field name="last_name" label="Last name" defaultValue={profile?.last_name} />
      <Field name="phone" label="Phone" defaultValue={profile?.phone} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="marketing_opt_in" defaultChecked={profile?.marketing_opt_in} />
        Email me about new arrivals and offers
      </label>
      <button type="submit" disabled={saving} className="btn-gold disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
    </form>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </label>
  );
}
