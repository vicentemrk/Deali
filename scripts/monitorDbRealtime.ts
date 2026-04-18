import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

type Metrics = {
  timestamp: string;
  activeOffers: number;
  storesWithOffers: number;
  lastScrapeAt: string | null;
  scrapeRunsLastHour: number;
  lowVolumeStores: Array<{
    storeSlug: string;
    offersFound: number;
    offersSaved: number;
    threshold: number;
    startedAt: string;
  }>;
};

const DEFAULT_ALERT_MIN_OFFERS: Record<string, number> = {
  jumbo: 25,
  'santa-isabel': 30,
  lider: 25,
  tottus: 15,
  unimarc: 25,
  acuenta: 20,
};

function envKeyForStoreThreshold(storeSlug: string): string {
  return `SCRAPE_ALERT_MIN_${storeSlug.toUpperCase().replace(/-/g, '_')}`;
}

function resolveAlertThreshold(storeSlug: string): number {
  const envKey = envKeyForStoreThreshold(storeSlug);
  const envRaw = process.env[envKey];
  const envVal = envRaw ? Number.parseInt(envRaw, 10) : NaN;
  if (!Number.isNaN(envVal) && envVal >= 0) return envVal;
  return DEFAULT_ALERT_MIN_OFFERS[storeSlug] ?? 20;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('[monitorDbRealtime] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const intervalArg = args.find((arg) => arg.startsWith('--interval='));
const intervalMs = intervalArg ? Number.parseInt(intervalArg.split('=')[1], 10) : 30000;

if (Number.isNaN(intervalMs) || intervalMs < 1000) {
  console.error('[monitorDbRealtime] --interval must be >= 1000 ms');
  process.exit(1);
}

async function fetchMetrics(): Promise<Metrics> {
  const [
    { count: activeOffers, error: offersErr },
    { data: groupedRows, error: groupedErr },
    { data: lastScrapeRow, error: scrapeErr },
    { count: runsLastHour, error: runsErr },
    { data: recentRuns, error: recentRunsErr },
  ] = await Promise.all([
    supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('activa_offers_view')
      .select('store_slug')
      .limit(1000),
    supabase
      .from('scrape_logs')
      .select('started_at')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('scrape_logs')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
    supabase
      .from('scrape_logs')
      .select('store_slug, started_at, offers_found, offers_saved, finished_at')
      .order('started_at', { ascending: false })
      .limit(200),
  ]);

  if (offersErr) throw new Error(`offers metric failed: ${offersErr.message}`);
  if (groupedErr) throw new Error(`stores metric failed: ${groupedErr.message}`);
  if (scrapeErr) throw new Error(`last scrape metric failed: ${scrapeErr.message}`);
  if (runsErr) throw new Error(`runs metric failed: ${runsErr.message}`);
  if (recentRunsErr) throw new Error(`recent runs metric failed: ${recentRunsErr.message}`);

  const storeSet = new Set((groupedRows ?? []).map((row: any) => row.store_slug));

  const latestPerStore = new Map<string, any>();
  for (const row of recentRuns ?? []) {
    if (!row?.store_slug) continue;
    if (!row?.finished_at) continue;
    if (!latestPerStore.has(row.store_slug)) {
      latestPerStore.set(row.store_slug, row);
    }
  }

  const lowVolumeStores = Array.from(latestPerStore.values())
    .map((row) => {
      const threshold = resolveAlertThreshold(row.store_slug);
      const offersFound = Number(row.offers_found ?? 0);
      const offersSaved = Number(row.offers_saved ?? 0);

      return {
        storeSlug: row.store_slug,
        offersFound,
        offersSaved,
        threshold,
        startedAt: row.started_at,
        isLow: offersFound < threshold,
      };
    })
    .filter((row) => row.isLow)
    .map(({ isLow: _isLow, ...row }) => row);

  return {
    timestamp: new Date().toISOString(),
    activeOffers: activeOffers ?? 0,
    storesWithOffers: storeSet.size,
    lastScrapeAt: lastScrapeRow?.started_at ?? null,
    scrapeRunsLastHour: runsLastHour ?? 0,
    lowVolumeStores,
  };
}

function printMetrics(metrics: Metrics) {
  console.log(JSON.stringify({ event: 'db.realtime.metrics', ...metrics }));
}

async function runOnce() {
  const metrics = await fetchMetrics();
  printMetrics(metrics);
}

async function main() {
  await runOnce();

  if (!watch) return;

  console.log(`[monitorDbRealtime] watching every ${intervalMs}ms...`);
  setInterval(async () => {
    try {
      const metrics = await fetchMetrics();
      printMetrics(metrics);
    } catch (error: any) {
      console.error('[monitorDbRealtime] tick failed:', error?.message || String(error));
    }
  }, intervalMs);
}

main().catch((error: any) => {
  console.error('[monitorDbRealtime] failed:', error?.message || String(error));
  process.exit(1);
});
