-- Migration: Clean up slug-formatted product names and low prices
-- Date: 2026-04-19
-- Purpose: 
--   1. Delete products with names matching slug pattern (e.g., "papas-fritas-lays-1871733")
--   2. Delete offers with prices < 100 (data quality issue from old scrapers)
--   3. Prevent duplicate filtering issues caused by renamed products

-- Log the operation start
INSERT INTO scrape_logs (store_slug, status, message, metadata)
VALUES ('system', 'info', 'Starting cleanup: removing slug-named products and low prices', 
        jsonb_build_object('operation', 'cleanup_slugs_and_low_prices', 'timestamp', now()));

-- Count products to be deleted (for reporting)
WITH to_delete_products AS (
  SELECT id, name, product_id
  FROM products
  WHERE name ~* '^[a-z0-9]+(-[a-z0-9]+){3,}$'  -- Matches slug pattern: has 4+ hyphen-separated parts
    AND name ~ '\d{5,}$'  -- Must end with 5+ digit ID
)
DELETE FROM products
WHERE id IN (SELECT id FROM to_delete_products);

-- Delete offers with price < 100 (data quality issue)
DELETE FROM offers
WHERE offer_price < 100 OR original_price < 100;

-- Log the operation end
INSERT INTO scrape_logs (store_slug, status, message, metadata)
VALUES ('system', 'info', 'Completed cleanup: removed slug-named products and low-price offers',
        jsonb_build_object('operation', 'cleanup_slugs_and_low_prices', 'timestamp', now()));
