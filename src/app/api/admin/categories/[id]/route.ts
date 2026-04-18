import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { invalidatePrefix } from '@/lib/cache';
import { apiError } from '@/lib/apiError';
import { isAdminUser } from '@/lib/adminAuth';
import { updateCategorySchema } from '@/lib/adminValidation';

/**
 * PUT request to update a category.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const categoryId = params.id;
    const body = updateCategorySchema.parse(await req.json());
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !isAdminUser(user)) {
      return apiError('FORBIDDEN', 'Admin role required', 403);
    }
    
    const { data, error } = await supabase
      .from('categories')
      .update(body)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    await invalidatePrefix('categories:');
    return NextResponse.json(data);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return apiError('INVALID_PAYLOAD', error.message || 'Invalid request payload', 400);
    }
    return apiError('UPDATE_CATEGORY_FAILED', error.message || String(error), 500);
  }
}

/**
 * DELETE request to delete a category.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const categoryId = params.id;
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !isAdminUser(user)) {
      return apiError('FORBIDDEN', 'Admin role required', 403);
    }
    
    // Check if category has products
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (countError) throw countError;

    if (count && count > 0) {
      // Return specific Postgres-like message as requested
      return apiError(
        'CATEGORY_HAS_PRODUCTS',
        'update or delete on table "categories" violates foreign key constraint "products_category_id_fkey" on table "products"',
        409
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    await invalidatePrefix('categories:');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError('DELETE_CATEGORY_FAILED', error.message || String(error), 500);
  }
}
