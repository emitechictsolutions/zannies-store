import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { Newsletter } from "./Newsletter";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { WHATSAPP_NUMBER, BUSINESS_ADDRESS, PHONE_DISPLAY } from "@/lib/format";
import logo from "@/assets/zannies-logo.png.asset.json";

const EMAILS = [
  { label: "info@zanniescollection.co.uk", type: "General" },
  { label: "support@zanniescollection.co.uk", type: "Support" },
  { label: "payments@zanniescollection.co.uk", type: "Payments" },
] as const;

const cols = [
  {
    title: "Shop",
    links: [
      { to: "/category/$slug", params: { slug: "jewellery" }, label: "Jewellery" },
      { to: "/category/$slug", params: { slug: "hair" }, label: "Hair" },
      { to: "/category/$slug", params: { slug: "beauty" }, label: "Beauty" },
      { to: "/category/$slug", params: { slug: "clothing" }, label: "Clothing" },
    ],
  },
  {
    title: "House",
    links: [
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Fashion",
    links: [
      { to: "/category/$slug", params: { slug: "women-clothing" }, label: "Women's Clothing" },
      { to: "/category/$slug", params: { slug: "men-clothing" }, label: "Men's Clothing" },
      { to: "/category/$slug", params: { slug: "kids-clothing" }, label: "Kids Clothing" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-ink text-cream/80">
      <div className="border-b border-cream/10">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-12">
          <p className="text-[0.6rem] uppercase tracking-[0.4em] text-gold">The List</p>
          <h3 className="mx-auto mt-3 max-w-xl font-display text-3xl text-cream sm:text-4xl">
            Receive first access to private drops.
          </h3>
          <div className="mt-8">
            <Newsletter />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:px-12">
        <div className="lg:col-span-2">
          <img
            src={logo.url}
            alt="Zannies Collections"
            className="h-14 w-auto object-contain brightness-0 invert"
            width={320}
            height={96}
          />
          <p className="mt-6 max-w-sm text-sm leading-relaxed">
            Authentic gold, premium hair, beauty and clothing — sourced and crafted to be loved
            for a lifetime.
          </p>
          <address className="mt-5 space-y-1.5 text-sm not-italic text-cream/70">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{BUSINESS_ADDRESS}</span>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <a href={`tel:${PHONE_DISPLAY.replace(/\s/g, "")}`} className="hover:text-gold">
                {PHONE_DISPLAY}
              </a>
            </div>
            {EMAILS.map((e) => (
              <div key={e.label} className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={`mailto:${e.label}`} className="hover:text-gold">
                  {e.label}
                </a>
              </div>
            ))}
          </address>
          <div className="mt-6 flex gap-3">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="grid h-9 w-9 place-items-center border border-cream/15 transition-colors hover:border-gold hover:text-gold"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              aria-label="WhatsApp"
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center transition-transform hover:scale-110"
            >
              <WhatsAppIcon size={36} />
            </a>
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="mb-5 text-[0.65rem] uppercase tracking-[0.3em] text-gold">
              {c.title}
            </h4>
            <ul className="space-y-3 text-sm">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    params={"params" in l ? l.params : undefined}
                    className="transition-colors hover:text-gold"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-cream/10 py-6 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Zannies Collections. All rights reserved.
      </div>
    </footer>
  );
}
