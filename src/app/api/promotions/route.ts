import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

/**
 * GET request to fetch active promotions. Not cached by default or cache briefly.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
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

    return NextResponse.json(promotions);
  } catch (error: any) {
    return apiError('GET_PROMOTIONS_FAILED', error.message || String(error), 500);
  }
}
