import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Zannies Collections" },
      { name: "description", content: "Frequently asked questions about Zannies Collections." },
    ],
  }),
  component: FAQ,
});

const items = [
  {
    q: "Is your gold real?",
    a: "Yes. We sell only authenticated 18K, 21K, 22K and 24K gold. Every piece ships with a certificate of authenticity.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — we ship worldwide. International rates are calculated at checkout. Delivery is typically 5–10 business days.",
  },
  {
    q: "What is your return policy?",
    a: "Unworn, untagged pieces can be returned within 7 days of delivery. Custom and hair products are final sale.",
  },
  {
    q: "How do I install a frontal?",
    a: "We recommend professional installation. We're happy to recommend trusted stylists across London and the UK — message us on WhatsApp.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "Stripe and PayPal for cards and wallets worldwide, with localised currency at checkout.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="bg-background pt-28">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:px-12">
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Help</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">
          Frequently asked
        </h1>

        <div className="mt-12 divide-y divide-border border-y border-border">
          {items.map((it, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-display text-lg sm:text-xl">{it.q}</span>
                {open === i ? (
                  <Minus className="h-5 w-5 shrink-0 text-gold" />
                ) : (
                  <Plus className="h-5 w-5 shrink-0 text-gold" />
                )}
              </button>
              {open === i && (
                <p className="pb-6 leading-relaxed text-muted-foreground">{it.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
