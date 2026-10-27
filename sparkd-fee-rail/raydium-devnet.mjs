import { Connection, PublicKey } from '@solana/web3.js';
import { Raydium } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';

const READ_ONLY_OWNER = new PublicKey('11111111111111111111111111111111');

export async function getRaydiumDevnetQuote({ poolId, rpcUrl, inputMint, amountIn, slippageBps = 100 }) {
  if (!poolId) throw new Error('No Raydium Devnet CPMM pool is configured.');
  if (!/^\d+$/.test(String(amountIn)) || BigInt(amountIn) <= 0n || BigInt(amountIn) > 10n ** 24n) {
    throw new Error('amountIn must be a positive base-unit integer.');
  }
  if (!Number.isInteger(slippageBps) || slippageBps < 1 || slippageBps > 500) {
    throw new Error('slippageBps must be between 1 and 500.');
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  const raydium = await Raydium.load({ connection, owner: READ_ONLY_OWNER, cluster: 'devnet', disableFeatureCheck: true });
  const { poolInfo, computePoolInfo } = await raydium.cpmm.getPoolInfoFromRpc(poolId);
  const input = new PublicKey(inputMint);
  const mintA = poolInfo.mintA;
  const mintB = poolInfo.mintB;
  const inputIsA = input.toBase58() === mintA.address;
  const inputIsB = input.toBase58() === mintB.address;
  if (!inputIsA && !inputIsB) throw new Error('inputMint is not one of the configured pool assets.');
  const output = inputIsA ? mintB : mintA;
  const quote = raydium.cpmm.computeSwapAmount({
    pool: computePoolInfo,
    amountIn: new BN(String(amountIn)),
    outputMint: output.address,
    slippage: slippageBps / 10_000,
    swapBaseIn: true,
  });

  return {
    mode: 'devnet-live-quote',
    cluster: 'devnet',
    provider: 'Raydium CPMM',
    poolId,
    input: { mint: mintA.address === input.toBase58() ? mintA.address : mintB.address, symbol: inputIsA ? mintA.symbol : mintB.symbol, decimals: inputIsA ? mintA.decimals : mintB.decimals },
    output: { mint: output.address, symbol: output.symbol, decimals: output.decimals },
    amountInBaseUnits: quote.amountIn.toString(),
    amountOutBaseUnits: quote.amountOut.toString(),
    minimumOutBaseUnits: quote.minAmountOut.toString(),
    slippageBps,
    executionPrice: quote.executionPrice.toString(),
    quotedAt: new Date().toISOString(),
    transactionBuilt: false,
    transactionSubmitted: false,
    note: 'Live pool quote from Devnet. No wallet was connected and no transaction was built or sent.',
  };
}
