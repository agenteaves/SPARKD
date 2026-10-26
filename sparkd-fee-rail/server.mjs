import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, 'index.html');

export function getSettings(env = process.env) {
  const fee = env.SPARKD_FEE_BASE_UNITS ?? '1000000';
  if (!/^\d+$/.test(fee) || BigInt(fee) <= 0n) throw new Error('SPARKD_FEE_BASE_UNITS must be a positive integer in base units.');
  return {
    port: Number(env.PORT ?? 4173),
    mint: env.SPARKD_MINT ?? 'BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump',
    feeBaseUnits: fee,
    treasury: env.SPARKD_TREASURY ?? '',
    koraRpcUrl: env.KORA_RPC_URL ?? '',
    koraApiKey: env.KORA_API_KEY ?? '',
    koraHmacSecret: env.KORA_HMAC_SECRET ?? '',
  };
}

export function createQuote(settings) {
  return {
    mode: settings.koraRpcUrl ? 'kora-configured' : 'demo',
    token: 'SPARKD',
    mint: settings.mint,
    feeBaseUnits: settings.feeBaseUnits,
    treasuryConfigured: Boolean(settings.treasury),
    canSubmitTransaction: false,
    note: 'Prototype quote only. No token transfer or Solana transaction is submitted.',
  };
}

async function koraCall(settings, method, params = {}) {
  const headers = { 'content-type': 'application/json' };
  if (settings.koraApiKey) headers['x-api-key'] = settings.koraApiKey;
  const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  if (settings.koraHmacSecret) {
    const { createHmac } = await import('node:crypto');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    headers['x-timestamp'] = timestamp;
    headers['x-hmac-signature'] = createHmac('sha256', settings.koraHmacSecret).update(timestamp + payload).digest('hex');
  }
  const response = await fetch(settings.koraRpcUrl, { method: 'POST', headers, body: payload, signal: AbortSignal.timeout(5000) });
  const data = await response.json();
  if (!response.ok) throw new Error(`Kora returned HTTP ${response.status}`);
  if (data.error) throw new Error(data.error.message || 'Kora RPC error');
  return data.result;
}

export async function getStatus(settings) {
  if (!settings.koraRpcUrl) return { mode: 'demo', kora: 'not-configured', checks: [], ready: false };
  try {
    const [config, tokens] = await Promise.all([
      koraCall(settings, 'getConfig'),
      koraCall(settings, 'getSupportedTokens'),
    ]);
    const supported = Array.isArray(tokens?.tokens) ? tokens.tokens : [];
    const mintSupported = supported.some((token) => token === settings.mint || token?.mint === settings.mint || token?.address === settings.mint);
    return {
      mode: 'kora-connected',
      kora: 'connected',
      ready: false,
      configurationReady: Boolean(mintSupported && settings.treasury),
      checks: [
        { name: 'Kora RPC', ok: true, detail: 'Connected' },
        { name: 'SPARKD accepted by Kora', ok: mintSupported, detail: mintSupported ? 'Mint appears in Kora supported tokens' : 'SPARKD mint not found in returned supported-token list' },
        { name: 'Fee destination', ok: Boolean(settings.treasury), detail: settings.treasury ? 'Configured' : 'Set SPARKD_TREASURY before testing transfers' },
      ],
      koraConfig: config ? { feePayer: config.fee_payer ?? null } : null,
    };
  } catch (error) {
    return { mode: 'kora-error', kora: 'unreachable', ready: false, checks: [{ name: 'Kora RPC', ok: false, detail: error.message }] };
  }
}

export function createAppServer(settings = getSettings()) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    res.setHeader('cache-control', 'no-store');
    if (req.method !== 'GET') {
      res.writeHead(405, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    if (url.pathname === '/api/quote') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(createQuote(settings)));
      return;
    }
    if (url.pathname === '/api/status') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(await getStatus(settings)));
      return;
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(await readFile(htmlPath));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'Not found' }));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const envText = await readFile(path.join(here, '.env'), 'utf8');
    for (const line of envText.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const settings = getSettings();
  const server = createAppServer(settings);
  server.listen(settings.port, '127.0.0.1', () => console.log(`SPARKD Fee Rail local console: http://127.0.0.1:${settings.port}`));
}
