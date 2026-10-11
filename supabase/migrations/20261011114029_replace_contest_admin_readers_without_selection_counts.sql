CREATE OR REPLACE FUNCTION public.get_meme_week_admin_analytics()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE current_contest public.meme_week_contests%rowtype; previous_contest public.meme_week_contests%rowtype;
BEGIN
  SELECT * INTO current_contest FROM public.meme_week_contests WHERE status='submission' ORDER BY week_start DESC LIMIT 1;
  SELECT * INTO previous_contest FROM public.meme_week_contests WHERE status='completed' ORDER BY week_start DESC LIMIT 1;
  RETURN jsonb_build_object(
    'current',CASE WHEN current_contest.id IS NULL THEN NULL ELSE jsonb_build_object(
      'contestId',current_contest.id,'status',current_contest.status,'weekStart',current_contest.week_start,'weekEnd',current_contest.week_end,
      'submissions',(SELECT count(*) FROM public.meme_week_submissions s WHERE s.contest_id=current_contest.id),
      'verifiedSubmissions',(SELECT count(*) FROM public.meme_week_submissions s WHERE s.contest_id=current_contest.id AND s.dna_verified AND s.burn_verified AND s.status<>'rejected'),
      'pending',(SELECT count(*) FROM public.meme_week_submissions s WHERE s.contest_id=current_contest.id AND s.status='pending'),
      'approved',(SELECT count(*) FROM public.meme_week_submissions s WHERE s.contest_id=current_contest.id AND s.status='approved'),
      'rejected',(SELECT count(*) FROM public.meme_week_submissions s WHERE s.contest_id=current_contest.id AND s.status='rejected'),
      'participantWallets',(SELECT count(DISTINCT s.wallet_address) FROM public.meme_week_submissions s WHERE s.contest_id=current_contest.id),
      'verifiedSparkdBurned',coalesce((SELECT sum(s.burn_amount) FROM public.meme_week_submissions s WHERE s.contest_id=current_contest.id AND s.burn_verified),0)
    ) END,
    'previous',CASE WHEN previous_contest.id IS NULL THEN NULL ELSE jsonb_build_object(
      'contestId',previous_contest.id,'weekStart',previous_contest.week_start,'weekEnd',previous_contest.week_end,
      'submissions',(SELECT count(*) FROM public.meme_week_submissions s WHERE s.contest_id=previous_contest.id),
      'participantWallets',(SELECT count(DISTINCT s.wallet_address) FROM public.meme_week_submissions s WHERE s.contest_id=previous_contest.id),
      'verifiedSparkdBurned',coalesce((SELECT sum(s.burn_amount) FROM public.meme_week_submissions s WHERE s.contest_id=previous_contest.id AND s.burn_verified),0)
    ) END,
    'lifetime',jsonb_build_object('contests',(SELECT count(*) FROM public.meme_week_contests),
      'completedContests',(SELECT count(*) FROM public.meme_week_contests WHERE status='completed'),
      'submissions',(SELECT count(*) FROM public.meme_week_submissions),
      'verifiedSubmissions',(SELECT count(*) FROM public.meme_week_submissions WHERE dna_verified AND burn_verified),
      'uniqueSubmittingWallets',(SELECT count(DISTINCT wallet_address) FROM public.meme_week_submissions),
      'verifiedSparkdBurned',coalesce((SELECT sum(burn_amount) FROM public.meme_week_submissions WHERE burn_verified),0),
      'winners',(SELECT count(*) FROM public.meme_week_winners)),
    'generatedAt',clock_timestamp());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_meme_week_admin_health()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','cron'
AS $$
DECLARE c record; w record; cj record; cr record; eligible_count bigint:=0; submission_count bigint:=0;
BEGIN
  SELECT * INTO c FROM public.meme_week_contests WHERE status='submission' ORDER BY week_start DESC LIMIT 1;
  IF c.id IS NOT NULL THEN
    SELECT count(*) INTO submission_count FROM public.meme_week_submissions WHERE contest_id=c.id;
    SELECT count(*) INTO eligible_count FROM public.meme_week_submissions WHERE contest_id=c.id AND burn_verified AND status<>'rejected';
  END IF;
  SELECT w.id,w.contest_id,w.submission_id,w.wallet_address,w.won_at,s.meme_title,s.meme_image_url
  INTO w FROM public.meme_week_winners w JOIN public.meme_week_submissions s ON s.id=w.submission_id
  ORDER BY w.won_at DESC NULLS LAST,w.created_at DESC LIMIT 1;
  SELECT jobid,jobname,schedule,active INTO cj FROM cron.job WHERE jobname='sparkd-meme-week-lifecycle' LIMIT 1;
  IF cj.jobid IS NOT NULL THEN
    SELECT status,start_time,end_time,return_message INTO cr FROM cron.job_run_details
    WHERE jobid=cj.jobid ORDER BY start_time DESC LIMIT 1;
  END IF;
  RETURN jsonb_build_object('checked_at',now(),
    'current_contest',CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('id',c.id,'week_start',c.week_start,'week_end',c.week_end,'status',c.status,'winner_submission_id',c.winner_submission_id,'next_transition_at',c.week_end) END,
    'counts',jsonb_build_object('submissions',submission_count,'eligible_submissions',eligible_count),
    'latest_winner',CASE WHEN w.id IS NULL THEN NULL ELSE jsonb_build_object('id',w.id,'contest_id',w.contest_id,'submission_id',w.submission_id,'meme_title',w.meme_title,'meme_image_url',w.meme_image_url,'won_at',w.won_at) END,
    'cron',CASE WHEN cj.jobid IS NULL THEN NULL ELSE jsonb_build_object('jobid',cj.jobid,'jobname',cj.jobname,'schedule',cj.schedule,'active',cj.active,'last_run',CASE WHEN cr.status IS NULL THEN NULL ELSE jsonb_build_object('status',cr.status,'start_time',cr.start_time,'end_time',cr.end_time,'return_message',cr.return_message) END) END);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_meme_week_system_monitor()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','cron'
AS $$
DECLARE n timestamptz:=clock_timestamp(); c record; u record; w record; cj record; cr record;
  issues jsonb:='[]'::jsonb; severity text:='healthy';
BEGIN
  SELECT id,week_start,week_end,status,winner_submission_id INTO c
  FROM public.meme_week_contests WHERE status='submission' ORDER BY week_start DESC LIMIT 1;
  SELECT id,week_start,week_end,status INTO u FROM public.meme_week_contests
  WHERE status='upcoming' AND week_start>n ORDER BY week_start LIMIT 1;
  SELECT id,week_start,week_end,status INTO w FROM public.meme_week_contests
  WHERE status='completed' ORDER BY week_start DESC LIMIT 1;
  SELECT jobid,jobname,schedule,active INTO cj FROM cron.job WHERE jobname='sparkd-meme-week-lifecycle' LIMIT 1;
  IF cj.jobid IS NOT NULL THEN
    SELECT status,start_time,end_time,return_message INTO cr FROM cron.job_run_details
    WHERE jobid=cj.jobid ORDER BY start_time DESC LIMIT 1;
  END IF;
  IF cj.jobid IS NULL OR cj.active IS DISTINCT FROM true THEN
    severity:='critical'; issues:=issues||jsonb_build_array(jsonb_build_object('level','critical','code','lifecycle_schedule_unavailable','message','Contest lifecycle schedule is unavailable.'));
  ELSIF cr.start_time IS NULL OR n-cr.start_time>interval '15 minutes' OR cr.status IS DISTINCT FROM 'succeeded' THEN
    severity:='warning'; issues:=issues||jsonb_build_array(jsonb_build_object('level','warning','code','lifecycle_schedule_stale','message','Contest lifecycle has not completed successfully within the expected interval.'));
  END IF;
  IF c.id IS NULL AND u.id IS NULL THEN
    severity:='critical'; issues:=issues||jsonb_build_array(jsonb_build_object('level','critical','code','contest_schedule_missing','message','No current or upcoming contest is scheduled.'));
  END IF;
  RETURN jsonb_build_object('checked_at',n,'healthy',severity='healthy','severity',severity,'issues',issues,
    'current_contest',CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('id',c.id,'week_start',c.week_start,'week_end',c.week_end,'status',c.status,'winner_submission_id',c.winner_submission_id) END,
    'upcoming_contest',CASE WHEN u.id IS NULL THEN NULL ELSE jsonb_build_object('id',u.id,'week_start',u.week_start,'week_end',u.week_end,'status',u.status) END,
    'latest_completed',CASE WHEN w.id IS NULL THEN NULL ELSE jsonb_build_object('id',w.id,'week_start',w.week_start,'week_end',w.week_end,'status',w.status) END,
    'cron',CASE WHEN cj.jobid IS NULL THEN NULL ELSE jsonb_build_object('jobid',cj.jobid,'schedule',cj.schedule,'active',cj.active,'last_run_at',cr.start_time,'last_status',cr.status) END);
END;
$$;
