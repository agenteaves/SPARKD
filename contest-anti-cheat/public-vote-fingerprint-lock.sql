-- SPARKD public-voting anti-cheat hardening
-- Deployed to production as migration: public_vote_fingerprint_lock
--
-- Purpose:
-- A browser-supplied public_voter_id can be regenerated. This adds a server-computed
-- fingerprint hash and a database-level uniqueness guarantee so a fresh voter ID
-- cannot bypass the one-vote-per-browser/device rule.

alter table public.meme_week_votes
  add column if not exists public_fingerprint_hash text;

alter table public.meme_week_votes
  drop constraint if exists meme_week_votes_public_fingerprint_hash_check;

alter table public.meme_week_votes
  add constraint meme_week_votes_public_fingerprint_hash_check
  check (
    public_fingerprint_hash is null
    or public_fingerprint_hash ~ '^[a-f0-9]{64}$'
  );

create unique index if not exists meme_week_one_public_vote_per_fingerprint
  on public.meme_week_votes (contest_id, public_fingerprint_hash)
  where voting_method = 'public'
    and public_fingerprint_hash is not null;

create index if not exists meme_week_votes_ip_hash_idx
  on public.meme_week_votes (contest_id, ip_hash)
  where voting_method = 'public'
    and ip_hash is not null;

-- Edge function behavior (contest-voting v9):
--   ip_hash = sha256('sparkd-vote-ip-v1:' || client_ip)
--   ua_hash = sha256('sparkd-vote-ua-v1:' || user_agent)
--   public_fingerprint_hash = sha256('sparkd-vote-fp-v1:' || ip_hash || ':' || ua_hash)
--
-- The edge function checks this fingerprint before insert for a friendly error,
-- while the unique index above provides race-safe enforcement at the database layer.
