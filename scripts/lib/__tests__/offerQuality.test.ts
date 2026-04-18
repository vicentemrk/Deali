import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { calculateDiscountPct, isGoodOffer, MIN_GOOD_DISCOUNT_PCT, MAX_REASONABLE_DISCOUNT_PCT } from '../offerQuality';

test('calculateDiscountPct returns rounded percentage', () => {
  assert.equal(calculateDiscountPct(95, 100), 5);
  assert.equal(calculateDiscountPct(0, 100), 0);
  assert.equal(calculateDiscountPct(100, 100), 0);
});

test('calculateDiscountPct handles invalid values', () => {
  assert.equal(calculateDiscountPct(10, 0), 0);
  assert.equal(calculateDiscountPct(-1, 100), 0);
  assert.equal(calculateDiscountPct(100, 100), 0);
});

test('isGoodOffer filters out zero and near-zero discounts', () => {
  assert.equal(isGoodOffer({ productName: 'A', brand: null, imageUrl: '', offerUrl: '', originalPrice: 100, offerPrice: 100, categoryHint: null }), false);
  assert.equal(isGoodOffer({ productName: 'B', brand: null, imageUrl: '', offerUrl: '', originalPrice: 100, offerPrice: 99, categoryHint: null }), false);
});

test('isGoodOffer accepts reasonable offers', () => {
  assert.equal(isGoodOffer({ productName: 'C', brand: null, imageUrl: '', offerUrl: '', originalPrice: 100, offerPrice: 90, categoryHint: null }), true);
});

test('quality thresholds stay in expected range', () => {
  assert.equal(MIN_GOOD_DISCOUNT_PCT, 5);
  assert.equal(MAX_REASONABLE_DISCOUNT_PCT, 90);
});
