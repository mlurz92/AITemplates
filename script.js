(() => {
  const STORAGE_KEYS = {
    data: 'customTemplatesJson',
    favorites: 'favoritePrompts'
  };
  const DATA_FILE = 'templates.json';
  const MAX_ITEMS_PER_VIEW = 36;

  const isFolder = (item) => item && item.type === 'folder';
  const isPrompt = (item) => item && item.type === 'prompt';
  const createId = () => (crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  class PromptApp {
    constructor() {
      this.state = {
        root: null,
        current: null,
        path: [],
        favorites: [],
        editMode: false,
        pendingMoveId: null,
        viewTransitionSupported: typeof document.startViewTransition === 'function'
      };
      this.elements = {};
      this.contextMenu = null;
      this.sortable = null;
      this.modals = {
        prompt: { open: false, original: null },
        folder: { open: false },
        move: { open: false, selectedTarget: null }
      };
    }

    async init() {
      this.cacheElements();
      this.bindGlobalEvents();
      this.installContextMenu();
      this.installAccessibilityHelpers();

      await this.loadInitialData();
      this.loadFavorites();
      this.renderAll();
      this.syncFullscreenButton();
    }

    cacheElements() {
      const $ = (id) => document.getElementById(id);
      this.elements = {
        container: $('#cards-container'),
        breadcrumb: $('#breadcrumb'),
        backButton: $('#topbar-back-button'),
        fixedBackButton: $('#fixed-back'),
        organizeButton: $('#organize-button'),
        organizeIcon: document.querySelector('#organize-button .icon-organize'),
        organizeDoneIcon: document.querySelector('#organize-button .icon-done'),
        addButton: $('#add-button'),
        addMenu: $('#add-menu'),
        downloadButton: $('#download-button'),
        resetButton: $('#reset-button'),
        clearFavoritesButton: $('#clear-favorites-button'),
        fullscreenButton: $('#fullscreen-button'),
        fullscreenEnterIcon: document.querySelector('.icon-fullscreen-enter'),
        fullscreenExitIcon: document.querySelector('.icon-fullscreen-exit'),
        appLogoButton: $('#app-logo-button'),
        notificationArea: $('#notification-area'),
        promptModal: $('#prompt-modal'),
        promptModalTextarea: $('#prompt-fulltext'),
        promptModalTitleInput: $('#prompt-title-input'),
        promptModalFavoriteButton: $('#modal-favorite-button'),
        promptModalEditButton: $('#modal-edit-button'),
        promptModalSaveButton: $('#modal-save-button'),
        promptModalCopyButton: $('#copy-prompt-modal-button'),
        promptModalCloseButton: $('#modal-close-button'),
        promptModalStarOutline: document.querySelector('#modal-favorite-button .icon-star-outline'),
        promptModalStarFilled: document.querySelector('#modal-favorite-button .icon-star-filled'),
        createFolderModal: $('#create-folder-modal'),
        createFolderInput: $('#folder-title-input'),
        createFolderSave: $('#create-folder-save-button'),
        createFolderCancel: $('#create-folder-cancel-button'),
        moveItemModal: $('#move-item-modal'),
        moveItemTree: $('#move-item-folder-tree'),
        moveItemConfirm: $('#move-item-confirm-button'),
        moveItemCancel: $('#move-item-cancel-button'),
        favoritesDock: $('#favorites-dock'),
        favoritesToggle: $('#favorites-expand-toggle'),
        favoritesList: $('#favorites-list'),
        auroraContainer: $('#aurora-container'),
        addMenuItems: document.querySelectorAll('#add-menu .add-menu-item'),
        modal: $('#prompt-modal')
      };
    }

    bindGlobalEvents() {
      const {
        backButton,
        fixedBackButton,
        appLogoButton,
        addButton,
        addMenu,
        organizeButton,
        downloadButton,
        resetButton,
        clearFavoritesButton,
        fullscreenButton,
        favoritesToggle,
        promptModalFavoriteButton,
        promptModalEditButton,
        promptModalSaveButton,
        promptModalCopyButton,
        promptModalCloseButton,
        createFolderSave,
        createFolderCancel,
        moveItemConfirm,
        moveItemCancel,
        breadcrumb
      } = this.elements;

      document.addEventListener('click', (event) => this.handleDocumentClick(event));
      document.addEventListener('keydown', (event) => this.handleGlobalKeyDown(event));

      if (backButton) backButton.addEventListener('click', () => this.navigateUp());
      if (fixedBackButton) fixedBackButton.addEventListener('click', () => this.navigateToRoot());
      if (appLogoButton) appLogoButton.addEventListener('click', () => this.navigateToRoot());
      if (breadcrumb) breadcrumb.addEventListener('click', (event) => this.handleBreadcrumbClick(event));

      if (addButton) {
        addButton.addEventListener('click', () => {
          addMenu.classList.toggle('hidden');
          addMenu.style.display = addMenu.classList.contains('hidden') ? 'none' : 'block';
        });
      }
      if (addMenu) {
        addMenu.addEventListener('click', (event) => {
          const item = event.target.closest('.add-menu-item');
          if (!item) return;
          addMenu.classList.add('hidden');
          addMenu.style.display = 'none';
          const action = item.dataset.action;
          if (action === 'add-prompt') this.startCreatePrompt();
          if (action === 'add-folder') this.startCreateFolder();
        });
      }

      if (organizeButton) organizeButton.addEventListener('click', () => this.toggleEditMode());
      if (downloadButton) downloadButton.addEventListener('click', () => this.downloadTemplates());
      if (resetButton) resetButton.addEventListener('click', () => this.resetTemplates());
      if (clearFavoritesButton) clearFavoritesButton.addEventListener('click', () => this.clearFavorites());

      if (fullscreenButton) {
        fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        document.addEventListener('fullscreenchange', () => this.syncFullscreenButton());
      }
      if (favoritesToggle) favoritesToggle.addEventListener('click', () => this.toggleFavoritesDock());

      if (promptModalFavoriteButton) promptModalFavoriteButton.addEventListener('click', () => this.togglePromptFavorite());
      if (promptModalEditButton) promptModalEditButton.addEventListener('click', () => this.enterPromptEditMode());
      if (promptModalSaveButton) promptModalSaveButton.addEventListener('click', () => this.savePromptEdits());
      if (promptModalCopyButton) promptModalCopyButton.addEventListener('click', () => this.copyPromptText());
      if (promptModalCloseButton) promptModalCloseButton.addEventListener('click', () => this.closePromptModal());

      if (createFolderSave) createFolderSave.addEventListener('click', () => this.finishCreateFolder());
      if (createFolderCancel) createFolderCancel.addEventListener('click', () => this.closeFolderModal());

      if (moveItemConfirm) moveItemConfirm.addEventListener('click', () => this.completeMoveItem());
      if (moveItemCancel) moveItemCancel.addEventListener('click', () => this.closeMoveModal());

      window.addEventListener('resize', () => this.syncFavoritesFootprint());
      window.addEventListener('scroll', () => this.handleAuroraParallax());
    }

    installAccessibilityHelpers() {
      const { favoritesDock, favoritesToggle } = this.elements;
      if (!favoritesDock || !favoritesToggle) return;
      favoritesDock.classList.add('collapsed');
    }

    installContextMenu() {
      const menu = document.createElement('div');
      menu.className = 'context-menu';
      menu.innerHTML = `
        <button class="context-menu-item" data-action="favorite">Favorit umschalten</button>
        <button class="context-menu-item" data-action="rename">Umbenennen</button>
        <button class="context-menu-item" data-action="move">Verschieben...</button>
        <button class="context-menu-item" data-action="delete">Löschen</button>
      `;
      document.body.appendChild(menu);
      menu.addEventListener('click', (event) => this.handleContextMenuAction(event));
      this.contextMenu = menu;
    }

    async loadInitialData() {
      const stored = localStorage.getItem(STORAGE_KEYS.data);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.state.root = parsed;
          this.state.current = parsed;
          return;
        } catch (error) {
          console.warn('Stored templates invalid, ignoring.');
          localStorage.removeItem(STORAGE_KEYS.data);
        }
      }

      try {
        const response = await fetch(DATA_FILE, { cache: 'no-store' });
        if (!response.ok) throw new Error('Templates not found');
        const json = await response.json();
        this.state.root = json;
        this.state.current = json;
      } catch (error) {
        console.error('Failed to load templates', error);
        this.state.root = { id: 'root', type: 'folder', title: 'Home', items: [] };
        this.state.current = this.state.root;
      }
    }

    loadFavorites() {
      const raw = localStorage.getItem(STORAGE_KEYS.favorites);
      if (!raw) {
        this.state.favorites = [];
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        this.state.favorites = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        this.state.favorites = [];
      }
    }

    persistData() {
      try {
        localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(this.state.root));
      } catch (error) {
        this.showNotification('Speichern nicht möglich – Speicher voll?', 'error');
      }
    }

    persistFavorites() {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(this.state.favorites));
    }

    renderAll() {
      this.renderBreadcrumb();
      this.renderCards();
      this.renderFavorites();
      this.updateControls();
    }

    renderBreadcrumb() {
      const { breadcrumb } = this.elements;
      if (!breadcrumb) return;
      breadcrumb.innerHTML = '';
      const fragment = document.createDocumentFragment();
      const path = [this.state.root, ...this.state.path];
      path.forEach((node, index) => {
        const button = document.createElement('button');
        button.className = 'breadcrumb-item';
        button.type = 'button';
        button.textContent = node.title || 'Unbenannt';
        button.dataset.index = String(index);
        fragment.appendChild(button);
      });
      breadcrumb.appendChild(fragment);
    }

    handleBreadcrumbClick(event) {
      const button = event.target.closest('.breadcrumb-item');
      if (!button) return;
      const index = Number.parseInt(button.dataset.index, 10);
      if (Number.isNaN(index)) return;
      if (index === 0) {
        this.navigateToRoot();
        return;
      }
      const newPath = this.state.path.slice(0, index);
      this.state.path = newPath;
      this.state.current = newPath[newPath.length - 1] || this.state.root;
      this.renderAll();
    }

    renderCards() {
      const { container } = this.elements;
      if (!container || !this.state.current) return;

      container.innerHTML = '';
      const fragment = document.createDocumentFragment();
      const items = Array.isArray(this.state.current.items) ? this.state.current.items.slice(0, MAX_ITEMS_PER_VIEW) : [];
      if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Dieser Ordner ist leer. Erstellen Sie einen Prompt oder Ordner.';
        container.appendChild(empty);
        return;
      }
      items.forEach((item) => {
        fragment.appendChild(this.createCard(item));
      });
      container.appendChild(fragment);
    }

    createCard(item) {
      const card = document.createElement('article');
      card.className = `card ${item.type}-card`;
      card.dataset.id = item.id;
      card.dataset.type = item.type;

      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = item.title || 'Unbenannt';
      card.appendChild(title);

      if (isFolder(item)) {
        card.classList.add('interactive');
        card.addEventListener('click', (event) => {
          if (event.target.closest('button')) return;
          this.navigateInto(item.id);
        });
        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'card-action';
        openButton.textContent = 'Öffnen';
        openButton.addEventListener('click', () => this.navigateInto(item.id));
        card.appendChild(openButton);
      } else if (isPrompt(item)) {
        const preview = document.createElement('p');
        preview.className = 'card-preview';
        preview.textContent = this.formatPreview(item.content);
        card.appendChild(preview);

        const actions = document.createElement('div');
        actions.className = 'card-actions';

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'btn btn-ghost';
        openButton.textContent = 'Anzeigen';
        openButton.addEventListener('click', () => this.openPromptModal(item));

        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.className = 'btn copy-button';
        copyButton.textContent = 'Kopieren';
        copyButton.addEventListener('click', () => this.copyText(item.content, item.title));

        actions.append(openButton, copyButton);
        card.appendChild(actions);

        card.addEventListener('click', (event) => {
          if (event.target.closest('button')) return;
          this.openPromptModal(item);
        });
      }

      card.addEventListener('contextmenu', (event) => this.showContextMenu(event, card));
      return card;
    }

    formatPreview(text) {
      if (!text) return '';
      const trimmed = text.trim();
      if (trimmed.length <= 160) return trimmed;
      return `${trimmed.slice(0, 157)}…`;
    }

    renderFavorites() {
      const { favoritesList, favoritesDock } = this.elements;
      if (!favoritesList) return;
      favoritesList.innerHTML = '';
      const fragment = document.createDocumentFragment();
      const validFavorites = this.state.favorites
        .map((id) => this.findById(id))
        .filter((item) => isPrompt(item));

      if (validFavorites.length !== this.state.favorites.length) {
        this.state.favorites = validFavorites.map((item) => item.id);
        this.persistFavorites();
      }

      validFavorites
        .forEach((item) => {
          const chip = document.createElement('li');
          chip.className = 'favorite-chip';
          chip.dataset.id = item.id;
          chip.dataset.type = 'favorite';

          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'favorite-chip-button';
          button.textContent = item.title;
          button.addEventListener('click', () => this.copyText(item.content, item.title));

          chip.addEventListener('contextmenu', (event) => this.showContextMenu(event, chip));
          chip.appendChild(button);
          fragment.appendChild(chip);
        });
      favoritesList.appendChild(fragment);
      if (favoritesDock) {
        const hasItems = this.state.favorites.length > 0;
        favoritesDock.classList.toggle('hidden', !hasItems);
        if (this.elements.favoritesToggle) {
          this.elements.favoritesToggle.hidden = !hasItems;
          this.elements.favoritesToggle.setAttribute('aria-expanded', 'false');
        }
      }
      this.syncFavoritesFootprint();
    }

    updateControls() {
      const {
        backButton,
        fixedBackButton,
        resetButton,
        downloadButton,
        organizeButton,
        organizeIcon,
        organizeDoneIcon,
        clearFavoritesButton
      } = this.elements;
      const atRoot = this.state.current === this.state.root;
      if (backButton) backButton.disabled = atRoot;
      if (fixedBackButton) fixedBackButton.classList.toggle('hidden', atRoot);
      if (resetButton) resetButton.style.display = 'inline-flex';
      if (downloadButton) downloadButton.style.display = 'inline-flex';
      if (clearFavoritesButton) clearFavoritesButton.style.display = this.state.favorites.length ? 'inline-flex' : 'none';
      if (organizeButton) {
        organizeButton.style.display = 'inline-flex';
        organizeButton.classList.toggle('active', this.state.editMode);
      }
      if (organizeIcon && organizeDoneIcon) {
        organizeIcon.classList.toggle('hidden', this.state.editMode);
        organizeDoneIcon.classList.toggle('hidden', !this.state.editMode);
      }
    }

    handleDocumentClick(event) {
      const { addMenu, favoritesDock } = this.elements;
      const addButton = this.elements.addButton;
      if (addMenu && !addMenu.contains(event.target) && (!addButton || !addButton.contains(event.target))) {
        addMenu.classList.add('hidden');
        addMenu.style.display = 'none';
      }
      const toggle = this.elements.favoritesToggle;
      if (favoritesDock && !favoritesDock.contains(event.target) && (!toggle || !toggle.contains(event.target))) {
        this.collapseFavoritesDock();
      }
    }

    handleGlobalKeyDown(event) {
      if (event.key === 'Escape') {
        if (this.contextMenu?.classList.contains('visible')) {
          this.hideContextMenu();
          return;
        }
        if (this.modals.prompt.open) {
          this.closePromptModal();
          return;
        }
        if (this.modals.folder.open) {
          this.closeFolderModal();
          return;
        }
        if (this.modals.move.open) {
          this.closeMoveModal();
        }
      }
    }

    handleAuroraParallax() {
      const { auroraContainer } = this.elements;
      if (!auroraContainer) return;
      const offset = window.scrollY * -0.1;
      auroraContainer.style.transform = `translateY(${offset}px)`;
    }

    navigateInto(id) {
      const node = this.findById(id, this.state.current);
      if (!isFolder(node)) return;
      this.state.path = [...this.state.path, node];
      this.state.current = node;
      this.renderAll();
    }

    navigateUp() {
      if (!this.state.path.length) return;
      const path = [...this.state.path];
      path.pop();
      this.state.path = path;
      this.state.current = path[path.length - 1] || this.state.root;
      this.renderAll();
    }

    navigateToRoot() {
      this.state.path = [];
      this.state.current = this.state.root;
      this.renderAll();
    }

    findById(id, start = this.state.root) {
      if (!start) return null;
      if (start.id === id) return start;
      if (!Array.isArray(start.items)) return null;
      for (const child of start.items) {
        const found = this.findById(id, child);
        if (found) return found;
      }
      return null;
    }

    findParentOf(id, current = this.state.root, parent = null) {
      if (!current) return null;
      if (current.id === id) return parent;
      if (!Array.isArray(current.items)) return null;
      for (const child of current.items) {
        const result = this.findParentOf(id, child, current);
        if (result) return result;
      }
      return null;
    }

    startCreatePrompt() {
      const emptyPrompt = { id: createId(), type: 'prompt', title: '', content: '' };
      this.openPromptModal(emptyPrompt, { isNew: true });
    }

    startCreateFolder() {
      const { createFolderModal, createFolderInput } = this.elements;
      if (!createFolderModal || !createFolderInput) return;
      createFolderInput.value = '';
      createFolderModal.classList.remove('hidden');
      this.modals.folder.open = true;
      createFolderInput.focus();
    }

    finishCreateFolder() {
      const { createFolderInput } = this.elements;
      if (!createFolderInput) return;
      const title = createFolderInput.value.trim();
      if (!title) {
        this.showNotification('Bitte einen Ordnernamen eingeben.', 'warning');
        return;
      }
      const folder = { id: createId(), type: 'folder', title, items: [] };
      this.state.current.items = this.state.current.items || [];
      this.state.current.items.push(folder);
      this.persistData();
      this.renderAll();
      this.closeFolderModal();
      this.showNotification(`Ordner „${title}” erstellt.`, 'success');
    }

    closeFolderModal() {
      const { createFolderModal } = this.elements;
      if (!createFolderModal) return;
      createFolderModal.classList.add('hidden');
      this.modals.folder.open = false;
    }

    openPromptModal(item, options = {}) {
      const { promptModal, promptModalTextarea, promptModalTitleInput, promptModalSaveButton, promptModalEditButton } = this.elements;
      if (!promptModal) return;

      this.modals.prompt.open = true;
      this.modals.prompt.original = options.isNew ? null : this.findById(item.id);
      promptModal.dataset.id = item.id;
      promptModal.dataset.isNew = options.isNew ? 'true' : 'false';
      promptModal.dataset.title = item.title || '';
      promptModalTextarea.value = item.content || '';
      promptModalTitleInput.value = item.title || '';
      promptModalTextarea.readOnly = !options.isNew;
      promptModalTitleInput.style.display = options.isNew ? 'block' : 'none';
      promptModal.classList.remove('hidden');
      promptModal.classList.add('visible');

      if (options.isNew) {
        promptModalSaveButton.classList.remove('hidden');
        promptModalEditButton.classList.add('hidden');
        promptModalTitleInput.focus();
      } else {
        this.syncPromptFavoriteIcon(item.id);
        promptModalSaveButton.classList.add('hidden');
        promptModalEditButton.classList.remove('hidden');
      }
    }

    closePromptModal() {
      const { promptModal, promptModalTextarea, promptModalTitleInput, promptModalSaveButton, promptModalEditButton } = this.elements;
      if (!promptModal) return;
      promptModal.classList.add('hidden');
      promptModal.classList.remove('visible');
      this.modals.prompt = { open: false, original: null };
      promptModalTextarea.readOnly = true;
      promptModalTitleInput.style.display = 'none';
      promptModalSaveButton.classList.add('hidden');
      promptModalEditButton.classList.remove('hidden');
      promptModal.dataset.isNew = 'false';
    }

    enterPromptEditMode() {
      const { promptModal, promptModalTextarea, promptModalTitleInput, promptModalSaveButton, promptModalEditButton } = this.elements;
      if (!promptModal) return;
      const id = promptModal.dataset.id;
      const item = this.findById(id);
      if (!isPrompt(item)) return;
      promptModalTextarea.readOnly = false;
      promptModalTitleInput.style.display = 'block';
      promptModalTitleInput.value = item.title;
      promptModalSaveButton.classList.remove('hidden');
      promptModalEditButton.classList.add('hidden');
      promptModalTitleInput.focus();
    }

    savePromptEdits() {
      const { promptModal, promptModalTextarea, promptModalTitleInput } = this.elements;
      if (!promptModal) return;
      const id = promptModal.dataset.id;
      const isNew = promptModal.dataset.isNew === 'true';
      const title = promptModalTitleInput.value.trim();
      const content = promptModalTextarea.value.trim();
      if (!title || !content) {
        this.showNotification('Titel und Inhalt dürfen nicht leer sein.', 'warning');
        return;
      }
      if (isNew) {
        const prompt = { id, type: 'prompt', title, content };
        this.state.current.items = this.state.current.items || [];
        this.state.current.items.push(prompt);
      } else {
        const item = this.findById(id);
        if (!isPrompt(item)) return;
        item.title = title;
        item.content = content;
      }
      this.persistData();
      this.renderAll();
      this.closePromptModal();
      this.showNotification('Prompt gespeichert.', 'success');
    }

    togglePromptFavorite() {
      const { promptModal } = this.elements;
      if (!promptModal) return;
      if (promptModal.dataset.isNew === 'true') return;
      const id = promptModal.dataset.id;
      this.toggleFavorite(id);
      this.syncPromptFavoriteIcon(id);
      this.renderFavorites();
    }

    syncPromptFavoriteIcon(id) {
      const { promptModalStarOutline, promptModalStarFilled } = this.elements;
      if (!promptModalStarOutline || !promptModalStarFilled) return;
      const isFavorite = this.state.favorites.includes(id);
      promptModalStarOutline.classList.toggle('hidden', isFavorite);
      promptModalStarFilled.classList.toggle('hidden', !isFavorite);
    }

    toggleFavorite(id) {
      if (!id) return;
      const index = this.state.favorites.indexOf(id);
      if (index >= 0) {
        this.state.favorites.splice(index, 1);
      } else {
        this.state.favorites.push(id);
      }
      this.persistFavorites();
    }

    toggleFavoritesDock() {
      const { favoritesDock, favoritesToggle } = this.elements;
      if (!favoritesDock || !favoritesToggle) return;
      if (favoritesDock.classList.contains('hidden')) return;
      const expanded = favoritesDock.classList.toggle('expanded');
      favoritesDock.classList.toggle('collapsed', !expanded);
      favoritesToggle.setAttribute('aria-expanded', String(expanded));
      this.syncFavoritesFootprint();
    }

    collapseFavoritesDock() {
      const { favoritesDock, favoritesToggle } = this.elements;
      if (!favoritesDock || !favoritesToggle) return;
      favoritesDock.classList.remove('expanded');
      favoritesDock.classList.add('collapsed');
      favoritesToggle.setAttribute('aria-expanded', 'false');
      this.syncFavoritesFootprint();
    }

    clearFavorites() {
      this.state.favorites = [];
      this.persistFavorites();
      this.renderFavorites();
      this.syncFavoritesFootprint();
      this.showNotification('Favoritenliste geleert.', 'info');
    }

    toggleEditMode() {
      this.state.editMode = !this.state.editMode;
      const { container } = this.elements;
      container?.classList.toggle('edit-mode', this.state.editMode);
      if (this.state.editMode) {
        this.enableSortable();
      } else {
        this.destroySortable();
      }
      this.updateControls();
    }

    enableSortable() {
      const { container } = this.elements;
      if (!container || typeof Sortable === 'undefined') return;
      this.destroySortable();
      this.sortable = Sortable.create(container, {
        animation: 150,
        onEnd: (event) => this.handleSortEnd(event)
      });
    }

    destroySortable() {
      if (!this.sortable) return;
      this.sortable.destroy();
      this.sortable = null;
    }

    handleSortEnd(event) {
      const { oldIndex, newIndex } = event;
      if (oldIndex === newIndex) return;
      const items = this.state.current.items;
      if (!Array.isArray(items)) return;
      const [moved] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, moved);
      this.persistData();
    }

    handleContextMenuAction(event) {
      const action = event.target.dataset.action;
      const menu = this.contextMenu;
      if (!menu) return;
      const id = menu.dataset.id;
      const type = menu.dataset.type;
      if (!action || !id) return;
      switch (action) {
        case 'favorite':
          if (type === 'prompt' || type === 'favorite') {
            this.toggleFavorite(id);
            this.renderFavorites();
            this.syncPromptFavoriteIcon(id);
          }
          break;
        case 'rename':
          if (type !== 'favorite') this.renameItem(id);
          break;
        case 'move':
          if (type === 'folder' || type === 'prompt') this.startMoveItem(id);
          break;
        case 'delete':
          if (type === 'folder' || type === 'prompt') this.deleteItem(id);
          break;
        default:
          break;
      }
      this.hideContextMenu();
    }

    showContextMenu(event, element) {
      event.preventDefault();
      if (!this.contextMenu) return;
      this.contextMenu.dataset.id = element.dataset.id;
      this.contextMenu.dataset.type = element.dataset.type || (element.classList.contains('favorite-chip') ? 'favorite' : 'prompt');
      const type = this.contextMenu.dataset.type;
      this.contextMenu.querySelectorAll('.context-menu-item').forEach((item) => {
        const action = item.dataset.action;
        let visible = true;
        if (action === 'favorite') visible = type === 'prompt' || type === 'favorite';
        if (action === 'rename') visible = type !== 'favorite';
        if (action === 'move' || action === 'delete') visible = type === 'folder' || type === 'prompt';
        item.classList.toggle('hidden', !visible);
      });
      this.contextMenu.classList.add('visible');
      const { clientX, clientY } = event;
      this.contextMenu.style.left = `${clientX}px`;
      this.contextMenu.style.top = `${clientY}px`;
      requestAnimationFrame(() => {
        const { offsetWidth, offsetHeight } = this.contextMenu;
        let x = clientX;
        let y = clientY;
        if (x + offsetWidth > window.innerWidth - 8) x = Math.max(8, window.innerWidth - offsetWidth - 8);
        if (y + offsetHeight > window.innerHeight - 8) y = Math.max(8, window.innerHeight - offsetHeight - 8);
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
      });
      document.addEventListener('click', this.hideContextMenuBound ??= (ev) => {
        if (!this.contextMenu.contains(ev.target)) this.hideContextMenu();
      }, { once: true });
    }

    hideContextMenu() {
      this.contextMenu?.classList.remove('visible');
    }

    renameItem(id) {
      const item = this.findById(id);
      if (!item) return;
      if (isPrompt(item)) {
        this.openPromptModal(item);
        this.enterPromptEditMode();
        return;
      }
      const title = prompt('Neuer Ordnername:', item.title || '');
      if (title == null) return;
      const trimmed = title.trim();
      if (!trimmed) {
        this.showNotification('Der Ordnername darf nicht leer sein.', 'warning');
        return;
      }
      item.title = trimmed;
      this.persistData();
      this.renderAll();
    }

    startMoveItem(id) {
      const item = this.findById(id);
      if (!item) return;
      this.state.pendingMoveId = id;
      const { moveItemModal, moveItemTree, moveItemConfirm } = this.elements;
      if (!moveItemModal || !moveItemTree || !moveItemConfirm) return;
      moveItemTree.innerHTML = '';
      const fragment = document.createDocumentFragment();
      this.buildFolderTree(this.state.root, fragment, id);
      moveItemTree.appendChild(fragment);
      moveItemConfirm.disabled = true;
      moveItemModal.classList.remove('hidden');
      this.modals.move.open = true;
    }

    buildFolderTree(node, container, excludeId) {
      if (!isFolder(node)) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'folder-tree-item';
      button.textContent = node.title || 'Unbenannt';
      button.dataset.id = node.id;
      button.disabled = node.id === excludeId || this.isDescendant(node.id, excludeId);
      button.addEventListener('click', () => this.selectMoveTarget(node.id));
      container.appendChild(button);
      if (!Array.isArray(node.items)) return;
      const list = document.createElement('div');
      list.className = 'folder-tree-children';
      node.items.forEach((child) => this.buildFolderTree(child, list, excludeId));
      if (list.childNodes.length) container.appendChild(list);
    }

    isDescendant(candidateId, ancestorId) {
      if (!ancestorId) return false;
      const ancestor = this.findById(ancestorId);
      if (!ancestor || !Array.isArray(ancestor.items)) return false;
      return ancestor.items.some((child) => child.id === candidateId || this.isDescendant(candidateId, child.id));
    }

    selectMoveTarget(targetId) {
      this.modals.move.selectedTarget = targetId;
      const { moveItemConfirm, moveItemTree } = this.elements;
      if (!moveItemConfirm || !moveItemTree) return;
      moveItemConfirm.disabled = false;
      moveItemTree.querySelectorAll('.folder-tree-item').forEach((button) => {
        button.classList.toggle('selected', button.dataset.id === targetId);
      });
    }

    completeMoveItem() {
      const targetId = this.modals.move.selectedTarget;
      const itemId = this.state.pendingMoveId;
      if (!targetId || !itemId) return;
      const item = this.findById(itemId);
      const targetFolder = this.findById(targetId);
      const parent = this.findParentOf(itemId);
      if (!item || !isFolder(targetFolder) || !parent) return;
      parent.items = parent.items.filter((child) => child.id !== itemId);
      targetFolder.items = targetFolder.items || [];
      targetFolder.items.push(item);
      this.persistData();
      this.renderAll();
      this.closeMoveModal();
      this.showNotification('Element verschoben.', 'success');
    }

    closeMoveModal() {
      const { moveItemModal } = this.elements;
      if (!moveItemModal) return;
      moveItemModal.classList.add('hidden');
      this.modals.move = { open: false, selectedTarget: null };
      this.state.pendingMoveId = null;
    }

    deleteItem(id) {
      const item = this.findById(id);
      const parent = this.findParentOf(id);
      if (!item || !parent) return;
      const confirmed = confirm(`Soll „${item.title || 'Unbenannt'}” gelöscht werden?`);
      if (!confirmed) return;
      parent.items = parent.items.filter((child) => child.id !== id);
      this.state.favorites = this.state.favorites.filter((fav) => fav !== id);
      this.persistData();
      this.persistFavorites();
      this.renderAll();
      this.showNotification('Element gelöscht.', 'info');
    }

    resetTemplates() {
      localStorage.removeItem(STORAGE_KEYS.data);
      localStorage.removeItem(STORAGE_KEYS.favorites);
      window.location.reload();
    }

    downloadTemplates() {
      const dataStr = JSON.stringify(this.state.root, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'templates.json';
      link.click();
      URL.revokeObjectURL(url);
    }

    toggleFullscreen() {
      const { fullscreenButton, fullscreenEnterIcon, fullscreenExitIcon } = this.elements;
      if (!fullscreenButton) return;
      const doc = document;
      const isFullscreen = doc.fullscreenElement;
      const request = doc.documentElement.requestFullscreen?.bind(doc.documentElement);
      const exit = doc.exitFullscreen?.bind(doc);
      if (!request || !exit) {
        this.showNotification('Fullscreen wird nicht unterstützt.', 'warning');
        return;
      }
      if (isFullscreen) {
        exit();
      } else {
        request();
      }
      this.syncFullscreenButton();
    }

    syncFavoritesFootprint() {
      const { favoritesDock } = this.elements;
      if (!favoritesDock) return;
      const height = favoritesDock.offsetHeight;
      document.body.style.setProperty('--favorites-footprint', `${height}px`);
    }

    syncFullscreenButton() {
      const { fullscreenButton, fullscreenEnterIcon, fullscreenExitIcon } = this.elements;
      if (!fullscreenButton) return;
      const isActive = Boolean(document.fullscreenElement);
      fullscreenButton.classList.toggle('active', isActive);
      fullscreenEnterIcon?.classList.toggle('hidden', isActive);
      fullscreenExitIcon?.classList.toggle('hidden', !isActive);
    }

    copyPromptText() {
      const { promptModal, promptModalTextarea } = this.elements;
      if (!promptModal || !promptModalTextarea) return;
      this.copyText(promptModalTextarea.value, promptModal.dataset.title || 'Prompt');
    }

    copyText(text, label) {
      const title = label || 'Prompt';
      const write = async () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        const success = document.execCommand('copy');
        document.body.removeChild(helper);
        return success;
      };

      write().then((ok) => {
        if (ok) {
          this.showNotification(`„${title}” kopiert.`, 'success');
        } else {
          this.showNotification('Kopieren fehlgeschlagen.', 'error');
        }
      }).catch(() => {
        this.showNotification('Kopieren fehlgeschlagen.', 'error');
      });
    }

    showNotification(message, type = 'info') {
      const { notificationArea } = this.elements;
      if (!notificationArea) return;
      const note = document.createElement('div');
      note.className = `notification notification-${type}`;
      note.textContent = message;
      notificationArea.appendChild(note);
      requestAnimationFrame(() => note.classList.add('visible'));
      setTimeout(() => {
        note.classList.remove('visible');
        setTimeout(() => note.remove(), 250);
      }, 2600);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const app = new PromptApp();
    app.init();
    window.promptApp = app;
  });
})();

