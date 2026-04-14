import { chromium } from 'playwright';
import { StoreScraper, RawOffer } from './types';

const MAX_SCROLL_CYCLES = 6;
const TARGET_PRODUCTS   = 50;

/**
 * UnimarcScraper — SMU Group
 *
 * Unimarc y Acuenta comparten la misma plataforma (SMU). El scraper
 * usa Playwright con scroll automático y click en "Ver más" para extraer
 * 50+ productos de la sección de ofertas.
 * También intenta paginación por URL (?page=N) como alternativa.
 */
export class UnimarcScraper implements StoreScraper {
  storeSlug = 'unimarc';

  private readonly BASE_URL  = 'https://www.unimarc.cl';
  private readonly OFFERS_URL = 'https://www.unimarc.cl/ofertas';

  async scrape(): Promise<RawOffer[]> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    const offers: RawOffer[] = [];

    try {
      await page.goto(this.OFFERS_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      await page.waitForSelector(
        '.ProductCard, .product-card, [data-testid="product-card"], .catalog-item',
        { timeout: 15_000 }
      ).catch(() => console.warn('[UnimarcScraper] Initial selector timeout'));

      // ── Scroll + Load More ─────────────────────────────────────────────
      for (let cycle = 0; cycle < MAX_SCROLL_CYCLES; cycle++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        const currentCount = await page.$$eval(
          '.ProductCard, .product-card, [data-testid="product-card"], .catalog-item',
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

        if (loadMoreClicked) await page.waitForTimeout(2500);
        if (currentCount >= TARGET_PRODUCTS && !loadMoreClicked) break;
      }
      // ────────────────────────────────────────────────────────────────────

      const productNodes = await page.$$(
        '.ProductCard, .product-card, [data-testid="product-card"], .catalog-item'
      );

      for (const node of productNodes) {
        try {
          const productName = await node.$eval(
            '.ProductTitle, .product-title, [data-testid="product-name"], h2, h3',
            (el) => el.textContent?.trim() || ''
          ).catch(() => '');

          if (!productName) continue;

          const brand = await node.$eval(
            '.ProductBrand, .product-brand, [data-testid="product-brand"]',
            (el) => el.textContent?.trim() || null
          ).catch(() => null);

          const imageUrl = await node.$eval(
            'img.ProductImage, img[data-testid="product-image"], img',
            (el) => el.getAttribute('src') || el.getAttribute('data-src') || ''
          ).catch(() => '');

          const offerUrl = await node.$eval(
            'a',
            (el) => el.getAttribute('href') || ''
          ).catch(() => '');

          const offerPriceText = await node.$eval(
            '.Price--offer, .price-offer, [data-testid="price-offer"], [class*="offer-price"]',
            (el) => el.textContent?.replace(/[^\d]/g, '') || '0'
          ).catch(() => '0');

          const originalPriceText = await node.$eval(
            '.Price--normal, .price-normal, [data-testid="price-normal"], [class*="normal-price"]',
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
