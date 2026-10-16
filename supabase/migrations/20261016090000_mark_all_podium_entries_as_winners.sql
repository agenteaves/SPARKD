CREATE OR REPLACE FUNCTION public.run_meme_week_lifecycle()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  opening public.meme_week_contests%rowtype;
  c public.meme_week_contests%rowtype;
  latest public.meme_week_contests%rowtype;
  ids uuid[]; finalists uuid[]; placements uuid[];
  eligible integer; i integer; j integer; tmp uuid; rnd bigint;
  seed uuid; commitment text; actions jsonb:='[]'::jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('sparkd_meme_week_lifecycle'));
  SELECT * INTO opening FROM public.meme_week_contests
  WHERE status='upcoming' AND now()>=week_start AND now()<week_end
  ORDER BY week_start DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    UPDATE public.meme_week_contests SET status='submission',updated_at=now() WHERE id=opening.id;
    actions:=actions||jsonb_build_array(jsonb_build_object('action','opened_submissions','contest_id',opening.id));
  END IF;

  SELECT * INTO c FROM public.meme_week_contests WHERE status='submission'
  ORDER BY week_start DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO latest FROM public.meme_week_contests WHERE status<>'cancelled' ORDER BY week_start DESC LIMIT 1;
    IF latest.id IS NULL THEN RETURN jsonb_build_object('success',true,'actions',actions,'message','No contest history exists; manual bootstrap required.'); END IF;
    INSERT INTO public.meme_week_contests(week_start,week_end,status,prize_sol)
    SELECT latest.week_start+interval '7 days',latest.week_end+interval '7 days',
      CASE WHEN now()>=latest.week_end+interval '7 days' THEN 'completed' WHEN now()>=latest.week_start+interval '7 days' THEN 'submission' ELSE 'upcoming' END,0
    WHERE NOT EXISTS(SELECT 1 FROM public.meme_week_contests x WHERE x.week_start=latest.week_start+interval '7 days');
    SELECT * INTO c FROM public.meme_week_contests WHERE status='submission' ORDER BY week_start DESC LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success',true,'actions',actions,'message','No active contest; next contest is prepared.'); END IF;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM public.meme_week_contests x WHERE x.week_start=c.week_start+interval '7 days') THEN
    INSERT INTO public.meme_week_contests(week_start,week_end,status,prize_sol)
    VALUES(c.week_start+interval '7 days',c.week_end+interval '7 days',
      CASE WHEN now()>=c.week_start+interval '7 days' AND now()<c.week_end+interval '7 days' THEN 'submission' ELSE 'upcoming' END,0);
  END IF;

  FOR c IN SELECT * FROM public.meme_week_contests x WHERE x.status='submission' AND now()>=x.week_end ORDER BY x.week_end FOR UPDATE LOOP
    IF EXISTS(SELECT 1 FROM public.meme_week_winners x WHERE x.contest_id=c.id) THEN
      UPDATE public.meme_week_contests SET status='completed',updated_at=now() WHERE id=c.id;
      CONTINUE;
    END IF;
    SELECT coalesce(array_agg(s.id ORDER BY s.id),'{}'::uuid[]),count(*)::integer
    INTO ids,eligible FROM public.meme_week_submissions s
    WHERE s.contest_id=c.id AND s.burn_verified=true AND s.status<>'rejected';
    seed:=gen_random_uuid();
    SELECT encode(extensions.digest(coalesce(string_agg(x::text,',' ORDER BY x::text),''),'sha256'),'hex')
    INTO commitment FROM unnest(ids) x;
    IF eligible>1 THEN
      FOR i IN REVERSE eligible..2 LOOP
        rnd:=('x'||encode(extensions.gen_random_bytes(8),'hex'))::bit(64)::bigint;
        IF rnd=-9223372036854775808 THEN rnd:=0; ELSE rnd:=abs(rnd); END IF;
        j:=1+(rnd%i)::integer; tmp:=ids[i]; ids[i]:=ids[j]; ids[j]:=tmp;
      END LOOP;
    END IF;
    finalists:=ids[1:least(5,eligible)]; placements:=finalists;
    IF coalesce(array_length(placements,1),0)>1 THEN
      FOR i IN REVERSE array_length(placements,1)..2 LOOP
        rnd:=('x'||encode(extensions.gen_random_bytes(8),'hex'))::bit(64)::bigint;
        IF rnd=-9223372036854775808 THEN rnd:=0; ELSE rnd:=abs(rnd); END IF;
        j:=1+(rnd%i)::integer; tmp:=placements[i]; placements[i]:=placements[j]; placements[j]:=tmp;
      END LOOP;
    END IF;
    INSERT INTO public.meme_week_draw_audits(contest_id,eligible_count,entrant_commitment,random_seed,finalist_submission_ids,placement_submission_ids)
    VALUES(c.id,eligible,commitment,seed,finalists,placements) ON CONFLICT(contest_id) DO NOTHING;
    IF eligible>0 THEN
      UPDATE public.meme_week_submissions SET status=CASE WHEN id=ANY(placements) THEN 'winner' ELSE status END,updated_at=now() WHERE contest_id=c.id;
      INSERT INTO public.meme_week_winners(contest_id,submission_id,creator_id,wallet_address,prize_sol,won_at,
        second_submission_id,second_wallet_address,third_submission_id,third_wallet_address,fourth_submission_id,fourth_wallet_address,fifth_submission_id,fifth_wallet_address,selection_method,
        eligible_entry_count,draw_seed,entrant_commitment,draw_algorithm)
      SELECT c.id,a.id,a.creator_id,a.wallet_address,0,now(),b.id,b.wallet_address,d.id,d.wallet_address,e.id,e.wallet_address,f.id,f.wallet_address,
        'random_equal_chance',eligible,seed,commitment,'pgcrypto-gen_random_bytes-fisher-yates-v1'
      FROM public.meme_week_submissions a
      LEFT JOIN public.meme_week_submissions b ON b.id=placements[2]
      LEFT JOIN public.meme_week_submissions d ON d.id=placements[3]
      LEFT JOIN public.meme_week_submissions e ON e.id=placements[4]
      LEFT JOIN public.meme_week_submissions f ON f.id=placements[5]
      WHERE a.id=placements[1] ON CONFLICT(contest_id) DO NOTHING;
      UPDATE public.meme_week_contests SET winner_submission_id=placements[1],status='completed',updated_at=now() WHERE id=c.id;
      PERFORM public.sync_meme_week_payout_jobs();
      actions:=actions||jsonb_build_array(jsonb_build_object('action','random_draw_completed','contest_id',c.id,'eligible_count',eligible,'first',placements[1],'second',CASE WHEN eligible>1 THEN placements[2] END,'third',CASE WHEN eligible>2 THEN placements[3] END,'fourth',CASE WHEN eligible>3 THEN placements[4] END,'fifth',CASE WHEN eligible>4 THEN placements[5] END));
    ELSE
      UPDATE public.meme_week_contests SET status='completed',winner_submission_id=NULL,updated_at=now() WHERE id=c.id;
      actions:=actions||jsonb_build_array(jsonb_build_object('action','completed_without_winner','contest_id',c.id,'reason','No eligible submissions.'));
    END IF;
  END LOOP;
  RETURN jsonb_build_object('success',true,'actions',actions,'checked_at',now());
END;
$$;

UPDATE public.meme_week_submissions s
SET status='winner', updated_at=clock_timestamp()
FROM public.meme_week_winners w
WHERE s.status <> 'winner'
  AND (s.id = w.submission_id OR s.id = w.second_submission_id OR s.id = w.third_submission_id
       OR s.id = w.fourth_submission_id OR s.id = w.fifth_submission_id);
