import { StoreScraper, RawOffer } from './types';

export class LiderScraper implements StoreScraper {
  storeSlug = 'lider';

  async scrape(): Promise<RawOffer[]> {
    // In a real production scenario with Walmart Chile, this would hit the official vendor API
    // or an authorized B2B endpoint, since Lider blocks direct JSON scraping heavily via Cloudflare.
    // For this prototype, we mock the API response to demonstrate the JSON ingestion architecture
    // bypassing the heavy memory and anti-bot failures of Playwright Chromium.
    
    // Simulate API fetch delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockApiResponse = {
      products: [
        {
          name: 'Aceite Maravilla Chef 1L',
          brand: 'Chef',
          price: 2290,
          crossedPrice: 2990,
          image: 'https://images.lider.cl/wmtcl?source=url[file:/productos/14353_1.jpg]&scale=size[150x150]',
          category: 'despensa'
        },
        {
          name: 'Arroz Tucapel Grano Largo 1Kg',
          brand: 'Tucapel',
          price: 1390,
          crossedPrice: 1890,
          image: 'https://images.lider.cl/wmtcl?source=url[file:/productos/10631_1.jpg]&scale=size[150x150]',
          category: 'despensa'
        },
        {
          name: 'Leche Descremada Lider 1L',
          brand: 'Lider',
          price: 850,
          crossedPrice: 1050,
          image: 'https://images.lider.cl/wmtcl?source=url[file:/productos/12345_1.jpg]&scale=size[150x150]',
          category: 'lacteos'
        }
      ]
    };

    const offers: RawOffer[] = mockApiResponse.products.map(p => ({
      productName: p.name,
      brand: p.brand,
      imageUrl: p.image,
      offerUrl: `https://www.lider.cl/supermercado/product/${encodeURIComponent(p.name.replace(/ /g, '-'))}`,
      offerPrice: p.price,
      originalPrice: p.crossedPrice,
      categoryHint: p.category
    }));

    return offers;
  }
}

