import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { buildDevnetSwap, submitDevnetSwap } from './devnet-swap.mjs';

const solMint = 'So11111111111111111111111111111111111111112';

async function createHarness(t) {
  const budgetDir = await mkdtemp(path.join(os.tmpdir(), 'sparkd-budget-test-'));
  t.after(() => rm(budgetDir, { recursive: true, force: true }));
  const owner = Keypair.generate();
  const sponsor = Keypair.generate().publicKey;
  const mint = Keypair.generate().publicKey;
  const receiver = Keypair.generate().publicKey;
  const settings = {
    koraRpcUrl: 'https://sponsor.invalid',
    devnetRpcUrl: 'https://devnet.invalid',
    sparkdDevnetMint: mint.toBase58(),
    sparkdDevnetFeeBaseUnits: '1000000',
    feeReceiver: receiver.toBase58(),
    raydiumDevnetPoolId: Keypair.generate().publicKey.toBase58(),
    devnetSponsorMaxTxLamports: '50000',
    devnetSponsorDailyCapLamports: '500000',
    devnetSponsorBudgetFile: path.join(budgetDir, `${randomUUID()}.json`),
  };
  let submitted = 0;
  const dependencies = {
    walletProvider: async () => ({ address: owner.publicKey.toBase58(), solLamports: 2000000, sparkd: { amount: '2000000', decimals: 6 } }),
    connection: {
      getLatestBlockhash: async () => ({ blockhash: PublicKey.default.toBase58() }),
      getAccountInfo: async () => ({}),
    },
    koraClient: {
      getPayerSigner: async () => ({ signer_address: sponsor.toBase58() }),
      getSupportedTokens: async () => ({ tokens: [mint.toBase58()] }),
      estimateTransactionFee: async () => ({ fee_in_lamports: 1000 }),
      signAndSendTransaction: async ({ transaction }) => { submitted++; return { signature: 'confirmed-signature', signed_transaction: transaction, signer_pubkey: sponsor.toBase58() }; },
    },
    transactionInspector: async () => ({ success: true, sponsorCostLamports: 1000 }),
    raydiumFactory: async () => ({
      cpmm: {
        getPoolInfoFromRpc: async () => ({
          poolInfo: {
            id: settings.raydiumDevnetPoolId,
            mintA: { address: solMint, programId: TOKEN_PROGRAM_ID.toBase58(), decimals: 9, symbol: 'SOL' },
            mintB: { address: mint.toBase58(), programId: TOKEN_PROGRAM_ID.toBase58(), decimals: 6, symbol: 'TEST' },
          },
          poolKeys: {},
          computePoolInfo: {},
        }),
        computeSwapAmount: () => ({
          amountOut: new BN('5000000'),
          minAmountOut: new BN('4950000'),
          swapResult: { inputAmount: new BN('1000000'), outputAmount: new BN('5000000') },
        }),
        swap: async () => ({ transaction: new Transaction().add(SystemProgram.transfer({ fromPubkey: owner.publicKey, toPubkey: sponsor, lamports: 1 })) }),
      },
    }),
  };
  return { owner, sponsor, mint, receiver, settings, dependencies, submitted: () => submitted };
}

test('builds an expiring Devnet proposal and submits only its exact wallet-signed message once', async t => {
  const h = await createHarness(t);
  const built = await buildDevnetSwap({ address: h.owner.publicKey.toBase58(), amountIn: '1000000', settings: h.settings, dependencies: h.dependencies });
  assert.equal(built.cluster, 'devnet');
  assert.equal(built.swap.inputLamports, '1000000');
  assert.equal(built.appFee.amountBaseUnits, '1000000');
  assert.equal(built.transactionSubmitted, false);

  const original = Transaction.from(Buffer.from(built.unsignedTransaction, 'base64'));
  const tampered = Transaction.from(Buffer.from(built.unsignedTransaction, 'base64'));
  tampered.add(SystemProgram.transfer({ fromPubkey: h.owner.publicKey, toPubkey: h.sponsor, lamports: 2 }));
  tampered.partialSign(h.owner);
  const tamperedWire = tampered.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
  await assert.rejects(submitDevnetSwap({ proposalId: built.proposalId, signedTransaction: tamperedWire, settings: h.settings, dependencies: h.dependencies }), /does not match/);

  original.partialSign(h.owner);
  const signedTransaction = original.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
  const result = await submitDevnetSwap({ proposalId: built.proposalId, signedTransaction, settings: h.settings, dependencies: h.dependencies });
  assert.deepEqual(result, { signature: 'confirmed-signature', cluster: 'devnet', confirmed: true, success: true, appFeeCollected: true, sponsorCostLamports: 1000, sponsorCostVerified: true, sponsorDailyBudgetRemainingLamports: 499000 });
  assert.equal(h.submitted(), 1);
  await assert.rejects(submitDevnetSwap({ proposalId: built.proposalId, signedTransaction, settings: h.settings, dependencies: h.dependencies }), /expired/);
});

test('rejects a Devnet amount above the configured prototype cap before network calls', async t => {
  const h = await createHarness(t);
  await assert.rejects(buildDevnetSwap({ address: h.owner.publicKey.toBase58(), amountIn: '10000001', settings: h.settings, dependencies: h.dependencies }), /no greater than 0.01 SOL/);
});

test('refuses underfunded wallets and estimates above the sponsor per-swap cap', async t => {
  const lowSol = await createHarness(t);
  lowSol.dependencies.walletProvider = async () => ({ address: lowSol.owner.publicKey.toBase58(), solLamports: 999999, sparkd: { amount: '2000000', decimals: 6 } });
  await assert.rejects(buildDevnetSwap({ address: lowSol.owner.publicKey.toBase58(), amountIn: '1000000', settings: lowSol.settings, dependencies: lowSol.dependencies }), /needs more SOL/);

  const lowSparkd = await createHarness(t);
  lowSparkd.dependencies.walletProvider = async () => ({ address: lowSparkd.owner.publicKey.toBase58(), solLamports: 2000000, sparkd: { amount: '999999', decimals: 6 } });
  await assert.rejects(buildDevnetSwap({ address: lowSparkd.owner.publicKey.toBase58(), amountIn: '1000000', settings: lowSparkd.settings, dependencies: lowSparkd.dependencies }), /not have enough test SPARKD/);

  const highEstimate = await createHarness(t);
  highEstimate.dependencies.koraClient.estimateTransactionFee = async () => ({ fee_in_lamports: 50001 });
  await assert.rejects(buildDevnetSwap({ address: highEstimate.owner.publicKey.toBase58(), amountIn: '1000000', settings: highEstimate.settings, dependencies: highEstimate.dependencies }), /exceeds the per-swap Devnet limit/);
});

test('reports a confirmed on-chain failure and records sponsor cost without claiming SPARKD was collected', async t => {
  const h = await createHarness(t);
  h.dependencies.transactionInspector = async () => ({ success: false, sponsorCostLamports: 2500 });
  const built = await buildDevnetSwap({ address: h.owner.publicKey.toBase58(), amountIn: '1000000', settings: h.settings, dependencies: h.dependencies });
  const tx = Transaction.from(Buffer.from(built.unsignedTransaction, 'base64'));
  tx.partialSign(h.owner);
  const signedTransaction = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
  const result = await submitDevnetSwap({ proposalId: built.proposalId, signedTransaction, settings: h.settings, dependencies: h.dependencies });
  assert.equal(result.confirmed, true);
  assert.equal(result.success, false);
  assert.equal(result.appFeeCollected, false);
  assert.equal(result.sponsorCostLamports, 2500);
});
