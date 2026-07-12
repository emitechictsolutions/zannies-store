import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { products as staticProducts, type Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — Zannies Collections" },
      { name: "description", content: "Search the Zannies Collections catalogue." },
    ],
  }),
  component: SearchPage,
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

function SearchPage() {
  const [q, setQ] = useState("");

  const { data: dbProducts } = useQuery({
    queryKey: ["search-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(slug)")
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []).map(mapDbProduct);
    },
    staleTime: 30_000,
  });

  const allProducts = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) return dbProducts;
    return staticProducts;
  }, [dbProducts]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.subcategory.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }, [q, allProducts]);

  return (
    <div className="bg-background pt-28">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-12">
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Search</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">What are you looking for?</h1>

        <div className="relative mt-10">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try 'gold chain', 'body wave', 'perfume'..."
            className="w-full border-b-2 border-border bg-transparent py-4 pl-12 pr-4 font-display text-2xl focus:border-gold focus:outline-none"
          />
        </div>

        <div className="mt-12">
          {q.trim() === "" ? (
            <p className="text-center text-muted-foreground">Start typing to search the catalogue.</p>
          ) : results.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No pieces match "{q}". Try another search.
            </p>
          ) : (
            <>
              <p className="mb-8 text-sm text-muted-foreground">
                {results.length} result{results.length === 1 ? "" : "s"}
              </p>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
