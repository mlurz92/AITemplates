# AGENTS.md für Prompt-Templates Browser

## Projektübersicht

Der **Prompt-Templates Browser** ist eine performante, offline-fähige **Progressive Web App (PWA)** und **Single-Page-Anwendung (SPA)** zur hierarchischen Verwaltung von Text-Vorlagen (Prompts). Er ermöglicht Navigation, Anzeige, Kopieren, Drag-and-Drop-Organisation und Favoritenverwaltung.

**Technische Kernvision:** Maximale Performance durch Verzicht auf Frameworks ("Vanilla" JavaScript, HTML, CSS), GPU-beschleunigte Animationen und `localStorage`-Persistenz für ein natives App-Gefühl. Das Design folgt einer **"Glassmorphism"-Ästhetik** und ist **vollständig responsiv** für mobile Endgeräte und Desktops.

## Architektur & Wichtige Dateien

Die Anwendung besteht aus wenigen Kern-Dateien im Hauptverzeichnis:

* **`index.html`**: Enthält die gesamte HTML-Struktur der SPA.
* **`style.css`**: Beinhaltet alle Stil-, Layout- (inkl. Grid-System), Animations- (CSS `transform`, `opacity`, `filter`) und Design-Regeln (**Glassmorphism**, Aurora-Effekte). Definiert auch das responsive Verhalten und Layout-Schutzmechanismen.
* **`script.js`**: Enthält die gesamte Anwendungslogik in Vanilla JavaScript. Zustandsverwaltung über globale Variablen (`jsonData`, `currentNode`, `pathStack`, `favoritePrompts`). Event-Handling ist optimiert (throttling, passive listener). Nutzt die View Transitions API für Navigation.
* **`templates.json`**: Standard-Datenquelle (Fallback), wenn keine Daten im `localStorage` gefunden werden. **Diese Datei sollte von Agenten NICHT direkt modifiziert werden.** Änderungen erfolgen zur Laufzeit und werden in `localStorage` persistiert.
* **`manifest.json`**: PWA-Konfiguration.

**Abhängigkeiten:** Die Anwendung nutzt aktuell drei externe Bibliotheken via CDN:
* Vivus.js: Für SVG-Animationen (Ordner-Icons).
* Sortable.js: Für Drag-and-Drop im Organisationsmodus.
* GSAP 3 + Flip Plugin: Für Animationen im Favoriten-Dock.
* **Hinweis für Agenten:** Es ist erlaubt, **beliebige weitere externe Plugins, Bibliotheken oder Frameworks per CDN-Link direkt in den Code einzubinden**. Die Verwendung von `integrity`-Attributen ist dabei **nicht** erforderlich.

## Datenmanagement

* **Primäre Datenquelle:** `localStorage` unter dem Schlüssel `customTemplatesJson`. Speichert die gesamte hierarchische Struktur als JSON-String.
* **Favoriten:** `localStorage` unter dem Schlüssel `favoritePrompts`. Speichert ein Array von Prompt-IDs.
* **Persistenz:** Jede Änderung an der Struktur oder den Favoriten wird sofort via `persistJsonData()` bzw. `saveFavorites()` im `localStorage` gespeichert.
* **Datenstruktur:** Die `jsonData`-Variable hält die Baumstruktur im Speicher. Jeder Knoten (Ordner/Prompt) hat `id`, `type`, `title` und optional `items` (für Ordner) oder `content` (für Prompts).

## Entwicklungsrichtlinien & Code-Stil

* **Framework-frei:** Strikt Vanilla JavaScript, HTML5, CSS3 verwenden, es sei denn, externe Bibliotheken werden gezielt per CDN eingebunden.
* **Performance:**
    * DOM-Manipulation minimieren. Das Rendering (`renderView`) erzeugt maximal 36 Karten pro Ansicht.
    * Animationen nur mit `transform`, `opacity`, `filter`. `will-change` gezielt einsetzen.
    * Scroll-Events throtteln (`requestAnimationFrame`).
* **UI/UX:**
    * **Glassmorphism-Ästhetik** beibehalten (siehe `style.css` für Variablen wie `--glass-bg`, `--blur`).
    * **Responsivität:** Sicherstellen, dass die Anwendung auf mobilen Geräten und Desktops optimal dargestellt wird und bedienbar ist.
    * **Layout-Integrität:** **Alle Beschriftungen und UI-Elemente müssen immer vollständig sichtbar sein und dürfen sich unter keinen Umständen überlappen, überschneiden oder die Grenzen ihres Containers überragen, unabhängig von der Viewport-Größe oder dem Inhalt.** Dies wird u.a. durch CSS-Variablen für Kartengrößen (`--card-min-width` etc.) und dynamische Anpassungen (z.B. Schriftgrößen via `adjustCardTitleFontSize`) sichergestellt.
    * Barrierefreiheit (A11y) durch semantisches HTML und ARIA-Attribute gewährleisten.
* **Keine Build-Schritte:** Der Code wird direkt im Browser ausgeführt, es gibt keinen Build-Prozess.

## Wichtige Funktionen für Agenten

* **`renderView(node)`**: Hauptfunktion zum Anzeigen des Inhalts eines Ordner-Knotens.
* **`MapsToNode(node)`**: Navigation zu einem Unterordner.
* **`MapsOneLevelUp()`**: Navigation eine Ebene zurück.
* **`openPromptModal(node)` / `closeModal()`**: Anzeige und Schließen des Prompt-Detail-Modals.
* **`persistJsonData()`**: Speichert Änderungen im `localStorage`.
* **`findNodeById(startNode, targetId)`**: Sucht einen Knoten anhand seiner ID in der `jsonData`-Struktur.
* **`toggleOrganizeMode()`**: Aktiviert/Deaktiviert den Drag-and-Drop-Modus.
* **`renderFavoritesDock()`**: Aktualisiert die Favoritenleiste.

## Aufgaben für KI-Agenten

* **Refactoring:** Code-Struktur verbessern unter Beibehaltung der Vanilla-JS-Architektur und Performance-Prinzipien.
* **Neue Features hinzufügen:** Implementierung neuer Funktionen unter Beachtung der bestehenden Architektur, UI/UX-Richtlinien und Layout-Integrität (z.B. Suchfunktion, Import/Export von JSON).
* **Bug Fixing:** Fehler identifizieren und beheben, insbesondere solche, die Layout-Probleme verursachen könnten.
* **UI/UX-Verbesserungen:** Anpassungen am Layout oder an Interaktionen vornehmen, um die Benutzerfreundlichkeit und die visuelle Konsistenz über alle Viewport-Größen hinweg zu erhöhen.

**Wichtig:** Änderungen an der Datenstruktur (`jsonData`) müssen immer `persistJsonData()` aufrufen, um sie persistent zu machen. Änderungen an Favoriten müssen `saveFavorites()` aufrufen. Bei UI-Änderungen stets die Responsivität und Layout-Integrität auf verschiedenen Bildschirmgrößen überprüfen.
