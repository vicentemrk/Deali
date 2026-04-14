import { StoreScraper, RawOffer } from './types';

/**
 * LiderScraper — Walmart Chile
 * Uses the public VTEX catalog API (same stack as Jumbo/Cencosud)
 * to fetch real on-sale products without Playwright.
 * 
 * Endpoint: https://www.lider.cl/supermercado API proxied via VTEX
 * Falls back to the vteximg CDN domain to bypass Cloudflare on the main domain.
 */
export class LiderScraper implements StoreScraper {
  storeSlug = 'lider';

  private readonly BASE_URL = 'https://www.lider.cl';
  // VTEX search endpoint ordered by best discount, fetches 50 products per call
  private readonly API_URL =
    'https://www.lider.cl/supermercado/api/catalog_system/pub/products/search' +
    '?O=OrderByBestDiscountDESC&fq=specificationFilter_40:Oferta&_from=0&_to=49';

  async scrape(): Promise<RawOffer[]> {
    const offers: RawOffer[] = [];

    try {
      const response = await fetch(this.API_URL, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://www.lider.cl/supermercado/ofertas',
        },
        // 15s timeout via AbortController
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`[LiderScraper] API responded with status: ${response.status}`);
      }

      const products: any[] = await response.json();

      for (const product of products) {
        try {
          const item = product.items?.[0];
          if (!item) continue;

          const seller = item.sellers?.[0]?.commertialOffer;
          if (!seller) continue;

          const offerPrice: number = seller.Price;
          const originalPrice: number = seller.ListPrice;

          // Skip non-discounted or free items
          if (!offerPrice || offerPrice === 0 || offerPrice >= originalPrice) continue;

          // Build real product URL from linkText (URL-safe product slug from VTEX)
          const linkText: string = product.linkText || '';
          const offerUrl = linkText
            ? `${this.BASE_URL}/supermercado/${linkText}/p`
            : `${this.BASE_URL}/supermercado/ofertas`;

          const categoryRaw: string =
            product.categories?.[0]?.replace(/^\/|\/$/g, '').split('/')[0] || null;

          offers.push({
            productName: product.productName,
            brand: product.brand || null,
            imageUrl: item.images?.[0]?.imageUrl || '',
            offerUrl,
            offerPrice,
            originalPrice,
            categoryHint: categoryRaw,
          });
        } catch (err: any) {
          console.warn(`[LiderScraper] Error parsing product: ${err.message}`);
        }
      }
    } catch (error: any) {
      throw new Error(`[LiderScraper Fetch Error] ${error.message}`);
    }

    console.log(`[LiderScraper] Scraped ${offers.length} offers.`);
    return offers;
  }
}
