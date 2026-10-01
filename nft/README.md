# SPARKD NFT collection page

Standalone static page at `/nft/`. The main site's navigation is intentionally untouched so placement can be chosen later.

## Files
- `index.html`: page, collection filters, FAQ and accessible preview dialog.
- `nft.css`: responsive green-and-gold design, scoped to this page.
- `collection.js`: editable concept catalog.
- `nft.js`: collection rendering, filtering and preview interactions.

The three initial entries are collection concepts using existing repository artwork as references. They are not minted NFTs or final NFT assets. No wallet calls, transactions, prices, supply counts, royalties or marketplace links are configured.

## Add approved artwork
Place final images in `nft/assets/`, then update the matching catalog image path, alt text and description. Keep each concept's `id` unique. Categories currently supported by the buttons: `heroes`, `origins`, `community`.

Before enabling minting, decide the chain, collection name, supply, price, royalty policy and mint provider. Save final asset metadata and use verified collection/mint addresses. Update the development messaging only after those details are confirmed.

To link this page later, add an anchor such as `<a href="/nft/">SPARKD NFTs</a>` to the chosen location on the main site.
