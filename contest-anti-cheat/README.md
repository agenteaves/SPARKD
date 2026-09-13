# SPARKD Contest Anti-Cheat

This folder documents the server-side protections used to prevent one participant from taking multiple podium positions with multiple submissions or wallets.

## Rule enforced

A participant may have multiple eligible meme submissions, but only that participant's highest-ranked eligible submission can occupy the weekly podium. First, second, and third place must resolve to three distinct participant identities.

The database resolves a participant in this order:

1. A moderator-created alias in `meme_week_participant_aliases`.
2. The submission's `creator_id`.
3. A `creator_profiles` match for the submission wallet.
4. The wallet address as a fallback.

This means multiple submissions tied to the same creator account are automatically collapsed to one podium candidate. If moderators discover that several creator accounts or wallets belong to one person, aliases can map them to one `participant_key`, and future finalization will treat them as one participant.

## Example

If User A controls three submissions with 100, 90, and 80 votes, and those identities are linked to the same participant, only the 100-vote submission remains eligible for User A's podium slot. The 90- and 80-vote submissions are skipped when second and third place are selected. The next highest-ranked distinct participants move up.

## Production implementation

The production Supabase migration is mirrored in `unique-participant-podium.sql`. It adds the participant-alias registry, the participant-key resolver, and updates `run_meme_week_lifecycle()` so it:

- totals votes for every eligible submission;
- resolves every submission to a participant key;
- keeps only the best submission for each participant;
- ranks those unique participants for first, second, and third place;
- preserves the existing tie-breaker: vote count, then earlier submission time, then submission ID.

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

## Important limitation

No wallet-only system can automatically prove that two unrelated wallets on different devices belong to the same human. Catching that case with high confidence requires either a persistent account identity, prize-claim verification, or moderator review. The alias registry exists so confirmed multi-wallet identities can be grouped without changing or deleting their submissions or votes.
