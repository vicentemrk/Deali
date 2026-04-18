import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';

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
    return fetchVtexMultiCategory({
      cdnBase: 'https://jumbo.vteximg.com.br',
      fallbackBases: ['https://www.jumbo.cl'],
      siteBase: 'https://www.jumbo.cl',
      referer: 'https://www.jumbo.cl/jumbo-ofertas',
      logTag: 'JumboScraper',
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


