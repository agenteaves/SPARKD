-- Meme eligibility relies on a verified burn and moderation status, without PNG metadata.
CREATE OR REPLACE FUNCTION public.run_meme_week_lifecycle()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  contest_row public.meme_week_contests%rowtype;
  upcoming_row public.meme_week_contests%rowtype;
  latest_row public.meme_week_contests%rowtype;
  first_row record;
  second_row record;
  third_row record;
  next_week_start timestamptz;
  next_week_end timestamptz;
  next_status text;
  actions jsonb := '[]'::jsonb;
  v_ids uuid[] := '{}'::uuid[];
  v_finalists uuid[] := '{}'::uuid[];
  v_placements uuid[] := '{}'::uuid[];
  v_eligible_count integer := 0;
  v_seed uuid;
  v_commitment text;
  v_i integer;
  v_j integer;
  v_tmp uuid;
  v_random bigint;
begin
  perform pg_advisory_xact_lock(hashtext('sparkd_meme_week_lifecycle'));

  select * into upcoming_row
  from public.meme_week_contests
  where status='upcoming' and now()>=week_start and now()<week_end
  order by week_start desc limit 1 for update;
  if found then
    update public.meme_week_contests set status='submission',updated_at=now() where id=upcoming_row.id;
    actions:=actions||jsonb_build_array(jsonb_build_object('action','opened_submissions','contest_id',upcoming_row.id));
  end if;

  select * into contest_row
  from public.meme_week_contests
  where status in ('submission','voting')
  order by week_start desc limit 1 for update;

  if not found then
    select * into latest_row from public.meme_week_contests where status<>'cancelled' order by week_start desc limit 1;
    if latest_row.id is null then
      return jsonb_build_object('success',true,'actions',actions,'message','No contest history exists; manual bootstrap required.');
    end if;
    next_week_start:=latest_row.week_start+interval '7 days';
    next_week_end:=latest_row.week_end+interval '7 days';
    if now()>=next_week_end then next_status:='completed';
    elsif now()>=next_week_start then next_status:='submission'; else next_status:='upcoming'; end if;
    insert into public.meme_week_contests(week_start,week_end,status,prize_sol)
    select next_week_start,next_week_end,next_status,0
    where not exists(select 1 from public.meme_week_contests c where c.week_start=next_week_start);
    select * into contest_row from public.meme_week_contests where status='submission' order by week_start desc limit 1 for update;
    if not found then return jsonb_build_object('success',true,'actions',actions,'message','No active contest; next contest is prepared.'); end if;
  end if;

  -- Submission contests now finalize directly through the equal-chance random draw below.

  -- Preserve the already-running contest under its existing 24-hour voting rules.
  if contest_row.status='voting' and now()>=contest_row.week_end+interval '24 hours' then
    with submission_scores as (
      select s.id,s.creator_id,s.wallet_address,s.submitted_at,
             public.resolve_meme_week_participant_key(s.creator_id,s.wallet_address) participant_key,
             count(v.id)::integer vote_count
      from public.meme_week_submissions s
      left join public.meme_week_votes v on v.submission_id=s.id and v.contest_id=s.contest_id
      where s.contest_id=contest_row.id and s.burn_verified=true and s.status<>'rejected'
      group by s.id,s.creator_id,s.wallet_address,s.submitted_at
    ), best_per_participant as (
      select *,row_number() over(partition by participant_key order by vote_count desc,submitted_at asc,id asc) participant_submission_rank
      from submission_scores
    ), podium as (
      select *,row_number() over(order by vote_count desc,submitted_at asc,id asc) podium_rank
      from best_per_participant where participant_submission_rank=1
    ) select * into first_row from podium where podium_rank=1;
    with submission_scores as (
      select s.id,s.creator_id,s.wallet_address,s.submitted_at,public.resolve_meme_week_participant_key(s.creator_id,s.wallet_address) participant_key,count(v.id)::integer vote_count
      from public.meme_week_submissions s left join public.meme_week_votes v on v.submission_id=s.id and v.contest_id=s.contest_id
      where s.contest_id=contest_row.id and s.burn_verified=true and s.status<>'rejected'
      group by s.id,s.creator_id,s.wallet_address,s.submitted_at
    ), best_per_participant as (
      select *,row_number() over(partition by participant_key order by vote_count desc,submitted_at asc,id asc) participant_submission_rank from submission_scores
    ), podium as (
      select *,row_number() over(order by vote_count desc,submitted_at asc,id asc) podium_rank from best_per_participant where participant_submission_rank=1
    ) select * into second_row from podium where podium_rank=2;
    with submission_scores as (
      select s.id,s.creator_id,s.wallet_address,s.submitted_at,public.resolve_meme_week_participant_key(s.creator_id,s.wallet_address) participant_key,count(v.id)::integer vote_count
      from public.meme_week_submissions s left join public.meme_week_votes v on v.submission_id=s.id and v.contest_id=s.contest_id
      where s.contest_id=contest_row.id and s.burn_verified=true and s.status<>'rejected'
      group by s.id,s.creator_id,s.wallet_address,s.submitted_at
    ), best_per_participant as (
      select *,row_number() over(partition by participant_key order by vote_count desc,submitted_at asc,id asc) participant_submission_rank from submission_scores
    ), podium as (
      select *,row_number() over(order by vote_count desc,submitted_at asc,id asc) podium_rank from best_per_participant where participant_submission_rank=1
    ) select * into third_row from podium where podium_rank=3;

    if first_row.id is not null and first_row.vote_count>0 then
      insert into public.meme_week_winners(contest_id,submission_id,creator_id,wallet_address,vote_count,prize_sol,won_at,second_submission_id,second_wallet_address,second_vote_count,third_submission_id,third_wallet_address,third_vote_count,selection_method)
      values(contest_row.id,first_row.id,first_row.creator_id,first_row.wallet_address,first_row.vote_count,0,now(),second_row.id,second_row.wallet_address,second_row.vote_count,third_row.id,third_row.wallet_address,third_row.vote_count,'legacy_vote_rank')
      on conflict(contest_id) do nothing;
      update public.meme_week_submissions set status=case when id=first_row.id then 'winner' else status end,updated_at=now() where contest_id=contest_row.id;
      update public.meme_week_contests set winner_submission_id=first_row.id,status='completed',updated_at=now() where id=contest_row.id;
    else
      update public.meme_week_contests set status='completed',winner_submission_id=null,updated_at=now() where id=contest_row.id;
    end if;
  end if;

  -- New contests: at the submission deadline every content-approved entry receives one equal draw chance.
  if contest_row.status='submission' and now()>=contest_row.week_end then null; end if;

  -- If this is a newly created contest under the random-draw protocol, it is finalized directly at week_end.
  if contest_row.status='submission' and now()>=contest_row.week_end then
    null;
  end if;

  next_week_start:=contest_row.week_start+interval '7 days';
  next_week_end:=contest_row.week_end+interval '7 days';
  if not exists(select 1 from public.meme_week_contests c where c.week_start=next_week_start) then
    insert into public.meme_week_contests(week_start,week_end,status,prize_sol)
    values(next_week_start,next_week_end,case when now()>=next_week_start and now()<next_week_end then 'submission' else 'upcoming' end,0);
  end if;

  -- Random draw any due submission contest other than the legacy contest already transitioned to voting.
  for contest_row in
    select * from public.meme_week_contests c
    where c.status='submission' and now()>=c.week_end
    order by c.week_end asc for update
  loop
    if exists(select 1 from public.meme_week_winners w where w.contest_id=contest_row.id) then
      update public.meme_week_contests set status='completed',updated_at=now() where id=contest_row.id;
      continue;
    end if;

    select coalesce(array_agg(s.id order by s.id),'{}'::uuid[]),count(*)::integer
      into v_ids,v_eligible_count
    from public.meme_week_submissions s
    where s.contest_id=contest_row.id and s.burn_verified=true and s.status<>'rejected';

    v_seed:=gen_random_uuid();
    select encode(digest(coalesce(string_agg(x::text,',' order by x::text),''),'sha256'),'hex') into v_commitment from unnest(v_ids) x;

    if v_eligible_count>1 then
      for v_i in reverse v_eligible_count..2 loop
        v_random := ('x'||encode(gen_random_bytes(8),'hex'))::bit(64)::bigint;
        if v_random = -9223372036854775808 then v_random:=0; else v_random:=abs(v_random); end if;
        v_j := 1 + (v_random % v_i)::integer;
        v_tmp:=v_ids[v_i]; v_ids[v_i]:=v_ids[v_j]; v_ids[v_j]:=v_tmp;
      end loop;
    end if;
    v_finalists:=v_ids[1:least(3,v_eligible_count)];
    v_placements:=v_finalists;
    if coalesce(array_length(v_placements,1),0)>1 then
      for v_i in reverse array_length(v_placements,1)..2 loop
        v_random := ('x'||encode(gen_random_bytes(8),'hex'))::bit(64)::bigint;
        if v_random = -9223372036854775808 then v_random:=0; else v_random:=abs(v_random); end if;
        v_j := 1 + (v_random % v_i)::integer;
        v_tmp:=v_placements[v_i]; v_placements[v_i]:=v_placements[v_j]; v_placements[v_j]:=v_tmp;
      end loop;
    end if;

    insert into public.meme_week_draw_audits(contest_id,eligible_count,entrant_commitment,random_seed,finalist_submission_ids,placement_submission_ids)
    values(contest_row.id,v_eligible_count,v_commitment,v_seed,v_finalists,v_placements)
    on conflict(contest_id) do nothing;

    if v_eligible_count>0 then
      select * into first_row from public.meme_week_submissions where id=v_placements[1];
      if v_eligible_count>1 then select * into second_row from public.meme_week_submissions where id=v_placements[2]; else second_row:=null; end if;
      if v_eligible_count>2 then select * into third_row from public.meme_week_submissions where id=v_placements[3]; else third_row:=null; end if;
      insert into public.meme_week_winners(contest_id,submission_id,creator_id,wallet_address,vote_count,prize_sol,won_at,second_submission_id,second_wallet_address,second_vote_count,third_submission_id,third_wallet_address,third_vote_count,selection_method,eligible_entry_count,draw_seed,entrant_commitment,draw_algorithm)
      values(contest_row.id,first_row.id,first_row.creator_id,first_row.wallet_address,0,0,now(),second_row.id,second_row.wallet_address,0,third_row.id,third_row.wallet_address,0,'random_equal_chance',v_eligible_count,v_seed,v_commitment,'pgcrypto-gen_random_bytes-fisher-yates-v1')
      on conflict(contest_id) do nothing;
      update public.meme_week_submissions set status=case when id=v_placements[1] then 'winner' else status end,updated_at=now() where contest_id=contest_row.id;
      update public.meme_week_contests set winner_submission_id=v_placements[1],status='completed',updated_at=now() where id=contest_row.id;
      perform public.sync_meme_week_payout_jobs();
      actions:=actions||jsonb_build_array(jsonb_build_object('action','random_draw_completed','contest_id',contest_row.id,'eligible_count',v_eligible_count,'first',v_placements[1],'second',case when v_eligible_count>1 then v_placements[2] else null end,'third',case when v_eligible_count>2 then v_placements[3] else null end));
    else
      update public.meme_week_contests set status='completed',winner_submission_id=null,updated_at=now() where id=contest_row.id;
      actions:=actions||jsonb_build_array(jsonb_build_object('action','completed_without_winner','contest_id',contest_row.id,'reason','No eligible submissions.'));
    end if;
  end loop;

  return jsonb_build_object('success',true,'actions',actions,'checked_at',now());
end;
$function$
;
CREATE OR REPLACE FUNCTION public.can_submit_meme_week(p_contest_id uuid, p_wallet_address text, p_dna_verified boolean, p_burn_verified boolean, p_burn_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin

    /*
     * Contest must exist and be open
     * for submissions.
     */

    if not exists (
        select 1
        from public.meme_week_contests
        where id = p_contest_id
          and status = 'submission'
          and now() >= week_start
          and now() < week_end
    ) then

        return false;

    end if;


    /*
     * Wallet must be present.
     */

    if p_wallet_address is null
       or length(trim(p_wallet_address)) = 0 then

        return false;

    end if;


    /*
     * Only one submission per wallet
     * for this contest.
     */

    if exists (
        select 1
        from public.meme_week_submissions
        where contest_id = p_contest_id
          and wallet_address = p_wallet_address
    ) then

        return false;

    end if;


    /*
     * The burn must be verified.
     */

    if p_burn_verified is not true then

        return false;

    end if;


    /*
     * Entry fee must be exactly
     * 2,000 SPARKD.
     */

    if p_burn_amount <> 2000 then

        return false;

    end if;


    return true;

end;
$function$
;
CREATE OR REPLACE FUNCTION public.get_meme_week_admin_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron'
AS $function$
declare
  v_contest record;
  v_submission_count bigint := 0;
  v_vote_count bigint := 0;
  v_eligible_count bigint := 0;
  v_winner record;
  v_cron record;
  v_last_run record;
  v_next_transition timestamptz;
begin
  select * into v_contest
  from public.meme_week_contests
  where status in ('submission','voting')
  order by week_start desc
  limit 1;

  if v_contest.id is not null then
    select count(*) into v_submission_count
    from public.meme_week_submissions
    where contest_id = v_contest.id;

    select count(*) into v_eligible_count
    from public.meme_week_submissions
    where contest_id = v_contest.id
      and burn_verified = true
      and status <> 'rejected';

    select count(*) into v_vote_count
    from public.meme_week_votes
    where contest_id = v_contest.id;

    if v_contest.status = 'submission' then
      v_next_transition := v_contest.week_end;
    elsif v_contest.status = 'voting' then
      v_next_transition := v_contest.week_end + interval '24 hours';
    end if;
  end if;

  select w.id, w.contest_id, w.submission_id, w.wallet_address, w.vote_count, w.won_at,
         s.meme_title, s.meme_image_url
  into v_winner
  from public.meme_week_winners w
  join public.meme_week_submissions s on s.id = w.submission_id
  order by w.won_at desc nulls last, w.created_at desc
  limit 1;

  select jobid, jobname, schedule, active, command
  into v_cron
  from cron.job
  where jobname = 'sparkd-meme-week-lifecycle'
  limit 1;

  if v_cron.jobid is not null then
    select status, start_time, end_time, return_message
    into v_last_run
    from cron.job_run_details
    where jobid = v_cron.jobid
    order by start_time desc
    limit 1;
  end if;

  return jsonb_build_object(
    'checked_at', now(),
    'current_contest', case when v_contest.id is null then null else jsonb_build_object(
      'id', v_contest.id,
      'week_start', v_contest.week_start,
      'week_end', v_contest.week_end,
      'status', v_contest.status,
      'winner_submission_id', v_contest.winner_submission_id,
      'next_transition_at', v_next_transition
    ) end,
    'counts', jsonb_build_object(
      'submissions', v_submission_count,
      'eligible_submissions', v_eligible_count,
      'votes', v_vote_count
    ),
    'latest_winner', case when v_winner.id is null then null else jsonb_build_object(
      'id', v_winner.id,
      'contest_id', v_winner.contest_id,
      'submission_id', v_winner.submission_id,
      'meme_title', v_winner.meme_title,
      'meme_image_url', v_winner.meme_image_url,
      'vote_count', v_winner.vote_count,
      'won_at', v_winner.won_at
    ) end,
    'cron', case when v_cron.jobid is null then null else jsonb_build_object(
      'jobid', v_cron.jobid,
      'jobname', v_cron.jobname,
      'schedule', v_cron.schedule,
      'active', v_cron.active,
      'last_run', case when v_last_run.status is null then null else jsonb_build_object(
        'status', v_last_run.status,
        'start_time', v_last_run.start_time,
        'end_time', v_last_run.end_time,
        'return_message', v_last_run.return_message
      ) end
    ) end
  );
end;
$function$
;
