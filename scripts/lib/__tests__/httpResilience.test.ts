import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  __resetHostCircuitStateForTests,
  getHostFromUrl,
  recordHostFailure,
  recordHostSuccess,
  shouldRetryHttpStatus,
  shouldShortCircuitHost,
} from '../httpResilience';

test('httpResilience: extracts host from URL', () => {
  assert.equal(getHostFromUrl('https://www.jumbo.cl/path?q=1'), 'www.jumbo.cl');
});

test('httpResilience: classifies retryable HTTP statuses', () => {
  assert.equal(shouldRetryHttpStatus(429), true);
  assert.equal(shouldRetryHttpStatus(500), true);
  assert.equal(shouldRetryHttpStatus(408), true);
  assert.equal(shouldRetryHttpStatus(404), false);
});

test('httpResilience: opens and closes circuit based on failures/success', () => {
  __resetHostCircuitStateForTests();
  const host = 'test.example.com';

  // Default threshold is 4 failures.
  recordHostFailure(host);
  recordHostFailure(host);
  recordHostFailure(host);
  let circuit = shouldShortCircuitHost(host);
  assert.equal(circuit.blocked, false);

  const fourth = recordHostFailure(host);
  assert.equal(fourth.tripped, true);

  circuit = shouldShortCircuitHost(host);
  assert.equal(circuit.blocked, true);
  assert.ok(circuit.retryInMs > 0);

  recordHostSuccess(host);
  circuit = shouldShortCircuitHost(host);
  assert.equal(circuit.blocked, false);
});
