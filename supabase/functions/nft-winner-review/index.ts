import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import nacl from "npm:tweetnacl@1.0.3";
import bs58 from "npm:bs58@6.0.0";

const OWNER = "2dFYXBWy1s5kq3gZpZ9m3aQ4VkUDwVbUSnVes5rUXSe6";
const ORIGINS = new Set(["https://sparkdcoin.com","https://www.sparkdcoin.com"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reply(req:Request, value:unknown, status=200) {
 const origin=req.headers.get("origin")||"";
 return new Response(JSON.stringify(value),{status,headers:{
  "Content-Type":"application/json","Cache-Control":"no-store",
  "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  ...(ORIGINS.has(origin)?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{})
 }});
}
function db(){
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key)throw Error("Missing server credentials");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return reply(req,{});
 if(req.method!=="POST")return reply(req,{error:"Method not allowed"},405);
 if(!ORIGINS.has(req.headers.get("origin")||""))return reply(req,{error:"Origin denied"},403);
 try {
  const body=await req.json();
  const database=db();
  if(body.action==="challenge"){
   const intent=body.intent==="list"?"list":body.intent==="review"&&uuid.test(body.contestId||"")&&["approved","rejected"].includes(body.decision)?["review",body.contestId,body.decision].join(":"):null;
   if(!intent)return reply(req,{error:"Invalid review intent"},400);
   if(body.wallet!==OWNER)return reply(req,{error:"Owner wallet required"},403);
   const {data,error}=await database.from("nft_winner_review_challenges").insert({wallet:OWNER,intent}).select("id,nonce,expires_at").single();
   if(error)throw error;
   return reply(req,{challengeId:data.id,message:["SPARKD-NFT-WINNER-REVIEW-v1",data.id,data.nonce,OWNER,intent].join("\n"),expiresAt:data.expires_at});
  }
  if(!["list","review"].includes(body.action)||!uuid.test(body.challengeId||"")||typeof body.signature!=="string")
   return reply(req,{error:"Invalid request"},400);
  if(body.action==="review"&&(!uuid.test(body.contestId||"")||!["approved","rejected"].includes(body.decision)))
   return reply(req,{error:"Invalid review"},400);
  const {data:challenge,error:challengeError}=await database.from("nft_winner_review_challenges")
   .select("id,nonce,wallet,intent,expires_at,used_at").eq("id",body.challengeId).maybeSingle();
  if(challengeError)throw challengeError;
  if(!challenge||challenge.wallet!==OWNER||challenge.used_at||Date.parse(challenge.expires_at)<=Date.now())
   return reply(req,{error:"Challenge expired or already used"},401);
  const intent=body.action==="list"?"list":["review",body.contestId,body.decision].join(":");
  if(challenge.intent!==intent)return reply(req,{error:"Signed action mismatch"},403);
  const message=["SPARKD-NFT-WINNER-REVIEW-v1",challenge.id,challenge.nonce,OWNER,intent].join("\n");
  const signature=Uint8Array.from(atob(body.signature),c=>c.charCodeAt(0));
  if(signature.length!==64||!nacl.sign.detached.verify(new TextEncoder().encode(message),signature,bs58.decode(OWNER)))
   return reply(req,{error:"Invalid owner signature"},401);
  // Atomically consume the one-time challenge before reading or writing data.
  const {data:consumed,error:consumeError}=await database.from("nft_winner_review_challenges")
   .update({used_at:new Date().toISOString()}).eq("id",challenge.id).is("used_at",null)
   .gt("expires_at",new Date().toISOString()).select("id");
  if(consumeError)throw consumeError;
  if(consumed?.length!==1)return reply(req,{error:"Challenge already used"},409);
  if(body.action==="review"){
   const {data,error}=await database.from("nft_meme_winner_candidates")
    .update({review_status:body.decision,reviewed_at:new Date().toISOString()})
    .eq("contest_id",body.contestId).eq("review_status","pending")
    .select("contest_id,review_status");
   if(error)throw error;
   if(data?.length!==1)return reply(req,{error:"Candidate not pending"},409);
   return reply(req,{success:true,candidate:data[0]});
  }
  const {data:rows,error}=await database.from("nft_meme_winner_candidates")
   .select("contest_id,submission_id,review_status,queued_at,reviewed_at")
   .order("queued_at",{ascending:false}).limit(250);
  if(error)throw error;
  const ids=(rows||[]).map(x=>x.submission_id);
  const {data:submissions,error:submissionError}=ids.length
   ?await database.from("meme_week_submissions").select("id,meme_title,meme_image_url,wallet_address").in("id",ids)
   :{data:[],error:null};
  if(submissionError)throw submissionError;
  const byId=new Map((submissions||[]).map(s=>[s.id,s]));
  return reply(req,{success:true,candidates:(rows||[]).map(row=>({...row,
   title:byId.get(row.submission_id)?.meme_title||"Untitled meme",
   image:byId.get(row.submission_id)?.meme_image_url||null,
   creatorWallet:byId.get(row.submission_id)?.wallet_address||null
  }))});
 } catch(e){console.error("NFT winner review error",e);return reply(req,{error:"Review service unavailable"},500);}
});
