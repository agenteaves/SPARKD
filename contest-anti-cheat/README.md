# SPARKD Contest Anti-Cheat

This folder documents the server-side protections used to prevent duplicate participant entries, multiple podium positions by the same participant, and regenerated public-voter identities from being counted as separate voters.

## Rule enforced: one participant, one active entry

Beginning with the weekly contest that starts **2026-09-14 13:00:00 UTC**, each resolved participant may have only one non-rejected submission in a weekly contest.

The production migration is mirrored in `unique-participant-submission.sql`. It protects `meme_week_submissions` with a database trigger that resolves each new submission to the same participant-key system used by winner selection, serializes concurrent attempts with an advisory transaction lock, and rejects a second active entry for the same resolved participant.

Participant resolution is:

1. A moderator-created alias in `meme_week_participant_aliases`.
2. The submission's `creator_id`.
3. A `creator_profiles` match for the submission wallet.
4. The wallet address as a fallback.

This closes the submission loophole where one creator could enter again through a different wallet while still carrying the same creator identity. Rejected entries do not permanently consume the participant's slot; a new entry may be accepted after the prior entry is rejected.

The guard intentionally begins with the 2026-09-14 contest so existing entries in the contest already underway when the rule was deployed are not retroactively invalidated.

## Rule enforced: one participant, one podium slot

Winner selection also resolves every eligible submission to a participant key and keeps only that participant's best-ranked eligible submission before first, second, and third place are assigned.

The production migration is mirrored in `unique-participant-podium.sql`. It adds the participant-alias registry, the participant-key resolver, and updates `run_meme_week_lifecycle()` so it:

- totals votes for every eligible submission;
- resolves every submission to a participant key;
- keeps only the best submission for each participant;
- ranks those unique participants for first, second, and third place;
- preserves the existing tie-breaker: vote count, then earlier submission time, then submission ID.

The podium rule remains defense-in-depth even though new contests now allow only one active entry per resolved participant.

## Public-voting anti-cheat fix

A separate public-voting issue allowed the browser to supply a new 64-character `public_voter_id` and appear to be a new voter repeatedly.

Production now runs `contest-voting` version 9 with a durable fingerprint guard. For each public vote, the server hashes the client IP and user-agent separately, combines those hashes into a server-computed `public_fingerprint_hash`, and stores it with the vote.

The database migration mirrored in `public-vote-fingerprint-lock.sql` adds:

- `meme_week_votes.public_fingerprint_hash`;
- a validation constraint requiring a 64-character lowercase SHA-256 hash when present;
- a unique partial index on `(contest_id, public_fingerprint_hash)` for public votes;
- an index on `(contest_id, ip_hash)` for moderation and investigation queries.

The edge function performs a pre-check so legitimate repeat attempts receive a clean `alreadyVoted` response. The database unique index is the final authority, so simultaneous requests cannot race around the protection.

The browser-supplied `public_voter_id` remains for the normal public-voter/reward flow, but it is no longer sufficient by itself to establish a new voter identity.

## Linking suspected duplicate identities

Only link identities when there is a reasonable moderation basis to conclude they are controlled by the same participant. Do not use IP address alone as proof; shared homes, workplaces, schools, mobile carriers, VPNs, and public networks can create false positives.

Example moderator operation:

```sql
insert into public.meme_week_participant_aliases
  (participant_key, alias_type, alias_value, reason)
values
  ('participant:case-2026-001', 'wallet_address', '<wallet A>', 'Moderator-confirmed duplicate participant'),
  ('participant:case-2026-001', 'wallet_address', '<wallet B>', 'Moderator-confirmed duplicate participant'),
  ('participant:case-2026-001', 'creator_id', '<creator id>', 'Moderator-confirmed duplicate participant')
on conflict (alias_type, alias_value)
do update set participant_key = excluded.participant_key,
              reason = excluded.reason;
```

## Important limitations

No anonymous or wallet-based system can perfectly prove that two unrelated devices, creator identities, or wallets belong to the same human. A determined attacker who can create a genuinely new creator identity, use an unrelated wallet, change network/browser characteristics, and avoid known aliases may still require moderator review or stronger identity proof.

For higher-assurance contests, add an independent proof such as a signed persistent account identity, privacy-preserving challenge/CAPTCHA, prize-claim verification, or moderator review. The participant-alias registry remains the mechanism for grouping confirmed duplicate identities.
