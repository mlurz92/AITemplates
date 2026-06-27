// =====================================================================
// FAVORITES DOCK & DRAWER LAYER
// =====================================================================

// Local favorites UI variables that only favorites.js uses
let favoritesGestureStartX = null;
let favoritesGestureStartY = null;
let favoritesGestureLastY = null;
let favoritesGestureAxis = null;
let favoritesScrollbarHideTimeout = null;
let lastFavoritesFootprintHeight = null;
let favoritesLayoutRaf = null;
let favoritesFootprintRaf = null;

// Accents
const FAVORITE_ACCENTS = [
    { accent: '#8b5cf6', border: 'rgba(139, 92, 246, 0.65)', soft: 'rgba(139, 92, 246, 0.18)', glow: 'rgba(139, 92, 246, 0.36)', text: '#0c0f17' },
    { accent: '#00e6ff', border: 'rgba(0, 230, 255, 0.6)', soft: 'rgba(0, 230, 255, 0.14)', glow: 'rgba(0, 230, 255, 0.35)', text: '#0c0f17' },
    { accent: '#50fa7b', border: 'rgba(80, 250, 123, 0.58)', soft: 'rgba(80, 250, 123, 0.18)', glow: 'rgba(80, 250, 123, 0.35)', text: '#0c0f17' },
    { accent: '#ffb86c', border: 'rgba(255, 184, 108, 0.6)', soft: 'rgba(255, 184, 108, 0.18)', glow: 'rgba(255, 184, 108, 0.32)', text: '#0c0f17' },
    { accent: '#ff79c6', border: 'rgba(255, 121, 198, 0.6)', soft: 'rgba(255, 121, 198, 0.18)', glow: 'rgba(255, 121, 198, 0.34)', text: '#0c0f17' },
    { accent: '#bd93f9', border: 'rgba(189, 147, 249, 0.6)', soft: 'rgba(189, 147, 249, 0.18)', glow: 'rgba(189, 147, 249, 0.34)', text: '#0c0f17' },
    { accent: '#f1fa8c', border: 'rgba(241, 250, 140, 0.58)', soft: 'rgba(241, 250, 140, 0.18)', glow: 'rgba(241, 250, 140, 0.3)', text: '#0c0f17' },
    { accent: '#ff5555', border: 'rgba(255, 85, 85, 0.6)', soft: 'rgba(255, 85, 85, 0.16)', glow: 'rgba(255, 85, 85, 0.32)', text: '#0c0f17' }
];

const FAVORITE_CHIP_MIN_WIDTH = 140;
const FAVORITE_CHIP_MAX_WIDTH = 236;
const FAVORITE_CHIP_MIN_WIDTH_NARROW = 112;
const FAVORITE_CHIP_IDEAL_WIDTH = 208;
const FAVORITE_FULL_LAYOUT_THRESHOLD = 204;
const FAVORITE_COMPACT_LAYOUT_THRESHOLD = 154;
const FAVORITE_TITLE_MIN_SCALE = 0.6;
const FAVORITE_PREVIEW_MIN_SCALE = 0.7;

let favoritesChipResizeObserver = null;

// Optimierung 2.D: Event-Delegation auf dem Container favorites-list
document.addEventListener('DOMContentLoaded', () => {
    const listEl = document.getElementById('favorites-list');
    if (listEl) {
        listEl.addEventListener('click', (e) => {
            const button = e.target.closest('.favorite-chip');
            if (!button) return;
            const id = button.dataset.id;
            const node = window.findNodeById(window.jsonData, id);
            if (!node) return;
            if (node.type === 'folder') {
                window.navigateToNode(node);
                return;
            }
            window.copyToClipboard(node.content || '', button, node);
        });
    }
});

window.collapseFavoritesBar = function() {
    if (!window.favoritesDockEl) return;

    const activeElement = document.activeElement;
    if (activeElement && window.favoritesDockEl.contains(activeElement)) {
        activeElement.blur();
    }

    window.setFavoritesExpanded(false);
};

window.toggleFavoritesExpanded = function() {
    if (!window.favoritesDockEl) return;
    const shouldExpand = !window.favoritesDockEl.classList.contains('expanded');
    window.setFavoritesExpanded(shouldExpand);
};

window.setFavoritesExpanded = function(shouldExpand) {
    if (!window.favoritesDockEl) return;

    const expanded = Boolean(shouldExpand);
    const chips = window.favoritesListEl ? Array.from(window.favoritesListEl.querySelectorAll('.favorite-chip')) : [];
    const scrollFrame = window.favoritesScrollAreaEl;
    const canAnimate = typeof window !== 'undefined' && window.gsap;
    const useFlip = canAnimate && window.Flip && chips.length > 0;

    let flipState = null;
    if (useFlip) {
        try {
            flipState = window.Flip.getState(chips);
        } catch (err) {
            flipState = null;
        }
    }

    let startHeight = null;
    if (scrollFrame) {
        const measured = scrollFrame.getBoundingClientRect().height;
        if (Number.isFinite(measured) && measured > 0) {
            startHeight = measured;
            scrollFrame.style.height = `${measured}px`;
        }
    }

    window.favoritesDockEl.classList.toggle('expanded', expanded);
    window.favoritesDockEl.classList.toggle('collapsed', !expanded);
    window.queueUpdateFavoritesFootprint();

    if (window.favoritesToggleBtn) {
        window.favoritesToggleBtn.setAttribute('aria-expanded', String(expanded));
        const label = expanded ? 'Favoriten-Dashboard minimieren' : 'Favoriten-Dashboard erweitern';
        window.favoritesToggleBtn.setAttribute('aria-label', label);
        window.favoritesToggleBtn.classList.toggle('is-expanded', expanded);
        const srText = window.favoritesToggleBtn.querySelector('.sr-only');
        if (srText) {
            srText.textContent = label;
        }
    }

    if (favoritesLayoutRaf) {
        cancelAnimationFrame(favoritesLayoutRaf);
        favoritesLayoutRaf = null;
    }
    window.refreshFavoritesLayout();

    const runAnimations = () => {
        if (scrollFrame) {
            scrollFrame.style.height = 'auto';
            const targetHeight = scrollFrame.getBoundingClientRect().height;
            const heightFrom = Number.isFinite(startHeight) && startHeight !== null ? startHeight : targetHeight;

            if (canAnimate && typeof window.gsap.to === 'function' && Number.isFinite(targetHeight)) {
                if (Number.isFinite(heightFrom)) {
                    scrollFrame.style.height = `${heightFrom}px`;
                }
                window.gsap.to(scrollFrame, {
                    height: targetHeight,
                    duration: 0.9,
                    ease: 'power3.out',
                    overwrite: true,
                    onUpdate: () => {
                        window.updateFavoritesOverflowMarkers();
                        window.queueUpdateFavoritesFootprint();
                    },
                    onComplete: () => {
                        scrollFrame.style.height = '';
                        window.updateFavoritesOverflowMarkers();
                        window.queueUpdateFavoritesFootprint();
                    }
                });
            } else {
                scrollFrame.style.height = '';
                window.updateFavoritesOverflowMarkers();
                window.queueUpdateFavoritesFootprint();
            }
        } else {
            window.updateFavoritesOverflowMarkers();
            window.queueUpdateFavoritesFootprint();
        }

        if (flipState && canAnimate) {
            try {
                window.Flip.from(flipState, {
                    duration: 0.9,
                    ease: 'power3.inOut',
                    absolute: true,
                    nested: true,
                    prune: true,
                    stagger: { each: 0.016, from: 'center', ease: 'power3.out' },
                    onEnter: elements => {
                        window.gsap.fromTo(elements, { opacity: 0, scale: 0.9, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'power3.out', overwrite: true });
                    },
                    onLeave: elements => {
                        window.gsap.to(elements, { opacity: 0, scale: 0.9, duration: 0.45, ease: 'power2.inOut', overwrite: true });
                    }
                });
            } catch (err) {
                // ignore
            }
        }
    };

    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(runAnimations);
    } else {
        runAnimations();
    }
};

window.handleFavoritesWheel = function(event) {
    if (!window.favoritesDockEl || !window.favoritesScrollAreaEl) return;
    if (window.favoritesDockEl.classList.contains('expanded')) return;
    if (!window.favoritesDockEl.classList.contains('overflowing')) return;

    const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (delta === 0) return;

    window.favoritesScrollAreaEl.scrollLeft += delta;
    window.revealFavoritesScrollbar();
    window.updateFavoritesOverflowMarkers();
    event.preventDefault();
};

window.handleFavoritesScroll = function() {
    if (!window.favoritesScrollAreaEl) return;
    window.revealFavoritesScrollbar();
    window.updateFavoritesOverflowMarkers();
};

window.handleFavoritesTouchStart = function(event) {
    if (!window.favoritesDockEl || !event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    favoritesGestureStartX = touch.clientX;
    favoritesGestureStartY = touch.clientY;
    favoritesGestureLastY = touch.clientY;
    favoritesGestureAxis = null;
    window.revealFavoritesScrollbar();
};

window.handleFavoritesTouchMove = function(event) {
    if (favoritesGestureStartX === null || !event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - favoritesGestureStartX;
    const deltaY = touch.clientY - favoritesGestureStartY;

    if (!favoritesGestureAxis) {
        if (Math.abs(deltaX) > 18 || Math.abs(deltaY) > 18) {
            favoritesGestureAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
        }
    }

    favoritesGestureLastY = touch.clientY;
};

window.handleFavoritesTouchEnd = function() {
    if (favoritesGestureStartY === null) {
        window.resetFavoritesGesture();
        return;
    }

    if (favoritesGestureAxis === 'y') {
        const deltaY = (favoritesGestureLastY ?? favoritesGestureStartY) - favoritesGestureStartY;
        const expanded = window.favoritesDockEl && window.favoritesDockEl.classList.contains('expanded');
        const threshold = 56;

        if (deltaY < -threshold && !expanded) {
            window.setFavoritesExpanded(true);
        } else if (deltaY > threshold && expanded) {
            window.setFavoritesExpanded(false);
        }
    }

    window.resetFavoritesGesture();
};

window.resetFavoritesGesture = function() {
    favoritesGestureStartX = null;
    favoritesGestureStartY = null;
    favoritesGestureLastY = null;
    favoritesGestureAxis = null;
};

window.updateFavoritesOverflowMarkers = function() {
    if (!window.favoritesDockEl || !window.favoritesScrollAreaEl) return;
    if (window.favoritesDockEl.classList.contains('expanded')) {
        window.favoritesDockEl.classList.remove('scroll-left', 'scroll-right');
        return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = window.favoritesScrollAreaEl;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth - 1);
    window.favoritesDockEl.classList.toggle('scroll-left', scrollLeft > 1);
    window.favoritesDockEl.classList.toggle('scroll-right', scrollLeft < maxScrollLeft);
};

window.revealFavoritesScrollbar = function() {
    if (!window.favoritesScrollAreaEl) return;
    window.favoritesScrollAreaEl.classList.add('show-scrollbar');
    if (favoritesScrollbarHideTimeout) {
        clearTimeout(favoritesScrollbarHideTimeout);
    }
    favoritesScrollbarHideTimeout = window.setTimeout(() => {
        window.favoritesScrollAreaEl.classList.remove('show-scrollbar');
        favoritesScrollbarHideTimeout = null;
    }, 900);
};

window.queueUpdateFavoritesFootprint = function() {
    if (!window.favoritesDockEl) return;
    if (favoritesFootprintRaf) {
        cancelAnimationFrame(favoritesFootprintRaf);
    }
    favoritesFootprintRaf = requestAnimationFrame(() => {
        favoritesFootprintRaf = null;
        const shouldMeasure = !window.favoritesDockEl.classList.contains('hidden');
        if (!shouldMeasure) {
            if (lastFavoritesFootprintHeight !== null) {
                document.body.style.removeProperty('--favorites-footprint');
                lastFavoritesFootprintHeight = null;
            }
            return;
        }
        const measured = Math.ceil(window.favoritesDockEl.getBoundingClientRect().height);
        if (Number.isFinite(measured) && measured > 0) {
            if (measured !== lastFavoritesFootprintHeight) {
                document.body.style.setProperty('--favorites-footprint', `${measured}px`);
                lastFavoritesFootprintHeight = measured;
            }
        } else if (lastFavoritesFootprintHeight !== null) {
            document.body.style.removeProperty('--favorites-footprint');
            lastFavoritesFootprintHeight = null;
        }
    });
};

window.requestFavoritesLayoutFrame = function() {
    if (favoritesLayoutRaf) {
        cancelAnimationFrame(favoritesLayoutRaf);
    }
    favoritesLayoutRaf = requestAnimationFrame(() => {
        favoritesLayoutRaf = null;
        window.refreshFavoritesLayout();
    });
};

window.refreshFavoritesLayout = function() {
    if (!window.favoritesDockEl || !window.favoritesListEl || window.favoritesDockEl.classList.contains('hidden')) return;

    const scroller = window.favoritesScrollAreaEl || window.favoritesListEl;
    if (!scroller) return;

    window.applyFavoriteChipMetrics();

    const expanded = window.favoritesDockEl.classList.contains('expanded');
    const hasOverflow = !expanded && (scroller.scrollWidth - scroller.clientWidth > 1);
    const showToggle = hasOverflow || expanded;

    window.favoritesDockEl.classList.toggle('overflowing', hasOverflow);
    window.favoritesDockEl.classList.toggle('can-expand', showToggle);

    if (window.favoritesScrollAreaEl) {
        if (!hasOverflow) {
            window.favoritesScrollAreaEl.classList.remove('show-scrollbar');
        }
    }

    if (window.favoritesToggleBtn) {
        window.favoritesToggleBtn.hidden = !showToggle;
        window.favoritesToggleBtn.setAttribute('aria-hidden', showToggle ? 'false' : 'true');
        if (!showToggle) {
            window.favoritesToggleBtn.blur();
        }
    }

    const chips = Array.from(window.favoritesListEl.querySelectorAll('.favorite-chip'));
    if (chips.length === 0) {
        window.favoritesDockEl.style.removeProperty('--favorite-chip-height');
        window.updateFavoritesOverflowMarkers();
        return;
    }

    // Optimierung 2.B: Batch DOM Reads & Writes separate
    // 1. DOM Reads: Measure chip heights and save them
    const chipHeights = chips.map(chip => {
        chip.style.removeProperty('--favorite-title-scale');
        chip.style.removeProperty('--favorite-preview-scale');
        return {
            chip,
            height: window.updateFavoriteChipLayout(chip) || 0
        };
    });

    // Find maxHeight from measures
    const maxHeight = chipHeights.reduce((max, c) => Math.max(max, c.height), 0);

    // 2. DOM Writes: Apply heights
    window.syncFavoriteChipHeight(maxHeight);
    window.updateFavoritesOverflowMarkers();
};

window.updateFavoriteChipLayout = function(chip) {
    if (!chip || !chip.isConnected) return 0;

    const width = chip.getBoundingClientRect().width;
    if (width <= 0) {
        return Math.ceil(chip.getBoundingClientRect().height);
    }
    let layout = 'title';

    if (width >= FAVORITE_FULL_LAYOUT_THRESHOLD) {
        layout = 'full';
    } else if (width >= FAVORITE_COMPACT_LAYOUT_THRESHOLD) {
        layout = 'compact';
    }

    chip.dataset.layout = layout;
    window.applyFavoriteChipContent(chip, layout, width);
    window.fitFavoriteChipText(chip, layout);

    return Math.ceil(chip.getBoundingClientRect().height);
};

window.getFavoriteChipObserver = function() {
    if (typeof ResizeObserver === 'undefined') {
        return null;
    }
    if (!favoritesChipResizeObserver) {
        let resizeDebounceTimer = null;
        favoritesChipResizeObserver = new ResizeObserver(() => {
            clearTimeout(resizeDebounceTimer);
            resizeDebounceTimer = setTimeout(() => {
                window.requestFavoritesLayoutFrame();
            }, 16);
        });
    }
    return favoritesChipResizeObserver;
};

window.applyFavoriteChipMetrics = function() {
    const viewportWidth = window.visualViewport?.width || window.innerWidth || 0;
    const viewportHeight = window.visualViewport?.height || window.innerHeight || 0;

    if (!window.applyFavoriteChipMetrics.cachedTokens ||
        window.applyFavoriteChipMetrics.lastWidth !== viewportWidth ||
        window.applyFavoriteChipMetrics.lastHeight !== viewportHeight) {
        
        let baseMinWidth = FAVORITE_CHIP_MIN_WIDTH;
        let compactMinWidth = FAVORITE_COMPACT_LAYOUT_THRESHOLD;
        let chipMaxWidth = FAVORITE_CHIP_MAX_WIDTH;
        let idealWidth = FAVORITE_CHIP_IDEAL_WIDTH;

        if (viewportWidth < 380) {
            baseMinWidth = FAVORITE_CHIP_MIN_WIDTH_NARROW;
            compactMinWidth = 120;
            chipMaxWidth = 180;
            idealWidth = 130;
        }

        window.applyFavoriteChipMetrics.cachedTokens = { baseMinWidth, compactMinWidth, chipMaxWidth, idealWidth };
        window.applyFavoriteChipMetrics.lastWidth = viewportWidth;
        window.applyFavoriteChipMetrics.lastHeight = viewportHeight;
    }

    const { baseMinWidth, compactMinWidth, chipMaxWidth, idealWidth } = window.applyFavoriteChipMetrics.cachedTokens;
    const root = document.documentElement;
    root.style.setProperty('--favorite-chip-min-width', `${baseMinWidth}px`);
    root.style.setProperty('--favorite-chip-compact-min-width', `${compactMinWidth}px`);
    root.style.setProperty('--favorite-chip-max-width', `${chipMaxWidth}px`);
    root.style.setProperty('--favorite-chip-ideal-width', `${idealWidth}px`);
};

window.applyFavoriteChipContent = function(chip, layout, chipWidth) {
    const previewEl = chip.querySelector('.favorite-chip-preview');
    if (!previewEl) return;

    if (layout === 'title') {
        previewEl.hidden = true;
        previewEl.style.display = 'none';
        return;
    }

    previewEl.hidden = false;
    previewEl.style.display = '';

    const previewFull = chip.dataset.previewFull || '';
    const charWidthEst = 6.4;
    const paddingEst = layout === 'full' ? 56 : 48;
    const availableWidth = chipWidth - paddingEst;
    const maxChars = Math.max(10, Math.floor(availableWidth / charWidthEst));

    previewEl.textContent = window.trimPreviewForLayout(previewFull, maxChars);
};

window.trimPreviewForLayout = function(text, maxChars) {
    if (!text) return '';
    const cleanText = text.replace(/\s+/g, ' ');
    if (cleanText.length <= maxChars) return cleanText;
    return cleanText.slice(0, Math.max(5, maxChars - 3)) + '...';
};

window.fitFavoriteChipText = function(chip, layout) {
    const titleEl = chip.querySelector('.favorite-chip-title');
    const previewEl = chip.querySelector('.favorite-chip-preview');

    if (titleEl) {
        window.fitFavoriteTextBlock(titleEl, 1.25, FAVORITE_TITLE_MIN_SCALE, '--favorite-title-scale');
    }

    if (previewEl && layout !== 'title') {
        window.fitFavoriteTextBlock(previewEl, 1.0, FAVORITE_PREVIEW_MIN_SCALE, '--favorite-preview-scale');
    }
};

window.fitFavoriteTextBlock = function(element, baseLineHeight, minScale, scaleVarName) {
    element.style.removeProperty(scaleVarName);
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    if (scrollHeight > clientHeight + 0.5 && clientHeight > 0) {
        const scale = Math.max(minScale, clientHeight / scrollHeight);
        element.style.setProperty(scaleVarName, String(scale));
    }
};

window.syncFavoriteChipHeight = function(maxHeight) {
    if (!window.favoritesDockEl) return;

    const currentHeight = window.favoritesDockEl.style.getPropertyValue('--favorite-chip-height');
    const targetValue = maxHeight > 0 ? `${maxHeight}px` : '';

    if (currentHeight !== targetValue) {
        if (maxHeight > 0) {
            window.favoritesDockEl.style.setProperty('--favorite-chip-height', targetValue);
        } else {
            window.favoritesDockEl.style.removeProperty('--favorite-chip-height');
        }
        window.queueUpdateFavoritesFootprint();
    }
};

window.renderFavoritesDock = function() {
    if (!window.favoritesDockEl || !window.favoritesListEl) return;

    if (favoritesChipResizeObserver) {
        favoritesChipResizeObserver.disconnect();
    }

    window.favoritesListEl.innerHTML = '';

    const favoritesWithNodes = window.favoritePrompts
        .map((favoriteId) => {
            const node = window.findNodeById(window.jsonData, favoriteId);
            return node && (node.type === 'prompt' || node.type === 'folder') ? { id: favoriteId, node } : null;
        })
        .filter(Boolean);

    if (favoritesWithNodes.length !== window.favoritePrompts.length) {
        window.favoritePrompts = favoritesWithNodes.map(({ id }) => id);
        window.saveFavorites();
    }

    if (favoritesWithNodes.length === 0) {
        window.resetFavoriteLayoutCache({ clearStyles: true });
        window.favoritesDockEl.classList.add('hidden');
        window.favoritesDockEl.setAttribute('aria-hidden', 'true');
        window.favoritesDockEl.removeAttribute('data-count');
        document.body.classList.remove('favorites-dock-visible');
        window.favoritesDockEl.classList.remove('overflowing', 'scroll-left', 'scroll-right');
        window.favoritesDockEl.style.removeProperty('--favorite-chip-height');
        if (window.favoritesScrollAreaEl) {
            window.favoritesScrollAreaEl.classList.remove('show-scrollbar');
        }
        document.body.style.removeProperty('--favorites-footprint');
        window.setFavoritesExpanded(false);
        if (window.favoritesToggleBtn) {
            window.favoritesToggleBtn.hidden = true;
            window.favoritesToggleBtn.setAttribute('aria-hidden', 'true');
            window.favoritesToggleBtn.setAttribute('aria-expanded', 'false');
        }
        if (window.clearFavoritesBtn) {
            window.clearFavoritesBtn.style.display = 'none';
        }
        return;
    }

    window.favoritesDockEl.classList.remove('hidden');
    window.favoritesDockEl.setAttribute('aria-hidden', 'false');
    window.favoritesDockEl.setAttribute('data-count', String(favoritesWithNodes.length));
    document.body.classList.add('favorites-dock-visible');

    if (window.clearFavoritesBtn) {
        window.clearFavoritesBtn.style.display = 'inline-flex';
    }

    const fragment = document.createDocumentFragment();

    favoritesWithNodes.forEach(({ id, node }, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'favorites-list-item';
        listItem.setAttribute('role', 'listitem');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'favorite-chip';
        button.dataset.id = id;
        button.dataset.type = 'favorite';
        button.setAttribute('aria-label', node.type === 'folder' ? `Öffne: ${node.title}` : `Kopiere: ${node.title}`);
        button.dataset.titleFull = node.title || '';

        const accent = FAVORITE_ACCENTS[index % FAVORITE_ACCENTS.length];
        if (accent) {
            button.style.setProperty('--favorite-border', accent.border);
            button.style.setProperty('--favorite-soft', accent.soft);
            button.style.setProperty('--favorite-glow', accent.glow);
            button.style.setProperty('--favorite-accent', accent.accent);
            button.style.setProperty('--favorite-badge-text', accent.text);
        }

        button.style.setProperty('--favorite-seq', String(index));

        const badge = document.createElement('span');
        badge.className = 'favorite-chip-badge';
        badge.textContent = (node.title || '').trim().charAt(0)?.toUpperCase() || '★';

        const textWrap = document.createElement('span');
        textWrap.className = 'favorite-chip-text';

        const titleEl = document.createElement('span');
        titleEl.className = 'favorite-chip-title';
        titleEl.textContent = node.title || '';

        const previewText = node.type === 'prompt' ? window.getFavoritePreviewText(node.content) : '';
        button.dataset.previewFull = previewText || '';
        button.dataset.previewLines = '0';
        button.dataset.layout = 'title';
        if (previewText) {
            const previewEl = document.createElement('span');
            previewEl.className = 'favorite-chip-preview';
            previewEl.textContent = previewText;
            textWrap.append(titleEl, previewEl);
        } else {
            const previewEl = document.createElement('span');
            previewEl.className = 'favorite-chip-preview';
            previewEl.hidden = true;
            button.dataset.previewFull = '';
            textWrap.append(titleEl, previewEl);
        }

        button.append(badge, textWrap);

        // Click-Listener wird über Event-Delegation in DOMContentLoaded abgefangen!
        
        if (window.addSparklesToFavoriteChip) {
            window.addSparklesToFavoriteChip(button);
        }

        const chipObserver = window.getFavoriteChipObserver();
        if (chipObserver) {
            chipObserver.observe(button);
        }
        listItem.appendChild(button);
        fragment.appendChild(listItem);
    });

    window.favoritesListEl.appendChild(fragment);

    window.updateDockPositioning();
    window.requestFavoritesLayoutFrame();
};
