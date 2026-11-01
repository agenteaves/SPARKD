-- Queue every finalized first-place Meme of the Week entry for owner review.
-- This does NOT mint, publish, approve a delegate, or list an NFT.
CREATE TABLE IF NOT EXISTS public.nft_meme_winner_candidates (
  contest_id uuid PRIMARY KEY REFERENCES public.meme_week_contests(id),
  submission_id uuid NOT NULL REFERENCES public.meme_week_submissions(id),
  review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected')),
  queued_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  review_notes text,
  CHECK ((review_status='pending' AND reviewed_at IS NULL)
      OR (review_status<>'pending' AND reviewed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS nft_meme_winner_candidates_review_idx
  ON public.nft_meme_winner_candidates(review_status, queued_at);
ALTER TABLE public.nft_meme_winner_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.nft_meme_winner_candidates FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.nft_meme_winner_candidates TO service_role;

CREATE OR REPLACE FUNCTION public.queue_first_place_meme_for_nft_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.winner_submission_id IS NOT NULL THEN
    -- Only queue the official recorded first-place entry.
    IF EXISTS (
      SELECT 1 FROM public.meme_week_winners w
      WHERE w.contest_id = NEW.id AND w.submission_id = NEW.winner_submission_id
    ) THEN
      INSERT INTO public.nft_meme_winner_candidates(contest_id, submission_id)
      VALUES (NEW.id, NEW.winner_submission_id)
      ON CONFLICT (contest_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_first_place_meme_for_nft_review() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_queue_first_place_meme_for_nft_review ON public.meme_week_contests;
CREATE TRIGGER trg_queue_first_place_meme_for_nft_review
AFTER INSERT OR UPDATE OF status, winner_submission_id
ON public.meme_week_contests FOR EACH ROW
EXECUTE FUNCTION public.queue_first_place_meme_for_nft_review();

-- Capture already finalized first-place winners without changing any reviews.
INSERT INTO public.nft_meme_winner_candidates(contest_id, submission_id)
SELECT c.id, c.winner_submission_id
FROM public.meme_week_contests c
JOIN public.meme_week_winners w
  ON w.contest_id = c.id AND w.submission_id = c.winner_submission_id
WHERE c.status = 'completed' AND c.winner_submission_id IS NOT NULL
ON CONFLICT (contest_id) DO NOTHING;

COMMENT ON TABLE public.nft_meme_winner_candidates IS
'Private owner review queue for first-place weekly memes. Approval is editorial only; minting and listing require separate owner-authorized actions.';
