# Prompt-Templates

Prompt-Templates ist eine progressive Web-App (PWA) für Teams und Einzelanwender:innen, die große Prompt-Sammlungen nicht nur speichern, sondern **operativ schnell benutzen, strukturieren, umorganisieren und synchron halten** möchten. Die Anwendung verbindet ein visuell ruhiges, hochwertiges Interface mit sehr direkter Interaktion: kurze Wege, klare Zustände, sofortiges Feedback, robuste Datenhaltung.

---

## Inhaltsverzeichnis

1. [Produktidee & Kernnutzen](#1-produktidee--kernnutzen)
2. [Anwendungsfälle (Praxisperspektive)](#2-anwendungsfälle-praxisperspektive)
3. [Domänenmodell & Datenstruktur](#3-domänenmodell--datenstruktur)
4. [Informationsarchitektur & Navigation](#4-informationsarchitektur--navigation)
5. [UI-System im Detail](#5-ui-system-im-detail)
6. [Favoritenleiste (Dock) – Verhaltensmodell](#6-favoritenleiste-dock--verhaltensmodell)
7. [Neu: Favoriten-Ordner mit Hover/Touch-Aufklappmenü](#7-neu-favoriten-ordner-mit-hovertouch-aufklappmenü)
8. [Prompt-Lebenszyklus (Erstellen bis Kopieren)](#8-prompt-lebenszyklus-erstellen-bis-kopieren)
9. [Bearbeiten, Organisieren, Verknüpfen](#9-bearbeiten-organisieren-verknüpfen)
10. [Import/Export & Persistenz](#10-importexport--persistenz)
11. [Cloud-Sync & Laufzeitkonsistenz](#11-cloud-sync--laufzeitkonsistenz)
12. [Interaktion, Gesten, Motion & Feedback](#12-interaktion-gesten-motion--feedback)
13. [Accessibility & Resilienz](#13-accessibility--resilienz)
14. [Design-Philosophie (Look & Feel)](#14-design-philosophie-look--feel)
15. [Technische Architektur](#15-technische-architektur)
16. [Dateiübersicht](#16-dateiübersicht)
17. [Betrieb, lokale Entwicklung, Deployment](#17-betrieb-lokale-entwicklung-deployment)
18. [Zusammenfassung](#18-zusammenfassung)

---

## 1. Produktidee & Kernnutzen

Die App löst ein typisches Produktivitätsproblem: Prompt-Sammlungen wachsen schnell, aber das Wiederfinden und Wiederverwenden kostet überproportional viel Zeit. Prompt-Templates reduziert diese Reibung durch:

- **Hierarchische Ordnung** (Ordner/Unterordner) für semantische Struktur.
- **Direkten Zugriff** über Favoriten für High-Frequency-Prompts.
- **Sofortkopie** aus mehreren Interaktionspunkten.
- **Bearbeitbarkeit im laufenden Betrieb** ohne Toolwechsel.
- **Cloud-/Local-Hybridpersistenz** mit Realtime-Sync-Mechanik.

Leitprinzip: **Maximale Arbeitsgeschwindigkeit bei minimaler kognitiver Last**.

---

## 2. Anwendungsfälle (Praxisperspektive)

- AI-Workflow für Content-Teams (Briefing-, Struktur-, Rewrite-, SEO- und QA-Prompts).
- Entwicklungsteams mit wiederkehrenden Debug-, Review-, Refactor- oder Architekturprompts.
- Beratung/Agentur-Setups mit kundenspezifischen Prompt-Sets.
- Persönliche Wissenssammlung mit schnell kopierbaren Bausteinen.

Zentral ist immer derselbe Hebel: **Prompt finden → prompt kopieren → direkt nutzen**.

---

## 3. Domänenmodell & Datenstruktur

### 3.1 Elementtypen

- **`prompt`**
  - Eigenschaften: `id`, `title`, `content`
  - Verhalten: anzeigen, bearbeiten, kopieren, favorisieren, verschieben, verlinken

- **`folder`**
  - Eigenschaften: `id`, `title`, `items[]`
  - Verhalten: navigieren, strukturieren, favorisieren, verschieben, verlinken

- **`prompt-link` / `folder-link`**
  - Eigenschaften: `id`, `targetId`, `title`
  - Verhalten: referenziert vorhandene Knoten statt Duplikate

### 3.2 Graph-Auflösung

Verknüpfte Elemente werden über Ziel-IDs aufgelöst. Damit bleibt die Quelle eindeutig, und Änderungen am Original propagieren logisch in alle Verweise.

### 3.3 Favoritenmodell

Favoriten sind als ID-Liste (`favoritePrompts`) gespeichert. Zulässig sind Prompt- und Ordner-IDs. Beim Rendern werden ungültige/verwaiste IDs bereinigt.

---

## 4. Informationsarchitektur & Navigation

- Root-Ebene als Einstieg in die gesamte Bibliothek.
- Breadcrumb-Navigation für Positionsklarheit.
- Rücknavigation (Topbar + Fixed Back) für schnelle Ebenenwechsel.
- App-Logo als deterministische Rückkehr zur Startansicht.

Die Navigation ist bewusst **strukturerhaltend**: Der Nutzer bleibt im mentalen Modell eines Dateisystems.

---

## 5. UI-System im Detail

### 5.1 Top-Bar als Control Center

Enthält zentrale Aktionen:
- Zurück
- Breadcrumb
- Organize-Modus
- Add-Menü (Prompt, Ordner, Links)
- JSON-Menü (Download/Upload)
- Reset lokaler Cache
- Cloud-Quellenindikator
- Favoriten leeren
- Fullscreen
- Home über App-Logo

### 5.2 Kartenfläche (Grid)

- Responsives Kartensystem für Prompts/Ordner.
- Direkte Kontextaktionen via Kontextmenü und Organisationsmodus.
- Visuelle Rückmeldung bei Interaktion (Hover, Focus, Drag, Copy).

### 5.3 Modals

- Prompt-Modal (Lesen/Bearbeiten/Speichern/Favorisieren/Kopieren).
- Ordner-Erstellung.
- Verknüpfungsdialoge.
- Move-Dialog.
- Upload-Dialog mit Drop-Zone.

### 5.4 Notifications

Jede relevante Aktion erzeugt klares Feedback (Erfolg/Info/Fehler), inkl. Auto-Dismiss und Übergangsanimation.

---

## 6. Favoritenleiste (Dock) – Verhaltensmodell

Das Dock ist der produktive Schnellzugriff:

- Sichtbar nur, wenn Favoriten existieren.
- Chips mit adaptiver Breite/Höhe abhängig von Viewport und Anzahl.
- Overflow-Indikatoren, Scrollbereich, Expand/Collapse.
- Touch-/Wheel-Handling für natürliche horizontale Bewegung.
- Kontextmenüfähig.

Jeder Chip enthält:
- Badge (Initial)
- Titel
- optionalen Prompt-Preview-Text
- Farb-/Glow-Akzent über vordefinierte Accent-Palette

---

## 7. Neu: Favoriten-Ordner mit Hover/Touch-Aufklappmenü

Dieses Verhalten ist jetzt gezielt für Ordner-Favoriten umgesetzt.

### 7.1 Ziel

Wenn ein Ordner in der Favoritenleiste liegt, soll ein schneller Zugriff auf enthaltene Promptkarten möglich sein, **ohne den Ordner zuerst zu öffnen**.

### 7.2 Öffnen (Desktop / Maus / Fokus)

- **Mouse Over (`mouseenter`)** auf den Ordner-Chip öffnet ein Aufklappmenü oberhalb des Chips.
- **Keyboard-Fokus (`focusin`)** öffnet das Menü ebenfalls.
- Menüeinträge erscheinen gestaffelt animiert und bleiben logisch im Chip-Kontext.

### 7.3 Schließen (Desktop)

- **Mouse Leave (`mouseleave`)** schließt verzögert (kurzer Intent-Delay), damit kleine Zeigerbewegungen nicht sofort „abbrechen“.
- **Focus Out (`focusout`)** schließt, sobald Fokus den Chip-/Menübereich verlässt.
- Klick außerhalb schließt global zuverlässig.

### 7.4 Touch-Verhalten (Mobile/Tablets)

- Touch-ähnliche Eingaben behandeln den Ordner-Chip als Toggle:
  - erster Tap öffnet/schließt das Aufklappmenü,
  - weiterer Tap auf einen Eintrag kopiert den Prompt.
- Das Verhalten entspricht klassischen Touch-Erwartungen: explizites Öffnen, dann gezielte Auswahl.

### 7.5 Listeninhalt

- Die Liste zeigt Prompt-Titel aus dem Ordner **rekursiv** (inkl. Unterordner, mit Schutz gegen Zyklen via `seen`-Set).
- Jeder Eintrag ist ein klickbares Button-Element.
- Klick auf Eintrag:
  1. Prompt-Inhalt wird in Zwischenablage kopiert,
  2. Erfolg wird visuell/haptisch bestätigt,
  3. Menü wird geschlossen.

### 7.6 UX-Effekt

- Drastisch weniger Navigationssprünge für häufige Unterprompts.
- Favoritenordner werden zu „Micro-Launchern“ für Prompt-Sets.
- Maus- und Touch-Logik bleiben konsistent mit Plattformkonventionen.

---

## 8. Prompt-Lebenszyklus (Erstellen bis Kopieren)

1. Prompt anlegen (Add-Menü).
2. Titel/Inhalt definieren.
3. In Ordnerstruktur einordnen.
4. Optional favorisieren.
5. Später über Karte, Modal oder Favoritenchip kopieren.
6. Bei Bedarf bearbeiten/verschieben/verknüpfen.

Die Anwendung unterstützt diesen Zyklus ohne Medienbruch.

---

## 9. Bearbeiten, Organisieren, Verknüpfen

- **Umbenennen** direkt über UI-Flows.
- **Verschieben** über dedizierten Zielordnerdialog.
- **Löschen** mit expliziten Schutzabfragen.
- **Organize-Modus** inkl. Sortierung und strukturierter Reorder-Logik.
- **Verknüpfungen** erlauben kuratierte Querverbindungen ohne Datenkopie.

---

## 10. Import/Export & Persistenz

- **Download JSON** exportiert den aktuellen Stand.
- **Upload JSON** importiert über Dateiauswahl oder Drag-and-Drop.
- Lokale Daten und Favoriten liegen in `localStorage`.

Die App bietet damit sowohl einfache Sicherung als auch schnelle Migration.

---

## 11. Cloud-Sync & Laufzeitkonsistenz

- Cloudflare-KV-basierte Datenquelle via Functions-Endpunkt.
- Zeitstempelgestütztes Sync-Verhalten zur Konfliktreduktion.
- Re-Sync bei Fokus/Visibility-Wechsel.
- Lokaler Cache kann gezielt verworfen und aus Cloud neu geladen werden.

---

## 12. Interaktion, Gesten, Motion & Feedback

- Hover-, Focus-, Active-Zustände entlang aller primären Controls.
- Touch-Gesten im Favoritenbereich (u. a. Expand/Collapse-Intention).
- Aurora-, Sparkle-, Glow- und Tilt-Effekte mit `prefers-reduced-motion`-Rücksicht.
- Copy-Feedback visuell + (mobil) optional haptisch per Vibration.

---

## 13. Accessibility & Resilienz

- Aria-Labels für wichtige Bedienelemente.
- Fokusbasierte Nutzbarkeit zentraler Aktionen.
- Reduced-Motion-Unterstützung.
- Clipboard-Fallback (`execCommand`) für ältere/limitierte Umgebungen.
- Defensive Behandlung ungültiger Favoriten-/Linkzustände.

---

## 14. Design-Philosophie (Look & Feel)

- Dunkles Aurora-Farbsystem für ruhige Langnutzung.
- Glassmorphism-Layer für räumliche Tiefe.
- Semantische Aktionsfarben (Favorit/Move/Edit/Delete).
- Mikroanimationen zur Statuskommunikation statt reiner Dekoration.

Designziel: **Premium-Haptik mit klarer Funktionalität**.

---

## 15. Technische Architektur

### Frontend
- `index.html`: semantische Grundstruktur, Modals, Dock, SVG-Templates.
- `style.css`: Tokens, Layout, States, Animationen, responsive Regeln.
- `script.js`: State, Rendering, Eventing, Clipboard, Sync, Navigation, Gesten.

### Backend/Functions
- `functions/api/templates.js`: API-Zugriff für Datenquelle/Sync.

### Statische Konfiguration
- `templates.json`, `manifest.json`, `browserconfig.xml`, `icons/*`.

---

## 16. Dateiübersicht

- `index.html`
- `style.css`
- `script.js`
- `templates.json`
- `functions/api/templates.js`
- `manifest.json`
- `browserconfig.xml`
- `icons/*`

---

## 17. Betrieb, lokale Entwicklung, Deployment

### Lokal
App über statischen HTTP-Server starten (z. B. lokale Dev-Server-Lösung).

### Deployment
- Frontend-Dateien ausrollen.
- Functions-Endpunkt bereitstellen.
- KV-Bindings/Umgebungsvariablen korrekt setzen.
- PWA-Artefakte (`manifest`, Icons) mitdeployen.

---

## 18. Zusammenfassung

Prompt-Templates ist eine durchdachte, auf Geschwindigkeit optimierte Prompt-Operations-App: strukturierte Ablage, starke Favoritenmechanik, robuste Bearbeitungs- und Sync-Funktionen, sauberes visuelles Feedback. 

Mit dem erweiterten Favoriten-Ordner-Verhalten (Hover/Focus/Tap-Aufklappen mit direkter Eintragskopie) wird die letzte häufige Reibung im Alltag eliminiert: **Prompts aus tiefen Ordnern sind jetzt aus der Favoritenleiste direkt kopierbar – plattformlogisch für Maus und Touch.**
