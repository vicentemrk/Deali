import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';

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
    return fetchVtexMultiCategory({
      cdnBase:      'https://santaisabel.vteximg.com.br',
      siteBase:     'https://www.santaisabel.cl',
      referer:      'https://www.santaisabel.cl/ofertas',
      logTag:       'SantaIsabelScraper',
      minProducts:  50,
      concurrency:  3,
    });
  }
}
