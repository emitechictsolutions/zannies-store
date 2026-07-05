import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
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

type Sort = "newest" | "price-asc" | "price-desc" | "rating";

function Shop() {
  const { format } = useCurrency();
  const [cats, setCats] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(2200000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");

  const filtered = useMemo(() => {
    let list = products.filter(
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
  }, [cats, maxPrice, inStockOnly, sort]);

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
