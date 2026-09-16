import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SPARKD_MINT = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";
const LEGACY_BURN = 2000;
const TARGET_USD = 1.00;
const MIN_BURN = 100;
const MAX_BURN = 200000;
const MAX_STEP_FRACTION = 0.25;
const MIN_LIQUIDITY_USD = 2500;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function rpc(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  if (!response.ok) throw new Error(`Solana RPC HTTP ${response.status}`);
  const result = await response.json();
  if (result?.error) throw new Error(`Solana RPC error: ${JSON.stringify(result.error)}`);
  return result?.result;
}

async function getSupply(rpcUrl: string) {
  const result = await rpc(rpcUrl, "getTokenSupply", [SPARKD_MINT, { commitment: "confirmed" }]);
  const value = result?.value;
  const supply = Number(value?.uiAmountString ?? value?.uiAmount);
  if (!Number.isFinite(supply) || supply <= 0) throw new Error("Invalid SPARKD supply response.");
  return { supply, rawSupply: String(value?.amount ?? ""), decimals: Number(value?.decimals ?? 6) };
}

async function getJupiterPrice() {
  const apiKey = Deno.env.get("JUPITER_API_KEY");
  const base = apiKey ? "https://api.jup.ag" : "https://lite-api.jup.ag";
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  const response = await fetch(`${base}/price/v3?ids=${encodeURIComponent(SPARKD_MINT)}`, { headers });
  if (!response.ok) throw new Error(`Jupiter price HTTP ${response.status}`);
  const data = await response.json();
  const row = data?.[SPARKD_MINT];
  const usdPrice = Number(row?.usdPrice);
  const liquidity = Number(row?.liquidity ?? 0);
  const blockId = Number(row?.blockId ?? 0);
  if (!Number.isFinite(usdPrice) || usdPrice <= 0) throw new Error("Jupiter did not return a reliable SPARKD price.");
  if (Number.isFinite(liquidity) && liquidity > 0 && liquidity < MIN_LIQUIDITY_USD) throw new Error("SPARKD liquidity is below the adaptive-price safety floor.");
  return { usdPrice, liquidity: Number.isFinite(liquidity) ? liquidity : null, blockId: Number.isFinite(blockId) ? blockId : null, source: apiKey ? "jupiter-price-v3" : "jupiter-price-v3-lite" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const rpcUrl = Deno.env.get("SOLANA_RPC_URL");
    if (!rpcUrl) throw new Error("SOLANA_RPC_URL is not configured.");
    const body = await req.json().catch(() => ({}));
    const previousBurnSparkd = Number(body?.previousBurnSparkd ?? LEGACY_BURN);
    const supply = await getSupply(rpcUrl);

    let price: Awaited<ReturnType<typeof getJupiterPrice>> | null = null;
    let fallbackReason: string | null = null;
    try {
      price = await getJupiterPrice();
    } catch (error) {
      fallbackReason = error instanceof Error ? error.message : String(error);
    }

    let burnSparkd = LEGACY_BURN;
    let mode = "legacy-safe";

    if (price) {
      const desired = clamp(TARGET_USD / price.usdPrice, MIN_BURN, MAX_BURN);
      const prior = Number.isFinite(previousBurnSparkd) && previousBurnSparkd > 0 ? previousBurnSparkd : LEGACY_BURN;
      const lower = Math.max(MIN_BURN, prior * (1 - MAX_STEP_FRACTION));
      const upper = Math.min(MAX_BURN, prior * (1 + MAX_STEP_FRACTION));
      burnSparkd = Math.round(clamp(desired, lower, upper));
      mode = "adaptive";
    }

    return json({
      success: true,
      quoteVersion: "1.0.0",
      mint: SPARKD_MINT,
      mode,
      burnSparkd,
      rawBurnAmount: String(BigInt(burnSparkd) * 1000000n),
      targetEntryUsd: TARGET_USD,
      estimatedEntryUsd: price ? burnSparkd * price.usdPrice : null,
      priceUsd: price?.usdPrice ?? null,
      priceSource: price?.source ?? null,
      priceLiquidityUsd: price?.liquidity ?? null,
      priceBlockId: price?.blockId ?? null,
      remainingSupplySparkd: supply.supply,
      remainingSupplyRaw: supply.rawSupply,
      decimals: supply.decimals,
      minBurnSparkd: MIN_BURN,
      maxBurnSparkd: MAX_BURN,
      maxStepFraction: MAX_STEP_FRACTION,
      fallbackReason,
      observedAt: new Date().toISOString(),
      readOnly: true,
      burnsPerformed: false,
      transfersPerformed: false
    });
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
