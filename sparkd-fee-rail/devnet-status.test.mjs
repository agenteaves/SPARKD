import test from 'node:test';
import assert from 'node:assert/strict';
import { getDevnetStatus } from './devnet-status.mjs';

const mint = '11111111111111111111111111111111';
const response = value => ({ ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: value }) });
const poolResponse = id => ({
  ok: true,
  json: async () => ({ success: true, data: [{
    id,
    type: 'Standard',
    programId: 'DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb',
    mintA: { address: 'So11111111111111111111111111111111111111112' },
    mintB: { address: 'HNNrVoAeGXoTvbESC1BZyaALJ6bV5FSLkmrAjKNw2VA2' },
  }] }),
});

test('checks Devnet mint and verifies the Kora-compatible sponsor RPC without a transaction', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    if (!init.method) return poolResponse('pool-id');
    const request = JSON.parse(init.body);
    calls.push({ url, method: request.method, key: init.headers['x-api-key'] });
    if (request.method === 'getHealth') return response('ok');
    if (request.method === 'getAccountInfo') return response({ value: { owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', data: { parsed: { type: 'mint', info: { decimals: 6 } } } } });
    if (request.method === 'getPayerSigner') return response({ signer_address: 'sponsor' });
    if (request.method === 'getBlockhash') return response({ blockhash: 'blockhash' });
    throw new Error('Unexpected method');
  };
  const status = await getDevnetStatus({
    devnetRpcUrl: 'https://devnet.example',
    sparkdDevnetMint: mint,
    feeReceiver: 'fee-receiver',
    raydiumDevnetPoolId: 'pool-id',
    koraRpcUrl: 'http://127.0.0.1:8080',
    koraApiKey: 'test-only',
  }, { fetchImpl });

  assert.equal(status.readyToSubmit, true);
  assert.ok(status.checks.find(check => check.id === 'devnet_rpc').ok);
  assert.ok(status.checks.find(check => check.id === 'sparkd_devnet_mint').ok);
  assert.ok(status.checks.find(check => check.id === 'kora_rpc').ok);
  assert.equal(status.checks.find(check => check.id === 'kora_policy').ok, true);
  assert.equal(status.checks.find(check => check.id === 'fee_receiver').ok, true);
  assert.ok(status.checks.find(check => check.id === 'raydium_pool').ok);
  assert.equal(calls.filter(call => call.method === 'getHealth').length, 1);
  assert.ok(calls.filter(call => call.method.startsWith('get')).every(call => call.key === 'test-only' || call.key === undefined));
});

test('reports missing sponsor and mint setup without attempting transactions', async () => {
  const status = await getDevnetStatus({
    devnetRpcUrl: 'https://devnet.example',
    sparkdDevnetMint: '',
    raydiumDevnetPoolId: '',
    koraRpcUrl: '',
  }, { fetchImpl: async (_url, init) => init.method ? response('ok') : poolResponse('another-pool') });

  assert.equal(status.readyToSubmit, false);
  assert.equal(status.checks.find(check => check.id === 'kora_rpc').ok, false);
  assert.equal(status.checks.find(check => check.id === 'kora_policy').ok, false);
  assert.equal(status.checks.find(check => check.id === 'sparkd_devnet_mint').ok, false);
  assert.match(status.note, /fix the listed setup items/i);
});

test('reports sponsor endpoint errors without leaking credentials', async () => {
  const status = await getDevnetStatus({
    devnetRpcUrl: 'https://devnet.example',
    sparkdDevnetMint: mint,
    raydiumDevnetPoolId: 'pool-id',
    koraRpcUrl: 'https://kora.example',
    koraApiKey: 'secret-value',
  }, { fetchImpl: async (_url, init) => {
    if (!init.method) return poolResponse('pool-id');
    const request = JSON.parse(init.body);
    if (request.method === 'getHealth') return response('ok');
    return { ok: false, status: 401, json: async () => ({}) };
  } });

  const text = JSON.stringify(status);
  assert.match(text, /HTTP 401/);
  assert.doesNotMatch(text, /secret-value/);
});
