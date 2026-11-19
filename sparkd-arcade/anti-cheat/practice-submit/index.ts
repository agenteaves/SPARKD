import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
// Practice scores are explicitly UNVERIFIED and NEVER prize eligible.
const allowedOrigins = new Set(['https://agenteaves.github.io', 'https://sparkdcoin.com']);
Deno.serve(async req => {
  const origin = req.headers.get('Origin');
  const headers = { 'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : '', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin', 'Content-Type': 'application/json' };
  const respond = (status:number, body:unknown) => new Response(JSON.stringify(body), { status, headers });
  if (!origin || !allowedOrigins.has(origin)) return respond(403,{error:'origin-not-allowed'});
  if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
  if (req.method !== 'POST') return respond(405,{error:'method-not-allowed'});
  if (Number(req.headers.get('content-length') || 0) > 2048) return respond(413,{error:'payload-too-large'});
  const authorization = req.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+$/.test(authorization)) return respond(401,{error:'authentication-required'});
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !service) return respond(503,{error:'service-not-configured'});
  const userClient = createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError} = await userClient.auth.getUser(authorization.replace(/^Bearer\s+/, ''));
  if (authError || !user || user.is_anonymous) return respond(401,{error:'registered-player-required'});
  let body:unknown;
  try { body=await req.json(); } catch { return respond(400,{error:'invalid-json'}); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(400,{error:'invalid-body'});
  const b=body as Record<string,unknown>;
  if (Object.keys(b).some(k=>!['displayName','score','levelReached'].includes(k))) return respond(400,{error:'unexpected-fields'});
  if (typeof b.displayName !== 'string' || !/^[A-Za-z0-9 _-]{2,24}$/.test(b.displayName)) return respond(400,{error:'invalid-name'});
  if (!Number.isSafeInteger(b.score) || (b.score as number)<0 || (b.score as number)>10000000) return respond(400,{error:'invalid-score'});
  if (!Number.isInteger(b.levelReached) || (b.levelReached as number)<1 || (b.levelReached as number)>5) return respond(400,{error:'invalid-level'});
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  // Rate-limit enforcement is in a database trigger, not a racy read-then-write.
  const {error}=await admin.from('sparkd_practice_scores').insert({
    player_id:user.id,display_name:b.displayName,score:b.score,level_reached:b.levelReached
  });
  if (error) return respond(error.code==='P0001'?429:503,{error:error.code==='P0001'?'rate-limited':'submission-unavailable'});
  return respond(201,{accepted:true,verified:false,prizeEligible:false});
});
