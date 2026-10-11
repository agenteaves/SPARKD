import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://sparkdcoin.com", "https://www.sparkdcoin.com"]);
const buckets = new Map<string, { count: number; resetAt: number }>();
function cors(req: Request) {
  const origin = req.headers.get("origin");
  return {
    ...(origin && ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
}
function reply(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors(req) });
}
function limited(key: string) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count++;
  return current.count > 60;
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return reply(req, { success: false, healthy: false, error: "Origin not allowed" }, 403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return reply(req, { success: false, error: "Method not allowed" }, 405);
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return reply(req, { success: false, healthy: false, error: "Too many requests" }, 429);

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.action !== "check_latest_completed") return reply(req, { success: false, error: "Unsupported action" }, 400);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return reply(req, { success: false, error: "Server configuration unavailable" }, 500);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: contests, error: contestError } = await db.from("meme_week_contests")
      .select("id,week_start,week_end,status,winner_submission_id")
      .eq("status", "completed").order("week_start", { ascending: false }).limit(1);
    if (contestError) throw contestError;
    const contest = contests?.[0] ?? null;
    if (!contest) return reply(req, { success: true, healthy: true, state: "no_completed_contest", checks: [] });
    if (!contest.winner_submission_id) {
      return reply(req, { success: true, healthy: true, state: "completed_without_winner", contest: { id: contest.id, week_start: contest.week_start, week_end: contest.week_end }, checks: [] });
    }

    const { data: rows, error: winnerError } = await db.from("meme_week_winners")
      .select("id,contest_id,submission_id,wallet_address,won_at,second_submission_id,second_wallet_address,third_submission_id,third_wallet_address,selection_method,eligible_entry_count,draw_seed,entrant_commitment")
      .eq("contest_id", contest.id).eq("submission_id", contest.winner_submission_id).limit(1);
    if (winnerError) throw winnerError;
    const winner = rows?.[0] ?? null;
    const { data: audit, error: auditError } = await db.from("meme_week_draw_audits")
      .select("eligible_count,entrant_commitment,random_seed,placement_submission_ids,algorithm")
      .eq("contest_id", contest.id).maybeSingle();
    if (auditError) throw auditError;

    const podiumIds = [winner?.submission_id, winner?.second_submission_id, winner?.third_submission_id].filter(Boolean);
    const { data: submissions, error: submissionError } = await db.from("meme_week_submissions")
      .select("id,contest_id,meme_title,meme_image_url,wallet_address,burn_verified,status")
      .in("id", podiumIds);
    if (submissionError) throw submissionError;
    const byId = new Map((submissions ?? []).map((item: any) => [item.id, item]));
    const first: any = byId.get(contest.winner_submission_id) ?? null;
    const second: any = winner?.second_submission_id ? byId.get(winner.second_submission_id) ?? null : null;
    const third: any = winner?.third_submission_id ? byId.get(winner.third_submission_id) ?? null : null;
    const checks = [
      { name: "winner_record_exists", pass: Boolean(winner) },
      { name: "winner_submission_exists", pass: Boolean(first) },
      { name: "winner_points_to_same_contest", pass: Boolean(winner && first && winner.contest_id === contest.id && first.contest_id === contest.id) },
      { name: "winner_burn_verified", pass: Boolean(first?.burn_verified) },
      { name: "winner_submission_status", pass: first?.status === "winner" },
      { name: "random_draw_audit_exists", pass: Boolean(audit) },
      { name: "random_draw_placements_match", pass: Boolean(audit && JSON.stringify(audit.placement_submission_ids ?? []) === JSON.stringify(podiumIds)) },
      { name: "random_draw_seed_matches", pass: Boolean(audit && winner?.draw_seed === audit.random_seed && winner?.entrant_commitment === audit.entrant_commitment) },
      { name: "eligible_count_matches", pass: Boolean(audit && winner?.eligible_entry_count === audit.eligible_count && audit.eligible_count > 0) },
      { name: "podium_entries_are_eligible", pass: Boolean(audit && podiumIds.length === Math.min(3, audit.eligible_count) && submissions?.length === podiumIds.length && submissions.every((item: any) => item.contest_id === contest.id && item.burn_verified && item.status !== "rejected") && new Set(podiumIds).size === podiumIds.length) },
      { name: "winner_wallet_matches_submission", pass: Boolean(winner && first && winner.wallet_address === first.wallet_address) }
    ];
    return reply(req, {
      success: true,
      healthy: checks.every((check) => check.pass),
      state: "winner_checked",
      contest: { id: contest.id, week_start: contest.week_start, week_end: contest.week_end, winner_submission_id: contest.winner_submission_id },
      winner: winner ? { id: winner.id, submission_id: winner.submission_id, won_at: winner.won_at, selection_method: winner.selection_method } : null,
      submission: first ? { id: first.id, meme_title: first.meme_title, meme_image_url: first.meme_image_url, status: first.status } : null,
      podium: [
        second ? { place: 2, submission_id: second.id, meme_title: second.meme_title, meme_image_url: second.meme_image_url } : null,
        third ? { place: 3, submission_id: third.id, meme_title: third.meme_title, meme_image_url: third.meme_image_url } : null
      ].filter(Boolean),
      checks
    });
  } catch (error) {
    console.error("winner-health error:", error);
    return reply(req, { success: false, healthy: false, error: error instanceof Error ? error.message : "Unknown server error" }, 500);
  }
});