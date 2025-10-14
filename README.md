# Prompt-Templates Browser: Vollständige Technische Dokumentation

## 1. Projekt-Übersicht & Kernvision

Der **Prompt-Templates Browser** ist eine hochperformante, offline-fähige **Progressive Web App (PWA)**, die als Single-Page-Anwendung (SPA) konzipiert ist. Sie ermöglicht eine intuitive, hierarchische Verwaltung von Text-Vorlagen (Prompts) in einer Ordnerstruktur. Die Kernfunktionalität umfasst die schnelle Navigation, das Anzeigen und Kopieren von Prompts, eine Drag-and-Drop-Organisation und eine anpassbare Favoritenleiste.

**Technische Kernvision:** Die Anwendung wurde nach dem Prinzip der **minimalen Abhängigkeiten und maximalen Performance** entwickelt. Sie verzichtet bewusst auf JavaScript-Frameworks und Build-Prozesse und setzt auf pures ("Vanilla") JavaScript, HTML und CSS. Alle Animationen sind GPU-beschleunigt, das Event-Handling ist optimiert und die Persistenz wird latenzfrei über `localStorage` realisiert, um ein natives App-Gefühl zu erzeugen.

**Technische Highlights:**

* **Framework-frei:** 100 % Vanilla JavaScript für maximale Kontrolle und Performance.
* **Offline-Fähigkeit:** Alle Prompts und Favoriten werden im `localStorage` persistiert. Die Anwendung ist nach dem ersten Laden vollständig offline funktionsfähig.
* **Performance-Optimiert:**
    * **Rendering:** Rendert maximal 36 Karten pro Ansicht, um den DOM schlank zu halten.
    * **Animationen:** Nutzt ausschließlich die CSS-Eigenschaften `transform`, `opacity` und `filter` für butterweiche, GPU-beschleunigte Animationen. `will-change` wird gezielt eingesetzt.
    * **Event-Handling:** Scroll-Events werden mittels `requestAnimationFrame` gedrosselt (throttled), um "Jank" (Ruckeln) zu vermeiden. Passive Event-Listener werden wo immer möglich verwendet.
* **PWA-Features:** Eine `manifest.json` ermöglicht die Installation auf Desktop- und Mobilgeräten für ein natives App-Erlebnis.
* **Design-Philosophie:** Ein modernes **"Glassmorphism"-UI** mit einem dunklen, durch Aurora-Effekte belebten Hintergrund. Transparente, schwebende Ebenen mit `backdrop-filter` und subtilen Licht- und Schatten-Effekten schaffen eine hochwertige visuelle Tiefe.
* **Typografie & Kartenlayout:** Die gesamte Oberfläche setzt konsequent auf **Roboto** (Gewichte 300–700) als Primärschrift. Adaptive Grundgrößen auf `:root` und dynamische Re-Layouts nach dem Laden der Schriftart verhindern Überlagerungen und sorgen für eine ruhige, gut lesbare Anmutung.

---

## 2. Architektur & Datenfluss

### 2.1 Dateistruktur

Die Anwendung besteht aus einem minimalen Set an Dateien im Hauptverzeichnis:

* `index.html`: Die einzige HTML-Datei, die die gesamte Struktur der Anwendung definiert.
* `style.css`: Enthält alle Stil-, Layout- und Animationsregeln.
* `script.js`: Beinhaltet die gesamte Anwendungslogik.
* `templates.json`: Die Standard-Datenquelle für die Prompts.
* `manifest.json`: Definiert das Verhalten der PWA.
* `favicon.svg`, `favicon_animated.svg`: Statische und animierte Anwendungs-Icons.
* `icons/`: Ordner mit PWA-Icons in verschiedenen Auflösungen.

### 2.2 Datenmanagement & Persistenz

Der Zustand der Anwendung wird über zwei Objekte im `localStorage` verwaltet:

1.  **`customTemplatesJson`**: Speichert die gesamte Baumstruktur der Prompts und Ordner als JSON-String.
    * **Laden (`loadJsonData`)**: Beim Start wird geprüft, ob dieser Schlüssel existiert. Wenn ja, werden die benutzerdefinierten Daten geladen. Andernfalls wird auf die `templates.json` als Fallback zurückgegriffen.
    * **Speichern (`persistJsonData`)**: Jede Änderung an der Datenstruktur (Hinzufügen, Löschen, Umbenennen, Verschieben) löst diese Funktion aus, die das globale `jsonData`-Objekt serialisiert und speichert.

2.  **`favoritePrompts`**: Speichert ein Array von Prompt-IDs, die als Favoriten markiert wurden.
    * **Laden (`loadFavorites`)**: Wird beim App-Start aufgerufen.
    * **Speichern (`saveFavorites`)**: Wird bei jeder Änderung der Favoritenliste aufgerufen.

### 2.3 Zustandsvariablen in JavaScript

* `jsonData`: Das JavaScript-Objekt, das die gesamte hierarchische Struktur im Speicher hält ("Single Source of Truth").
* `currentNode`: Ein Verweis auf den Knoten in `jsonData`, der aktuell angezeigt wird.
* `pathStack`: Ein Array, das den Navigationspfad vom Root-Knoten zum `currentNode` speichert (Basis für "Zurück"-Navigation und Breadcrumbs).
* `favoritePrompts`: Das Array der Favoriten-IDs im Speicher.

---

## 3. UI-Komponenten & Rendering

### 3.1 Hauptansicht (Karten-Container)

* **Funktion:** `renderView(node)`
* **Logik:**
    1.  Leert den `#cards-container`.
    2.  Iteriert durch die `items` des anzuzeigenden Ordner-Knotens (max. 36).
    3.  Für jeden Eintrag wird dynamisch ein `<div>` mit der Klasse `.card` erstellt.
    4.  **Ordner (`.folder-card`)**: Erhält ein SVG-Icon, dessen Pfade mit `Vivus.js` bei Hover animiert werden.
    5.  **Prompts (`.prompt-card`)**: Erhält Buttons zum Erweitern und Kopieren.
    6.  **Organisationsmodus**: Fügt zusätzlich Lösch- und Umbenennen-Buttons hinzu.
    7.  **Entry-Animation**: Die Karten werden mit `opacity: 0` erstellt und über `requestAnimationFrame` mit der Klasse `.is-visible` versehen, was eine flüssige Fade-In- und Slide-Up-Animation auslöst.
* **Layout (`style.css`):**
    * Ein CSS-Grid (`grid-template-columns: repeat(var(--card-columns), minmax(0, 1fr))`) erzwingt dynamisch zwischen drei und sechs Spalten.
    * `applyCardLayoutMetrics()` steuert die Spaltenzahl und den Abstand (`--card-gap`) in Echtzeit.
    * `adjustCardTitleFontSize()` skaliert die Schriftgröße der Titel, um Überlappungen zu vermeiden.

### 3.2 Favoriten-Dock

* **Funktion:** `renderFavoritesDock()`
* **Logik:**
    1.  Leert die Favoritenliste und rendert für jede favorisierte Prompt-ID einen `.favorite-chip`.
    2.  Ungültige IDs werden automatisch entfernt.
    3.  Jeder Chip ist ein `<button>`, der beim Klick den Inhalt in die Zwischenablage kopiert.
    4.  `refreshFavoritesLayout()` passt die Breite und das Layout der Chips dynamisch an den verfügbaren Platz an.
* **Layout & Design:**
    * **`.favorites-dock`**: Ein "Glassmorphism"-Panel am unteren Bildschirmrand, das sich bei Bedarf aus- und einklappen lässt.
    * **`.favorite-chip`**: Kompakte Kacheln mit farbigen Badges und Vorschautext, deren Darstellung sich je nach verfügbarer Breite anpasst (voll, kompakt, nur Titel).

### 3.3 Modals

* **Funktionen:** `openModal(element)`, `closeModal(elementOrOptions)`
* **Logik:**
    * Das Öffnen fügt eine `.visible`-Klasse hinzu, die eine CSS-Transition auslöst.
    * Das Schließen entfernt diese Klasse und fügt nach der Transition eine `.hidden`-Klasse hinzu.
* **Typen:**
    * **Prompt-Modal (`#prompt-modal`)**: Zeigt den vollständigen Text eines Prompts an. Bietet Funktionen zum Bearbeiten, Speichern, Favorisieren und Kopieren.
    * **Ordner-Erstellen-Modal (`#create-folder-modal`)**: Ein Formular zum Erstellen eines neuen Ordners.
    * **Verschieben-Modal (`#move-item-modal`)**: Zeigt eine Baumansicht aller Ordner an, um ein Element zu verschieben.

---

## 4. Interaktionen & Animationen

### 4.1 Navigation

* **Vorwärts**: Ein Klick auf eine Ordner-Karte ruft `MapsToNode(node)` auf.
* **Rückwärts**: Der "Zurück"-Button ruft `MapsOneLevelUp()` auf.
* **Swipe-to-Go-Back (Mobil)**: Eine Wischgeste von links nach rechts löst die "Zurück"-Navigation aus.
* **View Transitions API**: Alle Navigationen werden in `performViewTransition` gekapselt, um flüssige Übergangsanimationen zwischen den Ansichten zu erzeugen.

### 4.2 Drag-and-Drop (Organisationsmodus)

* **Aktivierung**: Der "Organisieren"-Button schaltet die Klasse `.edit-mode` auf dem `.cards-container`.
* **Bibliothek**: `Sortable.js` ermöglicht das Umsortieren von Karten.
* **Logik:**
    * **Umsortieren**: Der `onEnd`-Callback von `Sortable.js` aktualisiert die Reihenfolge im `jsonData`-Objekt.
    * **Verschieben in Ordner**: Benutzerdefinierte Handler (`handleDragEnter`, `handleDrop`) erkennen, wenn eine Karte über einem Ordner losgelassen wird.
    * **Spring-Loading**: Hält man eine Karte über einem Ordner, navigiert die Ansicht automatisch in diesen Ordner.
    * **Zusammenfassen**: Lässt man eine Karte auf einer anderen Prompt-Karte los, können beide in einem neuen Ordner zusammengefasst werden.

### 4.3 Visuelle Effekte & Animationen

* **Aurora-Hintergrund**: Drei große, unscharfe `div`-Elemente werden per CSS-Keyframe-Animation bewegt.
* **Parallax-Effekt**: Beim Scrollen wird der Aurora-Container mit einem geringeren Faktor verschoben, was einen Tiefeneffekt erzeugt.
* **Glassmorphism**: UI-Elemente nutzen `backdrop-filter: blur(...)` für den "Milchglas"-Effekt.
* **Copy-Feedback**: Beim Kopieren wird eine `.copy-success`-Klasse hinzugefügt, die eine Glow-Animation auslöst.

---

## 5. Responsivität & Barrierefreiheit

### 5.1 Responsives Design

* **Desktop (> 1024px)**: Das Raster nutzt bis zu sechs Spalten.
* **Tablet (768px - 1024px)**: Das Layout balanciert zwischen vier und fünf Spalten.
* **Mobil (< 768px)**: Das Raster zeigt drei Spalten, die Karten werden proportional verkleinert.

### 5.2 Barrierefreiheit (A11y)

* **Semantisches HTML**: Verwendung nativer HTML-Elemente wie `<button>` und `<nav>`.
* **ARIA-Attribute**: Buttons haben sprechende `aria-label`-Texte, und Zustände (z.B. Favoriten-Status) werden dynamisch aktualisiert.
* **Tastatur-Navigation**: Die Anwendung ist per Tab-Taste navigierbar. Die `Escape`-Taste schließt Modals und Menüs.
* **Fokus-Management**: Modals fangen den Fokus ein, und beim Öffnen wird der Fokus auf das erste interaktive Element gesetzt.

---

## 6. Abhängigkeiten

Die Anwendung nutzt drei externe JavaScript-Bibliotheken, die per CDN geladen werden:

1.  **Vivus.js**: Für die "Live-Drawing"-Animation der Ordner-Icons.
2.  **Sortable.js**: Für die Drag-and-Drop-Funktionalität.
3.  **GSAP 3 + Flip Plugin**: Für komplexe Animationen, insbesondere des Favoriten-Docks.