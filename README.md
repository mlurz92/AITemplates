# AI Templates – Vollständige Anwendungsdokumentation

## 1. Überblick
AI Templates ist eine fokussierte Web-Anwendung zur Verwaltung, Navigation, Verknüpfung und schnellen Wiederverwendung von Prompt-Bausteinen. Die App kombiniert eine hierarchische Karten-Navigation (Ordner/Prompts), ein Favoriten-Dock, Cloud-Synchronisierung, Offline-Fallback, Kontextaktionen sowie mobile/desktop-optimierte Interaktionen in einer UI, die auf hohe Geschwindigkeit und geringe Reibung beim täglichen Prompt-Workflow ausgelegt ist.

Ziel ist nicht nur das Speichern von Texten, sondern ein kuratierbares Prompt-System mit sehr kurzer „Time-to-Copy“: finden, prüfen, kopieren, weiterverwenden.

---

## 2. Kernnutzen und Use Cases

### 2.1 Primäre Use Cases
- Aufbau einer strukturierten Prompt-Bibliothek (Ordner + Unterordner + Promptkarten).
- Sehr schneller Zugriff auf häufig genutzte Prompts über Favoriten.
- Erstellen von Verknüpfungen (Prompt-Link/Folder-Link), um Inhalte in mehreren Kontexten nutzbar zu machen, ohne Duplikate.
- Direkter Copy-Workflow für tägliche Arbeit mit LLMs.

### 2.2 UX-Zielbild
- **Ein-Klick-Effizienz**: Promptkarte klicken kopiert sofort.
- **Kontextuelle Tiefe nur bei Bedarf**: Detailansicht gezielt über den Expand-Button.
- **Wenige Moduswechsel**: Lesen, Navigieren, Kopieren und Organisieren in einem konsistenten Kartenmodell.

---

## 3. Informationsarchitektur

### 3.1 Datenmodell
Die Anwendung arbeitet mit einem JSON-Baum:
- `folder`: besitzt `items`.
- `prompt`: besitzt `content`.
- `prompt-link` / `folder-link`: verweist über `targetId` auf vorhandene Knoten.

### 3.2 Navigationsmodell
- Start auf Root/Home.
- Navigation in Ordner per Kartenklick.
- Breadcrumb zeigt Pfad und erlaubt Sprung zu Zwischenebenen.
- Zurück-Navigation via Topbar/Floating-Backbutton, mobil auch via Swipe/Rehistory.

---

## 4. UI-Struktur

### 4.1 Hauptbereiche
- **Top-Bar**: Navigation, Vollbild, Download/Reset, Hinzufügen, Organisieren.
- **Breadcrumb**: visuelle Pfadorientierung.
- **Karten-Container**: eigentliche Arbeitsfläche.
- **Favoriten-Dock**: persistenter Schnellzugriff auf favorisierte Prompts.
- **Modal-System**: Prompt-Detail, Prompt-Bearbeitung, Ordner anlegen, Verknüpfung, Verschieben.
- **Benachrichtigungsbereich**: nicht-blockierende Erfolgs-/Info-/Fehlermeldungen.

### 4.2 Kartenarten
- **Ordnerkarte**: öffnet Ebene, zeigt Folder-Icon/Animation.
- **Promptkarte**: zeigt Titel + Aktionsbuttons (Expand/Kopieren).
- **Verknüpfte Promptkarte**: verhält sich wie Prompt (auflösbar über Zielknoten).

---

## 5. Interaktionsdesign im Detail

### 5.1 Klickverhalten von Karten
- Klick auf **Ordnerkarte**: navigiert in den Ordner.
- Klick auf **Promptkarte (auch Prompt-Link)**: kopiert Prompt-Text direkt in die Zwischenablage.
- Klick auf **Expand-Button**: öffnet Prompt-Detailmodal mit Volltext.
- Klick auf **Copy-Button**: kopiert gezielt über den Button.

Damit ist der Standard-Flow beim Prompt-Arbeiten maximal kurz, ohne unbeabsichtigtes Öffnen der Detailansicht.

### 5.2 Kontextmenü (Rechtsklick/Langdruck je nach Plattform)
Kontextmenü unterstützt je nach Elementtyp Aktionen wie:
- Favorit hinzufügen/entfernen.
- Umbenennen.
- Verschieben.
- Löschen.

Wichtig: Bei **verknüpften Prompt-Karten** ist „Zu Favoriten hinzufügen“ ebenfalls verfügbar und wirkt auf den tatsächlich verknüpften Ziel-Prompt.

### 5.3 Modal-Verhalten
- Prompt-Modal mit Lesen/Bearbeiten/Speichern/Kopieren/Favorisieren.
- Schließen per Button, ESC, Backdrop, mobil via History-Logik.
- Editiermodus blendet nicht relevante Aktionen aus, um Fehler zu minimieren.

---

## 6. Favoriten-System

### 6.1 Zweck
Favoriten sind eine zweite Zugriffsebene für tägliche Kernprompts.

### 6.2 Verhalten
- Favoriten persistieren lokal (`localStorage`).
- Toggle über Modal, Kontextmenü oder Favoriten-Chips.
- Dock unterstützt Expand/Collapse, Overflow-Indikatoren, Scroll- und Touch-Gesten.
- Kontextmenü auf Favoriten-Chips erlaubt Entfernen/Favoriten-Toggle.

### 6.3 UX-Details
- Visuelle Akzentfarben pro Chip.
- Copy-Feedback und temporäre Statusmarkierung nach erfolgreichem Kopieren.
- Optionales Leeren aller Favoriten mit Bestätigungsdialog.

---

## 7. Organisieren und Strukturpflege

### 7.1 Edit-/Organize-Mode
- Aktivierbarer Modus für Umstrukturierung.
- Sortierung via Drag-and-Drop.
- Zielgerichtetes Verschieben in Ordner.
- Kombinationslogik (z. B. Zusammenführen) nach Drop-Intent.

### 7.2 Verknüpfungen
- Prompt-Links und Folder-Links können in beliebigen Ordnern platziert werden.
- Inhalte bleiben Single Source of Truth; Links vermeiden Kopien/Drift.

---

## 8. Persistenz, Cloud und Offline

### 8.1 Cloud-Sync
- Initialer Load aus API (`/api/templates`).
- Polling + BroadcastChannel für nahezu Echtzeit-Synchronisierung über Tabs.
- Konfliktbehandlung mit serverseitigem Zeitstempel.

### 8.2 Offline-Fallback
- Bei fehlender Cloud-Verfügbarkeit wird lokaler Cache genutzt.
- Benutzer erhält Status-Feedback (Info/Fehler).

### 8.3 Export und Reset
- JSON-Download für Sicherung/Transfer.
- Lokaler Reset leert Cache/Favoriten und lädt Cloud-Stand neu.

---

## 9. Micro-UX, Motion und visuelle Qualität

### 9.1 Visuelle Systeme
- Aurora/Parallax-Hintergrund.
- Partikeleffekte.
- Glow-Burst bei Interaktionen.
- Titel-Layoutoptimierung für adaptive Kartenbeschriftung.

### 9.2 Performance-Ansätze
- RequestAnimationFrame-gestützte Updates.
- Beobachter für Sichtbarkeit/Viewport.
- Begrenzte Renderanzahl pro Ebene.
- Effiziente Font-Size-Berechnung per Binary-Search-Ansatz.

### 9.3 Accessibility-nahe Aspekte
- ARIA-Labels für zentrale Buttons.
- ESC-Handling für Overlays/Zustände.
- Reduzierte Bewegung über `prefers-reduced-motion`.

---

## 10. Plattformverhalten

### 10.1 Desktop
- Kontextmenüs via Rechtsklick.
- Schnellnavigation über Breadcrumb und feste Back-Elemente.

### 10.2 Mobile
- Touch-Gesten (u. a. Swipe für Zurück).
- History-integriertes Modal/Navigationsverhalten.
- Favoriten-Dock mit Touch-Interaktionslogik.

---

## 11. Bedienabläufe (Best-Practice)

### 11.1 Prompt schnell nutzen
1. Ordner öffnen.
2. Promptkarte anklicken.
3. Prompt ist in Zwischenablage und kann direkt im Zielsystem eingefügt werden.
4. Falls nötig Detailprüfung über Expand-Button.

### 11.2 Prompt oft nutzen
1. Rechtsklick auf Prompt-/Prompt-Link-Karte.
2. „Zu Favoriten hinzufügen“.
3. Danach schneller Zugriff über Dock.

### 11.3 Struktur aufräumen
1. Organize-Mode aktivieren.
2. Karten verschieben/sortieren/verknüpfen.
3. Speichern durch Persistenzfluss (automatische Statusmeldungen beachten).

---

## 12. Fehlerbilder und erwartete Reaktionen
- Cloud nicht erreichbar: App zeigt Hinweis und verwendet ggf. Offline-Cache.
- Konflikt beim Speichern: Cloud-Stand wird synchronisiert.
- Leere Ordner: expliziter „Ordner ist leer“-Zustand.
- Kein Favorit vorhanden: neutrales Info-Feedback statt stiller Aktion.

---

## 13. Zusammenfassung
AI Templates ist eine hochgradig workflow-orientierte Prompt-Management-Anwendung mit klarer Trennung zwischen **schnellem Standardpfad (Karte klicken = kopieren)** und **vertiefender Detailinteraktion (Expand/Modal)**. In Verbindung mit Verknüpfungen, Favoriten-Dock, Organize-Mode und Cloud/Offline-Strategie entsteht ein robustes System für produktive Prompt-Arbeit im Alltag.
