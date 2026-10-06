/*
 * SPARKD Adaptive Burn Controller v0.1
 *
 * ISOLATED / OPT-IN MODULE.
 * This file is not loaded by the existing website and performs no wallet,
 * token, burn, transfer, RPC, or DOM operations by itself.
 *
 * Purpose: calculate a contest burn quote from externally supplied price and
 * supply observations. The existing burn engine remains the authority that
 * builds/verifies an on-chain burn transaction.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SPARKD_ADAPTIVE_BURN = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.1.0";
  const DEFAULTS = Object.freeze({
    // Current production contest burn. Compatibility/fallback anchor only.
    legacyBurnSparkd: 2000,

    // Illustrative starting target. Keep controller disabled until the project
    // explicitly chooses/approves its production economics and price source.
    targetEntryUsd: 1.00,

    // Guardrails prevent a bad quote from producing an extreme requirement.
    minBurnSparkd: 100,
    maxBurnSparkd: 200000,

    // Optional smoothing: next quote cannot change by more than this fraction
    // relative to a previous accepted quote (0.25 = +/-25%).
    maxStepFraction: 0.25,

    // Quote freshness requirement supplied by the future price adapter.
    maxPriceAgeMs: 120000,

    // Disabled means calculate() returns the existing 2,000 SPARKD amount.
    enabled: false
  });

  function finitePositive(value, name) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) throw new Error(name + " must be a positive finite number");
    return n;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeConfig(overrides) {
    const cfg = Object.assign({}, DEFAULTS, overrides || {});
    cfg.legacyBurnSparkd = finitePositive(cfg.legacyBurnSparkd, "legacyBurnSparkd");
    cfg.targetEntryUsd = finitePositive(cfg.targetEntryUsd, "targetEntryUsd");
    cfg.minBurnSparkd = finitePositive(cfg.minBurnSparkd, "minBurnSparkd");
    cfg.maxBurnSparkd = finitePositive(cfg.maxBurnSparkd, "maxBurnSparkd");
    cfg.maxStepFraction = Number(cfg.maxStepFraction);
    cfg.maxPriceAgeMs = finitePositive(cfg.maxPriceAgeMs, "maxPriceAgeMs");
    if (cfg.maxBurnSparkd < cfg.minBurnSparkd) throw new Error("maxBurnSparkd must be >= minBurnSparkd");
    if (!Number.isFinite(cfg.maxStepFraction) || cfg.maxStepFraction < 0 || cfg.maxStepFraction > 1) {
      throw new Error("maxStepFraction must be between 0 and 1");
    }
    cfg.enabled = cfg.enabled === true;
    return cfg;
  }

  function calculate(input, overrides) {
    const cfg = normalizeConfig(overrides);

    // Fail-safe compatibility mode: website behavior remains exactly 2,000.
    if (!cfg.enabled) {
      return Object.freeze({
        version: VERSION,
        mode: "legacy",
        burnSparkd: Math.round(cfg.legacyBurnSparkd),
        reason: "adaptive controller disabled"
      });
    }

    input = input || {};
    const priceUsd = finitePositive(input.priceUsd, "priceUsd");
    const observedAtMs = Number(input.observedAtMs);
    const nowMs = Number.isFinite(Number(input.nowMs)) ? Number(input.nowMs) : Date.now();
    if (!Number.isFinite(observedAtMs) || observedAtMs <= 0) throw new Error("observedAtMs is required");
    if (observedAtMs > nowMs + 5000) throw new Error("price observation is in the future");
    if (nowMs - observedAtMs > cfg.maxPriceAgeMs) throw new Error("price observation is stale");

    let amount = cfg.targetEntryUsd / priceUsd;
    amount = clamp(amount, cfg.minBurnSparkd, cfg.maxBurnSparkd);

    const previous = Number(input.previousBurnSparkd);
    if (Number.isFinite(previous) && previous > 0 && cfg.maxStepFraction > 0) {
      const low = previous * (1 - cfg.maxStepFraction);
      const high = previous * (1 + cfg.maxStepFraction);
      amount = clamp(amount, low, high);
      amount = clamp(amount, cfg.minBurnSparkd, cfg.maxBurnSparkd);
    }

    // Whole-token quote keeps UI and transaction construction predictable.
    const burnSparkd = Math.max(1, Math.round(amount));

    return Object.freeze({
      version: VERSION,
      mode: "adaptive",
      burnSparkd,
      priceUsd,
      targetEntryUsd: cfg.targetEntryUsd,
      estimatedEntryUsd: burnSparkd * priceUsd,
      observedAtMs,
      remainingSupplySparkd: Number.isFinite(Number(input.remainingSupplySparkd))
        ? Number(input.remainingSupplySparkd)
        : null
    });
  }

  return Object.freeze({ VERSION, DEFAULTS, calculate, normalizeConfig });
});
