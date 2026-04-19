import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

type ScrapeJob = {
  id: string;
  store_slug: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function claimNextJob(): Promise<ScrapeJob | null> {
  const { data: pending, error: pendingError } = await supabase
    .from('scrape_jobs')
    .select('id, store_slug, status')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (pendingError) {
    throw new Error(`Failed to read queue: ${pendingError.message}`);
  }

  if (!pending) {
    return null;
  }

  const { data: claimed, error: claimError } = await supabase
    .from('scrape_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', pending.id)
    .eq('status', 'pending')
    .select('id, store_slug, status')
    .maybeSingle();

  if (claimError) {
    throw new Error(`Failed to claim queue job: ${claimError.message}`);
  }

  return claimed || null;
}

async function runScraper(storeSlug: string | null): Promise<{ exitCode: number; stderr: string }> {
  const args = storeSlug ? ['tsx', 'scripts/scrapeAll.ts', '--store', storeSlug] : ['tsx', 'scripts/scrapeAll.ts'];

  return await new Promise((resolve, reject) => {
    const child = spawn('npx', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stderr = '';

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk.toString());
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => resolve({ exitCode: code ?? 1, stderr }));
  });
}

async function completeJob(jobId: string) {
  const { error } = await supabase
    .from('scrape_jobs')
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      error: null,
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to mark job as completed: ${error.message}`);
  }
}

async function failJob(jobId: string, message: string) {
  const { error } = await supabase
    .from('scrape_jobs')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error: message.slice(0, 2000),
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to mark job as failed: ${error.message}`);
  }
}

async function main() {
  const job = await claimNextJob();

  if (!job) {
    console.log('No pending scrape jobs');
    return;
  }

  console.log(`Processing job ${job.id} (${job.store_slug ?? 'all stores'})`);

  try {
    const result = await runScraper(job.store_slug);
    if (result.exitCode !== 0) {
      const details = result.stderr.trim() || `Scraper exited with code ${result.exitCode}`;
      await failJob(job.id, details);
      process.exit(1);
      return;
    }

    await completeJob(job.id);
    console.log(`Job ${job.id} completed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await failJob(job.id, message);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
