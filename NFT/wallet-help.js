'use strict';
const toggle=document.querySelector('#wallet-help-toggle'),help=document.querySelector('#wallet-help'),copy=document.querySelector('#copy-vault-link'),status=document.querySelector('#wallet-help-status');
if(toggle&&help){
 if(window.phantom?.solana?.isPhantom||window.solana?.isPhantom){toggle.hidden=true;}
 else toggle.addEventListener('click',()=>{help.hidden=!help.hidden;toggle.setAttribute('aria-expanded',String(!help.hidden));});
}
copy?.addEventListener('click',async()=>{const url=window.location.origin+window.location.pathname;try{await navigator.clipboard.writeText(url);status.textContent='Link copied. Paste it into Phantom’s browser.';}catch{status.textContent='Copy this address: '+url;}});
