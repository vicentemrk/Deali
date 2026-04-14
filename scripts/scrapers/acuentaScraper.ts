import { chromium } from 'playwright';
import { StoreScraper, RawOffer } from './types';

export class AcuentaScraper implements StoreScraper {
  storeSlug = 'acuenta';

  async scrape(): Promise<RawOffer[]> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const offers: RawOffer[] = [];

    try {
      await page.goto('https://www.acuenta.cl/categorias/ofertas', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.product-card', { timeout: 10000 });

      const productNodes = await page.$$('.product-card');

      for (const node of productNodes) {
        try {
          const productName = await node.$eval('.product-title', el => el.textContent?.trim() || '');
          const brand = await node.$eval('.product-brand', el => el.textContent?.trim() || '').catch(() => null);
          const imageUrl = await node.$eval('img', el => el.getAttribute('src') || '');
          const offerUrl = await node.$eval('a', el => el.getAttribute('href') || '');
          
          const offerPriceText = await node.$eval('.price-current', el => el.textContent?.replace(/[^\d]/g, '') || '0');
          const originalPriceText = await node.$eval('.price-old', el => el.textContent?.replace(/[^\d]/g, '') || '0').catch(() => offerPriceText);
          
          if (!productName || !imageUrl || !offerPriceText) continue;

          offers.push({
            productName,
            brand,
            imageUrl,
            offerUrl: offerUrl.startsWith('http') ? offerUrl : `https://www.acuenta.cl${offerUrl}`,
            offerPrice: parseInt(offerPriceText, 10),
            originalPrice: parseInt(originalPriceText, 10),
            categoryHint: null
          });
        } catch (error: any) {
            console.warn(`[AcuentaScraper] Error parsing node: ${error.message}`);
        }
      }

    } catch (error: any) {
      await browser.close();
      throw new Error(`[AcuentaScraper Playwright Error] ${error.message}`);
    }

    await browser.close();
    return offers;
  }
}
