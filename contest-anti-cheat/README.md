# SPARKD Contest Anti-Cheat

This folder documents the server-side protections used to prevent one participant from taking multiple podium positions with multiple submissions or wallets, and to prevent regenerated public-voter identities from being counted as separate voters.

## Rule enforced: one participant, one podium slot

A participant may have multiple eligible meme submissions, but only that participant's highest-ranked eligible submission can occupy the weekly podium. First, second, and third place must resolve to three distinct participant identities.

The database resolves a participant in this order:

1. A moderator-created alias in `meme_week_participant_aliases`.
2. The submission's `creator_id`.
3. A `creator_profiles` match for the submission wallet.
4. The wallet address as a fallback.

This means multiple submissions tied to the same creator account are automatically collapsed to one podium candidate. If moderators discover that several creator accounts or wallets belong to one person, aliases can map them to one `participant_key`, and future finalization will treat them as one participant.

## Example

If User A controls three submissions with 100, 90, and 80 votes, and those identities are linked to the same participant, only the 100-vote submission remains eligible for User A's podium slot. The 90- and 80-vote submissions are skipped when second and third place are selected. The next highest-ranked distinct participants move up.

## Production implementation: podium protection

The production Supabase migration is mirrored in `unique-participant-podium.sql`. It adds the participant-alias registry, the participant-key resolver, and updates `run_meme_week_lifecycle()` so it:

- totals votes for every eligible submission;
- resolves every submission to a participant key;
- keeps only the best submission for each participant;
- ranks those unique participants for first, second, and third place;
- preserves the existing tie-breaker: vote count, then earlier submission time, then submission ID.

## Public-voting anti-cheat fix

A second issue was identified in public voting: the browser supplied a 64-character `public_voter_id`, and the old server check only asked whether that exact ID had voted before. Regenerating the ID allowed the same browser/network fingerprint to appear as a new voter repeatedly.

Production now runs `contest-voting` version 9 with a durable fingerprint guard. For each public vote, the server hashes the client IP and user-agent separately, combines those hashes into a server-computed `public_fingerprint_hash`, and stores it with the vote.

The database migration mirrored in `public-vote-fingerprint-lock.sql` adds:

- `meme_week_votes.public_fingerprint_hash`;
- a validation constraint requiring a 64-character lowercase SHA-256 hash when present;
- a unique partial index on `(contest_id, public_fingerprint_hash)` for public votes;
- an index on `(contest_id, ip_hash)` for moderation and investigation queries.

The edge function performs a pre-check so legitimate repeat attempts receive a clean `alreadyVoted` response. The database unique index is the final authority, so simultaneous requests cannot race around the protection.

The browser-supplied `public_voter_id` is still retained for the normal public-voter/reward flow, but it is no longer sufficient by itself to establish a new voter identity.

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

No anonymous public-voting system can perfectly prove that two unrelated devices belong to the same human. IP addresses can be shared, user-agent strings are not unique, and determined attackers can change networks or browser characteristics. The fingerprint lock is designed to close the specific voter-ID regeneration exploit that was observed and to make repeated voting from the same environment fail at the database layer.

For higher-assurance contests, add a stronger independent proof such as a signed wallet, authenticated account, privacy-preserving challenge/CAPTCHA, prize-claim verification, or moderator review. The existing participant-alias registry remains the mechanism for grouping confirmed multi-wallet identities.
