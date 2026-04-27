# AITemplates

Eine moderne Prompt-Template-Anwendung als **Single-Page-WebApp** mit Fokus auf:

- klar strukturierte Wissensablage,
- sehr schnelle Wiederverwendung von Prompts,
- mobile-first Bedienbarkeit,
- visuelle Qualität mit ruhigem „Cosmic Aurora“-Design,
- robuster Persistenz über **Cloudflare KV** (inkl. lokaler Fallback-Strategie).

Dieses Dokument beschreibt den **aktuellen Ist-Zustand der Anwendung vollständig** – Architektur, Datenmodell, Interaktionsmuster, UI/UX-Verhalten, technische Integrationen sowie Betrieb und Erweiterbarkeit.

---

## Inhaltsverzeichnis

1. [Produktidee und Nutzungskontext](#produktidee-und-nutzungskontext)
2. [Kern-Workflow der Anwendung](#kern-workflow-der-anwendung)
3. [Informationsarchitektur und Navigationsmodell](#informationsarchitektur-und-navigationsmodell)
4. [UI-Struktur im Detail](#ui-struktur-im-detail)
5. [Interaktionsdesign und UX-Verhalten](#interaktionsdesign-und-ux-verhalten)
6. [Kartenmodell: Prompt- und Ordnerkarten](#kartenmodell-prompt--und-ordnerkarten)
7. [Bearbeitungsansicht / Organize-Modus](#bearbeitungsansicht--organize-modus)
8. [Modale Dialoge und deren Verhalten](#modale-dialoge-und-deren-verhalten)
9. [Favoriten-Dock: Schnellzugriff und Raumökonomie](#favoriten-dock-schnellzugriff-und-raumökonomie)
10. [Cloud-Sync, lokale Persistenz und Konflikte](#cloud-sync-lokale-persistenz-und-konflikte)
11. [Animation, Motion und Performance-Optimierung](#animation-motion-und-performance-optimierung)
12. [Responsive Verhalten, Safe Areas und PWA-Modi](#responsive-verhalten-safe-areas-und-pwa-modi)
13. [Accessibility und ergonomische Details](#accessibility-und-ergonomische-details)
14. [Datei- und Modulübersicht](#datei--und-modulübersicht)
15. [Technischer Stack und externe Bibliotheken](#technischer-stack-und-externe-bibliotheken)
16. [Betrieb, Deployment und Entwicklung](#betrieb-deployment-und-entwicklung)
17. [Qualität, Robustheit und bekannte Grenzen](#qualität-robustheit-und-bekannte-grenzen)
18. [Erweiterungsoptionen](#erweiterungsoptionen)
19. [Kurzfazit](#kurzfazit)

---

## Produktidee und Nutzungskontext

AITemplates dient als zentraler Arbeitsraum für alle, die regelmäßig mit wiederkehrenden Textbausteinen, Prompt-Sets oder strukturiertem Prompt-Wissen arbeiten.

### Typische Einsatzfelder

- persönliche Prompt-Bibliotheken,
- Team-Standards für wiederkehrende AI-Aufgaben,
- thematisch organisierte Prompt-Sammlungen pro Projekt/Domain,
- mobile Nutzung als installierte PWA.

### Leitprinzipien

- **Sofort verständlich:** klare visuelle Semantik (Ordner vs. Prompt).
- **Sofort nutzbar:** schnelle Interaktionen ohne Umwege.
- **Sofort verlässlich:** Datenhaltung mit Cloud- und Lokalstrategie.
- **Sofort angenehm:** visuell ruhige Oberfläche mit hochwertigen Mikrointeraktionen.

---

## Kern-Workflow der Anwendung

1. App laden und Root-Übersicht öffnen.
2. Über Karten in Ordner navigieren.
3. Prompt-Karte öffnen, lesen, kopieren, ggf. bearbeiten.
4. Inhalte reorganisieren (Reihenfolge, Verschieben, Umbenennen, Löschen).
5. Häufig genutzte Prompts als Favoriten markieren.
6. Änderungen automatisch persistieren (Cloud + lokaler Fallback).

Das Ziel ist ein **reibungsarmer Kreis aus Organisieren → Nutzen → Verfeinern**.

---

## Informationsarchitektur und Navigationsmodell

Die Daten folgen einer Baumstruktur:

- `folder`-Knoten: enthalten `items` (Ordner oder Prompts),
- `prompt`-Knoten: enthalten Inhalt plus Titel.

### Navigationszustand

- `currentNode`: aktueller Ordnerkontext,
- `pathStack`: Pfad von Root bis zur aktuellen Ebene,
- Breadcrumb als direktes visuelles Abbild des Pfads.

### Navigationskanäle

- Klick auf Ordnerkarte,
- Back-Buttons (Topbar / fixed),
- Logo-Home-Navigation,
- Breadcrumb-Sprünge.

---

## UI-Struktur im Detail

### 1) Hintergrundebene

- Aurora-Verläufe und subtile Bewegung,
- Noise-/Textur-Layer für Tiefe,
- reduzierte Motion bei aktivem `prefers-reduced-motion`.

### 2) Top-Bar (globale Steuerzentrale)

Elemente (abhängig vom Zustand sichtbar/aktiv):

- Zurück,
- Breadcrumb,
- Organize-Toggle,
- Add-Menü (Prompt/Ordner),
- Reset und Download (bei lokalem Cache),
- Cloud-Verbindungsindikator (Punkt),
- Favoriten löschen,
- Vollbild,
- App-Logo (Home).

### 3) Hauptbereich (Cards-Grid)

- responsive Kartenmatrix,
- Ordner- und Prompt-Karten in einheitlichem Kartenraster,
- dynamischer Abstand nach unten für das Favoriten-Dock.

### 4) Overlay-/Modalebene

- Prompt-Modal,
- Ordner-erstellen-Modal,
- Move-Dialog (Baumauswahl),
- Kontextmenü auf Karten/Favoriten,
- Notification-Area.

### 5) Persistenter Schnellzugriff

- Favoriten-Dock als untere, zustandsabhängige Utility-Leiste.

---

## Interaktionsdesign und UX-Verhalten

### Direkte Manipulation

Die App priorisiert direkte Auswirkungen auf sichtbare Objekte (Karten), z. B. Reorder, Verschieben oder Favorisieren.

### Progressive Offenlegung

Sekundäraktionen liegen im Kontextmenü statt in jeder Karte sichtbar zu sein. So bleibt das Layout sauber, aber mächtig.

### Zustandsfeedback

- visuelle Highlights bei Drag-and-Drop,
- Success-/Info-/Error-Notifications,
- aktive/inaktive Iconzustände (z. B. Organize, Favorit).

### Fehlerrobustheit

- unzulässige Aktionen werden abgefangen,
- Konflikte bei Cloud-Sync werden explizit behandelt,
- lokale Datensicherung verhindert harte Datenverluste.

---

## Kartenmodell: Prompt- und Ordnerkarten

### Prompt-Karten

- öffnen das Prompt-Modal,
- unterstützen Favoritenstatus,
- können kopiert, verschoben, umbenannt und gelöscht werden.

### Ordnerkarten

- dienen als Navigationsziel,
- enthalten weitere Knoten,
- können ebenfalls umbenannt, verschoben und gelöscht werden.

### Kontextmenüaktionen

- Favorit umschalten (bei Prompts/Favoriten),
- Umbenennen,
- Verschieben…,
- Löschen.

---

## Bearbeitungsansicht / Organize-Modus

Der Organize-Modus ist auf aktive Strukturbearbeitung optimiert.

### Funktionen

- Reihenfolge per Drag-and-Drop ändern,
- Promptkarten direkt auf Ordnerkarten ziehen,
- bei Drop auf Ordner wird der Prompt **in den Ordner verschoben**,
- kombinierende „in neuen Ordner zusammenführen“-Interaktion via Drag/Drop auf Prompt möglich (außerhalb des gezielten Prompt→Ordner-Moves im Organize-Flow).

### Designentscheidung

Der Modus reduziert Ablenkung (z. B. Add-Button ausgeblendet), damit der Fokus auf Strukturpflege liegt.

---

## Modale Dialoge und deren Verhalten

### Prompt-Modal

- Volltextanzeige,
- optionaler Edit-Modus,
- Speichern,
- Kopieren,
- Favoriten-Toggle,
- sauberer Close-Flow (Button, Backdrop, Escape).

### Ordner-Modal (Erstellen)

- einfacher Input,
- Validierung auf nicht-leeren Titel,
- Erstellen/Abbrechen.

### Verschieben-Modal

- Ordnerzielauswahl im Baum,
- deaktivierter Confirm-Button bis gültiges Ziel gewählt ist,
- anschließendes persistiertes Move.

---

## Favoriten-Dock: Schnellzugriff und Raumökonomie

Das Favoriten-Dock ist als sekundäre Navigation für „Hot Prompts“ gedacht.

### Eigenschaften

- nur sichtbar bei vorhandenen Favoriten,
- ein-/ausklappbar,
- horizontales/kompaktes Verhalten je verfügbarer Breite,
- dynamische Chipgrößen inkl. Text-Fitting,
- Touch- und Scroll-Optimierung,
- auto-berechneter Platzbedarf für den Hauptinhalt.

### UX-Nutzen

- minimiert Wege für wiederkehrende Prompts,
- beschleunigt mobile Sessions,
- bleibt präsent ohne den Hauptkontext zu zerstören.

---

## Cloud-Sync, lokale Persistenz und Konflikte

### Primärspeicher

- Cloudflare KV über serverlose API (`functions/api/templates.js`).

### Lokaler Fallback

- Browser-Storage als Sicherheitsnetz,
- Download-/Reset-Funktionen für lokale Zustände.

### Synchronisationslogik

- Polling/Visibility/Fokus-getriebene Sync-Anstöße,
- Zeitstempel-basierte Konflikterkennung,
- UI-Feedback bei Änderungen oder Problemen.

### Verbindungsindikator

- Topbar zeigt einen **Punktindikator** für Cloud-Live-Verbindung,
- textuelle Zusatzkennzeichnung wird bewusst weggelassen,
- Fokus auf minimalistische Statuskommunikation.

---

## Animation, Motion und Performance-Optimierung

### Motion-Schichten

- Hintergrundbewegung (Aurora),
- Card-/Button-Mikroanimationen,
- sanfte Zustandsübergänge,
- FLIP-basierte Übergänge (falls verfügbar).

### Performance-Maßnahmen

- `requestAnimationFrame` für visuelle Updates,
- CSS-Containment und GPU-freundliche Transforms,
- reduzierte Layout-Neuberechnungen,
- Debounce bei Resize-/Observer-getriebenen Abläufen,
- Motion-Reduktion bei Nutzerpräferenz.

---

## Responsive Verhalten, Safe Areas und PWA-Modi

### Viewport-Strategie

- `100dvh` / dynamische Variablen für stabile Höhen,
- Safe-Area-Unterstützung (`env(safe-area-inset-*)`),
- robustes Verhalten bei mobilem Browser-Chrome.

### Betriebsarten

- klassischer Browser,
- installierte PWA (`display-mode: standalone`),
- expliziter Vollbildmodus.

### Ergebnis

Kontrollen bleiben erreichbar, Dock überlappt Inhalte nicht unkontrolliert, und die Bedienung bleibt auch auf kleinen Displays präzise.

---

## Accessibility und ergonomische Details

- sprechende `aria-label`s,
- semantische Struktur (`main`, `nav`, `aside`, Modale),
- klare Fokus- und Hover-Zustände,
- touchfreundliche Targets,
- deutliche Farb-/Kontrastrollen,
- Escape-/Backdrop-/Keyboard-Schließpfade bei Dialogen.

---

## Datei- und Modulübersicht

- `index.html` – Gesamte Struktur, Controls, Modale, SVG-Templates.
- `style.css` – Designsystem, Layout, States, Animation, Responsive Regeln.
- `script.js` – Runtime-Logik: State, Rendering, Events, DnD, Sync, Favoriten, Modale.
- `templates.json` – initiales Datenset.
- `functions/api/templates.js` – serverlose API-Schicht für Cloud-Persistenz.
- `manifest.json` – PWA-Metadaten.
- `browserconfig.xml` – Plattform-Metadaten.
- `icons/*` – App-Icons/Favicon-Assets.

---

## Technischer Stack und externe Bibliotheken

### Kern

- Vanilla HTML/CSS/JavaScript.

### Bibliotheken

- **SortableJS** für Reorder-/DnD-Verhalten,
- **GSAP + Flip** für Transition-Qualität,
- **Vivus** für SVG-Zeichenanimationen.

### Plattform

- Cloudflare Pages Functions + KV für serverloses Storage.

---

## Betrieb, Deployment und Entwicklung

### Lokale Ausführung

- statisch ausführbar,
- volle Cloud-Funktionalität bei konfigurierter Function/KV-Bindung.

### Produktionsbetrieb

- Deployment auf Cloudflare Pages,
- KV-Binding für persistente Templates,
- Caching-/Sync-Strategie über App-Logik.

### Entwicklungsfokus

- strukturelle Klarheit in `script.js`,
- visuelle Konsistenz in `style.css`,
- stabile Interaktionspfade vor Feature-Breite.

---

## Qualität, Robustheit und bekannte Grenzen

### Robuste Aspekte

- defensive Checks bei Move/Render/Sync,
- lokale Sicherung,
- konfliktbewusstes Speichern,
- explizites Nutzerfeedback.

### Grenzen (aktueller Stand)

- kein dediziertes Rollen-/Rechtesystem,
- keine Volltextsuche über große Datenmengen,
- kein eingebautes Versions-/Audit-History-System.

---

## Erweiterungsoptionen

- Volltextsuche mit Facetten,
- Tags und mehrdimensionale Klassifikation,
- Bulk-Operationen,
- Prompt-Versionierung inkl. Diff,
- Team- und Rollenmodell,
- optional verschlüsselte lokale Backups,
- telemetry-freie Nutzungsmetriken zur UX-Optimierung.

---

## Kurzfazit

AITemplates ist eine auf Prompt-Arbeit spezialisierte, performante WebApp, die **Struktur**, **Geschwindigkeit** und **Zuverlässigkeit** kombiniert. Die Kombination aus kartenbasiertem UI, Organize-Modus, Favoriten-Dock und Cloud-Sync sorgt dafür, dass Prompts nicht nur gespeichert, sondern im Alltag tatsächlich effizient wiederverwendet und laufend verbessert werden können.
