import { StoreScraper, RawOffer } from './types';

const PAGE_SIZE = 50;
const MAX_PAGES = 4; // 200 productos máximo por run

export class JumboScraper implements StoreScraper {
  storeSlug = 'jumbo';

  // Cencosud VTEX CDN (bypass Cloudflare/Datadome del dominio principal)
  private readonly BASE_API =
    'https://jumbo.vteximg.com.br/api/catalog_system/pub/products/search' +
    '?O=OrderByBestDiscountDESC&fq=specificationFilter_40:Oferta';

  async scrape(): Promise<RawOffer[]> {
    const offers: RawOffer[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;
      const url  = `${this.BASE_API}&_from=${from}&_to=${to}`;

      try {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
              '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const products: any[] = await response.json();

        // Empty page → reached the end
        if (!products.length) {
          console.log(`[JumboScraper] Reached end at page ${page} (${offers.length} total).`);
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

            const categoryRaw: string =
              product.categories?.[0]?.replace(/^\/|\/$/g, '').split('/')[0] ?? null;

            offers.push({
              productName:   product.productName,
              brand:         product.brand || null,
              imageUrl:      item.images?.[0]?.imageUrl || '',
              offerUrl:      product.link || `https://www.jumbo.cl/${product.linkText}/p`,
              offerPrice,
              originalPrice,
              categoryHint:  categoryRaw,
            });
          } catch (err: any) {
            console.warn(`[JumboScraper] Error parsing product: ${err.message}`);
          }
        }

        console.log(`[JumboScraper] Page ${page + 1}: +${products.length} products (total: ${offers.length})`);
      } catch (error: any) {
        console.error(`[JumboScraper] Fetch error on page ${page}: ${error.message}`);
        break; // Don't retry on network error — move to next scraper
      }

      // Small delay between pages to avoid rate-limiting
      if (page < MAX_PAGES - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    console.log(`[JumboScraper] ✅ Total: ${offers.length} offers.`);
    return offers;
  }
}
