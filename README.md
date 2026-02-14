# Prompt-Templates Browser

Eine hochperformante, offline-fähige **Progressive Web App (PWA)** zur hierarchischen Verwaltung von Text-Vorlagen (Prompts) mit einem atemberaubenden **Cosmic Aurora** Design.

![Version](https://img.shields.io/badge/Version-2.0-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow)
![License](https://img.shields.io/badge/License-MIT-orange)

---

## Inhaltsverzeichnis

- [Projektübersicht](#projektübersicht)
- [Features](#features)
- [Design](#design)
- [Animationen](#animationen)
- [Technologie](#technologie)
- [Installation & Verwendung](#installation--verwendung)
- [Architektur](#architektur)
- [Entwicklung](#entwicklung)
- [Barrierefreiheit](#barrierefreiheit)
- [Windows 11 Widget](#windows-11-widget)

---

## Projektübersicht

Der **Prompt-Templates Browser** ist eine moderne Single-Page-Anwendung (SPA), die entwickelt wurde, um Text-Vorlagen (Prompts) effizient zu organisieren, zu durchsuchen und schnell zu kopieren. Die Anwendung folgt dem Prinzip **maximaler Performance bei minimalen Abhängigkeiten** und verzichtet bewusst auf JavaScript-Frameworks.

### Kernvision

- **Framework-frei**: 100% Vanilla JavaScript für maximale Kontrolle und Performance
- **Offline-fähig**: Vollständige Funktionalität ohne Internetverbindung
- **Natives App-Gefühl**: GPU-beschleunigte Animationen und PWA-Installation
- **Responsives Design**: Optimiert für Desktop, Tablet und Mobilgeräte

---

## Features

### Navigation & Organisation

| Feature | Beschreibung |
|---------|--------------|
| **Hierarchische Navigation** | Durchsuchen Sie Ordnerstrukturen mit intuitiver Navigation |
| **Drag-and-Drop** | Organisieren Sie Prompts und Ordner per Drag-and-Drop im Organize-Mode |
| **Favoriten-System** | Markieren Sie häufig genutzte Prompts als Favoriten für schnellen Zugriff |
| **Kontextmenü** | Schnellzugriff auf Aktionen via Rechtsklick oder Long-Press |
| **Breadcrumb-Navigation** | Verfolgen Sie Ihren Navigationspfad und springen Sie direkt zurück |

### Prompt-Verwaltung

| Feature | Beschreibung |
|---------|--------------|
| **Schnelles Kopieren** | Ein-Klick-Kopieren von Prompts in die Zwischenablage |
| **Prompt-Vorschau** | Vergrößerte Ansicht mit vollständigem Text |
| **Bearbeitung** | Prompts direkt in der Anwendung bearbeiten |
| **Suche & Filter** | Schnelles Finden von Prompts über alle Ordner |

### Persistenz

- **Automatische Speicherung**: Alle Änderungen werden sofort im `localStorage` persistiert
- **Keine Server-Anbindung**: Daten bleiben lokal auf dem Gerät
- **Import/Export**: JSON-basierter Datenaustausch

---

## Design

### Cosmic Aurora Farbschema

Die Anwendung verwendet ein modernes, atmosphärisches Farbschema namens **"Cosmic Aurora"**:

| Farbe | Hex-Code | Verwendung |
|-------|----------|------------|
| **Deep Violet** | `#7c3aed` | Primärakzente, Buttons |
| **Electric Cyan** | `#06d6d6` | Sekundärakzente, Links |
| **Warm Coral** | `#ff6b9d` | Highlights, Favoriten |
| **Golden Glow** | `#ffd166` | Warnungen, Badges |

### Glassmorphism-Ästhetik

Die Benutzeroberfläche folgt der **Glassmorphism**-Designsprache:

- **Milchglas-Effekt**: Semi-transparente Hintergründe mit `backdrop-filter: blur()`
- **Tiefenwirkung**: Mehrere Ebenen mit unterschiedlichen Transparenzgraden
- **Subtile Schatten**: Weiche Schatten für räumliche Wirkung
- **Lichtreflexionen**: Dynamische Glows und Highlights

### Aurora-Hintergrund

Ein organischer, animierter Hintergrund erzeugt eine lebendige Atmosphäre:

- Drei große, unscharfe Farbflächen
- Langsame, kontinuierliche Bewegung
- `mix-blend-mode` für natürliche Farbübergänge
- Parallax-Effekt beim Scrollen

---

## Animationen

Alle Animationen sind **GPU-beschleunigt** und nutzen ausschließlich `transform`, `opacity` und `filter` für butterweiche 60fps-Erlebnisse.

### Übersicht der Animationen

| Animation | Auslöser | Beschreibung |
|-----------|----------|--------------|
| **Particle System** | Permanent | 25 schwebende Hintergrund-Partikel |
| **Glow Burst** | Interaktion | Leuchtender Burst bei Klick/Touch |
| **Konfetti** | Kopieren | Feier-Animation beim erfolgreichen Kopieren |
| **Card 3D Tilt** | Mausbewegung | 3D-Rotation der Karten bei Maus-Hover |
| **Device Orientation Parallax** | Gyroskop | Parallax-Effekt auf Mobilgeräten |
| **Touch Ripple** | Touch | Material-Design-Ripple bei Touch |
| **Haptic Feedback** | Aktion | Vibration bei unterstützten Geräten |
| **Magic Sparkle** | Favorit | Glitzer-Effekt für Favoriten-Karten |

### Performance-Optimierungen

```javascript
// Throttled Scroll-Events via requestAnimationFrame
scrollHandler = throttle(() => {
    // Animation Logic
}, 16); // ~60fps
```

- **Passive Event-Listener**: Verbesserte Scroll-Performance
- **`will-change`**: Gezielter Einsatz für Hardware-Beschleunigung
- **Layout-Schutz**: Verhindert Layout-Thrashing

### Reduced Motion

Die Anwendung respektiert die Systemeinstellung `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## Technologie

### Tech-Stack

| Kategorie | Technologie |
|-----------|-------------|
| **Markup** | HTML5 (Semantik) |
| **Styling** | CSS3 (Custom Properties, Grid, Flexbox) |
| **Logik** | Vanilla JavaScript (ES6+) |
| **Persistenz** | localStorage API |
| **PWA** | Web App Manifest |

### Externe Bibliotheken (CDN)

| Bibliothek | Version | Zweck |
|------------|---------|-------|
| **Vivus.js** | Latest | SVG-Animationen für Ordner-Icons |
| **Sortable.js** | Latest | Drag-and-Drop-Funktionalität |
| **GSAP 3 + Flip** | Latest | Favoriten-Dock-Animationen |

### Browser-Unterstützung

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile Browser (iOS Safari, Chrome for Android)

---

## Installation & Verwendung

### Lokale Ausführung

1. **Repository klonen oder herunterladen**

2. **Lokalen Server starten** (erforderlich für JSON-Loading):
   ```bash
   # Python 3
   python -m http.server 4173
   
   # Node.js (mit http-server)
   npx http-server -p 4173
   ```

3. **Anwendung öffnen**:
   ```
   http://localhost:4173
   ```

### Als PWA installieren

**Desktop (Chrome/Edge):**
1. Anwendung öffnen
2. Install-Icon in der Adressleiste klicken
3. "Installieren" bestätigen

**Mobile (iOS):**
1. Anwendung in Safari öffnen
2. "Teilen" Button antippen
3. "Zum Home-Bildschirm" wählen

**Mobile (Android):**
1. Anwendung in Chrome öffnen
2. Menü antippen
3. "Zum Startbildschirm hinzufügen"

### Erste Schritte

1. **Ordner öffnen**: Klicken Sie auf einen Ordner, um ihn zu öffnen
2. **Prompt kopieren**: Klicken Sie auf das Kopieren-Icon eines Prompts
3. **Favoriten hinzufügen**: Öffnen Sie einen Prompt und klicken Sie auf das Herz-Icon
4. **Organisieren**: Klicken Sie auf "Organisieren" für Drag-and-Drop-Modus

---

## Architektur

### Dateistruktur

```
AITemplates-main/
|-- index.html          # HTML-Struktur (241 Zeilen)
|-- style.css           # CSS-Stile (~2100 Zeilen)
|-- script.js           # JavaScript-Logik (~2900 Zeilen)
|-- templates.json      # Standard-Datenquelle
|-- manifest.json       # PWA-Konfiguration
|-- favicon.svg         # Statisches Icon
|-- favicon_animated.svg # Animiertes Icon
|-- widget.html         # Widget-Oberfläche
|-- widget.css          # Widget-Stile
|-- widget.js           # Widget-Logik
|-- AGENTS.md           # Agenten-Richtlinien
|-- README.md           # Diese Dokumentation
|-- icons/
|   |-- icon-192x192.png
|   |-- icon-512x512.png
|-- plans/
    |-- code-analysis-report.md
```

### Datenstruktur

```json
{
  "id": "unique-id",
  "type": "folder | prompt",
  "title": "Anzeigename",
  "items": [...],      // Nur für Ordner
  "content": "..."     // Nur für Prompts
}
```

### Zustandsverwaltung

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `jsonData` | Object | Gesamte Baumstruktur im Speicher |
| `currentNode` | Object | Aktuell angezeigter Ordner |
| `pathStack` | Array | Navigationsverlauf |
| `favoritePrompts` | Array | IDs der Favoriten |

### localStorage-Schlüssel

| Schlüssel | Inhalt |
|-----------|--------|
| `customTemplatesJson` | Komplette Ordnerstruktur als JSON |
| `favoritePrompts` | Array von Favoriten-IDs |

---

## Entwicklung

### Richtlinien

#### Code-Stil

- **Vanilla JavaScript**: Keine Frameworks, ES6+ Syntax
- **Modulare Funktionen**: Klare Trennung der Verantwortlichkeiten
- **Performance-First**: DOM-Manipulation minimieren

#### Wichtige Funktionen

```javascript
// Rendering
renderView(node)           // Hauptansicht aktualisieren
renderFavoritesDock()      // Favoritenleiste neu aufbauen

// Navigation
navigateToNode(node)        // Zu Ordner navigieren
navigateOneLevelUp()       // Eine Ebene zurück

// Persistenz
persistJsonData()          // Struktur speichern
saveFavorites()            // Favoriten speichern

// Suche
findNodeById(startNode, targetId)  // Knoten finden
```

#### UI/UX-Regeln

1. **Layout-Integrität**: Alle Elemente müssen vollständig sichtbar sein
2. **Keine Überlappungen**: UI-Elemente dürfen sich nicht überdecken
3. **Responsive Anpassung**: Dynamische Schriftgrößen via `adjustCardTitleFontSize()`

### Debugging

```javascript
// localStorage einsehen
console.log(localStorage.getItem('customTemplatesJson'));
console.log(localStorage.getItem('favoritePrompts'));

// Zurücksetzen
localStorage.removeItem('customTemplatesJson');
localStorage.removeItem('favoritePrompts');
location.reload();
```

---

## Barrierefreiheit

### WCAG 2.1 AA Konformität

Die Anwendung erfüllt die **WCAG 2.1 AA** Barrierefreiheitsstandards:

| Kriterium | Umsetzung |
|-----------|-----------|
| **Kontrast** | Erhöhte Kontraste für Text und UI-Elemente |
| **Tastatur** | Vollständige Tastatur-Navigation |
| **Fokus** | Sichtbarer Fokus-Indikator |
| **Semantik** | Native HTML-Elemente mit ARIA |

### Implementierte Features

- **Semantisches HTML**: `<button>`, `<nav>`, `<main>`, `<aside>`
- **ARIA-Attribute**: `aria-label`, `aria-expanded`, `role`
- **Tastatur-Shortcuts**: `Escape` schließt Modals
- **Fokus-Management**: Automatischer Fokus in Modals
- **Screenreader-Unterstützung**: Aussagekräftige Labels

### Reduced Motion

Benutzer mit Bewegungsempfindlichkeit werden geschützt:

```css
@media (prefers-reduced-motion: reduce) {
    /* Alle Animationen deaktiviert */
}
```

---

## Windows 11 Widget

Die Anwendung enthält eine optimierte Widget-Ansicht für Windows 11.

### Features

- **Favoriten-Schnellzugriff**: Alle Favoriten als kopierbare Pills
- **Root-Prompt-Kacheln**: Bis zu sechs Prompts der obersten Ebene
- **Suche**: Live-Filterung aller Einträge
- **Status-Feedback**: Lade- und Kopierstatus

### Einrichtung

1. Lokalen Server starten: `python -m http.server 4173`
2. Widget öffnen: `http://localhost:4173/widget.html`
3. In Edge: `...` > **Apps** > **Diese Seite als App installieren**
4. Optional: Mit `Win + Z` andocken oder PowerToys "Always on Top" nutzen

---

## Lizenz

MIT License - Frei zur Verwendung und Modifikation.

---

## Mitwirken

Beiträge sind willkommen! Bitte beachten Sie die Richtlinien in [`AGENTS.md`](AGENTS.md) für Entwicklungsstandards und Architekturvorgaben.

---

*Entwickelt mit Fokus auf Performance, Barrierefreiheit und Benutzererfahrung.*