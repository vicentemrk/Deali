import { chromium } from 'playwright';
import { StoreScraper, RawOffer } from './types';

// Cuántos ciclos de scroll/load-more intentar (cada ciclo ≈ 10-20 productos)
const MAX_SCROLL_CYCLES = 6;
// Mínimo de productos que queremos antes de parar
const TARGET_PRODUCTS = 50;

export class TottusScraper implements StoreScraper {
  storeSlug = 'tottus';

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
      await page.goto('https://www.tottus.cl/tottus/ofertas', {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Wait for any product card selector (try multiple patterns)
      await page.waitForSelector(
        '.product-card, [data-testid="product-card"], .shelf-item, .ProductCard',
        { timeout: 15_000 }
      ).catch(() => console.warn('[TottusScraper] Initial selector timeout — continuing anyway'));

      // ── Scroll + Load More loop ────────────────────────────────────────
      for (let cycle = 0; cycle < MAX_SCROLL_CYCLES; cycle++) {
        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        // Count current products
        const currentCount = await page.$$eval(
          '.product-card, [data-testid="product-card"], .shelf-item, .ProductCard',
          (els) => els.length
        ).catch(() => 0);

        // Try clicking "Ver más" / "Cargar más" if exists
        const loadMoreClicked = await page.evaluate(() => {
          const selectors = [
            '[data-testid="btn-load-more"]',
            '.btn-load-more',
            '.load-more',
            'button[class*="load-more"]',
            'button[class*="LoadMore"]',
            'a[class*="load-more"]',
          ];
          for (const sel of selectors) {
            const btn = document.querySelector(sel) as HTMLElement | null;
            if (btn && btn.offsetParent !== null) { // visible
              btn.click();
              return true;
            }
          }
          return false;
        });

        if (loadMoreClicked) {
          await page.waitForTimeout(2500);
        }

        if (currentCount >= TARGET_PRODUCTS && !loadMoreClicked) break;
      }
      // ────────────────────────────────────────────────────────────────────

      // Parse all product cards found
      const productNodes = await page.$$(
        '.product-card, [data-testid="product-card"], .shelf-item, .ProductCard'
      );

      for (const node of productNodes) {
        try {
          const productName = await node.$eval(
            '.product-title, [data-testid="product-title"], .shelf-item__title, .ProductCard-title',
            (el) => el.textContent?.trim() || ''
          ).catch(() => '');

          if (!productName) continue;

          const brand = await node.$eval(
            '.product-brand, [data-testid="product-brand"], .brand-name',
            (el) => el.textContent?.trim() || null
          ).catch(() => null);

          const imageUrl = await node.$eval(
            'img',
            (el) => el.getAttribute('src') || el.getAttribute('data-src') || ''
          ).catch(() => '');

          const offerUrl = await node.$eval(
            'a',
            (el) => el.getAttribute('href') || ''
          ).catch(() => '');

          const offerPriceText = await node.$eval(
            '.price-best, [data-testid="price-offer"], .shelf-item__price--best, .current-price',
            (el) => el.textContent?.replace(/[^\d]/g, '') || '0'
          ).catch(() => '0');

          const originalPriceText = await node.$eval(
            '.price-normal, [data-testid="price-normal"], .shelf-item__price--normal, .original-price',
            (el) => el.textContent?.replace(/[^\d]/g, '') || '0'
          ).catch(() => offerPriceText);

          const offerPrice    = parseInt(offerPriceText, 10);
          const originalPrice = parseInt(originalPriceText, 10);

          if (!offerPrice || offerPrice === 0 || offerPrice >= originalPrice) continue;

          offers.push({
            productName,
            brand,
            imageUrl,
            offerUrl: offerUrl.startsWith('http') ? offerUrl : `https://www.tottus.cl${offerUrl}`,
            offerPrice,
            originalPrice,
            categoryHint: null,
          });
        } catch (error: any) {
          console.warn(`[TottusScraper] Error parsing node: ${error.message}`);
        }
      }
    } catch (error: any) {
      await browser.close();
      throw new Error(`[TottusScraper Playwright Error] ${error.message}`);
    }

    await browser.close();
    console.log(`[TottusScraper] ✅ Total: ${offers.length} offers.`);
    return offers;
  }
}
