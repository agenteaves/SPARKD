# SPARKD Fee Rail

An isolated local prototype for testing a SPARKD-denominated application fee on Solana. It uses Kora as a fee-payer integration point; it does not change Solana's protocol fee currency, which remains SOL.

## Run the local console

Requirements: Node.js 20 or newer. No dependency install is needed.

```bash
cp .env.example .env
npm run dev
```

Open <http://127.0.0.1:4173>. The console starts in demo mode and serves a sample fee quote. The quote uses raw token base units and is only a placeholder until the SPARKD mint decimals and pricing are verified. The prototype does not request wallet access, transfer tokens, sign, or submit transactions.

Run the tests with:

```bash
npm test
```

## Optional Kora readiness check

Set `KORA_RPC_URL` in `.env` to a development/test Kora JSON-RPC endpoint. Optionally set `KORA_API_KEY` or `KORA_HMAC_SECRET` if that operator requires authentication. Set `SPARKD_TREASURY` to a test receiving address. Restart the server and use **Refresh checks**. The console calls Kora `getConfig` and `getSupportedTokens`; it does not call signing methods.

Secrets stay in the local server environment and are never sent to browser code. Do not use a production fee payer or wallet for this stage.

## Current boundary

This is a runnable local project foundation, not a production payment rail. The next implementation step is a test-wallet flow that builds a real transaction, appends the configured SPARKD payment instruction, requests Kora signing, and verifies the transaction result on devnet. Before that, confirm:

- The official SPARKD mint and token program (legacy SPL Token or Token-2022).
- Mint decimals and an understandable fee amount; choose whether the app fee is fixed in SPARKD or priced against a fiat/SOL value.
- The fee recipient and how receipts/accounting are handled.
- Kora's accepted token configuration, allowed programs, fee payer SOL budget, and rate limits.

The prototype intentionally has no website integration, no production credentials, and no live transaction submission.

## Project layout

- `server.mjs` — dependency-free local server, quote endpoint, and optional Kora status checks.
- `index.html` — responsive local console.
- `server.test.mjs` — smoke tests for demo behavior and HTTP endpoints.
- `.env.example` — safe local configuration template.
