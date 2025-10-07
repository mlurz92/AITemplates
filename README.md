# Anwendungsbeschreibung & Entwickler-Handbuch: Prompt-Templates Browser

## 1. Vision & Architektur-Philosophie

Der **Prompt-Templates Browser** ist eine als **Progressive Web App (PWA)** konzipierte Single-Page-Anwendung. Die Kernvision ist die Bereitstellung eines **maximal performanten, latenzfreien und offline-fähigen Erlebnisses**.

Dieses Ziel wird durch eine bewusste architektonische Entscheidung erreicht: den **Verzicht auf JavaScript-Frameworks**. Die gesamte Anwendungslogik basiert auf reinem, hochoptimiertem **Vanilla JavaScript**. Dieser Ansatz minimiert den Overhead, ermöglicht die volle Kontrolle über das Rendering und die Performance und stellt sicher, dass die Interaktionen des Benutzers unmittelbar und flüssig sind.

## 2. Getting Started (Lokale Entwicklung)

Die Anwendung ist vollständig clientseitig und erfordert kein Build-System.

1.  **Repository klonen:** Klonen Sie das Repository auf Ihr lokales System.
2.  **Im Browser öffnen:** Öffnen Sie die `index.html`-Datei direkt in einem modernen Webbrowser. Für die volle Funktionalität des `localStorage` wird das Ausführen über einen einfachen lokalen Webserver (z.B. via VS Code Live Server) empfohlen.

## 3. Technologische Architektur & Kernkonzepte

### 3.1. Dateistruktur

*   **`index.html`**: Das einzige HTML-Dokument. Dient als App-Shell und enthält Container für dynamische Inhalte sowie eine Sammlung vordefinierter SVG-Templates in `<defs>` zur performanten Klonung.
*   **`style.css`**: Eine einzelne CSS-Datei, die das gesamte visuelle Design, das responsive Layout, alle Animationen und das "Glassmorphism"-Thema definiert.
*   **`script.js`**: Das Gehirn der Anwendung. Verwaltet Zustand, Rendering, Benutzerinteraktionen und die Persistenzlogik.
*   **`templates.json`**: Die initiale Datenquelle (Seed-Daten).
*   **`manifest.json`**: Definiert das PWA-Verhalten.

### 3.2. Zustandsverwaltung & Datenpersistenz

Der Zustand wird über den `localStorage` des Browsers verwaltet, was eine sofortige Persistenz ermöglicht.

*   **`customTemplatesJson`**: Speichert die gesamte, vom Benutzer modifizierte Baumstruktur der Prompts und Ordner. Dies ist der "Single Source of Truth" nach der initialen Ladung.
*   **`favoritePrompts`**: Eine separate, flache Liste von Prompt-IDs für schnellen Zugriff auf Favoriten.

### 3.3. Rendering & Performance

*   **Dynamisches Rendering:** Alle UI-Karten werden zur Laufzeit per JavaScript (`renderView`) erstellt. Dies hält die `index.html` schlank und das initiale Laden extrem schnell.
*   **GPU-Beschleunigung:** Alle Animationen nutzen ausschließlich die CSS-Eigenschaften `transform`, `opacity` und `filter`, um von der GPU berechnet zu werden und maximale Flüssigkeit zu gewährleisten.
*   **Effiziente Event-Handhabung:** Komplexe Events wie Scrolling werden durch `requestAnimationFrame` gedrosselt, um DOM-Manipulationen auf einmal pro Frame zu beschränken.
*   **View Transitions API:** Die Navigation zwischen Ordnerebenen wird durch `document.startViewTransition` gesteuert, was für nahtlose, animierte Seitenübergänge sorgt.

## 4. Visuelles Design: "Layered Glassmorphism"

Das Design erzeugt durch mehrere Ebenen eine visuelle Tiefe.

1.  **Ebene 1: Aurora-Hintergrund (`.aurora-container`)**: Sich langsam bewegende, weichgezeichnete Farbformen mit einem **Parallax-Effekt**, der durch JavaScript (`updateParallax`) gesteuert wird.
2.  **Ebene 2: Rauschtextur (`body::before`)**: Eine subtile, animierte SVG-Rauschtextur verleiht allen Oberflächen eine taktile Qualität.
3.  **Ebene 3: UI-Ebene**: Alle UI-Elemente nutzen `backdrop-filter: blur(20px)`, um den "Milchglas"-Effekt zu erzeugen.

## 5. Komponenten-Deep-Dive & Funktionszuordnung

### 5.1. Karten (`.card`) & Container (`#cards-container`)

*   **Beschreibung:** Die primären UI-Elemente, die Ordner oder Prompts repräsentieren.
*   **Rendering:** Dynamisch erstellt in der Funktion `renderView`.
*   **Layout:** Gesteuert durch ein intelligentes CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(120px, 1fr))`).
*   **Interaktion:** Gemanagt durch den zentralen Event-Listener in `handleCardContainerClick`.
*   **Animationen:** Hover-Effekte (`transform`), "Jiggle"-Modus (`@keyframes jiggle`) und die "Zeichnen"-Animation der Ordner-Icons (`setupVivusAnimation`).

### 5.2. Favoritenleiste (`#favorites-bar`) & Intelligenter Tooltip

*   **Beschreibung:** Ein Schnellzugriffs-Dock am unteren Rand für favorisierte Prompts.
*   **Rendering:** Dynamisch erstellt in `renderFavoritesBar` basierend auf dem `favoritePrompts`-Array.
*   **Favoriten-"Chips" (`.favorite-item`):** Kompakte Buttons mit Icon und Titel. Ein Klick löst `copyToClipboard` aus und startet eine CSS-Animation (`.copy-success`), die das Icon zu einem Häkchen morpht.
*   **Globaler Tooltip (`#favorite-tooltip`):**
    *   **Implementierung:** Ein einziges, globales `div`-Element, das in `createGlobalTooltip` erstellt wird, um Probleme mit dem CSS `stacking context` zu umgehen.
    *   **Logik:** Die Funktionen `showFavoriteTooltip` und `hideFavoriteTooltip` steuern die Sichtbarkeit und den Inhalt.
    *   **Intelligenz:** `showFavoriteTooltip` führt eine **Viewport-Kollisionserkennung** durch. Es berechnet die Dimensionen des Tooltips und passt seine `top`- und `left`-Positionen dynamisch an, um sicherzustellen, dass er niemals die Bildschirmränder überragt.
    *   **Performance:** Ein **Debounce-Mechanismus** (`tooltipTimeout`) verhindert visuelles Flackern bei schnellem Scrollen über die Favoriten.

### 5.3. Modals

*   **Prompt-Modal (`#prompt-modal`):** Dient der Anzeige, dem Kopieren und Bearbeiten von Prompts. Gesteuert durch `openPromptModal` und `closeModal`. Der Bearbeitungszustand wird über `toggleEditMode` verwaltet.
*   **Weitere Modals:** `create-folder-modal` und `move-item-modal` folgen demselben Prinzip und werden ebenfalls über die zentralen `openModal`/`closeModal`-Funktionen gesteuert.

## 6. Wichtige Workflows: Von der Interaktion zur Funktion

Dieser Abschnitt schlüsselt die wichtigsten Benutzerinteraktionen auf und ordnet sie den ausführenden JavaScript-Funktionen zu.

*   **App-Start:**
    1.  `initApp()` wird aufgerufen.
    2.  `loadJsonData()` prüft `localStorage` auf `customTemplatesJson`.
    3.  Falls vorhanden: `JSON.parse()` und Aufruf von `processJson()`.
    4.  Falls nicht: `fetch("templates.json")` und Aufruf von `processJson()`.
    5.  `processJson()` initialisiert den Zustand und ruft `renderView()` und `renderFavoritesBar()` auf.

*   **Navigation in einen Ordner:**
    1.  Benutzer klickt auf eine Ordner-Karte (`.card[data-type="folder"]`).
    2.  `handleCardContainerClick()` fängt den Klick ab.
    3.  `navigateToNode(node)` wird aufgerufen.
    4.  Der aktuelle `currentNode` wird auf den `pathStack` geschoben.
    5.  Der neue Ordner wird zum `currentNode`.
    6.  `document.startViewTransition()` wird mit `renderView()` und `updateBreadcrumb()` als Callback aufgerufen, was den animierten Übergang auslöst.

*   **Einen Favoriten kopieren:**
    1.  Benutzer klickt auf einen `.favorite-item`.
    2.  Der Event-Listener ruft `copyToClipboard(content, element)` auf.
    3.  `navigator.clipboard.writeText()` kopiert den Inhalt.
    4.  Bei Erfolg wird dem `.favorite-item` die Klasse `.copy-success` hinzugefügt, was die Icon-Morph-Animation in CSS auslöst.
    5.  `showNotification()` wird aufgerufen, um eine Bestätigung anzuzeigen.

## 7. Mobile-spezifische Verbesserungen

Die Anwendung bietet ein optimiertes Erlebnis auf Touch-Geräten.

*   **Swipe-to-Go-Back:**
    *   **Implementierung:** Die Funktionen `handleTouchStart`, `handleTouchMove` und `handleTouchEnd` verfolgen die Wischgeste des Benutzers auf dem `.cards-container`.
    *   **Logik:** Wenn eine ausreichend lange Wischgeste nach rechts (`diffX > swipeThreshold`) erkannt wird, wird `navigateHistory('backward')` aufgerufen.
*   **Native-ähnliche Navigation:**
    *   **Technologie:** Die `window.history` API (`pushState`, `onpopstate`) wird in `setupMobileSpecificFeatures` und den Navigationsfunktionen verwendet.
    *   **Ergebnis:** Jeder Navigationsschritt (Ordner betreten, Modal öffnen) erzeugt einen neuen Eintrag im Browserverlauf. Dadurch kann der Benutzer die "Zurück"-Geste oder den Zurück-Button seines Geräts verwenden, um intuitiv durch die App zu navigieren, genau wie in einer nativen Anwendung. Die `handlePopState`-Funktion verarbeitet diese Aktionen.

## 8. Barrierefreiheit (Accessibility)

*   **ARIA-Labels:** Alle ikon-basierten Buttons sind mit `aria-label`-Attributen versehen.
*   **Fokus-Management:** `:focus-visible` wird für klare Tastaturfokus-Indikatoren verwendet.
*   **Semantik:** Die Verwendung von `<main>`, `<header>`, `<nav>` sorgt für eine klare Struktur.