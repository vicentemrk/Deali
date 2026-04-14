import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';
import { scrapeStoreWithPlaywrightFallback } from './playwrightStoreFallback';

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
      const cookieHeader = process.env.LIDER_COOKIE?.trim();

      const offers = await fetchVtexMultiCategory({
        cdnBase:      'https://lider.vteximg.com.br',
        fallbackBases:[
          'https://www.lider.cl',
          'https://lidercl.vtexassets.com',
        ],
        siteBase:     'https://www.lider.cl',
        pathPrefix:   '/supermercado',
        referer:      'https://www.lider.cl/supermercado/ofertas',
        logTag:       'LiderScraper',
        minProducts:  50,
        concurrency:  3,
        extraHeaders: cookieHeader ? { Cookie: cookieHeader } : undefined,
      });

      if (offers.length > 0) return offers;

      console.warn('[LiderScraper] VTEX CDN returned 0 offers — trying Playwright fallback...');

      if (!cookieHeader) {
        console.warn('[LiderScraper] Challenge detected. Set LIDER_COOKIE in .env.local to reuse a valid browser session.');
      }

      return scrapeStoreWithPlaywrightFallback({
        logTag: 'LiderScraper',
        baseUrl: 'https://www.lider.cl',
        categoryUrls: [
          'https://super.lider.cl/content/productos-a-mil/96311243?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_trafico_vertodo&co_or=1',
          'https://super.lider.cl/content/mainstays/42638900?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_camp_mainstays&co_or=4',
          'https://super.lider.cl/browse/Activaciones/Supermecado/Supermercado-131/20126634_89720227_98986479?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_camp_edlp&co_or=3',
          'https://super.lider.cl/browse/Productos-a-mil/Productos-a-1000/96311243_72163828?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_trafico_productosmil&co_or=2',
          'https://super.lider.cl/browse/Productos-a-mil/Productos-a-2000/96311243_24584919?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_trafico_productos2mil&co_or=3',
          'https://super.lider.cl/browse/Productos-a-mil/Productos-a-3000/96311243_26319580?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_trafico_productos3mil&co_or=4',
        ],
        maxProducts: 50,
      });
    } catch (err: any) {
      // Graceful degradation: Lider is "Pendiente" — don't fail the pipeline
      console.warn(`[LiderScraper] ⚠️ Skipped — ${err.message}. Requires mobile/official API investigation.`);
      return [];
    }
  }
}
