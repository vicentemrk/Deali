import { RawOffer } from '../scrapers/types';

/**
 * Merges two arrays of RawOffer, keeping only the first occurrence by productName.
 * Primary offers take precedence over secondary ones.
 */
export function mergeUniqueOffers(primary: RawOffer[], secondary: RawOffer[]): RawOffer[] {
  const merged = [...primary];
  const seen = new Set(primary.map((offer) => offer.productName.trim().toLowerCase()));

  for (const offer of secondary) {
    const key = offer.productName.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(offer);
  }

  return merged;
}
