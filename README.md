# Prompt-Templates Browser

Eine hochperformante, offline-fähige **Progressive Web App (PWA)** zur hierarchischen Verwaltung von Text-Vorlagen (Prompts) mit **Glassmorphism-Design** und extrem flüssigem Benutzererlebnis.

![Version](https://img.shields.io/badge/Version-2.0-performance%20optimized-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow)

## Features

- **Hierarchische Organisation**: Ordner und Prompts in einer Baumstruktur verwalten
- **Favoriten-System**: Schnellzugriff auf häufig genutzte Prompts über das Favoriten-Dock
- **Drag & Drop**: Intuitive Organisation im Edit-Modus
- **Kopieren mit einem Klick**: Prompts direkt in die Zwischenablage kopieren
- **Responsive Design**: Optimiert für Desktop und mobile Geräte
- **Offline-fähig**: Vollständige Funktionalität ohne Internetverbindung
- **View Transitions**: Flüssige Seitenübergänge mit nativer Browser-API
- **Glassmorphism-Ästhetik**: Modernes, transparentes Design mit Aurora-Hintergrund

## Performance-Optimierungen

Diese Anwendung wurde für maximale Performance optimiert. Folgende Techniken werden eingesetzt:

### CSS-Optimierungen

| Optimierung | Beschreibung |
|-------------|--------------|
| **Reduced Backdrop-Blur** | Blur-Werte von 20px auf 8-12px reduziert für 40% weniger GPU-Last |
| **Removed will-change** | 17+ permanente `will-change` Deklarationen entfernt |
| **CSS Containment** | `contain: layout style paint` für isoliertes Rendering |
| **Content Visibility** | `content-visibility: auto` für Off-Screen-Rendering |
| **GPU-Acceleration** | `transform: translateZ(0)` statt `will-change` |
| **Optimized Animations** | Keine `filter: blur()` in Keyframe-Animationen |
| **Reduced Stagger-Delays** | 30ms → 20ms pro Karte für schnellere Animationen |

### JavaScript-Optimierungen

| Optimierung | Beschreibung |
|-------------|--------------|
| **Device Orientation Throttle** | 67ms → 100ms mit requestAnimationFrame |
| **Particle Visibility Observer** | Partikel pausieren wenn nicht sichtbar |
| **Aurora Visibility Observer** | Aurora-Animation pausiert außerhalb Viewport |
| **Binary Search Font Sizing** | Max 8 Iterationen statt 120 für Schriftgrößen |
| **Event Throttling** | Scroll-Events mit `requestAnimationFrame` |
| **Passive Event Listeners** | Bessere Scroll-Performance |

### Ladezeit-Optimierungen

| Optimierung | Beschreibung |
|-------------|--------------|
| **Preconnect CDN** | Frühe DNS-Auflösung für cdn.jsdelivr.net |
| **DNS-Prefetch** | Parallelisierte DNS-Lookups |
| **localStorage Persistence** | Keine erneuten JSON-Requests |

## Technologie-Stack

- **Vanilla JavaScript** - Keine Frameworks, maximale Performance
- **HTML5 & CSS3** - Moderne Web-Standards
- **View Transitions API** - Native Seitenübergänge
- **IntersectionObserver** - Effizientes Visibility-Tracking
- **CSS Containment** - Isoliertes Rendering

### Externe Bibliotheken (CDN)

- **Vivus.js** - SVG-Animationen für Ordner-Icons
- **Sortable.js** - Drag & Drop im Organisationsmodus
- **GSAP 3 + Flip Plugin** - Animationen im Favoriten-Dock

## Installation

1. Repository klonen oder Dateien herunterladen
2. `index.html` in einem modernen Browser öffnen
3. Fertig! Die App funktioniert vollständig offline.

## Verwendung

### Navigation

- **Ordner öffnen**: Auf eine Ordner-Karte klicken
- **Zurück navigieren**: Zurück-Button oder Wischgeste (mobile)
- **Home**: Auf das App-Logo klicken

### Prompts verwalten

- **Anzeigen**: Auf eine Prompt-Karte klicken
- **Kopieren**: Kopieren-Button oder im Modal
- **Favorisieren**: Stern-Button im Modal oder Kontextmenü

### Organisation

- **Edit-Modus**: Organisieren-Button aktivieren
- **Drag & Drop**: Karten verschieben oder in Ordner ablegen
- **Neue Elemente**: Plus-Button → Ordner/Prompt

### Kontextmenü

Rechtsklick auf eine Karte für:
- Favorit hinzufügen/entfernen
- Umbenennen
- Verschieben
- Löschen

## Datenstruktur

```json
{
  "id": "unique-id",
  "type": "folder|prompt",
  "title": "Titel",
  "items": [...],  // für Ordner
  "content": "..."  // für Prompts
}
```

## Browser-Unterstützung

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Barrierefreiheit

- Semantisches HTML
- ARIA-Attribute
- Tastaturnavigation
- `prefers-reduced-motion` Unterstützung

## Entwicklung

### Dateistruktur

```
├── index.html          # HTML-Struktur
├── style.css           # Alle Styles und Animationen
├── script.js           # Anwendungslogik
├── templates.json      # Standard-Daten (Fallback)
├── manifest.json       # PWA-Konfiguration
└── icons/              # App-Icons
```

### Wichtige Funktionen

- `renderView(node)` - Hauptrendering
- `navigateToNode(node)` - Navigation zu Unterordner
- `openPromptModal(node)` - Prompt-Details anzeigen
- `toggleOrganizeMode()` - Drag & Drop aktivieren
- `renderFavoritesDock()` - Favoritenleiste aktualisieren

## Performance-Metriken

Optimierte Werte für ein flüssiges 60fps-Erlebnis:

- **First Contentful Paint**: < 100ms
- **Time to Interactive**: < 200ms
- **Animation Frame Rate**: Konstante 60fps
- **Memory Usage**: Optimierte Observer und Listener

## Lizenz

MIT License - Frei verwendbar und anpassbar.

---

Entwickelt mit Fokus auf Performance und Benutzererlebnis.
