import test from 'node:test';
import assert from 'node:assert/strict';
import { getSettings, createQuote, getStatus, createAppServer } from './server.mjs';

test('defaults to a non-submitting SPARKD app-fee quote paid alongside a SOL network fee', () => {
  const settings = getSettings({});
  const quote = createQuote(settings);
  assert.equal(quote.mode, 'demo');
  assert.equal(quote.canSubmitTransaction, false);
  assert.equal(quote.mint, 'BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump');
  assert.equal(quote.networkFeeCurrency, 'SOL');
  assert.equal(quote.userNeedsSolForNetworkFee, true);
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
  assert.match(await page.text(), /SPARKD Swap Fee/);
  const quote = await fetch(`${base}/api/quote`).then((r) => r.json());
  assert.equal(quote.token, 'SPARKD');
  assert.equal(quote.canSubmitTransaction, false);
  assert.equal(quote.networkFeeCurrency, 'SOL');
});
