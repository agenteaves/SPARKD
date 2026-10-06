# SPARKD NFT Vault

The ordinary SPARKD webpage lives at `/NFT/index.html`, with the shared orange/black site style. The homepage remains unlinked. Artwork and fixed prices are listed in `catalog.js`: four contest winners at 20,000 SPARKD and five creator-selected specials at 30,000.

`checkout-config.js` contains only public configuration. `checkout.js` is the browser bundle. `checkout/` contains pinned dependencies, source, tests and deployment instructions for the separately hosted Supabase `nft-vault` service. Wallet connections happen only after the visitor clicks a purchase or owner-connect button.

The owner uses `/NFT/owner.html` to approve or withdraw listings through Phantom. Buyers can purchase only NFTs whose approval is confirmed on chain. A transaction burns the SPARKD price with Token-2022 and transfers the Core NFT together. Network fees are paid separately in SOL.

See `checkout/README.md` for authority scope and operational limits. No real NFTs have been approved or sold by the agent; wallet signatures and the first real purchase test remain owner actions.
