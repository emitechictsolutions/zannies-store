import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Category } from "@/data/categories";

export function CategoryCard({ category, index = 0 }: { category: Category; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/category/$slug"
        params={{ slug: category.slug }}
        className="group relative block aspect-[4/5] overflow-hidden bg-ink"
      >
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gold">{category.tagline}</p>
          <h3 className="mt-2 font-display text-3xl text-cream">{category.name}</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-cream/80 opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100">
            <span className="uppercase tracking-[0.2em]">Shop {category.name}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
        <div className="absolute inset-0 ring-0 ring-gold/0 transition-all duration-500 group-hover:ring-1 group-hover:ring-gold/40" />
      </Link>
    </motion.div>
  );
}
