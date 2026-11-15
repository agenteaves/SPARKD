# SPARKD ELITES — authoritative scoring foundation

Status: **PRIVATE DATABASE FOUNDATION DEPLOYED; NO SCORES ARE VERIFIED.**

The existing browser game and its working EXIT flow are unchanged. Its BEST and
practice leaderboards are local, editable and **not eligible for prizes**.

## Trust boundary

The browser is untrusted. Never trust submitted score, lives, elapsed time,
orb count, level, replay events, or a JavaScript "verified" flag. Hiding,
obfuscating or signing code in the browser does not make it authoritative.

A verified-score service must:
1. Authenticate each player and issue a short-lived, single-use, server-generated
   run ID, unpredictable seed and start timestamp.
2. Accept bounded input events for that run, with sequence numbers and strict
   timing/rate limits. A replay is evidence, **not proof**.
3. Re-simulate all five runner levels and all 3D boss phases using a versioned,
   deterministic server-side rules engine; calculate score, collisions, health,
   orbs, lives, and victory from the inputs, not client claims.
4. Reject impossible timing, events, duplicate run IDs, unknown versions,
   altered seeds, mismatched computed scores and expired sessions.
5. Insert the server-computed score into a private table in a transaction, then
   mark the run ID consumed. Do not expose client INSERT/UPDATE/DELETE rights.
6. Read Top 10 and personal best only from verified runs. Add rate limits,
   monitoring, appeal/review workflow, and bot controls before any rewards.

## Database preparation

`001_verified_scores.sql` and `002_run_sessions.sql` describe private tables
already created in the existing SPARKD Supabase project.
The private `sparkd_secure` schema has RLS and no client access grants.
No public write RPC, endpoint, or client credential is provided.

## Next integration milestone

Build and test the deterministic verifier against golden replays for runner and
boss gameplay; then implement authenticated run-start/run-submit endpoints.
Until those tests pass, the backend must not claim to verify any score.
Keep existing local BEST explicitly unofficial and do not pay prizes from it.

## Current development status (2026-11-15)

- Private `sparkd_secure.verified_runs` and `sparkd_secure.run_sessions` tables deployed with RLS and no client access.
- `replay-envelope.mjs` validates preliminary input shape and timing, but always rejects score certification.
- `runner-simulator.mjs` is a standalone runner-only prototype; its replay timing, invincibility, cross-stage transitions, and boss logic are incomplete. It must not be used to certify scores.
- `*.test.mjs` are exercised by `.github/workflows/sparkd-anti-cheat.yml` when GitHub Actions runs; do not assume a successful CI result without checking the workflow.
- No trusted session issuance, game submission API, authoritative verifier, or official leaderboard is live.
