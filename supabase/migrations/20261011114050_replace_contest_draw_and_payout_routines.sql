CREATE OR REPLACE FUNCTION public.get_meme_week_moderation_queue(p_limit integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'success', true, 'checked_at', clock_timestamp(),
    'submissions', coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.submitted_at DESC), '[]'::jsonb)
  ) INTO result
  FROM (
    SELECT s.id,s.contest_id,s.wallet_address,s.meme_title,s.meme_image_url,s.dna_verified,
           s.burn_verified,s.burn_amount,s.status,s.submitted_at,s.approved_at,s.rejected_at,
           s.rejection_reason,c.week_start,c.week_end,c.status AS contest_status
    FROM public.meme_week_submissions s
    JOIN public.meme_week_contests c ON c.id=s.contest_id
    WHERE c.status='submission'
    ORDER BY s.submitted_at DESC
    LIMIT greatest(1,least(coalesce(p_limit,100),250))
  ) q;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_meme_week_submission(p_submission_id uuid,p_action text,p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE s public.meme_week_submissions%rowtype; c_status text;
  action_name text:=lower(trim(coalesce(p_action,'')));
  reason_text text:=nullif(trim(coalesce(p_reason,'')),'');
BEGIN
  SELECT * INTO s FROM public.meme_week_submissions WHERE id=p_submission_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
  SELECT status INTO c_status FROM public.meme_week_contests WHERE id=s.contest_id;
  IF c_status <> 'submission' THEN RAISE EXCEPTION 'This contest can no longer be moderated'; END IF;
  IF s.status='winner' THEN RAISE EXCEPTION 'Winner submissions cannot be moderated'; END IF;
  IF s.status<>'pending' THEN RAISE EXCEPTION 'Only pending submissions can be moderated'; END IF;
  IF action_name='approve' THEN
    UPDATE public.meme_week_submissions SET status='approved',approved_at=clock_timestamp(),rejected_at=NULL,
      rejection_reason=NULL,updated_at=clock_timestamp() WHERE id=p_submission_id RETURNING * INTO s;
  ELSIF action_name='reject' THEN
    IF reason_text IS NULL OR char_length(reason_text)<3 OR char_length(reason_text)>500 THEN
      RAISE EXCEPTION 'Rejection reason must be between 3 and 500 characters';
    END IF;
    UPDATE public.meme_week_submissions SET status='rejected',approved_at=NULL,rejected_at=clock_timestamp(),
      rejection_reason=reason_text,updated_at=clock_timestamp() WHERE id=p_submission_id RETURNING * INTO s;
  ELSE
    RAISE EXCEPTION 'Unsupported moderation action';
  END IF;
  RETURN jsonb_build_object('success',true,'submission',jsonb_build_object(
    'id',s.id,'contest_id',s.contest_id,'status',s.status,'approved_at',s.approved_at,
    'rejected_at',s.rejected_at,'rejection_reason',s.rejection_reason,'updated_at',s.updated_at));
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_meme_week_payout_jobs()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE inserted_count integer:=0; n integer:=0;
BEGIN
  INSERT INTO public.meme_week_payout_jobs(contest_id,payout_type,recipient_wallet,reward_usd,status)
  SELECT c.id,'first_place',w.wallet_address,15,'pending'
  FROM public.meme_week_contests c JOIN public.meme_week_winners w ON w.contest_id=c.id
  WHERE c.status='completed' AND c.winner_submission_id IS NOT NULL AND coalesce(w.wallet_address,'')<>''
  ON CONFLICT(contest_id,payout_type) DO NOTHING;
  GET DIAGNOSTICS n=ROW_COUNT; inserted_count:=inserted_count+n;

  INSERT INTO public.meme_week_payout_jobs(contest_id,payout_type,recipient_wallet,reward_usd,status)
  SELECT c.id,'second_place',w.second_wallet_address,10,'pending'
  FROM public.meme_week_contests c JOIN public.meme_week_winners w ON w.contest_id=c.id
  WHERE c.status='completed' AND w.second_submission_id IS NOT NULL AND coalesce(w.second_wallet_address,'')<>''
  ON CONFLICT(contest_id,payout_type) DO NOTHING;
  GET DIAGNOSTICS n=ROW_COUNT; inserted_count:=inserted_count+n;

  INSERT INTO public.meme_week_payout_jobs(contest_id,payout_type,recipient_wallet,reward_usd,status)
  SELECT c.id,'third_place',w.third_wallet_address,5,'pending'
  FROM public.meme_week_contests c JOIN public.meme_week_winners w ON w.contest_id=c.id
  WHERE c.status='completed' AND w.third_submission_id IS NOT NULL AND coalesce(w.third_wallet_address,'')<>''
  ON CONFLICT(contest_id,payout_type) DO NOTHING;
  GET DIAGNOSTICS n=ROW_COUNT; inserted_count:=inserted_count+n;
  RETURN inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_next_meme_week_payout_job()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE j public.meme_week_payout_jobs%rowtype;
BEGIN
  PERFORM public.sync_meme_week_payout_jobs();
  SELECT * INTO j FROM public.meme_week_payout_jobs WHERE status='pending'
  ORDER BY created_at, CASE payout_type WHEN 'first_place' THEN 0 WHEN 'second_place' THEN 1 WHEN 'third_place' THEN 2 ELSE 9 END
  FOR UPDATE SKIP LOCKED LIMIT 1;
  IF j.id IS NULL THEN RETURN NULL; END IF;
  UPDATE public.meme_week_payout_jobs SET status='processing',attempts=attempts+1,claimed_at=now(),last_error=NULL,updated_at=now()
  WHERE id=j.id RETURNING * INTO j;
  RETURN to_jsonb(j);
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_meme_week_cdp_payout(p_job_id uuid,p_idempotency_key uuid,p_prepared_transaction text,p_amount_lamports bigint,p_amount_sol numeric,p_sol_price_usd numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE j public.meme_week_payout_jobs%rowtype; expected numeric;
BEGIN
  SELECT * INTO j FROM public.meme_week_payout_jobs WHERE id=p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'payout_job_not_found'; END IF;
  IF j.status<>'processing' THEN RAISE EXCEPTION 'payout_job_not_processing'; END IF;
  IF p_amount_lamports<=0 THEN RAISE EXCEPTION 'invalid_payout_amount'; END IF;
  expected:=CASE j.payout_type WHEN 'first_place' THEN 15 WHEN 'second_place' THEN 10 WHEN 'third_place' THEN 5 ELSE NULL END;
  IF expected IS NULL OR coalesce(j.reward_usd,expected)<>expected THEN RAISE EXCEPTION 'invalid_payout_type_or_reward'; END IF;
  IF p_sol_price_usd IS NULL OR p_sol_price_usd<=0 THEN RAISE EXCEPTION 'invalid_sol_price'; END IF;
  UPDATE public.meme_week_payout_jobs SET idempotency_key=coalesce(idempotency_key,p_idempotency_key),
    prepared_transaction=coalesce(prepared_transaction,p_prepared_transaction),amount_lamports=coalesce(amount_lamports,p_amount_lamports),
    amount_sol=coalesce(amount_sol,p_amount_sol),sol_price_usd=coalesce(sol_price_usd,p_sol_price_usd),updated_at=now()
  WHERE id=p_job_id RETURNING * INTO j;
  RETURN to_jsonb(j);
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_meme_week_payout_broadcast(p_job_id uuid,p_signature text,p_recent_blockhash text,p_last_valid_block_height bigint,p_amount_lamports bigint,p_amount_sol numeric,p_sol_price_usd numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE j public.meme_week_payout_jobs%rowtype; expected numeric;
BEGIN
  SELECT * INTO j FROM public.meme_week_payout_jobs WHERE id=p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'payout_job_not_found'; END IF;
  IF j.status<>'processing' THEN RAISE EXCEPTION 'payout_job_not_processing'; END IF;
  IF p_amount_lamports<=0 THEN RAISE EXCEPTION 'invalid_payout_amount'; END IF;
  expected:=CASE j.payout_type WHEN 'first_place' THEN 15 WHEN 'second_place' THEN 10 WHEN 'third_place' THEN 5 ELSE NULL END;
  IF expected IS NULL OR coalesce(j.reward_usd,expected)<>expected THEN RAISE EXCEPTION 'invalid_payout_type_or_reward'; END IF;
  IF p_sol_price_usd IS NULL OR p_sol_price_usd<=0 THEN RAISE EXCEPTION 'invalid_sol_price'; END IF;
  UPDATE public.meme_week_payout_jobs SET status='broadcasting',transaction_signature=p_signature,
    recent_blockhash=p_recent_blockhash,last_valid_block_height=p_last_valid_block_height,amount_lamports=p_amount_lamports,
    amount_sol=p_amount_sol,sol_price_usd=p_sol_price_usd,broadcast_prepared_at=now(),updated_at=now()
  WHERE id=p_job_id RETURNING * INTO j;
  RETURN to_jsonb(j);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_meme_week_payout(p_job_id uuid,p_signature text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE j public.meme_week_payout_jobs%rowtype;
BEGIN
  SELECT * INTO j FROM public.meme_week_payout_jobs WHERE id=p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'payout_job_not_found'; END IF;
  IF j.status='paid' THEN RETURN to_jsonb(j); END IF;
  IF j.status<>'broadcasting' THEN RAISE EXCEPTION 'payout_job_not_broadcasting'; END IF;
  IF j.transaction_signature IS DISTINCT FROM p_signature THEN RAISE EXCEPTION 'payout_signature_mismatch'; END IF;
  UPDATE public.meme_week_payout_jobs SET status='paid',paid_at=now(),updated_at=now() WHERE id=p_job_id RETURNING * INTO j;
  IF j.payout_type='first_place' THEN
    UPDATE public.meme_week_winners SET payout_transaction=p_signature,payout_verified=true,payout_verified_at=now()
    WHERE contest_id=j.contest_id AND wallet_address=j.recipient_wallet;
  END IF;
  RETURN to_jsonb(j);
END;
$$;

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
    finalists:=ids[1:least(3,eligible)]; placements:=finalists;
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
      UPDATE public.meme_week_submissions SET status=CASE WHEN id=placements[1] THEN 'winner' ELSE status END,updated_at=now() WHERE contest_id=c.id;
      INSERT INTO public.meme_week_winners(contest_id,submission_id,creator_id,wallet_address,prize_sol,won_at,
        second_submission_id,second_wallet_address,third_submission_id,third_wallet_address,selection_method,
        eligible_entry_count,draw_seed,entrant_commitment,draw_algorithm)
      SELECT c.id,a.id,a.creator_id,a.wallet_address,0,now(),b.id,b.wallet_address,d.id,d.wallet_address,
        'random_equal_chance',eligible,seed,commitment,'pgcrypto-gen_random_bytes-fisher-yates-v1'
      FROM public.meme_week_submissions a
      LEFT JOIN public.meme_week_submissions b ON b.id=placements[2]
      LEFT JOIN public.meme_week_submissions d ON d.id=placements[3]
      WHERE a.id=placements[1] ON CONFLICT(contest_id) DO NOTHING;
      UPDATE public.meme_week_contests SET winner_submission_id=placements[1],status='completed',updated_at=now() WHERE id=c.id;
      PERFORM public.sync_meme_week_payout_jobs();
      actions:=actions||jsonb_build_array(jsonb_build_object('action','random_draw_completed','contest_id',c.id,'eligible_count',eligible,'first',placements[1],'second',CASE WHEN eligible>1 THEN placements[2] END,'third',CASE WHEN eligible>2 THEN placements[3] END));
    ELSE
      UPDATE public.meme_week_contests SET status='completed',winner_submission_id=NULL,updated_at=now() WHERE id=c.id;
      actions:=actions||jsonb_build_array(jsonb_build_object('action','completed_without_winner','contest_id',c.id,'reason','No eligible submissions.'));
    END IF;
  END LOOP;
  RETURN jsonb_build_object('success',true,'actions',actions,'checked_at',now());
END;
$$;
