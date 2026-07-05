import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, MapPin, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/account/")({
  component: Overview,
});

function Overview() {
  const { user } = useAuth();
  const { format } = useCurrency();

  const { data: stats } = useQuery({
    queryKey: ["account-overview", user?.id],
    queryFn: async () => {
      const [{ count: orderCount }, { data: lastOrder }, { count: addrCount }, { count: cardCount }] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("addresses").select("*", { count: "exact", head: true }),
        supabase.from("saved_cards").select("*", { count: "exact", head: true }),
      ]);
      return { orderCount: orderCount ?? 0, lastOrder, addrCount: addrCount ?? 0, cardCount: cardCount ?? 0 };
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Orders" value={stats?.orderCount ?? 0} icon={Package} />
        <Stat label="Addresses" value={stats?.addrCount ?? 0} icon={MapPin} />
        <Stat label="Saved cards" value={stats?.cardCount ?? 0} icon={CreditCard} />
        <Stat
          label="Last order"
          value={stats?.lastOrder ? format((stats.lastOrder as any).total_pence) : "—"}
          icon={Package}
        />
      </div>

      <div className="border border-border bg-secondary/40 p-8">
        <h2 className="font-display text-2xl">Welcome to your dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage everything about your Zannies experience from one place. Track orders, update addresses, and store cards for faster checkout next time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/shop" className="btn-gold">Continue shopping</Link>
          <Link to="/account/orders" className="btn-outline-gold">View orders</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="border border-border p-5">
      <div className="flex items-center justify-between">
        <span className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <p className="mt-3 font-display text-2xl">{value}</p>
    </div>
  );
}
