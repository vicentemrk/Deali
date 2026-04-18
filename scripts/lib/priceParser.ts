/**
 * scripts/lib/priceParser.ts
 * 
 * Shared price parsing utilities for all scrapers.
 * Handles various currency formats: "$1.990", "1990", "$1,990.00", etc.
 * 
 * Used by: liderScraper, acuentaScraper, unimarcScraper, tottusScraper
 */

/**
 * Parse a single price value from raw string
 * Extracts first valid number between 100 and 10,000,000
 * 
 * @param raw - Raw price string (e.g., "$1.990", "1990", "$1,990.00")
 * @returns Price as number, 0 if invalid
 * 
 * @example
 * parsePrice("$1.990") // 1990
 * parsePrice("1.990") // 1990
 * parsePrice("$1,990.00") // 1990
 * parsePrice(undefined) // 0
 */
export function parsePrice(raw: string | undefined | null): number {
  if (!raw) return 0;

  let normalized = raw.trim().replace(/[$\s]/g, '');

  // Handle decimal separators
  // If string contains comma OR has pattern like "1.234.567", treat dot as thousands separator
  // Otherwise if it has dot, treat as decimal
  if (normalized.includes(',')) {
    // Check if European format (1.234,56) or US format (1,990.00)
    if (normalized.match(/\.\d{3},/) || normalized.match(/\d+,\d{2}$/)) {
      // European: 1.234,56 or 1.234,00
      normalized = normalized.replace(/\./g, '').replace(',', '');
    } else {
      // US format: 1,990.00
      normalized = normalized.replace(/,/g, '');
    }
  } else if (normalized.includes('.')) {
    // Check if dot is thousands or decimal separator
    const parts = normalized.split('.');
    if (parts.length === 2 && parts[1].length === 2) {
      // Decimal: 1990.00 or 99.50
      normalized = normalized;
    } else if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      // Thousands: 1.990 or 1.990.000
      normalized = normalized.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length > 2) {
      // Likely decimal: 1990.999
      normalized = normalized;
    }
  }

  // Extract digits (including decimal point)
  const digits = normalized.replace(/[^\d.]/g, '');
  if (!digits) return 0;

  const parsed = parseFloat(digits);
  if (!Number.isFinite(parsed) || parsed < 100 || parsed > 10_000_000) {
    return 0;
  }

  // Round to nearest integer for Chilean pesos (no decimals)
  return Math.round(parsed);
}

/**
 * Parse multiple price values from raw string
 * Useful for comparing original vs offer price
 * 
 * @param raw - Raw price string
 * @param count - Number of prices to extract (default: all)
 * @returns Array of parsed prices
 * 
 * @example
 * parsePrices("$1.990 $1.490") // [1990, 1490]
 * parsePrices("Original: $2.990 Oferta: $1.490", 2) // [2990, 1490]
 */
export function parsePrices(raw: string | undefined | null, count?: number): number[] {
  if (!raw) return [];

  // Remove currency symbols and find all price-like patterns
  let normalized = raw.replace(/\$/g, '').trim();

  // Find all currency-like patterns: $ followed by digits, or standalone numbers
  const currencyMatches = Array.from(
    normalized.matchAll(/\$?\s*[\d.,]+/g),
    (m) => m[0].trim()
  );

  if (currencyMatches.length === 0) {
    return [];
  }

  const parsed = currencyMatches
    .map((match) => parsePrice(match))
    .filter((price) => price > 0);

  return count ? parsed.slice(0, count) : parsed;
}

/**
 * Parse CLP (Chilean Peso) format specifically
 * Handles: "$1.990", "1.990", "1990"
 * 
 * @param raw - Raw CLP string
 * @returns Price as number, 0 if invalid
 * 
 * @example
 * parseCLP("$1.990") // 1990
 * parseCLP("1.990") // 1990
 */
export function parseCLP(raw: string | undefined | null): number {
  if (!raw) return 0;
  // Remove all non-digits, then parse
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Extract price range (min, max) from string
 * 
 * @param raw - Raw price string
 * @returns [minPrice, maxPrice]
 * 
 * @example
 * parsePriceRange("$1.000 a $2.000") // [1000, 2000]
 * parsePriceRange("$1.990 - $1.490") // [1490, 1990]
 */
export function parsePriceRange(
  raw: string | undefined | null
): [number, number] {
  const prices = parsePrices(raw);
  if (prices.length < 2) {
    return [0, 0];
  }
  return [Math.min(...prices), Math.max(...prices)];
}

/**
 * Check if two prices are approximately equal (within tolerance %)
 * Useful for detecting the same product with slight price variations
 * 
 * @param price1 - First price
 * @param price2 - Second price
 * @param tolerance - Tolerance percentage (default: 5)
 * @returns true if prices are within tolerance
 * 
 * @example
 * arePricesEqual(1000, 1050) // true (5% tolerance)
 * arePricesEqual(1000, 1100) // false
 */
export function arePricesEqual(
  price1: number,
  price2: number,
  tolerance: number = 5
): boolean {
  if (price1 === 0 || price2 === 0) return false;
  const diff = Math.abs(price1 - price2);
  const maxDiff = (Math.max(price1, price2) * tolerance) / 100;
  return diff <= maxDiff;
}
