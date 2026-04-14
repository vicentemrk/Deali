export interface RawOffer {
  productName: string;
  brand: string | null;
  imageUrl: string;
  offerUrl: string;
  originalPrice: number;
  offerPrice: number;
  categoryHint: string | null;
}

export interface StoreScraper {
  storeSlug: string;
  scrape(): Promise<RawOffer[]>;
}
