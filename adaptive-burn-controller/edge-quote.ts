// Deprecated compatibility marker.
//
// The canonical server-authoritative implementation now lives at:
//   supabase/functions/sparkd-burn-quote/index.ts
//
// This file intentionally contains no independent pricing or burn-amount logic.
// Keeping a second implementation previously allowed the Pump-derived and
// Jupiter-derived quote policies to drift. Import/deploy the canonical Edge
// Function source instead.

export const CANONICAL_SPARKD_BURN_QUOTE_SOURCE =
  "supabase/functions/sparkd-burn-quote/index.ts";
