import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { categoryBySlug, categories as staticCategories } from "@/data/categories";
import { productsByCategory as staticProductsByCategory, type Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const cat = categoryBySlug(params.slug);
    const title = cat ? `${cat.name} — Zannies Collections` : "Zannies Collections";
    return {
      meta: [
        { title },
        { name: "description", content: cat?.description ?? "Shop Zannies Collections" },
        { property: "og:title", content: title },
        { property: "og:description", content: cat?.description ?? "" },
      ],
    };
  },
  loader: ({ params }) => {
    const cat = categoryBySlug(params.slug);
    if (!cat) throw notFound();
    return { category: cat };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.4em] text-gold">404</p>
        <h1 className="mt-2 font-display text-3xl">Category not found</h1>
      </div>
    </div>
  ),
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
    variants: Array.isArray(p.variants) ? p.variants as any : undefined,
  };
}

function CategoryPage() {
  const { category } = Route.useLoaderData();

  const { data: dbCategory } = useQuery({
    queryKey: ["category-db", category.slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", category.slug)
        .maybeSingle();
      return data;
    },
    staleTime: 60_000,
  });

  const { data: dbProducts } = useQuery({
    queryKey: ["category-products", category.slug],
    queryFn: async () => {
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category.slug)
        .maybeSingle();
      if (!catData) return [];
      const { data } = await supabase
        .from("products")
        .select("*, categories(slug)")
        .eq("category_id", catData.id)
        .eq("is_active", true);
      return (data ?? []).map(mapDbProduct);
    },
    staleTime: 30_000,
  });

  const list = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) return dbProducts;
    return staticProductsByCategory(category.slug);
  }, [dbProducts, category.slug]);

  const categoryImage = dbCategory?.image_url ?? category.image;

  const { data: heroes } = useQuery({
    queryKey: ["hero-images", category.slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("hero_images")
        .select("image_url, alt_text, headline, subheadline")
        .eq("category_slug", category.slug)
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  const gallery = (heroes && heroes.length > 0)
    ? heroes
    : [{ image_url: categoryImage, alt_text: category.name, headline: null, subheadline: null }];

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (gallery.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % gallery.length), 6000);
    return () => clearInterval(t);
  }, [gallery.length]);
  const active = gallery[idx % gallery.length];

  return (
    <div className="bg-background">
      <section className="relative h-[65vh] min-h-[560px] overflow-hidden bg-ink text-cream sm:h-[55vh] sm:min-h-[420px]">
        <img
          src={active.image_url}
          alt={active.alt_text ?? category.name}
          className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-16 lg:px-12">
          <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">{active.headline ?? category.tagline}</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl md:text-7xl">{category.name}</h1>
          <p className="mt-4 max-w-2xl text-cream/80">{active.subheadline ?? category.description}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {category.subcategories.map((s: string) => (
              <span
                key={s}
                className="border border-cream/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cream/80"
              >
                {s}
              </span>
            ))}
          </div>
          {gallery.length > 1 && (
            <div className="absolute bottom-6 right-6 flex gap-1.5">
              {gallery.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`h-1.5 w-6 transition ${i === idx ? "bg-gold" : "bg-cream/30"}`} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        {list.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">More pieces dropping soon.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
