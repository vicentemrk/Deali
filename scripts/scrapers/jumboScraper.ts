import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';
import { scrapeStoreWithPlaywrightFallback } from './playwrightStoreFallback';
import {
  getHostFromUrl,
  getRetryAttempts,
  recordHostFailure,
  recordHostSuccess,
  shouldRetryHttpStatus,
  shouldShortCircuitHost,
  sleepWithBackoff,
} from '../lib/httpResilience';

const TARGET_PRODUCTS = 75;
const PROMO_OFFERS_URL = 'https://www.jumbo.cl/jumbo-ofertas';
const JUMBO_BFF_ENDPOINT = 'https://bff.jumbo.cl/catalog/plp';
const JUMBO_BFF_APIKEY = process.env.JUMBO_BFF_APIKEY || 'be-reg-groceries-jumbo-catalog-w54byfvkmju5';
const JUMBO_BFF_PAGE_SIZE = 40;
const JUMBO_BFF_MAX_BASE_PAGES = 5;
const JUMBO_BFF_MAX_COLLECTIONS = 8;
const JUMBO_BFF_MAX_COLLECTION_PAGES = 2;

type JumboDiscovery = {
  promoFilters: string[];
  promoUrls: string[];
};

function toAbsoluteUrl(baseUrl: string, maybeRelativeUrl: string): string {
  if (!maybeRelativeUrl) return baseUrl;
  if (/^https?:\/\//i.test(maybeRelativeUrl)) return maybeRelativeUrl;
  if (maybeRelativeUrl.startsWith('/')) return `https://www.jumbo.cl${maybeRelativeUrl}`;
  return `https://www.jumbo.cl/${maybeRelativeUrl}`;
}

async function discoverFromLanding(offersUrl: string, logTag: string): Promise<JumboDiscovery> {
  try {
    const response = await fetch(offersUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'es-CL,es;q=0.9',
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      console.warn(`[${logTag}] Could not load offers page (${response.status}).`);
      return { promoFilters: [], promoUrls: [] };
    }

    const html = await response.text();
    const queryMatches = Array.from(
      html.matchAll(/fq=H%3A\d+(?:&nombre_promo=[^"'\s&]+)?/gi)
    );
    const promoFilters = Array.from(
      new Set(
        queryMatches.map((match) => decodeURIComponent(match[0]).replace(/&amp;/g, '&'))
      )
    ).slice(0, 40);

    const promoUrls = Array.from(
      new Set(
        Array.from(html.matchAll(/href="([^"]*fq=H%3A\d+[^"]*)"/gi)).map((match) =>
          toAbsoluteUrl(offersUrl, decodeURIComponent(match[1]).replace(/&amp;/g, '&'))
        )
      )
    ).slice(0, 20);

    if (promoFilters.length > 0 || promoUrls.length > 0) {
      console.log(
        `[${logTag}] Landing discovery → filters=${promoFilters.length}, urls=${promoUrls.length}`
      );
    }

    return { promoFilters, promoUrls };
  } catch (error: any) {
    console.warn(`[${logTag}] Landing discovery failed: ${error.message}`);
    return { promoFilters: [], promoUrls: [] };
  }
}

async function discoverFromCms(logTag: string): Promise<string[]> {
  try {
    const response = await fetch('https://assets.jumbo.cl/json/cms/jumbo-ofertas.json', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      console.warn(`[${logTag}] CMS discovery unavailable (${response.status}).`);
      return [];
    }

    const body = await response.text();
    const urls = Array.from(
      new Set(
        Array.from(body.matchAll(/https?:\\\/\\\/www\.jumbo\.cl[^"\\]+fq=H%3A\d+[^"\\]*/gi)).map((m) =>
          decodeURIComponent(m[0].replace(/\\\//g, '/')).replace(/&amp;/g, '&')
        )
      )
    ).slice(0, 20);

    if (urls.length > 0) {
      console.log(`[${logTag}] CMS discovery → urls=${urls.length}`);
    }

    return urls;
  } catch (error: any) {
    console.warn(`[${logTag}] CMS discovery failed: ${error.message}`);
    return [];
  }
}

type JumboBffProduct = {
  slug?: string;
  brand?: string;
  categoryNames?: string[];
  collections?: Array<string | number>;
  items?: Array<{
    name?: string;
    price?: number;
    listPrice?: number;
    images?: string[];
  }>;
};

import { mergeUniqueOffers } from '../lib/mergeOffers';

function upgradeJumboImage(url: string): string {
  if (!url) return '';
  return url.replace(/\/ids\/(\d+)-\d+-\d+\//, '/ids/$1-600-600/');
}

export function parseJumboBffProducts(products: JumboBffProduct[]): RawOffer[] {
  const parsed: RawOffer[] = [];
  const seenNames = new Set<string>();

  for (const product of products) {
    const item = product?.items?.[0];
    if (!item) continue;

    const offerPrice = Number(item.price ?? 0);
    const originalPrice = Number(item.listPrice ?? 0);
    if (!offerPrice || !originalPrice || offerPrice >= originalPrice) continue;

    const productName = String(item.name || '').trim();
    if (!productName) continue;

    const key = productName.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);

    parsed.push({
      productName,
      brand: product?.brand || null,
      imageUrl: upgradeJumboImage(String(item?.images?.[0] || '')),
      offerUrl: product?.slug
        ? `https://www.jumbo.cl/${product.slug}/p`
        : PROMO_OFFERS_URL,
      offerPrice,
      originalPrice,
      categoryHint: Array.isArray(product?.categoryNames) ? product.categoryNames[0] || null : null,
    });
  }

  return parsed;
}

async function fetchJumboBffPage(
  from: number,
  to: number,
  collections: string[] = []
): Promise<JumboBffProduct[]> {
  const retryAttempts = getRetryAttempts();
  const host = getHostFromUrl(JUMBO_BFF_ENDPOINT);
  const circuit = shouldShortCircuitHost(host);
  if (circuit.blocked) {
    throw new Error(`Jumbo BFF circuit open (${Math.ceil(circuit.retryInMs / 1000)}s)`);
  }

  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const response = await fetch(JUMBO_BFF_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          apikey: JUMBO_BFF_APIKEY,
          Referer: 'https://www.jumbo.cl/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'x-client-platform': 'web',
          'x-client-version': '3.3.68',
        },
        body: JSON.stringify({
          store: 'jumboclj512',
          collections,
          fullText: '',
          brands: [],
          hideUnavailableItems: false,
          from,
          to,
          orderBy: '',
          selectedFacets: [{ key: 'category1', value: '/jumbo-ofertas' }],
          promotionalCards: true,
          sponsoredProducts: true,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        const retryable = shouldRetryHttpStatus(response.status);
        const isLastAttempt = attempt >= retryAttempts;

        if (!retryable || isLastAttempt) {
          const failure = recordHostFailure(host);
          if (failure.tripped) {
            console.warn(`[JumboScraper] Circuit tripped for ${host}.`);
          }
          throw new Error(`Jumbo BFF HTTP ${response.status}`);
        }

        await sleepWithBackoff(attempt);
        continue;
      }

      const payload = await response.json();
      const products = Array.isArray(payload?.products) ? payload.products : [];
      recordHostSuccess(host);
      return products;
    } catch (error: any) {
      const isLastAttempt = attempt >= retryAttempts;
      if (isLastAttempt) {
        const failure = recordHostFailure(host);
        if (failure.tripped) {
          console.warn(`[JumboScraper] Circuit tripped for ${host}.`);
        }
        throw error;
      }

      await sleepWithBackoff(attempt);
    }
  }

  throw new Error('Jumbo BFF retry budget exhausted');
}

async function fetchJumboBffOffers(logTag: string, minProducts: number): Promise<RawOffer[]> {
  const offers: RawOffer[] = [];
  const seenNames = new Set<string>();
  const collectionCounts = new Map<string, number>();

  for (let page = 0; page < JUMBO_BFF_MAX_BASE_PAGES; page++) {
    const from = page * JUMBO_BFF_PAGE_SIZE;
    const to = from + JUMBO_BFF_PAGE_SIZE;
    let products: JumboBffProduct[] = [];

    try {
      products = await fetchJumboBffPage(from, to, []);
    } catch (error: any) {
      console.warn(`[${logTag}] ${error.message} (base page ${page + 1}).`);
      break;
    }

    if (products.length === 0) {
      console.log(`[${logTag}] Jumbo BFF page ${page + 1}: empty — end of results.`);
      break;
    }

    const parsedPage = parseJumboBffProducts(products);
    let pageDiscounted = 0;

    for (const offer of parsedPage) {
      const key = offer.productName.toLowerCase();
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      offers.push(offer);
      pageDiscounted++;
    }

    for (const product of products) {
      const item = product?.items?.[0];
      const isDiscounted = Number(item?.price ?? 0) > 0 && Number(item?.listPrice ?? 0) > Number(item?.price ?? 0);
      if (!isDiscounted) continue;

      for (const collection of product?.collections ?? []) {
        const key = String(collection);
        collectionCounts.set(key, (collectionCounts.get(key) ?? 0) + 1);
      }
    }

    console.log(
      `[${logTag}] Jumbo BFF page ${page + 1}: ${products.length} raw → ${pageDiscounted} discounted (total: ${offers.length})`
    );

    if (offers.length >= minProducts) break;
  }

  if (offers.length < minProducts && collectionCounts.size > 0) {
    const topCollections = Array.from(collectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, JUMBO_BFF_MAX_COLLECTIONS)
      .map(([collection]) => collection);

    console.log(`[${logTag}] Jumbo BFF trying collection variants: ${topCollections.join(', ')}`);

    for (const collection of topCollections) {
      if (offers.length >= minProducts) break;

      for (let page = 0; page < JUMBO_BFF_MAX_COLLECTION_PAGES; page++) {
        if (offers.length >= minProducts) break;

        const from = page * JUMBO_BFF_PAGE_SIZE;
        const to = from + JUMBO_BFF_PAGE_SIZE;
        let products: JumboBffProduct[] = [];

        try {
          products = await fetchJumboBffPage(from, to, [collection]);
        } catch (error: any) {
          console.warn(`[${logTag}] ${error.message} (collection ${collection}, page ${page + 1}).`);
          break;
        }

        if (products.length === 0) break;

        const parsedPage = parseJumboBffProducts(products);
        let added = 0;
        for (const offer of parsedPage) {
          const key = offer.productName.toLowerCase();
          if (seenNames.has(key)) continue;
          seenNames.add(key);
          offers.push(offer);
          added++;
        }

        console.log(
          `[${logTag}] Jumbo BFF collection ${collection} page ${page + 1}: ${products.length} raw → ${added} new discounted (total: ${offers.length})`
        );
      }
    }
  }

  console.log(`[${logTag}] Jumbo BFF total: ${offers.length} offers.`);
  return offers;
}

/**
 * JumboScraper — Cencosud Chile
 *
 * Uses the VTEX CDN (jumbo.vteximg.com.br) to bypass Cloudflare/Datadome
 * on the main domain.
 *
 * Filter strategy (tried in order):
 *   1. fq=specificationFilter_40:Oferta
 *   2. fq=specificationFilter_40:Si
 *   3. fq=specificationFilter_193:Oferta
 *   4. broad search
 */
export class JumboScraper implements StoreScraper {
  storeSlug = 'jumbo';

  async scrape(): Promise<RawOffer[]> {
    let offers: RawOffer[] = [];
    try {
      offers = await fetchJumboBffOffers('JumboScraper', TARGET_PRODUCTS);
    } catch (error: any) {
      console.warn(`[JumboScraper] Jumbo BFF source failed: ${error.message}`);
    }

    const commonConfig = {
      cdnBase: 'https://jumbo.vtexcommercestable.com.br',
      fallbackBases: [
        'https://jumbo.vteximg.com.br',
        'https://jumbocl.vtexassets.com',
        'https://www.jumbo.cl',
      ],
      siteBase: 'https://www.jumbo.cl',
      referer: 'https://www.jumbo.cl/jumbo-ofertas',
      logTag: 'JumboScraper',
    };

    const landingDiscovery = await discoverFromLanding(PROMO_OFFERS_URL, 'JumboScraper');
    const cmsPromoUrls = await discoverFromCms('JumboScraper');
    const promoUrls = Array.from(
      new Set([...landingDiscovery.promoUrls, ...cmsPromoUrls])
    );

    if (offers.length < TARGET_PRODUCTS && landingDiscovery.promoFilters.length > 0) {
      const promoOffers = await fetchVtexMultiCategory({
        ...commonConfig,
        minProducts: TARGET_PRODUCTS,
        maxPages: 2,
        pageSize: 50,
        pageDelayMs: 250,
        fqFilters: landingDiscovery.promoFilters,
      });

      offers = mergeUniqueOffers(offers, promoOffers);
    }

    if (offers.length < TARGET_PRODUCTS) {
      const broadOffers = await fetchVtexMultiCategory({
        ...commonConfig,
        minProducts: 80,
        maxPages: 6,
        pageSize: 50,
        pageDelayMs: 400,
        fqFilters: [
          'fq=specificationFilter_40:Oferta',
          'fq=specificationFilter_40:Si',
          'fq=specificationFilter_193:Oferta',
          '',
        ],
      });

      offers = mergeUniqueOffers(offers, broadOffers);
    }

    if (offers.length < TARGET_PRODUCTS) {
      const playwrightOffers = await scrapeStoreWithPlaywrightFallback({
        logTag: 'JumboScraper',
        baseUrl: 'https://www.jumbo.cl',
        categoryUrls: [
          ...promoUrls,
          PROMO_OFFERS_URL,
          'https://www.jumbo.cl/supermercado/despensa',
          'https://www.jumbo.cl/supermercado/lacteos-y-huevos',
          'https://www.jumbo.cl/supermercado/bebidas-y-licores',
        ],
        maxProducts: 75,
      });

      offers = mergeUniqueOffers(offers, playwrightOffers);
    }

    console.log(`[JumboScraper] Combined total: ${offers.length} offers.`);
    return offers.slice(0, TARGET_PRODUCTS);
  }
}


