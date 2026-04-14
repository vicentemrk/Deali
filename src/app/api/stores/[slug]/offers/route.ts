import { NextRequest, NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

/**
 * GET offers filtered by store slug, with pagination.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const category = searchParams.get('category');

  const cacheKey = `offers:store:${params.slug}:${JSON.stringify({ page, limit, category })}`;

  try {
    const result = await cached(
      cacheKey,
      async () => {
        const supabase = createServerSupabaseClient();

        let query = supabase
          .from('activa_offers_view')
          .select('*', { count: 'exact' })
          .eq('store_slug', params.slug);

        if (category) {
          query = query.eq('category_slug', category);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.range(from, to).order('discount_pct', { ascending: false });

        const { data, error, count } = await query;
        if (error) throw error;

        return { data, total: count || 0, page };
      },
      30 * 60
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return apiError('GET_STORE_OFFERS_FAILED', error.message || String(error), 500);
  }
}
