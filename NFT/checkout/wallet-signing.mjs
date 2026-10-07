import {Buffer} from 'buffer';
import {Transaction,VersionedTransaction} from '@solana/web3.js';
import {ed25519} from '@noble/curves/ed25519';
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
 if(!valid(signature,message,expectedWallet))throw Error('Phantom returned a signature for different transaction details. Nothing was submitted. Keep the default fee and send this error to support.');
 original.signatures[0]=Uint8Array.from(signature);
 for(let i=0;i<original.message.header.numRequiredSignatures;i++)if(!valid(original.signatures[i],message,keys[i]))throw Error('The checkout co-signature is missing or invalid. Nothing was submitted.');
 return {bytes:Buffer.from(original.serialize()),signature:Uint8Array.from(original.signatures[0])};
}
