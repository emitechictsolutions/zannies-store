import { Star } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  {
    quote:
      "The 24K chain arrived in packaging that already felt like an heirloom. The piece itself is unreal.",
    name: "Amelia R.",
    location: "London",
  },
  {
    quote:
      "I've tried every premium hair vendor in the UK — Zannies is the only one I keep returning to.",
    name: "Sophia K.",
    location: "Manchester",
  },
  {
    quote:
      "Customer service responds on WhatsApp in minutes. The Amber Noir perfume is now my signature.",
    name: "Olivia M.",
    location: "Edinburgh",
  },
];

export function Testimonials() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {items.map((t, i) => (
        <motion.figure
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: i * 0.1 }}
          className="border border-border bg-background p-8"
        >
          <div className="mb-4 flex gap-1 text-gold">
            {Array.from({ length: 5 }).map((_, n) => (
              <Star key={n} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <blockquote className="font-display text-lg italic leading-relaxed">
            "{t.quote}"
          </blockquote>
          <figcaption className="mt-6 text-sm">
            <div className="font-medium">{t.name}</div>
            <div className="text-muted-foreground">{t.location}</div>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}
