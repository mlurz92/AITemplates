const STORAGE_KEY = 'customTemplatesJson';
const FAVORITES_KEY = 'favoritePrompts';
const MAX_RECENT_PROMPTS = 6;

let jsonData = null;
let favorites = [];
let filteredFavorites = [];

async function loadJsonData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      jsonData = JSON.parse(stored);
      return;
    }
    const response = await fetch('templates.json');
    jsonData = await response.json();
  } catch (error) {
    console.error('Daten konnten nicht geladen werden', error);
    jsonData = null;
  }
}

function loadFavorites() {
  try {
    favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch (error) {
    console.error('Favoriten konnten nicht geladen werden', error);
    favorites = [];
  }
}

function saveStatus(message) {
  const statusChip = document.getElementById('widget-status');
  statusChip.textContent = message;
}

function normalizeContent(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findNodeById(node, targetId) {
  if (!node) return null;
  if (node.id === targetId) return node;
  if (!node.items) return null;
  for (const child of node.items) {
    const match = findNodeById(child, targetId);
    if (match) return match;
  }
  return null;
}

function collectRootPrompts() {
  if (!jsonData || !Array.isArray(jsonData.items)) return [];
  return jsonData.items.filter((item) => item.type === 'prompt');
}

function renderFavorites(searchTerm = '') {
  const list = document.getElementById('favorites-list');
  const emptyState = document.getElementById('empty-favorites');
  const template = document.getElementById('favorite-chip-template');
  list.replaceChildren();

  const normalizedTerm = normalizeContent(searchTerm).toLowerCase();
  let filteredFavorites = favorites
    .map((id) => findNodeById(jsonData, id))
    .filter(Boolean);

  if (normalizedTerm) {
    filteredFavorites = filteredFavorites.filter((node) => {
      const titleMatch = node.title.toLowerCase().includes(normalizedTerm);
      const contentMatch = (node.content || '').toLowerCase().includes(normalizedTerm);
      return titleMatch || contentMatch;
    });
  }

  if (!filteredFavorites.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  filteredFavorites.forEach((node) => {
    const clone = template.content.cloneNode(true);
    const button = clone.querySelector('.pill-button');
    const title = clone.querySelector('.pill-title');
    const preview = clone.querySelector('.pill-preview');

    title.textContent = node.title;
    preview.textContent = normalizeContent(node.content || '').slice(0, 120) || 'Kein Inhalt';
    button.setAttribute('aria-label', `${node.title} kopieren`);
    button.addEventListener('click', () => copyToClipboard(node));

    list.appendChild(clone);
  });
}

function renderRecentPrompts(searchTerm = '') {
  const list = document.getElementById('recent-prompts');
  const emptyState = document.getElementById('empty-prompts');
  const template = document.getElementById('prompt-card-template');
  list.replaceChildren();

  const normalizedTerm = normalizeContent(searchTerm).toLowerCase();
  let prompts = collectRootPrompts();

  if (normalizedTerm) {
    prompts = prompts.filter((node) => {
      const titleMatch = node.title.toLowerCase().includes(normalizedTerm);
      const contentMatch = (node.content || '').toLowerCase().includes(normalizedTerm);
      return titleMatch || contentMatch;
    });
  }

  prompts = prompts.slice(0, MAX_RECENT_PROMPTS);

  if (!prompts.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  prompts.forEach((node) => {
    const clone = template.content.cloneNode(true);
    const title = clone.querySelector('.prompt-title');
    const preview = clone.querySelector('.prompt-preview');
    const copyButton = clone.querySelector('.copy-button');
    const openButton = clone.querySelector('.open-button');

    title.textContent = node.title;
    preview.textContent = normalizeContent(node.content || '').slice(0, 140) || 'Kein Inhalt';
    copyButton.addEventListener('click', () => copyToClipboard(node));
    copyButton.setAttribute('aria-label', `${node.title} kopieren`);

    openButton.href = `index.html#${encodeURIComponent(node.id)}`;
    openButton.setAttribute('aria-label', `${node.title} in der App öffnen`);

    list.appendChild(clone);
  });
}

async function copyToClipboard(node) {
  try {
    const text = normalizeContent(node.content || '');
    if (!text) {
      saveStatus('Kein Inhalt zum Kopieren');
      return;
    }
    await navigator.clipboard.writeText(text);
    saveStatus(`Kopiert: ${node.title}`);
  } catch (error) {
    console.error('Kopieren fehlgeschlagen', error);
    saveStatus('Kopieren nicht möglich');
  }
}

async function refreshWidget() {
  saveStatus('Lade ...');
  await loadJsonData();
  loadFavorites();
  const searchValue = document.getElementById('widget-search').value;
  renderFavorites(searchValue);
  renderRecentPrompts(searchValue);
  const total = collectRootPrompts().length;
  saveStatus(`Bereit • ${favorites.length} Favoriten • ${total} Root-Prompts`);
}

function wireEvents() {
  const search = document.getElementById('widget-search');
  const refresh = document.getElementById('refresh-widget');

  search.addEventListener('input', (event) => {
    const value = event.target.value;
    renderFavorites(value);
    renderRecentPrompts(value);
  });

  refresh.addEventListener('click', () => refreshWidget());
}

document.addEventListener('DOMContentLoaded', async () => {
  wireEvents();
  await refreshWidget();
});
