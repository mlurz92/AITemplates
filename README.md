# AITemplates

AITemplates ist eine browserbasierte Single-Page-Anwendung (SPA) zur strukturierten Verwaltung, Bearbeitung und Wiederverwendung von Prompts in einer verschachtelten Ordnerstruktur. Die App ist auf schnelle Bedienung, klare visuelle Orientierung und reibungsarme Alltagsnutzung ausgelegt – sowohl auf Desktop als auch auf mobilen Geräten.

Diese README ist eine vollständige, zustandsgetreue Produkt- und Technikdokumentation des aktuellen Implementierungsstands.

---

## Inhaltsverzeichnis

1. [Produktidee und Zielbild](#produktidee-und-zielbild)
2. [Funktionsumfang (kompakt)](#funktionsumfang-kompakt)
3. [Informationsarchitektur und Datenmodell](#informationsarchitektur-und-datenmodell)
4. [UI-Struktur im Detail](#ui-struktur-im-detail)
5. [UX-Flows und Interaktionsprinzipien](#ux-flows-und-interaktionsprinzipien)
6. [Organize-Modus (Drag, Reorder, Kombinieren)](#organize-modus-drag-reorder-kombinieren)
7. [Favoriten-Dock (Schnellzugriff)](#favoriten-dock-schnellzugriff)
8. [Modale Dialoge und Kontextmenü](#modale-dialoge-und-kontextmenü)
9. [Animation, Motion und visuelles Verhalten](#animation-motion-und-visuelles-verhalten)
10. [Persistenz, Cloud-Synchronisierung und Konfliktlogik](#persistenz-cloud-synchronisierung-und-konfliktlogik)
11. [Responsives Verhalten und Geräteeigenschaften](#responsives-verhalten-und-geräteeigenschaften)
12. [Accessibility und Ergonomie](#accessibility-und-ergonomie)
13. [Datei- und Code-Architektur](#datei--und-code-architektur)
14. [Lokale Entwicklung und Betrieb](#lokale-entwicklung-und-betrieb)
15. [Qualitätsmerkmale, Grenzen und empfohlene Weiterentwicklung](#qualitätsmerkmale-grenzen-und-empfohlene-weiterentwicklung)

---

## Produktidee und Zielbild

Die Anwendung richtet sich an Nutzer:innen, die regelmäßig mit wiederkehrenden Prompt-Bausteinen arbeiten und diese:

- schnell auffinden,
- logisch gruppieren,
- unmittelbar kopieren,
- und laufend nachpflegen möchten.

Dafür kombiniert AITemplates ein kartenbasiertes UI mit Ordnerhierarchien, Favoriten-Schnellzugriff und einem separaten Organize-Modus für Umstrukturierung.

### Leitprinzipien

- **Direkte Manipulation:** Karten werden sichtbar bewegt statt über abstrakte Listen-Dialoge.
- **Sofortiges Feedback:** Aktionen sind durch visuelle Zustände und Notifications nachvollziehbar.
- **Kontexttreue:** Navigation, Zustand und geöffnete Ebene bleiben stabil verständlich.
- **Cloud-first mit Fallback:** Primär Cloud-Quelle, lokal abgesichert.

---

## Funktionsumfang (kompakt)

- Hierarchische Verwaltung von Ordnern und Prompt-Karten.
- Erstellen, Umbenennen, Löschen, Bearbeiten, Verschieben.
- Prompt-Modal mit Copy-Flow und Favoriten-Toggle.
- Kontextmenü für schnelle Sekundäraktionen.
- Organize-Modus mit:
  - stabiler Reihenfolgesortierung,
  - Prompt→Prompt „direkt drauf“ = neuer Ordner,
  - Prompt→Ordner „direkt drauf“ = in Ordner verschieben.
- Favoriten-Dock als dauerhafter Schnellzugriff.
- Top-Bar mit Navigation, Download/Reset, Fullscreen, Speicherstatus.
- Cloud-Synchronisierung mit Polling/Visibility/Fokus-Checks.

---

## Informationsarchitektur und Datenmodell

Die App verwaltet Inhalte als Baum mit Root-Knoten.

### Knotentypen

- `folder`
  - Felder: `id`, `type`, `title`, `items[]`
- `prompt`
  - Felder: `id`, `type`, `title`, `prompt`

### Laufzeit-Zustände (Auszug)

- `currentNode`: aktuell geöffneter Ordnerkontext.
- `pathStack`: Navigationspfad für Breadcrumb/Back.
- `favoritePrompts`: Liste favorisierter Prompt-IDs.
- `sortableInstance` + `sortableDragState`: Organize-DnD-Steuerung.
- Sync-Zustände (`serverSyncTimestamp`, `isSyncInFlight`, etc.).

Diese Trennung von Datenzustand und UI-Zustand sorgt für robuste Re-Renderings.

---

## UI-Struktur im Detail

## 1) Ambient-Hintergrund (Aurora)

Eine animierte Hintergrundebene erzeugt visuelle Tiefe, ohne Lesbarkeit zu gefährden. Bei reduzierter Bewegungspräferenz wird Motion begrenzt.

## 2) Top-Bar

Zentrale Steuerfläche mit folgenden Elementen:

- Zurück-Button
- Breadcrumb-Navigation
- Organize-Toggle
- Add-Menü (Neuer Prompt / Neuer Ordner)
- Reset
- Download (Export)
- Storage-Source-Button (Sync/Quelle)
- Favoriten löschen
- Fullscreen-Toggle
- App-Logo (zur Startansicht)

## 3) Kartencontainer

Das Kernlayout rendert Ordner- und Prompt-Karten in einem responsiven Grid.

- Ordnerkarten sind visuell unterscheidbar (inkl. Icon).
- Promptkarten zeigen Titel und Schnellaktionen.
- Edit-/Organize-Zustände verändern Cursor, Bewegungsfeedback und Aktionssichtbarkeit.

## 4) Modale Ebene

- Prompt-Detail/Bearbeitung
- „Neuen Ordner erstellen“
- „Element verschieben“ (Baumauswahl)
- Toast/Notification Layer
- Kontextmenü (rechtsklick/lange Interaktion je Gerät)

## 5) Favoriten-Dock

Fixierte Schnellzugriffszone im unteren Bereich mit dynamischen Chips, Scroll-Handling und einklappbarer Darstellung.

---

## UX-Flows und Interaktionsprinzipien

### Navigation

- Klick auf Ordner öffnet den nächsten Baumknoten.
- Breadcrumb und Zurück erlauben stufenweise Rücknavigation.
- Auf Mobilgeräten ist Navigation zusätzlich an `history` gekoppelt.

### Prompt-Lesen und -Bearbeiten

- Promptkarte öffnet Modal mit Inhalt.
- Umschaltbar zwischen Readonly und Edit.
- Speichern persistiert den Zustand und aktualisiert Ansicht/Favoriten.

### Kopieren

- Clipboard-Flow mit Fallback (`navigator.clipboard` / `execCommand`).
- Erfolg wird visuell rückgemeldet (inkl. optionaler Motion/Haptik).

### Kontextmenü

Bietet auf Karten/Favoriten direkte Aktionen:

- Favorisieren/entfavorisieren
- Umbenennen
- Verschieben
- Löschen

---

## Organize-Modus (Drag, Reorder, Kombinieren)

Der Organize-Modus ist ein bewusst separater Modus für strukturelle Eingriffe.

### Aktivierung

- Über den Organize-Button in der Top-Bar.
- Im aktiven Zustand:
  - werden Karten per SortableJS verschiebbar,
  - wird Add ausgeblendet,
  - und visuelles „Edit“-Feedback aktiviert.

### Aktuelles, stabiles DnD-Verhalten

#### 1) Reorder

Wenn eine Karte normal im Grid verschoben wird, übernimmt die App die endgültige Reihenfolge aus der tatsächlichen DOM-Reihenfolge und schreibt sie zurück ins Datenmodell.

**Wichtig:** Dadurch werden Index-Race-Conditions vermieden (klassisches „alte/newIndex passt nicht mehr“ Problem).

#### 2) Prompt direkt auf Prompt

Liegt der Pointer in der zentralen „Overlay-Zone“ der Zielkarte, wird nicht nur umsortiert, sondern beide Prompts werden in einem neuen Ordner zusammengeführt.

#### 3) Prompt direkt auf Ordner

Liegt der Pointer in der zentralen Overlay-Zone einer Ordnerkarte, wird der Prompt in diesen Ordner verschoben.

### Warum dieses Verhalten jetzt robust ist

- Native Drag-Handler und Sortable-Flow sind entkoppelt, damit keine konkurrierenden Drag-Pfade gleichzeitig feuern.
- Während des Sortierens wird ein expliziter `combineIntent` gehalten.
- Highlighting (`drop-target-folder` / `drop-target-combine`) wird konsistent gesetzt/gelöscht.
- Bei nicht veränderter Reihenfolge rendert die App deterministisch neu, statt instabile Zwischenzustände stehenzulassen.

Damit verhält sich der Umorganisieren-Flow deutlich näher an der Erwartung eines „Homescreen-artigen“ Kartenverschiebens.

---

## Favoriten-Dock (Schnellzugriff)

Das Favoriten-Dock ist für häufig genutzte Prompts optimiert.

### Eigenschaften

- Sichtbar nur bei vorhandenen Favoriten.
- Chips mit dynamischer Größenlogik (inkl. Text-Fitting).
- Horizontaler Scrollbereich mit Gestenunterstützung.
- Expand/Collapse mit Zustandspflege.
- Favoritenänderungen wirken sofort in Dock und Karten/Modal.

### UX-Wert

- Schneller Zugriff ohne Verlust des aktuellen Ordnerkontexts.
- Besonders effizient auf kleinen Viewports.

---

## Modale Dialoge und Kontextmenü

## Prompt-Modal

- Titel und Inhalt anzeigen
- Editieren und Speichern
- Kopieren
- Favoritenstatus direkt umschalten
- Schließen per Button, Escape, ggf. Backdrop

## Ordner-Erstellen-Modal

- Titelvalidierung
- Erstellen/Abbrechen
- Persistenz direkt nach Anlage

## Move-Modal

- Baumansicht möglicher Zielordner
- Confirm nur bei gültiger Auswahl

## Kontextmenü

Kontextabhängige Aktionen je Elementtyp, inklusive Sichtbarkeitslogik und geordneten Trennlinien.

---

## Animation, Motion und visuelles Verhalten

- Aurora-Hintergrund mit Performance-sensiblen Effekten.
- Partikel-, Glow-, Tilt- und Parallax-Akzente (sofern Motion erlaubt).
- Kartenzustände (Hover, Ghost, Drag, Drop-Target).
- Berücksichtigung von `prefers-reduced-motion`.
- Ziel: hohe Wertigkeit ohne visuelle Überladung.

---

## Persistenz, Cloud-Synchronisierung und Konfliktlogik

### Primäre Datenquelle

Serverlose API (`functions/api/templates.js`) mit Cloudflare KV als persistente Basis.

### Lokaler Fallback

Lokale Speicherung für resilientes Verhalten bei temporären Sync-Problemen.

### Synchronisationslogik

- Zeitstempelvergleich lokal vs. Server.
- Polling plus Ereignis-getriggerte Sync-Prüfungen (Fokus/Visibility).
- UI-Statusanzeige zur aktuellen Datenquelle/Sync-Lage.

### Ziel

Nutzbarkeit bleibt auch bei unsteter Verbindung erhalten, ohne Datenmodell zu beschädigen.

---

## Responsives Verhalten und Geräteeigenschaften

- Flexible Grid- und Größensteuerung über moderne CSS-Techniken.
- Touch- und Desktoppfade werden beide berücksichtigt.
- Mobile Features wie History-Handling und Gesten-Interaktion.
- Safe-Area/Viewport-Fokus für PWA-nahe Nutzung.

---

## Accessibility und Ergonomie

- Beschriftete interaktive Controls (`aria-label`).
- Escape-Handling für Modals und UI-Overlays.
- Klare visuelle Zustände für Moduswechsel.
- Bedienwege sind konsistent und vorhersehbar.

---

## Datei- und Code-Architektur

- `index.html` – App-Struktur, UI-Elemente, Script-Einbindung.
- `style.css` – Designsystem, Layout, Animation, Zustandsklassen.
- `script.js` – Hauptlogik (Rendering, Interaktionen, DnD, Sync, Modalsteuerung, Favoriten).
- `templates.json` – initiales/strukturelles Inhaltsmodell.
- `functions/api/templates.js` – API-Endpunkt für Cloud-Speicherung/Sync.
- `manifest.json`, `browserconfig.xml`, `icons/*` – PWA/Branding/Plattformintegration.

---

## Lokale Entwicklung und Betrieb

Da es sich um eine browserbasierte SPA mit serverloser API-Komponente handelt, empfiehlt sich ein lokaler statischer Server bzw. das verwendete Hosting-Setup mit Functions-Unterstützung.

### Praktischer Ablauf

1. Repository klonen.
2. In Projektordner wechseln.
3. App lokal ausliefern (z. B. über Dev-Server/Hosting-CLI).
4. Im Browser öffnen und Interaktionen im Organize-Modus sowie Modal-Flows testen.

### Hinweise

- Für Cloud-Sync müssen passende Umgebungsvariablen/Bindings im Zielsystem gesetzt sein.
- Ohne gültige Backend-Konfiguration bleibt lokale Nutzung (mit Fallback-Persistenz) möglich.

---

## Qualitätsmerkmale, Grenzen und empfohlene Weiterentwicklung

### Aktuelle Stärken

- Hohe Interaktionsdichte bei klarer visueller Führung.
- Robuste Grundstruktur für Prompt-Wissensbasen.
- Schneller Favoritenzugriff plus Kontexttreue.
- Stabilisierte DnD-Logik für Organize-Szenarien.

### Grenzen (bewusst/technisch)

- Keine Multi-Select-Bearbeitung.
- Keine Undo/Redo-Historie für Strukturaktionen.
- Keine rollenbasierten Mehrbenutzerrechte im UI.

### Sinnvolle nächste Ausbaustufen

- Undo/Redo für DnD- und Löschaktionen.
- Erweiterte Such- und Filteransichten.
- Tagging/Metadaten pro Prompt.
- Optionales Keyboard-First-Reordering für Power-User.

---

## Kurzfazit

AITemplates ist auf produktive Prompt-Organisation mit hoher Bedienqualität ausgerichtet. Die Anwendung verbindet eine elegante Oberfläche mit praxisnahen Workflows (Ordnerstruktur, Favoriten, direkte Bearbeitung, drag-basierte Umstrukturierung) und bleibt dabei cloudfähig, responsiv und wartbar.
