import { createFileRoute } from "@tanstack/react-router";
import heroJ from "@/assets/hero-jewellery.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Zannies Collections" },
      {
        name: "description",
        content: "The story of Zannies Collections — African luxury, crafted to be inherited.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="bg-background pt-28">
      <section className="mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-2 lg:px-12">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Our story</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">
            African luxury, crafted to be inherited.
          </h1>
          <div className="mt-8 space-y-5 text-muted-foreground leading-relaxed">
            <p>
              Zannies Collections began with a single idea — that African elegance deserves a
              boutique experience as considered as anything in Paris or Milan. We source 18K, 21K,
              22K and 24K gold from verified mills, raw hair from single donors, and beauty
              essentials from houses we'd shop ourselves.
            </p>
            <p>
              Every piece is photographed in studio, packaged by hand, and shipped with the kind of
              care your purchase deserves. We believe the way you receive a thing is part of the
              thing itself.
            </p>
            <p className="font-display text-2xl italic text-gold">Luxury. Beauty. Elegance.</p>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden bg-ink">
          <img src={heroJ} alt="" className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 sm:grid-cols-3 lg:px-12">
          {[
            { k: "Authenticity", v: "Every gram of gold and every bundle is verified at source." },
            { k: "Craft", v: "Hand-finished, hand-packaged, never mass-assembled." },
            { k: "Service", v: "Reachable on WhatsApp, day or night, by humans who care." },
          ].map((p) => (
            <div key={p.k}>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">{p.k}</p>
              <p className="mt-3 font-display text-2xl">{p.v}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
