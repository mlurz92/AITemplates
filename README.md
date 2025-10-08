# Anwendungsbeschreibung & Entwickler-Handbuch: Prompt-Templates Browser

## 1. Vision & Architektur-Philosophie

Der **Prompt-Templates Browser** ist eine als **Progressive Web App (PWA)** konzipierte Single-Page-Anwendung. Die Kernvision ist die Bereitstellung eines **maximal performanten, latenzfreien und offline-fähigen Erlebnisses** für das Verwalten und schnelle Zugreifen auf eine hierarchische Sammlung von Text-Snippets (Prompts).

Dieses Ziel wird durch eine bewusste architektonische Entscheidung erreicht: den **Verzicht auf JavaScript-Frameworks**. Die gesamte Anwendungslogik basiert auf reinem, hochoptimiertem **Vanilla JavaScript**. Dieser Ansatz minimiert den Overhead, ermöglicht die volle Kontrolle über das Rendering sowie die Performance und stellt sicher, dass die Interaktionen des Benutzers unmittelbar und flüssig sind.

## 2. Getting Started (Lokale Entwicklung)

Die Anwendung ist vollständig clientseitig und erfordert kein Build-System.

1.  **Repository klonen:** Klonen Sie das Repository auf Ihr lokales System.
2.  **Im Browser öffnen:** Öffnen Sie die `index.html`-Datei direkt in einem modernen Webbrowser. Für die volle Funktionalität des `localStorage` und der `fetch`-API wird das Ausführen über einen einfachen lokalen Webserver (z.B. via VS Code Live Server) empfohlen.

## 3. Technologische Architektur & Kernkonzepte

### 3.1. Dateistruktur

*   **`index.html`**: Das einzige HTML-Dokument. Dient als App-Shell und enthält Container für dynamische Inhalte sowie eine Sammlung vordefinierter SVG-Templates in `<defs>`.
*   **`style.css`**: Eine einzelne CSS-Datei, die das gesamte visuelle Design, das responsive Layout, alle Animationen und das "Layered Glassmorphism"-Thema definiert.
*   **`script.js`**: Das Gehirn der Anwendung. Verwaltet Zustand, Rendering, Benutzerinteraktionen, Event-Handling und die Persistenzlogik.
*   **`templates.json`**: Die initiale Datenquelle (Seed-Daten). Wird nur geladen, wenn keine benutzerdefinierten Daten im `localStorage` vorhanden sind.
*   **`manifest.json`**: Definiert das PWA-Verhalten (Installierbarkeit, Theme-Farben etc.).

### 3.2. Zustandsverwaltung & Datenpersistenz

Der Anwendungszustand wird über den `localStorage` des Browsers verwaltet, was eine sofortige Persistenz ohne Backend ermöglicht.

*   **`customTemplatesJson`**: Speichert die gesamte, vom Benutzer modifizierte Baumstruktur der Prompts und Ordner als JSON-String. Dies ist der "Single Source of Truth" nach der initialen Ladung.
*   **`favoritePrompts`**: Eine separate, flache Liste von Prompt-IDs (`string[]`). Dies ermöglicht einen schnellen und effizienten Zugriff auf Favoriten, ohne die gesamte Baumstruktur durchsuchen zu müssen.
*   **Initialisierung (`initApp` & `loadJsonData`):** Beim Start prüft die App, ob `customTemplatesJson` existiert. Falls ja, wird dieser Zustand geladen. Falls nein, wird die `templates.json` via `fetch` als Ausgangszustand geladen.

### 3.3. Rendering & Performance

*   **Dynamisches Rendering (`renderView`):** Alle UI-Karten werden zur Laufzeit per JavaScript erstellt. Dies hält die `index.html` schlank und das initiale Laden extrem schnell.
*   **SVG-Templating:** Alle wiederverwendeten Icons sind in der `index.html` innerhalb eines `<defs>`-Blocks als `<svg>`-Templates definiert. Sie werden bei Bedarf performant mit `<use xlink:href="#svg-template-id">` geklont, was den DOM-Aufbau beschleunigt und die Wartbarkeit erhöht.
*   **GPU-Beschleunigung:** Alle Animationen nutzen ausschließlich die CSS-Eigenschaften `transform`, `opacity` und `filter`, um von der GPU berechnet zu werden und maximale Flüssigkeit zu gewährleisten.
*   **Effiziente Event-Handhabung:** Komplexe Events wie Scrolling werden durch `requestAnimationFrame` gedrosselt (`ticking`-Variable), um DOM-Manipulationen auf einmal pro Frame zu beschränken.
*   **View Transitions API:** Die Navigation zwischen Ordnerebenen wird durch `document.startViewTransition` gesteuert, was für nahtlose, vom Browser optimierte Seitenübergänge sorgt.

## 4. Visuelles Design: "Layered Glassmorphism"

Das Design erzeugt durch mehrere übereinanderliegende Ebenen eine visuelle Tiefe und eine taktile Haptik.

1.  **Ebene 1: Aurora-Hintergrund (`.aurora-container`)**: Sich langsam bewegende, weichgezeichnete Farbformen erzeugen eine dynamische Atmosphäre. Ein **Parallax-Effekt** (`updateParallax`) verleiht der Szene Tiefe beim Scrollen.
2.  **Ebene 2: Rauschtextur (`body::before`)**: Eine subtile, animierte SVG-Rauschtextur (`grain`-Animation) verleiht allen Oberflächen eine taktile Qualität.
3.  **Ebene 3: UI-Ebene**: Alle UI-Elemente nutzen `backdrop-filter: blur(20px)`, um den "Milchglas"-Effekt zu erzeugen. Ein feiner, leuchtender Rahmen (realisiert durch einen `::before`-Pseudo-Element mit `mask-composite`) und eine subtile Noise-Textur (`::after`) vervollständigen den hochwertigen Glas-Look.

## 5. Komponenten-Deep-Dive & Funktionszuordnung

### 5.1. Karten (`.card`) & Organisationsmodus

*   **Beschreibung:** Die primären UI-Elemente, die Ordner oder Prompts repräsentieren. Gesteuert durch den zentralen Event-Listener `handleCardContainerClick`.
*   **Organisationsmodus (`toggleOrganizeMode`):**
    *   Aktiviert durch Klick auf den "Organisieren"-Button in der Top-Bar.
    *   Fügt dem `#cards-container` die Klasse `.edit-mode` hinzu, was die "Jiggle"-Animation (`@keyframes jiggle`) auslöst und Bearbeitungs-Buttons auf den Karten einblendet.
    *   Initialisiert die **`SortableJS`**-Bibliothek für Drag-and-Drop-Sortierung innerhalb der aktuellen Ordnerebene.
*   **Drag-and-Drop-Logik (`handleDrag...`-Funktionen):**
    *   **Verschieben in Ordner:** Beim Ziehen einer Karte über eine Ordner-Karte wird diese als `drop-target-folder` markiert. Ein **Spring-Loading-Effekt** (`springLoadTimeout`) navigiert nach einer kurzen Verzögerung automatisch in den Ordner, was das Verschieben über mehrere Ebenen hinweg ermöglicht.
    *   **Kombinieren zu neuem Ordner:** Beim Ziehen einer Karte auf eine andere Prompt-Karte wird diese als `drop-target-combine` markiert. Beim Loslassen wird der Nutzer gefragt, ob beide Elemente in einem neuen Ordner zusammengefasst werden sollen (`combineIntoNewFolder`).

### 5.2. Kontextmenü (`createContextMenu`)

*   **Beschreibung:** Ein benutzerdefiniertes Rechtsklick-Menü für Karten und Favoriten-Elemente, das kontextabhängige Aktionen bietet.
*   **Implementierung:** Ein einziges, globales `div`-Element, das dynamisch mit Inhalten gefüllt und positioniert wird (`showContextMenu`).
*   **Intelligenz:** Das Menü passt seine Aktionen und deren Sichtbarkeit an den Typ des angeklickten Elements an (z.B. "Verschieben" ist nur für Karten, nicht für Favoriten verfügbar). Es führt zudem eine Viewport-Kollisionserkennung durch, um sicherzustellen, dass es immer vollständig sichtbar ist.

### 5.3. Intelligente Favoritenleiste (`#favorites-bar`)

*   **Beschreibung:** Ein Schnellzugriffs-Dock, das sich intelligent an die Anzahl der Favoriten und die Bildschirmgröße anpasst.
*   **Zwei Zustände (`toggleFavoritesBarExpansion`):**
    1.  **Standard (Scroll-Modus):** Einzeilig und horizontal scrollbar. CSS `scroll-snap` sorgt für sauberes Einrasten. Eine CSS `mask-image` erzeugt einen Überblendeffekt, der nur aktiv ist (`.is-scrollable`), wenn tatsächlich ein Overflow vorliegt.
    2.  **Expandiert (`.is-expanded`):** Ein Klick auf den Expander-Button vergrößert die Leiste und zeigt alle Favoriten in einem mehrzeiligen Layout an.
*   **Robuste Logik (`renderFavoritesBar`):** Die Erkennung des Overflows erfolgt mittels `setTimeout(..., 0)`. Dies stellt sicher, dass die Messung erst nach dem vollständigen Layout-Rendering des Browsers stattfindet und somit immer zuverlässig ist.

### 5.4. Globaler Tooltip (`#favorite-tooltip`)

*   **Implementierung:** Ein einziges, globales `div`-Element, um Probleme mit dem CSS `stacking context` zu umgehen.
*   **Intelligenz (`showFavoriteTooltip`):** Führt eine **Viewport-Kollisionserkennung** durch und passt seine Position dynamisch an.
*   **Performance:** Ein **Debounce-Mechanismus** (`tooltipTimeout`) verhindert visuelles Flackern bei schnellem Hovern.

## 6. Wichtige Workflows: Von der Interaktion zur Funktion

*   **Ein Element umbenennen:**
    1.  Rechtsklick auf eine Karte -> Kontextmenü erscheint.
    2.  Klick auf "Umbenennen" ruft `startRenamingCard(card)` auf.
    3.  Die Funktion ersetzt das `<h3>`-Element durch ein `<input>`, fokussiert es und fügt Event-Listener für `blur` und `Enter` hinzu.
    4.  Nach Abschluss wird der neue Titel im `jsonData`-Objekt gespeichert, persistiert (`persistJsonData`) und die UI via `exitRenameMode` zurückgesetzt.

*   **Ein Element verschieben:**
    1.  Rechtsklick -> "Verschieben..." ruft `openMoveItemModal(id)` auf.
    2.  Das Modal wird geöffnet und `renderFolderTree` erstellt eine klickbare Baumansicht aller Ordner. Deaktiviert werden dabei der Zielordner selbst und sein aktueller Elternordner.
    3.  Nach Auswahl eines Ziels und Klick auf "Verschieben" wird `confirmMoveItem` aufgerufen, was wiederum die Kernfunktion `moveNode` auslöst.
    4.  `moveNode` modifiziert die `jsonData`-Struktur, indem es den Knoten aus dem alten `items`-Array entfernt und in das neue einfügt, persistiert und die Ansicht neu rendert.

## 7. Mobile-spezifische Verbesserungen & Workflows

*   **Swipe-to-Go-Back:**
    *   **Implementierung:** `handleTouchStart`, `handleTouchMove` und `handleTouchEnd` verfolgen die Wischgeste auf dem `.cards-container`.
    *   **Logik:** Bei einer Wischgeste nach rechts (`diffX > swipeThreshold`) wird `navigateHistory('backward')` aufgerufen, was die `window.history.back()`-API triggert.

*   **Native-ähnliche Navigation mit der History API:**
    *   **Technologie:** Die `window.history` API (`pushState`, `onpopstate`) wird in `setupMobileSpecificFeatures` und den Navigationsfunktionen (`navigateToNode`, `openPromptModal`) verwendet.
    *   **Ergebnis:** Jeder Navigationsschritt erzeugt einen neuen Eintrag im Browserverlauf. Der Benutzer kann die "Zurück"-Geste seines Geräts verwenden, um intuitiv zu navigieren. Die `handlePopState`-Funktion verarbeitet diese Aktionen und stellt den korrekten UI-Zustand wieder her.

## 8. Barrierefreiheit (Accessibility)

*   **ARIA-Labels:** Alle ikon-basierten Buttons sind mit aussagekräftigen `aria-label`-Attributen versehen.
*   **ARIA-Zustände:** Interaktive Elemente wie der Vollbild-Button oder der Favoriten-Expander nutzen `aria-expanded` und `aria-label`, deren Zustand dynamisch per JavaScript aktualisiert wird, um Screenreadern stets den korrekten Kontext zu vermitteln.
*   **Fokus-Management:** `:focus-visible` wird für klare Tastaturfokus-Indikatoren verwendet. Beim Öffnen von Modals wird der Fokus programmgesteuert auf das erste interaktive Element gesetzt.
*   **Semantik:** Die korrekte Verwendung von `<main>`, `<header>`, `<nav>` und `<button>` sorgt für eine klare und maschinenlesbare Dokumentenstruktur.