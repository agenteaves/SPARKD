-- SPARKD ELITES: foundation for a future authoritative scoring service.
-- Apply only to a dedicated, confirmed SPARKD Supabase project.
-- No client role may insert, update or delete scores.
create schema if not exists sparkd_secure;
create table if not exists sparkd_secure.verified_runs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null,
  score bigint not null check (score >= 0),
  level_reached integer not null check (level_reached between 1 and 5),
  verifier_version text not null,
  replay_sha256 text not null check (replay_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (player_id, replay_sha256)
);
create index if not exists verified_runs_player_score_idx
  on sparkd_secure.verified_runs(player_id, score desc);
create index if not exists verified_runs_leaderboard_idx
  on sparkd_secure.verified_runs(score desc, created_at asc);
alter table sparkd_secure.verified_runs enable row level security;
revoke all on schema sparkd_secure from public, anon, authenticated;
revoke all on all tables in schema sparkd_secure from public, anon, authenticated;
-- Only a trusted backend with a secret server-side database credential may write.
-- Never publish a service-role credential or a write endpoint accepting raw client scores.
