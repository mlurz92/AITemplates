# 🌌 Prompt-Templates — Die ultimative Prompt-Management Web-App

**Prompt-Templates** ist eine installierbare, vollständig offline-fähige Progressive Web App (PWA) zum **Ordnen, Durchsuchen, Verwalten und blitzschnellen Kopieren** von KI-Prompt-Vorlagen. Die Anwendung ist als **Vanilla-JavaScript-Applikation** ohne Build-Schritt konzipiert, kombiniert jedoch ein ambitioniertes **„Liquid Glass"-Designsystem**, eine **echtzeit-gerenderte WebGL-Aurora**, eine **neuronale semantische Suche**, ein **hybrides Cloud-Sync** über Cloudflare KV und eine bis ins letzte Detail durchdachte **Mobile-First-Bedienung** mit Tastatur-, Gesten- und Haptik-Feedback.

Dieses Dokument beschreibt den **vollständigen aktuellen Stand** der Anwendung — jeden Screen, jede Komponente, jede Interaktion, jede Datei und jeden Fallback-Pfad. Es ist bewusst **kein Changelog**, sondern eine vollständige Momentaufnahme des Ist-Zustands.

---

## 📑 Inhaltsverzeichnis

1. [Überblick & Kernkonzept](#1-überblick--kernkonzept)
2. [Design-Philosophie: Liquid Glass & WebGL-Aurora](#2-design-philosophie-liquid-glass--webgl-aurora)
3. [Mobile-First & PWA-Exzellenz](#3-mobile-first--pwa-exzellenz)
4. [UI- & UX-Komponenten im Detail](#4-ui--ux-komponenten-im-detail)
5. [Die Favoritenleiste (Favorites-Dock) — Hotkeys & Drag&Drop](#5-die-favoritenleiste-favorites-dock--hotkeys--dragdrop)
6. [Suche: Lexikalisch, Global & Semantisch](#6-suche-lexikalisch-global--semantisch)
7. [Tags](#7-tags)
8. [Navigation: Routing, Verlauf & Breadcrumb-Sprünge](#8-navigation-routing-verlauf--breadcrumb-sprünge)
9. [Bedienung: Tastatursteuerung & Karten-Wischgesten](#9-bedienung-tastatursteuerung--karten-wischgesten)
10. [Karten-Verwaltung: Erstellen, Bearbeiten, Verschieben, Verknüpfen](#10-karten-verwaltung-erstellen-bearbeiten-verschieben-verknüpfen)
11. [Mikrointeraktionen, Haptik & Skeletons](#11-mikrointeraktionen-haptik--skeletons)
12. [Offline-Betrieb & Service Worker](#12-offline-betrieb--service-worker)
13. [Datenhaltung, Cloud-Sync & Datenmodell](#13-datenhaltung-cloud-sync--datenmodell)
14. [Theme-System & Vollbild](#14-theme-system--vollbild)
15. [Tastaturkürzel & Gesten — Gesamtreferenz](#15-tastaturkürzel--gesten--gesamtreferenz)
16. [Barrierefreiheit](#16-barrierefreiheit)
17. [Performance-Architektur](#17-performance-architektur)
18. [Code-Architektur & Dateistruktur](#18-code-architektur--dateistruktur)
19. [Betrieb, Deployment & Konfiguration](#19-betrieb-deployment--konfiguration)
20. [Graceful Degradation & Fallback-Matrix](#20-graceful-degradation--fallback-matrix)

---

## 1. Überblick & Kernkonzept

### 1.1 Was die App tut

Die App präsentiert eine **hierarchische Bibliothek** aus **Ordnern** und **Prompt-Karten**. Der Nutzer navigiert durch die Ordnerstruktur wie durch ein Dateisystem, öffnet Prompts in einem Modal, **kopiert sie mit einem Tipp in die Zwischenablage** und legt häufig benötigte Vorlagen in einer **Favoritenleiste** ab, aus der sie noch schneller — per Klick oder per **Zifferntasten-Hotkey** — kopiert werden können.

Die mitgelieferte Bibliothek (`templates.json`) umfasst standardmäßig **12 thematische Hauptordner** (KI-Steuerung & Verhalten, Content-Erstellung, Code-Entwicklung, Radiologie, Recherche, Immobilien, Finanzen, Berichte, Jailbreak, Prompt-Engineering, System-Prompts, Fun) mit insgesamt **25 Ordnern** und **97 Prompt-Vorlagen** in bis zu **drei Verschachtelungsebenen**.

### 1.2 Leitprinzipien

| Prinzip | Umsetzung |
|---|---|
| **Kein Build, keine Abhängigkeitshölle** | Reines HTML/CSS/JS. Öffnen von `index.html` genügt. Drei kleine CDN-Bibliotheken (Vivus, SortableJS, GSAP+Flip) werden lazy geladen und sind allesamt optional (Graceful Degradation). |
| **Additive Schichten statt Monolith** | Kernlogik in `script.js`; `enhancements.js` und `navigation.js` erweitern sie ausschließlich über dokumentierte Hook-Punkte (Function-Wrapping), ohne die Kernlogik umzuschreiben. |
| **Mobile-First, Desktop-Perfekt** | Jede Interaktion existiert in einer Touch- und einer Maus/Tastatur-Variante. Safe-Areas, Notch, Dynamic Island und iOS-Standalone werden pixelgenau behandelt. |
| **Alles degradiert sauber** | Kein WebGL? CSS-Blobs. Kein neuronales Modell? Heuristik. Offline? Service-Worker-Cache. Kein Clipboard-API? `execCommand`-Fallback. |
| **Optimistische, konfliktsichere Persistenz** | Änderungen wandern sofort in die UI und werden gegen einen Zeitstempel-basierten Konfliktschutz in Cloudflare KV geschrieben; parallel offene Tabs synchronisieren sich per `BroadcastChannel`. |

---

## 2. Design-Philosophie: Liquid Glass & WebGL-Aurora

Das visuelle Konzept ist ein durchgängiges **„Liquid Glass"**-System: getönte, unscharfe Glasflächen mit feiner Körnung, farbigen Akzent-Auren und weichen, tiefen Schatten, die über einer lebendigen, farbströmenden Hintergrund-Aurora schweben.

### 2.1 Das mehrschichtige Glas-System

Jede Oberfläche (Top-Bar, Karte, Modal, Kontextmenü, Toast, Favoriten-Chip) ist aus denselben Bausteinen aufgebaut:

1. **Backdrop-Blur** – `backdrop-filter: blur()` + Sättigungsanhebung erzeugen die Milchglas-Tiefe.
2. **Getönte Grundfläche** – halbtransparente Verläufe (`linear-gradient(165deg, …)`) statt flacher Farben.
3. **Rauschtextur** – eine dezente `--glass-noise`-Überlagerung (`::after`) verhindert Banding und gibt echtes Materialgefühl.
4. **Akzent-Aura** – ein radialer Glow (`::before`), der bei Hover/Fokus sanft aufleuchtet.
5. **Mehrlagige Schatten** – kombinierte Drop- und Glow-Shadows für schwebende Tiefe.

Diese Bausteine werden über **CSS Custom Properties** (Design-Tokens) zentral gesteuert — Farben, Akzente, Radien, Dauern (`--duration-1/2/3`), Easing-Kurven (`--ease-smooth`) und Glas-Parameter sind an einer Stelle definiert und ziehen sich konsistent durch die gesamte Oberfläche.

### 2.2 WebGL-Aurora (Echtzeit-Shader)

Der Hintergrund (`#aurora-container`) enthält zunächst drei statische, weichgezeichnete CSS-Blobs (`.shape1–3`). Sobald die App bootet, **ersetzt `aurora-webgl.js` diese durch eine echtzeitgerenderte Aurora**:

* **Fragment-Shader mit Fraktalem Brownschem Rauschen (FBM) + Domain-Warping** erzeugt weiche, driftende Nordlicht-Schleier.
* **Zwei überlagerte, gewarpte FBM-Felder** ergeben organisch fließende Bänder; die Farben kommen als Uniforms aus **schema-abhängigen Paletten** (Indigo/Mint/Violett im Dark-, dezenter aufgehellt im Light-Mode).
* **Vertikaler Verlauf + Vignette**: oben dichter, unten ausgedünnt, an den Rändern sanft ausgeblendet.
* **Adaptive Performance**: Render-Loop auf **~30 fps gedrosselt**, `devicePixelRatio` auf **1.25 gedeckelt**, `powerPreference: 'low-power'`.
* **Batterieschonung**: Bei `visibilitychange` (Tab im Hintergrund) pausiert die Loop komplett und nimmt bei Rückkehr wieder auf.
* **`prefers-reduced-motion`**: Es wird **ein einziges statisches Frame** gezeichnet, keine Animationsschleife.
* **Sauberer Fallback**: Ohne WebGL-Kontext bleiben die CSS-Blobs unverändert sichtbar — kein Eingriff, kein Fehler.

Öffentliche API: `window.AuroraWebGL { start, stop, setScheme, setVisible, isActive }`. Bei Theme-Wechsel färbt die App die Aurora über `setScheme()` um.

### 2.3 Farb- & Theme-System

Zwei vollwertige Themes (**Dark** & **Light**) sind über `document.documentElement.dataset.colorScheme` umschaltbar. Ein **Inline-Skript im `<head>`** setzt das Theme **noch vor dem ersten Frame** (aus `localStorage` bzw. `prefers-color-scheme`), damit weder Oberfläche noch Favicon/Logo je „falsch" aufblitzen. Das animierte App-Icon existiert in einer Dark- und einer Light-Variante und wird themengekoppelt getauscht (das stabile PNG bleibt als Apple-Touch-/Home-Screen-Icon erhalten, da iOS dort kein SVG rendert).

---

## 3. Mobile-First & PWA-Exzellenz

### 3.1 Safe Area, Notch & Dynamic Island

* Das Viewport-Meta nutzt `viewport-fit=cover` und `interactive-widget=resizes-content`, damit die App unter Notch/Home-Indicator korrekt bis an die Kanten reicht und die Tastatur den Content staucht statt zu überlagern.
* Ein **Display-Mode-Detektor** (`detectDisplayMode`) unterscheidet **Browser-Tab**, **Standalone (installiert)** und **Fullscreen** und schaltet passende Layout-Metriken (obere/untere Safe-Area-Insets, Statusleisten-Höhe) live um.
* iOS-Standalone-Besonderheiten (nutzbarer Bereich, untere Home-Indicator-Zone) werden über echte Viewport-Metriken (`updateViewportMetrics`) und CSS-Variablen aufgelöst, sodass keine „toten Streifen" entstehen.

### 3.2 Natives Interaktions-Gefühl

* **Pull-to-Refresh**: Am oberen Rand nach unten ziehen löst (via `setupPullToRefresh`) einen echten Cloud-Refresh aus; ein Spinner mit Label (`#pull-to-refresh`) gibt Rückmeldung.
* **Haptik**: `triggerHapticFeedback()` nutzt die Vibration-API in abgestuften Intensitäten (light/medium/heavy) und ist an Kopieren, Favorisieren und Navigieren gekoppelt.
* **Kein Text-/Nummern-Auto-Detect**, kein unerwünschtes Zoomen, `user-scalable=no` für App-Feeling.
* **Touch-optimierte Trefferflächen** und `content-visibility`-basierte Off-Screen-Optimierung.

### 3.3 Installierbarkeit

* **Vollständiges Web-App-Manifest** (`manifest.json`): Name, Short-Name, `display: standalone`, Theme-/Background-Color, Kategorien, `id`/`scope`, sowie Icons in 192px, 512px, **maskable 512px** und animiertem SVG.
* **Ein-Klick-Installation**: `beforeinstallprompt` wird abgefangen (`setupPwaInstallPrompt`); ein dedizierter **Installieren-Button** in der Top-Bar erscheint nur, wenn eine Installation tatsächlich möglich ist.
* **Microsoft-Tiles** via `browserconfig.xml`, Apple-Touch-Icon und themengekoppelte Favicons runden die Plattformabdeckung ab.

---

## 4. UI- & UX-Komponenten im Detail

### 4.1 Top-Bar (`#top-bar`)

Die schwebende Glas-Kopfzeile trägt eine eigene, animierte **Topbar-Aurora** (drei geschichtete Layer) und beherbergt — je nach Kontext und Viewport ein- oder ausgeblendet — folgende Steuerungen:

| Element | Funktion |
|---|---|
| **Zurück** (`#topbar-back-button`) | Schließt ein offenes Modal oder navigiert eine Ebene nach oben. |
| **Breadcrumb** (`#breadcrumb`) | Zeigt den aktuellen Pfad; jeder Schritt ist anklickbar, jeder Ordnerschritt trägt einen **Sprung-Chevron** (siehe 8.3). |
| **Organisieren** (`#organize-button`) | Schaltet den Sortier-/Verschiebe-Modus ein (Icon wechselt zu „Fertig"). |
| **Hinzufügen** (`#add-button`) | Öffnet ein Menü: Neuer Prompt, Neuer Ordner, Prompt verknüpfen, Ordner verknüpfen. |
| **Zurücksetzen** (`#reset-button`) | Verwirft lokale Änderungen (nur sichtbar, wenn Daten vorliegen). |
| **JSON-Optionen** (`#download-button`) | Menü: Download JSON / Upload JSON. |
| **Speicherquelle** (`#storage-source-button`) | Statusanzeige der aktiven Cloudflare-KV-Live-Synchronisierung. |
| **Theme** (`#color-scheme-button`) | Wechselt Dark/Light (Mond-/Sonnen-Icon). |
| **Installieren** (`#install-app-button`) | PWA-Installation (nur wenn verfügbar). |
| **Favoriten löschen** (`#clear-favorites-button`) | Leert die gesamte Favoritenleiste (mit Bestätigung); nur sichtbar bei vorhandenen Favoriten. |
| **Vollbild** (`#fullscreen-button`) | Aktiviert/verlässt den Vollbildmodus. |
| **Suche** (`#search-toggle-button`) | Blendet die Such-Toolbar ein/aus. |
| **Mehr** (`#more-button`) | Mobiles Overflow-Menü. |
| **Logo** (`#app-logo-button`) | Springt zur Startseite (Home). |

#### Mobiles Overflow-System („Mehr"-Menü)

Auf schmalen Viewports werden Sekundäraktionen nicht abgeschnitten, sondern in ein **kontextbewusstes „Mehr"-Menü** (`#more-menu`) ausgelagert. `buildMoreMenu()` übernimmt beim Öffnen **nur die aktuell tatsächlich verfügbaren** Aktionen (anhand der Inline-`display`-Zustände der Originalbuttons) und leitet Klicks an deren bestehende Handler weiter — es gibt also keine Logik-Duplikate, alle Funktionen bleiben erreichbar.

### 4.2 Karten (Prompt- & Ordner-Karten)

Das Karten-Grid (`#cards-container`) rendert für jedes Kind des aktuellen Ordners eine Karte:

* **Ordnerkarten** tragen ein animiertes Ordner-Icon und navigieren beim Tippen hinein.
* **Prompt-Karten** öffnen beim Tippen das Prompt-Modal; ein direkter **Kopier-Button** auf der Karte kopiert ohne Umweg.
* **Verknüpfungen** (`prompt-link` / `folder-link`) verweisen auf ein Ziel an anderer Stelle und werden über `resolveLinkedNode()` transparent aufgelöst; hängende Verweise werden per `pruneDanglingLinks()` bereinigt.
* **Tag-Chips** (bis zu 3) erscheinen automatisch auf Karten mit Tags.
* **Stagger-Einblendung**: Karten werden über eine `--card-index`-Verzögerung nacheinander eingeblendet.
* **Mehrfachauswahl**: Karten lassen sich (Kontextmenü/Selektion) mehrfach markieren, um gebündelt zu favorisieren, zu verschieben oder zu löschen.
* **Tastaturfokus-Ring** (`.kbd-focus`) und **Wisch-Zustände** (`.swipe-*`) sind vollständig gestylt.

### 4.3 Modal-System & Overlays

Alle Overlays teilen sich das Glas-Modal-Muster (`.modal` + `.modal-content.card`) und werden mit `openModal()`/`closeModal()` gesteuert (inklusive Hash-Spiegelung, siehe 8.1):

* **Prompt-Modal** (`#prompt-modal`): Titel-Feld (im Edit-Modus), großes readonly-Textfeld mit dem Prompt, sowie Buttons **Favorisieren**, **Bearbeiten**, **Speichern**, **Kopieren**, **Schließen**. Im Bearbeiten-Modus wird der Text editierbar und der Titel einblendbar. Unter dem Text sitzt der **Tag-Editor** (Chips + Eingabefeld).
* **Neuer Ordner** (`#create-folder-modal`): Namenseingabe + Erstellen/Abbrechen.
* **Verknüpfung hinzufügen** (`#link-item-modal`): Ordnerbaum zur Zielauswahl.
* **Verschieben nach…** (`#move-item-modal`): Ordnerbaum als Verschiebeziel.
* **JSON importieren** (`#upload-json-modal`): **Drag&Drop-Ablagezone** *oder* Dateiauswahl; validiert das Schema vor dem Import.

Modale schließen per **Escape**, **Backdrop-Klick** und (kontextabhängig) **Browser-Zurück**.

### 4.4 Such-Toolbar (`#view-toolbar`)

Ein einklappbares Suchfeld (`#search-input`), das der Suchknopf ein-/ausblendet. Direkt darunter baut die Enhancement-Schicht eine **erweiterte Steuerleiste** aus **Scope-Tabs** (Ordner/Global/Semantik) und **Filter-Chips** (Alle/Favoriten/Ordner/Prompts) — Details in Abschnitt 6.

### 4.5 Ergebnis-Banner

Sobald ein Such-, Tag- oder Filterkontext aktiv ist, erscheint über den Treffern ein **Ergebnis-Banner** mit Kontextbeschreibung (z. B. „Semantische Suche · neuronal · ‚Bericht'"), **Trefferzahl** und einem **Zurücksetzen**-Button.

### 4.6 Breadcrumb-Sprung-Popover

Jeder Ordner-Schritt im Breadcrumb erhält einen **Chevron-Button** (bzw. auf Touch: Long-Press), der ein **Popover** mit allen direkten Unterordnern öffnet — inklusive Kind-Anzahl — für einen Direktsprung an beliebige Stelle des Baums (siehe 8.3).

### 4.7 Benachrichtigungen (Toasts)

`showNotification(message, type)` zeigt Glas-Toasts (`#notification-area`) in den Typen **info**, **success** und **error** mit automatischer Ausblendung; ein laufender Timeout wird sauber ersetzt, sodass sich Meldungen nicht stapeln.

### 4.8 Kontextmenü

Rechtsklick (Desktop) bzw. Long-Press (Touch) auf Karten und Favoriten-Chips öffnet ein Glas-Kontextmenü mit Aktionen wie **Favorisieren/Entfernen**, **Umbenennen**, **Verschieben**, **Löschen** — kontextabhängig ein-/ausgeblendet (z. B. keine Umbenennung für Favoriten-Chips, andere Optionen für Ordner). Ein separates Menü für den leeren Bereich bietet **Organisieren umschalten**, **Neuer Prompt**, **Neuer Ordner**.

### 4.9 Fester Zurück-Button

Ein zusätzlicher, fixierter **Zurück-zur-Home-Button** (`#fixed-back`) erscheint kontextabhängig für schnelle Rückkehr aus der Tiefe der Struktur.

---

## 5. Die Favoritenleiste (Favorites-Dock) — Hotkeys & Drag&Drop

Die **Favoritenleiste** (`#favorites-dock`) ist die zentrale Produktivitätskomponente: eine schwebende, horizontal scrollende Chip-Leiste am unteren Rand, in der die am häufigsten benötigten Prompts (und Ordner) als farbige **Favoriten-Chips** liegen. Sie erscheint automatisch, sobald mindestens ein Favorit existiert, und blendet sich vollständig aus, wenn keiner mehr vorhanden ist.

### 5.1 Aufbau eines Favoriten-Chips

Jeder Chip (`.favorite-chip`) besteht aus:

* einem **Positions-Badge** mit der **aufsteigenden Nummer** des Chips,
* dem **Titel** (bis zu drei Zeilen, dynamisch skaliert),
* einer **Vorschauzeile** des Prompt-Inhalts (bei Prompts),
* einer **rotierenden Akzentfarbe** aus einer 8er-Palette (jeder Chip erhält je nach Position seine eigene Farbe: Rahmen, weicher Hintergrund, Glow, Badge),
* einer **Sparkle-Hover-Animation** und der **Kopier-Erfolgs-Animation** (grünes Aufleuchten).

Das Layout ist **vollständig adaptiv**: Chip-Breite, Höhe, Titel-/Vorschau-Zeilenzahl und Schriftskalierung werden über einen `ResizeObserver` und mehrere Layout-Frames (`applyFavoriteChipMetrics`, `fitFavoriteChipText`, `syncFavoriteChipHeight`) live an den verfügbaren Platz angepasst. Off-Screen-Chips nutzen `content-visibility: auto` für Rendering-Ersparnis.

### 5.2 Kopieren per Klick

* **Tipp auf einen Prompt-Chip** kopiert dessen Inhalt sofort in die Zwischenablage, zeigt die grüne Erfolgs-Animation, aktualisiert die `aria-label` („Kopiert: …") und löst Haptik aus.
* **Tipp auf einen Ordner-Chip** navigiert stattdessen in den Ordner.

### 5.3 ⭐ Hotkeys: Kopieren per Zifferntaste

Jeder Favoriten-Chip trägt eine **aufsteigende Nummerierung von links nach rechts**, die **exakt der Sortierreihenfolge** in der Leiste entspricht. Diese Nummer ist zugleich der **Hotkey**:

* **Tasten `1`–`9`** kopieren die Vorlagen an **Position 1–9** in die Zwischenablage.
* **Taste `0`** kopiert die Vorlage an **Position 10**.
* Das **Badge auf jedem Chip** zeigt die Positionsnummer an und macht die Tastenzuordnung damit unmittelbar sichtbar; `title`-Tooltip und `aria-label` kündigen den jeweiligen Hotkey zusätzlich an (z. B. „Kopiere: … – Taste 3: kopieren").
* Ist der adressierte Favorit ein **Ordner**, öffnet der Hotkey — analog zum Klick — diesen Ordner statt zu kopieren.
* Der angesprochene Chip **scrollt bei eingeklappter/horizontal scrollender Leiste sanft ins Sichtfeld** und zeigt dieselbe **Kopier-Erfolgs-Animation** wie beim Klick, sodass die Aktion nachvollziehbar bestätigt wird.

**Sichere Auslösung** — die Hotkeys greifen bewusst nur dann, wenn sie niemanden stören:

* **kein Eingabefeld fokussiert** (kein `input`, `textarea`, `select` oder `contenteditable`) — die Sucheingabe und alle Textfelder bleiben unangetastet;
* **kein Dialog offen** (weder Prompt-, Ordner-, Verknüpfungs- noch Verschiebe-Modal, kein Kontextmenü);
* **keine Zusatztaste gedrückt** (kein `Strg`/`Ctrl`, `Alt`, `Meta`/`Cmd`, `Shift`) — Browser-Shortcuts wie `Strg+1` zum Tab-Wechsel bleiben damit vollständig erhalten;
* die **Favoritenleiste ist sichtbar**.

### 5.4 ⭐ Drag&Drop: Reihenfolge sortieren

Die Reihenfolge der Favoriten lässt sich **einfach per Drag&Drop** direkt in der Leiste umsortieren (realisiert mit **SortableJS**):

* **Desktop**: Chip mit der Maus greifen und an die gewünschte Position ziehen — der Reorder startet unmittelbar bei der ersten Bewegung; ein reiner Klick (ohne nennenswerte Bewegung) löst weiterhin das Kopieren aus.
* **Touch**: Ein **kurzer Wisch** scrollt die Leiste wie gewohnt; ein **kurzes Halten (~160 ms) und Ziehen** startet den Reorder. So bleiben Scrollen und Sortieren konfliktfrei getrennt (`delay: 160`, `delayOnTouchOnly`, `touchStartThreshold`).
* Während des Ziehens wird die **Scroll-Snap-Rastung deaktiviert**, der gezogene Chip erhält eine **angehobene Drag-Optik** (leichte Skalierung/Rotation, kräftiger Schatten) und der Zielplatz eine **gestrichelte Geist-Markierung** (`ghostClass`/`dragClass`/`chosenClass`).
* Beim Loslassen wird die **neue Reihenfolge sofort persistiert** (`localStorage`), eine Bestätigung „Favoriten-Reihenfolge gespeichert!" erscheint, und die Leiste rendert **komplett neu** — dabei werden **Positions-Badges, Akzentfarben *und* die Hotkey-Zuordnung automatisch neu vergeben**, sodass Nummerierung und Tastenkürzel stets der sichtbaren Reihenfolge entsprechen.
* Die Sortier-Instanz wird nach jedem Rendern frisch aufgesetzt und **erst ab zwei Favoriten** aktiviert. Ist SortableJS (z. B. offline und noch nicht gecacht) nicht verfügbar, bleibt die Leiste voll funktionsfähig — lediglich das Umsortieren per Drag entfällt (Graceful Degradation).

### 5.5 Weitere Dock-Eigenschaften

* **Erweitern/Einklappen**: Bei Überlauf erscheint ein **Toggle** (`#favorites-expand-toggle`), der die Leiste in eine **mehrzeilige Rasteransicht** aufklappt; auf Touch öffnet/schließt auch eine **vertikale Wischgeste** das Dashboard.
* **Overflow-Marker**: Links/rechts zeigen dezente Verläufe an, dass weiter gescrollt werden kann; die Scrollleiste blendet sich bei Interaktion ein und nach kurzer Ruhe wieder aus.
* **Footprint-Messung**: Die tatsächliche Dock-Höhe wird gemessen und als `--favorites-footprint` bereitgestellt, damit der Content darüber nie verdeckt wird.
* **Favorisieren von überall**: aus dem Prompt-Modal (Stern-Button), dem Kontextmenü, per Tastatur (`f`) oder per Rechts-Wisch auf einer Karte.
* **Alles löschen**: der Stern-mit-Schrägstrich-Button in der Top-Bar leert die Leiste nach Rückfrage.

Die Favoritenliste selbst wird als Array von Knoten-IDs unter dem `localStorage`-Schlüssel `favoritePrompts` gehalten und beim Laden gegen beschädigte/veraltete Daten abgesichert (nur nicht-leere String-IDs). Verweise auf zwischenzeitlich gelöschte Knoten werden beim Rendern automatisch aus der Liste entfernt.

---

## 6. Suche: Lexikalisch, Global & Semantisch

Die Suche ist ein eigenes Subsystem in `enhancements.js`, das sich über den Hook `getVisibleNodesForCurrentView` in die Render-Pipeline einklinkt.

### 6.1 Such-Bereiche (Scopes)

Drei umschaltbare Tabs unter dem Suchfeld:

* **Ordner** – durchsucht nur den aktuell geöffneten Ordner.
* **Global** – durchsucht die **gesamte** Bibliothek.
* **Semantik** – bedeutungsbasierte Suche über die gesamte Bibliothek (siehe 6.3). Ein Badge zeigt an, ob gerade das **neuronale Modell** („AI") oder die **Heuristik** („≈") aktiv ist.

### 6.2 Filter-Chips

Orthogonal zu den Scopes filtern vier Chips die Ergebnismenge: **Alle**, **★ Favoriten**, **🗂 Ordner**, **📝 Prompts**.

### 6.3 Semantische Suche (neuronale Embeddings + Heuristik-Fallback)

* **Neuronaler Pfad**: Bei aktivem Semantik-Scope wird lazy **Transformers.js** (`@huggingface/transformers`) geladen und das Modell **`Xenova/all-MiniLM-L6-v2`** (q8-quantisiert, browsergecacht) initialisiert. Knoten-Texte werden zu **Embeddings** verarbeitet (gecacht nach Inhalts-Hash) und per **Cosinus-Ähnlichkeit** gegen die Query gerankt.
* **Heuristik-Fallback**: Ist das Modell nicht verfügbar (offline, Ladefehler), greift **sofort** ein rein lokaler Scorer aus **Token-Overlap + Synonym-Expansion + Fuzzy-Matching (Levenshtein)** mit Titel-Gewichtung — es gibt also immer sofort brauchbare Ergebnisse, während das neuronale Ergebnis ggf. nachreicht.
* **Robustheit**: Debouncing (220 ms), **LRU-begrenzter Query-Cache** (max. 50 Einträge), deutsche Umlaut-Normalisierung (ä→ae etc.), Stopword-Filter und ein Synonym-Wörterbuch (u. a. mit Medizin-/Radiologie-Begriffen).

### 6.4 Lexikalische Suche & Trefferhervorhebung

Im Ordner-/Global-Scope läuft ein gewichteter lexikalischer Scorer: exakte Titeltreffer (100) > Titel-Präfix (40) > Titel-Teiltreffer (25) > Tag-Treffer (18) > Inhaltstreffer (8), mit tokenweisem Teil-Matching als Rückfallebene. Treffer im Kartentitel werden **präzise hervorgehoben** (`<mark class="search-hl">`) — inklusive einer Index-Rückrechnung, damit die Markierung trotz Umlaut-Normalisierung exakt sitzt.

### 6.5 Kontext-Ende

Jede echte Navigation (Ordner öffnen, Home, Breadcrumb, Zurück) sowie das Schließen der Suche setzen Scope, Filter, Tag und Query sauber zurück, sodass man nie in einem „hängengebliebenen" Suchzustand landet.

---

## 7. Tags

* **Tag-Editor im Prompt-Modal**: Unter dem Prompt-Text lassen sich **Tags als Chips** hinzufügen (Enter) und wieder entfernen (×). Änderungen werden debounced in die Cloud persistiert.
* **Tag-Chips auf Karten**: Bis zu drei Tags erscheinen automatisch auf jeder Karte.
* **Tag-Filter in der Suche**: Tags fließen sowohl in die lexikalische als auch in die semantische Bewertung ein und lassen sich als Filterkontext nutzen.

---

## 8. Navigation: Routing, Verlauf & Breadcrumb-Sprünge

### 8.1 Hash-Deep-Links (teilbare URLs)

Der aktuelle Zustand wird kontinuierlich in den URL-Hash gespiegelt: `#/n/<id>/<id>/…` für den Ordnerpfad, optional `…/p/<id>` für ein geöffnetes Prompt-Modal. So sind **einzelne Ordner und Prompts als Link teilbar** und beim Laden wird der Deep-Link rekonstruiert (`applyInitialDeepLink` → `navigateToPath`). Ein `hashLock` verhindert Rückkopplungsschleifen aus selbst ausgelösten `hashchange`-Events.

### 8.2 Echter Browser-Verlauf auf Desktop

`navigation.js` verwandelt Navigationsschritte in **echte History-Einträge** (`pushState`/`replaceState`), sodass **Browser-Zurück/Vor** und die **Maus-Seitentasten** korrekt durch den Ordnerbaum blättern. Ein gezieltes „User-Nav"-Flag unterscheidet echte Nutzeraktionen von reinen Re-Renders. Mobile behält seine eigene, schlankere Navigationslogik.

### 8.3 Breadcrumb-Sprungvorschau

Jeder Ordner-Schritt im Breadcrumb bekommt einen **Chevron** (bzw. Long-Press auf Touch), der ein **Popover** aller direkten Unterordner mit Kind-Anzahl öffnet — für Direktsprünge an jede Stelle. Das Popover positioniert sich viewport-sicher und schließt bei Außenklick, Escape oder Scroll.

### 8.4 Weitere Navigationswege

* **View-Transitions** (`performViewTransition`) sorgen für sanfte, richtungsabhängige Übergänge zwischen Ansichten (mit GSAP/Flip, wenn verfügbar).
* **Zurück-Edge-Geste** am linken Rand (Touch) und **fester Home-Button** ergänzen die Rückkehrpfade.

---

## 9. Bedienung: Tastatursteuerung & Karten-Wischgesten

### 9.1 Vollständige Tastatursteuerung des Karten-Grids

Ein sichtbarer Fokusring (`.kbd-focus`) wandert per Tastatur durch das Grid:

| Taste | Aktion |
|---|---|
| **Pfeiltasten** | Fokus nach links/rechts/oben/unten (spaltenbewusst berechnet). |
| **Home / End** | Erste / letzte Karte. |
| **Enter** | Ordner öffnen bzw. Prompt-Modal öffnen. |
| **Leertaste** | Prompt direkt kopieren (bzw. Ordner öffnen). |
| **f / F** | Fokussierte Karte favorisieren/entfernen. |
| **e / E** | Karte umbenennen. |
| **Entf / Rücktaste** | Karte löschen. |

Die Steuerung deaktiviert sich automatisch, wenn ein Modal offen ist, in einem Feld getippt wird oder Modifier-Tasten aktiv sind. Mausinteraktion hebt den Tastaturfokus auf, um Doppelfokus zu vermeiden; nach jedem Render wird der Fokus zurückgesetzt.

### 9.2 Zifferntasten-Hotkeys der Favoritenleiste

Zusätzlich zur Grid-Steuerung kopieren **`1`–`9` und `0`** die Favoriten an Position 1–10 (Details in Abschnitt 5.3). Beide Tastatur-Subsysteme koexistieren konfliktfrei (unterschiedliche Tastenräume, gleiche Schutzbedingungen).

### 9.3 Karten-Wischgesten (Touch)

* **Nach rechts wischen** → Karte **favorisieren** (mit Stern-Flash-Animation und Haptik).
* **Nach links wischen** → **Aktions-Tray** öffnet sich mit **Bearbeiten / Verschieben / Löschen**.
* Die Achse wird intelligent erkannt (horizontal vs. vertikal), sodass normales Scrollen unberührt bleibt; am linken Rand hat die Zurück-Edge-Geste Vorrang. Tippen außerhalb schließt offene Trays.

---

## 10. Karten-Verwaltung: Erstellen, Bearbeiten, Verschieben, Verknüpfen

* **Erstellen**: Über das Hinzufügen-Menü **neue Prompts** und **neue Ordner** anlegen.
* **Bearbeiten**: Prompt-Titel und -Inhalt im Modal editieren und speichern; Karten inline umbenennen (`startRenamingCard` mit Rename-Input und Escape-Abbruch).
* **Verschieben**: Über das Verschiebe-Modal (Ordnerbaum) oder per Drag&Drop im Organisieren-Modus.
* **Organisieren-Modus**: Aktiviert **SortableJS** auf dem Karten-Grid für **Umsortieren per Drag&Drop**; das Ziehen einer Karte auf eine andere kann Karten zu einem **neuen Ordner kombinieren** oder eine Karte **in einen Ordner** verschieben (mit Highlight-Rückmeldung des Drop-Ziels). Die neue Reihenfolge wird persistiert.
* **Verknüpfen**: **Prompt-** und **Ordner-Verknüpfungen** verweisen auf ein Ziel an anderer Stelle; das Original bleibt die Quelle der Wahrheit.
* **Löschen**: Einzeln oder als Mehrfachauswahl; entfernt zugleich zugehörige Favoriten und bereinigt hängende Verknüpfungen.

---

## 11. Mikrointeraktionen, Haptik & Skeletons

* **Skeletons**: Beim Start/Datenladen werden Platzhalter-Karten mit Shimmer angezeigt und beim ersten echten Render entfernt.
* **Ripple-Effekt**: Pointerdown auf Karten, Buttons, Chips, Scope-/Filter-Buttons und Favoriten-Chips erzeugt eine materialtypische Welle.
* **Stagger-Einblendung** der Karten über `--card-index`.
* **Kopier-Erfolgs-Animation**: Grünes Aufleuchten + Partikel-artiger Effekt (`enhancedCopySuccess`) am Kopierort.
* **Haptik-Brücken**: Kopieren, Favorisieren und Navigieren lösen abgestufte Vibration aus (sofern das Gerät sie unterstützt).
* Sämtliche Bewegungen respektieren **`prefers-reduced-motion`**.

---

## 12. Offline-Betrieb & Service Worker

`sw.js` (Version `v8-2026-07`) macht die App **echt offline-fähig** mit vier getrennten Caches und einer differenzierten Strategie-Matrix:

| Ressource | Strategie |
|---|---|
| **App-Shell** (HTML/CSS/JS/Icons/Manifest/`templates.json`) | **Stale-While-Revalidate** — sofortige Auslieferung aus dem Cache, Auffrischung im Hintergrund. |
| **CDN-Bibliotheken** (GSAP, SortableJS, Vivus, Hugging-Face-Modelle) | **Cache-First** mit Hintergrund-Refresh. |
| **`/api/templates`** | **Network-First**; der letzte erfolgreiche GET wird als Offline-Fallback vorgehalten (markiert per `X-Served-By`), letzter Ausweg ist die statische `templates.json`. POSTs werden nie abgefangen. |
| **Navigationen** | Network-First mit **Navigation-Preload**, Rückfall auf die gecachte App-Shell. |

Beim `install` werden alle Kern-Assets einzeln (fehlertolerant, `Promise.allSettled`) vorgeladen; beim `activate` werden veraltete Caches gelöscht und Clients übernommen. Ein **Update** wird erkannt und via Toast angekündigt („Update verfügbar – wird beim nächsten Start aktiv."); die App kann per `SKIP_WAITING`-Nachricht ein sofortiges Update anstoßen.

---

## 13. Datenhaltung, Cloud-Sync & Datenmodell

### 13.1 Datenmodell

Die Bibliothek ist ein rekursiver Baum. Wurzel ist ein Ordner (`{ id: "root", type: "folder", title: "Home", items: [...] }`). Knotentypen:

| Typ | Bedeutung | Wichtige Felder |
|---|---|---|
| `folder` | Ordner (enthält weitere Knoten) | `id`, `title`, `items[]`, optional `tags[]` |
| `prompt` | Prompt-Vorlage | `id`, `title`, `content`, optional `tags[]` |
| `folder-link` | Verknüpfung auf einen Ordner | `id`, `type`, `targetId` |
| `prompt-link` | Verknüpfung auf einen Prompt | `id`, `type`, `targetId` |

Zentrale Baum-Helfer: `findNodeById`, `findParentOfNode`, `resolveLinkedNode`, `pruneDanglingLinks`, `reorderCurrentNodeItemsFromDom`, `moveNode`, `combineIntoNewFolder`.

### 13.2 Hybrid-Sync (Cloudflare KV + LocalStorage + Cross-Tab)

* **Backend**: Eine Cloudflare-Pages-Function (`functions/api/templates.js`) bedient `GET`/`POST` auf `/api/templates` gegen einen **KV-Namespace `TEMPLATES_KV`** (Schlüssel `current_templates`). Fehlt der KV-Eintrag, lädt sie die statische `templates.json` als Fallback und legt sie initial im KV ab.
* **Konfliktschutz**: `POST` vergleicht den Client-Zeitstempel mit dem Serverstand; ist der Client älter, antwortet der Server mit **409 Conflict** samt Serverdaten. Der Client lädt dann automatisch den Cloud-Stand nach.
* **Optimistische UI**: Änderungen erscheinen sofort; `persistJsonData()` schreibt anschließend in die Cloud und aktualisiert den Zeitstempel.
* **Polling & Cross-Tab**: Die App pollt periodisch (`syncFromCloud`) und synchronisiert parallel geöffnete Tabs über einen **`BroadcastChannel('templates-cloud-sync')`**.
* **Pull-to-Refresh** erzwingt einen manuellen Cloud-Abgleich.

### 13.3 Import / Export

* **Download JSON**: Exportiert den aktuellen Baum als `templates.json`.
* **Upload JSON**: Import per **Drag&Drop** in die Ablagezone oder per Dateiauswahl; das Schema wird geprüft (`validateTemplateSchema`), danach in die Cloud übernommen.
* **Zurücksetzen**: Verwirft lokale Änderungen.

### 13.4 Lokale Zustände (`localStorage`-Schlüssel)

| Schlüssel | Inhalt |
|---|---|
| `favoritePrompts` | Array der Favoriten-IDs (zugleich die Drag&Drop-Reihenfolge). |
| `customTemplatesJsonCloud` | Lokaler Spiegel der Bibliotheksdaten. |
| `user-color-scheme` | Gewähltes Theme (`dark`/`light`). |
| (Zeitstempel-/Geräte-Keys) | Sync-Zeitstempel und Device-Orientation-Permission-Status. |

---

## 14. Theme-System & Vollbild

* **Theme-Umschaltung** (`applyColorScheme`) wechselt Dark/Light, persistiert die Wahl, tauscht Favicon/Logo und färbt die WebGL-Aurora um. Das Inline-Head-Skript verhindert jedes „Flash of wrong theme".
* **Vollbildmodus** (`#fullscreen-button`) nutzt die Fullscreen-API (mit Vendor-Präfix-Fallbacks) und passt Icon sowie Layout-Metriken an.
* **Bewegungspräferenzen** werden global über `setupMotionPreferenceHandling` beobachtet und an Aurora, Stagger und Mikrointeraktionen weitergereicht.

---

## 15. Tastaturkürzel & Gesten — Gesamtreferenz

### Tastatur (Desktop)

| Taste(n) | Aktion |
|---|---|
| **1–9** | Favorit an Position 1–9 kopieren (bzw. Ordner öffnen). |
| **0** | Favorit an Position 10 kopieren. |
| **Pfeiltasten** | Kartenfokus bewegen. |
| **Home / End** | Erste / letzte Karte fokussieren. |
| **Enter** | Ordner öffnen / Prompt-Modal öffnen. |
| **Leertaste** | Fokussierten Prompt kopieren. |
| **f** | Favorisieren/Entfernen. |
| **e** | Umbenennen. |
| **Entf / Rücktaste** | Löschen. |
| **Escape** | Kontextmenü / Rename / erweitertes Dock / Modale schließen. |
| **Browser-Zurück/Vor, Maus-Seitentasten** | Durch Ordnerverlauf blättern. |

> Alle Favoriten-Hotkeys sind inaktiv, während ein Textfeld fokussiert oder ein Dialog geöffnet ist, und ignorieren Modifier-Kombinationen (`Strg`/`Alt`/`Cmd`/`Shift`).

### Gesten (Touch / Maus)

| Geste | Aktion |
|---|---|
| **Tipp auf Favoriten-Chip** | Prompt kopieren / Ordner öffnen. |
| **Halten & Ziehen eines Favoriten-Chips** | Favoriten-Reihenfolge per Drag&Drop sortieren. |
| **Kurzer Wisch im Dock** | Favoritenleiste horizontal scrollen. |
| **Vertikaler Wisch am Dock** | Favoriten-Dashboard auf-/zuklappen. |
| **Karte nach rechts wischen** | Favorisieren. |
| **Karte nach links wischen** | Aktions-Tray (Bearbeiten/Verschieben/Löschen). |
| **Long-Press auf Karte/Chip** | Kontextmenü. |
| **Long-Press auf Breadcrumb-Schritt** | Unterordner-Popover. |
| **Pull-to-Refresh** | Cloud-Abgleich. |
| **Drag im Organisieren-Modus** | Karten sortieren / kombinieren / in Ordner verschieben. |

---

## 16. Barrierefreiheit

* Durchgängige **ARIA-Auszeichnung**: `aria-label`, `role`, `aria-expanded`, `aria-hidden`, `role="listitem"`, `sr-only`-Texte.
* **Sichtbare Fokusringe** (`:focus-visible`) und ein Tastatur-Fokusring im Grid.
* **Hotkey-Ankündigung**: Favoriten-Chips kommunizieren ihren Hotkey über `aria-label` und `title`; das Positions-Badge ist als rein visuell (`aria-hidden`) markiert, um Doppelvorlesen zu vermeiden.
* **Reduced-Motion-Respekt** in allen Animationsschichten.
* **Kontrast** und lesbare Typografie in beiden Themes; dynamische Schriftskalierung hält Titel/Vorschau lesbar.

---

## 17. Performance-Architektur

* **`content-visibility: auto`** + `contain-intrinsic-size` für Karten und Favoriten-Chips überspringt Off-Screen-Rendering.
* **`requestAnimationFrame`-gebündelte Layout-Frames** (Favoriten-Metriken, Footprint, Viewport) statt synchroner Layout-Thrash.
* **`ResizeObserver`/`IntersectionObserver`** für bedarfsgesteuerte Neuberechnung und Aurora-Pause.
* **Aurora**: 30-fps-Drossel, DPR-Deckel, Low-Power-GPU, Pause im Hintergrund-Tab.
* **Debounced** Suche, Tag-Persistenz und semantische Läufe; **LRU-begrenzter** Embedding-/Query-Cache.
* **Lazy Loading** aller CDN-Bibliotheken und des neuronalen Modells (nur bei tatsächlichem Bedarf).
* **Activity-Detection** drosselt teure Effekte bei Inaktivität.

---

## 18. Code-Architektur & Dateistruktur

```
AITemplates/
├── index.html            # Struktur, Top-Bar, Modale, Dock, SVG-Templates, Head-Theme-Skript
├── style.css             # Liquid-Glass-Designsystem, Tokens, alle Komponenten (~112 KB)
├── enhancements.css      # Suche, Tags, Skeletons, Ripples, Ergebnis-Banner, Popover
├── navigation.css        # Breadcrumb-Popover, Wisch-Trays, Tastatur-Fokusring
├── script.js             # Kernlogik: Rendering, Navigation, Favoriten+Hotkeys+Drag&Drop,
│                         #   Modale, Persistenz/Sync, Kontextmenü, Vollbild, PWA, Haptik
├── enhancements.js       # Additive Schicht: semantische Suche, Tags, Deep-Links,
│                         #   Mikrointeraktionen, Service-Worker-Registrierung
├── navigation.js         # Additive Schicht: Desktop-History, Breadcrumb-Sprünge,
│                         #   Grid-Tastatursteuerung, Karten-Wischgesten
├── aurora-webgl.js       # WebGL-Aurora-Engine (Fragment-Shader, FBM/Domain-Warping)
├── sw.js                 # Service Worker (4 Caches, Strategie-Matrix, Offline-Fallbacks)
├── manifest.json         # PWA-Manifest (Icons, Display, Theme)
├── browserconfig.xml     # Microsoft-Tiles
├── templates.json        # Standard-Bibliothek (12 Hauptordner, 25 Ordner, 97 Prompts)
├── functions/
│   └── api/templates.js  # Cloudflare-Pages-Function (KV-Backend, GET/POST, Konfliktschutz)
└── icons/                # Animierte SVG-Icons (Dark/Light) + PNGs (192/512/maskable)
```

### 18.1 Schichtenmodell & Lade-Reihenfolge

Die Skripte laden **`defer`** in dieser Reihenfolge: externe Bibliotheken (Vivus, SortableJS, GSAP, Flip) → **`script.js`** (Kern) → **`aurora-webgl.js`** → **`enhancements.js`** → **`navigation.js`**. Die Erweiterungsschichten warten per Poll-Boot, bis der Kern bereitsteht, und **umhüllen** dann gezielt globale Funktionen (`renderView`, `openPromptModal`, `navigateToNode`, `closeModal`, `applyColorScheme`, …), ohne die Kernlogik zu verändern. Kern-Zustand (`jsonData`, `currentNode`, `pathStack`, `favoritePrompts`, `currentSearchQuery`) und Kern-Funktionen sind als globale Bindungen für die Schichten zugänglich.

### 18.2 Externe Bibliotheken

| Bibliothek | Zweck | Ohne sie |
|---|---|---|
| **SortableJS** | Drag&Drop (Favoriten-Reihenfolge **und** Karten-Organisieren) | Sortieren per Drag entfällt, sonst voll nutzbar. |
| **GSAP + Flip** | View-Transitions & flüssige Layout-Animationen | Übergänge fallen auf einfache Umschaltung zurück. |
| **Vivus** | SVG-Strichanimationen (Icons) | Icons erscheinen statisch. |
| **Transformers.js** (lazy) | Neuronale semantische Suche | Heuristik-Suche übernimmt. |

Alle werden vom Service Worker Cache-First vorgehalten, sodass sie auch offline verfügbar bleiben.

---

## 19. Betrieb, Deployment & Konfiguration

* **Lokal**: Statischen Server im Projektverzeichnis starten (z. B. `python3 -m http.server`) und `index.html` öffnen. Ohne `/api/templates`-Backend nutzt die App die statische `templates.json` bzw. die SW-Fallbacks.
* **Produktion (Cloudflare Pages)**: Repository als Pages-Projekt deployen; die Function unter `functions/api/templates.js` wird automatisch als Route `/api/templates` bereitgestellt. **Voraussetzung**: Ein **KV-Namespace muss als `TEMPLATES_KV`** an das Projekt gebunden sein — andernfalls antwortet die Function mit einer klaren 500-Fehlermeldung.
* **Erststart** ohne KV-Inhalt: Die Function zieht `templates.json` als Seed in den KV.
* **Keine Umgebungs-Geheimnisse** im Client nötig; die App ist ein reines statisches Frontend plus eine schlanke KV-Function.

---

## 20. Graceful Degradation & Fallback-Matrix

| Fehlende Fähigkeit | Verhalten |
|---|---|
| **Kein WebGL** | CSS-Aurora-Blobs bleiben sichtbar. |
| **`prefers-reduced-motion`** | Aurora als Standbild; alle Animationen reduziert. |
| **Kein SortableJS** (z. B. offline vor Cache) | Favoriten-Drag&Drop und Karten-Organisieren entfallen; alles andere funktioniert. |
| **Kein GSAP/Flip** | Ansichtswechsel ohne animierte Transition. |
| **Kein neuronales Modell / offline** | Heuristische semantische Suche. |
| **Kein Clipboard-API / unsicherer Kontext** | `execCommand('copy')`-Fallback über ein verstecktes Textfeld. |
| **Offline** | Service-Worker liefert App-Shell, Bibliotheken und letzten API-Stand; POSTs werden nicht abgefangen. |
| **Kein KV gebunden** | Function nennt den Fehler klar; Client fällt (via SW) auf statische Daten zurück. |
| **Keine Vibration-API** | Haptik wird still übersprungen. |
| **Beschädigte `favoritePrompts`** | Werden beim Laden gefiltert; ungültige/hängende IDs beim Rendern entfernt. |

---

### 🏁 Zusammenfassung

**Prompt-Templates** verbindet die Schlichtheit einer Zero-Build-Vanilla-App mit der Anmutung und dem Bedienkomfort einer nativen, hochwertigen Anwendung: eine lebendige WebGL-Aurora hinter mehrschichtigem Liquid Glass, eine bis in Tastatur, Gesten und Haptik durchdachte Bedienung, eine neuronale Suche mit robustem Offline-Fallback und ein konfliktsicherer Hybrid-Sync. Das **Favorites-Dock** ist dabei das produktive Herzstück — mit **aufsteigend nummerierten Zifferntasten-Hotkeys** zum blitzschnellen Kopieren und **Drag&Drop-Sortierung**, deren Reihenfolge Nummerierung und Hotkeys automatisch neu vergibt. Jede Funktion existiert in einer Touch- und einer Desktop-Variante, und jede optionale Fähigkeit degradiert sauber — die App bleibt unter allen Umständen voll benutzbar.
