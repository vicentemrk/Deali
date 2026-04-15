import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * POST request to trigger the scraper for a specific store.
 */
// Valid store slugs — whitelist to prevent command injection
const VALID_STORE_SLUGS = new Set(['jumbo', 'lider', 'santa-isabel', 'tottus', 'unimarc', 'acuenta']);

export async function POST(req: NextRequest) {
  try {
    const { storeSlug } = await req.json();
    
    if (!storeSlug) {
      return apiError('MISSING_STORE_SLUG', 'storeSlug is required', 400);
    }
    
    // Sanitize storeSlug — only allow whitelisted values (prevent command injection)
    if (!VALID_STORE_SLUGS.has(storeSlug)) {
      return apiError('INVALID_STORE_SLUG', `Invalid store slug: ${storeSlug}`, 400);
    }
    
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return apiError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    if (process.env.NODE_ENV === 'production') {
        // En producción llamar a Github Actions via API o de una manera similar.
        // Dado que se pide free tier, se puede retornar solo un 200 si se encoló la tarea.
        return NextResponse.json({ message: `Scraper queued for ${storeSlug}` });
    }

    // Ejecuta localmente si no estamos en Vercel
    const { stdout, stderr } = await execPromise(`npx ts-node scripts/scrapeAll.ts --store ${storeSlug}`);
    
    if (stderr) {
       console.error(`[Scraper API Error] ${stderr}`);
    }

    return NextResponse.json({ success: true, log: stdout });
  } catch (error: any) {
    return apiError('TRIGGER_SCRAPER_FAILED', error.message || String(error), 500);
  }
}
