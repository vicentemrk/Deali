-- ============================================================================
-- Migration: 12+ categories with parent/child hierarchy + critical indexes
-- ============================================================================

-- ── 1. Add missing category: Electro ─────────────────────────────────────────
INSERT INTO categories (name, slug, parent_id)
SELECT 'Electrohogar', 'electro', NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'electro');

-- ── 2. Clean up parent_id hierarchy ──────────────────────────────────────────
-- Congelados should be a top-level category, not under Despensa
UPDATE categories SET parent_id = NULL WHERE slug = 'congelados';

-- Panadería should be top-level  
UPDATE categories SET parent_id = NULL WHERE slug = 'panaderia';

-- Snacks should be top-level
UPDATE categories SET parent_id = NULL WHERE slug = 'snacks';

-- Higiene Personal should be top-level (separate from Aseo del Hogar)
UPDATE categories SET parent_id = NULL WHERE slug = 'higiene';

-- Licores (Bebidas Alcohólicas) stays under Bebidas — this is correct

-- ── 3. Rename "Limpieza e Higiene" → "Aseo del Hogar" for clarity ────────────
UPDATE categories SET name = 'Aseo del Hogar' WHERE slug = 'aseo';

-- ── 4. Upgrade search_vector from 'simple' to 'spanish' for proper FTS ──────
ALTER TABLE products DROP COLUMN IF EXISTS search_vector;

ALTER TABLE products
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('spanish', COALESCE(name, '')) ||
    to_tsvector('spanish', COALESCE(brand, ''))
  ) STORED;

-- ── 5. Recreate GIN index for Spanish full-text search ───────────────────────
DROP INDEX IF EXISTS idx_products_search_gin;
CREATE INDEX idx_products_search_gin ON products USING gin(search_vector);

-- ── 6. Recreate view with parent category info + LEFT JOINs ──────────────────
DROP VIEW IF EXISTS activa_offers_view;

CREATE VIEW activa_offers_view WITH (security_invoker = true) AS
SELECT 
    o.id AS offer_id,
    o.product_id,
    o.original_price,
    o.offer_price,
    o.discount_pct,
    o.offer_url,
    o.start_date,
    o.end_date,
    o.is_active,
    o.scraped_at,
    p.name AS product_name,
    p.image_url AS product_image_url,
    p.brand AS product_brand,
    p.store_id,
    p.category_id,
    s.name AS store_name,
    s.slug AS store_slug,
    s.color_hex AS store_color_hex,
    s.logo_url AS store_logo_url,
    COALESCE(c.name, 'General') AS category_name,
    COALESCE(c.slug, 'general') AS category_slug,
    pc.name AS parent_category_name,
    pc.slug AS parent_category_slug
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON p.store_id = s.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN categories pc ON c.parent_id = pc.id
WHERE o.is_active = true AND o.end_date >= CURRENT_DATE;

-- ── 7. Drop old single-column indexes now covered by composites ──────────────
DROP INDEX IF EXISTS idx_offers_end_date;
DROP INDEX IF EXISTS idx_offers_is_active;
