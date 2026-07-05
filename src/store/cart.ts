import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  qty: number;
  variant?: string;
}

interface CartState {
  items: CartItem[];
  add: (product: Product, qty?: number, variant?: string) => void;
  remove: (id: string, variant?: string) => void;
  setQty: (id: string, qty: number, variant?: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, qty = 1, variant) =>
        set((s) => {
          const idx = s.items.findIndex(
            (i) => i.product.id === product.id && i.variant === variant
          );
          if (idx >= 0) {
            const next = [...s.items];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return { items: next };
          }
          return { items: [...s.items, { product, qty, variant }] };
        }),
      remove: (id, variant) =>
        set((s) => ({
          items: s.items.filter((i) => !(i.product.id === id && i.variant === variant)),
        })),
      setQty: (id, qty, variant) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.product.id === id && i.variant === variant ? { ...i, qty: Math.max(1, qty) } : i
          ),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.product.price * i.qty, 0),
    }),
    { name: "zannies-cart" }
  )
);
