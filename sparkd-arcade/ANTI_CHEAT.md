# SPARKD Arcade anti-cheat architecture (design, NOT deployed)

## Trust boundary

**Browser JavaScript, localStorage, timestamps, scores, player names, and gameplay event logs are all attacker-controlled.** v0.9 local sanity checks are a usability filter only. Do not award tokens or publish official rankings from them.

## Required production flow

1. Authenticated player requests a run from a backend service. The backend validates the user's identity, applies a per-user daily limit using a database transaction, and issues a one-use random run ID and server-side start timestamp. No client-selected user ID or start time.
2. The browser sends bounded jump/duck events with sequence numbers. The server rejects malformed, out-of-order, duplicated, oversized, or over-rate event streams. A signed nonce alone does not prevent a scripted player.
3. **Authoritative simulation:** The server generates the obstacle/energy schedule from a secret run seed and replays the inputs through the same fixed-step physics and collision logic. Never trust submitted score, duration, orb count, or collision results. The current game uses Math.random and variable frame deltas; it MUST be refactored to deterministic fixed-step simulation before this can be enforced.
4. Finalization happens once, atomically, against a non-expired run record. Replays are rejected by unique constraints and a state transition from active to finalized.
5. The server computes score, validates elapsed server time with reasonable tolerance, and inserts an official result. Weekly leaderboard reads only verified finalized results.
6. Add rate limiting, request-size limits, audit logs, suspicious-pattern monitoring, and automated tests for replay, forged identity, clock tampering, forged score, altered game code, duplicate submissions, and concurrent daily-limit bypasses.
7. Keep service-role/secret credentials exclusively on the server. Enable RLS for every exposed table. Users may read approved public leaderboard entries but may not insert/update official scores directly.

## Security acceptance criteria

- Direct REST insert/update into official scores fails for anonymous and ordinary authenticated clients.
- Tampered localStorage, DevTools modifications, clock changes, and forged score fields cannot create an official result.
- Two concurrent start requests cannot exceed daily quota.
- Reusing a run ID or event sequence is rejected.
- Offline/local play remains explicitly labeled unverified.
- No financial rewards until a separate security review and live abuse testing.

## Current status

Only local integrity checks exist in the browser. **No production anti-cheat backend, account authentication, deterministic simulation, or official leaderboard is deployed by this change.** Existing Supabase infrastructure must be reviewed before adding any isolated arcade tables/functions, to avoid disrupting the live website.
