import { createClient } from '@supabase/supabase-js';
import { JumboScraper } from './scrapers/jumboScraper';
import { LiderScraper } from './scrapers/liderScraper';
import { UnimarcScraper } from './scrapers/unimarcScraper';
import { AcuentaScraper } from './scrapers/acuentaScraper';
import { TottusScraper } from './scrapers/tottusScraper';
import { SantaIsabelScraper } from './scrapers/santaIsabelScraper';
import { StoreScraper, RawOffer } from './scrapers/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function processOffers(storeSlug: string, offers: RawOffer[]) {
  // Get store ID
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', storeSlug)
    .single();

  if (storeError || !store) throw new Error(`Store not found: ${storeSlug}`);

  // Fetch unknown category for fallback (assuming there's an 'Otros' category, or we insert null)
  for (const offer of offers) {
    try {
      // 1. Upsert product (approximate match by name and store)
      let { data: product, error: productSearchError } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', store.id)
        .eq('name', offer.productName)
        .single();
      
      if (!product) {
        const { data: newProd, error: newProdError } = await supabase
          .from('products')
          .insert({
            name: offer.productName,
            brand: offer.brand,
            image_url: offer.imageUrl,
            store_id: store.id,
            category_id: null // Fallback
          })
          .select('id')
          .single();
        if (newProdError) throw newProdError;
        product = newProd;
      }

      // 2. Upsert Offer
      const discountPct = offer.originalPrice > offer.offerPrice 
        ? ((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100 
        : 0;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // Assume 7 days offer length if not specified on site

      const { error: offerError } = await supabase
        .from('offers')
        .upsert({
          product_id: product.id,
          original_price: offer.originalPrice,
          offer_price: offer.offerPrice,
          discount_pct: discountPct.toFixed(2),
          offer_url: offer.offerUrl,
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_active: true,
          scraped_at: new Date().toISOString()
        }, { onConflict: 'product_id' }); // Assuming one active offer per product
      
      if (offerError) throw offerError;

      // 3. Price History
      await supabase.from('price_history').insert({
        product_id: product.id,
        price: offer.offerPrice
      });

      // 4. Broadcast Realtime
      await supabase.channel('new-offers').send({
        type: 'broadcast',
        event: 'new-offer',
        payload: {
          storeSlug,
          productName: offer.productName,
          offerPrice: offer.offerPrice,
        }
      });

    } catch (error: any) {
      console.error(`[ScrapeAll] Error processing offer ${offer.productName}: ${error.message}`);
    }
  }
}

async function main() {
  const scrapers: StoreScraper[] = [
    new JumboScraper(),
    new LiderScraper(),
    new UnimarcScraper(),
    new AcuentaScraper(),
    new TottusScraper(),
    new SantaIsabelScraper(),
  ];

  const args = process.argv.slice(2);
  const storeArg = args.indexOf('--store') !== -1 ? args[args.indexOf('--store') + 1] : null;

  const targetScrapers = storeArg 
    ? scrapers.filter(s => s.storeSlug === storeArg)
    : scrapers;

  const results = await Promise.allSettled(
    targetScrapers.map(async (scraper) => {
      const offers = await scraper.scrape();
      await processOffers(scraper.storeSlug, offers);
      return offers.length;
    })
  );

  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      successCount++;
    } else {
      failCount++;
      console.error(`[ScrapeAll] Scraper failed: ${result.reason}`);
    }
  }

  console.log(`Scraping completo: ${successCount} exitosos, ${failCount} fallidos.`);
}

main().catch(error => {
  console.error(`[ScrapeAll Global Error] ${error}`);
  process.exit(1);
});
