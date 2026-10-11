DO $$ DECLARE j record; BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname='sparkd-meme-week-voter-reward'
  LOOP PERFORM cron.unschedule(j.jobid); END LOOP;
END $$;

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