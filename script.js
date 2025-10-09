let jsonData = null;
let currentNode = null;
let pathStack = [];
const currentJsonFile = "templates.json";
const localStorageKey = 'customTemplatesJson';
const favoritesKey = 'favoritePrompts';

let modalEl, breadcrumbEl, containerEl, promptFullTextEl, notificationAreaEl, promptTitleInputEl;
let createFolderModalEl, folderTitleInputEl, createFolderSaveBtn, createFolderCancelBtn;
let moveItemModalEl, moveItemFolderTreeEl, moveItemConfirmBtn, moveItemCancelBtn;
let topBarEl, topbarBackBtn, fixedBackBtn, fullscreenBtn, fullscreenEnterIcon, fullscreenExitIcon, downloadBtn, resetBtn, addBtn, addMenu, organizeBtn, organizeIcon, doneIcon, appLogoBtn, clearFavoritesBtn;
let modalEditBtn, modalSaveBtn, modalCloseBtn, copyModalButton, modalFavoriteBtn, starOutlineIcon, starFilledIcon;
let favoritesDockEl, favoritesListEl, auroraContainerEl;

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

let svgTemplateFolder, svgTemplateExpand, svgTemplateCopy, svgTemplateCheckmark, svgTemplateDelete, svgTemplateEdit, svgTemplateMove;

let sortableInstance = null;
let contextMenu = null;
let dragSource = null;
let dragTarget = null;
let springLoadTimeout = null;

let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
const swipeThreshold = 50;
const swipeFeedbackThreshold = 5;

const currentTransitionDurationMediumMs = 300;
let favoritePrompts = [];
let lastScrollY = 0;
let ticking = false;
let resizeRafId = null;

function initApp() {
    modalEl = document.getElementById('prompt-modal');
    breadcrumbEl = document.getElementById('breadcrumb');
    containerEl = document.getElementById('cards-container');
    promptFullTextEl = document.getElementById('prompt-fulltext');
    promptTitleInputEl = document.getElementById('prompt-title-input');
    notificationAreaEl = document.getElementById('notification-area');
    auroraContainerEl = document.getElementById('aurora-container');
    
    createFolderModalEl = document.getElementById('create-folder-modal');
    folderTitleInputEl = document.getElementById('folder-title-input');
    createFolderSaveBtn = document.getElementById('create-folder-save-button');
    createFolderCancelBtn = document.getElementById('create-folder-cancel-button');

    moveItemModalEl = document.getElementById('move-item-modal');
    moveItemFolderTreeEl = document.getElementById('move-item-folder-tree');
    moveItemConfirmBtn = document.getElementById('move-item-confirm-button');
    moveItemCancelBtn = document.getElementById('move-item-cancel-button');

    topBarEl = document.getElementById('top-bar');
    topbarBackBtn = document.getElementById('topbar-back-button');
    fixedBackBtn = document.getElementById('fixed-back');
    fullscreenBtn = document.getElementById('fullscreen-button');
    downloadBtn = document.getElementById('download-button');
    resetBtn = document.getElementById('reset-button');
    addBtn = document.getElementById('add-button');
    addMenu = document.getElementById('add-menu');
    organizeBtn = document.getElementById('organize-button');
    appLogoBtn = document.getElementById('app-logo-button');
    clearFavoritesBtn = document.getElementById('clear-favorites-button');

    favoritesDockEl = document.getElementById('favorites-dock');
    favoritesListEl = document.getElementById('favorites-list');

    if (fullscreenBtn) {
        fullscreenEnterIcon = fullscreenBtn.querySelector('.icon-fullscreen-enter');
        fullscreenExitIcon = fullscreenBtn.querySelector('.icon-fullscreen-exit');
    }
    if (organizeBtn) {
        organizeIcon = organizeBtn.querySelector('.icon-organize');
        doneIcon = organizeBtn.querySelector('.icon-done');
    }

    modalEditBtn = document.getElementById('modal-edit-button');
    modalSaveBtn = document.getElementById('modal-save-button');
    modalCloseBtn = document.getElementById('modal-close-button');
    copyModalButton = document.getElementById('copy-prompt-modal-button');
    modalFavoriteBtn = document.getElementById('modal-favorite-button');
    if (modalFavoriteBtn) {
        starOutlineIcon = modalFavoriteBtn.querySelector('.icon-star-outline');
        starFilledIcon = modalFavoriteBtn.querySelector('.icon-star-filled');
    }

    svgTemplateFolder = document.getElementById('svg-template-folder');
    svgTemplateExpand = document.getElementById('svg-template-expand');
    svgTemplateCopy = document.getElementById('svg-template-copy');
    svgTemplateCheckmark = document.getElementById('svg-template-checkmark');
    svgTemplateDelete = document.getElementById('svg-template-delete');
    svgTemplateEdit = document.getElementById('svg-template-edit');
    svgTemplateMove = document.getElementById('svg-template-move');

    updateDockPositioning();
    setupEventListeners();
    checkFullscreenSupport();
    createContextMenu();
    loadFavorites();

    if (isMobile()) {
        setupMobileSpecificFeatures();
    }

    loadJsonData(currentJsonFile);
}

function createContextMenu() {
    contextMenu = document.createElement('div');
    contextMenu.classList.add('context-menu');
    contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="toggle-favorite">
            <svg class="icon icon-star" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>Favorit</span>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="rename">
            <svg class="icon icon-edit" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Umbenennen
        </div>
        <div class="context-menu-item" data-action="move">
             <svg class="icon icon-move" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            Verschieben...
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
        const elementId = contextMenu.getAttribute('data-id');
        const card = document.querySelector(`.card[data-id="${elementId}"]`);
        
        if (action === 'rename') startRenamingCard(card);
        else if (action === 'delete') handleDeleteClick(elementId, card);
        else if (action === 'move') openMoveItemModal(elementId);
        else if (action === 'toggle-favorite') toggleFavoriteStatus(elementId);
        
        hideContextMenu();
    });
}

function showContextMenu(x, y, targetElement) {
    const id = targetElement.dataset.id;
    const type = targetElement.dataset.type || (targetElement.classList.contains('favorite-chip') ? 'favorite' : null);
    if (!id || !type) return;

    const isFavorite = favoritePrompts.includes(id);

    const renameItem = contextMenu.querySelector('[data-action="rename"]');
    const moveItem = contextMenu.querySelector('[data-action="move"]');
    const deleteItem = contextMenu.querySelector('[data-action="delete"]');
    const favoriteItem = contextMenu.querySelector('[data-action="toggle-favorite"]');
    const favoriteText = favoriteItem.querySelector('span');
    const dividers = contextMenu.querySelectorAll('.context-menu-divider');

    renameItem.classList.toggle('hidden', type === 'favorite');
    moveItem.classList.toggle('hidden', type === 'favorite');
    deleteItem.classList.toggle('hidden', type !== 'folder' && type !== 'prompt');
    dividers[1].classList.toggle('hidden', type === 'favorite');

    if (type === 'prompt' || type === 'favorite') {
        favoriteItem.classList.remove('hidden');
        favoriteText.textContent = isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen';
    } else {
        favoriteItem.classList.add('hidden');
    }
    
    if (type === 'folder' || type === 'favorite') {
        dividers[0].classList.add('hidden');
    } else {
        dividers[0].classList.remove('hidden');
    }

    contextMenu.setAttribute('data-id', id);
    contextMenu.classList.add('visible');

    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let finalX = x;
    let finalY = y;
    let originX = '0%';
    let originY = '0%';

    if (x + menuWidth > windowWidth) {
        finalX = x - menuWidth;
        originX = '100%';
    }
    if (y + menuHeight > windowHeight) {
        finalY = y - menuHeight;
        originY = '100%';
    }

    contextMenu.style.left = `${finalX}px`;
    contextMenu.style.top = `${finalY}px`;
    contextMenu.style.transformOrigin = `${originX} ${originY}`;
    
    setTimeout(() => {
        const hideMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                hideContextMenu();
                document.removeEventListener('click', hideMenu, true);
                document.removeEventListener('contextmenu', hideMenu, true);
            }
        };
        document.addEventListener('click', hideMenu, true);
        document.addEventListener('contextmenu', hideMenu, true);
    }, 0);
}

function hideContextMenu() {
    contextMenu.classList.remove('visible');
}

function navigateToHome() {
    exitOrganizeMode();
    collapseFavoritesBar();
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
}

function setupEventListeners() {
    topbarBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal({ fromBackdrop: true });
        } else if (pathStack.length > 0) {
            navigateOneLevelUp();
        }
    });

    fixedBackBtn.addEventListener('click', navigateToHome);
    appLogoBtn.addEventListener('click', navigateToHome);

    organizeBtn.addEventListener('click', toggleOrganizeMode);
    
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!addBtn.contains(e.target) && !addMenu.contains(e.target)) {
            addMenu.classList.add('hidden');
        }
    });

    addMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.add-menu-item');
        if (!menuItem) return;
        const action = menuItem.dataset.action;
        if (action === 'add-prompt') {
            openNewPromptModal();
        } else if (action === 'add-folder') {
            openCreateFolderModal();
        }
        addMenu.classList.add('hidden');
    });

    downloadBtn.addEventListener('click', downloadCustomJson);
    resetBtn.addEventListener('click', resetLocalStorage);
    
    if (clearFavoritesBtn) {
        clearFavoritesBtn.addEventListener('click', clearAllFavorites);
    }

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
    if (modalFavoriteBtn) {
        modalFavoriteBtn.addEventListener('click', () => {
            const promptId = modalEl.getAttribute('data-id');
            if(promptId) toggleFavoriteStatus(promptId);
        });
    }

    modalEditBtn.addEventListener('click', () => toggleEditMode(true));
    modalSaveBtn.addEventListener('click', savePromptChanges);

    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
            e.stopPropagation();
            closeModal({ fromBackdrop: true });
        }
    });

    createFolderCancelBtn.addEventListener('click', () => closeModal(createFolderModalEl));
    createFolderSaveBtn.addEventListener('click', saveNewFolder);
    createFolderModalEl.addEventListener('click', (e) => {
        if (e.target === createFolderModalEl) closeModal(createFolderModalEl);
    });

    moveItemCancelBtn.addEventListener('click', () => closeModal(moveItemModalEl));
    moveItemConfirmBtn.addEventListener('click', confirmMoveItem);
    moveItemModalEl.addEventListener('click', (e) => {
        if (e.target === moveItemModalEl) closeModal(moveItemModalEl);
    });

    containerEl.addEventListener('click', handleCardContainerClick);
    containerEl.addEventListener('contextmenu', handleContextMenu);
    if (favoritesDockEl) {
        favoritesDockEl.addEventListener('contextmenu', handleContextMenu);
    }

    containerEl.addEventListener('dragstart', handleDragStart);
    containerEl.addEventListener('dragover', handleDragOver);
    containerEl.addEventListener('dragenter', handleDragEnter);
    containerEl.addEventListener('dragleave', handleDragLeave);
    containerEl.addEventListener('drop', handleDrop);
    containerEl.addEventListener('dragend', handleDragEnd);
    promptFullTextEl.addEventListener('input', () => adjustTextareaHeight(promptFullTextEl));
    
    document.addEventListener('keydown', handleKeyDown);

    containerEl.addEventListener('scroll', () => {
        lastScrollY = containerEl.scrollTop;
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    });

    window.addEventListener('resize', handleWindowResize);
}

function updateParallax() {
    const parallaxFactor = 0.3;
    auroraContainerEl.style.transform = `translateY(${lastScrollY * parallaxFactor}px)`;
}

function handleKeyDown(e) {
    if (e.key === 'Escape') {
        if (contextMenu.classList.contains('visible')) {
            hideContextMenu();
        } else if (document.activeElement.classList.contains('rename-input')) {
            exitRenameMode(document.activeElement.closest('.card'));
        } else if (modalEl.classList.contains('visible')) {
            closeModal();
        } else if (createFolderModalEl.classList.contains('visible')) {
            closeModal(createFolderModalEl);
        } else if (moveItemModalEl.classList.contains('visible')) {
            closeModal(moveItemModalEl);
        }
    }
}

function handleContextMenu(e) {
    if (modalEl.classList.contains('visible') || containerEl.classList.contains('edit-mode')) {
        return;
    }
    
    const targetElement = e.target.closest('.card, .favorite-chip');
    if (!targetElement) return;
    
    e.preventDefault();
    showContextMenu(e.pageX, e.pageY, targetElement);
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
    if (!containerEl.classList.contains('edit-mode')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    if (!containerEl.classList.contains('edit-mode')) return;
    e.preventDefault();
    const targetCard = e.target.closest('.card');
    if (targetCard && targetCard !== dragSource) {
        clearTimeout(springLoadTimeout);
        dragTarget = targetCard;
        const targetType = targetCard.getAttribute('data-type');
        if (targetType === 'folder') {
            targetCard.classList.add('drop-target-folder');
            springLoadTimeout = setTimeout(() => {
                const nodeId = targetCard.getAttribute('data-id');
                const node = findNodeById(jsonData, nodeId);
                if (node) navigateToNode(node);
            }, 800);
        } else {
            targetCard.classList.add('drop-target-combine');
        }
    }
}

function handleDragLeave(e) {
    if (!containerEl.classList.contains('edit-mode')) return;
    const targetCard = e.target.closest('.card');
    if (targetCard) {
        clearTimeout(springLoadTimeout);
        targetCard.classList.remove('drop-target-folder', 'drop-target-combine');
    }
    if (dragTarget === targetCard) {
        dragTarget = null;
    }
}

function handleDrop(e) {
    if (!containerEl.classList.contains('edit-mode')) return;
    e.preventDefault();
    clearTimeout(springLoadTimeout);

    const droppedOnCard = e.target.closest('.card');
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId) return;

    const sourceNode = findNodeById(jsonData, sourceId);
    if (!sourceNode) return;

    if (droppedOnCard && droppedOnCard !== dragSource) {
        const targetId = droppedOnCard.getAttribute('data-id');
        const targetNode = findNodeById(jsonData, targetId);
        if (!targetNode) return;

        if (targetNode.type === 'folder') {
            moveNode(sourceId, targetNode.id);
        } else {
            if (confirm(`Möchten Sie "${sourceNode.title}" und "${targetNode.title}" in einem neuen Ordner zusammenfassen?`)) {
                combineIntoNewFolder(sourceId, targetId);
            }
        }
    }
    
    if (dragSource) dragSource.classList.remove('dragging');
    document.querySelectorAll('.drop-target-folder, .drop-target-combine').forEach(el => {
        el.classList.remove('drop-target-folder', 'drop-target-combine');
    });
    dragSource = null;
    dragTarget = null;
}

function handleDragEnd(e) {
    clearTimeout(springLoadTimeout);
    if (dragSource) {
        dragSource.classList.remove('dragging');
    }
    document.querySelectorAll('.drop-target-folder, .drop-target-combine').forEach(el => {
        el.classList.remove('drop-target-folder', 'drop-target-combine');
    });
    dragSource = null;
    dragTarget = null;
}

function moveNode(sourceId, targetFolderId, newIndex = -1) {
    const sourceNode = findNodeById(jsonData, sourceId);
    const targetFolderNode = findNodeById(jsonData, targetFolderId);
    if (!sourceNode || !targetFolderNode || targetFolderNode.type !== 'folder') {
        showNotification('Verschieben fehlgeschlagen: Ungültiges Ziel.', 'error');
        return;
    }

    const sourceParent = findParentOfNode(sourceId);
    if (!sourceParent) return;

    const sourceIndex = sourceParent.items.findIndex(item => item.id === sourceId);
    if (sourceIndex > -1) {
        sourceParent.items.splice(sourceIndex, 1);
    }

    if (!targetFolderNode.items) {
        targetFolderNode.items = [];
    }

    if (newIndex > -1) {
        targetFolderNode.items.splice(newIndex, 0, sourceNode);
    } else {
        targetFolderNode.items.push(sourceNode);
    }

    persistJsonData('Element verschoben!', 'success');
    renderView(currentNode);
}

function combineIntoNewFolder(sourceId, targetId) {
    const sourceNode = findNodeById(jsonData, sourceId);
    const targetNode = findNodeById(jsonData, targetId);
    const parentNode = findParentOfNode(sourceId);

    if (!sourceNode || !targetNode || !parentNode) return;

    const newFolder = {
        id: generateId(),
        type: 'folder',
        title: 'Neuer Ordner',
        items: [sourceNode, targetNode]
    };

    const sourceIndex = parentNode.items.findIndex(item => item.id === sourceId);
    const targetIndex = parentNode.items.findIndex(item => item.id === targetId);

    parentNode.items = parentNode.items.filter(item => item.id !== sourceId && item.id !== targetId);
    
    const insertIndex = Math.min(sourceIndex, targetIndex);
    parentNode.items.splice(insertIndex, 0, newFolder);

    persistJsonData('Neuer Ordner erstellt!', 'success');
    renderView(currentNode);
}

function setupMobileSpecificFeatures() {
    document.body.classList.add('mobile');
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
    collapseFavoritesBar();
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
        if (cardElement) {
            cardElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'scale(0.8)';
        }
        
        setTimeout(() => {
            const parentNode = findParentOfNode(id);
            if (parentNode && parentNode.items) {
                const index = parentNode.items.findIndex(item => item.id === id);
                if (index > -1) {
                    parentNode.items.splice(index, 1);
                    if (favoritePrompts.includes(id)) {
                        favoritePrompts = favoritePrompts.filter(favId => favId !== id);
                        saveFavorites();
                        renderFavoritesDock();
                    }
                    persistJsonData('Element gelöscht!', 'success');
                    renderView(currentNode);
                    updateBreadcrumb();
                }
            }
        }, 300);
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
                persistJsonData('Umbenennung gespeichert!', 'success');
                if (favoritePrompts.includes(id)) {
                    renderFavoritesDock();
                }
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
        adjustCardTitleFontSize(card);
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
        if (action === 'expand') openPromptModal(node);
        else if (action === 'copy') copyPromptTextForCard(node, e.target.closest('button'));
    } else {
        if (node.type === 'folder') {
            navigateToNode(node);
        } else if (node.type === 'prompt') {
            openPromptModal(node);
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
            openPromptModal(nodeToOpen, true);
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
    renderFavoritesDock();
}

function loadJsonData(filename) {
    const storedJson = localStorage.getItem(localStorageKey);
    if (storedJson) {
        try {
            const parsedData = JSON.parse(storedJson);
            processJson(parsedData);
            downloadBtn.style.display = 'inline-flex';
            resetBtn.style.display = 'inline-flex';
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
        });
}

function adjustCardTitleFontSize(card) {
    const title = card.querySelector('h3');
    if (!title) return;
    
    const maxFontSize = 16;
    const minFontSize = 10;
    let currentSize = maxFontSize;
    title.style.fontSize = `${currentSize}px`;

    while (title.scrollHeight > title.clientHeight && currentSize > minFontSize) {
        currentSize -= 0.5;
        title.style.fontSize = `${currentSize}px`;
    }
}

function renderView(node) {
    exitOrganizeMode();
    const currentScroll = containerEl.scrollTop;
    containerEl.innerHTML = '';
    if (!node) {
        containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Interner Fehler: Ungültiger Knoten.</p>`;
        return;
    }

    const childNodes = node.items || [];
    const maxItems = 36; 
    const nodesToRender = childNodes.slice(0, maxItems);
    const vivusSetups = [];
    const renderedCards = [];

    nodesToRender.forEach(childNode => {
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
                const expandBtn = document.createElement('button'); expandBtn.classList.add('btn', 'btn-ghost'); expandBtn.setAttribute('aria-label', 'Details anzeigen'); expandBtn.setAttribute('data-action', 'expand'); expandBtn.appendChild(svgTemplateExpand.cloneNode(true)); btnContainer.appendChild(expandBtn);
            }
            if (svgTemplateCopy) {
                const copyBtn = document.createElement('button'); copyBtn.classList.add('btn', 'btn-ghost'); copyBtn.setAttribute('aria-label', 'Prompt kopieren'); copyBtn.setAttribute('data-action', 'copy'); copyBtn.appendChild(svgTemplateCopy.cloneNode(true)); btnContainer.appendChild(copyBtn);
            }
            contentWrapper.appendChild(btnContainer);
        }
        card.appendChild(contentWrapper);
        containerEl.appendChild(card);
        renderedCards.push(card);
    });

    vivusSetups.forEach(setup => { if (document.body.contains(setup.parent)) setupVivusAnimation(setup.parent, setup.svgId); });
    
    if (renderedCards.length > 0) {
        containerEl.scrollTop = currentScroll;
        requestAnimationFrame(() => {
            renderedCards.forEach(c => {
                c.classList.add('is-visible');
                adjustCardTitleFontSize(c);
            });
        });
    } else if (childNodes.length === 0 && containerEl.innerHTML === '') {
        containerEl.innerHTML = '<p style="text-align:center; padding:2rem; opacity:0.7;">Dieser Ordner ist leer.</p>';
    }
}

function navigateToNode(node) {
    exitOrganizeMode();
    collapseFavoritesBar();
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
        homeLink.addEventListener('click', navigateToHome);
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
    
    addBtn.style.display = (currentNode && currentNode.type === 'folder' && !containerEl.classList.contains('edit-mode')) ? 'inline-flex' : 'none';
    organizeBtn.style.display = (currentNode && currentNode.items && currentNode.items.length > 0) ? 'inline-flex' : 'none';

    const isModalVisible = modalEl.classList.contains('visible');
    const isTrulyAtHome = pathStack.length === 0 && currentNode === jsonData;
    fixedBackBtn.classList.toggle('hidden', isTrulyAtHome && !isModalVisible);
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
    openModal(modalEl);
    toggleEditMode(true);
    promptTitleInputEl.focus();
}

function openPromptModal(node, calledFromPopstate = false) {
    if (node) {
        modalEl.setAttribute('data-id', node.id);
        promptFullTextEl.value = node.content || '';
        updateFavoriteButton(node.id);
        requestAnimationFrame(() => adjustTextareaHeight(promptFullTextEl));
    }
    openModal(modalEl);
    if (isMobile() && !calledFromPopstate && node) {
        const currentState = window.history.state || { path: [], modalOpen: false };
        if (!currentState.modalOpen) {
            const currentViewPathIds = pathStack.map(n => n.id);
            window.history.pushState({ path: currentViewPathIds, modalOpen: true, promptId: node.id }, '', window.location.href);
        }
    }
}

function openCreateFolderModal() {
    folderTitleInputEl.value = '';
    openModal(createFolderModalEl);
    folderTitleInputEl.focus();
}

function openMoveItemModal(itemId) {
    moveItemModalEl.dataset.itemId = itemId;
    renderFolderTree(itemId);
    openModal(moveItemModalEl);
}

function renderFolderTree(itemIdToMove) {
    moveItemFolderTreeEl.innerHTML = '';
    const createTree = (node, parentElement, level = 0) => {
        if (node.type !== 'folder') return;

        const item = document.createElement('div');
        item.classList.add('folder-tree-item');
        item.dataset.folderId = node.id;
        item.style.paddingLeft = `${0.8 + level * 1.5}rem`;
        
        const icon = svgTemplateFolder.cloneNode(true);
        icon.style.width = '20px';
        icon.style.height = '20px';
        icon.style.flexShrink = '0';
        item.appendChild(icon);

        const name = document.createElement('span');
        name.textContent = node.title;
        item.appendChild(name);

        const parentOfItemToMove = findParentOfNode(itemIdToMove);
        if (node.id === itemIdToMove || node.id === parentOfItemToMove?.id) {
            item.classList.add('disabled');
        } else {
            item.addEventListener('click', () => {
                const selected = moveItemFolderTreeEl.querySelector('.selected');
                if (selected) selected.classList.remove('selected');
                item.classList.add('selected');
                moveItemConfirmBtn.disabled = false;
            });
        }

        parentElement.appendChild(item);

        if (node.items) {
            node.items.forEach(child => createTree(child, parentElement, level + 1));
        }
    };
    createTree(jsonData, moveItemFolderTreeEl);
}

function confirmMoveItem() {
    const itemId = moveItemModalEl.dataset.itemId;
    const selectedFolderEl = moveItemFolderTreeEl.querySelector('.selected');
    if (!itemId || !selectedFolderEl) return;

    const targetFolderId = selectedFolderEl.dataset.folderId;
    moveNode(itemId, targetFolderId);
    closeModal(moveItemModalEl);
}

function openModal(element) {
    element.classList.remove('hidden');
    requestAnimationFrame(() => {
         requestAnimationFrame(() => {
            element.classList.add('visible');
         });
    });
    updateBreadcrumb();
}

function closeModal(elementOrOptions = {}) {
    let element = modalEl;
    let calledFromPopstate = false;
    let fromBackdrop = false;

    if (elementOrOptions.nodeType === 1) {
        element = elementOrOptions;
    } else if (typeof elementOrOptions === 'object' && elementOrOptions !== null) {
        calledFromPopstate = !!elementOrOptions.fromPopstate;
        fromBackdrop = !!elementOrOptions.fromBackdrop;
    }

    if (!element.classList.contains('visible')) return;

    if (element === modalEl && promptFullTextEl.classList.contains('is-editing')) {
        toggleEditMode(false);
    }

    element.classList.remove('visible');
    setTimeout(() => {
        element.classList.add('hidden');
        if (element === modalEl) {
            element.removeAttribute('data-id');
            element.removeAttribute('data-mode');
            promptTitleInputEl.style.display = 'none';
            promptFullTextEl.style.height = 'auto';
        }
    }, currentTransitionDurationMediumMs);

    if (element === modalEl) {
        if (fromBackdrop) {
            if (isMobile() && window.history.state?.modalOpen && !calledFromPopstate) {
                window.history.back();
            }
            updateBreadcrumb();
        } else if (isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
            window.history.back();
        } else {
            updateBreadcrumb();
        }
    }
}

function toggleEditMode(isEditing) {
    promptFullTextEl.classList.toggle('is-editing', isEditing);
    promptFullTextEl.readOnly = !isEditing;
    modalEditBtn.classList.toggle('hidden', isEditing);
    modalSaveBtn.classList.toggle('hidden', !isEditing);
    copyModalButton.classList.toggle('hidden', isEditing);
    modalCloseBtn.classList.toggle('hidden', isEditing);
    modalFavoriteBtn.classList.toggle('hidden', isEditing);

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

function saveNewFolder() {
    const title = folderTitleInputEl.value.trim();
    if (!title) {
        showNotification('Der Titel darf nicht leer sein.', 'error');
        folderTitleInputEl.focus();
        return;
    }

    const newFolderNode = {
        id: generateId(),
        type: 'folder',
        title: title,
        items: []
    };

    if (!currentNode.items) {
        currentNode.items = [];
    }
    currentNode.items.push(newFolderNode);
    
    persistJsonData('Ordner hinzugefügt!', 'success');
    renderView(currentNode);
    closeModal(createFolderModalEl);
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
        
        persistJsonData('Prompt hinzugefügt!', 'success');
        renderView(currentNode);
        closeModal();

    } else { 
        const id = modalEl.getAttribute('data-id');
        if (!id || !jsonData) return;
        const nodeToUpdate = findNodeById(jsonData, id);
        if (nodeToUpdate) {
            const newText = promptFullTextEl.value;
            nodeToUpdate.content = newText;
            persistJsonData('Prompt gespeichert!', 'success');
        }
        toggleEditMode(false);
    }
}

function persistJsonData(successMsg, type) {
    try {
        const jsonString = JSON.stringify(jsonData, null, 2);
        localStorage.setItem(localStorageKey, jsonString);
        showNotification(successMsg, type);
        if (downloadBtn) {
            downloadBtn.style.display = 'inline-flex';
            resetBtn.style.display = 'inline-flex';
        }
    } catch (e) {
        console.error("Fehler beim Speichern im Local Storage:", e);
        showNotification('Speichern fehlgeschlagen!', 'error');
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
        localStorage.removeItem(favoritesKey);
        showNotification('Änderungen zurückgesetzt. Lade neu...', 'info');
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

function clearAllFavorites() {
    if (favoritePrompts.length === 0) {
        showNotification('Keine Favoriten vorhanden.', 'info');
        return;
    }

    const confirmation = confirm(`Möchten Sie wirklich alle ${favoritePrompts.length} Favoriten löschen? Diese Aktion kann nicht rückgängig gemacht werden.`);
    if (confirmation) {
        favoritePrompts = [];
        saveFavorites();
        renderFavoritesDock();
        showNotification('Alle Favoriten gelöscht!', 'success');
    }
}

function copyPromptText(buttonElement = null) { copyToClipboard(promptFullTextEl.value, buttonElement || document.getElementById('copy-prompt-modal-button')); }
function copyPromptTextForCard(node, buttonElement) { copyToClipboard(node.content || '', buttonElement); }

function copyToClipboard(text, buttonElement = null, node = null, previewText = '') {
    const sanitizedPreview = previewText || (node ? getFavoritePreviewText(node.content) : '');

    const showSuccess = () => {
        showNotification('Prompt kopiert!', 'success');

        let highlightTarget = null;

        if (buttonElement) {
            const favoriteChip = buttonElement.closest('.favorite-chip');
            highlightTarget = favoriteChip || buttonElement;

            if (highlightTarget && highlightTarget.classList) {
                highlightTarget.classList.add('copy-success');
                setTimeout(() => {
                    if (highlightTarget.isConnected && highlightTarget.classList) {
                        highlightTarget.classList.remove('copy-success');
                    }
                }, 1200);
            }

            if (favoriteChip && node) {
                favoriteChip.setAttribute('aria-label', `Kopiert: ${node.title}`);
                setTimeout(() => {
                    if (favoriteChip.isConnected) {
                        favoriteChip.setAttribute('aria-label', `Kopiere: ${node.title}`);
                    }
                }, 2000);
            }
        }

        if ('vibrate' in navigator && isMobile()) {
            navigator.vibrate(50);
        }
    };

    const showError = (err) => {
        console.error('Clipboard error:', err);
        showNotification('Fehler beim Kopieren', 'error');
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showSuccess).catch(showError);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; textArea.style.top = '-9999px'; textArea.style.left = '-9999px'; textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showSuccess();
        } catch (err) {
            showError(err);
        }
        document.body.removeChild(textArea);
    }
}

let notificationTimeoutId = null;
function showNotification(message, type = 'info') {
    if (notificationTimeoutId) {
        const existingNotification = notificationAreaEl.querySelector('.notification');
        if(existingNotification) existingNotification.remove();
        clearTimeout(notificationTimeoutId);
    }

    const notificationEl = document.createElement('div');
    notificationEl.classList.add('notification', type);

    if (type === 'success' && svgTemplateCheckmark) {
        const icon = svgTemplateCheckmark.cloneNode(true);
        icon.classList.add('icon');
        notificationEl.appendChild(icon);
    }

    const textNode = document.createElement('span');
    textNode.textContent = message;
    notificationEl.appendChild(textNode);

    notificationAreaEl.appendChild(notificationEl);

    requestAnimationFrame(() => {
        notificationEl.classList.add('show');
    });

    notificationTimeoutId = setTimeout(() => {
        notificationEl.classList.remove('show');
        notificationEl.classList.add('fade-out');
        notificationEl.addEventListener('transitionend', () => {
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
    
    addBtn.style.display = isEditing ? 'none' : 'inline-flex';

    if (isEditing) {
        sortableInstance = new Sortable(containerEl, {
            animation: 200,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                const { oldIndex, newIndex, to } = evt;
                if (oldIndex === newIndex && evt.from === to) return;

                const itemNode = currentNode.items.splice(oldIndex, 1)[0];
                
                if (evt.from === to) {
                    currentNode.items.splice(newIndex, 0, itemNode);
                }
                
                persistJsonData('Reihenfolge gespeichert!', 'success');
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

function loadFavorites() {
    const storedFavorites = localStorage.getItem(favoritesKey);
    if (storedFavorites) {
        try {
            favoritePrompts = JSON.parse(storedFavorites);
        } catch (e) {
            console.error("Fehler beim Laden der Favoriten:", e);
            favoritePrompts = [];
        }
    }
}

function saveFavorites() {
    localStorage.setItem(favoritesKey, JSON.stringify(favoritePrompts));
}

function toggleFavoriteStatus(promptId) {
    if (!promptId) return;

    const index = favoritePrompts.indexOf(promptId);
    if (index > -1) {
        favoritePrompts.splice(index, 1);
        showNotification('Von Favoriten entfernt', 'info');
    } else {
        favoritePrompts.push(promptId);
        showNotification('Zu Favoriten hinzugefügt', 'success');
    }

    saveFavorites();
    updateFavoriteButton(promptId);
    renderFavoritesDock();
}

function updateFavoriteButton(promptId) {
    if (!modalEl.classList.contains('visible') || modalEl.dataset.id !== promptId) return;
    const isFavorite = favoritePrompts.includes(promptId);
    starOutlineIcon.classList.toggle('hidden', isFavorite);
    starFilledIcon.classList.toggle('hidden', !isFavorite);
    modalFavoriteBtn.setAttribute('aria-label', isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen');
}

function handleWindowResize() {
    if (resizeRafId) {
        cancelAnimationFrame(resizeRafId);
    }
    resizeRafId = requestAnimationFrame(() => {
        updateDockPositioning();
        resizeRafId = null;
    });
}

function updateDockPositioning() {
    if (!favoritesDockEl) return;
    const computedStyle = getComputedStyle(document.documentElement);
    const safeInset = parseFloat(computedStyle.getPropertyValue('--safe-area-inset-bottom')) || 0;
    favoritesDockEl.style.setProperty('--favorites-safe-offset', `${safeInset}px`);
}

function getFavoritePreviewText(content) {
    if (!content) return '';

    const normalizedLines = content
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    if (normalizedLines.length === 0) {
        return '';
    }

    const previewSource = normalizedLines.slice(0, 3).join(' ');
    const condensed = previewSource.replace(/\s+/g, ' ').trim();

    if (condensed.length <= 140) {
        return condensed;
    }

    return `${condensed.slice(0, 137).trim()}…`;
}

function renderFavoritesDock() {
    if (!favoritesDockEl || !favoritesListEl) return;

    favoritesListEl.innerHTML = '';

    const favoritesWithNodes = favoritePrompts
        .map((promptId) => {
            const node = findNodeById(jsonData, promptId);
            return node && node.type === 'prompt' ? { id: promptId, node } : null;
        })
        .filter(Boolean);

    if (favoritesWithNodes.length !== favoritePrompts.length) {
        favoritePrompts = favoritesWithNodes.map(({ id }) => id);
        saveFavorites();
    }

    if (favoritesWithNodes.length === 0) {
        favoritesDockEl.classList.add('hidden');
        favoritesDockEl.setAttribute('aria-hidden', 'true');
        favoritesDockEl.removeAttribute('data-count');
        document.body.classList.remove('favorites-dock-visible');
        if (clearFavoritesBtn) {
            clearFavoritesBtn.style.display = 'none';
        }
        return;
    }

    favoritesDockEl.classList.remove('hidden');
    favoritesDockEl.setAttribute('aria-hidden', 'false');
    favoritesDockEl.setAttribute('data-count', String(favoritesWithNodes.length));
    document.body.classList.add('favorites-dock-visible');

    if (clearFavoritesBtn) {
        clearFavoritesBtn.style.display = 'inline-flex';
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
        button.setAttribute('aria-label', `Kopiere: ${node.title}`);

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

        const previewText = getFavoritePreviewText(node.content);
        if (previewText) {
            const previewEl = document.createElement('span');
            previewEl.className = 'favorite-chip-preview';
            previewEl.textContent = previewText;
            textWrap.append(titleEl, previewEl);
        } else {
            textWrap.appendChild(titleEl);
        }

        button.append(badge, textWrap);

        button.addEventListener('click', () => {
            copyToClipboard(node.content || '', button, node, previewText);
        });

        listItem.appendChild(button);
        fragment.appendChild(listItem);
    });

    favoritesListEl.appendChild(fragment);

    updateDockPositioning();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}