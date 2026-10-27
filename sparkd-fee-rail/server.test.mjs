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
