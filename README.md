# 🌌 Prompt-Templates — Die ultimative Prompt-Management Web-App

**Prompt-Templates** ist eine hochmoderne, performante und visuell herausragende
Single-Page-Application (SPA) zur Verwaltung, Organisation, semantischen Suche und
blitzschnellen Nutzung von Text- und KI-Prompts. Die Anwendung verbindet eine
**Apple-Cupertino-Liquid-Glass-Ästhetik** mit einer **GPU-gerenderten WebGL-Aurora**,
einem **neuronalen Such-System**, **teilbaren Deep-Links**, einem **Tag- & Smart-Folder-
System** sowie **vollwertigem Offline-Betrieb als installierbare PWA**.

Dieses Dokument beschreibt den **vollständigen aktuellen Stand** der Anwendung —
jeden Bildschirm, jede Komponente, jede Interaktion, jede Datei und jede Design-
Entscheidung — lückenlos und systematisch kategorisiert.

---

## 📑 Inhaltsverzeichnis

1. [Überblick & Kernkonzept](#1-überblick--kernkonzept)
2. [Design-Philosophie: Liquid Glass & WebGL-Aurora](#2-design-philosophie-liquid-glass--webgl-aurora)
3. [Mobile-First & PWA-Exzellenz](#3-mobile-first--pwa-exzellenz)
4. [UI- & UX-Komponenten im Detail](#4-ui--ux-komponenten-im-detail)
5. [Suche: Lexikalisch, Global & Semantisch (Vorschlag #4 / #7)](#5-suche-lexikalisch-global--semantisch)
6. [Tags & Smart Folders (Vorschlag #8)](#6-tags--smart-folders)
7. [Deep-Link-Routing & View-Transitions (Vorschlag #6)](#7-deep-link-routing--view-transitions)
8. [Mikrointeraktionen, Haptik & Skeletons (Vorschlag #11)](#8-mikrointeraktionen-haptik--skeletons)
9. [Offline-Betrieb & Service Worker (Vorschlag #13)](#9-offline-betrieb--service-worker)
10. [Datenhaltung, Cloud-Sync & Datenmodell](#10-datenhaltung-cloud-sync--datenmodell)
11. [Weitere Funktionen & Produktivität](#11-weitere-funktionen--produktivität)
12. [Tastaturkürzel & Gesten](#12-tastaturkürzel--gesten)
13. [Barrierefreiheit](#13-barrierefreiheit)
14. [Performance-Architektur](#14-performance-architektur)
15. [Code-Architektur & Dateistruktur](#15-code-architektur--dateistruktur)
16. [Betrieb, Deployment & Konfiguration](#16-betrieb-deployment--konfiguration)
17. [Graceful Degradation & Fallback-Matrix](#17-graceful-degradation--fallback-matrix)

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
* **Geräteübergreifend:** Echtzeit-Synchronisierung über einen Cloudflare-Worker (KV),
  lokaler Offline-Cache und installierbare PWA mit Service-Worker.
* **Premium-Erlebnis:** GPU-Aurora, Liquid-Glass-Material, Mikrointeraktionen, Haptik,
  3D-Tilt, Partikel und butterweiche View-Transitions.

Die App ist bewusst **framework-frei** (kein React/Vue) für maximale Kontrolle und
minimale Ladezeit. Schwergewichtige Fähigkeiten (z. B. das neuronale Suchmodell) werden
**lazy** und nur bei Bedarf nachgeladen.

---

## 2. Design-Philosophie: Liquid Glass & WebGL-Aurora

### 2.1 Das 5-Layer Liquid Glass System
Jedes gehobene UI-Element (Karten, Modals, Top-Bar, Favorites-Dock, Banner, Chips) nutzt
eine geschichtete CSS-Komposition, die physisches Glas simuliert:

1. **Highlight (Lichtreflexion):** Radialer Gradient an der oberen linken Kante
   (`--glass-highlight`).
2. **Refraktion (Lichtbrechung):** Diagonaler Gradient (`--glass-refraction`) für die
   typische Glas-Brechung.
3. **Shadow-Overlay (innere Tiefe):** Abgedunkelter Bereich unten rechts
   (`--glass-shadow-overlay`) für Volumen.
4. **Base Background (Grundfärbung):** Halbtransparenter Basiston (`--glass-bg`), der sich
   in Hell/Dunkel dynamisch anpasst.
5. **Backdrop-Filter:** `backdrop-filter: blur(...) saturate(...) brightness(...)` erzeugt
   den iOS-Vibrant-Look. Ergänzt durch **Specular-Highlights** an Oberkanten und sanfte
   Drop-Shadows.

Sämtliche Materialwerte sind als zentrale **CSS Custom Properties** in `:root` definiert
und werden bei Theme-Wechsel über `html[data-color-scheme="light|dark"]` umgeschaltet.

### 2.2 WebGL-Aurora (Echtzeit-Shader) — Vorschlag #10
Der kosmische Hintergrund wird durch eine **echtzeit-gerenderte Aurora** auf Basis eines
**Fragment-Shaders** erzeugt (`aurora-webgl.js`), die die zuvor statischen CSS-Blur-Blobs
ersetzt:

* **Technik:** Vollbild-Triangle, Fragment-Shader mit **fraktalem Brownschen Rauschen
  (FBM)** und **Domain-Warping** — zwei überlagerte, gewarpte Rauschfelder erzeugen weiche,
  driftende Nordlicht-Schleier.
* **Theme-adaptiv:** Eigene Akzent-Paletten für Hell- und Dunkelmodus (Indigo, Mint,
  Violett), inklusive reduzierter Intensität und Aufhellung im Hellmodus. Bei jedem
  Theme-Wechsel (`applyColorScheme`) wird die Palette live umgestellt.
* **Performance & Akkuschonung:** DPR auf 1.5 gedeckelt, `low-power`-Kontext, Render-Loop
  **pausiert automatisch**, sobald das Tab in den Hintergrund wechselt
  (`visibilitychange`) oder die Aurora nicht sichtbar ist.
* **Reduced Motion:** Bei `prefers-reduced-motion: reduce` wird **ein einziges statisches
  Standbild** gerendert statt einer Animationsschleife.
* **Sauberer Fallback:** Ist WebGL nicht verfügbar oder schlägt die Shader-Kompilierung
  fehl, bleiben die ursprünglichen CSS-Aurora-Blobs (`.shape1–3`) sichtbar — es entsteht
  niemals ein leerer Hintergrund. Bei aktivem Shader werden die CSS-Blobs per
  `.aurora-container.webgl-active` sanft ausgeblendet.

### 2.3 Farb- & Theme-System
* **Cupertino-Palette:** Apple System Colors (Indigo, Green, Red, Yellow, Blue, Orange,
  Pink, Purple, Teal) als semantische Akzente.
* **Hell-/Dunkelmodus:** systembasiert (`prefers-color-scheme`) **und** manuell per Toggle
  (`data-color-scheme`), persistiert in `localStorage` (`user-color-scheme`). Ein
  Inline-Skript im `<head>` setzt das Schema **vor dem ersten Paint** (kein Flash).
* **Dynamische `theme-color`:** Die Statusleisten-Farbe (Android/PWA) wird je Ansicht über
  `updateThemeColorForNode` aktualisiert.

---

## 3. Mobile-First & PWA-Exzellenz

### 3.1 Safe Area & Dynamic Island
* `viewport-fit=cover` dehnt die App bis an die physischen Bildschirmränder aus.
* Die Top-Bar reicht bis zum oberen Rand (unter Notch/Dynamic Island); ihr inneres
  `padding-top` wird über `env(safe-area-inset-top)` berechnet.
* Favorites-Dock und Grid-Padding respektieren `env(safe-area-inset-bottom)`
  (Home-Indicator-Schutz).

### 3.2 Natives Interaktions-Gefühl
* **Auto-Zoom-Schutz:** Alle Eingabefelder (inkl. **Tag-Editor** und Suchfeld) haben
  erzwungene `font-size: 16px`; `user-scalable=no`.
* **Overscroll:** Bounce-Scrolling per `overscroll-behavior-y: none` deaktiviert.
* **Touch-Targets:** Unter `@media (pointer: coarse)` mindestens `44×44px`.
* **Tap-Feedback:** Safari-Tap-Highlight entfernt; stattdessen `:active`-States,
  **Ripple-Effekt** und **Haptik**.
* **Text-Selection-Control:** `user-select: none` auf UI; nur reine Prompt-Texte sind
  markier- und kopierbar.
* **DVH:** Modal-/Container-Höhen nutzen `dvh`, sodass das Layout beim Einblenden der
  virtuellen Tastatur ruckelfrei skaliert.

### 3.3 Installierbarkeit
* Vollständiges **Web-App-Manifest** (`manifest.json`): Name, Icons (192/512, regulär +
  maskable), `display: standalone`, Scope, Theme-/Background-Farbe.
* **Install-Button** in der Top-Bar fängt `beforeinstallprompt` ab und löst den nativen
  Installationsdialog aus; reagiert auf `appinstalled`.
* **Service Worker** (`sw.js`) macht die App **vollständig offline-fähig** (siehe §9).

---

## 4. UI- & UX-Komponenten im Detail

### 4.1 Top-Bar (Navigationsleiste)
`fixed` positionierter, zentraler Ankerpunkt mit Liquid-Glass-Material. Enthält
kontextsensitiv:

* **Zurück-Button** (erscheint in Unterordnern),
* **Breadcrumb-Navigation** (horizontal scrollbar, jeder Schritt klickbar),
* **Hinzufügen-Menü** (Prompt / Ordner / Prompt-Verknüpfung / Ordner-Verknüpfung),
* **Organisieren-Toggle** (Edit-Mode / Drag & Drop),
* **Zurücksetzen**, **JSON-Menü** (Download / Upload),
* **Cloud-Status-Indikator** (pulsierend bei aktiver Sync),
* **Theme-Toggle** (Hell/Dunkel), **Install-Button**, **Favoriten-leeren**,
  **Vollbild-Toggle**, **Such-Toggle** und **App-Logo** (Home).

### 4.2 Karten (Prompt- & Ordner-Karten)
Das Grid (`cards-container`) skaliert dynamisch via `auto-fit`/`minmax` mit Clamp-Werten.

* **Zwei Typen:** Ordner-Karten (Navigation) und Prompt-Karten (Kopieren).
* **3D-Tilt:** Auf dem Desktop reagieren Karten beim Hover mit subtilem, maus-positions-
  abhängigem 3D-Tilt, verstärktem Glow und leichtem Anheben.
* **Gestaffeltes Einblenden (Stagger):** Karten erscheinen nacheinander mit weicher
  Bounce-Animation; jenseits der ersten 12 übernimmt ein per JS gesetzter `--card-index`.
* **Schnell-Aktionen:** Beim Hover/Edit-Mode erscheinen runde Buttons (Editieren, Löschen,
  Expandieren, Kopieren).
* **Kontextmenü:** Rechtsklick / Long-Press öffnet ein schwebendes Menü
  (Favorisieren, Umbenennen, Verschieben, Löschen) — auch für Mehrfachauswahl.
* **Neue Karten-Dekorationen:**
  * **Tag-Chips** (bis zu 3) am unteren Kartenrand,
  * **Usage-Badge** (oben links) mit Kopier-Häufigkeit ab 3 Nutzungen,
  * **Treffer-Hervorhebung** (`<mark>`) bei aktiver textueller Suche.

### 4.3 Favorites-Dock
Smartes Dock am unteren Rand, das sich intelligent ein-/ausklappt:

* **Chips-System** mit individueller Akzentfarbe je Favorit (aus `FAVORITE_ACCENTS`).
* **Fluid Layout:** `full` (Titel + Vorschau) oder `compact` (nur Titel) je nach Platz.
* **Swipe-to-Expand** auf Mobilgeräten; **Resize Observer** misst den Platzbedarf und
  schiebt den Grid-Container exakt so weit nach oben, dass keine Karte verdeckt wird.
* **Sparkle-Mikroanimation** beim Hinzufügen.

### 4.4 Modal-System & Overlays
Sheets gleiten von unten (iOS-Stil): **Prompt-Detail**, **Ordner erstellen**,
**Verknüpfen**, **Verschieben**, **JSON-Import**.

* **Prompt-Modal:** Voller Prompt-Text (read-only / editierbar), Favoriten-, Edit-,
  Speichern-, Kopier- und Schließen-Buttons.
* **Tag-Editor (neu):** Direkt unter dem Prompt-Text; zeigt vorhandene Tags als entfernbare
  Chips und ein Eingabefeld zum Hinzufügen. Änderungen werden sofort ins Datenmodell
  geschrieben und (debounced) persistiert/synchronisiert.
* **Copy-Animation:** Klick auf „Kopieren" triggert Clipboard-API, eine Häkchen-
  Mikroanimation, Haptik und eine Toast-Benachrichtigung.

### 4.5 Such-Toolbar
Über die Such-Lupe öffnet sich ein schwebendes Glas-Panel mit dem Suchfeld und der
**erweiterten Steuerung** (siehe §5): Scope-Umschalter und Filter-Chips.

### 4.6 Ergebnis-Banner & Smart-Collections-Leiste
* **Ergebnis-Banner:** Bei aktiver Suche/Sammlung erscheint oben im Grid ein Banner mit
  Kontext (z. B. „Semantische Suche · neuronal", „# medizin"), Trefferzahl und einem
  **Zurücksetzen**-Button.
* **Smart-Collections-Leiste:** Auf der Startseite erscheint über den Karten eine Leiste
  mit Sammlungs-Chips und einer Tag-Wolke (siehe §6).

### 4.7 Benachrichtigungen (Toasts)
Zentrale `showNotification`-Komponente am oberen Rand mit Typen `info`/`success`/`error`,
Häkchen-Icon bei Erfolg und automatischem Ausblenden.

---

## 5. Suche: Lexikalisch, Global & Semantisch

Die Suche wurde zu einem dreistufigen System ausgebaut (Vorschläge **#4** und **#7**),
implementiert in `enhancements.js` durch Umhüllung von `getVisibleNodesForCurrentView`
und `renderView` — ohne die Originallogik zu zerstören.

### 5.1 Such-Bereiche (Scopes)
Ein segmentierter Umschalter im Such-Panel bietet drei Modi:

| Scope | Verhalten |
|-------|-----------|
| **Ordner** | Filtert ausschließlich den aktuell geöffneten Ordner (Standard). |
| **Global** | Durchsucht den **gesamten Baum**; Treffer aus beliebiger Tiefe. |
| **Semantik** | Neuronale Ähnlichkeitssuche über den gesamten Baum (siehe §5.3). |

### 5.2 Filter-Chips
Quer zu den Scopes wirken Filter-Chips: **Alle**, **★ Favoriten**, **🕑 Zuletzt**,
**🗂 Ordner**, **📝 Prompts**. Sie schränken die Kandidatenmenge zusätzlich ein.

### 5.3 Semantische Suche (neuronale Embeddings) — Vorschlag #4
* **Neuronaler Pfad:** Beim ersten semantischen Suchlauf wird **lazy** die
  Transformers.js-Bibliothek (`@huggingface/transformers`) von einem CDN nachgeladen und
  das quantisierte Modell **`Xenova/all-MiniLM-L6-v2`** initialisiert. Für jeden Knoten
  (Titel + Inhalt + Tags) wird ein **Embedding** berechnet, **pro Sitzung im Speicher nach
  Inhalts-Hash gecacht** (das Modell selbst wird über den Browser-Cache vorgehalten) und
  gegen das Query-Embedding per **Kosinus-Ähnlichkeit** gerankt.
* **Inkrementelles Ranking:** Während das Modell rechnet, wird sofort ein **heuristisches
  Vorschau-Ranking** angezeigt; sobald die neuronalen Scores vorliegen, rendert die Ansicht
  automatisch neu.
* **Heuristischer Offline-Fallback:** Ist kein Netz verfügbar oder das Modell nicht
  ladbar, greift ein eingebauter **lexikalisch-semantischer Scorer**: Token-Overlap +
  **deutsche Synonym-Expansion** + **Fuzzy-Matching (Levenshtein)** + Titel-Gewichtung.
  Die App bleibt damit **immer** semantisch durchsuchbar.
* **Modus-Anzeige:** Ein Badge am „Semantik"-Tab signalisiert „AI" (neuronal aktiv) bzw.
  „≈" (Heuristik); der Banner-Kontext nennt den genutzten Modus.

### 5.4 Lexikalische Suche & Hervorhebung
Im Ordner-/Global-Modus erfolgt ein gewichtetes Scoring (exakter Titel-Match >
Titel-Präfix > Titel-Teilstring > Tag-Treffer > Inhalts-Treffer > Token-Teiltreffer).
Treffer im Kartentitel werden mit einem hervorgehobenen `<mark class="search-hl">`
markiert.

### 5.5 Robustheit
Jeder Suchpfad ist in `try/catch` gekapselt; bei einem Fehler fällt die App auf die
ursprüngliche, einfache `includes`-Filterung zurück.

---

## 6. Tags & Smart Folders

Vorschlag **#8** ergänzt eine vollständige Wissensorganisations-Schicht.

### 6.1 Tags
* **Datenmodell:** Prompts (und optional Ordner) tragen ein optionales `tags: string[]`.
* **Bearbeitung:** Der **Tag-Editor** im Prompt-Modal erlaubt das Hinzufügen (Enter) und
  Entfernen (×) von Tags. Duplikate werden case-/umlaut-insensitiv verhindert.
* **Persistenz:** Tag-Änderungen werden ins `jsonData` geschrieben und debounced über
  `persistJsonData` in die Cloud/den lokalen Cache übernommen — sie sind Teil des Exports.
* **Sichtbarkeit:** Tags erscheinen als Chips auf Karten und sind anklickbare Filter.

### 6.2 Smart Folders (virtuelle Sammlungen)
Auf der Startseite erscheint über den Karten eine **Smart-Collections-Leiste**:

* **★ Favoriten** — alle als Favorit markierten Knoten.
* **🕑 Zuletzt verwendet** — chronologisch nach letztem Öffnen/Kopieren (max. 24).
* **🔥 Häufig genutzt** — nach Kopier-Häufigkeit absteigend (ab 2 Nutzungen).
* **Tag-Wolke** — pro Tag ein Chip mit Trefferzahl (Top 12 nach Häufigkeit).

Ein Klick öffnet die jeweilige Sammlung als **virtuelle, globale Ergebnisansicht**
(intern über den Such-Mechanismus realisiert), inklusive Ergebnis-Banner und
Zurücksetzen. Sammlungen sind **rein abgeleitet** — sie verändern die echte Ordnerstruktur
nicht.

### 6.3 Usage- & Recency-Tracking
Nutzungsdaten werden lokal in `localStorage` (`pt-usage-stats-v1`) gehalten:
`{ usage: { [id]: { count, last } }, recent: [id, …] }`. Erfasst werden Kopiervorgänge
(Zähler) und Öffnungen (Zeitstempel). Diese Daten speisen Smart Folders, Usage-Badges und
den „Zuletzt"-Filter.

---

## 7. Deep-Link-Routing & View-Transitions

Vorschlag **#6** macht jede Ansicht **teilbar und verlinkbar**.

### 7.1 Hash-Routing
* **URL-Schema:** Die aktuelle Position wird als Hash kodiert —
  `#/n/<ordnerId>/<ordnerId>/…` für die Ordnerkette und zusätzlich `…/p/<promptId>`, wenn
  ein Prompt-Modal geöffnet ist.
* **Synchronisierung:** Nach jeder Ansichtsänderung spiegelt `syncHash` den Zustand
  **per `history.replaceState`** in die URL (keine zusätzlichen History-Einträge, kein
  Konflikt mit der bestehenden mobilen History-Logik).
* **Eingehende Links:** Beim Laden und bei `hashchange` löst der Router die Ziel-IDs auf,
  rekonstruiert über `buildPathTo` die vollständige Vorfahren-Kette, navigiert dorthin und
  öffnet bei Bedarf das verlinkte Prompt-Modal.
* **Doppel-Navigations-Schutz:** Stimmt der aktuelle Zustand bereits mit dem Hash überein
  (z. B. durch eine vom `popstate` ausgelöste redundante `hashchange`), wird die Navigation
  übersprungen.

### 7.2 View-Transitions
Sämtliche Ansichtswechsel laufen über `performViewTransition` und nutzen — wo verfügbar —
die **View-Transitions-API** (`document.startViewTransition`) mit gerichteter
Vorwärts-/Rückwärts-Animation. Ohne API-Unterstützung erfolgt ein direkter, flackerfreier
DOM-Tausch.

---

## 8. Mikrointeraktionen, Haptik & Skeletons

Vorschlag **#11** verdichtet das haptisch-visuelle Feedback.

* **Skeleton-Loading:** Solange noch keine Daten vorliegen, zeigt das Grid schimmernde
  **Skeleton-Karten** (gestaffelt eingeblendet, Shimmer-Animation). Sie verschwinden beim
  ersten echten Render. Bei `prefers-reduced-motion` ohne Shimmer.
* **Ripple-Effekt:** Karten, Buttons und Chips erzeugen bei Druck einen radialen Ripple an
  der Berührungsposition (`mix-blend-mode` theme-abhängig). Deaktiviert bei Reduced Motion.
* **Haptik-Bridges:** `triggerHapticFeedback` wird an Kernaktionen gekoppelt — Kopieren
  (medium), Favorisieren/Navigieren/Filterwahl (light) — mit `navigator.vibrate`-Fallback.
* **Bestehende Effekte (weiterhin aktiv):** Partikelsystem, Glow-Burst beim Hover,
  Konfetti, 3D-Tilt, Device-Orientation-Parallax, GSAP-/Flip-Animationen des
  Favorites-Docks und Vivus-„Zeichnen" der Ordner-Icons und Leerzustände.
* **Reduced Motion:** Ein zentraler `motionMediaQuery`-Handler respektiert die
  Systempräferenz und drosselt Aurora-Parallax, Animationen und Effekte.

---

## 9. Offline-Betrieb & Service Worker

Vorschlag **#13** macht aus der App eine **vollwertig offline-fähige PWA**
(`sw.js`, registriert in `enhancements.js`).

### 9.1 Caching-Strategien
| Ressource | Strategie |
|-----------|-----------|
| App-Shell (HTML/CSS/JS/Icons/Manifest, `templates.json`) | **Stale-While-Revalidate** |
| Navigationen (Dokument) | **Network-First** → App-Shell-Fallback |
| CDN-Bibliotheken & Modell-Dateien (GSAP, SortableJS, Vivus, Hugging Face) | **Cache-First** (mit Hintergrund-Refresh) |
| `/api/templates` (GET) | **Network-First**; letzter erfolgreicher Stand als Offline-Fallback, danach statische `templates.json` |
| `/api/templates` (POST/Speichern) | **niemals abgefangen** (immer Live-Netz) |

### 9.2 Lebenszyklus
* **Install:** Robustes Vor-Caching (`Promise.allSettled`, einzelne fehlende Assets brechen
  die Installation nicht ab), `skipWaiting`.
* **Activate:** Aufräumen veralteter Cache-Generationen, optionale **Navigation Preload**,
  `clients.claim`.
* **Update:** Bei neuer Version informiert ein Toast, dass das Update beim nächsten Start
  aktiv wird; die App kann `SKIP_WAITING` senden.

### 9.3 Aufgeräumt
Die Altlast `style.css.bak` wurde aus dem Repository entfernt.

---

## 10. Datenhaltung, Cloud-Sync & Datenmodell

### 10.1 Datenmodell
Eine rekursive JSON-Baumstruktur ab dem Wurzelknoten `root`:

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
          "tags": ["rolle", "system"]  // optional, neu (#8)
        }
      ]
    },
    { "id": "x", "type": "prompt-link", "title": "Alias", "targetId": "1-1" }
  ]
}
```

* **Felder:** `id`, `type`, `title`, `items` (Ordner), `content` (Prompts),
  `targetId` (Links), `tags` (optional).
* **Verknüpfungen:** `resolveLinkedNode` löst Links auf das Ziel auf; rekursionssicher,
  sodass keine Endlosschleifen beim Rendern entstehen.

### 10.2 Hybrid-Sync (Cloudflare KV + LocalStorage)
* **Cloudflare-Worker** (`functions/api/templates.js`): `GET` liefert den aktuellen Stand
  aus dem KV (`current_templates`) bzw. initialisiert ihn aus der statischen
  `templates.json`; `POST` speichert mit **Timestamp-basierter Konfliktprüfung**
  (HTTP 409 bei veraltetem Client-Stand).
* **Client-Sync:** `syncFromCloud` (Polling alle 10 s, bei Fokus/Sichtbarkeit und über
  `BroadcastChannel` geräteübergreifend) und `persistJsonData` (optimistisches Speichern
  mit Konfliktbehandlung). Ein pulsierender Cloud-Indikator zeigt den Status.
* **Offline-Fallback:** Ohne Server lädt die App aus `localStorage`
  (`customTemplatesJsonCloud` + `syncTimestampCloud`); der Service Worker liefert zusätzlich
  den letzten API-Stand bzw. die statische `templates.json`.

### 10.3 Import / Export
Die gesamte Struktur lässt sich als `templates.json` **herunterladen** oder per
Drag & Drop / Dateiauswahl **importieren** (`validateTemplateSchema`). Tags sind Teil des
Exports.

### 10.4 Lokale Zustände (localStorage-Schlüssel)
| Schlüssel | Inhalt |
|-----------|--------|
| `favoritePrompts` | IDs der favorisierten Knoten |
| `user-color-scheme` | `light` / `dark` |
| `customTemplatesJsonCloud` | Offline-Cache des Baums |
| `syncTimestampCloud` | letzter bekannter Sync-Zeitstempel |
| `pt-usage-stats-v1` | Nutzungs- & Recency-Statistik (neu, #7/#8) |

---

## 11. Weitere Funktionen & Produktivität

* **Drag & Drop Reorganisation (SortableJS):** „Organisieren"-Modus mit iOS-Jiggle;
  Verschieben, Umsortieren, In-Ordner-Droppen und **Kombinieren zweier Elemente zu einem
  neuen Ordner** (`combineIntoNewFolder`). Das Datenmodell wird in Echtzeit aktualisiert.
* **Mehrfachauswahl:** `Strg/Cmd`-Klick wählt mehrere Karten für Sammel-Löschen/-Verschieben.
* **Verknüpfungen (Symlinks):** Prompts/Ordner mehrfach referenzieren ohne Duplikate.
* **Umbenennen In-Place:** Direktes Editieren von Kartentiteln.
* **Pull-to-Refresh** (Mobile) zum erzwungenen Cloud-Abgleich.
* **Vollbildmodus** mit plattformübergreifender Fullscreen-API.
* **Favoriten-Schnellzugriff** über das Dock (siehe §4.3).

---

## 12. Tastaturkürzel & Gesten

| Eingabe | Aktion |
|---------|--------|
| **Such-Lupe / Tippen** | Such-Panel öffnen |
| **Escape** | Suche leeren bzw. schließen / Modal schließen |
| **Enter** (Tag-Editor) | Tag hinzufügen |
| **Strg/Cmd + Klick** | Karte zur Mehrfachauswahl hinzufügen |
| **Rechtsklick / Long-Press** | Kontextmenü |
| **Swipe rechts (Edge)** | Zurück-Navigation (Mobile) |
| **Swipe hoch/runter (Dock)** | Favorites-Dock erweitern/einklappen |
| **Pull-down** | Aktualisieren (Mobile) |
| **Deep-Link / Reload / Teilen** | Ansicht wird aus der URL (`#/n/…/p/…`) rekonstruiert |
| **Browser Zurück/Vor (Mobile)** | bestehende In-App-History-Navigation |

(Weitere Shortcuts werden in `setupKeyboardShortcuts`/`handleKeyDown` verwaltet.)

---

## 13. Barrierefreiheit

* Durchgängige **ARIA-Labels** an allen Buttons, Regionen und interaktiven Elementen;
  `role`-Attribute an Listen, Tabs (Scopes) und Gruppen (Filter).
* **Tastaturbedienbarkeit** der Modals, Suche und Tag-Editor.
* **`prefers-reduced-motion`** wird global respektiert (Aurora-Standbild, keine Ripples,
  kein Skeleton-Shimmer, gedrosselte Effekte).
* **Fokus-Stile** mit deutlichem Glow; ausreichende Touch-Target-Größen.
* **Kontrast** in beiden Themes auf Lesbarkeit ausgelegt.

---

## 14. Performance-Architektur

* **DOM-Caching:** Alle relevanten Knoten werden in `initApp` einmalig referenziert.
* **Event-Delegation:** Karten-Events hängen an Containern (Bubbling) — speicherschonend
  bei hunderten Karten.
* **RequestAnimationFrame:** Layout-intensive Berechnungen (Dock-Footprint, Parallax,
  Titel-Fit per Binärsuche) werden gebündelt im nächsten Frame ausgeführt
  (Vermeidung von Layout-Thrashing).
* **GPU-Auslagerung:** `translateZ(0)`, `contain`, hardwarebeschleunigte Aurora.
* **Render-Budget:** Maximal 120 Karten pro Ansicht; semantische Embeddings werden
  gecacht; das neuronale Modell wird **lazy** geladen.
* **Lazy & Defensive:** Schwergewichtige Pfade laufen erst bei Bedarf und sind in
  `try/catch` gekapselt; die Enhancement-Schicht patcht die Kernfunktionen, ohne deren
  Performance-Eigenschaften zu verlieren.

---

## 15. Code-Architektur & Dateistruktur

Die App ist **framework-frei**. Die Erweiterungen wurden bewusst **additiv** umgesetzt:
`script.js` bleibt der Kern; `enhancements.js` umhüllt definierte Hook-Funktionen
(Monkey-Patching der globalen Funktionen) und ergänzt eigenständige Subsysteme.

```
/
├── index.html              # Semantisches Grundgerüst, SVG-Templates (<defs>),
│                           # PWA-/Apple-Meta-Tags, Script-/Style-Einbindung
├── style.css               # Liquid-Glass-System, Themes, Grid, Animationen (CSS-Variablen)
├── enhancements.css        # Styles der neuen Subsysteme (#4/#6/#7/#8/#10/#11)
├── script.js               # Kern: State, Rendering, Navigation, Sync, Modals, DnD …
│                           #  + State-Bridge (window-Getter/Setter für let-Zustände)
├── enhancements.js         # Enhancement-Layer: Suche, Tags, Smart Folders, Routing,
│                           # Mikrointeraktionen, Usage-Tracking, SW-Registrierung
├── aurora-webgl.js         # WebGL-Shader-Aurora (#10)
├── sw.js                   # Service Worker (Offline-Caching, #13)
├── manifest.json           # PWA-Manifest
├── browserconfig.xml       # Windows-Kachel-Konfiguration
├── templates.json          # Statischer Daten-Fallback / Seed
├── icons/                  # Favicons, Apple-Touch-Icon, Maskable-Icons
└── functions/
    └── api/
        └── templates.js    # Cloudflare Pages Function: KV GET/POST mit Konfliktprüfung
```

### 15.1 State-Bridge (Integrationsmechanik)
`script.js` deklariert seinen Zustand mit `let` (nicht auf `window` sichtbar). Am Ende von
`script.js` spiegelt eine **State-Bridge** die relevanten Zustände (`jsonData`,
`currentNode`, `pathStack`, `currentSearchQuery`, `favoritePrompts`) über
`Object.defineProperties` als Getter/Setter auf `window`. So kann `enhancements.js` lesen
**und** schreiben, ohne die interne Logik anzufassen. Funktionen sind als
Klassik-Skript-Deklarationen ohnehin global und werden durch den Enhancement-Layer
gezielt umhüllt.

### 15.2 Externe Bibliotheken
| Bibliothek | Zweck | Laden |
|------------|-------|-------|
| **GSAP + Flip** | Favorites-Dock-Animationen (F.L.I.P.) | `defer`, CDN |
| **SortableJS** | Drag & Drop Reorganisation | `defer`, CDN |
| **Vivus** | SVG-„Zeichnen" (Ordner-Icons, Leerzustände) | `defer`, CDN |
| **@huggingface/transformers** | Neuronale Embeddings (semantische Suche) | **lazy** `import()`, nur bei Bedarf |

---

## 16. Betrieb, Deployment & Konfiguration

* **Plattform:** Cloudflare Pages mit **Pages Functions** (`functions/api/templates.js`).
* **KV-Binding:** Erfordert den Namespace **`TEMPLATES_KV`** (Schlüssel `current_templates`).
  Ohne Binding antwortet die Function mit einer klaren Fehlermeldung; die App fällt auf den
  lokalen Cache/die statische `templates.json` zurück.
* **Statischer Seed:** Fehlt der KV-Eintrag, initialisiert die Function ihn aus
  `templates.json`.
* **Service Worker:** Wird unter `/sw.js` mit App-Scope `/` registriert.
* **Reines Frontend:** Außer der Pages Function ist kein Backend nötig; alle weiteren
  Fähigkeiten laufen clientseitig.

---

## 17. Graceful Degradation & Fallback-Matrix

Die Anwendung ist so gebaut, dass **jede** fortgeschrittene Fähigkeit einen sauberen
Rückfall besitzt — es entsteht nie ein kaputter Zustand:

| Fähigkeit | Optimalfall | Fallback |
|-----------|-------------|----------|
| **WebGL-Aurora** (#10) | Echtzeit-Shader | CSS-Aurora-Blobs |
| **Reduced Motion** | volle Animation | Aurora-Standbild, keine Ripples/Shimmer |
| **Semantische Suche** (#4) | neuronales Modell (Embeddings) | heuristischer Token-/Synonym-/Fuzzy-Scorer |
| **Deep-Links** (#6) | View-Transitions-API | direkter DOM-Tausch |
| **Cloud-Sync** | Cloudflare KV (Realtime) | `localStorage` + statische `templates.json` |
| **Offline** (#13) | Service-Worker-Caches | Network-First-Live-Betrieb |
| **Haptik** (#11) | `triggerHapticFeedback` | `navigator.vibrate` / lautlos |
| **Clipboard** | `navigator.clipboard` | `execCommand('copy')`-Fallback |
| **Suche allgemein** | gewichtetes Ranking | einfache `includes`-Filterung |

---

## 🏁 Zusammenfassung

**Prompt-Templates** ist weit mehr als ein JSON-Viewer: ein minutiös durchdachtes Stück
Software, das native-ähnliche UX vollständig im Web realisiert. Über das ursprüngliche
Liquid-Glass-Fundament legt es eine **GPU-Aurora**, eine **neuronale Suche mit robustem
Offline-Fallback**, **Tags & Smart Folders**, **teilbare Deep-Links**, eine reichhaltige
**Mikrointeraktions- und Haptik-Schicht** sowie **vollständigen Offline-Betrieb** — jeweils
sauber additiv integriert und mit durchgängiger Graceful Degradation. Das Ergebnis ist eine
PWA, die sich auf jedem Gerät schnell, edel und native anfühlt.
