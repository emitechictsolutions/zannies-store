import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — Zannies Collections" },
      { name: "description", content: "Search the Zannies Collections catalogue." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.subcategory.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }, [q]);

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
