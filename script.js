document.addEventListener('DOMContentLoaded', initApp);

let xmlData = null;
let currentNode = null;
let pathStack = [];
const currentXmlFile = "Templates.xml";

let modalEl, breadcrumbEl, containerEl, promptFullTextEl, notificationAreaEl;
let topBarEl, topbarBackBtn, fixedBackBtn, fullscreenBtn, fullscreenEnterIcon, fullscreenExitIcon, themeToggleButton;
let mobileNavEl, mobileHomeBtn, mobileBackBtn;

let svgTemplateFolder, svgTemplateExpand, svgTemplateCopy, svgTemplateCheckmark;

let cardObserver;

let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
const swipeThreshold = 50;
const swipeFeedbackThreshold = 5;

const MAX_ROTATION = 8;
let currentTransitionDurationMediumMs = 250; // Default, updated from CSS

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
    themeToggleButton = document.getElementById('theme-toggle-button');

    if (fullscreenBtn) {
        fullscreenEnterIcon = fullscreenBtn.querySelector('.icon-fullscreen-enter');
        fullscreenExitIcon = fullscreenBtn.querySelector('.icon-fullscreen-exit');
    }
    mobileNavEl = document.getElementById('mobile-nav');

    svgTemplateFolder = document.getElementById('svg-template-folder');
    svgTemplateExpand = document.getElementById('svg-template-expand');
    svgTemplateCopy = document.getElementById('svg-template-copy');
    svgTemplateCheckmark = document.getElementById('svg-template-checkmark');

    updateDynamicDurations();
    setupTheme();
    setupIntersectionObserver();
    setupEventListeners();
    checkFullscreenSupport();

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
        currentTransitionDurationMediumMs = 250; // Fallback
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
            // Fallback if CSS var not ready or accessible
            metaThemeColor.setAttribute("content", themeName === 'dark' ? "#050505" : "#f0f0f0");
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
    const copyModalButton = document.getElementById('copy-prompt-modal-button');
    if (copyModalButton) {
      copyModalButton.addEventListener('click', () => copyPromptText(copyModalButton));
    }
    
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) { // Click on backdrop
            e.stopPropagation(); 
            closeModal();
        }
    });

    containerEl.addEventListener('click', handleCardContainerClick);
}

function setupMobileSpecificFeatures() {
    document.body.classList.add('mobile');
    if (mobileNavEl) mobileNavEl.classList.remove('hidden');
    mobileHomeBtn = document.getElementById('mobile-home');
    mobileBackBtn = document.getElementById('mobile-back');

    if (mobileHomeBtn) {
        mobileHomeBtn.addEventListener('click', () => {
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
    }

    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', () => {
            if (modalEl.classList.contains('visible')) {
                closeModal();
            } else if (pathStack.length > 0) {
                navigateHistory('backward');
            }
        });
    }

    containerEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    containerEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    window.history.replaceState({ path: [], modalOpen: false }, '', window.location.href);
    window.onpopstate = handlePopState;
}

function handleCardContainerClick(e) {
    // If modal is visible, or if the click originated from within the modal content area, do nothing here.
    // The modal's own backdrop click listener (with stopPropagation) and button listeners will handle modal interactions.
    if (modalEl.classList.contains('visible') || e.target.closest('.modal-content')) {
        return; 
    }

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
    } else if (e.target === containerEl && pathStack.length > 0 ) { // Removed !modalEl.classList.contains('visible') as it's handled above
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
        let moveX = Math.min(diffX - swipeFeedbackThreshold, window.innerWidth * 0.15);
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
    const state = event.state || { path: [], modalOpen: false };
    const currentlyModalOpen = modalEl.classList.contains('visible');
    const direction = state.path.length < pathStack.length ? 'backward' : 'forward';

    if (currentlyModalOpen && !state.modalOpen) {
        closeModal(true);
    } else if (!currentlyModalOpen && state.modalOpen) {
        const promptGuidForModal = state.promptGuid;
        const nodeToOpen = promptGuidForModal ? findNodeByGuid(xmlData.documentElement, promptGuidForModal) : null;
        
        if (nodeToOpen && nodeToOpen.getAttribute('beschreibung')) {
            pathStack = state.path.map(guid => findNodeByGuid(xmlData.documentElement, guid)).filter(Boolean);
            // If promptGuid was part of state.path (it should be for modalOpen state),
            // pathStack for the underlying view should not include it.
            if (state.path.length > 0 && pathStack.length > 0 && pathStack[pathStack.length-1].getAttribute('guid') === promptGuidForModal) {
                 pathStack.pop(); // Remove prompt from path for background view context
            }
            currentNode = pathStack.length > 0 ? pathStack[pathStack.length-1] : xmlData.documentElement;
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
        if(pathStack.length !== targetPathLength && state.path.length > 0) {
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
                duration: 0.5, 
                ease: "expo.out", 
                stagger: {
                    each: 0.05, 
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
    if (!svgElement || !parentElement.classList.contains('folder-card')) return;

    const vivusInstance = new Vivus(svgId, { type: 'delayed', duration: 120, start: 'manual' });
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
        const isFolder = Array.from(node.children).some(child => child.tagName === 'TreeViewNode');
        let nodeGuid = node.getAttribute('guid');
        if (!nodeGuid) {
            nodeGuid = `genid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
    if (cardsToObserve.length > 0) {
        cardsToObserve.forEach(c => cardObserver.observe(c));
    }
    if(childNodes.length > 0) containerEl.scrollTop = currentScroll;
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
        if (currentNode !== node) { // Avoid pushing same node if already current by chance
            pathStack.push(currentNode);
        }
        currentNode = node;
        renderView(currentNode);
        updateBreadcrumb();
    }, 'forward');

    if (isMobile() && !modalEl.classList.contains('visible')) {
         let historyPath = pathStack.map(n => n.getAttribute('guid'));
         if (currentNode && currentNode !== xmlData.documentElement) { // Ensure currentNode is valid and not root
             historyPath.push(currentNode.getAttribute('guid'));
         }
         window.history.pushState({ path: historyPath, modalOpen: false }, '', window.location.href);
     }
}

function updateBreadcrumb() {
    breadcrumbEl.innerHTML = '';
    if (!xmlData || !xmlData.documentElement) return;

    const homeLink = document.createElement('span');
    homeLink.textContent = 'Home';
    
    // Function to clear active classes to ensure only one is active
    const clearAllActiveBreadcrumbs = () => {
        const allActive = breadcrumbEl.querySelectorAll('.current-level-active');
        allActive.forEach(el => {
            el.classList.remove('current-level-active');
            // If it was 'Home' and now not active, make it a link again
            if (el === homeLink && !homeLink.classList.contains('breadcrumb-link')) {
                 homeLink.classList.add('breadcrumb-link');
            }
        });
    };

    clearAllActiveBreadcrumbs();

    if (pathStack.length === 0 && currentNode === xmlData.documentElement) {
        homeLink.classList.add('current-level-active');
        homeLink.classList.remove('breadcrumb-link'); // Not a link when active
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
            breadcrumbEl.appendChild(separator);

            const link = document.createElement('span');
            link.textContent = nodeValue;

            if (nodeInPath === currentNode) { // This specific node in path IS the current view
                clearAllActiveBreadcrumbs();
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
    
    // If currentNode is a leaf (prompt) not in pathStack itself, but its parent is the last in pathStack
    const isAtHome = pathStack.length === 0 && currentNode === xmlData.documentElement;
    const parentOfCurrentNode = pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;

    if (!isAtHome && currentNode !== parentOfCurrentNode && currentNode !== xmlData.documentElement) {
        clearAllActiveBreadcrumbs(); // Clear any active links from pathStack iteration
        if (pathStack.length > 0 || (pathStack.length === 0 && currentNode !== xmlData.documentElement )) { // Add separator if not direct child of Home
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            breadcrumbEl.appendChild(separator);
        }
         const currentSpan = document.createElement('span');
         currentSpan.textContent = currentNode.getAttribute('value');
         currentSpan.classList.add('current-level-active');
         breadcrumbEl.appendChild(currentSpan);
    }


    const isModalVisible = modalEl.classList.contains('visible');
    const isTrulyAtHome = pathStack.length === 0 && currentNode === xmlData.documentElement;
    fixedBackBtn.classList.toggle('hidden', isTrulyAtHome && !isModalVisible);
    if(mobileBackBtn) mobileBackBtn.classList.toggle('hidden', isTrulyAtHome && !isModalVisible);
    topbarBackBtn.style.visibility = (isTrulyAtHome && !isModalVisible) ? 'hidden' : 'visible';
}


function openModal(node, calledFromPopstate = false) {
    promptFullTextEl.textContent = node.getAttribute('beschreibung') || '';
    modalEl.classList.remove('hidden');
    requestAnimationFrame(() => {
         requestAnimationFrame(() => { // Double RAF for some browser layout timings
            modalEl.classList.add('visible');
         });
    });

    if (isMobile() && !calledFromPopstate) {
        const currentState = window.history.state || { path: [], modalOpen: false };
        if (!currentState.modalOpen) {
            // For modal, path should be the current view's path (folders leading to this view)
            // And promptGuid is the specific prompt being opened.
            const currentViewPathGuids = pathStack.map(n => n.getAttribute('guid'));
            // If current node is a folder, its guid is already the last in pathStack
            // If current node is a prompt, pathStack refers to its parent.
            // So, currentViewPathGuids is correct as the background view's path.
            const nodeGuid = node.getAttribute('guid');
            window.history.pushState({ path: currentViewPathGuids, modalOpen: true, promptGuid: nodeGuid }, '', window.location.href);
        }
    }
    updateBreadcrumb();
}

function closeModal(calledFromPopstate = false) {
    if (!modalEl.classList.contains('visible')) return;

    modalEl.classList.remove('visible');
    setTimeout(() => {
        modalEl.classList.add('hidden');
    }, currentTransitionDurationMediumMs);

    if (isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
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
function showNotification(message, type = 'info', buttonElement = null) { // buttonElement is not used yet, but kept for future
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
        // Consider adding a specific error icon SVG and appending it
    }

    const textNode = document.createElement('span');
    textNode.textContent = message;
    notificationEl.appendChild(textNode);

    notificationAreaEl.appendChild(notificationEl);
    
    void notificationEl.offsetWidth; // Trigger reflow for CSS animation

    notificationTimeoutId = setTimeout(() => {
        notificationEl.classList.add('fade-out');
        notificationEl.addEventListener('animationend', () => {
            if (notificationEl.parentNode === notificationAreaEl) { // Check if still child before removing
                notificationEl.remove();
            }
        }, { once: true });
        notificationTimeoutId = null;
    }, 2500); // Notification display duration
}
