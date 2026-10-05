const RPC_ENDPOINTS = [
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet.solana.com",
];
const SPARKD_MINT = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";
const ALLOWED_ORIGINS = new Set([
  "https://sparkdcoin.com",
  "https://www.sparkdcoin.com",
]);

function corsHeaders(origin) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://sparkdcoin.com";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "apikey, content-type, authorization, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

function jsonResponse(origin, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function amountToCents(value) {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value ?? "0"));
  if (!match) throw new Error("RPC returned an invalid token amount.");
  const fraction = (match[2] ?? "") + "00";
  return BigInt(match[1]) * 100n + BigInt(fraction.slice(0, 2));
}

function formatCents(cents) {
  return String(cents / 100n) + "." + String(cents % 100n).padStart(2, "0");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse(origin, { error: "Origin not allowed." }, 403);
  }
  if (req.method !== "POST") {
    return jsonResponse(origin, { error: "Method not allowed." }, 405);
  }

  try {
    const body = await req.json();
    const owner = body?.owner;
    if (typeof owner !== "string" || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(owner)) {
      return jsonResponse(origin, { error: "A valid Solana wallet address is required." }, 400);
    }

    const requestBody = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [owner, { mint: SPARKD_MINT }, { encoding: "jsonParsed" }],
    });

    let accounts = null;
    let lastError = null;

    for (const endpoint of RPC_ENDPOINTS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("RPC HTTP " + response.status);

        const data = await response.json();
        if (data?.error) throw new Error(data.error.message || "RPC request failed.");
        if (!Array.isArray(data?.result?.value)) {
          throw new Error("RPC returned an invalid balance response.");
        }
        accounts = data.result.value;
        break;
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timer);
      }
    }

    if (!accounts) {
      console.error("SPARKD balance RPC providers failed.", lastError);
      return jsonResponse(
        origin,
        { error: "Balance service temporarily unavailable. Please try again shortly." },
        503,
      );
    }

    let totalCents = 0n;
    for (const account of accounts) {
      const tokenAmount = account?.account?.data?.parsed?.info?.tokenAmount;
      totalCents += amountToCents(tokenAmount?.uiAmountString ?? "0");
    }

    return jsonResponse(origin, { balance: formatCents(totalCents) });
  } catch (error) {
    console.error("SPARKD balance lookup failed.", error);
    return jsonResponse(origin, { error: "Could not read SPARKD balance." }, 500);
  }
});
