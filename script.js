document.addEventListener('DOMContentLoaded', initApp);

let xmlData = null;
let currentNode = null;
let pathStack = [];
const currentXmlFile = "Templates.xml";
const localStorageKey = 'customTemplatesXml';
let sortableInstance = null;

let modalEl, breadcrumbEl, containerEl, promptFullTextEl, notificationAreaEl, promptTitleInputEl;
let topBarEl, topbarBackBtn, fixedBackBtn, fullscreenBtn, fullscreenEnterIcon, fullscreenExitIcon, themeToggleButton, downloadBtn, resetBtn, addPromptBtn;
let mobileNavEl, mobileHomeBtn, mobileBackBtn;
let modalEditBtn, modalSaveBtn, modalCloseBtn, copyModalButton;

let svgTemplateFolder, svgTemplateExpand, svgTemplateCopy, svgTemplateCheckmark, svgTemplateDelete;

let cardObserver;

let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
const swipeThreshold = 50;
const swipeFeedbackThreshold = 5;

const MAX_ROTATION = 6;
let currentTransitionDurationMediumMs = 300;
let longPressTimer = null;
let isEditMode = false;

function initApp() {
    modalEl = document.getElementById('prompt-modal');
    breadcrumbEl = document.getElementById('breadcrumb');
    containerEl = document.getElementById('cards-container');
    promptFullTextEl = document.getElementById('prompt-fulltext');
    promptTitleInputEl = document.getElementById('prompt-title-input');
    notificationAreaEl = document.getElementById('notification-area');
    topBarEl = document.getElementById('top-bar');
    topbarBackBtn = document.getElementById('topbar-back-button');
    fixedBackBtn = document.getElementById('fixed-back');
    fullscreenBtn = document.getElementById('fullscreen-button');
    themeToggleButton = document.getElementById('theme-toggle-button');
    downloadBtn = document.getElementById('download-button');
    resetBtn = document.getElementById('reset-button');
    addPromptBtn = document.getElementById('add-prompt-button');

    if (fullscreenBtn) {
        fullscreenEnterIcon = fullscreenBtn.querySelector('.icon-fullscreen-enter');
        fullscreenExitIcon = fullscreenBtn.querySelector('.icon-fullscreen-exit');
    }
    mobileNavEl = document.getElementById('mobile-nav');

    modalEditBtn = document.getElementById('modal-edit-button');
    modalSaveBtn = document.getElementById('modal-save-button');
    modalCloseBtn = document.getElementById('modal-close-button');
    copyModalButton = document.getElementById('copy-prompt-modal-button');

    svgTemplateFolder = document.getElementById('svg-template-folder');
    svgTemplateExpand = document.getElementById('svg-template-expand');
    svgTemplateCopy = document.getElementById('svg-template-copy');
    svgTemplateCheckmark = document.getElementById('svg-template-checkmark');
    svgTemplateDelete = document.getElementById('svg-template-delete');


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
        if (isEditMode) {
            toggleEditMode(false);
            return;
        }
        if (modalEl.classList.contains('visible')) {
            closeModal({ fromBackdrop: true });
        } else if (pathStack.length > 0) {
            navigateOneLevelUp();
        }
    });

    fixedBackBtn.addEventListener('click', () => {
        if (isEditMode) {
            toggleEditMode(false);
            return;
        }
        if (modalEl.classList.contains('visible')) {
            closeModal();
        }
        if (pathStack.length > 0 || currentNode !== xmlData.documentElement) {
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

    addPromptBtn.addEventListener('click', openNewPromptModal);
    downloadBtn.addEventListener('click', downloadCustomXml);
    resetBtn.addEventListener('click', resetLocalStorage);

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('mozfullscreenchange', updateFullscreenButton);
        document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    }

    modalCloseBtn.addEventListener('click', () => closeModal());
    
    if (copyModalButton) {
      copyModalButton.addEventListener('click', () => copyPromptText(copyModalButton));
    }

    modalEditBtn.addEventListener('click', () => toggleEditModeInModal(true));
    modalSaveBtn.addEventListener('click', savePromptChanges);

    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
            e.stopPropagation();
            closeModal({ fromBackdrop: true });
        }
    });

    containerEl.addEventListener('click', handleCardContainerClick);
    promptFullTextEl.addEventListener('input', () => adjustTextareaHeight(promptFullTextEl));

    document.body.addEventListener('click', (e) => {
        if (isEditMode && !e.target.closest('.card') && !e.target.closest('.top-bar')) {
            toggleEditMode(false);
        }
    });
}

function initSortable() {
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    sortableInstance = new Sortable(containerEl, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onEnd: (evt) => {
            const newGuidOrder = [...evt.to.children].map(card => card.getAttribute('data-guid'));
            const parentNode = currentNode;

            const fragment = document.createDocumentFragment();
            newGuidOrder.forEach(guid => {
                const nodeToMove = findNodeByGuid(parentNode, guid);
                if (nodeToMove) {
                    fragment.appendChild(nodeToMove);
                }
            });
            
            parentNode.append(fragment);
            
            persistXmlData('Reihenfolge gespeichert!', 'Speichern fehlgeschlagen!');
        }
    });
}

function destroySortable() {
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
}

function setupMobileSpecificFeatures() {
    document.body.classList.add('mobile');
    if (mobileNavEl) mobileNavEl.classList.remove('hidden');
    mobileHomeBtn = document.getElementById('mobile-home');
    mobileBackBtn = document.getElementById('mobile-back');

    if (mobileHomeBtn) {
        mobileHomeBtn.addEventListener('click', () => {
            const modalWasVisible = modalEl.classList.contains('visible');
            if (modalWasVisible) {
                closeModal({ fromBackdrop: true });
            }

            const isCurrentlyAtHome = (currentNode === xmlData.documentElement && pathStack.length === 0);

            if (!isCurrentlyAtHome || modalWasVisible) {
                if (isEditMode) toggleEditMode(false);
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
            if (isEditMode) {
                toggleEditMode(false);
                return;
            }
            if (modalEl.classList.contains('visible')) {
                closeModal({ fromBackdrop: true });
            } else if (pathStack.length > 0) {
                navigateOneLevelUp();
            }
        });
    }

    containerEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    containerEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    window.history.replaceState({ path: [], modalOpen: false }, '', window.location.href);
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

        if (isMobile()) {
            let historyPathGuids = pathStack.map(n => n.getAttribute('guid'));
            window.history.pushState({ path: historyPathGuids, modalOpen: false }, '', window.location.href);
        }
    }, 'backward');
}

function handleCardContainerClick(e) {
    if (modalEl.classList.contains('visible') || e.target.closest('.modal-content')) {
        return;
    }

    const card = e.target.closest('.card');
    const deleteButton = e.target.closest('.delete-button');

    if (deleteButton) {
        e.stopPropagation();
        const guidToDelete = card.getAttribute('data-guid');
        if (confirm('Möchten Sie diese Karte wirklich löschen?')) {
            deleteNodeByGuid(guidToDelete);
        }
        return;
    }
    
    if (isEditMode) return;

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
    } else if (e.target === containerEl && pathStack.length > 0) {
         navigateOneLevelUp();
    }
}

function handleTouchStart(e) {
    const card = e.target.closest('.card');
    if (card) {
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            if (!isEditMode && !modalEl.classList.contains('visible')) {
                toggleEditMode(true);
            }
        }, 500);
    }
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchEndX = touchStartX;
    touchEndY = touchStartY;
}

function handleTouchMove(e) {
    clearTimeout(longPressTimer);
    if (!touchStartX || modalEl.classList.contains('visible') || isEditMode) return;
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
    let diffX = touchEndX - touchStartX;

    if (Math.abs(diffX) > Math.abs(touchEndY - touchStartY) && diffX > swipeFeedbackThreshold) {
        containerEl.classList.add('swiping-right');
        let moveX = Math.min(diffX - swipeFeedbackThreshold, window.innerWidth * 0.1);
        containerEl.style.transform = `translateX(${moveX}px)`;
    } else {
        containerEl.classList.remove('swiping-right');
        containerEl.style.transform = '';
    }
}

function handleTouchEnd() {
    clearTimeout(longPressTimer);
    if (!touchStartX || modalEl.classList.contains('visible')) return;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    containerEl.classList.remove('swiping-right');
    containerEl.style.transform = '';

    if (Math.abs(diffX) > Math.abs(diffY) && diffX > swipeThreshold) {
        if (isEditMode) {
            toggleEditMode(false);
        } else if (pathStack.length > 0) {
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

function checkFullscreenSupport() {
    const support = !!(document.documentElement.requestFullscreen || document.documentElement.mozRequestFullScreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen);
    if (support && fullscreenBtn) {
        document.body.setAttribute('data-fullscreen-supported', 'true');
    } else {
        document.body.removeAttribute('data-fullscreen-supported');
        if(fullscreenBtn) fullscreenBtn.remove();
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
    if(fullscreenBtn) fullscreenBtn.setAttribute('aria-label', isFullscreen ? 'Vollbildmodus beenden' : 'Vollbildmodus aktivieren');
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

function deleteNodeByGuid(guid) {
    const nodeToDelete = findNodeByGuid(xmlData.documentElement, guid);
    if (nodeToDelete && nodeToDelete.parentNode) {
        nodeToDelete.parentNode.removeChild(nodeToDelete);
        persistXmlData('Karte gelöscht!', 'Löschen fehlgeschlagen!');
        renderView(currentNode);
    } else {
        showNotification('Karte nicht gefunden.', 'error');
    }
    toggleEditMode(false);
}

function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function isMobile() {
    let isMobileDevice = false;
    try {
        isMobileDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window || /Mobi|Android/i.test(navigator.userAgent);
    } catch (e) { }
    return isMobileDevice;
}

function setupVivusAnimation(parentElement, svgId) {
    const svgElement = document.getElementById(svgId);
    if (!svgElement || !parentElement.classList.contains('folder-card')) return;

    const vivusInstance = new Vivus(svgId, { type: 'delayed', duration: 100, start: 'manual' });
    vivusInstance.finish();
    svgElement.style.opacity = '1';

    let timeoutId = null;
    let isTouchStarted = false;

    const playAnimation = (immediate = false) => {
        if(isEditMode) return;
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

function processXml(xmlDoc) {
    xmlData = xmlDoc;
    currentNode = xmlData.documentElement;
    pathStack = [];
    performViewTransition(() => {
        renderView(currentNode);
        updateBreadcrumb();
    }, 'initial');
    if (isMobile()) {
        window.history.replaceState({ path: [], modalOpen: false }, '', window.location.href);
    }
}

function loadXmlDocument(filename) {
    const storedXml = localStorage.getItem(localStorageKey);
    if (storedXml) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(storedXml, "application/xml");
            const parserError = xmlDoc.getElementsByTagName("parsererror");
            if (parserError.length > 0) {
                throw new Error("Fehler beim Parsen der lokalen XML-Daten.");
            }
            processXml(xmlDoc);
            downloadBtn.style.display = 'flex';
            resetBtn.style.display = 'flex';
            return;
        } catch (error) {
            console.error("Fehler beim Laden der XML aus dem Local Storage, lade Originaldatei:", error);
            localStorage.removeItem(localStorageKey);
        }
    }
    
    downloadBtn.style.display = 'none';
    resetBtn.style.display = 'none';
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
            processXml(xmlDoc);
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
            nodeGuid = generateGuid();
            node.setAttribute('guid', nodeGuid);
        }
        card.setAttribute('data-guid', nodeGuid);

        const titleElem = document.createElement('h3');
        titleElem.textContent = node.getAttribute('value') || 'Unbenannt';

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('card-content-wrapper');
        contentWrapper.appendChild(titleElem);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-button';
        deleteBtn.setAttribute('aria-label', 'Löschen');
        if (svgTemplateDelete) {
            deleteBtn.appendChild(svgTemplateDelete.cloneNode(true));
        }
        card.appendChild(deleteBtn);

        if (isFolder) {
            card.classList.add('folder-card'); card.setAttribute('data-type', 'folder');
            if (svgTemplateFolder) {
                const folderIconSvg = svgTemplateFolder.cloneNode(true);
                const folderIconId = `icon-folder-${nodeGuid}`;
                folderIconSvg.id = folderIconId;
                contentWrapper.appendChild(folderIconSvg);
                vivusSetups.push({ parent: card, svgId: folderIconId });
            }
        } else {
            card.setAttribute('data-type', 'prompt');
            card.classList.add('prompt-card');
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
        addCardLongPressListener(card);
    });
    
    if (isEditMode) {
        containerEl.classList.add('edit-mode');
        initSortable();
    }


    vivusSetups.forEach(setup => { if (document.body.contains(setup.parent)) setupVivusAnimation(setup.parent, setup.svgId); });
    if (cardsToObserve.length > 0) {
        cardsToObserve.forEach(c => cardObserver.observe(c));
    }
    if(childNodes.length > 0) {
        containerEl.scrollTop = currentScroll;
        adjustCardHeights();
    } else if (childNodes.length === 0 && containerEl.innerHTML === '') {
        containerEl.innerHTML = '<p style="text-align:center; padding:2rem; opacity:0.7;">Dieser Ordner ist leer.</p>';
        gsap.to(containerEl.firstChild, {opacity: 1, duration: 0.5});
    }
}

function adjustCardHeights() {
    const allCards = Array.from(containerEl.querySelectorAll('.card'));
    if (allCards.length === 0) return;

    let targetHeight = 190;

    const folderCards = allCards.filter(card => card.classList.contains('folder-card'));
    if (folderCards.length > 0) {
        let maxFolderHeight = 0;
        folderCards.forEach(card => {
            card.style.height = '';
            if (card.offsetHeight > maxFolderHeight) {
                maxFolderHeight = card.offsetHeight;
            }
        });
        targetHeight = Math.max(targetHeight, maxFolderHeight);
    }

    const promptCards = allCards.filter(card => card.classList.contains('prompt-card'));
     if (promptCards.length > 0 && folderCards.length === 0) {
    }

    allCards.forEach(card => {
        card.style.height = `${targetHeight}px`;
    });
}


function addCard3DHoverEffect(card) {
    let frameRequested = false;
    card.addEventListener('mousemove', (e) => {
        if (frameRequested || isMobile() || isEditMode) return;
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
        if(isMobile() || isEditMode) return;
        requestAnimationFrame(() => {
            card.style.setProperty('--rotateX', '0deg');
            card.style.setProperty('--rotateY', '0deg');
        });
    });
}

function addCardLongPressListener(card) {
    const startPress = (e) => {
        if ((e.type === 'mousedown' && e.button !== 0)) return;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
             if (!isEditMode && !modalEl.classList.contains('visible')) {
                 toggleEditMode(true);
             }
        }, 500);
    };
    const cancelPress = () => clearTimeout(longPressTimer);

    card.addEventListener('mousedown', startPress);
    card.addEventListener('mouseup', cancelPress);
    card.addEventListener('mouseleave', cancelPress);
    card.addEventListener('touchstart', startPress, { passive: true });
    card.addEventListener('touchend', cancelPress);
    card.addEventListener('touchcancel', cancelPress);
}


function navigateToNode(node) {
    if (isEditMode) return;
    performViewTransition(() => {
        if (currentNode !== node) {
            pathStack.push(currentNode);
        }
        currentNode = node;
        renderView(currentNode);
        updateBreadcrumb();
    }, 'forward');

    if (isMobile() && !modalEl.classList.contains('visible')) {
         let historyPath = pathStack.map(n => n.getAttribute('guid'));
         if (currentNode && currentNode !== xmlData.documentElement) {
             historyPath.push(currentNode.getAttribute('guid'));
         }
         window.history.pushState({ path: historyPath, modalOpen: false }, '', window.location.href);
     }
}

function updateBreadcrumb() {
    breadcrumbEl.innerHTML = '';
    if (!xmlData || !xmlData.documentElement) return;

    const homeLink = document.createElement('span');
    homeLink.textContent = isEditMode ? 'Bearbeitung beenden' : 'Home';

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

    if (pathStack.length === 0 && currentNode === xmlData.documentElement) {
        if (!isEditMode) {
            homeLink.classList.add('current-level-active');
            homeLink.classList.remove('breadcrumb-link');
        } else {
            homeLink.classList.add('breadcrumb-link');
            homeLink.addEventListener('click', () => toggleEditMode(false));
        }
    } else {
        homeLink.classList.add('breadcrumb-link');
        homeLink.addEventListener('click', () => {
            if (isEditMode) toggleEditMode(false);
            if (modalEl.classList.contains('visible')) closeModal({ fromBackdrop: false });
            performViewTransition(() => {
                currentNode = xmlData.documentElement; pathStack = [];
                renderView(currentNode); updateBreadcrumb();
            }, 'backward');
            if (isMobile()) window.history.pushState({ path: [], modalOpen: false }, '', window.location.href);
        });
    }
    breadcrumbEl.appendChild(homeLink);

    if (!isEditMode) {
        pathStack.forEach((nodeInPath, index) => {
            const nodeValue = nodeInPath.getAttribute('value');
            if (nodeValue) {
                const separator = document.createElement('span');
                separator.textContent = ' > ';
                breadcrumbEl.appendChild(separator);

                const link = document.createElement('span');
                link.textContent = nodeValue;

                if (nodeInPath === currentNode) {
                    clearAllActiveBreadcrumbs();
                    link.classList.add('current-level-active');
                } else {
                    link.classList.add('breadcrumb-link');
                    link.addEventListener('click', () => {
                        if (isEditMode) toggleEditMode(false);
                        if (modalEl.classList.contains('visible')) closeModal({ fromBackdrop: false });
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

        const isAtHome = pathStack.length === 0 && currentNode === xmlData.documentElement;
        const parentOfCurrentNode = pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;

        if (!isAtHome && currentNode !== parentOfCurrentNode && currentNode !== xmlData.documentElement) {
            clearAllActiveBreadcrumbs();
            if (pathStack.length > 0 || (pathStack.length === 0 && currentNode !== xmlData.documentElement )) {
                const separator = document.createElement('span');
                separator.textContent = ' > ';
                breadcrumbEl.appendChild(separator);
            }
             const currentSpan = document.createElement('span');
             currentSpan.textContent = currentNode.getAttribute('value');
             currentSpan.classList.add('current-level-active');
             breadcrumbEl.appendChild(currentSpan);
        }
    }
    
    addPromptBtn.style.display = (isEditMode || (currentNode !== xmlData.documentElement && !Array.from(currentNode.children).some(child => child.tagName === 'TreeViewNode'))) ? 'none' : 'flex';

    const isModalVisible = modalEl.classList.contains('visible');
    const isTrulyAtHome = pathStack.length === 0 && currentNode === xmlData.documentElement;
    
    const showFixedBack = !isTrulyAtHome || isModalVisible || isEditMode;
    fixedBackBtn.classList.toggle('hidden', !showFixedBack);

    if(mobileBackBtn) {
        const showMobileBack = !isTrulyAtHome || isModalVisible || isEditMode;
        mobileBackBtn.classList.toggle('hidden', !showMobileBack);
    }
    topbarBackBtn.style.visibility = (isTrulyAtHome && !isModalVisible && !isEditMode) ? 'hidden' : 'visible';
}

function adjustTextareaHeight(element) {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}

function openNewPromptModal() {
    modalEl.dataset.mode = 'new';
    
    promptTitleInputEl.value = '';
    promptFullTextEl.value = '';
    promptTitleInputEl.style.display = 'block';

    openModal(null);
    toggleEditModeInModal(true);
    promptTitleInputEl.focus();
}


function openModal(node, calledFromPopstate = false) {
    if (node) {
        const guid = node.getAttribute('guid');
        modalEl.setAttribute('data-guid', guid);
        promptTitleInputEl.value = node.getAttribute('value');
        promptFullTextEl.value = node.getAttribute('beschreibung') || '';
    } else {
        promptTitleInputEl.value = '';
        promptFullTextEl.value = '';
    }
    toggleEditModeInModal(false);

    requestAnimationFrame(() => adjustTextareaHeight(promptFullTextEl));

    modalEl.classList.remove('hidden');
    requestAnimationFrame(() => {
         requestAnimationFrame(() => {
            modalEl.classList.add('visible');
         });
    });

    if (isMobile() && !calledFromPopstate && node) {
        const currentState = window.history.state || { path: [], modalOpen: false };
        if (!currentState.modalOpen) {
            const currentViewPathGuids = pathStack.map(n => n.getAttribute('guid'));
            window.history.pushState({ path: currentViewPathGuids, modalOpen: true, promptGuid: node.getAttribute('guid') }, '', window.location.href);
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

    if (promptFullTextEl.classList.contains('is-editing')) {
        toggleEditModeInModal(false);
    }

    modalEl.classList.remove('visible');
    setTimeout(() => {
        modalEl.classList.add('hidden');
        modalEl.removeAttribute('data-guid');
        modalEl.removeAttribute('data-mode');
        promptTitleInputEl.style.display = 'none';
        promptFullTextEl.style.height = 'auto';
    }, currentTransitionDurationMediumMs);

    if (fromBackdrop) {
        if (isMobile() && window.history.state?.modalOpen && !calledFromPopstate) {
            const LrpmtGuid = window.history.state.promptGuid;
            window.history.replaceState({
                path: window.history.state.path,
                modalOpen: false,
                promptGuid: LrpmtGuid
            }, '', window.location.href);
        }
        updateBreadcrumb();
    } else if (isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
        window.history.back();
    } else {
        updateBreadcrumb();
    }
}

function toggleEditMode(enable) {
    if (isEditMode === enable) return;
    isEditMode = enable;
    containerEl.classList.toggle('edit-mode', enable);

    if (enable) {
        initSortable();
    } else {
        destroySortable();
    }
    updateBreadcrumb();
}


function toggleEditModeInModal(isEditing) {
    promptFullTextEl.classList.toggle('is-editing', isEditing);
    promptFullTextEl.readOnly = !isEditing;
    
    promptTitleInputEl.classList.toggle('is-editing', isEditing);
    promptTitleInputEl.readOnly = !isEditing;

    modalEditBtn.classList.toggle('hidden', isEditing);
    modalSaveBtn.classList.toggle('hidden', !isEditing);
    copyModalButton.classList.toggle('hidden', isEditing);
    
    const isNewMode = modalEl.dataset.mode === 'new';
    promptTitleInputEl.style.display = 'block';

    if (isEditing) {
        if (!isNewMode) {
            promptFullTextEl.focus();
            const textLength = promptFullTextEl.value.length;
            promptFullTextEl.setSelectionRange(textLength, textLength);
        } else {
            promptTitleInputEl.focus();
        }
    }
    adjustTextareaHeight(promptFullTextEl);
}

function savePromptChanges() {
    const mode = modalEl.dataset.mode;
    
    if (mode === 'new') {
        const title = promptTitleInputEl.value.trim();
        if (!title) {
            showNotification('Der Titel darf nicht leer sein.', 'error');
            promptTitleInputEl.focus();
            return;
        }

        const newPromptNode = xmlData.createElement('TreeViewNode');
        const newGuid = generateGuid();
        newPromptNode.setAttribute('guid', newGuid);
        newPromptNode.setAttribute('value', title);
        newPromptNode.setAttribute('beschreibung', promptFullTextEl.value);
        newPromptNode.setAttribute('image', '1');

        currentNode.appendChild(newPromptNode);
        
        persistXmlData('Prompt hinzugefügt!', 'Hinzufügen fehlgeschlagen!');
        renderView(currentNode);
        closeModal();

    } else { 
        const guid = modalEl.getAttribute('data-guid');
        if (!guid || !xmlData) return;
        const nodeToUpdate = findNodeByGuid(xmlData.documentElement, guid);
        if (nodeToUpdate) {
            nodeToUpdate.setAttribute('value', promptTitleInputEl.value.trim());
            nodeToUpdate.setAttribute('beschreibung', promptFullTextEl.value);
            persistXmlData('Prompt gespeichert!', 'Speichern fehlgeschlagen!');
            renderView(currentNode);
        }
        closeModal();
    }
}


function persistXmlData(successMsg, errorMsg) {
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlData);
    
    try {
        localStorage.setItem(localStorageKey, xmlString);
        showNotification(successMsg, 'success');
        if (downloadBtn) {
            downloadBtn.style.display = 'flex';
            resetBtn.style.display = 'flex';
        }
    } catch (e) {
        console.error("Fehler beim Speichern im Local Storage:", e);
        showNotification(errorMsg, 'error');
    }
}


function downloadCustomXml() {
    const xmlString = localStorage.getItem(localStorageKey);
    if (!xmlString) {
        showNotification('Keine Änderungen zum Herunterladen vorhanden.', 'info');
        return;
    }

    const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Templates_modified.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetLocalStorage() {
    if (isEditMode) toggleEditMode(false);
    const confirmation = confirm("Möchten Sie wirklich alle lokalen Änderungen verwerfen und die originalen Vorlagen laden? Alle nicht heruntergeladenen Anpassungen gehen dabei verloren.");
    if (confirmation) {
        localStorage.removeItem(localStorageKey);
        showNotification('Änderungen zurückgesetzt. Lade neu...', 'info');
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

function copyPromptText(buttonElement = null) { copyToClipboard(promptFullTextEl.value, buttonElement || document.getElementById('copy-prompt-modal-button')); }
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
