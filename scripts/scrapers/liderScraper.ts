import { StoreScraper, RawOffer } from './types';

const PAGE_SIZE = 50;
const MAX_PAGES = 4;

/**
 * LiderScraper — Walmart Chile
 *
 * Walmart Chile tiene Cloudflare Enterprise en www.lider.cl.
 * Strategy (Option A): usar el CDN vteximg.com.br que bypasea CF,
 * igual que Jumbo/Tottus/Santa Isabel.
 *
 * Si vteximg también retorna 403 (Walmart puede tener CF en el CDN),
 * se captura el error y se retorna [] sin fallar el pipeline.
 *
 * Estado: Pendiente confirmación de endpoint — el scraper es resiliente.
 */
export class LiderScraper implements StoreScraper {
  storeSlug = 'lider';

  private readonly BASE_URL = 'https://www.lider.cl';

  // Option A: VTEX CDN bypass (same pattern as Jumbo/Tottus/SI)
  private readonly BASE_API_CDN =
    'https://lider.vteximg.com.br/api/catalog_system/pub/products/search' +
    '?O=OrderByBestDiscountDESC&fq=specificationFilter_40:Oferta';

  async scrape(): Promise<RawOffer[]> {
    try {
      const offers = await this.scrapeViaVtexCdn();
      if (offers.length > 0) return offers;
      console.warn('[LiderScraper] VTEX CDN returned 0 offers — Cloudflare may be blocking. Skipping gracefully.');
      return [];
    } catch (err: any) {
      // Graceful degradation: Lider is "Pendiente" — don't fail the pipeline
      console.warn(`[LiderScraper] ⚠️ Skipped — ${err.message}. Requires mobile/official API investigation.`);
      return [];
    }
  }

  private async scrapeViaVtexCdn(): Promise<RawOffer[]> {
    const offers: RawOffer[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;
      const url  = `${this.BASE_API_CDN}&_from=${from}&_to=${to}`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://www.lider.cl/supermercado/ofertas',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from VTEX CDN — Cloudflare likely blocking`);
      }

      const products: any[] = await response.json();
      if (!products.length) {
        console.log(`[LiderScraper] Reached end at page ${page} (${offers.length} total).`);
        break;
      }

      for (const product of products) {
        try {
          const item   = product.items?.[0];
          const seller = item?.sellers?.[0]?.commertialOffer;
          if (!item || !seller) continue;

          const offerPrice: number    = seller.Price;
          const originalPrice: number = seller.ListPrice;
          if (!offerPrice || offerPrice === 0 || offerPrice >= originalPrice) continue;

          const linkText: string = product.linkText || '';
          const offerUrl = linkText
            ? `${this.BASE_URL}/supermercado/${linkText}/p`
            : `${this.BASE_URL}/supermercado/ofertas`;

          const categoryRaw: string =
            product.categories?.[0]?.replace(/^\/|\/$/g, '').split('/')[0] ?? null;

          offers.push({
            productName:  product.productName,
            brand:        product.brand || null,
            imageUrl:     item.images?.[0]?.imageUrl || '',
            offerUrl,
            offerPrice,
            originalPrice,
            categoryHint: categoryRaw,
          });
        } catch (err: any) {
          console.warn(`[LiderScraper] Error parsing product: ${err.message}`);
        }
      }

      console.log(
        `[LiderScraper] Page ${page + 1}: +${products.length} products (total: ${offers.length})`
      );

      if (page < MAX_PAGES - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    console.log(`[LiderScraper] ✅ Total: ${offers.length} offers.`);
    return offers;
  }
}
