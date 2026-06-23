/**
 * Zentrale, unveränderliche Konfigurationswerte der Anwendung.
 *
 * Diese Werte wurden aus dem ursprünglichen Monolithen (`script.js`)
 * extrahiert, damit Tuning-Parameter an einer einzigen, gut auffindbaren
 * Stelle leben. Sie werden niemals zur Laufzeit neu zugewiesen und können
 * daher als reguläre `const`-Exports geführt werden.
 */

// ---------------------------------------------------------------------------
// Persistenz-/Storage-Schlüssel (localStorage & Cloud-Sync)
// ---------------------------------------------------------------------------
export const favoritesKey = 'favoritePrompts';
export const cloudStorageKey = 'customTemplatesJsonCloud';
export const cloudSyncTimestampKey = 'syncTimestampCloud';

// ---------------------------------------------------------------------------
// Partikel-/Hintergrundsystem
// ---------------------------------------------------------------------------
export const PARTICLE_COUNT = 25;

// ---------------------------------------------------------------------------
// Touch-/Gesten-Schwellenwerte
// ---------------------------------------------------------------------------
export const EDGE_SWIPE_ZONE = 35;

// ---------------------------------------------------------------------------
// Favoriten-Chip-Layout (Breiten in px, Schwellenwerte & Skalierungsgrenzen)
// ---------------------------------------------------------------------------
export const FAVORITE_CHIP_MIN_WIDTH = 140;
export const FAVORITE_CHIP_MAX_WIDTH = 236;
export const FAVORITE_CHIP_MIN_WIDTH_NARROW = 112;
export const FAVORITE_FULL_LAYOUT_THRESHOLD = 204;
export const FAVORITE_COMPACT_LAYOUT_THRESHOLD = 154;
export const FAVORITE_TITLE_MIN_SCALE = 0.6;
export const FAVORITE_PREVIEW_MIN_SCALE = 0.7;

// ---------------------------------------------------------------------------
// Akzentfarben-Pool für Favoriten-Chips (Cupertino-kompatible Neon-Töne)
// ---------------------------------------------------------------------------
export const FAVORITE_ACCENTS = [
    { accent: '#8b5cf6', border: 'rgba(139, 92, 246, 0.65)', soft: 'rgba(139, 92, 246, 0.18)', glow: 'rgba(139, 92, 246, 0.36)', text: '#0c0f17' },
    { accent: '#00e6ff', border: 'rgba(0, 230, 255, 0.6)', soft: 'rgba(0, 230, 255, 0.14)', glow: 'rgba(0, 230, 255, 0.35)', text: '#0c0f17' },
    { accent: '#50fa7b', border: 'rgba(80, 250, 123, 0.58)', soft: 'rgba(80, 250, 123, 0.18)', glow: 'rgba(80, 250, 123, 0.35)', text: '#0c0f17' },
    { accent: '#ffb86c', border: 'rgba(255, 184, 108, 0.6)', soft: 'rgba(255, 184, 108, 0.18)', glow: 'rgba(255, 184, 108, 0.32)', text: '#0c0f17' },
    { accent: '#ff79c6', border: 'rgba(255, 121, 198, 0.6)', soft: 'rgba(255, 121, 198, 0.18)', glow: 'rgba(255, 121, 198, 0.34)', text: '#0c0f17' },
    { accent: '#bd93f9', border: 'rgba(189, 147, 249, 0.6)', soft: 'rgba(189, 147, 249, 0.18)', glow: 'rgba(189, 147, 249, 0.34)', text: '#0c0f17' },
    { accent: '#f1fa8c', border: 'rgba(241, 250, 140, 0.58)', soft: 'rgba(241, 250, 140, 0.18)', glow: 'rgba(241, 250, 140, 0.3)', text: '#0c0f17' },
    { accent: '#ff5555', border: 'rgba(255, 85, 85, 0.6)', soft: 'rgba(255, 85, 85, 0.16)', glow: 'rgba(255, 85, 85, 0.32)', text: '#0c0f17' }
];
