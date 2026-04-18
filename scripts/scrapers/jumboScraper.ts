import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';
import { scrapeStoreWithPlaywrightFallback } from './playwrightStoreFallback';

const TARGET_PRODUCTS = 75;
const PROMO_OFFERS_URL = 'https://www.jumbo.cl/jumbo-ofertas';

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

function mergeUniqueOffers(primary: RawOffer[], secondary: RawOffer[]): RawOffer[] {
  const merged = [...primary];
  const seen = new Set(primary.map((offer) => offer.productName.trim().toLowerCase()));

  for (const offer of secondary) {
    const key = offer.productName.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(offer);
  }

  return merged;
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

    let offers: RawOffer[] = [];
    const landingDiscovery = await discoverFromLanding(PROMO_OFFERS_URL, 'JumboScraper');
    const cmsPromoUrls = await discoverFromCms('JumboScraper');
    const promoUrls = Array.from(
      new Set([...landingDiscovery.promoUrls, ...cmsPromoUrls])
    );

    if (landingDiscovery.promoFilters.length > 0) {
      offers = await fetchVtexMultiCategory({
        ...commonConfig,
        minProducts: TARGET_PRODUCTS,
        maxPages: 2,
        pageSize: 50,
        pageDelayMs: 250,
        fqFilters: landingDiscovery.promoFilters,
      });
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


