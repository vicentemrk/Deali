import { NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

/**
 * GET request to fetch all stores along with active offers count.
 */
export async function GET() {
  try {
    const result = await cached(
      'stores:list',
      async () => {
        const supabase = createServerSupabaseClient();
        
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('*')
          .order('name');

        if (storesError) throw storesError;

        // Fetch active offers count for each store
        const { data: countsData, error: countsError } = await supabase
          .from('activa_offers_view')
          .select('store_slug');
          
        if (countsError) throw countsError;

        const countsMap = countsData.reduce((acc: any, curr: any) => {
          acc[curr.store_slug] = (acc[curr.store_slug] || 0) + 1;
          return acc;
        }, {});

        return stores.map(store => ({
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
