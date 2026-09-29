import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import nacl from "npm:tweetnacl@1.0.3";
import bs58 from "npm:bs58@6.0.0";

const ALLOWED_ORIGINS = new Set(["https://sparkdcoin.com", "https://www.sparkdcoin.com"]);
const PUBLIC_VOTING_START = Date.parse("2026-09-07T13:00:00Z");
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request) {
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
function allowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || ALLOWED_ORIGINS.has(origin);
}
function corsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  return {
    ...(origin && ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400"
  };
}
function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now(), current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count > limit) return { ok: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  return { ok: true, retryAfter: 0 };
}
function json(req: Request, data: unknown, status = 200, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json", ...extra } });
}
function validWallet(v: unknown): v is string { return typeof v === "string" && v.length >= 32 && v.length <= 50; }
function validUuid(v: unknown): v is string { return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v); }
function validVoterId(v: unknown): v is string { return typeof v === "string" && /^[a-f0-9]{64}$/i.test(v); }
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");
}

serve(async (req) => {
  if (!allowedOrigin(req)) return json(req, { success:false, error:"Origin not allowed." }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status:204, headers:corsHeaders(req) });
  if (req.method !== "POST") return json(req, { success:false, error:"Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Voting service is not configured.");

    const rest = async (path:string, init:RequestInit={}) => await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...init,
      headers:{ apikey:serviceRoleKey, Authorization:`Bearer ${serviceRoleKey}`, Accept:"application/json", "Content-Type":"application/json", ...(init.headers||{}) }
    });

    let body:any;
    try { body = await req.json(); } catch { return json(req,{success:false,error:"Request body must be valid JSON."},400); }
    const action = body?.action, ip = clientIp(req);
    const common = rateLimit(`vote:${ip}`,90,60_000);
    if (!common.ok) return json(req,{success:false,error:"Too many requests. Please try again shortly."},429,{"Retry-After":String(common.retryAfter)});

    if (action === "get_voting_state") {
      const stateLimit = rateLimit(`vote-state:${ip}`,60,60_000);
      if (!stateLimit.ok) return json(req,{success:false,error:"Too many requests. Please try again shortly."},429,{"Retry-After":String(stateLimit.retryAfter)});
      const wallet = validWallet(body?.wallet) ? body.wallet : null;
      const voterId = validVoterId(body?.voterId) ? body.voterId.toLowerCase() : null;
      const contestRes = await rest("meme_week_contests?status=in.(submission,voting)&select=id,week_start,week_end,status&order=week_start.desc&limit=1");
      if (!contestRes.ok) throw new Error("Unable to retrieve contest.");
      const contests = await contestRes.json(), contest = contests?.[0] || null;
      if (!contest) return json(req,{success:true,contest:null,votingOpen:false,publicVoting:false,submissions:[],userVote:null});
      const publicVoting = Date.parse(contest.week_start) >= PUBLIC_VOTING_START;

      const submissionsRes = await rest(`meme_week_submissions?contest_id=eq.${encodeURIComponent(contest.id)}&burn_verified=eq.true&status=neq.rejected&select=id,meme_title,meme_image_url`);
      if (!submissionsRes.ok) throw new Error("Unable to retrieve eligible submissions.");
      const submissions = await submissionsRes.json();
      const votesRes = await rest(`meme_week_votes?contest_id=eq.${encodeURIComponent(contest.id)}&select=submission_id`);
      if (!votesRes.ok) throw new Error("Unable to retrieve vote totals.");
      const votes = await votesRes.json(), counts = new Map<string,number>();
      for (const vote of votes || []) if (vote?.submission_id) counts.set(vote.submission_id,(counts.get(vote.submission_id)||0)+1);

      let userVote = null;
      if (publicVoting && voterId) {
        const res = await rest(`meme_week_votes?contest_id=eq.${encodeURIComponent(contest.id)}&public_voter_id=eq.${encodeURIComponent(voterId)}&select=submission_id,reward_wallet_address&limit=1`);
        if (res.ok) { const rows=await res.json(); if(rows?.[0]) userVote={submissionId:rows[0].submission_id,rewardWallet:rows[0].reward_wallet_address||null}; }
      } else if (!publicVoting && wallet) {
        const res = await rest(`meme_week_votes?contest_id=eq.${encodeURIComponent(contest.id)}&wallet_address=eq.${encodeURIComponent(wallet)}&select=submission_id&limit=1`);
        if (res.ok) { const rows=await res.json(); if(rows?.[0]) userVote={submissionId:rows[0].submission_id}; }
      }
      const shaped=(submissions||[]).map((s:any)=>({id:s.id,memeTitle:s.meme_title||"Untitled SPARKD Meme",memeImageUrl:s.meme_image_url,voteCount:counts.get(s.id)||0})).sort((a:any,b:any)=>b.voteCount-a.voteCount);
      return json(req,{success:true,contest,votingOpen:contest.status==="voting",publicVoting,submissions:shaped,userVote});
    }

    if (action === "cast_public_vote") {
      const castLimit=rateLimit(`public-vote-cast:${ip}`,5,60_000);
      if(!castLimit.ok) return json(req,{success:false,error:"Too many vote attempts. Please try again shortly."},429,{"Retry-After":String(castLimit.retryAfter)});
      const contestId=body?.contestId, submissionId=body?.submissionId, voterId=typeof body?.voterId==="string"?body.voterId.toLowerCase():"";
      if(!validUuid(contestId)||!validUuid(submissionId)||!validVoterId(voterId)) return json(req,{success:false,error:"Invalid public voting request."},400);

      const contestRes=await rest(`meme_week_contests?id=eq.${encodeURIComponent(contestId)}&status=eq.voting&select=id,week_start&limit=1`);
      if(!contestRes.ok) throw new Error("Unable to verify voting contest.");
      const contests=await contestRes.json(), contest=contests?.[0];
      if(!contest) return json(req,{success:false,error:"Voting is not open for this contest."},409);
      if(Date.parse(contest.week_start)<PUBLIC_VOTING_START) return json(req,{success:false,error:"This contest uses verified-wallet voting."},409);

      const submissionRes=await rest(`meme_week_submissions?id=eq.${encodeURIComponent(submissionId)}&contest_id=eq.${encodeURIComponent(contestId)}&burn_verified=eq.true&status=neq.rejected&select=id&limit=1`);
      if(!submissionRes.ok) throw new Error("Unable to verify selected submission.");
      const submissions=await submissionRes.json();
      if(!submissions?.[0]) return json(req,{success:false,error:"This meme is not eligible for voting."},409);

      const existingRes=await rest(`meme_week_votes?contest_id=eq.${encodeURIComponent(contestId)}&public_voter_id=eq.${encodeURIComponent(voterId)}&select=id,submission_id&limit=1`);
      if(!existingRes.ok) throw new Error("Unable to check existing vote.");
      const existing=await existingRes.json();
      if(existing?.[0]) return json(req,{success:false,alreadyVoted:true,submissionId:existing[0].submission_id,error:"This browser has already voted in this weekly contest."},409);

      const ipHash=await sha256(`sparkd-vote-ip-v1:${ip}`);
      const uaHash=await sha256(`sparkd-vote-ua-v1:${req.headers.get("user-agent")||"unknown"}`);
      const fingerprintHash=await sha256(`sparkd-vote-fp-v1:${ipHash}:${uaHash}`);

      const fingerprintRes=await rest(`meme_week_votes?contest_id=eq.${encodeURIComponent(contestId)}&public_fingerprint_hash=eq.${encodeURIComponent(fingerprintHash)}&select=id,submission_id&limit=1`);
      if(!fingerprintRes.ok) throw new Error("Unable to check voting fingerprint.");
      const fingerprintExisting=await fingerprintRes.json();
      if(fingerprintExisting?.[0]) return json(req,{success:false,alreadyVoted:true,submissionId:fingerprintExisting[0].submission_id,error:"This device or network fingerprint has already voted in this weekly contest."},409);

      const insertRes=await rest("meme_week_votes",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({contest_id:contestId,submission_id:submissionId,wallet_address:`public:${voterId.slice(0,40)}`,public_voter_id:voterId,voting_method:"public",ip_hash:ipHash,user_agent_hash:uaHash,public_fingerprint_hash:fingerprintHash})});
      if(!insertRes.ok){
        const t=await insertRes.text();
        if(insertRes.status===409||/duplicate|unique/i.test(t)) return json(req,{success:false,alreadyVoted:true,error:"This browser or device has already voted in this weekly contest."},409);
        throw new Error("Unable to record vote.");
      }
      const inserted=await insertRes.json();
      return json(req,{success:true,recorded:true,vote:inserted?.[0]||null,contestId,submissionId,publicVoting:true});
    }

    if (action === "register_reward_wallet") {
      const contestId=body?.contestId, voterId=typeof body?.voterId==="string"?body.voterId.toLowerCase():"", wallet=body?.wallet, timestamp=body?.timestamp, nonce=body?.nonce, message=body?.message, signatureBase64=body?.signatureBase64;
      if(!validUuid(contestId)||!validVoterId(voterId)||!validWallet(wallet)||typeof timestamp!=="string"||typeof nonce!=="string"||typeof message!=="string"||typeof signatureBase64!=="string") return json(req,{success:false,error:"Invalid reward-wallet request."},400);
      const timestampMs=Date.parse(timestamp);
      if(!Number.isFinite(timestampMs)||Math.abs(Date.now()-timestampMs)>5*60*1000) return json(req,{success:false,error:"Wallet signature has expired. Please try again."},400);
      const expectedMessage=["SPARKD Voter Reward Entry",`Contest: ${contestId}`,`Voter: ${voterId}`,`Wallet: ${wallet}`,`Timestamp: ${timestamp}`,`Nonce: ${nonce}`].join("\n");
      if(message!==expectedMessage) return json(req,{success:false,error:"Reward entry message is invalid."},400);
      let signatureBytes:Uint8Array, publicKeyBytes:Uint8Array;
      try{const binary=atob(signatureBase64);signatureBytes=Uint8Array.from(binary,c=>c.charCodeAt(0));publicKeyBytes=bs58.decode(wallet);}catch{return json(req,{success:false,error:"Wallet signature is invalid."},400);}
      if(signatureBytes.length!==nacl.sign.signatureLength||publicKeyBytes.length!==nacl.sign.publicKeyLength||!nacl.sign.detached.verify(new TextEncoder().encode(expectedMessage),signatureBytes,publicKeyBytes)) return json(req,{success:false,error:"Phantom signature verification failed."},401);

      const voteRes=await rest(`meme_week_votes?contest_id=eq.${encodeURIComponent(contestId)}&public_voter_id=eq.${encodeURIComponent(voterId)}&voting_method=eq.public&select=id,reward_wallet_address&limit=1`);
      if(!voteRes.ok) throw new Error("Unable to find your vote.");
      const rows=await voteRes.json();
      if(!rows?.[0]) return json(req,{success:false,error:"Cast your public vote before entering the SOL reward drawing."},409);
      if(rows[0].reward_wallet_address) return json(req,{success:true,registered:true,wallet:rows[0].reward_wallet_address,alreadyRegistered:true});

      const otherRes=await rest(`meme_week_votes?contest_id=eq.${encodeURIComponent(contestId)}&reward_wallet_address=eq.${encodeURIComponent(wallet)}&select=id&limit=1`);
      if(otherRes.ok && (await otherRes.json())?.[0]) return json(req,{success:false,error:"This wallet is already entered in this contest's voter reward drawing."},409);
      const updateRes=await rest(`meme_week_votes?id=eq.${encodeURIComponent(rows[0].id)}`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({reward_wallet_address:wallet})});
      if(!updateRes.ok) throw new Error("Unable to register reward wallet.");
      return json(req,{success:true,registered:true,wallet});
    }

    if (action === "cast_vote") {
      const castLimit=rateLimit(`vote-cast:${ip}`,12,60_000);
      if(!castLimit.ok)return json(req,{success:false,error:"Too many vote attempts. Please try again shortly."},429,{"Retry-After":String(castLimit.retryAfter)});
      const contestId=body?.contestId,submissionId=body?.submissionId,wallet=body?.wallet,timestamp=body?.timestamp,nonce=body?.nonce,message=body?.message,signatureBase64=body?.signatureBase64;
      if(!validUuid(contestId)||!validUuid(submissionId)||!validWallet(wallet)||typeof timestamp!=="string"||typeof nonce!=="string"||typeof message!=="string"||typeof signatureBase64!=="string")return json(req,{success:false,error:"Invalid voting request."},400);
      const timestampMs=Date.parse(timestamp);
      if(!Number.isFinite(timestampMs)||Math.abs(Date.now()-timestampMs)>5*60*1000)return json(req,{success:false,error:"Vote signature has expired. Please try again."},400);
      const expectedMessage=["SPARKD Meme of the Week Vote",`Contest: ${contestId}`,`Submission: ${submissionId}`,`Wallet: ${wallet}`,`Timestamp: ${timestamp}`,`Nonce: ${nonce}`].join("\n");
      if(message!==expectedMessage)return json(req,{success:false,error:"Vote message does not match the selected meme."},400);
      let signatureBytes:Uint8Array,publicKeyBytes:Uint8Array;
      try{const binary=atob(signatureBase64);signatureBytes=Uint8Array.from(binary,c=>c.charCodeAt(0));publicKeyBytes=bs58.decode(wallet);}catch{return json(req,{success:false,error:"Vote signature is invalid."},400);}
      if(signatureBytes.length!==nacl.sign.signatureLength||publicKeyBytes.length!==nacl.sign.publicKeyLength||!nacl.sign.detached.verify(new TextEncoder().encode(expectedMessage),signatureBytes,publicKeyBytes))return json(req,{success:false,error:"Phantom vote signature verification failed."},401);
      const contestRes=await rest(`meme_week_contests?id=eq.${encodeURIComponent(contestId)}&status=eq.voting&select=id,week_start&limit=1`);
      if(!contestRes.ok)throw new Error("Unable to verify voting contest.");
      const contests=await contestRes.json(),contest=contests?.[0];
      if(!contest)return json(req,{success:false,error:"Voting is not open for this contest."},409);
      if(Date.parse(contest.week_start)>=PUBLIC_VOTING_START)return json(req,{success:false,error:"This contest uses public voting. No wallet is required to vote."},409);
      const submissionRes=await rest(`meme_week_submissions?id=eq.${encodeURIComponent(submissionId)}&contest_id=eq.${encodeURIComponent(contestId)}&burn_verified=eq.true&status=neq.rejected&select=id&limit=1`);
      if(!submissionRes.ok)throw new Error("Unable to verify selected submission.");
      const submissions=await submissionRes.json();if(!submissions?.[0])return json(req,{success:false,error:"This meme is not eligible for voting."},409);
      const existingRes=await rest(`meme_week_votes?contest_id=eq.${encodeURIComponent(contestId)}&wallet_address=eq.${encodeURIComponent(wallet)}&select=id,submission_id&limit=1`);
      if(!existingRes.ok)throw new Error("Unable to check existing vote.");const existing=await existingRes.json();
      if(existing?.[0])return json(req,{success:false,alreadyVoted:true,submissionId:existing[0].submission_id,error:"This wallet has already voted in this weekly contest."},409);
      const insertRes=await rest("meme_week_votes",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({contest_id:contestId,submission_id:submissionId,wallet_address:wallet,reward_wallet_address:wallet,voting_method:"wallet"})});
      if(!insertRes.ok){const t=await insertRes.text();if(insertRes.status===409||/duplicate|unique/i.test(t))return json(req,{success:false,alreadyVoted:true,error:"This wallet has already voted in this weekly contest."},409);throw new Error("Unable to record vote.");}
      const inserted=await insertRes.json();return json(req,{success:true,recorded:true,vote:inserted?.[0]||null,contestId,submissionId,wallet});
    }

    return json(req,{success:false,error:"Unknown voting action."},400);
  } catch(error) {
    console.error("SPARKD contest-voting error:",error);
    return json(req,{success:false,error:error instanceof Error?error.message:String(error)},500);
  }
});
