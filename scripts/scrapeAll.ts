import { createClient } from '@supabase/supabase-js';
import { JumboScraper } from './scrapers/jumboScraper';
import { LiderScraper } from './scrapers/liderScraper';
import { UnimarcScraper } from './scrapers/unimarcScraper';
import { AcuentaScraper } from './scrapers/acuentaScraper';
import { TottusScraper } from './scrapers/tottusScraper';
import { SantaIsabelScraper } from './scrapers/santaIsabelScraper';
import { StoreScraper, RawOffer } from './scrapers/types';
import { mapCategory } from './lib/categoryMapper';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MAX_OFFERS_PER_STORE = 10;

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

function selectOffersForTest(rawOffers: RawOffer[]): RawOffer[] {
  const chosenByCategory = new Map<string, RawOffer>();
  const remainder: RawOffer[] = [];

  for (const offer of rawOffers) {
    const categorySlug = mapCategory(offer.categoryHint);
    if (!chosenByCategory.has(categorySlug)) {
      chosenByCategory.set(categorySlug, offer);
    } else {
      remainder.push(offer);
    }
  }

  const selected = [...chosenByCategory.values()];
  const missing = MAX_OFFERS_PER_STORE - selected.length;
  if (missing > 0) {
    selected.push(...remainder.slice(0, missing));
  }

  return selected.slice(0, MAX_OFFERS_PER_STORE);
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
) {
  const targetOffers = selectOffersForTest(offers);

  if (targetOffers.length === 0) {
    console.log(`[${storeSlug}] No offers to process.`);
    return;
  }

  console.log(`[${storeSlug}] Processing ${targetOffers.length}/${offers.length} offers...`);

  // ── Step 1: Fetch all existing products for this store in 1 query ──────
  const { data: existingProducts, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, image_url, category_id')
    .eq('store_id', storeId);

  if (fetchErr) throw new Error(`[${storeSlug}] Failed to fetch products: ${fetchErr.message}`);

  const productMap = new Map<string, { id: string; category_id: string | null }>(
    (existingProducts ?? []).map((p) => [p.name.trim().toLowerCase(), { id: p.id, category_id: p.category_id }])
  );

  // Track existing products with no image so we can backfill
  const productsMissingImage = new Map<string, string>( // id → name key
    (existingProducts ?? [])
      .filter((p) => !p.image_url)
      .map((p) => [p.id, p.name.trim().toLowerCase()])
  );

  // ── Step 2: Split new vs existing products ─────────────────────────────
  const toInsert: typeof offers = [];
  const existing: { id: string; offer: RawOffer }[] = [];

  for (const offer of targetOffers) {
    const key = offer.productName.trim().toLowerCase();
    const existingProduct = productMap.get(key);
    if (existingProduct) {
      existing.push({ id: existingProduct.id, offer });
    } else {
      toInsert.push(offer);
    }
  }

  // ── Step 2.5: Backfill images on existing products that have none ──────
  const imageUpdates = existing
    .filter(({ id, offer }) => productsMissingImage.has(id) && offer.imageUrl)
    .map(({ id, offer }) => ({ id, image_url: offer.imageUrl }));

  if (imageUpdates.length > 0) {
    // Supabase doesn't support batch update by different PKs in one call,
    // so we use Promise.allSettled with individual updates (typically < 20)
    await Promise.allSettled(
      imageUpdates.map(({ id, image_url }) =>
        supabase.from('products').update({ image_url }).eq('id', id)
      )
    );
    console.log(`[${storeSlug}] 🖼 Backfilled images on ${imageUpdates.length} products`);
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
    await Promise.allSettled(
      categoryUpdates.map(({ id, category_id }) =>
        supabase.from('products').update({ category_id }).eq('id', id)
      )
    );
    console.log(`[${storeSlug}] 🧭 Normalized categories on ${categoryUpdates.length} products`);
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
      offer: toInsert.find(
        (o) => o.productName.trim().toLowerCase() === p.name.trim().toLowerCase()
      )!,
    })),
  ].filter((x) => x.offer != null);

  if (allProductIds.length === 0) return;

  const now        = new Date();
  const today      = now.toISOString().split('T')[0];
  const endDateStr = '9999-12-31';

  // ── Step 4: Batch upsert offers (1 query) ─────────────────────────────
  const offersPayload = allProductIds.map(({ id: productId, offer }) => {
    const discountPct =
      offer.originalPrice > offer.offerPrice
        ? (((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100).toFixed(2)
        : '0.00';
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
    console.error(`[${storeSlug}] Batch offer upsert failed: ${upsertErr.message}`);
  }

  // ── Step 5: Price history deduplicada vía RPC ─────────────────────────
  await Promise.allSettled(
    allProductIds.map(({ id: productId, offer }) =>
      supabase.rpc('insert_price_if_changed', {
        p_product_id: productId,
        p_price:      offer.offerPrice,
      })
    )
  );

  console.log(
    `[${storeSlug}] ✅ Done — ${existing.length} updated, ${newProductIds.length} new products`
  );
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

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log('[ScrapeAll] Iniciando...');

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

  console.log(`[ScrapeAll] ${storeIdMap.size} stores, ${categorySlugMap.size} categories loaded.`);

  const scrapers: StoreScraper[] = [
    new JumboScraper(),        // API — VTEX Cencosud
    new TottusScraper(),       // API — VTEX Falabella (migrado de Playwright)
    new LiderScraper(),        // API — VTEX Walmart Chile (Cloudflare: graceful fallback)
    new SantaIsabelScraper(),  // API — VTEX Cencosud
    new UnimarcScraper(),      // Playwright — SMU (networkidle + scroll)
    new AcuentaScraper(),      // Playwright — SMU (networkidle + multi-category)
  ];

  // Filtro opcional por --store flag
  const args      = process.argv.slice(2);
  const storeArg  = args.indexOf('--store') !== -1 ? args[args.indexOf('--store') + 1] : null;
  const targetScrapers = storeArg
    ? scrapers.filter((s) => s.storeSlug === storeArg)
    : scrapers;

  let successCount = 0;
  let failCount    = 0;

  // Los scrapers API (Jumbo, Líder, SantaIsabel) son ligeros — pueden correr en batch de 3.
  // Los de Playwright consumen ~400-600MB RAM cada uno — max 2 simultáneos.
  // Orden en el array: primero los 3 de API, luego los 3 de Playwright.
  // runInBatches(×, 2) ya garantiza el límite.
  await runInBatches(targetScrapers, 2, async (scraper) => {
    const storeId = storeIdMap.get(scraper.storeSlug);
    if (!storeId) {
      console.error(`[ScrapeAll] Store not found in DB: ${scraper.storeSlug}`);
      failCount++;
      return;
    }

    try {
      console.log(`\n[ScrapeAll] → Scraping ${scraper.storeSlug}...`);
      const offers = await scraper.scrape();
      await processOffers(storeId, scraper.storeSlug, offers, categorySlugMap);
      successCount++;
    } catch (err: any) {
      failCount++;
      console.error(`[ScrapeAll] ✗ ${scraper.storeSlug} failed: ${err.message}`);
    }
  });

  console.log(
    `\n[ScrapeAll] Completo: ${successCount} exitosos, ${failCount} fallidos.`
  );

  const strictMode = process.argv.includes('--strict') || process.env.SCRAPE_STRICT === '1';
  if (strictMode && failCount > 0) {
    process.exit(1);
  }

  if (!strictMode && successCount === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[ScrapeAll Global Error] ${error}`);
  process.exit(1);
});
