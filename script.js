document.addEventListener('DOMContentLoaded', initApp);

let xmlData = null;
let currentNode = null;
let pathStack = [];
const currentXmlFile = "Templates.xml";

// DOM Element References
let modalEl, breadcrumbEl, containerEl, promptFullTextEl, notificationAreaEl;
let topBarEl, topbarBackBtn, fixedBackBtn, fullscreenBtn, fullscreenEnterIcon, fullscreenExitIcon;
let mobileNavEl, mobileHomeBtn, mobileBackBtn;

// SVG Templates
let svgTemplateFolder, svgTemplateExpand, svgTemplateCopy;

// Intersection Observer for Cards
let cardObserver;

// Swipe Tracking Variables
let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
const swipeThreshold = 50;
const swipeFeedbackThreshold = 5;

// REMOVED: Scroll Tracking Variables

function initApp() {
    // Cache DOM Elements
    modalEl = document.getElementById('prompt-modal');
    breadcrumbEl = document.getElementById('breadcrumb');
    containerEl = document.getElementById('cards-container');
    promptFullTextEl = document.getElementById('prompt-fulltext');
    notificationAreaEl = document.getElementById('notification-area');
    topBarEl = document.getElementById('top-bar');
    topbarBackBtn = document.getElementById('topbar-back-button');
    fixedBackBtn = document.getElementById('fixed-back');
    fullscreenBtn = document.getElementById('fullscreen-button');
    fullscreenEnterIcon = fullscreenBtn?.querySelector('.icon-fullscreen-enter');
    fullscreenExitIcon = fullscreenBtn?.querySelector('.icon-fullscreen-exit');
    mobileNavEl = document.getElementById('mobile-nav');

    svgTemplateFolder = document.getElementById('svg-template-folder');
    svgTemplateExpand = document.getElementById('svg-template-expand');
    svgTemplateCopy = document.getElementById('svg-template-copy');

    setupIntersectionObserver();
    setupEventListeners();
    checkFullscreenSupport();

    if (isMobile()) {
        setupMobileSpecificFeatures();
    }

    loadXmlDocument(currentXmlFile);
}

function setupEventListeners() {
    // Top Bar Back Button
    topbarBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        } else if (pathStack.length > 0) {
            window.history.back();
        }
    });

    // Fixed Back Button (Go Home)
    fixedBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        }
        if (pathStack.length > 0) {
            currentNode = xmlData.documentElement;
            pathStack = [];
            renderView(currentNode, 'backward');
            updateBreadcrumb();
            if (isMobile()) {
                window.history.pushState({ path: [], modalOpen: false }, '', window.location.href);
            }
        }
    });

    // Fullscreen Button
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('mozfullscreenchange', updateFullscreenButton);
        document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    }

    // Modal Buttons & Background Click
    document.getElementById('modal-close-button').addEventListener('click', closeModal);
    document.getElementById('copy-prompt-modal-button').addEventListener('click', copyPromptText);
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
            closeModal();
        }
    });

    // Event Delegation for Cards Container
    containerEl.addEventListener('click', handleCardContainerClick);
}

function setupMobileSpecificFeatures() {
    document.body.classList.add('mobile');
    mobileNavEl?.classList.remove('hidden');
    mobileHomeBtn = document.getElementById('mobile-home');
    mobileBackBtn = document.getElementById('mobile-back');

    // Mobile Nav Buttons
    mobileHomeBtn?.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        }
        if (pathStack.length > 0) {
            currentNode = xmlData.documentElement;
            pathStack = [];
            renderView(currentNode, 'backward');
            updateBreadcrumb();
            window.history.pushState({ path: [], modalOpen: false }, '', window.location.href);
        }
    });

    mobileBackBtn?.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        } else if (pathStack.length > 0) {
            window.history.back();
        }
    });

    // Swipe Gestures
    containerEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    containerEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    // History API Setup & Handling
    window.history.replaceState({ path: [], modalOpen: false }, '', window.location.href);
    window.onpopstate = handlePopState;

    // REMOVED: Scroll listener for hiding top bar
}

function handleCardContainerClick(e) {
    const card = e.target.closest('.card');
    const button = e.target.closest('button[data-action]');

    if (card) {
        const guid = card.getAttribute('data-guid');
        const node = findNodeByGuid(xmlData.documentElement, guid);
        if (!node) return;
        const cardType = card.getAttribute('data-type');

        if (button) {
            e.stopPropagation();
            const action = button.getAttribute('data-action');
            if (action === 'expand') openModal(node);
            else if (action === 'copy') copyPromptTextForCard(node);
        } else {
            if (cardType === 'folder') navigateToNode(node);
            else if (cardType === 'prompt') openModal(node);
        }
    } else if (e.target === containerEl && pathStack.length > 0 && !modalEl.classList.contains('visible')) {
        window.history.back();
    }
}

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchEndX = touchStartX;
    touchEndY = touchStartY;
}

function handleTouchMove(e) {
    if (!touchStartX || modalEl.classList.contains('visible')) return;
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
    let diffX = touchEndX - touchStartX;

    if (Math.abs(diffX) > Math.abs(touchEndY - touchStartY) && diffX > swipeFeedbackThreshold) {
        containerEl.classList.add('swiping-right');
        let moveX = Math.min(diffX - swipeFeedbackThreshold, window.innerWidth * 0.2);
        containerEl.style.transform = `translateX(${moveX}px)`;
    } else {
        containerEl.classList.remove('swiping-right');
        containerEl.style.transform = '';
    }
}

function handleTouchEnd(e) {
    if (!touchStartX || modalEl.classList.contains('visible')) return;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    containerEl.classList.remove('swiping-right');
    containerEl.style.transform = '';

    if (Math.abs(diffX) > Math.abs(diffY) && diffX > swipeThreshold) {
        if (pathStack.length > 0) {
            window.history.back();
        }
    }
    touchStartX = 0; touchStartY = 0; touchEndX = 0; touchEndY = 0;
}

function handlePopState(event) {
    const state = event.state || { path: [], modalOpen: false };
    const currentlyModalOpen = modalEl.classList.contains('visible');

    if (currentlyModalOpen && !state.modalOpen) {
        closeModal(true);
    } else if (!currentlyModalOpen && state.modalOpen) {
        const expectedPathGuid = state.path.length > 0 ? state.path[state.path.length - 1] : null;
        const nodeToOpen = expectedPathGuid ? findNodeByGuid(xmlData.documentElement, expectedPathGuid) : null;
        const currentStackGuids = pathStack.map(n => n.getAttribute('guid'));
        const expectedParentPathGuids = state.path.slice(0, -1);
        if (nodeToOpen && nodeToOpen.getAttribute('beschreibung') && currentStackGuids.join(',') === expectedParentPathGuids.join(',')) {
             openModal(nodeToOpen, true);
        } else {
             handleNavigationFromState(state);
        }
    } else {
        handleNavigationFromState(state);
    }
}

function handleNavigationFromState(state) {
     const targetPathLength = state.path.length;
     const currentPathLength = pathStack.length;
     if (targetPathLength !== currentPathLength) {
         pathStack = state.path.map(guid => findNodeByGuid(xmlData.documentElement, guid)).filter(Boolean);
         if(pathStack.length !== targetPathLength) { pathStack = []; }
         currentNode = targetPathLength === 0 ? xmlData.documentElement : pathStack[pathStack.length - 1];
         const direction = targetPathLength < currentPathLength ? 'backward' : 'forward';
         renderView(currentNode, direction);
         updateBreadcrumb();
     }
}

// REMOVED: handleScrollForTopBar function

function setupIntersectionObserver() {
    const options = { threshold: 0.1 };
    cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                requestAnimationFrame(() => { entry.target.classList.add('is-visible'); });
                observer.unobserve(entry.target);
            }
        });
    }, options);
}

function checkFullscreenSupport() {
    const support = !!(document.documentElement.requestFullscreen || document.documentElement.mozRequestFullScreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen);
    if (support) {
        document.body.setAttribute('data-fullscreen-supported', 'true');
    } else {
        document.body.removeAttribute('data-fullscreen-supported');
        fullscreenBtn?.remove();
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        const element = document.documentElement;
        if (element.requestFullscreen) element.requestFullscreen();
        else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
        else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
        else if (element.msRequestFullscreen) element.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
}

function updateFullscreenButton() {
    const isFullscreen = !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    if (fullscreenEnterIcon && fullscreenExitIcon) {
        fullscreenEnterIcon.classList.toggle('hidden', isFullscreen);
        fullscreenExitIcon.classList.toggle('hidden', !isFullscreen);
    }
    fullscreenBtn?.setAttribute('aria-label', isFullscreen ? 'Vollbildmodus beenden' : 'Vollbildmodus aktivieren');
}

function findNodeByGuid(startNode, targetGuid) {
    if (!startNode || !targetGuid) return null;
    if (startNode.getAttribute('guid') === targetGuid) return startNode;
    const children = Array.from(startNode.children).filter(node => node.tagName === 'TreeViewNode');
    for (const child of children) {
        const found = findNodeByGuid(child, targetGuid);
        if (found) return found;
    }
    return null;
}

function isMobile() {
    let isMobileDevice = false;
    try {
        // Combine touch detection with a common user agent check for robustness
        isMobileDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window || /Mobi|Android/i.test(navigator.userAgent);
    } catch (e) { /* Ignore */ }
    // Consider also viewport width if needed, e.g., && window.innerWidth < 768
    return isMobileDevice;
}

function setupVivusAnimation(parentElement, svgId) {
    const svgElement = document.getElementById(svgId);
    if (!svgElement || !parentElement.classList.contains('folder-card')) return;

    const vivusInstance = new Vivus(svgId, { type: 'delayed', duration: 150, start: 'manual' });
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

        if (immediate) {
            startVivus();
        } else {
            timeoutId = setTimeout(startVivus, 50);
        }
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


function loadXmlDocument(filename) {
    fetch(filename)
        .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.text(); })
        .then(str => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(str, "application/xml");
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) { throw new Error(`XML Parse Error: ${xmlDoc.getElementsByTagName("parsererror")[0].textContent}`); }
            xmlData = xmlDoc;
            currentNode = xmlData.documentElement;
            pathStack = [];
            renderView(currentNode, 'forward');
            updateBreadcrumb();
            if (isMobile()) { window.history.replaceState({ path: [], modalOpen: false }, '', window.location.href); }
        })
        .catch(error => {
            console.error(`Load/Parse Error: ${filename}:`, error);
            containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Fehler: ${error.message}</p>`;
            containerEl.classList.add('is-visible');
        });
}

function renderView(xmlNode, direction = 'forward') {
    const transitionDuration = 350;
    const isInitialLoad = !containerEl.classList.contains('is-visible') && containerEl.innerHTML === '';

    const slideOutClass = direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
    containerEl.classList.remove('is-visible', 'slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');

    if (!isInitialLoad) {
        containerEl.classList.add(slideOutClass);
    }

    setTimeout(() => {
        containerEl.innerHTML = '';
        if (!xmlNode) {
             containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Interner Fehler: Ungültiger Knoten.</p>`;
             containerEl.classList.add('is-visible'); return;
         }

        const childNodes = Array.from(xmlNode.children).filter(node => node.tagName === 'TreeViewNode');
        const vivusSetups = [];

        childNodes.forEach(node => {
            const card = document.createElement('div');
            card.classList.add('card');
            const isFolder = node.children.length > 0 && Array.from(node.children).some(child => child.tagName === 'TreeViewNode');
            const nodeGuid = node.getAttribute('guid') || `genid-${Math.random().toString(36).substring(2, 15)}`;
            card.setAttribute('data-guid', nodeGuid);
            const titleElem = document.createElement('h3');
            titleElem.textContent = node.getAttribute('value') || 'Unbenannt';
            card.appendChild(titleElem);
            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('card-content-wrapper');

            if (isFolder) {
                card.classList.add('folder-card'); card.setAttribute('data-type', 'folder');
                const folderIconSvg = svgTemplateFolder.cloneNode(true);
                const folderIconId = `icon-folder-${nodeGuid}`;
                folderIconSvg.id = folderIconId; contentWrapper.appendChild(folderIconSvg); card.appendChild(contentWrapper);
                vivusSetups.push({ parent: card, svgId: folderIconId });
            } else {
                card.setAttribute('data-type', 'prompt');
                const descElem = document.createElement('p');
                descElem.textContent = node.getAttribute('beschreibung') || ''; contentWrapper.appendChild(descElem); card.appendChild(contentWrapper);
                const btnContainer = document.createElement('div'); btnContainer.classList.add('card-buttons');
                const expandBtn = document.createElement('button'); expandBtn.classList.add('button'); expandBtn.setAttribute('aria-label', 'Details anzeigen'); expandBtn.setAttribute('data-action', 'expand'); expandBtn.appendChild(svgTemplateExpand.cloneNode(true)); btnContainer.appendChild(expandBtn);
                const copyBtn = document.createElement('button'); copyBtn.classList.add('button'); copyBtn.setAttribute('aria-label', 'Prompt kopieren'); copyBtn.setAttribute('data-action', 'copy'); copyBtn.appendChild(svgTemplateCopy.cloneNode(true)); btnContainer.appendChild(copyBtn);
                card.appendChild(btnContainer);
            }
            containerEl.appendChild(card);
            cardObserver.observe(card);
        });

        vivusSetups.forEach(setup => { if (document.body.contains(setup.parent)) setupVivusAnimation(setup.parent, setup.svgId); });

        const slideInClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';
        containerEl.classList.remove(slideOutClass); containerEl.classList.add(slideInClass);
        requestAnimationFrame(() => { containerEl.classList.remove(slideInClass); containerEl.classList.add('is-visible'); });

    }, isInitialLoad ? 0 : transitionDuration * 0.8);
}

function navigateToNode(node) {
    pathStack.push(currentNode);
    currentNode = node;
    renderView(currentNode, 'forward');
    updateBreadcrumb();
     if (isMobile() && !modalEl.classList.contains('visible')) {
         window.history.pushState({ path: pathStack.map(n => n.getAttribute('guid')), modalOpen: false }, '', window.location.href);
     }
}

function updateBreadcrumb() {
    breadcrumbEl.innerHTML = '';
    if (!xmlData || !xmlData.documentElement) return;

    const homeLink = document.createElement('span');
    homeLink.textContent = 'Home'; homeLink.classList.add('breadcrumb-link');
    homeLink.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) closeModal();
        if (pathStack.length > 0) {
            currentNode = xmlData.documentElement; pathStack = [];
            renderView(currentNode, 'backward'); updateBreadcrumb();
            if (isMobile()) window.history.pushState({ path: [], modalOpen: false }, '', window.location.href);
        }
    });
    breadcrumbEl.appendChild(homeLink);

    pathStack.forEach((node, index) => {
        const nodeValue = node.getAttribute('value');
        if (nodeValue) {
            breadcrumbEl.appendChild(document.createTextNode(' > '));
            const link = document.createElement('span');
            link.textContent = nodeValue; link.classList.add('breadcrumb-link');
            link.addEventListener('click', () => {
                if (modalEl.classList.contains('visible')) closeModal();
                const targetLevel = index + 1;
                if (targetLevel <= pathStack.length) {
                     pathStack = pathStack.slice(0, targetLevel); currentNode = node;
                     renderView(currentNode, 'backward'); updateBreadcrumb();
                     if (isMobile()) window.history.pushState({ path: pathStack.map(n => n.getAttribute('guid')), modalOpen: false }, '', window.location.href);
                }
            });
            breadcrumbEl.appendChild(link);
        }
    });

     const isAtHome = pathStack.length === 0;
     if (!isAtHome) {
         const currentNodeValue = currentNode.getAttribute('value');
         const lastLinkTargetNode = pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;
         if (currentNode !== lastLinkTargetNode) {
             breadcrumbEl.appendChild(document.createTextNode(' > '));
             const currentSpan = document.createElement('span');
             currentSpan.textContent = currentNodeValue; currentSpan.style.opacity = '0.7';
             breadcrumbEl.appendChild(currentSpan);
         }
    }

    const isModalVisible = modalEl.classList.contains('visible');
    fixedBackBtn.classList.toggle('hidden', isAtHome && !isModalVisible);
    if(mobileBackBtn) mobileBackBtn.classList.toggle('hidden', isAtHome && !isModalVisible);
    topbarBackBtn.style.visibility = (isAtHome && !isModalVisible) ? 'hidden' : 'visible';
}

function openModal(node, calledFromPopstate = false) {
    promptFullTextEl.textContent = node.getAttribute('beschreibung') || '';
    modalEl.classList.remove('hidden');
    requestAnimationFrame(() => { modalEl.classList.add('visible'); });
    if (isMobile() && !calledFromPopstate) {
        const currentState = window.history.state || { path: pathStack.map(n => n.getAttribute('guid')), modalOpen: false };
        if (!currentState.modalOpen) {
            const currentPathGuids = pathStack.map(n => n.getAttribute('guid'));
            const nodeGuid = node.getAttribute('guid');
            const modalPath = nodeGuid ? [...currentPathGuids, nodeGuid] : currentPathGuids;
            window.history.pushState({ path: modalPath, modalOpen: true }, '', window.location.href);
        }
    }
}

function closeModal(calledFromPopstate = false) {
    modalEl.classList.remove('visible');
    setTimeout(() => { modalEl.classList.add('hidden'); }, 300);
    if (isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
        window.history.back();
    }
    setTimeout(updateBreadcrumb, 310); // Update button visibility after transition
}

function copyPromptText() { copyToClipboard(promptFullTextEl.textContent); }
function copyPromptTextForCard(node) { copyToClipboard(node.getAttribute('beschreibung') || ''); }

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showNotification('Prompt kopiert!'))
            .catch(err => { console.error('Clipboard error:', err); showNotification('Fehler beim Kopieren'); });
    } else { /* Fallback */
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; textArea.style.top = '-9999px'; textArea.style.left = '-9999px'; textArea.style.opacity = '0';
        document.body.appendChild(textArea); textArea.focus(); textArea.select();
        try { document.execCommand('copy'); showNotification('Prompt kopiert!'); }
        catch (err) { console.error('Fallback copy error:', err); showNotification('Fehler beim Kopieren'); }
        document.body.removeChild(textArea);
    }
}

let notificationTimeoutId = null;
function showNotification(message) {
    if (notificationTimeoutId) clearTimeout(notificationTimeoutId);
    const notificationEl = document.createElement('div');
    notificationEl.classList.add('notification');
    notificationEl.textContent = message;
    notificationAreaEl.appendChild(notificationEl);
    void notificationEl.offsetWidth;
    notificationTimeoutId = setTimeout(() => {
        notificationEl.classList.add('fade-out');
        notificationEl.addEventListener('animationend', () => { notificationEl.remove(); }, { once: true });
        notificationTimeoutId = null;
    }, 2500);
}
