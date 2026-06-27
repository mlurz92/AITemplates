// =====================================================================
// DRAG, DROP, AND REORDERING LAYER
// =====================================================================

window.handleDragStart = function(e) {
    if (window.sortableInstance) return;
    if (!window.containerEl.classList.contains('edit-mode') || !e.target.closest('.card')) {
        e.preventDefault();
        return;
    }
    
    const card = e.target.closest('.card');
    window.dragSource = card;
    
    e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
    e.dataTransfer.effectAllowed = 'move';
    
    setTimeout(() => {
        card.classList.add('dragging');
    }, 0);
};

window.handleDragOver = function(e) {
    if (window.sortableInstance) return;
    if (!window.containerEl.classList.contains('edit-mode')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

window.handleDragEnter = function(e) {
    if (window.sortableInstance) return;
    if (!window.containerEl.classList.contains('edit-mode')) return;
    e.preventDefault();
    const targetCard = e.target.closest('.card');
    if (targetCard && targetCard !== window.dragSource) {
        clearTimeout(window.springLoadTimeout);
        window.dragTarget = targetCard;
        const targetType = targetCard.getAttribute('data-type');
        if (targetType === 'folder') {
            targetCard.classList.add('drop-target-folder');
            window.springLoadTimeout = setTimeout(() => {
                const nodeId = targetCard.getAttribute('data-id');
                const node = window.findNodeById(window.jsonData, nodeId);
                if (node) window.navigateToNode(node);
            }, 800);
        } else {
            targetCard.classList.add('drop-target-combine');
        }
    }
};

window.handleDragLeave = function(e) {
    if (window.sortableInstance) return;
    if (!window.containerEl.classList.contains('edit-mode')) return;
    const targetCard = e.target.closest('.card');
    if (targetCard) {
        clearTimeout(window.springLoadTimeout);
        targetCard.classList.remove('drop-target-folder', 'drop-target-combine');
    }
    if (window.dragTarget === targetCard) {
        window.dragTarget = null;
    }
};

window.handleDrop = function(e) {
    if (!window.containerEl.classList.contains('edit-mode')) return;
    if (window.sortableInstance) return;
    e.preventDefault();
    clearTimeout(window.springLoadTimeout);

    const droppedOnCard = e.target.closest('.card');
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId) return;

    const sourceNode = window.findNodeById(window.jsonData, sourceId);
    if (!sourceNode) return;

    if (droppedOnCard && droppedOnCard !== window.dragSource) {
        const targetId = droppedOnCard.getAttribute('data-id');
        const targetNode = window.findNodeById(window.jsonData, targetId);
        if (!targetNode) return;

        if (targetNode.type === 'folder') {
            window.moveNode(sourceId, targetNode.id);
        } else {
            if (confirm(`Möchten Sie "${sourceNode.title}" und "${targetNode.title}" in einem neuen Ordner zusammenfassen?`)) {
                window.combineIntoNewFolder(sourceId, targetId);
            }
        }
    }
    
    if (window.dragSource) window.dragSource.classList.remove('dragging');
    document.querySelectorAll('.drop-target-folder, .drop-target-combine').forEach(el => {
        el.classList.remove('drop-target-folder', 'drop-target-combine');
    });
    window.dragSource = null;
    window.dragTarget = null;
};

window.handleDragEnd = function(e) {
    if (window.sortableInstance) return;
    clearTimeout(window.springLoadTimeout);
    if (window.dragSource) {
        window.dragSource.classList.remove('dragging');
    }
    document.querySelectorAll('.drop-target-folder, .drop-target-combine').forEach(el => {
        el.classList.remove('drop-target-folder', 'drop-target-combine');
    });
    window.dragSource = null;
    window.dragTarget = null;
};

window.resolveDropEventCoordinates = function(originalEvent) {
    if (!originalEvent) return null;

    if (typeof originalEvent.clientX === 'number' && typeof originalEvent.clientY === 'number') {
        return { x: originalEvent.clientX, y: originalEvent.clientY };
    }

    const touchPoint = originalEvent.changedTouches?.[0] || originalEvent.touches?.[0];
    if (touchPoint && typeof touchPoint.clientX === 'number' && typeof touchPoint.clientY === 'number') {
        return { x: touchPoint.clientX, y: touchPoint.clientY };
    }

    return null;
};

window.isPointInsideCombineZone = function(point, rect) {
    const minDimension = Math.min(rect.width, rect.height);
    const inset = Math.min(48, Math.max(14, minDimension * 0.22));

    const zoneLeft = rect.left + inset;
    const zoneRight = rect.right - inset;
    const zoneTop = rect.top + inset;
    const zoneBottom = rect.bottom - inset;

    return point.x >= zoneLeft && point.x <= zoneRight && point.y >= zoneTop && point.y <= zoneBottom;
};

window.resolveCardDropIntent = function(evt) {
    const coordinates = window.resolveDropEventCoordinates(evt.originalEvent);
    if (!coordinates) {
        return { targetCard: null, intent: 'reorder' };
    }

    const elements = document.elementsFromPoint(coordinates.x, coordinates.y);
    const draggedCard = evt?.item?.closest('.card');
    const targetCard = elements.map(el => el.closest('.card')).find(card => card && card !== draggedCard) || null;
    if (!targetCard) {
        return { targetCard: null, intent: 'reorder' };
    }

    const rect = targetCard.getBoundingClientRect();
    const intent = window.isPointInsideCombineZone(coordinates, rect) ? 'onto-card' : 'reorder';
    return { targetCard, intent };
};

window.getCardById = function(nodeId) {
    if (!nodeId) return null;
    return window.containerEl.querySelector(`.card[data-id="${nodeId}"]`);
};

window.clearDropTargetHighlights = function() {
    document.querySelectorAll('.drop-target-folder, .drop-target-combine').forEach(el => {
        el.classList.remove('drop-target-folder', 'drop-target-combine');
    });
};

window.setDropTargetHighlight = function(targetId, targetType) {
    window.clearDropTargetHighlights();
    const targetCard = window.getCardById(targetId);
    if (!targetCard) return;
    if (targetType === 'folder') {
        targetCard.classList.add('drop-target-folder');
    } else {
        targetCard.classList.add('drop-target-combine');
    }
};

window.resolveSortableCombineIntent = function(evt) {
    const draggedCard = evt.item?.closest('.card');
    const relatedCard = evt.related?.closest('.card');
    if (!draggedCard || !relatedCard || draggedCard === relatedCard) {
        return null;
    }

    const point = window.resolveDropEventCoordinates(evt.originalEvent);
    if (!point) return null;

    const relatedRect = relatedCard.getBoundingClientRect();
    if (!window.isPointInsideCombineZone(point, relatedRect)) {
        return null;
    }

    const sourceId = draggedCard.getAttribute('data-id');
    const targetId = relatedCard.getAttribute('data-id');
    if (!sourceId || !targetId || sourceId === targetId) {
        return null;
    }

    const sourceNode = window.findNodeById(window.jsonData, sourceId);
    const targetNode = window.findNodeById(window.jsonData, targetId);
    if (!sourceNode || !targetNode || sourceNode.type !== 'prompt') {
        return null;
    }

    if (targetNode.type === 'prompt') {
        return { sourceId, targetId, targetType: 'prompt', action: 'combine' };
    }

    if (targetNode.type === 'folder') {
        return { sourceId, targetId, targetType: 'folder', action: 'move-to-folder' };
    }

    return null;
};

window.reorderCurrentNodeItemsFromDom = function() {
    if (!window.currentNode?.items) return false;
    const orderedIds = Array.from(window.containerEl.querySelectorAll('.card'))
        .map(card => card.getAttribute('data-id'))
        .filter(Boolean);
    if (!orderedIds.length || orderedIds.length !== window.currentNode.items.length) {
        return false;
    }

    const itemMap = new Map(window.currentNode.items.map(item => [item.id, item]));
    const reorderedItems = orderedIds
        .map(id => itemMap.get(id))
        .filter(Boolean);

    if (reorderedItems.length !== window.currentNode.items.length) {
        return false;
    }

    const hasChanged = reorderedItems.some((item, index) => window.currentNode.items[index]?.id !== item.id);
    if (!hasChanged) {
        return false;
    }

    window.currentNode.items = reorderedItems;
    return true;
};
