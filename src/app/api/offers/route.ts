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
  const q = searchParams.get('q');

  // Create hash params for cache key
  const cacheKey = `offers:list:${JSON.stringify({ page, limit, store, category, q })}`;

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
        if (q) {
          query = query.ilike('product_name', `%${q}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.range(from, to).order('discount_pct', { ascending: false });

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
