import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_KEY_HASH = "cc177a2206cdcca89baf9a6ee449896c4c22e71a80dc4f89f08e320240a9e26b";
const ALLOWED_ORIGINS = new Set(["https://sparkdcoin.com", "https://www.sparkdcoin.com"]);
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request) { return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"; }
function allowedOrigin(req: Request) { const origin = req.headers.get("origin"); return !origin || ALLOWED_ORIGINS.has(origin); }
function cors(req: Request) {
  const origin = req.headers.get("origin");
  return {
    ...(origin && ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sparkd-admin-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
}
function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now(); const current = buckets.get(key);
  if (!current || now >= current.resetAt) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return { ok: true, retryAfter: 0 }; }
  current.count += 1;
  return current.count > limit ? { ok: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) } : { ok: true, retryAfter: 0 };
}
const json = (req: Request, body: unknown, status = 200, extra: Record<string,string> = {}) => new Response(JSON.stringify(body), { status, headers: { ...cors(req), ...extra } });

Deno.serve(async (req: Request) => {
  if (!allowedOrigin(req)) return json(req, { success: false, error: "Origin not allowed" }, 403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { success: false, error: "Method not allowed" }, 405);

  const ip = clientIp(req);
  const limit = rateLimit(`admin-health:${ip}`, 12, 60_000);
  if (!limit.ok) return json(req, { success: false, error: "Too many requests. Please try again shortly." }, 429, { "Retry-After": String(limit.retryAfter) });

  const supplied = req.headers.get("x-sparkd-admin-key") || "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(supplied));
  const suppliedHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (suppliedHash !== ADMIN_KEY_HASH) return json(req, { success: false, error: "Unauthorized" }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    if (!["health", "vote_totals"].includes(body?.action)) return json(req, { success: false, error: "Unsupported action" }, 400);
    const url = Deno.env.get("SUPABASE_URL"); const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !service) return json(req, { success: false, error: "Server configuration unavailable" }, 500);
    const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    if (body.action === "vote_totals") {
      const { data: contests, error: contestError } = await db.from("meme_week_contests").select("id,week_start,week_end,status").in("status", ["submission", "voting"]).order("week_start", { ascending: false }).limit(1);
      if (contestError) throw contestError;
      const contest = contests?.[0] || null;
      if (!contest) return json(req, { success: true, contest: null, totalVotes: 0, submissions: [] });

      const { data: submissions, error: submissionError } = await db.from("meme_week_submissions").select("id,meme_title,meme_image_url,status,burn_verified,submitted_at").eq("contest_id", contest.id).neq("status", "rejected").order("submitted_at", { ascending: true });
      if (submissionError) throw submissionError;
      const { data: votes, error: voteError } = await db.from("meme_week_votes").select("submission_id").eq("contest_id", contest.id);
      if (voteError) throw voteError;

      const counts = new Map<string, number>();
      for (const vote of votes || []) counts.set(vote.submission_id, (counts.get(vote.submission_id) || 0) + 1);
      return json(req, { success: true, contest, totalVotes: (votes || []).length, submissions: (submissions || []).map((s) => ({ id: s.id, memeTitle: s.meme_title || "Untitled SPARKD Meme", memeImageUrl: s.meme_image_url, status: s.status, voteCount: counts.get(s.id) || 0 })) });
    }

    const { data, error } = await db.rpc("get_meme_week_admin_health");
    if (error) throw error;
    return json(req, { success: true, health: data });
  } catch (error) {
    console.error("contest-admin-health error:", error);
    return json(req, { success: false, error: error instanceof Error ? error.message : "Unknown server error" }, 500);
  }
});

