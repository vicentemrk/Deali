import { NextRequest, NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

function buildCacheKey(parts: Record<string, string | number | null | undefined>) {
  return Object.entries(parts)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * GET requests to fetch offers using query parameters for filtering and pagination.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const store = searchParams.get('store');
  const category = searchParams.get('category');
  const excludeCategory = searchParams.get('excludeCategory');
  const q = searchParams.get('q');
  const sort = searchParams.get('sort') || 'discount_desc';

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 1000) : 20;

  // Create hash params for cache key
  const cacheKey = `offers:list:${buildCacheKey({ page, limit: safeLimit, store, category, excludeCategory, q, sort })}`;

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return apiError('DB_NOT_CONFIGURED', 'Supabase client initialization failed', 503);
    }

    const result = await cached(
      cacheKey,
      async () => {
        let query = supabase
          .from('activa_offers_view')
          .select('*', { count: 'exact' });

        if (store) {
          query = query.eq('store_slug', store);
        }
        if (category) {
          query = query.eq('category_slug', category);
        }
        if (excludeCategory) {
          query = query.neq('category_slug', excludeCategory);
        }
        if (q) {
          query = query.ilike('product_name', `%${q}%`);
        }

        const from = (page - 1) * safeLimit;
        const to = from + safeLimit - 1;

        switch (sort) {
          case 'discount_asc':
            query = query.order('discount_pct', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('offer_price', { ascending: false });
            break;
          case 'price_asc':
            query = query.order('offer_price', { ascending: true });
            break;
          case 'discount_desc':
          default:
            query = query.order('discount_pct', { ascending: false });
            break;
        }

        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) {
          throw error;
        }

        return { data, total: count || 0, page };
      },
      30 * 60 // 30 mins
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    return apiError('GET_OFFERS_FAILED', getErrorMessage(error), 500);
  }
}
