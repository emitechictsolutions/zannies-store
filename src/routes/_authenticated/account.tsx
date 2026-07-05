import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Package, MapPin, User, CreditCard, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Zannies Collections" }] }),
  component: AccountLayout,
});

const tabs = [
  { to: "/account", label: "Overview", icon: User, exact: true as boolean },
  { to: "/account/orders", label: "Orders", icon: Package, exact: false as boolean },
  { to: "/account/addresses", label: "Addresses", icon: MapPin, exact: false as boolean },
  { to: "/account/profile", label: "Profile", icon: User, exact: false as boolean },
  { to: "/account/payment-methods", label: "Saved cards", icon: CreditCard, exact: false as boolean },
];

function AccountLayout() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="bg-background pt-28">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">My Account</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">
          {user?.user_metadata?.first_name ? `Hello, ${user.user_metadata.first_name}` : "Welcome"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex items-center gap-3 border-l-2 px-4 py-3 text-sm transition-colors ${
                    active ? "border-gold bg-secondary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {t.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className="mt-2 flex items-center gap-3 border-l-2 border-gold/40 bg-ink px-4 py-3 text-sm text-gold hover:bg-gold hover:text-ink"
              >
                <ShieldCheck className="h-4 w-4" /> Admin dashboard
              </Link>
            )}
            <button
              onClick={signOut}
              className="mt-4 flex w-full items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </aside>

          <div><Outlet /></div>
        </div>
      </div>
    </div>
  );
}
