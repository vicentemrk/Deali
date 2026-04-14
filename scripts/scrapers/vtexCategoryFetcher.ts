import pLimit from 'p-limit';
import { RawOffer } from './types';

// ---------------------------------------------------------------------------
// VTEX Multi-Category Fetcher
//
// Shared logic for all VTEX-based stores (Jumbo, Tottus, Santa Isabel, Lider).
// Fetches products across priority categories in parallel with concurrency
// limiting, deduplicating by productName. Guarantees 50+ products per store
// by fetching from multiple category facets before falling back to "all offers".
// ---------------------------------------------------------------------------

/** VTEX category filter — matches fq param in the search API */
export interface VtexCategoryFilter {
  /** Human-readable label for logging */
  label: string;
  /** fq parameter value (VTEX facet). Empty string = no fq (all products) */
  fq: string;
}

/**
 * Priority categories (Chilean supermarket VTEX standard).
 * Order matters — first categories get fetched first.
 * The "Oferta" filter is removed so we find products even without that spec.
 * We sort by best discount to prioritize actual deals.
 */
export const PRIORITY_CATEGORIES: VtexCategoryFilter[] = [
  // ── Top priority (high-volume everyday categories) ─────────────────────
  { label: 'Despensa',          fq: 'C:/Despensa/' },
  { label: 'Lácteos',           fq: 'C:/Lácteos/' },
  { label: 'Bebidas',           fq: 'C:/Bebidas/' },
  { label: 'Aseo del Hogar',    fq: 'C:/Aseo del Hogar/' },
  // ── Medium priority ────────────────────────────────────────────────────
  { label: 'Carnes y Aves',     fq: 'C:/Carnes y Aves/' },
  { label: 'Congelados',        fq: 'C:/Congelados/' },
  { label: 'Snacks',            fq: 'C:/Snacks/' },
  { label: 'Higiene Personal',  fq: 'C:/Higiene Personal/' },
  { label: 'Frutas y Verduras', fq: 'C:/Frutas y Verduras/' },
  { label: 'Panadería',         fq: 'C:/Panadería/' },
  // ── Lower demand but present in DB ─────────────────────────────────────
  { label: 'Mascotas',          fq: 'C:/Mascotas/' },
  { label: 'Bebé e Infantil',   fq: 'C:/Bebé e Infantil/' },
  { label: 'Electrohogar',      fq: 'C:/Electrohogar/' },
];

/** Fallback: global offers (original approach) */
export const OFFERS_FILTER: VtexCategoryFilter = {
  label: 'Ofertas',
  fq: 'specificationFilter_40:Oferta',
};

export interface VtexFetcherConfig {
  /** VTEX CDN base, e.g. 'https://jumbo.vteximg.com.br' */
  cdnBase: string;
  /** Real site base for product URLs, e.g. 'https://www.jumbo.cl' */
  siteBase: string;
  /** URL path prefix between siteBase and linkText, e.g. '' or '/supermercado' */
  pathPrefix?: string;
  /** Referer header value */
  referer: string;
  /** Scraper name for logging */
  logTag: string;
  /** Minimum products before stopping. Default: 50 */
  minProducts?: number;
  /** Max pages per category. Default: 2 (100 products per category) */
  maxPagesPerCategory?: number;
  /** Page size (VTEX max is 50). Default: 50 */
  pageSize?: number;
  /** Max concurrent category fetches. Default: 3 */
  concurrency?: number;
}

/**
 * Best image URL from a VTEX item.
 * Prefers larger image variants; VTEX URLs often have dimension suffixes.
 * Returns the highest-quality URL available.
 */
function bestImageUrl(item: any): string {
  const images: any[] = item.images || [];
  if (!images.length) return '';

  // VTEX images contain imageUrl like:
  //   https://jumbo.vteximg.com.br/arquivos/ids/123456-1000-1000/product.jpg
  // The -WxH suffix controls dimensions. We want the largest.
  const url: string = images[0]?.imageUrl || '';

  // If URL has a dimension suffix, replace it with a larger one
  // Pattern: /ids/XXXXX-WxH/ → /ids/XXXXX-600-600/
  const upgraded = url.replace(
    /\/ids\/(\d+)-\d+-\d+\//,
    '/ids/$1-600-600/'
  );

  return upgraded || url;
}

/**
 * Fetches a single page from the VTEX catalog API.
 */
async function fetchPage(
  cdnBase: string,
  fq: string,
  from: number,
  to: number,
  referer: string,
  timeoutMs: number = 15_000
): Promise<any[]> {
  const params = new URLSearchParams({
    O: 'OrderByBestDiscountDESC',
    _from: String(from),
    _to: String(to),
  });

  // fq can have multiple values separated by &fq=
  if (fq) {
    params.append('fq', fq);
  }

  const url = `${cdnBase}/api/catalog_system/pub/products/search?${params}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: referer,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches all products from a single VTEX category filter, paginating
 * until empty page or maxPages.
 */
async function fetchCategory(
  config: VtexFetcherConfig,
  filter: VtexCategoryFilter,
  seenNames: Set<string>
): Promise<RawOffer[]> {
  const pageSize = config.pageSize || 50;
  const maxPages = config.maxPagesPerCategory || 2;
  const offers: RawOffer[] = [];
  const pathPrefix = config.pathPrefix || '';

  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const to   = from + pageSize - 1;

    try {
      const products = await fetchPage(config.cdnBase, filter.fq, from, to, config.referer);

      if (!products.length) break;

      for (const product of products) {
        try {
          const item   = product.items?.[0];
          const seller = item?.sellers?.[0]?.commertialOffer;
          if (!item || !seller) continue;

          const offerPrice: number    = seller.Price;
          const originalPrice: number = seller.ListPrice;
          if (!offerPrice || offerPrice === 0 || offerPrice >= originalPrice) continue;

          // Dedup across categories
          const nameKey = (product.productName || '').trim().toLowerCase();
          if (seenNames.has(nameKey)) continue;
          seenNames.add(nameKey);

          const linkText: string = product.linkText || '';
          const offerUrl = linkText
            ? `${config.siteBase}${pathPrefix}/${linkText}/p`
            : `${config.siteBase}${pathPrefix}/ofertas`;

          // Extract full category path from VTEX
          const categoryRaw: string =
            product.categories?.[0]?.replace(/^\/|\/$/g, '').split('/')[0] ?? null;

          offers.push({
            productName:  product.productName,
            brand:        product.brand || null,
            imageUrl:     bestImageUrl(item),
            offerUrl,
            offerPrice,
            originalPrice,
            categoryHint: categoryRaw,
          });
        } catch (err: any) {
          // Skip individual product parse errors
        }
      }

      // Small delay between pages
      if (page < maxPages - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (error: any) {
      console.warn(`[${config.logTag}] ${filter.label} page ${page} failed: ${error.message}`);
      break;
    }
  }

  return offers;
}

/**
 * Main entry point: fetches products across priority categories in parallel,
 * with p-limit concurrency control. Deduplicates by productName.
 *
 * Strategy:
 * 1. Fetch priority categories in parallel (limited concurrency)
 * 2. If still under minProducts, fetch from global "Ofertas" filter
 * 3. Return deduplicated results
 */
export async function fetchVtexMultiCategory(
  config: VtexFetcherConfig
): Promise<RawOffer[]> {
  const minProducts = config.minProducts || 50;
  const concurrency = config.concurrency || 3;
  const limit = pLimit(concurrency);
  const seenNames = new Set<string>();
  const allOffers: RawOffer[] = [];

  console.log(`[${config.logTag}] Fetching ${PRIORITY_CATEGORIES.length} priority categories (concurrency: ${concurrency})...`);

  // ── Phase 1: Priority categories in parallel ────────────────────────────
  const categoryResults = await Promise.allSettled(
    PRIORITY_CATEGORIES.map((filter) =>
      limit(async () => {
        const offers = await fetchCategory(config, filter, seenNames);
        if (offers.length > 0) {
          console.log(`[${config.logTag}] ${filter.label}: +${offers.length} products`);
        }
        return offers;
      })
    )
  );

  for (const result of categoryResults) {
    if (result.status === 'fulfilled') {
      allOffers.push(...result.value);
    }
  }

  console.log(`[${config.logTag}] After priority categories: ${allOffers.length} products`);

  // ── Phase 2: Fallback to global "Ofertas" if under target ───────────────
  if (allOffers.length < minProducts) {
    console.log(`[${config.logTag}] Under ${minProducts} — fetching global Ofertas...`);
    const fallbackOffers = await fetchCategory(
      { ...config, maxPagesPerCategory: 4 },
      OFFERS_FILTER,
      seenNames
    );
    allOffers.push(...fallbackOffers);
    console.log(`[${config.logTag}] After fallback: ${allOffers.length} products`);
  }

  console.log(`[${config.logTag}] ✅ Total: ${allOffers.length} offers.`);
  return allOffers;
}
