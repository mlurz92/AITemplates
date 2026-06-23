/* =====================================================================
 * Prompt-Templates – Enhancement Layer
 * ---------------------------------------------------------------------
 * Erweitert die bestehende Vanilla-App (script.js) ohne sie umzuschreiben.
 * Es werden ausschließlich definierte Hook-Punkte umhüllt (monkey-patching
 * der globalen Funktionen) sowie neue, in sich geschlossene Subsysteme
 * registriert. Geladen NACH script.js.
 *
 * Enthaltene Vorschläge:
 *   #4  Semantische Suche (neuronale Embeddings + Heuristik-Fallback)
 *   #6  View-Transitions & Deep-Link-Routing (teilbare URLs)
 *   #7  Erweiterte Suche: Scopes, Filter-Chips, Trefferhervorhebung,
 *       Zuletzt/Häufig benutzt
 *   #8  Tag-System & Smart Folders (virtuelle Sammlungen)
 *   #11 Mikrointeraktionen: Skeletons, Ripples, Stagger, erweiterte Haptik
 *   #13 Service-Worker-Registrierung (Offline-PWA)
 * ===================================================================== */
(function () {
  'use strict';

  /* =================================================================
   * 0 · Zentraler Zustand & Hilfsfunktionen
   * ================================================================= */
  const PT = {
    usage: {},                 // { [id]: { count, last } }
    recentOrder: [],           // [id, …] – jüngste zuerst
    search: {
      scope: 'folder',         // 'folder' | 'global' | 'semantic'
      filter: 'all',           // 'all' | 'favorites' | 'recent' | 'folders' | 'prompts'
      tag: null,               // aktiver Tag-Filter
      collection: null,        // aktive Smart-Collection-Definition
    },
    semantic: {
      neuralAvailable: null,   // null=unbekannt, true/false nach Versuch
      pipelinePromise: null,
      embeddings: new Map(),   // id -> {hash, vec:Float32Array}
      queryCache: new Map(),   // query -> Map(id->score)
      lastMode: 'idle',
    },
    hashLock: false,           // unterdrückt selbst ausgelöste hashchange-Events
    booted: false,
  };
  window.PromptTemplatesEnhancements = PT;

  const USAGE_KEY = 'pt-usage-stats-v1';
  const RECENT_LIMIT = 24;
  const SEMANTIC_QUERY_CACHE_LIMIT = 50;

  const STOPWORDS = new Set(('und oder der die das den dem des ein eine einen einem eines auf für mit von zu im in an als ' +
    'ist sind war wird werden wie was wann wo wer warum nicht kein keine du ich er sie es wir ihr bitte mir mich dein deine ' +
    'the a an of to for with and or is are be this that you me my your please').split(/\s+/));

  const SYNONYMS = {
    bild: ['foto', 'grafik', 'image', 'visual', 'illustration'],
    text: ['inhalt', 'content', 'schreiben', 'verfassen', 'formulieren'],
    code: ['programm', 'skript', 'entwicklung', 'programmieren', 'software'],
    zusammenfassung: ['summary', 'zusammenfassen', 'kurzfassung', 'abstract'],
    uebersetzung: ['translate', 'übersetzen', 'translation', 'sprache'],
    email: ['mail', 'nachricht', 'anschreiben', 'brief'],
    analyse: ['auswerten', 'analysieren', 'untersuchung', 'analysis'],
    rolle: ['persona', 'charakter', 'verhalten', 'system'],
    medizin: ['klinik', 'diagnose', 'arzt', 'patient', 'befund', 'radiologie'],
  };

  const debounce = (fn, ms) => {
    let t;
    return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
  };

  const normalize = (s) => (s || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

  const tokenize = (s) => normalize(s)
    .replace(/[^a-z0-9äöüß\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      let cur = [i];
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur;
    }
    return prev[n];
  }

  function hashContent(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function nodeSearchText(node) {
    const tags = Array.isArray(node.tags) ? node.tags.join(' ') : '';
    return `${node.title || ''}\n${node.content || ''}\n${tags}`.trim();
  }

  /* Liefert alle echten (nicht-verknüpften) Knoten außer der Wurzel. */
  function gatherAllNodes() {
    const out = [];
    (function walk(n) {
      if (!n) return;
      if (n !== window.jsonData && (n.type === 'folder' || n.type === 'prompt')) out.push(n);
      if (Array.isArray(n.items)) n.items.forEach(walk);
    })(window.jsonData);
    return out;
  }

  /* Pfad (Vorfahren-Kette ohne Wurzel) zu einem Ziel-Knoten. */
  function buildPathTo(targetId) {
    const path = [];
    let found = null;
    (function walk(node, chain) {
      if (found) return;
      if (node.id === targetId) { found = node; path.push(...chain.filter((n) => n !== window.jsonData)); return; }
      if (Array.isArray(node.items)) node.items.forEach((c) => walk(c, chain.concat(node)));
    })(window.jsonData, []);
    return found ? { node: found, ancestors: path } : null;
  }

  /* =================================================================
   * 1 · Usage- & Recency-Tracking  (#7 / #8)
   * ================================================================= */
  function loadUsage() {
    try {
      const raw = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
      PT.usage = raw.usage || {};
      PT.recentOrder = raw.recent || [];
    } catch (_) { PT.usage = {}; PT.recentOrder = []; }
  }
  const saveUsage = debounce(() => {
    try { localStorage.setItem(USAGE_KEY, JSON.stringify({ usage: PT.usage, recent: PT.recentOrder })); } catch (_) {}
  }, 400);

  function recordUsage(id, { copied = false } = {}) {
    if (!id) return;
    const u = PT.usage[id] || { count: 0, last: 0 };
    if (copied) u.count += 1;
    u.last = Date.now();
    PT.usage[id] = u;
    PT.recentOrder = [id, ...PT.recentOrder.filter((x) => x !== id)].slice(0, RECENT_LIMIT);
    saveUsage();
  }

  /* =================================================================
   * 2 · Semantische Suche  (#4)
   * ================================================================= */
  async function ensureNeuralPipeline() {
    if (PT.semantic.neuralAvailable === false) return null;
    if (PT.semantic.pipelinePromise) return PT.semantic.pipelinePromise;
    PT.semantic.pipelinePromise = (async () => {
      try {
        if (!navigator.onLine) throw new Error('offline');
        const mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2/dist/transformers.min.js');
        mod.env.allowLocalModels = false;
        mod.env.useBrowserCache = true;
        showHint('Neuronales Suchmodell wird geladen …', 'info');
        // Transformers.js v3: Quantisierung wird über `dtype` gewählt (das frühere
        // `quantized`-Flag existiert nicht mehr) – q8 hält den Download klein.
        const extractor = await mod.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' });
        PT.semantic.neuralAvailable = true;
        showHint('Neuronale Suche bereit.', 'success');
        return extractor;
      } catch (err) {
        console.info('[Semantic] Neuronales Modell nicht verfügbar – Heuristik aktiv.', err?.message || err);
        PT.semantic.neuralAvailable = false;
        return null;
      }
    })();
    return PT.semantic.pipelinePromise;
  }

  async function embed(extractor, text) {
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    return out.data instanceof Float32Array ? out.data : Float32Array.from(out.data);
  }

  function cosine(a, b) {
    let dot = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) dot += a[i] * b[i]; // beide bereits L2-normalisiert
    return dot;
  }

  async function neuralRank(query, nodes) {
    const extractor = await ensureNeuralPipeline();
    if (!extractor) return null;
    // Knoten-Embeddings (gecacht nach Inhalts-Hash).
    for (const node of nodes) {
      const text = nodeSearchText(node).slice(0, 1200);
      const hash = hashContent(text);
      const cached = PT.semantic.embeddings.get(node.id);
      if (!cached || cached.hash !== hash) {
        try { PT.semantic.embeddings.set(node.id, { hash, vec: await embed(extractor, text) }); }
        catch (_) { /* einzelnen Knoten überspringen */ }
      }
    }
    const qv = await embed(extractor, query);
    const scores = new Map();
    for (const node of nodes) {
      const e = PT.semantic.embeddings.get(node.id);
      if (e) scores.set(node.id, cosine(qv, e.vec));
    }
    PT.semantic.lastMode = 'neural';
    return scores;
  }

  /* Heuristischer Offline-„Semantik"-Scorer (Token-Overlap + Synonyme + Fuzzy). */
  function heuristicRank(query, nodes) {
    const qTokens = expandSynonyms(tokenize(query));
    const scores = new Map();
    for (const node of nodes) {
      const tokens = tokenize(nodeSearchText(node));
      if (!tokens.length || !qTokens.length) { scores.set(node.id, 0); continue; }
      const tokenSet = new Set(tokens);
      let score = 0;
      for (const q of qTokens) {
        if (tokenSet.has(q)) { score += 1; continue; }
        let best = 0;
        for (const t of tokenSet) {
          if (t.startsWith(q) || q.startsWith(t)) { best = Math.max(best, 0.7); continue; }
          const d = levenshtein(q, t);
          const lim = Math.max(q.length, t.length);
          if (d <= 2 && lim > 3) best = Math.max(best, 1 - d / lim);
        }
        score += best;
      }
      // Titel-Treffer höher gewichten.
      const titleTokens = new Set(tokenize(node.title || ''));
      for (const q of qTokens) if (titleTokens.has(q)) score += 0.5;
      scores.set(node.id, score / (qTokens.length + 1));
    }
    PT.semantic.lastMode = 'heuristic';
    return scores;
  }

  function expandSynonyms(tokens) {
    const out = new Set(tokens);
    for (const t of tokens) {
      const key = t.replace(/ue/g, 'ue');
      for (const [base, syns] of Object.entries(SYNONYMS)) {
        if (base === key || syns.includes(t)) { out.add(base); syns.forEach((s) => out.add(normalize(s))); }
      }
    }
    return [...out];
  }

  /* Asynchroner Semantik-Lauf: berechnet Scores und triggert Re-Render. */
  const runSemantic = debounce(async (query) => {
    if (!query) return;
    const nodes = gatherAllNodes().filter((n) => n.type === 'prompt' || n.type === 'folder');
    let scores = null;
    try { scores = await neuralRank(query, nodes); } catch (_) { scores = null; }
    if (!scores) scores = heuristicRank(query, nodes);
    // LRU-artige Begrenzung: vermeidet unbegrenztes Wachstum des Query-Caches
    // über lange Sitzungen (jede distinkte Suchanfrage legte bisher einen Eintrag an).
    if (PT.semantic.queryCache.size >= SEMANTIC_QUERY_CACHE_LIMIT) {
      PT.semantic.queryCache.delete(PT.semantic.queryCache.keys().next().value);
    }
    PT.semantic.queryCache.delete(query);
    PT.semantic.queryCache.set(query, scores);
    updateSemanticBadge();
    if (PT.search.scope === 'semantic' && currentQuery() === query) {
      window.renderView(window.currentNode);
    }
  }, 220);

  /* =================================================================
   * 3 · Such-Kandidaten & Ranking  (#4 / #7 / #8)
   * ================================================================= */
  function currentQuery() { return (window.currentSearchQuery || '').trim(); }

  function isResultsMode() {
    const s = PT.search;
    return !!(s.collection || s.tag || s.scope !== 'folder' || (currentQuery() && s.filter !== 'all'));
  }

  function candidateNodes() {
    const s = PT.search;
    let list;
    if (s.collection) list = gatherAllNodes().filter(s.collection.fn);
    else if (s.tag) list = gatherAllNodes().filter((n) => Array.isArray(n.tags) && n.tags.map(normalize).includes(normalize(s.tag)));
    else if (s.scope === 'global' || s.scope === 'semantic') list = gatherAllNodes();
    else list = (window.currentNode && window.currentNode.items) ? [...window.currentNode.items] : [];

    // Filter-Chips.
    if (s.filter === 'favorites') list = list.filter((n) => (window.favoritePrompts || []).includes(n.id));
    else if (s.filter === 'recent') list = list.filter((n) => PT.recentOrder.includes(n.id));
    else if (s.filter === 'folders') list = list.filter((n) => n.type === 'folder' || n.type === 'folder-link');
    else if (s.filter === 'prompts') list = list.filter((n) => n.type === 'prompt' || n.type === 'prompt-link');
    return list;
  }

  function applyQueryRanking(list) {
    const q = currentQuery();
    const s = PT.search;
    if (!q) {
      // Ohne Query: Recent-Filter chronologisch, Collections nach ihrer Logik.
      if (s.filter === 'recent') {
        const order = new Map(PT.recentOrder.map((id, i) => [id, i]));
        return list.slice().sort((a, b) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9));
      }
      if (s.collection && s.collection.sort) return list.slice().sort(s.collection.sort);
      return list;
    }
    if (s.scope === 'semantic') {
      const scores = PT.semantic.queryCache.get(q);
      if (!scores) { runSemantic(q); return heuristicSort(list, q); } // sofortiger Heuristik-Vorschau, neuronal folgt
      return list
        .map((n) => ({ n, sc: scores.get(n.id) || 0 }))
        .filter((x) => x.sc > 0.12)
        .sort((a, b) => b.sc - a.sc)
        .map((x) => x.n);
    }
    // Lexikalische Suche (Ordner/Global).
    const nq = normalize(q);
    return list
      .map((n) => ({ n, sc: lexicalScore(n, nq) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .map((x) => x.n);
  }

  function heuristicSort(list, q) {
    const scores = heuristicRank(q, list);
    return list.map((n) => ({ n, sc: scores.get(n.id) || 0 }))
      .filter((x) => x.sc > 0.1).sort((a, b) => b.sc - a.sc).map((x) => x.n);
  }

function lexicalScore(node, nq) {
  const title = normalize(node.title || '');
  const content = normalize(node.content || '');
  const tags = Array.isArray(node.tags) ? node.tags.map(normalize).join(' ') : '';
  let sc = 0;
    if (title === nq) sc += 100;
    if (title.startsWith(nq)) sc += 40;
    if (title.includes(nq)) sc += 25;
    if (tags.includes(nq)) sc += 18;
    if (content.includes(nq)) sc += 8;
    // Token-weise Teiltreffer.
    if (sc === 0) {
      const qt = tokenize(nq);
      const hay = `${title} ${tags} ${content}`;
      qt.forEach((t) => { if (hay.includes(t)) sc += 3; });
    }
    return sc;
  }

  /* =================================================================
   * 4 · Hook: getVisibleNodesForCurrentView  (Suchkern)
   * ================================================================= */
  function installSearchHook() {
    window.getVisibleNodesForCurrentView = function (childNodes) {
      try {
        if (!isResultsMode() && !currentQuery()) return childNodes;
        const list = candidateNodes();
        return applyQueryRanking(list);
      } catch (err) {
        console.warn('[Search] Fallback auf Original:', err);
        const q = currentQuery();
        if (!q) return childNodes;
        return childNodes.filter((i) =>
          normalize(i.title).includes(normalize(q)) || normalize(i.content).includes(normalize(q)));
      }
    };
  }

  /* =================================================================
   * 5 · Hook: renderView – Hervorhebung, Tags, Smart-Bar, Stagger,
   *           Deep-Link-Sync, Ergebnis-Banner  (#6 / #7 / #8 / #11)
   * ================================================================= */
  function installRenderHook() {
    const orig = window.renderView;
    window.renderView = function (node) {
      removeSkeletons();
      orig.call(this, node);
      try {
        decorateCards();
        highlightMatches();
        renderResultsBanner();
        renderSmartCollections(node);
        syncToolbarUI();
        syncHash();
      } catch (err) { console.warn('[renderView hook]', err); }
    };
  }

  function decorateCards() {
    const cards = window.cardsContainerEl || document.getElementById('cards-container');
    if (!cards) return;
    const items = cards.querySelectorAll('.card');
    items.forEach((card, idx) => {
      card.style.setProperty('--card-index', idx);
      const id = card.getAttribute('data-id');
      const node = id ? window.findNodeById(window.jsonData, id) : null;
      const resolved = node && window.resolveLinkedNode ? window.resolveLinkedNode(node) : node;
      if (!resolved) return;

      // Tag-Chips auf Karten.
      if (Array.isArray(resolved.tags) && resolved.tags.length && !card.querySelector('.card-tags')) {
        const wrap = card.querySelector('.card-content-wrapper') || card;
        const tagRow = document.createElement('div');
        tagRow.className = 'card-tags';
        resolved.tags.slice(0, 3).forEach((tag) => {
          const chip = document.createElement('span');
          chip.className = 'card-tag';
          chip.textContent = tag;
          chip.dataset.tag = tag;
          tagRow.appendChild(chip);
        });
        wrap.appendChild(tagRow);
      }

      // „Häufig genutzt"-Indikator.
      const u = PT.usage[resolved.id];
      if (u && u.count >= 3 && !card.querySelector('.card-usage-badge')) {
        const badge = document.createElement('span');
        badge.className = 'card-usage-badge';
        badge.title = `${u.count}× kopiert`;
        badge.textContent = u.count > 99 ? '99+' : String(u.count);
        card.appendChild(badge);
      }
    });
  }

  function highlightMatches() {
    const q = currentQuery();
    if (!q || PT.search.scope === 'semantic') return;
    const cards = document.getElementById('cards-container');
    if (!cards) return;
    const nq = normalize(q);
    if (!nq) return;
    cards.querySelectorAll('.card h3').forEach((h3) => {
      const text = h3.textContent;
      // normalize() kann die Länge ändern (ä→ae, ö→oe, ü→ue, ß→ss). Daher den
      // Treffer auf der normalisierten Fassung suchen, aber die Original-Offsets
      // über eine Index-Abbildung zurückrechnen, damit die Hervorhebung exakt sitzt.
      let norm = '';
      const map = []; // map[normIndex] -> originalIndex
      for (let i = 0; i < text.length; i++) {
        const piece = normalize(text[i]);
        for (let k = 0; k < piece.length; k++) map.push(i);
        norm += piece;
      }
      map.push(text.length); // Sentinel für das Ende
      const idx = norm.indexOf(nq);
      if (idx < 0) return;
      const start = map[idx];
      const end = map[idx + nq.length];
      const before = text.slice(0, start);
      const match = text.slice(start, end);
      const after = text.slice(end);
      h3.innerHTML = '';
      h3.append(document.createTextNode(before));
      const mark = document.createElement('mark');
      mark.className = 'search-hl';
      mark.textContent = match;
      h3.append(mark, document.createTextNode(after));
    });
  }

  /* =================================================================
   * 6 · Smart Collections  (#8)
   * ================================================================= */
  function smartDefs() {
    return [
      {
        key: 'favorites', label: 'Favoriten', icon: '★',
        fn: (n) => (window.favoritePrompts || []).includes(n.id),
        count: () => (window.favoritePrompts || []).length,
      },
      {
        key: 'recent', label: 'Zuletzt verwendet', icon: '🕑',
        fn: (n) => PT.recentOrder.includes(n.id),
        sort: (a, b) => (PT.recentOrder.indexOf(a.id)) - (PT.recentOrder.indexOf(b.id)),
        count: () => PT.recentOrder.length,
      },
      {
        key: 'frequent', label: 'Häufig genutzt', icon: '🔥',
        fn: (n) => (PT.usage[n.id]?.count || 0) >= 2,
        sort: (a, b) => (PT.usage[b.id]?.count || 0) - (PT.usage[a.id]?.count || 0),
        count: () => Object.values(PT.usage).filter((u) => u.count >= 2).length,
      },
    ];
  }

  function allTagsWithCount() {
    const map = new Map();
    gatherAllNodes().forEach((n) => (n.tags || []).forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }

  function renderSmartCollections(node) {
    const cards = document.getElementById('cards-container');
    if (!cards) return;
    const atHome = node === window.jsonData && window.pathStack && window.pathStack.length === 0;
    if (!atHome || isResultsMode() || currentQuery()) return;

    const bar = document.createElement('section');
    bar.className = 'smart-collections';
    bar.setAttribute('aria-label', 'Intelligente Sammlungen');

    const defs = smartDefs().filter((d) => d.count() > 0);
    defs.forEach((def) => {
      const chip = document.createElement('button');
      chip.className = 'smart-chip';
      chip.dataset.collection = def.key;
      chip.innerHTML = `<span class="smart-chip-icon">${def.icon}</span><span class="smart-chip-label">${def.label}</span><span class="smart-chip-count">${def.count()}</span>`;
      chip.addEventListener('click', () => openCollection(def));
      bar.appendChild(chip);
    });

    const tags = allTagsWithCount();
    if (tags.length) {
      const sep = document.createElement('span');
      sep.className = 'smart-sep';
      sep.setAttribute('aria-hidden', 'true');
      bar.appendChild(sep);
      tags.slice(0, 12).forEach(([tag, count]) => {
        const chip = document.createElement('button');
        chip.className = 'smart-chip smart-chip-tag';
        chip.dataset.tag = tag;
        chip.innerHTML = `<span class="smart-chip-hash">#</span><span class="smart-chip-label">${escapeHtml(tag)}</span><span class="smart-chip-count">${count}</span>`;
        chip.addEventListener('click', () => openTag(tag));
        bar.appendChild(chip);
      });
    }

    if (bar.children.length) cards.insertBefore(bar, cards.firstChild);
  }

  function openCollection(def) {
    resetSearchExceptScope();
    PT.search.collection = def;
    PT.search.scope = 'global';
    haptic('light');
    window.renderView(window.currentNode);
  }
  function openTag(tag) {
    resetSearchExceptScope();
    PT.search.tag = tag;
    PT.search.scope = 'global';
    haptic('light');
    window.renderView(window.currentNode);
  }
  function resetSearchExceptScope() {
    PT.search.collection = null;
    PT.search.tag = null;
    PT.search.filter = 'all';
    window.currentSearchQuery = '';
    const inp = document.getElementById('search-input');
    if (inp) inp.value = '';
  }
  function clearResults() {
    PT.search.collection = null;
    PT.search.tag = null;
    PT.search.scope = 'folder';
    PT.search.filter = 'all';
    window.currentSearchQuery = '';
    const inp = document.getElementById('search-input');
    if (inp) inp.value = '';
    window.renderView(window.currentNode);
  }

  /* =================================================================
   * 7 · Ergebnis-Banner & erweiterte Such-Toolbar  (#7)
   * ================================================================= */
  function renderResultsBanner() {
    const main = document.getElementById('cards-container');
    if (!main) return;
    if (!isResultsMode() && !currentQuery()) return;
    const bannerEl = document.createElement('div');
    bannerEl.className = 'results-banner';
    const s = PT.search;
    let ctx = '';
    if (s.collection) ctx = `${s.collection.icon} ${s.collection.label}`;
    else if (s.tag) ctx = `# ${s.tag}`;
    else if (s.scope === 'semantic') ctx = `Semantische Suche${PT.semantic.lastMode === 'neural' ? ' · neuronal' : PT.semantic.lastMode === 'heuristic' ? ' · heuristisch' : ''}`;
    else if (s.scope === 'global') ctx = 'Globale Suche';
    else ctx = 'Suche im Ordner';
    const q = currentQuery();
    const visible = document.querySelectorAll('#cards-container .card').length;
    bannerEl.innerHTML = `
      <div class="results-banner-inner">
        <span class="results-context">${escapeHtml(ctx)}${q ? ` · „${escapeHtml(q)}"` : ''}</span>
        <span class="results-count">${visible} Treffer</span>
        <button class="results-clear" type="button" aria-label="Suche zurücksetzen">Zurücksetzen</button>
      </div>`;
    bannerEl.querySelector('.results-clear').addEventListener('click', clearResults);
    main.insertBefore(bannerEl, main.firstChild);
  }

  /* Erweiterte Toolbar-Steuerung (Scopes + Filter-Chips) unter dem Suchfeld. */
  let toolbarUI = null;
  function buildToolbarUI() {
    const wrap = document.querySelector('.toolbar-search-wrap');
    if (!wrap || toolbarUI) return;
    toolbarUI = document.createElement('div');
    toolbarUI.className = 'search-advanced';
    toolbarUI.innerHTML = `
      <div class="search-scopes" role="tablist" aria-label="Suchbereich">
        <button class="scope-btn is-active" data-scope="folder" role="tab">Ordner</button>
        <button class="scope-btn" data-scope="global" role="tab">Global</button>
        <button class="scope-btn" data-scope="semantic" role="tab">Semantik<span class="scope-badge" hidden></span></button>
      </div>
      <div class="search-filters" role="group" aria-label="Filter">
        <button class="filter-chip is-active" data-filter="all">Alle</button>
        <button class="filter-chip" data-filter="favorites">★ Favoriten</button>
        <button class="filter-chip" data-filter="recent">🕑 Zuletzt</button>
        <button class="filter-chip" data-filter="folders">🗂 Ordner</button>
        <button class="filter-chip" data-filter="prompts">📝 Prompts</button>
      </div>`;
    wrap.appendChild(toolbarUI);

    toolbarUI.querySelectorAll('.scope-btn').forEach((btn) => btn.addEventListener('click', () => {
      PT.search.scope = btn.dataset.scope;
      PT.search.collection = null; PT.search.tag = null;
      if (PT.search.scope === 'semantic' && currentQuery()) runSemantic(currentQuery());
      haptic('light');
      window.renderView(window.currentNode);
    }));
    toolbarUI.querySelectorAll('.filter-chip').forEach((btn) => btn.addEventListener('click', () => {
      PT.search.filter = btn.dataset.filter;
      haptic('light');
      window.renderView(window.currentNode);
    }));
  }

  function syncToolbarUI() {
    if (!toolbarUI) return;
    toolbarUI.querySelectorAll('.scope-btn').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.scope === PT.search.scope));
    toolbarUI.querySelectorAll('.filter-chip').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.filter === PT.search.filter));
  }
  function updateSemanticBadge() {
    const badge = toolbarUI?.querySelector('.scope-badge');
    if (!badge) return;
    if (PT.semantic.neuralAvailable === true) { badge.hidden = false; badge.textContent = 'AI'; badge.title = 'Neuronales Modell aktiv'; }
    else if (PT.semantic.neuralAvailable === false) { badge.hidden = false; badge.textContent = '≈'; badge.title = 'Heuristik (offline)'; }
  }

  /* Semantik-Lauf an Eingaben koppeln. */
  function installSearchInputBridge() {
    const inp = document.getElementById('search-input');
    if (!inp) return;
    inp.addEventListener('input', () => {
      if (PT.search.scope === 'semantic') {
        const q = (inp.value || '').trim();
        if (q) runSemantic(q);
      }
    });
  }

  /* =================================================================
   * 8 · Tag-Editor im Prompt-Modal  (#8)
   * ================================================================= */
  function installModalTagEditor() {
    const orig = window.openPromptModal;
    window.openPromptModal = function (node, calledFromPopstate) {
      orig.call(this, node, calledFromPopstate);
      try {
        if (node && node.type === 'prompt') { recordUsage(node.id, { copied: false }); renderTagEditor(node); }
        syncHash();
      } catch (err) { console.warn('[tag editor]', err); }
    };
    // Im „Neuer Prompt"-Modus den Tag-Editor des vorherigen Prompts ausblenden.
    const origNew = window.openNewPromptModal;
    if (typeof origNew === 'function') {
      window.openNewPromptModal = function () {
        const editor = document.querySelector('#prompt-modal .tag-editor');
        if (editor) editor.remove();
        return origNew.apply(this, arguments);
      };
    }
  }

  function renderTagEditor(node) {
    const modalContent = document.querySelector('#prompt-modal .modal-content');
    const textarea = document.getElementById('prompt-fulltext');
    if (!modalContent || !textarea) return;
    let editor = modalContent.querySelector('.tag-editor');
    if (!editor) {
      editor = document.createElement('div');
      editor.className = 'tag-editor';
      editor.innerHTML = `
        <div class="tag-editor-chips"></div>
        <div class="tag-editor-input-row">
          <input type="text" class="tag-editor-input" placeholder="Tag hinzufügen …" maxlength="28" aria-label="Tag hinzufügen">
        </div>`;
      textarea.insertAdjacentElement('afterend', editor);
      const input = editor.querySelector('.tag-editor-input');
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addTagToCurrent(input.value); input.value = ''; }
      });
    }
    paintTagChips(node);
    editor.dataset.nodeId = node.id;
  }

  function paintTagChips(node) {
    const editor = document.querySelector('#prompt-modal .tag-editor');
    if (!editor) return;
    const chips = editor.querySelector('.tag-editor-chips');
    chips.innerHTML = '';
    (node.tags || []).forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `<span>${escapeHtml(tag)}</span><button type="button" class="tag-remove" aria-label="Tag entfernen">×</button>`;
      chip.querySelector('.tag-remove').addEventListener('click', () => removeTagFromCurrent(tag));
      chips.appendChild(chip);
    });
  }

  function currentModalNode() {
    const id = document.getElementById('prompt-modal')?.getAttribute('data-id');
    return id ? window.findNodeById(window.jsonData, id) : null;
  }
  function addTagToCurrent(raw) {
    const tag = (raw || '').trim().replace(/^#/, '');
    if (!tag) return;
    const node = currentModalNode();
    if (!node) return;
    node.tags = Array.isArray(node.tags) ? node.tags : [];
    if (!node.tags.map(normalize).includes(normalize(tag))) {
      node.tags.push(tag);
      persistTags('Tag hinzugefügt.');
      paintTagChips(node);
      haptic('light');
    }
  }
  function removeTagFromCurrent(tag) {
    const node = currentModalNode();
    if (!node || !Array.isArray(node.tags)) return;
    node.tags = node.tags.filter((t) => normalize(t) !== normalize(tag));
    if (!node.tags.length) delete node.tags;
    persistTags('Tag entfernt.');
    paintTagChips(node);
  }
  const persistTags = debounce((msg) => {
    if (typeof window.persistJsonData === 'function') window.persistJsonData(msg || 'Tags gespeichert.', 'success');
  }, 250);

  /* =================================================================
   * 9 · Deep-Link-Routing & View-Transitions  (#6)
   * ================================================================= */
  function encodeHash() {
    const ids = (window.pathStack || []).filter((n) => n && n !== window.jsonData).map((n) => n.id);
    if (window.currentNode && window.currentNode !== window.jsonData) ids.push(window.currentNode.id);
    let hash = ids.length ? `#/n/${ids.join('/')}` : '#/';
    const modal = document.getElementById('prompt-modal');
    if (modal && modal.classList.contains('visible')) {
      const pid = modal.getAttribute('data-id');
      if (pid) hash += `/p/${pid}`;
    }
    return hash;
  }

  function syncHash() {
    const next = encodeHash();
    if (('#' + (location.hash.replace(/^#/, ''))) === next) return;
    if (location.hash === next) return;
    PT.hashLock = true;
    try { history.replaceState(history.state, '', next); } catch (_) {}
    setTimeout(() => { PT.hashLock = false; }, 0);
  }

  function navigateToPath(ids, promptId) {
    if (!window.jsonData) return;
    const targetId = ids[ids.length - 1];
    const resolved = targetId ? buildPathTo(targetId) : { node: window.jsonData, ancestors: [] };
    const apply = () => {
      if (!resolved || !resolved.node) {
        window.pathStack = []; window.currentNode = window.jsonData;
      } else if (resolved.node === window.jsonData) {
        window.pathStack = []; window.currentNode = window.jsonData;
      } else {
        window.pathStack = resolved.ancestors;
        window.currentNode = resolved.node;
      }
      window.renderView(window.currentNode);
      window.updateBreadcrumb();
    };
    if (window.performViewTransition) window.performViewTransition(apply, 'forward'); else apply();
    if (promptId) {
      const pnode = window.findNodeById(window.jsonData, promptId);
      const target = pnode && window.resolveLinkedNode ? window.resolveLinkedNode(pnode) : pnode;
      if (target && target.type === 'prompt') setTimeout(() => window.openPromptModal(target, true), 60);
    }
  }

  function handleHashChange() {
    if (PT.hashLock) return;
    // Bereits am Ziel? (z. B. durch popstate ausgelöste, redundante hashchange)
    if (location.hash === encodeHash()) return;
    const raw = location.hash.replace(/^#\/?/, '');
    if (!raw || raw === 'n' ) { navigateToPath([]); return; }
    const parts = raw.split('/');
    const ids = []; let promptId = null;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'n') continue;
      if (parts[i] === 'p') { promptId = parts[i + 1]; break; }
      if (parts[i]) ids.push(parts[i]);
    }
    navigateToPath(ids, promptId);
  }

  /* Schließen der Suche beendet jeden Scope/Filter/Collection-Kontext und
     kehrt sauber zur Ordneransicht zurück (deckt Toggle, Escape, Außenklick ab,
     da setSearchExpanded global aufgerufen wird). */
  function installCollapseGuard() {
    const orig = window.setSearchExpanded;
    if (typeof orig !== 'function') return;
    window.setSearchExpanded = function (expanded) {
      const r = orig.call(this, expanded);
      if (!expanded && (isResultsMode() || currentQuery())) {
        clearResultsState();
        if (window.currentNode) window.renderView(window.currentNode);
      }
      return r;
    };
  }

  /* Home-/Zurück-/Breadcrumb-Buttons wurden in script.js per Referenz gebunden
     (vor Installation unserer Wrapper). Daher zusätzlich Capture-Phase-Guards,
     die einen aktiven Such-/Sammlungs-Kontext vor der eigentlichen Navigation
     zurücksetzen. */
  function installNavResetGuards() {
    ['app-logo-button', 'fixed-back', 'topbar-back-button'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => { if (isResultsMode()) clearResultsState(); }, true);
    });
    const bc = document.getElementById('breadcrumb');
    if (bc) bc.addEventListener('click', (e) => {
      if (e.target.closest('.breadcrumb-link') && isResultsMode()) clearResultsState();
    }, true);
  }

  function installRouter() {
    window.addEventListener('hashchange', handleHashChange);
    // Modal-Schließen ebenfalls in den Hash spiegeln.
    const origClose = window.closeModal;
    if (typeof origClose === 'function') {
      window.closeModal = function (arg) { origClose.call(this, arg); setTimeout(syncHash, 0); };
    }
  }

  function applyInitialDeepLink() {
    if (location.hash && location.hash.length > 2) handleHashChange();
  }

  /* =================================================================
   * 10 · Mikrointeraktionen: Skeletons, Ripples, Haptik, Stagger (#11)
   * ================================================================= */
  function showSkeletons(count = 8) {
    const cards = document.getElementById('cards-container');
    if (!cards || cards.querySelector('.card') || cards.querySelector('.skeleton-card')) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const sk = document.createElement('div');
      sk.className = 'skeleton-card';
      sk.style.setProperty('--card-index', i);
      sk.innerHTML = `<div class="sk-line sk-title"></div><div class="sk-line"></div><div class="sk-line sk-short"></div>`;
      frag.appendChild(sk);
    }
    cards.appendChild(frag);
  }
  function removeSkeletons() {
    document.querySelectorAll('#cards-container .skeleton-card').forEach((s) => s.remove());
  }

  function haptic(type) {
    if (typeof window.triggerHapticFeedback === 'function') { window.triggerHapticFeedback(type); return; }
    if (navigator.vibrate) navigator.vibrate(type === 'medium' ? 16 : type === 'heavy' ? 28 : 8);
  }

  function installRipples() {
    document.addEventListener('pointerdown', (e) => {
      const target = e.target.closest('.card, .btn, .smart-chip, .filter-chip, .scope-btn, .favorite-chip');
      if (!target || target.classList.contains('no-ripple')) return;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'pt-ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      const prevPos = getComputedStyle(target).position;
      if (prevPos === 'static') target.style.position = 'relative';
      target.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }, { passive: true });
  }

  /* Haptik an Kernaktionen koppeln (kopieren, favorisieren, navigieren). */
  function installHapticBridges() {
    ['copyToClipboard', 'copyPromptTextForCard'].forEach((name) => {
      const orig = window[name];
      if (typeof orig !== 'function') return;
      window[name] = function (...args) {
        const r = orig.apply(this, args);
        try {
          haptic('medium');
          const node = args.find((a) => a && a.id && a.type);
          if (node) recordUsage(node.id, { copied: true });
        } catch (_) {}
        return r;
      };
    });
    // Echte Navigation beendet einen Such-/Sammlungs-Kontext.
    const navOrig = window.navigateToNode;
    if (typeof navOrig === 'function') {
      window.navigateToNode = function (node) { haptic('light'); clearResultsState(); return navOrig.call(this, node); };
    }
    ['navigateToHome', 'navigateOneLevelUp'].forEach((name) => {
      const orig = window[name];
      if (typeof orig === 'function') window[name] = function () { clearResultsState(); return orig.apply(this, arguments); };
    });
  }

  /* Setzt den Such-/Sammlungs-Kontext zurück, OHNE neu zu rendern
     (die auslösende Navigation rendert ohnehin selbst). */
  function clearResultsState() {
    PT.search.collection = null;
    PT.search.tag = null;
    PT.search.scope = 'folder';
    PT.search.filter = 'all';
    window.currentSearchQuery = '';
    const inp = document.getElementById('search-input');
    if (inp) inp.value = '';
  }

  /* =================================================================
   * 11 · Service-Worker  (#13)
   * ================================================================= */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              showHint('Update verfügbar – wird beim nächsten Start aktiv.', 'info');
            }
          });
        });
      }).catch((err) => console.info('[SW] Registrierung fehlgeschlagen:', err?.message || err));
    });
  }

  /* =================================================================
   * 12 · Diverse Helfer
   * ================================================================= */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function showHint(msg, type) {
    if (typeof window.showNotification === 'function') window.showNotification(msg, type || 'info');
  }

  /* =================================================================
   * 13 · Bootstrapping
   * ================================================================= */
  function boot() {
    if (PT.booted) return;
    if (typeof window.renderView !== 'function' || typeof window.getVisibleNodesForCurrentView !== 'function') {
      return setTimeout(boot, 30); // auf script.js warten
    }
    PT.booted = true;

    loadUsage();
    showSkeletons();

    // WebGL-Aurora starten (CSS-Blobs bleiben bei Fehlschlag).
    if (window.AuroraWebGL) {
      try { window.AuroraWebGL.start(); } catch (_) {}
    }

    installSearchHook();
    installRenderHook();
    installModalTagEditor();
    installHapticBridges();
    installRouter();
    installCollapseGuard();
    installNavResetGuards();
    installRipples();
    buildToolbarUI();
    installSearchInputBridge();
    registerServiceWorker();

    // Aurora bei Theme-Wechsel umfärben.
    const origApply = window.applyColorScheme;
    if (typeof origApply === 'function') {
      window.applyColorScheme = function (scheme, save) {
        const r = origApply.call(this, scheme, save);
        if (window.AuroraWebGL) try { window.AuroraWebGL.setScheme(scheme); } catch (_) {}
        return r;
      };
    }

    // Sobald Daten vorhanden sind: Smart-Bar & Deep-Link.
    const waitForData = setInterval(() => {
      if (window.jsonData) {
        clearInterval(waitForData);
        removeSkeletons();
        try { applyInitialDeepLink(); } catch (_) {}
        if (window.currentNode) window.renderView(window.currentNode);
      }
    }, 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  } else {
    setTimeout(boot, 0);
  }
})();
