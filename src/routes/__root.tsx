import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { CurrencyProvider } from "@/lib/currency";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gradient-gold">404</h1>
        <h2 className="mt-4 font-display text-2xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-gold">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-gold"
          >
            Try again
          </button>
          <a href="/" className="btn-outline-gold !text-foreground !border-foreground">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Zannies Collections — Luxury. Beauty. Elegance." },
      {
        name: "description",
        content:
          "Premium 18K–24K gold jewellery, raw hair, luxury beauty and clothing. Crafted with African elegance.",
      },
      { name: "author", content: "Zannies Collections" },
      { property: "og:title", content: "Zannies Collections — Luxury. Beauty. Elegance." },
      {
        property: "og:description",
        content: "Luxury. Beauty. Elegance. — gold jewellery, premium hair, beauty and clothing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Zannies Collections — Luxury. Beauty. Elegance." },
      { name: "description", content: "Zannies Luxe Platform is a premium luxury e-commerce website for fashion and lifestyle products." },
      { property: "og:description", content: "Zannies Luxe Platform is a premium luxury e-commerce website for fashion and lifestyle products." },
      { name: "twitter:description", content: "Zannies Luxe Platform is a premium luxury e-commerce website for fashion and lifestyle products." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/4i8yYqOdoVRyCOR898V8TVAc7XV2/social-images/social-1782562736176-lgozannies.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/4i8yYqOdoVRyCOR898V8TVAc7XV2/social-images/social-1782562736176-lgozannies.webp" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <Header />
          <main className="min-h-screen">
            <Outlet />
          </main>
          <Footer />
          <WhatsAppFab />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "var(--ink)",
                color: "var(--cream)",
                border: "1px solid var(--gold)",
                borderRadius: "2px",
              },
            }}
          />
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
