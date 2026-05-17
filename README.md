# Prompt-Templates

Eine progressive Web-App (PWA) für das strukturierte Sammeln, Navigieren, Bearbeiten, Verknüpfen, Favorisieren und ultraschnelle Kopieren von Prompt-Bausteinen in verschachtelten Ordnerstrukturen.

---

## 1) Zielbild der Anwendung

Prompt-Templates ist darauf ausgelegt, große Prompt-Bibliotheken effizient bedienbar zu machen. Die App kombiniert:

- **Ordnerbasierte Informationsarchitektur** für thematische Ordnung.
- **Direktzugriff über Favoriten-Dock** mit Ein-Klick-Kopie.
- **Bearbeitungs- und Organisationswerkzeuge** direkt in der Oberfläche (Rename, Move, Delete, Links).
- **Synchronisationsoptionen** zwischen lokalem Zustand und Cloudflare-KV-gestützter Live-Datenhaltung.
- **Glasmorphisches, animiertes UI** mit Fokus auf Lesbarkeit, Touch-Komfort und visueller Orientierung.

Kurz: Die Anwendung ist ein High-Speed Prompt-Cockpit, in dem Suchen durch Navigieren + Favorisieren ersetzt oder stark reduziert wird.

---

## 2) Kernfunktionen im Überblick

### 2.1 Datenmodell
- **`prompt`**: Titel + Volltextinhalt; kopierbar per Karte, Modal und Favoriten-Dock.
- **`folder`**: Enthält `children` (Prompts, Ordner, ggf. Links).
- **Verknüpfungselemente**: Prompt- oder Ordner-Links für kuratierte Querverweise.

### 2.2 Navigation
- Breadcrumb-Navigation in der Top-Bar.
- Zurück-Buttons (Top-Bar + fixer Back-Button) für schnelle Ebenenwechsel.
- Direktes Öffnen von Ordnerkarten.

### 2.3 Prompt-Kopie
- **Kartenebene**: Kopieren direkt aus der Grid-Ansicht.
- **Modalebene**: Kopieren aus Detailansicht.
- **Favoriten-Dock**: Ein Klick auf Prompt-Favorit kopiert sofort.
- **Fallback-Support** für Clipboard-Zugriff (moderne API + Legacy-`execCommand`).

### 2.4 Favoriten-Dock (Bottom Quick Access)
- Sichtbar, sobald Favoriten existieren.
- Horizontaler, responsiver Chip-Stream mit adaptiven Höhen-/Breitenmechanismen.
- Expand/Collapse-Mechanik inkl. Overflow-Indikatoren, Scrollbar-Reveal und Touch-Gesten.
- Kontextmenü-Support (inkl. Favorit umschalten).

### 2.5 **Neu: Hover-Aufklappmenü für Favoriten-Ordner**
Wenn ein **Ordner** in der Favoritenleiste liegt:
- Bei **Mouse-Over** (oder Fokus per Tastatur) erscheint oberhalb des Chips ein sanft animiertes Zusatzmenü.
- Dieses Menü listet die im Ordner enthaltenen Prompts listenartig auf (rekursiv aus Unterordnern gesammelt).
- Ein Klick auf einen Eintrag kopiert den Prompt-Inhalt direkt in die Zwischenablage.
- Verlässt der Fokus/Pointer den Bereich, klappt das Menü wieder ein.
- Die Standardfunktion des Ordner-Chips (Ordner öffnen per Klick) bleibt erhalten.

### 2.6 CRUD & Organisation
- Neue Prompts erstellen.
- Neue Ordner erstellen.
- Umbenennen von Karten.
- Löschen von Prompts/Ordnern.
- Verschieben via Move-Dialog.
- Organize-Modus mit Sortier-/Anordnungsworkflow.

### 2.7 JSON Import/Export
- Download des aktuellen Datenbestands als JSON.
- Upload neuer JSON-Datei via Datei-Dialog oder Drop-Zone.

### 2.8 Synchronisation
- Live-Modus über Server-Endpunkt (`functions/api/templates.js`) mit Zeitstempelabgleich.
- Lokale Persistenz inkl. Favoriten im `localStorage`.
- UI-Status für aktive Storage-Quelle.

### 2.9 UX-Feinschliff
- Benachrichtigungssystem für Aktionen und Feedback.
- Kontextmenüs für schnellere Sekundäraktionen.
- Touch-spezifische Bedienpfade.
- Motion-Handling inkl. Reduced-Motion-Pfade.
- Fullscreen-Option, responsive Safe-Area-Strategie und mobile Viewport-Offsets.

---

## 3) UI-/UX-Philosophie im Detail

### 3.1 Bediengeschwindigkeit vor Klicktiefe
Die App reduziert Kontextwechsel: häufige Aufgaben (Kopie, Navigation, Favoritenzugriff) sind mit minimaler Interaktion erreichbar.

### 3.2 Visuelle Hierarchie
- Header als persistenter Kontrollraum.
- Karten-Grid als Primärarbeitsfläche.
- Favoriten-Dock als sekundärer, aber permanent erreichbarer Schnellkanal.

### 3.3 Motion mit Funktion statt Deko
Animationen signalisieren Zustandswechsel (enter/copy-success/expand) und verbessern Orientierung. Bei Nutzerwunsch wird Bewegung reduziert.

### 3.4 Hover-Folder-Menü als Mikro-Informationsarchitektur
Die neue Hover-Liste adressiert einen realen Workflow: „Ordner merken, Prompt ohne Ordnerwechsel kopieren“. Damit bleibt die Struktur tief, der Zugriff aber flach.

---

## 4) Technische Architektur

## 4.1 Frontend-Schichten
- **`index.html`**: Struktur, Modals, Dock, Top-Bar, SVG-Templates.
- **`style.css`**: Designsystem, Layout, States, Animationen, responsive Regeln.
- **`script.js`**: Datenlogik, Rendering, Eventing, Clipboard, Navigation, Sync, UI-State.

## 4.2 Backend-/API-Schicht
- **`functions/api/templates.js`**: API-Entry für Template-Daten (Cloudflare-Functions-Kontext).

## 4.3 Datenquellen
- **`templates.json`** als lokale Basisdaten.
- Cloud-Storage-Flow mit Polling/Sync-Timestamp.

---

## 5) Neue Implementierung: Favoriten-Ordner Hover-Menü

### 5.1 Logik
- Neue rekursive Sammelfunktion für Prompts aus Ordnern.
- Beim Rendern jedes Favoriten-Chips wird bei `folder` ein Menü erzeugt, sofern Prompts vorhanden sind.
- Menüeinträge sind Buttons; Klick stoppt Event-Bubbling und löst Copy-Flow aus.

### 5.2 Interaktionsregeln
- Sichtbar nur auf `:hover`, `:focus-visible`, `:focus-within` des jeweiligen Ordner-Chips.
- Default-Zustand: unsichtbar, pointer-inert, leicht versetzt.
- Aktivzustand: opacity/transform animiert, pointer-events aktiv.

### 5.3 Ergebnis
- Schnelleres Arbeiten aus dem Favoriten-Dock.
- Kein erzwungener Navigationswechsel zum Kopieren von Unterelementen.
- Saubere Tastaturbedienbarkeit via Fokuszuständen.

---

## 6) Komponenteninventar (vollständig)

- **Top-Bar**: Back, Breadcrumb, Organize, Add-Menü, Reset, JSON-Menü, Storage-Source-Toggle, Favorites-Clear, Fullscreen, App-Logo/Home.
- **Cards Container**: Prompt-/Ordnerkarten inkl. Aktionsbuttons.
- **Prompt-Modal**: Anzeigen, Kopieren, Bearbeiten/Speichern, Favorisieren, Schließen.
- **Create-Folder-Modal**.
- **Link-Item-Modal** (Prompt-/Ordner-Verknüpfungen).
- **Move-Item-Modal**.
- **Upload-JSON-Modal** mit Drop-Zone.
- **Context-Menu-System** für Karten/Favoriten.
- **Favorites Dock**: Toggle, Scroll-Area, Chips, Hover-Folder-Menü.
- **Notification Area**.
- **Aurora-/Particle-/Glow-/Tilt-Visual-Systeme**.

---

## 7) Bedienabläufe (typische Journeys)

1. **Prompt öffnen und kopieren**: Karte klicken → Modal → Copy.
2. **Sofortkopie via Favoriten**: Favorit-Prompt im Dock klicken.
3. **Ordnerfavorit mit Hover-Liste**: Maus auf Favoriten-Ordner → gewünschte Prompt-Zeile klicken → Inhalt kopiert.
4. **Strukturpflege**: Organize + Kontextmenü (Move/Rename/Delete).
5. **Datenpflege**: JSON importieren/exportieren.
6. **Geräteoptimierung**: Fullscreen, Touch-Gesten, reduzierte Motion je Präferenz.

---

## 8) Setup & Betrieb

### 8.1 Lokal starten
Da es sich um eine statische Frontend-Anwendung mit optionaler Functions-Integration handelt, genügt ein lokaler Static-Server (z. B. via VSCode Live Server oder beliebiger HTTP-Server).

### 8.2 Deployment
- Frontend-Dateien deployen.
- Bei Cloud-Sync den Functions-Endpunkt und KV-Bindings korrekt konfigurieren.
- Manifest/Icons für PWA unverändert mit ausrollen.

---

## 9) Accessibility & Robustheit

- Aria-Labels für zentrale Bedienelemente.
- Fokuszustände und Tastaturzugänglichkeit für interaktive Controls.
- Reduced-Motion-Strategien.
- Defensive Fallbacks für Clipboard-Funktionen.

---

## 10) Design-Tokens & visuelle Sprache

- Dunkles Aurora-Farbsystem mit klaren Kontrasten.
- Glas-/Glow-Layering für Tiefenwirkung.
- Semantische Aktionsfarben (Favorit/Löschen/Edit/Move).
- Konsistente Radius-, Schatten- und Übergangssystematik.

---

## 11) Dateien im Projekt

- `index.html`
- `style.css`
- `script.js`
- `templates.json`
- `functions/api/templates.js`
- `manifest.json`
- `browserconfig.xml`
- `icons/*`

---

## 12) Zusammenfassung

Die Anwendung liefert eine vollständig auf Prompt-Operations optimierte UX: strukturierte Ablage, blitzschnelles Kopieren, starke Favoriten-Mechanik und kontrollierbare Datenhaltung. Mit dem neuen Hover-Aufklappmenü für Favoriten-Ordner wird die Bedienung nochmals verdichtet: Inhalte tiefer Strukturen sind direkt erreichbar, ohne den Navigationskontext zu verlassen.
