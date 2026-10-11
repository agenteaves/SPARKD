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
  const base = apiKey ? "https://api.jup.ag" : "https://lite-api.jup.ag";
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  const response = await fetch(
    `${base}/price/v3?ids=${encodeURIComponent(SPARKD_MINT)}`,
    { headers, signal: AbortSignal.timeout(8000) }
  );
  if (!response.ok) throw new Error(`Jupiter price HTTP ${response.status}`);
  const data = await response.json();
  const row = data?.[SPARKD_MINT];
  const priceUsd = Number(row?.usdPrice);
  const liquidityUsd = Number(row?.liquidity);
  const blockId = Number(row?.blockId ?? 0);
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("Jupiter did not return a valid SPARKD/USD price.");
  if (!Number.isFinite(liquidityUsd) || liquidityUsd < MIN_PRICE_LIQUIDITY_USD) {
    throw new Error("SPARKD price liquidity is below the $2,500 safety threshold.");
  }
  return {
    priceUsd,
    liquidityUsd,
    blockId: Number.isFinite(blockId) ? blockId : null,
    source: apiKey ? "jupiter-price-v3" : "jupiter-price-v3-lite"
  };
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
