import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nacl from "npm:tweetnacl@1.0.3";
import bs58 from "npm:bs58@6.0.0";

const ADMIN_KEY_HASH = "cc177a2206cdcca89baf9a6ee449896c4c22e71a80dc4f89f08e320240a9e26b";
const ALLOWED_ORIGINS = new Set(["https://sparkdcoin.com", "https://www.sparkdcoin.com"]);
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function response(req: Request, body: unknown, status = 200) {
  const origin = req.headers.get("origin") || "";
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sparkd-admin-key",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Content-Type": "application/json"
    }
  });
}

function limited(key: string, maximum: number, windowMs: number) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > maximum;
}

function getDb() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Server configuration unavailable.");
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function validAdminKey(req: Request) {
  const supplied = req.headers.get("x-sparkd-admin-key") || "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(supplied));
  const actual = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
  return actual === ADMIN_KEY_HASH;
}

function validOrigin(req: Request) {
  return ALLOWED_ORIGINS.has(req.headers.get("origin") || "");
}

function decodeSignature(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function saveContact(req: Request, body: Record<string, unknown>) {
  const submissionId = String(body.submissionId || "");
  const wallet = String(body.wallet || "");
  const xHandle = String(body.xHandle || "").trim().replace(/^@/, "");
  const timestamp = Number(body.timestamp);
  const signature = String(body.signature || "");

  if (!/^[0-9a-f-]{36}$/i.test(submissionId) ||
      !/^[A-Za-z0-9_]{1,15}$/.test(xHandle) ||
      !Number.isFinite(timestamp) ||
      Math.abs(Date.now() - timestamp) > 5 * 60 * 1000 ||
      !wallet || !signature) {
    return response(req, { success: false, error: "Invalid winner contact details." }, 400);
  }

  const message = [
    "SPARKD-CONTEST-CONTACT-v1",
    submissionId,
    wallet,
    xHandle,
    String(timestamp)
  ].join("\n");

  try {
    const ok = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      decodeSignature(signature),
      bs58.decode(wallet)
    );
    if (!ok) return response(req, { success: false, error: "Wallet confirmation did not verify." }, 401);
  } catch {
    return response(req, { success: false, error: "Wallet confirmation did not verify." }, 401);
  }

  const db = getDb();
  const { data: submission, error: submissionError } = await db
    .from("meme_week_submissions")
    .select("id,wallet_address,burn_verified,status")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError) throw submissionError;
  if (!submission ||
      submission.wallet_address !== wallet ||
      submission.burn_verified !== true ||
      submission.status === "rejected") {
    return response(req, { success: false, error: "That wallet has no verified eligible submission." }, 403);
  }

  const { error: saveError } = await db
    .from("meme_week_submission_contacts")
    .upsert(
      { submission_id: submissionId, x_handle: xHandle, updated_at: new Date().toISOString() },
      { onConflict: "submission_id" }
    );
  if (saveError) throw saveError;

  return response(req, { success: true });
}

async function loadWinnerContacts(req: Request) {
  const db = getDb();
  const { data: winners, error: winnerError } = await db
    .from("meme_week_winners")
    .select("contest_id,submission_id,wallet_address,second_submission_id,second_wallet_address,third_submission_id,third_wallet_address,won_at")
    .order("won_at", { ascending: false })
    .limit(100);
  if (winnerError) throw winnerError;
  if (!winners?.length) return response(req, { success: true, winners: [] });

  const submissionIds = [...new Set(winners.flatMap(w => [
    w.submission_id, w.second_submission_id, w.third_submission_id
  ]).filter(Boolean))];
  const contestIds = [...new Set(winners.map(w => w.contest_id).filter(Boolean))];

  const [submissionResult, contactResult, contestResult] = await Promise.all([
    db.from("meme_week_submissions")
      .select("id,meme_title,meme_image_url,wallet_address")
      .in("id", submissionIds),
    db.from("meme_week_submission_contacts")
      .select("submission_id,x_handle")
      .in("submission_id", submissionIds),
    db.from("meme_week_contests")
      .select("id,week_start,week_end")
      .in("id", contestIds)
  ]);
  if (submissionResult.error) throw submissionResult.error;
  if (contactResult.error) throw contactResult.error;
  if (contestResult.error) throw contestResult.error;

  const submissions = new Map((submissionResult.data || []).map(row => [row.id, row]));
  const contacts = new Map((contactResult.data || []).map(row => [row.submission_id, row.x_handle]));
  const contests = new Map((contestResult.data || []).map(row => [row.id, row]));
  const result: Record<string, unknown>[] = [];

  for (const winner of winners) {
    const contest = contests.get(winner.contest_id);
    const places = [
      ["1st place", winner.submission_id, winner.wallet_address],
      ["2nd place", winner.second_submission_id, winner.second_wallet_address],
      ["3rd place", winner.third_submission_id, winner.third_wallet_address]
    ] as const;
    for (const [place, submissionId, fallbackWallet] of places) {
      if (!submissionId) continue;
      const submission = submissions.get(submissionId);
      result.push({
        contest_id: winner.contest_id,
        week_start: contest?.week_start || null,
        week_end: contest?.week_end || null,
        place,
        meme_title: submission?.meme_title || "Untitled SPARKD Meme",
        meme_image_url: submission?.meme_image_url || null,
        wallet_address: submission?.wallet_address || fallbackWallet || null,
        x_handle: contacts.get(submissionId) || null
      });
    }
  }
  return response(req, { success: true, winners: result });
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return response(req, {});
  if (req.method !== "POST") return response(req, { success: false, error: "Method not allowed." }, 405);
  if (!validOrigin(req)) return response(req, { success: false, error: "Origin not allowed." }, 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip, 30, 60_000)) return response(req, { success: false, error: "Too many requests." }, 429);

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.action === "save_contact") return await saveContact(req, body);

    if (body?.action === "winner_contacts") {
      if (!await validAdminKey(req)) return response(req, { success: false, error: "Unauthorized." }, 401);
      return await loadWinnerContacts(req);
    }

    return response(req, { success: false, error: "Unsupported action." }, 400);
  } catch (error) {
    console.error("SPARKD winner contact error:", error);
    return response(req, { success: false, error: "Unable to complete the winner contact request." }, 500);
  }
});