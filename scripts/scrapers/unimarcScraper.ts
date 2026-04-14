import { chromium } from 'playwright';
import { StoreScraper, RawOffer } from './types';

const MAX_SCROLL_CYCLES = 8;   // More cycles → more lazy-loaded content
const TARGET_PRODUCTS   = 50;
const SCROLL_PAUSE_MS   = 2_000;
const LOAD_MORE_WAIT_MS = 3_000;

/**
 * UnimarcScraper — SMU Group
 *
 * Unimarc es una SPA con lazy load. Se usa:
 *  - waitUntil: 'networkidle' para esperar hidratación completa
 *  - Scroll automático para forzar carga lazy
 *  - Click en "Ver más" / "Cargar más" si existe
 */
export class UnimarcScraper implements StoreScraper {
  storeSlug = 'unimarc';

  private readonly BASE_URL   = 'https://www.unimarc.cl';
  private readonly OFFERS_URL = 'https://www.unimarc.cl/ofertas';

  async scrape(): Promise<RawOffer[]> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
      // Block images/fonts to speed up load and save bandwidth
      extraHTTPHeaders: { 'Accept-Language': 'es-CL,es;q=0.9' },
    });

    // Block heavy assets
    await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot}', (route) =>
      route.abort()
    );

    const page = await context.newPage();
    const offers: RawOffer[] = [];

    try {
      // networkidle waits until no network requests for 500ms — catches SPA hydration
      await page.goto(this.OFFERS_URL, { waitUntil: 'networkidle', timeout: 45_000 });

      // Extra wait for SPA JS hydration after networkidle fires
      await page.waitForTimeout(1_500);

      await page.waitForSelector(
        '.ProductCard, .product-card, [data-testid="product-card"], .catalog-item, article[class*="product"]',
        { timeout: 15_000 }
      ).catch(() => console.warn('[UnimarcScraper] Initial selector timeout — continuing'));

      // ── Scroll + Load More loop ──────────────────────────────────────────
      for (let cycle = 0; cycle < MAX_SCROLL_CYCLES; cycle++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(SCROLL_PAUSE_MS);

        const currentCount = await page.$$eval(
          '.ProductCard, .product-card, [data-testid="product-card"], .catalog-item, article[class*="product"]',
          (els) => els.length
        ).catch(() => 0);

        const loadMoreClicked = await page.evaluate(() => {
          const selectors = [
            '[data-testid="load-more-btn"]',
            '.btn--load-more',
            'button[class*="load-more"]',
            'button[class*="LoadMore"]',
            'button[class*="ver-mas"]',
            '[class*="see-more"]',
            '[class*="ver-mas"]',
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
      // ────────────────────────────────────────────────────────────────────

      const productNodes = await page.$$(
        '.ProductCard, .product-card, [data-testid="product-card"], .catalog-item, article[class*="product"]'
      );

      console.log(`[UnimarcScraper] Found ${productNodes.length} product nodes.`);

      for (const node of productNodes) {
        try {
          const productName = await node.$eval(
            '.ProductTitle, .product-title, [data-testid="product-name"], h2, h3, [class*="title"]',
            (el) => el.textContent?.trim() || ''
          ).catch(() => '');

          if (!productName) continue;

          const brand = await node.$eval(
            '.ProductBrand, .product-brand, [data-testid="product-brand"], [class*="brand"]',
            (el) => el.textContent?.trim() || null
          ).catch(() => null);

          const imageUrl = await node.$eval(
            'img.ProductImage, img[data-testid="product-image"], img',
            (el) => el.getAttribute('data-src') || el.getAttribute('src') || ''
          ).catch(() => '');

          const offerUrl = await node.$eval(
            'a',
            (el) => el.getAttribute('href') || ''
          ).catch(() => '');

          const offerPriceText = await node.$eval(
            '.Price--offer, .price-offer, [data-testid="price-offer"], [class*="offer-price"], [class*="OfferPrice"], [class*="price-best"]',
            (el) => el.textContent?.replace(/[^\d]/g, '') || '0'
          ).catch(() => '0');

          const originalPriceText = await node.$eval(
            '.Price--normal, .price-normal, [data-testid="price-normal"], [class*="normal-price"], [class*="NormalPrice"], [class*="price-old"], s',
            (el) => el.textContent?.replace(/[^\d]/g, '') || '0'
          ).catch(() => offerPriceText);

          const offerPrice    = parseInt(offerPriceText, 10);
          const originalPrice = parseInt(originalPriceText, 10);

          if (!offerPrice || offerPrice === 0 || offerPrice >= originalPrice) continue;

          offers.push({
            productName,
            brand,
            imageUrl,
            offerUrl: offerUrl.startsWith('http') ? offerUrl : `${this.BASE_URL}${offerUrl}`,
            offerPrice,
            originalPrice,
            categoryHint: null,
          });
        } catch (error: any) {
          console.warn(`[UnimarcScraper] Error parsing node: ${error.message}`);
        }
      }
    } catch (error: any) {
      await browser.close();
      throw new Error(`[UnimarcScraper Playwright Error] ${error.message}`);
    }

    await browser.close();
    console.log(`[UnimarcScraper] ✅ Total: ${offers.length} offers.`);
    return offers;
  }
}
