// =====================================================================
// MAIN APPLICATION CONTROLLER
// =====================================================================

// Global application state variables
let jsonData = null;
let currentNode = null;
let pathStack = [];
let currentSearchQuery = '';
let favoritePrompts = [];

let prefersReducedMotion = false;
let auroraParallaxOffset = 0;
let isAuroraVisible = true;
let lastScrollY = 0;
let ticking = false;

// DOM element references
let containerEl, favoritesDockEl, favoritesListEl, favoritesScrollAreaEl, favoritesToggleBtn;
let modalEl, clearFavoritesBtn, topBarEl, fixedBackBtn, resetBtn, addBtn, addMenu, moreBtn, moreMenu, organizeBtn, downloadBtn, downloadMenu, storageSourceBtn, installAppBtn;
let appLogoBtn, searchInputEl, searchToggleBtn, searchWrapEl, topbarBackBtn;
let fullscreenBtn, fullscreenEnterIcon, fullscreenExitIcon;
let organizeIcon, doneIcon;
let modalEditBtn, modalSaveBtn, modalCloseBtn, copyModalButton, modalFavoriteBtn;
let starOutlineIcon, starFilledIcon;
let svgTemplateFolder, svgTemplateExpand, svgTemplateCopy, svgTemplateCheckmark, svgTemplateDelete, svgTemplateEdit, svgTemplateMove;
let promptFullTextEl, promptTitleInputEl;
let createFolderModalEl, folderTitleInputEl, createFolderSaveBtn, createFolderCancelBtn;
let moveItemModalEl, moveItemFolderTreeEl, moveItemConfirmBtn, moveItemCancelBtn;
let uploadJsonModalEl, uploadDropZoneEl, uploadJsonInputEl, uploadJsonSelectBtn, uploadJsonCancelBtn;
let linkItemModalEl, linkItemListEl, linkItemConfirmBtn, linkItemCancelBtn, linkItemModalTitleEl;
let notificationAreaEl;
let auroraContainerEl;

// Interaction tracking
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const swipeThreshold = 65;
const swipeFeedbackThreshold = 18;

// Local storage and cloud configuration
const cloudStorageKey = 'templates-cloud-data';
const cloudSyncTimestampKey = 'templates-cloud-timestamp';
const favoritesKey = 'templates-favorites';
let serverSyncTimestamp = null;
let lastSuccessfulSyncAt = 0;
let isSyncInFlight = false;
let syncBroadcastChannel = null;
let syncPollIntervalId = null;

// Drag and drop sorting instances
let sortableInstance = null;
let sortableDragState = null;
let springLoadTimeout = null;
let dragSource = null;
let dragTarget = null;

// PWA Install state
let deferredInstallPrompt = null;

// Animation timing constants
const currentTransitionDurationMediumMs = 300;

// Initialize app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    containerEl = document.getElementById('cards-container');
    topBarEl = document.getElementById('top-bar');
    topbarBackBtn = document.getElementById('topbar-back-button');
    fixedBackBtn = document.getElementById('fixed-back-button');
    organizeBtn = document.getElementById('organize-button');
    addBtn = document.getElementById('add-button');
    addMenu = document.getElementById('add-menu');
    moreBtn = document.getElementById('more-button');
    moreMenu = document.getElementById('more-menu');
    downloadBtn = document.getElementById('download-button');
    downloadMenu = document.getElementById('download-menu');
    resetBtn = document.getElementById('reset-button');
    fullscreenBtn = document.getElementById('fullscreen-button');
    modalEl = document.getElementById('prompt-modal');
    promptFullTextEl = document.getElementById('prompt-full-text');
    promptTitleInputEl = document.getElementById('prompt-title-input');
    
    createFolderModalEl = document.getElementById('create-folder-modal');
    folderTitleInputEl = document.getElementById('folder-title-input');
    createFolderSaveBtn = document.getElementById('create-folder-save-button');
    createFolderCancelBtn = document.getElementById('create-folder-cancel-button');
    
    moveItemModalEl = document.getElementById('move-item-modal');
    moveItemFolderTreeEl = document.getElementById('move-item-folder-tree');
    moveItemConfirmBtn = document.getElementById('move-item-confirm-button');
    moveItemCancelBtn = document.getElementById('move-item-cancel-button');
    
    uploadJsonModalEl = document.getElementById('upload-json-modal');
    uploadDropZoneEl = document.getElementById('upload-drop-zone');
    uploadJsonInputEl = document.getElementById('upload-json-input');
    uploadJsonSelectBtn = document.getElementById('upload-json-select-button');
    uploadJsonCancelBtn = document.getElementById('upload-json-cancel-button');
    
    linkItemModalEl = document.getElementById('link-item-modal');
    linkItemListEl = document.getElementById('link-item-list');
    linkItemConfirmBtn = document.getElementById('link-item-confirm-button');
    linkItemCancelBtn = document.getElementById('link-item-cancel-button');
    linkItemModalTitleEl = document.getElementById('link-item-modal-title');
    
    notificationAreaEl = document.getElementById('notification-area');
    auroraContainerEl = document.getElementById('aurora-container');
    
    appLogoBtn = document.getElementById('app-logo-button');
    clearFavoritesBtn = document.getElementById('clear-favorites-button');
    storageSourceBtn = document.getElementById('storage-source-button');
    installAppBtn = document.getElementById('install-app-button');
    searchInputEl = document.getElementById('search-input');
    searchToggleBtn = document.getElementById('search-toggle-button');
    searchWrapEl = document.querySelector('.toolbar-search-wrap');

    favoritesDockEl = document.getElementById('favorites-dock');
    favoritesListEl = document.getElementById('favorites-list');
    favoritesScrollAreaEl = document.getElementById('favorites-scroll-area');
    favoritesToggleBtn = document.getElementById('favorites-expand-toggle');

    setupMotionPreferenceHandling();

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

    // Liquid Glass: Platform detection
    detectAndSetPlatform();

    updateViewportMetrics();
    updateDockPositioning();
    setupViewToolbar();
    setupEventListeners();
    setupPwaInstallPrompt();
    checkFullscreenSupport();
    createContextMenu();
    loadFavorites();
    updateStorageSourceButton();
    window.initRealtimeSync();

    if (isMobile()) {
        setupMobileSpecificFeatures();
    }

    // Liquid Glass: Feature-Initialisierung
    setupKeyboardShortcuts();
    setupSwipeBackGesture();
    setupPullToRefresh();
    setupColorSchemeWatcher();
    initColorScheme();

    const colorSchemeBtn = document.getElementById('color-scheme-button');
    if (colorSchemeBtn) colorSchemeBtn.addEventListener('click', toggleColorScheme);

    window.loadJsonData();
    updateParallax();

    // Initialize enhanced animation systems (defined in animations.js)
    setupAuroraVisibilityObserver();
    if (window.initParticlesSystem) window.initParticlesSystem();
    if (window.initGlowBurstSystem) window.initGlowBurstSystem();
    if (window.initKonfettiSystem) window.initKonfettiSystem();
    if (window.initCardTiltEffect) window.initCardTiltEffect();
    if (window.initDeviceOrientationParallax) window.initDeviceOrientationParallax();

    // Performance: Hintergrund-Animationen bei Inaktivität pausieren
    initIdlePerformanceMode();
}

function initIdlePerformanceMode() {
    const IDLE_DELAY = 4000;
    const ACTIVITY_THROTTLE = 250;
    let idleTimerId = null;
    let isIdle = false;
    let lastActivityTs = 0;

    function setAuroraVisible(visible) {
        if (typeof window.AuroraWebGL?.setVisible === 'function') {
            window.AuroraWebGL.setVisible(visible);
        }
    }

    function enterIdle() {
        if (isIdle) return;
        isIdle = true;
        document.body.classList.add('app-idle');
        setAuroraVisible(false);
    }

    function leaveIdle() {
        if (!isIdle) return;
        isIdle = false;
        document.body.classList.remove('app-idle');
        setAuroraVisible(true);
    }

    function scheduleIdle() {
        if (idleTimerId !== null) clearTimeout(idleTimerId);
        idleTimerId = setTimeout(enterIdle, IDLE_DELAY);
    }

    function handleActivity() {
        if (document.hidden) return;
        const now = Date.now();
        if (now - lastActivityTs < ACTIVITY_THROTTLE) return;
        lastActivityTs = now;
        leaveIdle();
        scheduleIdle();
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            if (idleTimerId !== null) {
                clearTimeout(idleTimerId);
                idleTimerId = null;
            }
            enterIdle();
        } else {
            lastActivityTs = 0;
            leaveIdle();
            scheduleIdle();
        }
    }

    document.addEventListener('pointermove', handleActivity, { passive: true });
    document.addEventListener('pointerdown', handleActivity, { passive: true });
    document.addEventListener('keydown', handleActivity, { passive: true });
    document.addEventListener('scroll', handleActivity, { passive: true });
    document.addEventListener('wheel', handleActivity, { passive: true });
    document.addEventListener('touchstart', handleActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    scheduleIdle();
}

function updateStorageSourceButton() {
    if (!storageSourceBtn) return;
    const isCloud = serverSyncTimestamp !== null;
    storageSourceBtn.setAttribute('data-source', isCloud ? 'cloud' : 'local');
    storageSourceBtn.setAttribute('aria-label', isCloud ? 'Datenquelle: Cloud' : 'Datenquelle: Offline');
    const labelSpan = storageSourceBtn.querySelector('.toolbar-btn-label');
    if (labelSpan) {
        labelSpan.textContent = isCloud ? 'Cloud' : 'Offline';
    }
}

function updatePersistenceButtonsVisibility() {
    if (!downloadBtn || !resetBtn) return;
    const hasLocalData = Boolean(jsonData);
    downloadBtn.style.display = hasLocalData ? 'inline-flex' : 'none';
    resetBtn.style.display = hasLocalData ? 'inline-flex' : 'none';
}

function setupEventListeners() {
    bindViewportObservers();

    topbarBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            window.closeModal({ fromBackdrop: true });
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

    if (moreBtn && moreMenu) {
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const willOpen = moreMenu.classList.contains('hidden');
            if (willOpen) buildMoreMenu();
            moreMenu.classList.toggle('hidden');
            moreBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
        moreMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.more-menu-item');
            if (!item) return;
            closeMoreMenu();
            const action = item._ptAction;
            if (typeof action === 'function') action();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !moreMenu.classList.contains('hidden')) {
                closeMoreMenu();
                moreBtn.focus();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!addBtn.contains(e.target) && !addMenu.contains(e.target)) { addMenu.classList.add('hidden'); }
        if (downloadMenu && !downloadBtn.contains(e.target) && !downloadMenu.contains(e.target)) { downloadMenu.classList.add('hidden'); }
        if (moreBtn && moreMenu && !moreBtn.contains(e.target) && !moreMenu.contains(e.target)) { closeMoreMenu(); }
    });

    addMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.add-menu-item');
        if (!menuItem) return;
        const action = menuItem.dataset.action;
        if (action === 'add-prompt') {
            openNewPromptModal();
        } else if (action === 'add-folder') {
            window.openCreateFolderModal();
        } else if (action === 'add-prompt-link') {
            window.openLinkItemModal('prompt');
        } else if (action === 'add-folder-link') {
            window.openLinkItemModal('folder');
        }
        addMenu.classList.add('hidden');
    });

    downloadBtn.addEventListener('click', (e) => { e.stopPropagation(); downloadMenu.classList.toggle('hidden'); });
    if (downloadMenu) {
        downloadMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.add-menu-item');
            if (!item) return;
            if (item.dataset.action === 'download-json') window.downloadCustomJson();
            if (item.dataset.action === 'upload-json') window.openUploadJsonModal();
            downloadMenu.classList.add('hidden');
        });
    }
    resetBtn.addEventListener('click', resetLocalStorage);
    if (storageSourceBtn) storageSourceBtn.disabled = true;
    
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

    modalCloseBtn.addEventListener('click', () => window.closeModal());
    
    if (copyModalButton) {
      copyModalButton.addEventListener('click', () => copyPromptText(copyModalButton));
    }
    if (modalFavoriteBtn) {
        modalFavoriteBtn.addEventListener('click', () => {
            const promptId = modalEl.getAttribute('data-id');
            if(promptId) toggleFavoriteStatus(promptId);
        });
    }

    modalEditBtn.addEventListener('click', () => window.toggleEditMode(true));
    modalSaveBtn.addEventListener('click', window.savePromptChanges);

    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
            e.stopPropagation();
            window.closeModal({ fromBackdrop: true });
        }
    });

    createFolderCancelBtn.addEventListener('click', () => window.closeModal(createFolderModalEl));
    createFolderSaveBtn.addEventListener('click', window.saveNewFolder);
    createFolderModalEl.addEventListener('click', (e) => {
        if (e.target === createFolderModalEl) window.closeModal(createFolderModalEl);
    });

    if (linkItemCancelBtn) linkItemCancelBtn.addEventListener('click', () => window.closeModal(linkItemModalEl));
    if (linkItemConfirmBtn) linkItemConfirmBtn.addEventListener('click', window.confirmLinkItem);
    if (linkItemModalEl) {
        linkItemModalEl.addEventListener('click', (e) => {
            if (e.target === linkItemModalEl) window.closeModal(linkItemModalEl);
        });
    }

    moveItemCancelBtn.addEventListener('click', () => window.closeModal(moveItemModalEl));
    moveItemConfirmBtn.addEventListener('click', window.confirmMoveItem);
    moveItemModalEl.addEventListener('click', (e) => {
        if (e.target === moveItemModalEl) window.closeModal(moveItemModalEl);
    });

    if (uploadJsonCancelBtn) uploadJsonCancelBtn.addEventListener('click', () => window.closeModal(uploadJsonModalEl));
    if (uploadJsonSelectBtn) uploadJsonSelectBtn.addEventListener('click', () => uploadJsonInputEl.click());
    if (uploadJsonInputEl) uploadJsonInputEl.addEventListener('change', () => window.handleUploadJsonFile(uploadJsonInputEl.files && uploadJsonInputEl.files[0]));
    if (uploadDropZoneEl) {
        uploadDropZoneEl.addEventListener('dragover', (e) => { e.preventDefault(); uploadDropZoneEl.classList.add('is-dragover'); });
        uploadDropZoneEl.addEventListener('dragleave', () => uploadDropZoneEl.classList.remove('is-dragover'));
        uploadDropZoneEl.addEventListener('drop', (e) => { e.preventDefault(); uploadDropZoneEl.classList.remove('is-dragover'); const f=e.dataTransfer?.files?.[0]; window.handleUploadJsonFile(f); });
    }

    containerEl.addEventListener('click', handleCardContainerClick);
    containerEl.addEventListener('contextmenu', handleContextMenu);
    if (favoritesDockEl) {
        favoritesDockEl.addEventListener('contextmenu', handleContextMenu);
        favoritesDockEl.addEventListener('touchstart', window.handleFavoritesTouchStart, { passive: true });
        favoritesDockEl.addEventListener('touchmove', window.handleFavoritesTouchMove, { passive: true });
        favoritesDockEl.addEventListener('touchend', window.handleFavoritesTouchEnd, { passive: true });
    }
    if (favoritesToggleBtn) {
        favoritesToggleBtn.addEventListener('click', () => window.toggleFavoritesExpanded());
    }
    if (favoritesScrollAreaEl) {
        favoritesScrollAreaEl.addEventListener('wheel', window.handleFavoritesWheel, { passive: false });
        favoritesScrollAreaEl.addEventListener('scroll', window.handleFavoritesScroll, { passive: true });
        favoritesScrollAreaEl.addEventListener('pointerdown', window.revealFavoritesScrollbar, { passive: true });
        favoritesScrollAreaEl.addEventListener('mouseenter', window.revealFavoritesScrollbar);
    }

    containerEl.addEventListener('dragstart', window.handleDragStart);
    containerEl.addEventListener('dragover', window.handleDragOver);
    containerEl.addEventListener('dragenter', window.handleDragEnter);
    containerEl.addEventListener('dragleave', window.handleDragLeave);
    containerEl.addEventListener('drop', window.handleDrop);
    containerEl.addEventListener('dragend', window.handleDragEnd);
    promptFullTextEl.addEventListener('input', () => adjustTextareaHeight(promptFullTextEl));
    
    document.addEventListener('keydown', handleKeyDown);

    containerEl.addEventListener('scroll', () => {
        lastScrollY = containerEl.scrollTop;
        if (!shouldAnimateParallax()) {
            return;
        }
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    });

    window.addEventListener('resize', handleWindowResize);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) window.syncFromCloud({ silent: true, reason: 'visibilitychange' });
    });
    window.addEventListener('focus', () => window.syncFromCloud({ silent: true, reason: 'focus' }));
}

function updateParallax() {
    if (!shouldAnimateParallax()) {
        return;
    }
    const parallaxFactor = 0.3;
    const targetOffset = Number.isFinite(lastScrollY) ? lastScrollY * parallaxFactor : 0;
    if (Math.abs(targetOffset - auroraParallaxOffset) < 0.1) {
        return;
    }
    auroraParallaxOffset = targetOffset;
    auroraContainerEl.style.transform = `translate3d(0, ${targetOffset}px, 0)`;
}

function shouldAnimateParallax() {
    return Boolean(auroraContainerEl) && !prefersReducedMotion && isAuroraVisible;
}

function setupAuroraVisibilityObserver() {
    if (typeof IntersectionObserver === 'undefined' || !auroraContainerEl) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isAuroraVisible = entry.isIntersecting;
            if (typeof window.AuroraWebGL?.setVisible === 'function') {
                window.AuroraWebGL.setVisible(isAuroraVisible);
            }
        });
    }, { threshold: 0.05 });
    
    observer.observe(auroraContainerEl);
}

function setupMotionPreferenceHandling() {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = (q) => {
        prefersReducedMotion = q.matches;
        document.documentElement.classList.toggle('motion-reduced', prefersReducedMotion);
        if (prefersReducedMotion) {
            if (auroraContainerEl) {
                auroraContainerEl.style.transform = '';
            }
        } else {
            updateParallax();
        }
    };
    updateMotionPreference(motionQuery);
    motionQuery.addEventListener('change', updateMotionPreference);
}

function handleKeyDown(e) {
    if (modalEl.classList.contains('visible')) {
        if (e.key === 'Escape') {
            window.closeModal();
        }
        return;
    }
    if (createFolderModalEl.classList.contains('visible')) {
        if (e.key === 'Escape') window.closeModal(createFolderModalEl);
        return;
    }
}

function clearMultiSelection() {
    document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
}

function toggleCardMultiSelection(card) {
    if (!card) return;
    card.classList.toggle('selected');
}

function getContextSelectionIds(fallbackId = null) {
    const selected = Array.from(containerEl.querySelectorAll('.card.selected')).map(c => c.getAttribute('data-id')).filter(Boolean);
    if (selected.length > 0) return selected;
    return fallbackId ? [fallbackId] : [];
}

function deleteItemsByIds(ids) {
    if (!ids || !ids.length || !jsonData) return;
    let deletedCount = 0;
    const deleteRecursive = (node) => {
        if (!node || !Array.isArray(node.items)) return;
        const before = node.items.length;
        node.items = node.items.filter(item => !ids.includes(item.id));
        deletedCount += before - node.items.length;
        node.items.forEach(deleteRecursive);
    };

    deleteRecursive(jsonData);
    if (deletedCount > 0) {
        favoritePrompts = favoritePrompts.filter(favId => !ids.includes(favId));
        saveFavorites();
        pruneDanglingLinks();
        window.persistJsonData(ids.length > 1 ? `${deletedCount} Elemente gelöscht!` : 'Element gelöscht!', 'success');
        renderView(currentNode);
    }
}

function handleContextMenu(e) {
    e.preventDefault();
    const card = e.target.closest('.card');
    const dock = e.target.closest('#favorites-dock');

    if (dock && !card) {
        return;
    }

    if (!card) {
        showContextMenuForEmptyArea(e);
        return;
    }

    const id = card.getAttribute('data-id');
    const node = findNodeById(jsonData, id);
    if (!node) return;

    const isFav = isFavorite(id);
    const hasSelection = containerEl.querySelectorAll('.card.selected').length > 0;
    const inSelection = card.classList.contains('selected');

    let menuItems = [];

    if (hasSelection) {
        if (!inSelection) {
            clearMultiSelection();
            toggleCardMultiSelection(card);
        }
        const count = getContextSelectionIds().length;
        menuItems = [
            {
                label: `${count} Elemente löschen`,
                iconClass: 'icon-delete',
                action: () => confirmDeleteNode(getContextSelectionIds())
            },
            {
                label: 'Auswahl aufheben',
                action: clearMultiSelection
            }
        ];
    } else {
        menuItems = [
            {
                label: isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen',
                iconClass: 'icon-star',
                action: () => toggleFavoriteStatus(id)
            },
            {
                label: 'Verschieben…',
                iconClass: 'icon-move',
                action: () => window.openMoveItemModal(id)
            },
            {
                label: 'Umbenennen',
                iconClass: 'icon-edit',
                action: () => startRenamingCard(card)
            },
            {
                label: 'Löschen',
                iconClass: 'icon-delete',
                action: () => confirmDeleteNode([id])
            },
            {
                label: 'Mehrfachauswahl',
                action: () => toggleCardMultiSelection(card)
            }
        ];
    }

    window.ContextMenu.show(e, menuItems);
}

function moveNode(sourceId, targetFolderId, newIndex = -1) {
    if (!jsonData || !sourceId || !targetFolderId || sourceId === targetFolderId) return;

    const sourceParent = findParentOfNode(sourceId);
    const targetFolder = findNodeById(jsonData, targetFolderId);
    const nodeToMove = findNodeById(jsonData, sourceId);

    if (!sourceParent || !targetFolder || !nodeToMove || targetFolder.type !== 'folder') return;

    if (sourceParent.id === targetFolderId && newIndex === -1) {
        return;
    }

    sourceParent.items = sourceParent.items.filter(item => item.id !== sourceId);

    if (!targetFolder.items) targetFolder.items = [];
    if (newIndex >= 0 && newIndex <= targetFolder.items.length) {
        targetFolder.items.splice(newIndex, 0, nodeToMove);
    } else {
        targetFolder.items.push(nodeToMove);
    }

    window.persistJsonData('Element verschoben!', 'success');
    renderView(currentNode);
}

function combineIntoNewFolder(sourceId, targetId) {
    if (!jsonData || !sourceId || !targetId || sourceId === targetId) return;

    const sourceParent = findParentOfNode(sourceId);
    const targetParent = findParentOfNode(targetId);
    
    const sourceNode = findNodeById(jsonData, sourceId);
    const targetNode = findNodeById(jsonData, targetId);

    if (!sourceParent || !targetParent || !sourceNode || !targetNode) return;

    const folderName = prompt('Geben Sie einen Namen für den neuen Ordner ein:', 'Neuer Ordner');
    if (!folderName || !folderName.trim()) return;

    const newFolderId = generateId();
    const newFolderNode = {
        id: newFolderId,
        type: 'folder',
        title: folderName.trim(),
        items: [targetNode, sourceNode]
    };

    sourceParent.items = sourceParent.items.filter(item => item.id !== sourceId);
    
    const targetIndex = targetParent.items.findIndex(item => item.id === targetId);
    if (targetIndex !== -1) {
        targetParent.items.splice(targetIndex, 1, newFolderNode);
    } else {
        targetParent.items.push(newFolderNode);
    }

    window.persistJsonData('Ordner erstellt und Elemente zusammengefasst!', 'success');
    renderView(currentNode);
}

function setupMobileSpecificFeatures() {
    const listEl = containerEl;
    let listTouchStartX = 0;
    let listTouchStartY = 0;
    
    listEl.addEventListener('touchstart', (e) => {
        if(containerEl.classList.contains('edit-mode')) return;
        listTouchStartX = e.touches[0].clientX;
        listTouchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    listEl.addEventListener('touchend', (e) => {
        if(containerEl.classList.contains('edit-mode')) return;
        const diffX = e.changedTouches[0].clientX - listTouchStartX;
        const diffY = e.changedTouches[0].clientY - listTouchStartY;
        
        if (Math.abs(diffX) > 60 && Math.abs(diffY) < 30) {
            const card = e.target.closest('.card');
            if (card) {
                const id = card.getAttribute('data-id');
                const isFav = isFavorite(id);
                if (diffX < 0) {
                    if (!isFav) {
                        toggleFavoriteStatus(id);
                        if (window.triggerHapticFeedback) window.triggerHapticFeedback('medium');
                    }
                } else {
                    if (isFav) {
                        toggleFavoriteStatus(id);
                        if (window.triggerHapticFeedback) window.triggerHapticFeedback('light');
                    }
                }
            }
        }
    }, { passive: true });
}

function navigateOneLevelUp() {
    if (pathStack.length > 0) {
        exitOrganizeMode();
        performViewTransition(() => {
            const parentNode = pathStack.pop();
            currentNode = parentNode;
            renderView(currentNode);
            updateBreadcrumb();
        }, 'backward');
    }
}

function findParentOfNode(targetId, startNode = jsonData) {
    if (!startNode || !targetId || startNode.id === targetId) return null;

    if (startNode.type === 'folder' && startNode.items) {
        for (const child of startNode.items) {
            if (child.id === targetId) return startNode;
            const found = findParentOfNode(targetId, child);
            if (found) return found;
        }
    }
    return null;
}

function handleDeleteClick(id, cardElement) {
    if(containerEl.classList.contains('edit-mode')) {
        confirmDeleteNode([id]);
    }
}

function startRenamingCard(card) {
    if (!card) return;
    const titleEl = card.querySelector('h3');
    if (!titleEl) return;

    card.setAttribute('draggable', 'false');
    card.classList.add('renaming');
    titleEl.contentEditable = 'true';
    titleEl.focus();

    const range = document.createRange();
    range.selectNodeContents(titleEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const finishRename = () => {
        titleEl.contentEditable = 'false';
        card.setAttribute('draggable', 'true');
        card.classList.remove('renaming');
        exitRenameMode(card);
    };

    titleEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishRename();
        } else if (e.key === 'Escape') {
            titleEl.textContent = findNodeById(jsonData, card.getAttribute('data-id'))?.title || 'Unbenannt';
            finishRename();
        }
    }, { once: false });

    titleEl.addEventListener('blur', finishRename, { once: true });
}

function exitRenameMode(card) {
    const id = card.getAttribute('data-id');
    const titleEl = card.querySelector('h3');
    if (!id || !titleEl) return;

    const newTitle = titleEl.textContent.trim();
    const node = findNodeById(jsonData, id);
    if (node && newTitle && newTitle !== node.title) {
        node.title = newTitle;
        window.persistJsonData('Titel geändert!', 'success');
    } else if (node) {
        titleEl.textContent = node.title;
    }
}

function handleCardContainerClick(e) {
    const card = e.target.closest('.card');
    if (!card) return;

    const button = e.target.closest('button');
    if (containerEl.classList.contains('edit-mode')) {
        if (button) {
            e.stopPropagation();
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
    const resolvedNode = resolveLinkedNode(node);
    if (!node || !resolvedNode) return;

    if (button) {
        e.stopPropagation();
        const action = button.getAttribute('data-action');
        if (action === 'expand') window.openPromptModal(resolvedNode);
        else if (action === 'copy') copyPromptTextForCard(resolvedNode, e.target.closest('button'));
    } else {
        if (resolvedNode.type === 'folder') {
            navigateToNode(resolvedNode);
        } else if (resolvedNode.type === 'prompt') {
            copyPromptTextForCard(resolvedNode, card);
        }
    }
}

function handleTouchStart(e) {
    if(containerEl.classList.contains('edit-mode')) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchEndX = touchStartX;
    touchEndY = touchStartY;
    edgeSwipeTouch = touchStartX <= EDGE_SWIPE_ZONE;
    touchOnCard = !!(e.target.closest && e.target.closest('.card'));
}

const EDGE_SWIPE_ZONE = 35;
let edgeSwipeTouch = false;
let touchOnCard = false;

function handleTouchMove(e) {
    if (!touchStartX || modalEl.classList.contains('visible') || containerEl.classList.contains('edit-mode')) return;
    if (edgeSwipeTouch) return;
    if (touchOnCard) return;
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
    if (touchOnCard) {
        touchOnCard = false;
        edgeSwipeTouch = false;
        touchStartX = 0; touchStartY = 0; touchEndX = 0; touchEndY = 0;
        containerEl.classList.remove('swiping-right');
        containerEl.style.transform = '';
        return;
    }
    if (edgeSwipeTouch) {
        edgeSwipeTouch = false;
        touchStartX = 0;
        touchStartY = 0;
        containerEl.classList.remove('swiping-right');
        containerEl.style.transform = '';
        return;
    }
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
        window.closeModal({ fromPopstate: true });
    } else if (!currentlyModalOpen && state.modalOpen) {
        const promptIdForModal = state.promptId;
        const nodeToOpen = promptIdForModal ? findNodeById(jsonData, promptIdForModal) : null;

        if (nodeToOpen && nodeToOpen.type === 'prompt') {
            pathStack = state.path.map(id => findNodeById(jsonData, id)).filter(Boolean);
            if (state.path.length > 0 && pathStack.length > 0 && pathStack[pathStack.length-1].id === promptIdForModal) {
                 pathStack.pop();
            }
            currentNode = pathStack.length > 0 ? pathStack[pathStack.length-1] : jsonData;
            window.openPromptModal(nodeToOpen, true);
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
        if(fullscreenBtn) fullscreenBtn.style.display = 'none';
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

// Keep convention from previous updates
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

function pruneDanglingLinks() {
    if (!jsonData) return 0;
    const validIds = new Set();
    (function collect(node) {
        if (!node) return;
        validIds.add(node.id);
        if (Array.isArray(node.items)) node.items.forEach(collect);
    })(jsonData);

    let pruned = 0;
    (function walk(node) {
        if (!Array.isArray(node.items)) return;
        const before = node.items.length;
        node.items = node.items.filter((child) => {
            if (child.type === 'prompt-link' || child.type === 'folder-link') {
                return child.targetId && validIds.has(child.targetId);
            }
            return true;
        });
        pruned += before - node.items.length;
        node.items.forEach(walk);
    })(jsonData);
    return pruned;
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
        isMobileDevice = (navigator.maxTouchPoints > 0 && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
            || 'ontouchstart' in window
            || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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
    parentElement.addEventListener('touchend', touchEndHandler, { passive: true });
    parentElement.addEventListener('touchcancel', touchEndHandler, { passive: true });
}

function processJson(data) {
    jsonData = data;
    if (jsonData) {
        try {
            localStorage.setItem(cloudStorageKey, JSON.stringify(jsonData));
            if (serverSyncTimestamp !== null) {
                localStorage.setItem(cloudSyncTimestampKey, String(serverSyncTimestamp));
            }
        } catch (err) {
            console.error("Local storage sync error:", err);
        }
    }
    
    if (jsonData && !currentNode) {
        currentNode = jsonData;
    } else if (jsonData && currentNode) {
        const matchingNode = findNodeById(jsonData, currentNode.id);
        currentNode = matchingNode || jsonData;
    }
    
    pruneDanglingLinks();
    
    const activeViewNode = currentNode || jsonData;
    if (activeViewNode) {
        renderView(activeViewNode);
        updateBreadcrumb();
    }
}

function setSearchExpanded(expanded) {
    if (!searchWrapEl || !searchInputEl || !searchToggleBtn) return;

    searchWrapEl.classList.toggle('expanded', expanded);
    searchToggleBtn.setAttribute('aria-expanded', String(expanded));
    searchToggleBtn.classList.toggle('is-active', expanded);

    if (expanded) {
        searchInputEl.focus();
    } else {
        searchInputEl.value = '';
        if (currentSearchQuery) {
            currentSearchQuery = '';
            renderView(currentNode);
        }
        searchInputEl.blur();
        searchToggleBtn.focus();
    }
}

function setupViewToolbar() {
    if (!searchInputEl || !searchToggleBtn) return;

    searchToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentlyExpanded = searchWrapEl.classList.contains('expanded');
        setSearchExpanded(!currentlyExpanded);
    });

    searchInputEl.addEventListener('input', () => {
        const query = searchInputEl.value.trim().toLowerCase();
        if (currentSearchQuery !== query) {
            currentSearchQuery = query;
            renderView(currentNode);
        }
    });

    searchInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setSearchExpanded(false);
        }
    });

    document.addEventListener('click', (e) => {
        if (searchWrapEl.classList.contains('expanded') && !searchWrapEl.contains(e.target) && !searchToggleBtn.contains(e.target)) {
            setSearchExpanded(false);
        }
    });
}

function getVisibleNodesForCurrentView(childNodes) {
    let list = [...childNodes];
    if (currentSearchQuery) {
        list = list.filter((item) => {
            const title = (item.title || '').toLowerCase();
            const content = (item.content || '').toLowerCase();
            return title.includes(currentSearchQuery) || content.includes(currentSearchQuery);
        });
    }

    return list;
}

function navigateToNode(node) {
    exitOrganizeMode();
    window.collapseFavoritesBar();
    performViewTransition(() => {
        if (currentNode !== node) {
            pathStack.push(currentNode);
        }
        currentNode = node;
        renderView(currentNode);
        updateBreadcrumb();
    }, 'forward');
}

function navigateToHome() {
    if (!jsonData || currentNode === jsonData) return;
    exitOrganizeMode();
    window.collapseFavoritesBar();
    performViewTransition(() => {
        pathStack = [];
        currentNode = jsonData;
        renderView(currentNode);
        updateBreadcrumb();
    }, 'backward');
}

function updateBreadcrumb() {
    const breadcrumbContainer = document.getElementById('breadcrumb-nav');
    if (!breadcrumbContainer) return;
    
    breadcrumbContainer.innerHTML = '';
    
    const createItem = (node, isLast = false) => {
        const item = document.createElement('div');
        item.classList.add('breadcrumb-item');
        
        if (isLast) {
            item.classList.add('active');
            item.textContent = node.title || 'Start';
        } else {
            const link = document.createElement('button');
            link.type = 'button';
            link.className = 'breadcrumb-link';
            link.textContent = node.title || 'Start';
            link.addEventListener('click', () => {
                const index = pathStack.indexOf(node);
                if (index !== -1) {
                    performViewTransition(() => {
                        pathStack = pathStack.slice(0, index + 1);
                        const targetNode = pathStack.pop();
                        currentNode = targetNode;
                        renderView(currentNode);
                        updateBreadcrumb();
                    }, 'backward');
                } else if (node === jsonData) {
                    navigateToHome();
                }
            });
            item.appendChild(link);
        }
        return item;
    };
    
    breadcrumbContainer.appendChild(createItem(jsonData, currentNode === jsonData));
    
    pathStack.forEach((node, index) => {
        if (node !== jsonData) {
            breadcrumbContainer.appendChild(createItem(node, false));
        }
    });
    
    if (currentNode !== jsonData) {
        breadcrumbContainer.appendChild(createItem(currentNode, true));
    }
    
    if (topbarBackBtn) {
        const hasPath = pathStack.length > 0;
        topbarBackBtn.classList.toggle('hidden', !hasPath);
    }
}

function adjustTextareaHeight(element) {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
}

function openNewPromptModal() {
    window.modalEl.removeAttribute('data-id');
    window.modalEl.setAttribute('data-mode', 'new');
    window.promptTitleInputEl.value = '';
    window.promptFullTextEl.value = '';
    
    window.openModal(window.modalEl);
    window.toggleEditMode(true);
    window.promptTitleInputEl.focus();
}

function collectNodesByType(node, targetType, acc) {
    if (!node) return;
    if (node.type === targetType) acc.push(node);
    (node.items || []).forEach(child => collectNodesByType(child, targetType, acc));
}

function resolveLinkedNode(node) {
    if (!node) return null;
    if (node.type === 'prompt-link' || node.type === 'folder-link') {
        return findNodeById(jsonData, node.targetId);
    }
    return node;
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
            dragClass: 'sortable-drag',
            onStart: (evt) => {
                sortableDragState = {
                    sourceId: evt.item?.getAttribute('data-id') || null,
                    combineIntent: null
                };
                window.clearDropTargetHighlights();
            },
            onMove: (evt) => {
                const combineIntent = window.resolveSortableCombineIntent(evt);
                if (combineIntent) {
                    if (sortableDragState) {
                        sortableDragState.combineIntent = combineIntent;
                    }
                    window.setDropTargetHighlight(combineIntent.targetId, combineIntent.targetType);
                    return false;
                }

                if (sortableDragState) {
                    sortableDragState.combineIntent = null;
                }
                window.clearDropTargetHighlights();
                return true;
            },
            onEnd: (evt) => {
                const combineIntent = sortableDragState?.combineIntent || null;
                window.clearDropTargetHighlights();

                if (combineIntent?.action === 'combine') {
                    combineIntoNewFolder(combineIntent.sourceId, combineIntent.targetId);
                    sortableDragState = null;
                    return;
                }

                if (combineIntent?.action === 'move-to-folder') {
                    moveNode(combineIntent.sourceId, combineIntent.targetId);
                    showNotification('Prompt in Ordner verschoben!', 'success');
                    sortableDragState = null;
                    return;
                }

                const orderChanged = window.reorderCurrentNodeItemsFromDom();
                if (orderChanged) {
                    window.persistJsonData('Reihenfolge gespeichert!', 'success');
                } else {
                    renderView(currentNode);
                }

                sortableDragState = null;
            },
        });
    } else {
        if (sortableInstance) {
            sortableInstance.destroy();
            sortableInstance = null;
        }
        sortableDragState = null;
        window.clearDropTargetHighlights();
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
            const parsed = JSON.parse(storedFavorites);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                 favoritePrompts = parsed;
            } else {
                 favoritePrompts = [];
            }
        } catch (error) {
            console.error("Fehler beim Laden der Favoriten:", error);
            favoritePrompts = [];
        }
    } else {
        favoritePrompts = [];
    }
    window.renderFavoritesDock();
}

function saveFavorites() {
    try {
        localStorage.setItem(favoritesKey, JSON.stringify(favoritePrompts));
    } catch (error) {
        console.error("Fehler beim Speichern der Favoriten:", error);
    }
}

function toggleFavoriteStatus(promptId) {
    if (!promptId) return;

    const index = favoritePrompts.indexOf(promptId);
    if (index === -1) {
        favoritePrompts.push(promptId);
        showNotification('Zu Favoriten hinzugefügt!', 'success');
    } else {
        favoritePrompts.splice(index, 1);
        showNotification('Aus Favoriten entfernt.', 'info');
    }

    saveFavorites();
    window.renderFavoritesDock();
    updateFavoriteButton(promptId);
}

function updateFavoriteButton(promptId) {
    if (!modalFavoriteBtn || !promptId) return;

    const isFav = isFavorite(promptId);
    modalFavoriteBtn.classList.toggle('is-favorite', isFav);
    modalFavoriteBtn.setAttribute('aria-label', isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen');

    if (starOutlineIcon && starFilledIcon) {
        starOutlineIcon.classList.toggle('hidden', isFav);
        starFilledIcon.classList.toggle('hidden', !isFav);
    }
}

function isFavorite(promptId) {
    return favoritePrompts.includes(promptId);
}

function clearAllFavorites() {
    if (confirm('Möchten Sie wirklich alle Favoriten löschen?')) {
        favoritePrompts = [];
        saveFavorites();
        window.renderFavoritesDock();
        showNotification('Alle Favoriten gelöscht.', 'info');
    }
}

function resetLocalStorage() {
    if (confirm('Möchten Sie die App wirklich zurücksetzen? Ihre Änderungen gehen verloren.')) {
        localStorage.removeItem(cloudStorageKey);
        localStorage.removeItem(cloudSyncTimestampKey);
        localStorage.removeItem(favoritesKey);
        window.location.reload();
    }
}

function copyPromptText(buttonElement = null) {
    copyToClipboard(promptFullTextEl.value, buttonElement || document.getElementById('copy-prompt-modal-button'));
}

function copyPromptTextForCard(node, buttonElement) {
    copyToClipboard(node.content || '', buttonElement);
}

function closeMoreMenu() {
    if (!moreMenu) return;
    moreMenu.classList.add('hidden');
    if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
}

function buildMoreMenu() {
    if (!moreMenu) return;
    moreMenu.innerHTML = '';

    const isAvailable = (btn) => !!btn && btn.style.display !== 'none' && !btn.disabled;
    const visibleIcon = (btn) => (btn ? btn.querySelector('svg.icon:not(.hidden)') : null);

    const addItem = (label, iconNode, action) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'add-menu-item more-menu-item';
        item.setAttribute('role', 'menuitem');
        if (iconNode) {
            const icon = iconNode.cloneNode(true);
            icon.classList.remove('hidden');
            item.appendChild(icon);
        }
        const span = document.createElement('span');
        span.textContent = label;
        item.appendChild(span);
        item._ptAction = action;
        moreMenu.appendChild(item);
    };

    const colorSchemeBtn = document.getElementById('color-scheme-button');

    if (isAvailable(organizeBtn)) {
        addItem(organizeBtn.getAttribute('aria-label') || 'Karten organisieren', visibleIcon(organizeBtn), () => organizeBtn.click());
    }
    if (isAvailable(downloadBtn)) {
        addItem('Download JSON', visibleIcon(downloadBtn), () => window.downloadCustomJson());
        addItem('Upload JSON', null, () => window.openUploadJsonModal());
    }
    if (isAvailable(resetBtn)) {
        addItem(resetBtn.getAttribute('aria-label') || 'Änderungen zurücksetzen', visibleIcon(resetBtn), () => resetBtn.click());
    }
    if (isAvailable(colorSchemeBtn)) {
        addItem(colorSchemeBtn.getAttribute('aria-label') || 'Design wechseln', visibleIcon(colorSchemeBtn), () => colorSchemeBtn.click());
    }
    if (isAvailable(fullscreenBtn)) {
        addItem(fullscreenBtn.getAttribute('aria-label') || 'Vollbildmodus', visibleIcon(fullscreenBtn), () => fullscreenBtn.click());
    }
    if (isAvailable(installAppBtn)) {
        addItem(installAppBtn.getAttribute('aria-label') || 'Web-App installieren', visibleIcon(installAppBtn), () => installAppBtn.click());
    }
    if (isAvailable(clearFavoritesBtn)) {
        addItem(clearFavoritesBtn.getAttribute('aria-label') || 'Alle Favoriten löschen', visibleIcon(clearFavoritesBtn), () => clearFavoritesBtn.click());
    }

    if (!moreMenu.children.length) {
        const empty = document.createElement('div');
        empty.className = 'add-menu-item';
        empty.style.opacity = '0.6';
        empty.style.cursor = 'default';
        empty.textContent = 'Keine weiteren Aktionen';
        moreMenu.appendChild(empty);
    }
}

function copyToClipboard(text, buttonElement = null, node = null) {
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
            
            const rect = buttonElement.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            if (window.enhancedCopySuccess) window.enhancedCopySuccess(buttonElement, x, y);
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
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        textArea.style.opacity = '0';
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

        let removed = false;
        const removeNotification = () => {
            if (removed) return;
            removed = true;
            if (notificationEl.parentNode === notificationAreaEl) {
                notificationEl.remove();
            }
        };

        notificationEl.addEventListener('transitionend', removeNotification, { once: true });
        setTimeout(removeNotification, 420);
        notificationTimeoutId = null;
    }, 2800);
}

function showContextMenuForEmptyArea(e) {
    if (containerEl.classList.contains('edit-mode')) return;

    const menuItems = [
        {
            label: 'Neuer Prompt',
            iconClass: 'icon-add',
            action: openNewPromptModal
        },
        {
            label: 'Neuer Ordner',
            iconClass: 'icon-add-folder',
            action: window.openCreateFolderModal
        }
    ];

    window.ContextMenu.show(e, menuItems);
}

function detectDisplayMode() {
    if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
    if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
    return 'browser';
}

function calculateViewportBottomOffset() {
    const visualHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const windowHeight = window.innerHeight;
    const delta = windowHeight - visualHeight;
    return Math.max(0, delta);
}

function updateViewportMetrics() {
    const offset = calculateViewportBottomOffset();
    document.documentElement.style.setProperty('--viewport-bottom-offset', `${offset}px`);
    
    const vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01;
    document.documentElement.style.setProperty('--app-vh', `${vh * 100}px`);
}

function bindViewportObservers() {
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewportMetrics);
        window.visualViewport.addEventListener('scroll', updateViewportMetrics);
    }
}

function handleWindowResize() {
    updateViewportMetrics();
    updateDockPositioning();
    if (window.requestFavoritesLayoutFrame) window.requestFavoritesLayoutFrame();
}

function updateDockPositioning() {
    if (!favoritesDockEl) return;
    const offset = calculateViewportBottomOffset();
    if (isMobile()) {
        favoritesDockEl.style.bottom = '0';
    } else {
        favoritesDockEl.style.bottom = `${offset}px`;
    }
}

function resetFavoriteLayoutCache({ clearStyles = false } = {}) {
    if (clearStyles && favoritesDockEl) {
        favoritesDockEl.style.removeProperty('--favorite-chip-height');
    }
}

function getFavoritePreviewText(content) {
    if (!content) return '';
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.slice(0, 2).join(' ');
}

function detectAndSetPlatform() {
    const userAgent = navigator.userAgent || '';
    const platform = navigator.platform || '';
    let detected = 'other';

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        detected = 'ios';
    } else if (/Mac/.test(platform)) {
        detected = 'mac';
    } else if (/Android/.test(userAgent)) {
        detected = 'android';
    } else if (/Win/.test(platform)) {
        detected = 'windows';
    }

    document.documentElement.setAttribute('data-platform', detected);
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const isEditingText = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
        if (isEditingText) return;

        if (e.key === 'Escape') {
            exitOrganizeMode();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            setSearchExpanded(true);
        }
    });
}

function setupSwipeBackGesture() {
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeThreshold = 80;
    const maxVerticalDeviation = 45;

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!touchStartX) return;
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;

        if (diffX > swipeThreshold && Math.abs(diffY) < maxVerticalDeviation) {
            if (pathStack.length > 0 && !modalEl.classList.contains('visible')) {
                navigateOneLevelUp();
            }
        }
        touchStartX = 0;
    }, { passive: true });
}

// Swiping gesture to pull-to-refresh
function setupPullToRefresh() {
    let startY = 0;
    let isPulling = false;
    const pullThreshold = 100;
    
    document.addEventListener('touchstart', (e) => {
        if (containerEl.scrollTop === 0 && e.touches.length === 1) {
            startY = e.touches[0].clientY;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (startY === 0) return;
        const currentY = e.touches[0].clientY;
        const diffY = currentY - startY;

        if (diffY > 0 && containerEl.scrollTop === 0) {
            isPulling = true;
            const pullDistance = Math.min(diffY * 0.4, pullThreshold + 20);
            containerEl.style.transform = `translateY(${pullDistance}px)`;
            if (pullDistance > pullThreshold) {
                containerEl.classList.add('pull-to-refresh-ready');
            } else {
                containerEl.classList.remove('pull-to-refresh-ready');
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        if (!isPulling) return;
        isPulling = false;
        startY = 0;
        containerEl.style.transform = '';
        if (containerEl.classList.contains('pull-to-refresh-ready')) {
            containerEl.classList.remove('pull-to-refresh-ready');
            window.syncFromCloud({ silent: false, reason: 'pull-to-refresh' });
        }
    }, { passive: true });
}

function setupColorSchemeWatcher() {
    const schemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    schemeQuery.addEventListener('change', () => {
        const stored = localStorage.getItem('templates-color-scheme') || 'auto';
        if (stored === 'auto') {
            initColorScheme();
        }
    });
}

function initColorScheme() {
    const stored = localStorage.getItem('templates-color-scheme') || 'auto';
    applyColorScheme(stored, false);
}

function applyColorScheme(scheme, save = true) {
    if (save) {
        localStorage.setItem('templates-color-scheme', scheme);
    }
    
    let resolvedScheme = scheme;
    if (scheme === 'auto') {
        resolvedScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-color-scheme', resolvedScheme);
    updateColorSchemeButton();
    updateThemedAppIcon(resolvedScheme);
}

function updateThemedAppIcon(scheme) {
    const iconLink = document.querySelector('link[rel="icon"]');
    if (iconLink) {
        iconLink.href = scheme === 'dark' ? 'icons/favicon-dark.svg' : 'icons/favicon-light.svg';
    }
}

function toggleColorScheme() {
    const current = localStorage.getItem('templates-color-scheme') || 'auto';
    let next = 'dark';
    if (current === 'dark') next = 'light';
    else if (current === 'light') next = 'auto';
    applyColorScheme(next);
}

function updateColorSchemeButton() {
    const btn = document.getElementById('color-scheme-button');
    if (!btn) return;

    const current = localStorage.getItem('templates-color-scheme') || 'auto';
    btn.setAttribute('data-scheme', current);
    
    const labelMap = {
        'auto': 'Automatisches Design (System)',
        'light': 'Helles Design',
        'dark': 'Dunkles Design'
    };
    btn.setAttribute('aria-label', labelMap[current] || 'Design wechseln');
}

function updateThemeColorForNode(node) {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) return;

    const isDarkMode = document.documentElement.getAttribute('data-color-scheme') === 'dark';
    if (isDarkMode) {
        themeColorMeta.setAttribute('content', '#0a0d18');
    } else {
        themeColorMeta.setAttribute('content', '#f3f6fc');
    }
}

function setupPwaInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        if (installAppBtn) {
            installAppBtn.style.display = 'inline-flex';
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        if (installAppBtn) {
            installAppBtn.style.display = 'none';
        }
        showNotification('App erfolgreich installiert!', 'success');
    });

    if (installAppBtn) {
        installAppBtn.addEventListener('click', handleInstallAppClick);
    }
}

async function handleInstallAppClick() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
        deferredInstallPrompt = null;
        if (installAppBtn) {
            installAppBtn.style.display = 'none';
        }
    }
}

function createContextMenu() {
    window.ContextMenu = {
        menuEl: null,
        
        init() {
            if (this.menuEl) return;
            
            this.menuEl = document.createElement('div');
            this.menuEl.className = 'context-menu hidden';
            this.menuEl.setAttribute('role', 'menu');
            document.body.appendChild(this.menuEl);

            document.addEventListener('click', () => this.hide());
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.hide();
            });
        },

        show(e, items) {
            this.init();
            this.menuEl.innerHTML = '';

            items.forEach(item => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'context-menu-item';
                button.setAttribute('role', 'menuitem');
                
                if (item.iconClass) {
                    const iconSpan = document.createElement('span');
                    iconSpan.className = `icon ${item.iconClass}`;
                    button.appendChild(iconSpan);
                }

                const labelSpan = document.createElement('span');
                labelSpan.textContent = item.label;
                button.appendChild(labelSpan);

                button.addEventListener('click', () => {
                    this.hide();
                    item.action();
                });

                this.menuEl.appendChild(button);
            });

            this.menuEl.classList.remove('hidden');
            
            const menuWidth = this.menuEl.offsetWidth || 180;
            const menuHeight = this.menuEl.offsetHeight || 150;
            
            let x = e.clientX;
            let y = e.clientY;

            if (x + menuWidth > window.innerWidth) {
                x = window.innerWidth - menuWidth - 10;
            }
            if (y + menuHeight > window.innerHeight) {
                y = window.innerHeight - menuHeight - 10;
            }

            this.menuEl.style.left = `${x}px`;
            this.menuEl.style.top = `${y}px`;
            
            requestAnimationFrame(() => {
                this.menuEl.classList.add('visible');
            });
        },

        hide() {
            if (!this.menuEl || this.menuEl.classList.contains('hidden')) return;
            this.menuEl.classList.remove('visible');
            this.menuEl.classList.add('hidden');
        }
    };
}

function confirmDeleteNode(ids) {
    if (!ids || !ids.length) return;
    const msg = ids.length > 1 ? `Möchten Sie diese ${ids.length} Elemente wirklich unwiderruflich löschen?` : 'Möchten Sie dieses Element wirklich unwiderruflich löschen?';
    if (confirm(msg)) {
        deleteItemsByIds(ids);
    }
}

// State-Bridge: Getter/Setter mapping variables to the global window object
try {
    Object.defineProperties(window, {
        jsonData: { configurable: true, get: () => jsonData, set: (v) => { jsonData = v; } },
        currentNode: { configurable: true, get: () => currentNode, set: (v) => { currentNode = v; } },
        pathStack: { configurable: true, get: () => pathStack, set: (v) => { pathStack = v; } },
        currentSearchQuery: { configurable: true, get: () => currentSearchQuery, set: (v) => { currentSearchQuery = v; } },
        favoritePrompts: { configurable: true, get: () => favoritePrompts, set: (v) => { favoritePrompts = v; } },
        prefersReducedMotion: { configurable: true, get: () => prefersReducedMotion, set: (v) => { prefersReducedMotion = v; } },
        auroraParallaxOffset: { configurable: true, get: () => auroraParallaxOffset, set: (v) => { auroraParallaxOffset = v; } },
        containerEl: { configurable: true, get: () => containerEl, set: (v) => { containerEl = v; } },
        favoritesDockEl: { configurable: true, get: () => favoritesDockEl, set: (v) => { favoritesDockEl = v; } },
        favoritesListEl: { configurable: true, get: () => favoritesListEl, set: (v) => { favoritesListEl = v; } },
        favoritesScrollAreaEl: { configurable: true, get: () => favoritesScrollAreaEl, set: (v) => { favoritesScrollAreaEl = v; } },
        favoritesToggleBtn: { configurable: true, get: () => favoritesToggleBtn, set: (v) => { favoritesToggleBtn = v; } },
        modalEl: { configurable: true, get: () => modalEl, set: (v) => { modalEl = v; } },
        clearFavoritesBtn: { configurable: true, get: () => clearFavoritesBtn, set: (v) => { clearFavoritesBtn = v; } },
        topBarEl: { configurable: true, get: () => topBarEl, set: (v) => { topBarEl = v; } },
        fixedBackBtn: { configurable: true, get: () => fixedBackBtn, set: (v) => { fixedBackBtn = v; } },
        resetBtn: { configurable: true, get: () => resetBtn, set: (v) => { resetBtn = v; } },
        addBtn: { configurable: true, get: () => addBtn, set: (v) => { addBtn = v; } },
        addMenu: { configurable: true, get: () => addMenu, set: (v) => { addMenu = v; } },
        moreBtn: { configurable: true, get: () => moreBtn, set: (v) => { moreBtn = v; } },
        moreMenu: { configurable: true, get: () => moreMenu, set: (v) => { moreMenu = v; } },
        organizeBtn: { configurable: true, get: () => organizeBtn, set: (v) => { organizeBtn = v; } },
        downloadBtn: { configurable: true, get: () => downloadBtn, set: (v) => { downloadBtn = v; } },
        downloadMenu: { configurable: true, get: () => downloadMenu, set: (v) => { downloadMenu = v; } },
        storageSourceBtn: { configurable: true, get: () => storageSourceBtn, set: (v) => { storageSourceBtn = v; } },
        installAppBtn: { configurable: true, get: () => installAppBtn, set: (v) => { installAppBtn = v; } },
        deferredInstallPrompt: { configurable: true, get: () => deferredInstallPrompt, set: (v) => { deferredInstallPrompt = v; } },
        serverSyncTimestamp: { configurable: true, get: () => serverSyncTimestamp, set: (v) => { serverSyncTimestamp = v; } },
        isSyncInFlight: { configurable: true, get: () => isSyncInFlight, set: (v) => { isSyncInFlight = v; } },
        lastSuccessfulSyncAt: { configurable: true, get: () => lastSuccessfulSyncAt, set: (v) => { lastSuccessfulSyncAt = v; } },
        syncBroadcastChannel: { configurable: true, get: () => syncBroadcastChannel, set: (v) => { syncBroadcastChannel = v; } },
        springLoadTimeout: { configurable: true, get: () => springLoadTimeout, set: (v) => { springLoadTimeout = v; } },
        sortableInstance: { configurable: true, get: () => sortableInstance, set: (v) => { sortableInstance = v; } },
        sortableDragState: { configurable: true, get: () => sortableDragState, set: (v) => { sortableDragState = v; } },
        dragSource: { configurable: true, get: () => dragSource, set: (v) => { dragSource = v; } },
        dragTarget: { configurable: true, get: () => dragTarget, set: (v) => { dragTarget = v; } },
        touchStartX: { configurable: true, get: () => touchStartX, set: (v) => { touchStartX = v; } },
        touchStartY: { configurable: true, get: () => touchStartY, set: (v) => { touchStartY = v; } },
        touchEndX: { configurable: true, get: () => touchEndX, set: (v) => { touchEndX = v; } },
        touchEndY: { configurable: true, get: () => touchEndY, set: (v) => { touchEndY = v; } },
        svgTemplateFolder: { configurable: true, get: () => svgTemplateFolder, set: (v) => { svgTemplateFolder = v; } },
        svgTemplateExpand: { configurable: true, get: () => svgTemplateExpand, set: (v) => { svgTemplateExpand = v; } },
        svgTemplateCopy: { configurable: true, get: () => svgTemplateCopy, set: (v) => { svgTemplateCopy = v; } },
        svgTemplateCheckmark: { configurable: true, get: () => svgTemplateCheckmark, set: (v) => { svgTemplateCheckmark = v; } },
        svgTemplateDelete: { configurable: true, get: () => svgTemplateDelete, set: (v) => { svgTemplateDelete = v; } },
        svgTemplateEdit: { configurable: true, get: () => svgTemplateEdit, set: (v) => { svgTemplateEdit = v; } },
        svgTemplateMove: { configurable: true, get: () => svgTemplateMove, set: (v) => { svgTemplateMove = v; } },
        promptFullTextEl: { configurable: true, get: () => promptFullTextEl, set: (v) => { promptFullTextEl = v; } },
        promptTitleInputEl: { configurable: true, get: () => promptTitleInputEl, set: (v) => { promptTitleInputEl = v; } },
        createFolderModalEl: { configurable: true, get: () => createFolderModalEl, set: (v) => { createFolderModalEl = v; } },
        folderTitleInputEl: { configurable: true, get: () => folderTitleInputEl, set: (v) => { folderTitleInputEl = v; } },
        createFolderSaveBtn: { configurable: true, get: () => createFolderSaveBtn, set: (v) => { createFolderSaveBtn = v; } },
        createFolderCancelBtn: { configurable: true, get: () => createFolderCancelBtn, set: (v) => { createFolderCancelBtn = v; } },
        moveItemModalEl: { configurable: true, get: () => moveItemModalEl, set: (v) => { moveItemModalEl = v; } },
        moveItemFolderTreeEl: { configurable: true, get: () => moveItemFolderTreeEl, set: (v) => { moveItemFolderTreeEl = v; } },
        moveItemConfirmBtn: { configurable: true, get: () => moveItemConfirmBtn, set: (v) => { moveItemConfirmBtn = v; } },
        moveItemCancelBtn: { configurable: true, get: () => moveItemCancelBtn, set: (v) => { moveItemCancelBtn = v; } },
        uploadJsonModalEl: { configurable: true, get: () => uploadJsonModalEl, set: (v) => { uploadJsonModalEl = v; } },
        uploadDropZoneEl: { configurable: true, get: () => uploadDropZoneEl, set: (v) => { uploadDropZoneEl = v; } },
        uploadJsonInputEl: { configurable: true, get: () => uploadJsonInputEl, set: (v) => { uploadJsonInputEl = v; } },
        uploadJsonSelectBtn: { configurable: true, get: () => uploadJsonSelectBtn, set: (v) => { uploadJsonSelectBtn = v; } },
        uploadJsonCancelBtn: { configurable: true, get: () => uploadJsonCancelBtn, set: (v) => { uploadJsonCancelBtn = v; } },
        linkItemModalEl: { configurable: true, get: () => linkItemModalEl, set: (v) => { linkItemModalEl = v; } },
        linkItemListEl: { configurable: true, get: () => linkItemListEl, set: (v) => { linkItemListEl = v; } },
        linkItemConfirmBtn: { configurable: true, get: () => linkItemConfirmBtn, set: (v) => { linkItemConfirmBtn = v; } },
        linkItemCancelBtn: { configurable: true, get: () => linkItemCancelBtn, set: (v) => { linkItemCancelBtn = v; } },
        linkItemModalTitleEl: { configurable: true, get: () => linkItemModalTitleEl, set: (v) => { linkItemModalTitleEl = v; } },
        modalEditBtn: { configurable: true, get: () => modalEditBtn, set: (v) => { modalEditBtn = v; } },
        modalSaveBtn: { configurable: true, get: () => modalSaveBtn, set: (v) => { modalSaveBtn = v; } },
        modalCloseBtn: { configurable: true, get: () => modalCloseBtn, set: (v) => { modalCloseBtn = v; } },
        copyModalButton: { configurable: true, get: () => copyModalButton, set: (v) => { copyModalButton = v; } },
        modalFavoriteBtn: { configurable: true, get: () => modalFavoriteBtn, set: (v) => { modalFavoriteBtn = v; } },
        cloudStorageKey: { configurable: true, get: () => cloudStorageKey },
        cloudSyncTimestampKey: { configurable: true, get: () => cloudSyncTimestampKey },
        currentTransitionDurationMediumMs: { configurable: true, get: () => currentTransitionDurationMediumMs }
    });
} catch (e) {
    console.warn('State-Bridge konnte nicht installiert werden:', e);
}
