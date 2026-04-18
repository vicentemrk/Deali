const DEFAULT_ALERT_MIN_OFFERS: Record<string, number> = {
  jumbo: 25,
  'santa-isabel': 30,
  lider: 25,
  tottus: 15,
  unimarc: 25,
  acuenta: 20,
};

export type LowVolumeAlert = {
  storeSlug: string;
  offersFound: number;
  offersSaved: number;
  threshold: number;
};

export function envKeyForStoreThreshold(storeSlug: string): string {
  return `SCRAPE_ALERT_MIN_${storeSlug.toUpperCase().replace(/-/g, '_')}`;
}

export function resolveAlertThreshold(storeSlug: string): number {
  const envKey = envKeyForStoreThreshold(storeSlug);
  const envRaw = process.env[envKey];
  const envVal = envRaw ? Number.parseInt(envRaw, 10) : NaN;
  if (!Number.isNaN(envVal) && envVal >= 0) return envVal;
  return DEFAULT_ALERT_MIN_OFFERS[storeSlug] ?? 20;
}

export function buildLowVolumeAlert(
  storeSlug: string,
  offersFound: number,
  offersSaved: number
): LowVolumeAlert | null {
  const threshold = resolveAlertThreshold(storeSlug);
  if (offersFound >= threshold) return null;

  return {
    storeSlug,
    offersFound,
    offersSaved,
    threshold,
  };
}
