import { getDevnetWalletBalances } from './devnet-wallet.mjs';
import { getRaydiumDevnetQuote } from './raydium-devnet.mjs';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export async function getDevnetSwapPreview({ address, amountIn, settings, walletProvider = getDevnetWalletBalances, quoteProvider = getRaydiumDevnetQuote }) {
  if (!/^\d+$/.test(String(amountIn)) || BigInt(amountIn) <= 0n || BigInt(amountIn) > 10n ** 15n) {
    throw new Error('Swap input must be a positive Devnet SOL amount no greater than 1,000,000 SOL.');
  }
  if (!settings.sparkdDevnetMint) throw new Error('The Devnet test SPARKD mint is not configured.');
  if (!settings.feeReceiver) throw new Error('The Devnet SPARKD fee receiver is not configured.');
  const [wallet, quote] = await Promise.all([
    walletProvider({ address, rpcUrl: settings.devnetRpcUrl, mint: settings.sparkdDevnetMint }),
    quoteProvider({
      poolId: settings.raydiumDevnetPoolId,
      rpcUrl: settings.devnetRpcUrl,
      inputMint: SOL_MINT,
      amountIn: String(amountIn),
    }),
  ]);
  const feeBaseUnits = settings.sparkdDevnetFeeBaseUnits;
  const enoughSparkd = BigInt(wallet.sparkd.amount) >= BigInt(feeBaseUnits);
  const enoughSwapInput = BigInt(wallet.solLamports) >= BigInt(amountIn);
  return {
    mode: 'devnet-preview-only',
    cluster: 'devnet',
    wallet: { address: wallet.address, solLamports: wallet.solLamports, sparkd: wallet.sparkd },
    swap: {
      input: { mint: SOL_MINT, amountBaseUnits: String(amountIn), decimals: 9 },
      output: { mint: quote.output.mint, amountBaseUnits: quote.amountOutBaseUnits, minimumBaseUnits: quote.minimumOutBaseUnits, decimals: quote.output.decimals, symbol: quote.output.symbol },
      poolId: quote.poolId,
      slippageBps: quote.slippageBps,
      quotedAt: quote.quotedAt,
    },
    appFee: { mint: settings.sparkdDevnetMint, receiver: settings.feeReceiver, amountBaseUnits: feeBaseUnits, decimals: wallet.sparkd.decimals },
    checks: { enoughSwapInput, enoughSparkd },
    canRequestSignature: false,
    transactionSubmitted: false,
    note: 'Preview only. User SOL is trade input; the sponsor pays network fees. No transaction was built or signed.',
  };
}
