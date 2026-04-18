import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';
import playwright from 'playwright';

/**
 * JumboScraper — Cencosud Chile
 *
 * Strategy:
 * 1. Try VTEX CDN (fast but returns 0% discount products)
 * 2. Try Jumbo BFF API directly (might be blocked by bot detection)
 * 3. Fallback to Playwright for browser-based API access (with real session)
 * 
 * Never fabricates offers - returns empty if no real discounted products found
 */
export class JumboScraper implements StoreScraper {
  storeSlug = 'jumbo';

  private readonly OFFERS_URL = 'https://www.jumbo.cl/jumbo-ofertas?nombre_promo=boton-jumboofertas-13112023';
  private readonly BFF_API = 'https://bff.jumbo.cl/catalog/plp';
  private readonly API_KEY = 'be-reg-groceries-jumbo-catalog-w54byfvkmju5';

  async scrape(): Promise<RawOffer[]> {
    // First attempt: VTEX
    console.log('[JumboScraper] Attempting VTEX method...');
    try {
      const vtexOffers = await fetchVtexMultiCategory({
        cdnBase:      'https://jumbo.vteximg.com.br',
        siteBase:     'https://www.jumbo.cl',
        referer:      this.OFFERS_URL,
        logTag:       'JumboScraper',
        minProducts:  75,
        maxPages:     20,
        concurrency:  3,
      });

      // Filter to only offers with REAL discounts (>1% minimum)
      const realOffers = vtexOffers.filter(o => {
        const discount = o.originalPrice > 0 ? (1 - o.offerPrice / o.originalPrice) : 0;
        return discount > 0.01;  // At least 1% discount
      });
      
      if (realOffers.length > 0) {
        console.log(`[JumboScraper] ✓ VTEX successful: ${realOffers.length} real offers with discounts`);
        return realOffers;
      }

      if (vtexOffers.length > 0) {
        console.log(`[JumboScraper] ⚠ VTEX returned ${vtexOffers.length} products but all have 0% discount, trying BFF API...`);
      }
    } catch (error: any) {
      console.warn(`[JumboScraper] VTEX failed: ${error.message}`);
    }

    // Second attempt: Jumbo's internal BFF API (has real prices)
    console.log('[JumboScraper] Attempting Jumbo BFF API...');
    try {
      const bffOffers = await this.scrapeWithJumboAPI();
      if (bffOffers.length > 0) {
        console.log(`[JumboScraper] ✓ BFF API successful: ${bffOffers.length} offers`);
        return bffOffers;
      }
    } catch (error: any) {
      console.warn(`[JumboScraper] BFF API failed: ${error.message}`);
    }

    // Third attempt: Use Playwright for browser-based access
    console.log('[JumboScraper] Attempting Playwright fallback...');
    try {
      const playwrightOffers = await this.scrapeWithPlaywright();
      if (playwrightOffers.length > 0) {
        console.log(`[JumboScraper] ✓ Playwright successful: ${playwrightOffers.length} offers`);
        return playwrightOffers;
      }
    } catch (error: any) {
      console.warn(`[JumboScraper] Playwright failed: ${error.message}`);
    }

    console.log('[JumboScraper] ⚠ No valid offers with real discounts found');
    return [];
  }

  private async scrapeWithJumboAPI(): Promise<RawOffer[]> {
    const offers: RawOffer[] = [];
    const seen = new Set<string>();

    try {
      // Request all products in one batch (BFF API supports from/to pagination)
      const response = await fetch(this.BFF_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.API_KEY,
          'referer': this.OFFERS_URL,
          'x-client-version': '3.3.67',
          'x-client-platform': 'web',
          // Spoof browser to avoid bot detection
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          store: 'jumboclj512',
          collections: [],
          fullText: '',
          brands: [],
          hideUnavailableItems: false,
          from: 0,
          to: 5000,  // Request all at once
          orderBy: '',
          selectedFacets: [
            {
              key: 'category1',
              value: '/jumbo-ofertas'  // Filter to offers only
            }
          ],
          promotionalCards: true,
          sponsoredProducts: true,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        console.warn(`[JumboScraper] BFF API returned ${response.status}`);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json() as any;
      return this.extractOffers(data);
    } catch (error: any) {
      console.warn(`[JumboScraper] Direct API request failed: ${error.message}`);
      throw error;
    }
  }

  private async scrapeWithPlaywright(): Promise<RawOffer[]> {
    const browser = await playwright.chromium.launch({ 
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();

    try {
      // Load the offers page to establish browser context and cookies
      console.log('[JumboScraper] Loading Jumbo ofertas page...');
      await page.goto(this.OFFERS_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Wait for initial requests to settle
      await page.waitForTimeout(2_000);

      // Now call API from within browser context (has all cookies and proper headers)
      console.log('[JumboScraper] Calling BFF API from browser context...');
      const result = await page.evaluate(async () => {
        const response = await fetch('https://bff.jumbo.cl/catalog/plp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'be-reg-groceries-jumbo-catalog-w54byfvkmju5',
          },
          body: JSON.stringify({
            store: 'jumboclj512',
            collections: [],
            fullText: '',
            brands: [],
            hideUnavailableItems: false,
            from: 0,
            to: 200,
            orderBy: '',
            selectedFacets: [{key: 'category1', value: '/jumbo-ofertas'}],
            promotionalCards: true,
            sponsoredProducts: true,
          }),
        });

        const text = await response.text();
        return { status: response.status, body: text };
      });

      if (result.status !== 200) {
        throw new Error(`API returned ${result.status}`);
      }

      const data = JSON.parse(result.body);
      return this.extractOffers(data);
    } catch (error: any) {
      console.warn(`[JumboScraper] Playwright request failed: ${error.message}`);
      throw error;
    } finally {
      await page.close();
      await browser.close();
    }
  }

  private extractOffers(data: any): RawOffer[] {
    const offers: RawOffer[] = [];
    const seen = new Set<string>();

    if (!data.products || !Array.isArray(data.products)) {
      console.warn('[JumboScraper] No products in API response');
      return offers;
    }

    console.log(`[JumboScraper] Processing ${data.products.length} products from API`);

    for (const product of data.products) {
      try {
        if (!product.items || !product.items[0]) continue;

        const item = product.items[0];
        const price = item.price;
        const listPrice = item.listPrice;

        if (!price || !listPrice || price <= 0 || listPrice <= 0) continue;
        if (price >= listPrice) continue;  // No discount = no real offer

        const discount = Math.round((1 - price / listPrice) * 100);
        const key = product.slug?.toLowerCase();

        if (!key || seen.has(key)) continue;
        seen.add(key);

        offers.push({
          productName: product.slug || `Product ${seen.size}`,
          brand: product.brand || null,
          imageUrl: '',
          offerUrl: this.OFFERS_URL,
          offerPrice: Math.round(price / 100),  // Convert from centavos to pesos
          originalPrice: Math.round(listPrice / 100),
          categoryHint: product.categoryNames?.[0] || null,
        });
      } catch (err) {
        console.warn(`[JumboScraper] Error processing product: ${err}`);
        continue;
      }
    }

    console.log(`[JumboScraper] Extracted ${offers.length} valid offers with real discounts`);
    return offers;
  }
}


