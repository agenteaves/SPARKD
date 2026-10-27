import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createAssociatedTokenAccountIdempotentInstruction, createTransferInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { KoraClient } from '@solana/kora';
import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import { getDevnetWalletBalances } from './devnet-wallet.mjs';
import { createDevnetSponsorBudgetStore } from './devnet-sponsor-budget.mjs';

const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const pending = new Map();
const PROPOSAL_TTL_MS = 60_000;
const MAX_INPUT_LAMPORTS = 10_000_000n;
const MAX_OPEN_PROPOSALS_PER_WALLET = 3;
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const budgetStores = new Map();

function budgetFor(settings) {
  const filePath = settings.devnetSponsorBudgetFile || path.join(moduleDir, '.devnet', 'sponsor-budget.json');
  if (!budgetStores.has(filePath)) budgetStores.set(filePath, createDevnetSponsorBudgetStore({ filePath }));
  return budgetStores.get(filePath);
}

async function cleanupExpiredProposals(settings) {
  const now = Date.now();
  for (const [id, proposal] of pending) {
    if (proposal.expiresAt < now || proposal.used) {
      await budgetFor(settings).release(id);
      pending.delete(id);
    }
  }
}

function estimateLamports(result) {
  const value = result?.fee_in_lamports;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Sponsor returned an invalid transaction cost estimate.');
  return value;
}

function getBudgetLimits(settings) {
  return {
    perTransaction: BigInt(settings.devnetSponsorMaxTxLamports ?? '5000000'),
    daily: BigInt(settings.devnetSponsorDailyCapLamports ?? '50000000'),
  };
}

function requireAmount(amountIn) {
  if (!/^\d+$/.test(String(amountIn)) || BigInt(amountIn) <= 0n || BigInt(amountIn) > MAX_INPUT_LAMPORTS) {
    throw new Error('Devnet swap input must be a positive amount no greater than 0.01 SOL.');
  }
  return BigInt(amountIn);
}

export async function buildDevnetSwap({ address, amountIn, settings, dependencies = {} }) {
  await cleanupExpiredProposals(settings);
  const amount = requireAmount(String(amountIn));
  if (!settings.koraRpcUrl) throw new Error('The Devnet Kora sponsor is not configured.');
  if (!settings.sparkdDevnetMint || !settings.feeReceiver) throw new Error('The Devnet test mint and fee receiver must be configured.');
  const owner = new PublicKey(address);
  const openForWallet = [...pending.values()].filter(proposal => proposal.owner === owner.toBase58() && proposal.expiresAt >= Date.now()).length;
  if (openForWallet >= MAX_OPEN_PROPOSALS_PER_WALLET) throw new Error('This wallet already has three open Devnet previews. Submit or wait for one to expire.');
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
  const { tokens = [] } = await kora.getSupportedTokens();
  const estimationToken = settings.koraEstimationFeeToken || tokens[0];
  if (!estimationToken) throw new Error('Kora did not return a supported fee token for sponsor cost estimation.');
  const estimate = estimateLamports(await kora.estimateTransactionFee({ transaction: unsigned.toString('base64'), fee_token: estimationToken }));
  const proposalId = randomUUID();
  const budget = budgetFor(settings);
  await budget.reserve(proposalId, estimate, getBudgetLimits(settings));
  const expiresAt = Date.now() + PROPOSAL_TTL_MS;
  pending.set(proposalId, { owner: owner.toBase58(), sponsor: sponsor.toBase58(), message: transaction.serializeMessage(), expiresAt, used: false, estimationToken });

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
    estimatedSponsorCostLamports: estimate,
    estimatedSponsorCostSol: (estimate / 1_000_000_000).toFixed(9),
    perSwapSponsorCapLamports: String(getBudgetLimits(settings).perTransaction),
    cluster: 'devnet',
    transactionSubmitted: false,
  };
}

export async function submitDevnetSwap({ proposalId, signedTransaction, settings, dependencies = {} }) {
  await cleanupExpiredProposals(settings);
  const budget = budgetFor(settings);
  const proposal = pending.get(String(proposalId));
  if (!proposal || proposal.used || proposal.expiresAt < Date.now()) {
    await budget.release(String(proposalId));
    pending.delete(String(proposalId));
    throw new Error('This transaction preview expired. Prepare a fresh swap.');
  }
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
  const kora = dependencies.koraClient ?? new KoraClient({ rpcUrl: settings.koraRpcUrl });
  const estimate = estimateLamports(await kora.estimateTransactionFee({ transaction: signedTransaction, fee_token: proposal.estimationToken }));
  const limits = getBudgetLimits(settings);
  if (BigInt(estimate) > limits.perTransaction) {
    await budget.release(String(proposalId)); pending.delete(String(proposalId));
    throw new Error('Updated sponsor cost exceeds the per-swap Devnet limit. Prepare a fresh preview later.');
  }
  await budget.update(String(proposalId), estimate, limits);
  proposal.used = true;
  let result;
  try {
    result = await kora.signAndSendTransaction({ transaction: signedTransaction });
  } catch (error) {
    await budget.settle(String(proposalId), estimate);
    pending.delete(String(proposalId));
    throw error;
  }
  const inspected = await (dependencies.transactionInspector ?? inspectConfirmedTransaction)({
    signature: result.signature,
    sponsor: proposal.sponsor,
    rpcUrl: settings.devnetRpcUrl,
    connection: dependencies.connection,
  });
  const sponsorCostLamports = inspected?.sponsorCostLamports ?? estimate;
  await budget.settle(String(proposalId), sponsorCostLamports);
  const budgetSnapshot = await budget.snapshot();
  pending.delete(String(proposalId));
  return {
    signature: result.signature,
    cluster: 'devnet',
    confirmed: true,
    success: inspected ? inspected.success : true,
    appFeeCollected: inspected ? inspected.success : true,
    sponsorCostLamports,
    sponsorCostVerified: Boolean(inspected),
    sponsorDailyBudgetRemainingLamports: Math.max(0, Number(limits.daily) - budgetSnapshot.spentLamports - budgetSnapshot.reservedLamports),
  };
}

async function inspectConfirmedTransaction({ signature, sponsor, rpcUrl, connection }) {
  try {
    const rpc = connection ?? new Connection(rpcUrl, 'confirmed');
    const transaction = await rpc.getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    if (!transaction?.meta) return null;
    const accountKeys = transaction.transaction.message.accountKeys;
    const sponsorIndex = accountKeys.findIndex(key => (key.pubkey ?? key).toBase58() === sponsor);
    if (sponsorIndex < 0) return null;
    return {
      success: transaction.meta.err === null,
      sponsorCostLamports: Math.max(0, transaction.meta.preBalances[sponsorIndex] - transaction.meta.postBalances[sponsorIndex]),
    };
  } catch {
    return null;
  }
}
