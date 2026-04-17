import { NextRequest, NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

/**
 * GET request to fetch a single offer by ID, including price history.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const offerId = params.id;
  
  if (!offerId) {
    return apiError('MISSING_ID', 'Missing offer ID', 400);
  }

  const cacheKey = `offers:detail:${offerId}`;

  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }

    const result = await cached(
      cacheKey,
      async () => {
        const { data: offer, error: offerError } = await supabase
          .from('activa_offers_view')
          .select('*')
          .eq('offer_id', offerId)
          .single();

        if (offerError) throw offerError;

        const { data: history, error: historyError } = await supabase
          .from('price_history')
          .select('*')
          .eq('product_id', offer.product_id)
          .order('recorded_at', { ascending: false });

        if (historyError) throw historyError;

        return { ...offer, price_history: history };
      },
      60 * 60 // 60 mins
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.code === 'PGRST116') {
      return apiError('NOT_FOUND', error.message, 404);
    }
    return apiError('GET_OFFER_DETAIL_FAILED', error.message || String(error), 500);
  }
}
