-- Migration: add scrape_jobs queue for production-safe scraper orchestration
-- Web/API servers enqueue jobs; external workers consume and execute them.

CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT scrape_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status_requested_at
  ON scrape_jobs(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_store_requested_at
  ON scrape_jobs(store_slug, requested_at DESC);

ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_scrape_jobs" ON scrape_jobs
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_scrape_jobs" ON scrape_jobs
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (true);
