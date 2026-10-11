CREATE OR REPLACE FUNCTION public.draw_meme_week_voter_reward(p_contest_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$ SELECT jsonb_build_object('success',false,'error','Not available'); $$;

CREATE OR REPLACE FUNCTION public.run_meme_week_voter_reward_draws()
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$ SELECT jsonb_build_object('drawn',0,'skipped',0,'ranAt',clock_timestamp()); $$;

CREATE OR REPLACE FUNCTION public.get_meme_week_voter_rewards_admin()
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$ SELECT '[]'::jsonb; $$;

CREATE OR REPLACE FUNCTION public.mark_meme_week_voter_reward_paid(p_contest_id uuid,p_payout_signature text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$ BEGIN RAISE EXCEPTION 'Not available'; END; $$;

CREATE OR REPLACE FUNCTION public.prevent_meme_week_self_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$ BEGIN RAISE EXCEPTION 'Entry unavailable'; END; $$;

CREATE OR REPLACE FUNCTION public.enforce_meme_week_voting_window()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$ BEGIN RAISE EXCEPTION 'Entry unavailable'; END; $$;
