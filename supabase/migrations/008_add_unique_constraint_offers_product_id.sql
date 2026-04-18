-- Migration: 008_add_unique_constraint_offers_product_id.sql
-- Purpose: Ensure upsert(onConflict: 'product_id') works correctly and avoids duplicate offers.

-- Keep only the most recent row per product_id before adding uniqueness.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY scraped_at DESC NULLS LAST, id DESC) AS rn
  FROM offers
  WHERE product_id IS NOT NULL
)
DELETE FROM offers
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Enforce one offer row per product for deterministic upserts.
ALTER TABLE offers
  ADD CONSTRAINT offers_product_id_key UNIQUE (product_id);
