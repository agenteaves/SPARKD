UPDATE public.meme_week_winners SET selection_method='historical'
WHERE selection_method IS DISTINCT FROM 'random_equal_chance';
ALTER TABLE public.meme_week_winners DROP CONSTRAINT IF EXISTS meme_week_winner_vote_count_positive;
ALTER TABLE public.meme_week_winners DROP COLUMN IF EXISTS vote_count;
ALTER TABLE public.meme_week_winners DROP COLUMN IF EXISTS second_vote_count;
ALTER TABLE public.meme_week_winners DROP COLUMN IF EXISTS third_vote_count;