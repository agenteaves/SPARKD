-- One-time owner wallet challenges. Server uses service role only.
CREATE TABLE IF NOT EXISTS public.nft_winner_review_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 nonce uuid NOT NULL DEFAULT gen_random_uuid(),
 wallet text NOT NULL,
 intent text NOT NULL,
 expires_at timestamptz NOT NULL DEFAULT now() + interval '5 minutes',
 used_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nft_winner_review_challenges_expiry_idx ON public.nft_winner_review_challenges(expires_at);
ALTER TABLE public.nft_winner_review_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.nft_winner_review_challenges FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nft_winner_review_challenges TO service_role;
