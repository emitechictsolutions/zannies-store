import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Hero } from "@/components/Hero";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Testimonials } from "@/components/Testimonials";
import { InstaGrid } from "@/components/InstaGrid";
import { categories } from "@/data/categories";
import { products, type Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zannies Collections — Luxury. Beauty. Elegance." },
      {
        name: "description",
        content:
          "Discover authentic 18K–24K gold jewellery, premium hair, beauty and clothing at Zannies Collections.",
      },
    ],
  }),
  component: Home,
});

function mapDbProduct(p: any): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: (p.categories?.slug ?? "jewellery") as any,
    subcategory: p.subcategory ?? "",
    price: p.price_pence,
    originalPrice: p.original_price_pence ?? undefined,
    sku: p.sku ?? "",
    images: Array.isArray(p.images) ? p.images.map(String) : [],
    description: p.description ?? "",
    specs: (p.specs as any) ?? {},
    inStock: true,
    rating: 5,
    reviews: 0,
    label: p.label as any,
  };
}

function Home() {
  const { data: dbFeatured } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(slug)")
        .eq("is_featured", true)
        .eq("is_active", true)
        .order("featured_order", { ascending: true, nullsFirst: false })
        .limit(8);
      return (data ?? []).map(mapDbProduct);
    },
  });

  const bestSellers = (dbFeatured && dbFeatured.length > 0)
    ? dbFeatured.slice(0, 4)
    : products.filter((p) => p.label === "Best Seller").slice(0, 4);
  const newArrivals = products.filter((p) => p.label === "New").slice(0, 4);
  const trending = products.filter((p) => p.label === "Hot").slice(0, 4);

  return (
    <>
      <Hero />

      {/* Category teasers */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionHeading
            eyebrow="The Collections"
            title="Four houses, one standard"
            subtitle="Explore the worlds of Zannies — each curated with the same obsessive eye for craft."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => (
              <CategoryCard key={c.slug} category={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex items-end justify-between gap-6">
            <SectionHeading eyebrow="Most loved" title="Best Sellers" align="left" />
            <Link
              to="/shop"
              className="hidden items-center gap-2 text-xs uppercase tracking-[0.25em] hover:text-gold sm:flex"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionHeading
            eyebrow="Just landed"
            title="New Arrivals"
            subtitle="The latest additions to the house — small drops, made to be noticed."
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending strip */}
      <section className="bg-ink py-20 text-cream sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">
                Now trending
              </p>
              <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl md:text-5xl">
                The pieces moving fast
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs uppercase tracking-[0.25em] text-gold hover:underline"
            >
              See all →
            </Link>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 [&_h3_a]:!text-cream [&_h3_a:hover]:!text-gold [&_p]:!text-cream/70 [&_span]:!text-cream">
            {trending.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionHeading eyebrow="Loved by" title="Notes from clients" />
          <div className="mt-14">
            <Testimonials />
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionHeading
            eyebrow="@zanniescollections"
            title="On Instagram"
            subtitle="Tag us in your moments — we love seeing how you wear Zannies."
          />
          <div className="mt-12">
            <InstaGrid />
          </div>
        </div>
      </section>
    </>
  );
}
