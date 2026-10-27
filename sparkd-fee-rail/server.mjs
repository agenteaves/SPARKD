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
    feeReceiver: env.SPARKD_FEE_RECEIVER ?? '',
    sponsorConfigured: Boolean(env.KORA_RPC_URL),
  };
}

export function createQuote(settings) {
  return {
    mode: 'demo',
    feeType: 'application-level swap fee',
    token: 'SPARKD',
    mint: settings.mint,
    feeBaseUnits: settings.feeBaseUnits,
    feeReceiver: settings.feeReceiver,
    feeReceiverConfigured: Boolean(settings.feeReceiver),
    networkFeeCurrency: 'SOL',
    userNeedsSolForNetworkFee: false,
    sponsorPaysSolNetworkFee: true,
    canSubmitTransaction: false,
    note: 'Target experience: user pays in SPARKD; the app sponsor pays the SOL network fee. Demo only; no transaction is submitted.',
  };
}

export function getStatus(settings) {
  return {
    mode: 'demo',
    ready: false,
    checks: [
      { name: 'SPARKD fee receiver', ok: Boolean(settings.feeReceiver), detail: settings.feeReceiver ? 'Address configured' : 'Set SPARKD_FEE_RECEIVER before transaction integration' },
      { name: 'SOL fee sponsor', ok: settings.sponsorConfigured, detail: settings.sponsorConfigured ? 'Kora endpoint configured' : 'Configure a Kora paymaster or equivalent sponsor to pay SOL network fees' },
      { name: 'Swap transaction builder', ok: false, detail: 'Jupiter custom-instruction flow is not connected yet' },
      { name: 'Wallet signing', ok: false, detail: 'No wallet is connected in this local prototype' },
    ],
    note: 'Target experience: users pay SPARKD in the app; the app sponsor pays Solana network fees in SOL.',
  };
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
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(getStatus(settings)));
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
