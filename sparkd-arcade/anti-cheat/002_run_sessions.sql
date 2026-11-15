-- Applied to the existing SPARKD Supabase project on 2026-11-15.
-- Private server-side state only; no browser access.
create table if not exists sparkd_secure.run_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null,
  seed bigint not null check (seed between 1 and 4294967295),
  rules_version text not null check (length(rules_version) between 1 and 80),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  consumed_at timestamptz,
  constraint run_session_expiry_check check (expires_at > issued_at and expires_at <= issued_at + interval '30 minutes'),
  constraint run_session_consumed_check check (consumed_at is null or consumed_at >= issued_at)
);
create index if not exists run_sessions_player_idx
  on sparkd_secure.run_sessions(player_id, issued_at desc);
create index if not exists run_sessions_expiry_idx
  on sparkd_secure.run_sessions(expires_at) where consumed_at is null;
alter table sparkd_secure.run_sessions enable row level security;
revoke all on sparkd_secure.run_sessions from public, anon, authenticated;
-- Session issuance and consumption MUST be implemented by trusted backend only.
-- No score verification endpoint is enabled by this migration.
