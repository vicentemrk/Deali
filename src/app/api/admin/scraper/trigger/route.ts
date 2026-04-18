import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/apiError';
import { isAdminUser } from '@/lib/adminAuth';
import { getRequestMeta, logApiError, logApiStart, logApiSuccess, logApiWarn } from '@/lib/logger';
import { spawn } from 'child_process';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
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
async function executeScraperInBackground(storeSlug?: string, requestId?: string) {
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
    logApiWarn('scraper_stderr', {
      requestId,
      store: storeSlug || 'all',
      stderr: text,
    });
  });

  child.on('error', (error) => {
    logApiError('scraper_execution_error', error, {
      requestId,
      store: storeSlug || 'all',
    });
    runningJobs.set(jobId, { startedAt: new Date(), status: 'error' });
  });

  child.on('close', (code) => {
    if (code === 0 && !stderrBuffer.trim()) {
      logApiSuccess('scraper_completed', {
        requestId,
        store: storeSlug || 'all',
        jobId,
      });
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
  const requestMeta = getRequestMeta(req);
  logApiStart('api_admin_scraper_trigger_post', requestMeta);

  try {
    // Auth is checked by middleware, but we double-check here
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      logApiError('api_admin_scraper_trigger_post_supabase_init_failed', 'Supabase client initialization failed', requestMeta);
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500, {
        requestId: requestMeta.requestId,
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !isAdminUser(user)) {
      logApiWarn('api_admin_scraper_trigger_post_forbidden', requestMeta);
      return apiError('FORBIDDEN', 'Admin role required', 403, {
        requestId: requestMeta.requestId,
      });
    }

    // Get optional store filter from query params or body
    const { searchParams } = new URL(req.url);
    let storeSlug = searchParams.get('store');

    // If not in query params, try to get from body
    if (!storeSlug) {
      try {
        const body = (await req.json()) as { storeSlug?: string; store?: string };
        storeSlug = body.storeSlug ?? body.store ?? null;
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
        400,
        { requestId: requestMeta.requestId }
      );
    }

    // Trigger scraper job in background (non-blocking)
    const jobId = await executeScraperInBackground(normalizedStore || undefined, requestMeta.requestId);

    // Return 202 Accepted immediately
    const response = NextResponse.json(
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
    response.headers.set('X-Request-Id', requestMeta.requestId);
    logApiSuccess('api_admin_scraper_trigger_post', {
      ...requestMeta,
      store: normalizedStore || null,
      jobId,
    });
    return response;
  } catch (error: unknown) {
    logApiError('api_admin_scraper_trigger_post_failed', error, requestMeta);
    return apiError('TRIGGER_SCRAPER_FAILED', getErrorMessage(error), 500, {
      requestId: requestMeta.requestId,
    });
  }
}

/**
 * GET handler - returns running jobs and recent scrape logs
 */
export async function GET(req: NextRequest) {
  const requestMeta = getRequestMeta(req);
  logApiStart('api_admin_scraper_trigger_get', requestMeta);

  try {
    // Auth is checked by middleware
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      logApiError('api_admin_scraper_trigger_get_supabase_init_failed', 'Supabase client initialization failed', requestMeta);
      return apiError('SUPABASE_INIT_FAILED', 'Supabase client initialization failed', 500, {
        requestId: requestMeta.requestId,
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !isAdminUser(user)) {
      logApiWarn('api_admin_scraper_trigger_get_forbidden', requestMeta);
      return apiError('FORBIDDEN', 'Admin role required', 403, {
        requestId: requestMeta.requestId,
      });
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
      logApiWarn('api_admin_scraper_trigger_get_logs_error', {
        ...requestMeta,
        error: logsError.message,
      });
    }

    const response = NextResponse.json(
      {
        runningJobs: runningJobsList,
        recentLogs: logs || [],
      },
      { status: 200 }
    );
    response.headers.set('X-Request-Id', requestMeta.requestId);
    logApiSuccess('api_admin_scraper_trigger_get', {
      ...requestMeta,
      runningJobs: runningJobsList.length,
      recentLogs: (logs || []).length,
    });
    return response;
  } catch (error: unknown) {
    logApiError('api_admin_scraper_trigger_get_failed', error, requestMeta);
    return apiError('GET_STATUS_FAILED', getErrorMessage(error), 500, {
      requestId: requestMeta.requestId,
    });
  }
}
