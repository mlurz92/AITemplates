// =====================================================================
// REALTIME SYNC & API LAYER
// =====================================================================

window.initRealtimeSync = function() {
    if (typeof BroadcastChannel !== 'undefined') {
        window.syncBroadcastChannel = new BroadcastChannel('templates-cloud-sync');
        window.syncBroadcastChannel.onmessage = (event) => {
            if (event?.data?.type === 'cloud-updated') {
                window.syncFromCloud({ silent: true, reason: 'broadcast' });
            }
        };
    }
    if (window.syncPollIntervalId) clearInterval(window.syncPollIntervalId);
    window.syncPollIntervalId = setInterval(() => {
        window.syncFromCloud({ silent: true, reason: 'poll' });
    }, 10000);
};

window.syncFromCloud = async function({ silent = false, reason = 'manual' } = {}) {
    if (window.isSyncInFlight) return false;
    window.isSyncInFlight = true;
    try {
        const response = await fetch('/api/templates', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const dataResponse = await response.json();
        if (!dataResponse || !dataResponse.data) return false;

        const incomingTimestamp = dataResponse.lastUpdated || null;
        const hasNewerRemote = incomingTimestamp && (!window.serverSyncTimestamp || incomingTimestamp > window.serverSyncTimestamp);
        const isFirstLoad = !window.jsonData;
        if (isFirstLoad || hasNewerRemote) {
            window.serverSyncTimestamp = incomingTimestamp;
            window.lastSuccessfulSyncAt = Date.now();
            window.processJson(dataResponse.data);
            window.updatePersistenceButtonsVisibility();
            if (!silent && !isFirstLoad) {
                window.showNotification('Cloud-Änderungen synchronisiert.', 'info');
            }
            return true;
        }
        return false;
    } catch (e) {
        if (!silent) {
            console.warn('Cloud-Synchronisierung fehlgeschlagen:', e);
            window.showNotification('Cloud-Synchronisierung fehlgeschlagen.', 'error');
        }
        return false;
    } finally {
        window.isSyncInFlight = false;
    }
};

window.loadJsonData = async function() {
    window.serverSyncTimestamp = null;
    window.updateStorageSourceButton();
    const synced = await window.syncFromCloud({ silent: true, reason: 'initial-load' });
    if (synced) return;

    const storedJson = localStorage.getItem(window.cloudStorageKey);
    if (storedJson) {
        try {
            const parsedData = JSON.parse(storedJson);
            const savedTimestamp = localStorage.getItem(window.cloudSyncTimestampKey);
            if (savedTimestamp) {
                window.serverSyncTimestamp = parseInt(savedTimestamp, 10);
            }
            window.processJson(parsedData);
            window.updatePersistenceButtonsVisibility();
            window.showNotification('Offline-Cache geladen. Warte auf Cloud-Sync…', 'info');
            return;
        } catch (error) {
            console.error("Fehler beim Laden aus Local Storage:", error);
        }
    }

    window.updatePersistenceButtonsVisibility();
    window.containerEl.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Keine Cloud-Daten verfügbar. Bitte Verbindung prüfen und Seite neu laden.</p>`;
};

window.persistJsonData = async function(successMsg, type) {
    try {
        const jsonString = JSON.stringify(window.jsonData, null, 2);
        
        const payload = {
            data: window.jsonData,
            lastUpdated: window.serverSyncTimestamp
        };
        
        const req = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (req.status === 409) {
            const responseData = await req.json();
            window.showNotification('Konflikt erkannt. Cloud-Stand wird geladen…', 'error');
            console.error("Konflikt beim Speichern. Serverdaten:", responseData.serverData);
            await window.syncFromCloud({ silent: true, reason: 'conflict' });
            return;
        }

        if (!req.ok) {
            throw new Error(`API antwortete nicht mit OK: ${req.status}`);
        }
        const responseData = await req.json();
        window.serverSyncTimestamp = responseData.lastUpdated;
        window.lastSuccessfulSyncAt = Date.now();
        window.showNotification(successMsg, type);
        if (window.syncBroadcastChannel) {
            window.syncBroadcastChannel.postMessage({ type: 'cloud-updated', ts: window.serverSyncTimestamp });
        }

        window.updatePersistenceButtonsVisibility();
    } catch (e) {
        console.error("Allgemeiner Fehler beim Speichern:", e);
        window.showNotification('Speichern in Cloudflare KV fehlgeschlagen.', 'error');
    }
};
