import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Sparkles } from "./Sparkles";
import heroJewellery from "@/assets/hero-jewellery.jpg";
import heroHair from "@/assets/hero-hair.jpg";
import heroBeauty from "@/assets/hero-beauty.jpg";
import heroClothing from "@/assets/hero-clothing.jpg";

const slides = [heroJewellery, heroHair, heroBeauty, heroClothing];
const TAGLINE = "Luxury. Beauty. Elegance.";

export function Hero() {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n++;
      setTyped(TAGLINE.slice(0, n));
      if (n >= TAGLINE.length) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative h-[95vh] min-h-[640px] w-full overflow-hidden bg-ink text-cream"
      aria-label="Featured collections"
    >
      {/* Slides */}
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        {slides.map((src, idx) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
            style={{ opacity: i === idx ? 1 : 0 }}
          >
            <img
              src={src}
              alt=""
              className="ken-burns h-full w-full object-cover"
              width={1920}
              height={1280}
              fetchPriority={idx === 0 ? "high" : "auto"}
              loading={idx === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />
      </motion.div>

      {/* Sparkles */}
      <Sparkles count={28} />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-24 sm:pb-32 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mb-4 text-[0.7rem] uppercase tracking-[0.4em] text-gold"
        >
          Zannies Collections
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl font-display text-5xl font-normal leading-[1.05] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
        >
          The new <em className="not-italic text-gradient-gold">heirloom</em> of African luxury.
        </motion.h1>

        <p
          className="mt-6 min-h-[1.5em] font-display text-xl italic text-gold/90 sm:text-2xl"
          aria-label={TAGLINE}
        >
          {typed}
          <span className="ml-1 inline-block h-[1em] w-[2px] animate-pulse bg-gold align-middle" />
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <Link to="/shop" className="btn-gold">
            Shop Now
          </Link>
          <Link to="/shop" className="btn-outline-gold">
            Explore Collections
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-gold"
      >
        <div className="flex flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em]">
          <span>Discover</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </motion.div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 right-6 z-10 hidden gap-2 sm:flex">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Show slide ${idx + 1}`}
            className={`h-[2px] transition-all ${i === idx ? "w-10 bg-gold" : "w-5 bg-cream/40"}`}
          />
        ))}
      </div>
    </section>
  );
}
