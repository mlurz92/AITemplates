# Prompt-Templates – Vollständige Anwendungsdokumentation

> **Version**: Aktueller Stand (2026-05-30)  
> **Plattform**: Web-Applikation (Progressive Web App) – optimal für iPhone 14 Pro Max (430 px Viewport-Breite) und alle Viewport-Größen  
> **Technologie-Stack**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Properties, Grid, Flexbox), SortableJS, GSAP, Vivus, View Transitions API

---

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Kernkonzept & Zweck](#kernkonzept--zweck)
3. [Design-Philosophie & visuelle Sprache](#design-philosophie--visuelle-sprache)
4. [Responsive & adaptives Layout-System](#responsive--adaptives-layout-system)
5. [Touch & Pointer-Interaktionen](#touch--pointer-interaktionen)
6. [Komponentenkatalog](#komponentenkatalog)
7. [Animation- & Motion-System](#animation--motion-system)
8. [Performance-Optimierungen](#performance-optimierungen)
9. [Barrierefreiheit & Inklusion](#barrierefreiheit--inklusion)
10. [Progressive Web App](#progressive-web-app)
11. [Mobile-Optimierungen (iPhone 14 Pro Max)](#mobile-optimierungen-iphone-14-pro-max)
12 [Datenmanagement & Sync](#datenmanagement--sync)
13. [Installation & Deployment](#installation--deployment)

---

## Überblick

Prompt-Templates ist ein spezialisiertes Werkzeug zum Durchsuchen, Organisieren und Kopieren von Prompt-Vorlagen. Die Anwendung nutzt ein modernes "Liquid Glass"-Design im Cupertino-Stil mit 5-Schichten-Glas-Effekt, Aurora-Hintergrundanimation und subtilen Mikro-Animationen. Sie ist als Progressive Web App (PWA) implementiert und funktioniert sowohl im Browser als auch im Standalone-Modus auf iOS/Android-Geräten.

Die Anwendung folgt einem **mobile-first** Ansatz und ist bis ins letzte Detail für die Interaktion auf Touch-Geräten optimiert – speziell für das iPhone 14 Pro Max mit seiner dreispaltigen Kachel-Anordnung.

---

## Kernkonzept & Zweck

### Primäre Funktion
Die Anwendung ermöglicht es Benutzern, eine hierarchische Sammlung von Prompt-Vorlagen zu erkunden, zu durchsuchen und zu kopieren. Jede Vorlage kann als Favorit markiert werden und steht im Dock für schnellen Zugriff zur Verfügung.

### Datenmodell
```javascript
{
  id: string | eindeutige Kennung (UUID),
  type: "prompt" | "folder" | "prompt-link" | "folder-link",
  title: string | Anzeigename,
  content?: string | Prompt-Text (bei type="prompt"),
  items?: Array | Untergeordnete Elemente (bei type="folder"),
  targetId?: string | Referenz auf verknüpftes Element (bei Link-Typen)
}
```

### Navigation
- **Breadcrumb-Navigation**: Zeigt aktuelle Position in der Ordnerhierarchie an
- **Swipe-to-go-back**: Rechtsswipe auf Inhaltsfläche oder Edgeswipe von links navigiert eine Ebene zurück
- **Pull-to-Refresh**: Ziehen am oberen Rand lädt Cloud-Daten neu (nur auf Touch-Geräten)

---

## Design-Philosophie & visuelle Sprache

### Liquid Glass – 5-Schichten-System

Die visuellen Elemente verwenden einen aufwändigen Glas-Effekt mit fünf Ebenen:

1. **Highlight-Gradient** (`--glass-highlight`): Oberflächenreflexion
2. **Refraction-Gradient** (`--glass-refraction`): Lichtbrechung
3. **Shadow-Overlay** (`--glass-shadow-overlay`): Schatten
4. **Basis-Glas** (`--glass-bg`): Hintergrund mit Transparenz
5. **Border-Glow** (`--glass-border-gradient`): Dynamischer Farbverlauf

### Farbsystem (Cupertino)

| Variable | Dark Mode | Light Mode | Verwendung |
|----------|-----------|------------|------------|
| `--bg-0` | `hsl(218, 26%, 8%)` | `hsl(210, 22%, 96%)` | Haupthintergrund |
| `--bg-1` | `hsl(218, 22%, 12%)` | `hsl(210, 18%, 92%)` | Sekundärhintergrund |
| `--fg-1` | `hsl(220, 30%, 97%)` | `hsl(218, 30%, 10%)` | Haupttext |
| `--fg-2` | `hsl(220, 20%, 78%)` | `hsl(218, 20%, 30%)` | Sekundärtext |
| `--fg-3` | `hsl(220, 14%, 58%)` | `hsl(218, 14%, 52%)` | Tertiärtext |
| `--acc-teal` | `#5AC8FA` | `#008FA8` | Akzent (Links, Hover) |
| `--acc-1` | `#5E5CE6` | `#4340C8` | Indigo Akzent |
| `--acc-2` | `#32D74B` | `#25A83A` | Grün (Success) |
| `--acc-3` | `#FF453A` | `#D32F22` | Rot (Löschen) |
| `--acc-4` | `#FFD60A` | `#C8A800` | Gelb (Favorit) |

### Aurora-Hintergrund
Drei radial-gradient basierte Schleier mit Animationen:
- **Shape 1**: Indigo/Lavendel (18s Drift)
- **Shape 2**: Minz-Grün (22s Drift)  
- **Shape 3**: Warm Peach/Orange (26s Drift)

Die Animationen verwenden `dvmax`, `dvh`, `dvw` für flackerfreies Verhalten auf mobilen Geräten.

---

## Responsive & adaptives Layout-System

### Breakpoints (standardisiert)

| Breakpoint | Breite | Geräteklasse |
|-----------|--------|--------------|
| xs | 0-359px | iPhone SE, sehr kleine Phones |
| sm | 360-479px | iPhone 12/13/14/15 (390/393px) |
| md | 480-719px | **iPhone 14 Pro Max (430px), Foldables** |
| lg | 720-899px | Tablets Portrait |
| xl | 900-1119px | Tablets Landscape |
| xxl | 1120-1319px | Desktop klein |
| xxxl | 1320px+ | Großer Desktop |

### Kachel-Layout
Grid-basiert mit `aspect-ratio: 10/7`:
- **Desktop**: Auto-fit mit `minmax(var(--card-min-width), 1fr)`
- **iPhone 14 Pro Max**: 3 Spalten (`repeat(3, minmax(0, 1fr))`)
- **iPhone SE**: 2 Spalten
- **Landscape < 500px**: Auto-fit mit min. 140px

### Safe Areas
Alle fixpositionierten Elemente nutzen `env(safe-area-inset-*)` für die korrekte Positionierung bei:
- Dynamic Island (iPhone 14 Pro/Pro Max)
- Android Notches
- iOS Home Indicator (untere Sicherheitszone)

---

## Touch & Pointer-Interaktionen

### Touch-Target-Größen
Alle interaktiven Elemente entsprechen **mindestens 44×44px**:
- `.card-delete-btn`: `clamp(44px, 6vw, 48px)`
- `.card-edit-btn`: `clamp(44px, 6vw, 48px)`
- `.favorites-toggle`: `clamp(44px, 8vw, 48px)` (war vorher 22px!)
- Top-Bar Icons: `min-width: 44px; min-height: 44px`
- `.btn-ghost`: `min-width: 44px; min-height: 44px`

### Touch-Optimierungen
- `-webkit-tap-highlight-color: transparent` global bei `pointer: coarse`
- `-webkit-touch-callout: none` verhindert iOS-Long-Press-Menü
- `user-select: none` auf UI-Elementen, automatisch auf Text-Inhalten
- `touch-action: pan-x pan-y` auf scrollbaren Containern
- Double-Tap-Zoom-Prävention für interaktive Elemente

### Gesten

#### Swipe-to-Go-Back
Zwei Implementierungen:
1. **Edgeswipe**: Start im linken 28px Rand → Navigation mit visuellem Feedback
2. **Container-Swipe**: Rechtsswipe auf Karten-Container → Navigation

**Entschärfung**: Edge-Swipe fügt `edgeSwipeTouch=true` hinzu → verhindert Doppelfire mit Container-Swipe

#### Pull-to-Refresh
- Aktiv beim `containerEl.scrollTop === 0`
- Schwellwert: 72px
- Zeigt Spinner mit "Loslassen zum Aktualisieren"
- Haptic Feedback (`medium`) bei Trigger

#### Favoriten-Dock-Swipe
- Vertikaler Swipe (>56px) öffnet/schließt das Dock
- Horizontales Scrollen mit Overflow-Indikator (links/rechts Pfeil-Deko)

---

## Komponentenkatalog

### Top Bar (`.top-bar`)
Positioniert oben mit Safe-Area, Glas-Effekt. Enthält:
- `#topbar-back-button`: Zurück-Pfeil (Ghost-Button)
- `#breadcrumb`: Pfadnavigation mit klickbaren Zwischenstopps
- `#organize-button`: Wechsel in den Organisations-Modus
- `#add-button` + `#add-menu`: Neue Elemente erstellen
- `#reset-button`: Lokalen Cache zurücksetzen
- `#storage-source-button`: Cloud-Sync-Status-Anzeige
- `#color-scheme-button`: Light/Dark Wechsel
- `#fullscreen-button`: Vollbild-Modus
- `#search-toggle-button`: Suchleiste einblenden
- `#app-logo-button`: Zur Startseite

### Karten-Container (`.cards-container`)
Centrales Grid mit:
- `content-visibility: auto` für Performance
- `contain-intrinsic-size: 220px 154px` für Layout-Stabilität
- Stagger-Animation für Einblendeffekt (30ms pro Karte)

### Karte (`.card`)
Zwei Typen:
- **Prompt-Karte**: Führt Text-Inhalt
- **Ordner-Karte**: 

#### Karten-Elemente
- Glasmorphismus-Hintergrund
- Hover/Glow-Effekt (auf Touch durch `:active` und `.is-pressed` ersetzt)
- 5-Schicht-Glas-Border (sichtbar bei Hover/Fokus/Pressed)
- Delete-/Edit-Buttons (nur im Edit-Modus sichtbar)
- Kontextmenü per Rechts-Click oder langes Drücken

### Modal-Dialoge

#### Prompt-Modal (`#prompt-modal`)
- **Mobile (≤720px)**: Bottom Sheet mit Drag-Handle
- **Desktop**: Zentrales Dialog-Fenster
- Schließt bei Backdrop-Klick, ESC, Swipe-down

#### Kontext-Menü (`#context-menu`)
- Positioniert relativ zum Auslösenden
- Aktionen: Favorit, Umbenennen, Verschieben, Löschen
- Auto-Hide bei Außer-Klick

### Favoriten-Dock (`#favorites-dock`)
- Fixed am unteren Bildschirmrand
- **Collapsed**: Horizontales Scrolling, Chips auf einzeilig
- **Expanded**: Mehrzeiliges Grid-Layout
- Toggle via Button oder Wischgeste

### Favoriten-Chip (`.favorite-chip`)
- 5-Schicht-Glas-Effekt
- Badge mit Accent-Farbe (zyklisch aus 8 Farben)
- Copy-Animation mit Konfetti
- Eingebettetes Folder-Hover-Menü (bei Ordner-Links)

---

## Animation & Motion-System

### Easing & Timing
```css
--ease-smooth: cubic-bezier(.22,.61,.36,1);
--timing-function-bounce: cubic-bezier(0.175, 0.885, 0.32, 1.275);
--duration-1: 160ms; /* Sofortiges Feedback */
--duration-2: 260ms; /* Übergänge */
--duration-3: 600ms; /* Gestaltungsgelernte Animationen */
```

### Micro-Animationen
- **Button Ripple**: Kreis-Expansions-Effekt beim `:active`
- **Primary Button Glow**: Pulsierender Glow-Ring
- **Card Glow Burst**: Radial-Glow bei Hover (Touch: `:active` + `.is-pressed`)
- **Copy Success**: Enhanced Icon-Animation mit Farbschema-Wechsel
- **Konfetti**: Partikel-System bei erfolgreichem Kopieren
- **Sparkles**: Für Favoriten-Chips

### View Transitions API
- Slide-Animation bei Navigation (forward/backward)
- Custom `vt-slide-out-*` und `vt-slide-in-*` Keyframes
- Easing mit `--ease-smooth`

### Prefers-Reduced-Motion
Alle Animationen deaktivieren bei:
```css
@media (prefers-reduced-motion: reduce) { ... }
```

---

## Performance-Optimierungen

### Render-Optimierung
- `will-change: transform` auf animierten Elementen
- `backface-visibility: hidden` für GPU-Beschleunigung
- `content-visibility: auto` auf Karten und Chips
- `transform: translateZ(0)` für Hardware-Beschleunigungsschichten

### Scroll-Performance
- `-webkit-overflow-scrolling: touch` (legacy) + `overscroll-behavior` (modern)
- Scroll-Snap auf Favoriten-Chips (`x proximity`)
- IntersectionObserver für Aurora-Pausierung

### Lazy Loading
- Karten-Animation nur für sichtbare Elemente (`IntersectionObserver`)
- Aurora-Pause wenn nicht im Viewport

### Memory Management
- `touchcancel`-Handler für saubere State-Reset
- debounce für Resize- und Layout-Aktualisierungen

---

## Barrierefreiheit & Inklusion

### Tastatur-Navigation
- Vollständige Tastatur-Steuerung über `keydown` Handler
- Focus-Ringe mit `--ease-smooth` Transition
- Escape schließt Modals, Favoriten-Dock, Kontext-Menü

### Screen-Reader Unterstützung
- `aria-label` auf allen interaktiven Elementen
- `.sr-only` Klasse für versteckte Beschreibungen
- Landmarks: `role="region"` für Favoriten-Dock

### Farb-Kontrast
- WCAG AAA-konform für alle Textfarben
- Light-Mode und Dark-Mode separat abgestimmt

### Reduced Motion
- Alle Animationen abschalten per `prefers-reduced-motion`
- Keine Herumdrehung/Spring-Effekte

---

## Progressive Web App

### PWA-Features
- **Standalone-Modus** unterstützt
- **BeforeInstallPrompt** für manuelle Installation
- **App-Installed** Event für Bestätigung
- **Theme-Color** dynamisch für Light/Dark

### Meta-Tags
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Prompt-Templates">
```

### Visual Viewport Handling
- `visualViewport` Resize-Listener für Keyboard-Awareness
- Automatisches Anpassen von Safe-Area-Variablen

---

## Mobile-Optimierungen (iPhone 14 Pro Max)

### Viewport-Beschreibung
Das iPhone 14 Pro Max hat eine rendering-Viewport-Breite von **430 px** (CSS-Pixel), was es in den **md-Breakpoint (480-719px)** einordnet. Die drei-Spalten-Anordnung der Kacheln entspricht exakt dem verfügbaren Platz.

### Spezifische Optimierungen

| Element | Optimierung |
|--------|------------|
| Kacheln | 3 pro Zeile, 184-196px Breite, 140-158px Höhe |
| Top-Bar | 60px Höhe, 28px Back-Button, 24px Icons |
| Favoriten-Dock | 3 Chips sichtbar im Collapsed-Modus |
| Suchfeld | 48px Höhe, 16px Font (kein Zoom) |
| Context-Menü | 86vw Breite, max 340px |
| Modal Bottom-Sheet | 92dvh Höhe, abgerundet 22px oben |

### Safari iOS Spezifika
- `viewport-fit=cover` für notchfreie Darstellung
- `interactive-widget=resizes-content` für Keyboard-Resize-Handling
- `-webkit-touch-callout: none` für Menü-Unterdrückung
- Dynamische Safe-Area-Insets im Dock, Top-Bar, Modals

### Touch-Geräte Fixes
- Alle Hover-Effekte durch `:active` und `.is-pressed` ersetzt
- Haptic Feedback über Vibration API (Android) / visuelle Alternative (iOS)
- 300ms-Tap-Delay durch `touch-action` eliminiert

---

## Datenmanagement & Sync

### Speicherorte
| Ebene | Speicher | Synchronisation |
|-------|----------|-----------------|
| Lokal | `localStorage` | Sofort |
| Cloud | Cloudflare KV | Echtzeit via Poll/Interval |

### Sync-Mechanismus
- **GET**: Holt von `/api/templates` (Cloud KV) oder fallback `templates.json`
- **POST**: Sendet Änderungen mit `lastUpdated` Timestamp
- **Konflikt-Erkennung**: 409 Conflict bei neuerer Server-Version

### Favoriten-System
- Gespeichert in `favoritePrompts` Array (localStorage)
- Dynamische Chips im Dock
- Copy-Success-Animation mit Konfetti

### JSON-Upload
- Drag&Drop-Zone für `.json`-Dateien
- Strukturvalidierung vor dem Import

---

## Installation & Deployment

### Lokale Entwicklung
```bash
# Einfach nur die Dateien öffnen:
# index.html, style.css, script.js, manifest.json, templates.json
```

### Firebase/Cloudflare Deployment
- `firebase.json` konfiguriert Hosting
- `/functions/api/templates.js` für KV-Speicherung
- Environment-Variable `TEMPLATES_KV` für Cloudflare KV Namespace

### PWA-Installation
1. Im Safari: Teilen → „Zum Home-Bildschirm“
2. Oder: BeforeInstallPrompt Event abfangen

### Build-Prozess
Keine Build-Pipeline erforderlich – Vanilla JS/CSS, CDN-Ressourcen für externe Bibliotheken.