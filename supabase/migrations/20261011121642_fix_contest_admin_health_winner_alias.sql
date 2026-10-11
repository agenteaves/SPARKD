CREATE OR REPLACE FUNCTION public.get_meme_week_admin_health()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','cron'
AS $$
DECLARE c record; winner_row record; cj record; cr record; eligible_count bigint:=0; submission_count bigint:=0;
BEGIN
  SELECT * INTO c FROM public.meme_week_contests WHERE status='submission' ORDER BY week_start DESC LIMIT 1;
  IF c.id IS NOT NULL THEN
    SELECT count(*) INTO submission_count FROM public.meme_week_submissions WHERE contest_id=c.id;
    SELECT count(*) INTO eligible_count FROM public.meme_week_submissions WHERE contest_id=c.id AND burn_verified AND status<>'rejected';
  END IF;
  SELECT mw.id,mw.contest_id,mw.submission_id,mw.wallet_address,mw.won_at,s.meme_title,s.meme_image_url
  INTO winner_row FROM public.meme_week_winners mw JOIN public.meme_week_submissions s ON s.id=mw.submission_id
  ORDER BY mw.won_at DESC NULLS LAST,mw.created_at DESC LIMIT 1;
  SELECT jobid,jobname,schedule,active INTO cj FROM cron.job WHERE jobname='sparkd-meme-week-lifecycle' LIMIT 1;
  IF cj.jobid IS NOT NULL THEN
    SELECT status,start_time,end_time,return_message INTO cr FROM cron.job_run_details
    WHERE jobid=cj.jobid ORDER BY start_time DESC LIMIT 1;
  END IF;
  RETURN jsonb_build_object('checked_at',now(),
    'current_contest',CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('id',c.id,'week_start',c.week_start,'week_end',c.week_end,'status',c.status,'winner_submission_id',c.winner_submission_id,'next_transition_at',c.week_end) END,
    'counts',jsonb_build_object('submissions',submission_count,'eligible_submissions',eligible_count),
    'latest_winner',CASE WHEN winner_row.id IS NULL THEN NULL ELSE jsonb_build_object('id',winner_row.id,'contest_id',winner_row.contest_id,'submission_id',winner_row.submission_id,'meme_title',winner_row.meme_title,'meme_image_url',winner_row.meme_image_url,'won_at',winner_row.won_at) END,
    'cron',CASE WHEN cj.jobid IS NULL THEN NULL ELSE jsonb_build_object('jobid',cj.jobid,'jobname',cj.jobname,'schedule',cj.schedule,'active',cj.active,'last_run',CASE WHEN cr.status IS NULL THEN NULL ELSE jsonb_build_object('status',cr.status,'start_time',cr.start_time,'end_time',cr.end_time,'return_message',cr.return_message) END) END);
END;
$$;
