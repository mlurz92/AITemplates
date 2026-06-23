/**
 * Reine Hilfsfunktionen (ohne Zugriff auf den geteilten Anwendungszustand).
 *
 * Jede Funktion hier ist seiteneffektfrei bezogen auf den App-State: Sie
 * arbeitet ausschließlich mit ihren Argumenten bzw. Web-Plattform-APIs
 * (navigator/window). Dadurch sind sie isoliert testbar und können von
 * `app.js` gefahrlos importiert werden.
 */

/**
 * Erzeugt eine RFC-4122-ähnliche UUID (v4) als String.
 * @returns {string}
 */
export function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Heuristik zur Erkennung von Touch-/Mobilgeräten.
 * @returns {boolean}
 */
export function isMobile() {
    let isMobileDevice = false;
    try {
        isMobileDevice = (navigator.maxTouchPoints > 0 && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
            || 'ontouchstart' in window
            || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    } catch (e) { }
    return isMobileDevice;
}

/**
 * Sucht rekursiv einen Knoten anhand seiner ID innerhalb eines Teilbaums.
 * @param {object} startNode Wurzel des zu durchsuchenden Teilbaums
 * @param {string} targetId Gesuchte Knoten-ID
 * @returns {object|null}
 */
export function findNodeById(startNode, targetId) {
    if (!startNode || !targetId) return null;
    if (startNode.id === targetId) return startNode;

    if (startNode.type === 'folder' && startNode.items) {
        for (const child of startNode.items) {
            const found = findNodeById(child, targetId);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Kürzt einen Text auf eine maximale Zeichenanzahl an einer Wortgrenze und
 * hängt ein Auslassungszeichen an, falls gekürzt wurde.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string}
 */
export function trimPreviewForLayout(text, maxChars) {
    if (!text || maxChars <= 0) {
        return '';
    }

    if (text.length <= maxChars) {
        return text;
    }

    let trimmed = text.slice(0, maxChars).trim();
    if (trimmed.length < text.length) {
        trimmed = trimmed.replace(/\s+\S*$/, '').trim();
    }

    if (trimmed.length === 0) {
        return text.slice(0, maxChars);
    }
    return `${trimmed}…`;
}

/**
 * Erzeugt aus einem Prompt-Inhalt einen kompakten Vorschautext
 * (max. 140 Zeichen, erste drei nicht-leeren Zeilen).
 * @param {string} content
 * @returns {string}
 */
export function getFavoritePreviewText(content) {
    if (!content) return '';

    const normalizedLines = content
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    if (normalizedLines.length === 0) {
        return '';
    }

    const previewSource = normalizedLines.slice(0, 3).join(' ');
    const condensed = previewSource.replace(/\s+/g, ' ').trim();

    if (condensed.length <= 140) {
        return condensed;
    }

    return `${condensed.slice(0, 137).trim()}…`;
}

/**
 * Validiert, ob ein Objekt dem erwarteten Template-Wurzelschema entspricht.
 * @param {any} data
 * @returns {boolean}
 */
export function validateTemplateSchema(data) {
    return data && data.type === 'folder' && Array.isArray(data.items);
}
