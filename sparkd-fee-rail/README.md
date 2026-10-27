# SPARKD Swap Fee

An isolated local prototype for charging a disclosed SPARKD application fee when a user makes a cryptocurrency swap through a SPARKD-integrated app.

## The fee model

The swap transaction can include both the swap instructions and a SPARKD token transfer to a configured fee receiver. The user reviews and signs that transaction in their wallet. The application receives the SPARKD fee. Solana's protocol/network fee remains paid in SOL by the wallet.

This does not change Solana's protocol or make SPARKD a universal fee token. It applies only to swaps routed through an app that integrates the fee. Kora/paymaster hosting is optional and would only be needed if the project later chooses to sponsor or abstract the SOL network fee.

## Run the local console

Requirements: Node.js 20 or newer. No dependency install is needed.

```bash
cp .env.example .env
npm run dev
```

Open <http://127.0.0.1:4173>. The console shows the fee configuration and setup status. It is a demo: it does not connect a wallet, fetch or execute swaps, transfer SPARKD, or submit transactions.

Run automated checks:

```bash
npm test
```

## Configuration

- `SPARKD_MINT` — SPARKD mint address.
- `SPARKD_FEE_BASE_UNITS` — fee amount in the mint's smallest units. Confirm the mint decimals and choose a reasonable amount before charging users.
- `SPARKD_FEE_RECEIVER` — public wallet address that receives the SPARKD fee.

Only public wallet addresses belong in this file. Never place a private key or seed phrase in the project.

## Next implementation step

Use Jupiter Swap API V2's `/build` path to obtain swap instructions, append the SPARKD SPL-token transfer instruction, simulate the combined transaction, then request the user's wallet signature and submit it. Jupiter documents `/build` for custom transactions and instructions. Confirm the exact fee policy, recipient, mint decimals, and token program before enabling a live charge.

The project stays separate from the SPARKD website until the isolated transaction flow is implemented and verified. No production wallet, paymaster, or website integration is configured.

## Files

- `server.mjs` — dependency-free local server, fee quote, and setup status.
- `index.html` — responsive local console.
- `server.test.mjs` — smoke tests for demo behavior and HTTP endpoints.
- `.env.example` — safe local configuration template.
