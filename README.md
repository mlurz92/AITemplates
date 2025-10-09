# Prompt-Templates Browser: Vollständige Technische Dokumentation & Entwickler-Handbuch

## 1. Projekt-Übersicht & Kernvision

Der **Prompt-Templates Browser** ist eine hochperformante, offline-fähige **Progressive Web App (PWA)**, die als Single-Page-Anwendung (SPA) konzipiert ist. Sie ermöglicht eine intuitive, hierarchische Verwaltung von Text-Vorlagen (Prompts) in einer Ordnerstruktur. Die Kernfunktionalität umfasst die schnelle Navigation, das Anzeigen und Kopieren von Prompts, eine Drag-and-Drop-Organisation, eine anpassbare Favoritenleiste und ein durchdachtes, responsives User Interface.

**Technische Kernvision:** Die Anwendung wurde nach dem Prinzip der **minimalen Abhängigkeiten und maximalen Performance** entwickelt. Sie verzichtet bewusst auf JavaScript-Frameworks und Build-Prozesse und setzt auf pures ("Vanilla") JavaScript, HTML und CSS. Alle Animationen sind GPU-beschleunigt, das Event-Handling ist optimiert und die Persistenz wird latenzfrei über `localStorage` realisiert, um ein natives App-Gefühl zu erzeugen.

**Technische Highlights:**

*   **Framework-frei:** 100 % Vanilla JavaScript für maximale Kontrolle und Performance.
*   **Offline-Fähigkeit:** Alle Prompts und Favoriten werden im `localStorage` persistiert. Die Anwendung ist nach dem ersten Laden vollständig offline funktionsfähig.
*   **Performance-Optimiert:**
    *   **Rendering:** Rendert maximal 36 Karten pro Ansicht, um den DOM schlank zu halten.
    *   **Animationen:** Nutzt ausschließlich die CSS-Eigenschaften `transform`, `opacity` und `filter` für butterweiche, GPU-beschleunigte Animationen. `will-change` wird gezielt eingesetzt.
    *   **Event-Handling:** Scroll-Events werden mittels `requestAnimationFrame` gedrosselt (throttled), um Jank zu vermeiden. Passive Event-Listener werden wo immer möglich verwendet.
*   **PWA-Features:** Eine `manifest.json` ermöglicht die Installation auf Desktop- und Mobilgeräten für ein natives App-Erlebnis.
*   **Design-Philosophie:** Ein modernes **"Glassmorphism"-UI** mit einem dunklen, durch Aurora-Effekte belebten Hintergrund. Transparente, schwebende Ebenen mit `backdrop-filter` und subtilen Licht- und Schatten-Effekten schaffen eine hochwertige visuelle Tiefe.

---

## 2. Architektur & Datenfluss

### 2.1 Dateistruktur

Die Anwendung besteht aus einem minimalen Set an Dateien, die alle im Hauptverzeichnis liegen:

*   `index.html`: Die einzige HTML-Datei, die die gesamte Struktur der Anwendung definiert.
*   `style.css`: Enthält alle Stil-, Layout- und Animationsregeln.
*   `script.js`: Beinhaltet die gesamte Anwendungslogik.
*   `templates.json`: Die Standard-Datenquelle für die Prompts, die beim ersten Start oder nach einem Reset geladen wird.
*   `manifest.json`: Definiert das Verhalten der PWA.
*   `favicon.svg`, `favicon_animated.svg`: Statische und animierte Anwendungs-Icons.
*   `icons/`: Ordner mit PWA-Icons in verschiedenen Auflösungen.

### 2.2 Datenmanagement & Persistenz

Die Anwendung verwaltet ihren Zustand primär über zwei Objekte im `localStorage`:

1.  **`customTemplatesJson`**: Speichert die gesamte Baumstruktur der Prompts und Ordner als JSON-String.
    *   **Laden (`loadJsonData`)**: Beim Start prüft die App, ob dieser Schlüssel im `localStorage` existiert. Wenn ja, werden die benutzerdefinierten Daten geladen. Wenn nein (oder bei einem Parsing-Fehler), wird auf die `templates.json`-Datei als Fallback zurückgegriffen.
    *   **Speichern (`persistJsonData`)**: Jede Änderung an der Datenstruktur (Hinzufügen, Löschen, Umbenennen, Verschieben) löst diese Funktion aus, die das globale `jsonData`-Objekt serialisiert und im `localStorage` speichert. Dies geschieht in einem `try...catch`-Block, um Speicherfehler abzufangen.

2.  **`favoritePrompts`**: Speichert ein einfaches Array von Prompt-IDs, die als Favoriten markiert wurden.
    *   **Laden (`loadFavorites`)**: Wird beim App-Start aufgerufen, um die Favoritenliste zu initialisieren.
    *   **Speichern (`saveFavorites`)**: Wird bei jeder Änderung der Favoritenliste (Hinzufügen/Entfernen) aufgerufen.

### 2.3 Zustandsvariablen in JavaScript

Die Anwendungslogik wird durch einige globale Variablen gesteuert:

*   `jsonData`: Das JavaScript-Objekt, das die gesamte hierarchische Struktur der Ordner und Prompts im Speicher hält. Es ist die "Single Source of Truth" während der Laufzeit.
*   `currentNode`: Ein Verweis auf den Knoten in `jsonData`, der aktuell in der Hauptansicht angezeigt wird (z.B. der "Home"-Ordner oder ein Unterordner).
*   `pathStack`: Ein Array, das den Navigationspfad vom Root-Knoten zum `currentNode` speichert. Es fungiert als Verlaufsstapel und ist die Basis für die "Zurück"-Navigation und die Breadcrumb-Anzeige.
*   `favoritePrompts`: Das Array der Favoriten-IDs im Speicher.

---

## 3. UI-Komponenten & Rendering

### 3.1 Hauptansicht (Karten-Container)

*   **Funktion:** `renderView(node)`
*   **Logik:**
    1.  Leert den `#cards-container`.
    2.  Nimmt einen `node` (den anzuzeigenden Ordner) aus `jsonData` entgegen.
    3.  Iteriert durch die `items` des Knotens (maximal 36, um die Performance zu gewährleisten).
    4.  Für jeden Eintrag wird dynamisch ein `<div>` mit der Klasse `.card` erstellt.
    5.  **Ordner (`.folder-card`)**: Erhält ein SVG-Icon, dessen Pfade mit der `Vivus.js`-Bibliothek bei Hover animiert werden.
    6.  **Prompts (`.prompt-card`)**: Erhält Buttons zum Erweitern (Modal öffnen) und Kopieren.
    7.  **Organisationsmodus**: Im Edit-Mode werden zusätzlich Lösch- und Umbenennen-Buttons an den Karten angebracht.
    8.  **Entry-Animation**: Die erstellten Karten sind initial unsichtbar (`opacity: 0`). Über `requestAnimationFrame` wird die Klasse `.is-visible` hinzugefügt, was eine flüssige Fade-In- und Slide-Up-Animation auslöst.
*   **Layout (`style.css`)**:
    *   Verwendet ein CSS Grid mit `repeat(auto-fit, minmax(120px, 1fr))`, um ein responsives Spaltenlayout zu erzeugen.
    *   Eine `max-width` auf dem Container stellt sicher, dass **maximal 6 Spalten** angezeigt werden.
    *   `clamp()`-Werte und mobile Breakpoints stellen sicher, dass auf schmalen Geräten mindestens drei Karten pro Zeile sichtbar bleiben.

### 3.2 Favoriten-Dock

*   **Funktion:** `renderFavoritesDock()`
*   **HTML-Struktur (`index.html`)**:
    *   Ein `aside` mit der ID `#favorites-dock` spannt das Dashboard am unteren Viewportrand auf.
    *   `div.favorites-shell` kapselt das eigentliche Panel, den Tab-Button `#favorites-expand-toggle` und die Scroll-Zone `#favorites-scroll-area`.
    *   Die ungeordnete Liste `#favorites-list` enthält pro Favorit einen Button `.favorite-chip`, der überall auf der Kachel die Kopieraktion auslöst.
*   **Logik:**
    1.  Leert die Liste und ordnet die gespeicherten Favoriten-IDs den echten Prompt-Knoten zu.
    2.  Entfernt ungültige IDs unmittelbar aus `favoritePrompts`, speichert das Ergebnis und aktualisiert `localStorage`.
    3.  Baut für jeden Knoten ein `<li>` mit einer farblich akzentuierten `.favorite-chip`, setzt Vorschautext, Initial-Badge sowie einen Sequenzindex für gestaffelte Animationen.
    4.  Verknüpft jede Kachel mit `copyToClipboard(...)`, aktualisiert die dynamischen `aria-label`-Texte und toggelt den Body-Status (`.favorites-dock-visible`).
    5.  Über `setFavoritesExpanded()` und `refreshFavoritesLayout()` steuert die Logik, ob der Tab-Button sichtbar ist, ob der Bereich in den mehrreihigen Modus expandiert und welche Layout-Stufe (Vorschau, kompakt oder nur Titel) jede Kachel verwendet.
*   **Layout & Design (`style.css`)**:
    *   **`.favorites-dock`**: Vollbreites Glas-Panel am unteren Viewportrand mit Safe-Area-Puffer, Fade-Edges und weicher Einblendung.
    *   **`.favorites-shell` & `.favorites-toggle`**: Der Tab-Button sitzt wie ein Fähnchen auf dem Panel, zeigt den Expand-Status animiert an und respektiert Fokus-States für Tastaturbedienung.
    *   **`.favorites-scroll-area`**: Im kompakten Zustand horizontal scrollbar (auch per Mausrad), blendet dezente Kanten-Schatten ein und schaltet im expandierten Modus auf mehrreihiges Grid mit vertikalem Scrollen.
    *   **`.favorite-chip`**: Flex-Layout mit Badge, Titel und optionaler Vorschau; `ResizeObserver`-gestützt werden die Layout-Stufen `full`, `compact` und `title` gesetzt, sodass Titel immer vollständig sichtbar bleiben und die Vorschau je nach Platz variiert.

### 3.3 Modals

Die Anwendung nutzt mehrere Modals für verschiedene Zwecke, die alle dieselbe Grundlogik teilen:

*   **Funktionen:** `openModal(element)`, `closeModal(elementOrOptions)`
*   **Logik:**
    *   Das Öffnen fügt eine `.visible`-Klasse hinzu, die eine CSS-Transition für das Einblenden des Backdrops und das Hineinskalieren des Inhalts auslöst.
    *   Das Schließen entfernt diese Klasse und fügt nach der Transition eine `.hidden`-Klasse hinzu (`display: none`).
    *   Die Modals verwalten den Fokus und integrieren sich in die Browser-History auf Mobilgeräten.
*   **Typen:**
    *   **Prompt-Modal (`#prompt-modal`)**: Zeigt den vollständigen Text eines Prompts an. Bietet Funktionen zum Bearbeiten, Speichern, Favorisieren und Kopieren.
    *   **Ordner-Erstellen-Modal (`#create-folder-modal`)**: Ein einfaches Formular zum Erstellen eines neuen Ordners.
    *   **Verschieben-Modal (`#move-item-modal`)**: Zeigt eine Baumansicht aller Ordner an, um ein Element gezielt zu verschieben.

---

## 4. Interaktionen & Animationen

### 4.1 Navigation

*   **Vorwärts**: Ein Klick auf eine Ordner-Karte ruft `navigateToNode(node)` auf. Der aktuelle Knoten wird auf den `pathStack` geschoben, der neue Knoten wird zu `currentNode` und `renderView` wird aufgerufen.
*   **Rückwärts**: Der "Zurück"-Button ruft `navigateOneLevelUp()` auf. Der letzte Knoten wird vom `pathStack` entfernt, wird zum neuen `currentNode` und `renderView` wird aufgerufen.
*   **Swipe-to-Go-Back (Mobil)**: Auf Mobilgeräten wird eine Wischgeste von links nach rechts erfasst (`handleTouchStart`, `handleTouchMove`, `handleTouchEnd`), die bei ausreichender Distanz `window.history.back()` auslöst, was wiederum die `handlePopState`-Logik triggert.
*   **View Transitions API**: Alle Navigationen werden in `performViewTransition` gekapselt. Diese moderne Browser-API sorgt für flüssige Übergangsanimationen (Slide-Effekte) zwischen den Ansichten, mit einem Fallback für ältere Browser.

### 4.2 Drag-and-Drop (Organisationsmodus)

*   **Aktivierung**: Der "Organisieren"-Button schaltet die Klasse `.edit-mode` auf dem `.cards-container` um.
*   **Bibliothek**: `Sortable.js` wird instanziiert, um das Umsortieren von Karten per Drag-and-Drop zu ermöglichen.
*   **Logik:**
    *   **Umsortieren**: Der `onEnd`-Callback von `Sortable.js` aktualisiert die Reihenfolge der Elemente im `jsonData`-Objekt und persistiert die Änderungen.
    *   **Verschieben in Ordner**: Benutzerdefinierte `drag...`-Handler (`handleDragEnter`, `handleDrop` etc.) erkennen, wenn eine Karte über einer Ordner-Karte losgelassen wird. Dies löst die `moveNode`-Funktion aus.
    *   **Spring-Loading**: Wenn eine Karte für 800ms über einem Ordner gehalten wird, navigiert die Ansicht automatisch in diesen Ordner hinein.
    *   **Zusammenfassen**: Wenn eine Karte über einer anderen Prompt-Karte losgelassen wird, erscheint eine Bestätigungsabfrage, um beide in einem neuen Ordner zusammenzufassen (`combineIntoNewFolder`).

### 4.3 Visuelle Effekte & Animationen

*   **Aurora-Hintergrund**: Drei große, unscharfe `div`-Elemente mit `mix-blend-mode: plus-lighter` werden per CSS-Keyframe-Animation langsam bewegt, um einen dynamischen, leuchtenden Hintergrund zu erzeugen.
*   **Parallax-Effekt**: Beim Scrollen der Karten wird der Aurora-Container per `requestAnimationFrame` gedrosselt und mit einem geringeren Faktor verschoben (`transform: translateY(...)`), was einen subtilen Tiefeneffekt erzeugt.
*   **Glassmorphism**: Alle UI-Elemente wie die Top-Bar, Karten und Modals nutzen `backdrop-filter: blur(...)` und eine semi-transparente Hintergrundfarbe, um den "Milchglas"-Effekt zu erzielen.
*   **Copy-Feedback**: Beim Kopieren eines Prompts wird eine `.copy-success`-Klasse hinzugefügt, die eine CSS-Animation mit `filter: drop-shadow(...)` auslöst und für einen organischen Glow sorgt. Favoriten-Kacheln nutzen denselben Mechanismus, ergänzen ihn aber um eine kurzzeitige Farbumkehr sowie ein temporär angepasstes `aria-label` („Kopiert …“).

---

## 5. Responsivität & Barrierefreiheit

### 5.1 Responsives Design

Die Anwendung ist für drei Haupt-Viewport-Größen optimiert:

*   **Desktop (> 1024px)**: Mehrspaltiges Layout (bis zu 6 Spalten). Die Favoriten erscheinen als schwebende vertikale Docking-Leiste am rechten unteren Bildschirmrand und bleiben jederzeit im Blickfeld.
*   **Tablet (768px - 1024px)**: Reduzierte Spaltenanzahl, leicht verkürzte Dock-Breite und identische Ein-Tipp-Bedienung.
*   **Mobil (< 768px)**:
    *   Minimal 3 Spalten für eine dichte Darstellung.
    *   Das Favoriten-Dock spannt sich nahezu über die gesamte Breite, wechselt in einen horizontal scrollbaren Slider und berücksichtigt Safe-Area-Insets automatisch.
    *   Touch-spezifische Interaktionen wie Swipe-to-Go-Back sowie Vibrationsfeedback beim Kopieren bleiben aktiv.

### 5.2 Barrierefreiheit (A11y)

*   **Semantisches HTML**: Wo immer möglich, werden native HTML-Elemente wie `<button>` und `<nav>` verwendet.
*   **ARIA-Attribute**:
    *   Buttons (einschließlich der Favoriten-Kacheln) besitzen sprechende `aria-label`-Texte, die nach dem Kopieren kurzzeitig angepasst werden.
    *   Das Favoriten-Dock selbst ist als `role="region"` mit benanntem `aria-label` ausgezeichnet.
    *   Der Zustand des Favoriten-Buttons im Modal wird dynamisch aktualisiert (`Zu Favoriten hinzufügen` / `Von Favoriten entfernen`).
*   **Tastatur-Navigation**: Die Anwendung ist grundsätzlich per Tab-Taste navigierbar. Die `Escape`-Taste schließt kontextsensitiv zuerst das Kontextmenü, anschließend ein geöffnetes Modal.
*   **Fokus-Management**: Modals fangen den Fokus ein, und beim Öffnen wird der Fokus auf das erste interaktive Element gesetzt.

---

## 6. Abhängigkeiten

Die Anwendung nutzt zwei externe JavaScript-Bibliotheken, die per CDN geladen werden:

1.  **Vivus.js**: Wird für die "Live-Drawing"-Animation der SVG-Pfade der Ordner-Icons bei Hover verwendet.
2.  **Sortable.js**: Stellt die Kernfunktionalität für das Drag-and-Drop-Umsortieren der Karten im Organisationsmodus bereit.