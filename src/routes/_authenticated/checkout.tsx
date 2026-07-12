import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Lock, CreditCard, Truck, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/store/cart";
import { useCurrency, toGbpPence } from "@/lib/currency";
import { AddressForm } from "./account.addresses";
import { useServerFn } from "@tanstack/react-start";
import { createPaymentSession } from "@/lib/checkout.functions";

const search = z.object({ coupon: z.string().optional() });

export const Route = createFileRoute("/_authenticated/checkout")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Checkout — Zannies Collections" }] }),
  component: CheckoutPage,
});

const COUPONS: Record<string, number> = { WELCOME10: 0.1, ZANNIES15: 0.15 };

function CheckoutPage() {
  const { coupon } = useSearch({ from: "/_authenticated/checkout" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clearCart = useCart((s) => s.clear);
  const { format } = useCurrency();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<"stripe" | "paypal">("stripe");
  const [saveCard, setSaveCard] = useState(true);
  const [addingAddr, setAddingAddr] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Checkout is always in GBP. Convert NGN base prices → GBP pence.
  const subtotalGbpPence = toGbpPence(subtotal);
  const discountGbpPence = coupon && COUPONS[coupon] ? Math.round(subtotalGbpPence * COUPONS[coupon]) : 0;
  const shippingGbpPence = subtotalGbpPence > 0 ? 500 : 0; // £5.00
  const totalGbpPence = subtotalGbpPence - discountGbpPence + shippingGbpPence;
  const gbp = (pence: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

  const { data: addresses, refetch: refetchAddr } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: async () => {
      const { data } = await supabase.from("addresses").select("*").order("is_default", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (addresses && addresses.length && !selectedAddress) {
      setSelectedAddress(addresses.find((a) => a.is_default)?.id || addresses[0].id);
    }
  }, [addresses, selectedAddress]);

  useEffect(() => {
    if (items.length === 0) navigate({ to: "/cart", replace: true });
  }, [items.length, navigate]);

  const createSession = useServerFn(createPaymentSession);
  const placeOrder = async () => {
    if (!user || !selectedAddress) return;
    setPlacing(true);
    try {
      const res = await createSession({
        data: {
          provider,
          address_id: selectedAddress,
          coupon_code: coupon ?? null,
          items: items.map((i) => ({
            product_id: i.product.id,
            product_name: i.product.name,
            product_image: i.product.images[0] ?? null,
            product_description: i.product.description ?? null,
            variant: i.variant ?? null,
            qty: i.qty,
            unit_price_pence: toGbpPence(i.product.price),
          })),
        },
      });
      clearCart();
      toast.success("Redirecting to secure checkout…");
      window.location.href = res.url;
    } catch (err: any) {
      const msg = err?.message || "Could not start checkout";
      toast.error(msg);
      navigate({ to: "/checkout/failed", search: { reason: msg } });
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-background pt-28">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Secure Checkout</p>
        <h1 className="mt-3 font-display text-4xl">Complete your order</h1>

        {/* Stepper */}
        <ol className="mt-8 flex items-center gap-4 text-xs">
          {[
            { n: 1, l: "Shipping", I: Truck },
            { n: 2, l: "Payment", I: CreditCard },
            { n: 3, l: "Review", I: Check },
          ].map(({ n, l, I }) => (
            <li key={n} className="flex items-center gap-2">
              <span className={`grid h-7 w-7 place-items-center rounded-full border ${step >= n ? "border-gold bg-gold text-ink" : "border-border text-muted-foreground"}`}>
                <I className="h-3.5 w-3.5" />
              </span>
              <span className={step >= n ? "text-foreground" : "text-muted-foreground"}>{l}</span>
              {n < 3 && <span className="ml-2 h-px w-12 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            {step === 1 && (
              <section className="border border-border p-6">
                <h2 className="font-display text-xl">Where should we send it?</h2>
                {addresses && addresses.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {addresses.map((a) => (
                      <label key={a.id} className={`flex cursor-pointer items-start gap-3 border p-4 ${selectedAddress === a.id ? "border-gold bg-secondary/40" : "border-border"}`}>
                        <input type="radio" name="addr" checked={selectedAddress === a.id} onChange={() => setSelectedAddress(a.id)} className="mt-1" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{a.full_name}</p>
                          <p className="text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city} {a.postal_code}, {a.country}</p>
                          <p className="text-xs text-muted-foreground">{a.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No saved addresses yet. Add one to continue.</p>
                )}
                {addingAddr ? (
                  <div className="mt-4">
                    <AddressForm onClose={() => setAddingAddr(false)} onSaved={async (savedId) => { setAddingAddr(false); const res = await refetchAddr(); if (savedId) setSelectedAddress(savedId); else if (res.data?.length) setSelectedAddress(res.data.find((a: any) => a.is_default)?.id || res.data[0].id); }} />
                  </div>
                ) : (
                  <button onClick={() => setAddingAddr(true)} className="btn-gold mt-4 text-xs">+ Add new address</button>
                )}
                <div className="mt-6 flex justify-end">
                  <button disabled={!selectedAddress} onClick={() => setStep(2)} className="btn-gold disabled:opacity-50">Continue to payment</button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="border border-border p-6">
                <h2 className="font-display text-xl">Payment method</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(["stripe", "paypal"] as const).map((p) => (
                    <label key={p} className={`flex cursor-pointer flex-col items-center gap-2 border p-5 text-sm uppercase tracking-[0.2em] ${provider === p ? "border-gold bg-secondary/40 text-gold" : "border-border"}`}>
                      <input type="radio" className="sr-only" checked={provider === p} onChange={() => setProvider(p)} />
                      {p}
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  All transactions are processed in GBP (£). You'll be redirected to the secure {provider} page to complete payment.
                </p>
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
                  Save my card for faster checkout next time
                </label>
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                  <button onClick={() => setStep(3)} className="btn-gold">Review order</button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="border border-border p-6">
                <h2 className="font-display text-xl">Review & confirm</h2>
                {(() => {
                  const a = addresses?.find((x) => x.id === selectedAddress);
                  if (!a) return null;
                  return (
                    <div className="mt-4 border border-border bg-secondary/30 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold">Shipping to</p>
                        <button onClick={() => setStep(1)} className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold">Change</button>
                      </div>
                      <p className="mt-2 font-medium">{a.full_name}</p>
                      <p className="text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                      <p className="text-muted-foreground">{a.city}{a.region ? `, ${a.region}` : ""} {a.postal_code}, {a.country}</p>
                      <p className="text-xs text-muted-foreground">{a.phone}</p>
                    </div>
                  );
                })()}
                <div className="mt-4 divide-y divide-border">
                  {items.map((i) => (
                    <div key={i.product.id + (i.variant ?? "")} className="flex items-center gap-4 py-3">
                      <img src={i.product.images[0]} alt="" className="h-16 w-16 object-cover" />
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{i.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty {i.qty}</p>
                      </div>
                      <p className="text-sm">{format(i.product.price * i.qty)}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground inline-flex items-center gap-2">
                  <Lock className="h-3 w-3" /> Secured with SSL · Your card details never touch our servers.
                </p>
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
                  <button disabled={placing} onClick={placeOrder} className="btn-gold disabled:opacity-50">
                    {placing ? "Placing order…" : `Pay ${gbp(totalGbpPence)}`}
                  </button>
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-border bg-secondary p-6">
              <h2 className="font-display text-lg">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Subtotal" value={gbp(subtotalGbpPence)} />
                {discountGbpPence > 0 && <Row label={`Discount (${coupon})`} value={`−${gbp(discountGbpPence)}`} gold />}
                <Row label="Shipping" value={gbp(shippingGbpPence)} />
                <div className="my-2 h-px bg-border" />
                <Row label="Total (GBP)" value={gbp(totalGbpPence)} big />
              </dl>
              <p className="mt-2 text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">Charged in GBP · other currencies converted at checkout</p>
              <p className="mt-4 text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                {items.length} item{items.length === 1 ? "" : "s"}
              </p>
              <Link to="/cart" className="mt-4 block text-center text-xs text-muted-foreground hover:text-gold">Edit bag</Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, gold, big }: { label: string; value: string; gold?: boolean; big?: boolean }) {
  return (
    <div className={`flex justify-between ${gold ? "text-gold" : ""} ${big ? "text-base font-display" : ""}`}>
      <dt className={gold ? "" : "text-muted-foreground"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
