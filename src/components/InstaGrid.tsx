import { Instagram } from "lucide-react";
import { products } from "@/data/products";

export function InstaGrid() {
  const tiles = products.slice(0, 6);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
      {tiles.map((p) => (
        <a
          key={p.id}
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          className="group relative block aspect-square overflow-hidden bg-muted"
        >
          <img
            src={p.images[0]}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 grid place-items-center bg-ink/60 opacity-0 transition-opacity group-hover:opacity-100">
            <Instagram className="h-6 w-6 text-gold" />
          </div>
        </a>
      ))}
    </div>
  );
}
