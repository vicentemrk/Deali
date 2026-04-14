import { chromium } from 'playwright';
import { StoreScraper, RawOffer } from './types';

const MAX_SCROLL_CYCLES = 8;
const TARGET_PRODUCTS   = 50;
const SCROLL_PAUSE_MS   = 2_000;
const LOAD_MORE_WAIT_MS = 3_000;

/**
 * AcuentaScraper — SMU Group (misma plataforma que Unimarc)
 *
 * aCuenta es una SPA con lazy load. Estrategia:
 *  - waitUntil: 'networkidle' para esperar hidratación completa
 *  - Iteración por múltiples categorías para alcanzar 50+ productos:
 *    /categorias/ofertas, /categorias/despensa, /categorias/bebidas,
 *    /categorias/lacteos, /categorias/carnes-y-aves
 *  - Scroll + Load More en cada URL de categoría
 *  - Deduplicación por productName para evitar repetidos entre categorías
 */
export class AcuentaScraper implements StoreScraper {
  storeSlug = 'acuenta';

  private readonly BASE_URL = 'https://www.acuenta.cl';

  // Iterate multiple categories to maximize product count
  private readonly CATEGORY_URLS = [
    'https://www.acuenta.cl/categorias/ofertas',
    'https://www.acuenta.cl/categorias/despensa',
    'https://www.acuenta.cl/categorias/bebidas',
    'https://www.acuenta.cl/categorias/lacteos',
    'https://www.acuenta.cl/categorias/carnes-y-aves',
  ];

  async scrape(): Promise<RawOffer[]> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: { 'Accept-Language': 'es-CL,es;q=0.9' },
    });

    // Block heavy assets to speed up load
    await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot}', (route) =>
      route.abort()
    );

    const page = await context.newPage();
    const offers: RawOffer[] = [];
    const seenNames = new Set<string>(); // dedup across categories

    try {
      for (const categoryUrl of this.CATEGORY_URLS) {
        // Stop iterating categories once we have enough
        if (offers.length >= TARGET_PRODUCTS) break;

        console.log(`[AcuentaScraper] → ${categoryUrl}`);

        try {
          await page.goto(categoryUrl, { waitUntil: 'networkidle', timeout: 45_000 });
          await page.waitForTimeout(1_500); // SPA hydration

          await page.waitForSelector(
            '.product-card, .ProductCard, [data-testid="product-card"], .catalog-item, article[class*="product"]',
            { timeout: 15_000 }
          ).catch(() => console.warn(`[AcuentaScraper] Selector timeout on ${categoryUrl}`));

          // ── Scroll + Load More ─────────────────────────────────────────
          for (let cycle = 0; cycle < MAX_SCROLL_CYCLES; cycle++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(SCROLL_PAUSE_MS);

            const currentCount = await page.$$eval(
              '.product-card, .ProductCard, [data-testid="product-card"], .catalog-item, article[class*="product"]',
              (els) => els.length
            ).catch(() => 0);

            const loadMoreClicked = await page.evaluate(() => {
              const selectors = [
                '[data-testid="load-more-btn"]',
                '.btn--load-more',
                'button[class*="load-more"]',
                'button[class*="LoadMore"]',
                '[class*="see-more"]',
                '[class*="ver-mas"]',
                '.show-more',
                'button[class*="show-more"]',
              ];
              for (const sel of selectors) {
                const btn = document.querySelector(sel) as HTMLElement | null;
                if (btn && btn.offsetParent !== null) {
                  btn.click();
                  return true;
                }
              }
              return false;
            });

            if (loadMoreClicked) await page.waitForTimeout(LOAD_MORE_WAIT_MS);
            if (currentCount >= TARGET_PRODUCTS && !loadMoreClicked) break;
          }
          // ──────────────────────────────────────────────────────────────

          const productNodes = await page.$$(
            '.product-card, .ProductCard, [data-testid="product-card"], .catalog-item, article[class*="product"]'
          );

          console.log(`[AcuentaScraper] ${categoryUrl}: ${productNodes.length} nodes`);

          for (const node of productNodes) {
            try {
              const productName = await node.$eval(
                '.product-title, .ProductTitle, [data-testid="product-name"], h2, h3, [class*="title"]',
                (el) => el.textContent?.trim() || ''
              ).catch(() => '');

              if (!productName) continue;

              // Dedup across categories
              const key = productName.trim().toLowerCase();
              if (seenNames.has(key)) continue;
              seenNames.add(key);

              const brand = await node.$eval(
                '.product-brand, .ProductBrand, [data-testid="product-brand"], [class*="brand"]',
                (el) => el.textContent?.trim() || null
              ).catch(() => null);

              const imageUrl = await node.$eval(
                'img',
                (el) => el.getAttribute('data-src') || el.getAttribute('src') || ''
              ).catch(() => '');

              const offerUrl = await node.$eval(
                'a',
                (el) => el.getAttribute('href') || ''
              ).catch(() => '');

              const offerPriceText = await node.$eval(
                '.price-current, .price-offer, [data-testid="price-offer"], [class*="offer"], [class*="current"], [class*="OfferPrice"]',
                (el) => el.textContent?.replace(/[^\d]/g, '') || '0'
              ).catch(() => '0');

              const originalPriceText = await node.$eval(
                '.price-old, .price-normal, [data-testid="price-normal"], [class*="old"], [class*="normal"], [class*="NormalPrice"], s',
                (el) => el.textContent?.replace(/[^\d]/g, '') || '0'
              ).catch(() => offerPriceText);

              const offerPrice    = parseInt(offerPriceText, 10);
              const originalPrice = parseInt(originalPriceText, 10);

              if (!offerPrice || offerPrice === 0 || offerPrice >= originalPrice) continue;

              // Use category URL slug as category hint when site doesn't expose it
              const categorySlug = categoryUrl.split('/').pop() ?? null;

              offers.push({
                productName,
                brand,
                imageUrl,
                offerUrl: offerUrl.startsWith('http') ? offerUrl : `${this.BASE_URL}${offerUrl}`,
                offerPrice,
                originalPrice,
                categoryHint: categorySlug !== 'ofertas' ? categorySlug : null,
              });
            } catch (error: any) {
              console.warn(`[AcuentaScraper] Error parsing node: ${error.message}`);
            }
          }
        } catch (navError: any) {
          console.warn(`[AcuentaScraper] Failed to scrape ${categoryUrl}: ${navError.message}`);
          // Continue to next category instead of aborting
        }
      }
    } catch (error: any) {
      await browser.close();
      throw new Error(`[AcuentaScraper Playwright Error] ${error.message}`);
    }

    await browser.close();
    console.log(`[AcuentaScraper] ✅ Total: ${offers.length} offers.`);
    return offers;
  }
}
