import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);
  const toggle = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const { format } = useCurrency();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
      className="group relative flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Label */}
        {product.label && (
          <span className="absolute left-3 top-3 bg-ink px-2 py-1 text-[0.6rem] uppercase tracking-[0.25em] text-gold">
            {product.label}
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
            toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
          }}
          aria-label="Toggle wishlist"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-gold"
        >
          <Heart
            className={`h-4 w-4 transition-all ${wished ? "fill-ink text-ink" : "text-ink"}`}
          />
        </button>

        {/* Quick add overlay */}
        <button
          onClick={(e) => {
            e.preventDefault();
            add(product);
            toast.success(`${product.name} added to cart`);
          }}
          className="absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-center gap-2 bg-ink py-3 text-[0.7rem] uppercase tracking-[0.25em] text-cream opacity-0 transition-all duration-300 hover:bg-gold hover:text-ink group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Add to bag
        </button>
      </div>

      <div className="pt-4">
        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
          {product.subcategory}
        </p>
        <h3 className="mt-1.5 font-display text-lg leading-tight">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="hover:text-gold"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-medium">{format(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {format(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
