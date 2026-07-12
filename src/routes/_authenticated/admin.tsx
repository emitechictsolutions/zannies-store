import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, Tag, ShoppingBag, Ticket, Star, Users, Sparkles, Image as ImageIcon, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth", search: { redirect: "/admin" } });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw redirect({ to: "/account" });
  },
  head: () => ({ meta: [{ title: "Admin — Zannies Collections" }] }),
  component: AdminLayout,
});

const adminTabs = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/featured", label: "Featured", icon: Sparkles, exact: false },
  { to: "/admin/hero-images", label: "Hero Images", icon: ImageIcon, exact: false },
  { to: "/admin/categories", label: "Categories", icon: Tag, exact: false },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket, exact: false },
  { to: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
  { to: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background pt-28">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Admin</p>
        <h1 className="mt-3 font-display text-4xl">Dashboard</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-1">
            {adminTabs.map((t) => {
              const Icon = t.icon;
              const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to as any}
                  className={`flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm transition-colors ${active ? "border-gold bg-secondary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4" /> {t.label}
                </Link>
              );
            })}
          </aside>
          <div><Outlet /></div>
        </div>
      </div>
    </div>
  );
}
