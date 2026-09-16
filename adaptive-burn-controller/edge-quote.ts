import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SPARKD_MINT = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";
const TARGET_ENTRY_USD = 1;
const LEGACY_BURN_SPARKD = 2000;
const MIN_BURN_SPARKD = 100;
const MAX_BURN_SPARKD = 200000;
const ASSUMED_PUMP_DISPLAY_SUPPLY = 1_000_000_000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function getActualSupply() {
  const rpcUrl = Deno.env.get("SOLANA_RPC_URL");
  if (!rpcUrl) return null;
  try {
    const r = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenSupply",
        params: [SPARKD_MINT, { commitment: "confirmed" }],
      }),
    });
    const x = await r.json();
    const amount = Number(x?.result?.value?.uiAmountString);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  } catch {
    return null;
  }
}

async function getPumpPrice() {
  // Pump's own server-side coin endpoint. Pump's current market-cap convention
  // uses price x 1B tokens; deriving unit price this way deliberately does NOT
  // use SPARKD's reduced post-burn supply as the denominator.
  const coinUrl = `https://frontend-api-v3.pump.fun/coins-v2/${SPARKD_MINT}`;
  const r = await fetch(coinUrl, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`Pump coin quote HTTP ${r.status}`);
  const data = await r.json();
  const coin = Array.isArray(data) ? data[0] : (data?.coin || data);
  if (coin?.mint && coin.mint !== SPARKD_MINT) throw new Error("Pump quote mint mismatch");

  const usdMarketCap = Number(coin?.usd_market_cap ?? coin?.usdMarketCap);
  if (!Number.isFinite(usdMarketCap) || usdMarketCap <= 0) {
    throw new Error("Pump quote did not contain a valid USD market cap");
  }
  const priceUsd = usdMarketCap / ASSUMED_PUMP_DISPLAY_SUPPLY;
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("Invalid derived SPARKD price");

  return {
    priceUsd,
    usdMarketCap,
    graduated: coin?.complete === true,
    pumpSwapPool: coin?.pump_swap_pool || coin?.pumpSwapPool || null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET" && req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const observedAt = new Date().toISOString();
  const actualSupplySparkd = await getActualSupply();

  try {
    const quote = await getPumpPrice();
    const raw = TARGET_ENTRY_USD / quote.priceUsd;
    const burnSparkd = Math.round(Math.min(MAX_BURN_SPARKD, Math.max(MIN_BURN_SPARKD, raw)));

    return json({
      success: true,
      mode: "adaptive",
      mint: SPARKD_MINT,
      targetEntryUsd: TARGET_ENTRY_USD,
      priceUsd: quote.priceUsd,
      estimatedEntryUsd: burnSparkd * quote.priceUsd,
      burnSparkd,
      minBurnSparkd: MIN_BURN_SPARKD,
      maxBurnSparkd: MAX_BURN_SPARKD,
      actualSupplySparkd,
      graduated: quote.graduated,
      pumpSwapPool: quote.pumpSwapPool,
      source: "pump.fun server-side coin data",
      observedAt,
      quoteExpiresAt: new Date(Date.now() + 120000).toISOString(),
    });
  } catch (error) {
    // Fail-safe: never invent a price and never block the existing contest.
    return json({
      success: true,
      mode: "legacy-fallback",
      mint: SPARKD_MINT,
      burnSparkd: LEGACY_BURN_SPARKD,
      actualSupplySparkd,
      source: null,
      observedAt,
      quoteExpiresAt: new Date(Date.now() + 30000).toISOString(),
      warning: error instanceof Error ? error.message : "Adaptive quote unavailable",
    });
  }
});
