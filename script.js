document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.querySelector('.cards-container');
    const promptModal = document.getElementById('prompt-modal');
    const modalContent = promptModal.querySelector('.modal-content');
    const addPromptButton = document.getElementById('add-prompt-button');
    const modalCancelButton = document.getElementById('modal-cancel-button');
    const modalSaveButton = document.getElementById('modal-save-button');
    const promptTitleInput = document.getElementById('prompt-title-input');
    const promptFulltextInput = document.getElementById('prompt-fulltext-input');
    const cardTemplate = document.getElementById('card-template');
    const folderCardTemplate = document.getElementById('folder-card-template');
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    const backButton = document.getElementById('back-button');
    const notificationArea = document.getElementById('notification-area');
    const resetButton = document.getElementById('reset-button');
    const downloadButton = document.getElementById('download-button');
    const mobileBackButton = document.getElementById('mobile-back-button');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileAddButton = document.getElementById('mobile-add-button');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const fullscreenButton = document.getElementById('fullscreen-button');

    let prompts = [];
    let currentPath = [];
    let editingCardId = null;
    let longPressTimer;
    let isEditMode = false;
    let draggedItem = null;

    const defaultPrompts = [
        { id: 'folder_1', title: 'Beispiel-Ordner', type: 'folder', children: [
            { id: 'prompt_1', title: 'Was sind die Hauptstädte Europas?', content: 'Liste alle Hauptstädte der Länder in Europa auf.' },
            { id: 'prompt_2', title: 'E-Mail verfassen', content: 'Schreibe eine professionelle E-Mail an einen Kunden, um ein Meeting zu vereinbaren.' }
        ]},
        { id: 'prompt_3', title: 'Kreatives Schreiben', content: 'Schreibe einen kurzen Absatz über eine futuristische Stadt.' }
    ];

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const iconSvg = type === 'success'
            ? `<svg class="icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
            : `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

        notification.innerHTML = `${iconSvg}<span>${message}</span>`;
        notificationArea.appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        setTimeout(() => {
            notification.classList.add('fade-out');
            notification.addEventListener('animationend', () => {
                notification.remove();
            });
        }, 3000);
    }

    function savePrompts() {
        try {
            localStorage.setItem('prompts', JSON.stringify(prompts));
        } catch (error) {
            console.error('Fehler beim Speichern der Prompts:', error);
            showNotification('Speichern fehlgeschlagen', 'error');
        }
    }

    function loadPrompts() {
        try {
            const storedPrompts = localStorage.getItem('prompts');
            if (storedPrompts) {
                prompts = JSON.parse(storedPrompts);
            } else {
                prompts = JSON.parse(JSON.stringify(defaultPrompts));
                savePrompts();
            }
        } catch (error) {
            console.error('Fehler beim Laden der Prompts:', error);
            prompts = JSON.parse(JSON.stringify(defaultPrompts));
            showNotification('Laden fehlgeschlagen, Standard wiederhergestellt', 'error');
        }
    }

    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function getCurrentLevelItems() {
        let currentLevel = prompts;
        for (const folderId of currentPath) {
            const folder = findItemById(currentLevel, folderId);
            if (folder && folder.type === 'folder') {
                currentLevel = folder.children;
            } else {
                return [];
            }
        }
        return currentLevel;
    }

    function findItemById(items, id) {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.type === 'folder') {
                const found = findItemById(item.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    function findParentCollectionAndItem(items, id, path = []) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.id === id) {
                return { collection: items, item: item, index: i, path: path };
            }
            if (item.type === 'folder') {
                const result = findParentCollectionAndItem(item.children, id, [...path, item.id]);
                if (result) return result;
            }
        }
        return null;
    }

    function renderBreadcrumb() {
        breadcrumbContainer.innerHTML = '';
        const rootLink = document.createElement('span');
        rootLink.textContent = 'Home';
        rootLink.className = 'breadcrumb-link';
        rootLink.onclick = () => navigateToPath([]);

        breadcrumbContainer.appendChild(rootLink);

        let currentLevel = prompts;
        currentPath.forEach((folderId, index) => {
            const folder = findItemById(currentLevel, folderId);
            if (folder) {
                breadcrumbContainer.appendChild(document.createTextNode(' / '));
                const folderLink = document.createElement('span');
                folderLink.textContent = folder.title;

                if (index < currentPath.length - 1) {
                    folderLink.className = 'breadcrumb-link';
                    const pathToFolder = currentPath.slice(0, index + 1);
                    folderLink.onclick = () => navigateToPath(pathToFolder);
                } else {
                    folderLink.className = 'current-level-active';
                }
                breadcrumbContainer.appendChild(folderLink);
                currentLevel = folder.children;
            }
        });

        backButton.classList.toggle('hidden', currentPath.length === 0);
        mobileNav.classList.toggle('hidden', currentPath.length === 0);
    }

    function renderCards(direction = 'initial') {
        const itemsToRender = getCurrentLevelItems();
        
        function updateDOM() {
            cardsContainer.innerHTML = '';
            if (itemsToRender.length === 0) return;

            itemsToRender.forEach(item => {
                const template = item.type === 'folder' ? folderCardTemplate : cardTemplate;
                const cardClone = template.content.cloneNode(true);
                const cardElement = cardClone.querySelector('.card');
                cardElement.dataset.cardId = item.id;
                cardElement.querySelector('h3').textContent = item.title;

                if (item.type === 'folder') {
                    cardElement.addEventListener('click', () => {
                        if (isEditMode) return;
                        navigateToPath([...currentPath, item.id]);
                    });
                } else {
                    const editButton = cardElement.querySelector('.edit-button');
                    const copyButton = cardElement.querySelector('.copy-button');

                    editButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openModal(item.id);
                    });

                    copyButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(item.content).then(() => {
                            showNotification('Prompt kopiert!');
                        }).catch(err => {
                             console.error('Kopieren fehlgeschlagen:', err);
                             showNotification('Kopieren fehlgeschlagen', 'error');
                        });
                    });
                     cardElement.addEventListener('click', () => {
                        if (isEditMode) return;
                        openModal(item.id, true);
                    });
                }

                const deleteButton = cardElement.querySelector('.delete-button');
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteCard(item.id);
                });
                
                setupCardEventListeners(cardElement);

                cardsContainer.appendChild(cardElement);
                
                requestAnimationFrame(() => {
                    cardElement.style.opacity = 1;
                    cardElement.style.transform = 'translateY(0) scale(1) translateZ(0)';
                });
            });
            updateCardInteractivity();
        }

        if (document.startViewTransition) {
            document.documentElement.setAttribute('data-page-transition-direction', direction);
            const transition = document.startViewTransition(() => updateDOM());
            transition.finished.then(() => {
                document.documentElement.removeAttribute('data-page-transition-direction');
            });
        } else {
            updateDOM();
        }

        renderBreadcrumb();
    }
    
    function navigateToPath(newPath) {
        const direction = newPath.length > currentPath.length ? 'forward' : 'backward';
        currentPath = newPath;
        renderCards(direction);
    }

    function openModal(cardId = null, readOnly = false) {
        editingCardId = cardId;
        promptFulltextInput.classList.remove('is-editing');
        promptFulltextInput.readOnly = false;
        promptTitleInput.readOnly = false;
        modalSaveButton.style.display = 'inline-flex';
        modalCancelButton.textContent = 'Abbrechen';
        
        if (cardId) {
            const result = findParentCollectionAndItem(prompts, cardId);
            if (result) {
                const card = result.item;
                promptTitleInput.value = card.title;
                if (card.type === 'folder') {
                    promptFulltextInput.style.display = 'none';
                } else {
                    promptFulltextInput.style.display = 'block';
                    promptFulltextInput.value = card.content;
                }

                if (readOnly) {
                    promptTitleInput.readOnly = true;
                    promptFulltextInput.readOnly = true;
                    promptFulltextInput.classList.remove('is-editing');
                    modalSaveButton.style.display = 'none';
                    modalCancelButton.textContent = 'Schließen';
                } else {
                     promptFulltextInput.classList.add('is-editing');
                }
            }
        } else {
            promptTitleInput.value = '';
            promptFulltextInput.value = '';
            promptFulltextInput.style.display = 'block';
            promptFulltextInput.classList.add('is-editing');
        }
        
        promptModal.classList.add('visible');
    }

    function closeModal() {
        promptModal.classList.remove('visible');
    }

    function saveCard() {
        const title = promptTitleInput.value.trim();
        const content = promptFulltextInput.value.trim();
        const currentLevel = getCurrentLevelItems();

        if (!title) {
            showNotification('Der Titel darf nicht leer sein.', 'error');
            return;
        }

        if (editingCardId) {
            const result = findParentCollectionAndItem(prompts, editingCardId);
            if (result) {
                result.item.title = title;
                if (result.item.type !== 'folder') {
                    result.item.content = content;
                }
            }
        } else {
            const newCard = {
                id: generateUniqueId(),
                title: title,
                content: content,
                type: 'prompt'
            };
            currentLevel.push(newCard);
        }

        savePrompts();
        renderCards();
        closeModal();
        showNotification(editingCardId ? 'Karte aktualisiert' : 'Karte hinzugefügt');
    }
    
    function deleteCard(cardId) {
        const result = findParentCollectionAndItem(prompts, cardId);
        if (result) {
            result.collection.splice(result.index, 1);
            savePrompts();

            const cardElement = cardsContainer.querySelector(`.card[data-card-id="${cardId}"]`);
            if (cardElement) {
                cardElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                cardElement.style.transform = 'scale(0.8)';
                cardElement.style.opacity = '0';
                cardElement.addEventListener('transitionend', () => {
                    cardElement.remove();
                });
            }
            showNotification('Karte gelöscht');
            exitEditMode();
        }
    }
    
    function toggleEditMode(enable) {
        if (enable) {
            isEditMode = true;
            cardsContainer.classList.add('edit-mode');
        } else {
            isEditMode = false;
            cardsContainer.classList.remove('edit-mode');
        }
    }
    
    function exitEditMode() {
        if (isEditMode) {
            toggleEditMode(false);
        }
    }

    function setupCardEventListeners(card) {
        let pressTimer = null;

        const startPress = (e) => {
            if (e.button !== 0 && e.type !== 'touchstart') return; // Nur auf Linksklick reagieren
            
            clearTimeout(pressTimer);
            pressTimer = setTimeout(() => {
                if (!promptModal.classList.contains('visible')) {
                    toggleEditMode(true);
                }
            }, 500);
        };

        const cancelPress = () => {
            clearTimeout(pressTimer);
        };
        
        card.addEventListener('mousedown', startPress);
        card.addEventListener('mouseup', cancelPress);
        card.addEventListener('mouseleave', cancelPress);
        card.addEventListener('touchstart', startPress, { passive: true });
        card.addEventListener('touchend', cancelPress);
        card.addEventListener('touchcancel', cancelPress);

        card.setAttribute('draggable', true);
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    }
    
    function handleDragStart(e) {
        if (!isEditMode) {
            e.preventDefault();
            return;
        }
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.cardId);
        setTimeout(() => {
            this.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        draggedItem = null;
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        if (!isEditMode || !draggedItem) return;

        const target = e.target.closest('.card');
        if (target && target !== draggedItem) {
            target.classList.add('drop-target');
        }
    }

    function handleDragLeave(e) {
         const target = e.target.closest('.card');
         if(target) {
            target.classList.remove('drop-target');
         }
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!isEditMode || !draggedItem) return;
        
        const targetCard = e.target.closest('.card');
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = targetCard ? targetCard.dataset.cardId : null;

        if (draggedId === targetId) return;

        const items = getCurrentLevelItems();
        const draggedIndex = items.findIndex(item => item.id === draggedId);
        
        if (draggedIndex === -1) return;

        const [reorderedItem] = items.splice(draggedIndex, 1);
        
        if (targetId) {
            const targetIndex = items.findIndex(item => item.id === targetId);
            if (targetIndex > -1) {
                items.splice(targetIndex, 0, reorderedItem);
            } else {
                 items.push(reorderedItem);
            }
        } else {
            items.push(reorderedItem);
        }
        
        savePrompts();
        renderCards();
        exitEditMode();
    }
    
    function updateCardInteractivity() {
        const cards = cardsContainer.querySelectorAll('.card');
        cards.forEach(card => {
            if (isEditMode) {
                card.setAttribute('draggable', 'true');
            } else {
                card.setAttribute('draggable', 'false');
            }
        });
    }

    function init() {
        loadPrompts();

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.toggle('light-mode', savedTheme === 'light');
        }

        if (!navigator.standalone && window.matchMedia('(display-mode: standalone)').matches === false) {
           document.body.setAttribute('data-fullscreen-supported', '');
        }
        
        fullscreenButton.addEventListener('click', () => {
            const enterIcon = fullscreenButton.querySelector('.icon-fullscreen-enter');
            const exitIcon = fullscreenButton.querySelector('.icon-fullscreen-exit');
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
                enterIcon.classList.add('hidden');
                exitIcon.classList.remove('hidden');
            } else {
                document.exitFullscreen();
                enterIcon.classList.remove('hidden');
                exitIcon.classList.add('hidden');
            }
        });
        
        document.addEventListener('fullscreenchange', () => {
            const isFullscreen = !!document.fullscreenElement;
            const enterIcon = fullscreenButton.querySelector('.icon-fullscreen-enter');
            const exitIcon = fullscreenButton.querySelector('.icon-fullscreen-exit');
            enterIcon.classList.toggle('hidden', isFullscreen);
            exitIcon.classList.toggle('hidden', !isFullscreen);
        });

        addPromptButton.addEventListener('click', () => openModal());
        mobileAddButton.addEventListener('click', () => openModal());
        modalSaveButton.addEventListener('click', saveCard);
        modalCancelButton.addEventListener('click', closeModal);
        promptModal.addEventListener('click', (e) => {
            if (e.target === promptModal) closeModal();
        });

        backButton.addEventListener('click', () => {
            if (currentPath.length > 0) {
                navigateToPath(currentPath.slice(0, -1));
            }
        });
        
        mobileBackButton.addEventListener('click', () => backButton.click());

        resetButton.addEventListener('click', () => {
            if (confirm('Möchten Sie wirklich alle Karten und Ordner auf den Standard zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                localStorage.removeItem('prompts');
                loadPrompts();
                navigateToPath([]);
                showNotification('Karten auf Standard zurückgesetzt.');
            }
        });

        downloadButton.addEventListener('click', () => {
            try {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "prompts.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
                showNotification('Daten erfolgreich heruntergeladen.');
            } catch (error) {
                console.error("Download failed:", error);
                showNotification('Download fehlgeschlagen.', 'error');
            }
        });

        themeToggleButton.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', theme);
        });

        document.body.addEventListener('click', (e) => {
             if (isEditMode && !e.target.closest('.card')) {
                exitEditMode();
            }
        });

        cardsContainer.addEventListener('dragover', handleDragOver);
        cardsContainer.addEventListener('dragleave', handleDragLeave);
        cardsContainer.addEventListener('drop', handleDrop);
        
        const cardElements = document.querySelectorAll('.card');
        cardElements.forEach(card => {
             setupCardEventListeners(card);
        });
        
        navigateToPath([]);
    }

    init();
});
