import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { invalidatePrefix } from '@/lib/cache';
import { apiError } from '@/lib/apiError';

/**
 * PUT request to update a category.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const categoryId = params.id;
    const body = await req.json();
    const supabase = createServerSupabaseClient();
    
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
