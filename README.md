# Anwendungsbeschreibung: Prompt-Templates Browser

## 1. Vision & Architektur: Ein performantes Offline-First Erlebnis

Der **Prompt-Templates Browser** ist eine als **Progressive Web App (PWA)** konzipierte Single-Page-Anwendung, die eine nahtlose, hochperformante und offline-fähige Erfahrung zur Verwaltung von Textvorlagen bietet. Die Architektur ist darauf ausgelegt, maximale Interaktivität bei minimaler Latenz zu gewährleisten, indem sie auf reine, optimierte Vanilla-JavaScript-Logik ohne den Overhead von Frameworks setzt.

### 1.1. Dateistruktur & Technologien

Die Anwendung besteht aus einem präzisen Satz von Kern-Assets, die jeweils eine klar definierte Rolle spielen:

* **`index.html`**: Das einzige HTML-Dokument. Es dient als semantisches Grundgerüst und App-Shell, enthält alle Container für dynamische Inhalte und vordefinierte SVG-Templates zur performanten Klonung.
* **`style.css`**: Eine einzelne, umfassende CSS-Datei, die das gesamte visuelle Design, das responsive Layout, alle Animationen und das "Glassmorphism"-Thema definiert.
* **`script.js`**: Das Gehirn der Anwendung. Dieses Skript verwaltet den Zustand, rendert dynamisch alle Ansichten, verarbeitet sämtliche Benutzerinteraktionen und implementiert die Persistenzlogik.
* **`templates.json`**: Die initiale Datenquelle, die die hierarchische Struktur der Prompts und Ordner als JSON-Objekt definiert.
* **`manifest.json`**: Definiert das PWA-Verhalten (App-Name, Icons, Theme-Farbe, Start-URL) und ermöglicht die "Zum Startbildschirm hinzufügen"-Funktionalität für ein natives App-Gefühl.
* **`favicon_animated.svg`**: Ein animiertes SVG-Favicon, das bereits im Browser-Tab einen dynamischen und hochwertigen ersten Eindruck vermittelt.
* **Externe Bibliotheken:**
    * `Vivus.js`: Wird für die elegante "Zeichnen"-Animation der Ordner-Icons bei Hover/Touch verwendet.
    * `Sortable.js`: Stellt die robuste und intuitive Drag-and-Drop-Funktionalität für das Umordnen und Verwalten von Karten bereit.

### 1.2. Zustandsverwaltung (State Management)

Der Anwendungszustand wird clientseitig über den `localStorage` des Browsers verwaltet, was eine sofortige Persistenz ohne Server-Kommunikation ermöglicht.

* **`customTemplatesJson`**: Speichert die gesamte, vom Benutzer modifizierte Baumstruktur der Prompts und Ordner als JSON-String. Dies ist der "Single Source of Truth" nach der initialen Ladung.
* **`favoritePrompts`**: Speichert eine separate, flache Liste von Prompt-IDs, die als Favoriten markiert wurden. Dies entkoppelt die Favoriten-Logik von der Hauptdatenstruktur und ermöglicht einen schnellen Zugriff.

### 1.3. Rendering & Performance

* **Dynamisches Rendering:** Alle Karten und Modal-Inhalte werden zur Laufzeit per JavaScript erstellt und in das DOM eingefügt. Dies hält die initiale `index.html` schlank und das Laden extrem schnell.
* **GPU-Beschleunigung:** Jede Animation und jeder Übergang in der Anwendung ist akribisch darauf optimiert, von der GPU berechnet zu werden. Dies wird durch die ausschließliche Animation der CSS-Eigenschaften `transform`, `opacity` und `filter` erreicht.
* **Effiziente Event-Handhabung:** Komplexe Interaktionen wie das Parallax-Scrolling werden durch `requestAnimationFrame` gedrosselt, um sicherzustellen, dass DOM-Manipulationen nur einmal pro Frame stattfinden und das UI niemals blockiert wird.

## 2. Visuelles Design & Ästhetik: "Layered Glassmorphism"

Das Design basiert auf einer mehrschichtigen "Glassmorphism"-Ästhetik, die eine visuelle Hierarchie und Tiefe erzeugt.

1.  **Ebene 1: Dynamischer Aurora-Hintergrund (`.aurora-container`)**
    * Drei große, farbige Formen bewegen und skalieren sich langsam und organisch über lange, asynchrone CSS-Animationen.
    * `mix-blend-mode: plus-lighter` sorgt für leuchtende, additive Farbüberschneidungen.
    * `filter: blur(100px)` erzeugt die weichen, diffusen Kanten.
    * **Parallax-Effekt:** Dieser gesamte Container ist `position: fixed` und wird per JavaScript (`transform: translateY()`) mit reduzierter Geschwindigkeit bewegt, wenn der Benutzer den Hauptinhalt scrollt, was eine beeindruckende Tiefenillusion erzeugt.

2.  **Ebene 2: Globale Rauschtextur (`body::before`)**
    * Eine subtile, animierte SVG-Rauschtextur liegt über dem Aurora-Hintergrund und verleiht allen Oberflächen eine taktile, filmische Qualität.

3.  **Ebene 3: UI-Ebene (Karten, Bars, Modals)**
    * Alle UI-Elemente schweben über dem Hintergrund. Ihr `backdrop-filter: blur(20px)` lässt den Aurora-Hintergrund durchscheinen und erzeugt den charakteristischen "Milchglas"-Effekt.
    * Ein feiner, gradientenbasierter Rand (`--glass-border-gradient`) und eine subtile Highlight-Schattierung (`--glass-highlight`) heben die Elemente vom Hintergrund ab und definieren ihre Form.

### 2.1. Mikro-Interaktionen & Animationen

* **Karten-Hover:** Eine sanfte `transform`-Animation hebt die Karte an (`translateY`) und vergrößert sie leicht (`scale`), was eine direkte physische Reaktion auf die Interaktion des Benutzers suggeriert.
* **Ordner-Icon-Animation:** Bei Hover/Touch wird das SVG-Icon durch `Vivus.js` elegant "gezeichnet".
* **"Jiggle"-Modus:** Im "Organisieren"-Modus zittern alle Karten durch eine subtile CSS-`transform: rotate()`-Animation, was ihren veränderbaren Zustand visuell kommuniziert.
* **Kopier-Feedback:** Beim Kopieren eines Prompts pulsiert das Kopier-Icon kurz auf (`transform: scale(1.2)`) und leuchtet in der Akzentfarbe, was eine sofortige, befriedigende Bestätigung der Aktion darstellt.
* **Modal-Transition:** Das Öffnen und Schließen von Modals wird durch eine kombinierte `opacity`- und `scale`-Animation begleitet, die ein sanftes "Hereinzoomen" und "Herauszoomen" bewirkt.

## 3. Layout & Responsivität: Absolute Stabilität

Das Layout ist so konzipiert, dass es auf jeder Bildschirmgröße – vom schmalsten Smartphone bis zum Breitbildmonitor – eine perfekte, harmonische und niemals fehlerhafte Darstellung bietet.

* **Intelligentes Grid:** Das `auto-fit`-Grid mit `minmax(120px, 1fr)` ist der Kern des Systems. Es erzeugt automatisch die optimale Anzahl von Spalten, stellt aber sicher, dass keine Karte jemals schmaler als `120px` wird.
* **Strikte Spaltenbegrenzung:** Eine präzise berechnete `max-width` auf dem `.cards-container` stellt sicher, dass **niemals mehr als sechs Spalten** angezeigt werden, selbst auf sehr breiten Bildschirmen.
* **Größenkontrolle:** Eine `max-width` auf den Karten verhindert, dass diese unnatürlich groß werden. Das Layout behält stets seine Proportionen.
* **Typografische Integrität:**
    * **Dynamische Skalierung:** JavaScript (`adjustCardTitleFontSize`) stellt sicher, dass Kartentitel niemals überlaufen, indem die Schriftgröße intelligent reduziert wird.
    * **Korrekte Silbentrennung:** Die CSS-Eigenschaft `hyphens: auto` sorgt für professionelle, sprachlich korrekte Wortumbrüche, was die Lesbarkeit und Ästhetik maximiert.
* **Interne Karten-Layouts:**
    * **Ordner:** Die Verwendung von `justify-content: space-between` garantiert, dass der Titel (oben) und das Icon (unten) immer den maximal möglichen Abstand haben.
    * **Prompts:** `justify-content: space-between` stellt sicher, dass der Titel, der Inhaltsbereich und die Aktions-Buttons den vertikalen Raum der Karte immer optimal ausnutzen.

## 4. Komponenten & Funktionalität im Detail

### 4.1. Navigations-Elemente

* **Top-Bar:** Ein `position: fixed` "Glas"-Element, das permanenten Zugriff auf Navigation und Kernaktionen bietet.
* **Breadcrumbs:** Zeigen den hierarchischen Pfad an und ermöglichen eine schnelle Rückkehr zu übergeordneten Ebenen.
* **Fixed Back Button:** Ein schwebender Button, der auf allen Unterseiten erscheint und eine schnelle Rückkehr zur Startseite mit einem einzigen Klick ermöglicht.

### 4.2. Interaktive Elemente

* **Karten:** Die primären Interaktionselemente, die entweder zu Unterordnern führen oder das Prompt-Modal öffnen.
* **Prompt-Modal:** Der zentrale Ort für die Interaktion mit einem Prompt, der Lese-, Kopier- und Bearbeitungsfunktionen in einer einzigen, fokussierten Ansicht bündelt.
* **Favoritenleiste:** Ein `position: fixed` "Glas"-Element am unteren Rand, das als Schnellzugriffs-Dock für die wichtigsten Prompts dient. Sie ist horizontal scrollbar und nur bei Bedarf sichtbar.
* **Kontextmenü:**
    * **Robustheit:** Die Event-Handhabung ist so konzipiert, dass ein unbeabsichtigtes sofortiges Schließen verhindert wird.
    * **Intelligenz:** Das Menü erkennt seine Position relativ zum Viewport und klappt sich automatisch in die entgegengesetzte Richtung auf.
    * **Kontextsensitivität:** Der Inhalt des Menüs ändert sich je nach angeklicktem Element (Ordner, Prompt, Favorit).

## 5. Barrierefreiheit (Accessibility)

Die Anwendung ist mit grundlegenden Barrierefreiheitsmerkmalen ausgestattet:

* **ARIA-Labels:** Alle ikon-basierten Buttons sind mit `aria-label`-Attributen versehen, um ihre Funktion für Screenreader verständlich zu machen.
* **Fokus-Management:** Die Anwendung nutzt `:focus-visible`, um nur bei Tastaturnavigation einen klaren Fokus-Indikator anzuzeigen.
* **Semantik:** Es werden semantische HTML-Elemente (`<main>`, `<header>`, `<nav>`) verwendet, um die Struktur der Seite für assistierende Technologien verständlich zu machen.

## 6. Datenmanagement & Persistenz

* **Download/Reset:** Der Benutzer hat die volle Kontrolle über seine personalisierten Daten. Er kann jederzeit eine `templates_modified.json`-Datei herunterladen oder alle lokalen Modifikationen zurücksetzen.
* **Graceful Degradation:** Sollte die initiale `templates.json`-Datei nicht geladen werden können, zeigt die Anwendung eine klare Fehlermeldung an.