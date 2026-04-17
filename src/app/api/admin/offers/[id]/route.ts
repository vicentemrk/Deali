import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { invalidatePrefix } from '@/lib/cache';
import { apiError } from '@/lib/apiError';

/**
 * PUT request to update an offer.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const offerId = params.id;
    const body = await req.json();
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }
    
    const { data, error } = await supabase
      .from('offers')
      .update(body)
      .eq('id', offerId)
      .select()
      .single();

    if (error) throw error;

    await invalidatePrefix('offers:');
    return NextResponse.json(data);
  } catch (error: any) {
    return apiError('UPDATE_OFFER_FAILED', error.message || String(error), 500);
  }
}

/**
 * DELETE request to delete an offer.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const offerId = params.id;
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }
    
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);

    if (error) throw error;

    await invalidatePrefix('offers:');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError('DELETE_OFFER_FAILED', error.message || String(error), 500);
  }
}
