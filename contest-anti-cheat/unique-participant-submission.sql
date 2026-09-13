-- SPARKD Contest Anti-Cheat: one active submission per resolved participant
-- Production migration: enforce_unique_participant_submission_next_contests
-- Effective for contests beginning 2026-09-14 13:00:00+00 and later.
--
-- Purpose:
-- The old submission path enforced one submission per wallet, but one creator could
-- submit again through a different wallet. This trigger resolves creator/wallet
-- aliases to a participant key and blocks a second non-rejected entry in the same
-- weekly contest. An advisory transaction lock makes concurrent duplicate attempts
-- race-safe.

create or replace function public.enforce_meme_week_unique_participant_submission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_week_start timestamptz;
  v_participant_key text;
  v_conflict_id uuid;
begin
  select c.week_start into v_week_start
  from public.meme_week_contests c
  where c.id = new.contest_id;

  if v_week_start is null or v_week_start < timestamptz '2026-09-14 13:00:00+00' then
    return new;
  end if;

  if new.status = 'rejected' then
    return new;
  end if;

  v_participant_key := public.resolve_meme_week_participant_key(
    new.creator_id,
    new.wallet_address
  );

  perform pg_advisory_xact_lock(
    hashtextextended(
      new.contest_id::text || ':' || coalesce(v_participant_key, ''),
      0
    )
  );

  select s.id into v_conflict_id
  from public.meme_week_submissions s
  where s.contest_id = new.contest_id
    and s.id <> new.id
    and s.status <> 'rejected'
    and public.resolve_meme_week_participant_key(
          s.creator_id,
          s.wallet_address
        ) = v_participant_key
  limit 1;

  if v_conflict_id is not null then
    raise exception 'Participant already has an active submission in this contest.'
      using errcode = '23505',
            detail = 'Only one non-rejected submission per resolved participant is allowed per weekly contest.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_meme_week_unique_participant_submission()
  from public, anon, authenticated;

drop trigger if exists meme_week_unique_participant_submission_guard
  on public.meme_week_submissions;

create trigger meme_week_unique_participant_submission_guard
before insert or update of contest_id, creator_id, wallet_address, status
on public.meme_week_submissions
for each row
execute function public.enforce_meme_week_unique_participant_submission();
