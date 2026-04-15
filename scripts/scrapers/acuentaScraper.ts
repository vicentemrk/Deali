import { chromium } from 'playwright';
import { StoreScraper, RawOffer } from './types';

const TARGET_PRODUCTS   = 50;

type ExtractedCard = {
  productName: string;
  imageUrl: string;
  offerUrl: string;
  offerPrice: number;
  originalPrice: number;
};

const CARD_FIELD_TIMEOUT_MS = 1_200;

/**
 * AcuentaScraper — SMU Group
 *
 * Usa campañas explícitas provistas por el usuario:
 *  - /ca/luka-dos-y-tres-lukas/60 (páginas 1..10)
 *  - /ca/canasta-ahorradora/400 (páginas 1..2)
 */
export class AcuentaScraper implements StoreScraper {
  storeSlug = 'acuenta';

  private readonly BASE_URL = 'https://www.acuenta.cl';

  private readonly CAMPAIGN_URLS = [
    'https://www.acuenta.cl/ca/luka-dos-y-tres-lukas/60',
    ...Array.from({ length: 9 }, (_, i) => `https://www.acuenta.cl/ca/luka-dos-y-tres-lukas/60?currentPage=${i + 2}`),
    'https://www.acuenta.cl/ca/canasta-ahorradora/400',
    'https://www.acuenta.cl/ca/canasta-ahorradora/400?currentPage=2',
  ];

  private parseCategoryHintFromUrl(url: string): string | null {
    const match = url.match(/\/ca\/([^/?#]+)/i);
    return match?.[1] ?? null;
  }

  private parseMoney(raw: string | null | undefined): number {
    const digits = (raw || '').replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }

  private async safeText(locator: any): Promise<string | null> {
    return locator
      .textContent({ timeout: CARD_FIELD_TIMEOUT_MS })
      .then((value: string | null) => value)
      .catch(() => null);
  }

  private async safeAttr(locator: any, attr: string): Promise<string | null> {
    return locator
      .getAttribute(attr, { timeout: CARD_FIELD_TIMEOUT_MS })
      .then((value: string | null) => value)
      .catch(() => null);
  }

  private async safeInnerText(locator: any): Promise<string> {
    return locator
      .innerText({ timeout: CARD_FIELD_TIMEOUT_MS })
      .then((value: string) => value)
      .catch(() => '');
  }

  private async extractCards(page: any): Promise<ExtractedCard[]> {
    const out: ExtractedCard[] = [];
    const cards = await page.locator('[class*="StyledCard"]').all();

    for (const card of cards) {
      const productAnchor = card.locator('a[href*="/p/"]').first();
      const href = await this.safeAttr(productAnchor, 'href');
      if (!href) continue;

      const rawName = (await this.safeText(card.locator('[data-testid="card-name"]').first())) || '';
      const fallbackName = (await this.safeText(productAnchor)) || '';
      const productName = (rawName || fallbackName).replace(/\s+/g, ' ').trim().slice(0, 180);
      if (!productName) continue;

      const imageNode = card.locator('img').first();
      const srcset = await this.safeAttr(imageNode, 'srcset');
      const dataSrc = await this.safeAttr(imageNode, 'data-src');
      const src = await this.safeAttr(imageNode, 'src');
      const imageUrl = srcset
        ? (srcset.split(',').map((v: string) => v.trim()).pop()?.split(/\s+/)[0] || '')
        : (dataSrc || src || '');

      const basePriceText = await this.safeText(card.locator('[data-testid="card-base-price"]').first());
      const crossedText = await this.safeText(card.locator('[data-testid^="crossed-out-price"], s, del').first());
      const text = (await this.safeInnerText(card)).replace(/\s+/g, ' ').trim();

      let offerPrice = this.parseMoney(basePriceText);
      let originalPrice = this.parseMoney(crossedText);

      const candidates: Array<{ value: number; isPerUnit: boolean; isEach: boolean }> = [];
      const re = /\$\s*([\d\.]+)([^$]{0,26})/g;
      let match = re.exec(text);
      while (match) {
        const value = this.parseMoney(match[1]);
        if (value > 0) {
          const tail = (match[2] || '').toLowerCase();
          const isPerUnit = /por\s|x\s*(kg|g|l|lt|ml|un|u\b|mts?|m\b|100|100un)/i.test(tail);
          const isEach = /c\/?u/.test(tail);
          candidates.push({ value, isPerUnit, isEach });
        }
        match = re.exec(text);
      }

      const eachPrice = candidates.find((c) => c.isEach)?.value || 0;
      const numericCandidates = candidates.filter((c) => !c.isPerUnit || c.isEach).map((c) => c.value);

      if (!offerPrice) {
        offerPrice = eachPrice || numericCandidates[0] || 0;
      }

      if (!originalPrice && numericCandidates.length >= 2) {
        const greater = numericCandidates.filter((value) => value > offerPrice);
        if (greater.length > 0) originalPrice = greater[greater.length - 1];
      }

      const multiBuyMatch = text.match(/(\d+)\s*X\s*\$\s*([\d\.]+)/i);
      if (multiBuyMatch) {
        const qty = parseInt(multiBuyMatch[1], 10);
        const total = this.parseMoney(multiBuyMatch[2]);
        if (qty > 0 && total > 0) {
          const bundleUnitPrice = Math.round(total / qty);
          if (!offerPrice) {
            offerPrice = bundleUnitPrice;
          } else if (bundleUnitPrice !== offerPrice) {
            const low = Math.min(bundleUnitPrice, offerPrice);
            const high = Math.max(bundleUnitPrice, offerPrice);
            offerPrice = low;
            if (!originalPrice) originalPrice = high;
          }
        }
      }

      out.push({
        productName,
        imageUrl,
        offerUrl: href,
        offerPrice,
        originalPrice,
      });
    }

    return out.filter((item) => item.productName && item.offerUrl && item.offerPrice > 0);
  }

  async scrape(): Promise<RawOffer[]> {
    const offers: RawOffer[] = [];
    const seenNames = new Set<string>();

    for (const campaignUrl of this.CAMPAIGN_URLS) {
      if (offers.length >= TARGET_PRODUCTS) break;

      console.log(`[AcuentaScraper] → ${campaignUrl}`);

      let browser: any;
      let context: any;
      let page: any;

      try {
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext({
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          viewport: { width: 1440, height: 900 },
          extraHTTPHeaders: { 'Accept-Language': 'es-CL,es;q=0.9' },
        });
        page = await context.newPage();

        await page.goto(campaignUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.waitForTimeout(4_000);

        const hasProducts = await page.waitForSelector(
          '[class*="StyledCard"], a.containerCard, [data-testid="card-name"], a[href*="/p/"]',
          { timeout: 15_000 }
        ).then(() => true).catch(() => false);

        if (!hasProducts) {
          console.warn(`[AcuentaScraper] Selector timeout on ${campaignUrl}`);
          continue;
        }

        const extracted = await this.extractCards(page);
        console.log(`[AcuentaScraper] ${campaignUrl}: ${extracted.length} cards`);

        const categoryHint = this.parseCategoryHintFromUrl(campaignUrl);

        for (const item of extracted) {
          const key = item.productName.trim().toLowerCase();
          if (seenNames.has(key)) continue;
          seenNames.add(key);

          if (!item.originalPrice || item.offerPrice >= item.originalPrice) continue;

          offers.push({
            productName: item.productName,
            brand: null,
            imageUrl: item.imageUrl,
            offerUrl: item.offerUrl.startsWith('http') ? item.offerUrl : `${this.BASE_URL}${item.offerUrl}`,
            offerPrice: item.offerPrice,
            originalPrice: item.originalPrice,
            categoryHint,
          });

          if (offers.length >= TARGET_PRODUCTS) break;
        }
      } catch (navError: any) {
        console.warn(`[AcuentaScraper] Failed to scrape ${campaignUrl}: ${navError.message}`);
      } finally {
        await page?.close().catch(() => undefined);
        await context?.close().catch(() => undefined);
        await browser?.close().catch(() => undefined);
      }
    }

    console.log(`[AcuentaScraper] ✅ Total: ${offers.length} offers.`);
    return offers;
  }
}
