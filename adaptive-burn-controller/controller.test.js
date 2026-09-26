const assert = require("assert");
const controller = require("./controller.js");

function quote(priceUsd, previousBurnSparkd, config) {
  return controller.calculate({
    priceUsd,
    observedAtMs: 1_000_000,
    nowMs: 1_000_100,
    previousBurnSparkd
  }, Object.assign({ enabled: true }, config || {}));
}

// Safe default: no integration means the existing website remains at 2,000.
assert.strictEqual(controller.calculate().burnSparkd, 2000);
assert.strictEqual(controller.calculate().mode, "legacy");

// $1 target examples without rate limiting.
assert.strictEqual(quote(0.000005, null, { maxStepFraction: 0 }).burnSparkd, 200000);
assert.strictEqual(quote(0.0005, null, { maxStepFraction: 0 }).burnSparkd, 2000);
assert.strictEqual(quote(0.005, null, { maxStepFraction: 0 }).burnSparkd, 200);

// Hard min/max guards.
assert.strictEqual(quote(1, null, { maxStepFraction: 0 }).burnSparkd, 100);
assert.strictEqual(quote(0.0000001, null, { maxStepFraction: 0 }).burnSparkd, 200000);

// +/-25% rate limiter.
assert.strictEqual(quote(0.0001, 2000).burnSparkd, 2500);
assert.strictEqual(quote(0.01, 2000).burnSparkd, 1500);

// Reject stale observations.
assert.throws(() => controller.calculate({
  priceUsd: 0.001,
  observedAtMs: 1,
  nowMs: 500000
}, { enabled: true, maxPriceAgeMs: 1000 }), /stale/);

console.log("SPARKD adaptive burn controller tests passed");
