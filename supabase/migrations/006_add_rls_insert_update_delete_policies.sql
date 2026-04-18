-- Migration: 006_add_rls_insert_update_delete_policies.sql
-- Purpose: Add RLS policies for admin INSERT/UPDATE/DELETE operations
-- These policies allow authenticated users to modify data via service role key
-- Used by scrapers and admin API routes

-- Products: Admin insert, update (for category/image backfill)
CREATE POLICY "Admin insert products" ON products
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin update products" ON products
  FOR UPDATE
  WITH CHECK (true);

-- Offers: Admin insert, update, delete (for upserts and cleanup)
CREATE POLICY "Admin insert offers" ON offers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin update offers" ON offers
  FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Admin delete offers" ON offers
  FOR DELETE
  USING (true);

-- Categories: Admin insert, update (for category management)
CREATE POLICY "Admin insert categories" ON categories
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin update categories" ON categories
  FOR UPDATE
  WITH CHECK (true);

-- Price history: Admin insert (for price tracking)
CREATE POLICY "Admin insert price_history" ON price_history
  FOR INSERT
  WITH CHECK (true);

-- Promotions: Admin insert, update, delete (for promotion management)
CREATE POLICY "Admin insert promotions" ON promotions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin update promotions" ON promotions
  FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Admin delete promotions" ON promotions
  FOR DELETE
  USING (true);

-- Scrape logs: Admin insert, update (for logging)
CREATE POLICY "Admin insert scrape_logs" ON scrape_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin update scrape_logs" ON scrape_logs
  FOR UPDATE
  WITH CHECK (true);
