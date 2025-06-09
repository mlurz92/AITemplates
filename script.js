document.addEventListener('DOMContentLoaded', initApp);

let xmlData = null;
let currentNode = null;
let pathStack = [];
const currentXmlFile = "Templates.xml";

let modalEl, breadcrumbEl, containerEl, promptFullTextEl, notificationAreaEl;
let topBarEl, topbarBackBtn, fixedBackBtn, themeToggleButton; // fullscreenBtn, fullscreenEnterIcon, fullscreenExitIcon entfernt
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

function initApp() {
    modalEl = document.getElementById('prompt-modal');
    breadcrumbEl = document.getElementById('breadcrumb');
    containerEl = document.getElementById('cards-container');
    promptFullTextEl = document.getElementById('prompt-fulltext');
    notificationAreaEl = document.getElementById('notification-area');
    topBarEl = document.getElementById('top-bar');
    topbarBackBtn = document.getElementById('topbar-back-button');
    fixedBackBtn = document.getElementById('fixed-back');
    themeToggleButton = document.getElementById('theme-toggle-button');
    swipeIndicatorEl = document.getElementById('swipe-indicator');
    searchInputElement = document.getElementById('search-input'); // Referenz zur Suchleiste

    mobileNavEl = document.getElementById('mobile-nav');

    svgTemplateFolder = document.getElementById('svg-template-folder');
    svgTemplateExpand = document.getElementById('svg-template-expand');
    svgTemplateCopy = document.getElementById('svg-template-copy');
    svgTemplateCheckmark = document.getElementById('svg-template-checkmark');
    svgTemplateIcon1 = document.getElementById('svg-template-icon-1');
    svgTemplateIcon2 = document.getElementById('svg-template-icon-2');

    updateDynamicDurations();
    setupTheme();
    setupIntersectionObserver();
    setupEventListeners();
    // checkFullscreenSupport() entfernt, da Fullscreen-Funktion entfernt wurde

    if (isMobile()) {
        setupMobileSpecificFeatures();
    }

    loadXmlDocument(currentXmlFile);
}

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

function setupTheme() {
    const preferredTheme = localStorage.getItem('preferredTheme') || 'dark';
    applyTheme(preferredTheme);
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
}

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

function setupEventListeners() {
    topbarBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal({ fromBackdrop: true });
        } else if (pathStack.length > 0) {
            navigateOneLevelUp();
        }
    });

    fixedBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        }
        if (pathStack.length > 0 || (currentNode && currentNode !== xmlData.documentElement) || currentSearchQuery) {
            performViewTransition(() => {
                currentNode = xmlData.documentElement;
                pathStack = [];
                currentSearchQuery = ''; // Suchbegriff löschen
                searchActive = false; // Suche deaktivieren
                if (searchInputElement) searchInputElement.value = ''; // Suchfeld leeren
                renderView(currentNode);
                updateBreadcrumb();
                hideSwipeIndicator(); // Indikator ausblenden, wenn nach Hause navigiert wird
            }, 'backward');
            if (isMobile()) {
                 window.history.pushState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
            }
        }
    });

    document.getElementById('modal-close-button').addEventListener('click', () => closeModal());
    const copyModalButton = document.getElementById('copy-prompt-modal-button');
    if (copyModalButton) {
      copyModalButton.addEventListener('click', () => copyPromptText(copyModalButton));
    }

    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
            e.stopPropagation();
            closeModal({ fromBackdrop: true });
        }
    });

    containerEl.addEventListener('click', handleCardContainerClick);
    document.body.addEventListener('click', handleGlobalClick);

    // Suchfunktionalität-Listener
    if (searchInputElement) {
        searchInputElement.addEventListener('input', handleSearchInput);
        searchInputElement.addEventListener('focus', () => {
             document.body.classList.add('search-active');
        });
        searchInputElement.addEventListener('blur', () => {
             if (!searchInputElement.value.trim()) {
                 document.body.classList.remove('search-active');
             }
        });
    }
}

let activePromptCard = null;

function handleCardContainerClick(e) {
    if (modalEl.classList.contains('visible') || e.target.closest('.modal-content')) {
        return;
    }

    const card = e.target.closest('.card');
    const button = e.target.closest('button[data-action]');

    if (activePromptCard && activePromptCard !== card) {
        activePromptCard.classList.remove('buttons-visible');
        activePromptCard = null;
    }

    if (card) {
        const guid = card.getAttribute('data-guid');
        const node = findNodeByGuid(xmlData.documentElement, guid);
        if (!node) return;
        const cardType = card.getAttribute('data-type');

        if (cardType === 'prompt') {
            if (button) {
                e.stopPropagation();
                const action = button.getAttribute('data-action');
                if (action === 'expand') openModal(node);
                else if (action === 'copy') copyPromptTextForCard(node, e.target.closest('button'));
                card.classList.remove('buttons-visible');
                activePromptCard = null;
            } else {
                if (card.classList.contains('buttons-visible')) {
                    card.classList.remove('buttons-visible');
                    activePromptCard = null;
                } else {
                    card.classList.add('buttons-visible');
                    activePromptCard = card;
                    e.stopPropagation();
                }
            }
        } else if (cardType === 'folder') {
            navigateToNode(node);
            if (activePromptCard) {
                activePromptCard.classList.remove('buttons-visible');
                activePromptCard = null;
            }
        }
    } else if (e.target === containerEl && pathStack.length > 0) {
         navigateOneLevelUp();
         if (activePromptCard) {
            activePromptCard.classList.remove('buttons-visible');
            activePromptCard = null;
        }
    }
}

function handleGlobalClick(e) {
    if (activePromptCard && !activePromptCard.contains(e.target) && !modalEl.contains(e.target) && (!searchInputElement || !searchInputElement.contains(e.target))) {
        activePromptCard.classList.remove('buttons-visible');
        activePromptCard = null;
    }
}

function setupMobileSpecificFeatures() {
    document.body.classList.add('mobile');
    if (mobileNavEl) mobileNavEl.classList.remove('hidden');
    mobileHomeBtn = document.getElementById('mobile-home');
    mobileBackBtn = document.getElementById('mobile-back');
    swipeIndicatorEl = document.getElementById('swipe-indicator');

    if (mobileHomeBtn) {
        mobileHomeBtn.addEventListener('click', () => {
            const modalWasVisible = modalEl.classList.contains('visible');
            if (modalWasVisible) {
                closeModal({ fromBackdrop: true });
            }

            const isCurrentlyAtHome = (currentNode === xmlData.documentElement && pathStack.length === 0 && !currentSearchQuery);

            if (!isCurrentlyAtHome || modalWasVisible) {
                performViewTransition(() => {
                    currentNode = xmlData.documentElement;
                    pathStack = [];
                    currentSearchQuery = '';
                    searchActive = false;
                    if (searchInputElement) searchInputElement.value = '';
                    renderView(currentNode);
                    updateBreadcrumb();
                    hideSwipeIndicator();
                }, 'backward');

                window.history.pushState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
            }
        });
    }

    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', () => {
            if (modalEl.classList.contains('visible')) {
                closeModal({ fromBackdrop: true });
            } else if (pathStack.length > 0 || currentSearchQuery) {
                if (currentSearchQuery) {
                    currentSearchQuery = '';
                    searchActive = false;
                    if (searchInputElement) searchInputElement.value = '';
                    performViewTransition(() => {
                        renderView(currentNode);
                        updateBreadcrumb();
                    }, 'backward');
                    window.history.pushState({ path: pathStack.map(n => n.getAttribute('guid')), modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
                } else {
                    navigateOneLevelUp();
                }
            }
        });
    }

    containerEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    containerEl.addEventListener('touchend', handleTouchEnd, { passive: true });
    if (swipeIndicatorEl) {
        swipeIndicatorEl.addEventListener('click', () => {
            if (pathStack.length > 0) {
                navigateOneLevelUp();
            } else if (currentSearchQuery) {
                currentSearchQuery = '';
                searchActive = false;
                if (searchInputElement) searchInputElement.value = '';
                performViewTransition(() => {
                    renderView(currentNode);
                    updateBreadcrumb();
                }, 'backward');
                window.history.pushState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
            }
        });
    }

    window.history.replaceState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
    window.onpopstate = handlePopState;
}

function navigateOneLevelUp() {
    if (pathStack.length === 0) {
        return;
    }

    performViewTransition(() => {
        const parentNode = pathStack.pop();
        currentNode = parentNode;
        renderView(currentNode);
        updateBreadcrumb();
        if (activePromptCard) {
            activePromptCard.classList.remove('buttons-visible');
            activePromptCard = null;
        }
    }, 'backward');
}

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchEndX = touchStartX;
    touchEndY = touchStartY;
}

function handleTouchMove(e) {
    if (!touchStartX || modalEl.classList.contains('visible') || searchActive) return;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && diffX > swipeFeedbackThreshold) {
        containerEl.classList.add('swiping-right');
        let moveX = Math.min(diffX - swipeFeedbackThreshold, window.innerWidth * 0.1);
        containerEl.style.transform = `translateX(${moveX}px)`;
        showSwipeIndicator();
    } else {
        containerEl.classList.remove('swiping-right');
        containerEl.style.transform = '';
        hideSwipeIndicator();
    }
}

function handleTouchEnd() {
    if (!touchStartX || modalEl.classList.contains('visible') || searchActive) return;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    containerEl.classList.remove('swiping-right');
    containerEl.style.transform = '';
    hideSwipeIndicator();

    if (Math.abs(diffX) > Math.abs(diffY) && diffX > swipeThreshold) {
        if (pathStack.length > 0) {
             navigateHistory('backward');
        }
    }
    touchStartX = 0; touchStartY = 0; touchEndX = 0; touchEndY = 0;
}

function navigateHistory(direction) {
    if (isMobile() && (pathStack.length > 0 || (window.history.state && window.history.state.modalOpen) || currentSearchQuery)) {
        window.history.back();
    } else if (!isMobile() && pathStack.length > 0) {
        performViewTransition(() => {
            if (pathStack.length > 0) {
                const parentNode = pathStack.pop();
                currentNode = parentNode;
                renderView(currentNode);
                updateBreadcrumb();
            }
        }, direction);
    }
}

function handlePopState(event) {
    const state = event.state || { path: [], modalOpen: false, searchActive: false, searchQuery: '' };
    const currentlyModalOpen = modalEl.classList.contains('visible');
    const direction = state.path.length < pathStack.length || (state.searchActive && !currentSearchQuery) ? 'backward' : 'forward';

    if (currentlyModalOpen && !state.modalOpen) {
        closeModal({ fromPopstate: true });
    } else if (!currentlyModalOpen && state.modalOpen) {
        const promptGuidForModal = state.promptGuid;
        const nodeToOpen = promptGuidForModal ? findNodeByGuid(xmlData.documentElement, promptGuidForModal) : null;

        if (nodeToOpen && nodeToOpen.getAttribute('beschreibung')) {
            pathStack = state.path.map(guid => findNodeByGuid(xmlData.documentElement, guid)).filter(Boolean);
            if (state.path.length > 0 && pathStack.length > 0 && pathStack[pathStack.length-1].getAttribute('guid') === promptGuidForModal) {
                 pathStack.pop();
            }
            currentNode = pathStack.length > 0 ? pathStack[pathStack.length-1] : xmlData.documentElement;
            if (searchInputElement && state.searchQuery) {
                searchInputElement.value = state.searchQuery;
                document.body.classList.add('search-active');
            } else if (searchInputElement) {
                searchInputElement.value = '';
                document.body.classList.remove('search-active');
            }
            openModal(nodeToOpen, true);
        } else {
             handleNavigationFromState(state, direction);
        }
    } else {
        handleNavigationFromState(state, direction);
    }

    if (searchInputElement) {
        searchInputElement.value = state.searchQuery || '';
        if (state.searchActive) {
            document.body.classList.add('search-active');
            searchActive = true;
            handleSearchInput({ target: searchInputElement });
        } else {
            document.body.classList.remove('search-active');
            searchActive = false;
            currentSearchQuery = '';
        }
    }
}

function handleNavigationFromState(state, direction) {
    const targetPathLength = state.path.length;
    const updateDOM = () => {
        pathStack = state.path.map(guid => findNodeByGuid(xmlData.documentElement, guid)).filter(Boolean);
        if(pathStack.length !== targetPathLength && state.path.length > 0) {
             pathStack = [];
        } else if (targetPathLength === 0) {
            pathStack = [];
        }
        currentNode = targetPathLength === 0 ? xmlData.documentElement : pathStack[pathStack.length - 1];
        if (!currentNode && xmlData) currentNode = xmlData.documentElement;

        if (activePromptCard) {
            activePromptCard.classList.remove('buttons-visible');
            activePromptCard = null;
        }

        if (searchInputElement && state.searchQuery) {
            searchInputElement.value = state.searchQuery;
            document.body.classList.add('search-active');
            currentSearchQuery = state.searchQuery;
            searchActive = true;
            filterAndRenderNodes(xmlData.documentElement, currentSearchQuery);
        } else {
            searchInputElement.value = '';
            document.body.classList.remove('search-active');
            currentSearchQuery = '';
            searchActive = false;
            renderView(currentNode);
        }
        updateBreadcrumb();
    };
    performViewTransition(updateDOM, direction);
}

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

function setupIntersectionObserver() {
    const options = { rootMargin: "0px", threshold: 0.05 };
    cardObserver = new IntersectionObserver((entries, observer) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
            const targets = visibleEntries.map(entry => entry.target);
            gsap.to(targets, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                ease: "expo.out",
                stagger: {
                    each: 0.06,
                    from: "start"
                },
                onComplete: function() {
                    this.targets().forEach(target => {
                        observer.unobserve(target);
                        target.classList.add('is-visible');
                    });
                }
            });
        }
    }, options);
}

function findNodeByGuid(startNode, targetGuid) {
    if (!startNode || !targetGuid) return null;
    if (startNode.nodeType !== 1) return null;
    if (startNode.getAttribute('guid') === targetGuid) return startNode;

    const children = startNode.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.tagName === 'TreeViewNode') {
            const found = findNodeByGuid(child, targetGuid);
            if (found) return found;
        }
    }
    return null;
}

function isMobile() {
    let isMobileDevice = false;
    try {
        isMobileDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window || /Mobi|Android/i.test(navigator.userAgent);
    } catch (e) { /* Ignore */ }
    return isMobileDevice;
}

function setupVivusAnimation(parentElement, svgId) {
    const svgElement = document.getElementById(svgId);
    if (!svgElement || (!parentElement.classList.contains('folder-card') && !parentElement.classList.contains('prompt-card'))) return;

    if (parentElement.classList.contains('folder-card') && svgElement.id === `icon-folder-${parentElement.getAttribute('data-guid')}`) { // Only apply Vivus to the original folder icon, not dynamic ones
        const vivusInstance = new Vivus(svgId, { type: 'delayed', duration: 100, start: 'manual' });
        vivusInstance.finish();
        svgElement.style.opacity = '1';

        let timeoutId = null;
        let isTouchStarted = false;

        const playAnimation = (immediate = false) => {
            clearTimeout(timeoutId);
            svgElement.style.opacity = immediate ? '1' : '0';
            const startVivus = () => {
                if (!immediate) svgElement.style.opacity = '1';
                vivusInstance.reset().play();
            };
            if (immediate) startVivus();
            else timeoutId = setTimeout(startVivus, 60);
        };

        const finishAnimation = () => {
            clearTimeout(timeoutId);
            vivusInstance.finish();
            svgElement.style.opacity = '1';
        };

        parentElement.addEventListener('mouseenter', () => { if (!isTouchStarted) playAnimation(false); });
        parentElement.addEventListener('mouseleave', () => { if (!isTouchStarted) finishAnimation(); });
        parentElement.addEventListener('touchstart', () => { isTouchStarted = true; playAnimation(true); }, { passive: true });
        const touchEndHandler = () => { if (isTouchStarted) { isTouchStarted = false; finishAnimation(); } };
        parentElement.addEventListener('touchend', touchEndHandler);
        parentElement.addEventListener('touchcancel', touchEndHandler);
    }
}

function loadXmlDocument(filename) {
    fetch(filename)
        .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`); return response.text(); })
        .then(str => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(str, "application/xml");
            const parserError = xmlDoc.getElementsByTagName("parsererror");
            if (parserError.length > 0) {
                let errorMessage = "XML Parse Error.";
                if (parserError[0] && parserError[0].childNodes.length > 0 && parserError[0].childNodes[0].textContent) {
                     errorMessage = parserError[0].childNodes[0].textContent.trim().split('\n')[0];
                } else if (parserError[0] && parserError[0].textContent) {
                     errorMessage = parserError[0].textContent.trim().split('\n')[0];
                }
                throw new Error(errorMessage);
            }
            xmlData = xmlDoc;
            currentNode = xmlData.documentElement;
            pathStack = [];
            performViewTransition(() => {
                renderView(currentNode);
                updateBreadcrumb();
            }, 'initial');
            if (isMobile()) { window.history.replaceState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href); }
        })
        .catch(error => {
            console.error(`Load/Parse Error for ${filename}:`, error);
            containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Fehler beim Laden der Vorlagen: ${error.message}</p>`;
            gsap.to(containerEl, {opacity: 1, duration: 0.3});
        });
}

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
        nodesToRender = filterNodes(xmlData.documentElement, currentSearchQuery);
    } else {
        nodesToRender = Array.from(xmlNode.children).filter(node => node.tagName === 'TreeViewNode');
    }

    const vivusSetups = [];
    const cardsToObserve = [];

    if (nodesToRender.length === 0) {
        containerEl.innerHTML = `<p style="text-align:center; padding:2rem; opacity:0.7;">${searchActive ? 'Keine Ergebnisse für die Suche "' + currentSearchQuery + '".' : 'Dieser Ordner ist leer.'}</p>`;
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
            let iconToUse = svgTemplateFolder; // Standardordner-Icon
            if (imageAttr === '2' && svgTemplateIcon2) {
                iconToUse = svgTemplateIcon2;
            }
            if (iconToUse) {
                const folderIconSvg = iconToUse.cloneNode(true);
                const folderIconId = `icon-folder-${nodeGuid}`;
                folderIconSvg.id = folderIconId;
                folderIconSvg.classList.add('dynamic-card-icon');
                contentWrapper.appendChild(folderIconSvg);
                // Vivus nur für das ursprüngliche folder-icon, nicht für dynamische
                if (iconToUse === svgTemplateFolder) { // Nur wenn das ursprüngliche Folder-SVG verwendet wird
                    vivusSetups.push({ parent: card, svgId: folderIconId });
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

    vivusSetups.forEach(setup => { if (document.body.contains(setup.parent)) setupVivusAnimation(setup.parent, setup.svgId); });
    if (cardsToObserve.length > 0) {
        cardsToObserve.forEach(c => cardObserver.observe(c));
    }
    if(nodesToRender.length > 0 && !searchActive) { // Only adjust height if not in search mode
        containerEl.scrollTop = currentScroll;
        adjustCardHeights();
    } else if (searchActive) { // If search is active, still adjust heights
        adjustCardHeights();
    }

    if (isMobile() && !searchActive && (pathStack.length > 0 || currentNode !== xmlData.documentElement)) {
        showSwipeIndicator();
    } else {
        hideSwipeIndicator();
    }
}

function adjustCardHeights() {
    const allCards = Array.from(containerEl.querySelectorAll('.card'));
    if (allCards.length === 0) return;

    let targetHeight = 160;

    if (window.innerWidth <= 768) {
        allCards.forEach(card => {
            card.style.height = 'auto';
            card.style.maxHeight = 'none';
            let contentHeight = card.querySelector('.card-content-wrapper').offsetHeight;
            targetHeight = Math.max(targetHeight, contentHeight + 40);
        });
        allCards.forEach(card => {
            card.style.height = `${targetHeight}px`;
            card.style.maxHeight = `${targetHeight}px`;
        });
    } else {
        let maxCardHeight = 0;
        allCards.forEach(card => {
            card.style.height = '';
            if (card.offsetHeight > maxCardHeight) {
                maxCardHeight = card.offsetHeight;
            }
        });
        targetHeight = Math.max(190, maxCardHeight);

        allCards.forEach(card => {
            card.style.height = `${targetHeight}px`;
        });
    }
}

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

function navigateToNode(node) {
    performViewTransition(() => {
        if (currentNode !== node) {
            pathStack.push(currentNode);
        }
        currentNode = node;
        renderView(currentNode);
        updateBreadcrumb();
        hideSwipeIndicator();
    }, 'forward');

    if (isMobile() && !modalEl.classList.contains('visible')) {
         let historyPath = pathStack.map(n => n.getAttribute('guid'));
         if (currentNode && currentNode !== xmlData.documentElement) {
             historyPath.push(currentNode.getAttribute('guid'));
         }
         window.history.pushState({ path: historyPath, modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
     }
}

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

function copyPromptText(buttonElement = null) { copyToClipboard(promptFullTextEl.textContent, buttonElement || document.getElementById('copy-prompt-modal-button')); }
function copyPromptTextForCard(node, buttonElement) { copyToClipboard(node.getAttribute('beschreibung') || '', buttonElement); }

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

function showSwipeIndicator() {
    if (swipeIndicatorEl && isMobile()) {
        swipeIndicatorEl.classList.add('visible');
        swipeIndicatorEl.classList.remove('hidden');
    }
}

function hideSwipeIndicator() {
    if (swipeIndicatorEl) {
        swipeIndicatorEl.classList.remove('visible');
        swipeIndicatorEl.classList.add('hidden');
    }
}

function handleSearchInput(event) {
    currentSearchQuery = event.target.value.trim().toLowerCase();
    searchActive = currentSearchQuery.length > 0;

    performViewTransition(() => {
        filterAndRenderNodes(xmlData.documentElement, currentSearchQuery);
        updateBreadcrumb();
        window.history.pushState({
            path: [],
            modalOpen: false,
            searchActive: searchActive,
            searchQuery: currentSearchQuery
        }, '', window.location.href);
    }, 'initial');
}

function filterAndRenderNodes(rootNode, query) {
    const matchingNodes = [];
    searchNodesRecursive(rootNode, query, matchingNodes);
    renderViewFiltered(matchingNodes);
}

function searchNodesRecursive(node, query, results) {
    const nodeValue = (node.getAttribute('value') || '').toLowerCase();
    const nodeBeschreibung = (node.getAttribute('beschreibung') || '').toLowerCase();
    const isFolder = Array.from(node.children).some(child => child.tagName === 'TreeViewNode');

    if (nodeValue.includes(query) || nodeBeschreibung.includes(query)) {
        results.push(node);
        if (isFolder && nodeValue.includes(query)) { // Nur wenn der Ordner selbst übereinstimmt, werden seine Kinder hinzugefügt
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
                    // Vivus nur für das ursprüngliche folder-icon, nicht für dynamische
                    // vivusSetups.push({ parent: card, svgId: folderIconId }); // Vivus logic needs to be careful with IDs
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

    // vivusSetups.forEach(setup => { if (document.body.contains(setup.parent)) setupVivusAnimation(setup.parent, setup.svgId); }); // Vivus needs more careful handling of dynamic IDs
    if (cardsToObserve.length > 0) {
        cardsToObserve.forEach(c => cardObserver.observe(c));
    }
    adjustCardHeights();
    hideSwipeIndicator();
}
