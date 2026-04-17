import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { getRateLimitPolicy, resolveRateLimitRoute } from './rateLimit';

test('resolveRateLimitRoute maps supported API paths', () => {
  assert.equal(resolveRateLimitRoute('/api/offers'), 'offers');
  assert.equal(resolveRateLimitRoute('/api/offers/123'), 'offers');
  assert.equal(resolveRateLimitRoute('/api/stores'), 'stores');
  assert.equal(resolveRateLimitRoute('/api/stores/jumbo/offers'), 'stores');
  assert.equal(resolveRateLimitRoute('/api/categories'), 'categories');
  assert.equal(resolveRateLimitRoute('/api/promotions'), 'promotions');
});

test('resolveRateLimitRoute ignores unsupported paths', () => {
  assert.equal(resolveRateLimitRoute('/api/admin/offers'), null);
  assert.equal(resolveRateLimitRoute('/admin'), null);
  assert.equal(resolveRateLimitRoute('/'), null);
});

test('getRateLimitPolicy returns tighter limits for writes', () => {
  const offersGet = getRateLimitPolicy('offers', 'GET');
  const offersPost = getRateLimitPolicy('offers', 'POST');

  assert.equal(offersGet.maxRequests, 90);
  assert.equal(offersPost.maxRequests, 30);
});

test('getRateLimitPolicy is case-insensitive for methods', () => {
  assert.equal(getRateLimitPolicy('stores', 'get').maxRequests, 180);
  assert.equal(getRateLimitPolicy('stores', 'delete').maxRequests, 40);
});
