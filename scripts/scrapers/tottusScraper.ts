import { StoreScraper, RawOffer } from './types';
import { fetchVtexMultiCategory } from './vtexCategoryFetcher';
import { scrapeStoreWithPlaywrightFallback } from './playwrightStoreFallback';
import { parseCLP } from '../lib/priceParser';

const TOTTUS_WIDGET_IDS = [
  'a9ac056e-1873-41c6-a7dc-c21087548c41',
  'f7bc8088-4853-4d16-bc6e-d1bf385a05f6',
  '34f3f74d-94ba-4a9b-8b9c-fd6d89cf7ebf',
  'ecf69f65-32cb-4856-8fbc-4aef0ec572df',
];

const TARGET_PRODUCTS = 100;

import { mergeUniqueOffers } from '../lib/mergeOffers';

const TOTTUS_ZONES = [
  'PCL1223', 'PCL2976', 'PCL3651', 'PCL3887', 'PCL2709', 'PCL2829', 'PCL3505', 'PCL3136',
  'PCL4992', 'PCL5127', 'PCL1486', 'PCL3031', 'PCL1839', 'PCL3676', 'PCL3139', 'PCL2992',
  'PCL2269', 'PCL4976', 'PCL651', 'LEG_TOTTUS_DOMINICOS_1', 'PCL596', 'PCL226', 'PCL108',
  'PCL2288', 'PCL3232', 'PCL3145', 'PCL1394', 'PCL5090', 'PCL5234', 'PCL2792',
].join(',');

async function fetchTottusRecommendedOffers(cookieHeader?: string): Promise<RawOffer[]> {
  const offers: RawOffer[] = [];
  const seen = new Set<string>();

  for (const widgetId of TOTTUS_WIDGET_IDS) {
    const url = new URL('https://www.falabella.com/s/browse/v2/recommended-products/cl');
    url.searchParams.set('widgetsUUID', widgetId);
    url.searchParams.set('pageType', 'LANDING');
    url.searchParams.set('site', 'to_com');
    url.searchParams.set('politicalId', '9e635d19-b626-4171-8beb-d92e58c2a417');
    url.searchParams.set('priceGroupId', '34');
    url.searchParams.set('zones', TOTTUS_ZONES);
    url.searchParams.set('channel', 'web');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://www.tottus.cl/tottus-cl/content/ofertas-tottus?sid=HO_BH_OFE_498',
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        console.warn(`[TottusScraper] Recommended API failed (${widgetId}): HTTP ${response.status}`);
        continue;
      }

      const payload: any = await response.json();
      const products = payload?.widgets?.flatMap((widget: any) => widget?.data ?? []) ?? [];

      for (const product of products) {
        const name = (product.displayName || '').trim();
        if (!name) continue;

        const key = name.toLowerCase();
        if (seen.has(key)) continue;

        const prices: any[] = product.prices ?? [];
        const offerPrice = parseCLP(prices.find((p: any) => p?.crossed === false)?.originalPrice ?? prices[0]?.originalPrice);
        const originalPrice = parseCLP(prices.find((p: any) => p?.crossed === true)?.originalPrice ?? prices[1]?.originalPrice ?? prices[0]?.originalPrice);

        if (!offerPrice || !originalPrice || offerPrice >= originalPrice) continue;

        const categoryPath = (product.categoryPaths?.[0] as string | undefined) ?? '';
        const categoryHint = categoryPath ? categoryPath.split('/').pop()?.split('||')?.[1] ?? null : null;

        // Extract image from mediaUrls array
        const mediaUrls: string[] = product.mediaUrls ?? [];
        const imageUrl = mediaUrls.length > 0 ? `${mediaUrls[0]}/500x500` : '';

        seen.add(key);
        offers.push({
          productName: name,
          brand: product.brand || null,
          imageUrl,
          offerUrl: product.url || 'https://www.tottus.cl/tottus-cl/content/ofertas-tottus',
          offerPrice,
          originalPrice,
          categoryHint,
        });
      }
    } catch (error: any) {
      console.warn(`[TottusScraper] Recommended API error (${widgetId}): ${error.message}`);
    }
  }

  console.log(`[TottusScraper] Recommended API total: ${offers.length} offers.`);
  return offers;
}

/**
 * TottusScraper — Falabella Chile
 *
 * Uses Falabella recommended-products API first (stable with session cookie),
 * then Playwright fallback. Legacy VTEX fetch is opt-in via env flag.
 */
export class TottusScraper implements StoreScraper {
  storeSlug = 'tottus';

  async scrape(): Promise<RawOffer[]> {
    const cookieHeader = process.env.TOTTUS_COOKIE?.trim();
    const useLegacyVtex = process.env.TOTTUS_USE_VTEX !== '0';

    let offers = await fetchTottusRecommendedOffers(cookieHeader);

    if (useLegacyVtex && offers.length < TARGET_PRODUCTS) {
      const vtexOffers = await fetchVtexMultiCategory({
        cdnBase:      'https://tottus.vteximg.com.br',
        fallbackBases:[
          'https://www.tottus.cl',
          'https://tottuscl.vtexassets.com',
        ],
        siteBase:     'https://www.tottus.cl',
        referer:      'https://www.tottus.cl/tottus-cl/content/ofertas-tottus?sid=HO_BH_OFE_498',
        logTag:       'TottusScraper',
        minProducts:  TARGET_PRODUCTS,
        concurrency:  3,
        extraHeaders: cookieHeader ? { Cookie: cookieHeader } : undefined,
      });

      offers = mergeUniqueOffers(offers, vtexOffers);
    }

    if (!cookieHeader) {
      console.warn('[TottusScraper] Blocked by Cloudflare. Set TOTTUS_COOKIE in .env.local to reuse a valid browser session.');
    }

    // Aggressive Playwright fallback with more categories
    if (offers.length < TARGET_PRODUCTS) {
      const playwrightOffers = await scrapeStoreWithPlaywrightFallback({
        logTag: 'TottusScraper',
        baseUrl: 'https://www.tottus.cl',
        categoryUrls: [
          'https://www.tottus.cl/tottus-cl/content/ofertas-tottus?sid=HO_BH_OFE_498',
          'https://www.tottus.cl/tottus-cl/lista/CATG24752/Liquidos?sid=HO_CS_LIQ_478',
          'https://www.tottus.cl/tottus-cl/lista/CATG24758/Aseo-y-Limpieza?sid=HO_CS_ASE_471',
          'https://www.tottus.cl/tottus-cl/lista/CATG24751/Abarrotes?sid=HO_CS_DES_472',
          'https://www.tottus.cl/tottus-cl/lista/CATG24754/Lacteos?sid=HO_CS_LAC_474',
          'https://www.tottus.cl/tottus-cl/lista/CATG24753/Carnes-y-Pescados?sid=HO_CS_CAR_473',
          'https://www.tottus.cl/tottus-cl/lista/CATG24755/Congelados?sid=HO_CS_CON_475',
          'https://www.tottus.cl/tottus-cl/lista/CATG24756/Frutas-y-Verduras?sid=HO_CS_FRU_476',
        ],
        maxProducts: 100, // Increase target for Playwright
      });

      offers = mergeUniqueOffers(offers, playwrightOffers);
    }

    console.log(`[TottusScraper] Combined total: ${offers.length} offers.`);
    return offers.slice(0, TARGET_PRODUCTS);
  }
}
