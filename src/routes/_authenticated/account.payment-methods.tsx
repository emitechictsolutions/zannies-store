import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account/payment-methods")({
  component: CardsPage,
});

function CardsPage() {
  const qc = useQueryClient();
  const { data: cards } = useQuery({
    queryKey: ["saved-cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_cards").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Card removed"); qc.invalidateQueries({ queryKey: ["saved-cards"] }); },
  });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">Saved cards</h2>
      <p className="text-sm text-muted-foreground">
        Cards are stored securely with our payment provider — we never see your card number. Save a card at checkout for faster purchases next time.
      </p>
      {cards?.length === 0 && (
        <div className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          You haven't saved any cards yet.
        </div>
      )}
      <div className="space-y-3">
        {cards?.map((c) => (
          <div key={c.id} className="flex items-center justify-between border border-border p-4">
            <div className="flex items-center gap-4">
              <CreditCard className="h-6 w-6 text-gold" />
              <div>
                <p className="font-medium uppercase">{c.brand} · •••• {c.last4}</p>
                <p className="text-xs text-muted-foreground">Expires {String(c.exp_month).padStart(2,'0')}/{c.exp_year}</p>
              </div>
            </div>
            <button onClick={() => del.mutate(c.id)} className="text-xs text-destructive hover:underline">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
