import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import {
    PublicKey,
    Transaction,
    TransactionInstruction
} from "npm:@solana/web3.js@1.98.4";


////////////////////////////////////////////////////
// SPARKD CONFIGURATION
////////////////////////////////////////////////////

    const SPARKD_MINT =
        "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump";

    const SPARKD_DECIMALS =
        6;

    const CONTEST_ENTRY_USD = 3;
    const MIN_PRICE_LIQUIDITY_USD = 2500;
    const CONTEST_BURN_QUOTE_TTL_MS = 120000;



////////////////////////////////////////////////////
// CORS
////////////////////////////////////////////////////

const corsHeaders = {

    "Access-Control-Allow-Origin":
        "*",

    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",

    "Access-Control-Allow-Methods":
        "POST, OPTIONS",

    "Access-Control-Max-Age":
        "86400"

};


////////////////////////////////////////////////////
// JSON RESPONSE HELPER
////////////////////////////////////////////////////

function jsonResponse(
    data: unknown,
    status = 200
) {

    return new Response(

        JSON.stringify(data),

        {

            status,

            headers: {

                ...corsHeaders,

                "Content-Type":
                    "application/json"

            }

        }

    );

}


async function getContestBurnQuote() {
    const apiKey = Deno.env.get("JUPITER_API_KEY");
    const endpoints = apiKey
        ? [
            { base: "https://api.jup.ag", apiKey, source: "jupiter-price-v3" },
            { base: "https://lite-api.jup.ag", source: "jupiter-price-v3-lite" }
        ]
        : [{ base: "https://lite-api.jup.ag", source: "jupiter-price-v3-lite" }];

    let response: Response | null = null;
    let priceSource: string | null = null;
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
            priceSource = endpoint.source;
            break;
        }
        lastError = `SPARKD price service returned HTTP ${response.status}.`;
        response = null;
    }

    let priceUsd: number;
    let liquidityUsd: number | null;
    if (response?.ok && priceSource) {
        const data = await response.json();
        const row = data?.[SPARKD_MINT];
        priceUsd = Number(row?.usdPrice);
        const parsedLiquidity = Number(row?.liquidity);
        if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("A valid SPARKD/USD price is unavailable.");
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
        priceSource = "pump-fun-market-cap-fallback";
    }

    const rawAmount = BigInt(Math.ceil((CONTEST_ENTRY_USD / priceUsd) * (10 ** SPARKD_DECIMALS)));
    if (rawAmount <= 0n || rawAmount > 1000000000000000n) throw new Error("The $3 SPARKD entry quote is outside the token supply range.");
    const amount = Number(rawAmount) / (10 ** SPARKD_DECIMALS);
    return {
        priceUsd,
        liquidityUsd,
        priceSource,
        rawAmount: rawAmount.toString(),
        amount,
        estimatedUsd: amount * priceUsd,
        observedAt: new Date().toISOString()
    };
}

function base64UrlEncode(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
}

async function signContestBurnQuote(payload) {
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!secret) throw new Error("Contest quote signing key is unavailable.");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, payloadBytes));
    return `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(signature)}`;
}

async function verifyContestBurnQuote(quoteToken, wallet, contestId, memeID) {
    if (typeof quoteToken !== "string") throw new Error("A server-issued $3 entry quote is required.");
    const parts = quoteToken.split(".");
    if (parts.length !== 2) throw new Error("Invalid contest burn quote.");
    const payloadBytes = base64UrlDecode(parts[0]);
    const signature = base64UrlDecode(parts[1]);
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!secret) throw new Error("Contest quote signing key is unavailable.");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, signature, payloadBytes)) throw new Error("Contest burn quote signature is invalid.");
    let payload;
    try { payload = JSON.parse(new TextDecoder().decode(payloadBytes)); }
    catch { throw new Error("Contest burn quote payload is invalid."); }
    if (
        payload?.wallet !== wallet ||
        payload?.contestId !== contestId ||
        payload?.memeID !== memeID ||
        payload?.entryUsd !== CONTEST_ENTRY_USD ||
        !/^\d+$/.test(String(payload?.rawAmount ?? "")) ||
        !Number.isFinite(Number(payload?.priceUsd)) ||
        Number(payload.priceUsd) <= 0 ||
        !Number.isFinite(Number(payload?.issuedAt)) ||
        !Number.isFinite(Number(payload?.expiresAt)) ||
        Number(payload.expiresAt) <= Number(payload.issuedAt)
    ) throw new Error("Contest burn quote does not match this wallet and entry.");
    return payload;
}

////////////////////////////////////////////////////
// BASE58 ENCODER
//
// Used only to derive the already-signed Solana
// transaction signature before broadcast.
////////////////////////////////////////////////////

function encodeBase58(
    bytes: Uint8Array
) {

    const alphabet =
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    if (
        bytes.length === 0
    ) {
        return "";
    }

    const digits =
        [0];

    for (
        const byte of bytes
    ) {

        let carry =
            byte;

        for (
            let i = 0;
            i < digits.length;
            i++
        ) {

            const value =
                digits[i] * 256 +
                carry;

            digits[i] =
                value % 58;

            carry =
                Math.floor(
                    value / 58
                );
        }

        while (
            carry > 0
        ) {

            digits.push(
                carry % 58
            );

            carry =
                Math.floor(
                    carry / 58
                );
        }
    }

    let leadingZeros =
        0;

    while (
        leadingZeros < bytes.length &&
        bytes[leadingZeros] === 0
    ) {
        leadingZeros++;
    }

    let result =
        "1".repeat(
            leadingZeros
        );

    for (
        let i = digits.length - 1;
        i >= 0;
        i--
    ) {
        result +=
            alphabet[digits[i]];
    }

    return result;
}


////////////////////////////////////////////////////
// SERVER
////////////////////////////////////////////////////

serve(async (req) => {


    ////////////////////////////////////////////////////
    // CORS PREFLIGHT
    ////////////////////////////////////////////////////

    if (
        req.method ===
        "OPTIONS"
    ) {

        return new Response(

            null,

            {

                status:
                    204,

                headers:
                    corsHeaders

            }

        );

    }


    ////////////////////////////////////////////////////
    // ONLY ACCEPT POST
    ////////////////////////////////////////////////////

    if (
        req.method !==
        "POST"
    ) {

        return jsonResponse(

            {

                success:
                    false,

                error:
                    "Method not allowed."

            },

            405

        );

    }


    try {


        ////////////////////////////////////////////////////
        // PRIVATE SOLANA RPC
        ////////////////////////////////////////////////////

        const rpcUrl =
            Deno.env.get(
                "SOLANA_RPC_URL"
            );


        if (!rpcUrl) {

            throw new Error(
                "SOLANA_RPC_URL secret is not configured."
            );

        }

        ////////////////////////////////////////////////////
        // SUPABASE CONNECTION
        ////////////////////////////////////////////////////

        const supabaseUrl =
            Deno.env.get(
                "SUPABASE_URL"
            );


        const serviceRoleKey =
            Deno.env.get(
                "SUPABASE_SERVICE_ROLE_KEY"
            );


        if (
            !supabaseUrl ||
            !serviceRoleKey
        ) {

            throw new Error(
                "Supabase server secrets are not configured."
            );

        }


        ////////////////////////////////////////////////////
        // READ REQUEST
        ////////////////////////////////////////////////////

        let body;

        try {

            body =
                await req.json();

        }
        catch {

            return jsonResponse(

                {

                    success:
                        false,

                    error:
                        "Request body must be valid JSON."

                },

                400

            );

        }


        const wallet =
            body?.wallet ||
            null;

        const contestId =
            body?.contestId ||
            null;

        const tokenAccount =
            body?.tokenAccount ||
            null;


        const action =
            body?.action ||
            null;

        ////////////////////////////////////////////////////
// ACTION: RPC DIAGNOSTIC
//
// READ ONLY
// Returns only the RPC hostname.
// Does NOT expose the secret URL or API key.
////////////////////////////////////////////////////

if (
    action ===
    "rpc_diagnostic"
) {

    let rpcHostname =
        null;

    try {

        rpcHostname =
            new URL(
                rpcUrl
            ).hostname;

    }
    catch {

        rpcHostname =
            "invalid-rpc-url";

    }

    return jsonResponse({

        success:
            true,

        rpcHostname:
            rpcHostname,

        readOnly:
            true

    });

}

 ////////////////////////////////////////////////////
// ACTION: SIMULATE TRANSACTION
//
// READ ONLY
// DOES NOT SIGN
// DOES NOT BROADCAST
// DOES NOT ADVANCE NONCE
// DOES NOT BURN
////////////////////////////////////////////////////

if (
    action ===
    "simulate_transaction"
) {

    const transactionBase64 =
        body?.transactionBase64 ||
        null;

    if (
        typeof transactionBase64 !==
            "string" ||
        transactionBase64.length <
            50
    ) {

        return jsonResponse(
            {
                success:
                    false,

                error:
                    "Invalid transaction."
            },
            400
        );

    }

    const rpcResponse =
        await fetch(
            rpcUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        jsonrpc:
                            "2.0",

                        id:
                            1,

                        method:
                            "simulateTransaction",

                        params: [
                            transactionBase64,
                            {
                                encoding:
                                    "base64",

                                sigVerify:
                                    false,

                                commitment:
                                    "confirmed"
                            }
                        ]
                    })
            }
        );

    const rpcResult =
        await rpcResponse.json();

    return jsonResponse({
        success:
            true,

        readOnly:
            true,

        simulation:
            rpcResult
    });

}

////////////////////////////////////////////////////
// ACTION: GET LATEST BLOCKHASH
//
// READ ONLY
// DOES NOT SIGN
// DOES NOT BROADCAST
// DOES NOT BURN
////////////////////////////////////////////////////

if (
    action ===
    "get_latest_blockhash"
) {

    const rpcResponse =
        await fetch(
            rpcUrl,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        jsonrpc:
                            "2.0",

                        id:
                            1,

                        method:
                            "getLatestBlockhash",

                        params: [
                            {
                                commitment:
                                    "confirmed"
                            }
                        ]
                    })
            }
        );

    const rpcResult =
        await rpcResponse.json();

    const blockhash =
        rpcResult?.result?.value?.blockhash ||
        null;

    const lastValidBlockHeight =
        rpcResult?.result?.value?.lastValidBlockHeight ||
        null;

    if (
        !blockhash ||
        !lastValidBlockHeight
    ) {

        return jsonResponse(
            {
                success:
                    false,

                error:
                    "Unable to retrieve latest blockhash."
            },
            502
        );

    }

    return jsonResponse({
        success:
            true,

        readOnly:
            true,

        blockhash:
            blockhash,

        lastValidBlockHeight:
            lastValidBlockHeight
    });

}

        const forgeData =
            body?.forgeData ||
            null;



        ////////////////////////////////////////////////////
        // ACTION: CHECK SUBMISSION
        //
        // READ ONLY
        //
        // NO DATABASE INSERT
        // NO DATABASE UPDATE
        // NO DATABASE DELETE
        // NO TOKEN TRANSFER
        // NO TOKEN BURN
        ////////////////////////////////////////////////////

        if (
            action ===
            "check_submission"
        ) {


            console.log(
                "🔎 SPARKD checking existing submission..."
            );


            ////////////////////////////////////////////////////
            // VALIDATE WALLET
            ////////////////////////////////////////////////////

            if (
                typeof wallet !==
                    "string" ||
                wallet.length <
                    32 ||
                wallet.length >
                    50
            ) {

                return jsonResponse(

                    {

                        success:
                            false,

                        error:
                            "Invalid wallet address."

                    },

                    400

                );

            }


            ////////////////////////////////////////////////////
            // GET CURRENT CONTEST
            ////////////////////////////////////////////////////

            const contestResponse =
                await fetch(

                    supabaseUrl +
                    "/rest/v1/meme_week_contests" +
                    "?status=eq.submission" +
                    "&week_start=lte." + encodeURIComponent(new Date().toISOString()) +
                    "&week_end=gt." + encodeURIComponent(new Date().toISOString()) +
                    "&order=week_start.desc" +
                    "&select=*" +
                    "&limit=1",

                    {

                        method:
                            "GET",

                        headers: {

                            "apikey":
                                serviceRoleKey,

                            "Authorization":
                                "Bearer " +
                                serviceRoleKey

                        }

                    }

                );


            if (
                !contestResponse.ok
            ) {

                throw new Error(
                    "Unable to retrieve current contest."
                );

            }


            const contests =
                await contestResponse.json();


            const contest =
                contests[0] ||
                null;


            ////////////////////////////////////////////////////
            // GET EXISTING SUBMISSION
            ////////////////////////////////////////////////////

            let submissions =
                [];


            if (
                contest
            ) {

                const submissionResponse =
                    await fetch(

                        supabaseUrl +
                        "/rest/v1/meme_week_submissions" +
                        "?contest_id=eq." +
                        encodeURIComponent(
                            contest.id
                        ) +
                        "&wallet_address=eq." +
                        encodeURIComponent(
                            wallet
                        ) +
                        "&select=*",

                        {

                            method:
                                "GET",

                            headers: {

                                "apikey":
                                    serviceRoleKey,

                                "Authorization":
                                    "Bearer " +
                                    serviceRoleKey

                            }

                        }

                    );


                if (
                    !submissionResponse.ok
                ) {

                    throw new Error(
                        "Unable to retrieve existing submission."
                    );

                }


                submissions =
                    await submissionResponse.json();

            }


            ////////////////////////////////////////////////////
            // RETURN DIAGNOSTIC
            ////////////////////////////////////////////////////

            console.log(

                "🔥 SPARKD EXISTING SUBMISSION:",

                submissions

            );


            return jsonResponse({

                success:
                    true,

                wallet:
                    wallet,

                contest:
                    contest,

                submissionCount:
                    submissions.length,

                submissions:
                    submissions

            });

        }



        ////////////////////////////////////////////////////
// ACTION: PREVIOUS CONTEST RESULTS
// Public read-only archive: latest completed contest
// and its eligible submissions.
////////////////////////////////////////////////////

if (action === "previous_contest_results") {
    const contestResponse = await fetch(
        supabaseUrl + "/rest/v1/meme_week_contests?status=eq.completed&order=week_start.desc&select=id,week_start,week_end,status,winner_submission_id&limit=20",
        { headers: { "apikey": serviceRoleKey, "Authorization": "Bearer " + serviceRoleKey } }
    );
    if (!contestResponse.ok) throw new Error("Unable to retrieve past contests.");
    const contests = await contestResponse.json();
    const latestContest = contests[0] || null;
    if (!latestContest) return jsonResponse({ success: true, contest: null, contests: [], submissions: [] });

    const submissionsByContest = await Promise.all(contests.map(async contest => {
        const submissionResponse = await fetch(
            supabaseUrl + "/rest/v1/meme_week_submissions?contest_id=eq." + encodeURIComponent(contest.id) +
            "&burn_verified=eq.true&status=neq.rejected&select=id,contest_id,meme_title,meme_image_url,wallet_address,status,created_at&order=created_at.asc",
            { headers: { "apikey": serviceRoleKey, "Authorization": "Bearer " + serviceRoleKey } }
        );
        if (!submissionResponse.ok) throw new Error("Unable to retrieve past contest submissions.");
        return (await submissionResponse.json()).map(({ wallet_address, ...submission }) => ({
            ...submission,
            wallet_display: typeof wallet_address === "string" && wallet_address.length > 10
                ? wallet_address.slice(0, 6) + "..." + wallet_address.slice(-4)
                : "Unknown Wallet"
        }));
    }));

    return jsonResponse({
        success: true,
        contest: latestContest,
        contests,
        submissions: submissionsByContest.flat()
    });
}


        ////////////////////////////////////////////////////
        // ACTION: CHECK CONTEST STATISTICS
        //
        // READ ONLY
        //
        // NO DATABASE INSERT
        // NO TOKEN TRANSFER
        // NO TOKEN BURN
        ////////////////////////////////////////////////////

        if (
            action ===
            "check_contest_statistics"
        ) {


            console.log(
                "📊 SPARKD contest statistics check..."
            );


            ////////////////////////////////////////////////////
            // GET CURRENT CONTEST
            ////////////////////////////////////////////////////

            const contestResponse =
                await fetch(

                    supabaseUrl +
                    "/rest/v1/meme_week_contests" +
                    "?status=eq.submission" +
                    "&week_start=lte." + encodeURIComponent(new Date().toISOString()) +
                    "&week_end=gt." + encodeURIComponent(new Date().toISOString()) +
                    "&order=week_start.desc" +
                    "&select=id,week_start,week_end,status,prize_sol" +
                    "&limit=1",

                    {

                        method:
                            "GET",

                        headers: {

                            "apikey":
                                serviceRoleKey,

                            "Authorization":
                                "Bearer " +
                                serviceRoleKey

                        }

                    }

                );


            if (
                !contestResponse.ok
            ) {

                throw new Error(
                    "Unable to retrieve current contest."
                );

            }


            const contests =
                await contestResponse.json();


            const contest =
                contests[0] ||
                null;


            ////////////////////////////////////////////////////
            // VERIFIED BURN TOTALS
            //
            // Completed-contest totals intentionally exclude the
            // active contest until that contest is finalized.
            ////////////////////////////////////////////////////

            const completedContestsResponse =
                await fetch(

                    supabaseUrl +
                    "/rest/v1/meme_week_contests" +
                    "?status=eq.completed" +
                    "&select=id",

                    {

                        method:
                            "GET",

                        headers: {

                            "apikey":
                                serviceRoleKey,

                            "Authorization":
                                "Bearer " +
                                serviceRoleKey

                        }

                    }

                );


            if (
                !completedContestsResponse.ok
            ) {

                throw new Error(
                    "Unable to retrieve completed contests."
                );

            }


            const completedContests =
                await completedContestsResponse.json();


            const completedContestIds =
                Array.isArray(
                    completedContests
                )
                    ? completedContests
                        .map((row) => row?.id)
                        .filter(Boolean)
                    : [];


            const sumVerifiedBurns = async (contestIds) => {
                if (!Array.isArray(contestIds) || contestIds.length === 0) return 0;
                const contestFilter = contestIds.length === 1
                    ? "contest_id=eq." + encodeURIComponent(contestIds[0])
                    : "contest_id=in.(" + contestIds.map((id) => encodeURIComponent(id)).join(",") + ")";
                let total = 0;
                const pageSize = 1000;
                for (let offset = 0; ; offset += pageSize) {
                    const response = await fetch(
                        supabaseUrl + "/rest/v1/meme_week_burn_receipts?burn_verified=eq.true&" +
                            contestFilter + "&select=burn_amount&order=id.asc",
                        {
                            method: "GET",
                            headers: {
                                "apikey": serviceRoleKey,
                                "Authorization": "Bearer " + serviceRoleKey,
                                "Range-Unit": "items",
                                "Range": `${offset}-${offset + pageSize - 1}`
                            }
                        }
                    );
                    if (!response.ok) throw new Error("Unable to retrieve verified burn totals.");
                    const rows = await response.json();
                    total += (Array.isArray(rows) ? rows : []).reduce((sum, row) => {
                        const amount = Number(row?.burn_amount);
                        return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
                    }, 0);
                    if (!Array.isArray(rows) || rows.length < pageSize) break;
                }
                return total;
            };

            const completedContestBurned = await sumVerifiedBurns(completedContestIds);
            const currentContestBurned = contest ? await sumVerifiedBurns([contest.id]) : 0;



            ////////////////////////////////////////////////////
            // NO ACTIVE CONTEST
            ////////////////////////////////////////////////////

            if (
                !contest
            ) {

                return jsonResponse({

                    success:
                        true,

                    contest:
                        null,

                    submissionCount:
                        0,

                    totalBurned:
                        0,

                    completedContestBurned:
                        completedContestBurned,

                    lifetimeBurned:
                        completedContestBurned,

                    prizeSol:
                        0

                });

            }


            ////////////////////////////////////////////////////
            // COUNT SUBMISSIONS
            ////////////////////////////////////////////////////

            const submissionResponse =
                await fetch(

                    supabaseUrl +
                    "/rest/v1/meme_week_submissions" +
                    "?contest_id=eq." +
                    encodeURIComponent(
                        contest.id
                    ) +
                    "&select=id",

                    {

                        method:
                            "GET",

                        headers: {

                            "apikey":
                                serviceRoleKey,

                            "Authorization":
                                "Bearer " +
                                serviceRoleKey,

                            "Prefer":
                                "count=exact"

                        }

                    }

                );


            if (
                !submissionResponse.ok
            ) {

                throw new Error(
                    "Unable to retrieve contest submissions."
                );

            }


            const contentRange =
                submissionResponse.headers.get(
                    "content-range"
                );


            let submissionCount =
                0;


            ////////////////////////////////////////////////////
            // CONTENT-RANGE COUNT
            ////////////////////////////////////////////////////

            if (
                contentRange
            ) {

                const match =
                    contentRange.match(
                        /\/(\d+)$/
                    );


                if (
                    match
                ) {

                    submissionCount =
                        Number(
                            match[1]
                        );

                }

            }
            else {

                ////////////////////////////////////////////////////
                // FALLBACK COUNT
                ////////////////////////////////////////////////////

                const submissions =
                    await submissionResponse.json();


                submissionCount =
                    Array.isArray(
                        submissions
                    )
                        ? submissions.length
                        : 0;

            }


            ////////////////////////////////////////////////////
            // RETURN STATISTICS
            ////////////////////////////////////////////////////

            console.log(

                "📊 SPARKD contest statistics:",

                {

                    contestId:
                        contest.id,

                    submissionCount:
                        submissionCount,

                    prizeSol:
                        Number(
                            contest.prize_sol ||
                            0
                        )

                }

            );


            return jsonResponse({

                success:
                    true,

                contest:
                    contest,

                contestId:
                    contest.id,

                submissionCount:
                    submissionCount,

                totalBurned:
                    currentContestBurned,

                completedContestBurned:
                    completedContestBurned,

                lifetimeBurned:
                    completedContestBurned,

                prizeSol:
                    Number(
                        contest.prize_sol ||
                        0
                    )

            });

        }


        ////////////////////////////////////////////////////
        // ACTION: CHECK SUBMISSION STATISTICS
        //
        // READ ONLY
        //
        // PURPOSE:
        // - Count submissions for a specific contest
        // - Calculate total verified burn amount
        //
        // NO DATABASE INSERT
        // NO DATABASE UPDATE
        // NO DATABASE DELETE
        // NO TOKEN TRANSFER
        // NO TOKEN BURN
        ////////////////////////////////////////////////////

        if (
            action ===
            "check_submission_stats"
        ) {


            console.log(
                "📊 SPARKD checking submission statistics..."
            );


            ////////////////////////////////////////////////////
            // VALIDATE CONTEST ID
            ////////////////////////////////////////////////////

            const contestId =
                body?.contest_id ||
                null;


            if (
                !contestId
            ) {

                return jsonResponse(

                    {

                        success:
                            false,

                        error:
                            "Contest ID is required."

                    },

                    400

                );

            }


            ////////////////////////////////////////////////////
            // VERIFY CONTEST EXISTS
            ////////////////////////////////////////////////////

            const contestResponse =
                await fetch(

                    supabaseUrl +
                    "/rest/v1/meme_week_contests" +
                    "?id=eq." +
                    encodeURIComponent(
                        contestId
                    ) +
                    "&select=id,week_start,week_end,status,prize_sol" +
                    "&limit=1",

                    {

                        method:
                            "GET",

                        headers: {

                            "apikey":
                                serviceRoleKey,

                            "Authorization":
                                "Bearer " +
                                serviceRoleKey

                        }

                    }

                );


            if (
                !contestResponse.ok
            ) {

                throw new Error(
                    "Unable to retrieve contest."
                );

            }


            const contestRows =
                await contestResponse.json();


            const contest =
                contestRows[0] ||
                null;


            ////////////////////////////////////////////////////
            // CONTEST NOT FOUND
            ////////////////////////////////////////////////////

            if (
                !contest
            ) {

                return jsonResponse(

                    {

                        success:
                            false,

                        error:
                            "Contest was not found."

                    },

                    404

                );

            }


            ////////////////////////////////////////////////////
            // GET SUBMISSIONS
            //
            // READ ONLY
            ////////////////////////////////////////////////////

            const submissionResponse =
                await fetch(

                    supabaseUrl +
                    "/rest/v1/meme_week_submissions" +
                    "?contest_id=eq." +
                    encodeURIComponent(
                        contestId
                    ) +
                    "&select=id,burn_amount,burn_verified,status",

                    {

                        method:
                            "GET",

                        headers: {

                            "apikey":
                                serviceRoleKey,

                            "Authorization":
                                "Bearer " +
                                serviceRoleKey

                        }

                    }

                );


            if (
                !submissionResponse.ok
            ) {

                throw new Error(
                    "Unable to retrieve contest submissions."
                );

            }


            const submissions =
                await submissionResponse.json();


            ////////////////////////////////////////////////////
            // COUNT SUBMISSIONS
            ////////////////////////////////////////////////////

            const submissionCount =
                Array.isArray(
                    submissions
                )
                    ? submissions.length
                    : 0;


            ////////////////////////////////////////////////////
            // CALCULATE VERIFIED BURN TOTAL
            //
            // TEST SUBMISSIONS HAVE:
            // burn_amount = 0
            // burn_verified = false
            //
            // Therefore they contribute nothing.
            ////////////////////////////////////////////////////

            let totalBurned =
                0;


            if (
                Array.isArray(
                    submissions
                )
            ) {

                for (
                    const submission
                    of submissions
                ) {


                    if (
                        submission?.burn_verified !==
                        true
                    ) {

                        continue;

                    }


                    const burnAmount =
                        Number(
                            submission?.burn_amount ||
                            0
                        );


                    if (
                        Number.isFinite(
                            burnAmount
                        ) &&
                        burnAmount >
                        0
                    ) {

                        totalBurned +=
                            burnAmount;

                    }

                }

            }


            ////////////////////////////////////////////////////
            // FINAL STATISTICS LOG
            ////////////////////////////////////////////////////

            console.log(

                "📊 SPARKD submission statistics:",

                {

                    contestId:
                        contestId,

                    submissionCount:
                        submissionCount,

                    totalBurned:
                        totalBurned

                }

            );


            ////////////////////////////////////////////////////
            // RETURN READ-ONLY STATISTICS
            ////////////////////////////////////////////////////

            return jsonResponse({

                success:
                    true,

                contest:
                    contest,

                contestId:
                    contestId,

                submissionCount:
                    submissionCount,

                totalBurned:
                    totalBurned,

                prizeSol:
                    Number(
                        contest.prize_sol ||
                        0
                    ),

                readOnly:
                    true,

                burnsPerformed:
                    false,

                transfersPerformed:
                    false

            });

        }


         ////////////////////////////////////////////////////
        // ACTION: CHECK MINT
        //
        // READ ONLY
        //
        // DIRECT SOLANA RPC INSPECTION
        //
        // NO DATABASE INSERT
        // NO DATABASE UPDATE
        // NO DATABASE DELETE
        // NO TOKEN TRANSFER
        // NO TOKEN BURN
        ////////////////////////////////////////////////////

        if (
            action ===
            "check_mint"
        ) {


            console.log(
                "🔎 SPARKD direct RPC mint inspection..."
            );


            ////////////////////////////////////////////////////
            // GET MINT ACCOUNT
            ////////////////////////////////////////////////////

            const mintResponse =
                await fetch(

                    rpcUrl,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                jsonrpc:
                                    "2.0",

                                id:
                                    1,

                                method:
                                    "getAccountInfo",

                                params: [

                                    SPARKD_MINT,

                                    {

                                        encoding:
                                            "base64",

                                        commitment:
                                            "confirmed"

                                    }

                                ]

                            })

                    }

                );


            if (
                !mintResponse.ok
            ) {

                throw new Error(

                    "Solana RPC returned HTTP " +
                    mintResponse.status

                );

            }


            const mintRpc =
                await mintResponse.json();


            if (
                mintRpc.error
            ) {

                throw new Error(

                    "Solana RPC error: " +
                    JSON.stringify(
                        mintRpc.error
                    )

                );

            }


            const account =
                mintRpc.result?.value ||
                null;


            ////////////////////////////////////////////////////
            // MINT NOT FOUND
            ////////////////////////////////////////////////////

            if (
                !account
            ) {

                return jsonResponse(

                    {

                        success:
                            false,

                        error:
                            "SPARKD mint account was not found."

                    },

                    404

                );

            }


            ////////////////////////////////////////////////////
            // TOKEN-2022 PROGRAM
            ////////////////////////////////////////////////////

            const token2022Program =
                "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";


            const isToken2022 =
                account.owner ===
                token2022Program;


            ////////////////////////////////////////////////////
            // DECODE BASE64 ACCOUNT DATA
            ////////////////////////////////////////////////////

            const encoded =
                account.data?.[0] ||
                "";


            let bytes: Uint8Array;


            try {

                const binary =
                    atob(encoded);


                bytes =
                    Uint8Array.from(

                        binary,

                        char =>
                            char.charCodeAt(0)

                    );

            }
            catch {

                bytes =
                    new Uint8Array();

            }


            ////////////////////////////////////////////////////
            // STANDARD MINT DATA
            //
            // 0-3   mint authority option
            // 4-35  mint authority
            // 36-43 supply
            // 44    decimals
            // 45    initialized
            // 46-49 freeze authority option
            // 50-81 freeze authority
            ////////////////////////////////////////////////////

            const standardMintDataLength =
                82;


            let decimals =
                null;


            let supplyRaw =
                null;


            let mintAuthorityEnabled =
                false;


            let freezeAuthorityEnabled =
                false;


            if (
                bytes.length >=
                standardMintDataLength
            ) {


                ////////////////////////////////////////////////////
                // DECIMALS
                ////////////////////////////////////////////////////

                decimals =
                    bytes[44];


                ////////////////////////////////////////////////////
                // SUPPLY
                ////////////////////////////////////////////////////

                let supplyValue =
                    0n;


                for (
                    let i = 0;
                    i < 8;
                    i++
                ) {

                    supplyValue |=

                        BigInt(
                            bytes[36 + i]
                        ) <<

                        BigInt(
                            8 * i
                        );

                }


                supplyRaw =
                    supplyValue.toString();


                ////////////////////////////////////////////////////
                // MINT AUTHORITY
                ////////////////////////////////////////////////////

                const mintAuthorityOption =

                    bytes[0] |
                    (bytes[1] << 8) |
                    (bytes[2] << 16) |
                    (bytes[3] << 24);


                mintAuthorityEnabled =
                    mintAuthorityOption !==
                    0;


                ////////////////////////////////////////////////////
                // FREEZE AUTHORITY
                ////////////////////////////////////////////////////

                const freezeAuthorityOption =

                    bytes[46] |
                    (bytes[47] << 8) |
                    (bytes[48] << 16) |
                    (bytes[49] << 24);


                freezeAuthorityEnabled =
                    freezeAuthorityOption !==
                    0;

            }


   
    ////////////////////////////////////////////////////
    // TOKEN-2022 EXTENSION DATA
    //
    // READ ONLY DIAGNOSTIC
    //
    // We are temporarily exposing the raw bytes after
    // the 82-byte base mint structure.
    //
    // NO DATABASE INSERT
    // NO DATABASE UPDATE
    // NO TOKEN TRANSFER
    // NO TOKEN BURN
    ////////////////////////////////////////////////////

    const extensionDataLength =
        Math.max(

            0,

            bytes.length -
            standardMintDataLength

        );


    ////////////////////////////////////////////////////
    // CONVERT BYTES TO HEX
    ////////////////////////////////////////////////////

    function bytesToHex(
        data: Uint8Array
    ) {

        return Array.from(
            data
        )
            .map(
                byte =>
                    byte
                        .toString(16)
                        .padStart(
                            2,
                            "0"
                        )
            )
            .join(" ");

    }


    ////////////////////////////////////////////////////
    // RAW EXTENSION REGION
    ////////////////////////////////////////////////////

    const extensionBytes =
        bytes.slice(
            standardMintDataLength
        );


    const extensionHex =
        bytesToHex(
            extensionBytes
        );


    ////////////////////////////////////////////////////
    // FIRST 32 BYTES OF EXTENSION REGION
    //
    // This gives us an easy diagnostic without
    // returning an unnecessarily enormous response.
    ////////////////////////////////////////////////////

    const extensionPreviewBytes =
        extensionBytes.slice(
            0,
            32
        );


    const extensionPreview =
        bytesToHex(
            extensionPreviewBytes
        );


    ////////////////////////////////////////////////////
    // ATTEMPT TLV HEADER INSPECTION
    ////////////////////////////////////////////////////

    let firstExtensionType =
        null;


    let firstExtensionLength =
        null;


    if (
        extensionBytes.length >=
        4
    ) {

        firstExtensionType =

            extensionBytes[0] |

            (
                extensionBytes[1] <<
                8
            );


        firstExtensionLength =

            extensionBytes[2] |

            (
                extensionBytes[3] <<
                8
            );

    }


    ////////////////////////////////////////////////////
    // BUILD EXTENSION REPORT
    //
    // We are deliberately NOT calling this a valid
    // extension yet.
    ////////////////////////////////////////////////////

    const extensions = [];


   if (
    firstExtensionType !==
        null &&
    firstExtensionLength !==
        null &&
    firstExtensionType !==
        0 &&
    firstExtensionLength !==
        0
) {

    extensions.push({

        type:
            firstExtensionType,

        length:
            firstExtensionLength,

        validHeader:
            true

    });

}


    ////////////////////////////////////////////////////
    // EXTENSION DIAGNOSTIC LOG
    ////////////////////////////////////////////////////

    console.log(

        "🧩 SPARKD RAW TOKEN-2022 EXTENSION DATA:",

        {

            accountDataLength:
                bytes.length,

            standardMintDataLength:
                standardMintDataLength,

            extensionDataLength:
                extensionDataLength,

            extensionPreview:
                extensionPreview,

            firstExtensionType:
                firstExtensionType,

            firstExtensionLength:
                firstExtensionLength,

            fullExtensionHex:
                extensionHex

        }

    );


            ////////////////////////////////////////////////////
            // SUPPLY AS HUMAN-READABLE VALUE
            ////////////////////////////////////////////////////

            let supply =
                null;


            if (
                supplyRaw !==
                    null &&
                decimals !==
                    null
            ) {

                try {

                    const raw =
                        BigInt(
                            supplyRaw
                        );


                    const divisor =
                        10n **
                        BigInt(
                            decimals
                        );


                    const whole =
                        raw /
                        divisor;


                    const fraction =
                        raw %
                        divisor;


                    supply =

                        fraction ===
                            0n

                            ?

                            whole.toString()

                            :

                            (

                                whole.toString() +
                                "." +
                                fraction
                                    .toString()
                                    .padStart(
                                        decimals,
                                        "0"
                                    )
                                    .replace(
                                        /0+$/,
                                        ""
                                    )

                            );

                }
                catch {

                    supply =
                        null;

                }

            }


            ////////////////////////////////////////////////////
            // IMPORTANT SAFETY FLAGS
            ////////////////////////////////////////////////////

            const cleanMint =

                isToken2022 &&

                mintAuthorityEnabled ===
                    false &&

                freezeAuthorityEnabled ===
                    false;


            ////////////////////////////////////////////////////
            // FINAL MINT INSPECTION LOG
            ////////////////////////////////////////////////////

            console.log(

                "🔥 SPARKD MINT INSPECTION:",

                {

                    mint:
                        SPARKD_MINT,

                    isToken2022:
                        isToken2022,

                    decimals:
                        decimals,

                    supply:
                        supply,

                    supplyRaw:
                        supplyRaw,

                    mintAuthorityEnabled:
                        mintAuthorityEnabled,

                    freezeAuthorityEnabled:
                        freezeAuthorityEnabled,

                    extensionCount:
                        extensions.length,

                    extensions:
                        extensions,

                    cleanMint:
                        cleanMint

                }

            );


            ////////////////////////////////////////////////////
            // FINAL READ-ONLY RESULT
            ////////////////////////////////////////////////////

            return jsonResponse({

                success:
                    true,

                readOnly:
                    true,

                mint:
                    SPARKD_MINT,

                program:
                    account.owner,

                isToken2022:
                    isToken2022,

                executable:
                    account.executable,

                lamports:
                    account.lamports,

                encoding:
                    "base64",

                accountDataLength:
                    bytes.length,

                standardMintDataLength:
                    standardMintDataLength,

                extensionDataLength:
                    extensionDataLength,

                decimals:
                    decimals,

                supplyRaw:
                    supplyRaw,

                supply:
                    supply,

                mintAuthorityEnabled:
                    mintAuthorityEnabled,

                freezeAuthorityEnabled:
                    freezeAuthorityEnabled,

                extensionCount:
                    extensions.length,

                extensions:
                    extensions,

                cleanMint:
                    cleanMint,

                transfersPerformed:
                    false,

                burnsPerformed:
                    false

            });

        }



        ////////////////////////////////////////////////////
        // WALLET VALIDATION
        ////////////////////////////////////////////////////

        if (
            typeof wallet !==
                "string" ||
            wallet.length <
                32 ||
            wallet.length >
                50
        ) {

            return jsonResponse(

                {

                    success:
                        false,

                    error:
                        "Invalid wallet address."

                },

                400

            );

        }


        ////////////////////////////////////////////////////
        // ACTION: FIND SPARKD TOKEN-2022 ACCOUNT
        //
        // READ ONLY
        //
        // Uses the private Solana RPC configured in
        // SOLANA_RPC_URL.
        //
        // NO TRANSACTION
        // NO TRANSFER
        // NO BURN
        ////////////////////////////////////////////////////

        if (
            action ===
            "find_token_account"
        ) {


            console.log(
                "🔎 Finding SPARKD Token-2022 account..."
            );


            ////////////////////////////////////////////////////
            // TOKEN-2022 PROGRAM
            ////////////////////////////////////////////////////

            const token2022Program =
                "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";


            ////////////////////////////////////////////////////
            // QUERY SPARKD TOKEN ACCOUNTS
            //
            // This runs SERVER-SIDE through the private RPC.
            ////////////////////////////////////////////////////

            const tokenAccountResponse =
                await fetch(

                    rpcUrl,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                jsonrpc:
                                    "2.0",

                                id:
                                    1,

                                method:
                                    "getTokenAccountsByOwner",

                                params: [

                                    wallet,

                                    {

                                        mint:
                                            SPARKD_MINT

                                    },

                                    {

                                        encoding:
                                            "jsonParsed",

                                        commitment:
                                            "confirmed"

                                    }

                                ]

                            })

                    }

                );


            ////////////////////////////////////////////////////
            // RPC HTTP ERROR
            ////////////////////////////////////////////////////

            if (
                !tokenAccountResponse.ok
            ) {

                throw new Error(

                    "Solana RPC returned HTTP " +
                    tokenAccountResponse.status

                );

            }


            ////////////////////////////////////////////////////
            // PARSE RPC RESULT
            ////////////////////////////////////////////////////

            const tokenAccountRpc =
                await tokenAccountResponse.json();


            if (
                tokenAccountRpc.error
            ) {

                throw new Error(

                    "Solana RPC error: " +
                    JSON.stringify(
                        tokenAccountRpc.error
                    )

                );

            }


            ////////////////////////////////////////////////////
            // TOKEN ACCOUNTS
            ////////////////////////////////////////////////////

            const tokenAccounts =
                tokenAccountRpc.result?.value ||
                [];


            ////////////////////////////////////////////////////
            // FIND VALID TOKEN-2022 SPARKD ACCOUNTS
            ////////////////////////////////////////////////////

            const validAccounts =
                tokenAccounts
                    .map(
                        (entry: any) => {

                            const parsed =
                                entry
                                    ?.account
                                    ?.data
                                    ?.parsed
                                    ?.info;


                            const tokenAmount =
                                parsed
                                    ?.tokenAmount;


                            return {

                                tokenAccount:
                                    entry?.pubkey ||
                                    null,

                                program:
                                    entry
                                        ?.account
                                        ?.owner ||
                                    null,

                                mint:
                                    parsed?.mint ||
                                    null,

                                owner:
                                    parsed?.owner ||
                                    null,

                                rawAmount:
                                    tokenAmount?.amount ||
                                    "0",

                                balance:
                                    Number(
                                        tokenAmount?.uiAmountString ||
                                        tokenAmount?.uiAmount ||
                                        0
                                    ),

                                decimals:
                                    Number(
                                        tokenAmount?.decimals
                                    )

                            };

                        }
                    )
                    .filter(
                        (entry: any) =>

                            entry.tokenAccount &&

                            entry.program ===
                                token2022Program &&

                            entry.mint ===
                                SPARKD_MINT &&

                            entry.owner ===
                                wallet &&

                            entry.decimals ===
                                6

                    );


            ////////////////////////////////////////////////////
            // NO VALID SPARKD TOKEN-2022 ACCOUNT
            ////////////////////////////////////////////////////

            if (
                validAccounts.length ===
                0
            ) {

                return jsonResponse(

                    {

                        success:
                            false,

                        found:
                            false,

                        error:
                            "No valid SPARKD Token-2022 account was found for this wallet.",

                        wallet:
                            wallet,

                        mint:
                            SPARKD_MINT,

                        readOnly:
                            true,

                        burnsPerformed:
                            false,

                        transfersPerformed:
                            false

                    },

                    404

                );

            }


            ////////////////////////////////////////////////////
            // SELECT ACCOUNT WITH LARGEST BALANCE
            //
            // Normally this will be the wallet's SPARKD ATA.
            // Selecting the largest valid account also avoids
            // accidentally choosing an empty token account.
            ////////////////////////////////////////////////////

            validAccounts.sort(

                (a: any, b: any) =>
                    b.balance -
                    a.balance

            );


            const selectedAccount =
                validAccounts[0];


            ////////////////////////////////////////////////////
            // FINAL READ-ONLY LOG
            ////////////////////////////////////////////////////

            console.log(

                "🔥 SPARKD Token-2022 account found:",

                {

                    wallet:
                        wallet,

                    tokenAccount:
                        selectedAccount.tokenAccount,

                    mint:
                        selectedAccount.mint,

                    balance:
                        selectedAccount.balance,

                    decimals:
                        selectedAccount.decimals,

                    program:
                        selectedAccount.program

                }

            );


            ////////////////////////////////////////////////////
            // RETURN READ-ONLY RESULT
            ////////////////////////////////////////////////////

            const accountBurnQuote = await getContestBurnQuote();

            return jsonResponse({

                success:
                    true,

                found:
                    true,

                readOnly:
                    true,

                wallet:
                    wallet,

                tokenAccount:
                    selectedAccount.tokenAccount,

                mint:
                    selectedAccount.mint,

                balance:
                    selectedAccount.balance,

                rawAmount:
                    selectedAccount.rawAmount,

                decimals:
                    selectedAccount.decimals,

                program:
                    selectedAccount.program,

                requiredSparkd:
                    accountBurnQuote.amount,

                targetEntryUsd:
                    CONTEST_ENTRY_USD,

                sufficientBalance:
                    selectedAccount.balance >=
                    accountBurnQuote.amount,

                burnsPerformed:
                    false,

                transfersPerformed:
                    false

            });

        }

       // ============================================================
// CHECK TRANSACTION STATUS — READ ONLY
// ============================================================
if (action === "check_transaction_status") {
    const transactionSignature = body?.transactionSignature;

    if (
        typeof transactionSignature !== "string" ||
        transactionSignature.length < 80 ||
        transactionSignature.length > 100
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Invalid transaction signature."
            },
            400
        );
    }

    const rpcResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getSignatureStatuses",
            params: [
                [transactionSignature],
                {
                    searchTransactionHistory: true
                }
            ]
        })
    });

    const rpcData = await rpcResponse.json();

    if (rpcData?.error) {
        return jsonResponse(
            {
                success: false,
                error: "Solana RPC returned an error.",
                rpcError: rpcData.error,
                readOnly: true
            },
            502
        );
    }

    const status = rpcData?.result?.value?.[0] ?? null;

    if (!status) {
        return jsonResponse({
            success: true,
            found: false,
            transactionSignature,
            status: null,
            confirmationStatus: null,
            confirmations: null,
            slot: null,
            err: null,
            readOnly: true
        });
    }

    return jsonResponse({
        success: true,
        found: true,
        transactionSignature,
        status,
        confirmationStatus: status.confirmationStatus ?? null,
        confirmations: status.confirmations ?? null,
        slot: status.slot ?? null,
        err: status.err ?? null,
        readOnly: true
    });
} 

// ============================================================
// SEND SIGNED SOLANA TRANSACTION
// ============================================================
if (
    action ===
    "send_signed_transaction"
) {

    const signedTransaction =
        body?.signedTransaction ||
        null;

    const broadcastContestId =
        body?.contestId ||
        null;

    const broadcastMemeID =
        body?.memeID ||
        null;

    if (
        typeof signedTransaction !== "string" ||
        signedTransaction.length < 100
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Invalid signed transaction."
            },
            400
        );
    }

    if (
        typeof broadcastContestId !== "string" ||
        !broadcastContestId
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Contest ID is required for signed transaction broadcast."
            },
            400
        );
    }

    if (
        typeof broadcastMemeID !== "string" ||
        !broadcastMemeID.trim()
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Forge Meme ID is required for signed transaction broadcast."
            },
            400
        );
    }

    let broadcastQuote;
    try {
        broadcastQuote = await verifyContestBurnQuote(
            body?.quoteToken,
            wallet,
            broadcastContestId,
            broadcastMemeID.trim()
        );
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error instanceof Error ? error.message : "Invalid contest burn quote."
        }, 400);
    }

    ////////////////////////////////////////////////////
    // ENFORCE CONTEST SUBMISSION WINDOW AT BROADCAST
    ////////////////////////////////////////////////////

    const broadcastContestResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_contests" +
            "?id=eq." +
            encodeURIComponent(broadcastContestId) +
            "&status=eq.submission" +
            "&select=id,week_start,week_end" +
            "&limit=1",
            {
                method: "GET",
                headers: {
                    "apikey": serviceRoleKey,
                    "Authorization": "Bearer " + serviceRoleKey
                }
            }
        );

    if (!broadcastContestResponse.ok) {
        return jsonResponse(
            {
                success: false,
                error: "Unable to verify contest submission window."
            },
            409
        );
    }

    const broadcastContestRows =
        await broadcastContestResponse.json();

    const broadcastContest =
        broadcastContestRows?.[0] ||
        null;

    if (!broadcastContest) {
        return jsonResponse(
            {
                success: false,
                error: "Contest is not available for submissions."
            },
            409
        );
    }

    const broadcastNowMs = Date.now();
    const broadcastWeekStartMs = Date.parse(broadcastContest.week_start);
    const broadcastWeekEndMs = Date.parse(broadcastContest.week_end);

    if (
        !Number.isFinite(broadcastWeekStartMs) ||
        !Number.isFinite(broadcastWeekEndMs)
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Contest submission window is invalid."
            },
            409
        );
    }

    if (
        broadcastNowMs < broadcastWeekStartMs ||
        broadcastNowMs >= broadcastWeekEndMs
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Contest submissions are not currently open.",
                weekStart: broadcastContest.week_start,
                weekEnd: broadcastContest.week_end
            },
            409
        );
    }

    ////////////////////////////////////////////////////
    // DECODE + VERIFY PHANTOM-SIGNED TRANSACTION
    ////////////////////////////////////////////////////

    let signedTransactionBytes: Uint8Array;

    try {
        signedTransactionBytes =
            Uint8Array.from(
                atob(signedTransaction),
                character => character.charCodeAt(0)
            );
    }
    catch {
        return jsonResponse(
            {
                success: false,
                error: "Signed SPARKD transaction is not valid base64."
            },
            400
        );
    }

    let decodedSignedTransaction: Transaction;

    try {
        decodedSignedTransaction =
            Transaction.from(signedTransactionBytes);
    }
    catch {
        return jsonResponse(
            {
                success: false,
                error: "Unable to decode signed SPARKD transaction."
            },
            400
        );
    }

    if (
        decodedSignedTransaction.verifySignatures(true) !== true
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Phantom-signed SPARKD transaction contains an invalid or missing signature."
            },
            400
        );
    }

    const broadcastWalletPublicKey =
        new PublicKey(wallet);

    const mintPublicKey =
        new PublicKey(SPARKD_MINT);

    const tokenProgramPublicKey =
        new PublicKey(
            "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        );

    ////////////////////////////////////////////////////
    // REQUIRE EXACTLY ONE SIGNER: CONNECTED WALLET
    ////////////////////////////////////////////////////

    if (
        decodedSignedTransaction.signatures.length !== 1 ||
        !decodedSignedTransaction.signatures[0].publicKey.equals(
            broadcastWalletPublicKey
        ) ||
        !decodedSignedTransaction.signatures[0].signature
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Signed SPARKD transaction must have exactly one signer: the connected wallet."
            },
            400
        );
    }

    if (
        !decodedSignedTransaction.feePayer ||
        !decodedSignedTransaction.feePayer.equals(
            broadcastWalletPublicKey
        )
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Signed SPARKD transaction has an unexpected fee payer."
            },
            400
        );
    }

   ////////////////////////////////////////////////////
// VALIDATE PHANTOM-SIGNED INSTRUCTIONS
//
// ALLOWED:
// - Compute Budget instructions added by Phantom
// - EXACTLY ONE SPARKD Token-2022 BurnChecked
// - Lighthouse safety/assertion instructions added by Phantom
//
// NOTHING ELSE IS ALLOWED.
////////////////////////////////////////////////////

const computeBudgetProgramPublicKey =
    new PublicKey(
        "ComputeBudget111111111111111111111111111111"
    );

const lighthouseProgramPublicKey =
    new PublicKey(
        "L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95"
    );

const signedInstructions =
    decodedSignedTransaction.instructions;

if (
    signedInstructions.length < 1 ||
    signedInstructions.length > 8
) {
    return jsonResponse(
        {
            success: false,
            error:
                "Signed SPARKD transaction has an unexpected instruction count."
        },
        400
    );
}

const signedBurnInstructions =
    signedInstructions.filter(
        instruction =>
            instruction.programId.equals(
                tokenProgramPublicKey
            )
    );

if (
    signedBurnInstructions.length !== 1
) {
    return jsonResponse(
        {
            success: false,
            error:
                "Signed SPARKD transaction must contain exactly one Token-2022 instruction."
        },
        400
    );
}

for (
    const instruction of signedInstructions
) {
    const allowedProgram =
        instruction.programId.equals(
            tokenProgramPublicKey
        ) ||
        instruction.programId.equals(
            computeBudgetProgramPublicKey
        ) ||
        instruction.programId.equals(
            lighthouseProgramPublicKey
        );

    if (!allowedProgram) {
        return jsonResponse(
            {
                success: false,
                error:
                    "Signed SPARKD transaction contains an unauthorized instruction program."
            },
            400
        );
    }
}

const signedBurnInstruction =
    signedBurnInstructions[0];

if (
    signedBurnInstruction.keys.length !== 3
) {
    return jsonResponse(
        {
            success: false,
            error:
                "Signed SPARKD transaction has an invalid Token-2022 burn instruction."
        },
        400
    );
}

const signedBurnKeys =
    signedBurnInstruction.keys;

if (
    signedBurnKeys[0].isSigner !== false ||
    signedBurnKeys[0].isWritable !== true ||
    !signedBurnKeys[1].pubkey.equals(
        mintPublicKey
    ) ||
    signedBurnKeys[1].isSigner !== false ||
    signedBurnKeys[1].isWritable !== true ||
    !signedBurnKeys[2].pubkey.equals(
        broadcastWalletPublicKey
    ) ||
    signedBurnKeys[2].isSigner !== true
) {
    return jsonResponse(
        {
            success: false,
            error:
                "Signed SPARKD transaction has unexpected burn accounts."
        },
        400
    );
}

const expectedBurnInstructionData =
    new Uint8Array(10);

expectedBurnInstructionData[0] = 15;

const rawBurnAmount = BigInt(broadcastQuote.rawAmount);

for (let i = 0; i < 8; i++) {
    expectedBurnInstructionData[1 + i] =
        Number(
            (rawBurnAmount >> BigInt(8 * i)) &
            255n
        );
}

expectedBurnInstructionData[9] =
    SPARKD_DECIMALS;

if (
    signedBurnInstruction.data.length !==
        expectedBurnInstructionData.length ||
    !Array.from(
        signedBurnInstruction.data
    ).every(
        (value, index) =>
            value ===
            expectedBurnInstructionData[index]
    )
) {
    return jsonResponse(
        {
            success: false,
            error:
                "Signed SPARKD transaction has unexpected burn instruction data."
        },
        400
    );
}

    ////////////////////////////////////////////////////
    // VERIFY SOURCE TOKEN ACCOUNT ON-CHAIN
    ////////////////////////////////////////////////////

    const signedTokenAccount =
        signedBurnKeys[0].pubkey.toBase58();

    const sourceTokenAccountResponse =
        await fetch(
            rpcUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getAccountInfo",
                    params: [
                        signedTokenAccount,
                        {
                            encoding: "jsonParsed",
                            commitment: "confirmed"
                        }
                    ]
                })
            }
        );

    const sourceTokenAccountRpc =
        sourceTokenAccountResponse.ok
            ? await sourceTokenAccountResponse.json()
            : null;

    const sourceTokenAccountValue =
        sourceTokenAccountRpc?.result?.value ||
        null;

    const sourceTokenInfo =
        sourceTokenAccountValue?.data?.parsed?.info ||
        null;

    if (
        sourceTokenAccountRpc?.error ||
        !sourceTokenAccountValue ||
        sourceTokenAccountValue.owner !==
            "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" ||
        sourceTokenInfo?.mint !== SPARKD_MINT ||
        sourceTokenInfo?.owner !== wallet ||
        typeof sourceTokenInfo?.tokenAmount?.amount !== "string" ||
        BigInt(sourceTokenInfo.tokenAmount.amount) < BigInt(broadcastQuote.rawAmount)
    ) {
        return jsonResponse(
            {
                success: false,
                error: "Signed SPARKD burn source account is invalid or no longer has enough SPARKD."
            },
            400
        );
    }

    ////////////////////////////////////////////////////
    // BLOCK A SECOND BURN IF RECEIPT/SUBMISSION EXISTS
    ////////////////////////////////////////////////////

    const existingBurnReceiptResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_burn_receipts" +
            "?contest_id=eq." +
            encodeURIComponent(broadcastContestId) +
            "&wallet_address=eq." +
            encodeURIComponent(wallet) +
            "&meme_id=eq." +
            encodeURIComponent(broadcastMemeID.trim()) +
            "&select=id,burn_transaction,burn_verified,meme_id" +
            "&limit=1",
            {
                method: "GET",
                headers: {
                    "apikey": serviceRoleKey,
                    "Authorization": "Bearer " + serviceRoleKey
                }
            }
        );

    if (!existingBurnReceiptResponse.ok) {
        return jsonResponse(
            {
                success: false,
                error: "Unable to check existing SPARKD burn receipt before broadcast."
            },
            409
        );
    }

    const existingBurnReceipts =
        await existingBurnReceiptResponse.json();

    if (existingBurnReceipts?.[0]) {
        return jsonResponse(
            {
                success: false,
                error: "A SPARKD burn receipt already exists for this wallet and contest. Do not burn again.",
                existingBurnTransaction:
                    existingBurnReceipts[0].burn_transaction || null
            },
            409
        );
    }

    const existingBroadcastSubmissionResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_submissions" +
            "?contest_id=eq." +
            encodeURIComponent(broadcastContestId) +
            "&wallet_address=eq." +
            encodeURIComponent(wallet) +
            "&select=id,burn_transaction,burn_verified" +
            "&limit=1",
            {
                method: "GET",
                headers: {
                    "apikey": serviceRoleKey,
                    "Authorization": "Bearer " + serviceRoleKey
                }
            }
        );

    if (!existingBroadcastSubmissionResponse.ok) {
        return jsonResponse(
            {
                success: false,
                error: "Unable to check existing SPARKD submission before broadcast."
            },
            409
        );
    }

    const existingBroadcastSubmissions =
        await existingBroadcastSubmissionResponse.json();

    if (existingBroadcastSubmissions?.[0]) {
        return jsonResponse(
            {
                success: false,
                error: "A submission already exists for this wallet and contest. Do not burn again.",
                submissionId: existingBroadcastSubmissions[0].id
            },
            409
        );
    }

    ////////////////////////////////////////////////////
    // DERIVE EXACT TRANSACTION SIGNATURE
    ////////////////////////////////////////////////////

    const derivedTransactionSignature =
        encodeBase58(
            decodedSignedTransaction.signatures[0].signature as Uint8Array
        );

    ////////////////////////////////////////////////////
    // IF ALREADY LANDED, RETURN IDEMPOTENT SUCCESS
    ////////////////////////////////////////////////////

    const preBroadcastStatusResponse =
        await fetch(
            rpcUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getSignatureStatuses",
                    params: [
                        [derivedTransactionSignature],
                        { searchTransactionHistory: true }
                    ]
                })
            }
        );

    const preBroadcastStatusRpc =
        preBroadcastStatusResponse.ok
            ? await preBroadcastStatusResponse.json()
            : null;

    const preBroadcastStatus =
        preBroadcastStatusRpc?.result?.value?.[0] ||
        null;

    if (
        preBroadcastStatus &&
        !preBroadcastStatus.err
    ) {
        return jsonResponse({
            success: true,
            sent: true,
            recovered: true,
            transactionSignature: derivedTransactionSignature
        });
    }

    ////////////////////////////////////////////////////
    // VERIFY RECENT BLOCKHASH IS STILL VALID
    ////////////////////////////////////////////////////

    const blockhashValidityResponse =
        await fetch(
            rpcUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "isBlockhashValid",
                    params: [
                        decodedSignedTransaction.recentBlockhash,
                        { commitment: "confirmed" }
                    ]
                })
            }
        );

    const blockhashValidityRpc =
        blockhashValidityResponse.ok
            ? await blockhashValidityResponse.json()
            : null;

    if (
        blockhashValidityRpc?.error ||
        blockhashValidityRpc?.result?.value !== true
    ) {
        return jsonResponse(
            {
                success: false,
                sent: false,
                expired: true,
                safeToRetry: true,
                transactionSignature: derivedTransactionSignature,
                error: "The signed transaction blockhash expired before broadcast. No burn was sent; build and approve a fresh transaction."
            },
            409
        );
    }

    ////////////////////////////////////////////////////
    // BROADCAST EXACT PHANTOM-SIGNED TRANSACTION
    ////////////////////////////////////////////////////

    const rpcResponse =
        await fetch(
            rpcUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "sendTransaction",
                    params: [
                        signedTransaction,
                        {
                            encoding: "base64",
                            skipPreflight: false,
                            preflightCommitment: "confirmed",
                            maxRetries: 5
                        }
                    ]
                })
            }
        );

    const rpcData =
        await rpcResponse.json();

    if (rpcData?.error) {
        const statusResponse =
            await fetch(
                rpcUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        id: 1,
                        method: "getSignatureStatuses",
                        params: [
                            [derivedTransactionSignature],
                            { searchTransactionHistory: true }
                        ]
                    })
                }
            );

        const statusRpc =
            statusResponse.ok
                ? await statusResponse.json()
                : null;

        const existingStatus =
            statusRpc?.result?.value?.[0] ||
            null;

        if (
            existingStatus &&
            !existingStatus.err
        ) {
            return jsonResponse({
                success: true,
                sent: true,
                recovered: true,
                transactionSignature: derivedTransactionSignature
            });
        }

        return jsonResponse(
            {
                success: false,
                sent: false,
                ambiguous: true,
                transactionSignature: derivedTransactionSignature,
                error: "Solana RPC did not confirm the signed transaction. Check this exact signature before attempting another burn.",
                rpcError: rpcData.error
            },
            409
        );
    }

    const rpcSignature =
        rpcData?.result ||
        null;

    if (
        rpcSignature !== derivedTransactionSignature
    ) {
        return jsonResponse(
            {
                success: false,
                sent: false,
                ambiguous: true,
                transactionSignature: derivedTransactionSignature,
                error: "Solana RPC returned an unexpected transaction signature. Do not burn again until the exact signed transaction is checked."
            },
            502
        );
    }

    return jsonResponse({
        success: true,
        sent: true,
        recovered: false,
        transactionSignature: derivedTransactionSignature
    });
}


        ////////////////////////////////////////////////////
        
        // ACTION: VERIFY SPARKD BURN
        //
        // READ ONLY
        //
        // Verifies that a confirmed Solana transaction
        // contains the required Token-2022 BurnChecked.
        //
        // REQUIRED:
        //
        // $3 worth of SPARKD
        // 6 decimals
        // SPARKD mint
        // connected wallet authority
        //
        // NO DATABASE INSERT
        // NO DATABASE UPDATE
        // NO TOKEN TRANSFER
        // NO TOKEN BURN
        ////////////////////////////////////////////////////

        if (
            action ===
            "verify_burn"
        ) {


            ////////////////////////////////////////////////////
            // CONSTANTS
            ////////////////////////////////////////////////////

            const token2022Program =
                "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
            const requiredDecimals = SPARKD_DECIMALS;
            const quoteToken = body?.quoteToken;
            const quoteContestId = body?.contestId;
            const quoteMemeID = typeof body?.memeID === "string" ? body.memeID.trim() : "";
            let burnQuote;
            try {
                burnQuote = await verifyContestBurnQuote(quoteToken, wallet, quoteContestId, quoteMemeID);
            } catch (error) {
                return jsonResponse({
                    success: false,
                    verified: false,
                    error: error instanceof Error ? error.message : "Invalid contest burn quote."
                }, 400);
            }
            const requiredBurnAmount = String(burnQuote.rawAmount);


            ////////////////////////////////////////////////////
            // GET TRANSACTION SIGNATURE
            ////////////////////////////////////////////////////

            const burnTransaction =
                typeof body?.burnTransaction ===
                    "string"
                    ?
                    body.burnTransaction.trim()
                    :
                    "";


            ////////////////////////////////////////////////////
            // VALIDATE SIGNATURE
            ////////////////////////////////////////////////////

            if (
                burnTransaction.length <
                64 ||
                burnTransaction.length >
                100
            ) {

                return jsonResponse(

                    {

                        success:
                            false,

                        verified:
                            false,

                        error:
                            "Invalid burn transaction signature."

                    },

                    400

                );

            }


            console.log(

                "🔎 Verifying SPARKD burn transaction:",

                burnTransaction

            );


            ////////////////////////////////////////////////////
            // GET CONFIRMED TRANSACTION
            ////////////////////////////////////////////////////

            const transactionResponse =
                await fetch(

                    rpcUrl,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                jsonrpc:
                                    "2.0",

                                id:
                                    1,

                                method:
                                    "getTransaction",

                                params: [

                                    burnTransaction,

                                    {

                                        encoding:
                                            "jsonParsed",

                                        commitment:
                                            "confirmed",

                                        maxSupportedTransactionVersion:
                                            0

                                    }

                                ]

                            })

                    }

                );


            ////////////////////////////////////////////////////
            // RPC HTTP ERROR
            ////////////////////////////////////////////////////

            if (
                !transactionResponse.ok
            ) {

                throw new Error(

                    "Solana RPC returned HTTP " +
                    transactionResponse.status

                );

            }


            ////////////////////////////////////////////////////
            // PARSE RPC RESPONSE
            ////////////////////////////////////////////////////

            const transactionRpc =
                await transactionResponse.json();


            if (
                transactionRpc.error
            ) {

                throw new Error(

                    "Solana RPC error: " +
                    JSON.stringify(
                        transactionRpc.error
                    )

                );

            }


            const transaction =
                transactionRpc.result ||
                null;


            ////////////////////////////////////////////////////
            // TRANSACTION NOT FOUND
            ////////////////////////////////////////////////////

            if (
                !transaction
            ) {

                return jsonResponse({

                    success:
                        true,

                    verified:
                        false,

                    reason:
                        "Burn transaction was not found or is not yet confirmed.",

                    burnTransaction:
                        burnTransaction,

                    readOnly:
                        true

                });

            }


            const burnBlockTimeMs = Number(transaction.blockTime) * 1000;
            if (
                !Number.isFinite(burnBlockTimeMs) ||
                burnBlockTimeMs < Number(burnQuote.issuedAt) - 5000 ||
                burnBlockTimeMs > Number(burnQuote.expiresAt) + 5000
            ) {
                return jsonResponse({
                    success: true,
                    verified: false,
                    transactionFound: true,
                    reason: "The burn transaction falls outside its signed $3 entry quote window.",
                    burnTransaction,
                    readOnly: true,
                    burnsPerformed: false
                });
            }

            ////////////////////////////////////////////////////
            // TRANSACTION MUST HAVE SUCCEEDED
            ////////////////////////////////////////////////////

            if (
                transaction.meta?.err
            ) {

                return jsonResponse({

                    success:
                        true,

                    verified:
                        false,

                    reason:
                        "Burn transaction failed on-chain.",

                    burnTransaction:
                        burnTransaction,

                    transactionError:
                        transaction.meta.err,

                    readOnly:
                        true

                });

            }


            ////////////////////////////////////////////////////
            // GET TOP-LEVEL INSTRUCTIONS
            ////////////////////////////////////////////////////

            const instructions =
                transaction
                    ?.transaction
                    ?.message
                    ?.instructions ||
                [];


            ////////////////////////////////////////////////////
            // FIND REQUIRED BURNCHECKED INSTRUCTION
            ////////////////////////////////////////////////////

            let verifiedBurn =
                null;


            for (
                const instruction
                of instructions
            ) {


                ////////////////////////////////////////////////////
                // MUST BE TOKEN-2022
                ////////////////////////////////////////////////////

                if (
                    instruction?.programId !==
                    token2022Program
                ) {

                    continue;

                }


                ////////////////////////////////////////////////////
                // MUST BE PARSED BURNCHECKED
                ////////////////////////////////////////////////////

                if (
                    instruction?.parsed?.type !==
                    "burnChecked"
                ) {

                    continue;

                }


                const info =
                    instruction?.parsed?.info ||
                    {};


                ////////////////////////////////////////////////////
                // VERIFY SPARKD MINT
                ////////////////////////////////////////////////////

                if (
                    info.mint !==
                    SPARKD_MINT
                ) {

                    continue;

                }


                ////////////////////////////////////////////////////
                // VERIFY WALLET AUTHORITY
                ////////////////////////////////////////////////////

                if (
                    info.authority !==
                    wallet
                ) {

                    continue;

                }


                ////////////////////////////////////////////////////
                // VERIFY BURN AMOUNT
                ////////////////////////////////////////////////////

                const tokenAmount =
                    info.tokenAmount ||
                    {};


                if (
                    String(
                        tokenAmount.amount ||
                        ""
                    ) !==
                    requiredBurnAmount
                ) {

                    continue;

                }


                ////////////////////////////////////////////////////
                // VERIFY DECIMALS
                ////////////////////////////////////////////////////

                if (
                    Number(
                        tokenAmount.decimals
                    ) !==
                    requiredDecimals
                ) {

                    continue;

                }


                ////////////////////////////////////////////////////
                // MATCH FOUND
                ////////////////////////////////////////////////////

                verifiedBurn = {

                    tokenAccount:
                        info.account ||
                        null,

                    mint:
                        info.mint,

                    authority:
                        info.authority,

                    rawAmount:
                        String(
                            tokenAmount.amount
                        ),

                    amount:
                        Number(requiredBurnAmount) / (10 ** requiredDecimals),

                    decimals:
                        Number(
                            tokenAmount.decimals
                        ),

                    program:
                        token2022Program

                };


                break;

            }


            ////////////////////////////////////////////////////
            // REQUIRED BURN NOT FOUND
            ////////////////////////////////////////////////////

            if (
                !verifiedBurn
            ) {

                return jsonResponse({

                    success:
                        true,

                    verified:
                        false,

                    reason:
                        "Transaction does not contain the exact SPARKD Token-2022 burn from its signed $3 quote.",

                    burnTransaction:
                        burnTransaction,

                    wallet:
                        wallet,

                    mint:
                        SPARKD_MINT,

                    readOnly:
                        true,

                    burnsPerformed:
                        false

                });

            }


            ////////////////////////////////////////////////////
            // VERIFIED
            ////////////////////////////////////////////////////

            console.log(

                "🔥 VERIFIED $3 SPARKD ENTRY BURN:",

                {

                    transaction:
                        burnTransaction,

                    wallet:
                        wallet,

                    tokenAccount:
                        verifiedBurn.tokenAccount,

                    amount:
                        verifiedBurn.amount,

                    decimals:
                        verifiedBurn.decimals

                }

            );


            ////////////////////////////////////////////////////
            // RETURN VERIFIED RESULT
            ////////////////////////////////////////////////////

            return jsonResponse({

                success:
                    true,

                verified:
                    true,

                burnTransaction:
                    burnTransaction,

                wallet:
                    wallet,

                tokenAccount:
                    verifiedBurn.tokenAccount,

                mint:
                    verifiedBurn.mint,

                burnAmount:
                    verifiedBurn.amount,

                rawBurnAmount:
                    verifiedBurn.rawAmount,

                targetEntryUsd:
                    burnQuote.entryUsd,

                priceUsd:
                    Number(burnQuote.priceUsd),

                estimatedEntryUsd:
                    verifiedBurn.amount * Number(burnQuote.priceUsd),

                decimals:
                    verifiedBurn.decimals,

                program:
                    verifiedBurn.program,

                slot:
                    transaction.slot,

                blockTime:
                    transaction.blockTime,

                readOnly:
                    true,

                burnsPerformed:
                    false,

                transfersPerformed:
                    false

            });

        }

      ////////////////////////////////////////////////////
// RECORD VERIFIED BURN RECEIPT
////////////////////////////////////////////////////

if (
    action ===
    "record_burn_receipt"
) {

    const {
        contestId,
        burnTransaction,
        memeID,
        quoteToken
    } = body;


    if (
        !contestId ||
        !burnTransaction ||
        typeof memeID !== "string" ||
        !memeID.trim()
    ) {

        return jsonResponse(
            {
                success:
                    false,

                error:
                    "Missing contestId, burnTransaction, or memeID."
            },
            400
        );

    }


    ////////////////////////////////////////////////////
    // SERVER CREDENTIALS
    ////////////////////////////////////////////////////

    const supabaseUrl =
        Deno.env.get(
            "SUPABASE_URL"
        );


    const serviceRoleKey =
        Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY"
        );


    if (
        !supabaseUrl ||
        !serviceRoleKey
    ) {

        throw new Error(
            "Supabase server credentials are missing."
        );

    }


    ////////////////////////////////////////////////////
    // CHECK EXISTING RECEIPT BEFORE VERIFYING
    ////////////////////////////////////////////////////

    const existingReceiptResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_burn_receipts" +
            "?contest_id=eq." +
            encodeURIComponent(
                contestId
            ) +
            "&wallet_address=eq." +
            encodeURIComponent(
                wallet
            ) +
            "&meme_id=eq." +
            encodeURIComponent(
                memeID.trim()
            ) +
            "&limit=1",
            {
                method:
                    "GET",

                headers: {
                    "apikey":
                        serviceRoleKey,

                    "Authorization":
                        "Bearer " +
                        serviceRoleKey,

                    "Accept":
                        "application/json"
                }
            }
        );


    if (
        !existingReceiptResponse.ok
    ) {

        const errorText =
            await existingReceiptResponse.text();

        throw new Error(
            "Unable to check existing burn receipt: " +
            errorText
        );

    }


    const existingReceipts =
        await existingReceiptResponse.json();


    const existingReceipt =
        existingReceipts?.[0] ||
        null;


    ////////////////////////////////////////////////////
    // DIFFERENT RECEIPT = REJECT IMMEDIATELY
    //
    // DO NOT VERIFY IT
    // DO NOT OVERWRITE EXISTING RECEIPT
    ////////////////////////////////////////////////////

    if (
        existingReceipt &&
        existingReceipt.burn_transaction !==
            burnTransaction
    ) {

        return jsonResponse(
            {
                success:
                    false,

                recorded:
                    false,

                verified:
                    false,

                alreadyExists:
                    true,

                conflict:
                    true,

                error:
                    "A different burn receipt already exists for this wallet and contest.",

                existingBurnTransaction:
                    existingReceipt.burn_transaction
            },
            409
        );

    }


    ////////////////////////////////////////////////////
    // SAME VERIFIED RECEIPT = IDEMPOTENT SUCCESS
    ////////////////////////////////////////////////////

    if (
        existingReceipt &&
        existingReceipt.burn_transaction ===
            burnTransaction &&
        existingReceipt.burn_verified ===
            true
    ) {

        return jsonResponse({

            success:
                true,

            recorded:
                true,

            verified:
                true,

            alreadyExists:
                true,

            idempotent:
                true,

            burnTransaction:
                burnTransaction,

            receipt:
                existingReceipt

        });

    }


    ////////////////////////////////////////////////////
    // NO VERIFIED RECEIPT YET
    //
    // RE-VERIFY BURN SERVER-SIDE
    ////////////////////////////////////////////////////

    const verifyResponse =
        await fetch(
            "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/super-handler",
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        action:
                            "verify_burn",

                        wallet:
                            wallet,

                        burnTransaction:
                            burnTransaction,

                        contestId:
                            contestId,

                        memeID:
                            memeID.trim(),

                        quoteToken:
                            quoteToken
                    })
            }
        );


    const verification =
        await verifyResponse.json();


    if (
        !verifyResponse.ok ||
        verification?.success !== true ||
        verification?.verified !== true
    ) {

        return jsonResponse(
            {
                success:
                    false,

                verified:
                    false,

                error:
                    verification?.error ||
                    verification?.reason ||
                    "Burn verification failed."
            },
            400
        );

    }

    ////////////////////////////////////////////////////
// REQUIRE BURN TO HAVE LANDED DURING CONTEST WINDOW
////////////////////////////////////////////////////

const burnContestResponse =
    await fetch(
        supabaseUrl +
        "/rest/v1/meme_week_contests" +
        "?id=eq." +
        encodeURIComponent(
            contestId
        ) +
        "&select=id,week_start,week_end" +
        "&limit=1",
        {
            method:
                "GET",

            headers: {
                "apikey":
                    serviceRoleKey,

                "Authorization":
                    "Bearer " +
                    serviceRoleKey
            }
        }
    );


if (
    !burnContestResponse.ok
) {

    return jsonResponse(
        {
            success: false,
            verified: false,
            error:
                "Unable to verify burn against contest window."
        },
        409
    );

}


const burnContestRows =
    await burnContestResponse.json();


const burnContest =
    burnContestRows?.[0] ||
    null;


const burnBlockTimeMs =
    Number(
        verification?.blockTime
    ) * 1000;


const burnWeekStartMs =
    Date.parse(
        burnContest?.week_start ||
        ""
    );


const burnWeekEndMs =
    Date.parse(
        burnContest?.week_end ||
        ""
    );


if (
    !burnContest ||
    !Number.isFinite(
        burnBlockTimeMs
    ) ||
    !Number.isFinite(
        burnWeekStartMs
    ) ||
    !Number.isFinite(
        burnWeekEndMs
    ) ||
    burnBlockTimeMs <
        burnWeekStartMs ||
    burnBlockTimeMs >=
        burnWeekEndMs
) {

    return jsonResponse(
        {
            success: false,
            verified: false,
            error:
                "Verified SPARKD burn did not occur during this contest submission window."
        },
        409
    );

}


    ////////////////////////////////////////////////////
    // SAME TRANSACTION EXISTS BUT WAS NOT VERIFIED
    //
    // REPAIR IT AFTER SUCCESSFUL ON-CHAIN VERIFICATION
    ////////////////////////////////////////////////////

    if (
        existingReceipt
    ) {

        const repairResponse =
            await fetch(
                supabaseUrl +
                "/rest/v1/meme_week_burn_receipts" +
                "?id=eq." +
                encodeURIComponent(
                    existingReceipt.id
                ),
                {
                    method:
                        "PATCH",

                    headers: {
                        "apikey":
                            serviceRoleKey,

                        "Authorization":
                            "Bearer " +
                            serviceRoleKey,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=representation"
                    },

                    body:
                        JSON.stringify({
                            burn_verified:
                                true,

                            burn_amount:
                                verification.burnAmount,

                            meme_id:
                                memeID.trim(),

                            updated_at:
                                new Date().toISOString()
                        })
                }
            );


        if (
            !repairResponse.ok
        ) {

            const errorText =
                await repairResponse.text();

            throw new Error(
                "Unable to repair burn receipt: " +
                errorText
            );

        }


        const repairedReceipts =
            await repairResponse.json();


        return jsonResponse({

            success:
                true,

            recorded:
                true,

            verified:
                true,

            alreadyExists:
                true,

            idempotent:
                true,

            repaired:
                true,

            burnTransaction:
                burnTransaction,

            receipt:
                repairedReceipts?.[0] ||
                existingReceipt

        });

    }


    ////////////////////////////////////////////////////
    // INSERT NEW VERIFIED RECEIPT
    ////////////////////////////////////////////////////

    const receiptResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_burn_receipts",
            {
                method:
                    "POST",

                headers: {
                    "apikey":
                        serviceRoleKey,

                    "Authorization":
                        "Bearer " +
                        serviceRoleKey,

                    "Content-Type":
                        "application/json",

                    "Prefer":
                        "return=representation"
                },

                body:
                    JSON.stringify({
                        contest_id:
                            contestId,

                        wallet_address:
                            wallet,

                        meme_id:
                            memeID.trim(),

                        burn_transaction:
                            burnTransaction,

                        burn_amount:
                            verification.burnAmount,

                        burn_verified:
                            true,

                        updated_at:
                            new Date().toISOString()
                    })
            }
        );


    if (
        !receiptResponse.ok
    ) {

        const errorText =
            await receiptResponse.text();

        throw new Error(
            "Unable to record burn receipt: " +
            errorText
        );

    }


    const receipts =
        await receiptResponse.json();


    return jsonResponse({

        success:
            true,

        recorded:
            true,

        verified:
            true,

        alreadyExists:
            false,

        idempotent:
            false,

        burnTransaction:
            burnTransaction,

        receipt:
            receipts?.[0] ||
            null

    });

}


////////////////////////////////////////////////////
// GET EXISTING BURN RECEIPT — READ ONLY
////////////////////////////////////////////////////

if (
    action ===
    "get_burn_receipt"
) {

    const {
        contestId,
        memeID
    } = body;


    if (
        !contestId ||
        typeof memeID !== "string" ||
        !memeID.trim()
    ) {

        return jsonResponse(
            {
                success:
                    false,

                error:
                    "Missing contestId or memeID."
            },
            400
        );

    }


    const supabaseUrl =
        Deno.env.get(
            "SUPABASE_URL"
        );


    const serviceRoleKey =
        Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY"
        );


    if (
        !supabaseUrl ||
        !serviceRoleKey
    ) {

        throw new Error(
            "Supabase server credentials are missing."
        );

    }


    const receiptResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_burn_receipts" +
            "?contest_id=eq." +
            encodeURIComponent(
                contestId
            ) +
            "&wallet_address=eq." +
            encodeURIComponent(
                wallet
            ) +
            "&meme_id=eq." +
            encodeURIComponent(
                memeID.trim()
            ) +
            "&limit=1",
            {
                method:
                    "GET",

                headers: {
                    "apikey":
                        serviceRoleKey,

                    "Authorization":
                        "Bearer " +
                        serviceRoleKey,

                    "Accept":
                        "application/json"
                }
            }
        );


    if (
        !receiptResponse.ok
    ) {

        const errorText =
            await receiptResponse.text();

        throw new Error(
            "Unable to check burn receipt: " +
            errorText
        );

    }


    const receipts =
        await receiptResponse.json();


    const receipt =
        receipts?.[0] ||
        null;


    return jsonResponse({

        success:
            true,

        found:
            Boolean(
                receipt
            ),

        verified:
            receipt?.burn_verified ===
            true,

        receipt:
            receipt

    });

}

////////////////////////////////////////////////////
// FINALIZE VERIFIED CONTEST SUBMISSION
////////////////////////////////////////////////////

if (
    action ===
    "finalize_submission"
) {

    const {
        contestId,
        burnTransaction,
        submissionId,
        creatorId,
        memeTitle,
        memeImageUrl,
        dnaVerificationData
    } = body;


    ////////////////////////////////////////////////////
    // VALIDATE REQUIRED DATA
    ////////////////////////////////////////////////////

    if (
        !contestId ||
        !burnTransaction ||
        !submissionId ||
        !creatorId ||
        !memeImageUrl
    ) {

        return jsonResponse(
            {
                success:
                    false,

                error:
                    "Missing required submission data."
            },
            400
        );

    }


    // The meme ID ties this submission to its burn receipt. No PNG metadata is required.
    const finalMemeID = String(body?.memeID || dnaVerificationData?.memeID || "").trim();
    if (!/^SPK-[A-Z0-9]{12}$/.test(finalMemeID)) {
        return jsonResponse({success:false, finalized:false, error:"A valid meme ID is required for burn recovery."}, 400);
    }
    if (typeof creatorId !== "string" || !creatorId.trim()) {
        return jsonResponse({success:false, finalized:false, error:"Creator identity is required."}, 400);
    }
    if (typeof memeTitle !== "string" || !memeTitle.trim()) {
        return jsonResponse({success:false, finalized:false, error:"Give your meme a title before submitting."}, 400);
    }

    const supabaseUrl =
        Deno.env.get(
            "SUPABASE_URL"
        );


    const serviceRoleKey =
        Deno.env.get(
            "SUPABASE_SERVICE_ROLE_KEY"
        );


    if (
        !supabaseUrl ||
        !serviceRoleKey
    ) {

        throw new Error(
            "Supabase server credentials are missing."
        );

    }


    ////////////////////////////////////////////////////
    // AUTHORITATIVE CONTEST WINDOW CHECK
    // Never finalize a new entry outside this contest's
    // active submission window, regardless of browser state.
    ////////////////////////////////////////////////////

    const contestWindowResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_contests" +
            "?id=eq." +
            encodeURIComponent(contestId) +
            "&select=id,status,week_start,week_end&limit=1",
            {
                method: "GET",
                headers: {
                    "apikey": serviceRoleKey,
                    "Authorization": "Bearer " + serviceRoleKey,
                    "Accept": "application/json"
                }
            }
        );

    if (!contestWindowResponse.ok) {
        throw new Error("Unable to verify the contest submission window.");
    }

    const contestWindowRows = await contestWindowResponse.json();
    const contestWindow = contestWindowRows?.[0] || null;
    const serverNow = Date.now();
    const contestStartMs = contestWindow ? Date.parse(contestWindow.week_start) : NaN;
    const contestEndMs = contestWindow ? Date.parse(contestWindow.week_end) : NaN;

    if (
        !contestWindow ||
        contestWindow.status !== "submission" ||
        !Number.isFinite(contestStartMs) ||
        !Number.isFinite(contestEndMs) ||
        serverNow < contestStartMs ||
        serverNow >= contestEndMs
    ) {
        return jsonResponse(
            {
                success: false,
                finalized: false,
                error: "Meme of the Week submissions are not open for this contest."
            },
            409
        );
    }


    ////////////////////////////////////////////////////
    // HELPER: LINK RECEIPT TO SUBMISSION
    ////////////////////////////////////////////////////

    const linkReceiptToSubmission =
        async (
            receiptId,
            finalSubmissionId
        ) => {

            const linkResponse =
                await fetch(
                    supabaseUrl +
                    "/rest/v1/meme_week_burn_receipts" +
                    "?id=eq." +
                    encodeURIComponent(
                        receiptId
                    ),
                    {
                        method:
                            "PATCH",

                        headers: {
                            "apikey":
                                serviceRoleKey,

                            "Authorization":
                                "Bearer " +
                                serviceRoleKey,

                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                submission_id:
                                    finalSubmissionId,

                                updated_at:
                                    new Date().toISOString()
                            })
                    }
                );


            return linkResponse.ok;

        };


    ////////////////////////////////////////////////////
    // GET VERIFIED BURN RECEIPT FIRST
    ////////////////////////////////////////////////////

    const receiptResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_burn_receipts" +
            "?contest_id=eq." +
            encodeURIComponent(
                contestId
            ) +
            "&wallet_address=eq." +
            encodeURIComponent(
                wallet
            ) +
            "&meme_id=eq." +
            encodeURIComponent(
                finalMemeID
            ) +
            "&limit=1",
            {
                method:
                    "GET",

                headers: {
                    "apikey":
                        serviceRoleKey,

                    "Authorization":
                        "Bearer " +
                        serviceRoleKey,

                    "Accept":
                        "application/json"
                }
            }
        );


    if (
        !receiptResponse.ok
    ) {

        throw new Error(
            "Unable to retrieve burn receipt."
        );

    }


    const receipts =
        await receiptResponse.json();


    const receipt =
        receipts?.[0] ||
        null;


    ////////////////////////////////////////////////////
    // REQUIRE VERIFIED MATCHING RECEIPT
    ////////////////////////////////////////////////////

    if (
        !receipt ||
        receipt.burn_verified !==
            true ||
        receipt.burn_transaction !==
            burnTransaction
    ) {

        return jsonResponse(
            {
                success:
                    false,

                finalized:
                    false,

                error:
                    "A matching verified SPARKD burn receipt was not found."
            },
            400
        );

    }


    ////////////////////////////////////////////////////
    // CHECK FOR EXISTING SUBMISSION
    ////////////////////////////////////////////////////

    const existingResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_submissions" +
            "?contest_id=eq." +
            encodeURIComponent(
                contestId
            ) +
            "&wallet_address=eq." +
            encodeURIComponent(
                wallet
            ) +
            "&limit=1",
            {
                method:
                    "GET",

                headers: {
                    "apikey":
                        serviceRoleKey,

                    "Authorization":
                        "Bearer " +
                        serviceRoleKey,

                    "Accept":
                        "application/json"
                }
            }
        );


    if (
        !existingResponse.ok
    ) {

        throw new Error(
            "Unable to check existing submission."
        );

    }


    const existingRows =
        await existingResponse.json();


    const existingSubmission =
        existingRows?.[0] ||
        null;


    ////////////////////////////////////////////////////
    // ALREADY FINALIZED
    //
    // REPAIR RECEIPT LINK IF NEEDED
    ////////////////////////////////////////////////////

    if (
        existingSubmission
    ) {

        if (
            existingSubmission.burn_verified ===
                true &&
            existingSubmission.burn_transaction ===
                burnTransaction
        ) {

            let receiptLinked =
                receipt.submission_id ===
                existingSubmission.id;


            if (
                !receiptLinked
            ) {

                receiptLinked =
                    await linkReceiptToSubmission(
                        receipt.id,
                        existingSubmission.id
                    );

            }


            return jsonResponse({

                success:
                    true,

                finalized:
                    true,

                recovered:
                    true,

                alreadyExists:
                    true,

                receiptLinked:
                    receiptLinked,

                submission:
                    existingSubmission

            });

        }


        return jsonResponse(
            {
                success:
                    false,

                finalized:
                    false,

                alreadyExists:
                    true,

                error:
                    "A different submission already exists for this wallet and contest."
            },
            409
        );

    }


    ////////////////////////////////////////////////////
    // BUILD SUBMISSION
    ////////////////////////////////////////////////////

    const submissionData = {

        id:
            submissionId,

        contest_id:
            contestId,

        creator_id:
            creatorId,

        wallet_address:
            wallet,

        meme_title:
            memeTitle ||
            "Untitled SPARKD Meme",

        meme_image_url:
            memeImageUrl,

        burn_amount:
            Number(receipt.burn_amount),

        burn_transaction:
            burnTransaction,

        burn_verified:
            true,

        status:
            "pending"

    };


    ////////////////////////////////////////////////////
    // INSERT VERIFIED SUBMISSION
    ////////////////////////////////////////////////////

    const insertResponse =
        await fetch(
            supabaseUrl +
            "/rest/v1/meme_week_submissions",
            {
                method:
                    "POST",

                headers: {
                    "apikey":
                        serviceRoleKey,

                    "Authorization":
                        "Bearer " +
                        serviceRoleKey,

                    "Content-Type":
                        "application/json",

                    "Prefer":
                        "return=representation"
                },

                body:
                    JSON.stringify(
                        submissionData
                    )
            }
        );


    ////////////////////////////////////////////////////
    // INSERT FAILED
    //
    // POSSIBLE RACE:
    // RE-QUERY BEFORE DECLARING FAILURE
    ////////////////////////////////////////////////////

    if (
        !insertResponse.ok
    ) {

        const raceCheckResponse =
            await fetch(
                supabaseUrl +
                "/rest/v1/meme_week_submissions" +
                "?contest_id=eq." +
                encodeURIComponent(
                    contestId
                ) +
                "&wallet_address=eq." +
                encodeURIComponent(
                    wallet
                ) +
                "&limit=1",
                {
                    method:
                        "GET",

                    headers: {
                        "apikey":
                            serviceRoleKey,

                        "Authorization":
                            "Bearer " +
                            serviceRoleKey,

                        "Accept":
                            "application/json"
                    }
                }
            );


        if (
            raceCheckResponse.ok
        ) {

            const raceRows =
                await raceCheckResponse.json();


            const racedSubmission =
                raceRows?.[0] ||
                null;


            if (
                racedSubmission &&
                racedSubmission.burn_verified ===
                    true &&
                racedSubmission.burn_transaction ===
                    burnTransaction
            ) {

                const receiptLinked =
                    await linkReceiptToSubmission(
                        receipt.id,
                        racedSubmission.id
                    );


                return jsonResponse({

                    success:
                        true,

                    finalized:
                        true,

                    recovered:
                        true,

                    raceRecovered:
                        true,

                    alreadyExists:
                        true,

                    receiptLinked:
                        receiptLinked,

                    submission:
                        racedSubmission

                });

            }


            if (
                racedSubmission
            ) {

                return jsonResponse(
                    {
                        success:
                            false,

                        finalized:
                            false,

                        alreadyExists:
                            true,

                        error:
                            "A different submission already exists for this wallet and contest."
                    },
                    409
                );

            }

        }


        const errorText =
            await insertResponse.text();


        throw new Error(
            "Unable to finalize submission: " +
            errorText
        );

    }


    const insertedRows =
        await insertResponse.json();


    const submission =
        insertedRows?.[0] ||
        submissionData;


    ////////////////////////////////////////////////////
    // LINK RECEIPT TO NEW SUBMISSION
    ////////////////////////////////////////////////////

    const receiptLinked =
        await linkReceiptToSubmission(
            receipt.id,
            submission.id
        );


    if (
        !receiptLinked
    ) {

        console.error(
            "⚠️ Submission created but receipt link update failed."
        );

    }


    ////////////////////////////////////////////////////
    // SUCCESS
    ////////////////////////////////////////////////////

    return jsonResponse({

        success:
            true,

        finalized:
            true,

        recovered:
            false,

        receiptLinked:
            receiptLinked,

        burnTransaction:
            burnTransaction,

        submission:
            submission

    });

}

        // ============================================================
        // GET CURRENT BLOCK HEIGHT — READ ONLY
        // ============================================================
        if (action === "get_block_height") {
            const rpcResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getBlockHeight",
            params: [
                {
                    commitment: "confirmed"
                }
            ]
        })
    });

    const rpcData = await rpcResponse.json();

    if (rpcData?.error) {
        return jsonResponse(
            {
                success: false,
                error: "Solana RPC returned an error.",
                rpcError: rpcData.error,
                readOnly: true
            },
            502
        );
    }

    return jsonResponse({
        success: true,
        blockHeight: rpcData?.result ?? null,
        readOnly: true
    });
}

      
        ////////////////////////////////////////////////////
        // ACTION: PREPARE SPARKD BURN
        //
        // BUILDS AN UNSIGNED RECENT-BLOCKHASH TRANSACTION.
        // EXACTLY ONE INSTRUCTION: TOKEN-2022 BURNCHECKED.
        // EXACTLY ONE SIGNER: CONNECTED WALLET.
        //
        // DOES NOT SIGN.
        // DOES NOT BROADCAST.
        // DOES NOT BURN.
        ////////////////////////////////////////////////////

        if (
            action ===
            "prepare_burn"
        ) {

            if (
                typeof wallet !== "string" ||
                wallet.length < 32 ||
                wallet.length > 50
            ) {
                return jsonResponse(
                    { success: false, error: "Invalid wallet address." },
                    400
                );
            }

            if (
                typeof contestId !== "string" ||
                !contestId
            ) {
                return jsonResponse(
                    { success: false, error: "Contest ID is required." },
                    400
                );
            }

            if (
                typeof tokenAccount !== "string" ||
                tokenAccount.length < 32 ||
                tokenAccount.length > 50
            ) {
                return jsonResponse(
                    { success: false, error: "Invalid SPARKD token account." },
                    400
                );
            }

            const preburnMemeID =
                body?.memeID ||
                forgeData?.memeID ||
                null;

            if (
                typeof preburnMemeID !== "string" ||
                !preburnMemeID.trim()
            ) {
                return jsonResponse(
                    { success: false, error: "Forge Meme ID is required before preparing a SPARKD burn." },
                    400
                );
            }

            ////////////////////////////////////////////////////
            // VERIFY TOKEN ACCOUNT ON-CHAIN
            ////////////////////////////////////////////////////

            const tokenAccountInfoResponse =
                await fetch(
                    rpcUrl,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            jsonrpc: "2.0",
                            id: 1,
                            method: "getAccountInfo",
                            params: [
                                tokenAccount,
                                {
                                    encoding: "jsonParsed",
                                    commitment: "confirmed"
                                }
                            ]
                        })
                    }
                );

            if (!tokenAccountInfoResponse.ok) {
                throw new Error("Unable to read SPARKD token account.");
            }

            const tokenAccountInfoRpc =
                await tokenAccountInfoResponse.json();

            if (tokenAccountInfoRpc.error) {
                throw new Error("Solana RPC error while reading SPARKD token account.");
            }

            const verifiedTokenAccountInfo =
                tokenAccountInfoRpc?.result?.value ||
                null;

            if (!verifiedTokenAccountInfo) {
                return jsonResponse(
                    { success: false, error: "SPARKD token account was not found." },
                    400
                );
            }

            const parsedTokenInfo =
                verifiedTokenAccountInfo?.data?.parsed?.info ||
                null;

            if (
                verifiedTokenAccountInfo.owner !==
                "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            ) {
                return jsonResponse(
                    { success: false, error: "SPARKD token account is not owned by Token-2022." },
                    400
                );
            }

            if (
                !parsedTokenInfo ||
                parsedTokenInfo.mint !== SPARKD_MINT ||
                parsedTokenInfo.owner !== wallet
            ) {
                return jsonResponse(
                    { success: false, error: "SPARKD token account does not match the wallet and mint." },
                    400
                );
            }

            const rawTokenBalance =
                parsedTokenInfo?.tokenAmount?.amount;

            ////////////////////////////////////////////////////
            // VERIFY CONTEST + SERVER-SIDE TIME WINDOW
            ////////////////////////////////////////////////////

            const currentContestResponse =
                await fetch(
                    supabaseUrl +
                    "/rest/v1/meme_week_contests" +
                    "?id=eq." +
                    encodeURIComponent(contestId) +
                    "&status=eq.submission" +
                    "&select=id,week_start,week_end" +
                    "&limit=1",
                    {
                        method: "GET",
                        headers: {
                            "apikey": serviceRoleKey,
                            "Authorization": "Bearer " + serviceRoleKey
                        }
                    }
                );

            if (!currentContestResponse.ok) {
                throw new Error("Unable to retrieve current contest.");
            }

            const currentContests =
                await currentContestResponse.json();

            const currentContest =
                currentContests?.[0] ||
                null;

            if (
                !currentContest ||
                currentContest.id !== contestId
            ) {
                return jsonResponse(
                    { success: false, error: "Contest is not the current submission contest." },
                    409
                );
            }

            const nowMs = Date.now();
            const weekStartMs = Date.parse(currentContest.week_start);
            const weekEndMs = Date.parse(currentContest.week_end);

            if (
                !Number.isFinite(weekStartMs) ||
                !Number.isFinite(weekEndMs)
            ) {
                throw new Error("Contest submission window is invalid.");
            }

            if (
                nowMs < weekStartMs ||
                nowMs >= weekEndMs
            ) {
                return jsonResponse(
                    {
                        success: false,
                        error: "Contest submissions are not currently open.",
                        weekStart: currentContest.week_start,
                        weekEnd: currentContest.week_end
                    },
                    409
                );
            }

            ////////////////////////////////////////////////////
            // AUTHORITATIVE PARTICIPANT ELIGIBILITY CHECK
            //
            // IMPORTANT: this must happen BEFORE a burn transaction
            // is constructed. It mirrors the database participant
            // guard so a creator cannot burn from wallet B after
            // already entering from wallet A.
            ////////////////////////////////////////////////////

            const preburnCreatorId =
                body?.creatorId ||
                forgeData?.creatorID ||
                null;

            if (
                typeof preburnCreatorId !== "string" ||
                !preburnCreatorId
            ) {
                return jsonResponse(
                    {
                        success: false,
                        error: "Creator identity is required before preparing a SPARKD burn."
                    },
                    400
                );
            }

            const eligibilityResponse =
                await fetch(
                    supabaseUrl + "/rest/v1/rpc/check_meme_week_submission_eligibility",
                    {
                        method: "POST",
                        headers: {
                            "apikey": serviceRoleKey,
                            "Authorization": "Bearer " + serviceRoleKey,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            p_contest_id: contestId,
                            p_creator_id: preburnCreatorId,
                            p_wallet_address: wallet
                        })
                    }
                );

            if (!eligibilityResponse.ok) {
                throw new Error("Unable to verify participant submission eligibility.");
            }

            const eligibility =
                await eligibilityResponse.json();

            if (eligibility?.eligible !== true) {
                return jsonResponse(
                    {
                        success: false,
                        eligible: false,
                        alreadyExists: true,
                        error: "This SPARKD creator already has an active submission in this contest. No burn was prepared.",
                        submissionId: eligibility?.submission_id || null,
                        existingBurnTransaction: eligibility?.existing_burn_transaction || null,
                        burnVerified: eligibility?.burn_verified === true
                    },
                    409
                );
            }

            ////////////////////////////////////////////////////
            // BLOCK SECOND BURN IF RECEIPT/SUBMISSION EXISTS
            ////////////////////////////////////////////////////

            const existingReceiptResponse =
                await fetch(
                    supabaseUrl +
                    "/rest/v1/meme_week_burn_receipts" +
                    "?contest_id=eq." +
                    encodeURIComponent(contestId) +
                    "&wallet_address=eq." +
                    encodeURIComponent(wallet) +
                    "&meme_id=eq." +
                    encodeURIComponent(preburnMemeID.trim()) +
                    "&select=id,burn_transaction,burn_verified,meme_id" +
                    "&limit=1",
                    {
                        method: "GET",
                        headers: {
                            "apikey": serviceRoleKey,
                            "Authorization": "Bearer " + serviceRoleKey
                        }
                    }
                );

            if (!existingReceiptResponse.ok) {
                throw new Error("Unable to check existing SPARKD burn receipt.");
            }

            const existingReceipts =
                await existingReceiptResponse.json();

            if (existingReceipts?.[0]) {
                return jsonResponse(
                    {
                        success: false,
                        error: "A SPARKD burn receipt already exists for this wallet and contest. Do not burn again.",
                        existingBurnTransaction:
                            existingReceipts[0].burn_transaction || null,
                        burnVerified:
                            existingReceipts[0].burn_verified === true
                    },
                    409
                );
            }

            const existingSubmissionResponse =
                await fetch(
                    supabaseUrl +
                    "/rest/v1/meme_week_submissions" +
                    "?contest_id=eq." +
                    encodeURIComponent(contestId) +
                    "&wallet_address=eq." +
                    encodeURIComponent(wallet) +
                    "&select=id,burn_transaction,burn_verified" +
                    "&limit=1",
                    {
                        method: "GET",
                        headers: {
                            "apikey": serviceRoleKey,
                            "Authorization": "Bearer " + serviceRoleKey
                        }
                    }
                );

            if (!existingSubmissionResponse.ok) {
                throw new Error("Unable to check existing SPARKD submission.");
            }

            const existingSubmissions =
                await existingSubmissionResponse.json();

            if (existingSubmissions?.[0]) {
                return jsonResponse(
                    {
                        success: false,
                        error: "A submission already exists for this wallet and contest. Do not burn again.",
                        submissionId: existingSubmissions[0].id,
                        existingBurnTransaction:
                            existingSubmissions[0].burn_transaction || null,
                        burnVerified:
                            existingSubmissions[0].burn_verified === true
                    },
                    409
                );
            }

            const contestQuote = await getContestBurnQuote();
            const quoteIssuedAt = Date.now();
            const quoteExpiresAt = quoteIssuedAt + CONTEST_BURN_QUOTE_TTL_MS;
            if (
                typeof rawTokenBalance !== "string" ||
                BigInt(rawTokenBalance) < BigInt(contestQuote.rawAmount)
            ) {
                return jsonResponse(
                    {
                        success: false,
                        error: `Wallet needs at least ${contestQuote.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })} SPARKD for this $3 entry burn.`,
                        requiredSparkd: contestQuote.amount,
                        targetEntryUsd: CONTEST_ENTRY_USD
                    },
                    400
                );
            }
            const quoteToken = await signContestBurnQuote({
                version: 1,
                wallet,
                contestId,
                memeID: preburnMemeID.trim(),
                rawAmount: contestQuote.rawAmount,
                priceUsd: contestQuote.priceUsd,
                entryUsd: CONTEST_ENTRY_USD,
                issuedAt: quoteIssuedAt,
                expiresAt: quoteExpiresAt
            });

            ////////////////////////////////////////////////////
            // BUILD EXACT TOKEN-2022 BURNCHECKED INSTRUCTION
            ////////////////////////////////////////////////////

            const walletPublicKey =
                new PublicKey(wallet);

            const tokenAccountPublicKey =
                new PublicKey(tokenAccount);

            const mintPublicKey =
                new PublicKey(SPARKD_MINT);

            const tokenProgramPublicKey =
                new PublicKey(
                    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
                );

            const burnInstructionData =
                new Uint8Array(10);

            burnInstructionData[0] = 15;

            const rawBurnAmount = BigInt(contestQuote.rawAmount);

            for (let i = 0; i < 8; i++) {
                burnInstructionData[1 + i] =
                    Number(
                        (rawBurnAmount >> BigInt(8 * i)) & 255n
                    );
            }

            burnInstructionData[9] =
                SPARKD_DECIMALS;

            const burnInstruction =
                new TransactionInstruction({
                    programId: tokenProgramPublicKey,
                    keys: [
                        {
                            pubkey: tokenAccountPublicKey,
                            isSigner: false,
                            isWritable: true
                        },
                        {
                            pubkey: mintPublicKey,
                            isSigner: false,
                            isWritable: true
                        },
                        {
                            pubkey: walletPublicKey,
                            isSigner: true,
                            isWritable: false
                        }
                    ],
                    data: burnInstructionData
                });

            ////////////////////////////////////////////////////
            // GET FRESH RECENT BLOCKHASH
            ////////////////////////////////////////////////////

            const latestBlockhashResponse =
                await fetch(
                    rpcUrl,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            jsonrpc: "2.0",
                            id: 1,
                            method: "getLatestBlockhash",
                            params: [
                                { commitment: "confirmed" }
                            ]
                        })
                    }
                );

            if (!latestBlockhashResponse.ok) {
                throw new Error("Unable to retrieve a fresh Solana blockhash.");
            }

            const latestBlockhashRpc =
                await latestBlockhashResponse.json();

            if (latestBlockhashRpc.error) {
                throw new Error("Solana RPC error while retrieving recent blockhash.");
            }

            const latestBlockhash =
                latestBlockhashRpc?.result?.value?.blockhash ||
                null;

            const lastValidBlockHeight =
                latestBlockhashRpc?.result?.value?.lastValidBlockHeight;

            if (
                typeof latestBlockhash !== "string" ||
                !latestBlockhash ||
                typeof lastValidBlockHeight !== "number"
            ) {
                throw new Error("Solana RPC returned invalid blockhash data.");
            }

            ////////////////////////////////////////////////////
            // BUILD CLEAN ONE-INSTRUCTION UNSIGNED TRANSACTION
            ////////////////////////////////////////////////////

            const burnTransaction =
                new Transaction();

            burnTransaction.feePayer =
                walletPublicKey;

            burnTransaction.recentBlockhash =
                latestBlockhash;

            burnTransaction.add(
                burnInstruction
            );

            const unsignedTransactionBytes =
                burnTransaction.serialize({
                    requireAllSignatures: false,
                    verifySignatures: false
                });

            const unsignedTransactionBase64 =
                btoa(
                    String.fromCharCode(
                        ...unsignedTransactionBytes
                    )
                );

            return jsonResponse({
                success: true,
                prepared: true,
                transactionBuilt: true,
                wallet: wallet,
                mint: SPARKD_MINT,
                tokenProgram:
                    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
                burnAmount: contestQuote.amount,
                rawBurnAmount: contestQuote.rawAmount,
                targetEntryUsd: CONTEST_ENTRY_USD,
                priceUsd: contestQuote.priceUsd,
                estimatedEntryUsd: contestQuote.estimatedUsd,
                priceSource: contestQuote.priceSource,
                quoteObservedAt: contestQuote.observedAt,
                quoteExpiresAt: new Date(quoteExpiresAt).toISOString(),
                quoteToken,
                decimals: SPARKD_DECIMALS,
                recentBlockhash: latestBlockhash,
                lastValidBlockHeight: lastValidBlockHeight,
                unsignedTransaction: unsignedTransactionBase64,
                signerCount: 1,
                instructionCount: 1,
                durableNonce: false,
                signed: false,
                sent: false,
                burnsPerformed: false,
                transfersPerformed: false
            });
        }


        // Compatibility for older app versions. No image metadata is required.
        if (action === "verify_dna") {
            return jsonResponse({success:true, verified:true,
                memeID:forgeData?.memeID || null, creatorID:forgeData?.creatorID || null});
        }

        ////////////////////////////////////////////////////
        // READ-ONLY SPARKD BALANCE CHECK
        //
        // NO TRANSACTION
        // NO TRANSFER
        // NO BURN
        ////////////////////////////////////////////////////

        const rpcResponse =
            await fetch(

                rpcUrl,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            jsonrpc:
                                "2.0",

                            id:
                                1,

                            method:
                                "getTokenAccountsByOwner",

                            params: [

                                wallet,

                                {

                                    mint:
                                        SPARKD_MINT

                                },

                                {

                                    encoding:
                                        "jsonParsed",

                                    commitment:
                                        "confirmed"

                                }

                            ]

                        })

                }

            );


        if (
            !rpcResponse.ok
        ) {

            throw new Error(

                "Solana RPC returned HTTP " +
                rpcResponse.status

            );

        }


        const rpcData =
            await rpcResponse.json();


        if (
            rpcData.error
        ) {

            throw new Error(

                "Solana RPC error: " +
                JSON.stringify(
                    rpcData.error
                )

            );

        }


        ////////////////////////////////////////////////////
        // CALCULATE TOKEN BALANCE
        ////////////////////////////////////////////////////

        const accounts =
            rpcData.result?.value ||
            [];


        let rawBalance =
            0;


        for (
            const account
            of accounts
        ) {

            const amount =
                account
                    ?.account
                    ?.data
                    ?.parsed
                    ?.info
                    ?.tokenAmount
                    ?.amount;


            if (
                amount
            ) {

                rawBalance +=
                    Number(amount);

            }

        }


        const balance =
            rawBalance /
            Math.pow(
                10,
                SPARKD_DECIMALS
            );


        ////////////////////////////////////////////////////
        // FIND CURRENT CONTEST
        ////////////////////////////////////////////////////

        const balanceContestResponse =
            await fetch(

                supabaseUrl +
                "/rest/v1/meme_week_contests" +
                "?status=eq.submission" +
                "&select=id,week_start,week_end" +
                "&limit=1",

                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            serviceRoleKey,

                        "Authorization":
                            "Bearer " +
                            serviceRoleKey

                    }

                }

            );


        if (
            !balanceContestResponse.ok
        ) {

            throw new Error(
                "Unable to retrieve current contest."
            );

        }


        const balanceContests =
            await balanceContestResponse.json();


        const balanceContest =
            balanceContests[0] ||
            null;


        ////////////////////////////////////////////////////
        // CHECK PREVIOUS SUBMISSION
        ////////////////////////////////////////////////////

        let alreadySubmitted =
            false;


        if (
            balanceContest
        ) {

            const submissionResponse =
                await fetch(

                    supabaseUrl +
                    "/rest/v1/meme_week_submissions" +
                    "?contest_id=eq." +
                    encodeURIComponent(
                        balanceContest.id
                    ) +
                    "&wallet_address=eq." +
                    encodeURIComponent(
                        wallet
                    ) +
                    "&select=id,status" +
                    "&limit=1",

                    {

                        method:
                            "GET",

                        headers: {

                            "apikey":
                                serviceRoleKey,

                            "Authorization":
                                "Bearer " +
                                serviceRoleKey

                        }

                    }

                );


            if (
                !submissionResponse.ok
            ) {

                throw new Error(
                    "Unable to check previous submission."
                );

            }


            const submissions =
                await submissionResponse.json();


            alreadySubmitted =
                submissions.length >
                0;

        }


        const requiredBurnQuote = await getContestBurnQuote();
        const requiredSparkd = requiredBurnQuote.amount;

        ////////////////////////////////////////////////////
        // FINAL SUBMISSION ELIGIBILITY
        ////////////////////////////////////////////////////

        const canSubmit =
            balance >= requiredSparkd &&
            !alreadySubmitted;


        ////////////////////////////////////////////////////
        // FINAL BALANCE RESULT
        ////////////////////////////////////////////////////

        return jsonResponse({

            success:
                true,

            wallet:
                wallet,

            mint:
                SPARKD_MINT,

            decimals:
                SPARKD_DECIMALS,

            balance:
                balance,

            rawBalance:
                rawBalance,

            requiredSparkd:
                requiredSparkd,

            targetEntryUsd:
                CONTEST_ENTRY_USD,

            priceUsd:
                requiredBurnQuote.priceUsd,

            priceSource:
                requiredBurnQuote.priceSource,

            estimatedEntryUsd:
                requiredBurnQuote.estimatedUsd,

            contestId:
                balanceContest?.id ||
                null,

            alreadySubmitted:
                alreadySubmitted,

            canSubmit:
                canSubmit

        });

    }


    ////////////////////////////////////////////////////
    // ERROR HANDLER
    ////////////////////////////////////////////////////

    catch (error) {

        console.error(

            "🔥 SPARKD super-handler error:",

            error

        );


        return jsonResponse(

            {

                success:
                    false,

                error:
                    error instanceof Error
                        ? error.message
                        : String(error)

            },

            500

        );

    }

});
