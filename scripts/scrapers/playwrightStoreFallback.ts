import { chromium } from 'playwright';
import { RawOffer } from './types';
import { parsePrice } from '../lib/priceParser';

interface PlaywrightFallbackConfig {
  logTag: string;
  baseUrl: string;
  categoryUrls: string[];
  maxProducts?: number;
}

const MAX_SCROLL_CYCLES = 8;

export async function scrapeStoreWithPlaywrightFallback(
  config: PlaywrightFallbackConfig
): Promise<RawOffer[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'es-CL,es;q=0.9' },
  });

  await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot}', (route) =>
    route.abort()
  );

  const allOffers: RawOffer[] = [];
  const seenNames = new Set<string>();
  const maxProducts = config.maxProducts ?? 75;

  try {
    for (const categoryUrl of config.categoryUrls) {
      if (allOffers.length >= maxProducts) break;

      const page = await context.newPage();
      console.log(`[${config.logTag}] Playwright fallback → ${categoryUrl}`);

      try {
        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 40_000 });
        await page.waitForTimeout(2_000);

        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
          const accept = buttons.find((btn) => /aceptar|accept|entendido/i.test(btn.textContent || ''));
          accept?.click();
        }).catch(() => undefined);

        for (let i = 0; i < MAX_SCROLL_CYCLES; i++) {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(1_500);
        }

        const categoryHint = categoryUrl.split('/').filter(Boolean).pop() || null;

        const items = await page.evaluate((origin) => {
          const cardSelectors = [
            '[role="group"][aria-label="Producto"]',
            '[aria-label="Producto"]',
            'article.vtex-product-summary-2-x-element',
            '.vtex-product-summary-2-x-container',
            '[data-testid="product-card"]',
            'article[class*="product"]',
            'li[class*="galleryItem"]',
          ];

          const cards = cardSelectors
            .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
            .filter((card, idx, arr) => arr.indexOf(card) === idx);

          return cards.map((card) => {
            const getText = (selectors: string[]) => {
              for (const selector of selectors) {
                const el = card.querySelector(selector);
                if (el?.textContent?.trim()) return el.textContent.trim();
              }
              return '';
            };

            const cardText = (card.textContent || '').replace(/\s+/g, ' ').trim();
            const textPrices = cardText.match(/\$\s?[\d\.]+/g) || [];

            const name = getText([
              '[class*="productBrand"]',
              '[class*="productName"]',
              '[class*="product-name"]',
              '[class*="nameContainer"]',
              '[data-automation-id*="product-name"]',
              'h2',
              'h3',
              'span',
            ]);

            const sellingPrice = getText([
              '[class*="sellingPriceValue"]',
              '[class*="spotPriceValue"]',
              '[class*="price_sellingPrice"]',
              '[data-testid="selling-price"]',
              '[class*="price-current"]',
            ]);

            const listPrice = getText([
              '[class*="listPriceValue"]',
              '[class*="price_listPrice"]',
              '[data-testid="list-price"]',
              '[class*="price-old"]',
            ]);

            const deepLink = card.querySelector('a[href*="/ip/"], a[href*="/articulo/"]') as HTMLAnchorElement | null;
            const anchor = deepLink || (card.querySelector('a[href]') as HTMLAnchorElement | null);
            const img = card.querySelector('img') as HTMLImageElement | null;
            const href = anchor?.getAttribute('href') || '';
            const offerUrl = href.startsWith('http') ? href : `${origin}${href}`;

            return {
              productName: name,
              imageUrl: img?.src || img?.getAttribute('data-src') || '',
              offerPriceText: sellingPrice || textPrices[0] || '',
              originalPriceText: listPrice || textPrices[1] || '',
              offerUrl,
            };
          });
        }, config.baseUrl);

        for (const item of items) {
          const nameKey = item.productName.trim().toLowerCase();
          if (!nameKey || seenNames.has(nameKey)) continue;

          const offerPrice = parsePrice(item.offerPriceText);
          const originalPrice = parsePrice(item.originalPriceText);

          if (!offerPrice || !originalPrice || offerPrice >= originalPrice) continue;

          seenNames.add(nameKey);
          allOffers.push({
            productName: item.productName,
            brand: null,
            imageUrl: item.imageUrl,
            offerUrl: item.offerUrl,
            offerPrice,
            originalPrice,
            categoryHint: categoryHint === 'ofertas' ? null : categoryHint,
          });

          if (allOffers.length >= maxProducts) break;
        }
      } catch (error: any) {
        console.warn(`[${config.logTag}] Playwright fallback failed on ${categoryUrl}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`[${config.logTag}] Playwright fallback total: ${allOffers.length} offers.`);
  return allOffers;
}
