import { chromium } from 'playwright';
import { StoreScraper, RawOffer } from './types';
import { parsePrice, parsePrices } from '../lib/priceParser';

const TARGET_PRODUCTS   = 75;
const MAX_CAMPAIGN_PAGES = 3;
const MAX_DISCOVERED_CAMPAIGNS = 10;

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
 * Descubre campañas activas desde /ofertas y scrapea cada una con paginacion.
 */
export class AcuentaScraper implements StoreScraper {
  storeSlug = 'acuenta';

  private readonly BASE_URL = 'https://www.acuenta.cl';
  private readonly OFFERS_URL = `${this.BASE_URL}/ofertas`;
  private readonly FALLBACK_CAMPAIGN_URLS = [
    `${this.BASE_URL}/ca/luka-dos-y-tres-lukas/60`,
    `${this.BASE_URL}/ca/canasta-ahorradora/400`,
    `${this.BASE_URL}/ca/ofertas-semanales/200`,
  ];

  private buildCampaignPageUrl(campaignUrl: string, pageNumber: number): string {
    if (pageNumber <= 1) return campaignUrl;

    const url = new URL(campaignUrl);
    url.searchParams.set('currentPage', String(pageNumber));
    return url.toString();
  }

  private parseCategoryHintFromUrl(url: string): string | null {
    const match = url.match(/\/ca\/([^/?#]+)/i);
    return match?.[1] ?? null;
  }

  private async discoverCampaignUrls(page: any): Promise<string[]> {
    try {
      await page.goto(this.OFFERS_URL, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      await page.waitForSelector('a[href*="/ca/"]', { timeout: 10_000 }).catch(() => undefined);

      const discovered = await page.$$eval('a[href*="/ca/"]', (elements: Element[]) => {
        const urls = new Set<string>();

        for (const element of elements) {
          const href = (element as HTMLAnchorElement).href || '';
          if (!href.includes('/ca/')) continue;
          if (href.includes('?')) continue;

          const normalized = href.replace(/\/$/, '');
          urls.add(normalized);
        }

        return Array.from(urls);
      });

      if (discovered.length === 0) {
        console.warn('[AcuentaScraper] Campaign discovery returned no URLs, using fallback list.');
        return this.FALLBACK_CAMPAIGN_URLS;
      }

      const limited = discovered.slice(0, MAX_DISCOVERED_CAMPAIGNS);
      console.log(`[AcuentaScraper] Discovered ${limited.length} active campaigns.`);
      return limited;
    } catch (error: any) {
      console.warn(`[AcuentaScraper] Campaign discovery failed: ${error.message}`);
      return this.FALLBACK_CAMPAIGN_URLS;
    }
  }

  private parseMoney(raw: string | null | undefined): number {
    return parsePrice(raw);
  }

  private parseMoneyValues(raw: string | null | undefined): number[] {
    return parsePrices(raw);
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
    const cards = await page
      .locator('[class*="StyledCard"], [data-testid="product-card"], article[class*="product"], li[class*="product"], a.containerCard')
      .all();

    for (const card of cards) {
      const productAnchor = card.locator('a[href*="/p/"], a[href*="/producto/"], a[href*="/articulo/"]').first();
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

      const basePriceValues = this.parseMoneyValues(basePriceText);
      const crossedValues = this.parseMoneyValues(crossedText);

      let offerPrice = basePriceValues[0] || 0;
      let originalPrice = 0;

      if (crossedValues.length > 0) {
        const greaterThanOffer = crossedValues.filter((value) => value > offerPrice);
        originalPrice = greaterThanOffer.length > 0
          ? Math.min(...greaterThanOffer)
          : Math.max(...crossedValues);
      }

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
        if (greater.length > 0) originalPrice = Math.min(...greater);
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
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: { 'Accept-Language': 'es-CL,es;q=0.9' },
    });
    const page = await context.newPage();

    try {
      const campaignUrls = await this.discoverCampaignUrls(page);

      for (const campaignUrl of campaignUrls) {
        if (offers.length >= TARGET_PRODUCTS) break;

        const categoryHint = this.parseCategoryHintFromUrl(campaignUrl);

        for (let pageNumber = 1; pageNumber <= MAX_CAMPAIGN_PAGES; pageNumber++) {
          if (offers.length >= TARGET_PRODUCTS) break;

          const pageUrl = this.buildCampaignPageUrl(campaignUrl, pageNumber);
          console.log(`[AcuentaScraper] -> ${pageUrl}`);

          try {
            await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
          } catch {
            console.warn(`[AcuentaScraper] Failed to load ${pageUrl}, skipping page.`);
            break;
          }

          await page.waitForTimeout(1_500);

          const hasProducts = await Promise.race([
            page
              .waitForSelector(
                '[class*="StyledCard"], a.containerCard, [data-testid="card-name"], a[href*="/p/"]',
                { timeout: 5_000 }
              )
              .then(() => true)
              .catch(() => false),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 6_000)),
          ]);

          if (!hasProducts) {
            console.warn(`[AcuentaScraper] No products on ${pageUrl}, ending this campaign.`);
            break;
          }

          const extracted = await this.extractCards(page);
          if (extracted.length === 0) {
            console.warn(`[AcuentaScraper] Empty card extraction on ${pageUrl}, ending this campaign.`);
            break;
          }

          console.log(`[AcuentaScraper] ${pageUrl}: ${extracted.length} cards`);

          let addedForPage = 0;
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

            addedForPage++;
            if (offers.length >= TARGET_PRODUCTS) break;
          }

          if (addedForPage === 0) {
            break;
          }
        }
      }
    } finally {
      await page.close().catch(() => undefined);
      await context.close().catch(() => undefined);
      await browser.close().catch(() => undefined);
    }

    console.log(`[AcuentaScraper] ✅ Total: ${offers.length} offers.`);
    return offers;
  }
}
