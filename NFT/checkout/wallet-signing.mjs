import {Buffer} from 'buffer';
import {Transaction,VersionedTransaction} from '@solana/web3.js';
import {ed25519} from '@noble/curves/ed25519';
import bs58 from 'bs58';
function signatureBytes(value){if(typeof value==='string'){try{return bs58.decode(value);}catch{return null;}}if(value?.type==='Buffer')value=value.data;return value?Uint8Array.from(value):null;}
const valid=(signature,message,key)=>signature?.length===64&&ed25519.verify(signature,message,key.toBytes(),{zip215:false});
export async function signExactTransaction(provider,serialized,expectedWallet){
 const original=VersionedTransaction.deserialize(serialized);
 const message=Buffer.from(original.message.serialize());
 const keys=original.message.staticAccountKeys;
 if(!keys[0].equals(expectedWallet))throw Error('Connected wallet does not match this request');
 // Use the matching public transaction type. The legacy quote is not a v0 transaction.
 const input=original.version==='legacy'?Transaction.from(serialized):original;
 const result=await provider.signTransaction(input);
 // Verify signatures against the immutable quote, rather than reserializing the
 // wallet's object (legacy account-order reconstruction can change those bytes).
 const signatures=result?.signatures;
 if(!Array.isArray(signatures))throw Error('Phantom did not return transaction signatures. Nothing was submitted.');
 let signature;
 if(original.version==='legacy'&&signatures.some(s=>s?.publicKey))signature=signatures.find(s=>s.publicKey?.equals(expectedWallet))?.signature;
 else signature=signatures[0];
 signature=signatureBytes(signature);
 if(!valid(signature,message,expectedWallet)){
  let detail=!signature?'wallet signature missing':signature.length!==64?'unexpected signature format':'signature does not match quote';
  try{
   const returned=VersionedTransaction.deserialize(result.serialize({requireAllSignatures:false,verifySignatures:false}));
   const changed=[];
   if(returned.message.recentBlockhash!==original.message.recentBlockhash)changed.push('blockhash');
   if(returned.message.compiledInstructions.length!==original.message.compiledInstructions.length)changed.push('instruction count '+original.message.compiledInstructions.length+' to '+returned.message.compiledInstructions.length);
   if(returned.message.staticAccountKeys.some(k=>k.toBase58()==='ComputeBudget111111111111111111111111111111'))changed.push('wallet added fee instructions');
   if(!Buffer.from(returned.message.serialize()).equals(message)&&!changed.length)changed.push('accounts or instruction data');
   if(changed.length)detail=changed.join('; ');
   else if(valid(signature,returned.message.serialize(),expectedWallet))detail='wallet signed the same message but signature decoding failed';
  }catch{}
  throw Error('Approval was not submitted. Wallet response: '+detail+'. Please send this full message so we can identify the incompatibility.');
 }
 original.signatures[0]=Uint8Array.from(signature);
 for(let i=0;i<original.message.header.numRequiredSignatures;i++)if(!valid(original.signatures[i],message,keys[i]))throw Error('The checkout co-signature is missing or invalid. Nothing was submitted.');
 return {bytes:Buffer.from(original.serialize()),signature:Uint8Array.from(original.signatures[0])};
}
