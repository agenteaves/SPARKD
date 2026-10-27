# SPARKD Fee Rail

An isolated prototype for making SPARKD the only fee users pay to use a SPARKD-integrated swap app.

## Target user experience

1. A user acquires SPARKD with SOL. That purchase uses SOL and incurs the normal Solana network fee.
2. For later app actions, the user pays the disclosed app fee in SPARKD. The app's fee sponsor pays Solana's required network fee in SOL.
3. If a user swaps SOL for another token in the app, SOL used as the swap input is the purchase amount. The sponsor still covers the network fee.

The SPARKD fee can be sent to a project fee wallet, burned, or split according to the fee policy. The current prototype only displays a configured fee and destination; it does not submit transactions.

## How the sponsor works

Solana validators require network fees to be settled in SOL. A sponsor/paymaster is set as the transaction fee payer and covers that SOL charge, while the user's wallet authorizes the SPARKD payment. Kora is one option for operating this sponsor; an equivalent project-run fee payer is also possible. The user-facing app should show and charge the SPARKD fee without asking the user for SOL to cover the network fee.

For a swap, use Jupiter Swap API V2 `/build` to compose the swap with the SPARKD fee instruction and sponsor fee-payer flow. The user signs the swap and SPARKD authorization; the sponsor signs and pays the SOL network fee. Restrict the sponsor to the intended programs, token mint, spend limits, and app transactions.

## Run the local console

Requirements: Node.js 20 or newer. No dependency install is needed.

```bash
cp .env.example .env
npm run dev
```

Open <http://127.0.0.1:4173>. This local demo has no wallet connection, swap execution, SPARKD transfer, or live paymaster signing.

Run automated checks:

```bash
npm test
```

## Configuration

- `SPARKD_MINT` — SPARKD mint address.
- `SPARKD_FEE_BASE_UNITS` — app fee in the mint's smallest units. Confirm mint decimals and choose a clear fee before charging users.
- `SPARKD_FEE_RECEIVER` — public wallet address for the SPARKD app fee, if it is directed to a wallet.
- `KORA_RPC_URL` — optional local setting for an eventual server-side Kora sponsor endpoint. Do not put signer secrets in the repo or browser code.

## Operating costs

Users are intended to pay SPARKD for app use. The sponsor still needs a SOL reserve because Solana's network fee is paid in SOL at the protocol layer. SPARKD revenue can help fund sponsor operations, but it is not automatically converted into SOL. A project-run sponsor also needs hosting and RPC access; a managed provider may have its own pricing and must explicitly support the SPARKD mint.

## Scope

- Keep implementation separate from the public SPARKD website until the isolated flow is built and verified.
- Test the sponsor and fee flow with test wallets and a test token first.
- Confirm the production mint, token program, decimals, fee destination, fee policy, and sponsor limits before enabling live transactions.
- Never commit private keys, seed phrases, or provider secrets.

## Files

- `server.mjs` — dependency-free local server, fee quote, and setup status.
- `index.html` — responsive local console.
- `server.test.mjs` — automated checks for demo behavior and HTTP endpoints.
- `.env.example` — local configuration template.
