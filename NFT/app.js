'use strict';
const artworks=document.querySelector('#artworks');
for(const item of window.NFT_CATALOG){
 const article=document.createElement('article');article.className='artwork';
 const image=document.createElement('img');image.src=item.image;image.alt=item.alt;image.loading='lazy';image.width=600;image.height=600;
 const title=document.createElement('h3');title.textContent=item.title;
 const description=document.createElement('p');description.textContent=item.description;
 const price=document.createElement('p');price.className='nft-price';price.textContent=item.burnAmount.toLocaleString('en-US')+' SPARKD · Purchase coming soon';
 const link=document.createElement('a');link.href=item.explorer;link.target='_blank';link.rel='noopener noreferrer';link.textContent='View NFT on Metaplex ↗';
 article.append(image,title,description,price,link);const target=item.saleCategory==='winner'?document.querySelector('#winner-artworks'):artworks;target.append(article);
}
