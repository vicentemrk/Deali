import { NextRequest, NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

type OfferRow = {
  offer_id: string;
  store_slug: string;
  category_slug: string | null;
  [key: string]: unknown;
};

/**
 * GET offers filtered by store slug, with pagination.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'discount_desc';

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;
  const safePage = Number.isFinite(page) ? Math.min(Math.max(page, 1), 100) : 1;

  const cacheKey = `offers:store:${slug}:${JSON.stringify({ page: safePage, safeLimit, category, sort })}`;

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
          .select('*', { count: 'exact' })
          .eq('store_slug', slug);

        if (category) {
          query = query.eq('category_slug', category);
        }

        const from = (safePage - 1) * safeLimit;
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
        if (error) throw error;

        return { data: data as OfferRow[], total: count || 0, page: safePage };
      },
      30 * 60
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return apiError('GET_STORE_OFFERS_FAILED', message, 500);
  }
}
