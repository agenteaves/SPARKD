'use strict';
const catalog=window.NFT_CATALOG,buttons=new Map();
for(const item of catalog){
 const article=document.createElement('article');article.className='artwork';
 const image=document.createElement('img');image.src=item.image;image.alt=item.alt;image.loading='lazy';image.width=600;image.height=600;
 const title=document.createElement('h3');title.textContent=item.title;
 const description=document.createElement('p');description.textContent=item.description;
 const price=document.createElement('p');price.className='nft-price';price.textContent=item.burnAmount.toLocaleString('en-US')+' SPARKD burned per purchase';
 const link=document.createElement('a');link.href=item.explorer;link.target='_blank';link.rel='noopener noreferrer';link.textContent='View NFT on Metaplex ↗';
 const buy=document.createElement('button');buy.className='button primary nft-buy';buy.textContent='Checking availability…';buy.disabled=true;
 const status=document.createElement('p');status.setAttribute('role','status');status.className='checkout-status';
 buy.addEventListener('click',()=>window.NFTCheckout.buy(item,buy,status));buttons.set(item.id,{buy,status});
 article.append(image,title,description,price,link,buy,status);
 document.querySelector(item.saleCategory==='winner'?'#winner-artworks':'#artworks').append(article);
}
async function refreshInventory(){try{const listings=await window.NFTCheckout.inventory();for(const item of catalog){const listing=listings.find(l=>l.id===item.id),{buy}=buttons.get(item.id);buy.disabled=!listing?.available;buy.textContent=listing?.available?'Buy for '+item.burnAmount.toLocaleString('en-US')+' SPARKD':listing?.state==='unlisted'?'Awaiting owner approval':'Unavailable';}document.querySelector('#vault-status').textContent=listings.some(l=>l.available)?'Connect Phantom when you choose an NFT. Purchases use real SPARKD on Solana mainnet.':'NFTs become available after the owner approves their listings.';}catch{for(const {buy} of buttons.values()){buy.disabled=true;buy.textContent='Checkout temporarily unavailable';}document.querySelector('#vault-status').textContent='Unable to check availability. Please refresh the page shortly.';}}
window.addEventListener('nft-inventory-changed',refreshInventory);refreshInventory();
