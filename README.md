# Prompt-Templates

> **Eine cloud-synchronisierte Prompt-Sammlung mit Live-Konsistenz, editierbarer Kartenlogik, Favoriten-Schnellzugriff und responsivem Premium-Interface für alle Geräteklassen.**

Prompt-Templates ist eine Progressive Web App (PWA), die als operative Arbeitsoberfläche für wiederverwendbare Prompt-Bausteine entwickelt wurde. Die Anwendung kombiniert **schnelles Auffinden, direktes Kopieren, strukturierte Kategorisierung, Inline-Bearbeitung und Cloudflare-KV-Synchronisierung** in einer einzigen Oberfläche – mit Fokus auf produktive tägliche Nutzung statt reiner Archivierung.

---

## Inhaltsverzeichnis

1. [Produktvision & Kernprinzipien](#1-produktvision--kernprinzipien)
2. [Funktionsumfang auf einen Blick](#2-funktionsumfang-auf-einen-blick)
3. [Informationsarchitektur & Navigationsmodell](#3-informationsarchitektur--navigationsmodell)
4. [UI/UX-System im Detail](#4-uiux-system-im-detail)
5. [Kartenmodell: Prompts, Ordner, Verknüpfungen](#5-kartenmodell-prompts-ordner-verknüpfungen)
6. [Favoriten-Dock als Schnellzugriffs-Hub](#6-favoriten-dock-als-schnellzugriffs-hub)
7. [Suchen, Sortieren, Organisieren, Verschieben](#7-suchen-sortieren-organisieren-verschieben)
8. [Bearbeiten, Kopieren & Feedback-Loops](#8-bearbeiten-kopieren--feedback-loops)
9. [Cloudflare-KV Live-Sync & Konsistenzmodell](#9-cloudflare-kv-live-sync--konsistenzmodell)
10. [Import/Export & Datenportabilität](#10-importexport--datenportabilität)
11. [Design-Philosophie & Responsive Erlebnis](#11-design-philosophie--responsive-erlebnis)
12. [Animation, Motion & Performance](#12-animation-motion--performance)
13. [Accessibility, Robustheit & Fehlerverhalten](#13-accessibility-robustheit--fehlerverhalten)
14. [Datei- und Architekturübersicht](#14-datei--und-architekturübersicht)
15. [Installation, Entwicklung & Deployment](#15-installation-entwicklung--deployment)
16. [Datenstruktur-Referenz](#16-datenstruktur-referenz)
17. [Praxis-Workflows](#17-praxis-workflows)
18. [Kurzfazit](#18-kurzfazit)

---

## 1. Produktvision & Kernprinzipien

Die App ist für ein klares Szenario ausgelegt: Du möchtest eine große Menge hochwertiger Prompt-Templates über Kategorien hinweg verwalten, blitzschnell wiederfinden, bei Bedarf verfeinern und unmittelbar in die Zwischenablage übertragen – ohne Medienbruch.

### Leitprinzipien

- **Single Source of Truth:** Alle Nutzer:innen sehen denselben aktuellen Stand über Cloudflare KV.
- **Zero-Friction Copy:** Prompt-Ausgabe immer mit minimaler Klicktiefe.
- **Struktur ohne Overhead:** Ordnerhierarchie + Links statt Daten-Duplikation.
- **Produktive Favoritenlogik:** Häufig genutzte Assets in einer eigenen Schnellzugriffsleiste.
- **Edles, spielerisches UI:** Premium-Look mit klarer Lesbarkeit auf jeder Bildschirmgröße.

---

## 2. Funktionsumfang auf einen Blick

- Kartenbasierte Anzeige von **Prompts** und **Ordnern**.
- Verschachtelte Ordnerstrukturen inklusive Unterordnern.
- Prompt- und Ordner-Verknüpfungen (`prompt-link`, `folder-link`).
- Vollständiges Modal für Lesen, Editieren, Speichern und Kopieren.
- Kontextmenü mit Favorisieren, Umbenennen, Verschieben, Löschen.
- Favoriten-Dock mit komprimierter und erweiterter Ansicht.
- Ordner-Favoriten mit Hover-/Tap-Dropout zum Direktkopieren enthaltenen Prompt-Contents.
- JSON Download/Upload für Backups und Migration.
- Cloudflare-KV GET/POST Sync inkl. Konflikterkennung über Zeitstempel.
- PWA Installierbarkeit inklusive App-Manifest, Icons und Mobile-Meta.

---

## 3. Informationsarchitektur & Navigationsmodell

### 3.1 Root-zentrierte Struktur

Die Root-Ebene ist die Startansicht. Von dort geht die Navigation in Ordnerunterebenen, wobei der Kontext jederzeit erhalten bleibt.

### 3.2 Breadcrumb als Orientierungsanker

Der Breadcrumb zeigt den aktuellen Pfad und ermöglicht schnelle Rücksprünge auf Zwischenebenen.

### 3.3 Mehrfach-Back-Navigation

- Top-Bar Back-Button
- Optionaler Fixed-Back Button
- App-Logo als direkter Home-Sprung

So bleibt die Bedienung auf Touch, Tablet und Desktop gleich intuitiv.

---

## 4. UI/UX-System im Detail

### 4.1 Top-Bar als Operations-Konsole

Die Header-Leiste bündelt alle Primäraktionen:

- Zurücknavigation
- Breadcrumb
- Organize Toggle (Sortiermodus)
- Add-Menü (Prompt, Ordner, Links)
- JSON-Menü (Download/Upload)
- Reset-Button
- Speicherquellenstatus (KV/Local)
- PWA Installationsbutton
- Favoriten-Reset
- Fullscreen Toggle
- Home-Logo

### 4.2 Kartenraster (`cards-container`)

Die Hauptfläche nutzt ein responsives Card-Grid. Karten sind eindeutig differenziert nach Typ (Prompt/Ordner/Link) und unterstützen verschiedene Zustände (normal, hover, active, drag, focus).

### 4.3 Modals mit klaren Rollen

- **Prompt-Modal:** Anzeigen, Editieren, Speichern, Favorit-Status, Kopieren
- **Create-Folder-Modal:** Neues Kategorieelement erstellen
- **Link-Modal:** Bestehende Elemente verknüpfen statt duplizieren
- **Move-Modal:** Zielordnerbasiertes Verschieben
- **Upload-Modal:** JSON per Datei oder Drag-and-Drop importieren

### 4.4 Kontextmenü als Experten-Shortcut

Ein einheitliches Rechtsklick-/Long-Press-Menü reduziert UI-Clutter und hält erweiterte Aktionen dort, wo sie gebraucht werden: direkt am Element.

---

## 5. Kartenmodell: Prompts, Ordner, Verknüpfungen

### 5.1 Prompt

Ein Prompt-Objekt enthält üblicherweise:

- `id`
- `type: "prompt"`
- `title`
- `content`

### 5.2 Folder

Ein Ordner-Objekt enthält:

- `id`
- `type: "folder"`
- `title`
- `items[]` (rekursive Knotenliste)

### 5.3 Link-Typen

- `prompt-link` referenziert ein Prompt-Ziel über `targetId`
- `folder-link` referenziert ein Ordner-Ziel über `targetId`

Verknüpfungen ermöglichen mehrere Zugriffswege auf dasselbe Inhaltselement, ohne Datenkopien.

### 5.4 Auflösung & Integrität

Beim Rendern werden referenzierte Zielknoten aufgelöst. Dadurch bleiben Änderungen am Ursprung global konsistent sichtbar.

---

## 6. Favoriten-Dock als Schnellzugriffs-Hub

Das Favoriten-Dock ist das produktive Herzstück für wiederkehrende Nutzung.

### 6.1 Sichtbarkeit & Zustände

- Dock wird nur angezeigt, wenn Favoriten existieren.
- Unterstützt **collapsed** und **expanded** Zustand.
- Dynamische Höhe/Breite je nach Viewport und Inhaltsdichte.

### 6.2 Favorite Chips

Jeder Chip kann enthalten:

- Initial-Badge
- Titel
- Vorschautext
- semantische Akzentfarbe
- Interaktionszustände inkl. Copy-Feedback

### 6.3 Ordner-Favoriten Dropout

Für Ordner-Favoriten wird ein Dropout-Menü bereitgestellt, das enthaltene Prompts rekursiv anzeigt. Klick/Tap auf einen Eintrag kopiert den zugehörigen Prompt-Inhalt direkt.

### 6.4 Scroll-UX & Bedienkomfort

- Horizontales bzw. adaptives Scrollverhalten
- Scrollindikatoren
- Expand-Toggle mit visueller Rückmeldung
- Touch-optimierte Bedienung für Mobilgeräte

---

## 7. Suchen, Sortieren, Organisieren, Verschieben

### 7.1 Sortierung & Umordnung

Die App unterstützt einen Organize-Modus, in dem Karten per Drag-and-Drop neu angeordnet werden können (SortableJS).

### 7.2 Verschieben

Elemente lassen sich in Zielordner verschieben, wodurch Bibliotheken sauber restrukturiert werden können, ohne Inhalte neu anzulegen.

### 7.3 Verknüpfen statt Duplizieren

Mit Prompt-/Ordner-Links können häufig benötigte Inhalte parallel in mehreren Kategorien verfügbar gemacht werden.

### 7.4 Skalierungswirkung

Diese Mechanik ist besonders wirksam bei großen Sammlungen: schnelle Reorganisation bei gleichzeitiger Konsistenz der eigentlichen Inhalte.

---

## 8. Bearbeiten, Kopieren & Feedback-Loops

### 8.1 Bearbeiten

Prompts können direkt im Modal bearbeitet und gespeichert werden (Titel + Inhalt).

### 8.2 Kopieren

Copy-to-Clipboard ist zentraler Primärflow:

- Kopierbutton auf Prompt-Ebene
- Kopieraktionen über Favoritenchips
- Kopieraktionen in Ordner-Favoriten-Dropouts

### 8.3 Sofortiges Feedback

Benachrichtigungen und visuelle Button-/Chip-States signalisieren Erfolg/Fehler der Aktion unmittelbar.

---

## 9. Cloudflare-KV Live-Sync & Konsistenzmodell

### 9.1 API-Endpunkt

`/api/templates` wird über Cloudflare Functions bereitgestellt.

### 9.2 GET-Verhalten

- Liest `current_templates` aus KV.
- Falls leer: lädt `templates.json` als Fallback und schreibt Initialzustand in KV.
- Gibt zusätzlich Sync-Metadaten (`syncedFrom`, `syncedAtIso`) zurück.

### 9.3 POST-Verhalten

- Validiert eingehendes Datenobjekt.
- Vergleicht `clientLastUpdated` mit Serverstand.
- Bei älterem Clientstand: `409 Conflict` + Serverdaten zur Konfliktbehandlung.
- Bei Erfolg: schreibt neuen Zeitstempel und persistiert finalen Zustand.

### 9.4 Ergebnis für Teams / Multi-Device

Alle Clients arbeiten auf einem gemeinsamen Stand. Damit sinken Inkonsistenzen, Versionsdrift und „Sprung“-Effekte deutlich.

---

## 10. Import/Export & Datenportabilität

### 10.1 Download JSON

Exportiert den aktuellen Bestand für Archivierung, Backup oder Transfer.

### 10.2 Upload JSON

Importiert komplette Datenstände über Dateiauswahl oder Drag-and-Drop.

### 10.3 Einsatzszenarien

- schnelle Wiederherstellung
- Staging/Production Transfer
- kuratierte Template-Pakete

---

## 11. Design-Philosophie & Responsive Erlebnis

### 11.1 Ästhetik

Das visuelle System verbindet dunkle Aurora-Farbwelt, Glasflächen, Kontrastkanten und Akzentfarben für einen edlen, fokussierten Look mit spielerischer Energie.

### 11.2 Lesbarkeit und Fokus

Die visuelle Hierarchie trennt Primäraktionen klar von Sekundäraktionen. Inhalte bleiben im Mittelpunkt, Effekte unterstützen nur.

### 11.3 Responsive über alle Geräteklassen

- Mobile: Touch-optimierte Targets, adaptive Docks, reduzierte Dichte
- Tablet: ausgeglichene Kartenbreiten, starke Übersicht
- Desktop: maximale Parallelübersicht, schnelle Maus-Workflows

### 11.4 „Perfekter Touch“ für Prompt-Arbeit

Die Kombination aus schneller Navigation, direktem Copy-Flow, präzisem Feedback und konsistenten Cloud-Daten macht die Oberfläche explizit für Prompt-Produktionsworkflows effizient.

---

## 12. Animation, Motion & Performance

- Aurora-Hintergrund mit animierten Shapes
- Partikel-, Glow- und Tilt-Effekte
- Mikrointeraktionen auf Buttons, Karten und Favoritenchips
- `prefers-reduced-motion`-freundliche Verhalten
- Renderoptimierungen (z. B. observer-gesteuerte Aktivität, content-visibility)

Ziel ist ein hochwertiger visueller Eindruck ohne Produktivitätsverlust.

---

## 13. Accessibility, Robustheit & Fehlerverhalten

### 13.1 Accessibility

- Umfangreiche ARIA-Attribute
- Fokussteuerung in Modals
- semantisch erkennbare Interaktionspunkte

### 13.2 Robustheit

- Validierung von Payloads im API-Layer
- Fallback bei leerem KV-Zustand
- Konflikterkennung für parallele Updates
- Defensive Behandlung ungültiger Referenzen

### 13.3 Nutzerfeedback

Fehler und Erfolg werden klar als Notification bzw. Statussignal visualisiert.

---

## 14. Datei- und Architekturübersicht

- `index.html` – gesamtes UI-Skelett inkl. Top-Bar, Modals, Favoriten-Dock und SVG-Templates.
- `style.css` – Design-Tokens, Responsive-Regeln, Glassmorphism, Animationen, Komponentenzustände.
- `script.js` – State-Management, Rendering, Event-System, Navigation, Modal-Logik, Clipboard, Favoriten, Sync.
- `functions/api/templates.js` – Cloudflare Function für GET/POST auf `TEMPLATES_KV` inkl. Konfliktlogik.
- `templates.json` – lokaler Initialdatensatz/Fallback.
- `manifest.json` + `icons/*` + `browserconfig.xml` – PWA Installierbarkeit und Plattformintegration.

---

## 15. Installation, Entwicklung & Deployment

### 15.1 Lokale Nutzung

App-Dateien können statisch gehostet werden. Für Cloud-Sync wird zusätzlich die Cloudflare-Functions-Umgebung benötigt.

### 15.2 Cloudflare Bindings

Es wird ein KV Namespace benötigt, gebunden als:

- `TEMPLATES_KV`

### 15.3 Deployment-Idee

1. Statische Assets deployen
2. Functions deployen
3. KV Binding setzen
4. Erstes Laden initialisiert bei leerem KV automatisch mit `templates.json`

---

## 16. Datenstruktur-Referenz

Beispielhafte Struktur:

```json
{
  "id": "root",
  "type": "folder",
  "title": "Root",
  "items": [
    {
      "id": "p-001",
      "type": "prompt",
      "title": "Marketing Hook",
      "content": "Schreibe 10 Hook-Varianten für ..."
    },
    {
      "id": "f-001",
      "type": "folder",
      "title": "Sales",
      "items": []
    },
    {
      "id": "l-001",
      "type": "prompt-link",
      "targetId": "p-001"
    }
  ]
}
```

---

## 17. Praxis-Workflows

### Workflow A: Daily Prompt Production

1. Favoriten-Dock öffnen
2. Prompt oder Ordner-Dropout wählen
3. Inhalt kopieren
4. In KI-Tool einsetzen

### Workflow B: Bibliothek erweitern

1. Add-Menü → Prompt/Ordner erstellen
2. Inhalte formulieren
3. Favorisieren
4. Optional in weitere Pfade verlinken

### Workflow C: Teamkonsistenz

1. Änderungen speichern
2. KV wird aktualisiert
3. Andere Clients laden denselben aktuellen Stand

---

## 18. Kurzfazit

Prompt-Templates ist kein reiner Prompt-Notizblock, sondern eine **vollwertige, cloud-konsistente Prompt-Operationsoberfläche**: strukturiert, editierbar, visuell hochwertig, sofort kopierbar und für hohe Nutzungshäufigkeit optimiert. Die Kombination aus Favoriten-Hub, rekursiven Ordnermechaniken, responsivem UI-System und Cloudflare-KV-Synchronisierung liefert genau den Workflow-Vorteil, der bei intensiver Prompt-Arbeit entscheidend ist.
