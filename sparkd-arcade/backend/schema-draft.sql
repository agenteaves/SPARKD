-- SPARKD arcade BACKEND DRAFT. NOT APPLIED to any database.
-- Isolated schema: no changes to existing public website tables.
create schema if not exists sparkd_arcade;
revoke all on schema sparkd_arcade from public, anon, authenticated;
grant usage on schema sparkd_arcade to service_role;

create table if not exists sparkd_arcade.runs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  utc_day date not null default (now() at time zone 'utc')::date,
  run_number smallint not null check (run_number between 1 and 5),
  seed bigint not null check (seed between 1 and 4294967295),
  rules_version text not null default 'runner-v1',
  state text not null default 'active' check (state in ('active','verified','rejected','expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  finalized_at timestamptz,
  verified_score integer check (verified_score between 0 and 10000000),
  verified_orbs integer check (verified_orbs between 0 and 100000),
  verified_steps integer check (verified_steps between 0 and 54000),
  constraint run_slot_unique unique(player_id,utc_day,run_number),
  constraint verified_result_consistency check (
    (state='verified' and verified_score is not null and finalized_at is not null)
    or (state<>'verified' and verified_score is null)
  )
);
create index if not exists runs_player_day_idx on sparkd_arcade.runs(player_id,utc_day);
create index if not exists runs_verified_rank_idx on sparkd_arcade.runs(verified_score desc)
  where state='verified';

-- Deny direct access to client roles, even if the schema becomes exposed.
alter table sparkd_arcade.runs enable row level security;
revoke all on sparkd_arcade.runs from public, anon, authenticated;
grant select, insert, update on sparkd_arcade.runs to service_role;
-- No client RLS policies. Only trusted backend using service role may access.
-- The backend MUST validate JWT user identity, not trust player_id from request.
-- Daily quota must allocate a slot in a transaction, using unique(player_id,utc_day,run_number).
-- Finalize via atomic update WHERE id=? AND state='active' AND expires_at>now().
-- Only verified results may appear in the future public leaderboard API.
