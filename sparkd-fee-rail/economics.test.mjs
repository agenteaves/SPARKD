import test from 'node:test';
import assert from 'node:assert/strict';
import { economics, feeQuote } from './economics.mjs';

test('fee quote converts an illustrative USD fee to whole SPARKD units', () => {
  assert.deepEqual(feeQuote({ feeUsd: 0.05, sparkdPriceUsd: 0.00001, tradeUsd: 100 }), {
    feeUsd: 0.05,
    sparkdPriceUsd: 0.00001,
    tradeUsd: 100,
    feeTokenAmount: 5000,
    routeCostUsd: 0.3,
  });
});

test('rounds up fractional token fee to avoid undercharging the configured USD amount', () => {
  assert.equal(feeQuote({ feeUsd: 0.05, sparkdPriceUsd: 0.03, tradeUsd: 12 }).feeTokenAmount, 2);
});

test('calculates net monthly contribution and break-even daily swaps', () => {
  assert.deepEqual(economics({ feeUsd: 0.05, sponsorCostUsd: 0.002, swapsPerDay: 100, monthlyOperatingUsd: 100 }), {
    contributionPerSwapUsd: 0.048,
    monthlySwaps: 3000,
    monthlyNetUsd: 44,
    breakEvenSwapsPerDay: 70,
  });
});

test('reports no break-even volume if the app fee does not cover sponsor cost', () => {
  assert.equal(economics({ feeUsd: 0.001, sponsorCostUsd: 0.002, swapsPerDay: 100, monthlyOperatingUsd: 100 }).breakEvenSwapsPerDay, null);
});

test('rejects invalid fee inputs', () => {
  assert.throws(() => feeQuote({ feeUsd: 0.05, sparkdPriceUsd: 0, tradeUsd: 100 }), /sparkdPriceUsd/);
  assert.throws(() => economics({ feeUsd: 0.05, sponsorCostUsd: -1, swapsPerDay: 1, monthlyOperatingUsd: 1 }), /sponsorCostUsd/);
});
