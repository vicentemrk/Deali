import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';
import { scrapeStoreWithPlaywrightFallback } from './playwrightStoreFallback';
import { parseCLP } from '../lib/priceParser';

const TARGET_PRODUCTS = 100;

import { mergeUniqueOffers } from '../lib/mergeOffers';

const LIDER_PROMO_URLS = [
  'https://super.lider.cl/content/productos-a-mil/96311243?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_trafico_vertodo&co_or=1',
  'https://super.lider.cl/content/mainstays/42638900?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_camp_mainstays&co_or=4',
  'https://super.lider.cl/browse/Activaciones/Supermecado/Supermercado-131/20126634_89720227_98986479?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_camp_edlp&co_or=3',
  'https://super.lider.cl/browse/Productos-a-mil/Productos-a-1000/96311243_72163828?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_trafico_productosmil&co_or=2',
  'https://super.lider.cl/browse/Productos-a-mil/Productos-a-2000/96311243_24584919?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_trafico_productos2mil&co_or=3',
  'https://super.lider.cl/browse/Productos-a-mil/Productos-a-3000/96311243_26319580?ContentZone3&co_ty=Hubspokes&co_nm=tusfavoritos_W15&co_id=09042026_trafico_productos3mil&co_or=4',
];

async function fetchLiderHtmlOffers(cookieHeader?: string): Promise<RawOffer[]> {
  const offers: RawOffer[] = [];
  const seen = new Set<string>();

  for (const url of LIDER_PROMO_URLS) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://super.lider.cl/',
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        signal: AbortSignal.timeout(25_000),
      });

      if (!response.ok) {
        console.warn(`[LiderScraper] HTML fallback failed (${url}): HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      if (/Robot or human\?/i.test(html)) {
        console.warn('[LiderScraper] HTML fallback hit challenge page.');
        continue;
      }

      const productRegex = /\{"canAddToCart":(?<obj>[\s\S]*?)"name":"(?<name>[^\"]+)"(?<tail>[\s\S]*?)"price":(?<price>\d+)(?<rest>[\s\S]*?)"brand":"(?<brand>[^\"]*)"(?<afterBrand>[\s\S]*?)"canonicalUrl":"(?<href>\/ip\/[^\"]+)"\}/g;
      let match: RegExpExecArray | null;

      while ((match = productRegex.exec(html)) !== null) {
        const href = match.groups?.href || '';
        const name = (match.groups?.name || '').trim();
        const price = parseInt(match.groups?.price || '0', 10);
        const merged = `${match.groups?.obj || ''}${match.groups?.tail || ''}${match.groups?.rest || ''}${match.groups?.afterBrand || ''}`;

        if (!href || !name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;

        if (!price || Number.isNaN(price)) continue;

        const wasPriceMatch = merged.match(/"wasPrice":"\$(?<was>[\d\.]+)"/);
        const imageMatch = merged.match(/"image":"(?<img>[^\"]+)"/);
        const categoryMatch = merged.match(/"categoryPath":"(?<cat>[^\"]+)"/);

        const offerPrice = price;
        // Use shared priceParser instead of local function
        const wasPrice = parseCLP(wasPriceMatch?.groups?.was);
        const originalPrice = wasPrice > offerPrice ? wasPrice : offerPrice;

        seen.add(key);
        offers.push({
          productName: name,
          brand: (match.groups?.brand || null),
          imageUrl: imageMatch?.groups?.img || '',
          offerUrl: `https://super.lider.cl${href}`,
          offerPrice,
          originalPrice,
          categoryHint: categoryMatch?.groups?.cat || null,
        });
      }
    } catch (error: any) {
      console.warn(`[LiderScraper] HTML fallback error (${url}): ${error.message}`);
    }
  }

  console.log(`[LiderScraper] HTML fallback total: ${offers.length} offers.`);
  return offers;
}

/**
 * LiderScraper — Walmart Chile
 *
 * Walmart Chile has anti-bot protections.
 * Strategy: use curated promo landings (HTML embedded data) first,
 * then Playwright fallback. VTEX legacy fetch is opt-in via env flag.
 *
 * Estado: Pendiente — el scraper es resiliente pero el endpoint puede no funcionar.
 */
export class LiderScraper implements StoreScraper {
  storeSlug = 'lider';

  async scrape(): Promise<RawOffer[]> {
    try {
      const cookieHeader = process.env.LIDER_COOKIE?.trim();
      const useLegacyVtex = process.env.LIDER_USE_VTEX === '1';
      let offers: RawOffer[] = [];

      console.log('[LiderScraper] Attempting HTML fallback method...');
      const htmlOffers = await fetchLiderHtmlOffers(cookieHeader);
      if (htmlOffers.length > 0) {
        console.log(`[LiderScraper] ✓ HTML fallback successful: ${htmlOffers.length} offers`);
        offers = mergeUniqueOffers(offers, htmlOffers);
      }

      if (useLegacyVtex && offers.length < TARGET_PRODUCTS) {
        console.log('[LiderScraper] Attempting legacy VTEX method...');
        const vtexOffers = await fetchVtexMultiCategory({
          cdnBase:      'https://lider.vteximg.com.br',
          fallbackBases:[
            'https://www.lider.cl',
            'https://lidercl.vtexassets.com',
          ],
          siteBase:     'https://www.lider.cl',
          pathPrefix:   '/supermercado',
        referer:      'https://super.lider.cl/',
          logTag:       'LiderScraper',
          minProducts:  TARGET_PRODUCTS,
          concurrency:  3,
          extraHeaders: cookieHeader ? { Cookie: cookieHeader } : undefined,
        });

        if (vtexOffers.length > 0) {
          console.log(`[LiderScraper] ✓ Legacy VTEX successful: ${vtexOffers.length} offers`);
          offers = mergeUniqueOffers(offers, vtexOffers);
        }
      }

      if (offers.length < TARGET_PRODUCTS) {
        console.log('[LiderScraper] Attempting Playwright fallback method...');
        const playwrightOffers = await scrapeStoreWithPlaywrightFallback({
          logTag: 'LiderScraper',
          baseUrl: 'https://www.lider.cl',
          categoryUrls: LIDER_PROMO_URLS,
          maxProducts: TARGET_PRODUCTS,
        });

        if (playwrightOffers.length > 0) {
          console.log(`[LiderScraper] ✓ Playwright fallback successful: ${playwrightOffers.length} offers`);
          offers = mergeUniqueOffers(offers, playwrightOffers);
        }
      }

      if (offers.length > 0) {
        console.log(`[LiderScraper] Combined total: ${offers.length} offers`);
        return offers.slice(0, TARGET_PRODUCTS);
      }

      // All methods exhausted
      const errorMsg = `All scraping methods exhausted (HTML failed, VTEX ${useLegacyVtex ? 'failed' : 'skipped'}, Playwright failed). ${cookieHeader ? 'Cookie exists' : 'No LIDER_COOKIE in env'}.`;
      console.warn(`[LiderScraper] ⚠️ ${errorMsg}`);
      throw new Error(errorMsg);
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      console.error(`[LiderScraper] ✗ Fatal error: ${errorMsg}`);
      throw err;
    }
  }
}
