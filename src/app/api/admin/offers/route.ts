import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { invalidatePrefix } from '@/lib/cache';
import { apiError } from '@/lib/apiError';
import { isAdminUser } from '@/lib/adminAuth';
import { createOfferSchema } from '@/lib/adminValidation';

/**
 * POST request to create a new offer (Admin only).
 */
export async function POST(req: NextRequest) {
  try {
    const body = createOfferSchema.parse(await req.json());
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }
    
    // Auth check is handled by middleware but we ensure user exists
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !isAdminUser(user)) {
      return apiError('FORBIDDEN', 'Admin role required', 403);
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
    if (error?.name === 'ZodError') {
      return apiError('INVALID_PAYLOAD', error.message || 'Invalid request payload', 400);
    }
    return apiError('CREATE_OFFER_FAILED', error.message || String(error), 500);
  }
}
