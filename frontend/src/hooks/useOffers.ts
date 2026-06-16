import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Offer, OffersFilters, PaginatedOffers, Store, Category } from '../types'

// ─── Ofertas ─────────────────────────────────────────────────────────────────

async function fetchOffers(filters: OffersFilters): Promise<PaginatedOffers> {
  const { search, store_slug, category_slug, min_discount, sort_by = 'discount_desc', page = 1, page_size = 40 } = filters
  const from = (page - 1) * page_size
  const to = from + page_size - 1

  let query = supabase
    .from('active_offers_view')
    .select('*', { count: 'exact' })
    .range(from, to)

  // Dynamic sort order
  if (sort_by === 'price_asc') {
    query = query.order('offer_price', { ascending: true })
  } else if (sort_by === 'price_desc') {
    query = query.order('offer_price', { ascending: false })
  } else {
    // default: highest discount first
    query = query.order('discount_pct', { ascending: false })
  }

  if (search) {
    // Full-text search via ilike — pg_trgm index on schema v2
    query = query.ilike('product_name', `%${search}%`)
  }
  if (store_slug) {
    query = query.eq('store_slug', store_slug)
  }
  if (category_slug) {
    query = query.eq('category_slug', category_slug)
  }
  if (min_discount !== undefined && min_discount > 0) {
    query = query.gte('discount_pct', min_discount)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as Offer[],
    count: count ?? 0,
    page,
    page_size,
  }
}

export function useOffers(filters: OffersFilters = {}) {
  return useQuery({
    queryKey: ['offers', filters],
    queryFn: () => fetchOffers(filters),
    placeholderData: keepPreviousData, // evita flash en paginación
    staleTime: 1000 * 60 * 3,         // 3 minutos de cache
  })
}

// ─── Tiendas ─────────────────────────────────────────────────────────────────

async function fetchStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, slug, name, color, logo_url')
    .order('name')

  // Error tolerante: si la tabla no existe aún, devuelve lista vacía
  if (error) return []
  return (data ?? []) as Store[]
}

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: fetchStores,
    staleTime: 1000 * 60 * 60, // 1 hora — las tiendas no cambian
  })
}

// ─── Categorías ───────────────────────────────────────────────────────────────

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, icon')
    .order('name')

  // Error tolerante: si la tabla no existe aún, devuelve lista vacía
  if (error) return []
  return (data ?? []) as Category[]
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60,
  })
}
