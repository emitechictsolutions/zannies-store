import { useState } from "react";
import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { Heart, Share2, ShoppingBag, Star, Check } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { toast } from "sonner";
import { ProductCard } from "@/components/ProductCard";
import { productBySlug, relatedProducts } from "@/data/products";
import { whatsappLink } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const p = productBySlug(params.slug);
    const title = p ? `${p.name} — Zannies Collections` : "Product";
    return {
      meta: [
        { title },
        { name: "description", content: p?.description ?? "" },
        { property: "og:title", content: title },
        { property: "og:description", content: p?.description ?? "" },
        ...(p?.images[0] ? [{ property: "og:image", content: p.images[0] }] : []),
      ],
    };
  },
  loader: ({ params }) => {
    const p = productBySlug(params.slug);
    if (!p) throw notFound();
    return { product: p };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">Product not found.</p>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const related = relatedProducts(product);
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const toggle = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const { format } = useCurrency();

  const [img, setImg] = useState(0);
  const [variant, setVariant] = useState(product.variants?.[0]?.values[0]);
  const [qty, setQty] = useState(1);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-background pt-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <nav className="mb-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <Link
            to="/category/$slug"
            params={{ slug: product.category }}
            className="hover:text-gold"
          >
            {product.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="group relative aspect-square overflow-hidden bg-muted">
              <img
                src={product.images[img]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {product.label && (
                <span className="absolute left-4 top-4 bg-ink px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-gold">
                  {product.label}
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {product.images.map((src: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImg(i)}
                    className={`relative aspect-square w-20 overflow-hidden border-2 transition ${
                      img === i ? "border-gold" : "border-transparent"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gold">
              {product.subcategory}
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3 text-sm">
              <div className="flex text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-current" : ""}`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                {product.rating.toFixed(1)} · {product.reviews} reviews
              </span>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-3xl">{format(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {format(product.originalPrice)}
                  </span>
                  <span className="bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                    −{discount}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-6 flex items-center gap-2 text-sm">
              {product.inStock ? (
                <>
                  <Check className="h-4 w-4 text-gold" />
                  <span>In stock — ready to ship</span>
                </>
              ) : (
                <span className="text-destructive">Currently out of stock</span>
              )}
            </div>

            {/* Variants */}
            {product.variants?.map((v: { name: string; values: string[] }) => (
              <div key={v.name} className="mt-6">
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  {v.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {v.values.map((val: string) => (
                    <button
                      key={val}
                      onClick={() => setVariant(val)}
                      className={`border px-4 py-2 text-sm transition ${
                        variant === val
                          ? "border-gold bg-ink text-cream"
                          : "border-border hover:border-gold"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Qty */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:text-gold"
                  aria-label="Decrease"
                >
                  −
                </button>
                <span className="min-w-8 px-2 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2 hover:text-gold"
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  add(product, qty, variant);
                  toast.success(`${product.name} added to bag`);
                  navigate({ to: "/cart" });
                }}
                disabled={!product.inStock}
                className="btn-gold flex-1 disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                onClick={() => {
                  add(product, qty, variant);
                  toast.success(`Added — ${qty} × ${product.name}`);
                }}
                disabled={!product.inStock}
                className="btn-outline-gold !text-foreground !border-foreground hover:!bg-ink hover:!text-cream disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <button
                onClick={() => {
                  toggle(product.id);
                  toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
                }}
                className="inline-flex items-center gap-2 border border-border px-4 py-2 hover:border-gold"
              >
                <Heart className={`h-4 w-4 ${wished ? "fill-current text-gold" : ""}`} />
                Wishlist
              </button>
              <a
                href={whatsappLink(product.name, format(product.price))}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-border px-4 py-2 hover:border-gold"
              >
                <WhatsAppIcon size={18} />
                WhatsApp Enquiry
              </a>
              <button
                onClick={async () => {
                  const url = typeof window !== "undefined" ? window.location.href : "";
                  if (navigator.share) {
                    await navigator.share({ title: product.name, url }).catch(() => {});
                  } else {
                    await navigator.clipboard.writeText(url);
                    toast.success("Link copied");
                  }
                }}
                className="inline-flex items-center gap-2 border border-border px-4 py-2 hover:border-gold"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            {/* Specs */}
            <div className="mt-10 border-t border-border pt-8">
              <h3 className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
                Specifications
              </h3>
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between border-b border-border/50 pb-2 text-sm"
                  >
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24 pb-24">
            <div className="mb-12 text-center">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">You may also love</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">From the same house</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
