import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';
import { scrapeStoreWithPlaywrightFallback } from './playwrightStoreFallback';

/**
 * TottusScraper — Falabella Chile
 *
 * Uses VTEX CDN (tottus.vteximg.com.br) to bypass Cloudflare.
 * Migrated from Playwright to direct API. Fetches across priority
 * categories with p-limit concurrency.
 */
export class TottusScraper implements StoreScraper {
  storeSlug = 'tottus';

  async scrape(): Promise<RawOffer[]> {
    const cookieHeader = process.env.TOTTUS_COOKIE?.trim();

    const offers = await fetchVtexMultiCategory({
      cdnBase:      'https://tottus.vteximg.com.br',
      fallbackBases:[
        'https://www.tottus.cl',
        'https://tottuscl.vtexassets.com',
      ],
      siteBase:     'https://www.tottus.cl',
      referer:      'https://www.tottus.cl/tottus/ofertas',
      logTag:       'TottusScraper',
      minProducts:  50,
      concurrency:  3,
      extraHeaders: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });

    if (offers.length > 0) return offers;

    if (!cookieHeader) {
      console.warn('[TottusScraper] Blocked by Cloudflare. Set TOTTUS_COOKIE in .env.local to reuse a valid browser session.');
    }

    return scrapeStoreWithPlaywrightFallback({
      logTag: 'TottusScraper',
      baseUrl: 'https://www.tottus.cl',
      categoryUrls: [
        'https://www.tottus.cl/tottus-cl/content/ofertas-tottus?sid=HO_BH_OFE_498',
        'https://www.tottus.cl/tottus-cl/lista/CATG24752/Liquidos?sid=HO_CS_LIQ_478',
        'https://www.tottus.cl/tottus-cl/lista/CATG24758/Aseo-y-Limpieza?sid=HO_CS_ASE_471',
        'https://www.tottus.cl/tottus-cl/lista/CATG24751/Abarrotes?sid=HO_CS_DES_472',
        'https://www.tottus.cl/tottus-cl/lista/CATG24754/Lacteos?sid=HO_CS_LAC_474',
        'https://www.tottus.cl/tottus-cl/lista/CATG27088/Electro-y-Tecnologia?sid=HO_LO_NON_456',
      ],
      maxProducts: 50,
    });
  }
}
