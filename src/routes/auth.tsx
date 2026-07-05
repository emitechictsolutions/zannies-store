import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({ redirect: z.string().optional(), mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In — Zannies Collections" },
      { name: "description", content: "Sign in or create an account to shop Zannies Collections." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect, mode: initial } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initial ?? "signin");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: (redirect as any) || "/account", replace: true });
  }, [user, redirect, navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    try {
      if (mode === "signup") {
        const first_name = String(fd.get("first_name") || "").trim();
        const last_name = String(fd.get("last_name") || "").trim();
        if (!first_name) throw new Error("Please enter your first name");
        if (password.length < 8) throw new Error("Password must be at least 8 characters");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { first_name, last_name },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Zannies. Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      navigate({ to: (redirect as any) || "/account", replace: true });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden pt-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ink via-ink to-[#1a1410]" />
      <div className="absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.4),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(244,229,178,0.25),transparent_50%)]" />

      <div className="mx-auto grid max-w-7xl px-6 py-12 lg:grid-cols-2 lg:gap-16 lg:px-12">
        <div className="hidden text-cream lg:block">
          <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Zannies Collections</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05]">
            Luxury,<br />tailored to you.
          </h1>
          <p className="mt-6 max-w-md text-cream/70">
            Track orders, save your favourites, store delivery addresses, and check out faster with saved cards — all from your private account.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-cream/80">
            <li>· Order history with receipts</li>
            <li>· Saved shipping addresses</li>
            <li>· Wishlist that syncs across devices</li>
            <li>· Express checkout with saved cards</li>
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-md rounded-sm border border-gold/30 bg-background/95 p-8 backdrop-blur-xl sm:p-10"
        >
          <div className="flex border-b border-border">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 pb-3 text-xs uppercase tracking-[0.25em] transition-colors ${
                mode === "signin" ? "border-b-2 border-gold text-gold" : "text-muted-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 pb-3 text-xs uppercase tracking-[0.25em] transition-colors ${
                mode === "signup" ? "border-b-2 border-gold text-gold" : "text-muted-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          <h2 className="mt-8 font-display text-2xl">
            {mode === "signin" ? "Welcome back" : "Join Zannies"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to continue your journey." : "Create an account to start shopping."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <Field name="first_name" label="First name" required />
                <Field name="last_name" label="Last name" />
              </div>
            )}
            <Field name="email" type="email" label="Email" required autoComplete="email" />
            <Field
              name="password"
              type="password"
              label="Password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              hint={mode === "signup" ? "Minimum 8 characters" : undefined}
            />

            <button type="submit" disabled={busy} className="btn-gold mt-2 w-full disabled:opacity-50">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/about" className="text-gold hover:underline">Terms</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  autoComplete,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold"
      />
      {hint && <span className="mt-1 block text-[0.7rem] text-muted-foreground">{hint}</span>}
    </label>
  );
}
