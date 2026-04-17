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
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }

    const result = await cached(
      'stores:list',
      async () => {
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('*')
          .order('name');

        if (storesError) throw storesError;

        const countPairs = await Promise.all(
          (stores || []).map(async (store: any) => {
            const { count, error } = await supabase
              .from('activa_offers_view')
              .select('*', { count: 'exact', head: true })
              .eq('store_slug', store.slug);

            if (error) throw error;
            return [store.slug, count || 0] as const;
          })
        );

        const countsMap = Object.fromEntries(countPairs);

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
