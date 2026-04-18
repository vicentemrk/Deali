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
import { invalidatePrefix } from '../src/lib/cache';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MIN_SCRAPE_LIMIT = 25;
const MAX_SCRAPE_LIMIT = 75;

const DEFAULT_ALERT_MIN_OFFERS: Record<string, number> = {
  jumbo: 25,
  'santa-isabel': 30,
  lider: 25,
  tottus: 15,
  unimarc: 25,
  acuenta: 20,
};

type LowVolumeAlert = {
  storeSlug: string;
  offersFound: number;
  offersSaved: number;
  threshold: number;
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

function parseScrapeLimit(): number {
  const configured = Number.parseInt(process.env.SCRAPE_LIMIT || `${MAX_SCRAPE_LIMIT}`, 10);
  if (Number.isNaN(configured)) {
    return MAX_SCRAPE_LIMIT;
  }

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
  
  // If we have NO good offers after filtering, return empty (data quality issue)
  if (filteredOffers.length === 0) {
    return [];
  }
  
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
  if (missing > 0) {
    selected.push(...remainder.slice(0, missing));
  }

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// BATCH PROCESSING
// ~5 queries por tienda total (vs N×5 anterior)
// ---------------------------------------------------------------------------

async function processOffers(
  storeId: string,
  storeSlug: string,
  offers: RawOffer[],
  categorySlugMap: Map<string, string>  // slug → UUID precargado al inicio
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

  // ── Step 1: Fetch all existing products for this store in 1 query ──────
  const { data: existingProducts, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, image_url, category_id')
    .eq('store_id', storeId);

  if (fetchErr) throw new Error(`[${storeSlug}] Failed to fetch products: ${fetchErr.message}`);

  const productMap = new Map<string, { id: string; category_id: string | null }>(
    (existingProducts ?? []).map((p) => [normalizeOfferKey(p.name), { id: p.id, category_id: p.category_id }])
  );

  // ── Step 2: Split new vs existing products ─────────────────────────────
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

  // ── Step 2.5: Update images on existing products if we have a new/better image ──────
  const imageUpdates = existing
    .filter(({ id, offer }) => offer.imageUrl) // Only if new offer has image
    .map(({ id, offer }) => ({
      id,
      image_url: offer.imageUrl,
      existingProduct: existingProducts?.find((p) => p.id === id),
    }))
    .filter(({ existingProduct, image_url }) => {
      // Update if: no existing image, or existing is null/empty, or new is different
      return !existingProduct?.image_url || existingProduct.image_url !== image_url;
    })
    .map(({ id, image_url }) => ({ id, image_url }));

  if (imageUpdates.length > 0) {
    // Supabase doesn't support batch update by different PKs in one call,
    // so we use Promise.allSettled with individual updates (typically < 20)
    const imageUpdateResults = await Promise.allSettled(
      imageUpdates.map(async ({ id, image_url }) => {
        const { error } = await supabase.from('products').update({ image_url }).eq('id', id);
        if (error) {
          throw new Error(`image update failed for product ${id}: ${error.message}`);
        }
      })
    );
    logSettledFailures(storeSlug, 'scrape.products.backfill_images_failed', imageUpdateResults);
    logEvent('info', 'scrape.products.backfill_images', { storeSlug, count: imageUpdates.length });
  }

  // Backfill category_id on existing products when normalization changed
  const categoryUpdates = existing
    .map(({ id, offer }) => {
      const categorySlug = mapCategory(offer.categoryHint);
      const categoryId = categorySlugMap.get(categorySlug);
      if (!categoryId) return null;
      const prevCategoryId = (existingProducts ?? []).find((p) => p.id === id)?.category_id ?? null;
      if (prevCategoryId === categoryId) return null;
      return { id, category_id: categoryId };
    })
    .filter((item): item is { id: string; category_id: string } => item != null);

  if (categoryUpdates.length > 0) {
    const categoryUpdateResults = await Promise.allSettled(
      categoryUpdates.map(async ({ id, category_id }) => {
        const { error } = await supabase.from('products').update({ category_id }).eq('id', id);
        if (error) {
          throw new Error(`category update failed for product ${id}: ${error.message}`);
        }
      })
    );
    logSettledFailures(storeSlug, 'scrape.products.normalize_categories_failed', categoryUpdateResults);
    logEvent('info', 'scrape.products.normalize_categories', { storeSlug, count: categoryUpdates.length });
  }

  // ── Step 3: Batch insert new products con categoría resuelta ──────────
  let newProductIds: { id: string; name: string }[] = [];
  if (toInsert.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from('products')
      .insert(
        toInsert.map((o) => {
          const categorySlug = mapCategory(o.categoryHint);
          const categoryId   = categorySlugMap.get(categorySlug) ?? null;
          return {
            name:        o.productName,
            brand:       o.brand,
            image_url:   o.imageUrl,
            store_id:    storeId,
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

  const now        = new Date();
  const today      = now.toISOString().split('T')[0];
  const endDateStr = '9999-12-31';

  // ── Step 4: Batch upsert offers (1 query) ─────────────────────────────
  // onConflict = product_id assumes one active offer row per product.
  const offersPayload = allProductIds.map(({ id: productId, offer }) => {
    const discountPct = calculateDiscountPct(offer.offerPrice, offer.originalPrice).toFixed(2);
    return {
      product_id:     productId,
      original_price: offer.originalPrice,
      offer_price:    offer.offerPrice,
      discount_pct:   discountPct,
      offer_url:      offer.offerUrl,
      start_date:     today,
      end_date:       endDateStr,
      is_active:      true,
      scraped_at:     now.toISOString(),
    };
  });

  const { error: upsertErr } = await supabase
    .from('offers')
    .upsert(offersPayload, { onConflict: 'product_id' });

  if (upsertErr) {
    logEvent('error', 'scrape.offers.upsert_failed', { storeSlug, error: upsertErr.message });
  }

  // ── Step 5: Price history deduplicada vía RPC ─────────────────────────
  const priceHistoryResults = await Promise.allSettled(
    allProductIds.map(async ({ id: productId, offer }) => {
      const { error } = await supabase.rpc('insert_price_if_changed', {
        p_product_id: productId,
        p_price:      offer.offerPrice,
      });

      if (error) {
        throw new Error(`price history rpc failed for product ${productId}: ${error.message}`);
      }
    })
  );
  logSettledFailures(storeSlug, 'scrape.price_history.rpc_failed', priceHistoryResults);

  logEvent('info', 'scrape.process.completed', {
    storeSlug,
    updatedProducts: existing.length,
    newProducts: newProductIds.length,
  });
  
  return allProductIds.length;
}

// ---------------------------------------------------------------------------
// LOGGING
// ---------------------------------------------------------------------------

async function logScrapeRun(
  storeSlug: string,
  status: 'started' | 'completed' | 'failed',
  metadata: {
    offers_found?: number;
    offers_saved?: number;
    error?: string;
    duration_ms?: number;
  }
) {
  try {
    if (status === 'started') {
      const { error } = await supabase.from('scrape_logs').insert({
        store_slug: storeSlug,
        started_at: new Date().toISOString(),
      });
      if (error) console.warn(`[LoggingError] Failed to log start: ${error.message}`);
    } else {
      const { error } = await supabase
        .from('scrape_logs')
        .update({
          finished_at: new Date().toISOString(),
          offers_found: metadata.offers_found ?? 0,
          offers_saved: metadata.offers_saved ?? 0,
          error: metadata.error ?? null,
          run_duration_ms: metadata.duration_ms ?? 0,
        })
        .eq('store_slug', storeSlug)
        .is('finished_at', null)
        .order('started_at', { ascending: false })
        .limit(1);
      if (error) console.warn(`[LoggingError] Failed to log completion: ${error.message}`);
    }
  } catch (err) {
    logEvent('warn', 'scrape.log.failed', { storeSlug, status, error: String(err) });
  }
}

// ---------------------------------------------------------------------------
// BROWSER POOL — batches de 2 para no reventar la RAM del runner de CI
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
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  logEvent('info', 'scrape.run.start');

  // Garantiza categorías canónicas para que la normalización no caiga en "General"
  const { error: categorySeedError } = await supabase
    .from('categories')
    .upsert(CANONICAL_CATEGORIES, { onConflict: 'slug' });

  if (categorySeedError) {
    throw new Error(`Failed to seed canonical categories: ${categorySeedError.message}`);
  }

  // ── Pre-fetch global: stores y categories (1 query cada uno) ──────────
  const [storesResult, categoriesResult] = await Promise.all([
    supabase.from('stores').select('id, slug'),
    supabase.from('categories').select('id, slug'),
  ]);

  if (storesResult.error) throw new Error(`Failed to fetch stores: ${storesResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Failed to fetch categories: ${categoriesResult.error.message}`);

  const storeIdMap = new Map<string, string>(
    (storesResult.data ?? []).map((s) => [s.slug, s.id])
  );

  // categorySlugMap: slug → UUID (ej. 'lacteos' → 'uuid-xxx')
  const categorySlugMap = new Map<string, string>(
    (categoriesResult.data ?? []).map((c) => [c.slug, c.id])
  );

  logEvent('info', 'scrape.prefetch.loaded', {
    stores: storeIdMap.size,
    categories: categorySlugMap.size,
  });

  const scrapers: StoreScraper[] = [
    new JumboScraper(),        // API — VTEX Cencosud
    new TottusScraper(),       // API — VTEX Falabella (migrado de Playwright)
    new LiderScraper(),        // API — VTEX Walmart Chile (Cloudflare: graceful fallback)
    new SantaIsabelScraper(),  // API — VTEX Cencosud
    new UnimarcScraper(),      // Playwright — SMU (networkidle + scroll)
    // new AcuentaScraper(),   // TODO: Playwright — SMU (demasiado lentitud del sitio, requiere optimización)
  ];

  // Filtro opcional por --store flag
  const args      = process.argv.slice(2);
  const storeArg  = args.indexOf('--store') !== -1 ? args[args.indexOf('--store') + 1] : null;
  const targetScrapers = storeArg
    ? scrapers.filter((s) => s.storeSlug === storeArg)
    : scrapers;

  let successCount = 0;
  let failCount    = 0;
  const lowVolumeAlerts: LowVolumeAlert[] = [];

  const apiScrapers = targetScrapers.filter((scraper) =>
    ['jumbo', 'lider', 'santa-isabel'].includes(scraper.storeSlug)
  );
  const playwrightScrapers = targetScrapers.filter((scraper) =>
    !['jumbo', 'lider', 'santa-isabel'].includes(scraper.storeSlug)
  );

  await runInBatches(apiScrapers, 3, async (scraper) => {
    const storeId = storeIdMap.get(scraper.storeSlug);
    if (!storeId) {
      logEvent('error', 'scrape.store.missing', { storeSlug: scraper.storeSlug });
      failCount++;
      return;
    }

    const startTime = Date.now();
    let offersFound = 0;
    let offersSaved = 0;
    let errorMsg: string | undefined;

    try {
      logEvent('info', 'scrape.store.start', { storeSlug: scraper.storeSlug });
      await logScrapeRun(scraper.storeSlug, 'started', {});

      const offers = await scraper.scrape();
      offersFound = offers.length;
      if (offers.length === 0) {
        console.warn(`[${scraper.constructor.name}] 0 offers detected for ${scraper.storeSlug} — possible selector breakage`);
      }
      offersSaved = await processOffers(storeId, scraper.storeSlug, offers, categorySlugMap);

      const threshold = resolveAlertThreshold(scraper.storeSlug);
      if (offersFound < threshold) {
        const alert: LowVolumeAlert = {
          storeSlug: scraper.storeSlug,
          offersFound,
          offersSaved,
          threshold,
        };
        lowVolumeAlerts.push(alert);
        logEvent('warn', 'scrape.store.low_volume', alert);
      }

      const firstOffer = offers.find(isGoodOffer);
      if (firstOffer) {
        await broadcastNewOffer(scraper.storeSlug, firstOffer);
      }

      const duration = Date.now() - startTime;
      await logScrapeRun(scraper.storeSlug, 'completed', {
        offers_found: offersFound,
        offers_saved: offersSaved,
        duration_ms: duration,
      });

      successCount++;
    } catch (err: any) {
      failCount++;
      errorMsg = err.message || String(err);
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
      });
    }
  });

  await runInBatches(playwrightScrapers, 2, async (scraper) => {
    const storeId = storeIdMap.get(scraper.storeSlug);
    if (!storeId) {
      logEvent('error', 'scrape.store.missing', { storeSlug: scraper.storeSlug });
      failCount++;
      return;
    }

    const startTime = Date.now();
    let offersFound = 0;
    let offersSaved = 0;
    let errorMsg: string | undefined;

    try {
      logEvent('info', 'scrape.store.start', { storeSlug: scraper.storeSlug });
      await logScrapeRun(scraper.storeSlug, 'started', {});
      
      const offers = await scraper.scrape();
      offersFound = offers.length;
      if (offers.length === 0) {
        console.warn(`[${scraper.constructor.name}] 0 offers detected for ${scraper.storeSlug} — possible selector breakage`);
      }
      offersSaved = await processOffers(storeId, scraper.storeSlug, offers, categorySlugMap);

      const threshold = resolveAlertThreshold(scraper.storeSlug);
      if (offersFound < threshold) {
        const alert: LowVolumeAlert = {
          storeSlug: scraper.storeSlug,
          offersFound,
          offersSaved,
          threshold,
        };
        lowVolumeAlerts.push(alert);
        logEvent('warn', 'scrape.store.low_volume', alert);
      }

      const firstOffer = offers.find(isGoodOffer);
      if (firstOffer) {
        await broadcastNewOffer(scraper.storeSlug, firstOffer);
      }
      
      const duration = Date.now() - startTime;
      await logScrapeRun(scraper.storeSlug, 'completed', {
        offers_found: offersFound,
        offers_saved: offersSaved,
        duration_ms: duration,
      });
      
      successCount++;
    } catch (err: any) {
      failCount++;
      errorMsg = err.message || String(err);
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
      });
    }
  });

  logEvent('info', 'scrape.run.completed', {
    successCount,
    failCount,
    lowVolumeStores: lowVolumeAlerts.length,
  });

  if (lowVolumeAlerts.length > 0) {
    logEvent('warn', 'scrape.run.low_volume_summary', {
      total: lowVolumeAlerts.length,
      stores: lowVolumeAlerts,
    });
  }

  await Promise.allSettled([
    invalidatePrefix('offers:list:'),
    invalidatePrefix('offers:store:'),
    invalidatePrefix('offers:detail:'),
    invalidatePrefix('stores:list'),
  ]);
  logEvent('info', 'scrape.cache.invalidated');

  const strictMode = process.argv.includes('--strict') || process.env.SCRAPE_STRICT === '1';
  if (strictMode && failCount > 0) {
    process.exit(1);
  }

  if (!strictMode && successCount === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  logEvent('error', 'scrape.run.crashed', { error: String(error) });
  process.exit(1);
});
