import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
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

const VALID_STORES = ['jumbo', 'lider', 'unimarc', 'acuenta', 'tottus', 'santa-isabel'] as const;
const VALID_STORE_SET = new Set<string>(VALID_STORES);
const runningJobs = new Map<string, { startedAt: Date; status: string }>();
const DEFAULT_EXECUTION_MODE = process.env.VERCEL ? 'queue' : 'local';
const SCRAPER_EXECUTION_MODE = process.env.SCRAPER_EXECUTION_MODE || DEFAULT_EXECUTION_MODE;

/**
 * Execute scraper in background (non-blocking)
 * Stores job status in runningJobs map for tracking
 */
async function executeScraperInBackground(storeSlug?: string, requestId?: string) {
  if (storeSlug && !VALID_STORE_SET.has(storeSlug)) {
    throw new Error(`Invalid store slug for execution: ${storeSlug}`);
  }

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

async function enqueueScrapeJob(options: {
  storeSlug?: string;
  requestId: string;
  requestedBy: string | null;
}) {
  const serviceRole = createServiceRoleClient();
  const { data, error } = await serviceRole
    .from('scrape_jobs')
    .insert({
      store_slug: options.storeSlug ?? null,
      status: 'pending',
      requested_by: options.requestedBy,
      metadata: {
        requestId: options.requestId,
        source: 'api_admin_scraper_trigger',
      },
    })
    .select('id, store_slug, status, requested_at')
    .single();

  if (error) {
    throw new Error(`Failed to enqueue scrape job: ${error.message}`);
  }

  return data;
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

    if (normalizedStore && !VALID_STORE_SET.has(normalizedStore)) {
      return apiError(
        'INVALID_STORE',
        `Invalid store. Must be one of: ${VALID_STORES.join(', ')}`,
        400,
        { requestId: requestMeta.requestId }
      );
    }

    const selectedStoreSlug = normalizedStore || undefined;

    if (SCRAPER_EXECUTION_MODE === 'local') {
      const jobId = await executeScraperInBackground(selectedStoreSlug, requestMeta.requestId);
      const response = NextResponse.json(
        {
          status: 'accepted',
          jobId,
          mode: 'local',
          message: selectedStoreSlug
            ? `Scraper job started locally for ${selectedStoreSlug} store`
            : 'Scraper job started locally for all stores',
          store: selectedStoreSlug ?? null,
        },
        { status: 202 }
      );
      response.headers.set('X-Request-Id', requestMeta.requestId);
      logApiSuccess('api_admin_scraper_trigger_post', {
        ...requestMeta,
        store: selectedStoreSlug ?? null,
        mode: 'local',
        jobId,
      });
      return response;
    }

    const job = await enqueueScrapeJob({
      storeSlug: selectedStoreSlug,
      requestId: requestMeta.requestId,
      requestedBy: user?.id ?? null,
    });

    // Return 202 Accepted immediately (worker executes asynchronously)
    const response = NextResponse.json(
      {
        status: 'accepted',
        mode: 'queue',
        job,
        message: selectedStoreSlug
          ? `Scraper job enqueued for ${selectedStoreSlug} store`
          : 'Scraper job enqueued for all stores',
        store: selectedStoreSlug ?? null,
      },
      { status: 202 }
    );
    response.headers.set('X-Request-Id', requestMeta.requestId);
    logApiSuccess('api_admin_scraper_trigger_post', {
      ...requestMeta,
      store: selectedStoreSlug ?? null,
      mode: 'queue',
      jobId: job.id,
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

    let runningJobsList: Array<{ jobId: string; startedAt: string; status: string }> = [];
    let queuedJobs: Array<{ id: string; store_slug: string | null; status: string; requested_at: string }> = [];

    if (SCRAPER_EXECUTION_MODE === 'local') {
      runningJobsList = Array.from(runningJobs.entries()).map(([jobId, job]) => ({
        jobId,
        startedAt: job.startedAt.toISOString(),
        status: job.status,
      }));
    } else {
      const serviceRole = createServiceRoleClient();
      const { data: queueData, error: queueError } = await serviceRole
        .from('scrape_jobs')
        .select('id, store_slug, status, requested_at')
        .in('status', ['pending', 'processing'])
        .order('requested_at', { ascending: false })
        .limit(25);

      if (queueError) {
        logApiWarn('api_admin_scraper_trigger_get_queue_error', {
          ...requestMeta,
          error: queueError.message,
        });
      } else {
        queuedJobs = queueData || [];
      }
    }

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
        mode: SCRAPER_EXECUTION_MODE,
        runningJobs: runningJobsList,
        queuedJobs,
        recentLogs: logs || [],
      },
      { status: 200 }
    );
    response.headers.set('X-Request-Id', requestMeta.requestId);
    logApiSuccess('api_admin_scraper_trigger_get', {
      ...requestMeta,
      mode: SCRAPER_EXECUTION_MODE,
      runningJobs: runningJobsList.length,
      queuedJobs: queuedJobs.length,
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
