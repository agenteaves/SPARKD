import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://sparkdcoin.com", "https://www.sparkdcoin.com"]);
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request) { return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"; }
function allowedOrigin(req: Request) { const origin = req.headers.get("origin"); return !origin || ALLOWED_ORIGINS.has(origin); }
function corsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  return {
    ...(origin && ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
}
function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now(); const current = buckets.get(key);
  if (!current || now >= current.resetAt) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return { ok: true, retryAfter: 0 }; }
  current.count += 1;
  return current.count > limit ? { ok: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) } : { ok: true, retryAfter: 0 };
}
function json(req: Request, body: unknown, status = 200, extra: Record<string,string> = {}) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), ...extra } }); }

Deno.serve(async (req: Request) => {
  if (!allowedOrigin(req)) return json(req, { success: false, healthy: false, error: "Origin not allowed" }, 403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { success: false, error: "Method not allowed" }, 405);

  const limit = rateLimit(`winner-health:${clientIp(req)}`, 60, 60_000);
  if (!limit.ok) return json(req, { success: false, healthy: false, error: "Too many requests. Please try again shortly." }, 429, { "Retry-After": String(limit.retryAfter) });

  try {
    const payload = await req.json().catch(() => ({}));
    if (payload?.action !== "check_latest_completed") return json(req, { success: false, error: "Unsupported action" }, 400);
    const supabaseUrl = Deno.env.get("SUPABASE_URL"); const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json(req, { success: false, error: "Server configuration unavailable" }, 500);
    const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: contests, error: contestError } = await db.from("meme_week_contests").select("id,week_start,week_end,status,winner_submission_id").eq("status", "completed").order("week_start", { ascending: false }).limit(1);
    if (contestError) throw contestError;
    const contest = contests?.[0] ?? null;
    if (!contest) return json(req, { success: true, healthy: true, state: "no_completed_contest", checks: [] });

    const { data: voteRows, error: voteError } = await db.from("meme_week_votes").select("submission_id").eq("contest_id", contest.id);
    if (voteError) throw voteError;
    const counts = new Map<string, number>();
    for (const row of voteRows ?? []) counts.set(row.submission_id, (counts.get(row.submission_id) ?? 0) + 1);
    const highestVoteCount = Math.max(0, ...counts.values());

    if (!contest.winner_submission_id) {
      const healthy = highestVoteCount === 0;
      return json(req, { success: true, healthy, state: "completed_without_winner", contest: { id: contest.id, week_start: contest.week_start, week_end: contest.week_end }, totals: { total_votes: voteRows?.length ?? 0, highest_vote_count: highestVoteCount }, checks: [{ name: "no_winner_only_when_no_votes", pass: healthy }] });
    }

    const { data: winnerRows, error: winnerError } = await db.from("meme_week_winners").select("id,contest_id,submission_id,wallet_address,vote_count,won_at,second_submission_id,second_vote_count,third_submission_id,third_vote_count").eq("contest_id", contest.id).eq("submission_id", contest.winner_submission_id).limit(1);
    if (winnerError) throw winnerError;
    const winner = winnerRows?.[0] ?? null;

    const podiumIds = [contest.winner_submission_id, winner?.second_submission_id, winner?.third_submission_id].filter(Boolean);
    const { data: podiumRows, error: podiumError } = await db.from("meme_week_submissions").select("id,contest_id,meme_title,meme_image_url,wallet_address,burn_verified,status,submitted_at").in("id", podiumIds);
    if (podiumError) throw podiumError;
    const byId = new Map((podiumRows ?? []).map((row: any) => [row.id, row]));
    const submission: any = byId.get(contest.winner_submission_id) ?? null;
    const secondSubmission: any = winner?.second_submission_id ? byId.get(winner.second_submission_id) ?? null : null;
    const thirdSubmission: any = winner?.third_submission_id ? byId.get(winner.third_submission_id) ?? null : null;

    const actualWinnerVotes = counts.get(contest.winner_submission_id) ?? 0;
    const checks = [
      { name: "winner_record_exists", pass: Boolean(winner) },
      { name: "winner_submission_exists", pass: Boolean(submission) },
      { name: "winner_points_to_same_contest", pass: Boolean(winner && submission && winner.contest_id === contest.id && submission.contest_id === contest.id) },
      { name: "winner_burn_verified", pass: Boolean(submission?.burn_verified) },
      { name: "winner_submission_status", pass: submission?.status === "winner" },
      { name: "winner_vote_count_matches_database", pass: Boolean(winner && winner.vote_count === actualWinnerVotes) },
      { name: "winner_has_highest_vote_total", pass: actualWinnerVotes > 0 && actualWinnerVotes === highestVoteCount },
      { name: "winner_wallet_matches_submission", pass: Boolean(winner && submission && winner.wallet_address === submission.wallet_address) }
    ];

    const podium = [
      secondSubmission ? { place: 2, submission_id: secondSubmission.id, meme_title: secondSubmission.meme_title, meme_image_url: secondSubmission.meme_image_url, vote_count: Number(winner?.second_vote_count ?? counts.get(secondSubmission.id) ?? 0) } : null,
      thirdSubmission ? { place: 3, submission_id: thirdSubmission.id, meme_title: thirdSubmission.meme_title, meme_image_url: thirdSubmission.meme_image_url, vote_count: Number(winner?.third_vote_count ?? counts.get(thirdSubmission.id) ?? 0) } : null
    ].filter(Boolean);

    return json(req, {
      success: true,
      healthy: checks.every((c) => c.pass),
      state: "winner_checked",
      contest: { id: contest.id, week_start: contest.week_start, week_end: contest.week_end, winner_submission_id: contest.winner_submission_id },
      winner: winner ? { id: winner.id, submission_id: winner.submission_id, vote_count: winner.vote_count, won_at: winner.won_at } : null,
      submission: submission ? { id: submission.id, meme_title: submission.meme_title, meme_image_url: submission.meme_image_url, status: submission.status } : null,
      podium,
      totals: { total_votes: voteRows?.length ?? 0, winner_votes: actualWinnerVotes, highest_vote_count: highestVoteCount },
      checks
    });
  } catch (error) {
    console.error("contest-winner-health error:", error);
    return json(req, { success: false, healthy: false, error: error instanceof Error ? error.message : "Unknown server error" }, 500);
  }
});
