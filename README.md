# AITemplates

AITemplates ist eine moderne, browserbasierte Prompt- und Ordnerverwaltung als Single-Page-App (SPA) mit Fokus auf schnelle Wiederverwendung, saubere Strukturierung und hochwertige Interaktion über Desktop, Tablet und Smartphone.

Diese README beschreibt den **aktuellen vollständigen Stand** der Anwendung inkl. UI, UX, Datenmodell, Interaktionslogik, Synchronisation, Betriebsmodus und technischer Architektur.

---

## Inhaltsverzeichnis

1. [Produktziel](#produktziel)
2. [Kernfunktionen auf einen Blick](#kernfunktionen-auf-einen-blick)
3. [Informationsarchitektur](#informationsarchitektur)
4. [Datenmodell](#datenmodell)
5. [Anwendungsaufbau (UI)](#anwendungsaufbau-ui)
6. [Interaktionsmodell (UX)](#interaktionsmodell-ux)
7. [Organize-Modus & Drag-and-Drop-Regeln](#organize-modus--drag-and-drop-regeln)
8. [Modale Dialoge](#modale-dialoge)
9. [Favoriten-Dock](#favoriten-dock)
10. [Persistenz, Cloud-Sync und Konfliktverhalten](#persistenz-cloud-sync-und-konfliktverhalten)
11. [Responsive Verhalten und Geräteklassen](#responsive-verhalten-und-ger%C3%A4teklassen)
12. [Animation, Motion und visuelle Qualität](#animation-motion-und-visuelle-qualit%C3%A4t)
13. [Accessibility und Bedienergonomie](#accessibility-und-bedienergonomie)
14. [Dateiübersicht](#datei%C3%BCbersicht)
15. [Technologiestack](#technologiestack)
16. [Lokale Entwicklung und Betrieb](#lokale-entwicklung-und-betrieb)
17. [Qualitätsaspekte & bekannte Grenzen](#qualit%C3%A4tsaspekte--bekannte-grenzen)
18. [Erweiterungsideen](#erweiterungsideen)

---

## Produktziel

Die Anwendung löst ein praktisches Problem: wiederkehrende Prompts sollen schnell auffindbar, logisch gruppiert, zügig kopierbar und ohne Reibung veränderbar sein. Das geschieht über ein card-basiertes Interface mit Ordnern, Favoriten-Schnellzugriff und einem dedizierten Organize-Modus.

### Leitprinzipien

- **Direkte Manipulation:** Inhalte direkt über Karten bedienen.
- **Schneller Zugriff:** Favoriten und klare Navigation reduzieren Klickwege.
- **Robuste Datenhaltung:** Cloud-primär mit lokalem Sicherheitsnetz.
- **Konsistente Interaktion:** Gleiches Verhalten über Viewports und Geräteklassen.

---

## Kernfunktionen auf einen Blick

- Hierarchische Verwaltung von Prompt- und Ordnerkarten.
- Breadcrumb-Navigation mit Zurück-Logik.
- Prompt-Modal mit Lesen, Bearbeiten, Speichern und Kopieren.
- Kontextmenü für Umbenennen, Verschieben, Löschen und Favorisieren.
- Organize-Modus mit Drag-and-Drop, inkl. kombinierender Kartenlogik.
- Favoriten-Dock als permanente Schnellzugriffsebene.
- Vollbildmodus, Export, Reset und visuelle Status-/Toastmeldungen.
- Live-Synchronisation mit Cloudflare-KV-Backend plus lokaler Fallback-Strategie.

---

## Informationsarchitektur

Die App arbeitet als Baum:

- **Root-Ordner** als Einstieg.
- **Folder-Knoten** mit `items` (weitere Folder oder Prompts).
- **Prompt-Knoten** mit Inhalt und Titel.

Navigationszustand:

- `currentNode`: aktueller Ordnerkontext.
- `pathStack`: geöffneter Pfad für Breadcrumb/Back.

So bleibt die Struktur auch bei tiefen Ebenen klar und kontrollierbar.

---

## Datenmodell

Jeder Knoten besitzt eine ID und einen Typ:

- `type: "folder"` → enthält `items: []`
- `type: "prompt"` → enthält Prompt-Inhalt (Text) und Titel

Zusätzliche Zustandsdaten:

- Favoritenliste über Prompt-IDs.
- Zeitstempel für Cloud-Sync-Konsistenz.
- UI-Zustände (z. B. edit-mode, Modal sichtbar, Dock expandiert).

---

## Anwendungsaufbau (UI)

### 1) Hintergrund- und Ambient-Ebene

- Aurora-Verläufe mit subtiler Bewegung.
- Fokus auf Tiefe/Atmosphäre ohne Lesbarkeit zu beeinträchtigen.

### 2) Top-Bar

Steuerzentrale mit:

- Zurück-Button
- Breadcrumb
- Organize-Toggle
- Add-Menü (Prompt/Ordner)
- Reset / Download
- Storage-Status-Button
- Favoriten löschen
- Fullscreen
- App-Logo (Home)

### 3) Kartenbereich (`cards-container`)

- Responsives Grid.
- Einheitliche Kartenästhetik, unterschiedliche Semantik:
  - Folder-Karten mit Ordner-Icon
  - Prompt-Karten mit Aktionselementen

### 4) Modale Ebene

- Prompt-Modal
- Ordner-Erstellen-Modal
- Move-Dialog
- Benachrichtigungsbereich
- Kontextmenü

### 5) Favoriten-Dock

- Unten angedockte Schnellzugriffsebene.
- Kollabier-/expandierbar mit adaptiver Layoutlogik.

---

## Interaktionsmodell (UX)

- **Click-to-open:** Folder öffnen, Prompt im Modal zeigen.
- **Kontextmenüs:** Sekundäraktionen bleiben verfügbar, ohne die Karte zu überladen.
- **Systemfeedback:** Erfolgs-/Info-/Fehlerhinweise über Notifications.
- **Sichtbare Zustände:** aktive Buttons, Edit-Mode-Indikatoren, visuelle Drop-Feedbacks.

---

## Organize-Modus & Drag-and-Drop-Regeln

Der Organize-Modus ist für Strukturpflege optimiert.

### Aktivierung

- Über den Organize-Button in der Top-Bar.
- Im Modus werden Karten als bewegliche Objekte behandelt.

### Gültige Verhaltensregeln (aktueller Stand)

1. **Reihenfolge ändern nur bei Drop „zwischen“ Karten**
   - Ein Reorder wird nur ausgeführt, wenn die Karte im Zwischenraum (Insert-Intention) abgelegt wird.

2. **Prompt auf Prompt (direkt übereinander) → neuer Ordner**
   - Bei präzisem Drop direkt auf eine andere Prompt-Karte werden beide Prompts in einen neu erzeugten Ordner verschoben.

3. **Prompt auf Ordner (direkt übereinander) → in Ordner verschieben**
   - Bei präzisem Drop auf eine Ordner-Karte wird die Prompt-Karte in diesen Ordner verschoben.

4. **Nicht unterstützte Overlay-Kombinationen**
   - Für andere direkte Overlay-Kombinationen wird kein impliziter Spezial-Workflow erzwungen; die Ansicht wird konsistent neu gerendert.

### Technische Umsetzungsidee hinter der Intentionserkennung

- Die App erkennt Drop-Koordinaten (Maus/Touch).
- Innerhalb der Zielkarte wird eine „zentralere Overlay-Zone“ von Randbereichen unterschieden.
- Zentraler Overlay-Treffer => „auf Karte“ (combine/move).
- Rand-/Zwischenbereich => Reorder.

Damit ist das Verhalten stabil über verschiedene Kartengrößen, Auflösungen und Eingabearten.

---

## Modale Dialoge

### Prompt-Modal

- Titel-/Textanzeige
- Edit-Modus mit Save
- Copy-Button
- Favoriten-Status
- Schließen über Button/Backdrop/Escape

### Ordner erstellen

- Eingabe Feldname
- Bestätigung/Abbruch
- Validierte Erstellung mit Persistenz

### Verschieben

- Auswahl eines Zielordners im Baum
- Aktiver Confirm-Button nur bei gültiger Auswahl

---

## Favoriten-Dock

Das Favoriten-Dock ist eine separate Effizienzebene für häufig genutzte Prompts.

### Eigenschaften

- Nur sichtbar, wenn Favoriten vorhanden sind.
- Kollabierbar/erweiterbar.
- Adaptive Chipgrößen mit dynamischem Text-Fitting.
- Scroll-/Touch-optimiert.
- Platzbedarf wird in Layoutberechnung einbezogen.

### UX-Nutzen

- Schnellzugriff ohne Navigationsverlust.
- Besonders hilfreich auf kleinen Viewports.

---

## Persistenz, Cloud-Sync und Konfliktverhalten

### Primäre Quelle

- Cloudflare KV via serverloser API (`functions/api/templates.js`).

### Lokaler Fallback

- Browser-Storage hält Arbeitsstände als Sicherheitsnetz.

### Synchronisationsstrategie

- Zeitstempelbasierte Abgleiche.
- Polling/Visibility/Fokus-getriebene Updates.
- UI zeigt Status/Quelle nachvollziehbar an.

---

## Responsive Verhalten und Geräteklassen

Die Oberfläche ist bewusst geräteübergreifend ausgelegt:

- Flexible Karten- und Spaltendefinitionen per CSS-Variablen + `clamp()`.
- Mobile-optimierte Gesten-/Touchpfade.
- Safe-Area-/Viewport-Anpassung (inkl. PWA-Kontext).
- Bedienbarkeit von Desktop bis Smartphone ohne Funktionsverlust.

---

## Animation, Motion und visuelle Qualität

- Card-Hover-/Glow-Feedback.
- Selektive Animationen mit Rücksicht auf `prefers-reduced-motion`.
- GPU-freundliche Bewegungen (Transform/Opacity-Fokus).
- Konsistentes, ruhiges Designsystem mit „Cosmic Aurora“-Anmutung.

---

## Accessibility und Bedienergonomie

- Semantische Buttons mit `aria-label`.
- Escape-/Backdrop-Handling für Modalsteuerung.
- Gut erkennbare Zustandswechsel.
- Fokus auf geringe kognitive Last durch klare Aktionsräume.

---

## Dateiübersicht

- `index.html` – App-Struktur, Controls, Modal-Container, SVG-Templates.
- `style.css` – Komplettes visuelles System inkl. Responsive/States.
- `script.js` – Zustandslogik, Rendering, Interaktionen, Drag&Drop, Sync.
- `templates.json` – initiale Datenbasis.
- `functions/api/templates.js` – Cloudflare-KV-Anbindung (serverless).
- `manifest.json`, `icons/*`, `browserconfig.xml` – PWA/Branding/Plattformintegration.

---

## Technologiestack

### Kern

- Vanilla HTML/CSS/JavaScript

### Bibliotheken

- **SortableJS** für Reorder-/DnD-Basiskomfort
- **GSAP + Flip** für flüssige UI-Übergänge
- **Vivus** für SVG-Draw-Effekte

### Plattform

- Cloudflare Functions + KV
- Progressive-Web-App-Fähigkeit (Manifest/Icons/Meta)

---

## Lokale Entwicklung und Betrieb

### Voraussetzungen

- Statischer Webserver (oder Cloudflare-Setup für API-Funktionen)
- Browser mit modernem JS/CSS-Support

### Start (statisch)

1. Repository bereitstellen.
2. Über lokalen Webserver ausliefern.
3. `index.html` aufrufen.

### Betrieb mit Backend

- API-Funktionen unter `functions/` mit Cloudflare-Projekt verknüpfen.
- KV-Bindings und Secrets entsprechend Umgebung setzen.

---

## Qualitätsaspekte & bekannte Grenzen

### Stärken

- Hoher UX-Fokus bei alltäglicher Prompt-Nutzung.
- Konsistente Interaktionssprache.
- Robuste Persistenzstrategie.

### Aktuelle Grenzen

- Sehr große Datenmengen können (wie bei jeder clientseitigen Grid-App) Renderingkosten erhöhen.
- Feinste DnD-Nuancen hängen von Inputgerät/Browser-DnD-Implementierung ab, sind jedoch durch Intentionserkennung deutlich stabilisiert.

---

## Erweiterungsideen

- Undo/Redo-Historie auf Datenebene.
- Globale Volltextsuche mit Facetten.
- Optionales Multi-Select mit Batch-Operationen.
- Import-/Export-Profile (JSON-Schemavalidierung).
- Rollen-/Teamfeatures auf API-Ebene.

---

AITemplates ist damit eine umfassende, visuell hochwertige und produktionsnahe Prompt-Management-App, die Organisation, Geschwindigkeit und Nutzererlebnis in einer klaren Oberfläche vereint.
