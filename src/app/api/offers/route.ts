import { NextRequest, NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

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

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;

  // Create hash params for cache key
  const cacheKey = `offers:list:${JSON.stringify({ page, safeLimit, store, category, excludeCategory, q, sort })}`;

  try {
    const result = await cached(
      cacheKey,
      async () => {
        const supabase = createServerSupabaseClient();
        
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
  } catch (error: any) {
    return apiError('GET_OFFERS_FAILED', error.message || String(error), 500);
  }
}
