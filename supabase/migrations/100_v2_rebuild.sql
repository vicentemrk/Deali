-- =============================================================================
-- Deali v2 — Complete DB Rebuild
-- Run this in Supabase SQL Editor AFTER taking a backup
-- Idempotent: safe to re-run (all DROP IF EXISTS)
-- =============================================================================

-- ─── 1. DESTRUCCIÓN TOTAL ────────────────────────────────────────────────────
DROP TABLE IF EXISTS
  price_history,
  offers,
  products,
  promotions,
  categories,
  stores,
  scrape_logs,
  scrape_jobs
CASCADE;

DROP VIEW IF EXISTS active_offers_view CASCADE;
DROP FUNCTION IF EXISTS get_stores_offer_counts() CASCADE;
DROP FUNCTION IF EXISTS get_price_history(UUID) CASCADE;

-- ─── 2. TABLAS ───────────────────────────────────────────────────────────────

-- 2.1 stores
CREATE TABLE stores (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT    NOT NULL,
    slug         TEXT    UNIQUE NOT NULL,
    logo_url     TEXT,
    website_url  TEXT,
    color_hex    TEXT,
    -- Routing automático: qué tipo de scraper usa esta tienda
    scraper_type TEXT    NOT NULL CHECK (scraper_type IN ('vtex', 'browser')),
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 categories
CREATE TABLE categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    slug       TEXT UNIQUE NOT NULL,
    -- Nombre del icono (Lucide/HeroIcons) para la UI
    icon_name  TEXT,
    parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 products
-- Deduplicación real por (store_id, sku) — sku puede ser nativo o hash del nombre
CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku         TEXT NOT NULL,
    name        TEXT NOT NULL,
    image_url   TEXT,
    brand       TEXT,
    store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraint clave: un producto es único por tienda + SKU
    UNIQUE (store_id, sku)
);

-- 2.4 offers
-- Una oferta activa por producto (UNIQUE product_id)
CREATE TABLE offers (
    id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    original_price NUMERIC(10,2),
    offer_price    NUMERIC(10,2) NOT NULL,
    discount_pct   NUMERIC(5,2),
    offer_url      TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    -- Auditoría: qué scraper generó esta oferta
    scraped_by     TEXT    NOT NULL,
    scraped_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id)
);

-- 2.5 price_history
-- Registro inmutable de precios (append-only, no se actualiza)
CREATE TABLE price_history (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    offer_price    NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2),
    -- Qué scraper registró este precio
    source         TEXT NOT NULL,
    recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 promotions (banners/campañas, no ofertas individuales)
CREATE TABLE promotions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT,
    store_id    UUID REFERENCES stores(id) ON DELETE CASCADE,
    image_url   TEXT,
    offer_url   TEXT,
    start_date  DATE,
    end_date    DATE,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 scrape_logs
-- Registro de cada run de scraper para auditoría y alertas
CREATE TABLE scrape_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id           TEXT NOT NULL,
    store_slug       TEXT NOT NULL,
    scraper_type     TEXT NOT NULL CHECK (scraper_type IN ('vtex', 'browser')),
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at      TIMESTAMPTZ,
    status           TEXT NOT NULL DEFAULT 'running'
                         CHECK (status IN ('running', 'success', 'partial', 'failed')),
    offers_found     INTEGER NOT NULL DEFAULT 0,
    offers_inserted  INTEGER NOT NULL DEFAULT 0,
    offers_updated   INTEGER NOT NULL DEFAULT 0,
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. ÍNDICES ───────────────────────────────────────────────────────────────

-- Búsqueda full-text en productos (requiere extensión pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm   ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm  ON products USING gin (brand gin_trgm_ops);

-- Filtros frecuentes en offers
CREATE INDEX idx_offers_is_active      ON offers(is_active);
CREATE INDEX idx_offers_scraped_at     ON offers(scraped_at DESC);
CREATE INDEX idx_offers_discount_pct   ON offers(discount_pct DESC NULLS LAST);

-- Filtros por store y category
CREATE INDEX idx_products_store_id     ON products(store_id);
CREATE INDEX idx_products_category_id  ON products(category_id);

-- Auditoría de scraping
CREATE INDEX idx_scrape_logs_store     ON scrape_logs(store_slug);
CREATE INDEX idx_scrape_logs_run_id    ON scrape_logs(run_id);
CREATE INDEX idx_scrape_logs_status    ON scrape_logs(status);

-- Price history (consultas por producto ordenadas por fecha)
CREATE INDEX idx_price_history_product ON price_history(product_id, recorded_at DESC);

-- ─── 4. VISTA PRINCIPAL ───────────────────────────────────────────────────────

-- Vista desnormalizada para el frontend (evita JOINs complejos en cliente)
CREATE OR REPLACE VIEW active_offers_view AS
SELECT
    o.id              AS offer_id,
    o.product_id,
    o.original_price,
    o.offer_price,
    o.discount_pct,
    o.offer_url,
    o.is_active,
    o.scraped_by,
    o.scraped_at,
    p.sku             AS product_sku,
    p.name            AS product_name,
    p.image_url       AS product_image_url,
    p.brand           AS product_brand,
    p.store_id,
    p.category_id,
    s.name            AS store_name,
    s.slug            AS store_slug,
    s.color_hex       AS store_color,
    s.logo_url        AS store_logo_url,
    s.scraper_type,
    COALESCE(c.name, 'General')   AS category_name,
    COALESCE(c.slug, 'general')   AS category_slug,
    COALESCE(c.icon_name, 'tag')  AS category_icon
FROM  offers    o
JOIN  products  p ON o.product_id = p.id
JOIN  stores    s ON p.store_id   = s.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE o.is_active = true
  AND s.is_active = true;

-- ─── 5. ROW LEVEL SECURITY ───────────────────────────────────────────────────

ALTER TABLE stores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs   ENABLE ROW LEVEL SECURITY;

-- Lectura pública (anon key del frontend puede SELECT)
CREATE POLICY "public_read_stores"        ON stores        FOR SELECT USING (true);
CREATE POLICY "public_read_categories"    ON categories    FOR SELECT USING (true);
CREATE POLICY "public_read_products"      ON products      FOR SELECT USING (true);
CREATE POLICY "public_read_offers"        ON offers        FOR SELECT USING (true);
CREATE POLICY "public_read_price_history" ON price_history FOR SELECT USING (true);
CREATE POLICY "public_read_promotions"    ON promotions    FOR SELECT USING (true);
CREATE POLICY "public_read_scrape_logs"   ON scrape_logs   FOR SELECT USING (true);

-- Escritura SOLO con service_role (scrapers en GitHub Actions usan SUPABASE_SERVICE_ROLE_KEY)
-- El anon key nunca puede escribir
CREATE POLICY "service_write_stores"
    ON stores FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_write_categories"
    ON categories FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_write_products"
    ON products FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_write_offers"
    ON offers FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_write_price_history"
    ON price_history FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_write_promotions"
    ON promotions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_write_scrape_logs"
    ON scrape_logs FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ─── 6. FUNCIÓN RPC — conteo de ofertas por tienda ───────────────────────────

CREATE OR REPLACE FUNCTION get_stores_offer_counts()
RETURNS TABLE (store_slug TEXT, offer_count BIGINT)
LANGUAGE SQL
STABLE
AS $$
    SELECT s.slug, COUNT(o.id)
    FROM stores s
    LEFT JOIN products p ON p.store_id = s.id
    LEFT JOIN offers   o ON o.product_id = p.id AND o.is_active = true
    WHERE s.is_active = true
    GROUP BY s.slug
    ORDER BY s.slug;
$$;

-- ─── 7. SEED — Stores ────────────────────────────────────────────────────────

INSERT INTO stores (name, slug, website_url, color_hex, scraper_type) VALUES
    ('Jumbo',        'jumbo',        'https://www.jumbo.cl',       '#0D9488', 'vtex'),
    ('Líder',        'lider',        'https://www.lider.cl',       '#7E6BC4', 'vtex'),
    ('Santa Isabel', 'santa-isabel', 'https://www.santaisabel.cl', '#E91E63', 'vtex'),
    ('Tottus',       'tottus',       'https://www.tottus.cl',      '#00843D', 'browser'),
    ('Unimarc',      'unimarc',      'https://www.unimarc.cl',     '#DC2626', 'browser'),
    ('aCuenta',      'acuenta',      'https://www.acuenta.cl',     '#BA7517', 'browser')
ON CONFLICT (slug) DO NOTHING;

-- ─── 8. SEED — Categories ────────────────────────────────────────────────────

INSERT INTO categories (name, slug, icon_name) VALUES
    ('Despensa',             'despensa',           'package'),
    ('Bebidas',              'bebidas',            'cup-soda'),
    ('Lácteos',              'lacteos',            'milk'),
    ('Carnes y Pescados',    'carnes-pescados',    'beef'),
    ('Frutas y Verduras',    'frutas-verduras',    'apple'),
    ('Congelados',           'congelados',         'snowflake'),
    ('Limpieza del Hogar',   'limpieza-hogar',     'sparkles'),
    ('Electrohogar',         'electrohogar',       'zap'),
    ('Mascotas',             'mascotas',           'paw-print'),
    ('Bebidas Alcohólicas',  'bebidas-alcoholicas','wine'),
    ('Higiene Personal',     'higiene-personal',   'heart'),
    ('General',              'general',            'tag')
ON CONFLICT (slug) DO NOTHING;
