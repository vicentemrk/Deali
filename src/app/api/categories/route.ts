import { NextResponse } from 'next/server';
import { cached } from '@/lib/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';

// helper to build tree from flat list
function buildTree(categories: any[], parentId: string | null = null): any[] {
  return categories
    .filter((cat) => cat.parent_id === parentId)
    .map((cat) => ({
      ...cat,
      children: buildTree(categories, cat.id),
    }));
}

/**
 * GET request to fetch categories as a hierarchical tree.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }

    const result = await cached(
      'categories:tree',
      async () => {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        
        if (error) throw error;
        
        return buildTree(data || []);
      },
      24 * 60 * 60 // 24 hours
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return apiError('GET_CATEGORIES_FAILED', error.message || String(error), 500);
  }
}
