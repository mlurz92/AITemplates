document.addEventListener('DOMContentLoaded', initApp);

let jsonData = null;
let currentNode = null;
let pathStack = [];
const currentJsonFile = "templates.json";
const localStorageKey = 'customTemplatesJson';

let modalEl, breadcrumbEl, containerEl, promptFullTextEl, notificationAreaEl, promptTitleInputEl;
let topBarEl, topbarBackBtn, fixedBackBtn, fullscreenBtn, fullscreenEnterIcon, fullscreenExitIcon, themeToggleButton, downloadBtn, resetBtn, addPromptBtn, organizeBtn, organizeIcon, doneIcon;
let mobileNavEl, mobileHomeBtn, mobileBackBtn;
let modalEditBtn, modalSaveBtn, modalCloseBtn, copyModalButton;

let svgTemplateFolder, svgTemplateExpand, svgTemplateCopy, svgTemplateCheckmark, svgTemplateDelete, svgTemplateEdit, svgTemplateRename;

let cardObserver;
let sortableInstance = null;
let contextMenu = null;
let dragOverlay = null;
let dragIndicator = null;
let dragSource = null;
let dragTarget = null;

let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
const swipeThreshold = 50;
const swipeFeedbackThreshold = 5;

const MAX_ROTATION = 6;
let currentTransitionDurationMediumMs = 300;

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
    organizeBtn = document.getElementById('organize-button');

    if (fullscreenBtn) {
        fullscreenEnterIcon = fullscreenBtn.querySelector('.icon-fullscreen-enter');
        fullscreenExitIcon = fullscreenBtn.querySelector('.icon-fullscreen-exit');
    }
    if (organizeBtn) {
        organizeIcon = organizeBtn.querySelector('.icon-organize');
        doneIcon = organizeBtn.querySelector('.icon-done');
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
    createContextMenu();
    createDragOverlay();

    if (isMobile()) {
        setupMobileSpecificFeatures();
    }

    loadJsonData(currentJsonFile);
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

function createContextMenu() {
    contextMenu = document.createElement('div');
    contextMenu.classList.add('context-menu');
    contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="rename">
            <svg class="icon icon-edit" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Umbenennen
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="delete">
            <svg class="icon icon-delete" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            Löschen
        </div>
    `;
    document.body.appendChild(contextMenu);
    
    contextMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.context-menu-item');
        if (!menuItem) return;
        
        const action = menuItem.getAttribute('data-action');
        const cardId = contextMenu.getAttribute('data-card-id');
        const card = document.querySelector(`.card[data-id="${cardId}"]`);
        
        if (action === 'rename') {
            startRenamingCard(card);
        } else if (action === 'delete') {
            handleDeleteClick(cardId, card);
        }
        
        hideContextMenu();
    });
}

function createDragOverlay() {
    dragOverlay = document.createElement('div');
    dragOverlay.classList.add('drag-overlay');
    
    dragIndicator = document.createElement('div');
    dragIndicator.classList.add('drag-indicator');
    dragOverlay.appendChild(dragIndicator);
    
    document.body.appendChild(dragOverlay);
}

function showContextMenu(x, y, cardId) {
    contextMenu.setAttribute('data-card-id', cardId);
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.add('visible');
    
    const hideMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
            document.removeEventListener('click', hideMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', hideMenu);
    }, 10);
}

function hideContextMenu() {
    contextMenu.classList.remove('visible');
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
        exitOrganizeMode();
        if (modalEl.classList.contains('visible')) {
            closeModal();
        }
        if (pathStack.length > 0 || currentNode !== jsonData) {
            performViewTransition(() => {
                currentNode = jsonData;
                pathStack = [];
                renderView(currentNode);
                updateBreadcrumb();
            }, 'backward');
            if (isMobile()) {
                 window.history.pushState({ path: [], modalOpen: false }, '', window.location.href);
            }
        }
    });

    organizeBtn.addEventListener('click', toggleOrganizeMode);
    addPromptBtn.addEventListener('click', openNewPromptModal);
    downloadBtn.addEventListener('click', downloadCustomJson);
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

    modalEditBtn.addEventListener('click', () => toggleEditMode(true));
    modalSaveBtn.addEventListener('click', savePromptChanges);

    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
            e.stopPropagation();
            closeModal({ fromBackdrop: true });
        }
    });

    containerEl.addEventListener('click', handleCardContainerClick);
    containerEl.addEventListener('contextmenu', handleContextMenu);
    containerEl.addEventListener('dragstart', handleDragStart);
    containerEl.addEventListener('dragover', handleDragOver);
    containerEl.addEventListener('dragenter', handleDragEnter);
    containerEl.addEventListener('dragleave', handleDragLeave);
    containerEl.addEventListener('drop', handleDrop);
    containerEl.addEventListener('dragend', handleDragEnd);
    promptFullTextEl.addEventListener('input', () => adjustTextareaHeight(promptFullTextEl));
    
    document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {
    if (e.key === 'Escape') {
        if (contextMenu.classList.contains('visible')) {
            hideContextMenu();
        } else if (document.activeElement.classList.contains('rename-input')) {
            exitRenameMode(document.activeElement.closest('.card'));
        }
    }
}

function handleContextMenu(e) {
    if (modalEl.classList.contains('visible') || containerEl.classList.contains('edit-mode')) {
        return;
    }
    
    const card = e.target.closest('.card');
    if (!card) return;
    
    e.preventDefault();
    
    const id = card.getAttribute('data-id');
    showContextMenu(e.pageX, e.pageY, id);
}

function handleDragStart(e) {
    if (!containerEl.classList.contains('edit-mode') || !e.target.closest('.card')) {
        e.preventDefault();
        return;
    }
    
    const card = e.target.closest('.card');
    dragSource = card;
    
    e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
    e.dataTransfer.effectAllowed = 'move';
    
    setTimeout(() => {
        card.classList.add('dragging');
    }, 0);
}

function handleDragOver(e) {
    if (!containerEl.classList.contains('edit-mode')) {
        return;
    }
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const card = e.target.closest('.card');
    if (card && card !== dragSource) {
        dragTarget = card;
        
        const rect = card.getBoundingClientRect();
        const verticalMiddle = rect.top + rect.height / 2;
        
        if (e.clientY > verticalMiddle) {
            dragIndicator.style.top = `${rect.bottom}px`;
            dragIndicator.style.left = `${rect.left}px`;
            dragIndicator.style.width = `${rect.width}px`;
            dragIndicator.style.height = '4px';
        } else {
            dragIndicator.style.top = `${rect.top}px`;
            dragIndicator.style.left = `${rect.left}px`;
            dragIndicator.style.width = `${rect.width}px`;
            dragIndicator.style.height = '4px';
        }
        
        dragIndicator.classList.add('visible');
    } else if (e.target === containerEl) {
        dragTarget = containerEl;
        
        const rect = containerEl.getBoundingClientRect();
        dragIndicator.style.top = `${rect.bottom - 20}px`;
        dragIndicator.style.left = `${rect.left}px`;
        dragIndicator.style.width = `${rect.width}px`;
        dragIndicator.style.height = '4px';
        dragIndicator.classList.add('visible');
    }
}

function handleDragEnter(e) {
    if (!containerEl.classList.contains('edit-mode')) {
        return;
    }
    
    e.preventDefault();
}

function handleDragLeave(e) {
    if (!containerEl.classList.contains('edit-mode')) {
        return;
    }
    
    if (!e.currentTarget.contains(e.relatedTarget)) {
        dragIndicator.classList.remove('visible');
        dragTarget = null;
    }
}

function handleDrop(e) {
    if (!containerEl.classList.contains('edit-mode')) {
        return;
    }
    
    e.preventDefault();
    dragIndicator.classList.remove('visible');
    
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    
    const sourceNode = findNodeById(jsonData, id);
    if (!sourceNode) return;
    
    let targetParent = currentNode;
    let targetIndex = -1;
    
    if (dragTarget && dragTarget !== containerEl) {
        const targetId = dragTarget.getAttribute('data-id');
        const targetNode = findNodeById(jsonData, targetId);
        
        if (targetNode && targetNode.type === 'folder') {
            targetParent = targetNode;
        } else {
            targetParent = findParentOfNode(targetId);
        }
        
        const rect = dragTarget.getBoundingClientRect();
        const verticalMiddle = rect.top + rect.height / 2;
        targetIndex = Array.from(targetParent.items || []).findIndex(item => item.id === targetId);
        
        if (e.clientY > verticalMiddle) {
            targetIndex += 1;
        }
    }
    
    if (targetParent && sourceNode !== targetParent) {
        const sourceParent = findParentOfNode(id);
        if (sourceParent && sourceParent.items) {
            const sourceIndex = sourceParent.items.findIndex(item => item.id === id);
            if (sourceIndex > -1) {
                sourceParent.items.splice(sourceIndex, 1);
            }
        }
        
        if (!targetParent.items) {
            targetParent.items = [];
        }
        
        if (targetIndex > -1) {
            targetParent.items.splice(targetIndex, 0, sourceNode);
        } else {
            targetParent.items.push(sourceNode);
        }
        
        persistJsonData('Element verschoben!', 'Verschieben fehlgeschlagen!');
        renderView(currentNode);
    }
    
    dragSource.classList.remove('dragging');
    dragSource = null;
    dragTarget = null;
}

function handleDragEnd(e) {
    dragIndicator.classList.remove('visible');
    if (dragSource) {
        dragSource.classList.remove('dragging');
    }
    dragSource = null;
    dragTarget = null;
}

function setupMobileSpecificFeatures() {
    document.body.classList.add('mobile');
    if (mobileNavEl) mobileNavEl.classList.remove('hidden');
    mobileHomeBtn = document.getElementById('mobile-home');
    mobileBackBtn = document.getElementById('mobile-back');

    if (mobileHomeBtn) {
        mobileHomeBtn.addEventListener('click', () => {
            exitOrganizeMode();
            const modalWasVisible = modalEl.classList.contains('visible');
            if (modalWasVisible) {
                closeModal({ fromBackdrop: true });
            }

            const isCurrentlyAtHome = (currentNode === jsonData && pathStack.length === 0);

            if (!isCurrentlyAtHome || modalWasVisible) {
                performViewTransition(() => {
                    currentNode = jsonData;
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
    exitOrganizeMode();
    performViewTransition(() => {
        const parentNode = pathStack.pop();
        currentNode = parentNode;
        renderView(currentNode);
        updateBreadcrumb();

        if (isMobile()) {
            let historyPathIds = pathStack.map(n => n.id);
            window.history.pushState({ path: historyPathIds, modalOpen: false }, '', window.location.href);
        }
    }, 'backward');
}

function findParentOfNode(targetId, startNode = jsonData) {
    if (!startNode.items) return null;

    for (const child of startNode.items) {
        if (child.id === targetId) {
            return startNode;
        }
        if (child.type === 'folder') {
            const foundParent = findParentOfNode(targetId, child);
            if (foundParent) return foundParent;
        }
    }
    return null;
}

function handleDeleteClick(id, cardElement) {
    const nodeToDelete = findNodeById(jsonData, id);
    if (!nodeToDelete) return;

    const confirmation = confirm(`Möchten Sie "${nodeToDelete.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`);
    if (confirmation) {
        gsap.to(cardElement, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            ease: "expo.in",
            onComplete: () => {
                const parentNode = findParentOfNode(id);
                if (parentNode && parentNode.items) {
                    const index = parentNode.items.findIndex(item => item.id === id);
                    if (index > -1) {
                        parentNode.items.splice(index, 1);
                        persistJsonData('Element gelöscht!', 'Löschen fehlgeschlagen!');
                        renderView(currentNode);
                        updateBreadcrumb();
                    }
                }
            }
        });
    }
}

function startRenamingCard(card) {
    if (!card) return;
    
    const titleElement = card.querySelector('h3');
    if (!titleElement) return;
    
    const originalText = titleElement.textContent;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.classList.add('rename-input');
    
    titleElement.style.display = 'none';
    titleElement.parentNode.insertBefore(input, titleElement);
    
    input.focus();
    input.select();
    
    const finishRename = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== originalText) {
            const id = card.getAttribute('data-id');
            const node = findNodeById(jsonData, id);
            if (node) {
                node.title = newTitle;
                titleElement.textContent = newTitle;
                persistJsonData('Umbenennung gespeichert!', 'Umbenennung fehlgeschlagen!');
            }
        }
        
        exitRenameMode(card);
    };
    
    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishRename();
        }
    });
}

function exitRenameMode(card) {
    const input = card.querySelector('.rename-input');
    const titleElement = card.querySelector('h3');
    
    if (input && titleElement) {
        input.remove();
        titleElement.style.display = 'block';
    }
}

function handleCardContainerClick(e) {
    if (modalEl.classList.contains('visible') || e.target.closest('.modal-content')) {
        return;
    }

    const card = e.target.closest('.card');
    if (!card) {
        if (e.target === containerEl && pathStack.length > 0) {
            navigateOneLevelUp();
        }
        return;
    }

    const button = e.target.closest('button[data-action]');
    
    if (containerEl.classList.contains('edit-mode')) {
        if (button) {
            const action = button.getAttribute('data-action');
            const id = card.getAttribute('data-id');
            
            if (action === 'delete') {
                handleDeleteClick(id, card);
            } else if (action === 'edit') {
                startRenamingCard(card);
            }
        }
        return;
    }

    const id = card.getAttribute('data-id');
    const node = findNodeById(jsonData, id);
    if (!node) return;

    if (button) {
        e.stopPropagation();
        const action = button.getAttribute('data-action');
        if (action === 'expand') openModal(node);
        else if (action === 'copy') copyPromptTextForCard(node, e.target.closest('button'));
    } else {
        if (node.type === 'folder') {
            navigateToNode(node);
        } else if (node.type === 'prompt') {
            openModal(node);
        }
    }
}

function handleTouchStart(e) {
    if(containerEl.classList.contains('edit-mode')) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchEndX = touchStartX;
    touchEndY = touchStartY;
}

function handleTouchMove(e) {
    if (!touchStartX || modalEl.classList.contains('visible') || containerEl.classList.contains('edit-mode')) return;
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
    if (!touchStartX || modalEl.classList.contains('visible') || containerEl.classList.contains('edit-mode')) return;
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
        exitOrganizeMode();
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
    exitOrganizeMode();
    const state = event.state || { path: [], modalOpen: false };
    const currentlyModalOpen = modalEl.classList.contains('visible');
    const direction = state.path.length < pathStack.length ? 'backward' : 'forward';

    if (currentlyModalOpen && !state.modalOpen) {
        closeModal({ fromPopstate: true });
    } else if (!currentlyModalOpen && state.modalOpen) {
        const promptIdForModal = state.promptId;
        const nodeToOpen = promptIdForModal ? findNodeById(jsonData, promptIdForModal) : null;

        if (nodeToOpen && nodeToOpen.type === 'prompt') {
            pathStack = state.path.map(id => findNodeById(jsonData, id)).filter(Boolean);
            if (state.path.length > 0 && pathStack.length > 0 && pathStack[pathStack.length-1].id === promptIdForModal) {
                 pathStack.pop();
            }
            currentNode = pathStack.length > 0 ? pathStack[pathStack.length-1] : jsonData;
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
        pathStack = state.path.map(id => findNodeById(jsonData, id)).filter(Boolean);
        if(pathStack.length !== targetPathLength && state.path.length > 0) {
             pathStack = [];
        } else if (targetPathLength === 0) {
            pathStack = [];
        }
        currentNode = targetPathLength === 0 ? jsonData : pathStack[pathStack.length - 1];
        if (!currentNode && jsonData) currentNode = jsonData;

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

function findNodeById(startNode, targetId) {
    if (!startNode || !targetId) return null;
    if (startNode.id === targetId) return startNode;

    if (startNode.type === 'folder' && startNode.items) {
        for (const child of startNode.items) {
            const found = findNodeById(child, targetId);
            if (found) return found;
        }
    }
    return null;
}

function generateId() {
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

function processJson(data) {
    jsonData = data;
    currentNode = jsonData;
    pathStack = [];
    performViewTransition(() => {
        renderView(currentNode);
        updateBreadcrumb();
    }, 'initial');
    if (isMobile()) {
        window.history.replaceState({ path: [], modalOpen: false }, '', window.location.href);
    }
}

function loadJsonData(filename) {
    const storedJson = localStorage.getItem(localStorageKey);
    if (storedJson) {
        try {
            const parsedData = JSON.parse(storedJson);
            processJson(parsedData);
            downloadBtn.style.display = 'flex';
            resetBtn.style.display = 'flex';
            return;
        } catch (error) {
            console.error("Fehler beim Laden der JSON aus dem Local Storage, lade Originaldatei:", error);
            localStorage.removeItem(localStorageKey);
        }
    }
    
    downloadBtn.style.display = 'none';
    resetBtn.style.display = 'none';
    fetch(filename)
        .then(response => { 
            if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`); 
            return response.json(); 
        })
        .then(data => {
            processJson(data);
        })
        .catch(error => {
            console.error(`Load/Parse Error for ${filename}:`, error);
            containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Fehler beim Laden der Vorlagen: ${error.message}</p>`;
            gsap.to(containerEl, {opacity: 1, duration: 0.3});
        });
}

function renderView(node) {
    exitOrganizeMode();
    const currentScroll = containerEl.scrollTop;
    containerEl.innerHTML = '';
    if (!node) {
         containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Interner Fehler: Ungültiger Knoten.</p>`;
         gsap.to(containerEl, {opacity: 1, duration: 0.3});
         return;
     }

    const childNodes = node.items || [];
    const vivusSetups = [];
    const cardsToObserve = [];

    childNodes.forEach(childNode => {
        const card = document.createElement('div');
        card.classList.add('card');
        
        let nodeId = childNode.id;
        if (!nodeId) {
            nodeId = generateId();
            childNode.id = nodeId;
        }
        card.setAttribute('data-id', nodeId);
        card.setAttribute('data-type', childNode.type);
        card.setAttribute('draggable', 'true');

        if (svgTemplateDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('card-delete-btn');
            deleteBtn.setAttribute('aria-label', 'Element löschen');
            deleteBtn.setAttribute('data-action', 'delete');
            deleteBtn.appendChild(svgTemplateDelete.cloneNode(true));
            card.appendChild(deleteBtn);
        }

        if (svgTemplateEdit) {
            const editBtn = document.createElement('button');
            editBtn.classList.add('card-edit-btn');
            editBtn.setAttribute('aria-label', 'Element umbenennen');
            editBtn.setAttribute('data-action', 'edit');
            editBtn.appendChild(svgTemplateEdit.cloneNode(true));
            card.appendChild(editBtn);
        }

        const titleElem = document.createElement('h3');
        titleElem.textContent = childNode.title || 'Unbenannt';

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('card-content-wrapper');
        contentWrapper.appendChild(titleElem);

        if (childNode.type === 'folder') {
            card.classList.add('folder-card');
            if (svgTemplateFolder) {
                const folderIconSvg = svgTemplateFolder.cloneNode(true);
                const folderIconId = `icon-folder-${nodeId}`;
                folderIconSvg.id = folderIconId;
                contentWrapper.appendChild(folderIconSvg);
                vivusSetups.push({ parent: card, svgId: folderIconId });
            }
        } else {
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
    });

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
        if (frameRequested || isMobile() || containerEl.classList.contains('edit-mode')) return;
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
    exitOrganizeMode();
    performViewTransition(() => {
        if (currentNode !== node) {
            pathStack.push(currentNode);
        }
        currentNode = node;
        renderView(currentNode);
        updateBreadcrumb();
    }, 'forward');

    if (isMobile() && !modalEl.classList.contains('visible')) {
         let historyPath = pathStack.map(n => n.id);
         if (currentNode && currentNode !== jsonData) {
             historyPath.push(currentNode.id);
         }
         window.history.pushState({ path: historyPath, modalOpen: false }, '', window.location.href);
     }
}

function updateBreadcrumb() {
    breadcrumbEl.innerHTML = '';
    if (!jsonData) return;

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

    if (pathStack.length === 0 && currentNode === jsonData) {
        homeLink.classList.add('current-level-active');
        homeLink.classList.remove('breadcrumb-link');
    } else {
        homeLink.classList.add('breadcrumb-link');
        homeLink.addEventListener('click', () => {
            exitOrganizeMode();
            if (modalEl.classList.contains('visible')) closeModal({ fromBackdrop: false });
            performViewTransition(() => {
                currentNode = jsonData; pathStack = [];
                renderView(currentNode); updateBreadcrumb();
            }, 'backward');
            if (isMobile()) window.history.pushState({ path: [], modalOpen: false }, '', window.location.href);
        });
    }
    breadcrumbEl.appendChild(homeLink);

    pathStack.forEach((nodeInPath, index) => {
        const nodeTitle = nodeInPath.title;
        if (nodeTitle && nodeInPath.id !== 'root') {
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            breadcrumbEl.appendChild(separator);

            const link = document.createElement('span');
            link.textContent = nodeTitle;

            if (nodeInPath === currentNode) {
                clearAllActiveBreadcrumbs();
                link.classList.add('current-level-active');
            } else {
                link.classList.add('breadcrumb-link');
                link.addEventListener('click', () => {
                    exitOrganizeMode();
                    if (modalEl.classList.contains('visible')) closeModal({ fromBackdrop: false });
                    performViewTransition(() => {
                        pathStack = pathStack.slice(0, index + 1);
                        currentNode = nodeInPath;
                        renderView(currentNode); updateBreadcrumb();
                    }, 'backward');
                    if (isMobile()) window.history.pushState({ path: pathStack.map(n => n.id), modalOpen: false }, '', window.location.href);
                });
            }
            breadcrumbEl.appendChild(link);
        }
    });

    const isAtHome = pathStack.length === 0 && currentNode === jsonData;
    const parentOfCurrentNode = pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;

    if (!isAtHome && currentNode !== parentOfCurrentNode && currentNode !== jsonData) {
        clearAllActiveBreadcrumbs();
        if (pathStack.length > 0 || (pathStack.length === 0 && currentNode !== jsonData )) {
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            breadcrumbEl.appendChild(separator);
        }
         const currentSpan = document.createElement('span');
         currentSpan.textContent = currentNode.title;
         currentSpan.classList.add('current-level-active');
         breadcrumbEl.appendChild(currentSpan);
    }
    
    addPromptBtn.style.display = (currentNode && currentNode.type === 'folder' && !containerEl.classList.contains('edit-mode')) ? 'flex' : 'none';
    organizeBtn.style.display = (currentNode && currentNode.items && currentNode.items.length > 0) ? 'flex' : 'none';

    const isModalVisible = modalEl.classList.contains('visible');
    const isTrulyAtHome = pathStack.length === 0 && currentNode === jsonData;
    fixedBackBtn.classList.toggle('hidden', isTrulyAtHome && !isModalVisible);
    if(mobileBackBtn) mobileBackBtn.classList.toggle('hidden', isTrulyAtHome && !isModalVisible);
    topbarBackBtn.style.visibility = (isTrulyAtHome && !isModalVisible) ? 'hidden' : 'visible';
}

function adjustTextareaHeight(element) {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}

function openNewPromptModal() {
    exitOrganizeMode();
    modalEl.dataset.mode = 'new';
    
    promptTitleInputEl.value = '';
    promptFullTextEl.value = '';
    promptTitleInputEl.style.display = 'block';

    openModal(null);
    toggleEditMode(true);
    promptTitleInputEl.focus();
}

function openModal(node, calledFromPopstate = false) {
    if (node) {
        const id = node.id;
        modalEl.setAttribute('data-id', id);
        promptFullTextEl.value = node.content || '';
    }

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
            const currentViewPathIds = pathStack.map(n => n.id);
            window.history.pushState({ path: currentViewPathIds, modalOpen: true, promptId: node.id }, '', window.location.href);
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
        toggleEditMode(false);
    }

    modalEl.classList.remove('visible');
    setTimeout(() => {
        modalEl.classList.add('hidden');
        modalEl.removeAttribute('data-id');
        modalEl.removeAttribute('data-mode');
        promptTitleInputEl.style.display = 'none';
        promptFullTextEl.style.height = 'auto';
    }, currentTransitionDurationMediumMs);

    if (fromBackdrop) {
        if (isMobile() && window.history.state?.modalOpen && !calledFromPopstate) {
            const LrpmtId = window.history.state.promptId;
            window.history.replaceState({
                path: window.history.state.path,
                modalOpen: false,
                promptId: LrpmtId
            }, '', window.location.href);
        }
        updateBreadcrumb();
    } else if (isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
        window.history.back();
    } else {
        updateBreadcrumb();
    }
}

function toggleEditMode(isEditing) {
    promptFullTextEl.classList.toggle('is-editing', isEditing);
    promptFullTextEl.readOnly = !isEditing;
    modalEditBtn.classList.toggle('hidden', isEditing);
    modalSaveBtn.classList.toggle('hidden', !isEditing);
    copyModalButton.classList.toggle('hidden', isEditing);
    modalCloseBtn.classList.toggle('hidden', isEditing);

    const isNewMode = modalEl.dataset.mode === 'new';
    promptTitleInputEl.style.display = isEditing && isNewMode ? 'block' : 'none';

    if (isEditing) {
        if (!isNewMode) {
            promptFullTextEl.focus();
            const textLength = promptFullTextEl.value.length;
            promptFullTextEl.setSelectionRange(textLength, textLength);
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

        const newPromptNode = {
            id: generateId(),
            type: 'prompt',
            title: title,
            content: promptFullTextEl.value
        };

        if (!currentNode.items) {
            currentNode.items = [];
        }
        currentNode.items.push(newPromptNode);
        
        persistJsonData('Prompt hinzugefügt!', 'Hinzufügen fehlgeschlagen!');
        renderView(currentNode);
        closeModal();

    } else { 
        const id = modalEl.getAttribute('data-id');
        if (!id || !jsonData) return;
        const nodeToUpdate = findNodeById(jsonData, id);
        if (nodeToUpdate) {
            const newText = promptFullTextEl.value;
            nodeToUpdate.content = newText;
            persistJsonData('Prompt gespeichert!', 'Speichern fehlgeschlagen!');
        }
        toggleEditMode(false);
    }
}

function persistJsonData(successMsg, errorMsg) {
    try {
        const jsonString = JSON.stringify(jsonData, null, 2);
        localStorage.setItem(localStorageKey, jsonString);
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

function downloadCustomJson() {
    const jsonString = localStorage.getItem(localStorageKey);
    if (!jsonString) {
        showNotification('Keine Änderungen zum Herunterladen vorhanden.', 'info');
        return;
    }

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'templates_modified.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetLocalStorage() {
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
function copyPromptTextForCard(node, buttonElement) { copyToClipboard(node.content || '', buttonElement); }

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

function toggleOrganizeMode() {
    const isEditing = !containerEl.classList.contains('edit-mode');
    containerEl.classList.toggle('edit-mode', isEditing);
    organizeBtn.classList.toggle('is-active', isEditing);
    organizeIcon.classList.toggle('hidden', isEditing);
    doneIcon.classList.toggle('hidden', !isEditing);
    
    addPromptBtn.style.display = isEditing ? 'none' : 'flex';

    if (isEditing) {
        sortableInstance = new Sortable(containerEl, {
            animation: 200,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                const { oldIndex, newIndex } = evt;
                if (oldIndex === newIndex) return;

                const item = currentNode.items.splice(oldIndex, 1)[0];
                currentNode.items.splice(newIndex, 0, item);

                persistJsonData('Reihenfolge gespeichert!', 'Fehler beim Speichern!');
            },
        });
    } else {
        if (sortableInstance) {
            sortableInstance.destroy();
            sortableInstance = null;
        }
    }
}

function exitOrganizeMode() {
    if (containerEl.classList.contains('edit-mode')) {
        toggleOrganizeMode();
    }
}