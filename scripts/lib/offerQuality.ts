import { RawOffer } from '../scrapers/types';

export const MIN_GOOD_DISCOUNT_PCT = 5;
export const MAX_REASONABLE_DISCOUNT_PCT = 85;

export function calculateDiscountPct(offerPrice: number, originalPrice: number): number {
  if (
    !Number.isFinite(offerPrice) ||
    !Number.isFinite(originalPrice) ||
    offerPrice <= 0 ||
    originalPrice <= 0 ||
    offerPrice >= originalPrice
  ) {
    return 0;
  }

  const discountPct = ((originalPrice - offerPrice) / originalPrice) * 100;
  return Number(discountPct.toFixed(2));
}

export function isGoodOffer(offer: RawOffer): boolean {
  if (!offer || offer.offerPrice <= 0 || offer.originalPrice <= 0) {
    return false;
  }

  if (offer.offerPrice >= offer.originalPrice) {
    return false;
  }

  const discountPct = calculateDiscountPct(offer.offerPrice, offer.originalPrice);

  return discountPct >= MIN_GOOD_DISCOUNT_PCT && discountPct <= MAX_REASONABLE_DISCOUNT_PCT;
}
