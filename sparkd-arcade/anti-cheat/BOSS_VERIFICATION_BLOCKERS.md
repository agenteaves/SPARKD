# Boss arena verification blockers (source audit, 2026-11-15)

Source: `sparkd-arcade/graphics/arena-3d.html`.

The current 3D boss arena cannot be replayed authoritatively from the parent
`game.js` practice-run event log:

1. `pickups()` uses `Math.random()` to choose weapon pedestal coordinates.
2. `spawnEnergyOrb()` uses `Math.random()` for orb positions.
3. The arena animation loop advances with `performance.now()` and variable
   `dt = Math.min(.05, (now-prev)/1000)`, not the parent runner's fixed 1/60 step.
4. Parent `recordInput()` only logs runner inputs as `{step, action}`;
   boss controls are forwarded via `postMessage` without an authoritative
   boss input replay record.
5. Arena reports outcomes to parent via `postMessage`; messages are not
   independent proof of score, lives, or victory.

## Required before official verification

- Version an independent boss rules engine with fixed tick rate and seeded PRNG.
- Capture a bounded, ordered record of boss movement, fire and pause inputs
  against server-issued sessions; include level and phase boundaries.
- Server-replay projectile collisions, damage, orb pickups, weapon pickups,
  phase transitions, lives and victory.
- Build golden vectors from game and server engines and reject all mismatches.
- Do not accept boss outcome messages, browser score, or client-side seed as
  proof. No official leaderboard writes until the above is deployed and tested.

This audit makes **no changes** to the live arena or EXIT system.
