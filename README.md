# AI Templates – Vollständige Anwendungsdokumentation

## 1) Zweck der Anwendung
AI Templates ist eine fokusorientierte Prompt- und Ordnerverwaltung für den täglichen Einsatz mit LLMs. Die App kombiniert schnelles Erfassen, Strukturieren, Suchen über visuelle Navigation und sofortiges Kopieren in einem einzigen UI-Flow.

## 2) Kernfunktionen
- Erstellung und Bearbeitung von Prompt-Karten.
- Ordnerhierarchien mit beliebiger Tiefe.
- Prompt-Favoriten mit Schnellzugriff (Dock).
- Kontextmenü-Aktionen (Umbenennen, Verschieben, Löschen, Favorisieren).
- Drag & Drop-Organisation.
- Cloud-Speicherung mit Konflikterkennung und lokaler Fallback-Sicherung.
- Verknüpfungen (Links) auf bestehende Prompts und Ordner direkt über das **+**-Menü.

## 3) Informationsarchitektur
### Datentypen
- `folder`: enthält `items`.
- `prompt`: enthält `title` und `content`.
- `prompt-link`: Verweis auf existierenden Prompt (`targetId`).
- `folder-link`: Verweis auf existierenden Ordner (`targetId`).

### Navigationsmodell
- Root („Home“) als Startpunkt.
- Breadcrumb zur Ebenennavigation.
- Mobile Back-Verhalten inkl. History-State.

## 4) UI-Komponenten im Detail
### Top-Bar
- App-Logo/Home-Return.
- Zurück-Button (kontextsensitiv).
- Organisieren-Button (Edit/Drag Mode).
- Plus-Menü zum Hinzufügen:
  - Neuer Prompt
  - Neuer Ordner
  - Prompt verknüpfen
  - Ordner verknüpfen

### Kartenraster
- Folder-Karten: öffnen Unterordner.
- Prompt-Karten: öffnen Prompt-Modal oder kopieren per Schnellbutton.
- Link-Karten: zeigen Zieltitel mit Präfix `↗` und verhalten sich wie ihr Zieltyp.

### Prompt-Modal
- Lesen/Bearbeiten eines Prompts.
- Speichern, Kopieren, Favorisieren.
- „Neu“-Modus mit Pflichtfeld Titel.

### Folder-Erstellen-Modal
- Schnelles Anlegen mit Titelvalidierung.

### Verknüpfungs-Modal
- Auswahl bestehender Prompts/Ordner.
- Duplikatvermeidung im aktuellen Ordner.
- Persistente Anlage als Link-Karte.

### Benachrichtigungen (Toast)
- Einheitliches Timing/Animation für Erfolg, Info, Fehler.
- Verbesserte Entfernung mit Fallback, damit Toasts zuverlässig verschwinden.

## 5) UX-Designprinzipien
- **Low-friction capture:** Neue Prompts mit minimalen Schritten.
- **Spatial memory:** Karten + Breadcrumbs + feste Home-Rückkehr.
- **Progressive disclosure:** Detailansicht im Modal statt überladener Karten.
- **Safety by feedback:** Sofort-Toast bei jeder persistenten Aktion.
- **Resilience:** Lokaler Cache + Cloud-Sync + Konflikthandling.

## 6) Organisation & Produktivität
- Favoriten-Dock beschleunigt den Zugriff auf wiederkehrende Prompts.
- Kontextmenü unterstützt Pflege großer Bibliotheken.
- Verknüpfungen reduzieren Redundanz und ermöglichen „virtuelle Sammlungen“ ohne Kopieren.

## 7) Zustands- und Speicherlogik
- Primärdaten werden lokal gespiegelt (LocalStorage) und in Cloud (API) persistiert.
- Beim Speichern mit abweichendem `lastUpdated`: Konfliktbehandlung und Cloud-Reload.
- Broadcast-Updates für Multi-Tab-Synchronität.

## 8) Interaktionen & Mikroanimationen
- Hover- und Focus-Rückmeldungen für Karten und Buttons.
- Toast-Enter/Fade-Out-Animationen.
- Modale Übergänge und visuelle Priorisierung durch Layering.

## 9) Barrierefreiheit
- Semantische Buttons mit `aria-label`.
- Fokusführung in Modals.
- Deutliche visuelle Zustände (edit, selected, favorite).

## 10) Fehlerfälle und erwartetes Verhalten
- Leere Titel werden mit Fehler-Toast blockiert.
- Nicht verfügbare Verknüpfungsziele werden im Modal als leerer Zustand angezeigt.
- Ungültige/fehlende Zielknoten bei Links werden defensiv ignoriert.

## 11) Aktueller Stand (funktional)
Die App unterstützt jetzt vollständig:
1. zuverlässiges automatisches Ausblenden des Toasts „Prompt gespeichert!“,
2. Hinzufügen von Verknüpfungen zu bestehenden Prompts,
3. Hinzufügen von Verknüpfungen zu bestehenden Ordnern,
4. konsistente Darstellung und Bedienung dieser Verknüpfungen im Kartenraster.

## 12) Empfehlung für Pflege & Erweiterung
- Optional: Link-Auflösung mit „Broken link“-Badge, falls Ziel gelöscht wurde.
- Optional: Suche/Filter im Verknüpfungs-Modal bei großen Datenmengen.
- Optional: visuelle Badges für Link-Typ (Prompt-Link/Ordner-Link).

