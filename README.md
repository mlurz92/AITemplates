# Prompt Templates Hub

Eine moderne, cloud-synchronisierte Prompt-Sammlung mit Fokus auf **Schnelligkeit**, **Konsistenz** und **visuelle Klarheit**. Die Anwendung ist als Single-Page-Web-App konzipiert und ermöglicht das strukturierte Verwalten, Bearbeiten, Verlinken, Favorisieren und Kopieren von Prompt-Vorlagen – inklusive Live-Synchronisierung über Cloudflare KV.

---

## 1) Produktziel & Leitidee

Die App löst ein konkretes Praxisproblem: häufig benötigte Prompts sollen zentral verfügbar sein, ohne Versionschaos zwischen Geräten oder Browser-Tabs.

Kernprinzipien:
- **One Source of Truth:** Der aktuellste Datenstand liegt im KV-Store.
- **Direkte Nutzbarkeit:** Prompt öffnen, prüfen, mit einem Klick kopieren.
- **Strukturierbarkeit:** Ordnerhierarchie, Verknüpfungen, Drag-and-Drop-Organisation.
- **Schnellzugriff:** Favoriten-Dock mit kompakten Chips.
- **Responsives Premium-UI:** elegantes Glassmorphism/Aurora-Design mit hohem Kontrast.

---

## 2) Feature-Set im Detail

### 2.1 Datenmodell
- Baumartige Struktur mit Root-Knoten und `items`.
- Unterstützte Typen:
  - `folder`
  - `prompt`
  - `folder-link`
  - `prompt-link`
- Jedes Element besitzt mindestens eine `id` und einen `title`.

### 2.2 Navigation & Informationsarchitektur
- **Breadcrumb-Navigation** in der Top-Bar.
- **Home-Rücksprung** über Logo/Back-Actions.
- **Mobile History-Handling** via `pushState`/`popstate`, inkl. Modal-Kontext.

### 2.3 Suchen, Sortieren, Organisieren
- Neue **View-Toolbar** unterhalb der Top-Bar:
  - Volltextnahe Suche über Titel/Inhalt im aktuellen Ordner.
  - Sortiermodi:
    - Manuell
    - Titel A→Z
    - Titel Z→A
    - Typbasiert (Ordner zuerst)
- **Organize-Mode** (SortableJS): Drag-and-Drop-Reihenfolge mit Persistenz.
- **Kontextaktionen:** Umbenennen, Verschieben, Löschen, Favorisieren.

### 2.4 Prompt-Workflow
- Prompt in Modal öffnen.
- Inhalt lesen/bearbeiten (Edit-Modus).
- Speichern mit Datenpersistenz.
- **One-Click-Copy** in die Zwischenablage.

### 2.5 Favoriten-System
- Favoriten auf Prompt- und Ordnerebene.
- Dedizierte **Favoriten-Leiste (Dock)** mit erweiterbarer Ansicht.
- Option zum globalen Zurücksetzen aller Favoriten.

### 2.6 JSON Import/Export
- Download der aktuellen Daten als JSON.
- Upload/Import via Dateiauswahl oder Drop-Zone.
- Sinnvoll für Backup, Migration, Team-Sharing außerhalb der Live-Sync.

### 2.7 PWA- und Geräte-Features
- Installierbar als Web-App (Manifest + Icons).
- Fullscreen-Unterstützung.
- Safe-Area-Beachtung (Notches, mobile Insets).
- Adaptive Darstellung für unterschiedliche Display-Modi.

---

## 3) Synchronisierung mit Cloudflare KV

### 3.1 Read-Flow (GET `/api/templates`)
1. Worker prüft KV-Bindung `TEMPLATES_KV`.
2. Lädt `current_templates`.
3. Falls leer: Fallback auf statische `templates.json`, anschließend Initialisierung im KV.
4. Antwort enthält Daten, `lastUpdated`, Sync-Metadaten.

### 3.2 Write-Flow (POST `/api/templates`)
1. Payload-Validierung (`data` Objekt erforderlich).
2. Server liest aktuellen KV-Stand.
3. Konflikterkennung anhand `lastUpdated`.
4. Bei gültigem Update: neue Server-Timestamp-Version persistieren.

### 3.3 Konsistenzverhalten
- Ziel ist ein gemeinsamer aktueller Stand für alle Clients.
- Konflikte liefern HTTP `409` mit Serverdaten, damit Client sauber reagieren kann.

---

## 4) UI/UX-Designphilosophie

Die Gestaltung kombiniert **hochwertigen Dark-Glass-Look** mit bewusst spielerischen, aber kontrollierten Effekten:
- Aurora-Hintergrund für räumliche Tiefe.
- Weiche Glow-/Hover-Feedbacks auf Interaktionen.
- Klare semantische Farben für Aktionen (Edit, Delete, Favorite, Move).
- Hohe Lesbarkeit durch kontrastreiche Vordergrundfarben.
- Fokus-Ringe und strukturierte Interaktionszustände für bessere Zugänglichkeit.

Neu eingeführte UX-Schicht:
- **Sticky View-Toolbar** für unmittelbare Suche/Sortierung ohne Kontextwechsel.

---

## 5) Projektstruktur

- `index.html` – App-Shell, Top-Bar, Modals, Favoriten-Dock, SVG-Templates.
- `style.css` – gesamtes visuelles System inkl. Responsive/Animation.
- `script.js` – Datenlogik, Rendering, Events, Modals, Favoriten, Sync, PWA-Interaktion.
- `functions/api/templates.js` – Cloudflare Pages Function (GET/POST, KV, Konfliktlogik).
- `templates.json` – statischer Bootstrap/Fallback-Datenstand.
- `manifest.json`, `icons/*`, `browserconfig.xml` – PWA-/Plattformintegration.

---

## 6) Deployment & Betrieb

### Voraussetzungen
- Cloudflare Pages Projekt
- KV Namespace `TEMPLATES_KV` als Binding

### Ablauf (vereinfacht)
1. Repository deployen.
2. KV Namespace erstellen.
3. Binding `TEMPLATES_KV` auf Pages Environment setzen.
4. App aufrufen, Initialdaten werden bei Bedarf aus `templates.json` in KV übernommen.

---

## 7) Bedienablauf (Power-User)

1. Ordner öffnen und per Suchfeld schnell filtern.
2. Sortierung temporär für Analyse/Review umschalten.
3. Häufige Prompts favorisieren (Dock als Schnellzugriff).
4. Prompt im Modal feinjustieren und speichern.
5. Mit Copy-Button direkt in den nächsten Workflow übernehmen.

---

## 8) Robustheit, Qualität, Erweiterbarkeit

- Defensive API-Checks bei fehlendem KV Binding.
- Konfliktvermeidung mit Timestamp-Vergleich.
- UI modular über klar benannte DOM-Knoten und Funktionsbereiche aufgebaut.
- Erweiterbar um:
  - Tagging-System
  - serverseitige Suche
  - Rollen-/Rechtekonzept
  - Diff-/Versionshistorie

---

## 9) Lizenz / Nutzung

Der Quellcode ist als anpassbare Basis für eine persönliche oder Team-interne Prompt-Bibliothek gedacht. Lizenzdetails können projektspezifisch ergänzt werden.
