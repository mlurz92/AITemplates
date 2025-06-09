document.addEventListener('DOMContentLoaded', initApp);

// Globale Variablen
let xmlData = null;
let currentNode = null;
let pathStack = [];
const currentXmlFile = "Templates.xml";

let modalEl, breadcrumbEl, containerEl, promptFullTextEl, notificationAreaEl;
let topBarEl, topbarBackBtn, fixedBackBtn, themeToggleButton;
let mobileNavEl, mobileHomeBtn, mobileBackBtn;
let swipeIndicatorEl;
let searchInputElement; // Für die Suchleiste

let svgTemplateFolder, svgTemplateExpand, svgTemplateCopy, svgTemplateCheckmark;
let svgTemplateIcon1, svgTemplateIcon2; // Für dynamische Icons

let cardObserver;

let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
const swipeThreshold = 50;
const swipeFeedbackThreshold = 5;

const MAX_ROTATION = 6;
let currentTransitionDurationMediumMs = 300;
let currentSearchQuery = ''; // Speichert den aktuellen Suchbegriff
let searchActive = false; // Zeigt an, ob die Suche aktiv ist
let activePromptCard = null; // Globale Variable für "Tap-to-Reveal"

// --- Hilfsfunktionen & allgemeine Utilities (Definiert am Anfang) ---

// Prüft, ob es sich um ein mobiles Gerät handelt
function isMobile() {
    let isMobileDevice = false;
    try {
        isMobileDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window || /Mobi|Android/i.test(navigator.userAgent);
    } catch (e) { /* Ignore */ }
    return isMobileDevice;
}

// Zeigt den Swipe-Indikator an
function showSwipeIndicator() {
    if (swipeIndicatorEl && isMobile()) {
        swipeIndicatorEl.classList.add('visible');
        swipeIndicatorEl.classList.remove('hidden');
    }
}

// Verbirgt den Swipe-Indikator
function hideSwipeIndicator() {
    if (swipeIndicatorEl) {
        swipeIndicatorEl.classList.remove('visible');
        swipeIndicatorEl.classList.add('hidden');
    }
}

// Hilfsfunktion für View Transitions API
function performViewTransition(updateDomFunction, direction) {
    if (!document.startViewTransition) {
        updateDomFunction();
        return;
    }
    document.documentElement.dataset.pageTransitionDirection = direction;
    const transition = document.startViewTransition(updateDomFunction);
    transition.finished.finally(() => {
        delete document.documentElement.dataset.pageTransitionDirection;
    });
}

// Findet einen XML-Knoten nach seiner GUID
function findNodeByGuid(startNode, targetGuid) {
    if (!startNode || !targetGuid) return null;
    if (startNode.nodeType !== 1) return null; // Sicherstellen, dass es ein Elementknoten ist
    if (startNode.getAttribute('guid') === targetGuid) return startNode;

    const children = startNode.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.tagName === 'TreeViewNode') { // Nur TreeViewNode-Elemente prüfen
            const found = findNodeByGuid(child, targetGuid);
            if (found) return found;
        }
    }
    return null;
}

// Aktualisiert dynamische CSS-Transitionsdauern
function updateDynamicDurations() {
    try {
        const rootStyle = getComputedStyle(document.documentElement);
        const mediumDuration = rootStyle.getPropertyValue('--transition-duration-medium').trim();
        if (mediumDuration.endsWith('ms')) {
            currentTransitionDurationMediumMs = parseFloat(mediumDuration);
        } else if (mediumDuration.endsWith('s')) {
            currentTransitionDurationMediumMs = parseFloat(mediumDuration) * 1000;
        }
    } catch (error) {
        console.warn("Could not read --transition-duration-medium from CSS, using default.", error);
        currentTransitionDurationMediumMs = 300;
    }
}

// Theme-Management
function applyTheme(themeName) {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(themeName + '-mode');
    if (themeToggleButton) {
        themeToggleButton.setAttribute('aria-label', themeName === 'dark' ? 'Light Theme aktivieren' : 'Dark Theme aktivieren');
    }
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
        try {
            const rootStyle = getComputedStyle(document.documentElement);
            const newThemeColor = rootStyle.getPropertyValue('--bg-base').trim();
            metaThemeColor.setAttribute("content", newThemeColor);
        } catch(e) {
            metaThemeColor.setAttribute("content", themeName === 'dark' ? "#08080a" : "#f8f9fa");
        }
    }
}

function toggleTheme() {
    const currentThemeIsLight = document.body.classList.contains('light-mode');
    const newTheme = currentThemeIsLight ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('preferredTheme', newTheme);
}

// Kopier-Funktionen
function copyToClipboard(text, buttonElement = null) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showNotification('Prompt kopiert!', 'success', buttonElement))
            .catch(err => { console.error('Clipboard error:', err); showNotification('Fehler beim Kopieren', 'error', buttonElement); });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; textArea.style.top = '-9999px'; textArea.style.left = '-9999px'; textArea.style.opacity = '0';
        document.body.appendChild(textArea); textArea.focus(); textArea.select();
        try { document.execCommand('copy'); showNotification('Prompt kopiert!', 'success', buttonElement); }
        catch (err) { console.error('Fallback copy error:', err); showNotification('Fehler beim Kopieren', 'error', buttonElement); }
        document.body.removeChild(textArea);
    }
}

function copyPromptText(buttonElement = null) { copyToClipboard(promptFullTextEl.textContent, buttonElement || document.getElementById('copy-prompt-modal-button')); }
function copyPromptTextForCard(node, buttonElement) { copyToClipboard(node.getAttribute('beschreibung') || '', buttonElement); }

// Benachrichtigungen
let notificationTimeoutId = null;
function showNotification(message, type = 'info', buttonElement = null) {
    if (notificationTimeoutId) {
        const existingNotification = notificationAreaEl.querySelector('.notification');
        if(existingNotification) existingNotification.remove();
        clearTimeout(notificationTimeoutId);
    }

    const notificationEl = document.createElement('div');
    notificationEl.classList.add('notification');
    if (type) {
      notificationEl.classList.add(type);
    }

    if (type === 'success' && svgTemplateCheckmark) {
        const icon = svgTemplateCheckmark.cloneNode(true);
        icon.classList.add('icon');
        notificationEl.appendChild(icon);
    } else if (type === 'error') {
        // Optional: Error-Icon hier hinzufügen
    }

    const textNode = document.createElement('span');
    textNode.textContent = message;
    notificationEl.appendChild(textNode);

    notificationAreaEl.appendChild(notificationEl);

    void notificationEl.offsetWidth;

    notificationTimeoutId = setTimeout(() => {
        notificationEl.classList.add('fade-out');
        notificationEl.addEventListener('animationend', () => {
            if (notificationEl.parentNode === notificationAreaEl) {
                notificationEl.remove();
            }
        }, { once: true });
        notificationTimeoutId = null;
    }, 2800);
}

// --- Kernfunktionen: Rendering, Navigation, Suche, History (abh. von Utilities) ---

// Aktualisiert den Breadcrumb-Pfad
function updateBreadcrumb() {
    breadcrumbEl.innerHTML = '';
    if (!xmlData || !xmlData.documentElement) return;

    const homeLink = document.createElement('span');
    homeLink.textContent = 'Home';

    const clearAllActiveBreadcrumbs = () => {
        const allActive = breadcrumbEl.querySelectorAll('.current-level-active');
        allActive.forEach(el => {
            el.classList.remove('current-level-active');
            if (el === homeLink && !homeLink.classList.contains('breadcrumb-link')) {
                 homeLink.classList.add('breadcrumb-link');
            }
        });
    };

    clearAllActiveBreadcrumbs();

    if (pathStack.length === 0 && currentNode === xmlData.documentElement && !currentSearchQuery) {
        homeLink.classList.add('current-level-active');
        homeLink.classList.remove('breadcrumb-link');
    } else {
        homeLink.classList.add('breadcrumb-link');
        homeLink.addEventListener('click', () => {
            if (modalEl.classList.contains('visible')) closeModal({ fromBackdrop: false });
            performViewTransition(() => {
                currentNode = xmlData.documentElement; pathStack = [];
                currentSearchQuery = ''; searchActive = false; if (searchInputElement) searchInputElement.value = '';
                renderView(currentNode); updateBreadcrumb();
            }, 'backward');
            if (isMobile()) window.history.pushState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
        });
    }
    breadcrumbEl.appendChild(homeLink);

    pathStack.forEach((nodeInPath, index) => {
        const nodeValue = nodeInPath.getAttribute('value');
        if (nodeValue) {
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            breadcrumbEl.appendChild(separator);

            const link = document.createElement('span');
            link.textContent = nodeValue;

            if (nodeInPath === currentNode && !currentSearchQuery) {
                clearAllActiveBreadcrumbs();
                link.classList.add('current-level-active');
            } else {
                link.classList.add('breadcrumb-link');
                link.addEventListener('click', () => {
                    if (modalEl.classList.contains('visible')) closeModal({ fromBackdrop: false });
                    performViewTransition(() => {
                        pathStack = pathStack.slice(0, index + 1);
                        currentNode = nodeInPath;
                        currentSearchQuery = ''; searchActive = false; if (searchInputElement) searchInputElement.value = '';
                        renderView(currentNode); updateBreadcrumb();
                    }, 'backward');
                    if (isMobile()) window.history.pushState({ path: pathStack.map(n => n.getAttribute('guid')), modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
                });
            }
            breadcrumbEl.appendChild(link);
        }
    });

    if (currentSearchQuery) {
        const separator = document.createElement('span');
        separator.textContent = ' > ';
        breadcrumbEl.appendChild(separator);
        const searchSpan = document.createElement('span');
        searchSpan.textContent = `Suche: "${currentSearchQuery}"`;
        searchSpan.classList.add('current-level-active');
        breadcrumbEl.appendChild(searchSpan);
    }

    const isModalVisible = modalEl.classList.contains('visible');
    const isTrulyAtHome = pathStack.length === 0 && currentNode === xmlData.documentElement && !currentSearchQuery;
    fixedBackBtn.classList.toggle('hidden', isTrulyAtHome && !isModalVisible);
    if(mobileBackBtn) mobileBackBtn.classList.toggle('hidden', isTrulyAtHome && !isModalVisible);
    topbarBackBtn.style.visibility = (isTrulyAtHome && !isModalVisible) ? 'hidden' : 'visible';

    if (isMobile()) {
        if (!isTrulyAtHome && !isModalVisible && !currentSearchQuery) {
            showSwipeIndicator();
        } else {
            hideSwipeIndicator();
        }
    }
}

// Rekursive Suchfunktion
function searchNodesRecursive(node, query, results) {
    const nodeValue = (node.getAttribute('value') || '').toLowerCase();
    const nodeBeschreibung = (node.getAttribute('beschreibung') || '').toLowerCase();
    const isFolder = Array.from(node.children).some(child => child.tagName === 'TreeViewNode');

    if (nodeValue.includes(query) || nodeBeschreibung.includes(query)) {
        results.push(node);
        if (isFolder && nodeValue.includes(query)) {
            Array.from(node.children).filter(child => child.tagName === 'TreeViewNode').forEach(child => {
                searchNodesRecursive(child, '', results);
            });
        }
    } else if (isFolder) {
        Array.from(node.children).filter(child => child.tagName === 'TreeViewNode').forEach(child => {
            searchNodesRecursive(child, query, results);
        });
    }
}

// Rendert die gefilterten Knoten (Suchergebnisse)
function renderViewFiltered(nodesToRender) {
    containerEl.innerHTML = '';
    const cardsToObserve = [];

    if (nodesToRender.length === 0) {
        containerEl.innerHTML = `<p style="text-align:center; padding:2rem; opacity:0.7;">Keine Ergebnisse für die Suche "${currentSearchQuery}".</p>`;
        gsap.to(containerEl.firstChild, {opacity: 1, duration: 0.5});
        hideSwipeIndicator();
        return;
    }

    const uniqueNodes = [];
    const guidsSeen = new Set();
    nodesToRender.forEach(node => {
        const guid = node.getAttribute('guid');
        if (guid && !guidsSeen.has(guid)) {
            uniqueNodes.push(node);
            guidsSeen.add(guid);
        }
    });

    uniqueNodes.forEach(node => {
        const card = document.createElement('div');
        card.classList.add('card');
        const isFolder = Array.from(node.children).some(child => child.tagName === 'TreeViewNode');
        let nodeGuid = node.getAttribute('guid');
        if (!nodeGuid) {
            nodeGuid = `genid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            node.setAttribute('guid', nodeGuid);
        }
        card.setAttribute('data-guid', nodeGuid);

        const titleElem = document.createElement('h3');
        titleElem.textContent = node.getAttribute('value') || 'Unbenannt';

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('card-content-wrapper');
        contentWrapper.appendChild(titleElem);

        const imageAttr = node.getAttribute('image');

        if (isFolder) {
            card.classList.add('folder-card'); card.setAttribute('data-type', 'folder');
            let iconToUse = svgTemplateFolder;
            if (imageAttr === '2' && svgTemplateIcon2) {
                iconToUse = svgTemplateIcon2;
            }
            if (iconToUse) {
                const folderIconSvg = iconToUse.cloneNode(true);
                const folderIconId = `icon-folder-${nodeGuid}`;
                folderIconSvg.id = folderIconId;
                folderIconSvg.classList.add('dynamic-card-icon');
                contentWrapper.appendChild(folderIconSvg);
                if (iconToUse === svgTemplateFolder) {
                    setupVivusAnimation(card, folderIconId);
                }
            }
        } else {
            card.setAttribute('data-type', 'prompt');
            card.classList.add('prompt-card');
            if (imageAttr === '1' && svgTemplateIcon1) {
                const promptIconSvg = svgTemplateIcon1.cloneNode(true);
                promptIconSvg.classList.add('dynamic-card-icon');
                contentWrapper.insertBefore(promptIconSvg, titleElem);
                promptIconSvg.style.marginBottom = '0.8rem';
            }

            const btnContainer = document.createElement('div'); btnContainer.classList.add('card-buttons');
            if (svgTemplateExpand) {
                const expandBtn = document.createElement('button'); expandBtn.classList.add('button'); expandBtn.setAttribute('aria-label', 'Details anzeigen'); expandBtn.setAttribute('data-action', 'expand'); expandBtn.appendChild(svgTemplateExpand.cloneNode(true)); btnContainer.appendChild(expandBtn);
            }
            if (svgTemplateCopy) {
                const copyBtn = document.createElement('button'); copyBtn.classList.add('button'); copyBtn.setAttribute('aria-label', 'Prompt kopieren'); copyBtn.setAttribute('data-action', 'copy'); copyBtn.appendChild(svgTemplateCopy.cloneNode(true)); btnContainer.appendChild(copyBtn);
            }
            contentWrapper.appendChild(btnContainer);
        }
        card.appendChild(contentWrapper);
        containerEl.appendChild(card);
        cardsToObserve.push(card);
        addCard3DHoverEffect(card);
    });

    cardsToObserve.forEach(c => cardObserver.observe(c));
    adjustCardHeights();
    hideSwipeIndicator(); // Bei Suchergebnissen immer Indikator ausblenden
}

// Haupt-Rendering-Funktion
function renderView(xmlNode) {
    const currentScroll = containerEl.scrollTop;
    containerEl.innerHTML = '';
    if (!xmlNode) {
         containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Interner Fehler: Ungültiger Knoten.</p>`;
         gsap.to(containerEl, {opacity: 1, duration: 0.3});
         return;
     }

    let nodesToRender;
    if (searchActive && currentSearchQuery) {
        // Bei aktiver Suche rufe die Suchlogik auf und rendere gefilterte Ansicht
        // Da renderViewFiltered direkt den Container leert und neu füllt,
        // können wir es direkt aufrufen und hier beenden.
        filterAndRenderNodes(xmlData.documentElement, currentSearchQuery);
        return;
    } else {
        // Ansonsten normale Ordneransicht
        nodesToRender = Array.from(xmlNode.children).filter(node => node.tagName === 'TreeViewNode');
    }

    // vivusSetups ist nicht mehr direkt in diesem Block nötig, da setupVivusAnimation direkt aufgerufen wird
    const cardsToObserve = [];

    if (nodesToRender.length === 0) {
        containerEl.innerHTML = `<p style="text-align:center; padding:2rem; opacity:0.7;">Dieser Ordner ist leer.</p>`;
        gsap.to(containerEl.firstChild, {opacity: 1, duration: 0.5});
        hideSwipeIndicator();
        return;
    }

    nodesToRender.forEach(node => {
        const card = document.createElement('div');
        card.classList.add('card');
        const isFolder = Array.from(node.children).some(child => child.tagName === 'TreeViewNode');
        let nodeGuid = node.getAttribute('guid');
        if (!nodeGuid) {
            nodeGuid = `genid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            node.setAttribute('guid', nodeGuid);
        }
        card.setAttribute('data-guid', nodeGuid);

        const titleElem = document.createElement('h3');
        titleElem.textContent = node.getAttribute('value') || 'Unbenannt';

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('card-content-wrapper');
        contentWrapper.appendChild(titleElem);

        const imageAttr = node.getAttribute('image');

        if (isFolder) {
            card.classList.add('folder-card'); card.setAttribute('data-type', 'folder');
            let iconToUse = svgTemplateFolder;
            if (imageAttr === '2' && svgTemplateIcon2) {
                iconToUse = svgTemplateIcon2;
            }
            if (iconToUse) {
                const folderIconSvg = iconToUse.cloneNode(true);
                const folderIconId = `icon-folder-${nodeGuid}`;
                folderIconSvg.id = folderIconId;
                folderIconSvg.classList.add('dynamic-card-icon');
                contentWrapper.appendChild(folderIconSvg);
                if (iconToUse === svgTemplateFolder) {
                    setupVivusAnimation(card, folderIconId); // Direkter Aufruf hier
                }
            }
        } else {
            card.setAttribute('data-type', 'prompt');
            card.classList.add('prompt-card');
            if (imageAttr === '1' && svgTemplateIcon1) {
                const promptIconSvg = svgTemplateIcon1.cloneNode(true);
                promptIconSvg.classList.add('dynamic-card-icon');
                contentWrapper.insertBefore(promptIconSvg, titleElem);
                promptIconSvg.style.marginBottom = '0.8rem';
            }

            const btnContainer = document.createElement('div'); btnContainer.classList.add('card-buttons');
            if (svgTemplateExpand) {
                const expandBtn = document.createElement('button'); expandBtn.classList.add('button'); expandBtn.setAttribute('aria-label', 'Details anzeigen'); expandBtn.setAttribute('data-action', 'expand'); expandBtn.appendChild(svgTemplateExpand.cloneNode(true)); btnContainer.appendChild(expandBtn);
            }
            if (svgTemplateCopy) {
                const copyBtn = document.createElement('button'); copyBtn.classList.add('button'); copyBtn.setAttribute('aria-label', 'Prompt kopieren'); copyBtn.setAttribute('data-action', 'copy'); copyBtn.appendChild(svgTemplateCopy.cloneNode(true)); btnContainer.appendChild(copyBtn);
            }
            contentWrapper.appendChild(btnContainer);
        }
        card.appendChild(contentWrapper);
        containerEl.appendChild(card);
        cardsToObserve.push(card);
        addCard3DHoverEffect(card);
    });

    cardsToObserve.forEach(c => cardObserver.observe(c));
    adjustCardHeights();

    if(nodesToRender.length > 0 && !searchActive) {
        containerEl.scrollTop = currentScroll;
        adjustCardHeights();
    } else if (searchActive) {
        adjustCardHeights();
    }

    if (isMobile() && !searchActive && (pathStack.length > 0 || currentNode !== xmlData.documentElement)) {
        showSwipeIndicator();
    } else {
        hideSwipeIndicator();
    }
}

// Passt die Höhe der Karten an
function adjustCardHeights() {
    const allCards = Array.from(containerEl.querySelectorAll('.card'));
    if (allCards.length === 0) return;

    let targetHeight = 120; // Neue Basis-Mindesthöhe für alle Karten

    if (window.innerWidth <= 768) { // Mobile-Ansicht (einspaltig)
        let maxContentHeight = 0;
        allCards.forEach(card => {
            card.style.height = 'auto';
            card.style.maxHeight = 'none';
            const contentHeight = card.querySelector('.card-content-wrapper').offsetHeight;
            maxContentHeight = Math.max(maxContentHeight, contentHeight);
        });
        targetHeight = Math.max(targetHeight, maxContentHeight + 40);
        
        allCards.forEach(card => {
            card.style.height = `${targetHeight}px`;
            card.style.maxHeight = `${targetHeight}px`;
        });
    } else { // Desktop-Ansicht (mehrspaltig)
        let maxCardHeight = 0;
        allCards.forEach(card => {
            card.style.height = 'auto';
            if (card.offsetHeight > maxCardHeight) {
                maxCardHeight = card.offsetHeight;
            }
        });
        targetHeight = Math.max(140, maxCardHeight);

        allCards.forEach(card => {
            card.style.height = `${targetHeight}px`;
            card.style.maxHeight = `${targetHeight}px`;
        });
    }
}

// Fügt 3D-Hover-Effekt zu Karten hinzu
function addCard3DHoverEffect(card) {
    let frameRequested = false;
    card.addEventListener('mousemove', (e) => {
        if (frameRequested || isMobile()) return;
        frameRequested = true;
        requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const deltaX = x - centerX;
            const deltaY = y - centerY;

            const rotateY = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, (deltaX / centerX) * MAX_ROTATION));
            const rotateX = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, -(deltaY / centerY) * MAX_ROTATION));

            card.style.setProperty('--rotateX', `${rotateX}deg`);
            card.style.setProperty('--rotateY', `${rotateY}deg`);
            frameRequested = false;
        });
    });

    card.addEventListener('mouseleave', () => {
        if(isMobile()) return;
        requestAnimationFrame(() => {
            card.style.setProperty('--rotateX', '0deg');
            card.style.setProperty('--rotateY', '0deg');
        });
    });
}

// Modal-Funktionen
function openModal(node, calledFromPopstate = false) {
    promptFullTextEl.textContent = node.getAttribute('beschreibung') || '';
    modalEl.classList.remove('hidden');
    requestAnimationFrame(() => {
         requestAnimationFrame(() => {
            modalEl.classList.add('visible');
         });
    });

    if (activePromptCard) {
        activePromptCard.classList.remove('buttons-visible');
        activePromptCard = null;
    }

    if (isMobile() && !calledFromPopstate) {
        const currentState = window.history.state || { path: [], modalOpen: false, searchActive: false, searchQuery: '' };
        if (!currentState.modalOpen) {
            const currentViewPathGuids = pathStack.map(n => n.getAttribute('guid'));
            const nodeGuid = node.getAttribute('guid');
            window.history.pushState({ path: currentViewPathGuids, modalOpen: true, promptGuid: nodeGuid, searchActive: searchActive, searchQuery: currentSearchQuery }, '', window.location.href);
        }
    }
    updateBreadcrumb();
}

function closeModal(optionsOrCalledFromPopstate = {}) {
    let calledFromPopstate = false;
    let fromBackdrop = false;

    if (typeof optionsOrCalledFromPopstate === 'boolean') {
        calledFromPopstate = optionsOrCalledFromPopstate;
    } else if (typeof optionsOrCalledFromPopstate === 'object' && optionsOrCalledFromPopstate !== null) {
        calledFromPopstate = !!optionsOrCalledFromPopstate.fromPopstate;
        fromBackdrop = !!optionsOrCalledFromPopstate.fromBackdrop;
    }

    if (!modalEl.classList.contains('visible')) return;

    modalEl.classList.remove('visible');
    setTimeout(() => {
        modalEl.classList.add('hidden');
    }, currentTransitionDurationMediumMs);

    if (fromBackdrop) {
        if (isMobile() && window.history.state?.modalOpen && !calledFromPopstate) {
            const LrpmtGuid = window.history.state.promptGuid;
            window.history.replaceState({
                path: window.history.state.path,
                modalOpen: false,
                promptGuid: LrpmtGuid,
                searchActive: searchActive,
                searchQuery: currentSearchQuery
            }, '', window.location.href);
        }
        updateBreadcrumb();
    } else if (isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
        window.history.back();
    } else {
        updateBreadcrumb();
    }
}
