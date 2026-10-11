CREATE OR REPLACE FUNCTION public.claim_next_meme_week_payout_job()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE j public.meme_week_payout_jobs%rowtype;
BEGIN
  PERFORM public.sync_meme_week_payout_jobs();
  SELECT * INTO j FROM public.meme_week_payout_jobs WHERE status='pending' AND payout_type IN ('first_place','second_place','third_place')
  ORDER BY created_at, CASE payout_type WHEN 'first_place' THEN 0 WHEN 'second_place' THEN 1 WHEN 'third_place' THEN 2 ELSE 9 END
  FOR UPDATE SKIP LOCKED LIMIT 1;
  IF j.id IS NULL THEN RETURN NULL; END IF;
  UPDATE public.meme_week_payout_jobs SET status='processing',attempts=attempts+1,claimed_at=now(),last_error=NULL,updated_at=now()
  WHERE id=j.id RETURNING * INTO j;
  RETURN to_jsonb(j);
END;
$$;
