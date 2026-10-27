# SPARKD Swap Fee Rail

An isolated product prototype and build plan for a crypto swap app where the app's disclosed service fee is paid in SPARKD. The app sponsor pays the Solana network fee from its own SOL reserve.

## Run the local product lab

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Open <http://127.0.0.1:4173>. The Swap tab is an illustrative product mock. The Devnet tab reads a current quote, connects Phantom, builds a Raydium swap plus test-SPARKD fee transaction, requests wallet approval, and submits through Pimlico's Kora-compatible sponsor. This flow is Devnet-only. The economics values are editable assumptions, not current prices or forecasts.

Run the automated checks:

```bash
npm test
```

## Product design

The first product is a simple swap experience, not a new blockchain. Users should be able to:

1. Choose a supported asset pair and enter a swap amount.
2. See the expected output, route/liquidity cost, slippage, and SPARKD app fee before signing.
3. Pay the app fee in SPARKD in the same atomic transaction as the swap where the routing/program flow supports it.
4. Have a configured sponsor pay the Solana protocol fee in SOL so the user is not asked to hold SOL for network gas.
5. See confirmation, a transaction link, and their SPARKD fee receipt.

The SOL spent as the swap input is trade principal when the user chooses to swap SOL; it is distinct from SOL used for network fees. Solana fees are still paid by a sponsor account in the background. A past SOL fee paid while buying SPARKD does not prepay later transactions.

## How this creates a path to a SPARKD network

The app tests whether SPARKD is useful before taking on the larger cost of a separate network. See [PRODUCT_PLAN.md](./PRODUCT_PLAN.md) for stages, measurements, sponsor controls, and network readiness gates.

The order is:

1. Prototype and test on Devnet with disposable wallets and a test token.
2. Limited mainnet pilot with narrow program allowlists, spend caps, monitoring, and a funded sponsor wallet.
3. Expand pairs and user access after reliable completion, repeat use, and sustainable fees are demonstrated.
4. Evaluate a SPARKD-native chain only when demand, validator interest, liquidity, and security readiness support it.

## Current project status

- `index.html` — interactive, clearly labeled local swap and economics prototype.
- `economics.mjs` — pure fee and breakeven calculations for the prototype.
- `server.mjs` — local static console, demo endpoint, and Devnet read-only endpoints.
- `raydium-devnet.mjs` — on-chain Raydium CPMM quote reader for the configured Devnet pool.
- `devnet-status.mjs` — read-only checks for Devnet RPC, pool metadata, test mint, and Kora sponsor configuration.
- `devnet-wallet.mjs` — read-only SOL and test-SPARKD balance lookup for a connected Devnet wallet.
- `devnet-preview.mjs` — read-only current quote and wallet-balance checks for a Devnet SOL-to-test-token swap plus test-SPARKD fee.
- `devnet-swap.mjs` — Devnet-only atomic swap + test-SPARKD fee builder, one-time proposal verification, Kora cost estimates, and per-swap/daily sponsor budgets.
- `wallet-client.mjs` — Phantom signing handoff; the browser bundle is built when starting the local server.
- `PRODUCT_PLAN.md` — MVP requirements, staged plan, metrics, and network decision gates.
- `server.test.mjs`, `devnet-status.test.mjs`, `devnet-swap.test.mjs`, and `economics.test.mjs` — automated checks for endpoint behavior, fee sponsorship, safety limits, and calculations.

An atomic Raydium CPMM swap plus a SPARKD app-fee transfer has been confirmed on Devnet using a disposable wallet and test mint. The [latest confirmed transaction](https://explorer.solana.com/tx/48mCtPRuRfyawBfSSDVYn5Uvi4oQuGZzueYuD3t6gj5tbgyUUMuLr9v8s9deZvH41iJ78qLqa8cLewhqq6hDbfZX?cluster=devnet) traded 0.001 SOL and transferred 1 test SPARKD to the app receiver in the same transaction; the user's SOL balance fell by the traded input, and Pimlico paid the 10,000-lamport network fee. The current unsigned preview estimated 10,050 lamports of sponsor outflow. The builder enforces a 0.005 SOL per-swap cap and 0.05 SOL daily cap, persists the local Devnet ledger across restarts, reserves estimated outflow while a proposal is open, rejects altered/replayed messages, and reports whether SPARKD settled when chain execution fails. The local JSON ledger is safe for one server instance only; production needs shared atomic accounting and provider-side limits. The live smoke used a disposable signer rather than a Phantom in-browser approval. Mainnet still needs production configuration, monitoring, security review, and a limited pilot.

## Fee design principles

- Display the SPARKD service fee in both SPARKD and an estimated fiat value before approval.
- Keep the fee easy to understand and compare; do not claim the total trade is free.
- Show route or pool fees and price impact in the swap quote. They are trading costs, separate from network gas and the SPARKD app fee.
- Set an explicit cap on the sponsor's SOL spend per transaction and per day.
- Reconcile SPARKD collected against SOL consumed and operating costs.
- Never commit signer secrets, seed phrases, or provider credentials.

## Local configuration

`server.mjs` exposes demo settings through `.env`; they do not enable signing. Never place private keys in `.env` committed to Git, browser code, or this repository. Production signer keys belong in a managed secret/signing service with narrowly scoped policies.
