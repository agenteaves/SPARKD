import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SPARKD_MINT = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";
const SPARKD_DECIMALS = 6;
const TARGET_ENTRY_USD = 3;
const MIN_PRICE_LIQUIDITY_USD = 2500;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

async function getJupiterPrice() {
  const apiKey = Deno.env.get("JUPITER_API_KEY");
  const endpoints = apiKey
    ? [
        { base: "https://api.jup.ag", apiKey, source: "jupiter-price-v3" },
        { base: "https://lite-api.jup.ag", source: "jupiter-price-v3-lite" }
      ]
    : [{ base: "https://lite-api.jup.ag", source: "jupiter-price-v3-lite" }];

  let response: Response | null = null;
  let source: string | null = null;
  let lastError = "SPARKD price service is unavailable.";
  for (const endpoint of endpoints) {
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (endpoint.apiKey) headers["x-api-key"] = endpoint.apiKey;
    try {
      response = await fetch(
        `${endpoint.base}/price/v3?ids=${encodeURIComponent(SPARKD_MINT)}`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }
    if (response.ok) {
      source = endpoint.source;
      break;
    }
    lastError = `Jupiter price HTTP ${response.status}`;
    response = null;
  }

  let priceUsd: number;
  let liquidityUsd: number | null;
  let blockId: number | null = null;
  if (response?.ok && source) {
    const data = await response.json();
    const row = data?.[SPARKD_MINT];
    priceUsd = Number(row?.usdPrice);
    const parsedLiquidity = Number(row?.liquidity);
    blockId = Number(row?.blockId ?? 0);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("Jupiter did not return a valid SPARKD/USD price.");
    if (!Number.isFinite(parsedLiquidity) || parsedLiquidity < MIN_PRICE_LIQUIDITY_USD) {
      throw new Error("SPARKD price liquidity is below the $2,500 safety threshold.");
    }
    liquidityUsd = parsedLiquidity;
  } else {
    const pumpResponse = await fetch(
      `https://frontend-api-v3.pump.fun/coins-v2/${SPARKD_MINT}`,
      { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(8000) }
    );
    if (!pumpResponse.ok) throw new Error(lastError);
    const data = await pumpResponse.json();
    const coin = Array.isArray(data) ? data[0] : (data?.coin || data);
    const supplyRaw = Number(coin?.total_supply_str ?? coin?.total_supply);
    const supplyTokens = supplyRaw / (10 ** SPARKD_DECIMALS);
    const marketCapUsd = Number(coin?.usd_market_cap ?? coin?.usdMarketCap ?? coin?.market_cap_usd);
    const realSolReserves = Number(coin?.real_sol_reserves ?? 0);
    if (
      coin?.mint !== SPARKD_MINT ||
      (coin?.token_program && coin.token_program !== "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb") ||
      !Number.isFinite(supplyTokens) ||
      supplyTokens <= 0 ||
      !Number.isFinite(marketCapUsd) ||
      marketCapUsd < MIN_PRICE_LIQUIDITY_USD ||
      !Number.isFinite(realSolReserves) ||
      realSolReserves < 1000000000
    ) {
      throw new Error("Jupiter is rate limited and Pump did not return a safe SPARKD quote.");
    }
    priceUsd = marketCapUsd / supplyTokens;
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("Pump did not return a valid SPARKD/USD price.");
    liquidityUsd = null;
    source = "pump-fun-market-cap-fallback";
  }
  return { priceUsd, liquidityUsd, blockId, source };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const price = await getJupiterPrice();
    const rawBurnAmount = BigInt(Math.ceil(
      (TARGET_ENTRY_USD / price.priceUsd) * (10 ** SPARKD_DECIMALS)
    ));
    if (rawBurnAmount <= 0n || rawBurnAmount > 1000000000000000n) {
      throw new Error("The $3 SPARKD entry quote is outside the token supply range.");
    }
    const burnSparkd = Number(rawBurnAmount) / (10 ** SPARKD_DECIMALS);
    return json({
      success: true,
      mode: "live-price",
      mint: SPARKD_MINT,
      targetEntryUsd: TARGET_ENTRY_USD,
      priceUsd: price.priceUsd,
      estimatedEntryUsd: burnSparkd * price.priceUsd,
      burnSparkd,
      rawBurnAmount: rawBurnAmount.toString(),
      decimals: SPARKD_DECIMALS,
      priceSource: price.source,
      priceLiquidityUsd: price.liquidityUsd,
      priceBlockId: price.blockId,
      observedAt: new Date().toISOString(),
      quoteExpiresAt: new Date(Date.now() + 120000).toISOString(),
      readOnly: true,
      burnsPerformed: false,
      transfersPerformed: false
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unable to quote the $3 SPARKD entry burn."
    }, 503);
  }
});
