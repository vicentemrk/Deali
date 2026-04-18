import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

type PromotionRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  store: {
    id: string;
    name: string;
    slug: string;
    color_hex: string;
    website_url: string | null;
  };
};

/**
 * GET request to fetch active promotions. Not cached by default or cache briefly.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return apiError('DB_NOT_CONFIGURED', 'Supabase client initialization failed', 503);
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const { data: promotions, error } = await supabase
      .from('promotions')
      .select(`
        *,
        store:stores (*)
      `)
      .gte('end_date', today)
      .order('start_date', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(promotions as PromotionRow[]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return apiError('GET_PROMOTIONS_FAILED', message, 500);
  }
}
