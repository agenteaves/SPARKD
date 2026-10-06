'use strict';
const artworks=document.querySelector('#artworks');
for(const item of window.NFT_CATALOG){
 const article=document.createElement('article');article.className='artwork';
 const image=document.createElement('img');image.src=item.image;image.alt=item.alt;image.loading='lazy';image.width=600;image.height=600;
 const title=document.createElement('h3');title.textContent=item.title;
 const description=document.createElement('p');description.textContent=item.description;
 const price=document.createElement('p');price.className='nft-price';price.textContent=item.burnAmount.toLocaleString('en-US')+' SPARKD · Purchase coming soon';
 const link=document.createElement('a');link.href=item.explorer;link.target='_blank';link.rel='noopener noreferrer';link.textContent='View NFT on Metaplex ↗';
 const buy=document.createElement('button');buy.className='button primary nft-buy';buy.dataset.listing=item.id;buy.textContent='Purchase coming soon';buy.disabled=true;const status=document.createElement('p');status.setAttribute('role','status');status.className='checkout-status';if(window.NFTCheckout?.enabled){buy.textContent='Test purchase on devnet';buy.disabled=!item.testAsset;buy.addEventListener('click',()=>window.NFTCheckout.buy(item,buy,status));}article.append(image,title,description,price,link,buy,status);const target=item.saleCategory==='winner'?document.querySelector('#winner-artworks'):artworks;target.append(article);
}

if(window.NFTCheckout?.enabled){window.NFTCheckout.inventory().then(listings=>{for(const listing of listings){const button=Array.from(document.querySelectorAll(".nft-buy")).find(b=>b.dataset.listing===listing.id);if(button&&!listing.available){button.disabled=true;button.textContent="Test NFT unavailable";}}}).catch(()=>{for(const button of document.querySelectorAll(".nft-buy")){button.disabled=true;button.textContent="Test checkout unavailable";}});}
