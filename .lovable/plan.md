
# Zannies Collections — Backend, Checkout & Admin

A big scope, so here's how I'll sequence it. I'll build in phases so the site keeps working after each one.

## 1. Enable Lovable Cloud + Schema

Enable Cloud (managed Postgres + auth + server functions). Then create:

- `profiles` — first/last name, phone, marketing opt-in (auto-created on signup)
- `addresses` — multiple shipping addresses per user, one default
- `user_roles` + `app_role` enum (`admin`, `customer`) — separate table, with a `has_role()` security-definer function (RLS-safe)
- `products`, `categories` — migrated from the current `src/data/products.ts` mock
- `inventory` — stock per product (+ low-stock threshold)
- `coupons` — % or fixed, expiry, usage cap, min spend
- `orders` — status (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`, `failed`), currency, amounts, shipping address snapshot
- `order_items` — product snapshot + qty + price
- `payments` — provider (`stripe`/`paystack`/`paypal`), provider ref, status, raw event log, retries
- `reviews` — 1-5 stars, body, photos, verified-purchase flag, admin reply
- `saved_cards` — Stripe-only (Paystack/PayPal don't support save-card the same way), stores `stripe_customer_id` + `payment_method_id` + last4/brand. Never card numbers.

RLS on everything. Customers see only their own data; admins see all via `has_role(auth.uid(), 'admin')`. Public reads for `products`/`categories`/`reviews`.

## 2. Auth (Login / Signup / Account)

- `/auth` — branded sign in + sign up tabs (email + password, plus Google OAuth). Gold/black/cream styling, Playfair headings, glassy card on a soft gold backdrop.
- `/account` (protected) — overview with quick stats
- `/account/profile` — edit name, phone, marketing opt-in
- `/account/addresses` — CRUD shipping addresses, set default
- `/account/orders` — full history (paid + failed), order detail drilldown
- `/account/payment-methods` — saved Stripe cards (list, set default, delete)
- Sign-out hygiene + protected layout under `_authenticated/`.

## 3. Checkout flow with forced sign-in

Cart → "Proceed to Checkout" → if signed out, redirect to `/auth?redirect=/checkout`.

- `/checkout` (protected, 3 steps in one page):
  1. **Address** — pick saved address or add new
  2. **Shipping** — flat-rate (UK / Europe / International)
  3. **Payment** — radio choice of Stripe / Paystack / PayPal, with order summary
- Server function creates an `orders` row (`pending`) + `payments` row before redirecting to the provider, so failed/abandoned attempts are tracked.
- **Stripe**: built-in Lovable Stripe (no keys needed), Checkout Session, saved-card support via Stripe Customers
- **Paystack**: requires your Paystack secret key — I'll request it via the secrets prompt. Works for GBP if your Paystack account is GBP-enabled; otherwise it falls back to NGN with a converted amount. Webhook endpoint at `/api/public/webhooks/paystack`
- **PayPal**: requires Client ID + Secret — I'll request them. Webhook at `/api/public/webhooks/paypal`
- `/checkout/success?order=…` and `/checkout/failed?order=…` pages (branded, animated)
- Every webhook writes status to `orders` + `payments` and creates a `payment_transactions` audit row

> **Note on emails**: You chose to skip email receipts for now. Order confirmation will show on the success page and live in the account dashboard. I can wire email later when you set up a sender domain.

## 4. Admin dashboard

`/admin/*` — protected by `has_role(_, 'admin')`. Dark luxury theme (black + gold accents, glassmorphism cards). Sidebar layout.

- `/admin` — KPIs (revenue, orders, AOV, low stock), recent orders, top products (Recharts)
- `/admin/products` — CRUD, multi-image upload to Cloud storage, inventory + low-stock alerts
- `/admin/categories` — CRUD
- `/admin/orders` — filter by status, view detail, update status, refund link
- `/admin/customers` — list, view orders, ban toggle
- `/admin/coupons` — CRUD
- `/admin/inventory` — stock adjustments + history
- `/admin/reviews` — moderate, reply, hide

Bootstrap: first user to hit `/admin/bootstrap` becomes admin (only works if no admin exists yet). After that, admins promote others.

## 5. UI polish on top of existing storefront

- Header gets an account icon (avatar when signed in, "Sign in" otherwise)
- Wishlist + Cart sync to DB when signed in, keep using localStorage when signed out, merge on login
- Product page: live reviews + verified-purchase badge
- "Save card for next time" checkbox on the Stripe payment step

## Technical notes (skip if not interested)

- **Stack**: TanStack Start server functions (`createServerFn`) for all app logic. Server routes only for the 3 webhook endpoints under `/api/public/webhooks/*` (HMAC/signature verified).
- **Saved cards**: Stripe SetupIntent → store `payment_method_id` + Customer ID server-side; UI only shows last4 + brand.
- **Failed payments**: webhook flips order to `failed` and writes the provider error code into `payments.last_error` — visible in both user and admin history.
- **RBAC**: every admin server fn checks `has_role(context.userId, 'admin')` before doing anything, and admin routes use a layout `beforeLoad` redirect to `/` for non-admins.
- **Currency**: charge in **GBP** across all providers (Stripe always; Paystack/PayPal where account supports it). The on-site currency switcher remains a display-only convenience.

## What I'll need from you mid-build

After phase 1 (auth working), I'll prompt you for:
- **Paystack secret key** (test mode is fine to start) — from your Paystack dashboard → Settings → API Keys
- **PayPal Client ID + Secret** (sandbox is fine) — from developer.paypal.com → My Apps & Credentials

Stripe needs nothing from you — Lovable provisions a test account automatically.

## Order of operations

1. Enable Cloud → migrations for all tables + RLS
2. Auth pages + protected `/account/*` + profile/addresses
3. Cart/wishlist DB sync + force-login on checkout
4. Stripe checkout end-to-end (success/failed pages, saved cards, history)
5. Pause to collect Paystack + PayPal keys → wire those two
6. Admin dashboard + RBAC bootstrap
7. Reviews on product page + admin moderation

Each phase is independently shippable. Ready to start with **phase 1 (Cloud + schema + auth)**?
