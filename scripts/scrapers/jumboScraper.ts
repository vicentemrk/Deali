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

  private readonly OFFERS_URL = 'https://www.jumbo.cl/jumbo-ofertas?nombre_promo=boton-jumboofertas-13112023';

  async scrape(): Promise<RawOffer[]> {
    return fetchVtexMultiCategory({
      cdnBase:      'https://jumbo.vteximg.com.br',
      siteBase:     'https://www.jumbo.cl',
      referer:      this.OFFERS_URL,
      logTag:       'JumboScraper',
      minProducts:  50,
      concurrency:  3,
    });
  }
}
