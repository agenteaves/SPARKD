import {Buffer} from 'buffer';
import {VersionedTransaction} from '@solana/web3.js';
import {ed25519} from '@noble/curves/ed25519';
import bs58 from 'bs58';
const isEmpty=bytes=>bytes.every(byte=>byte===0);
export async function signExactTransaction(provider,serialized,expectedWallet){
 // Preserve the quoted legacy wire message without rebuilding its account order.
 const original=VersionedTransaction.deserialize(serialized);
 const message=Buffer.from(original.message.serialize());
 const required=original.message.header.numRequiredSignatures;
 const keys=original.message.staticAccountKeys;
 if(!keys[0].equals(expectedWallet))throw Error('Connected wallet does not match this request');
 const existing=original.signatures.map(signature=>Uint8Array.from(signature));
 // Phantom's request API accepts the encoded message directly, avoiding its
 // high-level transaction reconstruction on mobile. Co-signatures stay local.
 const result=typeof provider.request==='function'
  ?await provider.request({method:'signTransaction',params:{message:bs58.encode(message)}})
  :await provider.signTransaction(original);
 if(!result||typeof result.serialize!=='function')throw Error('Phantom did not return a signed transaction. Reconnect your wallet and try again.');
 const signed=VersionedTransaction.deserialize(result.serialize({requireAllSignatures:false,verifySignatures:false}));
 if(!message.equals(Buffer.from(signed.message.serialize())))throw Error('Phantom changed transaction details or fees. Nothing was submitted. Use the default fee setting and try again.');
 for(let i=0;i<required;i++){
  // Some wallet integrations return only their own signature. Restore only a
  // previously valid co-signature for the identical message, never a wallet signature.
  if(isEmpty(signed.signatures[i])&&!keys[i].equals(expectedWallet)&&!isEmpty(existing[i])&&ed25519.verify(existing[i],message,keys[i].toBytes(),{zip215:false}))signed.signatures[i]=existing[i];
  if(isEmpty(signed.signatures[i])||!ed25519.verify(signed.signatures[i],message,keys[i].toBytes(),{zip215:false}))throw Error(keys[i].equals(expectedWallet)?'Phantom did not return a valid signature for the connected wallet. Nothing was submitted. Reconnect the NFT owner wallet and try again.':'The checkout co-signature is missing or invalid. Nothing was submitted.');
 }
 return {bytes:Buffer.from(signed.serialize()),signature:Uint8Array.from(signed.signatures[0])};
}
