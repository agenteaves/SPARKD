# SPARKD NFT Vault checkout

The production checkout is hosted as the separate Supabase `nft-vault` Edge Function. It uses Solana mainnet, SPARKD's **Token-2022** mint `BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump`, six decimals, and the existing Metaplex Core collection. It does not modify the existing contest functions or Cloudflare.

## Pricing and transactions

The server pins the nine asset addresses and their categories in `production-config.mjs`. Four contest winners cost 20,000 SPARKD; five special artworks cost 30,000. Requests cannot change the price, mint, collection, seller or asset. Every purchase has exactly one Token-2022 BurnChecked instruction and one Core transfer. The buyer pays SOL fees, signs the burn and receives the NFT. The service co-signs only the exact approved transfer plus burn message. Both instructions execute atomically. Before offering any signing request, the service simulates it against mainnet without signature verification; simulation does not submit it or persist changes.

## Owner approvals

Open `/NFT/owner.html` in Phantom's browser or a desktop browser with Phantom. Connect wallet `2dFYXBWy1s5kq3gZpZ9m3aQ4VkUDwVbUSnVes5rUXSe6`. Approve one NFT at a time. Each NFT has a distinct delegate derived from a protected signing seed. The owner signs a single add/approve TransferDelegate instruction; withdrawal signs its revocation. These actions incur real SOL network/storage fees. No listing is available until its current on-chain owner, collection and delegate match the pinned listing.

**Authority limit:** This is server-enforced pricing, not an on-chain marketplace pricing program. A compromised per-NFT delegate can transfer its approved NFT without a burn. A compromised root signing seed can derive all nine delegates. The approval page explains this before signing. Delegates grant no access to the owner's SOL, SPARKD balance, other NFTs, or wallet private key. TransferDelegate approval resets when the NFT transfers; the buyer receives normal Core ownership.

The website stays unlinked from the homepage. Approval/listing does not transfer the NFT. The selling wallet cannot buy its own NFT from itself: use a second wallet account with SPARKD and enough SOL for a real purchase test.

## Backend deployment and storage

`edge/schema.sql` creates isolated RLS-protected NFT quote/rate tables and an encrypted Vault seed generated inside Postgres. The seed is never returned to the frontend, written in source control or logged. `nft_vault_signer_seed` is executable only by `service_role`; `anon` and `authenticated` have no access. The Edge Function uses Supabase's server-side environment credentials to read it. Public clients use the existing legacy anon JWT because platform JWT verification remains enabled. CORS permits only the canonical site and its www origin. Signing is constrained by server-side listings and on-chain state; CORS/anon keys do not authorize owner transactions. Rate limits persist across workers.

RLS tables deliberately have no client policies or client grants: only service_role accesses them. Supabase advisors report this as informational deny-by-default, with no NFT-related warning/error notices. Quotes persist across workers/restarts. Phantom signs the buyer transaction first. The server verifies the buyer signature and stored operation hash before adding the per-NFT delegate signature. It then re-simulates and verifies all signatures before broadcasting. Bounded stateless Lighthouse assertions stay in the signed transaction; removing only those assertions must reproduce the quoted operation exactly. Submitting the same signed transaction uses the same Solana signature and cannot burn twice. The browser records pending signatures before submission, checks status before another purchase and waits for confirmed token/NFT details. Failed or finalized-expired transactions allow retry; uncertain status never automatically starts another burn. Quote records are retained for one day and expire for new submission after 90 seconds.

## Build and verification

`npm ci`, `npm test`, `npm run build`, `npm run build:edge`. Exact dependencies and npm lockfile are committed. The backend bundle is reproducible and uses built-in `node:` imports so deployment does not depend on remote npm fetches. Deploy `edge/index.ts`, `edge/production-bundle.mjs`, and `edge/deno.json` with `verify_jwt:true` and `import_map_path:deno.json`.

Tests cover exact winner/special Token-2022 burns, buyer/delegate signatures, instruction tampering, owner-only listing/revocation, wrong network, sold/unlisted assets, insufficient funds, failed simulation, and finalized expiry. Production inventory and unsigned owner preparation have been checked against the real mainnet records. Read-only mainnet simulations for both prices passed an ephemeral listing approval, exact Token-2022 burn and Core transfer; wrong-delegate transfer simulations failed. The owner token balance and actual NFT data remained unchanged. `node simulate-mainnet.mjs` reproduces those simulations and never submits a transaction. An owner-approved Chasing the Jeets pilot listing is available. No real purchase, burn, delegation or transfer has been performed by the agent. A wallet-signed pilot purchase remains to be completed by the owner before broad launch.

The earlier `service.mjs`, local server and `devnet-fixture.mjs` remain devnet-only reference tooling; the shipped page uses `production-service.mjs` through the hosted Edge Function. They do not enable a devnet transaction on the mainnet page.

Owner approvals support up to three Lighthouse AssertAccountInfoMulti checks on the owner, asset and collection. These safety checks remain in the signed transaction. Removing only those checks must reproduce the original quoted message exactly; fee, delegate, signer and blockhash changes remain rejected. Purchases require the exact quoted burn/transfer and fee message after removing only up to eight Lighthouse account-info, mint or token assertions on accounts already used by that message. The buyer signs first; the service adds the delegate signature only after validating the buyer-signed request.
