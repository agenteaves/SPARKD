# SPARKD Swap Fee Rail

An isolated product prototype and build plan for a crypto swap app where the app's disclosed service fee is paid in SPARKD. The app sponsor pays the Solana network fee from its own SOL reserve.

## Run the local product lab

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Open <http://127.0.0.1:4173>. The Swap tab is an illustrative product mock. The Devnet tab reads a current quote from a preselected Raydium CPMM pool; it does not connect a wallet, build a swap, collect SPARKD, or submit a transaction. The economics values are editable assumptions, not current prices or forecasts.

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
- `PRODUCT_PLAN.md` — MVP requirements, staged plan, metrics, and network decision gates.
- `server.test.mjs`, `devnet-status.test.mjs`, and `economics.test.mjs` — automated checks for endpoint behavior, readiness reporting, and calculations.

The actual swap path is not ready. The Pimlico Devnet endpoint has been verified, and a disposable six-decimal SPARKD mint plus a separate SPARKD fee transfer to the app receiver have both been confirmed on Devnet with the user wallet at zero SOL. The remaining Devnet proof is an atomic Raydium CPMM swap plus the SPARKD app-fee transfer; Pimlico must permit those instructions. SPARKD is the app's fee and does not have to be a paymaster payment token. The selected test pool takes SOL as swap input, so the temporary wallet needs Devnet SOL as trade principal, not gas. Public RPC airdrops returned HTTP 410 in this environment; request test SOL from the [official Solana faucet](https://faucet.solana.com/) or use a funded non-SOL input pool. Mainnet additionally needs confirmed token mint/decimals, a published fee policy and receiving address, sponsor SOL reserves, wallet integration, security review, and mainnet pilot controls.

## Fee design principles

- Display the SPARKD service fee in both SPARKD and an estimated fiat value before approval.
- Keep the fee easy to understand and compare; do not claim the total trade is free.
- Show route or pool fees and price impact in the swap quote. They are trading costs, separate from network gas and the SPARKD app fee.
- Set an explicit cap on the sponsor's SOL spend per transaction and per day.
- Reconcile SPARKD collected against SOL consumed and operating costs.
- Never commit signer secrets, seed phrases, or provider credentials.

## Local configuration

`server.mjs` exposes demo settings through `.env`; they do not enable signing. Never place private keys in `.env` committed to Git, browser code, or this repository. Production signer keys belong in a managed secret/signing service with narrowly scoped policies.
