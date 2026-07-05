import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Product prices in the data layer are authored in NGN. We convert to the
// shopper's local currency at display time using fixed indicative rates.
export type CurrencyCode = "GBP" | "USD" | "EUR" | "NGN" | "CAD" | "AUD";

interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  // Multiplier applied to a base NGN amount to yield the target currency.
  rateFromNGN: number;
  decimals: number;
  locale: string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  GBP: { code: "GBP", symbol: "£", rateFromNGN: 1 / 2000, decimals: 2, locale: "en-GB" },
  USD: { code: "USD", symbol: "$", rateFromNGN: 1 / 1500, decimals: 2, locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", rateFromNGN: 1 / 1700, decimals: 2, locale: "en-IE" },
  NGN: { code: "NGN", symbol: "₦", rateFromNGN: 1, decimals: 0, locale: "en-NG" },
  CAD: { code: "CAD", symbol: "CA$", rateFromNGN: 1 / 1100, decimals: 2, locale: "en-CA" },
  AUD: { code: "AUD", symbol: "A$", rateFromNGN: 1 / 1000, decimals: 2, locale: "en-AU" },
};

const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  GB: "GBP",
  US: "USD",
  NG: "NGN",
  CA: "CAD",
  AU: "AUD",
  // Common EUR countries
  IE: "EUR", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", PT: "EUR", FI: "EUR", GR: "EUR", LU: "EUR",
};

const DEFAULT: CurrencyCode = "GBP";

// Checkout is always processed in GBP. Convert an NGN base amount into GBP pence.
export function toGbpPence(amountNGN: number): number {
  const gbp = amountNGN * CURRENCIES.GBP.rateFromNGN;
  return Math.max(0, Math.round(gbp * 100));
}
const STORAGE_KEY = "zannies-currency";

interface CurrencyContextValue {
  currency: CurrencyMeta;
  format: (amountNGN: number) => string;
  setCurrency: (code: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function fmt(meta: CurrencyMeta, amountNGN: number) {
  const v = amountNGN * meta.rateFromNGN;
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      maximumFractionDigits: meta.decimals,
      minimumFractionDigits: meta.decimals,
    }).format(v);
  } catch {
    return `${meta.symbol}${v.toFixed(meta.decimals)}`;
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>(DEFAULT);

  useEffect(() => {
    // Hydrate from storage first
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
      if (stored && CURRENCIES[stored]) {
        setCode(stored);
        return;
      }
    } catch {}

    // Otherwise, detect by IP. Fail silently to GBP default.
    const ctrl = new AbortController();
    fetch("https://ipapi.co/json/", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const cc: string | undefined = d?.country_code;
        const next = (cc && COUNTRY_TO_CURRENCY[cc]) || DEFAULT;
        setCode(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const meta = CURRENCIES[code];
  const value: CurrencyContextValue = {
    currency: meta,
    format: (n) => fmt(meta, n),
    setCurrency: (c) => {
      setCode(c);
      try { localStorage.setItem(STORAGE_KEY, c); } catch {}
    },
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;
  // SSR / outside-provider fallback so formatters never crash.
  const meta = CURRENCIES[DEFAULT];
  return {
    currency: meta,
    format: (n: number) => fmt(meta, n),
    setCurrency: () => {},
  };
}
