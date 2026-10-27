const DEFAULT_DEVNET_RPC = 'https://api.devnet.solana.com';
const DEFAULT_RAYDIUM_DEVNET_API = 'https://api-v3-devnet.raydium.io';
const RAYDIUM_DEVNET_CPMM_PROGRAM = 'DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb';

export async function getDevnetStatus(settings, { fetchImpl = fetch, timeoutMs = 5000 } = {}) {
  const checks = [];
  const rpcUrl = settings.devnetRpcUrl || DEFAULT_DEVNET_RPC;
  const mint = settings.sparkdDevnetMint || '';
  const poolId = settings.raydiumDevnetPoolId || '';
  const raydiumApi = settings.raydiumDevnetApi || DEFAULT_RAYDIUM_DEVNET_API;

  const rpc = await probeJsonRpc(fetchImpl, rpcUrl, 'getHealth', {}, timeoutMs);
  checks.push({
    id: 'devnet_rpc',
    name: 'Solana Devnet RPC',
    ok: rpc.ok,
    detail: rpc.ok ? 'Devnet RPC responded to getHealth.' : rpc.detail,
  });

  const pool = poolId ? await probeRaydiumPool(fetchImpl, raydiumApi, poolId, timeoutMs) : null;
  checks.push({
    id: 'raydium_pool',
    name: 'Raydium Devnet CPMM pool',
    ok: Boolean(pool?.ok),
    detail: pool?.ok
      ? `Pool exists in Raydium Devnet metadata (${pool.mintA} / ${pool.mintB}); on-chain quote still needs an initialized wallet and input asset.`
      : pool?.detail ?? 'Set RAYDIUM_DEVNET_POOL_ID to a verified Devnet CPMM pool.',
  });

  checks.push({
    id: 'sparkd_devnet_mint',
    name: 'Test SPARKD mint',
    ok: Boolean(mint),
    detail: mint ? 'Devnet test mint configured; this is not the production SPARKD mint.' : 'Create or select a disposable Devnet test token and set SPARKD_DEVNET_MINT.',
  });

  if (!settings.koraRpcUrl) {
    checks.push({ id: 'kora_rpc', name: 'Kora sponsor RPC', ok: false, detail: 'Set KORA_RPC_URL to a Devnet Kora endpoint.' });
    checks.push({ id: 'kora_token', name: 'SPARKD accepted by sponsor', ok: false, detail: 'Cannot check the sponsor token allowlist until Kora is configured.' });
  } else {
    const [config, tokens] = await Promise.all([
      probeJsonRpc(fetchImpl, settings.koraRpcUrl, 'getConfig', {}, timeoutMs, settings.koraApiKey),
      probeJsonRpc(fetchImpl, settings.koraRpcUrl, 'getSupportedTokens', {}, timeoutMs, settings.koraApiKey),
    ]);
    checks.push({
      id: 'kora_rpc',
      name: 'Kora sponsor RPC',
      ok: config.ok && tokens.ok,
      detail: config.ok && tokens.ok ? 'Kora responded to config and supported-token checks; no transaction was signed.' : [config, tokens].filter(x => !x.ok).map(x => x.detail).join(' '),
    });
    const allowed = mint && (includesMint(config.result, mint) || includesMint(tokens.result, mint));
    checks.push({
      id: 'kora_token',
      name: 'SPARKD accepted by sponsor',
      ok: Boolean(allowed),
      detail: !mint ? 'Set SPARKD_DEVNET_MINT before checking token support.' : allowed ? 'The configured Devnet test mint appears in Kora’s returned configuration.' : 'The test mint was not found in Kora’s returned paid-token configuration.',
    });
  }

  return {
    mode: 'devnet-readiness-only',
    readyToSubmit: false,
    checks,
    note: 'Read-only checks only. This endpoint never signs, sends, or funds a transaction.',
  };
}

async function probeRaydiumPool(fetchImpl, baseUrl, poolId, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/pools/info/ids?ids=${encodeURIComponent(poolId)}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return { ok: false, detail: `Raydium Devnet pool lookup returned HTTP ${response.status}.` };
    const payload = await response.json();
    const pool = payload?.success && Array.isArray(payload.data) ? payload.data.find(item => item.id === poolId) : null;
    if (!pool) return { ok: false, detail: 'Raydium Devnet did not return this pool ID.' };
    if (pool.programId !== RAYDIUM_DEVNET_CPMM_PROGRAM || pool.type !== 'Standard') {
      return { ok: false, detail: 'The configured pool is not a Raydium Devnet CPMM pool supported by this test path.' };
    }
    const mintA = pool.mintA?.address;
    const mintB = pool.mintB?.address;
    if (!mintA || !mintB) return { ok: false, detail: 'Raydium returned incomplete pool mint metadata.' };
    return { ok: true, mintA, mintB };
  } catch (error) {
    const detail = error?.name === 'AbortError' ? 'Raydium Devnet pool lookup timed out.' : 'Could not reach Raydium Devnet metadata.';
    return { ok: false, detail };
  } finally {
    clearTimeout(timer);
  }
}

async function probeJsonRpc(fetchImpl, endpoint, method, params, timeoutMs, apiKey = '') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { 'content-type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!response.ok) return { ok: false, detail: `${method} returned HTTP ${response.status}.` };
    const payload = await response.json();
    if (payload.error) return { ok: false, detail: `${method} failed: ${safeMessage(payload.error.message)}.` };
    return { ok: true, result: payload.result };
  } catch (error) {
    const detail = error?.name === 'AbortError' ? `${method} timed out.` : `${method} could not reach the configured endpoint.`;
    return { ok: false, detail };
  } finally {
    clearTimeout(timer);
  }
}

function includesMint(value, mint) {
  if (!value || !mint) return false;
  if (typeof value === 'string') return value === mint;
  if (Array.isArray(value)) return value.some(item => includesMint(item, mint));
  if (typeof value === 'object') return Object.entries(value).some(([key, child]) => key === mint || includesMint(child, mint));
  return false;
}

function safeMessage(message) {
  return String(message ?? 'unknown error').replace(/[\r\n]/g, ' ').slice(0, 160);
}
