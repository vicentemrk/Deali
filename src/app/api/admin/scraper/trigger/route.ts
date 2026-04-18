import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';
import { isAdminUser } from '@/lib/adminAuth';
import { spawn } from 'child_process';

/**
 * POST /api/admin/scraper/trigger
 * 
 * Triggers a scraping job for one or all stores.
 * Returns immediately (202 Accepted) while job runs in background.
 * 
 * Query Parameters:
 *   - store: (optional) Specific store slug to scrape
 * 
 * Authentication: Required (admin/authenticated user via middleware)
 */

const VALID_STORES = ['jumbo', 'lider', 'unimarc', 'acuenta', 'tottus', 'santa-isabel'];

// Background job tracking (in-memory for single instance; use Redis for distributed)
const runningJobs = new Map<string, { startedAt: Date; status: string }>();

/**
 * Execute scraper in background (non-blocking)
 * Stores job status in runningJobs map for tracking
 */
async function executeScraperInBackground(storeSlug?: string) {
  const jobId = `${Date.now()}-${storeSlug || 'all'}`;
  const args = storeSlug
    ? ['tsx', 'scripts/scrapeAll.ts', '--store', storeSlug]
    : ['tsx', 'scripts/scrapeAll.ts'];

  runningJobs.set(jobId, { startedAt: new Date(), status: 'running' });

  // Run detached from request lifecycle without shell interpolation.
  const child = spawn('npx', args, {
    stdio: 'pipe',
    shell: false,
  });

  let stderrBuffer = '';

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderrBuffer += text;
    console.error(`[Scraper] ${storeSlug || 'all'} stderr:`, text);
  });

  child.on('error', (error) => {
    console.error(`[Scraper] Execution error:`, error);
    runningJobs.set(jobId, { startedAt: new Date(), status: 'error' });
  });

  child.on('close', (code) => {
    if (code === 0 && !stderrBuffer.trim()) {
      console.log(`[Scraper] Completed for ${storeSlug || 'all'}`);
      runningJobs.set(jobId, { startedAt: new Date(), status: 'completed' });
      return;
    }

    runningJobs.set(jobId, { startedAt: new Date(), status: 'failed' });
  });

  return jobId;
}

/**
 * POST handler - triggers scraper job asynchronously
 */
export async function POST(req: NextRequest) {
  try {
    // Auth is checked by middleware, but we double-check here
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !isAdminUser(user)) {
      return apiError('FORBIDDEN', 'Admin role required', 403);
    }

    // Get optional store filter from query params or body
    const { searchParams } = new URL(req.url);
    let storeSlug = searchParams.get('store');

    // If not in query params, try to get from body
    if (!storeSlug) {
      try {
        const body = await req.json();
        storeSlug = body.storeSlug || body.store;
      } catch {
        // No body or invalid JSON, continue
      }
    }

    // Validate store filter if provided
    const normalizedStore = storeSlug?.trim().toLowerCase();

    if (normalizedStore && !VALID_STORES.includes(normalizedStore)) {
      return apiError(
        'INVALID_STORE',
        `Invalid store. Must be one of: ${VALID_STORES.join(', ')}`,
        400
      );
    }

    // Trigger scraper job in background (non-blocking)
    const jobId = await executeScraperInBackground(normalizedStore || undefined);

    // Return 202 Accepted immediately
    return NextResponse.json(
      {
        status: 'accepted',
        jobId,
        message: normalizedStore
          ? `Scraper job started for ${normalizedStore} store`
          : 'Scraper job started for all stores',
        store: normalizedStore || null,
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('[Scraper Trigger Error]', error);
    return apiError('TRIGGER_SCRAPER_FAILED', error.message || String(error), 500);
  }
}

/**
 * GET handler - returns running jobs and recent scrape logs
 */
export async function GET(req: NextRequest) {
  try {
    // Auth is checked by middleware
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !isAdminUser(user)) {
      return apiError('FORBIDDEN', 'Admin role required', 403);
    }

    // Get running jobs
    const runningJobsList = Array.from(runningJobs.entries()).map(([jobId, job]) => ({
      jobId,
      startedAt: job.startedAt.toISOString(),
      status: job.status,
    }));

    // Get last 10 scrape logs from database
    const { data: logs, error: logsError } = await supabase
      .from('scrape_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('[Scrape Logs Error]', logsError);
    }

    return NextResponse.json(
      {
        runningJobs: runningJobsList,
        recentLogs: logs || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Scraper Status Error]', error);
    return apiError('GET_STATUS_FAILED', error.message || String(error), 500);
  }
}
