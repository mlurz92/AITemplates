# AITemplates

Eine moderne, performante Prompt-Template-Webanwendung mit Fokus auf **strukturierte Wissensablage**, **ultraschnellen Zugriff**, **mobile-first Nutzbarkeit** und **zuverlässige Persistenz/Synchronisierung**. Die Anwendung ist so gestaltet, dass sie gleichermaßen als klassische Browser-Seite, installierte PWA (Standalone) und expliziter Vollbildmodus betrieben werden kann.

---

## Inhaltsverzeichnis

1. [Produktvision und Nutzenversprechen](#produktvision-und-nutzenversprechen)
2. [Zielgruppen und Anwendungsszenarien](#zielgruppen-und-anwendungsszenarien)
3. [Funktionsumfang im Überblick](#funktionsumfang-im-überblick)
4. [Informationsarchitektur](#informationsarchitektur)
5. [Kompletter UI-Aufbau](#kompletter-ui-aufbau)
6. [UX-Prinzipien und Interaktionsdesign](#ux-prinzipien-und-interaktionsdesign)
7. [Responsives Verhalten, Viewport-Strategie und Fullscreen/PWA-Betrieb](#responsives-verhalten-viewport-strategie-und-fullscreenpwa-betrieb)
8. [Favoriten-Dock: Architektur, Verhalten, Gesten und Platzoptimierung](#favoriten-dock-architektur-verhalten-gesten-und-platzoptimierung)
9. [Datenmodell und Datenflüsse](#datenmodell-und-datenflüsse)
10. [Synchronisierung, Konflikterkennung und Offline-Fallback](#synchronisierung-konflikterkennung-und-offline-fallback)
11. [Animationen, Motion und Performance](#animationen-motion-und-performance)
12. [Accessibility und ergonomische Details](#accessibility-und-ergonomische-details)
13. [Technischer Stack und externe Bibliotheken](#technischer-stack-und-externe-bibliotheken)
14. [Datei- und Modulstruktur](#datei--und-modulstruktur)
15. [Betrieb, Entwicklung und Anpassung](#betrieb-entwicklung-und-anpassung)
16. [Sicherheits- und Qualitätsaspekte](#sicherheits--und-qualitätsaspekte)
17. [Bekannte Grenzen und sinnvolle nächste Ausbaustufen](#bekannte-grenzen-und-sinnvolle-nächste-ausbaustufen)
18. [Zusammenfassung](#zusammenfassung)

---

## Produktvision und Nutzenversprechen

AITemplates ist ein spezialisiertes Arbeitswerkzeug für Menschen, die mit Prompts, Textbausteinen oder strukturiertem Wissensmaterial arbeiten. Das Ziel ist nicht nur „Speichern und Anzeigen“, sondern ein vollständig optimierter Arbeitsfluss:

- Inhalte **hierarchisch organisieren** (Ordner, Unterordner, Prompt-Karten).
- Inhalte **im Kontext finden** (Breadcrumb, Kartenansicht, Favoriten).
- Inhalte **ohne Reibung nutzen** (Modal, One-Tap-Copy).
- Inhalte **zuverlässig bewahren** (Cloud-Sync + lokale Fallbacks).

Der Fokus liegt auf einem ruhigen, hochwertigen Erlebnis mit klarer visueller Hierarchie, konsistenten Aktionen und schneller Rückmeldung.

---

## Zielgruppen und Anwendungsszenarien

### Primäre Zielgruppen
- Prompt Engineers und AI Power-User.
- Teams mit wiederkehrenden Prompt-Standards.
- Content-/Marketing-/Ops-Rollen mit Textvorlagen.
- Einzelpersonen mit persönlicher Prompt-Bibliothek.

### Typische Nutzungsszenarien
- Aufbau einer persönlichen Prompt-Sammlung mit thematischer Ordnerstruktur.
- Teamweite, cloudgestützte Pflege von Standards.
- Mobile Nutzung unterwegs (inkl. installierter WebApp).
- Schneller Zugriff auf häufige Inhalte über das Favoriten-Dock.

---

## Funktionsumfang im Überblick

- Kartenbasiertes Browsing durch Ordner und Prompts.
- Öffnen, Lesen, Bearbeiten und Speichern einzelner Prompts.
- Favorisieren/Entfavorisieren und separater Favoriten-Schnellzugriff.
- Kontextmenü mit Umbenennen, Verschieben, Löschen und Favoriten-Toggle.
- Erstellen neuer Ordner und Prompts direkt in der Oberfläche.
- Organize-Modus mit Reorder-/Management-Fokus.
- Cloud-Live-Sync via API inklusive Konflikterkennung.
- Lokale Persistenz als Fallback.
- Download/Reset lokaler Änderungen.
- Vollbildunterstützung plus PWA-optimiertes Verhalten.

---

## Informationsarchitektur

Die Anwendung folgt einer baumbasierten Struktur:

- **Ordnerknoten** enthalten weitere Elemente (`items`).
- **Promptknoten** enthalten Titel und Inhalt.

Die aktuelle Navigationsebene wird in einem Pfad-Stack gehalten und über Breadcrumbs gespiegelt. Dadurch bleibt Orientierung auch in tiefen Hierarchien stabil.

---

## Kompletter UI-Aufbau

### 1) Hintergrund- und Atmosphärenebene
- Aurora-Hintergrund mit subtiler Bewegung.
- Körnungs-/Noise-Layer für Tiefe.
- Fokus: visuelle Qualität ohne Funktionseinbußen.

### 2) Top-Bar (globale Steuerung)
- Zurück-Button.
- Breadcrumb-Navigation.
- Organisieren-Toggle.
- Hinzufügen-Menü (Prompt/Ordner).
- Persistenzaktionen (Download/Reset, wenn lokal relevant).
- Cloud/Storage-Quelle-Indikator.
- Favoriten löschen.
- Vollbild-Toggle.
- App-Logo (Home).

### 3) Hauptinhalt (Cards-Grid)
- Responsives Grid für Ordner- und Prompt-Karten.
- Dynamische Spaltenanpassung je Viewportbreite.
- Klares, touchfreundliches Trefferbild.

### 4) Modale Ebenen
- Prompt-Modal (Lesen/Bearbeiten/Favorisieren/Kopieren).
- Ordner-Erstellen-Modal.
- Verschieben-Modal mit Zielbaum.

### 5) Fixe Utility-Flächen
- Fixed Back-Button für schnelle Rücknavigation.
- Notification-Area für unmittelbares Feedback.
- **Favoriten-Dock** am unteren Viewportende als permanenter Schnellzugriff.

---

## UX-Prinzipien und Interaktionsdesign

- **Direkte Manipulation:** Aktionen wirken unmittelbar auf das sichtbare UI.
- **Progressive Offenlegung:** Sekundäraktionen im Kontextmenü statt überladener Karten.
- **Fehlertoleranz:** Konflikte und Problemfälle werden als verständliche Zustände angezeigt.
- **Kurze Interaktionswege:** Modal-Aktionen bündeln den primären Workflow.
- **Konsistente Semantik:** Gleichartige Aktionen verhalten sich überall ähnlich.

---

## Responsive Verhalten, Viewport-Strategie und Fullscreen/PWA-Betrieb

Die Anwendung ist konsequent auf variable Umgebungen ausgelegt:

- Responsive Grid-Strategie für kleine bis sehr große Displays.
- Safe-Area-Berücksichtigung (`env(safe-area-inset-*)`) auf iOS/Notch-Geräten.
- Dynamische Viewport-Variablen (`--app-vh`, `--app-vw`) für präzises Höhenlayout.
- Erkennung des Darstellungsmodus:
  - Browser
  - Standalone (installierte PWA)
  - Fullscreen
- Zusätzliche Berechnung eines Bottom-Offsets über `visualViewport`, damit die untere Dock-Position robust gegenüber Browser-Chrome/Viewport-Verschiebungen bleibt.

Ergebnis: Die Oberfläche nutzt verfügbaren Platz maximal aus, ohne dass essentielle Bedienflächen abgeschnitten oder von Browser-UI überlagert werden.

---

## Favoriten-Dock: Architektur, Verhalten, Gesten und Platzoptimierung

Das Favoriten-Dock ist als eigenständige Interaktionsebene umgesetzt:

- Fest am unteren Viewportrand positioniert.
- Sichtbar nur bei vorhandenem Favoritenbestand.
- Ein-/Ausklappbar mit klarer visueller Rückmeldung.
- Horizontaler Schnellzugriff im kompakten Zustand.
- Mehrzeiliges Layout im erweiterten Zustand.
- Automatische Chip-Metrik-Berechnung (Breite/Höhe/Content-Fit) für optimale Platznutzung.
- Scroll-Indikatoren und temporäre Scrollbar-Sichtbarkeit für bessere Orientierung.
- Touch-Gesten zur komfortablen Bedienung auf Mobilgeräten.
- Reservierter Inhaltsabstand im Cards-Bereich über gemessene Dock-Footprint-Höhe, damit Inhalte nicht vom Dock überdeckt werden.

---

## Datenmodell und Datenflüsse

### Primäre Datenobjekte
- Root-Folder mit verschachtelten `items`.
- Knoten-Typen mindestens `folder` und `prompt`.

### Laufzeitfluss (vereinfacht)
1. Daten laden (Cloud bevorzugt, lokal als Fallback).
2. In-Memory-Zustand aktualisieren.
3. UI rendern (Grid, Breadcrumb, Favoriten).
4. Nutzeraktion führt zu lokalen Zustand-Updates.
5. Persistenz-/Sync-Operationen synchronisieren den Stand.

---

## Synchronisierung, Konflikterkennung und Offline-Fallback

- API-Endpunkt liest/schreibt Template-Zustände.
- Bei Writes wird ein Zeitstempel-/Versionskontext geprüft.
- Bei Konflikten (z. B. zwischen zwei Clients) wird statt Blind-Overwrite ein Konfliktstatus zurückgegeben.
- Lokale Speicherung verhindert Datenverlust bei Verbindungs- oder Serverproblemen.
- Re-Sync-Mechanismen sorgen für schnelle Angleichung zwischen Tabs/Sitzungen.

---

## Animationen, Motion und Performance

### Motion-Ebenen
- Aurora-Hintergrundbewegung.
- Mikrointeraktionen an Buttons/Karten.
- Weiche Übergänge beim Umschalten von Zuständen.
- FLIP-Animationen für Layoutwechsel, wenn verfügbar.

### Performance-Strategien
- `requestAnimationFrame` für layoutrelevante Aktualisierungen.
- CSS-Containment und transformbasierte Effekte.
- Entkoppelte Berechnung von Dock- und Chip-Metriken.
- Respektierung von `prefers-reduced-motion`.

---

## Accessibility und ergonomische Details

- Semantische Strukturen (`main`, `nav`, `aside`, Modale).
- Beschriftete Interaktionselemente (`aria-label`, Rollen, Zustandsattribute).
- Klar erkennbare Fokus-/Hover-Zustände.
- Touchfreundliche Controls mit ausreichenden Trefferflächen.
- Lesbarkeit durch kontrastreiche Typografie und abgestufte Farbrollen.

---

## Technischer Stack und externe Bibliotheken

- **Vanilla HTML/CSS/JavaScript** als Kern.
- **SortableJS** für Sortier-/Organize-Interaktionen.
- **GSAP + Flip** für fortgeschrittene UI-Transitions.
- **Vivus** für SVG-Animationsakzente.
- **Cloudflare Pages Functions + KV** für serverlose Datenpersistenz.

---

## Datei- und Modulstruktur

- `index.html` – App-Struktur und UI-Komponenten.
- `style.css` – Designsystem, Layout, Responsiveness, Motion.
- `script.js` – State-Management, Rendering, Events, Sync, Viewportlogik.
- `templates.json` – initiale Datenbasis.
- `functions/api/templates.js` – API für Lesen/Schreiben + Konfliktlogik.
- `manifest.json`, `browserconfig.xml`, `icons/*` – PWA/Plattformintegration.

---

## Betrieb, Entwicklung und Anpassung

### Lokaler Betrieb
- Als statische WebApp mit lokalem/entwicklungsseitigem API-Mock oder vorhandener Function.
- Für produktiven Cloud-Sync ist KV-Bindung in der Laufzeitumgebung erforderlich.

### Typische Anpassungsfelder
- Corporate Branding (Farben, Icons, Schrift).
- Datenvalidierung/Schemaerweiterungen.
- Team-spezifische Rollen-/Freigabelogik.
- Erweiterte Suche/Filter/Pinning-Mechanismen.

---

## Sicherheits- und Qualitätsaspekte

- Konfliktschutz reduziert Risiko unbeabsichtigter Überschreibungen.
- Lokale Fallback-Persistenz erhöht Robustheit bei Störungen.
- Klare, reversible UI-Aktionen und Feedback vermindern Bedienfehler.
- Motion- und Viewport-Handling sind auf Stabilität und Gerätevielfalt ausgelegt.

---

## Bekannte Grenzen und sinnvolle nächste Ausbaustufen

### Potenzielle Erweiterungen
- Volltextsuche mit Ranking und Highlighting.
- Tagging/Filter-Framework für große Bibliotheken.
- Undo/Redo-Historie.
- Optionales Rechtemodell für Teamkontexte.
- E2E-Tests für kritische Workflows und Viewport-Regressionen.

### UX-Feinschliff-Ideen
- Personalisierbare Dichteprofile (kompakt/komfortabel).
- Konfigurierbare Favoriten-Sortierung.
- Erweiterte Shortcuts für Power-User.

---

## Zusammenfassung

AITemplates ist eine ausgereifte Prompt-Management-Anwendung mit starker Balance aus Designqualität, Interaktionsgeschwindigkeit und technischer Robustheit. Besonders hervorzuheben ist die kombinierte Optimierung für Browser-, Standalone- und Fullscreen-Betrieb inklusive präziser Viewport- und Safe-Area-Behandlung. Dadurch bleibt die Nutzererfahrung konsistent, effizient und hochwertig – unabhängig von Gerät, Auflösung oder Nutzungskontext.
