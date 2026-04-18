-- ============================================================================
-- Migration: Add critical offer/product search indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_offers_product_id ON offers(product_id);

CREATE INDEX IF NOT EXISTS idx_products_name_store ON products(store_id, lower(name));

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);