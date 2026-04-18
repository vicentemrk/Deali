export type OfferCardData = {
  offer_id?: string;
  product_name?: string;
  productName?: string;
  product_image_url?: string;
  productImageUrl?: string;
  image_url?: string;
  imageUrl?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  category_name?: string;
  categoryName?: string;
  original_price?: number | string;
  originalPrice?: number | string;
  offer_price?: number | string;
  offerPrice?: number | string;
  discount_pct?: number | string;
  discountPct?: number | string;
  offer_url?: string;
  offerUrl?: string;
  end_date?: string | Date | null;
  endDate?: string | Date | null;
};

export type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  color_hex: string;
  website_url: string;
  active_offers_count: number;
};

export type PromotionSummary = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  store: {
    name: string;
    color_hex: string;
    website_url: string;
  };
};

export type PagedOffersResponse = {
  data: OfferCardData[];
  total: number;
  page: number;
};

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeoutMs = 8000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getAppBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}