-- Migration: Harden admin write policies and add price history dedupe RPC
-- Notes:
-- 1) Admin authorization is based on JWT app_metadata (not user_metadata).
-- 2) Service role still bypasses RLS as expected for backend jobs.

-- Helper predicate (inlined):
--   role = admin OR roles includes admin OR is_admin = true in app_metadata

-- -----------------------------------------------------------------------------
-- RLS hardening for write policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin insert products" ON products;
DROP POLICY IF EXISTS "Admin update products" ON products;

DROP POLICY IF EXISTS "Admin insert offers" ON offers;
DROP POLICY IF EXISTS "Admin update offers" ON offers;
DROP POLICY IF EXISTS "Admin delete offers" ON offers;

DROP POLICY IF EXISTS "Admin insert categories" ON categories;
DROP POLICY IF EXISTS "Admin update categories" ON categories;

DROP POLICY IF EXISTS "Admin insert price_history" ON price_history;

DROP POLICY IF EXISTS "Admin insert promotions" ON promotions;
DROP POLICY IF EXISTS "Admin update promotions" ON promotions;
DROP POLICY IF EXISTS "Admin delete promotions" ON promotions;

DROP POLICY IF EXISTS "Admin insert scrape_logs" ON scrape_logs;
DROP POLICY IF EXISTS "Admin update scrape_logs" ON scrape_logs;

CREATE POLICY "Admin insert products" ON products
  FOR INSERT
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin update products" ON products
  FOR UPDATE
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin insert offers" ON offers
  FOR INSERT
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin update offers" ON offers
  FOR UPDATE
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin delete offers" ON offers
  FOR DELETE
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin insert categories" ON categories
  FOR INSERT
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin update categories" ON categories
  FOR UPDATE
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin insert price_history" ON price_history
  FOR INSERT
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin insert promotions" ON promotions
  FOR INSERT
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin update promotions" ON promotions
  FOR UPDATE
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin delete promotions" ON promotions
  FOR DELETE
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin insert scrape_logs" ON scrape_logs
  FOR INSERT
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

CREATE POLICY "Admin update scrape_logs" ON scrape_logs
  FOR UPDATE
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR COALESCE((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false') = 'true'
  );

-- -----------------------------------------------------------------------------
-- RPC required by scripts/scrapeAll.ts for deduplicated price history entries
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.insert_price_if_changed(
  p_product_id uuid,
  p_price numeric
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_price numeric;
BEGIN
  SELECT ph.price
  INTO v_last_price
  FROM public.price_history ph
  WHERE ph.product_id = p_product_id
  ORDER BY ph.recorded_at DESC
  LIMIT 1;

  IF v_last_price IS NULL OR v_last_price <> p_price THEN
    INSERT INTO public.price_history (product_id, price, recorded_at)
    VALUES (p_product_id, p_price, now());
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_price_if_changed(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_price_if_changed(uuid, numeric) TO service_role;
