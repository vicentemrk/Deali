import { StoreScraper, RawOffer } from './types';

export class JumboScraper implements StoreScraper {
  storeSlug = 'jumbo';

  async scrape(): Promise<RawOffer[]> {
    const offers: RawOffer[] = [];
    
    // Using vteximg to bypass Datadome/Cloudflare blocks on main api
    const vtexApiUrl = 'https://jumbo.vteximg.com.br/api/catalog_system/pub/products/search?O=OrderByTopSaleDESC&_from=0&_to=49';

    try {
      const response = await fetch(vtexApiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`[JumboScraper] API responded with status: ${response.status}`);
      }

      const products = await response.json();

      for (const product of products) {
        try {
          const item = product.items?.[0];
          if (!item) continue;

          const commertialOffer = item.sellers?.[0]?.commertialOffer;
          if (!commertialOffer) continue;

          const offerPrice = commertialOffer.Price;
          const originalPrice = commertialOffer.ListPrice;
          
          if (!offerPrice || offerPrice === 0 || offerPrice >= originalPrice) continue;

          offers.push({
            productName: product.productName,
            brand: product.brand,
            imageUrl: item.images?.[0]?.imageUrl || '',
            offerUrl: product.link,
            offerPrice: offerPrice,
            originalPrice: originalPrice,
            categoryHint: product.categories?.[0]?.replace(/^\/|\/$/g, '').split('/')[0] || null
          });
        } catch (err: any) {
          console.warn(`[JumboScraper] Error parsing a product: ${err.message}`);
        }
      }
    } catch (error: any) {
      throw new Error(`[JumboScraper Fetch Error] ${error.message}`);
    }

    return offers;
  }
}
