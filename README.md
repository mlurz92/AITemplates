# AITemplates

Eine webbasierte Prompt-Template-Anwendung mit Fokus auf **schnelles Navigieren**, **konsistente Bearbeitung**, **zuverlässige Synchronisierung** und **reibungsloses Kopieren von Inhalten** – sowohl am Desktop als auch mobil.

---

## 1) Zweck der Anwendung

AITemplates ist eine hierarchische Prompt-Bibliothek. Die App löst vier Kernaufgaben:

1. **Prompts strukturiert organisieren** (Ordner + Unterordner + Prompt-Karten).  
2. **Prompts schnell finden und öffnen** (visuelle Karten, Breadcrumb, Favoriten-Dock).  
3. **Prompts direkt nutzen** (1-Klick-Kopieren).  
4. **Daten sicher halten** (lokaler Fallback + Cloud-Sync mit Konflikterkennung).

Das Produkt ist bewusst als „tägliches Arbeitswerkzeug“ gestaltet: wenige Klicks, hohe Lesbarkeit, klare Rückmeldungen, geringe kognitive Last.

---

## 2) Produktumfang auf einen Blick

- **Single-Page-App** mit Karten-UI (`index.html`, `style.css`, `script.js`).
- **Datenmodell als Baumstruktur** in `templates.json` (Ordner + Prompt-Elemente).
- **Serverless API** für Live-Synchronisierung über Cloudflare Pages Functions (`functions/api/templates.js`).
- **PWA-Metadaten** (`manifest.json`, `browserconfig.xml`) für Homescreen/Standalone-Verhalten.
- **Icon-Set** für Favicons und App-Manifest (`icons/*`).

---

## 3) Informationsarchitektur & Datenmodell

### 3.1 Strukturprinzip

Die Daten bestehen aus Knoten mit Typen wie:

- `folder`: enthält `items` (weitere Knoten).
- `prompt`: enthält Prompt-Text (`content`) und Titel (`title`).

Die Root-Struktur liegt in `templates.json` und wird zur Laufzeit in den Anwendungsspeicher geladen.

### 3.2 Zustandsquellen

Die App arbeitet mit mehreren Zustandsquellen:

- **Cloud-Quelle** über `/api/templates` (bevorzugt für Live-Stand).
- **Lokaler Zustand** im Browser (`localStorage`) als Offline-/Fallback-Speicher.
- **Favoritenliste** separat im Browser gespeichert.

### 3.3 Konfliktvermeidung

Beim Speichern sendet der Client einen `lastUpdated`-Wert. Die API validiert, ob auf dem Server inzwischen ein neuerer Zustand liegt. Ist das der Fall, wird ein Konflikt signalisiert (HTTP 409), um unbeabsichtigtes Überschreiben zu vermeiden.

---

## 4) UX-Konzept und Bedienlogik

### 4.1 Hauptlayout

Die UI gliedert sich in:

- **Top-Bar**: Navigation, globale Aktionen, Modi, Systemtoggles.
- **Kartenbereich**: aktuelle Ebene (Ordner/Prompts) als visuelles Grid.
- **Modale Ebenen**: Detailansicht, Bearbeitung, Ordnererstellung, Verschieben.
- **Favoriten-Dock**: Schnellzugriff für markierte Prompts.

### 4.2 Navigationsmodell

- Navigation in Ordner erfolgt klickbasiert über Karten.
- Ein interner Pfadstack erzeugt die **Breadcrumbs**.
- Back-Funktionen (Top-Bar + Fixed-Back) führen stufenweise zurück.
- Ein Logo-Button bringt die Nutzerin/den Nutzer zur Startebene.

### 4.3 Interaktionsgeschwindigkeit

Die App nutzt direkte UI-Antworten (State-Updates + visuelles Feedback), damit Interaktionen sofort „spürbar“ sind:

- Karten reagieren auf Hover/Touch.
- Modale Aktionen sind klar priorisiert (Kopieren, Bearbeiten, Speichern, Schließen).
- Kontextmenüs bündeln Sekundäraktionen ohne die Hauptoberfläche zu überladen.

---

## 5) Detaillierte UI-/UX-Elemente

### 5.1 Top-Bar-Elemente

Die Top-Bar enthält (kontextabhängig) u. a.:

- Zurück-Button.
- Breadcrumb-Navigation.
- Organisieren-Toggle (inkl. Abschlusssymbol).
- Hinzufügen-Menü (Prompt / Ordner).
- Reset und Download (situativ sichtbar).
- Speicherquellen-Toggle („Cloud Live“).
- Favoriten-Reset.
- Vollbild-Toggle (Enter/Exit).
- App-Logo-Button.

**UX-Rationale:** Globale, häufig genutzte Aktionen bleiben konstant erreichbar; destruktive bzw. seltene Aktionen werden visuell zurückhaltender präsentiert.

### 5.2 Karten

Karten sind die zentrale Arbeitseinheit:

- **Prompt-Karten** öffnen den Inhalt im Modal.
- **Ordner-Karten** wechseln in die nächste Ebene.
- **Edit-Mode** verändert Interaktionsverhalten (Sortieren/Verschieben statt reinem Lesen).

### 5.3 Prompt-Modal

Das Prompt-Modal vereint die Kern-Workflows:

- Volltext lesen.
- Favorisieren/Entfavorisieren.
- Bearbeitungsmodus aktivieren.
- Änderungen speichern.
- Inhalt kopieren.
- Modal schließen.

**UX-Rationale:** Primäre Aktionen sind im selben Kontext gebündelt, um Wechselkosten zu minimieren.

### 5.4 Zusatzmodale

- **Ordner anlegen** (Name erfassen, Erstellen/Abbrechen).
- **Element verschieben** (Ordnerbaum anzeigen, Ziel wählen, bestätigen/abbrechen).

### 5.5 Kontextmenü

Das Kontextmenü (rechte Maustaste / Long Press) kapselt Verwaltungsaktionen:

- Favorit umschalten.
- Umbenennen.
- Verschieben.
- Löschen.

Sichtbarkeit einzelner Menüpunkte hängt vom Elementtyp ab (Prompt/Ordner/Favoriten-Chip).

### 5.6 Favoriten-Dock

Das Dock bietet schnellen Zugriff auf häufige Inhalte:

- Ein-/Ausklappen.
- Scrollbarer Bereich mit Favoriten-Chips.
- Layoutanpassungen für unterschiedliche Breiten.
- Touch-/Gestenunterstützung für mobile Nutzung.

### 5.7 Benachrichtigungen

Kurzlebige Notifications kommunizieren Ergebniszustände wie:

- Kopieren erfolgreich/fehlgeschlagen.
- Speichern erfolgreich.
- Konflikte oder Validierungsprobleme.

---

## 6) Visuelles Designsystem

### 6.1 Ästhetik

Die App nutzt einen dunklen, kontrastreichen „Aurora“-Look:

- Mehrschichtiger Hintergrund.
- Leuchtende Akzente für Interaktionspunkte.
- Glasartige Oberflächen (Blur + transparente Layer).

### 6.2 Motion-Design

Eingesetzte Bewegungsebenen:

- Hintergrund-Aurora-Animation.
- Card-Tilt/Micro-Interactions.
- weiche Übergänge bei Zustandswechseln.
- FLIP-basierte Layout-Animationen (wo verfügbar).

### 6.3 Accessibility & Motion Preferences

- `prefers-reduced-motion` wird respektiert.
- Bedienelemente besitzen `aria-label` und semantische Rollen.
- Fokuszustände und visuelle Hervorhebungen sind vorgesehen.

---

## 7) Datenhaltung, Persistenz und Sync

### 7.1 Lokal

Im Browser werden u. a. gespeichert:

- Template-Datenstand (lokaler Cache).
- Favoritenliste.
- Sync-Metadaten (z. B. Zeitstempel).

### 7.2 Cloud

`functions/api/templates.js` implementiert:

- `GET /api/templates`: liest den aktuellen Datensatz aus KV; initialisiert bei leerem KV mit `templates.json`.
- `POST /api/templates`: schreibt neue Datenstände inkl. Konfliktcheck gegen ältere Client-Stände.

### 7.3 Realtime-/Polling-Verhalten

Die Anwendung enthält Mechanik für wiederkehrende Synchronisierung und interne Broadcast-Kommunikation zwischen Tabs, damit Zustände konsistent bleiben.

---

## 8) Feature-Workflows (End-to-End)

### 8.1 Prompt öffnen und kopieren

1. Prompt-Karte auswählen.  
2. Modal öffnet mit Inhalt.  
3. Copy-Button ausführen.  
4. Feedback erscheint über Notification.

### 8.2 Prompt bearbeiten

1. Prompt öffnen.  
2. Bearbeiten aktivieren.  
3. Text/Titel anpassen.  
4. Speichern.  
5. Lokaler Zustand + Cloud-Stand werden aktualisiert.

### 8.3 Ordner erstellen

1. Add-Menü öffnen.  
2. „Neuer Ordner“.  
3. Name eingeben.  
4. Speichern.  
5. Karte erscheint in aktueller Ebene.

### 8.4 Elemente neu anordnen

1. Organisieren-Modus aktivieren.  
2. Drag-and-Drop verwenden.  
3. Reihenfolge/Ziel aktualisieren.  
4. Modus abschließen.

### 8.5 Favoriten nutzen

1. Prompt favorisieren (Modal/Kontextmenü).  
2. Favoriten-Dock zeigt Eintrag.  
3. Schnellzugriff aus Dock ohne erneute Navigation.

---

## 9) Dateistruktur (aktueller Stand)

```text
.
├─ index.html
├─ style.css
├─ script.js
├─ templates.json
├─ manifest.json
├─ browserconfig.xml
├─ functions/
│  └─ api/
│     └─ templates.js
└─ icons/
   ├─ apple-touch-icon.png
   ├─ favicon-96x96.png
   ├─ favicon.ico
   ├─ favicon.svg
   ├─ web-app-manifest-192x192.png
   └─ web-app-manifest-512x512.png
```

---

## 10) Technische Integrationen

### 10.1 Clientseitig

- Vanilla JavaScript für State und DOM-Orchestrierung.
- Externe Bibliotheken via CDN (in `index.html` eingebunden):
  - Vivus (SVG-Animationen)
  - SortableJS (Drag-and-Drop)
  - GSAP + Flip (Animation/FLIP-Transitions)

### 10.2 Plattformseitig

- Cloudflare Pages Functions für API-Logik.
- Cloudflare KV für persistente Datenspeicherung.

---

## 11) Qualität, Robustheit und Fehlertoleranz

- Fallback bei fehlender Cloud-Erreichbarkeit auf lokale Daten.
- Defensive Prüfungen in der API (z. B. fehlender KV-Binding).
- Konflikterkennung schützt gegen Datenverlust bei paralleler Bearbeitung.
- UI-Feedback informiert über Erfolgs-/Fehlerzustände.

---

## 12) PWA- und Geräteverhalten

- Manifest definiert Name, Farben, Start-URL und Icons.
- Apple-/Windows-Metadaten sind gesetzt.
- Safe-Area-Insets werden für mobile Vollbildumgebungen berücksichtigt.
- Vollbildmodus ist per UI steuerbar.

---

## 13) Performance-Orientierung

- Animationen sind auf weiche Darstellung optimiert.
- Sichtbarkeits-/Motion-Mechaniken reduzieren unnötige Laufzeitkosten.
- Karten-/Dock-Layout berücksichtigt responsive Breiten.

---

## 14) Bedienphilosophie (UX-Fazit)

AITemplates ist als produktives Prompt-Cockpit ausgelegt:

- **Schnell** durch direkte Aktionen.  
- **Sicher** durch Konfliktkontrolle und Fallbacks.  
- **Klar** durch konsistente Oberflächenstruktur.  
- **Angenehm** durch zurückhaltend-edles, aber funktionales Motion-/Visual-Design.

So bleibt die Anwendung auch bei wachsendem Prompt-Bestand übersichtlich, effizient und alltagstauglich.
