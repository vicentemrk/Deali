import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  buildLowVolumeAlert,
  envKeyForStoreThreshold,
  resolveAlertThreshold,
} from '../scrapeAlerts';

test('scrapeAlerts: env key normalizes hyphenated store slugs', () => {
  assert.equal(envKeyForStoreThreshold('santa-isabel'), 'SCRAPE_ALERT_MIN_SANTA_ISABEL');
  assert.equal(envKeyForStoreThreshold('jumbo'), 'SCRAPE_ALERT_MIN_JUMBO');
});

test('scrapeAlerts: default thresholds are applied by store', () => {
  delete process.env.SCRAPE_ALERT_MIN_JUMBO;
  delete process.env.SCRAPE_ALERT_MIN_SANTA_ISABEL;

  assert.equal(resolveAlertThreshold('jumbo'), 25);
  assert.equal(resolveAlertThreshold('santa-isabel'), 30);
  assert.equal(resolveAlertThreshold('unknown-store'), 20);
});

test('scrapeAlerts: env override has priority', () => {
  process.env.SCRAPE_ALERT_MIN_JUMBO = '31';
  assert.equal(resolveAlertThreshold('jumbo'), 31);
  delete process.env.SCRAPE_ALERT_MIN_JUMBO;
});

test('scrapeAlerts: buildLowVolumeAlert emits alert only when below threshold', () => {
  const low = buildLowVolumeAlert('jumbo', 10, 8);
  assert.ok(low);
  assert.equal(low?.storeSlug, 'jumbo');
  assert.equal(low?.threshold, 25);

  const ok = buildLowVolumeAlert('jumbo', 40, 35);
  assert.equal(ok, null);
});
