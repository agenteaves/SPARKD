import {Buffer} from 'node:buffer';
import process from 'node:process';
(globalThis as any).global=globalThis;
(globalThis as any).Buffer=Buffer;
(globalThis as any).process=process;
import {createHash} from 'node:crypto';
const url=Deno.env.get('SUPABASE_URL')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowed=new Set(['https://sparkdcoin.com','https://www.sparkdcoin.com']);
async function database(path:string,body?:unknown,method='POST'){
 const response=await fetch(url+'/rest/v1/'+path,{method,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:body===undefined?undefined:JSON.stringify(body)});
 if(!response.ok)throw Error('Checkout storage unavailable');if(response.status===204||response.headers.get('content-length')==='0')return null;const text=await response.text();return text?JSON.parse(text):null;
}
let servicePromise:Promise<any>|undefined;
function service(){return servicePromise??=(async()=>{const {ProductionCheckout}=await import('./production-bundle.mjs');const seed=await database('rpc/nft_vault_signer_seed',{});const store={set:(id:string,quote:unknown)=>database('nft_vault_quotes',{id,quote}),get:async(id:string)=>{if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Invalid request identifier');const rows=await database('nft_vault_quotes?id=eq.'+id+'&select=quote',undefined,'GET');return rows[0]?.quote;}};return new ProductionCheckout(Buffer.from(seed,'hex'),store);})();}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'',headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info'};
 const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(!allowed.has(origin))return new Response(JSON.stringify({error:'Origin denied'}),{status:403,headers:{'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
  const path=new URL(req.url).pathname.split('/nft-vault')[1]||'/';
  const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();
  const bucket=createHash('sha256').update(ip).digest('hex');
  if(!await database('rpc/nft_vault_rate',{p_key:bucket,p_kind:path==='/inventory'?'read':'write'}))return reply({error:'Please wait a minute before trying again'},429);
  if(req.method==='POST'&&Number(req.headers.get('content-length')||0)>12000)return reply({error:'Request too large'},413);
  const text=req.method==='POST'?await req.text():'';if(text.length>12000)return reply({error:'Request too large'},413);
  if(req.method==='POST'&&!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
  const body=text?JSON.parse(text):{},checkout=await service();
  if(req.method==='GET'&&path==='/inventory')return reply(await checkout.inventory());
  if(req.method!=='POST')return reply({error:'Not found'},404);
  if(path==='/prepare'&&typeof body.id==='string'&&typeof body.buyer==='string')return reply(await checkout.prepare(body.id,body.buyer));
  if(path==='/prepare-owner'&&typeof body.id==='string'&&typeof body.owner==='string')return reply(await checkout.prepareAdmin(body.id,body.owner,body.action));
  if(path==='/submit'&&typeof body.quoteId==='string'&&typeof body.transaction==='string')return reply(await checkout.submit(body.quoteId,body.transaction));
  if(path==='/status'&&typeof body.signature==='string'&&typeof body.id==='string'&&typeof body.buyer==='string')return reply(await checkout.status(body.signature,body.id,body.buyer,body.kind,body.quoteId));
  return reply({error:'Invalid checkout request'},400);
 }catch(error){console.error('NFT vault request failed:',(error as Error).message);return reply({error:(error as Error).message||'Checkout unavailable'},400);}
});
