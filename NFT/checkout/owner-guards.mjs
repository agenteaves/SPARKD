import {Transaction} from '@solana/web3.js';
export const LIGHTHOUSE='L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95';
// Lighthouse opcode 6 is AssertAccountInfoMulti: it only evaluates account assertions.
// MemoryWrite/MemoryClose and all other instruction types remain disallowed.
export function stripOwnerGuards(instructions,allowed){let guards=0;const base=[];for(const ix of instructions){if(ix.programId.toBase58()!==LIGHTHOUSE){base.push(ix);continue;}if(++guards>3||ix.data[0]!==6||ix.data.length<4||ix.data.length>512||ix.keys.length!==1||!allowed.includes(ix.keys[0].pubkey.toBase58()))throw Error('Unexpected wallet safety instruction');}return base;}
export function ownerBase(tx,asset,collection){const instructions=stripOwnerGuards(tx.instructions,[tx.feePayer.toBase58(),asset,collection]);const base=new Transaction({feePayer:tx.feePayer,recentBlockhash:tx.recentBlockhash});base.add(...instructions);return base;}
