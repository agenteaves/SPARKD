# SPARKD Arcade secure backend — implementation contract (draft)

**Status: design only; not deployed or connected to the website.** The `schema-draft.sql` file has NOT been executed against Supabase.

## Backend endpoints (future)

### POST /arcade/runs/start
- Require a valid authenticated user JWT; resolve identity server-side.
- Allocate one of five daily slots transactionally, keyed by user and UTC day. Reject once all five are used. Never accept a client-selected seed or player ID.
- Generate a cryptographically random nonzero 32-bit seed and one-use UUID.
- Persist server start and expiry timestamps; return run ID, seed, rules version, and expiry.
- Set strict rate limits and reject concurrent requests that exceed quota.

### POST /arcade/runs/:id/finalize
- Authenticate same player; accept bounded input events only (not authoritative score).
- Reject expired, already-finalized, and other players' runs.
- Replay using a server-controlled seed and shared versioned deterministic physics.
- Check wall-clock duration with tolerance, event counts/rates, and valid terminal state.
- Atomically transition the run from active to verified/rejected; never allow second submission.
- Return verified score only after replay succeeds.

### GET /arcade/leaderboard?period=weekly
- Read only `state='verified'` rows; calculate UTC weekly range on the server.
- Return nickname and verified score; do not expose emails, user UUIDs, or raw event logs.

## Release gates
1. Run the current replay regression tests in CI and add browser-to-validator parity tests.
2. Resolve pause/resume, lag, input timing, and finish-state behavior in a shared simulation core.
3. Review existing Supabase project configuration before executing SQL.
4. Implement authenticated backend functions; never expose service-role credentials to browsers.
5. Run adversarial tests: fake JWT, replayed run ID, tampered seed, forged score, duplicated events, concurrent start, clock changes, and oversized payload.
6. Enable official rankings only after security review; **no token prizes** until further approval.

## SQL review notes
- Schema is private and client grants are revoked. There are no client RLS policies.
- `run_number` supports up to five starts per UTC day. A transaction must select a free slot safely; the uniqueness constraint is the last line of defense.
- Server-side completion requires an atomic state transition.
- No changes to existing production tables or application routing are required for this draft.
