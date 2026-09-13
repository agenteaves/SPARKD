-- SPARKD Contest Anti-Cheat: unique participant podium
-- Production migrations: contest_unique_participant_podium + lock_down_participant_resolver

create table if not exists public.meme_week_participant_aliases (
  id uuid primary key default gen_random_uuid(),
  participant_key text not null,
  alias_type text not null check (alias_type in ('creator_id','wallet_address')),
  alias_value text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique(alias_type, alias_value)
);

alter table public.meme_week_participant_aliases enable row level security;

create or replace function public.resolve_meme_week_participant_key(
  p_creator_id text,
  p_wallet_address text
)
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_key text;
  v_profile_creator text;
begin
  if coalesce(p_creator_id,'') <> '' then
    select a.participant_key into v_key
    from public.meme_week_participant_aliases a
    where a.alias_type='creator_id' and a.alias_value=p_creator_id
    limit 1;
    if v_key is not null then return v_key; end if;
  end if;

  if coalesce(p_wallet_address,'') <> '' then
    select a.participant_key into v_key
    from public.meme_week_participant_aliases a
    where a.alias_type='wallet_address' and a.alias_value=p_wallet_address
    limit 1;
    if v_key is not null then return v_key; end if;

    select cp.creator_id into v_profile_creator
    from public.creator_profiles cp
    where cp.wallet_address=p_wallet_address
    order by cp.joined_date asc nulls last
    limit 1;
  end if;

  if coalesce(p_creator_id,'') <> '' then
    return 'creator:' || p_creator_id;
  elsif coalesce(v_profile_creator,'') <> '' then
    return 'creator:' || v_profile_creator;
  end if;

  return 'wallet:' || coalesce(p_wallet_address,'unknown');
end;
$$;

-- This helper is server-internal. Do not expose it as a public RPC.
revoke all on function public.resolve_meme_week_participant_key(text,text)
  from public, anon, authenticated;
grant execute on function public.resolve_meme_week_participant_key(text,text)
  to service_role;

-- Core ranking used by public.run_meme_week_lifecycle():
-- 1) score every eligible submission
-- 2) partition by resolved participant
-- 3) retain only each participant's best submission
-- 4) rank the remaining unique participants for the podium
--
-- In the lifecycle function, replace the placeholder contest ID below with
-- contest_row.id and select podium_rank 1, 2, and 3 into the winner rows.

with submission_scores as (
  select
    s.id,
    s.creator_id,
    s.wallet_address,
    s.submitted_at,
    public.resolve_meme_week_participant_key(s.creator_id,s.wallet_address) participant_key,
    count(v.id)::integer vote_count
  from public.meme_week_submissions s
  left join public.meme_week_votes v
    on v.submission_id=s.id
   and v.contest_id=s.contest_id
  where s.contest_id = null::uuid -- documentation placeholder
    and s.dna_verified=true
    and s.burn_verified=true
    and s.status<>'rejected'
  group by s.id,s.creator_id,s.wallet_address,s.submitted_at
),
best_per_participant as (
  select *,
         row_number() over(
           partition by participant_key
           order by vote_count desc, submitted_at asc, id asc
         ) participant_submission_rank
  from submission_scores
),
podium as (
  select *,
         row_number() over(
           order by vote_count desc, submitted_at asc, id asc
         ) podium_rank
  from best_per_participant
  where participant_submission_rank=1
)
select * from podium order by podium_rank;

-- NOTE: The live production function public.run_meme_week_lifecycle() is already
-- using this unique-participant ranking for first/second/third place.
