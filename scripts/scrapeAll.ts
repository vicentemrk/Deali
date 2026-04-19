import { createClient } from '@supabase/supabase-js';
import { JumboScraper } from './scrapers/jumboScraper';
import { LiderScraper } from './scrapers/liderScraper';
import { UnimarcScraper } from './scrapers/unimarcScraper';
// import { AcuentaScraper } from './scrapers/acuentaScraper'; // TODO: Disabled due to site slowness
import { TottusScraper } from './scrapers/tottusScraper';
import { SantaIsabelScraper } from './scrapers/santaIsabelScraper';
import { StoreScraper, RawOffer } from './scrapers/types';
import { mapCategory } from './lib/categoryMapper';
import { logEvent } from './lib/logger';
import { calculateDiscountPct, isGoodOffer } from './lib/offerQuality';
import { LowVolumeAlert, buildLowVolumeAlert } from './lib/scrapeAlerts';
import { invalidatePrefix } from '../src/lib/cache';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const MIN_SCRAPE_LIMIT = 25;
const MAX_SCRAPE_LIMIT = 75;

function parseScrapeLimit(): number {
  const configured = Number.parseInt(process.env.SCRAPE_LIMIT || `${MAX_SCRAPE_LIMIT}`, 10);
  if (Number.isNaN(configured)) return MAX_SCRAPE_LIMIT;
  return Math.min(MAX_SCRAPE_LIMIT, Math.max(MIN_SCRAPE_LIMIT, configured));
}

const SCRAPE_LIMIT = parseScrapeLimit();

const CANONICAL_CATEGORIES = [
  { name: 'Bebidas', slug: 'bebidas' },
  { name: 'Lácteos', slug: 'lacteos' },
  { name: 'Carnes y Pescados', slug: 'carnes-pescados' },
  { name: 'Frutas y Verduras', slug: 'frutas-verduras' },
  { name: 'Congelados', slug: 'congelados' },
  { name: 'Panadería y Pastelería', slug: 'panaderia-pasteleria' },
  { name: 'Snacks y Galletas', slug: 'snacks-galletas' },
  { name: 'Cuidado Personal y Bebe', slug: 'cuidado-personal-bebe' },
  { name: 'Limpieza del Hogar', slug: 'limpieza-hogar' },
  { name: 'Bebidas Alcohólicas', slug: 'bebidas-alcoholicas' },
  { name: 'Mascotas', slug: 'mascotas' },
  { name: 'Electrohogar', slug: 'electrohogar' },
  { name: 'Bazar y Hogar', slug: 'bazar-hogar' },
  { name: 'Despensa', slug: 'despensa' },
];

// ---------------------------------------------------------------------------
// DATABASE CLIENT
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

type StoreRunSummary = {
  storeSlug: string;
  offersFound: number;
  offersSaved: number;
  durationMs: number;
  activeOffersBefore: number | null;
  activeOffersAfter: number | null;
  activeOffersDelta: number | null;
  status: 'completed' | 'failed';
  error?: string;
};

type ScrapeRunMetadata = {
  offers_found?: number;
  offers_saved?: number;
  error?: string;
  duration_ms?: number;
  run_summary?: StoreRunSummary;
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function logSettledFailures(
  storeSlug: string,
  event: string,
  results: PromiseSettledResult<unknown>[]
): void {
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length === 0) return;
  logEvent('warn', event, {
    storeSlug,
    failedCount: failures.length,
    sampleError: String(failures[0].reason),
  });
}

function selectOffersForScrape(rawOffers: RawOffer[]): RawOffer[] {
  const filteredOffers = rawOffers.filter(isGoodOffer);
  if (filteredOffers.length === 0) return [];

  const chosenByCategory = new Map<string, RawOffer>();
  const remainder: RawOffer[] = [];

  for (const offer of filteredOffers) {
    const categorySlug = mapCategory(offer.categoryHint);
    if (!chosenByCategory.has(categorySlug)) {
      chosenByCategory.set(categorySlug, offer);
    } else {
      remainder.push(offer);
    }
  }

  const selected = [...chosenByCategory.values()];
  const missing = SCRAPE_LIMIT - selected.length;
  if (missing > 0) selected.push(...remainder.slice(0, missing));
  return selected.slice(0, SCRAPE_LIMIT);
}

function normalizeOfferKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// DATABASE QUERIES
// ---------------------------------------------------------------------------

async function getActiveOffersCount(storeId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const { count, error } = await supabase
    .from('offers')
    .select('id, products!inner(store_id)', { count: 'exact', head: true })
    .eq('products.store_id', storeId)
    .eq('is_active', true)
    .gte('end_date', today);

  if (error) throw new Error(`Failed to count active offers: ${error.message}`);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// OFFER PROCESSING
// ---------------------------------------------------------------------------

async function processOffers(
  storeId: string,
  storeSlug: string,
  offers: RawOffer[],
  categorySlugMap: Map<string, string>
): Promise<number> {
  const targetOffers = selectOffersForScrape(offers);
  if (targetOffers.length === 0) {
    logEvent('info', 'scrape.process.empty', { storeSlug });
    return 0;
  }

  logEvent('info', 'scrape.process.start', {
    storeSlug,
    selectedOffers: targetOffers.length,
    scrapedOffers: offers.length,
    filteredOffers: offers.length - targetOffers.length,
  });

  // Step 1: Fetch all existing products for this store
  const { data: existingProducts, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, image_url, category_id')
    .eq('store_id', storeId);

  if (fetchErr) throw new Error(`[${storeSlug}] Failed to fetch products: ${fetchErr.message}`);

  const productMap = new Map<string, { id: string; category_id: string | null }>(
    (existingProducts ?? []).map((p) => [normalizeOfferKey(p.name), { id: p.id, category_id: p.category_id }])
  );

  // Step 2: Split new vs existing products
  const toInsert: typeof offers = [];
  const existing: { id: string; offer: RawOffer }[] = [];

  for (const offer of targetOffers) {
    const key = normalizeOfferKey(offer.productName);
    const existingProduct = productMap.get(key);
    if (existingProduct) {
      existing.push({ id: existingProduct.id, offer });
    } else {
      toInsert.push(offer);
    }
  }

  // Step 2.5: Backfill images
  await backfillProductImages(storeSlug, existing, existingProducts ?? []);

  // Step 2.6: Backfill categories
  await backfillProductCategories(storeSlug, existing, existingProducts ?? [], categorySlugMap);

  // Step 3: Batch insert new products
  let newProductIds: { id: string; name: string }[] = [];
  if (toInsert.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from('products')
      .insert(
        toInsert.map((o) => {
          const categorySlug = mapCategory(o.categoryHint);
          const categoryId = categorySlugMap.get(categorySlug) ?? null;
          return {
            name: o.productName,
            brand: o.brand,
            image_url: o.imageUrl,
            store_id: storeId,
            category_id: categoryId,
          };
        })
      )
      .select('id, name');

    if (insertErr) {
      console.error(`[${storeSlug}] Batch product insert failed: ${insertErr.message}`);
    } else {
      newProductIds = inserted ?? [];
    }
  }

  // Build full list: existing + newly inserted
  const allProductIds: { id: string; offer: RawOffer }[] = [
    ...existing,
    ...newProductIds.map((p) => ({
      id: p.id,
      offer: toInsert.find((o) => normalizeOfferKey(o.productName) === normalizeOfferKey(p.name))!,
    })),
  ].filter((x) => x.offer != null);

  if (allProductIds.length === 0) return 0;

  // Step 4: Batch upsert offers
  await upsertOffers(storeSlug, allProductIds);

  // Step 5: Price history deduplication via RPC
  await updatePriceHistory(storeSlug, allProductIds);

  logEvent('info', 'scrape.process.completed', {
    storeSlug,
    updatedProducts: existing.length,
    newProducts: newProductIds.length,
  });

  return allProductIds.length;
}

async function backfillProductImages(
  storeSlug: string,
  existing: { id: string; offer: RawOffer }[],
  existingProducts: { id: string; image_url: string | null }[]
): Promise<void> {
  const imageUpdates = existing
    .filter(({ offer }) => offer.imageUrl)
    .map(({ id, offer }) => ({
      id,
      image_url: offer.imageUrl,
      existingProduct: existingProducts.find((p) => p.id === id),
    }))
    .filter(({ existingProduct, image_url }) => !existingProduct?.image_url || existingProduct.image_url !== image_url)
    .map(({ id, image_url }) => ({ id, image_url }));

  if (imageUpdates.length === 0) return;

  const results = await Promise.allSettled(
    imageUpdates.map(async ({ id, image_url }) => {
      const { error } = await supabase.from('products').update({ image_url }).eq('id', id);
      if (error) throw new Error(`image update failed for product ${id}: ${error.message}`);
    })
  );
  logSettledFailures(storeSlug, 'scrape.products.backfill_images_failed', results);
  logEvent('info', 'scrape.products.backfill_images', { storeSlug, count: imageUpdates.length });
}

async function backfillProductCategories(
  storeSlug: string,
  existing: { id: string; offer: RawOffer }[],
  existingProducts: { id: string; category_id: string | null }[],
  categorySlugMap: Map<string, string>
): Promise<void> {
  const categoryUpdates = existing
    .map(({ id, offer }) => {
      const categorySlug = mapCategory(offer.categoryHint);
      const categoryId = categorySlugMap.get(categorySlug);
      if (!categoryId) return null;
      const prevCategoryId = existingProducts.find((p) => p.id === id)?.category_id ?? null;
      if (prevCategoryId === categoryId) return null;
      return { id, category_id: categoryId };
    })
    .filter((item): item is { id: string; category_id: string } => item != null);

  if (categoryUpdates.length === 0) return;

  const results = await Promise.allSettled(
    categoryUpdates.map(async ({ id, category_id }) => {
      const { error } = await supabase.from('products').update({ category_id }).eq('id', id);
      if (error) throw new Error(`category update failed for product ${id}: ${error.message}`);
    })
  );
  logSettledFailures(storeSlug, 'scrape.products.normalize_categories_failed', results);
  logEvent('info', 'scrape.products.normalize_categories', { storeSlug, count: categoryUpdates.length });
}

async function upsertOffers(
  storeSlug: string,
  allProductIds: { id: string; offer: RawOffer }[]
): Promise<void> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const offersPayload = allProductIds.map(({ id: productId, offer }) => {
    const discountPct = calculateDiscountPct(offer.offerPrice, offer.originalPrice).toFixed(2);
    return {
      product_id: productId,
      original_price: offer.originalPrice,
      offer_price: offer.offerPrice,
      discount_pct: discountPct,
      offer_url: offer.offerUrl,
      start_date: today,
      end_date: '9999-12-31',
      is_active: true,
      scraped_at: now.toISOString(),
    };
  });

  const { error } = await supabase
    .from('offers')
    .upsert(offersPayload, { onConflict: 'product_id' });

  if (error) {
    logEvent('error', 'scrape.offers.upsert_failed', { storeSlug, error: error.message });
  }
}

async function updatePriceHistory(
  storeSlug: string,
  allProductIds: { id: string; offer: RawOffer }[]
): Promise<void> {
  const results = await Promise.allSettled(
    allProductIds.map(async ({ id: productId, offer }) => {
      const { error } = await supabase.rpc('insert_price_if_changed', {
        p_product_id: productId,
        p_price: offer.offerPrice,
      });
      if (error) throw new Error(`price history rpc failed for product ${productId}: ${error.message}`);
    })
  );
  logSettledFailures(storeSlug, 'scrape.price_history.rpc_failed', results);
}

// ---------------------------------------------------------------------------
// SCRAPE LOGGING
// ---------------------------------------------------------------------------

async function logScrapeRun(
  storeSlug: string,
  status: 'started' | 'completed' | 'failed',
  metadata: ScrapeRunMetadata
) {
  try {
    if (status === 'started') {
      const { error } = await supabase.from('scrape_logs').insert({
        store_slug: storeSlug,
        started_at: new Date().toISOString(),
      });
      if (error) console.warn(`[LoggingError] Failed to log start: ${error.message}`);
    } else {
      const baseUpdate = {
        finished_at: new Date().toISOString(),
        offers_found: metadata.offers_found ?? 0,
        offers_saved: metadata.offers_saved ?? 0,
        error: metadata.error ?? null,
        run_duration_ms: metadata.duration_ms ?? 0,
      };

      const updateWithSummary = {
        ...baseUpdate,
        ...(metadata.run_summary ? { run_summary: metadata.run_summary } : {}),
      };

      let { error } = await supabase
        .from('scrape_logs')
        .update(updateWithSummary)
        .eq('store_slug', storeSlug)
        .is('finished_at', null)
        .order('started_at', { ascending: false })
        .limit(1);

      // Backward compat for envs without run_summary column
      if (error && metadata.run_summary && /run_summary/i.test(error.message)) {
        const retry = await supabase
          .from('scrape_logs')
          .update(baseUpdate)
          .eq('store_slug', storeSlug)
          .is('finished_at', null)
          .order('started_at', { ascending: false })
          .limit(1);
        error = retry.error;
      }

      if (error) console.warn(`[LoggingError] Failed to log completion: ${error.message}`);
    }
  } catch (err) {
    logEvent('warn', 'scrape.log.failed', { storeSlug, status, error: String(err) });
  }
}

// ---------------------------------------------------------------------------
// BATCH RUNNER
// ---------------------------------------------------------------------------

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(fn));
  }
}

// ---------------------------------------------------------------------------
// REALTIME BROADCAST
// ---------------------------------------------------------------------------

async function broadcastNewOffer(storeSlug: string, offer: RawOffer): Promise<void> {
  try {
    const channel = supabase.channel('new-offers');

    const subscribed = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 2_000);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve(true);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          clearTimeout(timeout);
          resolve(false);
        }
      });
    });

    if (!subscribed) {
      await supabase.removeChannel(channel);
      return;
    }

    await channel.send({
      type: 'broadcast',
      event: 'new-offer',
      payload: {
        storeSlug,
        productName: offer.productName,
        offerPrice: offer.offerPrice,
      },
    });

    await supabase.removeChannel(channel);
  } catch (error) {
    logEvent('warn', 'scrape.broadcast.failed', { storeSlug, error: String(error) });
  }
}

// ---------------------------------------------------------------------------
// SINGLE STORE PROCESSING (shared by API and Playwright batches)
// ---------------------------------------------------------------------------

async function processStore(
  scraper: StoreScraper,
  storeIdMap: Map<string, string>,
  categorySlugMap: Map<string, string>,
  lowVolumeAlerts: LowVolumeAlert[],
  storeRunSummaries: StoreRunSummary[]
): Promise<'success' | 'fail'> {
  const storeId = storeIdMap.get(scraper.storeSlug);
  if (!storeId) {
    logEvent('error', 'scrape.store.missing', { storeSlug: scraper.storeSlug });
    return 'fail';
  }

  const startTime = Date.now();
  let offersFound = 0;
  let offersSaved = 0;
  let activeOffersBefore: number | null = null;

  try {
    logEvent('info', 'scrape.store.start', { storeSlug: scraper.storeSlug });
    await logScrapeRun(scraper.storeSlug, 'started', {});
    activeOffersBefore = await getActiveOffersCount(storeId);

    const offers = await scraper.scrape();
    offersFound = offers.length;
    if (offers.length === 0) {
      console.warn(`[${scraper.constructor.name}] 0 offers detected for ${scraper.storeSlug} — possible selector breakage`);
    }
    offersSaved = await processOffers(storeId, scraper.storeSlug, offers, categorySlugMap);

    const alert = buildLowVolumeAlert(scraper.storeSlug, offersFound, offersSaved);
    if (alert) {
      lowVolumeAlerts.push(alert);
      logEvent('warn', 'scrape.store.low_volume', alert);
    }

    const firstOffer = offers.find(isGoodOffer);
    if (firstOffer) {
      await broadcastNewOffer(scraper.storeSlug, firstOffer);
    }

    const duration = Date.now() - startTime;
    const activeOffersAfter = await getActiveOffersCount(storeId);
    const summary: StoreRunSummary = {
      storeSlug: scraper.storeSlug,
      offersFound,
      offersSaved,
      durationMs: duration,
      activeOffersBefore,
      activeOffersAfter,
      activeOffersDelta: activeOffersAfter - (activeOffersBefore ?? activeOffersAfter),
      status: 'completed',
    };

    await logScrapeRun(scraper.storeSlug, 'completed', {
      offers_found: offersFound,
      offers_saved: offersSaved,
      duration_ms: duration,
      run_summary: summary,
    });

    storeRunSummaries.push(summary);
    return 'success';
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    const duration = Date.now() - startTime;
    logEvent('error', 'scrape.store.failed', {
      storeSlug: scraper.storeSlug,
      error: errorMsg,
      durationMs: duration,
    });

    await logScrapeRun(scraper.storeSlug, 'failed', {
      offers_found: offersFound,
      offers_saved: offersSaved,
      error: errorMsg,
      duration_ms: duration,
      run_summary: {
        storeSlug: scraper.storeSlug,
        offersFound,
        offersSaved,
        durationMs: duration,
        activeOffersBefore,
        activeOffersAfter: null,
        activeOffersDelta: null,
        status: 'failed',
        error: errorMsg,
      },
    });

    storeRunSummaries.push({
      storeSlug: scraper.storeSlug,
      offersFound,
      offersSaved,
      durationMs: duration,
      activeOffersBefore,
      activeOffersAfter: null,
      activeOffersDelta: null,
      status: 'failed',
      error: errorMsg,
    });

    return 'fail';
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  logEvent('info', 'scrape.run.start');

  // Seed canonical categories
  const { error: categorySeedError } = await supabase
    .from('categories')
    .upsert(CANONICAL_CATEGORIES, { onConflict: 'slug' });

  if (categorySeedError) {
    throw new Error(`Failed to seed canonical categories: ${categorySeedError.message}`);
  }

  // Pre-fetch stores and categories
  const [storesResult, categoriesResult] = await Promise.all([
    supabase.from('stores').select('id, slug'),
    supabase.from('categories').select('id, slug'),
  ]);

  if (storesResult.error) throw new Error(`Failed to fetch stores: ${storesResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Failed to fetch categories: ${categoriesResult.error.message}`);

  const storeIdMap = new Map<string, string>(
    (storesResult.data ?? []).map((s) => [s.slug, s.id])
  );

  const categorySlugMap = new Map<string, string>(
    (categoriesResult.data ?? []).map((c) => [c.slug, c.id])
  );

  logEvent('info', 'scrape.prefetch.loaded', {
    stores: storeIdMap.size,
    categories: categorySlugMap.size,
  });

  // Initialize scrapers
  const scrapers: StoreScraper[] = [
    new JumboScraper(),        // API — VTEX Cencosud
    new TottusScraper(),       // API — VTEX Falabella
    new LiderScraper(),        // API — VTEX Walmart Chile
    new SantaIsabelScraper(),  // API — VTEX Cencosud
    new UnimarcScraper(),      // Playwright — SMU
  ];

  // Optional --store filter
  const args = process.argv.slice(2);
  const storeArg = args.indexOf('--store') !== -1 ? args[args.indexOf('--store') + 1] : null;
  const targetScrapers = storeArg
    ? scrapers.filter((s) => s.storeSlug === storeArg)
    : scrapers;

  let successCount = 0;
  let failCount = 0;
  const lowVolumeAlerts: LowVolumeAlert[] = [];
  const storeRunSummaries: StoreRunSummary[] = [];

  // Split by type: API scrapers run 3 at a time, Playwright runs 2 at a time
  const apiScrapers = targetScrapers.filter((s) => ['jumbo', 'lider', 'santa-isabel'].includes(s.storeSlug));
  const playwrightScrapers = targetScrapers.filter((s) => !['jumbo', 'lider', 'santa-isabel'].includes(s.storeSlug));

  // Process API scrapers (batch of 3)
  await runInBatches(apiScrapers, 3, async (scraper) => {
    const result = await processStore(scraper, storeIdMap, categorySlugMap, lowVolumeAlerts, storeRunSummaries);
    if (result === 'success') successCount++;
    else failCount++;
  });

  // Process Playwright scrapers (batch of 2, lower concurrency to save RAM)
  await runInBatches(playwrightScrapers, 2, async (scraper) => {
    const result = await processStore(scraper, storeIdMap, categorySlugMap, lowVolumeAlerts, storeRunSummaries);
    if (result === 'success') successCount++;
    else failCount++;
  });

  // Final summary
  logEvent('info', 'scrape.run.completed', { successCount, failCount, lowVolumeStores: lowVolumeAlerts.length });

  if (lowVolumeAlerts.length > 0) {
    logEvent('warn', 'scrape.run.low_volume_summary', { total: lowVolumeAlerts.length, stores: lowVolumeAlerts });
  }

  if (storeRunSummaries.length > 0) {
    logEvent('info', 'scrape.run.store_summary', { stores: storeRunSummaries });
  }

  // Invalidate cache
  await Promise.allSettled([
    invalidatePrefix('offers:list:'),
    invalidatePrefix('offers:store:'),
    invalidatePrefix('offers:detail:'),
    invalidatePrefix('stores:list'),
  ]);
  logEvent('info', 'scrape.cache.invalidated');

  // Exit codes
  const strictMode = process.argv.includes('--strict') || process.env.SCRAPE_STRICT === '1';
  if (strictMode && failCount > 0) process.exit(1);
  if (!strictMode && successCount === 0) process.exit(1);
}

main().catch((error) => {
  logEvent('error', 'scrape.run.crashed', { error: String(error) });
  process.exit(1);
});
