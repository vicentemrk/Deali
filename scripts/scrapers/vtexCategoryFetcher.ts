import { RawOffer } from './types';
import {
  getHostFromUrl,
  getRetryAttempts,
  recordHostFailure,
  recordHostSuccess,
  shouldRetryHttpStatus,
  shouldShortCircuitHost,
  sleepWithBackoff,
} from '../lib/httpResilience';

// ---------------------------------------------------------------------------
// VTEX Paginated Fetcher — shared logic for Jumbo, Santa Isabel, Lider.
//
// Core behavior:
//   - Tries configurable fq filter strategies in order.
//   - Fetches sequentially so early-exit works deterministically.
//   - Logs raw vs discounted per page for fast diagnosis.
// ---------------------------------------------------------------------------

export interface VtexFetcherConfig {
  /** VTEX CDN base, e.g. 'https://jumbo.vteximg.com.br' */
  cdnBase: string;
  /** Optional fallback bases when the primary endpoint returns 404/blocked */
  fallbackBases?: string[];
  /** Real site base for product URLs, e.g. 'https://www.jumbo.cl' */
  siteBase: string;
  /** URL path prefix between siteBase and linkText, e.g. '' or '/supermercado' */
  pathPrefix?: string;
  /** Referer header value */
  referer: string;
  /** Scraper name for logging */
  logTag: string;
  /** Minimum products target. Default: 80 */
  minProducts?: number;
  /** Max pages per strategy. Default: 6 (300 products scanned) */
  maxPages?: number;
  /** Page size (VTEX max is 50). Default: 50 */
  pageSize?: number;
  /** Delay between pages to reduce throttling. Default: 300ms */
  pageDelayMs?: number;
  /** Compatibility option for callers that still pass concurrency. */
  concurrency?: number;
  /** Filter strategies to try in order. */
  fqFilters?: string[];
  /** Optional extra request headers, e.g. Cookie for anti-bot sessions */
  extraHeaders?: Record<string, string>;
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
  bases: string[],
  fqFilter: string,
  from: number,
  to: number,
  referer: string,
  extraHeaders: Record<string, string> = {},
  logTag: string,
  timeoutMs: number = 18_000
): Promise<any[]> {
  const fqParam = fqFilter ? `&${fqFilter}` : '';
  const retryAttempts = getRetryAttempts();

  for (const base of bases) {
    const url = `${base}/api/catalog_system/pub/products/search?O=OrderByBestDiscountDESC${fqParam}&_from=${from}&_to=${to}`;
    const host = getHostFromUrl(url);
    const circuit = shouldShortCircuitHost(host);

    if (circuit.blocked) {
      console.warn(
        `[${logTag}] Circuit open for ${host}, skipping ${base} for ${Math.ceil(
          circuit.retryInMs / 1000
        )}s.`
      );
      continue;
    }

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
              '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'es-CL,es;q=0.9',
            Referer: referer,
            ...extraHeaders,
          },
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          const retryable = shouldRetryHttpStatus(response.status);
          const isLastAttempt = attempt >= retryAttempts;

          if (!retryable || isLastAttempt) {
            const failure = recordHostFailure(host);
            if (failure.tripped) {
              console.warn(`[${logTag}] Circuit tripped for ${host} after repeated failures.`);
            }
            console.warn(`[${logTag}] HTTP ${response.status} @ ${base} (filter: "${fqFilter || 'none'}")`);
            break;
          }

          console.warn(
            `[${logTag}] HTTP ${response.status} @ ${base}, retry ${attempt}/${retryAttempts}...`
          );
          await sleepWithBackoff(attempt);
          continue;
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          console.warn(`[${logTag}] Non-array response from ${base}: ${typeof data}`);
          const failure = recordHostFailure(host);
          if (failure.tripped) {
            console.warn(`[${logTag}] Circuit tripped for ${host} after invalid payloads.`);
          }
          break;
        }

        recordHostSuccess(host);
        return data;
      } catch (error: any) {
        const isLastAttempt = attempt >= retryAttempts;
        if (isLastAttempt) {
          const failure = recordHostFailure(host);
          if (failure.tripped) {
            console.warn(`[${logTag}] Circuit tripped for ${host} after request errors.`);
          }
          console.warn(`[${logTag}] Fetch error @ ${base}: ${error.message}`);
          break;
        }

        console.warn(`[${logTag}] Fetch error @ ${base}, retry ${attempt}/${retryAttempts}: ${error.message}`);
        await sleepWithBackoff(attempt);
      }
    }
  }

  return [];
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
 * Runs one filter strategy across pages.
 */
async function fetchWithFilter(
  config: VtexFetcherConfig,
  fqFilter: string,
  baseCandidates: string[]
): Promise<RawOffer[]> {
  const maxPages = config.maxPages ?? 6;
  const pageSize = config.pageSize ?? 50;
  const minProducts = config.minProducts ?? 80;
  const pageDelayMs = config.pageDelayMs ?? 300;
  const seenNames = new Set<string>();
  const allOffers: RawOffer[] = [];

  console.log(
    `[${config.logTag}] Strategy: filter="${fqFilter || 'none'}" | maxPages=${maxPages} | pageSize=${pageSize} | min=${minProducts}`
  );

  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const products = await fetchPage(
      baseCandidates,
      fqFilter,
      from,
      to,
      config.referer,
      config.extraHeaders ?? {},
      config.logTag
    );

    if (!products.length) {
      console.log(`[${config.logTag}] Page ${page + 1}: empty — end of results.`);
      break;
    }

    let pageDiscounted = 0;
    for (const product of products) {
      try {
        const offer = parseProduct(product, config, seenNames);
        if (offer) {
          allOffers.push(offer);
          pageDiscounted++;
        }
      } catch {
        // Skip malformed product
      }
    }

    console.log(
      `[${config.logTag}] Page ${page + 1}: ${products.length} raw → ${pageDiscounted} discounted (total: ${allOffers.length})`
    );

    if (allOffers.length >= minProducts) {
      console.log(`[${config.logTag}] Reached minProducts (${minProducts}) — stopping early.`);
      break;
    }

    if (page === 0 && pageDiscounted === 0) {
      console.log(`[${config.logTag}] Page 1 returned 0 discounted products — filter may be wrong. Skipping strategy.`);
      break;
    }

    if (page < maxPages - 1) {
      await new Promise((resolve) => setTimeout(resolve, pageDelayMs));
    }
  }

  return allOffers;
}

export async function fetchVtexMultiCategory(
  config: VtexFetcherConfig
): Promise<RawOffer[]> {
  const minProducts = config.minProducts ?? 80;
  const baseCandidates = [
    config.cdnBase,
    ...(config.fallbackBases ?? []),
    config.siteBase,
  ];

  const fqFilters: string[] = config.fqFilters ?? [
    'fq=specificationFilter_40:Oferta',
    'fq=specificationFilter_40:Si',
    'fq=specificationFilter_193:Oferta',
    '',
  ];

  for (const fqFilter of fqFilters) {
    const offers = await fetchWithFilter(config, fqFilter, baseCandidates);

    if (offers.length >= minProducts) {
      console.log(`[${config.logTag}] ✅ Strategy "${fqFilter || 'broad'}" succeeded: ${offers.length} offers.`);
      return offers;
    }

    if (offers.length > 0) {
      console.log(`[${config.logTag}] Strategy "${fqFilter || 'broad'}" returned only ${offers.length} — trying next...`);
    }
  }

  console.warn(`[${config.logTag}] ⚠ No strategy reached ${minProducts} products. Trying last resort...`);

  const lastResort = await fetchWithFilter(
    { ...config, minProducts: 1, maxPages: config.maxPages ?? 6 },
    '',
    baseCandidates
  );

  console.log(`[${config.logTag}] ✅ Last resort: ${lastResort.length} offers.`);
  return lastResort;
}
