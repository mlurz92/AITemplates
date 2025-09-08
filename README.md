# Prompt-Template Browser: Inbetriebnahme auf einem Raspberry Pi

Dies ist eine detaillierte Schritt-für-Schritt-Anleitung zur Installation, Konfiguration und Bereitstellung der Prompt-Template Browser Anwendung auf einem Raspberry Pi 4. Die Anleitung ist speziell für Benutzer ohne Vorerfahrung konzipiert und erklärt jeden notwendigen Schritt, um die Anwendung sicher und dauerhaft über das Internet via HTTPS verfügbar zu machen.

## Inhaltsverzeichnis

1.  [Voraussetzungen](#1-voraussetzungen)
2.  [Schritt-für-Schritt-Anleitung zur Installation](#2-schritt-für-schritt-anleitung-zur-installation)
    *   [2.1: Mit dem Raspberry Pi verbinden](#21-mit-dem-raspberry-pi-verbinden)
    *   [2.2: System aktualisieren](#22-system-aktualisieren)
    *   [2.3: Benötigte Software installieren (Git & Nginx)](#23-benötigte-software-installieren-git--nginx)
    *   [2.4: Webserver starten und konfigurieren](#24-webserver-starten-und-konfigurieren)
    *   [2.5: Anwendung herunterladen](#25-anwendung-herunterladen)
    *   [2.6: HTTPS mit Certbot einrichten (Let's Encrypt)](#26-https-mit-certbot-einrichten-lets-encrypt)
3.  [Aufrufen der Anwendung](#3-aufrufen-der-anwendung)
4.  [Anwendung aktualisieren](#4-anwendung-aktualisieren)
5.  [Vollständige Deinstallation und Systemrücksetzung](#5-vollständige-deinstallation-und-systemrücksetzung)
    *   [5.1: Software-Komponenten entfernen](#51-software-komponenten-entfernen)
    *   [5.2: Anwendungsdateien löschen](#52-anwendungsdateien-löschen)
    *   [5.3: System auf den Ursprungszustand zurücksetzen (Empfohlen)](#53-system-auf-den-ursprungszustand-zurücksetzen-empfohlen)
6.  [Wichtiger Hinweis zu den Zugangsdaten](#6-wichtiger-hinweis-zu-den-zugangsdaten)

---

## 1. Voraussetzungen

Bevor Sie mit der Installation beginnen, stellen Sie bitte sicher, dass die folgenden Punkte erfüllt sind:

*   **Hardware:** Ein Raspberry Pi 4 ist betriebsbereit und mit Strom versorgt.
*   **Betriebssystem:** Eine frische Installation von **Raspberry Pi OS Lite (64-bit)** befindet sich auf der SD-Karte. Der Standardbenutzer ist `pi`.
*   **Netzwerk:** Der Raspberry Pi ist per LAN-Kabel oder WLAN mit Ihrem Router und dem Internet verbunden.
*   **SSH-Zugang:** Sie können sich von einem anderen Computer aus per SSH mit Ihrem Raspberry Pi verbinden. Sie benötigen dafür die IP-Adresse des Raspberry Pi in Ihrem lokalen Netzwerk.
*   **MyFRITZ!-Konto & DynDNS:**
    *   Sie haben ein MyFRITZ!-Konto eingerichtet.
    *   Sie haben eine MyFRITZ!-Adresse für Ihren Raspberry Pi erstellt. Für diese Anleitung gehen wir von der Adresse `raspberrypi.hyg6zkbn2mykr1go.myfritz.net` aus.
*   **Port-Weiterleitung (Port Forwarding):** Dies ist der wichtigste Schritt! In den Einstellungen Ihres Routers (z.B. FRITZ!Box) müssen Sie die folgenden Ports an die **lokale IP-Adresse Ihres Raspberry Pi** weiterleiten:
    *   **Port `80`** (für HTTP)
    *   **Port `443`** (für HTTPS)

Ohne diese Port-Weiterleitungen ist Ihr Raspberry Pi aus dem Internet nicht erreichbar und die Einrichtung von HTTPS wird fehlschlagen.

## 2. Schritt-für-Schritt-Anleitung zur Installation

Führen Sie die folgenden Befehle nacheinander im Terminal Ihres Raspberry Pi aus.

### 2.1: Mit dem Raspberry Pi verbinden

Öffnen Sie ein Terminal (auf Windows z.B. PowerShell oder CMD, auf macOS/Linux das Terminal) und verbinden Sie sich per SSH mit Ihrem Raspberry Pi. Ersetzen Sie `<IP_ADRESSE_DES_PI>` durch die tatsächliche lokale IP-Adresse Ihres Geräts.

```bash
ssh pi@<IP_ADRESSE_DES_PI>
```

Sie werden nach dem Passwort für den Benutzer `pi` gefragt.

### 2.2: System aktualisieren

Es ist eine bewährte Praxis, das System vor jeder neuen Installation auf den neuesten Stand zu bringen.

*   Der erste Befehl lädt die neuesten Paketlisten herunter.
*   Der zweite Befehl installiert alle verfügbaren Updates.

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3: Benötigte Software installieren (Git & Nginx)

Wir benötigen zwei Hauptkomponenten:
*   `git`: Um den Quellcode der Anwendung von GitHub herunterzuladen.
*   `nginx`: Ein leistungsstarker und ressourcenschonender Webserver, der die Anwendungsdateien im Internet bereitstellt.

```bash
sudo apt install git nginx -y
```

### 2.4: Webserver starten und konfigurieren

Nach der Installation stellen wir sicher, dass Nginx läuft und bei jedem Systemstart automatisch gestartet wird.

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.5: Anwendung herunterladen

Wir wechseln nun in das Standardverzeichnis für Web-Inhalte, entfernen die Platzhalterseite von Nginx und laden die Anwendung direkt aus dem GitHub-Repository.

1.  **Verzeichnis leeren:** Wir löschen die Standard-HTML-Datei von Nginx.

    ```bash
    sudo rm /var/www/html/index.nginx-debian.html
    ```

2.  **Anwendung klonen:** Wir laden den Code in das richtige Verzeichnis.

    ```bash
    sudo git clone https://github.com/mlurz92/anwendungsname.git /var/www/html/
    ```

    **Wichtiger Hinweis:** Der Befehl lädt den gesamten Inhalt des Repositorys in das Verzeichnis `/var/www/html/`. Die `index.html` der Anwendung liegt damit direkt im Hauptverzeichnis des Webservers.

### 2.6: HTTPS mit Certbot einrichten (Let's Encrypt)

Um eine sichere HTTPS-Verbindung zu gewährleisten, verwenden wir Certbot, um ein kostenloses SSL-Zertifikat von Let's Encrypt zu erhalten und automatisch zu konfigurieren.

1.  **Certbot installieren:** Wir installieren Certbot und das spezielle Plugin für Nginx.

    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    ```

2.  **Zertifikat anfordern und Nginx konfigurieren:** Führen Sie den folgenden Befehl aus. Certbot wird Nginx automatisch erkennen, das Zertifikat für Ihre Domain anfordern und die Nginx-Konfiguration für HTTPS anpassen.

    *   `--nginx`: Verwendet das Nginx-Plugin.
    *   `-d`: Gibt die Domain an, für die das Zertifikat gelten soll.
    *   `--non-interactive --agree-tos`: Stimmt den Nutzungsbedingungen automatisch zu.
    *   `-m`: Die E-Mail-Adresse für wichtige Benachrichtigungen (z.B. zum Ablauf des Zertifikats).

    ```bash
    sudo certbot --nginx -d raspberrypi.hyg6zkbn2mykr1go.myfritz.net --non-interactive --agree-tos -m mlurz92@googlemail.com
    ```

Certbot richtet auch eine automatische Erneuerung des Zertifikats ein, sodass Sie sich darum in Zukunft nicht mehr kümmern müssen.

**Die Installation ist nun abgeschlossen!**

## 3. Aufrufen der Anwendung

Öffnen Sie einen beliebigen Webbrowser auf einem Gerät (Computer, Smartphone) und geben Sie die folgende Adresse in die Adresszeile ein:

**https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net/**

Die Anwendung sollte nun sicher über HTTPS geladen werden.

## 4. Anwendung aktualisieren

Wenn es eine neue Version der Anwendung im GitHub-Repository gibt, können Sie diese mit den folgenden Befehlen auf Ihrem Raspberry Pi einspielen.

**WARNUNG:** Der Befehl `git reset --hard` überschreibt alle lokalen Änderungen an den Dateien. Wenn Sie in der Anwendung selbst Prompts bearbeitet oder hinzugefügt haben, werden diese Änderungen durch das Update **nicht** beeinflusst, da sie im Local Storage Ihres Browsers gespeichert sind. Dieser Befehl aktualisiert nur die Basis-Anwendungsdateien (`index.html`, `script.js`, `style.css` etc.).

1.  **In das Anwendungsverzeichnis wechseln:**

    ```bash
    cd /var/www/html/
    ```

2.  **Neueste Änderungen vom Server abrufen:**

    ```bash
    sudo git fetch origin
    ```

3.  **Lokalen Stand auf den neuesten Stand des Servers zurücksetzen:**

    ```bash
    sudo git reset --hard origin/main
    ```
    *(Hinweis: Falls der Haupt-Branch anders als `main` heißt, z.B. `master`, passen Sie den Befehl entsprechend an.)*

Nachdem Sie diese Befehle ausgeführt haben, laden Sie die Seite in Ihrem Browser neu (ggf. mit `Strg + F5` oder `Cmd + Shift + R`, um den Cache zu leeren), um die aktualisierte Version zu sehen.

## 5. Vollständige Deinstallation und Systemrücksetzung

Wenn Sie die Anwendung und alle zugehörigen Komponenten vollständig entfernen möchten, folgen Sie diesen Schritten.

### 5.1: Software-Komponenten entfernen

Dieser Befehl deinstalliert Nginx, Certbot und alle zugehörigen Konfigurationsdateien und Abhängigkeiten.

```bash
sudo systemctl stop nginx
sudo apt purge --auto-remove nginx certbot python3-certbot-nginx git -y
```

### 5.2: Anwendungsdateien löschen

Dieser Befehl löscht das Verzeichnis mit den Anwendungsdateien sowie die von Certbot erstellten Zertifikats- und Konfigurationsdateien.

```bash
sudo rm -rf /var/www/html
sudo rm -rf /etc/letsencrypt/
```

### 5.3: System auf den Ursprungszustand zurücksetzen (Empfohlen)

Die oben genannten Schritte entfernen die spezifische Software, die für diese Anwendung installiert wurde. Es können jedoch weitere Systemkonfigurationen oder Abhängigkeiten zurückbleiben.

Der **sicherste und sauberste Weg**, ein Raspberry Pi OS Lite System in seinen absoluten Ursprungszustand zurückzusetzen, ist das **Neuaufspielen des Betriebssystem-Images** auf die SD-Karte mit dem "Raspberry Pi Imager". Dies garantiert ein frisches System ohne jegliche Rückstände.

## 6. Wichtiger Hinweis zu den Zugangsdaten

In den Anforderungen für diese Anleitung wurden die folgenden Zugangsdaten spezifiziert:

*   **Benutzername:** `mlurz92`
*   **Passwort/Secret:** `Kandinsky1!`

Die Prompt-Template Browser Anwendung ist eine rein **clientseitige Anwendung**. Das bedeutet, die gesamte Logik wird im Webbrowser des Benutzers ausgeführt. Die Anwendung selbst hat **keine Benutzerverwaltung, keine Login-Funktion und keine serverseitige Komponente**, die diese Zugangsdaten verwenden würde. Sie werden daher für den Betrieb der Anwendung **nicht benötigt**. Sie sind hier lediglich der Vollständigkeit halber gemäß den Anweisungen dokumentiert.
