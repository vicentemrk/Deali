import { StoreScraper, RawOffer } from './types';
import { parsePrice } from '../lib/priceParser';

const TARGET_PRODUCTS   = 75;

type UnimarcSeller = {
  price?: string | number;
  listPrice?: string | number;
};

type UnimarcProduct = {
  name?: string;
  brand?: string;
  detailUrl?: string;
  images?: Array<string | { src?: string; url?: string }>;
  categories?: string[];
  promotion?: {
    price?: number;
    saving?: number;
  };
  sellers?: UnimarcSeller[];
};

/**
 * UnimarcScraper — SMU Group
 *
 * Unimarc expone productos en __NEXT_DATA__ (dehydratedState -> searchesIntelligence).
 * Se parsea directly availableProducts en los links promotionsOnly provistos por el usuario.
 */
export class UnimarcScraper implements StoreScraper {
  storeSlug = 'unimarc';

  private readonly BASE_URL   = 'https://www.unimarc.cl';
  private readonly OFFERS_URLS = [
    'https://www.unimarc.cl/ofertas/black-ofertazo?promotionsOnly=true',
    ...Array.from({ length: 6 }, (_, i) => `https://www.unimarc.cl/ofertas/black-ofertazo?promotionsOnly=true&page=${i + 2}`),
  ];

  private parseCategoryHintFromUrl(url: string): string | null {
    const black = url.match(/\/ofertas\/([^/?#]+)/i)?.[1];
    if (black) return black;
    return null;
  }

  private parseMoney(raw: string | number | null | undefined): number {
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
    return parsePrice(raw as string | null | undefined);
  }

  private extractCategoryHintFromProduct(product: UnimarcProduct): string | null {
    const first = product.categories?.[0];
    if (!first) return null;
    const parts = first.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    return parts[0] ?? null;
  }

  private mapProductToOffer(product: UnimarcProduct, fallbackCategoryHint: string | null): RawOffer | null {
    const productName = (product.name || '').trim();
    if (!productName) return null;

    const seller = product.sellers?.[0];
    const sellerPrice = this.parseMoney(seller?.price);
    const sellerListPrice = this.parseMoney(seller?.listPrice);
    const promoPrice = this.parseMoney(product.promotion?.price);
    const promoSaving = this.parseMoney(product.promotion?.saving);

    const offerPrice = sellerPrice || promoPrice;
    let originalPrice = sellerListPrice;

    if (!originalPrice && promoPrice && promoSaving) {
      originalPrice = promoPrice + promoSaving;
    }

    if (!offerPrice || !originalPrice || offerPrice >= originalPrice) return null;

    // Unimarc images can be: string directly in array, or objects with src/url
    let imageUrl = '';
    const firstImage = product.images?.[0];
    if (typeof firstImage === 'string') {
      imageUrl = firstImage;
    } else if (typeof firstImage === 'object') {
      imageUrl = firstImage.src || firstImage.url || '';
    }

    const detailUrl = product.detailUrl || '';

    return {
      productName,
      brand: product.brand || null,
      imageUrl,
      offerUrl: detailUrl.startsWith('http') ? detailUrl : `${this.BASE_URL}${detailUrl}`,
      offerPrice,
      originalPrice,
      categoryHint: this.extractCategoryHintFromProduct(product) || fallbackCategoryHint,
    };
  }

  private async fetchProductsFromCampaignUrl(url: string): Promise<UnimarcProduct[]> {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'es-CL,es;q=0.9',
      },
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
    const fallbackScriptMatch = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
    const nextDataRaw = nextDataMatch?.[1] || fallbackScriptMatch?.[1] || null;
    if (!nextDataRaw) {
      console.warn(`[UnimarcScraper] Missing __NEXT_DATA__ on ${url}`);
      return [];
    }

    let nextData: any;
    try {
      nextData = JSON.parse(nextDataRaw);
    } catch {
      console.warn(`[UnimarcScraper] Invalid __NEXT_DATA__ payload on ${url}`);
      return [];
    }

    const queries = nextData?.props?.pageProps?.dehydratedState?.queries;
    if (!Array.isArray(queries)) return [];

    const searchQuery = queries.find((query: any) => {
      const key = JSON.stringify(query?.queryKey || '');
      return key.includes('searchesIntelligence');
    });

    const products = searchQuery?.state?.data?.data?.availableProducts;
    if (!Array.isArray(products)) {
      console.warn(`[UnimarcScraper] searchesIntelligence payload missing on ${url}`);
      return [];
    }

    return Array.isArray(products) ? products : [];
  }

  async scrape(): Promise<RawOffer[]> {
    const offers: RawOffer[] = [];
    const seenNames = new Set<string>();

    try {
      for (const url of this.OFFERS_URLS) {
        if (offers.length >= TARGET_PRODUCTS) break;

        try {
          console.log(`[UnimarcScraper] → ${url}`);
          const products = await this.fetchProductsFromCampaignUrl(url);
          console.log(`[UnimarcScraper] ${url}: ${products.length} products`);

          const categoryHint = this.parseCategoryHintFromUrl(url);

          for (const product of products) {
            const offer = this.mapProductToOffer(product, categoryHint);
            if (!offer) continue;

            const key = offer.productName.trim().toLowerCase();
            if (seenNames.has(key)) continue;
            seenNames.add(key);

            offers.push(offer);

            if (offers.length >= TARGET_PRODUCTS) break;
          }
        } catch (error: any) {
          console.warn(`[UnimarcScraper] Failed to scrape ${url}: ${error.message}`);
        }
      }
    } catch (error: any) {
      throw new Error(`[UnimarcScraper Error] ${error.message}`);
    }

    console.log(`[UnimarcScraper] ✅ Total: ${offers.length} offers.`);
    return offers;
  }
}
