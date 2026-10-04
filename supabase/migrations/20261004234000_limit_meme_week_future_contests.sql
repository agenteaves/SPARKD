-- Prevent the lifecycle worker from extending the future contest horizon forever.
-- Keep at most one scheduled future contest; preserve any contest with related activity.
create or replace function public.limit_meme_week_future_contests()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'upcoming'
     and new.week_start > now()
     and exists (
       select 1
       from public.meme_week_contests c
       where c.status = 'upcoming'
         and c.week_start > now()
         and c.id is distinct from new.id
     ) then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists limit_meme_week_future_contests
  on public.meme_week_contests;

create trigger limit_meme_week_future_contests
before insert or update of status, week_start
on public.meme_week_contests
for each row
execute function public.limit_meme_week_future_contests();

-- Serialize the cleanup with the scheduled lifecycle runner.
do $$
declare
  keep_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('sparkd_meme_week_lifecycle'));

  select c.id
  into keep_id
  from public.meme_week_contests c
  where c.status = 'upcoming'
    and c.week_start > now()
  order by c.week_start, c.id
  limit 1;

  if keep_id is not null then
    delete from public.meme_week_contests c
    where c.status = 'upcoming'
      and c.week_start > now()
      and c.id <> keep_id
      and not exists (select 1 from public.meme_week_submissions s where s.contest_id = c.id)
      and not exists (select 1 from public.meme_week_votes v where v.contest_id = c.id)
      and not exists (select 1 from public.meme_week_burns b where b.contest_id = c.id)
      and not exists (select 1 from public.meme_week_burn_receipts r where r.contest_id = c.id)
      and not exists (select 1 from public.meme_week_draw_audits d where d.contest_id = c.id)
      and not exists (select 1 from public.meme_week_payout_jobs p where p.contest_id = c.id)
      and not exists (select 1 from public.meme_week_voter_rewards vr where vr.contest_id = c.id)
      and not exists (select 1 from public.meme_week_winners w where w.contest_id = c.id);
  end if;
end;
$$;
