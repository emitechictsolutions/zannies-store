import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { categories } from "@/data/categories";
import { products as staticProducts, type Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Zannies Collections" },
      { name: "description", content: "Shop premium gold jewellery, hair, beauty and clothing at Zannies Collections." },
    ],
  }),
  component: Shop,
});

function mapDbProduct(p: any): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: (p.categories?.slug ?? p.subcategory ?? "jewellery") as any,
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

type Sort = "newest" | "price-asc" | "price-desc" | "rating";

function Shop() {
  const { format } = useCurrency();
  const [cats, setCats] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(2200000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");

  const { data: dbProducts } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(slug)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapDbProduct);
    },
    staleTime: 30_000,
  });

  const allProducts = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) return dbProducts;
    return staticProducts;
  }, [dbProducts]);

  const filtered = useMemo(() => {
    let list = allProducts.filter(
      (p) =>
        (cats.length === 0 || cats.includes(p.category)) &&
        p.price <= maxPrice &&
        (!inStockOnly || p.inStock)
    );
    list = [...list];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [allProducts, cats, maxPrice, inStockOnly, sort]);

  return (
    <div className="bg-background pt-28">
      <header className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Boutique</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">All pieces</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          The complete Zannies catalogue. Filter by category, price and availability.
        </p>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-24 lg:grid-cols-[260px_1fr] lg:px-12">
        {/* Filters */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-8 border border-border p-6">
            <div>
              <h3 className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">Category</h3>
              <div className="space-y-2">
                {categories.map((c) => (
                  <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={cats.includes(c.slug)}
                      onChange={(e) =>
                        setCats((prev) =>
                          e.target.checked ? [...prev, c.slug] : prev.filter((x) => x !== c.slug)
                        )
                      }
                      className="accent-[var(--gold)]"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">Max price</h3>
              <input
                type="range"
                min={10000}
                max={2200000}
                step={10000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[var(--gold)]"
              />
              <div className="mt-2 text-sm text-muted-foreground">
                Up to {format(maxPrice)}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[var(--gold)]"
              />
              In stock only
            </label>
          </div>
        </aside>

        {/* Grid */}
        <div>
          <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
            <span className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">No pieces match your filters.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
