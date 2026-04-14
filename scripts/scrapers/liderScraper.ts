import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';

/**
 * LiderScraper — Walmart Chile
 *
 * Walmart Chile has Cloudflare Enterprise on www.lider.cl.
 * Strategy: try the VTEX CDN (lider.vteximg.com.br) like other stores.
 * If CF blocks it, returns [] gracefully — never fails the pipeline.
 *
 * Estado: Pendiente — el scraper es resiliente pero el endpoint puede no funcionar.
 */
export class LiderScraper implements StoreScraper {
  storeSlug = 'lider';

  async scrape(): Promise<RawOffer[]> {
    try {
      const offers = await fetchVtexMultiCategory({
        cdnBase:      'https://lider.vteximg.com.br',
        siteBase:     'https://www.lider.cl',
        pathPrefix:   '/supermercado',
        referer:      'https://www.lider.cl/supermercado/ofertas',
        logTag:       'LiderScraper',
        minProducts:  50,
        concurrency:  3,
      });

      if (offers.length > 0) return offers;

      console.warn('[LiderScraper] VTEX CDN returned 0 offers — Cloudflare may be blocking. Skipping gracefully.');
      return [];
    } catch (err: any) {
      // Graceful degradation: Lider is "Pendiente" — don't fail the pipeline
      console.warn(`[LiderScraper] ⚠️ Skipped — ${err.message}. Requires mobile/official API investigation.`);
      return [];
    }
  }
}
