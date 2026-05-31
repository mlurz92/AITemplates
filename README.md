# 🌌 Prompt-Templates – Die ultimative Prompt-Management Web-App

Willkommen bei **Prompt-Templates**, einer hochmodernen, performanten und visuell atemberaubenden Single-Page-Application (SPA) zur Verwaltung, Organisation und schnellen Nutzung von Text-Prompts. Diese Anwendung wurde mit einem extremen Fokus auf **Premium-UX/UI**, **Mobile-First Progressive Web App (PWA) Standards** und **Apple Cupertino Design-Ästhetik** entwickelt.

Dieses Dokument dient als allumfassende Architekturbeschreibung und UX-Manifest, das jedes Detail, jede Design-Entscheidung und jede Interaktionsnuance der Anwendung lückenlos dokumentiert.

---

## 🎨 1. Design-Philosophie: Liquid Glass & Cupertino Ästhetik

Die visuelle Identität der App basiert auf einem state-of-the-art **5-Layer Liquid Glass Refraktions-System**, das Tiefe, Transparenz und Materialität simuliert, gepaart mit einer kosmischen **Aurora-Hintergrundanimation**.

### 1.1 Das 5-Layer Liquid Glass System
Jedes gehobene UI-Element (Karten, Modals, Top-Bar, Favorites-Dock) nutzt eine komplexe Schichtung aus CSS-Eigenschaften, um physisches Glas nachzubilden:
1. **Highlight (Lichtreflexion):** Ein radialer Gradient simuliert den Lichteinfall an der oberen linken Kante (`--glass-highlight`).
2. **Refraktion (Lichtbrechung):** Ein diagonaler Gradient (`--glass-refraction`) erzeugt die typische Glas-Brechung, die den Hintergrund subtil verzerrt.
3. **Shadow-Overlay (Innere Tiefe):** Ein abgedunkelter radialer Bereich unten rechts (`--glass-shadow-overlay`) verleiht dem Element Volumen.
4. **Base Background (Grundfärbung):** Ein halbtransparenter Basis-Farbton (`--glass-bg`), der sich im Hell- und Dunkelmodus dynamisch anpasst.
5. **Backdrop-Filter (Unschärfe & Sättigung):** Die Magie passiert durch `backdrop-filter: blur(22px) saturate(160%) brightness(1.02)`. Der Hintergrund wird weichgezeichnet und in der Sättigung verstärkt, was den typischen iOS-Vibrant-Look erzeugt.

Zusätzlich erhalten die Elemente **Specular-Highlights** (feine weiße/helle Ränder oben) und sanfte **Drop-Shadows**, um sie vom Hintergrund abzuheben.

### 1.2 Die Aurora-Hintergrundanimation
Der Hintergrund besteht nicht nur aus statischen Farben, sondern aus einem dynamischen, performance-optimierten Partikelsystem.
* **Cosmic Aurora Theme:** Drei asymmetrische, weichgezeichnete Form-Elemente (`.shape1`, `.shape2`, `.shape3`) treiben in langsamen, versetzten `translate3d`-Animationen über den Bildschirm.
* **Farbspektrum:** Die Farben (Indigo/Lavendel, Minz-Grün, Warm Peach) sind direkt aus der Apple HIG (Human Interface Guidelines) Palette entlehnt.
* **Performance:** Durch `translateZ(0)` und `contain: strict` werden die Berechnungen vollständig auf die GPU (Hardwarebeschleunigung) ausgelagert, ohne das Layout-Rendering des Browsers zu belasten.

---

## 📱 2. Mobile-First & PWA-Exzellenz (iPhone 14 Pro Max optimiert)

Die App ist explizit als installierbare **Progressive Web App (PWA)** für iOS und moderne Smartphones konzipiert. Jedes Detail wurde poliert, um sich wie eine native App anzufühlen.

### 2.1 Safe Area & Dynamic Island Integration
* Die `index.html` nutzt den Meta-Tag `viewport-fit=cover`, um die App bis an die physikalischen Ränder des Bildschirms auszuweiten.
* **Top-Bar Blur-Erweiterung:** Die obere Glas-Menüleiste (`.top-bar`) erstreckt sich physisch bis zum oberen Bildschirmrand (unter die Dynamic Island und Statusleiste). Ihr inneres `padding-top` wird dynamisch über `env(safe-area-inset-top)` berechnet, sodass alle Buttons sicher *unter* der Notch/Dynamic Island liegen, während der Unschärfe-Effekt dahinter sichtbar bleibt.
* **Home-Indicator Schutz:** Das Favorites-Dock und das untere Padding des Grid-Containers respektieren strikt `env(safe-area-inset-bottom)`, um Überlappungen mit dem iOS-Home-Balken auszuschließen.

### 2.2 Natives Interaktions-Gefühl (Touch-Ergonomie)
* **Verhinderung von Auto-Zoom:** Alle Eingabefelder (`input`, `textarea`) haben eine erzwungene `font-size: 16px`. Dies ist ein kritischer Hack für iOS Safari, der ansonsten ungefragt hereinzoomt, wenn ein Feld angetippt wird. Zusätzlich ist `user-scalable=no` gesetzt.
* **Overscroll Behavior:** Der unschöne "Gummiband-Effekt" beim Scrollen über den Bildschirmrand hinaus (Bounce-Scrolling) ist durch `overscroll-behavior-y: none` auf dem `body` komplett deaktiviert. Nur spezifische Container dürfen scrollen.
* **Touch Targets (44px Rule):** Unter `@media (pointer: coarse)` (Geräte mit Touchscreen) haben alle interaktiven Buttons eine garantierte Mindestgröße von `44x44px`. Auf dem Desktop (Mausbedienung) bleiben sie feiner und kompakter, um das Layout nicht zu sprengen.
* **Visuelles Tap-Feedback:** Der graue Standard-Tipp-Effekt von Safari (`-webkit-tap-highlight-color`) wurde entfernt. Stattdessen nutzen Buttons exakte `:active`-States (`transform: scale(0.98)` und Helligkeitsveränderungen) für ein unmittelbares, physisches Touch-Gefühl.
* **Text Selection Control:** Um versehentliches Markieren beim Scrollen oder Wischen zu verhindern, ist `user-select: none` auf allen UI-Elementen angewandt. Lediglich die reinen Prompt-Texte sind markier- und kopierbar.
* **DVH (Dynamic Viewport Heights):** Modal-Höhen und Container-Größen nutzen `dvh` statt `vh`, wodurch sich das Layout beim Einblenden der virtuellen Tastatur perfekt und ruckelfrei skaliert.

---

## 🧩 3. UI- & UX-Komponenten im Detail

Die App ist modular aus hochkomplexen Komponenten aufgebaut, die nahtlos ineinandergreifen.

### 3.1 Die Top-Bar (Navigationsleiste)
Die Top-Bar ist der zentrale Ankerpunkt. Sie ist `fixed` positioniert und beinhaltet:
* **Zurück-Button:** Erscheint kontextbezogen, sobald man sich in einem Unterordner befindet.
* **Breadcrumb-Navigation:** Ein horizontal scrollbarer Bereich (`overflow-x: auto`), der den genauen Pfad (`Root > Ordner A > Unterordner B`) anzeigt. Jeder Schritt ist klickbar.
* **Aktions-Buttons:** Ein Kontext-sensitives Menü-System zum Hinzufügen (Prompts/Ordner/Verknüpfungen), Reorganisieren, Herunterladen (JSON) und Wechseln des Color-Schemes (Hell/Dunkel).

### 3.2 Cards (Die Prompt- und Ordner-Karten)
Das Herzstück der Anwendung. Das Grid (`cards-container`) skaliert vollkommen dynamisch (`auto-fit`, `minmax`) basierend auf der Bildschirmbreite.
* **Zwei Typen:** Ordner-Karten (zur Navigation) und Prompt-Karten (zur Ausführung).
* **Hover- & 3D-Tilt-Effekt:** Auf dem Desktop reagieren Karten beim Darüberfahren mit einem subtilen 3D-Tilt-Effekt (basierend auf Maus-Position). Der Hover-Zustand verstärkt das Glühen (`--shadow-glow-1`) und hebt die Karte leicht an (`translateY(-6px)`).
* **Kontextmenü & Schnellzugriff:** Ein Rechtsklick (oder Long-Press auf Mobile) öffnet ein flüssig animiertes, schwebendes Kontextmenü (Favorisieren, Umbenennen, Verschieben, Löschen).
* **Schnell-Aktionen:** Beim Hovern über eine Karte werden kleine, kreisrunde Buttons eingeblendet, um direkt zu Editieren oder zu Löschen.

### 3.3 Favorites-Dock (Favoriten-Verwaltung)
Am unteren Bildschirmrand befindet sich das smarte Favorites-Dock, das sich intelligent einklappt oder ausbreitet:
* **Chips-System:** Favoriten werden als kompakte Chips dargestellt. Jeder Chip hat eine individuelle Akzentfarbe (`FAVORITE_ACCENTS`), die aus einem Pool von Cupertino-kompatiblen Neon-Farben generiert wird.
* **Fluid Layout:** Je nach Platzangebot im Chip rendert er entweder als `full` (Titel & Vorschautext) oder `compact` (nur Titel).
* **Swipe-to-Expand:** Auf Mobilgeräten kann das Dock durch eine physische Wischgeste (Swipe Up/Down) geöffnet und geschlossen werden.
* **Resize Observer:** Das Dock misst permanent seinen Platzbedarf (`favoritesFootprintRaf`) und schiebt den Haupt-Container (`padding-bottom`) exakt so weit nach oben, dass keine Karten vom Dock verdeckt werden.

### 3.4 Modal-System & Overlays
Die Modals (für Prompt-Detailansicht, Umbenennen, Ordner-Erstellung) gleiten von unten über den Bildschirm (ähnlich wie iOS-Sheets).
* **Eingabefelder:** Transparente Eingabefelder mit starkem Fokus-Glow (`box-shadow: 0 0 0 3px rgba(...)`).
* **Copy-Button-Animation:** Ein Klick auf "Kopieren" triggert nicht nur den Clipboard-API-Call, sondern auch eine feine Micro-Animation (Häkchen-SVG erscheint via GSAP), gefolgt von einer Toast-Benachrichtigung am oberen Bildschirmrand.

---

## 🛠 4. Technischer Funktionsumfang & Features

Die App ist nicht nur schön, sondern ein echtes Produktivitäts-Kraftpaket.

### 4.1 Datenhaltung & Synchronisierung (Cloudflare KV & LocalStorage)
* **Hybrid-Ansatz:** Alle Daten (Prompts, Ordnerstruktur, Verknüpfungen) liegen in einer hierarchischen JSON-Struktur.
* **Realtime-Sync:** Wenn konfiguriert, kommuniziert die App via REST-API mit einem Cloudflare Worker (`handleCloudflareKVSync`), um den JSON-State über mehrere Geräte hinweg synchron zu halten. Eine Timestamp-Logik (`syncTimestampCloud`) verhindert Konflikte. Ein pulsierender Cloud-Indikator in der Top-Bar signalisiert den Online-Status.
* **Offline-Fallback:** Ist kein Server erreichbar, greift die App nahtlos auf den lokalen Browser-Speicher (`localStorage`) zurück.
* **Import/Export:** Die gesamte Struktur kann jederzeit als `templates.json` heruntergeladen oder per Drag&Drop-Modal wieder importiert werden.

### 4.2 Drag & Drop Reorganisation (SortableJS)
* Durch Klick auf das "Organisieren"-Icon (`organize-toggle`) wechselt die App in den Edit-Mode. Die Karten fangen leicht an zu wackeln (Jiggle-Animation, inspiriert vom iOS Homescreen).
* Dank der Integration von **SortableJS** können Karten nun per Drag&Drop beliebig verschoben, in andere Ordner gedroppt oder umsortiert werden.
* Das Datenmodell im Hintergrund wird in Echtzeit geparst und gespeichert.

### 4.3 Verknüpfungen (Symlinks)
* Um Prompts nicht doppelt pflegen zu müssen, unterstützt das System **Verknüpfungen** (`add-prompt-link`, `add-folder-link`). 
* Eine Karte kann in mehreren Ordnern auftauchen. Änderungen an der Verknüpfung ändern das Original. Der rekursive `resolveLinkedNode`-Algorithmus sorgt dafür, dass keine Endlosschleifen beim Rendern entstehen.

### 4.4 Suchfunktion & View-Toolbar
* Über die Such-Lupe öffnet sich eine Suchleiste. Die App filtert den aktuellen Ordner (und optional Unterordner) in Echtzeit (`input`-Event) und blendet nicht-treffende Karten via CSS/JS aus.

### 4.5 Erweiterte Animationen (GSAP & Vivus)
* **GSAP & Flip Plugin:** Wenn Chips im Favoriten-Dock hinzugefügt, entfernt oder in der Größe verändert werden, berechnet das `Flip`-Plugin die exakten Delta-Werte und animiert die Elemente butterweich an ihre neue Position (F.L.I.P. Technik: First, Last, Invert, Play).
* **Vivus SVG-Animation:** Ordner-Icons und leere Zustände werden nicht einfach eingeblendet, sondern mit der `Vivus`-Bibliothek wird der Strichpfad der SVGs live "gezeichnet", wenn sie auf dem Bildschirm erscheinen.

---

## 🏗 5. Code-Architektur & Struktur

Die Anwendung ist ohne schwere Frameworks wie React oder Vue geschrieben, um maximale Kontrolle, geringste Ladezeiten und rohe Performance zu garantieren.

### 5.1 `index.html`
* Enthält das semantische Grundgerüst.
* Definiert alle versteckten SVG-Templates (`<defs>`), die in der Laufzeit via JavaScript referenziert und in die DOM geklont werden (das spart massive Mengen an DOM-Knoten und Traffic).
* Kümmert sich um das PWA-Manifest und die Apple-spezifischen Meta-Tags.

### 5.2 `style.css` (3.300+ Zeilen pure Magie)
* Arbeitet intensiv mit **CSS Variables (Custom Properties)** (`:root`), um das gesamte Theme, Abstände, Farben und das 5-Layer Liquid Glass System zentral steuerbar zu machen.
* **Breakpoints:** Nutzt ein ausgeklügeltes Fluid-Grid-System mit Clamp-Funktionen (`clamp(208px, 22vw, 236px)`), wodurch media queries auf ein absolutes Minimum reduziert werden.
* **Color Schemes:** Unterstützt systembasierten (prefers-color-scheme) sowie manuell getriggerten Light- und Dark-Mode (`data-color-scheme="light|dark"`).

### 5.3 `script.js` (State & Logic)
* **DOM-Caching:** Am Anfang (`initApp`) werden alle relevanten DOM-Knoten gecached, um unnötige QuerySelector-Aufrufe während der Laufzeit zu vermeiden.
* **State Management:** Der gesamte Zustand liegt im `jsonData` Objekt und dem `pathStack` Array (welches definiert, wie tief wir in der Ordnerstruktur sind).
* **Event Delegation:** Klick-Events auf Karten werden zumeist an übergeordnete Container gebunden (Event Bubbling), um Speicherlecks zu verhindern und die Performance bei hunderten Karten hoch zu halten.
* **RAF (Request Animation Frame):** Aufwendige Layout-Berechnungen (wie das Messen des Favoriten-Docks) werden gebündelt und nur im nächsten Animation-Frame (`requestAnimationFrame`) ausgeführt, um Layout-Thrashing (Reflows) zu verhindern.

---

## 🏁 Zusammenfassung

**Prompt-Templates** ist weit mehr als eine einfache JSON-Viewer-App. Es ist ein minutiös durchdachtes Stück Software, bei dem jede Millisekunde Latenz, jeder Pixel Unschärfe und jede Touch-Interaktion mit äußerster Sorgfalt designt und entwickelt wurde. Die App beweist, dass moderne, native-ähnliche UX vollständig im Web – als PWA – ohne Kompromisse bei der Ästhetik oder Funktionalität realisierbar ist.