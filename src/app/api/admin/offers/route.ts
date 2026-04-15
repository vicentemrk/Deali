import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { invalidatePrefix } from '@/lib/cache';
import { apiError } from '@/lib/apiError';

/**
 * POST request to create a new offer (Admin only).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServerSupabaseClient();
    if (!supabase) throw new Error('Supabase client initialization failed');
    
    // Auth check is handled by middleware but we ensure user exists
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return apiError('UNAUTHORIZED', 'Unauthorized', 401);
    }
    
    const { data, error } = await supabase
      .from('offers')
      .insert([body])
      .select()
      .single();

    if (error) {
      throw error;
    }

    await invalidatePrefix('offers:');
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return apiError('CREATE_OFFER_FAILED', error.message || String(error), 500);
  }
}
