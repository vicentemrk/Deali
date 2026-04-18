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
      cdnBase: 'https://santaisabel.vteximg.com.br',
      fallbackBases: ['https://www.santaisabel.cl'],
      siteBase: 'https://www.santaisabel.cl',
      referer: 'https://www.santaisabel.cl/ofertas',
      logTag: 'SantaIsabelScraper',
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
  }
}
