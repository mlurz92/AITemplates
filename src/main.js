/**
 * Einstiegspunkt (Entry Point) der Anwendung.
 *
 * Dieses Modul ist die einzige Datei, die der Bundler (esbuild) verarbeitet.
 * Es importiert die App-Initialisierung und stößt sie an, sobald das DOM
 * bereitsteht. Sämtliche Logik liegt in ./app.js, die statische Konfiguration
 * in ./constants.js und reine Helfer in ./utils.js.
 */
import { initApp } from './app.js';

// Initialisiere die Anwendung erst, wenn das gesamte DOM geladen ist.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
