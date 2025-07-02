# Prompt-Template Browser

Ein moderner, interaktiver Browser zum Anzeigen, Navigieren, Kopieren und Bearbeiten von hierarchisch organisierten Textbausteinen (Prompts). Die Anwendung lädt ihre Daten aus einer lokalen JSON-Datei, ermöglicht die dynamische Bearbeitung und das Hinzufügen neuer Prompts direkt im Browser und speichert alle Änderungen lokal, um eine personalisierte Vorlagensammlung zu erstellen.

## Features

* **Hierarchische Navigation:** Intuitives Durchsuchen von Ordnerstrukturen, die in `templates.json` definiert sind.
* **Dynamische Inhaltsverwaltung:**
    * **Prompts bearbeiten:** Bestehende Prompt-Texte können direkt in der Anwendung geändert werden.
    * **Prompts hinzufügen:** Neue Prompt-Karten können in jedem beliebigen Ordner oder im Hauptverzeichnis erstellt werden.
* **Lokale Persistenz:** Alle Änderungen (Bearbeitungen, neue Prompts) werden automatisch im Local Storage des Browsers gespeichert.
* **Daten-Export:** Die personalisierte Sammlung von Vorlagen kann jederzeit als `templates_modified.json`-Datei heruntergeladen werden.
* **Kartenansicht:** Responsive Darstellung von Ordnern und Prompts als Karten mit 3D-Hover-Effekt auf dem Desktop.
* **Detailansicht (Modal):** Anzeige des vollständigen Prompt-Textes in einem eleganten, überlagernden Modal-Fenster.
* **Kopieren in Zwischenablage:** Einfaches Kopieren von Prompts mit einem Klick, inklusive visuellem Feedback.
* **Responsives Design & PWA:** Optimiert für Desktop und mobile Endgeräte, inklusive PWA-Unterstützung ("Zum Startbildschirm hinzufügen").
* **Moderne UI/UX:** Umschaltbares Dark/Light-Theme, Glassmorphism-Effekte, flüssige Seitenübergänge und Animationen.
* **Mobile Optimierungen:** Eigene Navigationsleiste, Wischgesten und Integration der Browser-History für ein natives Gefühl.

## Technology Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Datenformat:** JSON
* **APIs:** Fetch, JSON, Clipboard, Fullscreen, History, Local Storage, View Transitions
* **Animation:** GSAP, Vivus.js, Intersection Observer API
* **PWA:** Web App Manifest

## File Structure

```
.
├── icons/                 # Ordner für PWA Icons
│   ├── icon-192x192.png
│   └── icon-512x512.png
├── index.html             # Haupt-HTML-Datei
├── style.css              # CSS für Styling, Layout, Animationen
├── script.js              # JavaScript für Logik und Interaktionen
├── templates.json         # Standard-Datenquelle für Ordner & Prompts
├── manifest.json          # Web App Manifest für PWA
├── favicon.ico            # Favicon
└── README.md              # Diese Datei
```

## Setup & Usage

### Voraussetzungen

Ein moderner Webbrowser, der aktuelle Webstandards unterstützt (z.B. Chrome, Firefox, Edge, Safari). Für die Ausführung wird ein lokaler Webserver empfohlen.

### Datenquelle anpassen (`templates.json`)

Die initiale Struktur und der Inhalt der Anwendung werden durch die Datei `templates.json` definiert. Die Datei hat eine hierarchische Struktur, die auf ineinander verschachtelten Objekten basiert.

* **Struktur:** Jedes Objekt repräsentiert entweder einen Ordner oder einen Prompt.
    * Ein Objekt mit `type: "folder"` wird als **Ordner** dargestellt. Es muss eine `items`-Eigenschaft (ein Array) enthalten, die weitere Objekte aufnimmt.
    * Ein Objekt mit `type: "prompt"` wird als **Prompt** dargestellt. Es enthält eine `content`-Eigenschaft.
* **Wichtige Eigenschaften:**
    * `id`: Ein **eindeutiger Identifikator** (String) für jeden Knoten. Dies ist **entscheidend** für die Funktion der Anwendung.
    * `type`: Definiert den Typ des Knotens. Muss entweder `"folder"` oder `"prompt"` sein.
    * `title`: Der Titel des Ordners oder Prompts, der auf der Karte angezeigt wird.
    * `content`: (Nur für `type: "prompt"`) Der vollständige Text des Prompts.
    * `items`: (Nur für `type: "folder"`) Ein Array, das weitere Ordner- oder Prompt-Objekte enthält.

**Beispielstruktur:**

```json
{
  "id": "root",
  "type": "folder",
  "title": "Home",
  "items": [
    {
      "id": "1",
      "type": "folder",
      "title": "Hauptordner 1",
      "items": [
        {
          "id": "1-1",
          "type": "prompt",
          "title": "Mein erster Prompt",
          "content": "Dies ist der Text für den ersten Prompt."
        },
        {
          "id": "1-2",
          "type": "folder",
          "title": "Unterordner 1.1",
          "items": [
            {
              "id": "1-2-1",
              "type": "prompt",
              "title": "Verschachtelter Prompt",
              "content": "Dieser Prompt befindet sich in einem Unterordner."
            }
          ]
        }
      ]
    },
    {
      "id": "2",
      "type": "prompt",
      "title": "Mein zweiter Prompt (auf Hauptebene)",
      "content": "Dieser Prompt ist direkt unter Home."
    }
  ]
}
```

### Ausführen der Anwendung (Empfohlen)

Da Browser `fetch`-Anfragen an lokale Dateien (`file://`) blockieren, ist die Verwendung eines lokalen Webservers die beste Methode.

1.  **Stellen Sie sicher, dass Sie Node.js installiert haben.**
2.  Öffnen Sie ein Terminal im Projektverzeichnis.
3.  Führen Sie den folgenden Befehl aus, um einen einfachen Webserver zu starten:
    ```bash
    npx serve .
    ```
4.  Öffnen Sie die angezeigte `http://localhost:....`-Adresse in Ihrem Browser.

*Alternative (Python):*

```bash
# Für Python 3
python -m http.server
```

Öffnen Sie dann `http://localhost:8000` in Ihrem Browser.

## Personalisierung und Datenmanagement

### Prompts bearbeiten

1.  Klicken Sie auf eine Prompt-Karte, um die Detailansicht zu öffnen.
2.  Klicken Sie auf den **Bearbeiten-Button** (Stift-Icon).
3.  Ändern Sie den Text im Textfeld.
4.  Klicken Sie auf den **Speichern-Button** (Disketten-Icon). Die Änderungen werden sofort im Browser gespeichert.

### Prompts hinzufügen

1.  Navigieren Sie in den Ordner, in dem Sie einen neuen Prompt erstellen möchten.
2.  Klicken Sie auf den **Hinzufügen-Button** (+) in der oberen Navigationsleiste.
3.  Das Detail-Modal öffnet sich im "Erstellen"-Modus.
4.  Geben Sie einen Titel und den Inhalt für den neuen Prompt ein.
5.  Klicken Sie auf den **Speichern-Button**. Die neue Karte erscheint in der aktuellen Ansicht und die Änderungen werden gespeichert.

### Änderungen herunterladen & zurücksetzen

  * **Herunterladen:** Sobald Sie eine Änderung gespeichert haben, erscheint der **Download-Button**. Klicken Sie darauf, um Ihre gesamte personalisierte `templates_modified.json`-Datei zu sichern.
  * **Zurücksetzen:** Der **Zurücksetzen-Button** (erscheint ebenfalls nach Änderungen) ermöglicht es Ihnen, alle lokalen Anpassungen zu verwerfen und zum Zustand der ursprünglichen `templates.json`-Datei zurückzukehren.
