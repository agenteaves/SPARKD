DELETE FROM public.meme_week_payout_jobs WHERE payout_type='voter_reward';
ALTER TABLE public.meme_week_payout_jobs DROP CONSTRAINT IF EXISTS meme_week_payout_jobs_payout_type_check;
ALTER TABLE public.meme_week_payout_jobs ADD CONSTRAINT meme_week_payout_jobs_payout_type_check
  CHECK (payout_type=ANY(ARRAY['first_place'::text,'second_place'::text,'third_place'::text]));