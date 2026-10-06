# SPARKD burn-to-buy checkout — DEVNET ONLY

The service constructs exactly one SPL BurnChecked plus one Metaplex Core transfer in a single transaction. The buyer pays fees and signs the burn; an authorized one-time delegate co-signs the transfer. Server-side listings enforce 20,000 for `winner`, 30,000 for `special`; client amounts are ignored. Modified messages invalidate the delegate signature and are rejected again at submission. Current ownership, collection, delegate, token mint, balance, decimals and devnet genesis are checked.

## Status

Mainnet disabled by code. No real NFT delegated, transferred or burned. No mainnet SPARKD used. Do not enable real purchases until live devnet tests and deployment are complete.

## Run tests

`npm ci` then `npm test`. `npm run fixture` requests devnet SOL, creates a test mint and two test Core assets and exercises both purchase prices. Fixture secrets are written only to gitignored `*.local.json` files. Never upload them. If the faucet fails, fund the printed public test wallet address with DEVNET SOL using the official Solana faucet, then rerun. Never send real SOL.

`npm start` runs the service on localhost:8787. Host behind HTTPS with the exact configured allowedOrigin. Do not expose this devnet service on mainnet. Set `NFT_TEST_CONFIG` to a protected config file. RPC, test mint, test collection, delegate key and owner/listing records come from the fixture.

## Browser test

Add testAsset addresses to a private local copy of the catalog, matching listing IDs. Set checkout-config enabled:true, cluster:devnet, api to the HTTPS test endpoint, testMint/testCollection/delegate to the fixture public addresses. Set Phantom to devnet. The shipped public page keeps enabled:false. Checkout checks burn and transfer instruction fields before requesting a signature. Reject wallet prompts that don't match the displayed test purchase.

## Mainnet launch gates

1. Complete live devnet happy-path purchases for both prices, wrong-price attempts, wrong mint/collection, insufficient balance, expired blockhash, wallet rejection, sold NFT and simultaneous buyers. Verify failed transactions never change token supply or NFT ownership, except normal network fees.
2. Choose production hosting and secret management. Delegate private keys never belong in browser files, git, or public HTML. A compromised delegate can transfer every NFT delegated to it; this is server-enforced pricing, not on-chain price enforcement. For on-chain enforcement, replace the signer with an audited marketplace program PDA.
3. Implement authenticated admin listing/withdrawal and owner-signed TransferDelegate approval/revocation. Approvals must identify each asset and the exact delegate; owner signs in their wallet. Do not use a permanent delegate or expose the seller's wallet key.
4. Production version requires explicit mainnet configuration, bounded listing authority, external review and deployed backend. This test build intentionally rejects mainnet.
5. Enable checkout and link from homepage only after the user approves launch. Sold status must come from confirmed ownership, not a browser click or database flag.

## Known limits

This initial service stores quotes in memory and is single-process. Restart expires quotes. It supports standard SPL tokens and standard Core listings; external Core plugin behavior may require additional validation. Devnet end-to-end testing is blocked if the public faucet is unavailable. Wallet listing/admin tooling and mainnet deployment are not complete.
