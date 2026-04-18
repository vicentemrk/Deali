import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

type SmokeResult = {
  name: string;
  ok: boolean;
  details: string;
};

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3100';
const hasSupabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fetchText(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();
  return { response, text };
}

function pushResult(results: SmokeResult[], name: string, ok: boolean, details: string) {
  results.push({ name, ok, details });
}

function includesAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

async function checkPageContains(
  results: SmokeResult[],
  route: string,
  expectedStatus: number,
  mustContain: string[]
) {
  const url = `${BASE_URL}${route}`;
  try {
    const { response, text } = await fetchText(url, { redirect: 'manual' });
    const hasText = includesAny(text, mustContain);
    const ok = response.status === expectedStatus && hasText;
    pushResult(
      results,
      `PAGE ${route}`,
      ok,
      `status=${response.status}, expected=${expectedStatus}, contains=${hasText}`
    );
  } catch (error) {
    pushResult(results, `PAGE ${route}`, false, `request failed: ${String(error)}`);
  }
}

async function checkAdminRedirect(results: SmokeResult[]) {
  const route = '/admin';
  const url = `${BASE_URL}${route}`;
  try {
    const { response } = await fetchText(url, { redirect: 'manual' });
    const location = response.headers.get('location') || '';
    const statusOk = response.status === 307 || response.status === 308;
    const locationOk = location.includes('/login');
    pushResult(
      results,
      `PAGE ${route} redirect`,
      statusOk && locationOk,
      `status=${response.status}, location=${location || '(none)'}`
    );
  } catch (error) {
    pushResult(results, `PAGE ${route} redirect`, false, `request failed: ${String(error)}`);
  }
}

async function checkPublicApi(results: SmokeResult[], route: string) {
  const url = `${BASE_URL}${route}`;
  try {
    const { response, text } = await fetchText(url, { redirect: 'manual' });
    const isConfiguredOk = hasSupabaseAnon ? response.status === 200 : response.status === 503;
    const hasRateHeaders = Boolean(response.headers.get('x-ratelimit-limit'));
    const codeOk =
      hasSupabaseAnon || includesAny(text, ['DB_NOT_CONFIGURED', 'Supabase client initialization failed']);

    pushResult(
      results,
      `API ${route}`,
      isConfiguredOk && hasRateHeaders && codeOk,
      `status=${response.status}, configured=${hasSupabaseAnon}, rateHeaders=${hasRateHeaders}`
    );
  } catch (error) {
    pushResult(results, `API ${route}`, false, `request failed: ${String(error)}`);
  }
}

async function checkAdminApi(results: SmokeResult[]) {
  const route = '/api/admin/offers';
  const url = `${BASE_URL}${route}`;
  try {
    const { response, text } = await fetchText(url, { redirect: 'manual' });
    const expectedStatus = hasSupabaseAnon ? 403 : 500;
    const expectedCode = hasSupabaseAnon ? 'FORBIDDEN' : 'SUPABASE_INIT_FAILED';
    const codeOk = includesAny(text, [expectedCode]);
    const ok = response.status === expectedStatus && codeOk;
    pushResult(
      results,
      `API ${route}`,
      ok,
      `status=${response.status}, expected=${expectedStatus}, codeOk=${codeOk}`
    );
  } catch (error) {
    pushResult(results, `API ${route}`, false, `request failed: ${String(error)}`);
  }
}

async function main() {
  const results: SmokeResult[] = [];

  console.log(`[SMOKE] Base URL: ${BASE_URL}`);
  console.log(`[SMOKE] NEXT_PUBLIC_SUPABASE_ANON_KEY configured: ${hasSupabaseAnon}`);

  await checkPageContains(results, '/', 200, ['Las mejores ofertas', 'Supermercados destacados']);
  await checkPageContains(results, '/buscar?q=leche', 200, ['Resultados de búsqueda', 'Buscando']);
  await checkPageContains(results, '/categoria/lacteos', 200, ['Categoría: lacteos', 'Ordenar por']);
  await checkPageContains(results, '/supermercado/jumbo', 200, ['Ofertas en jumbo', 'Categoría']);
  await checkPageContains(results, '/promociones', 200, ['Promociones', 'promociones']);
  await checkPageContains(results, '/login', 200, ['Deali Admin', 'Iniciar Sesión']);
  await checkAdminRedirect(results);

  await checkPublicApi(results, '/api/offers');
  await checkPublicApi(results, '/api/stores');
  await checkPublicApi(results, '/api/categories');
  await checkPublicApi(results, '/api/promotions');
  await checkAdminApi(results);

  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  console.log('\n[SMOKE] Results');
  for (const result of results) {
    const prefix = result.ok ? 'PASS' : 'FAIL';
    console.log(`- ${prefix} ${result.name}: ${result.details}`);
  }

  console.log(`\n[SMOKE] Summary: ${passed.length}/${results.length} passed`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[SMOKE] Fatal error: ${String(error)}`);
  process.exit(1);
});
