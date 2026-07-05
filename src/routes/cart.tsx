import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { useCurrency } from "@/lib/currency";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Bag — Zannies Collections" },
      { name: "description", content: "Review your selection at Zannies Collections." },
    ],
  }),
  component: CartPage,
});

const COUPONS: Record<string, number> = { WELCOME10: 0.1, ZANNIES15: 0.15 };

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());
  const { format } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; pct: number } | null>(null);

  const discount = applied ? subtotal * applied.pct : 0;
  const shipping = subtotal > 0 ? 5000 : 0;
  const total = subtotal - discount + shipping;

  if (items.length === 0) {
    return (
      <div className="grid min-h-[70vh] place-items-center pt-28 text-center">
        <div className="px-6">
          <ShoppingBag className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-6 font-display text-3xl">Your bag is empty</h1>
          <p className="mt-3 text-muted-foreground">Begin where it all starts — the collections.</p>
          <Link to="/shop" className="btn-gold mt-8 inline-flex">
            Browse the shop
          </Link>
        </div>
      </div>
    );
  }

  const apply = () => {
    const c = coupon.trim().toUpperCase();
    if (COUPONS[c]) {
      setApplied({ code: c, pct: COUPONS[c] });
      toast.success(`Coupon applied — ${(COUPONS[c] * 100).toFixed(0)}% off`);
    } else {
      toast.error("Invalid coupon");
    }
  };

  return (
    <div className="bg-background pt-28">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Checkout</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Your bag</h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
          {/* Items */}
          <div className="divide-y divide-border border-y border-border">
            {items.map((i) => (
              <div
                key={i.product.id + (i.variant ?? "")}
                className="flex gap-4 py-6 sm:gap-6"
              >
                <Link
                  to="/product/$slug"
                  params={{ slug: i.product.slug }}
                  className="block h-24 w-24 shrink-0 overflow-hidden bg-muted sm:h-32 sm:w-32"
                >
                  <img
                    src={i.product.images[0]}
                    alt={i.product.name}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
                        {i.product.subcategory}
                      </p>
                      <h3 className="mt-1 font-display text-lg">
                        <Link
                          to="/product/$slug"
                          params={{ slug: i.product.slug }}
                          className="hover:text-gold"
                        >
                          {i.product.name}
                        </Link>
                      </h3>
                      {i.variant && (
                        <p className="mt-1 text-xs text-muted-foreground">{i.variant}</p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(i.product.id, i.variant)}
                      aria-label="Remove"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => setQty(i.product.id, i.qty - 1, i.variant)}
                        className="p-2 hover:text-gold"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-8 text-center text-sm">{i.qty}</span>
                      <button
                        onClick={() => setQty(i.product.id, i.qty + 1, i.variant)}
                        className="p-2 hover:text-gold"
                        aria-label="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-medium">{format(i.product.price * i.qty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-border bg-secondary p-6">
              <h2 className="font-display text-xl">Order summary</h2>

              <div className="mt-6 flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Coupon code (try WELCOME10)"
                  className="flex-1 border border-border bg-background px-3 py-2 text-sm"
                />
                <button onClick={apply} className="border border-gold bg-gold px-4 text-sm font-medium text-ink hover:brightness-105">
                  Apply
                </button>
              </div>

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{format(subtotal)}</dd>
                </div>
                {applied && (
                  <div className="flex justify-between text-gold">
                    <dt>Discount ({applied.code})</dt>
                    <dd>−{format(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping (est.)</dt>
                  <dd>{format(shipping)}</dd>
                </div>
                <div className="my-3 h-px bg-border" />
                <div className="flex justify-between text-base">
                  <dt className="font-display text-lg">Total</dt>
                  <dd className="font-display text-lg">{format(total)}</dd>
                </div>
              </dl>

              <button
                onClick={() => {
                  if (!user) {
                    toast("Please sign in to continue to checkout");
                    navigate({ to: "/auth", search: { redirect: "/checkout" } });
                  } else {
                    navigate({ to: "/checkout", search: { coupon: applied?.code } });
                  }
                }}
                className="btn-gold mt-6 w-full"
              >
                Proceed to Checkout
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Secure checkout · Paystack · Stripe · PayPal
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
