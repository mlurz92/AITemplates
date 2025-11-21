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
*   **Layout-Schutz für Karten:** CSS-Variablen definieren verbindliche Mindest- und Maximalbreiten sowie -höhen für Prompt- und Ordnerkarten. Das neue Auto-Fit-Grid verteilt die Spalten entsprechend, sodass Beschriftungen nie abgeschnitten oder von anderen UI-Elementen überlagert werden.
*   **Adaptives Favoriten-Dashboard:** Eine ultra-kompakte Glasleiste nutzt GSAP-Flip-Animationen, dynamische Typografie-Skalierung und auto-hiding Scrollleisten. Breiten- und Höhenmetriken werden per CSS-Variablen und JavaScript so synchronisiert, dass mehr Favoriten-Chips pro Viewport-Breite ohne Überlagerungen sichtbar bleiben und sich das Tab-Fähnchen bündig an der rechten oberen Ecke anlegt.

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
*   `widget.html`, `widget.css`, `widget.js`: Schlanke Widget-Oberfläche für Windows 11 (Edge/WebView2), die nur den Schnellzugriff auf Favoriten und Root-Prompts darstellt.

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
    *   Ein Auto-Fit-Grid (`repeat(auto-fit, minmax(var(--card-min-width), 1fr))`) hält die Kartenbreiten strikt innerhalb der durch `--card-min-width` und `--card-max-width` definierten Grenzen. So behalten Prompt- und Ordnerkarten ihre ursprünglichen Layoutbeschränkungen, ohne den Nachbarn in die Quere zu kommen.
    *   Die Variablen `--card-min-width`, `--card-max-width` und `--card-min-height` passen sich stufenlos in Breakpoints an, wodurch die historischen Maße auch bei sehr schmalen Viewports erhalten bleiben.
    *   `adjustCardTitleFontSize()` misst Breite und Zeilenhöhe pro Karte und skaliert die Typografie selektiv, bis Überschriften, Buttons und der Glasrahmen perfekt zusammenspielen.

### 3.2 Favoriten-Dock

*   **Funktion:** `renderFavoritesDock()`
*   **HTML-Struktur (`index.html`)**:
    *   Ein `aside` mit der ID `#favorites-dock` spannt das Dashboard am unteren Viewportrand auf.
    *   `div.favorites-shell` bündelt das Glas-Panel und das dezente Tab-Fähnchen (`#favorites-expand-toggle`).
    *   Innerhalb des Panels rahmt `div.favorites-dock-inner` den Inhalt ein; `div.favorites-scroll-frame` beherbergt die Scroll-Zone `div#favorites-scroll-area`, die wiederum die ungeordnete Liste `#favorites-list` enthält.
    *   Jede `.favorite-chip` ist ein `<button>`, dessen kompletter Kachelbereich die Kopieraktion auslöst.
*   **Logik:**
    1.  Leert die Liste und ordnet die gespeicherten Favoriten-IDs den echten Prompt-Knoten zu.
    2.  Entfernt ungültige IDs unmittelbar aus `favoritePrompts`, speichert das Ergebnis und aktualisiert `localStorage`.
    3.  Baut für jeden Knoten ein `<li>` mit einer farblich akzentuierten `.favorite-chip`, setzt Vorschautext, Initial-Badge sowie einen Sequenzindex für gestaffelte Animationen.
    4.  Verknüpft jede Kachel mit `copyToClipboard(...)`, aktualisiert die dynamischen `aria-label`-Texte und toggelt den Body-Status (`.favorites-dock-visible`).
    5.  `refreshFavoritesLayout()` verteilt die verfügbare Breite proportional, skaliert Typografie und Vorschautext per `ResizeObserver` und synchronisiert gleichzeitig `--favorites-footprint`, damit der Karten-Grid nie überlappt.
    6.  Wheel-Scrolling und eine vertikale Swipe-Geste (mobil) toggeln den Expand-Status; horizontale Scrollleisten blenden automatisch ein und wieder aus.
*   **Layout & Design (`style.css`)**:
    *   **`.favorites-dock`**: Vollbreites Glas-Panel mit Safe-Area-Offsets, auto-hiding Scrollleisten, fein justierten Innenabständen und einem messbaren Fußabdruck (`--favorites-footprint`), damit das Kartenraster niemals überlappt.
    *   **`.favorites-toggle`**: Ein dezentes, bündig abschließendes Tab-Fähnchen in Glasoptik, das ohne Spalt an der rechten oberen Ecke sitzt, per Hover/Focus subtil glüht und bei Bedarf eine animierte Pfeilspitze zeigt.
    *   **`.favorites-scroll-frame`**: Semi-transparente Glasleisten, weich ein- und ausblendende Randindikatoren und eine automatisch versteckte Scrollbar, die sowohl Wheel- als auch Touch-Scrolling sofort sichtbar quittiert.
    *   **`.favorite-chip`**: Einheitliche Breite/Höhe via CSS-Variablen, feinere Abstände, farbige Badges sowie automatische Schrift- und Inhaltsskalierung in allen Layout-Stufen (Vorschau, Kompakt, Titel-only), sodass deutlich mehr Chips nebeneinander passen, ohne Inhalte zu überdecken.

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

*   **Desktop (> 1024px)**: Das Auto-Fit-Grid spannt bis zu sechs Spalten, hält dank `--card-min-width`/`--card-max-width` aber konsequent die klassischen Kartenabmessungen ein. Das Favoriten-Dashboard sitzt glasbündig am unteren Rand, nutzt auto-hiding Scrollleisten und Flip-Animationen, um zusätzliche Reihen weich einzublenden.
*   **Tablet (768px - 1024px)**: Die Grid-Variablen verschieben sich auf kompaktere Werte, sodass sich die Kartenbreite visuell treu bleibt, während die Favoriten-Chips enger zusammenrücken und der Tab-Trigger weiterhin bündig bleibt.
*   **Mobil (< 768px)**:
    *   Mindestens drei Karten pro Zeile im Content-Bereich, ohne dass Beschriftungen abgeschnitten werden.
    *   Die Favoriten-Chips skalieren automatisch in Breite und Typografie, blenden bei Platzmangel Vorschauzeilen aus und bleiben über Wheel- oder Touch-Gesten mitsamt sanft einblendender Scrollspur bedienbar.
    *   Eine vertikale Swipe-Geste direkt auf dem Dashboard expandiert bzw. kollabiert das Panel ohne den Tab-Button zu treffen; Swipe-to-Go-Back und haptisches Copy-Feedback bleiben aktiv.

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

Die Anwendung nutzt drei externe JavaScript-Bibliotheken, die per CDN geladen werden:

1.  **Vivus.js**: Wird für die "Live-Drawing"-Animation der SVG-Pfade der Ordner-Icons bei Hover verwendet.
2.  **Sortable.js**: Stellt die Kernfunktionalität für das Drag-and-Drop-Umsortieren der Karten im Organisationsmodus bereit.
3.  **GSAP 3 + Flip Plugin**: Animiert das Favoriten-Dashboard (Expand/Collapse, Reflow der Chips) und sorgt für butterweiche Höhen-Transitionen.

---

## 7. Windows 11 Widget

Die Dateien `widget.html`, `widget.css` und `widget.js` liefern eine auf Widgets optimierte, kompakte Ansicht mit:

*   **Favoriten-Schnellzugriff:** Alle gespeicherten Favoriten aus `localStorage` werden als kopierbare Pills geladen.
*   **Root-Prompt-Kacheln:** Bis zu sechs Prompts der Root-Ebene mit Copy- und "In App öffnen"-Link (`index.html#<id>`).
*   **Suche & Status:** Ein Suchfeld filtert beide Listen live; der Status-Chip zeigt Lade- und Kopierfeedback an.

### 7.1 Integration unter Windows 11 (Edge/WebView2)

1.  **Lokalen Server starten:** In diesem Ordner `python -m http.server 4173` ausführen, damit `templates.json` via HTTP geladen werden kann.
2.  **Widget-Ansicht öffnen:** In Microsoft Edge `http://localhost:4173/widget.html` aufrufen.
3.  **Als App installieren:** Über das Edge-Menü `...` → **Apps** → **Diese Seite als App installieren** wählen. Edge erstellt ein rahmenloses Fenster (ideal für das Widgets-Panel oder die Seitenleiste).
4.  **Desktop-Widget nutzen:** Die installierte App mit `Win` + `Z` (Snap Layouts) kompakt andocken oder per PowerToys "Always on Top" (Win + Strg + T) als schwebendes Widget fixieren. Optional kann die App in Edge unter **Apps** → **Start beim Anmelden** aktiviert werden.
5.  **Aktualisieren:** Der Refresh-Button im Widget lädt `localStorage`/`templates.json` neu; Favoriten bleiben mit der Haupt-App (`index.html`) synchron.

> Hinweis: Die Widget-Ansicht bleibt strikt Vanilla JS/CSS und setzt keine zusätzlichen Frameworks voraus. Alle Aktionen greifen direkt auf die bestehenden Persistenz-Keys `customTemplatesJson` und `favoritePrompts` zu.
