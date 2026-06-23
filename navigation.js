/* =====================================================================
 * Prompt-Templates – Navigation & Control Layer
 * ---------------------------------------------------------------------
 * Additive Erweiterung (lädt NACH enhancements.js) für deutlich
 * verbesserte Bedienung & Navigation. Umfasst:
 *
 *   #2  Desktop Zurück/Vorwärts-Verlauf (echte Browser-History via Hash,
 *       inkl. Maus-Seitentasten) – Mobile bleibt unangetastet.
 *   #4  Breadcrumb-Sprungvorschau: Chevron / Long-Press an jedem Pfadschritt
 *       öffnet ein Popover mit dessen Unterordnern zum Direktsprung.
 *   #6  Vollständige Tastatursteuerung des Karten-Grids (Pfeiltasten,
 *       Enter, Leertaste, f, e, Entf, Home/End) mit sichtbarem Fokusring.
 *   #9  Karten-Wischgesten (Touch): rechts = favorisieren, links = Aktionstray
 *       (Bearbeiten / Verschieben / Löschen).
 *
 * Greift ausschließlich über dokumentierte Hook-Punkte (Umhüllung globaler
 * Funktionen) und eigene Listener; verändert die Kernlogik nicht.
 * ===================================================================== */
(function () {
  'use strict';

  const NAV = {
    booted: false,
    history: { lastHash: null, userNavPending: false },
    keyboard: { focusedIndex: -1 },
    swipe: null,
    breadcrumbPopover: null,
  };
  window.PromptTemplatesNavigation = NAV;

  /* ----------------------------------------------------------------- Utils */
  const isMobileDevice = () => (typeof window.isMobile === 'function' ? window.isMobile() : false);
  const hasTouch = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  function haptic(type) {
    if (typeof window.triggerHapticFeedback === 'function') return window.triggerHapticFeedback(type);
    if (navigator.vibrate) navigator.vibrate(type === 'medium' ? 16 : type === 'heavy' ? 26 : 8);
  }

  /* DFS: Pfad (Vorfahren-Kette ohne Wurzel) + Zielknoten. */
  function buildPath(targetId) {
    let found = null;
    const ancestors = [];
    (function walk(node, chain) {
      if (found || !node) return;
      if (node.id === targetId) {
        found = node;
        chain.forEach((n) => { if (n !== window.jsonData) ancestors.push(n); });
        return;
      }
      if (Array.isArray(node.items)) node.items.forEach((c) => walk(c, chain.concat(node)));
    })(window.jsonData, []);
    return found ? { node: found, ancestors } : null;
  }

  /* Hash-Kodierung – exakt kompatibel zu enhancements.js (#/n/<id>/…[/p/<id>]). */
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

  /* Navigiert zu einem beliebigen Knoten (rekonstruiert vollständigen Pfad). */
  function navigateToNodeViaPath(target) {
    if (!target) return;
    NAV.history.userNavPending = true; // gilt für alle Sprungziele inkl. Home
    if (target === window.jsonData) {
      if (typeof window.navigateToHome === 'function') return window.navigateToHome();
    }
    const resolved = buildPath(target.id);
    const apply = () => {
      if (resolved) { window.pathStack = resolved.ancestors; window.currentNode = resolved.node; }
      else { window.pathStack = []; window.currentNode = window.jsonData; }
      window.renderView(window.currentNode);
      window.updateBreadcrumb();
    };
    if (typeof window.performViewTransition === 'function') window.performViewTransition(apply, 'forward');
    else apply();
  }

  /* =================================================================
   * #2 · Desktop Zurück/Vorwärts-Verlauf
   * ================================================================= */
  function markUserNav() { NAV.history.userNavPending = true; }

  function commitHistory() {
    if (isMobileDevice()) return;            // Mobile nutzt eigene pushState-Logik
    const h = encodeHash();
    if (NAV.history.lastHash === null) { NAV.history.lastHash = h; return; }
    if (h === NAV.history.lastHash) { NAV.history.userNavPending = false; return; }

    if (NAV.history.userNavPending) {
      // enhancements.syncHash hat den aktuellen Eintrag bereits per replaceState
      // auf den neuen Hash gesetzt – wir stellen den vorigen Eintrag wieder her
      // und legen einen echten neuen History-Eintrag an. So funktionieren
      // Browser-Zurück/Vor und Maus-Seitentasten korrekt.
      try {
        history.replaceState(history.state, '', NAV.history.lastHash);
        history.pushState({ ptNav: true }, '', h);
      } catch (_) { /* z. B. file:// */ }
      NAV.history.userNavPending = false;
    }
    NAV.history.lastHash = h;
  }

  function installDesktopHistory() {
    // Zielgerichtete „User-Navigation"-Marker.
    ['navigateToNode', 'navigateOneLevelUp'].forEach((name) => {
      const orig = window[name];
      if (typeof orig === 'function') window[name] = function () { markUserNav(); return orig.apply(this, arguments); };
    });
    // Per-Referenz gebundene Buttons + Breadcrumb über Capture-Klick markieren.
    ['app-logo-button', 'fixed-back', 'topbar-back-button'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', markUserNav, true);
    });
    const bc = document.getElementById('breadcrumb');
    if (bc) bc.addEventListener('click', (e) => { if (e.target.closest('.breadcrumb-link')) markUserNav(); }, true);

    // renderView-Wrapper → schreibt History nach jedem Render.
    const origRender = window.renderView;
    window.renderView = function (node) {
      const r = origRender.apply(this, arguments);
      try { commitHistory(); } catch (err) { console.warn('[nav history]', err); }
      return r;
    };

    // updateBreadcrumb-Wrapper → Chevrons/Annotation nach Neuaufbau des Pfads.
    const origBc = window.updateBreadcrumb;
    if (typeof origBc === 'function') {
      window.updateBreadcrumb = function () {
        const r = origBc.apply(this, arguments);
        try { annotateBreadcrumb(); } catch (_) {}
        return r;
      };
    }

    // Mausseitentasten (Browser-Default = Zurück/Vor) lösen history-Traversal &
    // damit hashchange aus – von enhancements.handleHashChange behandelt. Wir
    // schließen zusätzlich ein offenes Modal, wenn der Ziel-Hash kein /p/ trägt.
    window.addEventListener('hashchange', () => {
      const modal = document.getElementById('prompt-modal');
      if (modal && modal.classList.contains('visible') && !/\/p\//.test(location.hash)) {
        if (typeof window.closeModal === 'function') window.closeModal({ fromPopstate: true });
      }
    });
  }

  /* =================================================================
   * #4 · Breadcrumb-Sprungvorschau
   * ================================================================= */
  function currentChain() {
    const chain = [window.jsonData];
    (window.pathStack || []).forEach((n) => { if (n && n.title && n.id !== 'root' && n !== window.jsonData) chain.push(n); });
    if (window.currentNode && window.currentNode !== window.jsonData && chain[chain.length - 1] !== window.currentNode) {
      chain.push(window.currentNode);
    }
    return chain;
  }

  function subfoldersOf(node) {
    const out = [];
    (node.items || []).forEach((child) => {
      const resolved = (typeof window.resolveLinkedNode === 'function') ? window.resolveLinkedNode(child) : child;
      if (resolved && resolved.type === 'folder') out.push(resolved);
    });
    return out;
  }

  function annotateBreadcrumb() {
    const bc = document.getElementById('breadcrumb');
    if (!bc) return;
    const steps = Array.from(bc.querySelectorAll('.breadcrumb-link, .current-level-active'));
    const chain = currentChain();
    if (!steps.length || steps.length !== chain.length) return; // Mapping unsicher → keine Chevrons

    steps.forEach((stepEl, i) => {
      const node = chain[i];
      if (!node || stepEl.dataset.bcAnnotated === '1') return;
      stepEl.dataset.bcAnnotated = '1';
      stepEl.dataset.nodeId = node.id;
      const subs = subfoldersOf(node);
      if (!subs.length) return;

      const chevron = document.createElement('button');
      chevron.type = 'button';
      chevron.className = 'breadcrumb-jump';
      chevron.setAttribute('aria-label', `Unterordner von ${node.title || 'Ordner'} anzeigen`);
      chevron.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        openBreadcrumbPopover(chevron, node, subs);
      });
      stepEl.insertAdjacentElement('afterend', chevron);

      // Long-Press auf dem Pfadschritt (Touch) öffnet ebenfalls die Vorschau.
      let lpTimer = null;
      stepEl.addEventListener('touchstart', () => {
        lpTimer = setTimeout(() => { haptic('medium'); openBreadcrumbPopover(stepEl, node, subs); }, 480);
      }, { passive: true });
      const cancelLp = () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } };
      stepEl.addEventListener('touchend', cancelLp, { passive: true });
      stepEl.addEventListener('touchmove', cancelLp, { passive: true });
    });
  }

  function closeBreadcrumbPopover() {
    if (NAV.breadcrumbPopover) {
      NAV.breadcrumbPopover.remove();
      NAV.breadcrumbPopover = null;
      document.removeEventListener('click', onPopoverOutside, true);
      document.removeEventListener('keydown', onPopoverKey, true);
      window.removeEventListener('scroll', closeBreadcrumbPopover, true);
    }
  }
  function onPopoverOutside(e) {
    if (NAV.breadcrumbPopover && !NAV.breadcrumbPopover.contains(e.target) && !e.target.closest('.breadcrumb-jump')) {
      closeBreadcrumbPopover();
    }
  }
  function onPopoverKey(e) { if (e.key === 'Escape') closeBreadcrumbPopover(); }

  function openBreadcrumbPopover(anchorEl, node, subs) {
    closeBreadcrumbPopover();
    const pop = document.createElement('div');
    pop.className = 'breadcrumb-popover';
    pop.setAttribute('role', 'menu');

    const head = document.createElement('div');
    head.className = 'breadcrumb-popover-head';
    head.textContent = node.title || 'Ordner';
    pop.appendChild(head);

    const list = document.createElement('div');
    list.className = 'breadcrumb-popover-list';
    subs.forEach((sub) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'breadcrumb-popover-item';
      item.setAttribute('role', 'menuitem');
      const childCount = (sub.items || []).length;
      item.innerHTML = `
        <svg class="bp-folder" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        <span class="bp-title"></span>
        ${childCount ? `<span class="bp-count">${childCount}</span>` : ''}`;
      item.querySelector('.bp-title').textContent = sub.title || 'Ordner';
      item.addEventListener('click', () => { closeBreadcrumbPopover(); haptic('light'); navigateToNodeViaPath(sub); });
      list.appendChild(item);
    });
    pop.appendChild(list);
    document.body.appendChild(pop);
    NAV.breadcrumbPopover = pop;

    // Positionierung unter dem Anker, im Viewport gehalten.
    const r = anchorEl.getBoundingClientRect();
    const pr = pop.getBoundingClientRect();
    let left = Math.min(r.left, window.innerWidth - pr.width - 10);
    left = Math.max(10, left);
    let top = r.bottom + 6;
    if (top + pr.height > window.innerHeight - 10) top = Math.max(10, r.top - pr.height - 6);
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    requestAnimationFrame(() => pop.classList.add('is-open'));

    setTimeout(() => {
      document.addEventListener('click', onPopoverOutside, true);
      document.addEventListener('keydown', onPopoverKey, true);
      window.addEventListener('scroll', closeBreadcrumbPopover, true);
    }, 0);
  }

  /* =================================================================
   * #6 · Tastatursteuerung des Karten-Grids
   * ================================================================= */
  function getCards() {
    const c = document.getElementById('cards-container');
    return c ? Array.from(c.querySelectorAll('.card')) : [];
  }

  function clearKbdFocus() {
    document.querySelectorAll('.card.kbd-focus').forEach((c) => c.classList.remove('kbd-focus'));
  }

  function setFocus(index, { scroll = true } = {}) {
    const cards = getCards();
    if (!cards.length) { NAV.keyboard.focusedIndex = -1; return; }
    const idx = Math.max(0, Math.min(index, cards.length - 1));
    clearKbdFocus();
    const card = cards[idx];
    card.classList.add('kbd-focus');
    NAV.keyboard.focusedIndex = idx;
    if (scroll && typeof card.scrollIntoView === 'function') {
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function columnCount(cards) {
    if (cards.length < 2) return 1;
    const firstTop = cards[0].offsetTop;
    let cols = 0;
    for (const c of cards) { if (Math.abs(c.offsetTop - firstTop) < 4) cols++; else break; }
    return Math.max(1, cols);
  }

  function nodeForCard(card) {
    const id = card.getAttribute('data-id');
    const node = id ? window.findNodeById(window.jsonData, id) : null;
    return node && typeof window.resolveLinkedNode === 'function' ? window.resolveLinkedNode(node) : node;
  }

  function isTypingContext() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  function handleGridKey(e) {
    // Nicht stören, wenn ein Modal offen ist, getippt wird oder Modifier aktiv sind.
    const modalOpen = document.querySelector('.modal.visible');
    if (modalOpen || isTypingContext() || e.metaKey || e.ctrlKey || e.altKey) return;
    const container = document.getElementById('cards-container');
    if (!container) return;
    const cards = getCards();
    if (!cards.length) return;

    const cols = columnCount(cards);
    let idx = NAV.keyboard.focusedIndex;
    const ensure = () => { if (idx < 0) { idx = 0; setFocus(0); return true; } return false; };

    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); if (!ensure()) setFocus(idx + 1); break;
      case 'ArrowLeft': e.preventDefault(); if (!ensure()) setFocus(idx - 1); break;
      case 'ArrowDown': e.preventDefault(); if (!ensure()) setFocus(idx + cols); break;
      case 'ArrowUp': e.preventDefault(); if (!ensure()) setFocus(idx - cols); break;
      case 'Home': e.preventDefault(); setFocus(0); break;
      case 'End': e.preventDefault(); setFocus(cards.length - 1); break;
      case 'Enter': {
        if (idx < 0) { ensure(); break; }
        e.preventDefault();
        const node = nodeForCard(cards[idx]);
        if (!node) break;
        if (node.type === 'folder') window.navigateToNode(node);
        else if (node.type === 'prompt') window.openPromptModal(node);
        break;
      }
      case ' ': case 'Spacebar': {
        if (idx < 0) { ensure(); break; }
        e.preventDefault();
        const node = nodeForCard(cards[idx]);
        if (node && node.type === 'prompt') window.copyPromptTextForCard(node, cards[idx]);
        else if (node && node.type === 'folder') window.navigateToNode(node);
        break;
      }
      case 'f': case 'F': {
        if (idx < 0) break;
        const node = nodeForCard(cards[idx]);
        if (node && typeof window.toggleFavoriteStatus === 'function') { e.preventDefault(); window.toggleFavoriteStatus(node.id); haptic('light'); }
        break;
      }
      case 'e': case 'E': {
        if (idx < 0) break;
        e.preventDefault();
        if (typeof window.startRenamingCard === 'function') window.startRenamingCard(cards[idx]);
        break;
      }
      case 'Delete': case 'Backspace': {
        if (idx < 0) break;
        e.preventDefault();
        const id = cards[idx].getAttribute('data-id');
        if (typeof window.handleDeleteClick === 'function') window.handleDeleteClick(id, cards[idx]);
        break;
      }
      default: break;
    }
  }

  function installKeyboardNav() {
    document.addEventListener('keydown', handleGridKey);
    // Mausinteraktion hebt den Tastaturfokus auf (vermeidet doppelten Fokus).
    const container = document.getElementById('cards-container');
    if (container) {
      container.addEventListener('pointerdown', (e) => {
        const card = e.target.closest && e.target.closest('.card');
        if (card) {
          const cards = getCards();
          NAV.keyboard.focusedIndex = cards.indexOf(card);
          clearKbdFocus();
        } else {
          clearKbdFocus();
          NAV.keyboard.focusedIndex = -1;
        }
      }, true);
    }
    // Nach jedem Render Fokus zurücksetzen (Karten werden neu erzeugt).
    const origRender = window.renderView;
    window.renderView = function () {
      const r = origRender.apply(this, arguments);
      NAV.keyboard.focusedIndex = -1;
      return r;
    };
  }

  /* =================================================================
   * #9 · Karten-Wischgesten (Touch)
   * ================================================================= */
  const SWIPE_TRIGGER = 64;   // px für Aktionsauslösung
  const SWIPE_MAX = 96;       // maximale Auslenkung

  function closeAllSwipeTrays(except) {
    document.querySelectorAll('.card.swipe-actions-open').forEach((card) => {
      if (card === except) return;
      card.classList.remove('swipe-actions-open');
      const body = card.querySelector('.card-content-wrapper');
      if (body) body.style.transform = '';
    });
  }

  function ensureActionTray(card) {
    let tray = card.querySelector('.card-swipe-tray');
    if (tray) return tray;
    tray = document.createElement('div');
    tray.className = 'card-swipe-tray';
    tray.innerHTML = `
      <button type="button" class="cst-btn cst-edit" data-act="edit" aria-label="Bearbeiten">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
      <button type="button" class="cst-btn cst-move" data-act="move" aria-label="Verschieben">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
      </button>
      <button type="button" class="cst-btn cst-delete" data-act="delete" aria-label="Löschen">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      </button>`;
    tray.addEventListener('click', (e) => {
      const btn = e.target.closest('.cst-btn');
      if (!btn) return;
      e.stopPropagation();
      const id = card.getAttribute('data-id');
      const act = btn.dataset.act;
      closeAllSwipeTrays();
      if (act === 'edit' && typeof window.startRenamingCard === 'function') window.startRenamingCard(card);
      else if (act === 'move' && typeof window.openMoveItemModal === 'function') window.openMoveItemModal(id);
      else if (act === 'delete' && typeof window.handleDeleteClick === 'function') window.handleDeleteClick(id, card);
    });
    card.appendChild(tray);
    return tray;
  }

  function favoriteFlash(card) {
    const flash = document.createElement('div');
    flash.className = 'card-fav-flash';
    flash.innerHTML = `<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    card.appendChild(flash);
    requestAnimationFrame(() => flash.classList.add('show'));
    setTimeout(() => flash.remove(), 700);
  }

  function installCardSwipe() {
    const container = document.getElementById('cards-container');
    if (!container) return;

    container.addEventListener('touchstart', (e) => {
      if (container.classList.contains('edit-mode')) return;
      const card = e.target.closest && e.target.closest('.card');
      if (!card) { closeAllSwipeTrays(); return; }
      const t = e.touches[0];
      // Nicht am linken Rand starten (dort greift die Zurück-Edge-Geste).
      if (t.clientX <= 36) { NAV.swipe = null; return; }
      NAV.swipe = { card, startX: t.clientX, startY: t.clientY, dx: 0, axis: null, body: card.querySelector('.card-content-wrapper') || card };
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      const s = NAV.swipe;
      if (!s) return;
      const t = e.touches[0];
      const dx = t.clientX - s.startX;
      const dy = t.clientY - s.startY;
      if (!s.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        s.axis = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'x' : 'y';
      }
      if (s.axis !== 'x') { NAV.swipe = null; return; } // vertikal → Scrollen zulassen
      s.dx = dx;
      const clamped = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx));
      s.body.style.transition = 'none';
      s.body.style.transform = `translateX(${clamped}px)`;
      s.card.classList.toggle('swipe-right-active', dx > SWIPE_TRIGGER * 0.5);
      s.card.classList.toggle('swipe-left-active', dx < -SWIPE_TRIGGER * 0.5);
      if (dx < -8) ensureActionTray(s.card);
    }, { passive: true });

    const finish = () => {
      const s = NAV.swipe;
      NAV.swipe = null;
      if (!s) return;
      s.body.style.transition = '';
      s.card.classList.remove('swipe-right-active', 'swipe-left-active');
      const node = nodeForCard(s.card);

      if (s.dx >= SWIPE_TRIGGER) {
        // Rechts → favorisieren
        s.body.style.transform = '';
        if (node && typeof window.toggleFavoriteStatus === 'function') {
          window.toggleFavoriteStatus(node.id);
          favoriteFlash(s.card);
          haptic('medium');
        }
      } else if (s.dx <= -SWIPE_TRIGGER) {
        // Links → Aktionstray offen halten
        closeAllSwipeTrays(s.card);
        s.card.classList.add('swipe-actions-open');
        s.body.style.transform = '';
        haptic('light');
      } else {
        // Zu kurz → zurückschnappen
        s.body.style.transform = '';
        if (!s.card.classList.contains('swipe-actions-open')) {
          const body = s.card.querySelector('.card-content-wrapper');
          if (body) body.style.transform = '';
        }
      }
    };
    container.addEventListener('touchend', finish, { passive: true });
    container.addEventListener('touchcancel', finish, { passive: true });

    // Tippen außerhalb schließt offene Trays.
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.card.swipe-actions-open')) closeAllSwipeTrays();
    });
  }

  /* =================================================================
   * Bootstrapping
   * ================================================================= */
  function boot() {
    if (NAV.booted) return;
    if (typeof window.renderView !== 'function' || !window.PromptTemplatesEnhancements) {
      return setTimeout(boot, 40);
    }
    NAV.booted = true;

    installDesktopHistory();   // #2  (Wrapper 1 von renderView)
    installKeyboardNav();      // #6  (Wrapper 2 von renderView)
    if (hasTouch()) installCardSwipe(); // #9

    // Initialen History-Bezugspunkt setzen, sobald Daten da sind.
    const wait = setInterval(() => {
      if (window.jsonData) {
        clearInterval(wait);
        NAV.history.lastHash = encodeHash();
        annotateBreadcrumb();
      }
    }, 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  } else {
    setTimeout(boot, 0);
  }
})();
