import {Transaction} from '@solana/web3.js';
import {LIGHTHOUSE} from './owner-guards.mjs';
// Only stateless account-info, mint and token assertions. No memory writes,
// closes, transfers, additional signers or accounts outside the quoted operation.
export function stripPurchaseGuards(instructions,feePayer){const base=instructions.filter(ix=>ix.programId.toBase58()!==LIGHTHOUSE),allowed=new Set([feePayer,...base.flatMap(ix=>ix.keys.map(k=>k.pubkey.toBase58()))]);let guards=0;for(const ix of instructions){if(ix.programId.toBase58()!==LIGHTHOUSE)continue;if(++guards>8||![6,8,10].includes(ix.data[0])||ix.data.length<4||ix.data.length>512||ix.keys.length!==1||!allowed.has(ix.keys[0].pubkey.toBase58()))throw Error('Unexpected purchase safety instruction');}return base;}
export function purchaseBase(tx){const base=new Transaction({feePayer:tx.feePayer,recentBlockhash:tx.recentBlockhash});base.add(...stripPurchaseGuards(tx.instructions,tx.feePayer.toBase58()));return base;}
