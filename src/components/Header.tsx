import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/zannies-logo.png.asset.json";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/category/$slug", params: { slug: "jewellery" }, label: "Jewellery" },
  { to: "/category/$slug", params: { slug: "hair" }, label: "Hair" },
  { to: "/category/$slug", params: { slug: "beauty" }, label: "Beauty" },
] as const;

const clothingChildren = [
  { slug: "men-clothing", label: "Men's Clothing" },
  { slug: "women-clothing", label: "Women's Clothing" },
  { slug: "kids-clothing", label: "Kids' Clothing" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { user } = useAuth();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const wishCount = useWishlist((s) => s.ids.length);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hasDarkHero = pathname === "/" || pathname.startsWith("/category/");
  const useLightChrome = !hasDarkHero || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/90 text-foreground backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : hasDarkHero
            ? "bg-transparent text-cream"
            : "bg-background text-foreground shadow-[0_1px_0_rgba(0,0,0,0.06)]"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-12">
        <button
          className="lg:hidden"
          onClick={() => setMobile(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center" aria-label="Zannies Collections — Home">
          <img
            src={logo.url}
            alt="Zannies Collections"
            className={`h-10 w-auto sm:h-12 object-contain transition-[filter] duration-300 ${
              useLightChrome ? "" : "brightness-0 invert"
            }`}
            width={320}
            height={96}
          />
        </Link>

        <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.18em] lg:flex">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              params={"params" in n ? n.params : undefined}
              className="transition-colors hover:text-gold"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
          <div className="group relative">
            <Link
              to="/category/$slug"
              params={{ slug: "clothing" }}
              className="transition-colors hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              Clothing ▾
            </Link>
            <div className="invisible absolute left-1/2 top-full z-50 mt-3 w-56 -translate-x-1/2 border border-border bg-background/95 py-2 opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover:visible group-hover:opacity-100">
              {clothingChildren.map((c) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="block px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-foreground hover:bg-secondary hover:text-gold"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/search" aria-label="Search" className="p-2 hover:text-gold">
            <Search className="h-5 w-5" />
          </Link>
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative p-2 hover:text-gold"
          >
            <Heart className="h-5 w-5" />
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[0.6rem] font-medium text-ink">
                {wishCount}
              </span>
            )}
          </Link>
          {user ? (
            <Link to="/account" aria-label="Account" className="hidden p-2 hover:text-gold sm:block">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="rounded-sm border border-gold/60 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-ink transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="rounded-sm bg-gradient-to-r from-[oklch(0.78_0.13_85)] to-[oklch(0.85_0.11_88)] px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] text-ink hover:brightness-110 transition-all"
              >
                Sign up
              </Link>
            </div>
          )}
          <Link to="/cart" aria-label="Cart" className="relative p-2 hover:text-gold">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[0.6rem] font-medium text-ink">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobile && (
        <div className="fixed inset-0 z-50 bg-ink/95 text-cream backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="font-display text-xl">Menu</span>
            <button onClick={() => setMobile(false)} aria-label="Close menu">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-6 py-6 text-xl">
            {nav.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                params={"params" in n ? n.params : undefined}
                onClick={() => setMobile(false)}
                className="border-b border-cream/10 py-4 font-display hover:text-gold"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/category/$slug"
              params={{ slug: "clothing" }}
              onClick={() => setMobile(false)}
              className="border-b border-cream/10 py-4 font-display hover:text-gold"
            >
              Clothing
            </Link>
            {clothingChildren.map((c) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                onClick={() => setMobile(false)}
                className="border-b border-cream/10 py-3 pl-4 text-base text-cream/80 hover:text-gold"
              >
                › {c.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
