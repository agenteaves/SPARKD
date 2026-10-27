import { randomUUID } from 'node:crypto';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createAssociatedTokenAccountIdempotentInstruction, createTransferInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { KoraClient } from '@solana/kora';
import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import { getDevnetWalletBalances } from './devnet-wallet.mjs';

const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const pending = new Map();
const PROPOSAL_TTL_MS = 60_000;
const MAX_INPUT_LAMPORTS = 10_000_000n;

function requireAmount(amountIn) {
  if (!/^\d+$/.test(String(amountIn)) || BigInt(amountIn) <= 0n || BigInt(amountIn) > MAX_INPUT_LAMPORTS) {
    throw new Error('Devnet swap input must be a positive amount no greater than 0.01 SOL.');
  }
  return BigInt(amountIn);
}

export async function buildDevnetSwap({ address, amountIn, settings, dependencies = {} }) {
  const amount = requireAmount(String(amountIn));
  if (!settings.koraRpcUrl) throw new Error('The Devnet Kora sponsor is not configured.');
  if (!settings.sparkdDevnetMint || !settings.feeReceiver) throw new Error('The Devnet test mint and fee receiver must be configured.');
  const owner = new PublicKey(address);
  const mint = new PublicKey(settings.sparkdDevnetMint);
  const receiver = new PublicKey(settings.feeReceiver);
  const fee = BigInt(settings.sparkdDevnetFeeBaseUnits);
  const rpcUrl = settings.devnetRpcUrl;
  const connection = dependencies.connection ?? new Connection(rpcUrl, 'confirmed');
  const wallet = await (dependencies.walletProvider ?? getDevnetWalletBalances)({ address: owner.toBase58(), rpcUrl, mint: mint.toBase58() });
  if (BigInt(wallet.solLamports) < amount) throw new Error('The Devnet wallet needs more SOL for the selected swap input.');
  if (BigInt(wallet.sparkd.amount) < fee) throw new Error('The Devnet wallet does not have enough test SPARKD for the app fee.');

  const kora = dependencies.koraClient ?? new KoraClient({ rpcUrl: settings.koraRpcUrl });
  const payer = await kora.getPayerSigner();
  const sponsor = new PublicKey(payer.signer_address);
  const raydium = dependencies.raydiumFactory
    ? await dependencies.raydiumFactory({ connection, owner })
    : await Raydium.load({ connection, owner, cluster: 'devnet', disableFeatureCheck: true });
  const { poolInfo, poolKeys, computePoolInfo } = await raydium.cpmm.getPoolInfoFromRpc(settings.raydiumDevnetPoolId);
  const inputIsA = poolInfo.mintA.address === SOL_MINT.toBase58();
  if (!inputIsA && poolInfo.mintB.address !== SOL_MINT.toBase58()) throw new Error('The configured test pool does not accept SOL input.');
  const outputMint = inputIsA ? poolInfo.mintB.address : poolInfo.mintA.address;
  const slippageBps = 100;
  const quote = raydium.cpmm.computeSwapAmount({
    pool: computePoolInfo,
    amountIn: new BN(amount.toString()),
    outputMint,
    slippage: slippageBps / 10_000,
    swapBaseIn: true,
  });
  const swap = await raydium.cpmm.swap({
    poolInfo,
    poolKeys,
    baseIn: inputIsA,
    inputAmount: new BN(amount.toString()),
    swapResult: quote.swapResult,
    slippage: slippageBps / 10_000,
    txVersion: TxVersion.LEGACY,
    feePayer: sponsor,
    config: { associatedOnly: true },
  });
  const transaction = swap.transaction;
  if (!(transaction instanceof Transaction)) throw new Error('The Devnet router returned an unsupported transaction format.');
  transaction.feePayer = sponsor;
  if (!transaction.recentBlockhash) transaction.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;

  const source = getAssociatedTokenAddressSync(mint, owner);
  const destination = getAssociatedTokenAddressSync(mint, receiver);
  const feeInstructions = [];
  if (!(await connection.getAccountInfo(source, 'confirmed'))) {
    feeInstructions.push(createAssociatedTokenAccountIdempotentInstruction(sponsor, source, owner, mint));
  }
  if (!(await connection.getAccountInfo(destination, 'confirmed'))) {
    feeInstructions.push(createAssociatedTokenAccountIdempotentInstruction(sponsor, destination, receiver, mint));
  }
  feeInstructions.push(createTransferInstruction(source, destination, owner, fee));
  transaction.add(...feeInstructions);
  const unsigned = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
  const proposalId = randomUUID();
  const expiresAt = Date.now() + PROPOSAL_TTL_MS;
  for (const [id, proposal] of pending) if (proposal.expiresAt < Date.now() || proposal.used) pending.delete(id);
  pending.set(proposalId, { owner: owner.toBase58(), sponsor: sponsor.toBase58(), message: transaction.serializeMessage(), expiresAt, used: false });

  return {
    proposalId,
    unsignedTransaction: unsigned.toString('base64'),
    expiresAt: new Date(expiresAt).toISOString(),
    wallet: owner.toBase58(),
    sponsor: sponsor.toBase58(),
    swap: {
      inputLamports: amount.toString(),
      outputMint,
      expectedOutputBaseUnits: quote.amountOut.toString(),
      minimumOutputBaseUnits: quote.minAmountOut.toString(),
      outputDecimals: (inputIsA ? poolInfo.mintB : poolInfo.mintA).decimals,
      outputSymbol: (inputIsA ? poolInfo.mintB : poolInfo.mintA).symbol,
      poolId: settings.raydiumDevnetPoolId,
      slippageBps,
    },
    appFee: { mint: mint.toBase58(), receiver: receiver.toBase58(), amountBaseUnits: fee.toString(), decimals: wallet.sparkd.decimals },
    networkFeePayer: sponsor.toBase58(),
    cluster: 'devnet',
    transactionSubmitted: false,
  };
}

export async function submitDevnetSwap({ proposalId, signedTransaction, settings, dependencies = {} }) {
  const proposal = pending.get(String(proposalId));
  if (!proposal || proposal.used || proposal.expiresAt < Date.now()) throw new Error('This transaction preview expired. Prepare a fresh swap.');
  if (typeof signedTransaction !== 'string' || signedTransaction.length > 5000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(signedTransaction)) {
    throw new Error('The signed transaction is invalid.');
  }
  const wire = Buffer.from(signedTransaction, 'base64');
  if (wire.toString('base64') !== signedTransaction) throw new Error('The signed transaction encoding is invalid.');
  const transaction = Transaction.from(wire);
  if (!transaction.serializeMessage().equals(proposal.message)) throw new Error('The signed transaction does not match the reviewed swap and SPARKD fee.');
  if (transaction.feePayer?.toBase58() !== proposal.sponsor) throw new Error('The sponsor is not the transaction fee payer.');
  const userSignature = transaction.signatures.find(({ publicKey }) => publicKey.toBase58() === proposal.owner)?.signature;
  if (!userSignature || !transaction.verifySignatures(false)) throw new Error('The connected wallet signature is missing or invalid.');
  proposal.used = true;
  const kora = dependencies.koraClient ?? new KoraClient({ rpcUrl: settings.koraRpcUrl });
  const result = await kora.signAndSendTransaction({ transaction: signedTransaction });
  pending.delete(String(proposalId));
  return { signature: result.signature, cluster: 'devnet', confirmed: true };
}
