-- Stage 1: public read-only practice scoreboard, separate from verified runs.
-- UNVERIFIED / NOT PRIZE ELIGIBLE.
create table if not exists public.sparkd_practice_scores (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null,
 display_name text not null check (char_length(display_name) between 2 and 24 and display_name ~ '^[A-Za-z0-9 _-]+$'),
 score bigint not null check (score between 0 and 10000000),
 level_reached integer not null check (level_reached between 1 and 5),
 created_at timestamptz not null default now(),
 source text not null default 'unverified-practice' check (source='unverified-practice')
);
create index if not exists sparkd_practice_rank_idx on public.sparkd_practice_scores(score desc,created_at asc);
alter table public.sparkd_practice_scores enable row level security;
revoke all on public.sparkd_practice_scores from public,anon,authenticated;
grant select on public.sparkd_practice_scores to anon,authenticated;
drop policy if exists sparkd_practice_public_read on public.sparkd_practice_scores;
create policy sparkd_practice_public_read on public.sparkd_practice_scores
 for select to anon,authenticated using (true);
comment on table public.sparkd_practice_scores is
 'Unverified practice only. Never use for official or prize rankings. Inserts reserved for future moderated server endpoint.';
