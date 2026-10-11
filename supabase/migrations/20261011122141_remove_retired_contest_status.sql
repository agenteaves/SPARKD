ALTER TABLE public.meme_week_contests DROP CONSTRAINT IF EXISTS meme_week_contests_status_check;
UPDATE public.meme_week_contests SET status='submission', updated_at=now() WHERE status='voting';
ALTER TABLE public.meme_week_contests ADD CONSTRAINT meme_week_contests_status_check
  CHECK (status=ANY(ARRAY['upcoming'::text,'submission'::text,'completed'::text,'cancelled'::text]));