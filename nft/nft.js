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
  dialog.showModal();
}

function renderCollection(filter = 'all') {
  grid.replaceChildren();
  const visible = concepts.filter(concept => filter === 'all' || concept.category === filter);
  for (const concept of visible) {
    const card = document.createElement('article');
    card.className = 'nft-card';
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
    label.textContent = concept.label + ' / CONCEPT';
    const title = document.createElement('h3');
    title.textContent = concept.title;
    const note = document.createElement('p');
    note.className = 'card-note';
    note.textContent = 'Reference artwork · In development';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button preview-button';
    button.textContent = 'View concept ↗';
    button.setAttribute('aria-label', 'View concept: ' + concept.title);
    button.addEventListener('click', () => openPreview(concept, button));
    info.append(label, title, note, button);
    card.append(art, info);
    grid.append(card);
  }
  document.querySelector('#collection-status').textContent = visible.length + ' collection concepts shown.';
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
