import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const TREASURY_ADDRESS = "8D3DXWWrxbiHZWTNLJ2msx4MyZWVVCdbPm3oCCJqMB21";
const SOLANA_RPC = Deno.env.get("SOLANA_RPC_URL") || "https://api.mainnet-beta.solana.com";
const CDP_HOST = "api.cdp.coinbase.com";
const CDP_PATH = "/platform/v2/solana/accounts/send/transaction";
const CDP_NETWORK = "solana";
const FEE_RESERVE = 5_000_000;
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const PLACEHOLDER_BLOCKHASH = "SysvarRecentB1ockHashes11111111111111111111";
const te = new TextEncoder();

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});

function cat(...parts: Uint8Array[]) {
  const size = parts.reduce((n, x) => n + x.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
function b64u(x: Uint8Array) {
  let s = "";
  for (const b of x) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64d(s: string) {
  const raw = atob(s.replace(/\s+/g, ""));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
function hex(x: Uint8Array) { return [...x].map(b => b.toString(16).padStart(2, "0")).join(""); }
function sv(n: number) {
  const out: number[] = [];
  do { let b = n & 127; n >>>= 7; if (n) b |= 128; out.push(b); } while (n);
  return Uint8Array.from(out);
}
function u32(n: number) { return Uint8Array.of(n & 255, n >>> 8 & 255, n >>> 16 & 255, n >>> 24 & 255); }
function u64(n: number) {
  let x = BigInt(n);
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) { out[i] = Number(x & 255n); x >>= 8n; }
  return out;
}
function b58(s: string) {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("invalid_base58");
    n = n * 58n + BigInt(i);
  }
  const bytes: number[] = [];
  while (n) { bytes.push(Number(n & 255n)); n >>= 8n; }
  bytes.reverse();
  let zeros = 0;
  while (zeros < s.length && s[zeros] === "1") zeros++;
  return Uint8Array.from([...Array(zeros).fill(0), ...bytes]);
}
function tx(to: string, lamports: number, recentBlockhash: string) {
  const from = b58(TREASURY_ADDRESS);
  const recipient = b58(to);
  const system = b58("11111111111111111111111111111111");
  const blockhash = b58(recentBlockhash);
  if ([from, recipient, system, blockhash].some(x => x.length !== 32)) throw new Error("invalid_solana_key_or_blockhash");
  const data = cat(u32(2), u64(lamports));
  const message = cat(
    Uint8Array.of(1, 0, 1),
    sv(3), from, recipient, system,
    blockhash,
    sv(1),
    Uint8Array.of(2),
    sv(2), Uint8Array.of(0, 1),
    sv(data.length), data,
  );
  const raw = cat(sv(1), new Uint8Array(64), message);
  let s = "";
  for (const b of raw) s += String.fromCharCode(b);
  return btoa(s);
}
function sort(v: any): any {
  if (Array.isArray(v)) return v.map(sort);
  if (!v || typeof v !== "object") return v;
  const o: any = {};
  for (const k of Object.keys(v).sort()) o[k] = sort(v[k]);
  return o;
}
async function apiJwt(id: string, sec: string) {
  const decoded = b64d(sec);
  const seed = decoded.length >= 32 ? decoded.slice(0, 32) : decoded;
  if (seed.length !== 32) throw new Error("invalid_cdp_api_key_secret");
  const pk = cat(Uint8Array.from([48,46,2,1,0,48,5,6,3,43,101,112,4,34,4,32]), seed);
  const key = await crypto.subtle.importKey("pkcs8", pk, { name: "Ed25519" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "EdDSA", kid: id, nonce: crypto.randomUUID().replace(/-/g, "") };
  const payload = { iss: "cdp", sub: id, nbf: now, exp: now + 120, uri: `POST ${CDP_HOST}${CDP_PATH}` };
  const input = `${b64u(te.encode(JSON.stringify(header)))}.${b64u(te.encode(JSON.stringify(payload)))}`;
  const sig = new Uint8Array(await crypto.subtle.sign("Ed25519", key, te.encode(input)));
  return `${input}.${b64u(sig)}`;
}
async function walletJwt(sec: string, body: any) {
  const der = b64d(sec);
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const hash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", te.encode(JSON.stringify(sort(body))))));
  const header = { alg: "ES256", typ: "JWT" };
  const payload = { iat: now, nbf: now, jti: crypto.randomUUID().replace(/-/g, ""), uris: [`POST ${CDP_HOST}${CDP_PATH}`], reqHash: hash };
  const input = `${b64u(te.encode(JSON.stringify(header)))}.${b64u(te.encode(JSON.stringify(payload)))}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, te.encode(input)));
  return `${input}.${b64u(sig)}`;
}
async function send(id: string, sec: string, ws: string, transaction: string, idem: string) {
  const body = { network: CDP_NETWORK, transaction };
  const [apiAuth, walletAuth] = await Promise.all([apiJwt(id, sec), walletJwt(ws, body)]);
  const r = await fetch(`https://${CDP_HOST}${CDP_PATH}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiAuth}`,
      "x-wallet-auth": walletAuth,
      "x-idempotency-key": idem,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`cdp_send_${r.status}:${b?.errorType || "unknown"}:${b?.errorMessage || ""}`);
  const sig = b?.signature || b?.transactionSignature;
  if (!sig) throw new Error("cdp_missing_transaction_signature");
  return sig;
}
async function rpc(method: string, params: unknown[]) {
  const r = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const b = await r.json();
  if (!r.ok || b?.error) throw new Error(`solana_rpc:${b?.error?.message || r.status}`);
  return b.result;
}
async function latestBlockhash() {
  const result = await rpc("getLatestBlockhash", [{ commitment: "confirmed" }]);
  const blockhash = result?.value?.blockhash;
  const lastValidBlockHeight = Number(result?.value?.lastValidBlockHeight || 0);
  if (!blockhash || !lastValidBlockHeight) throw new Error("invalid_latest_blockhash");
  return { blockhash, lastValidBlockHeight };
}
async function blockHeight() { return Number(await rpc("getBlockHeight", [{ commitment: "confirmed" }]) || 0); }
async function bal() { return Number((await rpc("getBalance", [TREASURY_ADDRESS, { commitment: "confirmed" }]))?.value || 0); }
async function state(signature: string) {
  const x = (await rpc("getSignatureStatuses", [[signature], { searchTransactionHistory: true }]))?.value?.[0];
  if (!x) return "pending";
  if (x.err) return "failed";
  return x.confirmationStatus === "confirmed" || x.confirmationStatus === "finalized" ? "confirmed" : "pending";
}
async function price() {
  const r = await fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot");
  const b = await r.json();
  const p = Number(b?.data?.amount);
  if (!r.ok || !Number.isFinite(p) || p <= 0) throw new Error("invalid_sol_usd_price");
  return p;
}
function expectedUsd(type: string) {
  return type === "first_place" ? 15 : type === "second_place" ? 10 : type === "third_place" ? 5 : 0;
}
function hasPlaceholderBlockhash(prepared: string | null) {
  if (!prepared) return false;
  try {
    const raw = b64d(prepared);
    const marker = b58(PLACEHOLDER_BLOCKHASH);
    outer: for (let i = 0; i <= raw.length - marker.length; i++) {
      for (let j = 0; j < marker.length; j++) if (raw[i + j] !== marker[j]) continue outer;
      return true;
    }
  } catch (_) {}
  return false;
}

Deno.serve(async req => {
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const sr = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const id = Deno.env.get("CDP_API_KEY_ID");
  const sec = Deno.env.get("CDP_API_KEY_SECRET");
  const ws = Deno.env.get("CDP_WALLET_SECRET");
  if (!url || !sr || !id || !sec || !ws) return json({ success: false, error: "Server configuration unavailable" }, 500);

  const db = createClient(url, sr, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: ok } = await db.rpc("verify_meme_week_payout_cron", { p_token: req.headers.get("x-sparkd-cron-key") || "" });
  if (ok !== true) return json({ success: false, error: "Unauthorized" }, 401);

  let job: any = null;
  let sent = false;
  try {
    await db.rpc("sync_meme_week_payout_jobs");
    await db.rpc("requeue_stale_meme_week_payout_jobs");

    const { data: old } = await db.from("meme_week_payout_jobs")
      .select("id,transaction_signature")
      .eq("status", "broadcasting")
      .not("transaction_signature", "is", null)
      .order("broadcast_prepared_at")
      .limit(1)
      .maybeSingle();

    if (old?.transaction_signature) {
      const st = await state(old.transaction_signature);
      if (st === "confirmed") {
        const { error } = await db.rpc("complete_meme_week_payout", { p_job_id: old.id, p_signature: old.transaction_signature });
        if (error) throw error;
        return json({ success: true, action: "confirmed_existing", jobId: old.id, signature: old.transaction_signature });
      }
      if (st === "failed") {
        await db.rpc("reset_failed_meme_week_cdp_payout", { p_job_id: old.id, p_error: "confirmed_failed" });
        return json({ success: true, action: "reset_failed_existing", jobId: old.id });
      }
      return json({ success: true, action: "awaiting_confirmation", jobId: old.id, signature: old.transaction_signature });
    }

    const { data: j, error: claimError } = await db.rpc("claim_next_meme_week_payout_job");
    if (claimError) throw claimError;
    if (!j) return json({ success: true, action: "idle", treasuryAddress: TREASURY_ADDRESS, balanceLamports: await bal() });
    job = j;

    b58(j.recipient_wallet);
    const allowedTypes = ["first_place", "second_place", "third_place"];
    if (!allowedTypes.includes(j.payout_type)) throw new Error("invalid_payout_type");
    const expected = expectedUsd(j.payout_type);
    if (!expected || Number(j.reward_usd) !== expected) throw new Error("usd_reward_guard_failed");

    let lamports = Number(j.amount_lamports || 0);
    let amountSol = Number(j.amount_sol || 0);
    let solPrice = j.sol_price_usd == null ? null : Number(j.sol_price_usd);
    let prepared = j.prepared_transaction as string | null;
    let idem = j.idempotency_key as string | null;
    let recentBlockhash = j.recent_blockhash as string | null;
    let lastValidBlockHeight = Number(j.last_valid_block_height || 0);

    if (!lamports) {
      solPrice = await price();
      lamports = Math.max(1, Math.round(expected / solPrice * 1e9));
      amountSol = lamports / 1e9;
    }

    let mustRefresh = !prepared || !idem || hasPlaceholderBlockhash(prepared);
    if (!mustRefresh && lastValidBlockHeight > 0) {
      const currentHeight = await blockHeight();
      if (currentHeight > lastValidBlockHeight) mustRefresh = true;
    }

    if (mustRefresh) {
      const latest = await latestBlockhash();
      recentBlockhash = latest.blockhash;
      lastValidBlockHeight = latest.lastValidBlockHeight;
      prepared = tx(j.recipient_wallet, lamports, recentBlockhash);
      idem = crypto.randomUUID();

      if (!j.prepared_transaction || !j.idempotency_key || !j.amount_lamports) {
        const { data: p, error } = await db.rpc("prepare_meme_week_cdp_payout", {
          p_job_id: j.id,
          p_idempotency_key: idem,
          p_prepared_transaction: prepared,
          p_amount_lamports: lamports,
          p_amount_sol: amountSol,
          p_sol_price_usd: solPrice,
        });
        if (error) throw error;
        lamports = Number(p.amount_lamports);
        amountSol = Number(p.amount_sol);
        solPrice = Number(p.sol_price_usd);
        prepared = p.prepared_transaction;
        idem = p.idempotency_key;
      }

      const { error: refreshError } = await db.from("meme_week_payout_jobs").update({
        prepared_transaction: prepared,
        idempotency_key: idem,
        recent_blockhash: recentBlockhash,
        last_valid_block_height: lastValidBlockHeight,
        amount_lamports: lamports,
        amount_sol: amountSol,
        sol_price_usd: solPrice,
        updated_at: new Date().toISOString(),
      }).eq("id", j.id).eq("status", "processing");
      if (refreshError) throw refreshError;
    }

    if (Number(j.reward_usd) !== expected) throw new Error("payout_amount_guard_failed");
    if (await bal() < lamports + FEE_RESERVE) throw new Error("treasury_balance_too_low");

    const sig = await send(id, sec, ws, prepared!, idem!);
    const { error: recordError } = await db.rpc("record_meme_week_cdp_broadcast", { p_job_id: j.id, p_signature: sig });
    if (recordError) throw recordError;
    sent = true;

    for (let i = 0; i < 10; i++) {
      const st = await state(sig);
      if (st === "confirmed") {
        const { error } = await db.rpc("complete_meme_week_payout", { p_job_id: j.id, p_signature: sig });
        if (error) throw error;
        return json({ success: true, action: "paid", jobId: j.id, payoutType: j.payout_type, amountSol, solPriceUsd: solPrice, signature: sig });
      }
      if (st === "failed") {
        await db.rpc("reset_failed_meme_week_cdp_payout", { p_job_id: j.id, p_error: "confirmed_failed" });
        return json({ success: false, action: "confirmed_failed_requeued", jobId: j.id, signature: sig }, 502);
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    return json({ success: true, action: "broadcast_pending_confirmation", jobId: j.id, signature: sig });
  } catch (e) {
    console.error(e);
    if (job?.id && !sent) await db.rpc("release_meme_week_payout_job", { p_job_id: job.id, p_error: e instanceof Error ? e.message : "worker_error" });
    return json({ success: false, action: sent ? "broadcast_recorded_error" : "retryable_error", jobId: job?.id || null, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
