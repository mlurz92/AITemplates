# Prompt-Templates

Prompt-Templates ist eine Progressive Web App (PWA) für die operative Verwaltung von Prompt-Bibliotheken. Die Anwendung ist auf **schnelles Wiederfinden, direktes Kopieren, saubere Strukturierung und langlebige Datenhaltung** ausgelegt – mit Fokus auf tägliche, produktive Nutzung statt nur auf Ablage.

---

## Inhaltsverzeichnis

1. [Produktzweck & Kernidee](#1-produktzweck--kernidee)
2. [Systemüberblick](#2-systemüberblick)
3. [Datenmodell & Objektlogik](#3-datenmodell--objektlogik)
4. [Informationsarchitektur & Navigation](#4-informationsarchitektur--navigation)
5. [UI-Bausteine im Detail](#5-ui-bausteine-im-detail)
6. [Favoriten-Dock im Detail](#6-favoriten-dock-im-detail)
7. [Neue Ordner-Favoriten-Hover-Struktur (Drop-Out)](#7-neue-ordner-favoriten-hover-struktur-drop-out)
8. [Interaktionsflüsse](#8-interaktionsflüsse)
9. [Bearbeiten, Organisieren, Verschieben, Verknüpfen](#9-bearbeiten-organisieren-verschieben-verknüpfen)
10. [Import/Export, lokale Speicherung & Cloud-Sync](#10-importexport-lokale-speicherung--cloud-sync)
11. [Animation, Motion, Performance](#11-animation-motion-performance)
12. [Accessibility, Feedback & Resilienz](#12-accessibility-feedback--resilienz)
13. [UX-/Design-Philosophie](#13-ux-design-philosophie)
14. [Technische Struktur](#14-technische-struktur)
15. [Datei-Referenz](#15-datei-referenz)
16. [Entwicklung, Betrieb, Deployment](#16-entwicklung-betrieb-deployment)
17. [Kurzfazit](#17-kurzfazit)

---

## 1. Produktzweck & Kernidee

Prompt-Templates adressiert ein Standardproblem in KI-Workflows: Prompts wachsen schnell in Menge und Tiefe, aber die Wiederverwendung wird langsam, wenn Struktur und Zugriff nicht konsequent umgesetzt sind.

**Kernnutzen:**
- Hierarchische Ordnung mit Ordnern/Unterordnern.
- Favoriten als operativer Schnellzugriff.
- Kopieren in die Zwischenablage mit direktem Feedback.
- Laufende Bearbeitung ohne Medienbruch.
- Lokale Persistenz plus optionaler Cloudflare-KV-Live-Sync.

Leitlinie: **„So wenig Klicks wie möglich zwischen Idee und nutzbarem Prompt.“**

---

## 2. Systemüberblick

Die App besteht aus:
- **Frontend:** `index.html`, `style.css`, `script.js`.
- **Daten-Quelle lokal:** `templates.json` + LocalStorage-Änderungen.
- **Optionale Remote-Quelle:** Cloudflare Functions API unter `functions/api/templates.js`.
- **PWA-Schicht:** `manifest.json`, Browser-/App-Icons, Meta-Integrationen.

Die Anwendung läuft als statische Web-App mit serverseitiger API-Erweiterung für Sync.

---

## 3. Datenmodell & Objektlogik

### 3.1 Primäre Typen
- **`prompt`**: `id`, `title`, `content`
- **`folder`**: `id`, `title`, `items[]`
- **`prompt-link` / `folder-link`**: Referenzierung via `targetId`

### 3.2 Knotenauflösung
Verlinkte Knoten werden zur Laufzeit aufgelöst, wodurch ein „Single Source of Truth“-Prinzip entsteht: Änderungen am Zielobjekt gelten überall.

### 3.3 Favoritenmodell
Favoriten werden als ID-Liste gehalten (`favoritePrompts`). Beim Rendern werden ungültige Einträge automatisch bereinigt.

### 3.4 Rekursive Prompt-Sammlung in Ordnern
Für Ordner-Favoriten wird der Prompt-Inhalt rekursiv gesammelt (inkl. Unterordnern) mit Zyklus-Schutz (Visited-Set), damit auch bei komplexen Link-Strukturen keine Endlosschleifen auftreten.

---

## 4. Informationsarchitektur & Navigation

- Root als Startansicht.
- Breadcrumb zur Pfadtransparenz.
- Rückwärtsnavigation über Top-Bar und Fixed-Back.
- Home-Sprung über App-Logo.
- Kartenbasierte Übersicht für Prompts/Ordner.

Ergebnis: Nutzer:innen bleiben mental in einer Dateisystem-ähnlichen Struktur und verlieren nie den Kontext.

---

## 5. UI-Bausteine im Detail

### 5.1 Top-Bar
Enthält alle Hauptaktionen:
- Zurück
- Breadcrumb
- Organize-Toggle
- Add-Menü (Prompt, Ordner, Prompt-Link, Ordner-Link)
- JSON-Menü (Download/Upload)
- Reset
- Speicherquellen-Status (Cloud/Local)
- Favoriten löschen
- Fullscreen
- Home

### 5.2 Kartenbereich (`cards-container`)
- Rendering von Prompt-/Ordner-Karten.
- Kontextmenü-Aktionen.
- Hover/Focus/Active-States.
- Optionaler Organize-/Move-Kontext.

### 5.3 Modals
- Prompt-Modal (Anzeigen/Bearbeiten/Kopieren/Favorisieren)
- Ordner anlegen
- Elemente verknüpfen
- Elemente verschieben
- JSON-Upload mit Drop-Zone

### 5.4 Notifications
Visuelles Status-Feedback für Aktionen wie Speichern, Kopieren, Fehlerfälle und Sync-Zustände.

---

## 6. Favoriten-Dock im Detail

Das Favoriten-Dock ist der zentrale Beschleuniger der App.

- Sichtbar nur bei vorhandenen Favoriten.
- Chips mit dynamischer Breite/Höhe je nach Viewport/Anzahl.
- Collapse/Expand mit Scroll-Indikatoren.
- Touch-/Wheel-Unterstützung.
- Kontextmenüfähigkeit.

Jeder Chip enthält:
- Initial-Badge
- Titel
- Optional Vorschauauszug (bei Prompt-Favoriten)
- Farb-Akzent mit Glow-Ästhetik

---

## 7. Neue Ordner-Favoriten-Hover-Struktur (Drop-Out)

Dies ist das gewünschte Verhalten für Ordner-Favoriten in der Favoritenleiste:

### 7.1 Öffnen per Hover
Wenn der Mauszeiger über einem **Ordner-Favoriten-Chip** liegt, öffnet sich oberhalb des Chips ein animiertes Drop-Out-Menü.

### 7.2 Inhalt der Liste
Die Liste besteht aus klickbaren Feldern (Buttons), die die **Prompt-Namen** anzeigen, die innerhalb des Ordners liegen (rekursiv inkl. Unterordner).

### 7.3 Klickverhalten in der Liste
Ein Klick auf einen Listenpunkt kopiert den **Prompt-Inhalt** des gewählten Prompt-Namens direkt in die Zwischenablage.

### 7.4 Schließen der Struktur
Sobald der Mauszeiger den Bereich verlässt bzw. auf andere Elemente geht, wird das Ordner-Drop-Out automatisch wieder geschlossen (inkl. kurzer Intent-Verzögerung für stabile Bedienung).

### 7.5 Touch-/Nicht-Hover-Geräte
Auf Touch-Geräten wird das Menü per Tap geöffnet/geschlossen, da klassischer Hover dort nicht verfügbar ist.

### 7.6 UX-Effekt
Die Struktur wirkt wie eine leichte „Quick-Launcher“-Ordneransicht: keine tiefe Navigation nötig, direkte Entnahme einzelner Prompts aus Favoritenordnern.

---

## 8. Interaktionsflüsse

### 8.1 Prompt finden und kopieren
1. Navigieren oder Favorit wählen.
2. Prompt öffnen oder Direktkopie verwenden.
3. Clipboard-Feedback erhalten.

### 8.2 Ordner-Favorit als Schnellmenü
1. Hover auf Ordner-Chip.
2. Prompt-Liste klappt animiert aus.
3. Gewünschten Prompt anklicken.
4. Inhalt wird kopiert, Menü schließt.

### 8.3 Prompt bearbeiten
1. Prompt öffnen.
2. Edit aktivieren.
3. Titel/Inhalt anpassen.
4. Speichern und Persistenz aktualisieren.

---

## 9. Bearbeiten, Organisieren, Verschieben, Verknüpfen

- Umbenennen von Karten.
- Löschen einzelner Elemente.
- Verschieben in Zielordner.
- Organize-Modus für Sortierung/Umordnung.
- Prompt-/Ordner-Verknüpfungen statt Daten-Duplikate.

Die App ist damit sowohl kuratierbar als auch skalierbar für große Prompt-Sammlungen.

---

## 10. Import/Export, lokale Speicherung & Cloud-Sync

### 10.1 JSON Export/Import
- Download des aktuellen Datenstands als JSON.
- Upload via Dateidialog oder Drag-and-Drop.

### 10.2 Lokaler Zustand
- Favoriten und Arbeitsstand in LocalStorage.

### 10.3 Cloudflare KV Sync
- API-basierter Abruf/Speicherung.
- Polling/Refresh-Mechanismen.
- Zeitstempel-Logik zur Konfliktminderung.

---

## 11. Animation, Motion, Performance

- Aurora-Hintergrund, Partikel, Glow- und Tilt-Effekte.
- Chip- und Menü-Microanimations.
- Motion-Reduktion via `prefers-reduced-motion`.
- Render-/Layout-Optimierungen (u. a. content-visibility, requestAnimationFrame-Steuerung, observer-basierte Aktualisierungen).

Ziel: hochwertiger Eindruck ohne Bedienbremsen.

---

## 12. Accessibility, Feedback & Resilienz

- Breite Nutzung von ARIA-Labels.
- Fokus-Navigation und `focusin/focusout`-Verhalten.
- Clipboard-Fallback für ältere Umgebungen.
- Schutz vor invaliden Zuständen (fehlende Links/IDs, leere Daten, Sync-Edge-Cases).

---

## 13. UX-/Design-Philosophie

- Dunkles Aurora-Farbsystem für langes Arbeiten.
- Glassmorphism mit klaren Kontrasten.
- Semantische Aktionsfarben für Handlungsarten.
- Animation als Statuskommunikation, nicht nur Dekoration.

Der „perfekte Touch“ entsteht hier durch die Kombination aus:
- geringer Klicktiefe,
- präzisem visuellen Feedback,
- stabiler, nachvollziehbarer Informationsarchitektur,
- und schneller Copy-to-Clipboard-Ausführung.

---

## 14. Technische Struktur

- **`index.html`**: UI-Skelett, Top-Bar, Modals, Dock, SVG-Icon-Templates.
- **`style.css`**: Design-Tokens, Layout-System, responsive Regeln, States, Motion.
- **`script.js`**: App-State, Rendering, Event-Handling, Favoritenlogik, Kopierfunktionen, Sync, Navigation.
- **`functions/api/templates.js`**: API-Funktionen für cloudbasierten Datenzugriff.

---

## 15. Datei-Referenz

- `index.html`
- `style.css`
- `script.js`
- `templates.json`
- `functions/api/templates.js`
- `manifest.json`
- `browserconfig.xml`
- `icons/*`

---

## 16. Entwicklung, Betrieb, Deployment

### Lokal
- Projekt in statischem Webserver starten.
- Optional Functions lokal emulieren.

### Deployment
- Frontend-Assets bereitstellen.
- Functions-Endpoint deployen.
- KV-Binding/Environment konfigurieren.
- PWA-Dateien vollständig mit ausrollen.

---

## 17. Kurzfazit

Prompt-Templates ist eine produktionsnahe Prompt-Operations-App mit Fokus auf Geschwindigkeit, Struktur und Wiederverwendung. Durch das neue Hover-Drop-Out für Ordner-Favoriten ist der Zugriff auf tief liegende Prompts jetzt noch direkter: **hovern, auswählen, kopieren, weiterarbeiten**.
