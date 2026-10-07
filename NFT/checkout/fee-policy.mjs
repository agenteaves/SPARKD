import {ComputeBudgetProgram} from '@solana/web3.js';
import {Buffer} from 'buffer';
// 400k units at 1,000 micro-lamports/unit = 400 lamports priority fee.
export function feeInstructions(){return [ComputeBudgetProgram.setComputeUnitLimit({units:400000}),ComputeBudgetProgram.setComputeUnitPrice({microLamports:1000})];}
export function coreInstructions(instructions){const fees=feeInstructions();if(instructions[0]?.programId.equals(ComputeBudgetProgram.programId)){if(instructions.length<3||!fees.every((f,i)=>instructions[i].programId.equals(f.programId)&&instructions[i].keys.length===0&&Buffer.from(instructions[i].data).equals(Buffer.from(f.data))))throw Error('Unexpected network fee instructions');return instructions.slice(2);}return instructions;}
