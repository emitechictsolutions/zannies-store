import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CreditCard, Globe, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      (data ?? []).forEach((s: any) => {
        map[s.key] = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
      });
      return map;
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading settings…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage payment modes and site configuration.</p>
      </div>

      <PaymentModeSection
        currentMode={settings?.payment_mode ?? "live"}
        onUpdate={async (mode) => {
          await supabase.from("site_settings").upsert({ key: "payment_mode", value: { mode } as any });
          qc.invalidateQueries({ queryKey: ["admin-settings"] });
          toast.success(`Payment mode set to ${mode}`);
        }}
      />

      <PaymentKeysSection mode={settings?.payment_mode ?? "live"} />
    </div>
  );
}

function PaymentModeSection({ currentMode, onUpdate }: { currentMode: string; onUpdate: (mode: string) => Promise<void> }) {
  const [mode, setMode] = useState(currentMode === "sandbox" ? "sandbox" : "live");

  useEffect(() => {
    setMode(currentMode === "sandbox" ? "sandbox" : "live");
  }, [currentMode]);

  const handleSave = async () => {
    await onUpdate(mode);
  };

  return (
    <section className="border border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="h-5 w-5 text-gold" />
        <h3 className="font-display text-lg">Payment Mode</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Switch between test (sandbox) and live payment processing. Test mode uses sandbox APIs that don't charge real cards.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <button
          onClick={() => setMode("live")}
          className={`flex items-center gap-3 border p-5 text-left transition ${
            mode === "live" ? "border-gold bg-secondary/40" : "border-border hover:border-gold/50"
          }`}
        >
          <Globe className={`h-5 w-5 ${mode === "live" ? "text-gold" : "text-muted-foreground"}`} />
          <div>
            <p className="font-medium text-sm">Live Mode</p>
            <p className="text-xs text-muted-foreground">Real payments via Stripe and PayPal</p>
          </div>
          {mode === "live" && <span className="ml-auto h-3 w-3 rounded-full bg-emerald-500" />}
        </button>

        <button
          onClick={() => setMode("sandbox")}
          className={`flex items-center gap-3 border p-5 text-left transition ${
            mode === "sandbox" ? "border-gold bg-secondary/40" : "border-border hover:border-gold/50"
          }`}
        >
          <Lock className={`h-5 w-5 ${mode === "sandbox" ? "text-amber-500" : "text-muted-foreground"}`} />
          <div>
            <p className="font-medium text-sm">Test Mode (Sandbox)</p>
            <p className="text-xs text-muted-foreground">Test payments — no real charges</p>
          </div>
          {mode === "sandbox" && <span className="ml-auto h-3 w-3 rounded-full bg-amber-500" />}
        </button>
      </div>

      <button onClick={handleSave} disabled={mode === currentMode} className="btn-gold disabled:opacity-50">
        {mode === currentMode ? "Current mode" : "Save mode"}
      </button>

      {mode === "sandbox" && (
        <div className="mt-4 border border-amber-300/50 bg-amber-50 p-4 text-xs text-amber-800">
          <p className="font-medium mb-1">Test Mode Active</p>
          <p>Payments will use test APIs. No real money will be charged. Use test card numbers and credentials to verify the checkout flow.</p>
        </div>
      )}
    </section>
  );
}

function PaymentKeysSection({ mode }: { mode: string }) {
  return (
    <section className="border border-border p-6">
      <h3 className="font-display text-lg mb-4">Payment API Configuration</h3>
      <p className="text-sm text-muted-foreground mb-6">
        API keys are configured via environment variables. Below is the current status for each provider.
      </p>

      <div className="space-y-4">
        <div className="border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Stripe</p>
              <p className="text-xs text-muted-foreground">
                {mode === "sandbox" ? "Using test keys" : "Using live keys"}
              </p>
            </div>
            <span className={`px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] ${
              mode === "sandbox" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {mode === "sandbox" ? "Test" : "Live"}
            </span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>Key: {mode === "sandbox" ? "sk_test_••••••••" : "sk_live_••••••••"}</p>
            <p>Webhook secret: {mode === "sandbox" ? "whsec_••••••••" : "whsec_••••••••"}</p>
          </div>
        </div>

        <div className="border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">PayPal</p>
              <p className="text-xs text-muted-foreground">
                {mode === "sandbox" ? "Using sandbox credentials" : "Using live credentials"}
              </p>
            </div>
            <span className={`px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] ${
              mode === "sandbox" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {mode === "sandbox" ? "Sandbox" : "Live"}
            </span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>Client ID: {mode === "sandbox" ? "AcoO_••••••••" : "Live client ID configured"}</p>
            <p>API endpoint: {mode === "sandbox" ? "api-m.sandbox.paypal.com" : "api-m.paypal.com"}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Environment Variables Required:</p>
        <div className="grid gap-1 font-mono">
          {mode === "sandbox" ? (
            <>
              <p>STRIPE_LIVE_API_KEY= `Bearer sk_test_xxxxxxxxxxxxx`</p>
              <p>STRIPE_PUBLISHABLE_KEY= `Bearer sk_test_xxxxxxxxxxxxx`</p>
              <p>PAYPAL_CLIENT_ID= `Bearer sk_test_xxxxxxxxxxxxx`</p>
              <p>PAYPAL_SECRET= `Bearer sk_test_xxxxxxxxxxxxx`</p>
              <p>PAYPAL_MODE=sandbox</p>
            </>
          ) : (
            <>
              <p>STRIPE_LIVE_API_KEY=sk_live_...</p>
              <p>STRIPE_PUBLISHABLE_KEY=pk_live_...</p>
              <p>PAYPAL_CLIENT_ID=...</p>
              <p>PAYPAL_SECRET=...</p>
              <p>PAYPAL_MODE=live</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
