-- Migration: 007_add_rpc_get_stores_offer_counts.sql
-- Purpose: Add RPC function to get offer counts per store (optimized query)
-- Replaces: Fetching all offers and counting in JavaScript

CREATE OR REPLACE FUNCTION get_stores_offer_counts()
RETURNS TABLE(store_slug TEXT, count BIGINT)
SECURITY INVOKER
AS $$
  SELECT 
    store_slug, 
    COUNT(*) as count
  FROM activa_offers_view
  GROUP BY store_slug
  ORDER BY store_slug;
$$ LANGUAGE sql STABLE;

-- Grant access to public (anon) users for API calls
GRANT EXECUTE ON FUNCTION get_stores_offer_counts() TO anon, authenticated;
