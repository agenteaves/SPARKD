# NFT Vault preview

Independent uppercase `/NFT/` folder. No homepage navigation or existing lowercase `/nft/` page is changed by this preview.

- `index.html`, `style.css`, `app.js`: responsive gallery, search, filters and artwork details.
- `catalog.js`: nine verified, creator-selected special artworks at 30,000 SPARKD each.
- `assets/`: copies of approved repository artwork and logo.
- First-place contest artwork is priced at 20,000 SPARKD. There are currently no contest winners in this catalog; do not assign a winner category without confirming its provenance and mint.
- Preview only: no wallet connection, signatures, purchases, transfers or burns. Checkout is disabled.
- Future checkout must validate category and price on the server/program, verify current ownership and collection, and atomically burn the exact token amount and transfer the corresponding Core asset. Browser catalog values must never authorize a sale.
- NFT transfers require owner authorization or approved escrow/delegation. A buyer signature alone cannot transfer an NFT owned by the creator. Checkout remains unimplemented until that flow is designed and tested.
- Keep the homepage unlinked until the user approves the appearance and explicitly asks to connect it.
