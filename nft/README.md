# SPARKD NFT collection page

Standalone static page at `/nft/`. Homepage placement remains undecided; no homepage navigation was changed.

The First Spark is a verified Metaplex Core NFT on Solana mainnet inside SPARKD Creative Art. The other two catalog entries are reference artwork concepts, not minted NFTs. There is no public mint, wallet connection, sale price or marketplace listing configured on this page.

- Asset: `6WGq2FpB9DCW62by7VGbfSsRyYB6Zg6GixbnfT862zYj`
- Collection: `4ARoTdtbC6LzCQ4c8Fk4ZvmheQYE5vAnU5T6Mx3rs5A4`
- Verification snapshot: `mints/first-spark.json`; owner and collection counts were checked at that time and are not live ownership data.

`collection.js` holds catalog entries; `nft.js` renders filters and the accessible preview dialog. `assets/first-spark.png` is the full-resolution approved original. The deployed JSON and artwork URLs are referenced by the on-chain asset and collection: preserve those files. They are website-hosted, not permanent decentralized storage.

For subsequent approved artwork, add an asset and metadata, then record the confirmed mint address before marking its catalog entry minted. A new mint in the same collection should use the existing collection address rather than creating another collection.

To link this page later, add `<a href="/nft/">SPARKD NFTs</a>` at the selected homepage location.

Validation: JavaScript syntax, browser filters and previews, explorer links, loaded images, desktop/mobile/tablet widths, and visual screenshots checked.
