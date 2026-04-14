import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';

/**
 * JumboScraper — Cencosud Chile
 *
 * Uses VTEX CDN (jumbo.vteximg.com.br) to bypass Cloudflare/Datadome.
 * Fetches across priority categories (despensa, lácteos, bebidas, aseo…)
 * with p-limit concurrency, then falls back to global "Ofertas" if under 50.
 */
export class JumboScraper implements StoreScraper {
  storeSlug = 'jumbo';

  async scrape(): Promise<RawOffer[]> {
    return fetchVtexMultiCategory({
      cdnBase:      'https://jumbo.vteximg.com.br',
      siteBase:     'https://www.jumbo.cl',
      referer:      'https://www.jumbo.cl/ofertas',
      logTag:       'JumboScraper',
      minProducts:  50,
      concurrency:  3,
    });
  }
}
