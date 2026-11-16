create or replace function public.sparkd_practice_submission_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.player_id::text, 8742026));
  if exists (select 1 from public.sparkd_practice_scores
             where player_id=new.player_id and created_at > now() - interval '5 minutes') then
    raise exception 'practice submission rate limited' using errcode='P0001';
  end if;
  return new;
end $$;
revoke all on function public.sparkd_practice_submission_guard() from public,anon,authenticated;
drop trigger if exists sparkd_practice_rate_guard on public.sparkd_practice_scores;
create trigger sparkd_practice_rate_guard before insert on public.sparkd_practice_scores
for each row execute function public.sparkd_practice_submission_guard();