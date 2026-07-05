import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { products } from "@/data/products";
import { useWishlist } from "@/store/wishlist";
import { useCart } from "@/store/cart";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Zannies Collections" },
      { name: "description", content: "Your saved pieces at Zannies Collections." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const ids = useWishlist((s) => s.ids);
  const remove = useWishlist((s) => s.remove);
  const add = useCart((s) => s.add);
  const { format } = useCurrency();
  const items = products.filter((p) => ids.includes(p.id));

  if (items.length === 0) {
    return (
      <div className="grid min-h-[70vh] place-items-center pt-28 text-center">
        <div className="px-6">
          <Heart className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-6 font-display text-3xl">Your wishlist is empty</h1>
          <p className="mt-3 text-muted-foreground">Save pieces you love — they'll wait here.</p>
          <Link to="/shop" className="btn-gold mt-8 inline-flex">
            Browse the shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background pt-28">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Saved for later</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Wishlist</h1>

        <div className="mt-12 divide-y divide-border border-y border-border">
          {items.map((p) => (
            <div key={p.id} className="flex gap-4 py-6 sm:gap-6">
              <Link
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="block h-24 w-24 shrink-0 overflow-hidden bg-muted sm:h-32 sm:w-32"
              >
                <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
                      {p.subcategory}
                    </p>
                    <h3 className="mt-1 font-display text-lg">
                      <Link to="/product/$slug" params={{ slug: p.slug }} className="hover:text-gold">
                        {p.name}
                      </Link>
                    </h3>
                    <p className="mt-1 font-medium">{format(p.price)}</p>
                  </div>
                  <button
                    onClick={() => remove(p.id)}
                    aria-label="Remove"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      add(p);
                      remove(p.id);
                      toast.success("Moved to bag");
                    }}
                    className="inline-flex items-center gap-2 bg-ink px-4 py-2 text-xs uppercase tracking-[0.2em] text-cream hover:bg-gold hover:text-ink"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Move to bag
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
