-- Migration: Add scrape_logs table for structured run logging
-- Tracks each scraper run with metadata for observability and debugging

CREATE TABLE scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  offers_found INTEGER DEFAULT 0,
  offers_saved INTEGER DEFAULT 0,
  error TEXT,
  run_duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by store and time range
CREATE INDEX idx_scrape_logs_store_started ON scrape_logs(store_slug, started_at DESC);
CREATE INDEX idx_scrape_logs_finished ON scrape_logs(finished_at DESC) WHERE finished_at IS NOT NULL;

-- Enable RLS (optional, but recommended for security)
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert/update (for scraper process)
CREATE POLICY "service_role_full_access_scrape_logs" ON scrape_logs
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to read (for dashboard/monitoring)
CREATE POLICY "anon_read_scrape_logs" ON scrape_logs
  AS PERMISSIVE FOR SELECT
  TO anon
  USING (true);
