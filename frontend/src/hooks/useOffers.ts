import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Offer, OffersFilters, PaginatedOffers, Store, Category } from '../types'

// ─── Ofertas ─────────────────────────────────────────────────────────────────

async function fetchOffers(filters: OffersFilters): Promise<PaginatedOffers> {
  const { search, store_slug, category_slug, min_discount, page = 1, page_size = 40 } = filters
  const from = (page - 1) * page_size
  const to = from + page_size - 1

  let query = supabase
    .from('active_offers_view')
    .select('*', { count: 'exact' })
    .order('discount_pct', { ascending: false })
    .range(from, to)

  if (search) {
    // Búsqueda full-text usando ilike — pg_trgm ya indexado en el schema v2
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

  if (error) throw new Error(error.message)
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

  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60,
  })
}
