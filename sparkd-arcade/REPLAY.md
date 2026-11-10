# SPARKD practice replay validator (v1.2 development)

`replay-validator.js` provides a dependency-free `SparkdReplay.verify(record)` function for exported `sparkd-practice-run-v1` JSON records.

Node example:

```js
const fs = require('node:fs');
const { verify } = require('./replay-validator.js');
const record = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log(verify(record));
```

The verifier checks the record format, bounded step count and event count, action order, deterministic obstacle/orb generation, jump physics, collisions, and final score/orbs/lives. It returns `{ok, reason, expected?}`. A run ending by manually leaving the page is not considered complete. The replay assumes uninterrupted simulation steps and inputs recorded at step boundaries.

**Important:** This is a *practice consistency checker*, not production anti-cheat. Players can change the seed, choose inputs, generate plausible records, or modify both game and verifier. There is no trusted server session, player identity, daily quota, or authoritative seed. Do not treat `ok: true` as evidence of legitimate play or award prizes.

Before production use, align the client and replay engine around a shared versioned deterministic core; create automated browser-to-replay parity tests, including pausing, lag, ducking, collisions, and input-edge timing. Then have the server issue seeds and replay signed-in sessions against a database-backed one-time run ID. See `ANTI_CHEAT.md`.
