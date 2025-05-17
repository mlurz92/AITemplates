document.addEventListener('DOMContentLoaded', initApp);

let xmlData = null;
let currentNode = null;
let pathStack = [];
const currentXmlFile = "Templates.xml";

let modalEl, breadcrumbEl, containerEl, promptFullTextEl, notificationAreaEl;
let topBarEl, topbarBackBtn, fixedBackBtn, fullscreenBtn, fullscreenEnterIcon, fullscreenExitIcon;
let mobileNavEl, mobileHomeBtn, mobileBackBtn;

let svgTemplateFolder, svgTemplateExpand, svgTemplateCopy, svgTemplateCheckmark;

let cardObserver;

let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
const swipeThreshold = 50;
const swipeFeedbackThreshold = 5;

const MAX_ROTATION = 10;

function initApp() {
    modalEl = document.getElementById('prompt-modal');
    breadcrumbEl = document.getElementById('breadcrumb');
    containerEl = document.getElementById('cards-container');
    promptFullTextEl = document.getElementById('prompt-fulltext');
    notificationAreaEl = document.getElementById('notification-area');
    topBarEl = document.getElementById('top-bar');
    topbarBackBtn = document.getElementById('topbar-back-button');
    fixedBackBtn = document.getElementById('fixed-back');
    fullscreenBtn = document.getElementById('fullscreen-button');
    if (fullscreenBtn) {
        fullscreenEnterIcon = fullscreenBtn.querySelector('.icon-fullscreen-enter');
        fullscreenExitIcon = fullscreenBtn.querySelector('.icon-fullscreen-exit');
    }
    mobileNavEl = document.getElementById('mobile-nav');

    svgTemplateFolder = document.getElementById('svg-template-folder');
    svgTemplateExpand = document.getElementById('svg-template-expand');
    svgTemplateCopy = document.getElementById('svg-template-copy');
    svgTemplateCheckmark = document.getElementById('svg-template-checkmark');

    setupIntersectionObserver();
    setupEventListeners();
    checkFullscreenSupport();

    if (isMobile()) {
        setupMobileSpecificFeatures();
    }

    loadXmlDocument(currentXmlFile);
}

function setupEventListeners() {
    topbarBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        } else if (pathStack.length > 0) {
            navigateHistory('backward');
        }
    });

    fixedBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        }
        if (pathStack.length > 0) {
            performViewTransition(() => {
                currentNode = xmlData.documentElement;
                pathStack = [];
                renderView(currentNode);
                updateBreadcrumb();
            }, 'backward');
            if (isMobile()) {
                window.history.pushState({ path: [], modalOpen: false }, '', window.location.href);
            }
        }
    });

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('mozfullscreenchange', updateFullscreenButton);
        document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    }

    document.getElementById('modal-close-button').addEventListener('click', closeModal);
    document.getElementById('copy-prompt-modal-button').addEventListener('click', copyPromptText);
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
            closeModal();
        }
    });

    containerEl.addEventListener('click', handleCardContainerClick);
}

function setupMobileSpecificFeatures() {
    document.body.classList.add('mobile');
    mobileNavEl?.classList.remove('hidden');
    mobileHomeBtn = document.getElementById('mobile-home');
    mobileBackBtn = document.getElementById('mobile-back');

    mobileHomeBtn?.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        }
        if (pathStack.length > 0) {
            performViewTransition(() => {
                currentNode = xmlData.documentElement;
                pathStack = [];
                renderView(currentNode);
                updateBreadcrumb();
            }, 'backward');
            window.history.pushState({ path: [], modalOpen: false }, '', window.location.href);
        }
    });

    mobileBackBtn?.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal();
        } else if (pathStack.length > 0) {
            navigateHistory('backward');
        }
    });

    containerEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    containerEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    window.history.replaceState({ path: [], modalOpen: false }, '', window.location.href);
    window.onpopstate = handlePopState;
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
            else if (action === 'copy') copyPromptTextForCard(node, e.target.closest('button'));
        } else {
            if (cardType === 'folder') {
                navigateToNode(node);
            } else if (cardType === 'prompt') {
                openModal(node);
            }
        }
    } else if (e.target === containerEl && pathStack.length > 0 && !modalEl.classList.contains('visible')) {
         navigateHistory('backward');
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

function handleTouchEnd() {
    if (!touchStartX || modalEl.classList.contains('visible')) return;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    containerEl.classList.remove('swiping-right');
    containerEl.style.transform = '';

    if (Math.abs(diffX) > Math.abs(diffY) && diffX > swipeThreshold) {
        if (pathStack.length > 0) {
             navigateHistory('backward');
        }
    }
    touchStartX = 0; touchStartY = 0; touchEndX = 0; touchEndY = 0;
}

function navigateHistory(direction) {
    if (isMobile() && pathStack.length > 0) {
        window.history.back();
    } else if (!isMobile() && pathStack.length > 0) {
        performViewTransition(() => {
            const parentNode = pathStack.pop();
            currentNode = parentNode;
            renderView(currentNode);
            updateBreadcrumb();
        }, direction);
    }
}

function handlePopState(event) {
    const state = event.state || { path: [], modalOpen: false };
    const currentlyModalOpen = modalEl.classList.contains('visible');
    const direction = state.path.length < pathStack.length ? 'backward' : 'forward';

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
             handleNavigationFromState(state, direction);
        }
    } else {
        handleNavigationFromState(state, direction);
    }
}

function handleNavigationFromState(state, direction) {
     const targetPathLength = state.path.length;
     const updateDOM = () => {
        pathStack = state.path.map(guid => findNodeByGuid(xmlData.documentElement, guid)).filter(Boolean);
        if(pathStack.length !== targetPathLength && targetPathLength > 0 && state.path.length > 0) { // Check state.path.length before reset
             pathStack = [];
        } else if (targetPathLength === 0) {
            pathStack = [];
        }
        currentNode = targetPathLength === 0 ? xmlData.documentElement : pathStack[pathStack.length - 1];
        if (!currentNode && xmlData) currentNode = xmlData.documentElement;

        renderView(currentNode);
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
                duration: 0.7,
                ease: "elastic.out(1, 0.6)",
                stagger: {
                    each: 0.07,
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

function checkFullscreenSupport() {
    const support = !!(document.documentElement.requestFullscreen || document.documentElement.mozRequestFullScreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen);
    if (support && fullscreenBtn) {
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
        isMobileDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window || /Mobi|Android/i.test(navigator.userAgent);
    } catch (e) { /* Ignore */ }
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
        if (immediate) startVivus();
        else timeoutId = setTimeout(startVivus, 50);
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
        .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`); return response.text(); })
        .then(str => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(str, "application/xml");
            const parserError = xmlDoc.getElementsByTagName("parsererror");
            if (parserError.length > 0) {
                let errorMessage = "XML Parse Error.";
                if (parserError[0] && parserError[0].textContent) {
                    errorMessage = parserError[0].textContent.trim().split('\n')[0]; // Get first line of error
                }
                throw new Error(errorMessage);
            }
            xmlData = xmlDoc;
            currentNode = xmlData.documentElement;
            pathStack = [];
            performViewTransition(() => {
                renderView(currentNode);
                updateBreadcrumb();
            }, 'initial'); // Use 'initial' or 'forward' for first load
            if (isMobile()) { window.history.replaceState({ path: [], modalOpen: false }, '', window.location.href); }
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

    const childNodes = Array.from(xmlNode.children).filter(node => node.tagName === 'TreeViewNode');
    const vivusSetups = [];
    const cardsToObserve = [];

    childNodes.forEach(node => {
        const card = document.createElement('div');
        card.classList.add('card');
        const isFolder = node.children.length > 0 && Array.from(node.children).some(child => child.tagName === 'TreeViewNode');
        let nodeGuid = node.getAttribute('guid');
        if (!nodeGuid) {
            nodeGuid = `genid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; // More unique fallback
            node.setAttribute('guid', nodeGuid);
        }
        card.setAttribute('data-guid', nodeGuid);

        const titleElem = document.createElement('h3');
        titleElem.textContent = node.getAttribute('value') || 'Unbenannt';
        card.appendChild(titleElem);
        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('card-content-wrapper');

        if (isFolder) {
            card.classList.add('folder-card'); card.setAttribute('data-type', 'folder');
            if (svgTemplateFolder) {
                const folderIconSvg = svgTemplateFolder.cloneNode(true);
                const folderIconId = `icon-folder-${nodeGuid}`;
                folderIconSvg.id = folderIconId; contentWrapper.appendChild(folderIconSvg); card.appendChild(contentWrapper);
                vivusSetups.push({ parent: card, svgId: folderIconId });
            }
        } else {
            card.setAttribute('data-type', 'prompt');
            const descElem = document.createElement('p');
            descElem.textContent = node.getAttribute('beschreibung') || ''; contentWrapper.appendChild(descElem); card.appendChild(contentWrapper);
            const btnContainer = document.createElement('div'); btnContainer.classList.add('card-buttons');
            if (svgTemplateExpand) {
                const expandBtn = document.createElement('button'); expandBtn.classList.add('button'); expandBtn.setAttribute('aria-label', 'Details anzeigen'); expandBtn.setAttribute('data-action', 'expand'); expandBtn.appendChild(svgTemplateExpand.cloneNode(true)); btnContainer.appendChild(expandBtn);
            }
            if (svgTemplateCopy) {
                const copyBtn = document.createElement('button'); copyBtn.classList.add('button'); copyBtn.setAttribute('aria-label', 'Prompt kopieren'); copyBtn.setAttribute('data-action', 'copy'); copyBtn.appendChild(svgTemplateCopy.cloneNode(true)); btnContainer.appendChild(copyBtn);
            }
            card.appendChild(btnContainer);
        }
        containerEl.appendChild(card);
        cardsToObserve.push(card);
        addCard3DHoverEffect(card);
    });

    vivusSetups.forEach(setup => { if (document.body.contains(setup.parent)) setupVivusAnimation(setup.parent, setup.svgId); });
    cardsToObserve.forEach(c => cardObserver.observe(c));
    if(childNodes.length > 0) containerEl.scrollTop = currentScroll; // Only restore if there's content
}

function addCard3DHoverEffect(card) {
    let frameRequested = false;
    card.addEventListener('mousemove', (e) => {
        if (frameRequested) return;
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
        requestAnimationFrame(() => {
            card.style.setProperty('--rotateX', '0deg');
            card.style.setProperty('--rotateY', '0deg');
        });
    });
}

function navigateToNode(node) {
    performViewTransition(() => {
        if (currentNode !== node) { // Avoid pushing same node if already current
            pathStack.push(currentNode);
        }
        currentNode = node;
        renderView(currentNode);
        updateBreadcrumb();
    }, 'forward');

    if (isMobile() && !modalEl.classList.contains('visible')) {
         // pathStack for history should reflect the state *after* navigation
         const currentPathGuids = pathStack.map(n => n.getAttribute('guid'));
         if (currentNode !== xmlData.documentElement) { // Don't push root if already there after clearing pathStack
             currentPathGuids.push(currentNode.getAttribute('guid'));
         }
         window.history.pushState({ path: currentPathGuids, modalOpen: false }, '', window.location.href);
     }
}

function updateBreadcrumb() {
    breadcrumbEl.innerHTML = '';
    if (!xmlData || !xmlData.documentElement) return;

    const homeLink = document.createElement('span');
    homeLink.textContent = 'Home';

    const allActive = breadcrumbEl.querySelectorAll('.current-level-active');
    allActive.forEach(el => el.classList.remove('current-level-active'));
    homeLink.classList.remove('breadcrumb-link'); // Default state for home

    if (pathStack.length === 0) {
        homeLink.classList.add('current-level-active');
    } else {
        homeLink.classList.add('breadcrumb-link');
        homeLink.addEventListener('click', () => {
            if (modalEl.classList.contains('visible')) closeModal();
            performViewTransition(() => {
                currentNode = xmlData.documentElement; pathStack = [];
                renderView(currentNode); updateBreadcrumb();
            }, 'backward');
            if (isMobile()) window.history.pushState({ path: [], modalOpen: false }, '', window.location.href);
        });
    }
    breadcrumbEl.appendChild(homeLink);

    pathStack.forEach((nodeInPath, index) => {
        const nodeValue = nodeInPath.getAttribute('value');
        if (nodeValue) {
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            separator.style.opacity = '0.7';
            breadcrumbEl.appendChild(separator);

            const link = document.createElement('span');
            link.textContent = nodeValue;

            // If this node in path is the currently displayed node (currentNode)
            if (nodeInPath === currentNode) {
                link.classList.add('current-level-active');
            } else {
                link.classList.add('breadcrumb-link');
                link.addEventListener('click', () => {
                    if (modalEl.classList.contains('visible')) closeModal();
                    performViewTransition(() => {
                        pathStack = pathStack.slice(0, index + 1);
                        currentNode = nodeInPath;
                        renderView(currentNode); updateBreadcrumb();
                    }, 'backward');
                    if (isMobile()) window.history.pushState({ path: pathStack.map(n => n.getAttribute('guid')), modalOpen: false }, '', window.location.href);
                });
            }
            breadcrumbEl.appendChild(link);
        }
    });

    // If currentNode is deeper than the pathStack (e.g. a prompt under a folder in pathStack)
    const isAtHome = pathStack.length === 0 && currentNode === xmlData.documentElement;
    if (!isAtHome && (pathStack.length === 0 || currentNode !== pathStack[pathStack.length - 1])) {
         const currentNodeValue = currentNode.getAttribute('value');
         if (pathStack.length > 0) { // Add separator only if not direct child of Home
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            separator.style.opacity = '0.7';
            breadcrumbEl.appendChild(separator);
         }
         const currentSpan = document.createElement('span');
         currentSpan.textContent = currentNodeValue;
         currentSpan.classList.add('current-level-active');
         breadcrumbEl.appendChild(currentSpan);
    }


    const isModalVisible = modalEl.classList.contains('visible');
    fixedBackBtn.classList.toggle('hidden', (pathStack.length === 0 && currentNode === xmlData.documentElement) && !isModalVisible);
    if(mobileBackBtn) mobileBackBtn.classList.toggle('hidden', (pathStack.length === 0 && currentNode === xmlData.documentElement) && !isModalVisible);
    topbarBackBtn.style.visibility = ((pathStack.length === 0 && currentNode === xmlData.documentElement) && !isModalVisible) ? 'hidden' : 'visible';
}

function openModal(node, calledFromPopstate = false) {
    promptFullTextEl.textContent = node.getAttribute('beschreibung') || '';
    modalEl.classList.remove('hidden'); // Remove hidden first for transition
    requestAnimationFrame(() => {
         requestAnimationFrame(() => { // Ensure display:flex is applied before visible
            modalEl.classList.add('visible');
         });
    });

    if (isMobile() && !calledFromPopstate) {
        const currentState = window.history.state || { path: pathStack.map(n => n.getAttribute('guid')), modalOpen: false };
        if (!currentState.modalOpen) {
            const currentPathGuidsForModal = pathStack.map(n => n.getAttribute('guid'));
            // For modal, path should represent the folder containing the prompt, and prompt's GUID for identification
            const nodeGuid = node.getAttribute('guid');
            const modalStatePath = nodeGuid ? [...currentPathGuidsForModal, nodeGuid] : currentPathGuidsForModal;

            window.history.pushState({ path: modalStatePath, modalOpen: true, promptGuid: nodeGuid }, '', window.location.href);
        }
    }
    updateBreadcrumb(); // Update button visibility related to modal state
}

function closeModal(calledFromPopstate = false) {
    modalEl.classList.remove('visible');
    setTimeout(() => { modalEl.classList.add('hidden'); }, 300);

    if (isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
        window.history.back();
    } else if (!calledFromPopstate) {
         setTimeout(updateBreadcrumb, 10);
    } else {
        updateBreadcrumb();
    }
}

function copyPromptText(buttonElement = null) { copyToClipboard(promptFullTextEl.textContent, document.getElementById('copy-prompt-modal-button')); }
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
        // Future: Add an error icon, e.g., an "X" or "!"
        // For now, it will be a text-only notification or styled by .error class
    }

    const textNode = document.createElement('span');
    textNode.textContent = message;
    notificationEl.appendChild(textNode);

    notificationAreaEl.appendChild(notificationEl);
    
    void notificationEl.offsetWidth;
    // The 'show' class is not strictly needed if slideInFromRight animation auto-plays on append due to 'opacity:0' initial state
    // notificationEl.classList.add('show'); 

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
