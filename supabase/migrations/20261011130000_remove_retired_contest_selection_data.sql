-- Remove the legacy contest selection tables and fields after their API paths are inert.
DO $$ DECLARE j record; BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname='sparkd-meme-week-voter-reward'
  LOOP PERFORM cron.unschedule(j.jobid); END LOOP;
END $$;

DELETE FROM public.meme_week_payout_jobs WHERE payout_type='voter_reward';
ALTER TABLE public.meme_week_contests DROP CONSTRAINT IF EXISTS meme_week_contests_status_check;
UPDATE public.meme_week_contests SET status='submission',updated_at=now() WHERE status='voting';
ALTER TABLE public.meme_week_contests ADD CONSTRAINT meme_week_contests_status_check
  CHECK(status=ANY(ARRAY['upcoming'::text,'submission'::text,'completed'::text,'cancelled'::text]));
UPDATE public.meme_week_winners SET selection_method='historical'
WHERE selection_method IS DISTINCT FROM 'random_equal_chance';
ALTER TABLE public.meme_week_winners DROP CONSTRAINT IF EXISTS meme_week_winner_vote_count_positive;
ALTER TABLE public.meme_week_winners DROP COLUMN IF EXISTS vote_count;
ALTER TABLE public.meme_week_winners DROP COLUMN IF EXISTS second_vote_count;
ALTER TABLE public.meme_week_winners DROP COLUMN IF EXISTS third_vote_count;
ALTER TABLE public.meme_week_payout_jobs DROP CONSTRAINT IF EXISTS meme_week_payout_jobs_payout_type_check;
ALTER TABLE public.meme_week_payout_jobs ADD CONSTRAINT meme_week_payout_jobs_payout_type_check
  CHECK(payout_type=ANY(ARRAY['first_place'::text,'second_place'::text,'third_place'::text]));

DROP TRIGGER IF EXISTS trg_enforce_meme_week_voting_window ON public.meme_week_votes;
DROP TRIGGER IF EXISTS trg_prevent_meme_week_self_vote ON public.meme_week_votes;
DROP FUNCTION IF EXISTS public.draw_meme_week_voter_reward(uuid);
DROP FUNCTION IF EXISTS public.run_meme_week_voter_reward_draws();
DROP FUNCTION IF EXISTS public.get_meme_week_voter_rewards_admin();
DROP FUNCTION IF EXISTS public.mark_meme_week_voter_reward_paid(uuid,text);
DROP FUNCTION IF EXISTS public.prevent_meme_week_self_vote();
DROP FUNCTION IF EXISTS public.enforce_meme_week_voting_window();
DROP TABLE public.meme_week_voter_rewards CASCADE;
DROP TABLE public.meme_week_votes CASCADE;
