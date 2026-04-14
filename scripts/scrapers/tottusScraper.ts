import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';

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
    return fetchVtexMultiCategory({
      cdnBase:      'https://tottus.vteximg.com.br',
      siteBase:     'https://www.tottus.cl',
      referer:      'https://www.tottus.cl/tottus/ofertas',
      logTag:       'TottusScraper',
      minProducts:  50,
      concurrency:  3,
    });
  }
}
