'use strict';
const concepts = window.SPARKD_NFT_CONCEPTS;
const grid = document.querySelector('#collection-grid');
const dialog = document.querySelector('#preview-dialog');
let lastPreviewButton;

function openPreview(concept, button) {
  lastPreviewButton = button;
  document.querySelector('#preview-title').textContent = concept.title;
  document.querySelector('#preview-category').textContent = concept.label;
  document.querySelector('#preview-description').textContent = concept.description;
  document.querySelector('#preview-art').className = 'card-art ' + concept.style;
  const image = document.querySelector('#preview-image');
  image.src = concept.image;
  image.alt = concept.alt;
  const minted = concept.status === 'minted';
  const approved = concept.status === 'approved';
  document.querySelector('#preview-kind').textContent = minted ? 'MINTED NFT' : approved ? 'APPROVED ARTWORK' : 'COLLECTION CONCEPT';
  document.querySelector('#preview-stage').textContent = minted ? 'MINTED ON SOLANA MAINNET' : approved ? '1-OF-1 ARTWORK · AWAITING MINT' : 'CONCEPT PREVIEW · NOT MINTED';
  document.querySelector('#preview-note').textContent = minted ? 'Verified asset: ' + concept.assetAddress : approved ? 'One NFT is planned for this artwork in SPARKD Creative Art. Minting has not been completed.' : 'Final artwork and mint details will be announced when ready.';
  const links = document.querySelector('#preview-links');
  links.replaceChildren();
  if (minted) {
    links.append(explorerLink(concept.explorer, 'View NFT on Solana ↗'), explorerLink(concept.collectionExplorer, 'View collection ↗'));
  }
  dialog.showModal();
}

function explorerLink(url, label) {
  const link = document.createElement('a');
  link.className = 'button primary';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label;
  return link;
}

function renderCollection(filter = 'all') {
  grid.replaceChildren();
  const visible = concepts.filter(concept => filter === 'all' || concept.category === filter);
  for (const concept of visible) {
    const card = document.createElement('article');
    const minted = concept.status === 'minted';
    const approved = concept.status === 'approved';
    card.className = 'nft-card' + (minted ? ' minted-card' : '');
    const art = document.createElement('div');
    art.className = 'card-art ' + concept.style;
    const image = document.createElement('img');
    image.src = concept.image;
    image.alt = concept.alt;
    image.loading = 'lazy';
    art.append(image);
    const info = document.createElement('div');
    info.className = 'card-info';
    const label = document.createElement('p');
    label.className = 'eyebrow';
    label.textContent = concept.label + (minted ? ' / MINTED NFT' : approved ? ' / APPROVED ARTWORK' : ' / CONCEPT');
    const title = document.createElement('h3');
    title.textContent = concept.title;
    const note = document.createElement('p');
    note.className = 'card-note';
    note.textContent = minted ? 'Solana mainnet · SPARKD Creative Art' : approved ? '1-of-1 planned · Awaiting mint' : 'Reference artwork · In development';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button preview-button';
    button.textContent = (minted || approved) ? 'Preview artwork ↗' : 'View concept ↗';
    button.setAttribute('aria-label', ((minted || approved) ? 'Preview artwork: ' : 'View concept: ') + concept.title);
    button.addEventListener('click', () => openPreview(concept, button));
    info.append(label, title, note, button);
    if (minted) info.append(explorerLink(concept.explorer, 'View minted NFT ↗'));
    card.append(art, info);
    grid.append(card);
  }
  document.querySelector('#collection-status').textContent = visible.length + ' artwork entries shown.';
}

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(filterButton => {
      const selected = filterButton === button;
      filterButton.classList.toggle('active', selected);
      filterButton.setAttribute('aria-pressed', String(selected));
    });
    renderCollection(button.dataset.filter);
  });
});
document.querySelector('#close-preview').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
dialog.addEventListener('close', () => lastPreviewButton?.focus());
renderCollection();
