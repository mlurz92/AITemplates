# Prompt-Templates Anwendung – Vollständige Dokumentation

## Überblick
Diese Web-Anwendung ist ein interaktiver Prompt-Template-Manager mit Ordnern, Prompt-Karten, Verknüpfungen, Favoriten-Dock, Cloud-Sync (KV), Kontextmenüs, Drag&Drop und JSON Import/Export.

## Kernfunktionen
- Hierarchische Struktur mit Ordnern und Prompts
- Prompt- und Ordner-Verknüpfungen
- Favoritenleiste inkl. Schnellzugriff
- Organisieren/Verschieben-Modus
- Kontextmenüs per Rechtsklick
- Persistenz via Cloudflare KV (`/api/templates`) plus Local Fallback
- Download/Upload des kompletten Datenstands als JSON

## UI/UX im Detail
### Top-Bar
- Navigation (Zurück + Breadcrumb)
- Add-Menü mit: Prompt, Ordner, Prompt-Verknüpfung, Ordner-Verknüpfung
- Download-Menü mit: Download JSON / Upload JSON
- Reset lokaler Cache, Storage-Status, Favoriten leeren, Vollbild

### Kartenbereich
- Ordnerkarten: Navigation in Unterordner
- Promptkarten: Öffnen, Kopieren, Bearbeiten
- Kontextmenü auf Karten/Favoriten für Aktionen
- Kontextmenü auf freier Fläche für Moduswechsel + Add-Aktionen

### Favoriten-Dock
- Favoriten können Prompt **oder Ordner** sein
- Klick auf Prompt-Favorit kopiert Inhalt
- Klick auf Ordner-Favorit zeigt enthaltene Prompt-Namen als Schnellliste-Hinweis

### Modale
- Prompt-Modal (lesen/bearbeiten/speichern/kopieren/favorisieren)
- Ordner erstellen
- Link hinzufügen
- Verschieben
- JSON Upload (Dateiauswahl + Drag&Drop)

## Datenmodell
- Root ist ein `folder` mit `items`
- Nodes: `folder`, `prompt`, `prompt-link`, `folder-link`
- Pflichtfelder je nach Typ:
  - `folder`: `id`, `type`, `title`, `items[]`
  - `prompt`: `id`, `type`, `title`, `content`
  - `*-link`: `id`, `type`, `title`, `targetId`

## Sync & Speicherstrategie
- Primär: Cloud (KV API)
- Sekundär: `localStorage` Cache
- Konfliktbehandlung über `lastUpdated` Timestamp
- BroadcastChannel + Polling für Live-Updates

## JSON Import/Export
### Download
Exportiert den aktuellen Stand als `templates.json`.

### Upload
Akzeptiert JSON per Drag&Drop oder Dateiauswahl.
Nach erfolgreicher Validierung wird:
1. der aktuelle App-Stand ersetzt,
2. lokal gespeichert,
3. in KV hochgeladen (überschrieben).

## Accessibility
- ARIA-Labels für zentrale Controls
- Sichtbare Zustände in Menüs/Modals
- Tastaturunterstützung für zentrale Flows

## Technische Architektur
- Vanilla HTML/CSS/JS
- Externe libs: SortableJS, GSAP/Flip, Vivus
- API Endpoint: `/api/templates`

## Tipps für den produktiven Einsatz
- Regelmäßig JSON exportieren (Backup)
- Favoriten für häufige Prompts/Ordner nutzen
- Bei Offlinebetrieb weiterarbeiten, später syncen

## Fazit
Die Anwendung bietet eine leistungsfähige, visuell aufbereitete und workflow-orientierte Umgebung für Prompt-Sammlungen inkl. Team-/Cloud-Synchronisation, strukturierter Navigation und schneller Wiederverwendung.
