/* =====================================================================
 * Prompt-Templates – WebGL Aurora Engine  (Vorschlag #10)
 * ---------------------------------------------------------------------
 * Ersetzt die drei statischen CSS-Blur-Blobs (.shape1–3) durch eine
 * echtzeit-gerenderte, strömende Aurora auf Basis eines Fragment-Shaders
 * (Fraktales Brownsches Rauschen / Domain-Warping). Läuft vollständig
 * GPU-beschleunigt, passt sich Hell/Dunkel-Theme und Akzentfarbe an und
 * degradiert sauber:
 *
 *   • Kein WebGL            → CSS-Blobs bleiben sichtbar (kein Eingriff).
 *   • prefers-reduced-motion→ ein einziges statisches Frame, keine Loop.
 *   • Tab/Aurora unsichtbar → Render-Loop pausiert (Akkuschonung).
 *
 * Öffentliche API: window.AuroraWebGL { start, stop, setScheme, isActive }
 * ===================================================================== */
(function () {
  'use strict';

  const VERT = `
    attribute vec2 aPosition;
    void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
  `;

  /* Aurora-Shader: zwei überlagerte, domain-gewarpte FBM-Felder ergeben
     weiche, driftende Nordlicht-Schleier. Farben kommen als Uniforms. */
  const FRAG = `
    precision highp float;
    uniform vec2  uResolution;
    uniform float uTime;
    uniform vec3  uColorA;
    uniform vec3  uColorB;
    uniform vec3  uColorC;
    uniform float uIntensity;
    uniform float uIsLight;

    float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
    float noise(vec2 p){
      vec2 i = floor(p); vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    float fbm(vec2 p){
      float v = 0.0; float amp = 0.5;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 6; i++){ v += amp * noise(p); p = m * p; amp *= 0.5; }
      return v;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      vec2 p = uv;
      p.x *= uResolution.x / uResolution.y;
      float t = uTime * 0.045;

      // Domain-Warping für organisch fließende Schleier.
      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t * 0.8)));
      vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.6),
                    fbm(p + 4.0 * q + vec2(8.3, 2.8) - t * 0.4));
      float f = fbm(p + 3.5 * r);

      float band = smoothstep(0.08, 0.88, f);
      vec3 col = mix(uColorA, uColorB, clamp(length(q), 0.0, 1.0));
      col = mix(col, uColorC, clamp(r.x * r.x + r.y * 0.4, 0.0, 1.0));

      // Vertikaler Verlauf: oben dichter, unten ausgedünnt.
      float vGrad = mix(1.0, 0.25, uv.y);
      float alpha = band * vGrad * uIntensity;

      // Sanfte Vignette an den Rändern.
      float vign = smoothstep(1.15, 0.35, length(uv - 0.5));
      alpha *= vign;

      if (uIsLight > 0.5) {
        // Im Hellmodus dezenter & heller getönt.
        col = mix(vec3(1.0), col, 0.55);
        alpha *= 0.5;
      }

      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `;

  /* Akzent-Paletten je Schema (RGB 0–1). */
  const PALETTES = {
    dark: {
      a: [0.37, 0.36, 0.90], // Indigo
      b: [0.35, 0.84, 0.45], // Mint
      c: [0.75, 0.35, 0.95], // Violett
      intensity: 1.18,
    },
    light: {
      a: [0.55, 0.58, 0.98],
      b: [0.55, 0.86, 0.70],
      c: [0.80, 0.62, 0.98],
      intensity: 1.05,
    },
  };

  let gl = null;
  let canvas = null;
  let program = null;
  let rafId = null;
  let startTime = 0;
  let running = false;
  let reducedMotion = false;
  let visible = true;
  let scheme = 'dark';
  let uniforms = {};
  let container = null;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('[AuroraWebGL] Shader-Fehler:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function build() {
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[AuroraWebGL] Link-Fehler:', gl.getProgramInfoLog(program));
      return false;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uniforms = {
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uTime: gl.getUniformLocation(program, 'uTime'),
      uColorA: gl.getUniformLocation(program, 'uColorA'),
      uColorB: gl.getUniformLocation(program, 'uColorB'),
      uColorC: gl.getUniformLocation(program, 'uColorC'),
      uIntensity: gl.getUniformLocation(program, 'uIntensity'),
      uIsLight: gl.getUniformLocation(program, 'uIsLight'),
    };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }

  function resize() {
    if (!canvas) return;
    // DPR auf 1.5 deckeln – mehr bringt optisch nichts, kostet aber Füllrate.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function applyPalette() {
    const pal = PALETTES[scheme] || PALETTES.dark;
    gl.uniform3fv(uniforms.uColorA, pal.a);
    gl.uniform3fv(uniforms.uColorB, pal.b);
    gl.uniform3fv(uniforms.uColorC, pal.c);
    gl.uniform1f(uniforms.uIntensity, pal.intensity);
    gl.uniform1f(uniforms.uIsLight, scheme === 'light' ? 1.0 : 0.0);
  }

  function drawFrame(timeSec) {
    resize();
    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.uTime, timeSec);
    applyPalette();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now) {
    if (!running) return;
    if (!visible) { rafId = null; return; } // Pausiert; wird durch resume() neu gestartet.
    const t = (now - startTime) / 1000;
    drawFrame(t);
    rafId = requestAnimationFrame(loop);
  }

  function resume() {
    if (!running || reducedMotion) return;
    if (rafId == null && visible) {
      startTime = startTime || performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  function detectScheme() {
    const ds = document.documentElement.dataset.colorScheme;
    if (ds === 'light' || ds === 'dark') return ds;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  const Aurora = {
    start() {
      if (running) return true;
      container = document.getElementById('aurora-container');
      if (!container) return false;

      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      canvas = document.createElement('canvas');
      canvas.className = 'aurora-webgl-canvas';
      canvas.setAttribute('aria-hidden', 'true');

      const opts = { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false };
      gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
      if (!gl) { console.info('[AuroraWebGL] WebGL nicht verfügbar – CSS-Fallback aktiv.'); return false; }

      if (!build()) { gl = null; return false; }

      container.appendChild(canvas);
      container.classList.add('webgl-active');
      scheme = detectScheme();
      running = true;
      startTime = performance.now();

      if (reducedMotion) {
        // Ein einziges, ruhiges Standbild.
        drawFrame(12.0);
      } else {
        rafId = requestAnimationFrame(loop);
      }

      // Sichtbarkeits- & Resize-Hooks.
      document.addEventListener('visibilitychange', () => {
        visible = !document.hidden;
        if (visible) resume();
        else if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      });
      window.addEventListener('resize', () => { if (reducedMotion && running) drawFrame((performance.now() - startTime) / 1000); }, { passive: true });
      return true;
    },

    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      if (container) container.classList.remove('webgl-active');
      canvas = null;
      gl = null;
    },

    /* Externe Pause-Steuerung (z. B. vom IntersectionObserver der App). */
    setVisible(v) {
      visible = !!v;
      if (visible) resume();
      else if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    },

    setScheme(next) {
      scheme = (next === 'light' || next === 'dark') ? next : detectScheme();
      if (running && reducedMotion) drawFrame((performance.now() - startTime) / 1000);
    },

    isActive() { return running; },
  };

  window.AuroraWebGL = Aurora;
})();
