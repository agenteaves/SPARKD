import test from 'node:test';
import assert from 'node:assert/strict';
import { getSettings, createQuote, getStatus, createAppServer } from './server.mjs';

test('defaults to a non-submitting SPARKD-only user fee with sponsor-paid SOL network fee', () => {
  const settings = getSettings({});
  const quote = createQuote(settings);
  assert.equal(quote.mode, 'demo');
  assert.equal(quote.canSubmitTransaction, false);
  assert.equal(quote.mint, 'BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump');
  assert.equal(quote.networkFeeCurrency, 'SOL');
  assert.equal(quote.userNeedsSolForNetworkFee, false);
  assert.equal(quote.sponsorPaysSolNetworkFee, true);
});

test('rejects invalid fee base units', () => {
  assert.throws(() => getSettings({ SPARKD_FEE_BASE_UNITS: '1.5' }), /positive integer/);
  assert.throws(() => getSettings({ SPARKD_FEE_BASE_UNITS: '0' }), /positive integer/);
});

test('reports swap integration as not ready in the isolated demo', () => {
  const status = getStatus(getSettings({}));
  assert.equal(status.mode, 'demo');
  assert.equal(status.ready, false);
  assert.equal(status.checks[1].ok, false);
});

test('serves the local console and quote endpoint', async (t) => {
  const server = createAppServer(getSettings({}));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /SPARKD Swap · Product Lab/);
  const quote = await fetch(`${base}/api/quote`).then((r) => r.json());
  assert.equal(quote.token, 'SPARKD');
  assert.equal(quote.canSubmitTransaction, false);
  assert.equal(quote.networkFeeCurrency, 'SOL');
  assert.equal(quote.userNeedsSolForNetworkFee, false);
});

test('serves a Raydium Devnet quote through the injected read-only quote provider', async (t) => {
  const server = createAppServer(getSettings({ RAYDIUM_DEVNET_POOL_ID: 'pool-id' }), {
    quoteProvider: async ({ poolId, inputMint, amountIn }) => ({ mode: 'devnet-live-quote', poolId, inputMint, amountIn, transactionSubmitted: false }),
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/devnet/quote?inputMint=So11111111111111111111111111111111111111112&amountIn=1000000`);
  assert.equal(response.status, 200);
  const quote = await response.json();
  assert.equal(quote.mode, 'devnet-live-quote');
  assert.equal(quote.poolId, 'pool-id');
  assert.equal(quote.transactionSubmitted, false);
});

test('reads Devnet wallet balances without exposing sponsor settings', async (t) => {
  let received;
  const server = createAppServer(getSettings({
    DEVNET_RPC_URL: 'https://devnet.example/rpc',
    SPARKD_DEVNET_MINT: 'test-mint',
    KORA_RPC_URL: 'https://sponsor.example/rpc?apikey=secret',
  }), {
    walletProvider: async (args) => {
      received = args;
      return { cluster: 'devnet', address: args.address, solLamports: 5, sparkd: { mint: args.mint, amount: '12', decimals: 6 }, readOnly: true };
    },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/devnet/wallet?address=wallet-address`);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.cluster, 'devnet');
  assert.equal(result.sparkd.amount, '12');
  assert.equal(result.readOnly, true);
  assert.deepEqual(received, { address: 'wallet-address', rpcUrl: 'https://devnet.example/rpc', mint: 'test-mint' });
  assert.equal(JSON.stringify(result).includes('secret'), false);
});

test('rejects invalid Devnet wallet addresses before making an RPC request', async () => {
  const { getDevnetWalletBalances } = await import('./devnet-wallet.mjs');
  await assert.rejects(getDevnetWalletBalances({ address: 'not-a-solana-address', rpcUrl: 'https://unused.invalid' }), /valid Solana wallet address/);
});

test('builds a read-only Devnet swap and SPARKD fee preview with balance checks', async () => {
  const { getDevnetSwapPreview } = await import('./devnet-preview.mjs');
  const settings = getSettings({
    DEVNET_RPC_URL: 'https://devnet.example/rpc',
    SPARKD_DEVNET_MINT: 'test-mint',
    SPARKD_DEVNET_FEE_BASE_UNITS: '1000000',
    SPARKD_FEE_RECEIVER: 'fee-receiver',
  });
  const preview = await getDevnetSwapPreview({
    address: 'wallet',
    amountIn: '1000000',
    settings,
    walletProvider: async () => ({ address: 'wallet', solLamports: 2000000, sparkd: { mint: 'test-mint', amount: '2000000', decimals: 6 } }),
    quoteProvider: async () => ({ poolId: 'pool', output: { mint: 'out-mint', symbol: 'TEST', decimals: 6 }, amountOutBaseUnits: '750000', minimumOutBaseUnits: '742500', slippageBps: 100, quotedAt: 'now' }),
  });
  assert.equal(preview.mode, 'devnet-preview-only');
  assert.equal(preview.checks.enoughSwapInput, true);
  assert.equal(preview.checks.enoughSparkd, true);
  assert.equal(preview.appFee.amountBaseUnits, '1000000');
  assert.equal(preview.canRequestSignature, false);
  assert.equal(preview.transactionSubmitted, false);
});
