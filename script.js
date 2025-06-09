document.addEventListener('DOMContentLoaded', initApp);

// Globale Variablen der Anwendung
let xmlData = null; // Speichert die geparsten XML-Daten der Templates.xml
let currentNode = null; // Referenz auf den aktuell angezeigten XML-Knoten (Ordner)
let pathStack = []; // Stapel von XML-Knoten, der den Navigationspfad darstellt
const currentXmlFile = "Templates.xml"; // Name der XML-Datendatei

// DOM-Element-Referenzen (werden in initApp initialisiert)
let modalEl, breadcrumbEl, containerEl, promptFullTextEl, notificationAreaEl;
let topBarEl, topbarBackBtn, fixedBackBtn, themeToggleButton;
let mobileNavEl, mobileHomeBtn, mobileBackBtn;
let swipeIndicatorEl; // Visueller Indikator für Wischgeste
let searchInputElement; // Eingabefeld für die Suchfunktion

// SVG-Template-Referenzen (für dynamische Icons)
let svgTemplateFolder, svgTemplateExpand, svgTemplateCopy, svgTemplateCheckmark;
let svgTemplateIcon1, svgTemplateIcon2; // Benutzerdefinierte Icons aus Templates.xml Attribut 'image'

// Für Intersection Observer API (Karten-Einblendanimation)
let cardObserver;

// Für Touch-Gesten (Swipe-Navigation)
let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
const swipeThreshold = 50; // Mindestdistanz für eine Wischgeste
const swipeFeedbackThreshold = 5; // Mindestdistanz, ab der visuelles Feedback beginnt

// Für 3D-Hover-Effekte auf Karten
const MAX_ROTATION = 6; // Maximale Rotation für 3D-Effekt in Grad

// Für CSS-Transitionsdauern (aus CSS-Variablen gelesen)
let currentTransitionDurationMediumMs = 300;

// Für die Suchfunktion
let currentSearchQuery = ''; // Aktueller Suchbegriff
let searchActive = false; // Flag, ob die Suche aktiv ist

// Für Tap-to-Reveal-Buttons auf Prompt-Karten
let activePromptCard = null; // Speichert die aktuell aktive Prompt-Karte mit sichtbaren Buttons


/**
 * Hauptinitialisierungsfunktion der Anwendung.
 * Wird aufgerufen, sobald das DOM vollständig geladen ist.
 */
function initApp() {
    // DOM-Elemente referenzieren
    modalEl = document.getElementById('prompt-modal');
    breadcrumbEl = document.getElementById('breadcrumb');
    containerEl = document.getElementById('cards-container');
    promptFullTextEl = document.getElementById('prompt-fulltext');
    notificationAreaEl = document.getElementById('notification-area');
    topBarEl = document.getElementById('top-bar');
    topbarBackBtn = document.getElementById('topbar-back-button');
    fixedBackBtn = document.getElementById('fixed-back');
    themeToggleButton = document.getElementById('theme-toggle-button');
    swipeIndicatorEl = document.getElementById('swipe-indicator');
    searchInputElement = document.getElementById('search-input');
    mobileNavEl = document.getElementById('mobile-nav');

    // SVG-Templates aus dem DOM referenzieren (für Klon-Operationen)
    svgTemplateFolder = document.getElementById('svg-template-folder');
    svgTemplateExpand = document.getElementById('svg-template-expand');
    svgTemplateCopy = document.getElementById('svg-template-copy');
    svgTemplateCheckmark = document.getElementById('svg-template-checkmark');
    svgTemplateIcon1 = document.getElementById('svg-template-icon-1');
    svgTemplateIcon2 = document.getElementById('svg-template-icon-2');

    // Verschiedene Setup-Funktionen aufrufen
    updateDynamicDurations(); // Lädt CSS-Variablen für Transition-Dauern
    setupTheme(); // Initialisiert und setzt das Theme
    setupIntersectionObserver(); // Rüstet Observer für Karten-Einblendanimationen
    setupEventListeners(); // Registriert alle Event-Listener

    // Mobile-spezifische Features initialisieren, falls zutreffend
    if (isMobile()) {
        setupMobileSpecificFeatures();
    }

    // Lädt die XML-Daten und rendert die initiale Ansicht
    loadXmlDocument(currentXmlFile);
}


// --- Hilfsfunktionen & allgemeine Utilities ---

/**
 * Prüft, ob der Browser auf einem mobilen Gerät ausgeführt wird.
 * @returns {boolean} True, wenn es sich wahrscheinlich um ein mobiles Gerät handelt.
 */
function isMobile() {
    let isMobileDevice = false;
    try {
        isMobileDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window || /Mobi|Android/i.test(navigator.userAgent);
    } catch (e) { /* Fehler ignorieren, falls navigator.maxTouchPoints nicht verfügbar ist */ }
    return isMobileDevice;
}

/**
 * Zeigt den visuellen Swipe-Indikator an.
 */
function showSwipeIndicator() {
    if (swipeIndicatorEl && isMobile()) {
        swipeIndicatorEl.classList.add('visible');
        swipeIndicatorEl.classList.remove('hidden');
    }
}

/**
 * Verbirgt den visuellen Swipe-Indikator.
 */
function hideSwipeIndicator() {
    if (swipeIndicatorEl) {
        swipeIndicatorEl.classList.remove('visible');
        swipeIndicatorEl.classList.add('hidden');
    }
}

/**
 * Führt eine View Transition aus, falls vom Browser unterstützt.
 * @param {Function} updateDomFunction - Funktion, die die DOM-Änderungen vornimmt.
 * @param {string} direction - Richtung der Transition ('forward', 'backward', 'initial').
 */
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

/**
 * Sucht rekursiv einen XML-Knoten anhand seiner GUID.
 * @param {Element} startNode - Der XML-Knoten, ab dem die Suche beginnt (typischerweise das Wurzelelement).
 * @param {string} targetGuid - Die GUID des gesuchten Knotens.
 * @returns {Element|null} Der gefundene XML-Knoten oder null, wenn nicht gefunden.
 */
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

/**
 * Aktualisiert den Wert von `currentTransitionDurationMediumMs` aus den CSS-Variablen.
 */
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

/**
 * Initialisiert das Theme der Anwendung (liest aus localStorage und wendet an).
 */
function setupTheme() {
    const preferredTheme = localStorage.getItem('preferredTheme') || 'dark';
    applyTheme(preferredTheme);
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
}

/**
 * Wendet das angegebene Theme auf den Body an und aktualisiert Meta-Tags.
 * @param {string} themeName - Der Name des Themes ('light' oder 'dark').
 */
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

/**
 * Schaltet zwischen dem hellen und dunklen Theme um.
 */
function toggleTheme() {
    const currentThemeIsLight = document.body.classList.contains('light-mode');
    const newTheme = currentThemeIsLight ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('preferredTheme', newTheme);
}

/**
 * Kopiert Text in die Zwischenablage und zeigt eine Benachrichtigung an.
 * @param {string} text - Der zu kopierende Text.
 * @param {HTMLElement} [buttonElement=null] - Optionales Button-Element für visuelles Feedback.
 */
function copyToClipboard(text, buttonElement = null) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showNotification('Prompt kopiert!', 'success', buttonElement))
            .catch(err => { console.error('Clipboard error:', err); showNotification('Fehler beim Kopieren', 'error', buttonElement); });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        // Temporäre Textarea unsichtbar machen und zum DOM hinzufügen
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        // Text auswählen und kopieren
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Prompt kopiert!', 'success', buttonElement);
        } catch (err) {
            console.error('Fallback copy error:', err);
            showNotification('Fehler beim Kopieren', 'error', buttonElement);
        } finally {
            // Temporäre Textarea entfernen
            document.body.removeChild(textArea);
        }
    }
}

/**
 * Kopiert den vollständigen Text des aktuell im Modal angezeigten Prompts.
 * @param {HTMLElement} [buttonElement=null] - Optionales Button-Element für visuelles Feedback.
 */
function copyPromptText(buttonElement = null) {
    copyToClipboard(promptFullTextEl.textContent, buttonElement || document.getElementById('copy-prompt-modal-button'));
}

/**
 * Kopiert den Beschreibungstext einer Prompt-Karte.
 * @param {Element} node - Der XML-Knoten der Prompt-Karte.
 * @param {HTMLElement} buttonElement - Das Button-Element, das die Aktion ausgelöst hat.
 */
function copyPromptTextForCard(node, buttonElement) {
    copyToClipboard(node.getAttribute('beschreibung') || '', buttonElement);
}

/**
 * Zeigt eine temporäre Benachrichtigung am oberen rechten Bildschirmrand an.
 * @param {string} message - Die anzuzeigende Nachricht.
 * @param {string} [type='info'] - Der Typ der Benachrichtigung ('success', 'error', 'info').
 * @param {HTMLElement} [buttonElement=null] - Optionales Button-Element für visuelles Feedback.
 */
let notificationTimeoutId = null; // Stellt sicher, dass nur eine Benachrichtigung gleichzeitig sichtbar ist
function showNotification(message, type = 'info', buttonElement = null) {
    // Vorherige Benachrichtigung entfernen, falls vorhanden
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

    // Fügt Success-Icon hinzu
    if (type === 'success' && svgTemplateCheckmark) {
        const icon = svgTemplateCheckmark.cloneNode(true);
        icon.classList.add('icon');
        notificationEl.appendChild(icon);
    } else if (type === 'error') {
        // Optional: Error-Icon hier hinzufügen
    }

    const textNode = document.createElement('span');
    textNode.textContent = message;
    notificationEl.appendChild(textNode);

    notificationAreaEl.appendChild(notificationEl);

    // Erzwingt Reflow, um Animation zu starten
    void notificationEl.offsetWidth;

    // Setzt Timeout zum automatischen Ausblenden der Benachrichtigung
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

/**
 * Initialisiert die Vivus-SVG-Animationsbibliothek für das übergebene SVG-Element.
 * Wird nur für das ursprüngliche Ordner-Icon verwendet.
 * @param {HTMLElement} parentElement - Das Elternelement der SVG (die Karten-Div).
 * @param {string} svgId - Die ID des SVG-Elements.
 */
function setupVivusAnimation(parentElement, svgId) {
    const svgElement = document.getElementById(svgId);
    // Animation nur für Ordnerkarten und wenn es das ursprüngliche Ordner-SVG ist
    if (!svgElement || !parentElement.classList.contains('folder-card') || svgElement !== svgTemplateFolder.cloneNode(true) && !svgElement.id.startsWith('icon-folder-')) return;

    // Nur das Original-Vivus-SVG-Template animieren, nicht die dynamisch geklonten Image-Icons
    if (svgElement.id === svgTemplateFolder.id) {
        const vivusInstance = new Vivus(svgId, { type: 'delayed', duration: 100, start: 'manual' });
        vivusInstance.finish(); // Stellt sicher, dass das SVG initial vollständig gezeichnet ist
        svgElement.style.opacity = '1';

        let timeoutId = null;
        let isTouchStarted = false; // Verhindert Hover-Animation bei Touch-Geräten

        const playAnimation = (immediate = false) => {
            clearTimeout(timeoutId);
            svgElement.style.opacity = immediate ? '1' : '0'; // Sofortiges Einblenden bei Touch
            const startVivus = () => {
                if (!immediate) svgElement.style.opacity = '1';
                vivusInstance.reset().play();
            };
            if (immediate) startVivus();
            else timeoutId = setTimeout(startVivus, 60); // Kurze Verzögerung für visuelle Glätte bei Hover
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
}


/**
 * Lädt ein XML-Dokument vom angegebenen Dateinamen.
 * @param {string} filename - Der Pfad zur XML-Datei.
 */
function loadXmlDocument(filename) {
    fetch(filename)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            return response.text();
        })
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
            currentNode = xmlData.documentElement; // Setzt den initialen Knoten auf das ROOT-Element
            pathStack = []; // Leert den Pfad-Stack
            performViewTransition(() => {
                renderView(currentNode); // Rendert die initiale Ansicht
                updateBreadcrumb(); // Aktualisiert den Breadcrumb
            }, 'initial'); // 'initial' für die Startanimation
            // Setzt den initialen Browser-History-Eintrag für mobile Geräte
            if (isMobile()) { window.history.replaceState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href); }
        })
        .catch(error => {
            console.error(`Load/Parse Error for ${filename}:`, error);
            containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Fehler beim Laden der Vorlagen: ${error.message}</p>`;
            gsap.to(containerEl, {opacity: 1, duration: 0.3}); // Fehler sanft einblenden
        });
}

/**
 * Rendert die Kartenansicht basierend auf dem übergebenen XML-Knoten oder Suchergebnissen.
 * @param {Element} xmlNode - Der XML-Knoten, dessen direkte Kinder gerendert werden sollen.
 */
function renderView(xmlNode) {
    const currentScroll = containerEl.scrollTop; // Speichert die aktuelle Scrollposition
    containerEl.innerHTML = ''; // Leert den Karten-Container
    if (!xmlNode) {
         containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Interner Fehler: Ungültiger Knoten.</p>`;
         gsap.to(containerEl, {opacity: 1, duration: 0.3});
         return;
     }

    let nodesToRender;
    // Wenn Suche aktiv ist, rufe die Suchlogik auf und lasse renderViewFiltered das Rendern übernehmen.
    if (searchActive && currentSearchQuery) {
        filterAndRenderNodes(xmlData.documentElement, currentSearchQuery);
        return; // renderViewFiltered() übernimmt das Rendern
    } else {
        // Ansonsten filtere nur die direkten Kinder des aktuellen Knotens
        nodesToRender = Array.from(xmlNode.children).filter(node => node.tagName === 'TreeViewNode');
    }

    const cardsToObserve = []; // Sammelt Karten für den Intersection Observer

    // Wenn keine Nodes zum Rendern vorhanden sind
    if (nodesToRender.length === 0) {
        containerEl.innerHTML = `<p style="text-align:center; padding:2rem; opacity:0.7;">${searchActive ? 'Keine Ergebnisse für die Suche "' + currentSearchQuery + '".' : 'Dieser Ordner ist leer.'}</p>`;
        gsap.to(containerEl.firstChild, {opacity: 1, duration: 0.5}); // Text sanft einblenden
        hideSwipeIndicator(); // Indikator ausblenden, wenn keine Inhalte vorhanden sind
        return;
    }

    // Erstellt für jeden Knoten eine Karte
    nodesToRender.forEach(node => {
        const card = document.createElement('div');
        card.classList.add('card');
        const isFolder = Array.from(node.children).some(child => child.tagName === 'TreeViewNode');
        let nodeGuid = node.getAttribute('guid');
        // Falls GUID fehlt (sollte nicht vorkommen), generieren
        if (!nodeGuid) {
            nodeGuid = `genid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            node.setAttribute('guid', nodeGuid);
        }
        card.setAttribute('data-guid', nodeGuid);

        const titleElem = document.createElement('h3');
        titleElem.textContent = node.getAttribute('value') || 'Unbenannt';

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('card-content-wrapper');
        contentWrapper.appendChild(titleElem);

        const imageAttr = node.getAttribute('image'); // 'image'-Attribut für dynamische Icons

        if (isFolder) {
            card.classList.add('folder-card');
            card.setAttribute('data-type', 'folder');
            let iconToUse = svgTemplateFolder; // Standard-Ordner-Icon
            if (imageAttr === '2' && svgTemplateIcon2) {
                iconToUse = svgTemplateIcon2; // Benutzerdefiniertes Ordner-Icon
            }
            if (iconToUse) {
                const folderIconSvg = iconToUse.cloneNode(true);
                const folderIconId = `icon-folder-${nodeGuid}`; // Eindeutige ID für das geklonte SVG
                folderIconSvg.id = folderIconId;
                folderIconSvg.classList.add('dynamic-card-icon'); // Allgemeine Klasse für dynamische Icons
                contentWrapper.appendChild(folderIconSvg);
                // Vivus.js Animation nur für das Original-Ordner-SVG-Template
                if (iconToUse === svgTemplateFolder) {
                    setupVivusAnimation(card, folderIconId);
                }
            }
        } else { // Prompt-Karte
            card.setAttribute('data-type', 'prompt');
            card.classList.add('prompt-card');
            if (imageAttr === '1' && svgTemplateIcon1) {
                const promptIconSvg = svgTemplateIcon1.cloneNode(true);
                promptIconSvg.classList.add('dynamic-card-icon');
                contentWrapper.insertBefore(promptIconSvg, titleElem); // Icon über dem Titel
                promptIconSvg.style.marginBottom = '0.8rem';
            }

            const btnContainer = document.createElement('div');
            btnContainer.classList.add('card-buttons'); // Container für Tap-to-Reveal-Buttons
            if (svgTemplateExpand) {
                const expandBtn = document.createElement('button');
                expandBtn.classList.add('button');
                expandBtn.setAttribute('aria-label', 'Details anzeigen');
                expandBtn.setAttribute('data-action', 'expand');
                expandBtn.appendChild(svgTemplateExpand.cloneNode(true));
                btnContainer.appendChild(expandBtn);
            }
            if (svgTemplateCopy) {
                const copyBtn = document.createElement('button');
                copyBtn.classList.add('button');
                copyBtn.setAttribute('aria-label', 'Prompt kopieren');
                copyBtn.setAttribute('data-action', 'copy');
                copyBtn.appendChild(svgTemplateCopy.cloneNode(true));
                btnContainer.appendChild(copyBtn);
            }
            contentWrapper.appendChild(btnContainer);
        }
        card.appendChild(contentWrapper);
        containerEl.appendChild(card);
        cardsToObserve.push(card); // Karte für Intersection Observer vormerken
        addCard3DHoverEffect(card); // 3D-Hover-Effekt hinzufügen
    });

    // Beobachtet neu hinzugefügte Karten für Animationen
    cardsToObserve.forEach(c => cardObserver.observe(c));
    adjustCardHeights(); // Passt die Höhe aller Karten an

    // Scrollposition wiederherstellen oder anpassen, falls nicht im Suchmodus
    if(nodesToRender.length > 0 && !searchActive) {
        containerEl.scrollTop = currentScroll;
        adjustCardHeights(); // Erneute Anpassung, falls sich Scrollposition ändert (selten nötig)
    } else if (searchActive) {
        adjustCardHeights(); // Auch im Suchmodus Höhen anpassen
    }

    // Sichtbarkeit des Swipe-Indikators anpassen
    if (isMobile() && !searchActive && (pathStack.length > 0 || currentNode !== xmlData.documentElement)) {
        showSwipeIndicator();
    } else {
        hideSwipeIndicator();
    }
}


/**
 * Passt die Höhe aller Karten im Container an, um ein einheitliches Erscheinungsbild zu gewährleisten.
 * Berücksichtigt mobile (einspaltig) und Desktop (mehrspaltig) Layouts.
 */
function adjustCardHeights() {
    const allCards = Array.from(containerEl.querySelectorAll('.card'));
    if (allCards.length === 0) return;

    let targetHeight = 120; // Neue Basis-Mindesthöhe für alle Karten (initial für mobile)

    if (window.innerWidth <= 768) { // Mobile-Ansicht (einspaltig)
        let maxContentHeight = 0;
        allCards.forEach(card => {
            card.style.height = 'auto'; // Temporär auf auto setzen, um die natürliche Höhe zu ermitteln
            card.style.maxHeight = 'none'; // Sicherstellen, dass keine max-height blockiert
            const contentHeight = card.querySelector('.card-content-wrapper').offsetHeight;
            maxContentHeight = Math.max(maxContentHeight, contentHeight);
        });
        // Die endgültige Zielhöhe basiert auf der maximalen Inhaltsgröße + Padding
        targetHeight = Math.max(targetHeight, maxContentHeight + 40); // 40px für padding-top/bottom der card
        
        allCards.forEach(card => {
            card.style.height = `${targetHeight}px`;
            card.style.maxHeight = `${targetHeight}px`; // Fixe maximale Höhe setzen
        });
    } else { // Desktop-Ansicht (mehrspaltig)
        let maxCardHeight = 0;
        allCards.forEach(card => {
            card.style.height = 'auto'; // Temporär auf auto setzen
            if (card.offsetHeight > maxCardHeight) {
                maxCardHeight = card.offsetHeight;
            }
        });
        // Die endgültige Zielhöhe basiert auf der maximalen natürlichen Höhe oder der Mindesthöhe
        targetHeight = Math.max(140, maxCardHeight); // 140px ist die neue Desktop-Minimale Höhe

        allCards.forEach(card => {
            card.style.height = `${targetHeight}px`;
            card.style.maxHeight = `${targetHeight}px`; // Fixe maximale Höhe setzen
        });
    }
}

/**
 * Fügt einen subtilen 3D-Neigungs-Effekt beim Hover über Karten hinzu (nur auf Desktop).
 * @param {HTMLElement} card - Die Karte, der der Effekt hinzugefügt werden soll.
 */
function addCard3DHoverEffect(card) {
    let frameRequested = false; // Optimiert die Performance durch Reduzierung von DOM-Schreibvorgängen
    card.addEventListener('mousemove', (e) => {
        if (frameRequested || isMobile()) return; // Effekt nicht auf Mobilgeräten oder wenn bereits ein Frame angefordert wurde
        frameRequested = true;
        requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // Maus-X relativ zur Karte
            const y = e.clientY - rect.top; // Maus-Y relativ zur Karte
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const deltaX = x - centerX; // Abstand der Maus vom Mittelpunkt (X)
            const deltaY = y - centerY; // Abstand der Maus vom Mittelpunkt (Y)

            // Berechnet Rotationswerte basierend auf Mausposition
            const rotateY = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, (deltaX / centerX) * MAX_ROTATION));
            const rotateX = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, -(deltaY / centerY) * MAX_ROTATION)); // Invertiert, damit Maus hoch = Karte neigt sich nach oben

            // Setzt CSS-Variablen, die in style.css verwendet werden
            card.style.setProperty('--rotateX', `${rotateX}deg`);
            card.style.setProperty('--rotateY', `${rotateY}deg`);
            frameRequested = false;
        });
    });

    card.addEventListener('mouseleave', () => {
        if(isMobile()) return; // Effekt nicht auf Mobilgeräten
        requestAnimationFrame(() => {
            // Setzt Rotationswerte zurück, wenn Maus die Karte verlässt
            card.style.setProperty('--rotateX', '0deg');
            card.style.setProperty('--rotateY', '0deg');
        });
    });
}

// Modal-Funktionen

/**
 * Öffnet das Prompt-Detail-Modal und zeigt den vollständigen Prompt-Text an.
 * @param {Element} node - Der XML-Knoten des Prompts, der angezeigt werden soll.
 * @param {boolean} [calledFromPopstate=false] - Flag, ob der Aufruf aus dem Popstate-Event kommt.
 */
function openModal(node, calledFromPopstate = false) {
    promptFullTextEl.textContent = node.getAttribute('beschreibung') || ''; // Setzt den Text im Modal
    modalEl.classList.remove('hidden'); // Macht das Modal sichtbar
    // Animation für das Modal starten
    requestAnimationFrame(() => {
         requestAnimationFrame(() => {
            modalEl.classList.add('visible');
         });
    });

    // Blendet Tap-to-Reveal-Buttons aus, falls ein Modal geöffnet wird
    if (activePromptCard) {
        activePromptCard.classList.remove('buttons-visible');
        activePromptCard = null;
    }

    // History-Eintrag für das Modal hinzufügen (für Browser-Zurück-Button auf Mobilgeräten)
    if (isMobile() && !calledFromPopstate) {
        const currentState = window.history.state || { path: [], modalOpen: false, searchActive: false, searchQuery: '' };
        if (!currentState.modalOpen) { // Nur einen neuen History-Eintrag hinzufügen, wenn das Modal noch nicht im State war
            const currentViewPathGuids = pathStack.map(n => n.getAttribute('guid'));
            const nodeGuid = node.getAttribute('guid');
            window.history.pushState({ path: currentViewPathGuids, modalOpen: true, promptGuid: nodeGuid, searchActive: searchActive, searchQuery: currentSearchQuery }, '', window.location.href);
        }
    }
    updateBreadcrumb(); // Aktualisiert Breadcrumb (z.B. Zurück-Button-Sichtbarkeit)
}

/**
 * Schließt das Prompt-Detail-Modal.
 * @param {Object} [optionsOrCalledFromPopstate={}] - Optionen oder ein Flag, ob der Aufruf aus Popstate kommt.
 * @param {boolean} [optionsOrCalledFromPopstate.fromPopstate=false] - Ob der Aufruf durch Popstate-Event erfolgte.
 * @param {boolean} [optionsOrCalledFromPopstate.fromBackdrop=false] - Ob das Modal durch Klick auf den Hintergrund geschlossen wurde.
 */
function closeModal(optionsOrCalledFromPopstate = {}) {
    let calledFromPopstate = false;
    let fromBackdrop = false;

    if (typeof optionsOrCalledFromPopstate === 'boolean') {
        calledFromPopstate = optionsOrCalledFromPopstate;
    } else if (typeof optionsOrCalledFromPopstate === 'object' && optionsOrCalledFromPopstate !== null) {
        calledFromPopstate = !!optionsOrCalledFromPopstate.fromPopstate;
        fromBackdrop = !!optionsOrCalledFromPopstate.fromBackdrop;
    }

    if (!modalEl.classList.contains('visible')) return; // Wenn Modal nicht sichtbar ist, nichts tun

    modalEl.classList.remove('visible'); // Startet die Ausblendanimation
    // Verzögert das vollständige Ausblenden, bis Animation abgeschlossen ist
    setTimeout(() => {
        modalEl.classList.add('hidden');
    }, currentTransitionDurationMediumMs);

    // Passt den Browser-History-Eintrag an, je nachdem wie das Modal geschlossen wurde
    if (fromBackdrop) {
        if (isMobile() && window.history.state?.modalOpen && !calledFromPopstate) {
            const LrpmtGuid = window.history.state.promptGuid;
            // Ersetzt den aktuellen History-Eintrag, statt einen neuen zu erstellen
            window.history.replaceState({
                path: window.history.state.path,
                modalOpen: false,
                promptGuid: LrpmtGuid,
                searchActive: searchActive,
                searchQuery: currentSearchQuery
            }, '', window.location.href);
        }
        updateBreadcrumb();
    } else if (isMobile() && !calledFromPopstate && window.history.state?.modalOpen) {
        // Wenn nicht vom Backdrop geschlossen und History-Eintrag für Modal existiert, gehe im Browser zurück
        window.history.back();
    } else {
        updateBreadcrumb();
    }
}


/**
 * Event-Handler für den globalen Klick auf den Body.
 * Schließt Tap-to-Reveal-Buttons, wenn außerhalb geklickt wird.
 * @param {Event} e - Das Klick-Event.
 */
function handleGlobalClick(e) {
    // Wenn eine Prompt-Karte Buttons sichtbar hat und der Klick außerhalb der Karte, des Modals oder des Suchfeldes erfolgte,
    // werden die Buttons ausgeblendet.
    if (activePromptCard && !activePromptCard.contains(e.target) && !modalEl.contains(e.target) && (!searchInputElement || !searchInputElement.contains(e.target))) {
        activePromptCard.classList.remove('buttons-visible');
        activePromptCard = null;
    }
}


// Event Listener Setup (Wird in initApp aufgerufen)
function setupEventListeners() {
    // Top-Bar Zurück-Button
    topbarBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal({ fromBackdrop: true }); // Schließt Modal, wenn offen
        } else if (pathStack.length > 0) {
            navigateOneLevelUp(); // Geht eine Ebene im Pfad zurück
        }
    });

    // Fixierter Zurück-zur-Home-Button (Desktop)
    fixedBackBtn.addEventListener('click', () => {
        if (modalEl.classList.contains('visible')) {
            closeModal(); // Schließt Modal, wenn offen
        }
        // Nur navigieren, wenn nicht bereits Home oder wenn Suche aktiv ist
        if (pathStack.length > 0 || (currentNode && currentNode !== xmlData.documentElement) || currentSearchQuery) {
            performViewTransition(() => {
                currentNode = xmlData.documentElement; // Setzt den Knoten auf das Root-Element
                pathStack = []; // Leert den Pfad-Stack
                currentSearchQuery = ''; // Löscht den Suchbegriff
                searchActive = false; // Deaktiviert die Suche
                if (searchInputElement) searchInputElement.value = ''; // Leert das Suchfeld
                renderView(currentNode); // Rendert die Home-Ansicht
                updateBreadcrumb(); // Aktualisiert den Breadcrumb
                hideSwipeIndicator(); // Blendet den Swipe-Indikator aus
            }, 'backward');
            // History-Eintrag für die Home-Ansicht erstellen
            if (isMobile()) {
                 window.history.pushState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
            }
        }
    });

    // Modal-Schließen-Button
    document.getElementById('modal-close-button').addEventListener('click', () => closeModal());

    // Modal-Kopieren-Button
    const copyModalButton = document.getElementById('copy-prompt-modal-button');
    if (copyModalButton) {
      copyModalButton.addEventListener('click', () => copyPromptText(copyModalButton));
    }

    // Modal-Hintergrund klicken, um es zu schließen
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
            e.stopPropagation(); // Verhindert, dass der Klick auf darunterliegende Elemente durchgeht
            closeModal({ fromBackdrop: true });
        }
    });

    // Klick auf Karten im Container (delegiert)
    containerEl.addEventListener('click', handleCardContainerClick);

    // Globaler Klick-Handler, um Tap-to-Reveal-Buttons zu schließen, wenn außerhalb geklickt wird
    document.body.addEventListener('click', handleGlobalClick);

    // Suchfunktionalität-Listener
    if (searchInputElement) {
        searchInputElement.addEventListener('input', handleSearchInput); // Bei jeder Eingabe suchen
        searchInputElement.addEventListener('focus', () => {
             document.body.classList.add('search-active'); // Body-Klasse für Such-Styling
        });
        searchInputElement.addEventListener('blur', () => {
             // Entfernt Body-Klasse nur, wenn Suchfeld leer ist (ansonsten bleiben Suchergebnisse aktiv)
             if (!searchInputElement.value.trim()) {
                 document.body.classList.remove('search-active');
             }
        });
    }
}


/**
 * Initialisiert mobile-spezifische Features wie die Navigationsleiste und Touch-Gesten.
 */
function setupMobileSpecificFeatures() {
    document.body.classList.add('mobile'); // Fügt Body-Klasse für mobile Styles hinzu
    if (mobileNavEl) mobileNavEl.classList.remove('hidden'); // Zeigt mobile Navigationsleiste an
    mobileHomeBtn = document.getElementById('mobile-home');
    mobileBackBtn = document.getElementById('mobile-back');
    swipeIndicatorEl = document.getElementById('swipe-indicator');

    // Mobile Home-Button
    if (mobileHomeBtn) {
        mobileHomeBtn.addEventListener('click', () => {
            const modalWasVisible = modalEl.classList.contains('visible');
            if (modalWasVisible) {
                closeModal({ fromBackdrop: true }); // Schließt Modal zuerst
            }

            // Prüft, ob wir bereits auf der Home-Ebene sind
            const isCurrentlyAtHome = (currentNode === xmlData.documentElement && pathStack.length === 0 && !currentSearchQuery);

            if (!isCurrentlyAtHome || modalWasVisible) { // Nur navigieren, wenn nicht bereits Home oder Modal offen war
                performViewTransition(() => {
                    currentNode = xmlData.documentElement;
                    pathStack = [];
                    currentSearchQuery = '';
                    searchActive = false;
                    if (searchInputElement) searchInputElement.value = '';
                    renderView(currentNode);
                    updateBreadcrumb();
                    hideSwipeIndicator();
                }, 'backward');
                // History-Eintrag für Home-Ansicht erstellen
                window.history.pushState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
            }
        });
    }

    // Mobile Zurück-Button
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', () => {
            if (modalEl.classList.contains('visible')) {
                closeModal({ fromBackdrop: true }); // Schließt Modal
            } else if (pathStack.length > 0 || currentSearchQuery) { // Wenn Pfad oder Suche aktiv ist
                if (currentSearchQuery) { // Wenn Suche aktiv ist, deaktiviere sie und gehe zur letzten Ordneransicht
                    currentSearchQuery = '';
                    searchActive = false;
                    if (searchInputElement) searchInputElement.value = '';
                    performViewTransition(() => {
                        renderView(currentNode); // Zeigt den zuletzt angezeigten Ordner an
                        updateBreadcrumb();
                    }, 'backward');
                    // History-Eintrag aktualisieren
                    window.history.pushState({ path: pathStack.map(n => n.getAttribute('guid')), modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
                } else { // Ansonsten gehe eine Ebene hoch
                    navigateOneLevelUp();
                }
            }
        });
    }

    // Touch-Event-Listener für Wischgesten auf dem Karten-Container
    containerEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    containerEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Klick auf den Swipe-Indikator
    if (swipeIndicatorEl) {
        swipeIndicatorEl.addEventListener('click', () => {
            if (pathStack.length > 0) {
                navigateOneLevelUp(); // Geht eine Ebene hoch
            } else if (currentSearchQuery) { // Oder deaktiviert die Suche
                currentSearchQuery = '';
                searchActive = false;
                if (searchInputElement) searchInputElement.value = '';
                performViewTransition(() => {
                    renderView(currentNode);
                    updateBreadcrumb();
                }, 'backward');
                window.history.pushState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
            }
        });
    }

    // Setzt den initialen History-Eintrag beim Laden der Seite
    window.history.replaceState({ path: [], modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
    // Listener für Browser-Zurück/-Vorwärts-Buttons
    window.onpopstate = handlePopState;
}


// --- Navigations- und History-Management ---

/**
 * Navigiert eine Ordnerebene im Pfad nach oben.
 */
function navigateOneLevelUp() {
    if (pathStack.length === 0) {
        return; // Nichts tun, wenn bereits auf der obersten Ebene
    }

    performViewTransition(() => {
        const parentNode = pathStack.pop(); // Entfernt den aktuellen Knoten vom Stack
        currentNode = parentNode; // Setzt den übergeordneten Knoten als aktuellen Knoten
        renderView(currentNode); // Rendert die Ansicht des übergeordneten Knotens
        updateBreadcrumb(); // Aktualisiert den Breadcrumb
        // Schließt Tap-to-Reveal-Buttons, falls eine aktive Karte vorhanden war
        if (activePromptCard) {
            activePromptCard.classList.remove('buttons-visible');
            activePromptCard = null;
        }
    }, 'backward'); // Animation Richtung 'backward'
}

/**
 * Navigiert zu einem spezifischen XML-Knoten (Ordner).
 * @param {Element} node - Der XML-Knoten (Ordner), zu dem navigiert werden soll.
 */
function navigateToNode(node) {
    performViewTransition(() => {
        if (currentNode !== node) {
            pathStack.push(currentNode); // Fügt den aktuellen Knoten zum Pfad-Stack hinzu
        }
        currentNode = node; // Setzt den neuen Knoten als aktuellen
        renderView(currentNode); // Rendert die Ansicht des neuen Knotens
        updateBreadcrumb(); // Aktualisiert den Breadcrumb
        hideSwipeIndicator(); // Blendet Swipe-Indikator aus, da wir tiefer navigieren
    }, 'forward'); // Animation Richtung 'forward'

    // History-Eintrag für mobile Geräte erstellen
    if (isMobile() && !modalEl.classList.contains('visible')) {
         let historyPath = pathStack.map(n => n.getAttribute('guid'));
         if (currentNode && currentNode !== xmlData.documentElement) {
             historyPath.push(currentNode.getAttribute('guid'));
         }
         window.history.pushState({ path: historyPath, modalOpen: false, searchActive: false, searchQuery: '' }, '', window.location.href);
     }
}

/**
 * Verarbeitet Popstate-Ereignisse (Browser-Zurück/-Vorwärts-Buttons).
 * @param {PopStateEvent} event - Das Popstate-Event.
 */
function handlePopState(event) {
    const state = event.state || { path: [], modalOpen: false, searchActive: false, searchQuery: '' }; // Aktueller Zustand aus History
    const currentlyModalOpen = modalEl.classList.contains('visible'); // Prüft, ob Modal aktuell offen ist
    // Bestimmt die Animationsrichtung basierend auf der Pfadlänge oder Suchaktivität
    const direction = (state.path.length < pathStack.length || (state.searchActive && !currentSearchQuery)) ? 'backward' : 'forward';

    // Logik für Modal-Zustand
    if (currentlyModalOpen && !state.modalOpen) { // Wenn Modal offen war und jetzt nicht mehr im State ist
        closeModal({ fromPopstate: true });
    } else if (!currentlyModalOpen && state.modalOpen) { // Wenn Modal nicht offen war und jetzt im State ist
        const promptGuidForModal = state.promptGuid;
        const nodeToOpen = promptGuidForModal ? findNodeByGuid(xmlData.documentElement, promptGuidForModal) : null;

        if (nodeToOpen && nodeToOpen.getAttribute('beschreibung')) {
            // Pfad-Stack aus History wiederherstellen
            pathStack = state.path.map(guid => findNodeByGuid(xmlData.documentElement, guid)).filter(Boolean);
            // Korrektur, falls Prompt-GUID fälschlicherweise im Pfad-Stack ist
            if (state.path.length > 0 && pathStack.length > 0 && pathStack[pathStack.length-1].getAttribute('guid') === promptGuidForModal) {
                 pathStack.pop();
            }
            currentNode = pathStack.length > 0 ? pathStack[pathStack.length-1] : xmlData.documentElement;
            // Suchfeld-Status wiederherstellen
            if (searchInputElement && state.searchQuery) {
                searchInputElement.value = state.searchQuery;
                document.body.classList.add('search-active');
            } else if (searchInputElement) {
                searchInputElement.value = '';
                document.body.classList.remove('search-active');
            }
            openModal(nodeToOpen, true); // Modal öffnen
        } else {
             handleNavigationFromState(state, direction); // Oder normale Navigation, falls kein gültiger Prompt
        }
    } else { // Wenn kein Modal-Zustandswechsel
        handleNavigationFromState(state, direction);
    }

    // Suchfeld-Status und Suchbegriff aus History wiederherstellen
    if (searchInputElement) {
        searchInputElement.value = state.searchQuery || '';
        if (state.searchActive) {
            document.body.classList.add('search-active');
            searchActive = true;
            handleSearchInput({ target: searchInputElement }); // Suche erneut ausführen
        } else {
            document.body.classList.remove('search-active');
            searchActive = false;
            currentSearchQuery = '';
        }
    }
}

/**
 * Behandelt die Navigation basierend auf einem History-State-Objekt.
 * @param {Object} state - Das History-State-Objekt.
 * @param {string} direction - Die Navigationsrichtung ('forward' oder 'backward').
 */
function handleNavigationFromState(state, direction) {
    const targetPathLength = state.path.length;
    const updateDOM = () => {
        // Pfad-Stack aus History-State rekonstruieren
        pathStack = state.path.map(guid => findNodeByGuid(xmlData.documentElement, guid)).filter(Boolean);
        // Korrektur, falls Pfad-Länge nicht übereinstimmt (z.B. bei ungültigen GUIDs im State)
        if(pathStack.length !== targetPathLength && state.path.length > 0) {
             pathStack = [];
        } else if (targetPathLength === 0) {
            pathStack = [];
        }
        // Aktuellen Knoten setzen
        currentNode = targetPathLength === 0 ? xmlData.documentElement : pathStack[pathStack.length - 1];
        if (!currentNode && xmlData) currentNode = xmlData.documentElement; // Fallback, falls currentNode null ist

        // Tap-to-Reveal-Buttons schließen
        if (activePromptCard) {
            activePromptCard.classList.remove('buttons-visible');
            activePromptCard = null;
        }

        // Suchzustand wiederherstellen
        if (searchInputElement && state.searchQuery) {
            searchInputElement.value = state.searchQuery;
            document.body.classList.add('search-active');
            currentSearchQuery = state.searchQuery;
            searchActive = true;
            filterAndRenderNodes(xmlData.documentElement, currentSearchQuery); // Suchergebnisse rendern
        } else {
            searchInputElement.value = '';
            document.body.classList.remove('search-active');
            currentSearchQuery = '';
            searchActive = false;
            renderView(currentNode); // Normale Ansicht rendern
        }
        updateBreadcrumb(); // Breadcrumb aktualisieren
    };
    performViewTransition(updateDOM, direction);
}

// --- Touch-Gesten ---

/**
 * Speichert die Startkoordinaten einer Touch-Geste.
 * @param {TouchEvent} e - Das Touchstart-Event.
 */
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchEndX = touchStartX; // Setzt Endkoordinaten initial auf Start
    touchEndY = touchStartY;
}

/**
 * Verfolgt die Bewegung einer Touch-Geste und gibt visuelles Feedback.
 * Deaktiviert während Modal offen oder Suche aktiv.
 * @param {TouchEvent} e - Das Touchmove-Event.
 */
function handleTouchMove(e) {
    if (!touchStartX || modalEl.classList.contains('visible') || searchActive) return; // Nicht aktiv, wenn Modal offen oder Suche aktiv
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
    let diffX = touchEndX - touchStartX; // Horizontale Bewegung

    // Wenn es eine signifikante horizontale Bewegung ist (rechts), visuelles Feedback geben
    if (Math.abs(diffX) > Math.abs(touchEndY - touchStartY) && diffX > swipeFeedbackThreshold) {
        containerEl.classList.add('swiping-right');
        let moveX = Math.min(diffX - swipeFeedbackThreshold, window.innerWidth * 0.1); // Begrenzt die Verschiebung
        containerEl.style.transform = `translateX(${moveX}px)`;
        showSwipeIndicator(); // Zeigt den Indikator an
    } else {
        containerEl.classList.remove('swiping-right');
        containerEl.style.transform = '';
        hideSwipeIndicator(); // Versteckt den Indikator
    }
}

/**
 * Verarbeitet das Ende einer Touch-Geste und löst ggf. eine Navigation aus.
 * Deaktiviert während Modal offen oder Suche aktiv.
 */
function handleTouchEnd() {
    if (!touchStartX || modalEl.classList.contains('visible') || searchActive) return; // Nicht aktiv, wenn Modal offen oder Suche aktiv
    let diffX = touchEndX - touchStartX; // Gesamt horizontale Verschiebung
    let diffY = touchEndY - touchStartY; // Gesamt vertikale Verschiebung

    // Visuelles Feedback zurücksetzen
    containerEl.classList.remove('swiping-right');
    containerEl.style.transform = '';
    hideSwipeIndicator();

    // Wenn eine signifikante Wischgeste nach rechts erkannt wurde
    if (Math.abs(diffX) > Math.abs(diffY) && diffX > swipeThreshold) {
        if (pathStack.length > 0 || currentSearchQuery) { // Nur navigieren, wenn ein Zurück möglich ist
             window.history.back(); // Löst Popstate aus
        }
    }
    // Touch-Koordinaten zurücksetzen
    touchStartX = 0; touchStartY = 0; touchEndX = 0; touchEndY = 0;
}


// --- Suchlogik ---

/**
 * Behandelt die Eingabe im Suchfeld und aktualisiert die Anzeige entsprechend.
 * @param {Event} event - Das Input-Event vom Suchfeld.
 */
function handleSearchInput(event) {
    currentSearchQuery = event.target.value.trim().toLowerCase(); // Suchbegriff bereinigen und klein schreiben
    searchActive = currentSearchQuery.length > 0; // Suche aktiv, wenn Begriff nicht leer

    performViewTransition(() => {
        // Ruft die Funktion auf, die die Nodes filtert und rendert
        filterAndRenderNodes(xmlData.documentElement, currentSearchQuery);
        updateBreadcrumb(); // Aktualisiert den Breadcrumb, um den Suchstatus anzuzeigen
        // Aktualisiert den Browser-History-Eintrag für den Suchstatus
        window.history.pushState({
            path: [], // Pfad ist leer, da Suche global ist
            modalOpen: false,
            searchActive: searchActive,
            searchQuery: currentSearchQuery
        }, '', window.location.href);
    }, 'initial'); // 'initial' für einen sanften Fade-In der Suchergebnisse
}

/**
 * Filtert alle Knoten im XML-Dokument basierend auf einem Suchbegriff und rendert die Ergebnisse.
 * @param {Element} rootNode - Das Wurzelelement des XML-Dokuments.
 * @param {string} query - Der Suchbegriff.
 */
function filterAndRenderNodes(rootNode, query) {
    const matchingNodes = [];
    searchNodesRecursive(rootNode, query, matchingNodes); // Rekursive Suche
    renderViewFiltered(matchingNodes); // Rendert die gefundenen Knoten
}

/**
 * Rekursive Hilfsfunktion zur Durchsuchung des XML-Baums nach passenden Knoten.
 * @param {Element} node - Der aktuelle Knoten im rekursiven Durchlauf.
 * @param {string} query - Der Suchbegriff.
 * @param {Array<Element>} results - Array zum Speichern der gefundenen Knoten.
 */
function searchNodesRecursive(node, query, results) {
    const nodeValue = (node.getAttribute('value') || '').toLowerCase(); // Titel des Knotens
    const nodeBeschreibung = (node.getAttribute('beschreibung') || '').toLowerCase(); // Beschreibungstext des Prompts
    const isFolder = Array.from(node.children).some(child => child.tagName === 'TreeViewNode'); // Prüft, ob es ein Ordner ist

    // Wenn der Knoten selbst den Suchbegriff enthält
    if (nodeValue.includes(query) || nodeBeschreibung.includes(query)) {
        results.push(node); // Fügt den Knoten zu den Ergebnissen hinzu
        // Wenn es ein Ordner ist UND der Ordner selbst zum Suchbegriff passt,
        // fügen wir alle seine Unterelemente (auch Ordner und Prompts) hinzu,
        // um den vollständigen Inhalt eines gefundenen Ordners anzuzeigen.
        if (isFolder && nodeValue.includes(query)) {
            Array.from(node.children).filter(child => child.tagName === 'TreeViewNode').forEach(child => {
                searchNodesRecursive(child, '', results); // Leere Abfrage, um alle Kinder einzuschließen
            });
        }
    } else if (isFolder) {
        // Wenn der aktuelle Knoten ein Ordner ist, aber selbst nicht übereinstimmt,
        // prüfen wir rekursiv seine Kinder.
        Array.from(node.children).filter(child => child.tagName === 'TreeViewNode').forEach(child => {
            searchNodesRecursive(child, query, results);
        });
    }
}

/**
 * Rendert eine Liste von Knoten im Karten-Container. Wird für Suchergebnisse verwendet.
 * @param {Array<Element>} nodesToRender - Eine Liste von XML-Knoten, die gerendert werden sollen.
 */
function renderViewFiltered(nodesToRender) {
    containerEl.innerHTML = ''; // Leert den Container
    const cardsToObserve = []; // Zum Sammeln von Karten für den Intersection Observer

    if (nodesToRender.length === 0) {
        containerEl.innerHTML = `<p style="text-align:center; padding:2rem; opacity:0.7;">Keine Ergebnisse für die Suche "${currentSearchQuery}".</p>`;
        gsap.to(containerEl.firstChild, {opacity: 1, duration: 0.5});
        hideSwipeIndicator();
        return;
    }

    // Entfernt Duplikate aus den Nodes, die gerendert werden sollen
    const uniqueNodes = [];
    const guidsSeen = new Set();
    nodesToRender.forEach(node => {
        const guid = node.getAttribute('guid');
        if (guid && !guidsSeen.has(guid)) {
            uniqueNodes.push(node);
            guidsSeen.add(guid);
        }
    });

    // Erstellt Karten für die eindeutigen Nodes
    uniqueNodes.forEach(node => {
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

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('card-content-wrapper');
        contentWrapper.appendChild(titleElem);

        const imageAttr = node.getAttribute('image');

        if (isFolder) {
            card.classList.add('folder-card'); card.setAttribute('data-type', 'folder');
            let iconToUse = svgTemplateFolder;
            if (imageAttr === '2' && svgTemplateIcon2) {
                iconToUse = svgTemplateIcon2;
            }
            if (iconToUse) {
                const folderIconSvg = iconToUse.cloneNode(true);
                const folderIconId = `icon-folder-${nodeGuid}`;
                folderIconSvg.id = folderIconId;
                folderIconSvg.classList.add('dynamic-card-icon');
                contentWrapper.appendChild(folderIconSvg);
                // Vivus.js nur für das Standard-Ordner-SVG-Template animieren
                if (iconToUse === svgTemplateFolder) {
                    setupVivusAnimation(card, folderIconId);
                }
            }
        } else { // Prompt-Karte
            card.setAttribute('data-type', 'prompt');
            card.classList.add('prompt-card');
            if (imageAttr === '1' && svgTemplateIcon1) {
                const promptIconSvg = svgTemplateIcon1.cloneNode(true);
                promptIconSvg.classList.add('dynamic-card-icon');
                contentWrapper.insertBefore(promptIconSvg, titleElem);
                promptIconSvg.style.marginBottom = '0.8rem';
            }

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

    cardsToObserve.forEach(c => cardObserver.observe(c));
    adjustCardHeights();
    hideSwipeIndicator(); // Bei Suchergebnissen immer Indikator ausblenden
}

