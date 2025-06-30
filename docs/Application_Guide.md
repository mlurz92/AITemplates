# Anwendungsleitfaden: Nodal Staging Analyse-Tool (Version 5.1.0)

## 1. Einleitung

### 1.1. Zweck und Anwendungsbereich
Das **Nodal Staging: Avocado Sign vs. T2 Criteria** Analyse-Tool ist eine spezialisierte, clientseitige Webanwendung, die als wissenschaftliches Forschungsinstrument für die radiologische Diagnostik des Rektumkarzinoms konzipiert wurde. Sie bietet eine interaktive Plattform für die tiefgehende Analyse und den Vergleich der diagnostischen Leistungsfähigkeit verschiedener MRT-basierter Kriterien zur Beurteilung des mesorektalen Lymphknotenstatus (N-Status).

Der wissenschaftliche Fokus der Anwendung liegt auf der rigorosen Evaluierung des innovativen, kontrastmittelbasierten **Avocado Signs (AS)** im direkten Vergleich mit einem umfassenden Spektrum morphologischer Kriterien aus T2-gewichteten (T2w) Sequenzen. Zu diesen Vergleichsstandards gehören:
*   **Etablierte, literaturbasierte Kriterien:** Richtlinien und Kriterien aus einflussreichen Studien und Fachgesellschaften (z.B. ESGAR 2016, SAR Restaging).
*   **Datengetriebene, kohortenspezifisch optimierte Kriterien:** Rechnerisch ermittelte "Best-Case"-Szenarien für T2w-Kriterien, die für jede spezifische Patientenkohorte mittels einer integrierten Brute-Force-Analyse identifiziert werden.

Die Anwendung unterstützt den gesamten wissenschaftlichen Workflow – von der initialen Datenexploration über die detaillierte statistische Analyse bis hin zur Erstellung eines vollständigen, publikationsreifen Manuskriptentwurfs, der nach den Stilrichtlinien des Fachjournals *Radiology* formatiert ist.

### 1.2. Wichtiger Hinweis: Nur für Forschungszwecke
**Haftungsausschluss:** Diese Anwendung ist ausschließlich für **Forschungs- und Bildungszwecke** konzipiert. Die dargestellten Daten, Statistiken und generierten Texte basieren auf einem statischen, pseudonymisierten Forschungsdatensatz. **Die Ergebnisse dürfen unter keinen Umständen für die klinische Diagnosestellung, direkte Behandlungsentscheidungen oder andere primäre medizinische Anwendungen verwendet werden.** Die wissenschaftliche und klinische Verantwortung für die Interpretation und Nutzung der generierten Ergebnisse liegt allein beim Anwender.

## 2. Globale UI-Konzepte und Bedienphilosophie

Die Benutzeroberfläche ist darauf ausgelegt, einen intuitiven und methodisch einwandfreien wissenschaftlichen Arbeitsablauf zu ermöglichen.

### 2.1. Anwendungs-Layout
*   **Header:** Eine fixierte Kopfzeile am oberen Rand enthält den Anwendungstitel, eine Schaltfläche für die Kurzanleitung ("Quick Guide") und die Steuerelemente für die globale Kohortenauswahl.
*   **Navigationsleiste (Tabs):** Unterhalb des Headers befindet sich eine horizontale Navigationsleiste mit Reitern (Tabs), die einen schnellen Wechsel zwischen den sieben Hauptmodulen ermöglicht: `Data`, `Analysis`, `Statistics`, `Comparison`, `Insights`, `Publication` und `Export`.
*   **Inhaltsbereich:** Der zentrale Arbeitsbereich, in dem die spezifischen Inhalte und Werkzeuge des jeweils aktiven Tabs angezeigt werden.

### 2.2. Globaler Kohorten-Kontext vs. Analyse-Kontext
Die Anwendung verwendet ein entscheidendes duales System, um sowohl Flexibilität für den Benutzer als auch wissenschaftliche Strenge zu gewährleisten:

*   **Globaler Kohorten-Kontext:** Drei Schaltflächen im Header (`Overall`, `Surgery alone`, `Neoadjuvant therapy`) filtern den gesamten Datensatz für die allgemeine Exploration in den Tabs `Data`, `Analysis` und `Statistics` (in der "Single View"). Diese Auswahl stellt die primäre, vom Benutzer definierte Ansicht der Daten dar.

*   **Analyse-Kontext (Methodische Sperre):** Für spezifische, wissenschaftlich valide Vergleiche aktiviert die Anwendung automatisch einen temporären **Analyse-Kontext**. Dies ist ein Kernmerkmal der Tabs `Comparison` und `Insights` sowie der "Comparison View" des `Statistics`-Tabs.
    *   **Aktivierung:** Wenn ein literaturbasiertes T2-Kriterium zum Vergleich ausgewählt wird (z.B. ESGAR 2016), stellt die Anwendung den Kontext automatisch auf die methodisch korrekte Patientenkohorte ein (z.B. "Surgery alone"). Ebenso sperrt die Auswahl eines datengetriebenen "Best Case"-Kriteriums den Kontext auf die Kohorte, auf der es optimiert wurde.
    *   **Auswirkung:** Während ein Analyse-Kontext aktiv ist, sind die Schaltflächen zur globalen Kohortenauswahl im Header **deaktiviert (gesperrt)**, um ungültige Vergleiche zu verhindern. Alle statistischen Berechnungen und Diagramme innerhalb dieses Kontexts werden ausschließlich auf der gesperrten Kohorte durchgeführt.
    *   **Transparenz:** Ein gut sichtbares Banner innerhalb des aktiven Tabs zeigt deutlich an, welcher Kontext aktiv ist (z.B. "Analyse ist auf die 'Surgery alone'-Kohorte (N=29) gesperrt"), sodass der Benutzer jederzeit über die exakte Patientengruppe informiert ist.
    *   **Deaktivierung:** Der Kontext wird automatisch gelöscht, wenn zu einem nicht-kontextspezifischen Tab (wie `Data` oder `Publication`) gewechselt wird.

Dieses System garantiert, dass direkte statistische Tests zwischen diagnostischen Methoden (wie DeLong oder McNemar) immer auf derselben, geeigneten Patientengruppe durchgeführt werden, was eine entscheidende Voraussetzung für eine valide wissenschaftliche Publikation ist.

### 2.3. Interaktive Hilfe
*   **Tooltips:** Nahezu alle UI-Elemente (Schaltflächen, Tabellenköpfe, Metriken) sind mit detaillierten Tooltips ausgestattet, die bei Mouse-Over ihre Funktion erklären oder eine formale Definition liefern.
*   **Quick Guide:** Die **?**-Schaltfläche im Header öffnet ein modales Fenster mit einer umfassenden Kurzanleitung zu allen Funktionen.

## 3. Die Anwendungsmodule im Detail (Tabs)

### 3.1. Data Tab
*   **Zweck:** Anzeigen, Sortieren und Erkunden des zugrundeliegenden Patientendatensatzes basierend auf der **globalen Kohortenauswahl**.
*   **Komponenten & Workflow:**
    *   **Patiententabelle:** Eine interaktive, sortierbare Tabelle listet alle Patienten der ausgewählten globalen Kohorte auf. Die Spalten umfassen ID, Name, Geschlecht, Alter, Therapie, einen kombinierten N/AS/T2-Status und Notizen.
    *   **Sortierung:** Ein Klick auf die Spaltenüberschriften sortiert die Tabelle. Die Spalte "N/AS/T2" bietet eine spezielle Untersortierung durch Klicken auf die Labels "N", "AS" oder "T2" in der Spaltenüberschrift.
    *   **Detailansicht (Lymphknoten):** Zeilen von Patienten mit T2-Lymphknotendaten sind erweiterbar (durch Klicken auf die Zeile oder das Pfeilsymbol), um eine detaillierte Liste der morphologischen Eigenschaften jedes einzelnen Knotens (Größe, Form, Rand, Homogenität, Signal) anzuzeigen.
    *   **"Expand/Collapse All Details"-Schaltfläche:** Schaltet die Detailansicht für alle Patienten in der Tabelle gleichzeitig um.

### 3.2. Analysis Tab
*   **Zweck:** Interaktives Definieren von T2-Kriterien, Durchführen von Optimierungsanalysen und Untersuchen der Auswirkungen der Kriterien auf Patientenebene. Dieser Tab arbeitet immer auf Basis der **globalen Kohortenauswahl**.
*   **Komponenten & Workflow:**
    *   **Dashboard:** Bietet eine grafische Übersicht über Alter, Geschlecht, Therapie und Statusmarker-Verteilungen für die aktuelle globale Kohorte.
    *   **"Define T2 Malignancy Criteria"-Karte:** Das interaktive Werkzeug zur Definition von T2-Kriterien.
        *   **Kriterienkonfiguration:** Merkmale (Größe, Form, Rand, Homogenität, Signal) können über Checkboxen aktiviert/deaktiviert werden. Ihre spezifischen Werte (z.B. Größenschwellenwert, Formwert) können über einen Schieberegler oder Schaltflächen angepasst werden.
        *   **Logik-Schalter:** Ein Schalter ermöglicht es, die logische Verknüpfung der aktiven Kriterien zwischen **AND** (alle aktiven Kriterien müssen erfüllt sein) und **OR** (mindestens ein aktives Kriterium muss erfüllt sein) zu ändern.
        *   **"Apply & Save"-Schaltfläche:** Wendet die konfigurierten T2-Kriterien und die Logik global auf den gesamten Anwendungszustand an und speichert sie im lokalen Speicher des Browsers für zukünftige Sitzungen. Ein nicht gespeicherter Zustand wird durch einen gestrichelten Kartenrand angezeigt.
    *   **"Diagnostic Performance (Current T2)"-Karte:** Zeigt die diagnostische Leistungsfähigkeit (Sensitivität, Spezifität, PPV, NPV, Genauigkeit, AUC) der aktuell definierten T2-Einstellungen in Echtzeit an und ermöglicht so ein sofortiges Feedback auf Änderungen der Kriterien.
    *   **Brute-Force-Optimierung:**
        1.  **"Criteria Optimization (Brute-Force)"-Karte (Runner):** Hier kann eine neue Optimierungsanalyse gestartet werden. Der Benutzer wählt eine Zielmetrik (z.B. "Balanced Accuracy") und startet den Prozess. Ein Fortschrittsbalken zeigt den Status an. Nach Abschluss können die besten gefundenen Kriterien direkt angewendet ("Apply Best") oder die Top-Ergebnisse in einem Detailfenster ("Top 10") angezeigt werden.
        2.  **"Brute-Force Optima (Saved Results)"-Karte (Übersicht):** Diese Tabelle bietet eine dauerhafte Übersicht über die **besten gespeicherten Ergebnisse** für jede Kohorte und jede Zielmetrik, die bereits ausgeführt wurde. Jedes Ergebnis kann durch Klicken auf die zugehörige "Apply"-Schaltfläche in das "Define T2 Malignancy Criteria"-Panel geladen werden.
        3. **Intelligenter Kohortenwechsel:** Wenn Sie auf "Apply" für ein gespeichertes Ergebnis klicken, lädt die Anwendung nicht nur die Kriterien, sondern **wechselt auch automatisch die globale Kohorte**, um der Kohorte zu entsprechen, auf der die Optimierung ursprünglich durchgeführt wurde. Dadurch wird sichergestellt, dass der Benutzer die Kriterien sofort in ihrem relevantesten Kontext anzeigt.

### 3.3. Statistics Tab
*   **Zweck:** Bietet eine formale und umfassende statistische Auswertung der diagnostischen Leistungsfähigkeit.
*   **Komponenten & Workflow:**
    *   **Ansichtsumschalter ("Single View" / "Comparison View"):** Schaltet zwischen der Analyse einer einzelnen Kohorte (basierend auf der **globalen Kohortenauswahl**) und dem direkten statistischen Vergleich zweier vom Benutzer wählbarer Kohorten um.
    *   **Statistikkarten (in beiden Ansichten):** Präsentieren detaillierte Ergebnisse zu:
        *   **Deskriptive Statistik:** Demografie, Statusverteilungen und Lymphknotenzählungen für die ausgewählte(n) Kohorte(n).
        *   **Diagnostische Leistungsfähigkeit:** Detaillierte Metriken (Sens, Spec, PPV, NPV, Acc, AUC, F1) mit 95% Konfidenzintervallen für sowohl das Avocado Sign als auch die angewandten T2-Kriterien.
        *   **Statistischer Vergleich:** McNemar- und DeLong-Tests zum Vergleich von AS vs. angewandten T2-Kriterien.
        *   **Assoziationsanalyse:** Odds Ratios und Risikodifferenzen für einzelne Merkmale.
        *   **Zusätzlicher diagnostischer Wert:** Eine spezielle Analysekarte (für die 'Surgery alone'-Kohorte), die zeigt, wie gut das Avocado Sign in Fällen abschneidet, in denen die Standard-ESGAR-2016-T2-Kriterien versagt haben.
    *   **Kriterien-Vergleichstabelle (nur in "Single View"):** Diese Tabelle vergleicht die Leistung des Avocado Signs mit den angewandten T2-Kriterien und vordefinierten Kriteriensätzen aus der Literatur. Für literaturbasierte Kriterien ruft die Anwendung automatisch die Leistungsdaten ab, die auf der **methodisch korrekten Kohorte** berechnet wurden, und kennzeichnet dies transparent in der Tabelle (z.B. "ESGAR 2016 (Surgery alone, n=29)"), auch wenn diese von der aktuell ausgewählten globalen Kohorte abweicht.

### 3.4. Comparison Tab
*   **Zweck:** Formatiert ausgewählte Analyseergebnisse visuell für Präsentationen und direkte Vergleiche und erzwingt dabei die methodische Korrektheit über den **Analyse-Kontext**.
*   **Komponenten & Workflow:**
    *   **Ansichtsauswahl:** Radio-Buttons ermöglichen es, den Fokus entweder auf die alleinige Leistung des AS über alle Kohorten hinweg ("AS Performance") oder auf den direkten Vergleich mit T2-Kriterien ("AS vs. T2 Comparison") zu legen.
    *   **Auswahl der T2-Vergleichsbasis:** Im "AS vs. T2"-Modus kann der Benutzer über ein Dropdown-Menü den T2-Kriteriensatz für den Vergleich auswählen. Diese Liste enthält alle literaturbasierten Kriterien und die datengetriebenen "Best Case"-Kriterien für jede Kohorte.
    *   **Automatischer Kontextwechsel:** Wenn ein T2-Kriteriensatz zum Vergleich ausgewählt wird, stellt die Anwendung automatisch einen **Analyse-Kontext** her. Sie sperrt die Kohorte auf diejenige, die für dieses Kriterium am besten geeignet ist (z.B. "Surgery alone" für ESGAR-Kriterien), um einen methodisch fundierten Vergleich zu gewährleisten.
    *   **Dynamischer Inhalt:** Generiert automatisch:
        *   Ein **Vergleichsdiagramm (Balkendiagramm)**, das fünf wichtige Leistungsmetriken (Sensitivität, Spezifität, PPV, NPV, AUC) sowohl für AS als auch für die ausgewählten T2-Kriterien visualisiert.
        *   Eine **Leistungsmetrik-Tabelle** mit detaillierten Werten, 95% Konfidenzintervallen und einer dedizierten p-Wert-Spalte für den direkten statistischen Vergleich jeder Metrik.
        *   Eine **Info-Karte zur Vergleichsbasis**, die die Quelle und Definition des ausgewählten T2-Kriteriensatzes detailliert beschreibt.

### 3.5. Insights Tab
*   **Zweck:** Bietet fortgeschrittene, explorative Analysen zur tieferen Untersuchung der Daten und der Modell-Performance. Dieser Tab nutzt ebenfalls den **Analyse-Kontext**, um methodisch korrekte Vergleiche zu gewährleisten.
*   **Komponenten & Workflow:**
    *   **Vergleichsbasis-Auswahl:** Ein zentrales Dropdown-Menü legt fest, welches T2-Kriterienset als Vergleichsbasis für die Analysen auf dieser Seite dient.
    *   **"Power & Sample Size"-Karte:**
        *   **Post-hoc Power:** Berechnet die erreichte statistische Power der Studie, um den beobachteten Unterschied in der diagnostischen Leistung (AUC) zwischen dem Avocado Sign und dem ausgewählten T2-Set nachzuweisen.
        *   **Prospektive Stichprobengröße:** Berechnet die erforderliche Patientenzahl für eine zukünftige Studie, um einen vordefinierten oder den beobachteten Unterschied mit einer gewünschten Power (z.B. 80%) nachweisen zu können. Interaktive Regler ermöglichen die Anpassung der Analyseparameter.
    *   **"Mismatch Analysis"-Karte:**
        *   Visualisiert in einer 2x2-Matrix die Fälle, in denen das Avocado Sign und das ausgewählte T2-Set übereinstimmen oder voneinander abweichen.
        *   Zeigt für jede dieser vier Gruppen (z.B. AS+/T2-) den Anteil der tatsächlich N-positiven Patienten an, um den spezifischen diagnostischen Mehrwert jeder Methode in den diskordanten Fällen zu quantifizieren.
    *   **"Feature Importance"-Karte:**
        *   Analysiert, welche der einzelnen morphologischen T2-Merkmale (Größe, Form, Rand etc.) den stärksten statistischen Zusammenhang mit dem finalen Nodalstatus aufweisen.
        *   Die Ergebnisse werden als sortiertes Balkendiagramm der Odds Ratios dargestellt, um die prädiktive Kraft jedes Merkmals zu visualisieren.

### 3.6. Publication Tab
*   **Zweck:** Ein integrierter Assistent zur Erstellung eines vollständigen wissenschaftlichen Manuskriptentwurfs gemäß den Stilrichtlinien des Journals *Radiology*.
*   **Komponenten & Workflow:**
    *   **Titelseite & Gliederung:** Die Ansicht ist wie ein Manuskript aufgebaut, beginnend mit einer *Radiology*-konformen Titelseite (einschließlich Key Results und einer automatisch generierten Abkürzungsliste) und ist klar in Hauptabschnitte (Abstract, Introduction, Materials and Methods, etc.) gegliedert, die über eine fixierte Seitenleiste navigierbar sind.
    *   **Dynamische Textgenerierung:** Die Anwendung generiert professionell formulierten, englischsprachigen Text für jeden Abschnitt. Sie integriert dynamisch die **aktuellsten Analyseergebnisse** (aus Vergleichen mit Literatur- und datengetriebenen Kriterien sowie den Insights-Analysen) und formatiert alle Werte, statistischen Tests und Zitate korrekt gemäß dem Journalstil (z.B. *P* < .001).
    *   **Eingebettete Inhalte:** Tabellen und Abbildungen (einschließlich eines STARD-konformen Flussdiagramms) werden generiert und direkt an den entsprechenden Stellen in den Textfluss eingebettet.
    *   **BF-Metrik-Auswahl:** Ein Dropdown-Menü ermöglicht es dem Benutzer auszuwählen, welches Brute-Force-Optimierungsergebnis (z.B. optimiert für Balanced Accuracy oder F1-Score) im Text als "datengetriebener Benchmark" zitiert werden soll.
    *   **Wortzahl-Überwachung:** Die Navigationsleiste zeigt eine Live-Wort-/Elementzählung für jeden Abschnitt mit einem definierten Limit an und gibt farbcodiertes Feedback (grün/orange/rot), um die Einhaltung der strengen Einreichungsrichtlinien von *Radiology* zu unterstützen.
    *   **Manuelle Bearbeitung:**
        *   **Edit-Button:** Aktiviert einen `contenteditable`-Modus für den gesamten Manuskriptkörper, der direkte manuelle Änderungen am Text ermöglicht.
        *   **Save-Button:** Speichert die manuell bearbeitete Version des Manuskripts im lokalen Speicher des Browsers. Diese gespeicherte Version wird bei nachfolgenden Besuchen geladen.
        *   **Reset-Button:** Verwirft alle manuellen Änderungen und setzt das Manuskript auf die ursprüngliche, automatisch generierte Version zurück.

### 3.7. Export Tab
*   **Zweck:** Bietet Funktionalitäten zum Exportieren verschiedener Komponenten der generierten Publikation und Analyseergebnisse zur Verwendung in anderen Anwendungen.
*   **Komponenten & Workflow:**
    *   **"Export Full Manuscript as Markdown"-Schaltfläche:** Initiiert den Download des gesamten generierten Manuskripts, einschließlich aller Texte und formatierten Tabellen (Abbildungen sind als Textbeschreibungen enthalten), als einzelne Markdown-Datei (`.md`). Wenn das Manuskript manuell bearbeitet und gespeichert wurde, wird die bearbeitete Version exportiert.
    *   **"Export Tables as Markdown"-Schaltfläche:** Extrahiert alle im generierten Manuskriptinhalt eingebetteten Tabellen, konvertiert jede in das Markdown-Tabellenformat und lädt sie als einzelne Markdown-Dateien (`.md`) herunter. Jede Datei wird basierend auf ihrer Tabellenüberschrift benannt.
    *   **"Export Charts as SVG"-Schaltfläche:** Sammelt alle dynamisch gerenderten Diagramme (Histogramme, Tortendiagramme, Balkendiagramme, ROC-Kurven, Flussdiagramme) aus der gesamten Anwendung, extrahiert deren zugrunde liegenden SVG-Code (Scalable Vector Graphics) und lädt jedes als separate, hochwertige SVG-Datei (`.svg`) herunter, ideal für die Verwendung in Publikationen und Präsentationen.

## 4. Technische Architekturübersicht

Die Anwendung wurde mit Vanilla JavaScript (ES2020+), HTML5 und CSS3 erstellt und nutzt die D3.js-Bibliothek zur Datenvisualisierung. Sie folgt einer modularen Architektur, die Datenlogik, Servicefunktionen und UI-Rendering voneinander trennt.

*   **App Controller (`js/app/main.js`):** Der zentrale Orchestrator, der den Lebenszyklus der Anwendung, den Datenfluss und die UI-Updates verwaltet.
*   **State Manager (`js/app/state.js`):** Ein zentralisiertes Modul zur Verwaltung des globalen Anwendungszustands und des kritischen "Analyse-Kontexts".
*   **Event Manager (`js/ui/event_manager.js`):** Erfasst alle Benutzerinteraktionen und leitet sie an den App Controller weiter.
*   **Kernmodule (`js/core/`):**
    *   `data_processor.js`: Kümmert sich um die initiale Datenbereinigung, -verarbeitung und -filterung.
    *   `t2_criteria_manager.js`: Verwaltet den Zustand und die Logik für die benutzerdefinierten T2-Kriterien.
    *   `study_criteria_manager.js`: Verwaltet die Definitionen und die Logik für alle vordefinierten, literaturbasierten Kriterien.
*   **Service-Schicht (`js/services/`):**
    *   `statistics_service.js`: Enthält die gesamte statistische Berechnungslogik (diagnostische Metriken, Konfidenzintervalle, Vergleichstests, Power-Analyse etc.).
    *   `brute_force_manager.js`: Verwaltet den Web Worker für den Optimierungsprozess.
    *   `publication_service.js`: Orchestriert die Generierung des Manuskripts durch Aufruf seiner verschiedenen Submodule (z.B. `abstract_generator.js`, `results_generator.js`).
    *   `export_service.js`: Bietet robuste HTML-zu-Markdown- und SVG-Extraktionsfunktionen.
*   **UI-Schicht (`js/ui/`):**
    *   `ui_manager.js`: Ein zentraler Manager für alle DOM-Manipulationen und UI-Updates.
    *   `components/`: Module zum Rendern wiederverwendbarer UI-Elemente wie Tabellen und Diagramme.
    *   `tabs/`: Module, die für das Rendern des spezifischen Inhalts jedes der sieben Haupt-Tabs verantwortlich sind (einschließlich `insights_tab.js`).
*   **Web Worker (`workers/brute_force_worker.js`):** Führt den rechenintensiven Optimierungsprozess in einem separaten Thread aus, um die Haupt-UI reaktionsschnell zu halten.

## 5. Setup & Systemanforderungen
*   **Systemanforderungen:** Ein moderner Desktop-Webbrowser (z.B. die neuesten Versionen von Google Chrome, Mozilla Firefox, Microsoft Edge oder Safari). Unterstützung für **Web Workers** ist für die volle Funktionalität (insbesondere die Brute-Force-Optimierung) erforderlich.
*   **Setup:** Es ist keine serverseitige Komponente oder Installation erforderlich. Die Anwendung wird durch direktes Öffnen der `index.html`-Datei im Browser gestartet. Eine Internetverbindung ist für das erstmalige Laden externer Bibliotheken (z.B. Bootstrap, D3.js) von deren jeweiligen Content Delivery Networks (CDNs) erforderlich.