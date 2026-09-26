# SPARKD Adaptive Burn Controller

This folder is deliberately isolated from the production website.

## Safety status

**Not wired into production.** No existing SPARKD file is modified by this branch. The controller defaults to `enabled: false`, returning the current 2,000 SPARKD requirement. It performs no wallet connection, RPC request, transfer, burn, DOM mutation, or Supabase write.

The existing Meme of the Week code currently defines `REQUIRED_SPARKD: 2000`. That remains untouched.

## Goal

Provide a deterministic quote layer that can eventually sit *before* the existing verified burn flow. It adjusts the number of SPARKD required for a contest entry based on an externally supplied SPARKD/USD price while preserving explicit guardrails.

Core relationship when enabled:

`raw burn amount = targetEntryUsd / SPARKD priceUsd`

The current draft target is **$1 only as an engineering default for testing**, not a production economics decision.

## Guardrails

- Disabled by default / legacy fallback = 2,000 SPARKD.
- Rejects zero, negative, invalid, future, and stale price observations.
- Minimum and maximum token-burn bounds.
- Optional per-update rate limit (default +/-25%) to reduce abrupt quote changes.
- Pure calculation module: it cannot burn tokens itself.
- Optional remaining-supply observation is recorded in the quote but does not currently alter the amount.

## Integration rule

Do not replace the existing burn transaction logic. A future adapter should:

1. obtain a trustworthy, manipulation-resistant price observation;
2. call this controller;
3. display the exact required SPARKD amount to the entrant before wallet approval;
4. pass that exact amount into the existing burn transaction path;
5. verify the resulting on-chain burn before accepting the submission;
6. record the quote inputs, calculated amount, transaction signature, and post-burn supply.

If the price source is unavailable, stale, inconsistent, or outside safety limits, fail closed or deliberately fall back to a documented fixed amount. Never silently calculate from an untrusted browser-provided price.

## Testing

With Node installed:

`node adaptive-burn-controller/controller.test.js`

## Before production activation

Choose and document the production target-entry policy, price source/oracle, acceptable quote age, min/max burn, rate-limit behavior, pre-/post-graduation price adapters, server-side verification, and user-facing disclosure. Test against devnet/test fixtures before connecting it to the live contest.
