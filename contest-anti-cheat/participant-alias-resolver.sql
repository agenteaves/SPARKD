-- SPARKD participant identity resolution
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

