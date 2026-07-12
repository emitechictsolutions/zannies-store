-- ============================================================
-- Migration: Seed data, add order description, site settings
-- ============================================================

-- 1. Add product_description to order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_description text;

-- 2. Create site_settings table (key-value store for admin settings)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO service_role;

CREATE TRIGGER trg_site_settings_touch
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS: only admins can manage settings, everyone can read
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_read" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "site_settings_admin_all" ON public.site_settings
  FOR ALL USING (app_private.has_role(auth.uid(), 'admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

-- 3. Insert default payment mode setting
INSERT INTO public.site_settings (key, value) VALUES
  ('payment_mode', '"live"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Seed categories with images (upsert to avoid duplicates)
INSERT INTO public.categories (slug, name, description, image_url, sort_order) VALUES
  ('jewellery', 'Jewellery', 'Authenticated gold pieces — chains, rings, bangles, and signature collections handcrafted for those who wear their legacy.', '/assets/cat-jewellery.jpg', 1),
  ('hair', 'Hair', 'Ethically sourced raw hair — bone straight, body wave, deep wave, pixie and frontals with the kind of luster that lasts.', '/assets/cat-hair.jpg', 2),
  ('beauty', 'Beauty', 'Curated skincare, cosmetics and fragrance from the houses we trust — for the ritual you deserve every morning.', '/assets/cat-beauty.jpg', 3),
  ('clothing', 'Clothing', 'Womenswear, menswear, kids and accessories — pieces designed to be photographed and remembered.', '/assets/cat-clothing.jpg', 4),
  ('men-clothing', 'Men''s Clothing', 'Bespoke suiting, refined casualwear, statement outerwear and heritage accessories for the modern gentleman.', '/assets/hero-men.jpg', 5),
  ('women-clothing', 'Women''s Clothing', 'Evening gowns, silk sets, tailored dresses and heirloom pieces — a wardrobe crafted for the woman who leaves a legacy.', '/assets/hero-women.jpg', 6),
  ('kids-clothing', 'Kids'' Clothing', 'Occasion wear, everyday luxe and adorable accessories for the smallest members of the family — made to be treasured.', '/assets/hero-kids.jpg', 7)
ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description;

-- 5. Seed products (using subquery to get category_id)
-- Jewellery products
INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, original_price_pence, sku, images, variants, specs, label, is_active, is_featured, featured_order)
SELECT 'regal-cuban-link-24k', 'Regal Cuban Link Chain — 24K Gold',
  'A statement Cuban link forged in pure 24K gold. Polished by hand, weighted to drape with intention. The kind of chain you pass down.',
  c.id, '24K Gold', 1850000, 2100000, 'ZC-J-24K-001',
  '["/assets/p-chain.jpg"]'::jsonb,
  '[{"name":"Length","values":["18 in","20 in","22 in","24 in"]}]'::jsonb,
  '{"Gold":"24K","Weight":"62g","Length":"22 in","Clasp":"Box clasp"}'::jsonb,
  'Best Seller', true, true, 1
FROM public.categories c WHERE c.slug = 'jewellery'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, label, is_active)
SELECT 'celestine-diamond-drops-22k', 'Celestine Diamond Drop Earrings — 22K',
  'Pear-cut stones suspended from 22K gold hooks. Light catches them like applause.',
  c.id, 'Earrings', 720000, 'ZC-J-22K-002',
  '["/assets/p-earrings.jpg"]'::jsonb,
  '{"Gold":"22K","Stone":"VS Diamond","Drop":"32mm"}'::jsonb,
  'New', true
FROM public.categories c WHERE c.slug = 'jewellery'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, original_price_pence, sku, images, variants, specs, label, is_active)
SELECT 'soleil-signet-ring-21k', 'Soleil Signet Ring — 21K Gold',
  'A modern signet with a brilliant centre stone. Quiet, certain, unforgettable.',
  c.id, 'Rings', 540000, 620000, 'ZC-J-21K-003',
  '["/assets/p-ring.jpg"]'::jsonb,
  '[{"name":"Size","values":["5","6","7","8","9","10"]}]'::jsonb,
  '{"Gold":"21K","Stone":"Diamond 0.25ct","Sizes":"5–10"}'::jsonb,
  'Sale', true
FROM public.categories c WHERE c.slug = 'jewellery'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, label, is_active)
SELECT 'lumiere-tennis-bracelet-18k', 'Lumière Tennis Bracelet — 18K',
  'Two rows of brilliant stones set in 18K gold. Engineered to move with you.',
  c.id, 'Bracelets', 1280000, 'ZC-J-18K-004',
  '["/assets/p-bracelet.jpg"]'::jsonb,
  '{"Gold":"18K","Stones":"108 VS","Length":"7 in"}'::jsonb,
  'Hot', true
FROM public.categories c WHERE c.slug = 'jewellery'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, is_active)
SELECT 'atelier-rope-chain-22k', 'Atelier Rope Chain — 22K Gold',
  'A slimmer, layerable 22K rope chain for everyday refinement.',
  c.id, 'Chains', 980000, 'ZC-J-22K-005',
  '["/assets/p-chain.jpg"]'::jsonb,
  '{"Gold":"22K","Weight":"28g","Length":"20 in"}'::jsonb,
  true
FROM public.categories c WHERE c.slug = 'jewellery'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, is_active)
SELECT 'noir-eternity-band-18k', 'Noir Eternity Band — 18K',
  'Black-enamel detail set against bright 18K gold. A modern eternity ring.',
  c.id, 'Rings', 460000, 'ZC-J-18K-006',
  '["/assets/p-ring.jpg"]'::jsonb,
  '{"Gold":"18K","Width":"3mm","Sizes":"5–9"}'::jsonb,
  false
FROM public.categories c WHERE c.slug = 'jewellery'
ON CONFLICT (slug) DO NOTHING;

-- Hair products
INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, original_price_pence, sku, images, variants, specs, label, is_active, is_featured, featured_order)
SELECT 'raw-bone-straight-24in', 'Raw Bone Straight Bundle — 24"',
  'Single-donor raw hair, cuticles aligned, dyed to a deep natural black. Lays bone straight from root to tip.',
  c.id, 'Bone Straight', 185000, 210000, 'ZC-H-BS-24',
  '["/assets/p-hair-straight.jpg"]'::jsonb,
  '[{"name":"Length","values":["18\"","20\"","22\"","24\"","26\"","30\""]}]'::jsonb,
  '{"Type":"Raw","Length":"24 in","Weight":"100g","Origin":"Single donor"}'::jsonb,
  'Best Seller', true, true, 2
FROM public.categories c WHERE c.slug = 'hair'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, label, is_active)
SELECT 'luxe-body-wave-22in', 'Luxe Body Wave Bundle — 22"',
  'Loose romantic waves that hold shape wash after wash.',
  c.id, 'Body Wave', 165000, 'ZC-H-BW-22',
  '["/assets/p-hair-wave.jpg"]'::jsonb,
  '{"Type":"Raw","Length":"22 in","Weight":"100g"}'::jsonb,
  'Hot', true
FROM public.categories c WHERE c.slug = 'hair'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, is_active)
SELECT 'jerry-curl-bundle-20in', 'Jerry Curl Bundle — 20"',
  'Defined, springy curls with body and bounce.',
  c.id, 'Jerry Curl', 175000, 'ZC-H-JC-20',
  '["/assets/p-hair-curl.jpg"]'::jsonb,
  '{"Type":"Raw","Length":"20 in","Weight":"100g"}'::jsonb,
  true
FROM public.categories c WHERE c.slug = 'hair'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, label, is_active)
SELECT 'hd-lace-frontal-13x4', 'HD Lace Frontal — 13×4',
  'Invisible HD lace, pre-plucked hairline, bleached knots ready to install.',
  c.id, 'Frontal', 240000, 'ZC-H-FR-134',
  '["/assets/p-hair-frontal.jpg"]'::jsonb,
  '{"Lace":"HD","Size":"13×4","Density":"180%"}'::jsonb,
  'New', true
FROM public.categories c WHERE c.slug = 'hair'
ON CONFLICT (slug) DO NOTHING;

-- Beauty products
INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, original_price_pence, sku, images, specs, label, is_active)
SELECT 'amber-noir-eau-de-parfum', 'Amber Noir Eau de Parfum',
  'A warm oriental — amber, saffron and oud, with a base of vanilla and Egyptian musk.',
  c.id, 'Perfume', 95000, 120000, 'ZC-B-PF-001',
  '["/assets/p-perfume.jpg"]'::jsonb,
  '{"Size":"100ml","Family":"Oriental","Longevity":"10–12 hrs"}'::jsonb,
  'Sale', true
FROM public.categories c WHERE c.slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, label, is_active, is_featured, featured_order)
SELECT 'velvet-matte-lipstick-rouge', 'Velvet Matte Lipstick — Rouge Royale',
  'A cushioned matte that wears for hours without drying. The perfect red.',
  c.id, 'Cosmetics', 18500, 'ZC-B-LP-002',
  '["/assets/p-lipstick.jpg"]'::jsonb,
  '{"Finish":"Matte","Net":"3.5g"}'::jsonb,
  'Best Seller', true, true, 3
FROM public.categories c WHERE c.slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, label, is_active)
SELECT '24k-radiance-serum', '24K Radiance Glow Serum',
  'Niacinamide, hyaluronic acid and real gold flakes for a lit-from-within finish.',
  c.id, 'Skincare', 62000, 'ZC-B-SR-003',
  '["/assets/p-serum.jpg"]'::jsonb,
  '{"Size":"30ml","Key":"Niacinamide, HA, Gold"}'::jsonb,
  'New', true
FROM public.categories c WHERE c.slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, is_active)
SELECT 'rituel-body-cream', 'Rituel Body Cream',
  'Shea, marula and a whisper of jasmine. The most luxurious thing in your bathroom.',
  c.id, 'Body Care', 34500, 'ZC-B-BC-004',
  '["/assets/p-cream.jpg"]'::jsonb,
  '{"Size":"200ml","Scent":"Jasmine, Vanilla"}'::jsonb,
  true
FROM public.categories c WHERE c.slug = 'beauty'
ON CONFLICT (slug) DO NOTHING;

-- Clothing products
INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, original_price_pence, sku, images, variants, specs, label, is_active, is_featured, featured_order)
SELECT 'obsidian-silk-slip-dress', 'Obsidian Silk Slip Dress',
  'Bias-cut 100% mulberry silk that moves like water. Black-tie ready in a single step.',
  c.id, 'Women', 145000, 180000, 'ZC-C-W-001',
  '["/assets/p-dress.jpg"]'::jsonb,
  '[{"name":"Size","values":["XS","S","M","L","XL"]}]'::jsonb,
  '{"Fabric":"100% Mulberry Silk","Care":"Dry clean"}'::jsonb,
  'Best Seller', true, true, 4
FROM public.categories c WHERE c.slug = 'clothing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, variants, specs, is_active)
SELECT 'milano-leather-loafer', 'Milano Hand-Stitched Leather Loafer',
  'Italian calf leather, hand-stitched penny strap, leather sole. A wardrobe foundation.',
  c.id, 'Shoes', 215000, 'ZC-C-SH-002',
  '["/assets/p-shoes.jpg"]'::jsonb,
  '[{"name":"Size","values":["40","41","42","43","44","45"]}]'::jsonb,
  '{"Material":"Italian Calf","Sole":"Leather"}'::jsonb,
  true
FROM public.categories c WHERE c.slug = 'clothing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, specs, label, is_active)
SELECT 'midas-silk-scarf', 'Midas Silk Scarf',
  'A pure gold tone in mulberry silk with hand-rolled edges.',
  c.id, 'Accessories', 52000, 'ZC-C-AC-003',
  '["/assets/p-scarf.jpg"]'::jsonb,
  '{"Size":"90×90cm","Fabric":"Silk twill"}'::jsonb,
  'New', true
FROM public.categories c WHERE c.slug = 'clothing'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (slug, name, description, category_id, subcategory, price_pence, sku, images, variants, specs, label, is_active)
SELECT 'noir-tailored-two-piece', 'Noir Tailored Two-Piece Suit',
  'Half-canvas construction, super 120s wool, a notch lapel cut clean.',
  c.id, 'Men', 320000, 'ZC-C-M-004',
  '["/assets/p-suit.jpg"]'::jsonb,
  '[{"name":"Size","values":["38R","40R","42R","44R","46R"]}]'::jsonb,
  '{"Fabric":"Super 120s Wool","Fit":"Tailored"}'::jsonb,
  'Hot', true
FROM public.categories c WHERE c.slug = 'clothing'
ON CONFLICT (slug) DO NOTHING;

-- 6. Seed homepage hero images
INSERT INTO public.hero_images (category_slug, image_url, alt_text, headline, subheadline, sort_order, active) VALUES
  ('homepage', '/assets/hero-jewellery.jpg', 'Gold jewellery collection', 'Heirloom Gold', 'Crafted to be inherited', 0, true),
  ('homepage', '/assets/hero-hair.jpg', 'Premium hair bundles', 'Raw Hair', 'Single donor, cuticle aligned', 1, true),
  ('homepage', '/assets/hero-beauty.jpg', 'Beauty and fragrance', 'Beauty Ritual', 'Skin, scent, glow', 2, true),
  ('homepage', '/assets/hero-clothing.jpg', 'Luxury clothing', 'Tailored Elegance', 'Designed to be remembered', 3, true)
ON CONFLICT DO NOTHING;

-- 7. Seed category hero images
INSERT INTO public.hero_images (category_slug, image_url, alt_text, headline, subheadline, sort_order, active) VALUES
  ('jewellery', '/assets/hero-jewellery.jpg', 'Gold jewellery', 'Heirloom 18K–24K Gold', 'Authenticated gold pieces', 0, true),
  ('hair', '/assets/hero-hair.jpg', 'Premium hair', 'Premium Bundles & Closures', 'Ethically sourced raw hair', 0, true),
  ('beauty', '/assets/hero-beauty.jpg', 'Beauty products', 'Skin · Scent · Glow', 'Curated skincare and fragrance', 0, true),
  ('clothing', '/assets/hero-clothing.jpg', 'Luxury clothing', 'Tailored Elegance', 'Pieces designed to be remembered', 0, true),
  ('men-clothing', '/assets/hero-men.jpg', 'Men clothing', 'Sharp · Tailored · Timeless', 'For the modern gentleman', 0, true),
  ('women-clothing', '/assets/hero-women.jpg', 'Women clothing', 'Poised · Feminine · Iconic', 'A wardrobe for the woman who leaves a legacy', 0, true),
  ('kids-clothing', '/assets/hero-kids.jpg', 'Kids clothing', 'Little Icons · Big Moments', 'Made to be treasured', 0, true)
ON CONFLICT DO NOTHING;

-- 8. Auto-create inventory for seeded products
INSERT INTO public.inventory (product_id, stock, low_stock_threshold)
SELECT id, 50, 10
FROM public.products
WHERE NOT EXISTS (SELECT 1 FROM public.inventory WHERE inventory.product_id = products.id)
ON CONFLICT (product_id) DO NOTHING;
