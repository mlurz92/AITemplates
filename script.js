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

// Scroll Tracking Variables (for hiding top bar)
let lastScrollY = 0;
const scrollThreshold = 10; // Pixels scrolled before reacting

function initApp() {
    // Cache DOM Elements
    modalEl = document.getElementById('prompt-modal');
    breadcrumbEl = document.getElementById('breadcrumb');
    containerEl = document.getElementById('cards-container');
    promptFullTextEl = document.getElementById('prompt-fulltext');
    notificationAreaEl = document.getElementById('notification-area');
    topBarEl = document.getElementById('top-bar'); // Reference to top bar itself
    topbarBackBtn = document.getElementById('topbar-back-button');
    fixedBackBtn = document.getElementById('fixed-back');
    fullscreenBtn = document.getElementById('fullscreen-button');
    fullscreenEnterIcon = fullscreenBtn?.querySelector('.icon-fullscreen-enter');
    fullscreenExitIcon = fullscreenBtn?.querySelector('.icon-fullscreen-exit');

    svgTemplateFolder = document.getElementById('svg-template-folder');
    svgTemplateExpand = document.getElementById('svg-template-expand');
    svgTemplateCopy = document.getElementById('svg-template-copy');

    setupIntersectionObserver();
    setupEventListeners();
    checkFullscreenSupport(); // Add data attribute for CSS styling

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
        if (pathStack.length > 0) { // Only navigate if not already home
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
    mobileNavEl = document.getElementById('mobile-nav');
    mobileNavEl.classList.remove('hidden'); // Show mobile nav
    mobileHomeBtn = document.getElementById('mobile-home');
    mobileBackBtn = document.getElementById('mobile-back');

    // Mobile Nav Buttons
    mobileHomeBtn.addEventListener('click', () => {
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

    mobileBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal(); // Will trigger history.back() if needed
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

    // Scroll Listener for Hiding Top Bar
    lastScrollY = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
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
            e.stopPropagation(); // Prevent card click when button is clicked
            const action = button.getAttribute('data-action');
            if (action === 'expand') {
                openModal(node);
            } else if (action === 'copy') {
                copyPromptTextForCard(node);
            }
        } else {
            if (cardType === 'folder') {
                navigateToNode(node);
            } else if (cardType === 'prompt') {
                openModal(node);
            }
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
    if (!touchStartX) return;
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
    let diffX = touchEndX - touchStartX;

    // Add swipe feedback only if predominantly horizontal
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
    if (!touchStartX) return;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    containerEl.classList.remove('swiping-right');
    containerEl.style.transform = '';

    if (Math.abs(diffX) > Math.abs(diffY) && diffX > swipeThreshold) {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        } else if (pathStack.length > 0) {
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
        // Attempt to reopen modal based on expected path
        const expectedPathGuid = state.path.length > 0 ? state.path[state.path.length - 1] : null;
        const nodeToOpen = expectedPathGuid ? findNodeByGuid(xmlData.documentElement, expectedPathGuid) : null;
        // Ensure the current path stack matches where the modal should be
        if (nodeToOpen && nodeToOpen.getAttribute('beschreibung') && pathStack.map(n => n.getAttribute('guid')).join(',') === state.path.join(',')) {
             openModal(nodeToOpen, true);
        } else {
             // State mismatch, likely navigated away before history processed, go to state path
             handleNavigationFromState(state);
        }
    } else {
        // Navigate based on path difference
        handleNavigationFromState(state);
    }
}

function handleNavigationFromState(state) {
     const targetPathLength = state.path.length;
     const currentPathLength = pathStack.length;

     if (targetPathLength !== currentPathLength) {
         pathStack = state.path.map(guid => findNodeByGuid(xmlData.documentElement, guid)).filter(Boolean);
         if(pathStack.length !== targetPathLength) {
             console.warn("Path mismatch from history. Resetting.");
             pathStack = []; // Reset if path invalid
         }

         currentNode = targetPathLength === 0 ? xmlData.documentElement : pathStack[pathStack.length - 1];
         const direction = targetPathLength < currentPathLength ? 'backward' : 'forward';
         renderView(currentNode, direction);
         updateBreadcrumb();
     }
}

function handleScroll() {
    const currentScrollY = window.scrollY;
    // Determine scroll direction, only trigger if threshold is met
    if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
        if (currentScrollY > lastScrollY && currentScrollY > topBarEl.offsetHeight) {
            // Scrolling Down
            topBarEl.classList.add('top-bar-hidden');
        } else {
            // Scrolling Up or near top
            topBarEl.classList.remove('top-bar-hidden');
        }
    }
    lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY; // Update last scroll position
}


function setupIntersectionObserver() {
    const options = { threshold: 0.1 };
    cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Use requestAnimationFrame to ensure class addition happens smoothly
                requestAnimationFrame(() => {
                    entry.target.classList.add('is-visible');
                });
                observer.unobserve(entry.target);
            }
        });
    }, options);
}

function checkFullscreenSupport() {
    if (document.documentElement.requestFullscreen ||
        document.documentElement.mozRequestFullScreen || // Firefox
        document.documentElement.webkitRequestFullscreen || // Chrome, Safari, Opera
        document.documentElement.msRequestFullscreen) { // IE/Edge
        document.body.setAttribute('data-fullscreen-supported', 'true');
    } else {
        document.body.removeAttribute('data-fullscreen-supported');
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement &&
        !document.mozFullScreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
            document.documentElement.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
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
    try {
        let hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
        // Add a check for screen width as well for more robustness
        return hasTouch && window.innerWidth < 768; // Example threshold
    } catch (e) {
        console.error("Error detecting touch device:", e);
        return false;
    }
}

// Only setup Vivus for folder icons
function setupVivusAnimation(parentElement, svgId) {
    const svgElement = document.getElementById(svgId);
     // Ensure element exists and it's within a folder card context implicitly
    if (!svgElement || !parentElement.classList.contains('folder-card')) return;

    const vivusInstance = new Vivus(svgId, { type: 'delayed', duration: 150, start: 'manual' });
    vivusInstance.finish();
    svgElement.style.opacity = '1';

    let timeoutId = null;
    let isTouchStarted = false;

    const playAnimation = () => {
        clearTimeout(timeoutId);
        svgElement.style.opacity = '0';
        timeoutId = setTimeout(() => {
            svgElement.style.opacity = '1';
            vivusInstance.reset().play();
        }, 50);
    };
    const finishAnimation = () => {
        clearTimeout(timeoutId);
        vivusInstance.finish();
        svgElement.style.opacity = '1';
    };

    parentElement.addEventListener('mouseenter', () => { if (!isTouchStarted) playAnimation(); });
    parentElement.addEventListener('mouseleave', () => { if (!isTouchStarted) finishAnimation(); });
    parentElement.addEventListener('touchstart', () => { isTouchStarted = true; playAnimation(); }, { passive: true });
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
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) { throw new Error(`XML Parsing Error: ${xmlDoc.getElementsByTagName("parsererror")[0].textContent}`); }
            xmlData = xmlDoc;
            currentNode = xmlData.documentElement;
            pathStack = [];
            renderView(currentNode, 'forward'); // Initial load
            updateBreadcrumb();
            if (isMobile()) { window.history.replaceState({ path: [], modalOpen: false }, '', window.location.href); }
        })
        .catch(error => {
            console.error(`Error loading/parsing ${filename}:`, error);
            containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Fehler: ${error.message}</p>`;
        });
}

function renderView(xmlNode, direction = 'forward') {
    const transitionDuration = 350; // Match CSS --transition-duration-page

    const slideOutClass = direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
    containerEl.classList.remove('is-visible', 'slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
    if (containerEl.innerHTML !== '') { // Only apply slide-out if not initial load
        containerEl.classList.add(slideOutClass);
    }

    setTimeout(() => {
        containerEl.innerHTML = '';
        if (!xmlNode) { /* Error handling as before */ return; }

        const childNodes = Array.from(xmlNode.children).filter(node => node.tagName === 'TreeViewNode');
        const vivusSetups = [];

        childNodes.forEach(node => {
            const card = document.createElement('div');
            card.classList.add('card'); // Start hidden, 'is-visible' added by observer
            const isFolder = node.children.length > 0 && Array.from(node.children).some(child => child.tagName === 'TreeViewNode');
            const nodeGuid = node.getAttribute('guid') || `genid-${Math.random().toString(36).substring(2, 15)}`;
            card.setAttribute('data-guid', nodeGuid);

            const titleElem = document.createElement('h3');
            titleElem.textContent = node.getAttribute('value') || 'Unbenannt';
            card.appendChild(titleElem);

            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('card-content-wrapper');

            if (isFolder) {
                card.classList.add('folder-card');
                card.setAttribute('data-type', 'folder');
                const folderIconSvg = svgTemplateFolder.cloneNode(true);
                const folderIconId = `icon-folder-${nodeGuid}`;
                folderIconSvg.id = folderIconId;
                contentWrapper.appendChild(folderIconSvg);
                card.appendChild(contentWrapper);
                vivusSetups.push({ parent: card, svgId: folderIconId });
            } else {
                card.setAttribute('data-type', 'prompt');
                const descElem = document.createElement('p');
                descElem.textContent = node.getAttribute('beschreibung') || '';
                contentWrapper.appendChild(descElem);
                card.appendChild(contentWrapper);

                const btnContainer = document.createElement('div');
                btnContainer.classList.add('card-buttons');

                const expandBtn = document.createElement('button');
                expandBtn.classList.add('button');
                expandBtn.setAttribute('aria-label', 'Details anzeigen');
                expandBtn.setAttribute('data-action', 'expand');
                expandBtn.appendChild(svgTemplateExpand.cloneNode(true));
                btnContainer.appendChild(expandBtn);

                const copyBtn = document.createElement('button');
                copyBtn.classList.add('button');
                copyBtn.setAttribute('aria-label', 'Prompt kopieren');
                copyBtn.setAttribute('data-action', 'copy');
                copyBtn.appendChild(svgTemplateCopy.cloneNode(true));
                btnContainer.appendChild(copyBtn);

                card.appendChild(btnContainer);
            }
            containerEl.appendChild(card);
            cardObserver.observe(card); // Observe card
        });

        // Setup Vivus ONLY for folders
        vivusSetups.forEach(setup => { if (document.body.contains(setup.parent)) setupVivusAnimation(setup.parent, setup.svgId); });

        // Prepare for slide-in
        const slideInClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';
        containerEl.classList.remove(slideOutClass); // Important: remove slide-out before adding slide-in start
        containerEl.classList.add(slideInClass);

        // Trigger slide-in animation
        requestAnimationFrame(() => {
             containerEl.classList.remove(slideInClass);
             containerEl.classList.add('is-visible');
        });

    }, (containerEl.innerHTML === '') ? 0 : transitionDuration * 0.9); // Skip delay on initial load
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
    homeLink.textContent = 'Home';
    homeLink.classList.add('breadcrumb-link');
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
                if (targetLevel <= pathStack.length) { // Navigate up or to self's parent
                     pathStack = pathStack.slice(0, targetLevel);
                     currentNode = node; // The clicked node is the new current node
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
         breadcrumbEl.appendChild(document.createTextNode(' > '));
         const currentSpan = document.createElement('span');
         currentSpan.textContent = currentNodeValue;
         currentSpan.style.opacity = '0.7';
         breadcrumbEl.appendChild(currentSpan);
    }

    const isModalVisible = modalEl.classList.contains('visible');
    fixedBackBtn.classList.toggle('hidden', isAtHome && !isModalVisible);
     if(mobileBackBtn) mobileBackBtn.classList.toggle('hidden', isAtHome && !isModalVisible);
     topbarBackBtn.style.visibility = (isAtHome && !isModalVisible) ? 'hidden' : 'visible';
}

// navigateBack function is implicitly handled by onpopstate now.

function openModal(node, calledFromPopstate = false) {
    promptFullTextEl.textContent = node.getAttribute('beschreibung') || '';
    modalEl.classList.remove('hidden');
    requestAnimationFrame(() => { modalEl.classList.add('visible'); });
    if (isMobile() && !calledFromPopstate) {
        const currentState = window.history.state || { path: pathStack.map(n => n.getAttribute('guid')), modalOpen: false };
        // Only push state if modal isn't already supposed to be open in history
        if (!currentState.modalOpen) {
            // Ensure the path in the state reflects the current navigation path
            const currentPathGuids = pathStack.map(n => n.getAttribute('guid'));
            window.history.pushState({ path: currentPathGuids, modalOpen: true }, '', window.location.href);
        }
    }
    updateBreadcrumb();
}

function closeModal(calledFromPopstate = false) {
    modalEl.classList.remove('visible');
    setTimeout(() => { modalEl.classList.add('hidden'); }, 300);
    if (isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
        window.history.back(); // Go back only if history state expects modal open
    }
    updateBreadcrumb();
}

function copyPromptText() { copyToClipboard(promptFullTextEl.textContent); }
function copyPromptTextForCard(node) { copyToClipboard(node.getAttribute('beschreibung') || ''); }

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showNotification('Prompt kopiert!'))
            .catch(err => { console.error('Clipboard error:', err); showNotification('Fehler beim Kopieren'); });
    } else { /* Fallback as before */
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
    void notificationEl.offsetWidth; // Reflow
    notificationTimeoutId = setTimeout(() => {
        notificationEl.classList.add('fade-out');
        notificationEl.addEventListener('animationend', () => { notificationEl.remove(); }, { once: true });
        notificationTimeoutId = null;
    }, 2500);
}