-- Migration: persist structured per-store scrape summaries
-- Allows querying offers_found/saved, duration and active offers delta history

ALTER TABLE scrape_logs
ADD COLUMN IF NOT EXISTS run_summary JSONB;
