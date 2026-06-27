# 🌌 Prompt-Templates — Die ultimative Prompt-Management Web-App

**Prompt-Templates** ist eine hochmoderne, performante und visuell herausragende
Single-Page-Application (SPA) zur Verwaltung, Organisation, semantischen Suche und
blitzschnellen Nutzung von Text- und KI-Prompts. Die Anwendung verbindet eine
**Apple-Cupertino-Liquid-Glass-Ästhetik** mit einer **GPU-gerenderten WebGL-Aurora**,
einem **neuronalen Such-System**, **teilbaren Deep-Links**, einem **Tag- & Smart-Folder-
System**, einer **vollständigen Tastatur- und Gestensteuerung**, einem **für Mobilgeräte
optimierten, aufgeräumten Bedien-Layout** sowie **vollwertigem Offline-Betrieb als
installierbare PWA**.

Dieses Dokument beschreibt den **vollständigen aktuellen Stand** der Anwendung —
jeden Bildschirm, jede Komponente, jede Interaktion, jede Datei und jede Design-
Entscheidung — lückenlos und systematisch kategorisiert. Es ist bewusst **kein
Changelog**, sondern eine vollständige Momentaufnahme des Ist-Zustands.

---

## 📑 Inhaltsverzeichnis

1. [Überblick & Kernkonzept](#1-überblick--kernkonzept)
2. [Design-Philosophie: Liquid Glass & WebGL-Aurora](#2-design-philosophie-liquid-glass--webgl-aurora)
3. [Mobile-First & PWA-Exzellenz](#3-mobile-first--pwa-exzellenz)
4. [UI- & UX-Komponenten im Detail](#4-ui--ux-komponenten-im-detail)
5. [Suche: Lexikalisch, Global & Semantisch](#5-suche-lexikalisch-global--semantisch)
6. [Tags & Smart Folders](#6-tags--smart-folders)
7. [Navigation: Routing, Verlauf & Breadcrumb-Sprünge](#7-navigation-routing-verlauf--breadcrumb-sprünge)
8. [Bedienung: Tastatursteuerung & Karten-Wischgesten](#8-bedienung-tastatursteuerung--karten-wischgesten)
9. [Mikrointeraktionen, Haptik & Skeletons](#9-mikrointeraktionen-haptik--skeletons)
10. [Offline-Betrieb & Service Worker](#10-offline-betrieb--service-worker)
11. [Datenhaltung, Cloud-Sync & Datenmodell](#11-datenhaltung-cloud-sync--datenmodell)
12. [Weitere Funktionen & Produktivität](#12-weitere-funktionen--produktivität)
13. [Tastaturkürzel & Gesten — Gesamtreferenz](#13-tastaturkürzel--gesten--gesamtreferenz)
14. [Barrierefreiheit](#14-barrierefreiheit)
15. [Performance-Architektur](#15-performance-architektur)
16. [Code-Architektur & Dateistruktur](#16-code-architektur--dateistruktur)
17. [Betrieb, Deployment & Konfiguration](#17-betrieb-deployment--konfiguration)
18. [Graceful Degradation & Fallback-Matrix](#18-graceful-degradation--fallback-matrix)
19. [Qualitätssicherung & Tests](#19-qualitätssicherung--tests)

---

## 1. Überblick & Kernkonzept

Prompt-Templates organisiert Prompts in einer **hierarchischen Ordnerstruktur**. Es gibt
zwei elementare Knotentypen — **Ordner** (Navigation) und **Prompts** (kopierbare Texte) —
sowie deren **Verknüpfungen** (Symlinks), mit denen ein Element ohne Duplikat in mehreren
Ordnern erscheinen kann. Über diese Basis legt die App mehrere Produktivitäts- und
Erlebnis-Schichten:

* **Sofort-Kopieren:** Ein Tap auf eine Prompt-Karte kopiert den Inhalt direkt in die
  Zwischenablage — der Kern-Workflow ist auf minimale Latenz getrimmt.
* **Drei Suchmodi:** Filtern im aktuellen Ordner, globale Suche über den gesamten Baum
  und **semantische Suche** mit neuronalen Embeddings (mit heuristischem Offline-Fallback).
* **Wissensorganisation:** Frei vergebbare **Tags** und automatisch generierte
  **Smart Folders** (Favoriten, Zuletzt verwendet, Häufig genutzt, Tag-Sammlungen).
* **Komplette Bedienbarkeit:** **Tastatursteuerung** des gesamten Karten-Grids, **echter
  Browser-Verlauf** auf Desktop, **Breadcrumb-Sprungvorschau** und **Karten-Wischgesten**
  auf Touch-Geräten.
* **Mobil perfektioniert:** Eine **aufgeräumte, niemals überladene Top-Bar** mit einem
  kontextbewussten **„Mehr"-Overflow-Menü**, bündig angedockter Favoritenbar und
  pixelgenauer **Safe-Area-Behandlung** (Notch / Dynamic Island / Home-Indicator).
* **Geräteübergreifend:** Echtzeit-Synchronisierung über einen Cloudflare-Worker (KV),
  lokaler Offline-Cache und installierbare PWA mit Service-Worker.
* **Premium-Erlebnis:** GPU-Aurora, Liquid-Glass-Material, Mikrointeraktionen, Haptik,
  3D-Tilt, Partikel und butterweiche View-Transitions.

Die App ist bewusst **framework-frei** (kein React/Vue) für maximale Kontrolle und
minimale Ladezeit. Schwergewichtige Fähigkeiten (z. B. das neuronale Suchmodell) werden
**lazy** und nur bei Bedarf nachgeladen. Sämtliche Erweiterungen sind **additiv** als
eigene Schichten implementiert, ohne die Kernlogik zu verändern.

---

## 2. Design-Philosophie: Liquid Glass & WebGL-Aurora

### 2.1 Das 5-Layer Liquid Glass System
Jedes gehobene UI-Element (Karten, Modals, Top-Bar, Favorites-Dock, Banner, Chips,
Popover, „Mehr"-Menü) nutzt eine geschichtete CSS-Komposition, die physisches Glas
simuliert:

1. **Highlight (Lichtreflexion):** Radialer Gradient an der oberen linken Kante
   (`--glass-highlight`).
2. **Refraktion (Lichtbrechung):** Diagonaler Gradient (`--glass-refraction`).
3. **Shadow-Overlay (innere Tiefe):** Abgedunkelter Bereich unten rechts
   (`--glass-shadow-overlay`).
4. **Base Background (Grundfärbung):** Halbtransparenter Basiston (`--glass-bg`).
5. **Backdrop-Filter:** `backdrop-filter: blur(...) saturate(...) brightness(...)` erzeugt
   den iOS-Vibrant-Look, ergänzt durch **Specular-Highlights** und Drop-Shadows.

Sämtliche Materialwerte sind als zentrale **CSS Custom Properties** in `:root` definiert
und werden bei Theme-Wechsel über `html[data-color-scheme="light|dark"]` umgeschaltet.

### 2.2 WebGL-Aurora (Echtzeit-Shader)
Der kosmische Hintergrund wird durch eine **echtzeit-gerenderte Aurora** auf Basis eines
**Fragment-Shaders** erzeugt (`aurora-webgl.js`):

* **Technik:** Vollbild-Triangle, Fragment-Shader mit **fraktalem Brownschen Rauschen
  (FBM)** und **Domain-Warping** — zwei überlagerte, gewarpte Rauschfelder erzeugen weiche,
  driftende Nordlicht-Schleier.
* **Theme-adaptiv:** Eigene Akzent-Paletten für Hell-/Dunkelmodus; bei jedem Theme-Wechsel
  live umgestellt.
* **Performance & Akkuschonung:** DPR auf 1.5 gedeckelt, `low-power`-Kontext, Render-Loop
  pausiert automatisch bei Tab-Wechsel (`visibilitychange`).
* **Reduced Motion:** Bei `prefers-reduced-motion: reduce` ein einziges statisches Standbild.
* **Sauberer Fallback:** Ohne WebGL bleiben die CSS-Aurora-Blobs (`.shape1–3`) sichtbar.

### 2.3 Farb- & Theme-System
* **Cupertino-Palette:** Apple System Colors als semantische Akzente.
* **Hell-/Dunkelmodus:** systembasiert (`prefers-color-scheme`) **und** manuell per Toggle
  (`data-color-scheme`), persistiert in `localStorage` (`user-color-scheme`). Ein
  Inline-Skript im `<head>` setzt das Schema **vor dem ersten Paint** (kein Flash).
* **Dynamische `theme-color`:** Die Statusleisten-Farbe wird je Ansicht aktualisiert und
  respektiert dabei die **manuelle** Schema-Wahl (nicht nur die Systempräferenz).

---

## 3. Mobile-First & PWA-Exzellenz

### 3.1 Safe Area, Notch & Dynamic Island (pixelgenau)
Die Anwendung ist konsequent **edge-to-edge** ausgelegt (`viewport-fit=cover`) und behandelt
die System-Sicherheitsbereiche exakt, ohne tote Lücken:

* **Top-Bar als einzige Quelle der Wahrheit:** Die `fixed` positionierte Top-Bar reicht
  unter die Notch/Dynamic Island; ihr `padding-top` und `min-height` schließen
  `env(safe-area-inset-top)` ein. JavaScript misst die **tatsächliche** gerenderte Höhe und
  schreibt sie in `--top-bar-height` (inkl. Inset). **Alle** darunter platzierten Elemente
  (Karten-Grid, Header, Such-Toolbar, Pull-to-Refresh, fixierter Zurück-Button) richten sich
  ausschließlich an `--top-bar-height` aus — der Inset wird **niemals doppelt** addiert.
  Dadurch entsteht auf Geräten mit großer Notch (z. B. iPhone 14 Pro Max, ~59 px) keine
  überflüssige Leerfläche zwischen Statusleiste und Inhalt. Bereits der erste Paint sitzt
  korrekt, weil der `--top-bar-height`-Fallback den Inset einschließt, bevor JS misst.
* **Bündig angedockte Favoritenbar:** Auf Mobilgeräten dockt die Favoritenbar **bündig an
  die untere Display-Kante** (volle Breite, eckige Unterkante). Das Glas-Panel füllt bis zur
  Kante; der `env(safe-area-inset-bottom)`-Home-Indicator-Abstand wird als **inneres**
  Padding gehalten, sodass die Chips sicher über dem Home-Indicator liegen, **ohne** einen
  toten dunklen Streifen darunter. Auf Desktop bleibt die schwebende, allseitig gerundete
  Karte erhalten.
* **Grid-Polster:** Das Karten-Grid reserviert unten genug Platz, damit Inhalte nicht hinter
  der Favoritenbar verschwinden (`--favorites-footprint`, per ResizeObserver gemessen).

### 3.2 Natives Interaktions-Gefühl
* **Auto-Zoom-Schutz:** Alle Eingabefelder (inkl. Tag-Editor und Suchfeld) `font-size: 16px`.
* **Overscroll:** Bounce per `overscroll-behavior-y: none` deaktiviert.
* **Touch-Targets:** Unter `@media (pointer: coarse)` mindestens `44×44px`.
* **Tap-Feedback:** `:active`-States, Ripple-Effekt und Haptik statt grauem Tap-Highlight.
* **DVH:** Modal-/Container-Höhen nutzen `dvh` für ruckelfreies Tastatur-Verhalten.

### 3.3 Installierbarkeit
* Vollständiges Web-App-Manifest (`manifest.json`): Icons (192/512, regulär + maskable),
  `display: standalone`, Scope, Theme-/Background-Farbe.
* Install-Button fängt `beforeinstallprompt` ab; reagiert auf `appinstalled`.
* Service Worker (`sw.js`) macht die App vollständig offline-fähig (siehe §10).

---

## 4. UI- & UX-Komponenten im Detail

### 4.1 Top-Bar (responsiv & aufgeräumt)
Die `fixed` positionierte Top-Bar ist der Liquid-Glass-Ankerpunkt der App. Sie enthält den
**kontextsensitiven Zurück-Button** (am Wurzelknoten unsichtbar, behält aber seinen Platz,
um Layout-Sprünge zu vermeiden), die **Breadcrumb-Navigation** (horizontal scrollbar, jeder
Schritt klickbar und mit Sprung-Chevron, siehe §7.3), das **Hinzufügen-Menü**
(Prompt/Ordner/Verknüpfungen), den **Organisieren-Toggle**, **Zurücksetzen**, das
**JSON-Menü** (Download/Upload), den **Cloud-Status-Indikator**, den **Theme-Toggle**, den
**Install-Button**, **Favoriten-leeren**, den **Vollbild-Toggle**, den **Such-Toggle** und
das **App-Logo** (Home).

**Kräftige, gut lesbare Icons:** Die Icons der Top-Bar verwenden vollen Kontrast
(`--fg-1`) statt der gedämpften Sekundärfarbe, sodass sie auf dem Glas-Material klar und
scharf erscheinen.

#### Mobiles Overflow-System („Mehr"-Menü)
Damit die Leiste auf schmalen Viewports (`≤ 640 px`) niemals überladen wirkt, greift ein
**kontextbewusstes Overflow-System**:

* **Direkt erreichbare Primäraktionen:** Zurück, Breadcrumb, **Hinzufügen (＋)**, **Suche**
  und **Startseite (Logo)** bleiben jederzeit in der Leiste.
* **Sekundäraktionen im „Mehr"-Menü (⋯):** Organisieren, JSON-Download/-Upload,
  Zurücksetzen, Theme-Wechsel, Vollbild, Installieren und Favoriten-leeren wandern in ein
  schwebendes Glas-Menü.
* **Kontextbewusster Aufbau:** Das Menü wird bei jedem Öffnen **dynamisch** neu erzeugt und
  enthält ausschließlich die **aktuell verfügbaren** Aktionen — ermittelt anhand des
  Inline-`display`-Status der Original-Buttons. Jeder Eintrag **leitet den Klick an den
  bestehenden Handler des Original-Buttons weiter** (kein Logik-Duplikat). JSON-Download/
  -Upload werden als zwei direkte Einträge angeboten.
* **Robuste Darstellung:** Das Menü ist rechtsbündig verankert, in der Breite begrenzt
  (`min(18rem, calc(100vw − 5rem))`) und bricht lange Beschriftungen um, sodass es nie über
  den linken Bildschirmrand hinausragt; bei vielen Aktionen oder geringer (Landscape-)Höhe
  wird es scrollbar (`max-height` + `overflow-y`).
* **Barrierefrei:** `aria-haspopup`, `aria-expanded`, `role="menu"`/`role="menuitem"`;
  Schließen per Außenklick, Auswahl oder **Escape** (Fokus kehrt zum ⋯-Button zurück).
* **Sync-Status mobil ausgeblendet:** Der reine Cloud-Status-Indikator wird auf Mobilgeräten
  nicht angezeigt (die Synchronisierung läuft unverändert im Hintergrund). Die mobile Leiste
  zeigt damit nur: Zurück · Breadcrumb · ＋ · Suche · ⋯ · Logo.
* **Desktop unverändert:** Ab `> 640 px` sind alle Buttons direkt sichtbar; das ⋯-Menü ist
  ausgeblendet.

### 4.2 Karten (Prompt- & Ordner-Karten)
Das Grid (`cards-container`) skaliert dynamisch via `auto-fit`/`minmax` mit Clamp-Werten.

* **Zwei Typen:** Ordner-Karten (Navigation) und Prompt-Karten (Kopieren).
* **3D-Tilt:** Auf Desktop maus-positions-abhängiger 3D-Tilt mit Glow.
* **Gestaffeltes Einblenden:** Karten erscheinen nacheinander mit Bounce; jenseits der
  ersten 12 übernimmt ein per JS gesetzter `--card-index`.
* **Schnell-Aktionen:** Hover/Edit-Mode blendet runde Buttons ein (Editieren, Löschen,
  Expandieren, Kopieren).
* **Kontextmenü:** Rechtsklick / Long-Press öffnet ein schwebendes Menü (Favorisieren,
  Umbenennen, Verschieben, Löschen) — auch für Mehrfachauswahl. Das Menü stellt sein
  Item-Markup robust wieder her, falls zuvor das Leerflächen-Menü aktiv war.
* **Karten-Dekorationen:** Tag-Chips (bis zu 3), Usage-Badge (Kopier-Häufigkeit ab 3),
  Treffer-Hervorhebung (`<mark>`) bei aktiver Suche.
* **Tastatur-Fokusring:** Bei Tastaturnavigation umrandet ein deutlicher Indigo-Glow die
  fokussierte Karte (`.kbd-focus`, siehe §8.1).
* **Wisch-Affordanzen (Touch):** Rechts-Wisch = Favoriten-Flash, Links-Wisch enthüllt einen
  Aktionstray (siehe §8.2).

### 4.3 Favorites-Dock
Smartes Dock am unteren Rand: Chips mit individueller Akzentfarbe, Fluid-Layout
(`full`/`compact`), Swipe-to-Expand, Resize-Observer-gesteuerte Footprint-Berechnung,
Sparkle-Mikroanimation. Selbstheilend: ungültige Favoriten werden beim Rendern entfernt.
Auf Mobilgeräten ist das Dock **bündig an die Display-Unterkante angedockt** (volle Breite,
eckige Unterkante, Home-Indicator-Abstand als inneres Padding, siehe §3.1); auf Desktop
schwebt es als allseitig gerundete, zentrierte Karte.

### 4.4 Modal-System & Overlays
iOS-Sheets, die von unten gleiten: **Prompt-Detail**, **Ordner erstellen**, **Verknüpfen**,
**Verschieben**, **JSON-Import**.

* **Prompt-Modal:** Voller Text (read-only/editierbar), Favoriten-, Edit-, Speichern-,
  Kopier- und Schließen-Buttons.
* **Tag-Editor:** Direkt unter dem Prompt-Text; entfernbare Tag-Chips + Eingabefeld;
  Änderungen werden sofort persistiert/synchronisiert; im „Neuer Prompt"-Modus ausgeblendet.
* **Verschieben-Dialog:** Ordnerbaum mit Einrückung; gesperrt werden das Element selbst,
  sein aktueller Elternordner **und der gesamte eigene Teilbaum** (Zyklus-Schutz).

### 4.5 Such-Toolbar
Schwebendes Glas-Panel mit Suchfeld und erweiterter Steuerung: Scope-Umschalter (Ordner/
Global/Semantik) und Filter-Chips (Alle/Favoriten/Zuletzt/Ordner/Prompts).

### 4.6 Ergebnis-Banner & Smart-Collections-Leiste
* **Ergebnis-Banner:** Bei aktiver Suche/Sammlung Kontext (z. B. „Semantische Suche ·
  neuronal", „# medizin"), Trefferzahl und Zurücksetzen-Button.
* **Smart-Collections-Leiste:** Auf der Startseite Sammlungs-Chips + Tag-Wolke (siehe §6).

### 4.7 Breadcrumb-Sprung-Popover
Ein schwebendes Glas-Popover, das die Unterordner eines Breadcrumb-Schritts zum
Direktsprung anbietet (siehe §7.3).

### 4.8 Benachrichtigungen (Toasts)
Zentrale `showNotification`-Komponente: Typen `info`/`success`/`error`, Häkchen-Icon bei
Erfolg, automatisches Ausblenden.

---

## 5. Suche: Lexikalisch, Global & Semantisch

Dreistufiges System (`enhancements.js`), implementiert durch Umhüllung von
`getVisibleNodesForCurrentView` und `renderView`.

### 5.1 Such-Bereiche (Scopes)
| Scope | Verhalten |
|-------|-----------|
| **Ordner** | Filtert nur den aktuell geöffneten Ordner (Standard). |
| **Global** | Durchsucht den gesamten Baum. |
| **Semantik** | Neuronale Ähnlichkeitssuche über den gesamten Baum. |

Das Schließen der Suche setzt Scope, Filter und Sammlung zurück und kehrt sauber zur
Ordneransicht zurück (deckt Toggle, Escape und Außenklick ab).

### 5.2 Filter-Chips
**Alle**, **★ Favoriten**, **🕑 Zuletzt**, **🗂 Ordner**, **📝 Prompts** — schränken die
Kandidatenmenge zusätzlich ein.

### 5.3 Semantische Suche (neuronale Embeddings)
* **Neuronaler Pfad:** Beim ersten semantischen Suchlauf wird **lazy** Transformers.js
  (`@huggingface/transformers`) geladen und das quantisierte Modell
  **`Xenova/all-MiniLM-L6-v2`** (`dtype: 'q8'`) initialisiert. Pro Knoten (Titel + Inhalt +
  Tags) wird ein **Embedding** berechnet, **pro Sitzung nach Inhalts-Hash gecacht** und per
  **Kosinus-Ähnlichkeit** gerankt.
* **Inkrementelles Ranking:** Während das Modell rechnet, erscheint sofort ein
  **heuristisches Vorschau-Ranking**; sobald neuronale Scores vorliegen, rendert die Ansicht
  automatisch neu.
* **Begrenzter Query-Cache:** Score-Ergebnisse pro Suchanfrage werden zwischengespeichert,
  aber **LRU-artig auf 50 Einträge begrenzt**, damit der Speicher über lange Sitzungen nicht
  unbegrenzt wächst.
* **Heuristischer Offline-Fallback:** Ohne Netz/Modell greift ein lexikalisch-semantischer
  Scorer (Token-Overlap + **deutsche Synonym-Expansion** + **Fuzzy/Levenshtein** +
  Titel-Gewichtung). Die App ist damit **immer** semantisch durchsuchbar.
* **Modus-Anzeige:** Ein Badge am „Semantik"-Tab signalisiert „AI" (neuronal) bzw. „≈"
  (Heuristik); der Banner nennt den genutzten Modus.

### 5.4 Lexikalische Suche & Hervorhebung
Gewichtetes Scoring (exakter Titel-Match > Titel-Präfix > Titel-Teilstring > Tag-Treffer >
Inhalts-Treffer > Token-Teiltreffer). Treffer im Kartentitel werden mit
`<mark class="search-hl">` markiert. Da die Normalisierung Umlaute/ß längenverändernd
ersetzt (`ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`), bildet die Hervorhebung die normalisierten
Trefferindizes **exakt auf die Original-Offsets zurück** — so sitzt das `<mark>` auch bei
Titeln mit Umlauten (z. B. „Über Bilder", „Größe ändern") immer korrekt auf dem Treffer.

### 5.5 Robustheit
Jeder Suchpfad ist in `try/catch` gekapselt; bei Fehler fällt die App auf die einfache
`includes`-Filterung zurück.

---

## 6. Tags & Smart Folders

### 6.1 Tags
* **Datenmodell:** Prompts (optional auch Ordner) tragen ein optionales `tags: string[]`.
* **Bearbeitung:** Tag-Editor im Prompt-Modal (Hinzufügen per Enter, Entfernen per ×),
  case-/umlaut-insensitive Duplikatsperre.
* **Persistenz:** Teil von `jsonData`, Sync und Export.
* **Sichtbarkeit:** Tag-Chips auf Karten und als anklickbare Filter.

### 6.2 Smart Folders (virtuelle Sammlungen)
Auf der Startseite über den Karten: **★ Favoriten**, **🕑 Zuletzt verwendet**,
**🔥 Häufig genutzt** und eine **Tag-Wolke** (Top 12 nach Häufigkeit). Ein Klick öffnet die
Sammlung als virtuelle, globale Ergebnisansicht. Sammlungen sind rein abgeleitet und
verändern die echte Ordnerstruktur nicht.

### 6.3 Usage- & Recency-Tracking
Lokal in `localStorage` (`pt-usage-stats-v1`): `{ usage: { [id]: { count, last } },
recent: [id, …] }`. Erfasst Kopiervorgänge (Zähler) und Öffnungen (Zeitstempel). Speist
Smart Folders, Usage-Badges und den „Zuletzt"-Filter. Die jüngste Liste ist auf 24 Einträge
begrenzt; Schreibvorgänge sind entprellt.

---

## 7. Navigation: Routing, Verlauf & Breadcrumb-Sprünge

### 7.1 Hash-Deep-Links
* **URL-Schema:** `#/n/<ordnerId>/<ordnerId>/…`, zusätzlich `…/p/<promptId>` bei offenem
  Prompt-Modal.
* **Eingehende Links:** Beim Laden und bei `hashchange` werden die Ziel-IDs aufgelöst, die
  vollständige Vorfahren-Kette via `buildPath` rekonstruiert und dorthin navigiert; ein
  verlinktes Prompt-Modal wird bei Bedarf geöffnet.
* **Doppel-Navigations-Schutz:** Stimmt der Zustand bereits mit dem Hash überein, wird die
  Navigation übersprungen.

### 7.2 Echter Browser-Verlauf auf Desktop
`navigation.js` implementiert einen vollwertigen Vor-/Zurück-Verlauf auf Desktop:

* **Mechanik:** Bei jeder echten Nutzer-Navigation (Karten-/Breadcrumb-/Home-/Zurück-Klick)
  wird ein **echter History-Eintrag** angelegt. Da die Deep-Link-Schicht den aktuellen
  Eintrag per `replaceState` normalisiert, stellt der Verlaufs-Controller den vorigen
  Eintrag wieder her und legt anschließend per `pushState` einen neuen an — so bleibt die
  komplette Ordnerhistorie erhalten.
* **Bedienung:** Browser-**Zurück/Vorwärts**-Buttons **und Maus-Seitentasten** blättern
  durch die besuchten Ordner. Zurück aus einem geöffneten Prompt schließt das Modal.
* **Mobile bleibt unverändert:** Die bestehende, pfadbasierte `pushState`-History für
  Mobilgeräte wird nicht angetastet (Controller ist desktop-exklusiv).
* **View-Transitions:** Alle Wechsel laufen über `performViewTransition` (View-Transitions-
  API, sonst direkter DOM-Tausch).

### 7.3 Breadcrumb-Sprungvorschau
Jeder Breadcrumb-Schritt, der Unterordner besitzt, erhält ein **▾-Chevron**. Klick (oder
**Long-Press** auf dem Schritt unter Touch) öffnet ein **Glas-Popover** mit den
Unterordnern des Schritts — inkl. Ordner-Icon, Titel und Kind-Anzahl. Ein Klick springt
direkt in den Zielordner (vollständige Pfad-Rekonstruktion). Das Popover wird im Viewport
gehalten und schließt bei Außenklick, Escape oder Scrollen.

### 7.4 Weitere Navigationswege
* **Breadcrumb-Schritte** selbst sind klickbar (Sprung auf diese Ebene).
* **App-Logo** und **Fixed-Back-Button** springen zur Startseite.
* **Favoriten-Ordner-Chips** navigieren direkt in den Ordner.
* **Karten-Klick** auf Ordner navigiert hinein; auf Prompt kopiert (Detailbutton öffnet das
  Modal).

---

## 8. Bedienung: Tastatursteuerung & Karten-Wischgesten

### 8.1 Vollständige Tastatursteuerung des Karten-Grids
`navigation.js` macht das gesamte Grid per Tastatur bedienbar (aktiv, sobald eine Pfeiltaste
gedrückt wird; pausiert automatisch, wenn ein Modal offen ist, in einem Eingabefeld getippt
wird oder ein Modifier wie ⌘/Ctrl aktiv ist — damit Kürzel wie ⌘K erhalten bleiben):

| Taste | Aktion |
|-------|--------|
| **← / →** | Fokus eine Karte nach links/rechts |
| **↑ / ↓** | Fokus eine Zeile nach oben/unten (Spaltenzahl wird live aus dem Layout gemessen) |
| **Home / End** | Fokus auf erste/letzte Karte |
| **Enter** | Ordner öffnen (hineinnavigieren) bzw. Prompt-Detail öffnen |
| **Leertaste** | Prompt kopieren (bei Ordner: hineinnavigieren) |
| **f** | Fokussiertes Element favorisieren/entfavorisieren |
| **e** | Umbenennen (Inline-Edit der Karte) |
| **Entf / Backspace** | Element löschen (mit Bestätigung) |

Die fokussierte Karte erhält einen deutlichen **Indigo-Fokusring** (`.kbd-focus`) und wird
sanft in den sichtbaren Bereich gescrollt. Mausinteraktion hebt den Tastaturfokus auf;
nach jedem Neu-Rendern wird der Fokus zurückgesetzt.

### 8.2 Karten-Wischgesten (Touch)
Auf Touch-Geräten reagieren Karten auf horizontale Wischgesten (vertikales Scrollen bleibt
unbeeinträchtigt; der linke Bildschirmrand ist der Zurück-Geste vorbehalten):

* **Wisch nach rechts → Favorisieren:** löst den Favoriten-Status um, zeigt einen
  **Favoriten-Flash** (aufleuchtender Stern) und ein haptisches Feedback; die Karte schnappt
  zurück.
* **Wisch nach links → Aktionstray:** enthüllt hinter dem Karteninhalt drei runde
  Aktions-Buttons — **Bearbeiten** (Umbenennen), **Verschieben** (öffnet den Ordnerbaum-
  Dialog) und **Löschen**. Der Tray bleibt geöffnet, bis eine Aktion gewählt oder daneben
  getippt wird.

Die container-weite „Wisch-rechts = Zurück"-Geste ignoriert auf einer Karte begonnene
Wischbewegungen, sodass sich Karten- und Navigationsgesten nicht in die Quere kommen.
Beide Gesten respektieren `prefers-reduced-motion`.

---

## 9. Mikrointeraktionen, Haptik & Skeletons

* **Skeleton-Loading:** Vor dem ersten Render schimmernde Skeleton-Karten (gestaffelt; ohne
  Shimmer bei Reduced Motion).
* **Ripple-Effekt:** Karten, Buttons und Chips erzeugen bei Druck einen radialen Ripple
  (theme-abhängiges `mix-blend-mode`).
* **Haptik-Bridges:** `triggerHapticFeedback` an Kernaktionen gekoppelt — Kopieren (medium),
  Favorisieren/Navigieren/Filterwahl/Wischen (light/medium) — mit `navigator.vibrate`-Fallback.
* **Bestehende Effekte:** Partikelsystem, Glow-Burst, Konfetti, 3D-Tilt,
  Device-Orientation-Parallax, GSAP-/Flip-Dock-Animationen, Vivus-„Zeichnen" der Icons.
* **Reduced Motion:** Zentraler Handler drosselt Aurora-Parallax, Animationen und Effekte.

---

## 10. Offline-Betrieb & Service Worker

`sw.js` (registriert in `enhancements.js`, Version `v4-2026-06`) macht die App vollständig
offline-fähig.

### 10.1 Caching-Strategien
| Ressource | Strategie |
|-----------|-----------|
| App-Shell (HTML/CSS/JS/Icons/Manifest, `templates.json`) | **Stale-While-Revalidate** |
| Navigationen (Dokument) | **Network-First** → App-Shell-Fallback |
| CDN-Bibliotheken & Modell-Dateien | **Cache-First** (mit Hintergrund-Refresh) |
| `/api/templates` (GET) | **Network-First**; letzter Stand als Offline-Fallback, danach statische `templates.json` |
| `/api/templates` (POST) | **niemals abgefangen** (immer Live-Netz) |

### 10.2 Lebenszyklus
* **Install:** Robustes Vor-Caching (`Promise.allSettled`), `skipWaiting`. Vorab gecacht
  werden u. a. `script.js`, `enhancements.js`, `aurora-webgl.js`, `navigation.js`,
  `style.css`, `enhancements.css`, `navigation.css`.
* **Activate:** Aufräumen veralteter Cache-Generationen (`SW_VERSION` —
  `pt-shell-*`/`pt-cdn-*`/`pt-runtime-*`/`pt-api-*`), optionale Navigation Preload,
  `clients.claim`.
* **Update:** Toast informiert über verfügbares Update; App kann `SKIP_WAITING` senden.

---

## 11. Datenhaltung, Cloud-Sync & Datenmodell

### 11.1 Datenmodell
Rekursive JSON-Baumstruktur ab Wurzelknoten `root`:

```jsonc
{
  "id": "root",
  "type": "folder",
  "title": "Home",
  "items": [
    {
      "id": "1",
      "type": "folder",            // "folder" | "prompt" | "folder-link" | "prompt-link"
      "title": "KI Steuerung",
      "items": [
        {
          "id": "1-1",
          "type": "prompt",
          "title": "Allgemeine Anweisungen",
          "content": "…",          // Prompt-Text (nur bei type=prompt)
          "tags": ["rolle", "system"]  // optional
        }
      ]
    },
    { "id": "x", "type": "prompt-link", "title": "Alias", "targetId": "1-1" }
  ]
}
```

* **Felder:** `id`, `type`, `title`, `items` (Ordner), `content` (Prompts),
  `targetId` (Links), `tags` (optional).
* **Verknüpfungen:** `resolveLinkedNode` löst Links rekursionssicher auf. **Verwaiste
  Verknüpfungen** (Ziel gelöscht) werden nach jedem Löschvorgang via `pruneDanglingLinks`
  rekursiv entfernt.

### 11.2 Hybrid-Sync (Cloudflare KV + LocalStorage)
* **Worker** (`functions/api/templates.js`): `GET` liefert den KV-Stand bzw. initialisiert
  ihn aus `templates.json`; `POST` speichert mit **Timestamp-Konfliktprüfung** (HTTP 409).
  Alle Antworten setzen einheitlich `Content-Type: application/json`; Fehlerantworten geben
  nur die **Fehlermeldung** zurück (keine internen Stacktraces — gehärtet gegen
  Information-Disclosure).
* **Client-Sync:** `syncFromCloud` (Polling alle 10 s, bei Fokus/Sichtbarkeit, via
  `BroadcastChannel` geräteübergreifend) und `persistJsonData` (optimistisches Speichern).
* **Offline-Fallback:** `localStorage` (`customTemplatesJsonCloud` + `syncTimestampCloud`);
  der Service Worker liefert zusätzlich den letzten API-Stand bzw. die statische JSON.

### 11.3 Import / Export
Download als `templates.json` oder Import per Drag & Drop / Dateiauswahl
(`validateTemplateSchema`). Tags sind Teil des Exports.

### 11.4 Lokale Zustände (localStorage-Schlüssel)
| Schlüssel | Inhalt |
|-----------|--------|
| `favoritePrompts` | IDs der favorisierten Knoten |
| `user-color-scheme` | `light` / `dark` |
| `customTemplatesJsonCloud` | Offline-Cache des Baums |
| `syncTimestampCloud` | letzter bekannter Sync-Zeitstempel |
| `pt-usage-stats-v1` | Nutzungs- & Recency-Statistik |

---

## 12. Weitere Funktionen & Produktivität

* **Drag & Drop (SortableJS):** Organisier-Modus mit iOS-Jiggle; Verschieben, Umsortieren,
  In-Ordner-Droppen und **Kombinieren zweier Elemente zu einem neuen Ordner**. Das
  Datenmodell wird in Echtzeit aktualisiert; ein **Zyklus-Schutz** in `moveNode` verhindert,
  einen Ordner in seinen eigenen Nachfahren zu verschieben.
* **Mehrfachauswahl:** `Strg/Cmd`-Klick für Sammel-Löschen/-Verschieben.
* **Verknüpfungen (Symlinks):** Prompts/Ordner mehrfach referenzieren ohne Duplikate.
* **Umbenennen In-Place:** Direktes Editieren von Kartentiteln.
* **Pull-to-Refresh** (Mobile) zum erzwungenen Cloud-Abgleich.
* **Vollbildmodus** mit plattformübergreifender Fullscreen-API.

---

## 13. Tastaturkürzel & Gesten — Gesamtreferenz

### Tastatur (Desktop)
| Eingabe | Aktion |
|---------|--------|
| **⌘K / Strg+K** | Suche öffnen/schließen |
| **⌘N / Strg+N** | Neuer Prompt |
| **⌘← / Strg+←** | Eine Ebene zurück |
| **← → ↑ ↓** | Fokus im Karten-Grid bewegen |
| **Home / End** | Erste/letzte Karte fokussieren |
| **Enter** | Ordner öffnen / Prompt-Detail öffnen |
| **Leertaste** | Prompt kopieren |
| **f** | Favorisieren |
| **e** | Umbenennen |
| **Entf / Backspace** | Löschen |
| **Escape** | Suche leeren/schließen · Modal schließen · Popover/„Mehr"-Menü schließen |
| **Strg/Cmd + Klick** | Karte zur Mehrfachauswahl |
| **Browser Zurück/Vor · Maus-Seitentasten** | Ordnerverlauf (Desktop) |

### Gesten (Touch / Maus)
| Eingabe | Aktion |
|---------|--------|
| **Tap auf Prompt** | Kopieren |
| **Tap auf Ordner** | Hineinnavigieren |
| **Tap auf ⋯ (Mobile)** | „Mehr"-Menü mit Sekundäraktionen öffnen |
| **Wisch rechts (Karte)** | Favorisieren (mit Flash) |
| **Wisch links (Karte)** | Aktionstray (Bearbeiten/Verschieben/Löschen) |
| **Wisch rechts (Edge, Mobile)** | Zurück-Navigation |
| **Long-Press (Karte/Chip)** | Kontextmenü |
| **Long-Press (Breadcrumb-Schritt)** | Sprung-Popover der Unterordner |
| **Klick auf Breadcrumb-▾** | Sprung-Popover der Unterordner |
| **Swipe hoch/runter (Dock)** | Favorites-Dock erweitern/einklappen |
| **Pull-down** | Aktualisieren (Mobile) |
| **Rechtsklick** | Kontextmenü |
| **Deep-Link / Reload / Teilen** | Ansicht wird aus der URL rekonstruiert |

---

## 14. Barrierefreiheit

* Durchgängige **ARIA-Labels** und `role`-Attribute (Listen, Tabs/Scopes, Gruppen/Filter,
  Menüs/Popover, „Mehr"-Menü mit `role="menu"`/`menuitem` und `aria-haspopup`/`aria-expanded`).
* **Vollständige Tastaturbedienbarkeit** von Grid, Suche, Modals, Tag-Editor, Popover und
  „Mehr"-Menü (Escape schließt, Fokus kehrt zum Auslöser zurück).
* **`prefers-reduced-motion`** wird global respektiert (Aurora-Standbild, keine Ripples,
  kein Shimmer, keine Wisch-/Fokus-Transitions).
* **Fokus-Stile** mit deutlichem Glow; Touch-Targets ≥ 44 px.
* **Kontrast** in beiden Themes auf Lesbarkeit ausgelegt; die Top-Bar-Icons nutzen vollen
  Vordergrund-Kontrast (`--fg-1`).

---

## 15. Performance-Architektur

* **DOM-Caching** aller relevanten Knoten in `initApp`.
* **Event-Delegation** für Karten-Events (Bubbling) — speicherschonend bei vielen Karten.
* **RequestAnimationFrame** für layout-intensive Berechnungen (Dock-Footprint, Parallax,
  Titel-Fit per Binärsuche).
* **GPU-Auslagerung:** `translateZ(0)`, `contain`, hardwarebeschleunigte Aurora.
* **Render-Budget:** max. 120 Karten pro Ansicht; Embeddings gecacht; neuronales Modell
  **lazy** geladen; semantischer Query-Cache LRU-begrenzt (50 Einträge).
* **Lazy & Defensive:** Schwergewichtige Pfade laufen erst bei Bedarf, gekapselt in
  `try/catch`. Die Erweiterungs-Schichten patchen Kernfunktionen, ohne deren
  Performance-Eigenschaften zu verlieren.

---

## 16. Code-Architektur & Dateistruktur

Die App ist **framework-frei**. Erweiterungen sind **additiv** umgesetzt: `script.js` bleibt
der Kern; `enhancements.js` und `navigation.js` umhüllen definierte Hook-Funktionen
(Monkey-Patching der globalen Funktionen) und ergänzen eigenständige Subsysteme.

```
/
├── index.html              # Grundgerüst, SVG-Templates (<defs>), PWA-/Apple-Meta-Tags,
│                           # Top-Bar inkl. "Mehr"-Menü-Container, Einbindung aller
│                           # Styles & Skripte
├── style.css               # Liquid-Glass-System, Themes, Grid, Top-Bar (inkl. mobiles
│                           # Overflow-System), Favoritenbar-Docking, Animationen
├── enhancements.css        # Styles für Suche, Tags, Smart Folders, Skeletons, Ripples
├── navigation.css          # Styles für Breadcrumb-Popover, Tastatur-Fokus, Wischgesten
├── script.js               # Kern: State, Rendering, Navigation, Sync, Modals, DnD,
│                           #  "Mehr"-Menü-Aufbau + State-Bridge (window-Getter/Setter)
├── enhancements.js         # Schicht 1: Suche (#4/#7), Tags & Smart Folders (#8),
│                           # Deep-Links (#6), Mikrointeraktionen (#11), SW-Registrierung
├── navigation.js           # Schicht 2: Desktop-Verlauf, Breadcrumb-Sprünge,
│                           # Tastatursteuerung, Karten-Wischgesten
├── aurora-webgl.js         # WebGL-Shader-Aurora
├── sw.js                   # Service Worker (Offline-Caching)
├── manifest.json           # PWA-Manifest
├── browserconfig.xml       # Windows-Kachel-Konfiguration
├── templates.json          # Statischer Daten-Fallback / Seed
├── icons/                  # Favicons, Apple-Touch-Icon, Maskable-Icons
└── functions/
    └── api/
        └── templates.js    # Cloudflare Pages Function: KV GET/POST mit Konfliktprüfung
```

### 16.1 State-Bridge (Integrationsmechanik)
`script.js` deklariert seinen Zustand mit `let` (nicht auf `window` sichtbar). Am Ende von
`script.js` spiegelt eine **State-Bridge** die relevanten Zustände (`jsonData`,
`currentNode`, `pathStack`, `currentSearchQuery`, `favoritePrompts`) über
`Object.defineProperties` als Getter/Setter auf `window`. So lesen **und** schreiben die
Erweiterungs-Schichten diese Zustände, ohne die interne Logik anzufassen. Funktionen sind
als Klassik-Skript-Deklarationen ohnehin global und werden gezielt umhüllt.

### 16.2 Schichtenmodell & Lade-Reihenfolge
`script.js` → `aurora-webgl.js` → `enhancements.js` → `navigation.js` (alle `defer`).
Jede Schicht wartet bei Bedarf auf die vorherige (Boot-Polling) und stapelt ihre
Funktions-Wrapper sauber übereinander (z. B. mehrfach umhülltes `renderView`).

### 16.3 Mobiles „Mehr"-Menü (Implementierungsdetail)
Das Overflow-Menü ist Teil des Kerns (`script.js`) und folgt demselben bewährten Popover-
Muster wie das Hinzufügen-/JSON-Menü:

* **`buildMoreMenu()`** baut das Menü beim Öffnen kontextbewusst auf: Es prüft je
  Sekundär-Button den Inline-`display`-Status (und `disabled`), klont dessen aktuell
  sichtbares Icon, übernimmt das `aria-label` als Beschriftung und hinterlegt eine
  Aktion, die den Klick an den Original-Button weiterleitet (bzw. bei JSON direkt
  `downloadCustomJson()` / `openUploadJsonModal()` aufruft).
* **`closeMoreMenu()`** schließt das Menü und setzt `aria-expanded`.
* Außenklick und **Escape** schließen das Menü; ein leerer Zustand wird abgefangen.
* Die Sichtbarkeitssteuerung (welche Buttons direkt erscheinen vs. im Menü landen) erfolgt
  rein über CSS-Media-Queries — die Original-Buttons bleiben funktionsfähig im DOM.

### 16.4 Externe Bibliotheken
| Bibliothek | Zweck | Laden |
|------------|-------|-------|
| **GSAP + Flip** | Favorites-Dock-Animationen (F.L.I.P.) | `defer`, CDN |
| **SortableJS** | Drag & Drop Reorganisation | `defer`, CDN (Version gepinnt) |
| **Vivus** | SVG-„Zeichnen" (Icons, Leerzustände) | `defer`, CDN |
| **@huggingface/transformers** | Neuronale Embeddings (semantische Suche) | **lazy** `import()` |

---

## 17. Betrieb, Deployment & Konfiguration

* **Plattform:** Cloudflare Pages mit **Pages Functions** (`functions/api/templates.js`).
* **KV-Binding:** Erfordert den Namespace **`TEMPLATES_KV`** (Schlüssel `current_templates`).
  Ohne Binding antwortet die Function mit klarer Fehlermeldung; die App fällt auf den
  lokalen Cache/die statische `templates.json` zurück.
* **Statischer Seed:** Fehlt der KV-Eintrag, initialisiert die Function ihn aus
  `templates.json`.
* **Service Worker:** Registriert unter `/sw.js` mit App-Scope `/`.
* **Reines Frontend:** Außer der Pages Function ist kein Backend nötig.

---

## 18. Graceful Degradation & Fallback-Matrix

| Fähigkeit | Optimalfall | Fallback |
|-----------|-------------|----------|
| **WebGL-Aurora** | Echtzeit-Shader | CSS-Aurora-Blobs |
| **Reduced Motion** | volle Animation | Standbild, keine Ripples/Shimmer/Wischanimation |
| **Semantische Suche** | neuronales Modell | heuristischer Token-/Synonym-/Fuzzy-Scorer |
| **Deep-Links / Desktop-Verlauf** | View-Transitions + History | direkter DOM-Tausch |
| **Cloud-Sync** | Cloudflare KV (Realtime) | `localStorage` + statische `templates.json` |
| **Offline** | Service-Worker-Caches | Network-First-Live-Betrieb |
| **Haptik** | `triggerHapticFeedback` | `navigator.vibrate` / lautlos |
| **Clipboard** | `navigator.clipboard` | `execCommand('copy')`-Fallback |
| **Suche allgemein** | gewichtetes Ranking | einfache `includes`-Filterung |
| **Tastatur-Scroll** | `scrollIntoView` | übersprungen, Fokus bleibt gesetzt |
| **Top-Bar mobil** | aufgeräumte Leiste + „Mehr"-Menü | Desktop: vollständige Buttonleiste |

---

## 19. Qualitätssicherung & Tests

Die JavaScript-Logik wird über eine **jsdom-Smoke-Test-Harness** verifiziert, die die App
headless initialisiert (gemocktes `fetch`, Browser-API-Stubs), die Templates lädt und u. a.
prüft: Boot aller Schichten, Rendering, State-Bridge, Such-/Semantik-Pfad,
Kontextmenü-Robustheit, Zyklus-Schutz, Verwaiste-Link-Bereinigung, Deep-Link-Hash,
Tastatur-Fokus, Desktop-Verlauf sowie Breadcrumb-Chevron und -Popover.

Ergänzend werden **layout- und viewport-kritische Aspekte** (Safe-Area-Behandlung, Top-Bar-
Höhe, mobiles „Mehr"-Menü inkl. Überlaufschutz, bündiges Favoritenbar-Docking) über eine
**headless Chromium-Messung** (emulierter iPhone-14-Pro-Max-Viewport mit simulierten
Safe-Area-Insets) abgesichert: Position und Abstände der Elemente werden numerisch gemessen
und gegen die Erwartung geprüft. Das rein **visuelle** Feinverhalten (Liquid-Glass-Schichten,
WebGL-Shader) erfordert naturgemäß weiterhin eine Abnahme im echten Browser.

---

## 🏁 Zusammenfassung

**Prompt-Templates** ist weit mehr als ein JSON-Viewer: ein minutiös durchdachtes Stück
Software, das native-ähnliche UX vollständig im Web realisiert. Über das Liquid-Glass-
Fundament legt es eine **GPU-Aurora**, eine **neuronale Suche mit robustem Offline-Fallback**,
**Tags & Smart Folders**, **teilbare Deep-Links mit echtem Desktop-Verlauf**, eine
**vollständige Tastatur- und Wischgesten-Steuerung**, ein **aufgeräumtes, mobil
optimiertes Bedien-Layout mit kontextbewusstem „Mehr"-Menü**, eine reichhaltige
**Mikrointeraktions- und Haptik-Schicht** sowie **vollständigen Offline-Betrieb** — jeweils
sauber additiv integriert, durchgängig mit Graceful Degradation und durch automatisierte
Tests abgesichert. Das Ergebnis ist eine PWA, die sich auf jedem Gerät und über jede
Eingabemethode schnell, edel und native anfühlt.
