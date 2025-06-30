# Nodal Staging Analysis Tool (v5.1.0)

Dieses Repository enthält den Quellcode für das Analysewerkzeug **"Nodal Staging: Avocado Sign vs. T2 Criteria"**. Hierbei handelt es sich um eine eigenständige, clientseitige Webanwendung, die für die fortgeschrittene und reproduzierbare Forschung im Bereich der medizinischen Bildgebung, speziell für das Nodal-Staging des Rektumkarzinoms, entwickelt wurde.

Für eine umfassende Anleitung zum wissenschaftlichen Hintergrund, den Anwendungsfunktionen, dem Benutzer-Workflow und den technischen Details lesen Sie bitte den detaillierten **[Anwendungsleitfaden](./docs/Application_Guide.md)**.

## 1. Projektübersicht

### 1.1. Zweck
Diese Anwendung dient als spezialisiertes Forschungsinstrument für die tiefgehende Analyse und den Vergleich der diagnostischen Leistungsfähigkeit verschiedener MRT-basierter Kriterien zur Beurteilung des mesorektalen Lymphknotenstatus (N-Status). Ihr primäres wissenschaftliches Ziel ist die rigorose Evaluierung eines neuartigen, kontrastmittelbasierten Markers – des **Avocado Signs (AS)** – im Vergleich zu einem umfassenden Spektrum morphologischer Kriterien aus T2-gewichteten (T2w) Sequenzen. Diese Vergleichsstandards umfassen sowohl etablierte, literaturbasierte Richtlinien (z.B. ESGAR, SAR) als auch datengestützte, rechnerisch optimierte Benchmarks.

### 1.2. Kernfunktionen
*   **Interaktive Datenexploration:** Eine hochperformante, sortierbare und filterbare Tabellenansicht des vollständigen Patientendatensatzes mit erweiterbaren Details zu den Merkmalen einzelner Lymphknoten.
*   **Dynamische Kriteriendefinition:** Ein interaktives Bedienfeld ermöglicht die Echtzeit-Definition und Kombination von T2w-Malignitätskriterien (Größe, Form, Rand, Homogenität) und den sie verbindenden logischen Operatoren (AND/OR).
*   **Methodisch fundierte Vergleiche:** Ein robustes "Analyse-Kontext"-System stellt sicher, dass alle statistischen Vergleiche zwischen diagnostischen Methoden ausschließlich auf den korrekten, identischen Patientenkohorten durchgeführt werden – eine entscheidende Voraussetzung für die wissenschaftliche Validität.
*   **Automatisierte Kriterienoptimierung:** Ein integrierter Brute-Force-Algorithmus, der in einem dedizierten Web Worker läuft, identifiziert systematisch die mathematisch optimale Kombination von T2w-Kriterien für eine vom Benutzer ausgewählte diagnostische Metrik (z.B. Balanced Accuracy, F1-Score).
*   **Fortgeschrittene Analysen:** Ein dedizierter "Insights"-Tab bietet tiefere Einblicke durch erweiterte statistische Methoden, einschließlich Post-hoc-Power-Analyse, prospektiver Stichprobenschätzung, Diskrepanz-Analysen (Mismatch) und einer Untersuchung der prädiktiven Wichtigkeit einzelner T2-Merkmale.
*   **Umfassende statistische Analyse:** Automatisierte Berechnung aller relevanten Metriken zur diagnostischen Leistungsfähigkeit (Sensitivität, Spezifität, PPV, NPV, Genauigkeit, AUC) einschließlich 95%-Konfidenzintervallen und geeigneten statistischen Vergleichstests (z.B. DeLong, McNemar).
*   **Automatisierter Publikationsassistent:** Ein dediziertes Modul, das einen vollständigen, formatierten, englischsprachigen Manuskriptentwurf (einschließlich Text, Tabellen und Abbildungen) generiert, der sich präzise an die wissenschaftlichen Stilrichtlinien des Journals *Radiology* hält. Dies beinhaltet eine manuelle Bearbeitungsfunktion, um den Text vor dem Export zu finalisieren.
*   **Vielseitige Exportfunktionalität:** Ermöglicht den Export des vollständigen Manuskripts als Markdown, einzelner Tabellen als Markdown und aller gerenderten Diagramme (Histogramme, Tortendiagramme, Balkendiagramme, ROC-Kurven, Flussdiagramme) als hochwertige Scalable Vector Graphics (SVG)-Dateien.

### 1.3. Haftungsausschluss: Nur für Forschungszwecke
**Diese Anwendung ist ausschließlich für Forschungs- und Bildungszwecke konzipiert.** Die dargestellten Daten, Statistiken und generierten Texte basieren auf einem statischen, pseudonymisierten Forschungsdatensatz. **Die Ergebnisse dürfen unter keinen Umständen für die klinische Diagnosestellung, direkte Behandlungsentscheidungen oder andere primäre medizinische Anwendungen verwendet werden.** Die wissenschaftliche und klinische Verantwortung für die Interpretation und Nutzung der generierten Ergebnisse liegt allein beim Anwender.

## 2. Setup und Nutzung

### 2.1. Systemanforderungen
*   Ein moderner Desktop-Webbrowser (z.B. die neuesten Versionen von Google Chrome, Mozilla Firefox, Microsoft Edge oder Safari).
*   Web-Worker-Unterstützung ist für die Brute-Force-Optimierungsfunktion erforderlich.

### 2.2. Installation
Es ist keine Installation oder serverseitige Einrichtung erforderlich. Die Anwendung ist ein in sich geschlossenes Projekt, das vollständig im Browser des Clients ausgeführt wird.

1.  Klonen oder laden Sie dieses Repository auf Ihren lokalen Rechner herunter.
2.  Öffnen Sie die Datei `index.html` in einem kompatiblen Webbrowser.
3.  Beim ersten Start ist eine Internetverbindung erforderlich, um externe Bibliotheken (z.B. Bootstrap, D3.js) von ihren jeweiligen Content Delivery Networks (CDNs) zu laden.

## 3. Technische Architektur

Die Anwendung wurde mit Vanilla JavaScript (ES2020+) erstellt und folgt einer modularen Architektur, die Datenlogik, Servicefunktionen und UI-Rendering voneinander trennt. Dies gewährleistet Wartbarkeit und Skalierbarkeit.

*   **App Controller (`js/app/main.js`):** Der zentrale Orchestrator, der den Lebenszyklus der Anwendung, den Datenfluss und die UI-Updates verwaltet.
*   **State Manager (`js/app/state.js`):** Ein zentralisiertes Modul zur Verwaltung des globalen Anwendungszustands, einschließlich der aktiven Kohorte, der Sortierpräferenzen und des entscheidenden "Analyse-Kontexts" zur Gewährleistung methodisch fundierter Vergleiche.
*   **Kernmodule (`js/core/`):** Behandeln die grundlegende Datenverarbeitung, die Verwaltung der benutzerdefinierten T2-Kriterien und die Verwaltung der vordefinierten, literaturbasierten Kriterien.
*   **Service-Schicht (`js/services/`):** Enthält die komplexe Geschäftslogik für statistische Berechnungen, die Brute-Force-Optimierung (die die Berechnung an einen Web Worker auslagert) und den umfassenden Dienst zur Publikationserstellung.
*   **UI-Schicht (`js/ui/`):** Verantwortlich für das Rendern aller UI-Komponenten und Tabs. Sie generiert dynamisch HTML-Inhalte basierend auf dem aktuellen Anwendungszustand und den Daten.
*   **Web Worker (`workers/`):** Die Datei `brute_force_worker.js` führt den rechenintensiven Optimierungsprozess in einem separaten Thread aus, um die Haupt-UI reaktionsschnell zu halten.

Für eine detaillierte Aufschlüsselung jeder Datei und Funktion konsultieren Sie bitte den **[Anwendungsleitfaden](./docs/Application_Guide.md)**.