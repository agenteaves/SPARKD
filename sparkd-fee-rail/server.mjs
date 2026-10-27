import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getDevnetStatus } from './devnet-status.mjs';
import { getRaydiumDevnetQuote } from './raydium-devnet.mjs';
import { getDevnetWalletBalances } from './devnet-wallet.mjs';
import { getDevnetSwapPreview } from './devnet-preview.mjs';
import { buildDevnetSwap, submitDevnetSwap } from './devnet-swap.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, 'index.html');
const walletBundlePath = path.join(here, 'wallet-client.bundle.js');

export function getSettings(env = process.env) {
  const fee = env.SPARKD_FEE_BASE_UNITS ?? '1000000';
  if (!/^\d+$/.test(fee) || BigInt(fee) <= 0n) throw new Error('SPARKD_FEE_BASE_UNITS must be a positive integer in base units.');
  const devnetFee = env.SPARKD_DEVNET_FEE_BASE_UNITS ?? '1000000';
  if (!/^\d+$/.test(devnetFee) || BigInt(devnetFee) <= 0n) throw new Error('SPARKD_DEVNET_FEE_BASE_UNITS must be a positive integer in base units.');
  const sponsorMaxTxLamports = env.DEVNET_SPONSOR_MAX_TX_LAMPORTS ?? '5000000';
  const sponsorDailyCapLamports = env.DEVNET_SPONSOR_DAILY_CAP_LAMPORTS ?? '50000000';
  for (const [name, value] of [['DEVNET_SPONSOR_MAX_TX_LAMPORTS', sponsorMaxTxLamports], ['DEVNET_SPONSOR_DAILY_CAP_LAMPORTS', sponsorDailyCapLamports]]) {
    if (!/^\d+$/.test(value) || BigInt(value) <= 0n || BigInt(value) > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${name} must be a positive integer within the safe numeric range in lamports.`);
  }
  if (BigInt(sponsorDailyCapLamports) < BigInt(sponsorMaxTxLamports)) throw new Error('DEVNET_SPONSOR_DAILY_CAP_LAMPORTS must be at least the per-transaction cap.');
  return {
    port: Number(env.PORT ?? 4173),
    mint: env.SPARKD_MINT ?? 'BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump',
    feeBaseUnits: fee,
    feeReceiver: env.SPARKD_FEE_RECEIVER ?? '',
    sponsorConfigured: Boolean(env.KORA_RPC_URL),
    koraRpcUrl: env.KORA_RPC_URL ?? '',
    koraApiKey: env.KORA_API_KEY ?? '',
    koraEstimationFeeToken: env.KORA_ESTIMATION_FEE_TOKEN ?? '',
    devnetSponsorMaxTxLamports: sponsorMaxTxLamports,
    devnetSponsorDailyCapLamports: sponsorDailyCapLamports,
    devnetSponsorBudgetFile: env.DEVNET_SPONSOR_BUDGET_FILE ?? '',
    devnetRpcUrl: env.DEVNET_RPC_URL ?? 'https://api.devnet.solana.com',
    sparkdDevnetMint: env.SPARKD_DEVNET_MINT ?? '',
    sparkdDevnetFeeBaseUnits: devnetFee,
    raydiumDevnetPoolId: env.RAYDIUM_DEVNET_POOL_ID ?? '8qafQAbCZnzUuBkv5zBjxADpK8UHjSBpAJTK2nSmB5Z4',
    raydiumDevnetApi: env.RAYDIUM_DEVNET_API ?? 'https://api-v3-devnet.raydium.io',
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
  const devnetTransactionConfigured = Boolean(settings.sponsorConfigured && settings.sparkdDevnetMint && settings.feeReceiver);
  return {
    mode: 'demo',
    ready: false,
    checks: [
      { name: 'SPARKD fee receiver', ok: Boolean(settings.feeReceiver), detail: settings.feeReceiver ? 'Address configured' : 'Set SPARKD_FEE_RECEIVER before transaction integration' },
      { name: 'SOL fee sponsor', ok: settings.sponsorConfigured, detail: settings.sponsorConfigured ? 'Kora endpoint configured' : 'Configure a Kora paymaster or equivalent sponsor to pay SOL network fees' },
      { name: 'Devnet quote and preview', ok: true, detail: 'The Devnet tab reads Raydium quotes and previews the required swap input and test-SPARKD balance.' },
      { name: 'Devnet atomic swap + app fee', ok: devnetTransactionConfigured, detail: devnetTransactionConfigured ? 'A Devnet swap transaction combines Raydium instructions with the test-SPARKD fee transfer and uses Pimlico as fee payer.' : 'Configure the Devnet sponsor, test SPARKD mint, and fee receiver.' },
      { name: 'Mainnet release', ok: false, detail: 'Mainnet wallet and transaction flow, production fee configuration, monitoring, and security review are not complete.' },
    ],
    note: 'Target experience: users pay SPARKD in the app; the app sponsor pays Solana network fees in SOL.',
  };
}

export function createAppServer(settings = getSettings(), dependencies = {}) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    res.setHeader('cache-control', 'no-store');
    if (req.method === 'POST' && ['/api/devnet/build', '/api/devnet/submit'].includes(url.pathname)) {
      try {
        const body = await readJsonBody(req);
        const result = url.pathname.endsWith('/build')
          ? await (dependencies.buildProvider ?? buildDevnetSwap)({ address: body.address, amountIn: body.amountIn, settings, dependencies: dependencies.swapDependencies })
          : await (dependencies.submitProvider ?? submitDevnetSwap)({ proposalId: body.proposalId, signedTransaction: body.signedTransaction, settings, dependencies: dependencies.swapDependencies });
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: safeError(error, settings) }));
      }
      return;
    }
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
    if (url.pathname === '/api/devnet/status') {
      const status = await getDevnetStatus(settings, { fetchImpl: dependencies.fetchImpl ?? fetch });
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(status));
      return;
    }
    if (url.pathname === '/api/devnet/quote') {
      try {
        const quote = await (dependencies.quoteProvider ?? getRaydiumDevnetQuote)({
          poolId: settings.raydiumDevnetPoolId,
          rpcUrl: settings.devnetRpcUrl,
          inputMint: url.searchParams.get('inputMint') ?? '',
          amountIn: url.searchParams.get('amountIn') ?? '',
        });
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(quote));
      } catch (error) {
        res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: String(error?.message ?? 'Unable to retrieve Devnet quote.') }));
      }
      return;
    }
    if (url.pathname === '/api/devnet/wallet') {
      try {
        const wallet = await (dependencies.walletProvider ?? getDevnetWalletBalances)({
          address: url.searchParams.get('address') ?? '',
          rpcUrl: settings.devnetRpcUrl,
          mint: settings.sparkdDevnetMint,
        });
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(wallet));
      } catch (error) {
        res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: String(error?.message ?? 'Unable to read the Devnet wallet.') }));
      }
      return;
    }
    if (url.pathname === '/api/devnet/preview') {
      try {
        const preview = await (dependencies.previewProvider ?? getDevnetSwapPreview)({
          address: url.searchParams.get('address') ?? '',
          amountIn: url.searchParams.get('amountIn') ?? '',
          settings,
          walletProvider: dependencies.walletProvider,
          quoteProvider: dependencies.quoteProvider,
        });
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(preview));
      } catch (error) {
        res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: String(error?.message ?? 'Unable to preview the Devnet swap.') }));
      }
      return;
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(await readFile(htmlPath));
      return;
    }
    if (url.pathname === '/wallet-client.bundle.js') {
      try {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' }).end(await readFile(walletBundlePath));
      } catch {
        res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' }).end('Run npm run build before opening the wallet flow.');
      }
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'Not found' }));
  });
}

function safeError(error, settings) {
  let message = String(error?.message ?? 'Unable to prepare the Devnet swap.');
  for (const secret of [settings.koraRpcUrl, settings.koraApiKey]) {
    if (secret) message = message.split(secret).join('[sponsor credential redacted]');
  }
  return message.replace(/([?&]apikey=)[^&\s]+/gi, '$1[redacted]').replace(/[\r\n]/g, ' ').slice(0, 240);
}

async function readJsonBody(req, maxBytes = 16_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('Request body is too large.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
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
  const { build } = await import('esbuild');
  await build({ entryPoints: [path.join(here, 'wallet-client.mjs')], bundle: true, format: 'esm', platform: 'browser', target: 'es2020', outfile: walletBundlePath });
  const server = createAppServer(settings);
  server.listen(settings.port, '127.0.0.1', () => console.log(`SPARKD Fee Rail local console: http://127.0.0.1:${settings.port}`));
}
