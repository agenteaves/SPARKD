# Meme of the Week → NFT review queue

The migration `20261101000000_queue_first_place_meme_nft_candidates.sql` creates a private, idempotent review queue. A database trigger inserts the official first-place winner when the contest is finalized, and the migration backfills earlier finalized winners. Duplicate lifecycle runs do not create duplicate entries. Second through fifth place are not queued.

## Owner review

Open `/NFT/winner-review.html` and connect the configured owner Phantom wallet. Sign the short-lived action-specific challenge to view pending and previously reviewed candidates. Approve or reject from the dashboard. The service uses one-time database-backed challenges and never exposes its service role key. Review approval is editorial only and does not mint or list an NFT.

### SQL fallback (service-role access only)

In the Supabase SQL editor, review pending candidates alongside their original submission data:

```sql
SELECT q.contest_id, q.submission_id, q.queued_at, s.*
FROM public.nft_meme_winner_candidates q
JOIN public.meme_week_submissions s ON s.id = q.submission_id
WHERE q.review_status = 'pending'
ORDER BY q.queued_at;
```

To approve a candidate after checking artwork, creator permissions and suitability:

```sql
UPDATE public.nft_meme_winner_candidates
SET review_status = 'approved', reviewed_at = now(), review_notes = 'Owner approved'
WHERE contest_id = '<contest-uuid>' AND review_status = 'pending';
```

To reject, set `review_status = 'rejected'` instead. Do not expose the service-role key in the browser. The table intentionally grants no public access.

**Not yet implemented:** permanent media import into the NFT Vault, NFT minting, and listing integration. The existing vault catalog and checkout require a real Metaplex Core asset address. Approval of a candidate must never be treated as an on-chain NFT approval. Those require separate secure integrations and owner signatures.
