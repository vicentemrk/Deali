import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { fetchJson, getAppBaseUrl } from './siteData';

test('getAppBaseUrl prefers NEXT_PUBLIC_APP_URL when configured', () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

  assert.equal(getAppBaseUrl(), 'https://example.com');

  if (previous === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});

test('getAppBaseUrl falls back to localhost when env is missing', () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;

  assert.equal(getAppBaseUrl(), 'http://localhost:3000');

  if (previous !== undefined) {
    process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});

test('fetchJson returns parsed json for successful responses', async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    assert.equal(url, 'https://example.com/api/test');
    assert.equal(init?.cache, 'no-store');
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const result = await fetchJson<{ ok: boolean }>('/api/test', { cache: 'no-store' });

  assert.deepEqual(result, { ok: true });
  global.fetch = originalFetch;
});

test('fetchJson returns null on non-ok responses', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (): Promise<Response> => new Response('fail', { status: 500 });

  const result = await fetchJson('/api/fail');

  assert.equal(result, null);
  global.fetch = originalFetch;
});