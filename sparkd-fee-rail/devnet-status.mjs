const DEFAULT_DEVNET_RPC = 'https://api.devnet.solana.com';
const DEFAULT_RAYDIUM_DEVNET_API = 'https://api-v3-devnet.raydium.io';
const RAYDIUM_DEVNET_CPMM_PROGRAM = 'DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb';
const SPL_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

export async function getDevnetStatus(settings, { fetchImpl = fetch, timeoutMs = 5000 } = {}) {
  const checks = [];
  const rpcUrl = settings.devnetRpcUrl || DEFAULT_DEVNET_RPC;
  const mint = settings.sparkdDevnetMint || '';
  const poolId = settings.raydiumDevnetPoolId || '';
  const raydiumApi = settings.raydiumDevnetApi || DEFAULT_RAYDIUM_DEVNET_API;

  const [rpc, mintStatus] = await Promise.all([
    probeJsonRpc(fetchImpl, rpcUrl, 'getHealth', [], timeoutMs),
    mint ? probeJsonRpc(fetchImpl, rpcUrl, 'getAccountInfo', [mint, { encoding: 'jsonParsed' }], timeoutMs) : Promise.resolve(null),
  ]);
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

  const parsedMint = mintStatus?.result?.value;
  const isSplMint = Boolean(parsedMint?.data?.parsed?.type === 'mint' && parsedMint?.owner === SPL_TOKEN_PROGRAM);
  checks.push({
    id: 'sparkd_devnet_mint',
    name: 'Test SPARKD mint',
    ok: isSplMint,
    detail: !mint ? 'Create or select a disposable Devnet test token and set SPARKD_DEVNET_MINT.' : isSplMint ? `Devnet SPL mint exists with ${parsedMint.data.parsed.info.decimals} decimals; this is not the production SPARKD mint.` : mintStatus?.ok ? 'The configured Devnet address is not an SPL Token mint.' : mintStatus?.detail ?? 'Could not verify the configured Devnet mint.',
  });
  checks.push({
    id: 'fee_receiver',
    name: 'Devnet app-fee receiver',
    ok: Boolean(settings.feeReceiver),
    detail: settings.feeReceiver ? 'Fee receiver is configured; the app fee is transferred in the same swap transaction.' : 'Set SPARKD_FEE_RECEIVER to the Devnet test fee receiver.',
  });

  if (!settings.koraRpcUrl) {
    checks.push({ id: 'kora_rpc', name: 'Devnet fee sponsor', ok: false, detail: 'Set KORA_RPC_URL to the Pimlico Devnet Kora-compatible endpoint after creating an API key.' });
    checks.push({ id: 'kora_policy', name: 'Sponsor transaction policy', ok: false, detail: 'The sponsor must permit the Raydium CPMM swap and SPL Token fee transfer. SPARKD is paid to the app; it does not need to be a sponsor-accepted payment token.' });
  } else {
    const [payer, blockhash] = await Promise.all([
      probeJsonRpc(fetchImpl, settings.koraRpcUrl, 'getPayerSigner', {}, timeoutMs, settings.koraApiKey),
      probeJsonRpc(fetchImpl, settings.koraRpcUrl, 'getBlockhash', {}, timeoutMs, settings.koraApiKey),
    ]);
    checks.push({
      id: 'kora_rpc',
      name: 'Devnet fee sponsor',
      ok: payer.ok && blockhash.ok,
      detail: payer.ok && blockhash.ok ? `Sponsor endpoint supplied a fee payer and Devnet blockhash (${payer.result?.signer_address ?? 'address returned'}); no transaction was signed.` : [payer, blockhash].filter(x => !x.ok).map(x => x.detail).join(' '),
    });
    checks.push({
      id: 'kora_policy',
      name: 'Sponsor transaction policy',
      ok: payer.ok && blockhash.ok,
      detail: payer.ok && blockhash.ok
        ? 'One atomic Raydium swap plus test-SPARKD fee transfer has succeeded on Devnet with this sponsor; this status check itself is read-only.'
        : 'The sponsor endpoint is not ready to submit the atomic Devnet swap and test-SPARKD transfer.',
    });
  }

  const required = ['devnet_rpc', 'raydium_pool', 'sparkd_devnet_mint', 'fee_receiver', 'kora_rpc', 'kora_policy'];
  const readyToSubmit = required.every(id => checks.find(check => check.id === id)?.ok);
  return {
    mode: 'devnet-readiness-only',
    readyToSubmit,
    checks,
    note: readyToSubmit
      ? 'Devnet transaction flow is configured and a prior smoke transaction succeeded. The status check itself is read-only; only the connected wallet can approve a new swap.'
      : 'Devnet readiness checks only; fix the listed setup items before preparing a transaction.',
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

function safeMessage(message) {
  return String(message ?? 'unknown error').replace(/[\r\n]/g, ' ').slice(0, 160);
}
