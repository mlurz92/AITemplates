# **Prompt-Template Browser**

Ein moderner, interaktiver Browser zum Anzeigen, Navigieren und Kopieren von hierarchisch organisierten Textbausteinen (Prompts), die in einer lokalen XML-Datei gespeichert sind. Die Anwendung bietet eine ansprechende Benutzeroberfläche mit Glassmorphism-Effekten, flüssigen Animationen und ist für Desktop sowie mobile Endgeräte optimiert, mit Fokus auf eine **kompakte "Widget"-Ansicht auf Mobilgeräten** und **PWA-Unterstützung**.

## **Features**

* **Hierarchische Navigation:** Intuitives Durchsuchen von Ordnerstrukturen, definiert in Templates.xml.  
* **Kartenansicht:** Responsive Darstellung von Ordnern und Prompts als Karten (Grid auf Desktop, **einspaltig auf Mobile**).  
  * **Dynamische Icons:** Angepasste SVG-Icons für Ordner und Prompts, basierend auf dem image-Attribut in Templates.xml, erhöhen die visuelle Unterscheidbarkeit.  
  * Ordner: Mit Titel und animiertem Ordner-Icon (Vivus.js, startet sofort bei Touch).  
  * Prompts: Mit Titel und Textvorschau.  
* **"Tap-to-Reveal" Aktionsbuttons:** Auf Prompt-Karten sind die Aktionen (Details anzeigen, Kopieren) standardmäßig ausgeblendet und werden erst bei einem Antippen/Klick auf die Karte sichtbar, was für eine **aufgeräumte und "widget-ähnliche" Oberfläche** sorgt.  
* **Detailansicht (Modal):** Anzeige des vollständigen Prompt-Textes in einem überlagernden Modal-Fenster.  
* **Kopieren in Zwischenablage:** Einfaches Kopieren von Prompts direkt von der Karte oder aus dem Modal mit visuellem Feedback (Notification).  
* **Suchfunktion:** Leistungsstarke Volltextsuche nach Ordner- und Prompt-Titeln sowie dem Prompt-Text. Die Suchergebnisse werden dynamisch angezeigt.  
* **Responsives Design:** Optimierte Darstellung und Funktionalität auf verschiedenen Bildschirmgrößen.  
* **Mobile Optimierungen:**  
  * Fixierte untere Navigationsleiste für einfache Bedienung.  
  * **Wischgeste (Rechtswischen)** zum Zurücknavigieren, unterstützt durch einen **visuellen Swipe-Indikator** am linken Bildschirmrand.  
  * Integration mit der Browser History API für native Zurück/Vorwärts-Navigation, die auch den Suchstatus berücksichtigt.  
  * Berücksichtigung von "Safe Areas" (Notches etc.).  
  * Anpassung der Top-Bar auf Mobilgeräten, um die Suchleiste optimal zu integrieren.  
* **Progressive Web App (PWA):** Unterstützt "Zum Startbildschirm hinzufügen" für ein App-ähnliches Erlebnis (via manifest.json).  
* **Moderne UI/UX:** Dunkles Thema, Glassmorphism-Effekte, Hover-Effekte (Glow, Skalierung), sanfte Seitenübergänge und Scroll-Animationen für Karten.  
* **Performance:** Leichtgewichtig durch Verwendung von Vanilla JavaScript und optimierten Animationen (CSS für einfache Icons, Vivus nur für Ordner).

## **Technology Stack**

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)  
* **Daten:** XML (Templates.xml)  
* **Layout:** CSS Grid, CSS Flexbox, Media Queries  
* **Styling:** CSS Variablen, Backdrop Filter  
* **Animationen:** CSS Transitions, CSS Animations, Vivus.js, GSAP (GreenSock Animation Platform), Intersection Observer API  
* **APIs:** Fetch API, DOMParser, Clipboard API, History API, View Transitions API  
* **PWA:** Web App Manifest

## **File Structure**

```
.  
├── icons/                 \# Ordner für PWA Icons  
│   ├── icon-192x192.png   \# Beispiel PWA Icon  
│   └── icon-512x512.png   \# Beispiel PWA Icon  
├── index.html             \# Haupt-HTML-Datei (Struktur, inkl. Suchleiste)  
├── style.css              \# CSS-Datei (Styling, Layout, Animationen, inkl. Suchleiste)  
├── script.js              \# JavaScript-Datei (Logik, Interaktionen, Datenverarbeitung, Suchlogik)  
├── Templates.xml          \# XML-Datei (Datenquelle für Ordner & Prompts)  
├── manifest.json          \# Web App Manifest für PWA-Funktionalität  
├── favicon.ico            \# Favicon für den Browser-Tab  
└── README.md              \# Diese Datei
```

## **Setup & Usage**

### **Prerequisites**

* Ein moderner Webbrowser, der HTML5, CSS3 und aktuelle JavaScript-Features (ES6+, Fetch API, etc.) unterstützt (z.B. Chrome, Firefox, Edge, Safari).

### **Data Source (Templates.xml)**

Die gesamte Struktur und der Inhalt der Anwendung werden durch die Datei Templates.xml definiert.

* **Struktur:** Die Hierarchie wird durch verschachtelte \<TreeViewNode\>-Elemente aufgebaut. Ein \<TreeViewNode\>, der weitere \<TreeViewNode\>-Elemente enthält, wird als Ordner dargestellt. Ein \<TreeViewNode\> ohne untergeordnete \<TreeViewNode\>-Elemente wird als Prompt-Template dargestellt.  
* **Wichtige Attribute:**  
  * value="Ein Name": Der Text, der als Titel für den Ordner oder Prompt auf der Karte angezeigt wird.  
  * beschreibung="Der Inhalt...": Der vollständige Text des Prompt-Templates. Dieses Attribut sollte bei Ordnern leer sein oder fehlen.  
  * guid="EINE-EINZIGARTIGE-GUID": Ein **global eindeutiger Identifikator** für jeden Knoten (Ordner oder Prompt). **Dies ist entscheidend** für die korrekte Funktion der Navigation, der Browser-History und der Suchfunktion. Sie können GUIDs z.B. mit Online-Generatoren erstellen. Stellen Sie sicher, dass jede GUID nur einmal in der gesamten Datei vorkommt.  
  * image="Zahlenwert": Ein optionales Attribut für die dynamische Icon-Darstellung. Aktuell werden image="1" für Prompts und image="2" für Ordner unterstützt.  
* **Bearbeiten:** Sie können diese Datei mit einem Texteditor bearbeiten, um eigene Ordnerstrukturen und Prompt-Texte hinzuzufügen oder zu ändern. Achten Sie darauf, die XML-Syntax beizubehalten und eindeutige GUIDs zu vergeben.

### **Running the Application**

Da die Anwendung rein clientseitig ist und die Templates.xml über die fetch API lädt, muss sie über einen Webserver bereitgestellt werden, um CORS-Einschränkungen zu umgehen.

* **Option 1: Verwendung eines lokalen Webservers (Empfohlen)**  
  * Um die CORS-Einschränkungen zu umgehen, ist es am besten, die Dateien über einen lokalen Webserver bereitzustellen. Dies ist einfach möglich mit:  
    * **Python:** Navigieren Sie im Terminal in das Projektverzeichnis und führen Sie aus:  
      \# Für Python 3  
      python \-m http.server

      Öffnen Sie dann http://localhost:8000 (oder den angezeigten Port) in Ihrem Browser.  
    * **Node.js/npx:** Wenn Sie Node.js installiert haben, können Sie serve verwenden. Führen Sie im Terminal im Projektverzeichnis aus:  
      npx serve .

      Öffnen Sie dann die angezeigte http://localhost:....-Adresse in Ihrem Browser.  
    * **VS Code Live Server:** Wenn Sie Visual Studio Code verwenden, können Sie die Erweiterung "Live Server" installieren und damit die index.html öffnen.

### **Progressive Web App (PWA)**

* Wenn die Anwendung über HTTPS oder einen lokalen Webserver bereitgestellt wird, erkennen moderne mobile Browser (wie Chrome auf Android, Safari auf iOS) das Web App Manifest.  
* Sie sollten dann die Option erhalten, die Anwendung **"Zum Startbildschirm hinzuzufügen"**.  
* Wenn Sie die Anwendung über das neue Icon auf Ihrem Startbildschirm starten, wird sie in einem eigenständigeren Fenster ohne die übliche Browser-Adressleiste geöffnet, was das Nutzungserlebnis verbessert.  
* Stellen Sie sicher, dass die Icon-Dateien im icons/-Ordner vorhanden sind, damit das korrekte App-Icon verwendet wird.

## **Customization**

* **Theming:** Farben, Schriftarten und einige Abstände können durch Anpassung der CSS-Variablen am Anfang der style.css-Datei geändert werden.  
* **Inhalt:** Der gesamte Inhalt und die Struktur werden durch Bearbeiten der Templates.xml-Datei angepasst (siehe Abschnitt "Data Source").

## **Browser Compatibility**

Die Anwendung wurde für moderne Webbrowser entwickelt und getestet. Sie nutzt Features wie:

* CSS Grid & Flexbox  
* CSS Variablen  
* Backdrop Filter  
* Fetch API  
* Intersection Observer API  
* History API  
* ES6+ JavaScript  
* View Transitions API

Ältere Browser (insbesondere Internet Explorer) werden nicht unterstützt.

## **License**

Dieses Projekt steht unter der MIT-Lizenz.
