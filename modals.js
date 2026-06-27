// =====================================================================
// MODAL DIALOGS, EDITORS AND JSON OPERATIONS
// =====================================================================

window.openPromptModal = function(node, calledFromPopstate = false) {
    if (node) {
        window.modalEl.setAttribute('data-id', node.id);
        window.promptFullTextEl.value = node.content || '';
        window.updateFavoriteButton(node.id);
        requestAnimationFrame(() => window.adjustTextareaHeight(window.promptFullTextEl));
    }
    window.openModal(window.modalEl);
    if (window.isMobile() && !calledFromPopstate && node) {
        const currentState = window.history.state || { path: [], modalOpen: false };
        if (!currentState.modalOpen) {
            const currentViewPathIds = window.pathStack.map(n => n.id);
            window.history.pushState({ path: currentViewPathIds, modalOpen: true, promptId: node.id }, '', window.location.href);
        }
    }
};

window.openCreateFolderModal = function() {
    window.folderTitleInputEl.value = '';
    window.openModal(window.createFolderModalEl);
    window.folderTitleInputEl.focus();
};

window.openMoveItemModal = function(itemId) {
    window.moveItemModalEl.dataset.itemId = itemId;
    window.renderFolderTree(itemId);
    window.openModal(window.moveItemModalEl);
};

window.renderFolderTree = function(itemIdToMove) {
    window.moveItemFolderTreeEl.innerHTML = '';
    const sourceNode = window.findNodeById(window.jsonData, itemIdToMove);
    const createTree = (node, parentElement, level = 0) => {
        if (node.type !== 'folder') return;

        const item = document.createElement('div');
        item.classList.add('folder-tree-item');
        item.dataset.folderId = node.id;
        item.style.paddingLeft = `${0.8 + level * 1.5}rem`;
        
        if (window.svgTemplateFolder) {
            const icon = window.svgTemplateFolder.cloneNode(true);
            icon.style.width = '20px';
            icon.style.height = '20px';
            icon.style.flexShrink = '0';
            item.appendChild(icon);
        }

        const name = document.createElement('span');
        name.textContent = node.title;
        item.appendChild(name);

        const parentOfItemToMove = window.findParentOfNode(itemIdToMove);
        const isWithinSource = sourceNode && sourceNode.type === 'folder' && window.findNodeById(sourceNode, node.id);
        if (node.id === itemIdToMove || node.id === parentOfItemToMove?.id || isWithinSource) {
            item.classList.add('disabled');
        } else {
            item.addEventListener('click', () => {
                const selected = window.moveItemFolderTreeEl.querySelector('.selected');
                if (selected) selected.classList.remove('selected');
                item.classList.add('selected');
                window.moveItemConfirmBtn.disabled = false;
            });
        }

        parentElement.appendChild(item);

        if (Array.isArray(node.items)) {
            node.items.forEach(child => createTree(child, parentElement, level + 1));
        }
    };
    createTree(window.jsonData, window.moveItemFolderTreeEl);
};

window.confirmMoveItem = function() {
    const itemId = window.moveItemModalEl.dataset.itemId;
    const selectedFolderEl = window.moveItemFolderTreeEl.querySelector('.selected');
    if (!itemId || !selectedFolderEl) return;

    const targetFolderId = selectedFolderEl.dataset.folderId;
    window.moveNode(itemId, targetFolderId);
    window.closeModal(window.moveItemModalEl);
};

window.openModal = function(element) {
    element.classList.remove('hidden');
    requestAnimationFrame(() => {
         requestAnimationFrame(() => {
            element.classList.add('visible');
         });
    });
    window.updateBreadcrumb();
};

window.closeModal = function(elementOrOptions = {}) {
    let element = window.modalEl;
    let calledFromPopstate = false;
    let fromBackdrop = false;

    if (elementOrOptions.nodeType === 1) {
        element = elementOrOptions;
    } else if (typeof elementOrOptions === 'object' && elementOrOptions !== null) {
        calledFromPopstate = !!elementOrOptions.fromPopstate;
        fromBackdrop = !!elementOrOptions.fromBackdrop;
    }

    if (!element.classList.contains('visible')) return;

    if (element === window.modalEl && window.promptFullTextEl.classList.contains('is-editing')) {
        window.toggleEditMode(false);
    }

    element.classList.remove('visible');
    setTimeout(() => {
        element.classList.add('hidden');
        if (element === window.modalEl) {
            element.removeAttribute('data-id');
            element.removeAttribute('data-mode');
            window.promptTitleInputEl.style.display = 'none';
            window.promptFullTextEl.style.height = 'auto';
        }
    }, window.currentTransitionDurationMediumMs || 300);

    if (element === window.modalEl) {
        if (fromBackdrop) {
            if (window.isMobile() && window.history.state?.modalOpen && !calledFromPopstate) {
                window.history.back();
            }
            window.updateBreadcrumb();
        } else if (window.isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
            window.history.back();
        } else {
            window.updateBreadcrumb();
        }
    }
};

window.toggleEditMode = function(isEditing) {
    window.promptFullTextEl.classList.toggle('is-editing', isEditing);
    window.promptFullTextEl.readOnly = !isEditing;
    window.modalEditBtn.classList.toggle('hidden', isEditing);
    window.modalSaveBtn.classList.toggle('hidden', !isEditing);
    window.copyModalButton.classList.toggle('hidden', isEditing);
    window.modalCloseBtn.classList.toggle('hidden', isEditing);
    window.modalFavoriteBtn.classList.toggle('hidden', isEditing);

    const isNewMode = window.modalEl.dataset.mode === 'new';
    window.promptTitleInputEl.style.display = isEditing && isNewMode ? 'block' : 'none';

    if (isEditing) {
        if (!isNewMode) {
            window.promptFullTextEl.focus();
            const textLength = window.promptFullTextEl.value.length;
            window.promptFullTextEl.setSelectionRange(textLength, textLength);
        }
    }
    window.adjustTextareaHeight(window.promptFullTextEl);
};

window.saveNewFolder = function() {
    const title = window.folderTitleInputEl.value.trim();
    if (!title) {
        window.showNotification('Der Titel darf nicht leer sein.', 'error');
        window.folderTitleInputEl.focus();
        return;
    }

    const newFolderNode = {
        id: window.generateId(),
        type: 'folder',
        title: title,
        items: []
    };

    if (!window.currentNode.items) {
        window.currentNode.items = [];
    }
    window.currentNode.items.push(newFolderNode);
    
    window.persistJsonData('Ordner hinzugefügt!', 'success');
    window.renderView(window.currentNode);
    window.closeModal(window.createFolderModalEl);
};

window.savePromptChanges = function() {
    const mode = window.modalEl.dataset.mode;
    
    if (mode === 'new') {
        const title = window.promptTitleInputEl.value.trim();
        if (!title) {
            window.showNotification('Der Titel darf nicht leer sein.', 'error');
            window.promptTitleInputEl.focus();
            return;
        }

        const newPromptNode = {
            id: window.generateId(),
            type: 'prompt',
            title: title,
            content: window.promptFullTextEl.value
        };

        if (!window.currentNode.items) {
            window.currentNode.items = [];
        }
        window.currentNode.items.push(newPromptNode);
        
        window.persistJsonData('Prompt hinzugefügt!', 'success');
        window.renderView(window.currentNode);
        window.closeModal();

    } else { 
        const id = window.modalEl.getAttribute('data-id');
        if (!id || !window.jsonData) return;
        const nodeToUpdate = window.findNodeById(window.jsonData, id);
        if (nodeToUpdate) {
            const newText = window.promptFullTextEl.value;
            nodeToUpdate.content = newText;
            window.persistJsonData('Prompt gespeichert!', 'success');
        }
        window.toggleEditMode(false);
    }
};

window.downloadCustomJson = function() {
    const jsonString = window.jsonData ? JSON.stringify(window.jsonData, null, 2) : localStorage.getItem(window.cloudStorageKey);
    if (!jsonString) {
        window.showNotification('Keine Änderungen zum Herunterladen vorhanden.', 'info');
        return;
    }

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'templates.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.openUploadJsonModal = function() {
    if (window.uploadJsonInputEl) window.uploadJsonInputEl.value = '';
    window.openModal(window.uploadJsonModalEl);
};

window.validateTemplateSchema = function(data) {
    return data && data.type === 'folder' && Array.isArray(data.items);
};

window.handleUploadJsonFile = function(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const parsed = JSON.parse(String(reader.result || '{}'));
            if (!window.validateTemplateSchema(parsed)) throw new Error('Schema ungültig');
            window.processJson(parsed);
            await window.persistJsonData('JSON importiert und Cloud überschrieben.', 'success');
            window.closeModal(window.uploadJsonModalEl);
        } catch (err) {
            window.showNotification('Upload fehlgeschlagen: ungültige JSON-Struktur.', 'error');
        }
    };
    reader.readAsText(file);
};

window.openLinkItemModal = function(nodeId) {
    if (!window.linkItemModalEl) return;
    window.linkItemModalEl.dataset.sourceId = nodeId;
    window.renderLinkableItems(nodeId);
    window.openModal(window.linkItemModalEl);
};

window.confirmLinkItem = function() {
    const sourceId = window.linkItemModalEl.dataset.sourceId;
    const selectedItemEl = window.linkItemListEl.querySelector('.selected');
    if (!sourceId || !selectedItemEl) return;

    const targetId = selectedItemEl.dataset.itemId;
    window.linkNode(sourceId, targetId);
    window.closeModal(window.linkItemModalEl);
};
