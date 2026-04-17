import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { calculateDiscountPct, MIN_GOOD_DISCOUNT_PCT } from './lib/offerQuality';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type OfferRow = {
  offer_id: string;
  product_id: string;
  original_price: number;
  offer_price: number;
  discount_pct: string | number | null;
  product_name: string;
  store_slug: string;
};

async function main() {
  console.log('[cleanLowQualityOffers] Starting cleanup...');

  const { data: offers, error } = await supabase
    .from('activa_offers_view')
    .select('offer_id, product_id, original_price, offer_price, discount_pct, product_name, store_slug');

  if (error) {
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  const staleOfferIds = (offers as OfferRow[] | null || [])
    .filter((offer) => {
      const discountPct = Number(offer.discount_pct ?? calculateDiscountPct(offer.offer_price, offer.original_price));
      return !Number.isFinite(discountPct) || discountPct < MIN_GOOD_DISCOUNT_PCT;
    })
    .map((offer) => offer.offer_id);

  if (staleOfferIds.length === 0) {
    console.log('[cleanLowQualityOffers] No low-quality offers found.');
    return;
  }

  const { error: deleteOffersError } = await supabase
    .from('offers')
    .delete()
    .in('id', staleOfferIds);

  if (deleteOffersError) {
    throw new Error(`Failed to delete low-quality offers: ${deleteOffersError.message}`);
  }

  console.log(`[cleanLowQualityOffers] Removed ${staleOfferIds.length} offers below ${MIN_GOOD_DISCOUNT_PCT}% discount.`);
}

main().catch((err) => {
  console.error('[cleanLowQualityOffers] Error:', err.message || err);
  process.exit(1);
});
