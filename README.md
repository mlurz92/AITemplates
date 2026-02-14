# Prompt-Templates Browser

Eine performante, offline-fähige **Progressive Web App (PWA)** und **Single-Page-Anwendung (SPA)** zur hierarchischen Verwaltung von Text-Vorlagen (Prompts) mit Glassmorphism-Design und GPU-beschleunigten Animationen.

---

## Inhaltsverzeichnis

- [Projektübersicht](#projektübersicht)
- [Installation und Setup](#installation-und-setup)
- [PWA-Features](#pwa-features)
- [Benutzeroberfläche](#benutzeroberfläche)
  - [Top-Bar (Header)](#top-bar-header)
  - [Karten-Ansicht](#karten-ansicht)
  - [Modal-Dialoge](#modal-dialoge)
  - [Favoriten-Dock](#favoriten-dock)
- [Benutzerinteraktionen](#benutzerinteraktionen)
  - [Navigation](#navigation)
  - [Prompts kopieren](#prompts-kopieren)
  - [Favoriten verwalten](#favoriten-verwalten)
  - [Organisationsmodus](#organisationsmodus)
  - [Elemente erstellen, bearbeiten und löschen](#elemente-erstellen-bearbeiten-und-löschen)
- [Design-System](#design-system)
  - [Glassmorphism-Ästhetik](#glassmorphism-ästhetik)
  - [Aurora-Hintergrundeffekte](#aurora-hintergrundeffekte)
  - [Farbpalette](#farbpalette)
  - [Animationen und Effekte](#animationen-und-effekte)
- [Datenstruktur und Persistenz](#datenstruktur-und-persistenz)
- [Technische Architektur](#technische-architektur)
- [Performance-Optimierungen](#performance-optimierungen)
- [Responsives Verhalten](#responsives-verhalten)
- [Barrierefreiheit](#barrierefreiheit)
- [Browser-Kompatibilität](#browser-kompatibilität)
- [Tastaturkürzel](#tastaturkürzel)
- [Touch-Gesten (Mobile)](#touch-gesten-mobile)
- [Externe Abhängigkeiten](#externe-abhängigkeiten)

---

## Projektübersicht

Der **Prompt-Templates Browser** ermöglicht die hierarchische Organisation von Text-Vorlagen in einer baumartigen Struktur aus Ordnern und Prompts. Die Anwendung zeichnet sich durch folgende Kernmerkmale aus:

- **Framework-frei**: Implementiert in reinem Vanilla JavaScript, HTML5 und CSS3
- **Offline-fähig**: Vollständige Funktionalität ohne Internetverbindung nach erstmaligem Laden
- **Installierbar**: Als PWA auf Desktop und Mobilgeräten installierbar
- **Performance-optimiert**: GPU-beschleunigte Animationen, minimierte DOM-Manipulation
- **Responsives Design**: Optimale Darstellung auf allen Bildschirmgrößen
- **Glassmorphism-Design**: Modernes, transluzentes UI mit Aurora-Hintergrundeffekten

---

## Installation und Setup

### Lokale Ausführung

1. **Repository klonen oder Dateien herunterladen**

2. **Lokalen Webserver starten**
   
   Die Anwendung kann direkt über einen lokalen Webserver gestartet werden:
   
   ```bash
   # Mit Python 3
   python -m http.server 8000
   
   # Mit Node.js (npx)
   npx serve
   
   # Mit PHP
   php -S localhost:8000
   ```

3. **Im Browser öffnen**
   
   Navigate zu `http://localhost:8000`

### Hosting

Die Anwendung besteht aus statischen Dateien und kann auf jedem Webserver gehostet werden:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Beliebiger statischer Webserver

---

## PWA-Features

### Installation

Die Anwendung kann als Progressive Web App installiert werden:

- **Desktop**: Adressleiste â Installations-Icon oder Browser-Menü â "App installieren"
- **Android**: Browser-Menü â "Zum Startbildschirm hinzufügen" oder "App installieren"
- **iOS**: Share-Menü â "Zum Home-Bildschirm"

### Offline-Fähigkeit

Nach dem erstmaligen Laden funktioniert die Anwendung vollständig offline:
- Alle Ressourcen werden im Browser-Cache gespeichert
- Daten werden im `localStorage` persistiert
- Keine Serververbindung erforderlich

### PWA-Konfiguration

Die [`manifest.json`](manifest.json) definiert die PWA-Eigenschaften:

| Eigenschaft | Wert |
|-------------|------|
| Name | Prompt-Templates Browser |
| Short Name | Prompts |
| Display Mode | Standalone |
| Theme Color | #0c0f17 |
| Background Color | #08080a |
| Icons | 192Ã192px, 512Ã512px |

---

## Benutzeroberfläche

### Top-Bar (Header)

Die fixierte Top-Bar enthält folgende Elemente von links nach rechts:

| Element | Funktion |
|---------|----------|
| **Zurück-Button** (Pfeil nach links) | Navigation eine Ebene zurück oder Modal schließen |
| **Breadcrumb-Navigation** | Zeigt den aktuellen Pfad mit klickbaren Ebenen |
| **Organize-Button** (Grid-Icon) | Aktiviert/Deaktiviert den Drag-and-Drop-Organisationsmodus |
| **Add-Button** (+) | Öffnet ein Menü zum Erstellen neuer Prompts oder Ordner |
| **Reset-Button** | Setzt alle lokalen Änderungen zurück (nur sichtbar bei lokalen Änderungen) |
| **Download-Button** | Lädt die geänderte templates.json herunter (nur sichtbar bei lokalen Änderungen) |
| **Clear-Favorites-Button** | Löscht alle Favoriten (nur sichtbar bei vorhandenen Favoriten) |
| **Fullscreen-Button** | Aktiviert/Deaktiviert den Vollbildmodus |
| **App-Logo** | Navigation zur Startseite (Home) |

### Karten-Ansicht

Der Hauptbereich zeigt den Inhalt des aktuellen Ordners als responsives Grid aus Karten:

#### Ordner-Karten
- Animierte SVG-Ordner-Icons (Vivus.js)
- Klick öffnet den Ordnerinhalt
- Hover zeigt Glow-Effekt und 3D-Tilt

#### Prompt-Karten
- Zeigt den Titel des Prompts
- Zwei Aktions-Buttons:
  - **Expand-Icon**: Öffnet das Prompt-Detail-Modal
  - **Copy-Icon**: Kopiert den Prompt-Text in die Zwischenablage

#### Karten-Verhalten
- **Hover**: Hebung, Glow-Effekt, 3D-Tilt-Effekt
- **Klick auf Ordner**: Navigation in den Ordner
- **Klick auf Prompt**: Öffnet Detail-Modal
- **Rechtsklick**: Öffnet Kontextmenü

### Modal-Dialoge

#### Prompt-Detail-Modal

Zeigt den vollständigen Prompt-Text mit folgenden Aktionen:

| Button | Funktion |
|--------|----------|
| **Stern-Icon** | Zu Favoriten hinzufügen/entfernen |
| **Edit-Icon** | Aktiviert den Bearbeitungsmodus |
| **Save-Icon** | Speichert Änderungen (nur im Bearbeitungsmodus) |
| **Copy-Icon** | Kopiert den Prompt-Text |
| **Minimize-Icon** | Schließt das Modal |

#### Ordner-Erstellen-Modal

Eingabedialog für neue Ordner:
- Textfeld für Ordnernamen
- "Erstellen"-Button zum Anlegen
- "Abbrechen"-Button zum Schließen

#### Verschieben-Modal

Ermöglicht das Verschieben von Elementen:
- Baumansicht aller verfügbaren Ordner
- Auswahl des Zielordners
- Deaktivierte Elemente (Quellordner und aktueller Ordner)

### Favoriten-Dock

Das Favoriten-Dock am unteren Bildschirmrand zeigt markierte Prompts als kompakte Chips:

#### Features
- **Horizontal scrollbar** bei vielen Favoriten
- **Erweiterbar** durch Klick auf den Toggle-Button oder Swipe nach oben
- **Schnelles Kopieren** durch Klick auf einen Favoriten-Chip
- **Farbkodierte Akzente** für jeden Favoriten
- **Sparkle-Effekte** bei Hover

#### Favoriten-Chip-Aufbau
- Badge mit erstem Buchstaben des Titels
- Titel (max. 3 Zeilen)
- Vorschau des Inhalts (optional)

---

## Benutzerinteraktionen

### Navigation

#### Ordner öffnen
- **Klick** auf eine Ordner-Karte
- **Breadcrumb-Klick** für direkte Navigation zu einer übergeordneten Ebene

#### Eine Ebene zurück
- **Zurück-Button** in der Top-Bar
- **Swipe von rechts nach links** (Mobile)
- **Klick auf leeren Bereich** im Karten-Container

#### Zur Startseite
- **Klick auf das App-Logo**
- **Klick auf den fixierten Zurück-Button** (links mittig, sichtbar in Unterordnern)

#### View Transitions
Die Navigation nutzt die View Transitions API für animierte Übergänge:
- **Vorwärts**: Slide von rechts
- **Rückwärts**: Slide von links
- **Fallback**: Fade-Animation für nicht unterstützende Browser

### Prompts kopieren

#### Aus der Karten-Ansicht
1. **Copy-Button** auf der Prompt-Karte klicken
2. Der Prompt-Text wird in die Zwischenablage kopiert
3. Erfolgs-Animation und Benachrichtigung erscheinen

#### Aus dem Detail-Modal
1. Modal öffnen (Expand-Button oder Karten-Klick)
2. **Copy-Button** im Modal klicken
3. Text wird kopiert

#### Aus dem Favoriten-Dock
1. **Klick auf den Favoriten-Chip**
2. Text wird direkt kopiert
3. Visuelle Bestätigung mit Glow-Effekt

#### Kopier-Feedback
- **Icon-Animation**: Glow-Puls mit Farbwechsel
- **Konfetti-Effekt**: Bei erfolgreichem Kopieren
- **Haptisches Feedback**: Vibration auf mobilen Geräten
- **Benachrichtigung**: "Prompt kopiert!" Toast

### Favoriten verwalten

#### Favorit hinzufügen
- **Im Modal**: Stern-Button klicken
- **Kontextmenü**: Rechtsklick auf Prompt-Karte â "Zu Favoriten hinzufügen"

#### Favorit entfernen
- **Im Modal**: Gefüllten Stern-Button klicken
- **Kontextmenü**: Rechtsklick auf Prompt-Karte â "Aus Favoriten entfernen"
- **Im Favoriten-Dock**: Rechtsklick auf Chip â "Aus Favoriten entfernen"

#### Alle Favoriten löschen
- **Clear-Favorites-Button** in der Top-Bar
- Bestätigungsdialog erscheint

### Organisationsmodus

Der Organisationsmodus ermöglicht das Umstrukturieren der Vorlagen:

#### Aktivieren
- **Organize-Button** (Grid-Icon) in der Top-Bar klicken
- Icon wechselt zu einem Häkchen
- Karten beginnen zu "wackeln" (Jiggle-Animation)

#### Drag-and-Drop
1. Karte anfassen und ziehen
2. **Auf Ordner ablegen**: Element wird in den Ordner verschoben
3. **Auf andere Karte ablegen**: Option zum Zusammenfassen in neuem Ordner

#### Schnellaktionen im Organisationsmodus
- **Löschen-Button** (rot, oben rechts auf der Karte)
- **Bearbeiten-Button** (grün, oben rechts auf der Karte)

#### Deaktivieren
- **Häkchen-Button** klicken oder
- **Escape-Taste** drücken

### Elemente erstellen, bearbeiten und löschen

#### Neuen Prompt erstellen
1. **Add-Button** (+) klicken
2. **"Neuer Prompt"** aus dem Menü wählen
3. Titel und Inhalt eingeben
4. **Speichern-Button** klicken

#### Neuen Ordner erstellen
1. **Add-Button** (+) klicken
2. **"Neuer Ordner"** aus dem Menü wählen
3. Ordnernamen eingeben
4. **"Erstellen"** klicken

#### Element umbenennen
- **Kontextmenü**: Rechtsklick â "Umbenennen"
- **Organisationsmodus**: Bearbeiten-Button klicken
- Eingabefeld erscheint direkt auf der Karte

#### Element löschen
- **Kontextmenü**: Rechtsklick â "Löschen"
- **Organisationsmodus**: Löschen-Button klicken
- Bestätigungsdialog erscheint

#### Element verschieben
1. **Kontextmenü**: Rechtsklick â "Verschieben..."
2. Zielordner im Baum auswählen
3. **"Verschieben"** klicken

---

## Design-System

### Glassmorphism-Ästhetik

Die Anwendung verwendet einen modernen Glassmorphism-Stil mit folgenden Merkmalen:

| Eigenschaft | Wert |
|-------------|------|
| Hintergrund | `rgba(15, 18, 32, 0.72)` |
| Blur | `20px` |
| Rahmen | `rgba(255, 255, 255, 0.12)` |
| Highlight | Radialer Gradient oben links |
| Schatten | Vignette + äußerer Schatten |

#### CSS-Variablen

```css
--glass-bg: rgba(15, 18, 32, 0.72);
--glass-stroke: rgba(255, 255, 255, 0.12);
--glass-stroke-hover: rgba(6, 214, 214, 0.85);
--blur: 20px;
```

### Aurora-Hintergrundeffekte

Drei animierte, verschwommene Formen erzeugen den Aurora-Effekt:

| Shape | Farbe | Animation |
|-------|-------|-----------|
| Shape 1 | Deep Violet | 18s Drift |
| Shape 2 | Electric Cyan | 22s Drift |
| Shape 3 | Warm Coral | 26s Drift |

#### Parallax-Effekte
- **Scroll-Parallax**: Aurora bewegt sich beim Scrollen
- **Device-Orientation**: Reagiert auf Geräteneigung (Mobile)

### Farbpalette

#### Primäre Akzentfarben

| Name | Hex | Verwendung |
|------|-----|------------|
| Deep Violet | `#7c3aed` | Primärakzent, Glow |
| Electric Cyan | `#06d6d6` | Hover, Interaktionen |
| Warm Coral | `#ff6b9d` | Tertiärakzent |
| Golden Glow | `#ffd166` | Favoriten |

#### Semantische Farben

| Aktion | Farbe | Hintergrund |
|--------|-------|-------------|
| Favorit | `#ffd166` | Goldener Gradient |
| Löschen | `#ff6b6b` | Roter Gradient |
| Bearbeiten | `#06d6a0` | Grüner Gradient |
| Verschieben | `#a78bfa` | Violetter Gradient |

### Animationen und Effekte

#### GPU-optimierte Animationen

Alle Animationen nutzen GPU-beschleunigte CSS-Eigenschaften:
- `transform` (translate, scale, rotate)
- `opacity`
- `filter`

#### Timing-Funktionen

```css
--ease-smooth: cubic-bezier(.22,.61,.36,1);
--timing-function-bounce: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

#### Animationsdauern

| Typ | Dauer |
|-----|-------|
| Schnell | 160ms |
| Mittel | 260ms |
| Langsam | 600ms |
| Seitenübergang | 350ms |

#### Spezielle Effekte

- **Card 3D Tilt**: Mausverfolgende Neigung bei Hover
- **Glow Burst**: Radialer Glow bei Interaktionen
- **Konfetti**: Bei erfolgreichem Kopieren
- **Sparkle**: Auf Favoriten-Chips bei Hover
- **Particle System**: Hintergrund-Partikel

#### Reduced Motion

Bei aktivierter Systemeinstellung `prefers-reduced-motion: reduce`:
- Alle Animationen werden deaktiviert
- Aurora wird ausgeblendet
- Übergänge erfolgen ohne Bewegung

---

## Datenstruktur und Persistenz

### JSON-Struktur

Die Vorlagen werden in einer hierarchischen Baumstruktur gespeichert:

```json
{
  "id": "root",
  "type": "folder",
  "title": "Home",
  "items": [
    {
      "id": "unique-id-1",
      "type": "folder",
      "title": "Ordnername",
      "items": [
        {
          "id": "unique-id-2",
          "type": "prompt",
          "title": "Prompt-Titel",
          "content": "Der eigentliche Prompt-Text..."
        }
      ]
    }
  ]
}
```

### Knoten-Eigenschaften

| Eigenschaft | Typ | Pflicht | Beschreibung |
|-------------|-----|---------|--------------|
| `id` | String | Ja | Eindeutige Kennung (UUID) |
| `type` | String | Ja | `"folder"` oder `"prompt"` |
| `title` | String | Ja | Anzeigename |
| `items` | Array | Nein | Kind-Elemente (nur bei Ordnern) |
| `content` | String | Nein | Prompt-Text (nur bei Prompts) |

### localStorage-Schlüssel

| Schlüssel | Inhalt |
|-----------|--------|
| `customTemplatesJson` | Komplette JSON-Struktur als String |
| `favoritePrompts` | Array von Prompt-IDs |

### Persistenz-Verhalten

- **Sofortige Speicherung**: Jede Änderung wird sofort gespeichert
- **Automatische ID-Generierung**: Neue Elemente erhalten UUIDs
- **Favoriten-Sync**: Favoriten werden bei Löschung automatisch bereinigt

### Daten-Export

Der **Download-Button** exportiert die aktuelle Datenstruktur:
- Dateiname: `templates_modified.json`
- Format: Formatiertes JSON mit Einrückung
- Enthält alle lokalen Änderungen

### Daten-Reset

Der **Reset-Button** setzt alle Daten zurück:
- Löscht `customTemplatesJson` aus localStorage
- Löscht `favoritePrompts` aus localStorage
- Lädt die Originaldaten aus `templates.json`

---

## Technische Architektur

### Dateistruktur

```
/
âââ index.html                  # HTML-Struktur der SPA
âââ style.css                   # Alle Styles, Animationen, Responsive-Regeln
âââ script.js                   # Komplette Anwendungslogik
âââ manifest.json               # PWA-Konfiguration
âââ templates.json              # Standard-Datenquelle (Fallback)
âââ browserconfig.xml           # Windows Kachel-Konfiguration
âââ widget.html                 # Widget-HTML-Struktur
âââ widget.css                  # Widget-Styles
âââ widget.js                   # Widget-Logik
âââ README.md                   # Projektdokumentation
âââ icons/
    âââ favicon.svg                   # Vektor-Icon (animiert)
    âââ favicon.ico                   # Fallback-Icon fÃ¼r Ã¤ltere Browser
    âââ favicon-96x96.png             # PNG-Icon fÃ¼r Browser ohne SVG-Support
    âââ apple-touch-icon.png          # iOS Home-Screen-Icon
    âââ web-app-manifest-192x192.png  # PWA-Icon 192x192
    âââ web-app-manifest-512x512.png  # PWA-Icon 512x512
```

### Globale Zustandsvariablen

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `jsonData` | Object | Kompletter Datenbaum |
| `currentNode` | Object | Aktuell angezeigter Ordner |
| `pathStack` | Array | Navigation-Pfad (Eltern-Ordner) |
| `favoritePrompts` | Array | IDs der favorisierten Prompts |

### Kernfunktionen

| Funktion | Beschreibung |
|----------|--------------|
| [`renderView(node)`](script.js:1596) | Rendert den Inhalt eines Ordners |
| [`navigateToNode(node)`](script.js:1695) | Navigation zu einem Unterordner |
| [`navigateOneLevelUp()`](script.js:1086) | Navigation eine Ebene zurück |
| [`openPromptModal(node)`](script.js:1816) | Öffnet das Prompt-Detail-Modal |
| [`closeModal(element)`](script.js:1906) | Schließt ein Modal |
| [`persistJsonData()`](script.js:2036) | Speichert Daten im localStorage |
| [`saveFavorites()`](script.js:2256) | Speichert Favoriten im localStorage |
| [`toggleOrganizeMode()`](script.js:2204) | Aktiviert/Deaktiviert Drag-and-Drop |
| [`renderFavoritesDock()`](script.js:2559) | Aktualisiert das Favoriten-Dock |
| [`findNodeById(startNode, targetId)`](script.js:1402) | Sucht einen Knoten nach ID |

### Event-Handling

- **Passive Listener**: Für Touch- und Scroll-Events
- **Throttling**: Scroll-Events via `requestAnimationFrame`
- **Debouncing**: Resize-Events
- **Event Delegation**: Klick-Handling im Karten-Container

---

## Performance-Optimierungen

### Rendering

- **Maximale Kartenanzahl**: 36 Karten pro Ansicht
- **Content Visibility**: `content-visibility: auto` für Off-Screen-Karten
- **CSS Containment**: `contain: layout style paint` für Karten

### Animationen

- **GPU-Beschleunigung**: `transform`, `opacity`, `filter`
- **will-change**: Gezielt für animierte Elemente
- **Hardware Layers**: `translateZ(0)` forciert GPU-Layer

### Scroll-Performance

- **Throttled Scroll**: `requestAnimationFrame` für Parallax
- **Passive Event Listeners**: Kein Blockieren des Scroll-Threads
- **Overscroll-Behavior**: `contain` verhindert Bounce-Effekte

### Layout-Optimierungen

- **Binary Search**: Für Schriftgrößen-Berechnung
- **ResizeObserver**: Für Favoriten-Chip-Layout
- **IntersectionObserver**: Für Aurora- und Partikel-Sichtbarkeit

### Caching

- **Template-SVGs**: Einmalige Klonung statt Neuerstellung
- **Layout-Werte**: Caching in Variablen
- **Computed Styles**: Minimierte `getComputedStyle`-Aufrufe

---

## Responsives Verhalten

### Breakpoints

| Breakpoint | Anpassungen |
|------------|-------------|
| > 1320px | Standard-Layout |
| â¤ 1320px | Kleinere Karten |
| â¤ 1120px | Weitere Karten-Verkleinerung |
| â¤ 900px | Kompaktere Karten |
| â¤ 720px | 3-Spalten-Grid fix |
| â¤ 640px | Kompakte Favoriten-Dock-Toggle |
| â¤ 480px | Kleinste Karten- und Chip-Größen |

### Kartendimensionen

```css
--card-min-width: clamp(208px, 22vw, 236px);
--card-max-width: clamp(228px, 24vw, 252px);
```

### Safe Areas

Berücksichtigung von Notch und Home-Indicator:
```css
--safe-area-inset-top: env(safe-area-inset-top, 0px);
--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
```

### Dynamische Schriftgrößen

- **Kartentitel**: Automatische Anpassung via Binary Search
- **Favoriten-Chips**: Skalierung je nach verfügbarer Breite
- **Clamp-Funktionen**: Für fließende Übergänge

---

## Barrierefreiheit

### Semantisches HTML

- `<header>`, `<main>`, `<aside>` für Seitenstruktur
- `<nav>` für Breadcrumb-Navigation
- `<button>` für alle interaktiven Elemente
- `<ul>`, `<li>` für Listen

### ARIA-Attribute

| Element | ARIA |
|---------|------|
| Buttons | `aria-label` für Icon-Buttons |
| Modal | `aria-hidden` bei geschlossenem Modal |
| Favoriten-Dock | `role="region"`, `aria-label` |
| Toggle-Buttons | `aria-expanded` |

### Tastatur-Navigation

- **Tab**: Durch alle interaktiven Elemente navigieren
- **Enter/Space**: Buttons aktivieren
- **Escape**: Modals und Menüs schließen

### Fokus-Indikatoren

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(6, 214, 214, .35),
              0 0 0 6px rgba(124, 58, 237, .2);
}
```

### Screenreader-Unterstützung

- `.sr-only` Klasse für visuell versteckten Text
- Aussagekräftige `aria-label` für alle Buttons
- Status-Änderungen werden kommuniziert

---

## Browser-Kompatibilität

### Unterstützte Browser

| Browser | Minimale Version |
|---------|------------------|
| Chrome | 88+ |
| Firefox | 78+ |
| Safari | 14+ |
| Edge | 88+ |
| iOS Safari | 14+ |
| Android Chrome | 88+ |

### Progressive Enhancement

- **View Transitions API**: Fallback zu Fade-Animation
- **Fullscreen API**: Button wird bei Nicht-Unterstützung ausgeblendet
- **Device Orientation**: iOS-Berechtigung wird angefordert

### CSS-Features

- `backdrop-filter`: Mit `-webkit-` Prefix
- `clamp()`: Für responsive Werte
- `env()`: Für Safe Areas
- CSS Custom Properties: Für Design-Tokens

---

## Tastaturkürzel

| Taste | Aktion |
|-------|--------|
| `Escape` | Modal/Kontextmenü schließen, Organisationsmodus beenden |
| `Enter` | Eingabe bestätigen (in Eingabefeldern) |
| `Tab` | Durch Elemente navigieren |
| `Shift + Tab` | Rückwärts navigieren |

---

## Touch-Gesten (Mobile)

### Navigation

| Geste | Aktion |
|-------|--------|
| **Swipe nach links** | Eine Ebene zurück navigieren |
| **Swipe nach oben** (im Favoriten-Dock) | Dock erweitern |
| **Swipe nach unten** (im erweiterten Dock) | Dock minimieren |

### Interaktionen

| Geste | Aktion |
|-------|--------|
| **Tippen** | Element aktivieren |
| **Langes Drücken** | Kontextmenü öffnen (Rechtsklick-Alternative) |
| **Ziehen** (im Organisationsmodus) | Element verschieben |

### Haptisches Feedback

- **Kopieren**: Kurze Vibration (50ms)
- **Erfolg**: Muster-Vibration (10ms, 50ms, 10ms)

---

## Externe Abhängigkeiten

Die Anwendung nutzt folgende Bibliotheken via CDN:

| Bibliothek | Version | Zweck |
|------------|---------|-------|
| [Vivus.js](https://github.com/maxwellito/vivus) | 0.4.6 | SVG-Animation für Ordner-Icons |
| [Sortable.js](https://github.com/SortableJS/Sortable) | Latest | Drag-and-Drop im Organisationsmodus |
| [GSAP 3](https://greensock.com/gsap/) | 3.12.5 | Animationen im Favoriten-Dock |
| [GSAP Flip Plugin](https://greensock.com/docs/v3/Plugins/Flip) | 3.12.5 | Layout-Animationen beim Dock-Expandieren |

### CDN-Links

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/vivus/0.4.6/vivus.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Flip.min.js"></script>
```

---

## Lizenz

Dieses Projekt ist für die persönliche Nutzung bestimmt. Alle Rechte vorbehalten.