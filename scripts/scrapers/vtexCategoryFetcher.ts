import pLimit from 'p-limit';
import { RawOffer } from './types';

// ---------------------------------------------------------------------------
// VTEX Paginated Fetcher
//
// Shared logic for all VTEX-based stores (Jumbo, Tottus, Santa Isabel, Lider).
// Fetches products via broad paginated search sorted by best discount,
// deduplicating by productName. The categoryMapper handles classification
// based on the VTEX `categories` field in the response.
//
// Why not per-category fq filters? VTEX category tree IDs differ between
// stores (Cencosud vs Falabella vs Walmart) — broad fetch + categoryMapper
// is more reliable and works across all stores.
// ---------------------------------------------------------------------------

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
  /** Minimum products target. Default: 50 */
  minProducts?: number;
  /** Max pages to fetch. Default: 6 (300 products scanned) */
  maxPages?: number;
  /** Page size (VTEX max is 50). Default: 50 */
  pageSize?: number;
  /** Max concurrent page fetches. Default: 3 */
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

  if (!url) return '';

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
  from: number,
  to: number,
  referer: string,
  timeoutMs: number = 15_000
): Promise<any[]> {
  const url = `${cdnBase}/api/catalog_system/pub/products/search?O=OrderByBestDiscountDESC&_from=${from}&_to=${to}`;

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
 * Parses a single VTEX product into a RawOffer.
 * Returns null if the product has no valid discount.
 */
function parseProduct(
  product: any,
  config: VtexFetcherConfig,
  seenNames: Set<string>
): RawOffer | null {
  const item = product.items?.[0];
  const seller = item?.sellers?.[0]?.commertialOffer;
  if (!item || !seller) return null;

  const offerPrice: number = seller.Price;
  const originalPrice: number = seller.ListPrice;
  if (!offerPrice || offerPrice === 0 || offerPrice >= originalPrice) return null;

  // Dedup by product name
  const nameKey = (product.productName || '').trim().toLowerCase();
  if (!nameKey || seenNames.has(nameKey)) return null;
  seenNames.add(nameKey);

  const pathPrefix = config.pathPrefix || '';
  const linkText: string = product.linkText || '';
  const offerUrl = linkText
    ? `${config.siteBase}${pathPrefix}/${linkText}/p`
    : `${config.siteBase}${pathPrefix}/ofertas`;

  // Extract first-level category from VTEX categories array
  // Format: ["/Despensa/Aceites/", "/Despensa/"]
  const categoryRaw: string =
    product.categories?.[0]?.replace(/^\/|\/$/g, '').split('/')[0] ?? null;

  return {
    productName: product.productName,
    brand: product.brand || null,
    imageUrl: bestImageUrl(item),
    offerUrl,
    offerPrice,
    originalPrice,
    categoryHint: categoryRaw,
  };
}

/**
 * Main entry point: fetches products via broad paginated search,
 * sorted by best discount. Deduplicates by productName.
 * Categories are resolved later by categoryMapper in scrapeAll.ts.
 *
 * Strategy:
 * 1. Fetch pages concurrently (p-limit controlled)
 * 2. Parse and dedup products
 * 3. Stop early once we hit minProducts or exhaust pages
 */
export async function fetchVtexMultiCategory(
  config: VtexFetcherConfig
): Promise<RawOffer[]> {
  const minProducts = config.minProducts || 50;
  const maxPages = config.maxPages || 6;
  const pageSize = config.pageSize || 50;
  const concurrency = config.concurrency || 3;
  const limit = pLimit(concurrency);
  const seenNames = new Set<string>();
  const allOffers: RawOffer[] = [];

  console.log(`[${config.logTag}] Fetching up to ${maxPages} pages × ${pageSize} products (concurrency: ${concurrency})...`);

  // Build page requests
  const pageRequests = Array.from({ length: maxPages }, (_, i) => i);

  // Fetch pages with concurrency control
  const results = await Promise.allSettled(
    pageRequests.map((page) =>
      limit(async () => {
        // If we already have enough, skip
        if (allOffers.length >= minProducts && page > 1) return [];

        const from = page * pageSize;
        const to = from + pageSize - 1;

        try {
          const products = await fetchPage(config.cdnBase, from, to, config.referer);

          if (!products.length) {
            console.log(`[${config.logTag}] Reached end at page ${page} (${allOffers.length} total).`);
            return [];
          }

          const pageOffers: RawOffer[] = [];
          for (const product of products) {
            try {
              const offer = parseProduct(product, config, seenNames);
              if (offer) pageOffers.push(offer);
            } catch {
              // Skip individual product parse errors
            }
          }

          console.log(`[${config.logTag}] Page ${page + 1}: +${pageOffers.length} offers from ${products.length} products`);
          return pageOffers;
        } catch (error: any) {
          console.warn(`[${config.logTag}] Page ${page} fetch failed: ${error.message}`);
          return [];
        }
      })
    )
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allOffers.push(...result.value);
    }
  }

  console.log(`[${config.logTag}] ✅ Total: ${allOffers.length} offers.`);
  return allOffers;
}
