/**
 * Leichtes Build-Setup auf Basis von esbuild.
 *
 * Bündelt die ES-Module unter ./src zu einem einzelnen klassischen Skript
 * (IIFE), das von index.html als <script defer src="script.js"> geladen wird.
 * Auf Cloudflare Pages wird KEIN Build ausgeführt – das gebündelte script.js
 * wird daher committet. Nach Änderungen an ./src bitte `npm run build` laufen
 * lassen.
 *
 * Aufrufe:
 *   node build.mjs            -> einmaliger, minifizierter Produktions-Build
 *   node build.mjs --dev      -> unminifiziert, mit Inline-Sourcemap
 *   node build.mjs --watch    -> Watch-Modus (Dev), rebaut bei jeder Änderung
 */
import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');
const dev = watch || process.argv.includes('--dev');

/** @type {import('esbuild').BuildOptions} */
const options = {
    entryPoints: ['src/main.js'],
    bundle: true,
    format: 'iife',
    target: ['es2020'],
    charset: 'utf8',
    legalComments: 'none',
    outfile: 'script.js',
    // Externe CDN-Bibliotheken (Vivus, Sortable, gsap, Flip) bleiben globale
    // Variablen – sie werden nicht gebündelt, sondern zur Laufzeit erwartet.
    minify: !dev,
    sourcemap: dev ? 'inline' : 'linked',
    banner: {
        js: '/* AITemplates – generiert aus ./src via esbuild. NICHT direkt bearbeiten. Quelle: ./src/*.js */'
    },
    logLevel: 'info'
};

if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('[esbuild] Watch-Modus aktiv – warte auf Änderungen in ./src …');
} else {
    await esbuild.build(options);
    console.log(`[esbuild] Build abgeschlossen (${dev ? 'dev' : 'production'}).`);
}
