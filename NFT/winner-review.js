'use strict';
const endpoint='https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/nft-winner-review';
const status=document.querySelector('#review-status'),holder=document.querySelector('#review-candidates');
let provider=null;
function wallet(){return window.phantom?.solana||window.solana;}
function base64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
async function request(body){
 const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':window.NFT_CHECKOUT_CONFIG.anonKey,'Authorization':'Bearer '+window.NFT_CHECKOUT_CONFIG.anonKey},body:JSON.stringify(body)});
 const json=await res.json();if(!res.ok)throw Error(json.error||'Review request failed');return json;
}
async function authorized(action,contestId,decision){
 if(!provider?.publicKey||provider.publicKey.toBase58()!==window.NFT_CHECKOUT_CONFIG.owner)throw Error('Owner wallet required');
 if(typeof provider.signMessage!=='function')throw Error('Wallet must support message signing');
 const challenge=await request({action:'challenge',wallet:provider.publicKey.toBase58(),intent:action,contestId,decision});
 const signed=await provider.signMessage(new TextEncoder().encode(challenge.message),'utf8');
 return request({action,contestId,decision,challengeId:challenge.challengeId,signature:base64(signed.signature)});
}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
async function load(){
 const data=await authorized('list');holder.replaceChildren();
 if(!data.candidates.length){holder.append(el('p','', 'No contest winners queued yet.'));return;}
 for(const item of data.candidates){
  const article=el('article','artwork');
  if(item.image&&/^https:\/\//i.test(item.image)){const img=el('img');img.src=item.image;img.alt=item.title;img.loading='lazy';img.referrerPolicy='no-referrer';article.append(img);}
  article.append(el('h3','',item.title),el('p','', 'Status: '+item.review_status),el('p','', 'Contest: '+item.contest_id),el('p','', 'Creator wallet: '+(item.creatorWallet||'Unknown')));
  if(item.review_status==='pending'){
   for(const decision of ['approved','rejected']){
    const button=el('button','button'+(decision==='approved'?' primary':''),decision==='approved'?'Approve candidate':'Reject candidate');
    button.addEventListener('click',async()=>{
     if(!confirm((decision==='approved'?'Approve':'Reject')+' this meme for NFT consideration? This will not mint or list it.'))return;
     button.disabled=true;
     try{await authorized('review',item.contest_id,decision);status.textContent='Review saved.';await load();}
     catch(e){status.textContent=e.message;button.disabled=false;}
    });article.append(button);
   }
  }
  holder.append(article);
 }
}
document.querySelector('#review-connect').addEventListener('click',async()=>{
 try{provider=wallet();if(!provider)throw Error('Install or open Phantom wallet.');
  await provider.connect();if(provider.publicKey.toBase58()!==window.NFT_CHECKOUT_CONFIG.owner)throw Error('Connect the configured NFT owner wallet.');
  status.textContent='Owner connected. Sign a message to load private candidates.';await load();
 }catch(e){status.textContent=e.message;}
});
