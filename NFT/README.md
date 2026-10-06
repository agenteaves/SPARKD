# NFT Vault preview

Independent uppercase `/NFT/` folder. No homepage navigation or existing lowercase `/nft/` page is changed by this preview.

- `index.html`, `style.css`, `app.js`: ordinary SPARKD website page using the shared orange-and-black stylesheet, inline artwork descriptions and explorer links.
- `catalog.js`: five special artworks at 30,000 SPARKD each and four user-confirmed first-place winners at 20,000 SPARKD each.
- `assets/`: copies of approved repository artwork and logo.
- First-place contest artwork is priced at 20,000 SPARKD. The user confirmed Chasing the Jeets, Bear Knockout, You Are Different and The Rise of SPARKD as winners on October 6, 2026.
- Preview only: no wallet connection, signatures, purchases, transfers or burns. Checkout is not implemented; the page only displays purchase-coming-soon text.
- Future checkout must validate category and price on the server/program, verify current ownership and collection, and atomically burn the exact token amount and transfer the corresponding Core asset. Browser catalog values must never authorize a sale.
- NFT transfers require owner authorization or approved escrow/delegation. A buyer signature alone cannot transfer an NFT owned by the creator. Checkout remains unimplemented until that flow is designed and tested.
- Keep the homepage unlinked until the user approves the appearance and explicitly asks to connect it.

## Checkout implementation
Devnet-only server, wallet client and tests are in checkout/. Mainnet sales remain disabled in checkout-config.js. Seven local tests passed; live devnet testing stopped at faucet funding with RPC error -32603 on October 6, 2026. No test burn or NFT transfer was executed. See checkout/README.md for launch gates.
