import { NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

/**
 * GET request to fetch all stores along with active offers count.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('DB_NOT_CONFIGURED', 'Supabase client initialization failed', 503);
    }

    const result = await cached(
      'stores:list',
      async () => {
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('*')
          .order('name');

        if (storesError) throw storesError;

        const { data: countsData, error: countsError } = await supabase
          .from('activa_offers_view')
          .select('store_slug,offer_id', { count: 'exact' });

        if (countsError) throw countsError;

        const countsMap = (countsData || []).reduce<Record<string, number>>((acc, offer) => {
          acc[offer.store_slug] = (acc[offer.store_slug] || 0) + 1;
          return acc;
        }, {});

        return stores.map((store: any) => ({
          ...store,
          active_offers_count: countsMap[store.slug] || 0
        }));
      },
      60 * 60 // 1 hour
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return apiError('GET_STORES_FAILED', error.message || String(error), 500);
  }
}
