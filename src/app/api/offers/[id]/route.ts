import { NextRequest, NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

type OfferDetailRow = {
  product_id: string;
  offer_id: string;
  [key: string]: unknown;
};

type PriceHistoryRow = {
  [key: string]: unknown;
};

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

        return { ...(offer as OfferDetailRow), price_history: history as PriceHistoryRow[] };
      },
      60 * 60 // 60 mins
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'PGRST116') {
      const message = error instanceof Error ? error.message : 'Offer not found';
      return apiError('NOT_FOUND', message, 404);
    }
    const message = error instanceof Error ? error.message : String(error);
    return apiError('GET_OFFER_DETAIL_FAILED', message, 500);
  }
}
