import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';
import { scrapeStoreWithPlaywrightFallback } from './playwrightStoreFallback';

const TARGET_PRODUCTS = 100;

async function discoverPromotionFilters(offersUrl: string, logTag: string): Promise<string[]> {
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
      return [];
    }

    const html = await response.text();
    const matches = Array.from(html.matchAll(/fq=H(?:%3A|:)(\d+)/gi));
    const ids = Array.from(new Set(matches.map((match) => match[1])));

    const filters = ids.slice(0, 36).map((id) => `fq=H:${id}`);
    if (filters.length > 0) {
      console.log(`[${logTag}] Discovered ${filters.length} promo filters from landing.`);
    }

    return filters;
  } catch (error: any) {
    console.warn(`[${logTag}] Promotion filter discovery failed: ${error.message}`);
    return [];
  }
}

import { mergeUniqueOffers } from '../lib/mergeOffers';

/**
 * SantaIsabelScraper — Cencosud Chile
 *
 * Same VTEX infrastructure as Jumbo (Cencosud group).
 * Uses CDN (santaisabel.vteximg.com.br) for direct API access.
 * Multi-category fetching with priority: despensa, lácteos, bebidas, aseo.
 */
export class SantaIsabelScraper implements StoreScraper {
  storeSlug = 'santa-isabel';

  async scrape(): Promise<RawOffer[]> {
    const commonConfig = {
      cdnBase: 'https://santaisabel.vtexcommercestable.com.br',
      fallbackBases: [
        'https://santaisabel.vteximg.com.br',
        'https://santaisabelcl.vtexassets.com',
        'https://www.santaisabel.cl',
      ],
      siteBase: 'https://www.santaisabel.cl',
      referer: 'https://www.santaisabel.cl/ofertas',
      logTag: 'SantaIsabelScraper',
    };

    let offers: RawOffer[] = [];
    const promoFilters = await discoverPromotionFilters('https://www.santaisabel.cl/ofertas', 'SantaIsabelScraper');

    if (promoFilters.length > 0) {
      offers = await fetchVtexMultiCategory({
        ...commonConfig,
        minProducts: TARGET_PRODUCTS,
        maxPages: 2,
        pageSize: 50,
        pageDelayMs: 250,
        fqFilters: promoFilters,
      });
    }

    if (offers.length < TARGET_PRODUCTS) {
      const broadOffers = await fetchVtexMultiCategory({
        ...commonConfig,
        minProducts: TARGET_PRODUCTS,
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
        logTag: 'SantaIsabelScraper',
        baseUrl: 'https://www.santaisabel.cl',
        categoryUrls: [
          'https://www.santaisabel.cl/ofertas',
          'https://www.santaisabel.cl/supermercado/despensa',
          'https://www.santaisabel.cl/supermercado/lacteos-y-huevos',
          'https://www.santaisabel.cl/supermercado/bebidas-y-licores',
        ],
        maxProducts: TARGET_PRODUCTS,
      });

      offers = mergeUniqueOffers(offers, playwrightOffers);
    }

    console.log(`[SantaIsabelScraper] Combined total: ${offers.length} offers.`);
    return offers.slice(0, TARGET_PRODUCTS);
  }
}
