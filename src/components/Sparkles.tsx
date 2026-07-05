import { useMemo } from "react";

export function Sparkles({ count = 24 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        bottom: Math.random() * 30,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 8,
        size: 1 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.5,
      })),
    [count]
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-gold"
          style={{
            left: `${d.left}%`,
            bottom: `${d.bottom}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            opacity: d.opacity,
            boxShadow: "0 0 6px currentColor",
            animation: `sparkleFloat ${d.duration}s ease-in ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
