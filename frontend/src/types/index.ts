/**
 * Tipos que reflejan el schema v2 de Supabase (100_v2_rebuild.sql).
 * La vista active_offers_view es el contrato principal del frontend.
 */

export interface Offer {
  offer_id: string
  product_id: string
  store_id: string

  product_name: string
  product_brand: string | null
  product_image_url: string | null
  offer_url: string

  offer_price: number
  original_price: number | null
  discount_pct: number | null

  store_slug: string
  store_name: string
  store_color: string | null
  store_logo_url: string | null

  category_slug: string | null
  category_name: string | null

  scraped_at: string
  is_active: boolean
}

export interface Store {
  id: string
  slug: string
  name: string
  color: string | null
  logo_url: string | null
}

export interface Category {
  id: string
  slug: string
  name: string
  icon: string | null
}

/** Sort options for the offers grid */
export type OffersSortBy = 'discount_desc' | 'price_asc' | 'price_desc'

/** Parámetros para el hook useOffers */
export interface OffersFilters {
  search?: string
  store_slug?: string
  category_slug?: string
  min_discount?: number
  sort_by?: OffersSortBy
  page?: number
  page_size?: number
}

/** Respuesta paginada */
export interface PaginatedOffers {
  data: Offer[]
  count: number
  page: number
  page_size: number
}
