/*
 * RetroEngine: tiny shared engine for Yavin Digital retro demo games.
 * Plain JS, no dependencies. Identical copy lives in each game folder.
 * Provides: palette, sprite painter, pixel font, input (keyboard, touch, gamepad),
 * WebAudio chiptune synth + sequencer, fixed-timestep loop, pause/visibility,
 * HTML chrome (pause menu, sound toggle), score hook.
 */
(function () {
  'use strict';
  const E = {};
  window.RetroEngine = E;
  E.W = 320; E.H = 180;
  E.params = new URLSearchParams(location.search);
  const mqReduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  E.reducedMotion = !!(mqReduce && mqReduce.matches);
  if (mqReduce && mqReduce.addEventListener) mqReduce.addEventListener('change', e => { E.reducedMotion = e.matches; });

  // ---------------------------------------------------------------- palette
  // NES-like fixed palette. Games should only use these values.
  E.P = {
    black: '#000000', dgray: '#3C3C3C', gray: '#747474', lgray: '#BCBCBC', white: '#FCFCFC',
    navy: '#24188C', blue: '#0000A8', indigo: '#44009C', plum: '#8C0074', crimson: '#A80010',
    rust: '#7C0800', dbrown: '#402C00', dgreen: '#004400', green: '#005000', pine: '#003C14', slate: '#183C5C',
    azure: '#0070EC', royal: '#2038EC', violet: '#8000F0', magenta: '#BC00BC', rose: '#E40058',
    scarlet: '#D82800', orange: '#C84C0C', olive: '#887000', grass: '#009400', leaf: '#00A800',
    jade: '#009038', teal: '#008088', sky: '#3CBCFC', cornflower: '#5C94FC', lilac: '#CC88FC',
    pink: '#F478FC', hotpink: '#FC74B4', salmon: '#FC7460', tangerine: '#FC9838', gold: '#F0BC3C',
    lime: '#80D010', lgreen: '#4CDC48', mint: '#58F898', aqua: '#00E8D8', ice: '#A8E4FC',
    periwinkle: '#C4D4FC', lavender: '#D4C8FC', blush: '#FCC4D8', peach: '#FCBCB0', skin: '#FCD8A8',
    cream: '#FCE4A0', pale: '#E0FCA0'
  };

  // ---------------------------------------------------------------- storage
  E.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  // ---------------------------------------------------------------- canvas helpers
  E.makeCanvas = function (w, h) {
    const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h);
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return c;
  };
  function flipCanvas(src) {
    const c = E.makeCanvas(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c;
  }
  function tintCanvas(src, col) {
    const c = E.makeCanvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c;
  }
  E.tintCanvas = tintCanvas;
  E.rotate90 = function (src, cw) { // cw=true clockwise
    const c = E.makeCanvas(src.height, src.width), g = c.getContext('2d');
    if (cw) { g.translate(src.height, 0); g.rotate(Math.PI / 2); } else { g.translate(0, src.width); g.rotate(-Math.PI / 2); }
    g.drawImage(src, 0, 0);
    if (src.hd) c.hd = E.rotate90(src.hd, cw);
    return c;
  };
  // pixel readback through one scratch canvas flagged willReadFrequently, so sprite canvases that are read
  // several times while building (outline, hi-res, bounding boxes) stay GPU-friendly and Chrome stays quiet
  let rbC = null, rbG = null;
  E.pixels = function (c, w, h) {
    w = w || c.width; h = h || c.height;
    if (!rbC) { rbC = document.createElement('canvas'); rbG = rbC.getContext('2d', { willReadFrequently: true }); }
    if (rbC.width < w || rbC.height < h) { rbC.width = Math.max(rbC.width, w); rbC.height = Math.max(rbC.height, h); }
    rbG.clearRect(0, 0, w, h); rbG.drawImage(c, 0, 0); return rbG.getImageData(0, 0, w, h);
  };
  function outline(c, col) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const d = E.pixels(c, w, h), a = d.data, out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (a[(y * w + x) * 4 + 3] > 0) continue;
      if ((x > 0 && a[(y * w + x - 1) * 4 + 3] > 0) || (x < w - 1 && a[(y * w + x + 1) * 4 + 3] > 0) ||
        (y > 0 && a[((y - 1) * w + x) * 4 + 3] > 0) || (y < h - 1 && a[((y + 1) * w + x) * 4 + 3] > 0)) out[y * w + x] = 1;
    }
    const r = parseInt(col.slice(1, 3), 16), gg = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
    for (let i = 0; i < w * h; i++) if (out[i]) { a[i * 4] = r; a[i * 4 + 1] = gg; a[i * 4 + 2] = b; a[i * 4 + 3] = 255; }
    g.putImageData(d, 0, 0);
  }
  E.outline = outline;

  // Painter: pixel primitives for drawing sprites in code.
  function painter(g) {
    const p = {
      g,
      r(x, y, w, h, c) { if (!c) return; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
      px(x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
      line(x0, y0, x1, y1, w, c) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        g.fillStyle = c; const o = Math.floor(w / 2);
        let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
        for (let n = 0; n < 400; n++) {
          g.fillRect(x0 - o, y0 - o, w, w);
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; }
        }
      },
      ell(cx, cy, rx, ry, c) {
        g.fillStyle = c;
        for (let y = -ry; y <= ry; y++) { const xx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001)))); g.fillRect(Math.round(cx - xx), Math.round(cy + y), xx * 2 + 1, 1); }
      },
      rows(rows, map, ox, oy) {
        for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
          const c = map[rows[y][x]]; if (c) { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); }
        }
      },
      text(s, x, y, c, scale) { E.text(g, s, x, y, c, scale || 1); }
    };
    return p;
  }
  E.painter = painter;

  // ---------------------------------------------------------------- hi-res sprite pipeline
  // Every sprite is painted at game resolution (320x180 units, kept for hit boxes and layout), then rebuilt at
  // E.RES x for display: the old 1px black ring is stripped, the art is smoothed with Scale2x (rounded diagonals
  // instead of stair steps), lit from the top left with hue-shifted ramps (warm highlights, cool violet shadows,
  // a soft rim on every material edge), and given a 1px selective outline (a dark shade of the colour it borders)
  // with anti-aliased corners. sprite.src stays the 1x canvas for anything that reads pixels.
  E.RES = Math.max(1, Math.min(2, parseInt(E.params ? E.params.get('res') : '', 10) || 2));
  E.VRES = E.RES; // canvas backing scale; adaptive quality can drop it to 1 at runtime (art stays E.RES, drawn downscaled)
  const LX = -0.55, LY = -0.83;
  function u32(r, g, b, a) { return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0; }
  function shadeCol(c, lvl, k) {
    let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255; const a = c >>> 24;
    if (lvl > 0) { const t = k * lvl; r += (255 - r) * t; g += (246 - g) * t * 0.95; b += (214 - b) * t * 0.8; }
    else if (lvl < 0) { const t = -k * lvl; r = r * (1 - t * 0.62) + 26 * t; g = g * (1 - t * 0.66) + 12 * t; b = b * (1 - t * 0.45) + 52 * t; }
    return u32(Math.round(Math.min(255, r)), Math.round(Math.min(255, g)), Math.round(Math.min(255, b)), a);
  }
  function scale2x(px, w, h) {
    const W2 = w * 2, o = new Uint32Array(W2 * h * 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const P = px[y * w + x], A = y > 0 ? px[(y - 1) * w + x] : P, B = x < w - 1 ? px[y * w + x + 1] : P, C = x > 0 ? px[y * w + x - 1] : P, D = y < h - 1 ? px[(y + 1) * w + x] : P;
      let e0 = P, e1 = P, e2 = P, e3 = P;
      if (C === A && C !== D && A !== B) e0 = A;
      if (A === B && A !== C && B !== D) e1 = B;
      if (D === C && D !== B && C !== A) e2 = C;
      if (B === D && B !== A && D !== C) e3 = D;
      const i = y * 2 * W2 + x * 2; o[i] = e0; o[i + 1] = e1; o[i + W2] = e2; o[i + W2 + 1] = e3;
    }
    return o;
  }
  function chamfer(d, w, h, cap) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!d[i]) continue; let v = d[i]; if (x > 0) v = Math.min(v, d[i - 1] + 1); if (y > 0) v = Math.min(v, d[i - w] + 1); d[i] = Math.min(v, cap); }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!d[i]) continue; let v = d[i]; if (x < w - 1) v = Math.min(v, d[i + 1] + 1); if (y < h - 1) v = Math.min(v, d[i + w] + 1); d[i] = Math.min(v, cap); }
  }
  function selout(q, W2, H2) {
    const n = W2 * H2;
      const ol = new Uint32Array(n);
      for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
        const i = y * W2 + x; if (q[i]) continue;
        const nb = [x < W2 - 1 ? q[i + 1] : 0, y < H2 - 1 ? q[i + W2] : 0, x > 0 ? q[i - 1] : 0, y > 0 ? q[i - W2] : 0];
        let k = -1; for (let j = 0; j < 4; j++) if (nb[j]) { k = j; break; }
        if (k < 0) continue;
        const c = nb[k], lit = k >= 2; // neighbour to the right/below means this pixel is on the lit (top-left) side
        const t = lit ? 0.7 : 0.86, r = (c & 255) * (1 - t) + 18 * t, g = ((c >>> 8) & 255) * (1 - t) + 10 * t, b = ((c >>> 16) & 255) * (1 - t) + 30 * t;
        ol[i] = u32(Math.round(r), Math.round(g), Math.round(b), 255);
      }
      const aa = new Uint32Array(n);
      for (let y = 1; y < H2 - 1; y++) for (let x = 1; x < W2 - 1; x++) { // soften outline stair corners (no cascade)
        const i = y * W2 + x; if (q[i] || ol[i]) continue;
        const a = ol[i - 1] || ol[i + 1], b = ol[i - W2] || ol[i + W2];
        if (a && b) aa[i] = ((a & 0xFFFFFF) | (110 << 24)) >>> 0;
      }
      for (let i = 0; i < n; i++) if (aa[i]) ol[i] = aa[i];
      for (let i = 0; i < n; i++) if (!q[i] && ol[i]) q[i] = ol[i];
      }
  E.selout = selout;
  // o: { strip: remove the 1x black ring (default true), light: 0..1 (default 1), outline: false to skip,
  //      solid: true for opaque art such as backgrounds (no silhouette outline, softer rims) }
  E.hires = function (src, o) {
    o = o || {}; const w = src.width, h = src.height, R = E.RES;
    if (R === 1) return src;
    const sd = new Uint32Array(E.pixels(src, w, h).data.buffer);
    const px = new Uint32Array(w * h);
    for (let i = 0; i < w * h; i++) px[i] = (sd[i] >>> 24) < 128 ? 0 : (sd[i] | 0xFF000000) >>> 0;
    if (o.strip !== false && !o.solid) {
      const kill = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, c = px[i]; if (!c || (c & 0xFFFFFF) > 0x181818 && ((c & 255) > 24 || ((c >>> 8) & 255) > 24 || ((c >>> 16) & 255) > 24)) continue;
        if ((x > 0 && !px[i - 1]) || (x < w - 1 && !px[i + 1]) || (y > 0 && !px[i - w]) || (y < h - 1 && !px[i + w]) || x === 0 || y === 0 || x === w - 1 || y === h - 1) kill.push(i);
      }
      for (const i of kill) px[i] = 0;
    }
    const W2 = w * 2, H2 = h * 2, n = W2 * H2, q = scale2x(px, w, h);
    const light = o.light === undefined ? 1 : o.light;
    if (light > 0) {
      const KA = o.solid ? 1 : 7, KR = 3;
      const dA = new Uint8Array(n), dR = new Uint8Array(n);
      for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
        const i = y * W2 + x, c = q[i]; if (!c) continue;
        const l = x > 0 ? q[i - 1] : 0, r = x < W2 - 1 ? q[i + 1] : 0, u = y > 0 ? q[i - W2] : 0, dd = y < H2 - 1 ? q[i + W2] : 0;
        dA[i] = (!l || !r || !u || !dd) ? 1 : 99; dR[i] = (l !== c || r !== c || u !== c || dd !== c) ? 1 : 99;
      }
      if (!o.solid) chamfer(dA, W2, H2, KA); chamfer(dR, W2, H2, KR);
      const out = new Uint32Array(n);
      for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
        const i = y * W2 + x, c = q[i]; if (!c) continue;
        const lum = (c & 255) * 0.3 + ((c >>> 8) & 255) * 0.59 + ((c >>> 16) & 255) * 0.11;
        if (lum < 34) { out[i] = c; continue; } // pupils, dark seams: keep crisp
        let sh = 0;
        if (!o.solid && dA[i] < KA) { // silhouette rim
          const g = (j, ok) => ok && q[j] ? dA[j] : 0;
          const gx = g(i + 1, x < W2 - 1) - g(i - 1, x > 0), gy = g(i + W2, y < H2 - 1) - g(i - W2, y > 0), m = Math.hypot(gx, gy);
          if (m) sh += 0.95 * (-(gx * LX + gy * LY) / m) * (KA - dA[i]) / (KA - 1);
        }
        if (dR[i] < KR) { // material edge: same-colour neighbours only
          const g = (j, ok) => ok && q[j] === c ? dR[j] : 0;
          const gx = g(i + 1, x < W2 - 1) - g(i - 1, x > 0), gy = g(i + W2, y < H2 - 1) - g(i - W2, y > 0), m = Math.hypot(gx, gy);
          if (m) sh += (o.solid ? 0.55 : 0.5) * (-(gx * LX + gy * LY) / m) * (KR - dR[i]) / (KR - 1);
        }
        if (!o.solid) sh += 0.16 - 0.36 * (y / H2); // top of the figure catches more light
        sh *= light;
        const lvl = sh > 0.62 ? 2 : sh > 0.2 ? 1 : sh < -0.62 ? -2 : sh < -0.2 ? -1 : 0;
        out[i] = lvl ? shadeCol(c, lvl, lvl > 0 ? 0.2 : 0.3) : c;
      }
      q.set(out);
    }
    if (!o.solid && o.outline !== false) selout(q, W2, H2);
    const c2 = E.makeCanvas(W2, H2), g2 = c2.getContext('2d'), id = g2.createImageData(W2, H2);
    new Uint32Array(id.data.buffer).set(q); g2.putImageData(id, 0, 0);
    return c2;
  };
  E.finish = function (c, ax, ay, o) {
    const s = { src: c, img: c.hd && E.RES > 1 ? E.postHD(c.hd) : E.hires(c, o), w: c.width, h: c.height, ax: ax === undefined ? c.width >> 1 : ax, ay: ay === undefined ? c.height - 1 : ay, _f: null };
    Object.defineProperty(s, 'flip', { get() { return this._f || (this._f = flipCanvas(this.img)); } });
    return s;
  };
  // Create a sprite by drawing with a painter. opts: {ax, ay, outline:false|color}
  E.sprite = function (w, h, fn, opts) {
    opts = opts || {};
    const c = E.makeCanvas(w, h); fn(painter(c.getContext('2d')), c.getContext('2d'));
    if (opts.outline !== false) outline(c, opts.outline || '#000000');
    return E.finish(c, opts.ax, opts.ay, { outline: opts.outline !== false, light: opts.light });
  };
  E.fromStrings = function (rows, map, opts) {
    opts = opts || {};
    const w = Math.max.apply(null, rows.map(r => r.length)) + 2, h = rows.length + 2;
    return E.sprite(w, h, p => p.rows(rows, map, 1, 1), opts);
  };
  // Draw a sprite with anchor at (x,y). flip mirrors horizontally, white draws a flash silhouette.
  E.draw = function (ctx, s, x, y, flip, white) {
    if (!s) return;
    let img;
    if (white) { if (!s._w) { s._w = tintCanvas(s.img, '#FCFCFC'); s._wf = flipCanvas(s._w); } img = flip ? s._wf : s._w; }
    else img = flip ? s.flip : s.img;
    const dx = flip ? Math.round(x - (s.w - 1 - s.ax)) : Math.round(x - s.ax);
    ctx.drawImage(img, dx, Math.round(y - s.ay), s.w, s.h);
  };

  // ---------------------------------------------------------------- pixel font 5x7
  const FONT = {
    'A': '.###. #...# #...# ##### #...# #...# #...#', 'B': '####. #...# #...# ####. #...# #...# ####.',
    'C': '.###. #...# #.... #.... #.... #...# .###.', 'D': '####. #...# #...# #...# #...# #...# ####.',
    'E': '##### #.... #.... ####. #.... #.... #####', 'F': '##### #.... #.... ####. #.... #.... #....',
    'G': '.###. #...# #.... #.### #...# #...# .####', 'H': '#...# #...# #...# ##### #...# #...# #...#',
    'I': '.###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.', 'J': '..### ...#. ...#. ...#. ...#. #..#. .##..',
    'K': '#...# #..#. #.#.. ##... #.#.. #..#. #...#', 'L': '#.... #.... #.... #.... #.... #.... #####',
    'M': '#...# ##.## #.#.# #.#.# #...# #...# #...#', 'N': '#...# #...# ##..# #.#.# #..## #...# #...#',
    'O': '.###. #...# #...# #...# #...# #...# .###.', 'P': '####. #...# #...# ####. #.... #.... #....',
    'Q': '.###. #...# #...# #...# #.#.# #..#. .##.#', 'R': '####. #...# #...# ####. #.#.. #..#. #...#',
    'S': '.#### #.... #.... .###. ....# ....# ####.', 'T': '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..',
    'U': '#...# #...# #...# #...# #...# #...# .###.', 'V': '#...# #...# #...# #...# #...# .#.#. ..#..',
    'W': '#...# #...# #...# #.#.# #.#.# #.#.# .#.#.', 'X': '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
    'Y': '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..', 'Z': '##### ....# ...#. ..#.. .#... #.... #####',
    '0': '.###. #...# #..## #.#.# ##..# #...# .###.', '1': '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.',
    '2': '.###. #...# ....# ...#. ..#.. .#... #####', '3': '####. ....# ....# .###. ....# ....# ####.',
    '4': '...#. ..##. .#.#. #..#. ##### ...#. ...#.', '5': '##### #.... ####. ....# ....# #...# .###.',
    '6': '..##. .#... #.... ####. #...# #...# .###.', '7': '##### ....# ...#. ..#.. .#... .#... .#...',
    '8': '.###. #...# #...# .###. #...# #...# .###.', '9': '.###. #...# #...# .#### ....# ...#. .##..',
    '.': '..... ..... ..... ..... ..... .##.. .##..', ',': '..... ..... ..... ..... .##.. ..#.. .#...',
    '!': '..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..', '?': '.###. #...# ....# ...#. ..#.. ..... ..#..',
    ':': '..... .##.. .##.. ..... .##.. .##.. .....', '-': '..... ..... ..... .###. ..... ..... .....',
    "'": '..#.. ..#.. .#... ..... ..... ..... .....', '"': '.#.#. .#.#. ..... ..... ..... ..... .....',
    '/': '....# ...#. ...#. ..#.. .#... .#... #....', '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....',
    '(': '...#. ..#.. .#... .#... .#... ..#.. ...#.', ')': '.#... ..#.. ...#. ...#. ...#. ..#.. .#...',
    '>': '.#... ..#.. ...#. ....# ...#. ..#.. .#...', '<': '...#. ..#.. .#... #.... .#... ..#.. ...#.',
    '=': '..... ..... ##### ..... ##### ..... .....', '%': '##..# ##..# ...#. ..#.. .#... #..## #..##',
    '*': '..... #...# .#.#. ..#.. .#.#. #...# .....', '#': '.#.#. ##### .#.#. .#.#. ##### .#.#. .....',
    '&': '.##.. #..#. #.#.. .#... #.#.# #..#. .##.#', '_': '..... ..... ..... ..... ..... ..... #####',
    '^': '..#.. .#.#. #...# ..... ..... ..... .....', ' ': '..... ..... ..... ..... ..... ..... .....'
  };
  const GLYPHS = Object.keys(FONT);
  const GIDX = {}; GLYPHS.forEach((k, i) => { GIDX[k] = i; });
  const atlases = {};
  function atlas(col) {
    if (atlases[col]) return atlases[col];
    const c = E.makeCanvas(GLYPHS.length * 6, 7), g = c.getContext('2d'); g.fillStyle = col;
    GLYPHS.forEach((k, i) => { const rows = FONT[k].split(' '); for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (rows[y][x] === '#') g.fillRect(i * 6 + x, y, 1, 1); });
    if (E.RES === 1) { atlases[col] = c; return c; }
    // Scale2x rounds the glyphs; a vertical ramp (bright top, deeper bottom) gives the arcade-cabinet type look
    const c2 = E.hires(c, { strip: false, light: 0, outline: false }), g2 = c2.getContext('2d');
    g2.globalCompositeOperation = 'source-atop';
    g2.fillStyle = 'rgba(255,255,240,0.32)'; g2.fillRect(0, 0, c2.width, 4);
    g2.fillStyle = 'rgba(255,255,240,0.12)'; g2.fillRect(0, 4, c2.width, 2);
    g2.fillStyle = 'rgba(20,0,50,0.22)'; g2.fillRect(0, 10, c2.width, 4);
    atlases[col] = c2; return c2;
  }
  E.textWidth = (s, scale) => (String(s).length * 6 - 1) * (scale || 1);
  // align: 'left' | 'center' | 'right'. opts.shadow: color drawn 1px down-right. opts.outline: color around.
  E.text = function (ctx, s, x, y, col, scale, align, opts) {
    s = String(s).toUpperCase(); scale = scale || 1;
    let w = E.textWidth(s, scale);
    if (align === 'center') x = Math.round(x - w / 2); else if (align === 'right') x = Math.round(x - w);
    if (opts && opts.outline) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) E.text(ctx, s, x + dx * scale, y + dy * scale, opts.outline, scale); }
    if (opts && opts.shadow) E.text(ctx, s, x + scale, y + scale, opts.shadow, scale);
    const a = atlas(col);
    for (let i = 0; i < s.length; i++) {
      let gi = GIDX[s[i]]; if (gi === undefined) gi = GIDX['?'];
      if (s[i] !== ' ') ctx.drawImage(a, gi * 6 * E.RES, 0, 5 * E.RES, 7 * E.RES, x + i * 6 * scale, y, 5 * scale, 7 * scale);
    }
    return w;
  };
  // word-wrap helper (returns array of lines), maxChars per line
  E.wrapText = function (s, maxChars) {
    const words = String(s).split(' '), out = []; let line = '';
    for (const w of words) { if ((line + ' ' + w).trim().length > maxChars) { out.push(line.trim()); line = w; } else line += ' ' + w; }
    if (line.trim()) out.push(line.trim()); return out;
  };

  // ---------------------------------------------------------------- effects
  let shakeAmt = 0, shakeT = 0, flashT = 0;
  E.shake = function (amt, frames) { if (E.reducedMotion) return; shakeAmt = Math.max(shakeAmt, amt); shakeT = Math.max(shakeT, frames || 10); };
  E.flash = function (frames) { if (E.reducedMotion) return; flashT = Math.max(flashT, frames || 3); };
  E.fxTick = function () { if (shakeT > 0) { shakeT--; if (!shakeT) shakeAmt = 0; } if (flashT > 0) flashT--; };
  E.shakeOffset = function () { if (!shakeT) return [0, 0]; return [Math.round((Math.random() * 2 - 1) * shakeAmt), Math.round((Math.random() * 2 - 1) * shakeAmt)]; };
  E.flashOn = () => flashT > 0;
  // blink helper honoring reduced motion: returns true when sprite should be visible
  E.blink = function (t, rate) { if (E.reducedMotion) return true; return Math.floor(t / (rate || 3)) % 2 === 0; };

  // ---------------------------------------------------------------- input
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    KeyJ: 'a', KeyZ: 'a', KeyK: 'b', KeyX: 'b', Space: 'b', KeyL: 'c', KeyC: 'c', Enter: 'start', NumpadEnter: 'start'
  };
  const ACTS = ['left', 'right', 'up', 'down', 'a', 'b', 'c', 'start'];
  const I = E.input = { held: {}, pressed: {}, kb: {}, touch: {}, pad: {}, latch: {}, prev: {}, taps: [], tap: null, pointer: { down: false, x: 0, y: 0 }, lastSource: 'keyboard',
    // raw keyboard state for games with several keyboard players: keys[code] = held, keyHit[code] = pressed since the game last cleared it
    keys: {}, keyHit: {}, extraKeys: new Set(),
    // touch-only edge detection (tpressed) so a game can give the touch controls to one player
    tpressed: {}, tprev: {}, tlatch: {},
    // touch dash: a double flick on the stick (see setDir). tdash = -1/1 on the frame it fires, else 0
    tdash: 0, tdashLatch: 0, stickFlicks: 0 };
  ACTS.forEach(a => { I.held[a] = I.pressed[a] = I.kb[a] = I.touch[a] = I.pad[a] = I.latch[a] = I.prev[a] = I.tpressed[a] = I.tprev[a] = I.tlatch[a] = false; });
  I.any = () => ACTS.some(a => I.pressed[a]);
  I.confirm = () => I.pressed.start || I.pressed.a || I.pressed.b;
  I.update = function () {
    pollPad();
    for (const a of ACTS) {
      const h = I.kb[a] || I.touch[a] || I.pad[a];
      I.pressed[a] = (h && !I.prev[a]) || I.latch[a];
      I.held[a] = h || I.latch[a]; I.prev[a] = h; I.latch[a] = false;
      I.tpressed[a] = (I.touch[a] && !I.tprev[a]) || I.tlatch[a]; I.tprev[a] = I.touch[a]; I.tlatch[a] = false;
    }
    I.tap = I.taps.length ? I.taps.shift() : null;
    I.tdash = I.tdashLatch; I.tdashLatch = 0;
  };
  I.clear = function () { ACTS.forEach(a => { I.kb[a] = I.touch[a] = I.latch[a] = false; }); I.taps.length = 0; I.keys = {}; I.keyHit = {}; I.tdashLatch = 0; };
  I.setTouch = function (a, v) { if (v && !I.touch[a]) { I.latch[a] = true; I.tlatch[a] = true; } I.touch[a] = v; I.lastSource = 'touch'; };
  let padPrevStart = false;
  function pollPad() {
    for (const a of ACTS) I.pad[a] = false;
    if (!navigator.getGamepads) return;
    let pads; try { pads = navigator.getGamepads(); } catch (e) { return; }
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const b = i => !!(p.buttons[i] && p.buttons[i].pressed), ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      I.pad.left = I.pad.left || ax < -0.45 || b(14); I.pad.right = I.pad.right || ax > 0.45 || b(15);
      I.pad.up = I.pad.up || ay < -0.45 || b(12); I.pad.down = I.pad.down || ay > 0.45 || b(13);
      I.pad.b = I.pad.b || b(0); I.pad.a = I.pad.a || b(2) || b(3); I.pad.c = I.pad.c || b(1) || b(5);
      I.pad.start = I.pad.start || b(9);
      if (b(9) && !padPrevStart && E.onPadStart) E.onPadStart();
      padPrevStart = b(9);
      if (ACTS.some(a => I.pad[a])) I.lastSource = 'gamepad';
    }
  }

  function canvasPoint(e) {
    const r = E.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * E.W, y: (e.clientY - r.top) / r.height * E.H };
  }

  function setupInput() {
    window.addEventListener('keydown', e => {
      if (E.menuOpen) return; // HTML pause menu handles its own keys
      if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); E.togglePause(); return; }
      if (e.code === 'KeyM') { E.audio.setOn(!E.audio.on); return; }
      if (!(e.target && e.target.tagName === 'BUTTON' && (e.code === 'Enter' || e.code === 'Space'))) {
        if (!e.repeat) I.keyHit[e.code] = true;
        I.keys[e.code] = true;
        if (I.extraKeys.has(e.code)) e.preventDefault();
      }
      const a = KEYMAP[e.code];
      if (a) {
        if (e.target && e.target.tagName === 'BUTTON' && (e.code === 'Enter' || e.code === 'Space')) return; // let buttons click
        e.preventDefault(); if (!e.repeat) { I.kb[a] = true; I.latch[a] = true; } I.lastSource = 'keyboard';
      }
    });
    window.addEventListener('keyup', e => { I.keys[e.code] = false; const a = KEYMAP[e.code]; if (a) I.kb[a] = false; });
    window.addEventListener('blur', () => I.clear());
    window.addEventListener('touchstart', () => { document.body.classList.add('touch'); E.isTouch = true; E.fit(); }, { passive: true });

    // canvas / game area pointer (taps for menus and tap-to-move)
    const wrap = E.wrap;
    wrap.addEventListener('pointerdown', e => {
      if (e.target.closest('.ctrl, .hbtn, .overlay-menu')) return;
      const pt = canvasPoint(e); I.taps.push(pt); if (I.taps.length > 4) I.taps.shift();
      I.pointer.down = true; I.pointer.id = e.pointerId; I.pointer.x = pt.x; I.pointer.y = pt.y;
      if (e.pointerType === 'touch') I.lastSource = 'touch';
    });
    wrap.addEventListener('pointermove', e => { if (I.pointer.down && e.pointerId === I.pointer.id) { const pt = canvasPoint(e); I.pointer.x = pt.x; I.pointer.y = pt.y; } });
    const up = e => { if (e.pointerId === I.pointer.id) I.pointer.down = false; };
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    wrap.addEventListener('contextmenu', e => e.preventDefault());

    // virtual stick
    const stick = document.getElementById('stick'), knob = document.getElementById('stick-knob');
    if (stick) {
      let sid = null;
      // Direction keys with hysteresis: a direction turns on past 0.45 and only turns off below 0.30,
      // so a thumb resting near a threshold does not flicker (each flicker used to be a fresh 'press').
      const ON = 0.45, OFF = 0.30, DEAD = 0.28;
      const dirOn = { left: false, right: false, up: false, down: false };
      const hyst = (k, v) => { dirOn[k] = dirOn[k] ? v > OFF : v > ON; I.setTouch(k, dirOn[k]); };
      // Touch dash = double flick: neutral -> hard sideways -> neutral within FLICK_MS, then hard sideways
      // the same way again within GAP_MS. Steering, wobble, lane changes and diagonals never qualify.
      const FLICK_MS = 180, GAP_MS = 250;
      const fl = { out: false, t0: 0, dir: 0, bad: false, lastDir: 0, lastT: -1e9, fired: false };
      const flick = (dx, dy, m) => {
        const now = performance.now();
        if (m < DEAD) {
          if (fl.out) {
            if (fl.dir && !fl.bad && now - fl.t0 <= FLICK_MS) { fl.lastDir = fl.dir; fl.lastT = now; I.stickFlicks++; }
            else { fl.lastDir = 0; }
          }
          fl.out = false; fl.dir = 0; fl.bad = false; fl.fired = false; return;
        }
        if (!fl.out) { fl.out = true; fl.t0 = now; fl.dir = 0; fl.bad = false; fl.fired = false; }
        if (Math.abs(dy) > Math.abs(dx)) fl.bad = true; // mostly vertical: never a dash
        if (!fl.bad && Math.abs(dx) > 0.8 && m > 0.6) {
          const d = dx < 0 ? -1 : 1;
          if (fl.dir && fl.dir !== d) fl.bad = true; else fl.dir = d;
          if (!fl.fired && !fl.bad && fl.lastDir === d && now - fl.lastT <= GAP_MS) { I.tdashLatch = d; fl.fired = true; fl.lastDir = 0; }
        }
      };
      const setDir = (dx, dy) => {
        const m = Math.hypot(dx, dy); let nx = 0, ny = 0;
        if (m > DEAD) { nx = dx / m; ny = dy / m; }
        hyst('left', -nx); hyst('right', nx); hyst('up', -ny); hyst('down', ny);
        flick(dx, dy, m);
        I.stick = { x: dx, y: dy };
      };
      const move = e => {
        const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width * 0.36;
        let dx = (e.clientX - cx) / rad, dy = (e.clientY - cy) / rad; const m = Math.hypot(dx, dy);
        if (m > 1) { dx /= m; dy /= m; }
        knob.style.transform = 'translate(' + (dx * rad) + 'px,' + (dy * rad) + 'px)'; setDir(dx, dy);
      };
      stick.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); sid = e.pointerId; try { stick.setPointerCapture(sid); } catch (er) { /* ignore */ } move(e); });
      stick.addEventListener('pointermove', e => { if (e.pointerId === sid) move(e); });
      const end = e => { if (e.pointerId !== sid) return; sid = null; knob.style.transform = ''; setDir(0, 0); };
      stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end); stick.addEventListener('lostpointercapture', end);
    }
    // action buttons (multi-touch: each button tracks its own pointers)
    document.querySelectorAll('.tbtn').forEach(btn => {
      const act = btn.dataset.act, ids = new Set();
      btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ids.add(e.pointerId); try { btn.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } btn.classList.add('on'); I.setTouch(act, true); });
      const end = e => { if (!ids.has(e.pointerId)) return; ids.delete(e.pointerId); if (!ids.size) { btn.classList.remove('on'); I.setTouch(act, false); } };
      btn.addEventListener('pointerup', end); btn.addEventListener('pointercancel', end); btn.addEventListener('lostpointercapture', end);
    });
  }

  // ---------------------------------------------------------------- audio
  const A = E.audio = { on: false, ctx: null, current: null, timer: null, lastFx: {} };
  function noteFreq(n) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); if (!m) return 0;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const midi = (parseInt(m[3], 10) + 1) * 12 + base; return 440 * Math.pow(2, (midi - 69) / 12);
  }
  A.noteFreq = noteFreq;
  A.init = function () {
    if (A.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    const ctx = A.ctx = new AC();
    A.master = ctx.createGain(); A.master.gain.value = 0.55; A.master.connect(ctx.destination);
    A.mus = ctx.createGain(); A.mus.gain.value = 0.42; A.mus.connect(A.master);
    A.sfx = ctx.createGain(); A.sfx.gain.value = 0.7; A.sfx.connect(A.master);
    const pulse = d => { const n = 24, re = new Float32Array(n), im = new Float32Array(n); for (let i = 1; i < n; i++) re[i] = 2 / (i * Math.PI) * Math.sin(i * Math.PI * d); return ctx.createPeriodicWave(re, im); };
    A.waves = { p12: pulse(0.125), p25: pulse(0.25), p50: pulse(0.5) };
    const len = ctx.sampleRate; A.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = A.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  };
  A.tone = function (wave, freq, t, dur, vol, dest, slide) {
    if (!A.ctx || !freq) return;
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    if (wave === 'tri') o.type = 'triangle'; else if (A.waves[wave]) o.setPeriodicWave(A.waves[wave]); else o.type = 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    const a = Math.min(0.006, dur / 4), hold = Math.max(t + a + 0.001, t + dur * 0.55);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, hold); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || A.sfx); o.start(t); o.stop(t + dur + 0.03);
  };
  A.noise = function (t, dur, vol, freq, dest, type) {
    if (!A.ctx) return;
    const ctx = A.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = A.noiseBuf; f.type = type || 'highpass'; f.frequency.value = freq || 1000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || A.sfx); s.start(t, Math.random() * 0.5, dur + 0.05);
  };
  function drum(ch, t, vol) {
    const d = A.mus;
    if (ch === 'k') A.tone('tri', 160, t, 0.12, vol * 1.6, d, 42);
    else if (ch === 's') { A.noise(t, 0.12, vol * 0.9, 1500, d, 'bandpass'); A.tone('tri', 190, t, 0.06, vol * 0.8, d, 120); }
    else if (ch === 'h') A.noise(t, 0.03, vol * 0.45, 7000, d);
    else if (ch === 'o') A.noise(t, 0.12, vol * 0.4, 6000, d);
    else if (ch === 'c') A.noise(t, 0.5, vol * 0.5, 5000, d);
  }
  // Song compile. notes syntax: "A4:2 r:2 C5:4 E5" (len in 16th steps, default 1). Drums: "k.h.s.h." one char per step.
  A.compile = function (def) {
    const chans = def.channels.map(ch => {
      if (ch.wave === 'drum') { const s = ch.notes.replace(/\s+/g, ''); return { wave: 'drum', vol: ch.vol, len: s.length, ev: s.split('').map(c => c === '.' ? null : c) }; }
      const ev = []; let i = 0;
      for (const tok of ch.notes.trim().split(/\s+/)) {
        const [n, l] = tok.split(':'); const len = l ? parseInt(l, 10) : 1;
        if (n !== 'r' && n !== '.') ev[i] = { f: noteFreq(n), len };
        i += len;
      }
      ev.length = i; return { wave: ch.wave, vol: ch.vol, len: i, ev };
    });
    return { bpm: def.bpm, loop: def.loop !== false, chans, len: Math.max.apply(null, chans.map(c => c.len)), name: def.name };
  };
  // Compose helper: chords drive bass + arpeggio; lead is hand-written.
  const CH = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], sus: [0, 5, 7], dim: [0, 3, 6], maj7: [0, 4, 7, 11] };
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function nn(semi, oct) { return NAMES[((semi % 12) + 12) % 12] + (oct + Math.floor(semi / 12)); }
  A.compose = function (o) {
    const bars = o.chords.length, steps = bars * 16;
    let bass = [], arp = [];
    o.chords.forEach(sym => {
      const m = /^([A-G]#?)(.*)$/.exec(sym), root = NAMES.indexOf(m[1]), iv = CH[m[2]] || CH[''];
      const bo = o.bassOct || 2;
      const style = o.bass || 'octave';
      for (let s = 0; s < 16; s += 2) {
        let semi = root;
        if (style === 'octave') semi = root + (s % 4 === 2 ? 12 : 0);
        else if (style === 'walk') semi = root + [0, 0, iv[1], iv[2], 12, iv[2], iv[1], 0][s / 2];
        else if (style === 'drive') semi = root + (s === 6 || s === 14 ? 12 : 0);
        else if (style === 'march') semi = root + (s % 8 === 4 ? iv[2] : 0);
        bass.push(nn(semi, bo) + ':2');
      }
      const ao = o.arpOct || 4;
      for (let s = 0; s < 16; s++) { const k = [0, 1, 2, 1][s % 4]; arp.push(nn(root + iv[k] + (s % 8 >= 4 && o.arpUp ? 12 : 0), ao)); }
    });
    const channels = [
      { wave: o.leadWave || 'p25', vol: o.leadVol || 0.11, notes: o.lead },
      { wave: 'tri', vol: o.bassVol || 0.2, notes: bass.join(' ') }
    ];
    if (o.arp !== false) channels.push({ wave: 'p12', vol: o.arpVol || 0.035, notes: arp.join(' ') });
    if (o.drums) channels.push({ wave: 'drum', vol: o.drumVol || 0.14, notes: o.drums.repeat(Math.ceil(steps / o.drums.replace(/\s+/g, '').length)) });
    if (o.harmony) channels.push({ wave: 'p50', vol: 0.05, notes: o.harmony });
    return A.compile({ bpm: o.bpm, loop: o.loop, channels, name: o.name });
  };
  function sched() {
    const s = A.current; if (!s || !A.ctx || !A.on) return;
    const sd = 60 / s.bpm / 4;
    while (A.nextT < A.ctx.currentTime + 0.15) {
      for (const ch of s.chans) {
        const ev = ch.ev[A.step % ch.len]; if (!ev) continue;
        if (ch.wave === 'drum') drum(ev, A.nextT, ch.vol); else A.tone(ch.wave, ev.f, A.nextT, Math.max(0.05, ev.len * sd * 0.92), ch.vol, A.mus);
      }
      A.nextT += sd; A.step++;
      if (A.step >= s.len) { if (!s.loop) { A.current = null; clearInterval(A.timer); A.timer = null; if (A.onEnd) { const f = A.onEnd; A.onEnd = null; f(); } return; } A.step = 0; }
    }
  }
  A.play = function (song, onEnd) {
    if (A.current === song && A.timer) return;
    A.stop(); A.current = song; A.onEnd = onEnd || null;
    if (!A.on || !A.ctx || !song) return;
    A.step = 0; A.nextT = A.ctx.currentTime + 0.05; A.timer = setInterval(sched, 25); sched();
  };
  A.stop = function () { if (A.timer) clearInterval(A.timer); A.timer = null; A.current = null; };
  A.setOn = function (on) {
    if (on) {
      if (!A.init()) return; A.on = true; if (A.ctx.state === 'suspended') A.ctx.resume();
      const s = A.wanted; A.current = null; if (s) A.play(s);
    } else { A.on = false; const w = A.wanted; A.stop(); A.wanted = w; if (A.ctx) A.ctx.suspend(); }
    const b = document.getElementById('btn-sound');
    if (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? 'Sound is on. Turn sound off' : 'Sound is off. Turn sound on'); }
    E.refreshMenu && E.refreshMenu();
  };
  // music(song) remembers the wanted track so enabling sound later starts it.
  A.music = function (song, onEnd) { A.wanted = song && song.loop ? song : A.wanted; if (song && !song.loop) { A.play(song, onEnd); return; } if (A.current !== song || !A.timer) A.play(song, onEnd); };
  // SFX presets. Each takes no args.
  A.fx = function (name) {
    if (!A.on || !A.ctx) return;
    const t = A.ctx.currentTime, now = performance.now();
    if (A.lastFx[name] && now - A.lastFx[name] < 40) return; A.lastFx[name] = now;
    const T = A.tone, N = A.noise;
    switch (name) {
      case 'punch': N(t, 0.06, 0.35, 900, null, 'lowpass'); T('p50', 180, t, 0.05, 0.12, null, 90); break;
      case 'hit': N(t, 0.09, 0.45, 1200, null, 'bandpass'); T('p25', 300, t, 0.07, 0.12, null, 80); break;
      case 'whiff': N(t, 0.05, 0.12, 3000); break;
      case 'jump': T('p25', 220, t, 0.14, 0.1, null, 620); break;
      case 'land': N(t, 0.05, 0.2, 400, null, 'lowpass'); break;
      case 'shoot': T('p12', 900, t, 0.06, 0.08, null, 300); break;
      case 'rapid': T('p12', 1200, t, 0.04, 0.06, null, 500); break;
      case 'spread': T('p25', 700, t, 0.08, 0.08, null, 200); N(t, 0.04, 0.1, 4000); break;
      case 'laser': T('p50', 1600, t, 0.16, 0.07, null, 400); break;
      case 'bounce': T('p25', 500, t, 0.05, 0.07, null, 900); break;
      case 'ehit': T('p50', 120, t, 0.05, 0.1, null, 60); break;
      case 'eshoot': T('p25', 440, t, 0.07, 0.05, null, 220); break;
      case 'explode': N(t, 0.4, 0.5, 600, null, 'lowpass'); T('tri', 110, t, 0.3, 0.2, null, 30); break;
      case 'bigboom': N(t, 0.9, 0.6, 400, null, 'lowpass'); T('tri', 90, t, 0.8, 0.25, null, 25); break;
      case 'pickup': T('p25', 660, t, 0.07, 0.1); T('p25', 990, t + 0.07, 0.1, 0.1); break;
      case 'power': [523, 659, 784, 1046].forEach((f, i) => T('p25', f, t + i * 0.06, 0.09, 0.1)); break;
      case 'heal': [392, 523, 659].forEach((f, i) => T('p50', f, t + i * 0.07, 0.1, 0.09)); break;
      case 'select': T('p25', 880, t, 0.05, 0.08); break;
      case 'confirm': T('p25', 660, t, 0.06, 0.1); T('p25', 1320, t + 0.06, 0.1, 0.1); break;
      case 'hurt': T('p50', 400, t, 0.18, 0.12, null, 90); break;
      case 'down': N(t, 0.15, 0.4, 300, null, 'lowpass'); break;
      case 'special': T('p25', 200, t, 0.35, 0.12, null, 1400); N(t, 0.3, 0.15, 2000); break;
      case 'cuff': T('p12', 1800, t, 0.04, 0.08); T('p12', 2400, t + 0.05, 0.05, 0.08); break;
      case 'die': [660, 520, 400, 300, 200].forEach((f, i) => T('p50', f, t + i * 0.09, 0.1, 0.1)); break;
      case 'boss': T('p50', 110, t, 0.5, 0.15, null, 55); T('p25', 112, t, 0.5, 0.08, null, 56); break;
      case 'bark': T('p50', 520, t, 0.07, 0.12, null, 300); T('p50', 560, t + 0.1, 0.07, 0.12, null, 320); break;
      case 'pause': T('p25', 990, t, 0.05, 0.08); T('p25', 660, t + 0.06, 0.05, 0.08); break;
      case 'break': N(t, 0.2, 0.4, 1800, null, 'bandpass'); break;
      case 'zap': N(t, 0.15, 0.3, 5000); T('sq', 1500, t, 0.1, 0.05, null, 3000); break;
      case 'smash': N(t, 0.3, 0.55, 700, null, 'lowpass'); T('sq', 90, t, 0.25, 0.18, null, 40); N(t + 0.02, 0.12, 0.25, 2500, null, 'bandpass'); break;
      case 'dash': N(t, 0.12, 0.2, 2200, null, 'bandpass'); T('p25', 300, t, 0.08, 0.06, null, 700); break;
      case 'go': T('p25', 784, t, 0.07, 0.1); T('p25', 1046, t + 0.08, 0.12, 0.1); break;
      case 'lift': T('p50', 260, t, 0.08, 0.1, null, 420); break;
      case 'toss': N(t, 0.08, 0.2, 2600); T('p25', 500, t, 0.06, 0.07, null, 250); break;
      case 'splash': N(t, 0.25, 0.18, 5000, null, 'highpass'); break;
      case 'join': [523, 784, 1046].forEach((f, i) => T('p25', f, t + i * 0.05, 0.07, 0.1)); break;
      case 'oneup': [523, 659, 784, 659, 784, 1046].forEach((f, i) => T('p25', f, t + i * 0.07, 0.08, 0.1)); break;
    }
  };

  // ---------------------------------------------------------------- score hook
  // Integrators: define window.onRetroGameScore = (detail) => {...} before load,
  // or listen for the 'retrogame:score' window event, or postMessage from an iframe parent.
  E.reportScore = function (detail) {
    detail = Object.assign({ game: E.gameId, puzzlePoints: Math.floor((detail.score || 0) / 100) }, detail);
    const hk = 'hi_' + E.gameId; if ((detail.score || 0) > E.store.get(hk, 0)) E.store.set(hk, detail.score || 0);
    try { if (typeof window.onRetroGameScore === 'function') window.onRetroGameScore(detail); } catch (e) { console.warn(e); }
    try { window.dispatchEvent(new CustomEvent('retrogame:score', { detail })); } catch (e) { /* old browsers */ }
    try { if (window.parent && window.parent !== window) window.parent.postMessage(Object.assign({ type: 'retrogame:score' }, detail), window.RETRO_GAME_PARENT_ORIGIN || '*'); } catch (e) { /* cross-origin */ }
    E.lastReport = detail;
  };
  E.hiScore = () => E.store.get('hi_' + E.gameId, 0);
  // 'Back to arcade' target. Host pages set window.RETRO_BACK_URL or <meta name="retro-back-url" content="...">
  // before the game scripts; ?back= is honoured only for relative or same-origin URLs. Default: ../ (the launcher).
  E.backUrl = function () {
    const ok = u => { if (!u) return false; try { const x = new URL(u, location.href); return x.origin === location.origin && /^https?:$/.test(x.protocol); } catch (e) { return false; } };
    const m = document.querySelector('meta[name="retro-back-url"]');
    for (const u of [E.params.get('back'), window.RETRO_BACK_URL, m && m.content]) if (ok(u)) return new URL(u, location.href).href;
    return new URL('../', location.href).href;
  };
  E.wireBackLinks = function () { document.querySelectorAll('[data-back-link]').forEach(a => { a.href = E.backUrl(); a.target = '_top'; }); };

  // ---------------------------------------------------------------- layout
  E.fit = function () {
    if (!E.canvas) return;
    const r = E.wrap.getBoundingClientRect();
    let s = Math.min(r.width / E.W, r.height / E.H);
    if (s >= 1) { const f = Math.floor(s); if (f / s > 0.86) s = f; }
    E.canvas.style.width = Math.floor(E.W * s) + 'px'; E.canvas.style.height = Math.floor(E.H * s) + 'px'; E.scale = s; ctrlCache = null;
  };
  // Canvas-space rectangles of the on-screen controls (stick, action buttons, top-right buttons) so games can keep
  // important things out from under them. Cached; refreshed after E.fit and at most every 500ms.
  let ctrlCache = null, ctrlT = 0;
  E.ctrlRects = function () {
    const now = performance.now();
    if (ctrlCache && now - ctrlT < 500) return ctrlCache;
    ctrlT = now; ctrlCache = [];
    if (!E.canvas || !document.body.classList.contains('touch')) return ctrlCache;
    const c = E.canvas.getBoundingClientRect(); if (!c.width) return ctrlCache;
    const s = c.width / E.W;
    document.querySelectorAll('#stick, .tbtn, .tauto, .hbtn').forEach(el => {
      if (el.offsetParent === null) return;
      const r = el.getBoundingClientRect(); if (!r.width) return;
      ctrlCache.push({ id: el.id || el.dataset.act || el.className, x: (r.left - c.left) / s, y: (r.top - c.top) / s, w: r.width / s, h: r.height / s });
    });
    return ctrlCache;
  };
  E.ctrlDirty = () => { ctrlCache = null; };
  const mqPortrait = window.matchMedia ? matchMedia('(orientation: portrait) and (max-width: 900px)') : null;
  E.isBlocked = () => !!(mqPortrait && mqPortrait.matches);

  // ---------------------------------------------------------------- pause + chrome
  E.paused = false; E.menuOpen = false;
  // A pausable run hides the webinar nudge, including the pause menu. Title and game over can show it.
  // Chrome only; the sim stays in game.js.
  function syncGameBusy() {
    var live = !!(E.canPause && E.canPause());
    if (live) document.body.dataset.gameBusy = '1';
    else if (document.body.dataset.gameBusy) delete document.body.dataset.gameBusy;
  }
  E.pause = function (reason) {
    if (E.paused) return; E.paused = true; I.clear();
    if (A.ctx && A.on) A.ctx.suspend();
    if (reason !== 'silent') openMenu();
    syncGameBusy();
  };
  E.resume = function () {
    if (!E.paused) return; E.paused = false; closeMenu(); I.clear();
    if (A.ctx && A.on) A.ctx.resume();
    syncGameBusy();
  };
  E.togglePause = function () { if (E.paused) E.resume(); else E.pause(); };
  E.onPadStart = function () { if (E.canPause && E.canPause()) E.togglePause(); };
  // E.onTap(el, fn): fire on a touch/pen pointerup over the element, so it works while another finger holds the
  // stick (browsers only synthesise 'click' for single-finger taps). Mouse and keyboard still use 'click'.
  // one clock for every onTap element: a touch tap that rebuilds the menu must not let the browser's follow-up click
  // land on the replacement button and fire it again
  const tapClock = { last: -1e9 };
  E.onTap = function (el, fn) {
    if (!el) return;
    const ids = new Set();
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      e.preventDefault(); e.stopPropagation(); ids.add(e.pointerId);
      try { el.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      el.classList.add('pressing');
    });
    const end = (e, fire) => {
      if (!ids.has(e.pointerId)) return; ids.delete(e.pointerId); el.classList.remove('pressing');
      if (!fire) return;
      const r = el.getBoundingClientRect(), pad = 12;
      if (e.clientX < r.left - pad || e.clientX > r.right + pad || e.clientY < r.top - pad || e.clientY > r.bottom + pad) return;
      e.preventDefault(); e.stopPropagation(); tapClock.last = performance.now(); fn(e);
    };
    el.addEventListener('pointerup', e => end(e, true));
    el.addEventListener('pointercancel', e => end(e, false));
    el.addEventListener('click', e => { if (performance.now() - tapClock.last < 700) { e.preventDefault(); e.stopPropagation(); return; } fn(e); });
  };
  let menuCfg = { toggles: [], actions: [] };
  function openMenu() {
    const m = document.getElementById('pause-menu'); if (!m) return;
    E.menuOpen = true; m.hidden = false; E.refreshMenu(); A.fx('pause');
    const first = m.querySelector('button'); if (first) setTimeout(() => first.focus(), 0);
    const pb = document.getElementById('btn-pause'); if (pb) pb.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    const m = document.getElementById('pause-menu'); if (!m) return;
    m.hidden = true; E.menuOpen = false; const h = document.getElementById('help-panel'); if (h) h.hidden = true;
    const pb = document.getElementById('btn-pause'); if (pb) { pb.setAttribute('aria-expanded', 'false'); }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  E.refreshMenu = function () {
    const list = document.getElementById('pause-list'); if (!list) return;
    list.innerHTML = '';
    const add = (label, fn, id, pressed) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'menu-btn'; b.textContent = label; if (id) b.id = id;
      if (pressed !== undefined) b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      E.onTap(b, fn); list.appendChild(b); return b;
    };
    add('Resume', () => E.resume(), 'menu-resume');
    add('Sound: ' + (A.on ? 'On' : 'Off'), () => { A.setOn(!A.on); focusId('menu-sound'); }, 'menu-sound', A.on);
    for (const t of menuCfg.toggles) add(t.label + ': ' + (t.get() ? 'On' : 'Off'), () => { t.set(!t.get()); E.refreshMenu(); focusId('menu-' + t.key); }, 'menu-' + t.key, t.get());
    add('Controls', () => { const h = document.getElementById('help-panel'); h.hidden = !h.hidden; if (!h.hidden) { const c = h.querySelector('button'); if (c) c.focus(); } }, 'menu-help');
    for (const a of menuCfg.actions) add(a.label, () => { E.resume(); a.fn(); }, 'menu-' + a.key);
    add('Back to arcade', () => { (window.top || window).location.href = E.backUrl(); }, 'menu-back');
  };
  function focusId(id) { const el = document.getElementById(id); if (el) el.focus(); }
  E.setupChrome = function (cfg) {
    menuCfg = Object.assign({ toggles: [], actions: [] }, cfg);
    const pb = document.getElementById('btn-pause');
    E.onTap(pb, e => { e.stopPropagation(); E.togglePause(); });
    const sb = document.getElementById('btn-sound');
    E.onTap(sb, e => { e.stopPropagation(); A.setOn(!A.on); sb.blur(); });
    const hc = document.getElementById('help-close');
    E.onTap(hc, () => { document.getElementById('help-panel').hidden = true; focusId('menu-help'); });
    const m = document.getElementById('pause-menu');
    if (m) m.addEventListener('keydown', e => {
      const btns = Array.from(m.querySelectorAll('button')).filter(b => b.offsetParent !== null);
      const i = btns.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); }
      else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { e.preventDefault(); e.stopPropagation(); E.resume(); }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (E.canPause && E.canPause()) E.pause(); else if (A.ctx) A.ctx.suspend(); }
      else if (!E.paused && A.ctx && A.on) A.ctx.resume();
    });
  };

  // ---------------------------------------------------------------- loop
  E.frame = 0; E.fps = 60;
  E.start = function (update, render) {
    const STEP = 1000 / 60; let acc = 0, last = performance.now(), fpsAcc = 0, fpsN = 0, longN = 0;
    function tick(t) {
      let dt = t - last; last = t; if (dt > 250) dt = 250; if (dt < 0) dt = 0;
      fpsAcc += dt; fpsN++; if (dt > 33.4) longN++; if (fpsAcc >= 500) { E.fps = Math.round(1000 * fpsN / fpsAcc); E.longFrames = longN; fpsAcc = 0; fpsN = 0; longN = 0; E.autoQuality(); }
      const blocked = E.isBlocked();
      if (blocked && !E.wasBlocked && E.canPause && E.canPause()) E.pause('silent');
      E.wasBlocked = blocked;
      if (!E.paused && !blocked) {
        acc += dt; let n = 0;
        while (acc >= STEP && n < 4) { I.update(); update(); E.fxTick(); E.frame++; acc -= STEP; n++; }
        if (n === 4) acc = 0;
      } else { acc = 0; if (E.paused && !blocked) pollPad(); if (E.paused && !E.menuOpen && !blocked) openMenu(); } // controller START can also resume
      E.ctx.setTransform(E.VRES, 0, 0, E.VRES, 0, 0); E.ctx.globalAlpha = 1; E.ctx.globalCompositeOperation = 'source-over';
      render();
      syncGameBusy();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  E.init = function (gameId) {
    E.gameId = gameId;
    E.canvas = document.getElementById('screen'); E.canvas.width = E.W * E.VRES; E.canvas.height = E.H * E.VRES;
    E.ctx = E.canvas.getContext('2d'); E.ctx.imageSmoothingEnabled = false; E.ctx.setTransform(E.VRES, 0, 0, E.VRES, 0, 0);
    E.wrap = document.getElementById('game-wrap');
    E.isTouch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    if (E.isTouch || E.params.get('touch') === '1') { document.body.classList.add('touch'); E.isTouch = true; }
    window.addEventListener('resize', E.fit); window.addEventListener('orientationchange', () => setTimeout(E.fit, 200));
    if (window.ResizeObserver) new ResizeObserver(E.fit).observe(E.wrap);
    setupInput(); E.fit(); E.wireBackLinks();
  };
})();

/* ---------------------------------------------------------------- humanoid sprite painter
 * Draws an original, parameterized pixel-art person facing right.
 * o = { cx, base, d:{leg,torso,tw,hw,hh,lw,aw,hand}, pal:{...}, hat, face, pose:{legF,legB,armF,armB,lean,hy,hdx,hdy}, item, badge, extra }
 * limb segs are [kneeX, kneeY, footX, footY] relative to the joint root.
 */
(function () {
  const E = window.RetroEngine;
  // ---------------------------------------------------------------- stage atmosphere (shared)
  // E.bgPrep upgrades pre-rendered stage layers once per stage: hi-res copies (Scale2x + material-edge shading),
  // a quarter-res bloom map of neon, windows and lamps, and a vignette. E.atmos draws weather and light per frame.
  function bloom(src, thr) {
    const w = Math.max(1, src.width >> 2), h = Math.max(1, src.height >> 2), c = E.makeCanvas(w, h), g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.drawImage(src, 0, 0, w, h);
    const id = g.getImageData(0, 0, w, h), a = id.data; thr = thr || 165;
    for (let i = 0; i < a.length; i += 4) {
      const r = a[i], gg = a[i + 1], b = a[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), sat = mx ? (mx - mn) / mx : 0;
      const k = a[i + 3] > 0 && mx > thr && (sat > 0.38 || mx > 228) ? Math.min(1, (mx - thr) / 60) : 0;
      a[i + 3] = Math.round(255 * k);
    }
    g.putImageData(id, 0, 0);
    const t = E.makeCanvas(Math.max(1, w >> 1), Math.max(1, h >> 1)), tg = t.getContext('2d'); tg.imageSmoothingEnabled = true;
    const out = E.makeCanvas(w, h), og = out.getContext('2d'); og.imageSmoothingEnabled = true;
    tg.drawImage(c, 0, 0, t.width, t.height); og.globalAlpha = 0.85; og.drawImage(t, 0, 0, w, h); og.globalAlpha = 0.7; og.drawImage(c, 0, 0);
    return out;
  }
  E.bloomMap = bloom;
  // Adaptive quality, two tiers. Every 500 ms the loop reports E.fps and E.longFrames (frames over 33 ms).
  //  1. fps under 52 for ~1.5 s of play: E.lowFx drops the full-screen glow, reflections, light shafts, some rain.
  //  2. still struggling after that (fps under 46 or 4+ long frames per 500 ms, for ~1.5 s): E.lowFx2 renders the
  //     canvas at 1x (E.VRES = 1, the hi-res art is drawn downscaled) and the games cap particles (E.particleCap).
  // ?fx=low starts at tier 1, ?fx=high turns adaptation off. E.qualityLog records each drop (frame, fps, long frames).
  const fxParam = E.params.get('fx'); E.lowFx = fxParam === 'low'; E.lowFx2 = false; E.longFrames = 0; E.qualityLog = []; let slow = 0, slow2 = 0;
  E.particleCap = 420;
  E.setViewRes = function (r) {
    r = Math.max(1, Math.min(E.RES, r | 0)); if (r === E.VRES || !E.canvas) return;
    E.VRES = r; E.canvas.width = E.W * r; E.canvas.height = E.H * r; // resizing resets the context state
    E.ctx.imageSmoothingEnabled = false; E.ctx.setTransform(r, 0, 0, r, 0, 0);
  };
  E.autoQuality = function () {
    if (fxParam === 'high' || E.lowFx2 || E.paused || document.hidden) return;
    if (!E.lowFx) {
      if (fxParam) return;
      slow = E.fps && E.fps < 52 ? slow + 1 : Math.max(0, slow - 1);
      if (slow >= 3) { E.lowFx = true; E.lowFxAt = E.frame; E.particleCap = 260; slow2 = 0; E.qualityLog.push({ tier: 1, frame: E.frame, fps: E.fps, long: E.longFrames }); }
      return;
    }
    const bad = (E.fps && E.fps < 46) || E.longFrames >= 4;
    slow2 = bad ? slow2 + 1 : Math.max(0, slow2 - 1);
    if (slow2 >= 3) {
      E.lowFx2 = true; E.lowFx2At = E.frame; E.particleCap = 120; E.setViewRes(1);
      E.qualityLog.push({ tier: 2, frame: E.frame, fps: E.fps, long: E.longFrames });
    }
  };
  const gcache = new Map(); // gradients are reused across frames (same user-space coordinates)
  E.grad = function (key, make) { let g = gcache.get(key); if (!g) { g = make(); if (gcache.size > 400) gcache.clear(); gcache.set(key, g); } return g; };
  const puffs = {};
  E.puff = function (col) { // pre-rendered soft round glow, 32 px, drawn scaled with globalAlpha
    if (puffs[col]) return puffs[col];
    const c = E.makeCanvas(32, 32), g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, col); gr.addColorStop(0.45, col.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.45).toFixed(3) + ')')); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return (puffs[col] = c);
  };
  const vignettes = {};
  function getVignette(grade) {
    const key = grade || '-'; if (vignettes[key]) return vignettes[key];
    const R = E.RES, c = E.makeCanvas(E.W * R, E.H * R), g = c.getContext('2d');
    if (grade) { g.fillStyle = grade; g.fillRect(0, 0, c.width, c.height); }
    const gr = g.createRadialGradient(c.width / 2, c.height * 0.5, c.height * 0.62, c.width / 2, c.height * 0.5, c.width * 0.66);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(6,0,20,0.22)'); // edge-only: keep the picture saturated and bright g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    return (vignettes[key] = c);
  }
  // ---------------------------------------------------------------- E.BK: stage background kit
  // Backgrounds are painted straight at display resolution (2 px per game unit, fractional coordinates allowed),
  // with brick, window, cornice, fire-escape and skyline helpers. layer() returns {lo, hi, g}; done() fills the 1x
  // copy (used for layout reads and the res=1 fallback). E.bgPrep keeps a pre-painted *Hi layer as is.
  (function () {
    const BK = E.BK = {};
    const hx = c => { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; };
    const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    BK.mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
    BK.lit = (c, t) => BK.mix(c, '#FFF4D8', t);
    BK.dk = (c, t) => BK.mix(c, '#120A26', t);
    BK.rng = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
    BK.layer = function (w, h) {
      const lo = E.makeCanvas(w, h), hi = E.makeCanvas(w * 2, h * 2), g = hi.getContext('2d');
      g.imageSmoothingEnabled = false; g.scale(2, 2); return { lo, hi, g, w, h };
    };
    BK.done = function (L) { const lg = L.lo.getContext('2d'); lg.imageSmoothingEnabled = true; lg.drawImage(L.hi, 0, 0, L.w, L.h); return L; };
    const R = BK.R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    BK.V = function (g, x, y, w, h, stops) { const gr = g.createLinearGradient(0, y, 0, y + h); stops.forEach((c, i) => gr.addColorStop(Array.isArray(c) ? c[0] : i / Math.max(1, stops.length - 1), Array.isArray(c) ? c[1] : c)); g.fillStyle = gr; g.fillRect(x, y, w, h); };
    BK.Hz = function (g, x, y, w, h, stops) { const gr = g.createLinearGradient(x, 0, x + w, 0); stops.forEach((c, i) => gr.addColorStop(i / Math.max(1, stops.length - 1), c)); g.fillStyle = gr; g.fillRect(x, y, w, h); };
    BK.line = function (g, pts, w, c) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };
    BK.ell = function (g, x, y, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    BK.glowSpot = function (g, x, y, rx, ry, col, a) { // soft local light (additive)
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.scale(1, ry / rx);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0));
      g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
    };
    BK.sky = function (g, w, h, stops, r, stars) {
      BK.V(g, 0, 0, w, h, stops);
      for (let i = 0; i < (stars || 0); i++) { const x = r() * w, y = r() * h * 0.55, b = r(); R(g, x, y, b < 0.15 ? 1 : 0.5, b < 0.15 ? 1 : 0.5, b < 0.3 ? '#FFFFFF' : '#B8C4FF'); }
    };
    BK.moon = function (g, x, y, rad) {
      BK.glowSpot(g, x, y, rad * 3.2, rad * 3.2, 'rgba(220,210,255,A)', 0.22);
      BK.ell(g, x, y, rad, rad, '#F8F0D0'); BK.ell(g, x + rad * 0.25, y + rad * 0.2, rad * 0.86, rad * 0.86, '#E8DCB8');
      BK.ell(g, x - rad * 0.12, y - rad * 0.1, rad * 0.8, rad * 0.8, '#FFF8E4');
      for (const [dx, dy, rr] of [[-0.35, -0.2, 0.2], [0.3, 0.25, 0.16], [0.05, 0.45, 0.11], [0.4, -0.35, 0.09]]) BK.ell(g, x + dx * rad, y + dy * rad, rr * rad, rr * rad, '#E0D2AC');
    };
    // distant skyline: towers with setbacks, spires and sparse lit windows
    BK.skyline = function (g, w, base, r, o) {
      let x = -4;
      while (x < w) {
        const bw = o.minW + r() * (o.maxW - o.minW), bh = o.minH + r() * (o.maxH - o.minH), top = base - bh;
        R(g, x, top, bw, bh + 2, o.col);
        if (o.edge) R(g, x, top, 1, bh, o.edge);
        if (r() < 0.45) { const sw = bw * (0.4 + r() * 0.3), sh = 4 + r() * 10; R(g, x + (bw - sw) / 2, top - sh, sw, sh + 1, o.col); if (o.edge) R(g, x + (bw - sw) / 2, top - sh, 1, sh, o.edge);
          if (r() < 0.5) { R(g, x + bw / 2 - 0.5, top - sh - 8 - r() * 8, 1, 30, o.col); if (o.beacon) R(g, x + bw / 2 - 0.5, top - sh - 16, 1, 1, o.beacon); } }
        else if (r() < 0.3) { g.fillStyle = o.col; g.beginPath(); g.moveTo(x, top + 0.5); g.lineTo(x + bw / 2, top - 6 - r() * 6); g.lineTo(x + bw, top + 0.5); g.fill(); }
        if (o.win) for (let yy = top + 3; yy < base - 2; yy += o.wy || 3) for (let xx = x + 1.5; xx < x + bw - 1.5; xx += o.wx || 2.5) if (r() < o.density) R(g, xx, yy, o.ws || 1, o.wh || 1, o.win[Math.floor(r() * o.win.length)]);
        x += bw + r() * 3;
      }
    };
    BK.bricks = function (g, x, y, w, h, base, r, o) {
      o = o || {}; const bw = o.bw || 4, bh = o.bh || 2, mort = o.mortar || BK.dk(base, 0.45);
      R(g, x, y, w, h, mort);
      const shades = [base, BK.lit(base, 0.08), BK.dk(base, 0.1), BK.mix(base, '#6A2A1A', 0.15), BK.lit(base, 0.16)];
      for (let yy = y, row = 0; yy < y + h; yy += bh, row++) {
        for (let xx = x - (row % 2 ? bw / 2 : 0); xx < x + w; xx += bw) {
          const x0 = Math.max(x, xx), x1 = Math.min(x + w, xx + bw - 0.5); if (x1 <= x0) continue;
          R(g, x0, yy, x1 - x0, Math.min(bh - 0.5, y + h - yy), shades[Math.floor(r() * shades.length)]);
          if (r() < 0.35) R(g, x0, yy, x1 - x0, 0.5, BK.lit(base, 0.25));
        }
      }
    };
    BK.cornice = function (g, x, y, w, base, deep) {
      deep = deep || 5;
      R(g, x - 1, y, w + 2, deep, base); R(g, x - 1, y, w + 2, 1, BK.lit(base, 0.5)); R(g, x - 1, y + 1, w + 2, 0.5, BK.lit(base, 0.25));
      for (let xx = x; xx < x + w - 1; xx += 2.5) { R(g, xx, y + 2, 1.5, 1.5, BK.lit(base, 0.3)); R(g, xx, y + 3.5, 1.5, 0.5, BK.dk(base, 0.4)); }
      R(g, x - 1, y + deep - 1, w + 2, 1, BK.dk(base, 0.5)); R(g, x, y + deep, w, 1.5, 'rgba(10,4,24,0.45)');
    };
    // a window: stone lintel + sill, frame, lit (warm, curtains, silhouettes) or dark (cool reflection), optional AC unit
    BK.window = function (g, x, y, w, h, r, o) {
      o = o || {}; const stone = o.stone || '#C8B8A8', lit = o.lit !== undefined ? o.lit : r() < 0.5;
      R(g, x - 1.5, y - 2.5, w + 3, 2.5, stone); R(g, x - 1.5, y - 2.5, w + 3, 0.5, BK.lit(stone, 0.4)); R(g, x + w / 2 - 1, y - 2.5, 2, 2.5, BK.lit(stone, 0.2));
      R(g, x - 1, y - 0.5, w + 2, h + 1, '#1A1020');
      if (lit) {
        const warm = o.warm || ['#FFE7A0', '#FFC35A', '#F49A3C'];
        BK.V(g, x, y, w, h, warm);
        const cur = o.curtain || ['#C83850', '#3878C8', '#38A068', '#B060C0', '#E0A040'][Math.floor(r() * 5)];
        const k = r();
        if (k < 0.45) { g.fillStyle = cur; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.38, y); g.quadraticCurveTo(x + w * 0.18, y + h * 0.5, x + w * 0.3, y + h); g.lineTo(x, y + h); g.fill();
          g.beginPath(); g.moveTo(x + w, y); g.lineTo(x + w * 0.62, y); g.quadraticCurveTo(x + w * 0.82, y + h * 0.5, x + w * 0.7, y + h); g.lineTo(x + w, y + h); g.fill();
          R(g, x, y, w, 1, BK.dk(cur, 0.3)); }
        else if (k < 0.7) { const bh = h * (0.25 + r() * 0.35); R(g, x, y, w, bh, '#E8D8B0'); for (let yy = y + 0.75; yy < y + bh; yy += 1) R(g, x, yy, w, 0.5, '#B8A078'); }
        else if (k < 0.85) { g.fillStyle = 'rgba(60,30,40,0.75)'; const cx = x + w * (0.3 + r() * 0.4); BK.ell(g, cx, y + h * 0.45, w * 0.16, w * 0.17, 'rgba(70,34,40,0.8)'); g.beginPath(); g.moveTo(cx - w * 0.3, y + h); g.quadraticCurveTo(cx, y + h * 0.45, cx + w * 0.3, y + h); g.fill(); }
        else { BK.ell(g, x + w * 0.5, y + h - 1.5, w * 0.3, 1.6, '#2E8040'); BK.ell(g, x + w * 0.35, y + h - 2.5, 1, 1, '#E04060'); }
      } else {
        BK.V(g, x, y, w, h, o.dark || ['#2A3878', '#1A2050', '#141838']);
        g.fillStyle = 'rgba(170,200,255,0.28)'; g.beginPath(); g.moveTo(x + w * 0.15, y + h); g.lineTo(x + w * 0.65, y); g.lineTo(x + w * 0.85, y); g.lineTo(x + w * 0.35, y + h); g.fill();
      }
      R(g, x + w / 2 - 0.25, y, 0.5, h, '#1A1020'); R(g, x, y + h * 0.45, w, 0.5, '#1A1020');
      R(g, x - 1.5, y + h + 0.5, w + 3, 1.5, stone); R(g, x - 1.5, y + h + 0.5, w + 3, 0.5, BK.lit(stone, 0.45)); R(g, x - 1, y + h + 2, w + 2, 1, 'rgba(10,4,24,0.4)');
      if (o.ac) { const ax = x + w / 2 - 3.5, ay = y + h + 2; R(g, ax - 0.5, ay - 0.5, 8, 5, '#1A1020'); BK.V(g, ax, ay, 7, 4, ['#D8DCE4', '#9AA0B0']); for (let k = 1; k < 4; k++) R(g, ax + 0.5, ay + k, 6, 0.5, '#6A7080'); }
      return lit;
    };
    BK.fireEscape = function (g, x, y0, y1, w, step, col) {
      col = col || '#141020'; const hi = '#4A4458';
      for (let yy = y0; yy <= y1; yy += step) {
        R(g, x, yy, w, 1, col); R(g, x, yy, w, 0.5, hi);
        R(g, x, yy - 5, w, 0.5, col); for (let k = 0; k <= w; k += 1.5) R(g, x + k, yy - 5, 0.5, 5, col);
        R(g, x - 0.5, yy + 1, w + 1, 0.5, 'rgba(10,4,24,0.5)');
        if (yy + step <= y1) { BK.line(g, [x + w - 3, yy + 1, x + 4, yy + step], 1, col); for (let k = 1; k < 6; k++) { const t = k / 6; R(g, x + w - 3 + (4 - (w - 3)) * t - 1, yy + 1 + (step - 1) * t, 2.5, 0.5, col); } }
      }
      R(g, x + 1, y1 + 1, 0.5, 8, col); R(g, x + 4, y1 + 1, 0.5, 8, col); for (let yy = y1 + 2; yy < y1 + 9; yy += 1.5) R(g, x + 1, yy, 3.5, 0.5, col);
    };
    BK.awning = function (g, x, y, w, h, c1, c2) {
      for (let xx = x, i = 0; xx < x + w; xx += 4, i++) { const c = i % 2 ? c1 : c2; BK.V(g, xx, y, Math.min(4, x + w - xx), h, [BK.lit(c, 0.25), c, BK.dk(c, 0.3)]); }
      R(g, x, y, w, 0.5, 'rgba(255,255,255,0.5)');
      for (let xx = x, i = 0; xx < x + w; xx += 4, i++) { BK.ell(g, xx + 2, y + h, 2, 1.2, i % 2 ? BK.dk(c1, 0.15) : BK.dk(c2, 0.15)); }
      R(g, x, y + h + 1.2, w, 1.5, 'rgba(10,4,24,0.45)');
    };
    BK.neonText = function (g, str, x, y, col, tube) {
      E.text(g, str, x + 0.5, y + 0.5, tube || '#2A0A30', 1, 'center'); E.text(g, str, x, y, col, 1, 'center');
    };
    BK.lamp = function (g, x, top, foot, col) { // ornate street lamp
      col = col || '#26303A'; const hi = '#5A6878';
      R(g, x - 3, foot - 4, 7, 4, col); R(g, x - 2, foot - 6, 5, 2, col); R(g, x - 3, foot - 4, 1, 4, hi);
      BK.Hz(g, x - 0.75, top + 4, 2.5, foot - top - 9, [hi, col, '#10141C']);
      R(g, x - 2, top + 9, 5, 1, col); R(g, x - 4, top + 3, 9, 1.5, col);
      g.fillStyle = col; g.beginPath(); g.moveTo(x - 3.5, top + 3); g.lineTo(x - 2.5, top - 3); g.lineTo(x + 3.5, top - 3); g.lineTo(x + 4.5, top + 3); g.fill();
      BK.V(g, x - 2.5, top - 2, 6, 4.5, ['#FFFFF0', '#FFE890', '#FFC050']);
      R(g, x - 3.5, top - 4, 8, 1.2, col); R(g, x - 0.5, top - 6, 2, 2, col);
      BK.glowSpot(g, x + 0.5, top, 16, 16, 'rgba(255,220,140,A)', 0.4);
    };
  })();
  E.bgPrep = function (bg, opts) {
    if (bg._prepped) return bg; opts = opts || {};
    if (E.RES > 1) {
      for (const k of ['far', 'mid', 'main', 'over']) if (bg[k] && !bg[k + 'Hi']) bg[k + 'Hi'] = E.hires(bg[k], { solid: true, light: k === 'main' || k === 'over' ? 0.95 : 0.55 });
      if (bg.tiles && !bg.tilesHi) bg.tilesHi = bg.tiles.hi || E.hires(bg.tiles, { light: 0.9 });
    }
    // bake an ambient light ramp into the hi-res layers (multiply): e.g. night-blue upper floors, lit street level
    if (opts.ramp) for (const k of ['farHi', 'mainHi', 'overHi', 'midHi']) {
      const c = bg[k]; if (!c || !opts.ramp[k]) continue; const g = c.getContext('2d'), stops = opts.ramp[k];
      const gr = g.createLinearGradient(0, 0, 0, c.height); stops.forEach(([t, col]) => gr.addColorStop(t, col));
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(bg[k.replace('Hi', '')], 0, 0, c.width, c.height); g.restore();
    }
    const src = bg.mainHi || bg.main || bg.tilesHi || bg.tiles; if (src) bg.glow = bloom(src, opts.glowThr);
    const fsrc = bg.farHi || bg.far; if (fsrc) bg.farGlow = bloom(fsrc, opts.glowThr);
    bg._prepped = true; return bg;
  };
  // draw a layer that is `wd` units wide, scrolled by sx (units), hi copy if there is one
  E.drawLayer = function (ctx, bg, key, sx, y, tile) {
    const lo = bg[key], hi = bg[key + 'Hi'] || lo; if (!lo) return;
    const k = hi.width / lo.width, W = E.W, H = E.H; y = y || 0;
    if (tile) { const fw = lo.width; let x = -(Math.round(sx) % fw); if (x > 0) x -= fw; for (; x < W; x += fw) ctx.drawImage(hi, x, y, fw, lo.height); return; }
    const s = Math.max(0, Math.round(sx)), w = Math.min(W, lo.width - s);
    if (w > 0) ctx.drawImage(hi, s * k, 0, w * k, lo.height * k, 0, y, w, lo.height);
  };
  E.drawGlow = function (ctx, glow, srcW, sx, alpha, tile) {
    if (!glow || E.lowFx) return;
    const k = glow.width / srcW; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true;
    if (tile) { let x = -(Math.round(sx) % srcW); if (x > 0) x -= srcW; for (; x < E.W; x += srcW) ctx.drawImage(glow, x, 0, srcW, glow.height / k); }
    else { const s = Math.max(0, Math.round(sx)); ctx.drawImage(glow, s * k, 0, E.W * k, glow.height, 0, 0, E.W, glow.height / k); }
    ctx.restore();
  };
  // weather and light, drawn over the stage and under the HUD. kind: rain | steam | dust | embers | snowfall-free
  const wx = { drops: null };
  E.atmos = function (ctx, kind, t, cam, o) {
    o = o || {}; const W = E.W, H = E.H, rm = E.reducedMotion;
    if (o.haze) { const g = E.grad('hz' + o.haze + o.hazeCol, () => { const g = ctx.createLinearGradient(0, o.haze[0], 0, o.haze[1]); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, o.hazeCol || 'rgba(120,90,200,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); return g; }); ctx.fillStyle = g; ctx.fillRect(0, o.haze[0], W, o.haze[1] - o.haze[0]); }
    if (o.pools && !E.lowFx) for (const pl of o.pools) { // light pools on the ground
      const x = pl.x - cam * (pl.par === undefined ? 1 : pl.par); if (x < -60 || x > W + 60) continue;
      const fl = pl.flicker && !rm ? (Math.sin(t * 0.37 + pl.x) > 0.93 ? 0.45 : 1) : 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (pl.a || 0.35) * fl;
      if (pl.cone) { const g = ctx.createLinearGradient(0, pl.y0, 0, pl.y); g.addColorStop(0, pl.col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 3, pl.y0); ctx.lineTo(x + 3, pl.y0); ctx.lineTo(x + pl.r, pl.y); ctx.lineTo(x - pl.r, pl.y); ctx.closePath(); ctx.fill(); }
      const g = ctx.createRadialGradient(x, pl.y, 1, x, pl.y, pl.r); g.addColorStop(0, pl.col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.setTransform(E.VRES, 0, 0, E.VRES * 0.35, 0, pl.y * E.VRES * 0.65); ctx.fillRect(x - pl.r, pl.y - pl.r, pl.r * 2, pl.r * 2); ctx.restore();
    }
    if (o.shafts && !E.lowFx) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const s of o.shafts) { const x = s.x - cam * 0.9; if (x < -80 || x > W + 80) continue; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, s.col || 'rgba(255,230,170,0.22)'); g.addColorStop(1, 'rgba(255,230,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 18, 0); ctx.lineTo(x + 70, H); ctx.lineTo(x + 30, H); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    if (kind === 'rain') {
      const n = rm ? 0 : (E.lowFx ? 18 : 34); // thin, sparse rain (a few streaks, not a veil)
      if (!wx.drops || wx.drops.length !== n) { wx.drops = []; for (let i = 0; i < n; i++) wx.drops.push([Math.random() * (W + 40), Math.random() * H, 5 + Math.random() * 5, 0.6 + Math.random() * 0.6]); }
      ctx.save(); ctx.strokeStyle = 'rgba(190,210,255,0.3)'; ctx.lineWidth = 0.5; ctx.beginPath();
      for (const d of wx.drops) { d[1] += d[2] * d[3]; d[0] -= d[2] * 0.25; if (d[1] > H) { d[1] -= H + 10; d[0] = Math.random() * (W + 40); } ctx.moveTo(d[0], d[1]); ctx.lineTo(d[0] + d[2] * 0.25, d[1] - d[2]); }
      ctx.stroke();
      if (!rm && o.floor) { ctx.fillStyle = 'rgba(190,210,255,0.5)'; for (let i = 0; i < 6; i++) { const sx = (i * 67 + t * 13) % W, sy = o.floor[0] + ((i * 23 + t) % (o.floor[1] - o.floor[0])); if (((t + i * 7) % 9) < 3) { ctx.fillRect(sx - 1, sy, 0.5, 0.5); ctx.fillRect(sx + 1, sy, 0.5, 0.5); ctx.fillRect(sx, sy - 0.5, 0.5, 0.5); } } }
      ctx.restore();
    } else if (kind === 'steam' || kind === 'dust' || kind === 'embers') {
      const em = o.emit || []; ctx.save();
      for (const e of em) {
        const ex = e.x - cam; if (ex < -40 || ex > W + 40) continue;
        for (let i = 0; i < (kind === 'steam' ? 5 : 3); i++) {
          const ph = ((t * (kind === 'steam' ? 0.5 : 0.25) + i * 20 + e.x) % 100) / 100, py = e.y - ph * (e.h || 50), px = ex + Math.sin(ph * 6 + i) * 6 + ph * 10;
          if (kind === 'steam') { const r = 4 + ph * 12; ctx.globalAlpha = 0.3 * (1 - ph); ctx.drawImage(E.puff('rgba(230,236,255,1)'), px - r, py - r, r * 2, r * 2); ctx.globalAlpha = 1; }
          else { ctx.fillStyle = kind === 'embers' ? 'rgba(255,170,60,' + (0.8 * (1 - ph)).toFixed(2) + ')' : 'rgba(255,240,200,' + (0.5 * Math.sin(ph * Math.PI)).toFixed(2) + ')'; ctx.fillRect(px, py, 0.5 + (i & 1) * 0.5, 0.5 + (i & 1) * 0.5); }
        }
      }
      ctx.restore();
    }
    if (o.vignette !== false) ctx.drawImage(getVignette(o.grade), 0, 0, W, H);
    else if (o.grade) { ctx.fillStyle = o.grade; ctx.fillRect(0, 0, W, H); }
  };
  // Beveled arcade panel: dark glass with a double rim and a bright top edge
  E.panel = function (ctx, x, y, w, h, o) {
    o = o || {}; const rim = o.rim || '#F0BC3C', R = E.ramp ? E.ramp(rim) : { d2: '#402800', h2: '#FFF4C0', d1: '#8C6000' };
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top || 'rgba(34,24,72,0.94)'); g.addColorStop(1, o.bot || 'rgba(8,4,24,0.94)');
    ctx.fillStyle = '#05020E'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = R.d2; ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    ctx.fillStyle = rim; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = R.h2; ctx.fillRect(x - 1, y - 1, w + 2, 0.5);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, y, w, Math.min(6, h / 3));
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, w, 0.5);
  };
  // Arcade logo lettering: pixel font -> gradient fill with a shine line -> Scale2x + rim light -> thick outline
  // and a drop shadow. Returns a display-resolution canvas (draw it at width / E.RES).
  const logoCache = {};
  E.logo = function (text, scale, cols, o) {
    o = o || {}; const key = text + scale + cols.join() + (o.shadow || '') + (o.edge || '');
    if (logoCache[key]) return logoCache[key];
    const w = E.textWidth(text, scale) + 4, h = 7 * scale + 4, c = E.makeCanvas(w, h), g = c.getContext('2d');
    E.text(g, text, 2, 2, '#FFFFFF', scale);
    g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(0, 2, 0, 2 + 7 * scale); cols.forEach((col, i) => gr.addColorStop(i / (cols.length - 1), col));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(0, 2 + Math.round(scale * 2.2), w, Math.max(1, scale >> 2));
    const hi = E.hires(c, { strip: false, light: 0 }), R = E.RES, pad = 4 * R;
    const out = E.makeCanvas(hi.width + pad * 2, hi.height + pad * 2), og = out.getContext('2d');
    const sil = E.tintCanvas(hi, o.edge || '#0C0618'), sh = E.tintCanvas(hi, o.shadow || '#3A0C5C');
    og.drawImage(sh, pad + 3 * R, pad + 4 * R);
    for (let a = 0; a < 16; a++) { const r = 2.4 * R; og.drawImage(sil, pad + Math.round(Math.cos(a * Math.PI / 8) * r), pad + Math.round(Math.sin(a * Math.PI / 8) * r)); }
    og.drawImage(hi, pad, pad);
    return (logoCache[key] = out);
  };
  E.drawLogo = function (ctx, img, cx, y) { const R = E.RES; ctx.drawImage(img, Math.round(cx - img.width / R / 2), y, img.width / R, img.height / R); };
  // ---------------------------------------------------------------- HD figures
  // E.human paints the 1x figure (hit boxes, anchors) and, when E.RES > 1, repaints the same skeleton at full
  // display resolution on canvas.hd: tapered limbs, shaped torso, a face with eyes, brows and mouth, hair and hats
  // with highlights, boots and fists, all shaded as cylinders lit from the top left with hue-shifted ramps.
  const HLX = -0.55, HLY = -0.83;
  function postHD(c) {
    const W2 = c.width, H2 = c.height, g = c.getContext('2d'), id = E.pixels(c, W2, H2), q = new Uint32Array(id.data.buffer);
    for (let i = 0; i < q.length; i++) { const a = q[i] >>> 24; q[i] = a < 120 ? 0 : (q[i] | 0xFF000000) >>> 0; }
    E.selout(q, W2, H2); g.putImageData(id, 0, 0); return c;
  }
  E.postHD = postHD;
  const rampCache = {};
  function hexRGB(h) { if (!h || h[0] !== '#') return [128, 128, 128]; const v = parseInt(h.slice(1, 7), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  const rgb = (r, g, b) => 'rgb(' + Math.round(Math.min(255, r)) + ',' + Math.round(Math.min(255, g)) + ',' + Math.round(Math.min(255, b)) + ')';
  function ramp(h) {
    if (rampCache[h]) return rampCache[h];
    const [r, g, b] = hexRGB(h);
    const dk = t => rgb(r * (1 - t * 0.62) + 26 * t, g * (1 - t * 0.66) + 12 * t, b * (1 - t * 0.45) + 52 * t);
    const lt = t => rgb(r + (255 - r) * t, g + (246 - g) * t * 0.95, b + (214 - b) * t * 0.8);
    return (rampCache[h] = { b: rgb(r, g, b), d1: dk(0.36), d2: dk(0.62), h1: lt(0.3), h2: lt(0.6) });
  }
  E.ramp = ramp;
  // shape(dx, dy) must add ONE simple closed sub-path offset by (dx, dy)
  function shade(g, shape, col, o) {
    o = o || {}; const R = ramp(col), s1 = o.s1 || 2.4, s2 = o.s2 || 1.6;
    g.save(); g.beginPath(); shape(0, 0); g.clip(); g.fillStyle = R.b; g.fill();
    g.beginPath(); shape(0, 0); shape(HLX * s1 * 2.1, HLY * s1 * 2.1); g.fillStyle = R.d1; g.fill('evenodd');
    g.beginPath(); shape(0, 0); shape(HLX * s1, HLY * s1); g.fillStyle = R.d2; g.fill('evenodd');
    g.beginPath(); shape(0, 0); shape(-HLX * s2, -HLY * s2); g.fillStyle = R.h1; g.fill('evenodd');
    if (o.spec) { g.beginPath(); shape(0, 0); shape(-HLX * s2 * 0.5, -HLY * s2 * 0.5); g.fillStyle = R.h2; g.fill('evenodd'); }
    g.restore();
  }
  E.shadeHD = shade;
  function seg(g, a, b, r0, r1) { // tapered capsule a->b as one path
    return (dx, dy) => {
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      g.moveTo(a[0] + dx + Math.cos(ang + Math.PI / 2) * r0, a[1] + dy + Math.sin(ang + Math.PI / 2) * r0);
      g.arc(a[0] + dx, a[1] + dy, r0, ang + Math.PI / 2, ang + Math.PI * 1.5);
      g.arc(b[0] + dx, b[1] + dy, r1, ang - Math.PI / 2, ang + Math.PI / 2);
      g.closePath();
    };
  }
  function ell(g, cx, cy, rx, ry, rot) { return (dx, dy) => { g.moveTo(cx + dx + rx * Math.cos(rot || 0), cy + dy + rx * Math.sin(rot || 0)); g.ellipse(cx + dx, cy + dy, rx, ry, rot || 0, 0, Math.PI * 2); g.closePath(); }; }
  function poly(g, pts) { return (dx, dy) => { g.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + dx, pts[i][1] + dy); g.closePath(); }; }
  function rrect(g, x, y, w, h, r) { return (dx, dy) => { x += dx; y += dy; g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); x -= dx; y -= dy; }; }
  // ---------------------------------------------------------------- cutout rig (second art pass)
  // Each figure is a layered 2D cutout drawn with canvas paths at display resolution: rounded skull with jaw, nose,
  // brow, eyes and ear; neck; tapered chest/waist/pelvis; deltoids; limbs with muscle bulges; fists with knuckles and
  // thumb; shaped boots or sneakers; hair, hats and clothing as separate layers. Every layer gets a 4-tone ramp lit
  // from the top left, a cool rim light in the shadow edge and a dark ink line, so overlapping parts stay readable.
  // The skeleton (hip, shoulder, knee/foot and elbow/hand offsets) is the same one the 1x hit-box sprite uses.
  const INK = [14, 8, 24];
  function ink(col, t) { const c = hexRGB(col); t = t === undefined ? 0.78 : t; return rgb(c[0] * (1 - t) + INK[0] * t, c[1] * (1 - t) + INK[1] * t, c[2] * (1 - t) + INK[2] * t); }
  function tint(col, t, to) { const c = hexRGB(col), d = hexRGB(to || '#000000'); return '#' + c.map((v, i) => Math.round(v * (1 - t) + d[i] * t).toString(16).padStart(2, '0')).join(''); }
  const RIM = 'rgba(150,215,255,0.55)';
  function part(g, shape, col, o) {
    o = o || {}; const r = o.r || 4;
    shade(g, shape, col, { s1: o.s1 || r * 0.5, s2: o.s2 || r * 0.42, spec: o.spec });
    if (o.rim !== false) { const w = o.rimW || Math.max(0.8, r * 0.18); g.save(); g.beginPath(); shape(0, 0); g.clip(); g.beginPath(); shape(0, 0); shape(HLX * w, HLY * w); g.fillStyle = o.rimCol || RIM; g.fill('evenodd'); g.restore(); }
    if (o.ink !== false) { g.save(); g.lineJoin = 'round'; g.lineWidth = o.lw || 1; g.strokeStyle = ink(col); g.beginPath(); shape(0, 0); g.stroke(); g.restore(); }
  }
  // E.spriteHD: a sprite authored with canvas paths in game units at display resolution (machines, props, bosses).
  // fn(g, H) draws with g already scaled to units; H has the shading helpers. Same {w,h,ax,ay} contract as E.sprite.
  E.spriteHD = function (w, h, fn, opts) {
    opts = opts || {}; const Rz = E.RES, c = E.makeCanvas(w, h), hd = E.makeCanvas(w * Rz, h * Rz), g = hd.getContext('2d');
    g.save(); g.scale(Rz, Rz); fn(g, E.HD); g.restore();
    const cg = c.getContext('2d'); cg.imageSmoothingEnabled = true; cg.drawImage(hd, 0, 0, w, h);
    if (Rz > 1) { c.hd = hd; if (opts.outline === false) { const s = { src: c, img: hd, w, h, ax: opts.ax === undefined ? w >> 1 : opts.ax, ay: opts.ay === undefined ? h - 1 : opts.ay, _f: null }; Object.defineProperty(s, 'flip', { get() { return this._f || (this._f = flipCanvas(this.img)); } }); return s; } }
    return E.finish(c, opts.ax, opts.ay);
  };
  function limbShape(g, a, b, r0, rm, r1, bulge) { // tapered limb a->b; rm is the radius at 42% with an optional one-sided bulge
    return (dx, dy) => {
      const ax = a[0] + dx, ay = a[1] + dy, bx = b[0] + dx, by = b[1] + dy, L = Math.hypot(bx - ax, by - ay) || 0.01, ux = (bx - ax) / L, uy = (by - ay) / L, nx = -uy, ny = ux;
      const mx = ax + (bx - ax) * 0.42, my = ay + (by - ay) * 0.42, rA = rm * (1 + (bulge || 0)), rB = rm * (1 - (bulge || 0) * 0.4);
      const cA = 2 * rA - (r0 + r1) / 2, cB = 2 * rB - (r0 + r1) / 2, au = Math.atan2(uy, ux);
      g.moveTo(ax + nx * r0, ay + ny * r0);
      g.quadraticCurveTo(mx + nx * cA, my + ny * cA, bx + nx * r1, by + ny * r1);
      g.arc(bx, by, r1, au + Math.PI / 2, au - Math.PI / 2, true);
      g.quadraticCurveTo(mx - nx * cB, my - ny * cB, ax - nx * r0, ay - ny * r0);
      g.arc(ax, ay, r0, au - Math.PI / 2, au - Math.PI * 1.5, true);
      g.closePath();
    };
  }
  function pathOf(g, pts) { // pts: [x,y] = lineTo, [cx,cy,x,y] = quadratic, [c1x,c1y,c2x,c2y,x,y] = bezier
    return (dx, dy) => {
      g.moveTo(pts[0][0] + dx, pts[0][1] + dy);
      for (let i = 1; i < pts.length; i++) { const q = pts[i];
        if (q.length === 2) g.lineTo(q[0] + dx, q[1] + dy);
        else if (q.length === 4) g.quadraticCurveTo(q[0] + dx, q[1] + dy, q[2] + dx, q[3] + dy);
        else g.bezierCurveTo(q[0] + dx, q[1] + dy, q[2] + dx, q[3] + dy, q[4] + dx, q[5] + dy); }
      g.closePath();
    };
  }
  const ellS = (g, cx, cy, rx, ry, rot) => ell(g, cx, cy, rx, ry, rot);
  const add = (a, b, k) => [a[0] + b[0] * (k === undefined ? 1 : k), a[1] + b[1] * (k === undefined ? 1 : k)];
  const nrm = v => { const m = Math.hypot(v[0], v[1]) || 1; return [v[0] / m, v[1] / m]; };
  function rigHD(g, o, S) {
    const d = o.d, ps = o.pose, pal = o.pal, K = o.k || 1, X = v => v * S;
    const U = K * (d.leg + d.torso) / 27, u = U * S;
    const build = o.build || (d.tw >= 15 ? 'heavy' : d.tw <= 10 ? 'lean' : 'avg'), heavy = build === 'heavy' || build === 'huge', fem = !!o.fem;
    const LK = o.limbK || 1;
    const hip = [X(o.cx + (ps.hx || 0) * K), X(o.base - d.leg * K + (ps.hy || 0) * K)];
    const sh = [hip[0] + X((ps.lean || 0) * K), hip[1] - X((d.torso + (ps.ty || 0)) * K)];
    const J = (root, seg, i) => [root[0] + X(seg[i] * K), root[1] + X(seg[i + 1] * K)];
    const cw = X(d.tw * K) * 0.5 * (fem ? 0.86 : 1) * (build === 'huge' ? 1.08 : 1);
    const waist = cw * (heavy ? 0.95 : fem ? 0.6 : build === 'lean' ? 0.66 : 0.72), hipw = cw * (fem ? 0.84 : heavy ? 0.86 : 0.72);
    const ar = X(d.aw * K) * 0.6 * LK * (fem ? 0.85 : 1), lr = X(d.lw * K) * 0.78 * LK * (fem ? 0.92 : 1);
    const skin = pal.skin || '#F0B080', hair = pal.hair || '#402C00', hat = pal.hat || '#24188C', acc = pal.accent || '#F0BC3C';
    const sleeve = o.sleeve || 'long';
    const shirt = pal.shirt, shirtB = pal.shirt2 ? tint(pal.shirt, 0.18) : tint(pal.shirt, 0.22);
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    const J0 = { hip, sh, u, cw, S, X };
    if (o.rigBack) o.rigBack(g, J0, { part, limbShape, pathOf, ell: ellS, ramp, tint });
    // joints: near (front) shoulder slightly forward, far shoulder behind the chest
    const shy = sh[1] + Math.max(ar * 0.9, cw * 0.24), sF = [sh[0] + cw * 0.32, shy], sB = [sh[0] - cw * 0.42, shy];
    const hF = [hip[0] + hipw * 0.38, hip[1] + u * 0.2], hB = [hip[0] - hipw * 0.42, hip[1] + u * 0.2];
    function fist(h, el, col, back) {
      const dir = nrm([h[0] - el[0], h[1] - el[1]]), n = [-dir[1], dir[0]], fr = X((d.hand || 3) * K) * 0.54 * (heavy ? 1.1 : 1) * (fem ? 0.9 : 1);
      const c = add(h, dir, fr * 0.25), P = (a, b) => [c[0] + dir[0] * a * fr + n[0] * b * fr, c[1] + dir[1] * a * fr + n[1] * b * fr];
      const sh2 = pathOf(g, [P(-0.75, -0.7), P(0.55, -0.85, 0.95, -0.55), P(1.15, 0, 0.95, 0.6), P(0.55, 0.9, -0.75, 0.75), P(-1.0, 0, -0.75, -0.7)]);
      part(g, sh2, back ? tint(col, 0.12) : col, { r: fr, spec: true });
      g.strokeStyle = ink(col, 0.55); g.lineWidth = Math.max(0.7, fr * 0.16); g.beginPath();
      const k1 = P(0.55, -0.6), k2 = P(0.62, 0.62); g.moveTo(k1[0], k1[1]); g.lineTo(k2[0], k2[1]);
      for (const t of [-0.2, 0.2]) { const a1 = P(0.55, t), a2 = P(0.95, t); g.moveTo(a1[0], a1[1]); g.lineTo(a2[0], a2[1]); }
      g.stroke();
      const th = P(0.1, -0.78); part(g, ellS(g, th[0], th[1], fr * 0.42, fr * 0.3, Math.atan2(dir[1], dir[0])), col, { r: fr * 0.4, rim: false });
      return c;
    }
    function item(h, el, kind) {
      if (!kind) return;
      const dir = nrm([h[0] - el[0], h[1] - el[1]]), n = [-dir[1], dir[0]], L = len => add(h, dir, X(len * K));
      if (kind === 'baton') { part(g, limbShape(g, add(h, dir, -X(1.5 * K)), L(10.5), X(0.75), X(0.7), X(0.6)), '#26262E', { r: X(0.7), spec: true }); part(g, limbShape(g, add(add(h, dir, X(0.6 * K)), n, -X(0.4)), add(add(h, dir, X(0.6 * K)), n, -X(2.6 * K)), X(0.5), X(0.5), X(0.5)), '#26262E', { r: X(0.5) }); }
      else if (kind === 'knife') { const a = L(1.2), b = L(7.5); part(g, pathOf(g, [add(a, n, X(0.9)), add(b, n, X(0.1)), add(b, n, -X(0.2)), add(a, n, -X(0.6))]), '#DDE4F0', { r: X(0.8), spec: true }); part(g, limbShape(g, L(-0.8), L(1.3), X(0.7), X(0.7), X(0.7)), '#5C2410', { r: X(0.7) }); }
      else if (kind === 'wrench') { part(g, limbShape(g, L(-0.5), L(6), X(0.75), X(0.7), X(0.7)), '#A8B0BE', { r: X(0.7), spec: true }); const e = L(7); part(g, pathOf(g, [add(e, n, X(1.8)), add(add(e, dir, X(2)), n, X(1.6)), add(add(e, dir, X(1.2)), n, X(0.5)), add(add(e, dir, X(1.2)), n, -X(0.5)), add(add(e, dir, X(2)), n, -X(1.6)), add(e, n, -X(1.8))]), '#A8B0BE', { r: X(1.4), spec: true }); }
      else if (kind === 'cane') { part(g, limbShape(g, add(h, dir, -X(2.5)), L(12.5), X(0.75), X(0.7), X(0.6)), '#3C2410', { r: X(0.7), spec: true }); const k = add(h, dir, -X(2.8)); part(g, ellS(g, k[0], k[1], X(1.7), X(1.4)), '#F0BC3C', { r: X(1.5), spec: true }); }
      else if (kind === 'gun') { // stun rifle: stock under the forearm, body, barrel, glowing emitter
        const st = add(add(h, dir, -X(3.2 * K)), n, X(0.6)), bd0 = add(h, n, X(0.2)), bd1 = L(4), br = L(8.5);
        part(g, pathOf(g, [add(st, n, -X(1.2)), add(bd0, n, -X(1.3)), add(bd1, n, -X(1.2)), add(bd1, n, X(1.6)), add(bd0, n, X(1.8)), add(st, n, X(1.4))]), '#363C4C', { r: X(1.4), spec: true });
        part(g, limbShape(g, bd1, br, X(0.75), X(0.7), X(0.65)), '#2A2E3A', { r: X(0.7), spec: true });
        const mg = add(add(h, dir, X(1.6)), n, X(1.6)); part(g, pathOf(g, [add(mg, dir, -X(0.7)), add(mg, dir, X(0.7)), add(add(mg, dir, X(0.9)), n, X(2.2)), add(add(mg, dir, -X(0.3)), n, X(2.2))]), '#2A2E3A', { r: X(0.7) });
        const bl = add(add(h, dir, X(2.2)), n, -X(0.9)); g.fillStyle = '#5CE0FF'; g.fillRect(bl[0] - X(0.9), bl[1] - X(0.35), X(1.8), X(0.7));
        g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(br[0], br[1], 0, br[0], br[1], X(2.2)); gr.addColorStop(0, 'rgba(160,240,255,0.95)'); gr.addColorStop(1, 'rgba(60,180,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(br[0], br[1], X(2.2), 0, 7); g.fill(); g.restore();
      }
    }
    function arm(root, seg, back) {
      const el = J(root, seg, 0), hd = J(root, seg, 2), up = nrm([el[0] - root[0], el[1] - root[1]]);
      const sk = back ? tint(skin, 0.14) : skin, sl = back ? (pal.sleeve2 ? pal.sleeve2 : tint(pal.sleeve || shirt, 0.18)) : (pal.sleeve || shirt);
      const wr = add(hd, nrm([hd[0] - el[0], hd[1] - el[1]]), -ar * 0.2);
      const r0 = ar * 1.18, r1 = ar * 0.82, rw = ar * 0.58;
      // forearm then upper arm (the deltoid caps the shoulder)
      if (sleeve === 'long') part(g, limbShape(g, el, wr, r1 * 1.08, r1 * 1.06, rw * 1.18), sl, { r: ar });
      else part(g, limbShape(g, el, wr, r1, r1 * 1.12, rw, 0.25), sk, { r: ar });
      if (sleeve === 'none') part(g, limbShape(g, root, el, r0, ar * 1.05, r1 * 1.02, 0.3), sk, { r: ar, spec: true });
      else if (sleeve === 'short') {
        part(g, limbShape(g, root, el, r0, ar, r1, 0.3), sk, { r: ar, spec: true });
        const m = add(root, [el[0] - root[0], el[1] - root[1]], 0.5); part(g, limbShape(g, add(root, up, -ar * 0.3), m, r0 * 1.12, ar * 1.12, ar * 1.08), sl, { r: ar });
        if (pal.stripe) { g.strokeStyle = pal.stripe; g.lineWidth = Math.max(1, ar * 0.3); g.beginPath(); g.moveTo(root[0], root[1] - ar * 0.6); g.lineTo(m[0], m[1] - ar * 0.6); g.stroke(); }
      } else {
        part(g, limbShape(g, root, el, r0 * 1.06, ar * 1.06, r1 * 1.1, 0.15), sl, { r: ar, spec: true });
        g.strokeStyle = ink(sl, 0.45); g.lineWidth = Math.max(0.7, ar * 0.16); g.beginPath(); const cA = add(el, up, -ar * 0.9); g.moveTo(cA[0] - ar * 0.4, cA[1]); g.quadraticCurveTo(el[0], el[1] + ar * 0.3, cA[0] + ar * 0.5, cA[1] + ar * 0.3); g.stroke(); // elbow fold
        const cf = add(wr, nrm([wr[0] - el[0], wr[1] - el[1]]), -rw * 0.9); g.lineWidth = Math.max(0.8, ar * 0.22); g.strokeStyle = ink(sl, 0.6); g.beginPath(); const nn = nrm([-(wr[1] - el[1]), wr[0] - el[0]]); g.moveTo(cf[0] + nn[0] * rw * 1.1, cf[1] + nn[1] * rw * 1.1); g.lineTo(cf[0] - nn[0] * rw * 1.1, cf[1] - nn[1] * rw * 1.1); g.stroke(); // cuff
        if (pal.stripe) { g.strokeStyle = pal.stripe; g.lineWidth = Math.max(1, ar * 0.3); g.beginPath(); g.moveTo(root[0], root[1] - ar * 0.7); g.lineTo(el[0], el[1] - ar * 0.6); g.lineTo(wr[0], wr[1] - rw * 0.6); g.stroke(); }
      }
      if (back && o.itemB) item(hd, el, o.itemB);
      if (!back && o.item && o.item !== 'gun') item(hd, el, o.item);
      fist(hd, el, back ? (pal.glove2 || pal.glove || skin) : (pal.glove || skin), back);
      if (!back && o.item === 'gun') item(hd, el, 'gun');
      return [hd, el];
    }
    function leg(root, seg, back) {
      const kn = J(root, seg, 0), an = J(root, seg, 2), shin = nrm([an[0] - kn[0], an[1] - kn[1]]), th = nrm([kn[0] - root[0], kn[1] - root[1]]);
      const pc = back ? (pal.pants2 || tint(pal.pants, 0.2)) : pal.pants;
      const bootC = back ? tint(pal.shoes || '#202020', 0.15) : (pal.shoes || '#202020');
      // boot first (the trouser cuff overlaps it)
      const f = [shin[1] * -1 * -1, -shin[0]]; const fwd = [shin[1], -shin[0]]; const upv = [-shin[0], -shin[1]], B = lr * 1.12 * (fem ? 0.9 : 1);
      const P = (a, b) => [an[0] + fwd[0] * a * B + upv[0] * b * B, an[1] + fwd[1] * a * B + upv[1] * b * B];
      const sneaker = o.shoe === 'sneaker';
      const boot = pathOf(g, [P(-0.6, 0.9), P(0.45, 0.95), P(0.6, 0.45, 1.3, 0.35), P(1.75, 0.2, 1.7, -0.25), P(-0.55, -0.3), P(-0.75, 0.1, -0.6, 0.9)]);
      part(g, boot, bootC, { r: B * 0.8, spec: true });
      const s0 = P(-0.62, -0.3), s1 = P(1.68, -0.28); g.strokeStyle = sneaker ? '#E8E8F0' : ink(bootC, 0.4); g.lineWidth = Math.max(1, B * 0.28); g.beginPath(); g.moveTo(s0[0], s0[1]); g.lineTo(s1[0], s1[1]); g.stroke(); // sole
      if (sneaker) { g.strokeStyle = pal.shoeStripe || '#E40058'; g.lineWidth = Math.max(0.8, B * 0.2); g.beginPath(); const a1 = P(-0.2, 0.15), a2 = P(0.5, 0.55), a3 = P(1.0, 0.1); g.moveTo(a1[0], a1[1]); g.quadraticCurveTo(a2[0], a2[1], a3[0], a3[1]); g.stroke(); }
      else { g.fillStyle = 'rgba(255,255,255,0.35)'; for (const t of [0.15, 0.45]) { const q = P(0.55 + t * 0.6, 0.6 - t * 0.5); g.fillRect(q[0] - X(0.3), q[1] - X(0.2), X(0.6), X(0.35)); } }
      // shin then thigh
      const r0 = lr * 1.12 * (heavy ? 1.08 : 1), rk = lr * 0.78, rc = lr * 0.8, ra = lr * 0.66;
      const anc = add(an, upv, B * 0.35);
      part(g, limbShape(g, kn, anc, rk, rc, ra, -0.15), pc, { r: lr });
      part(g, limbShape(g, root, kn, r0, lr * 1.0, rk * 1.02, 0.12), pc, { r: lr, spec: !back });
      // trouser creases: knee folds and a pressed front line
      g.strokeStyle = ink(pc, 0.5); g.lineWidth = Math.max(0.7, lr * 0.13); g.beginPath();
      const kb = add(kn, [-th[1], th[0]], -rk * 0.2); g.moveTo(kb[0] - lr * 0.5, kb[1] - lr * 0.2); g.lineTo(kb[0] + lr * 0.1, kb[1] + lr * 0.25); g.moveTo(kb[0] - lr * 0.4, kb[1] + lr * 0.45); g.lineTo(kb[0] + lr * 0.25, kb[1] + lr * 0.7); g.stroke();
      if (pal.stripe) { g.strokeStyle = pal.stripe; g.lineWidth = Math.max(1, lr * 0.28); g.beginPath(); const nn = [-th[1], th[0]], ns = [-shin[1], shin[0]]; g.moveTo(root[0] + nn[0] * r0 * 0.75, root[1] + nn[1] * r0 * 0.75); g.lineTo(kn[0] + nn[0] * rk * 0.8, kn[1] + nn[1] * rk * 0.8); g.lineTo(anc[0] + ns[0] * ra * 0.75, anc[1] + ns[1] * ra * 0.75); g.stroke(); }
      return [an, kn];
    }
    // far arm, far leg, near leg
    const armB = arm(sB, ps.armB, true);
    leg(hB, ps.legB, true); leg(hF, ps.legF, false);
    // coat tails behind the hips
    if (pal.coat) { const swing = X(((ps.lean || 0) * -0.4) * K); part(g, pathOf(g, [[hip[0] - hipw * 1.05, hip[1] - u * 1.5], [hip[0] + hipw * 0.9, hip[1] - u * 1.5], [hip[0] + hipw * 0.85, hip[1] + u * 2], [hip[0] + hipw * 0.6 + swing * 0.3, hip[1] + X(d.leg * K * 0.62)], [hip[0] - hipw * 1.3 + swing, hip[1] + X(d.leg * K * 0.66)], [hip[0] - hipw * 1.25, hip[1] + u * 3, hip[0] - hipw * 1.05, hip[1] - u * 1.5]]), pal.coat, { r: cw * 0.5 }); }
    // torso
    const wy = sh[1] + (hip[1] - sh[1]) * 0.7, wx = sh[0] + (hip[0] - sh[0]) * 0.7, Th = hip[1] - sh[1];
    const belly = o.belly ? cw * 0.34 : build === 'huge' ? cw * 0.12 : heavy ? cw * 0.06 : 0, pec = fem ? cw * 0.28 : build === 'lean' ? cw * 0.05 : cw * 0.16;
    const torsoPts = [[sh[0] - cw * 0.28, sh[1] - u * 0.7], [sh[0] - cw * 0.62, sh[1] - u * 0.7, sh[0] - cw * 0.9, sh[1] - cw * 0.02, sh[0] - cw * 0.98, sh[1] + cw * 0.3],
      [sh[0] - cw * 1.12, sh[1] + Th * 0.3, wx - waist * 1.05, wy - Th * 0.12, wx - waist, wy],
      [wx - waist * 1.0, wy + Th * 0.18, hip[0] - hipw, hip[1] + u * 0.9], [hip[0] + hipw, hip[1] + u * 0.9],
      [wx + waist * 1.02 + belly * 0.6, wy + Th * 0.14, wx + waist + belly * 0.4, wy - Th * 0.02],
      [wx + waist * 1.1 + belly, wy - Th * 0.32, sh[0] + cw * 1.0 + pec, sh[1] + Th * 0.34, sh[0] + cw * 0.92, sh[1] + cw * 0.28],
      [sh[0] + cw * 0.85, sh[1] - cw * 0.02, sh[0] + cw * 0.58, sh[1] - u * 0.75, sh[0] + cw * 0.26, sh[1] - u * 0.75]];
    const torso = pathOf(g, torsoPts);
    const top = pal.top || shirt; // top: shirt, tank top or jacket colour
    part(g, torso, top, { r: cw * 0.9, s1: cw * 0.42, s2: cw * 0.34, spec: true });
    const clipT = fn => { g.save(); g.beginPath(); torso(0, 0); g.clip(); fn(); g.restore(); };
    if (sleeve === 'none' && o.tank) clipT(() => { // tank top: skin shoulders and chest above the neckline
      part(g, pathOf(g, [[sh[0] - cw * 1.2, sh[1] - u], [sh[0] + cw * 1.3, sh[1] - u], [sh[0] + cw * 1.2, sh[1] + Th * 0.32], [sh[0] + cw * 0.55, sh[1] + Th * 0.18, sh[0] + cw * 0.1, sh[1] + Th * 0.22], [sh[0] - cw * 0.6, sh[1] + u * 1.2], [sh[0] - cw * 1.2, sh[1] + u * 2.2]]), skin, { r: cw * 0.6, spec: true });
      g.strokeStyle = ink(skin, 0.45); g.lineWidth = Math.max(0.8, u * 0.22); g.beginPath(); g.moveTo(sh[0] + cw * 0.15, sh[1] + Th * 0.12); g.quadraticCurveTo(sh[0] + cw * 0.5, sh[1] + Th * 0.2, sh[0] + cw * 0.9, sh[1] + Th * 0.1); g.stroke(); });
    clipT(() => { // cloth folds: armpit drape, chest line, tuck at the waist
      g.strokeStyle = ink(top, 0.42); g.lineWidth = Math.max(0.8, u * 0.2); g.beginPath();
      g.moveTo(sh[0] - cw * 0.55, sh[1] + Th * 0.3); g.quadraticCurveTo(sh[0] - cw * 0.2, sh[1] + Th * 0.5, wx - waist * 0.4, wy + Th * 0.05);
      g.moveTo(wx - waist * 0.3, wy + Th * 0.2); g.lineTo(wx + waist * 0.1, wy + Th * 0.12); g.moveTo(wx + waist * 0.2, wy + Th * 0.22); g.lineTo(wx + waist * 0.6, wy + Th * 0.12);
      if (!fem && build !== 'huge') { g.moveTo(sh[0] + cw * 0.05, sh[1] + Th * 0.36); g.quadraticCurveTo(sh[0] + cw * 0.45, sh[1] + Th * 0.44, sh[0] + cw * 0.85, sh[1] + Th * 0.33); }
      g.stroke();
      if (pal.top2) { g.fillStyle = pal.top2; g.globalAlpha = 0.9; g.fillRect(sh[0] - cw * 1.2, sh[1] + Th * 0.42, cw * 2.6, Th * 0.12); g.globalAlpha = 1; }
      if (pal.stripe && !pal.coat) { g.fillStyle = pal.stripe; g.fillRect(sh[0] + cw * 0.1, sh[1] - u, Math.max(1, u * 0.35), Th + u * 2); } // zip line
    });
    if (o.cop) clipT(() => { // uniform: chest pockets with flaps, placket and buttons, epaulette
      const R = ramp(top);
      for (const px of [-0.35, 0.45]) { const x = sh[0] + cw * px, y = sh[1] + Th * 0.2; part(g, pathOf(g, [[x - cw * 0.26, y], [x + cw * 0.26, y], [x + cw * 0.24, y + Th * 0.22], [x - cw * 0.24, y + Th * 0.22]]), top, { r: cw * 0.2, rim: false }); g.fillStyle = R.d2; g.fillRect(x - cw * 0.27, y, cw * 0.54, Math.max(1, Th * 0.06)); }
      g.strokeStyle = R.d2; g.lineWidth = Math.max(0.8, u * 0.2); g.beginPath(); g.moveTo(sh[0] + cw * 0.08, sh[1]); g.lineTo(wx + waist * 0.15, hip[1]); g.stroke();
      g.fillStyle = R.h2; for (let k = 0; k < 4; k++) { const t = 0.12 + k * 0.22; g.fillRect(sh[0] + cw * 0.08 + (wx + waist * 0.15 - sh[0] - cw * 0.08) * t + X(0.3), sh[1] + Th * t, X(0.5), X(0.5)); }
    });
    if (pal.vest) clipT(() => { part(g, pathOf(g, [[sh[0] - cw * 0.85, sh[1] + Th * 0.16], [sh[0] - cw * 0.05, sh[1] + Th * 0.12], [sh[0] + cw * 0.55, sh[1] + Th * 0.05], [sh[0] + cw * 1.15, sh[1] + Th * 0.25], [hip[0] + hipw * 1.2, hip[1] - u * 0.6], [hip[0] - hipw * 1.2, hip[1] - u * 0.6]]), pal.vest, { r: cw * 0.6, spec: true });
      g.fillStyle = ink(pal.vest, 0.35); for (const t of [0.42, 0.62]) g.fillRect(sh[0] - cw * 0.3, sh[1] + Th * t, cw * 1.2, Math.max(1, u * 0.3)); });
    if (pal.coat) clipT(() => { part(g, pathOf(g, [[sh[0] - cw * 1.2, sh[1] - u], [sh[0] + cw * 0.02, sh[1] - u * 0.3], [wx - waist * 0.1, hip[1] + u], [hip[0] - hipw * 1.4, hip[1] + u * 2]]), pal.coat, { r: cw * 0.6, spec: true });
      part(g, pathOf(g, [[sh[0] + cw * 0.5, sh[1] - u * 0.4], [sh[0] + cw * 1.3, sh[1]], [hip[0] + hipw * 1.3, hip[1] + u], [wx + waist * 0.5, hip[1] + u]]), pal.coat, { r: cw * 0.4 });
      g.fillStyle = ramp(pal.coat).d2; const lx = sh[0] + cw * 0.2; g.beginPath(); g.moveTo(lx - cw * 0.3, sh[1]); g.lineTo(lx + cw * 0.3, sh[1]); g.lineTo(lx, sh[1] + Th * 0.45); g.closePath(); g.fill(); // lapel V
      if (pal.tie) { part(g, pathOf(g, [[lx - u * 0.5, sh[1] + u * 0.3], [lx + u * 0.5, sh[1] + u * 0.3], [lx + u * 0.8, sh[1] + Th * 0.4], [lx, sh[1] + Th * 0.5], [lx - u * 0.6, sh[1] + Th * 0.4]]), pal.tie, { r: u, rim: false }); } });
    if (pal.chain) { const cc = pal.chain; g.strokeStyle = ink(cc, 0.5); g.lineWidth = Math.max(1.6, u * 0.6); g.beginPath(); g.moveTo(sh[0] - cw * 0.35, sh[1] + u * 0.2); g.quadraticCurveTo(sh[0] + cw * 0.15, sh[1] + Th * 0.45, sh[0] + cw * 0.8, sh[1] + u * 0.2); g.stroke(); g.strokeStyle = cc; g.lineWidth = Math.max(1, u * 0.38); g.setLineDash([Math.max(1, u * 0.5), Math.max(0.6, u * 0.25)]); g.stroke(); g.setLineDash([]);
      const md = [sh[0] + cw * 0.22, sh[1] + Th * 0.3]; part(g, ellS(g, md[0], md[1], u * 1.1, u * 1.2), cc, { r: u, spec: true }); }
    if (o.badge) { const bx = sh[0] + cw * 0.5, by = sh[1] + Th * 0.18, b = u * 1.25; part(g, pathOf(g, [[bx, by - b], [bx + b * 0.9, by - b * 0.45], [bx + b * 0.7, by + b * 0.7], [bx, by + b * 1.05], [bx - b * 0.7, by + b * 0.7], [bx - b * 0.9, by - b * 0.45]]), acc, { r: b, spec: true, rim: false }); g.fillStyle = '#FFF8D0'; g.fillRect(bx - X(0.25), by - X(0.25), X(0.5), X(0.5)); }
    if (pal.belt) { // belt follows the pelvis line; duty belt gets pouches and a holster
      const y0 = hip[1] - u * 0.9, bh = u * 1.5; clipT(() => { part(g, pathOf(g, [[hip[0] - hipw * 1.3, y0], [hip[0] + hipw * 1.3, y0 - u * 0.2], [hip[0] + hipw * 1.3, y0 + bh], [hip[0] - hipw * 1.3, y0 + bh + u * 0.2]]), pal.belt, { r: bh, rim: false }); });
      part(g, pathOf(g, [[hip[0] + hipw * 0.15, y0 - u * 0.15], [hip[0] + hipw * 0.62, y0 - u * 0.2], [hip[0] + hipw * 0.62, y0 + bh], [hip[0] + hipw * 0.15, y0 + bh + u * 0.05]]), pal.buckle || '#F4D27A', { r: u, spec: true, rim: false });
      if (o.cop) { part(g, pathOf(g, [[hip[0] - hipw * 0.95, y0 + u * 0.2], [hip[0] - hipw * 0.35, y0 + u * 0.2], [hip[0] - hipw * 0.4, y0 + bh + u * 1.6], [hip[0] - hipw * 0.9, y0 + bh + u * 1.6]]), '#1C1C24', { r: u, spec: true }); }
    }
    if (o.studs) { g.fillStyle = '#E8ECF8'; for (let k = 0; k < 4; k++) { g.fillRect(sh[0] - cw * 0.7 + k * cw * 0.45, sh[1] + u * 0.4 + (k % 2) * u * 0.3, X(0.5), X(0.5)); } }
    // neck and head
    const hh = u * 7.0 * (build === "huge" ? 1.16 : heavy ? 1.02 : 1) * (o.headK || 1) * (fem ? 0.97 : 1), hwid = hh * (fem ? 0.8 : 0.86) * Math.sqrt((d.hw || 9) / (d.hh || 9));
    const nt = [sh[0] + u * 0.9 + X((ps.hdx || 0) * K), sh[1] - u * 1.9 + X((ps.hdy || 0) * K)];
    const nw = u * (heavy ? 1.9 : fem ? 1.05 : 1.35);
    part(g, pathOf(g, [[sh[0] - nw * 1.2, sh[1] + u * 0.5], [nt[0] - nw * 0.9, nt[1]], [nt[0] + nw * 0.9, nt[1]], [sh[0] + nw * 1.5, sh[1] + u * 0.5]]), pal.skin2 || tint(skin, 0.12), { r: nw });
    const y0 = nt[1] + hh * 0.12 - hh, x0 = nt[0] - hwid * 0.48, w = hwid, h = hh;
    const Q = (a, b) => [x0 + a * w, y0 + b * h];
    const jaw = o.jaw || (heavy ? 'square' : fem ? 'soft' : 'normal');
    const chin = jaw === 'square' ? [Q(1.0, 0.92), Q(0.9, 1.02), Q(0.62, 1.03), Q(0.4, 0.9)] : jaw === 'soft' ? [Q(0.98, 0.86), Q(0.84, 0.97), Q(0.6, 1.0), Q(0.42, 0.86)] : [Q(0.99, 0.88), Q(0.88, 0.99), Q(0.6, 1.02), Q(0.4, 0.88)];
    const headP = pathOf(g, [Q(0.22, 0.95), [...Q(-0.06, 0.75), ...Q(-0.06, 0.1), ...Q(0.45, 0.0)], [...Q(0.82, -0.01), ...Q(1.0, 0.16), ...Q(0.99, 0.4)],
      Q(0.97, 0.5), Q(1.08, 0.64), Q(0.98, 0.69), [...chin[0], ...chin[1]], [...chin[2], ...chin[3]]]);
    if (o.hat === 'long') part(g, pathOf(g, [Q(0.1, 0.05), Q(0.75, -0.05), Q(0.6, 0.6), [...Q(0.4, 1.3), ...Q(0.3, 1.75)], Q(-0.35, 1.7), [...Q(-0.3, 0.9), ...Q(0.1, 0.05)]]), hair, { r: w * 0.5 }); // hair behind the head
    if (o.hat === 'pony' || o.hat === 'cappony') part(g, limbShape(g, Q(0.08, 0.32), Q(-0.32, 0.95), w * 0.2, w * 0.17, w * 0.08, 0.2), hair, { r: w * 0.2 });
    if (o.hat === 'hood') part(g, pathOf(g, [Q(-0.18, 0.95), [...Q(-0.3, 0.1), ...Q(0.35, -0.2)], [...Q(1.0, -0.2), ...Q(1.08, 0.35)], Q(0.95, 0.8), Q(0.55, 1.15), Q(0.0, 1.2)]), hat, { r: w * 0.6, spec: true });
    part(g, headP, skin, { r: w * 0.55, s1: w * 0.2, s2: w * 0.14, spec: true });
    if (o.stone) { g.save(); g.beginPath(); headP(0, 0); g.clip(); g.strokeStyle = ink(skin, 0.5); g.lineWidth = Math.max(0.7, u * 0.18); g.beginPath(); g.moveTo(...Q(0.3, 0.2)); g.lineTo(...Q(0.45, 0.35)); g.lineTo(...Q(0.4, 0.5)); g.moveTo(...Q(0.7, 0.75)); g.lineTo(...Q(0.6, 0.9)); g.stroke(); g.restore(); }
    // ear
    const ea = Q(0.4, 0.55); part(g, ellS(g, ea[0], ea[1], w * 0.1, h * 0.13), tint(skin, 0.06), { r: w * 0.1, rim: false }); g.fillStyle = ramp(skin).d2; g.fillRect(ea[0] - w * 0.02, ea[1] - h * 0.05, w * 0.05, h * 0.09);
    // face
    const ex = x0 + w * 0.76, ey = y0 + h * 0.5, R = ramp(skin);
    g.fillStyle = R.d1; g.beginPath(); g.moveTo(...Q(0.72, 0.62)); g.quadraticCurveTo(...Q(0.8, 0.82), ...Q(0.9, 0.88)); g.lineTo(...Q(0.7, 0.9)); g.closePath(); g.fill(); // cheek plane shadow
    if (o.face === 'shades') { part(g, pathOf(g, [Q(0.6, 0.44), Q(1.02, 0.43), Q(1.0, 0.56), Q(0.86, 0.6), Q(0.66, 0.57)]), '#141420', { r: w * 0.1, spec: true, rim: false }); g.strokeStyle = '#141420'; g.lineWidth = Math.max(0.8, u * 0.25); g.beginPath(); g.moveTo(...Q(0.62, 0.47)); g.lineTo(...Q(0.42, 0.5)); g.stroke(); g.fillStyle = 'rgba(200,240,255,0.8)'; g.fillRect(...Q(0.72, 0.46), w * 0.08, h * 0.03); }
    else if (o.face !== 'visor') {
      const ew = w * 0.13, eh = h * 0.075;
      g.fillStyle = '#F8F4FF'; g.beginPath(); g.ellipse(ex, ey, ew, eh, 0, 0, 7); g.fill();
      g.fillStyle = pal.eye || '#3C2818'; g.fillRect(ex + ew * 0.1, ey - eh, ew * 0.8, eh * 2); g.fillStyle = '#0C0810'; g.fillRect(ex + ew * 0.35, ey - eh * 0.6, ew * 0.45, eh * 1.4);
      g.strokeStyle = ink(skin, 0.7); g.lineWidth = Math.max(0.8, u * 0.22); g.beginPath(); g.moveTo(ex - ew * 1.1, ey - eh * 0.6); g.quadraticCurveTo(ex, ey - eh * 1.5, ex + ew * 1.15, ey - eh * 0.8); g.stroke(); // upper lid
      if (fem) { g.lineWidth = Math.max(0.8, u * 0.3); g.beginPath(); g.moveTo(ex - ew * 1.1, ey - eh * 0.7); g.lineTo(ex - ew * 1.6, ey - eh * 1.5); g.stroke(); }
      const angry = o.face === 'angry'; g.fillStyle = angry ? '#1A1010' : ink(hair, 0.25); g.save(); g.translate(ex, ey - h * 0.1); g.rotate(angry ? 0.32 : fem ? -0.12 : -0.04); g.fillRect(-ew * 1.3, -h * (fem ? 0.018 : 0.03), ew * 2.6, h * (fem ? 0.035 : 0.06)); g.restore(); // brow
      g.fillStyle = '#0C0810'; g.fillRect(x0 + w * 0.97, ey - eh * 0.6, Math.max(0.8, w * 0.04), eh * 1.4); // far eye peeking past the nose bridge
    }
    g.fillStyle = R.d2; g.beginPath(); g.moveTo(...Q(1.06, 0.645)); g.lineTo(...Q(0.97, 0.69)); g.lineTo(...Q(0.92, 0.66)); g.closePath(); g.fill(); // under the nose
    if (!o.mustache && !o.beard) { g.strokeStyle = fem ? (pal.lips || '#C0405C') : ink(skin, 0.55); g.lineWidth = Math.max(0.8, u * (fem ? 0.35 : 0.22)); g.beginPath(); g.moveTo(...Q(0.8, 0.79)); g.quadraticCurveTo(...Q(0.9, o.face === 'angry' ? 0.77 : 0.81), ...Q(0.97, 0.78)); g.stroke(); }
    if (o.mustache) part(g, pathOf(g, [Q(0.74, 0.72), Q(1.0, 0.7), Q(1.02, 0.79), Q(0.88, 0.78), Q(0.72, 0.84)]), hair, { r: w * 0.08, rim: false });
    if (o.beard) part(g, pathOf(g, [Q(0.42, 0.62), Q(0.66, 0.68), Q(0.84, 0.76), Q(1.02, 0.78), Q(0.98, 0.95), Q(0.85, 1.12), Q(0.55, 1.12), Q(0.38, 0.88)]), hair, { r: w * 0.3, spec: true });
    if (o.monocle) { g.strokeStyle = '#F0BC3C'; g.lineWidth = Math.max(0.8, u * 0.3); g.beginPath(); g.arc(ex + w * 0.03, ey, w * 0.16, 0, 7); g.stroke(); g.lineWidth = Math.max(0.6, u * 0.16); g.beginPath(); g.moveTo(ex - w * 0.05, ey + w * 0.15); g.quadraticCurveTo(ex - w * 0.3, ey + h * 0.5, ex - w * 0.5, ey + h * 0.65); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(ex - w * 0.06, ey - w * 0.1, w * 0.05, w * 0.05); }
    // hair and hats
    const hairCap = (front) => part(g, pathOf(g, [Q(front || 0.95, 0.3), [...Q(1.06, 0.05), ...Q(0.75, -0.1), ...Q(0.42, -0.07)], [...Q(-0.1, -0.02), ...Q(-0.12, 0.6), ...Q(0.18, 0.82)],
      Q(0.3, 0.62), Q(0.36, 0.38), Q(0.55, 0.42), [...Q(0.6, 0.22), ...Q(0.78, 0.26)]]), hair, { r: w * 0.4, spec: true });
    const policeCap = () => {
      part(g, pathOf(g, [Q(-0.06, 0.34), Q(-0.14, -0.04), [...Q(0.4, -0.24), ...Q(1.1, -0.12)], Q(1.0, 0.34)]), hat, { r: w * 0.4, spec: true });
      g.fillStyle = '#0E0E16'; g.beginPath(); g.moveTo(...Q(-0.06, 0.2)); g.lineTo(...Q(1.02, 0.2)); g.lineTo(...Q(1.0, 0.34)); g.lineTo(...Q(-0.06, 0.34)); g.closePath(); g.fill();
      part(g, pathOf(g, [Q(0.66, 0.3), Q(1.0, 0.27), [...Q(1.24, 0.3), ...Q(1.3, 0.42)], [...Q(1.0, 0.44), ...Q(0.66, 0.38)]]), '#101018', { r: w * 0.08, spec: true, rim: false });
      const bd = Q(0.84, 0.06); part(g, pathOf(g, [[bd[0], bd[1] - h * 0.1], [bd[0] + w * 0.09, bd[1] - h * 0.03], [bd[0] + w * 0.06, bd[1] + h * 0.08], [bd[0] - w * 0.06, bd[1] + h * 0.08], [bd[0] - w * 0.09, bd[1] - h * 0.03]]), acc, { r: w * 0.08, spec: true, rim: false });
    };
    switch (o.hat) {
      case 'cap': hairCap(); policeCap(); break;
      case 'cappony': hairCap(); policeCap(); break;
      case 'hair': hairCap(); break;
      case 'pony': hairCap(); break;
      case 'bun': hairCap(); part(g, ellS(g, ...Q(0.02, 0.12), w * 0.2, h * 0.17), hair, { r: w * 0.2, spec: true }); break;
      case 'long': hairCap(1.0); part(g, pathOf(g, [Q(0.98, 0.25), Q(1.02, 0.5), Q(0.9, 0.35)]), hair, { r: w * 0.1, rim: false }); break;
      case 'helmet':
        part(g, pathOf(g, [Q(-0.15, 0.62), [...Q(-0.22, -0.05), ...Q(0.45, -0.22)], [...Q(1.12, -0.18), ...Q(1.1, 0.42)], Q(0.6, 0.4), Q(0.5, 0.75), Q(0.15, 0.82)]), hat, { r: w * 0.5, spec: true });
        part(g, pathOf(g, [Q(0.55, 0.36), Q(1.12, 0.34), Q(1.1, 0.58), Q(0.62, 0.6)]), pal.visor || '#A8E4FC', { r: w * 0.12, spec: true, rim: false });
        g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(...Q(0.66, 0.39), w * 0.3, Math.max(0.8, h * 0.035));
        g.fillStyle = acc; g.fillRect(...Q(0.2, 0.15), w * 0.25, Math.max(1, h * 0.06)); break;
      case 'beanie':
        part(g, pathOf(g, [Q(-0.08, 0.36), [...Q(-0.14, -0.2), ...Q(0.5, -0.28)], [...Q(1.08, -0.2), ...Q(1.02, 0.34)]]), hat, { r: w * 0.4, spec: true });
        g.strokeStyle = ink(hat, 0.35); g.lineWidth = Math.max(0.6, u * 0.15); g.beginPath(); for (let k = 1; k < 6; k++) { const a = Q(k / 6, 0.32), b = Q(0.5 + (k / 6 - 0.5) * 0.8, -0.18); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); } g.stroke();
        part(g, pathOf(g, [Q(-0.1, 0.2), Q(1.04, 0.18), Q(1.03, 0.38), Q(-0.09, 0.4)]), pal.hat2 || tint(hat, 0.2), { r: w * 0.1, rim: false }); break;
      case 'hood': part(g, pathOf(g, [Q(0.55, 0.08), [...Q(0.95, 0.0), ...Q(1.05, 0.3)], Q(0.96, 0.32), [...Q(0.85, 0.1), ...Q(0.5, 0.2)], Q(0.4, 0.75), Q(0.3, 0.7)]), hat, { r: w * 0.3, spec: true }); break;
      case 'fedora':
        hairCap();
        part(g, pathOf(g, [Q(0.02, 0.12), [...Q(0.0, -0.32), ...Q(0.5, -0.36)], [...Q(1.0, -0.32), ...Q(0.98, 0.12)]]), hat, { r: w * 0.4, spec: true });
        g.fillStyle = pal.hat2 || '#101018'; g.fillRect(...Q(0.0, 0.02), w * 1.0, h * 0.09);
        part(g, ellS(g, ...Q(0.52, 0.15), w * 0.82, h * 0.08, -0.05), hat, { r: h * 0.08 }); break;
      case 'mohawk': part(g, pathOf(g, [Q(0.15, 0.3), Q(0.25, -0.35), Q(0.55, -0.3), Q(0.8, 0.1), Q(0.6, 0.15)]), hair, { r: w * 0.2, spec: true }); break;
      case 'bandana':
        part(g, pathOf(g, [Q(-0.06, 0.38), [...Q(-0.12, -0.12), ...Q(0.5, -0.14)], [...Q(1.06, -0.1), ...Q(1.0, 0.36)], Q(0.4, 0.32)]), hat, { r: w * 0.4, spec: true });
        part(g, pathOf(g, [Q(0.02, 0.3), Q(-0.4, 0.45), Q(-0.28, 0.62), Q(0.08, 0.42)]), hat, { r: w * 0.12 });
        g.fillStyle = '#FFFFFF'; for (const p2 of [[0.3, 0.05], [0.6, 0.0], [0.82, 0.12]]) g.fillRect(...Q(p2[0], p2[1]), Math.max(1, w * 0.06), Math.max(1, w * 0.06)); break;
      case 'crown':
        hairCap();
        part(g, pathOf(g, [Q(0.05, 0.12), Q(0.0, -0.34), Q(0.22, -0.12), Q(0.36, -0.42), Q(0.52, -0.14), Q(0.68, -0.42), Q(0.82, -0.12), Q(1.02, -0.34), Q(0.98, 0.12)]), '#F0BC3C', { r: w * 0.3, spec: true, rim: false });
        for (const [a, c] of [[0.36, '#E40058'], [0.68, '#3CBCFC']]) part(g, ellS(g, ...Q(a, -0.02), w * 0.07, w * 0.07), c, { r: w * 0.07, spec: true, rim: false }); break;
      case 'bald': g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(...Q(0.42, 0.12), w * 0.16, h * 0.06, -0.35, 0, 7); g.fill(); break;
      default: break;
    }
    if (o.horns) { for (const hx of [0.25, 0.7]) part(g, pathOf(g, [Q(hx - 0.08, 0.05), [...Q(hx - 0.1, -0.35), ...Q(hx + 0.12, -0.42)], Q(hx + 0.1, 0.05)]), o.horns, { r: w * 0.1, spec: true }); }
    // near arm on top
    const armF = arm(sF, ps.armF, false);
    if (o.rigFront) o.rigFront(g, Object.assign(J0, { armF, armB }), { part, limbShape, pathOf, ell: ellS, ramp, tint });
    g.restore();
    return { hx: x0 / S, hy: (y0 - (['cap', 'cappony', 'fedora', 'crown', 'beanie', 'helmet'].includes(o.hat) ? h * 0.3 : 0)) / S, hw: w / S, hh: (h * (['cap', 'cappony', 'fedora', 'crown', 'beanie', 'helmet'].includes(o.hat) ? 1.3 : 1)) / S };
  }
  E.rigHD = rigHD;
  E.HD = { part, shade, seg, ell, poly, rrect, limbShape, pathOf, ramp, ink, tint,
    P(g, shape, col, r, spec, o) { part(g, shape, col, Object.assign({ r: r || 3, spec, lw: 0.5, rimW: Math.max(0.5, (r || 3) * 0.16) }, o || {})); } };
  E.humanHD = function (g, o, S) { return rigHD(g, o, S); };
  E.human = function (p, o) {
    if (o.k && o.k !== 1 && !o._scaled) { // scale the skeleton (dimensions and pose vectors) by o.k
      const K = o.k, sd = {}, sp = {};
      for (const key in o.d) sd[key] = Math.max(1, Math.round(o.d[key] * K));
      for (const key in o.pose) { const v = o.pose[key]; sp[key] = Array.isArray(v) ? v.map(n => Math.round(n * K)) : typeof v === 'number' ? Math.round(v * K) : v; }
      const o1 = Object.assign({}, o, { d: sd, pose: sp, _scaled: true }); E.human(p, o1);
      if (E.RES > 1 && p.g && p.g.canvas) { const c = p.g.canvas; if (!c.hd) c.hd = E.makeCanvas(c.width * E.RES, c.height * E.RES); c.head = E.humanHD(c.hd.getContext('2d'), o, E.RES); }
      return;
    }
    if (!o._scaled && E.RES > 1 && p.g && p.g.canvas) { const c = p.g.canvas; if (!c.hd) c.hd = E.makeCanvas(c.width * E.RES, c.height * E.RES); c.head = E.humanHD(c.hd.getContext('2d'), o, E.RES); }
    const d = o.d, ps = o.pose, pal = o.pal;
    const hip = [o.cx + (ps.hx || 0), o.base - d.leg + (ps.hy || 0)];
    const sh = [hip[0] + (ps.lean || 0), hip[1] - d.torso - Math.round(ps.ty || 0)];
    const limb = (root, seg, w, c1, c2) => {
      const k = [root[0] + seg[0], root[1] + seg[1]], e = [root[0] + seg[2], root[1] + seg[3]];
      p.line(root[0], root[1], k[0], k[1], w, c1); p.line(k[0], k[1], e[0], e[1], w, c2 || c1); return [e, k];
    };
    const hand = (h, col) => { const s = d.hand || 3; p.r(h[0] - (s >> 1), h[1] - (s >> 1), s, s, col); };
    const item = (h, k, kind) => {
      if (!kind) return;
      let dx = h[0] - k[0], dy = h[1] - k[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      if (kind === 'baton') { p.line(h[0], h[1], h[0] + dx * 10, h[1] + dy * 10, 2, '#3C3C3C'); p.px(h[0] + dx * 9, h[1] + dy * 9, '#BCBCBC'); }
      else if (kind === 'knife') { p.line(h[0] + dx * 2, h[1] + dy * 2, h[0] + dx * 6, h[1] + dy * 6, 1, '#FCFCFC'); p.px(h[0] + dx, h[1] + dy, '#7C0800'); }
      else if (kind === 'wrench') { p.line(h[0], h[1], h[0] + dx * 6, h[1] + dy * 6, 2, '#BCBCBC'); p.r(h[0] + dx * 6 - 1, h[1] + dy * 6 - 1, 3, 3, '#BCBCBC'); }
      else if (kind === 'cane') { p.line(h[0], h[1] - 2, h[0] + dx * 12, h[1] + dy * 12, 2, '#402C00'); p.r(h[0] - 1, h[1] - 3, 3, 2, '#F0BC3C'); }
      else if (kind === 'gun') { p.line(h[0], h[1], h[0] + dx * 6, h[1] + dy * 6, 2, '#3C3C3C'); p.px(h[0] + dx * 6, h[1] + dy * 6, '#3CBCFC'); }
    };
    const shB = [sh[0] - 1, sh[1] + 2], shF = [sh[0] + 1, sh[1] + 2];
    // back arm
    const [hb, kb] = limb(shB, ps.armB, d.aw, pal.shirt2 || pal.shirt, pal.sleeve2 || pal.sleeve || pal.shirt2 || pal.shirt);
    if (o.itemB) item(hb, kb, o.itemB);
    hand(hb, pal.glove2 || pal.glove || pal.skin2 || pal.skin);
    // legs
    const [fb] = limb([hip[0] - 2, hip[1]], ps.legB, d.lw, pal.pants2 || pal.pants);
    p.r(fb[0] - 1, fb[1] - 1, d.lw + 1, 2, pal.shoes);
    const [ff] = limb([hip[0] + 2, hip[1]], ps.legF, d.lw, pal.pants);
    p.r(ff[0] - 1, ff[1] - 1, d.lw + 2, 2, pal.shoes);
    // torso
    const th = hip[1] - sh[1];
    for (let y = sh[1]; y <= hip[1]; y++) {
      const t = (y - sh[1]) / th, cx = Math.round(sh[0] + (hip[0] - sh[0]) * t), w = d.tw - (t > 0.75 ? 1 : 0);
      p.r(cx - (w >> 1), y, w, 1, pal.shirt);
      if (pal.shirt2) p.px(cx - (w >> 1), y, pal.shirt2);
      if (pal.coat && t > 0.15) { p.px(cx - (w >> 1) + 1, y, pal.coat); }
    }
    if (pal.coat) { // long coat tail
      for (let y = hip[1]; y < hip[1] + Math.round(d.leg * 0.55); y++) p.r(hip[0] - (d.tw >> 1) - 1, y, 4, 1, pal.coat);
    }
    if (pal.vest) p.r(sh[0] - (d.tw >> 1) + 2, sh[1] + 2, d.tw - 4, th - 3, pal.vest);
    if (pal.belt) p.r(hip[0] - (d.tw >> 1), hip[1] - 1, d.tw, 2, pal.belt);
    if (pal.chain) p.r(sh[0] - 2, sh[1] + 2, 5, 1, pal.chain);
    if (o.badge) p.r(sh[0] + 1, sh[1] + 3, 2, 2, pal.accent || '#F0BC3C');
    if (o.extra) o.extra(p, { hip, sh });
    // head
    const hw = d.hw, hh = d.hh, hx = sh[0] + (ps.hdx || 0) - (hw >> 1), hy = sh[1] - hh + 1 + (ps.hdy || 0);
    p.r(hx + 2, hy + hh - 1, hw - 4, 2, pal.skin2 || pal.skin); // neck
    p.r(hx, hy, hw, hh, pal.skin);
    const hair = pal.hair || '#402C00', hat = pal.hat || '#24188C';
    switch (o.hat) {
      case 'cap': p.r(hx, hy, 3, 5, hair); p.r(hx - 1, hy - 3, hw + 1, 4, hat); p.r(hx + hw - 2, hy + 1, 4, 1, '#000000'); p.r(hx + hw - 4, hy - 2, 2, 2, pal.accent || '#F0BC3C'); break;
      case 'helmet': p.r(hx - 1, hy - 2, hw + 2, 5, hat); p.r(hx - 1, hy + 3, 3, 3, hat); p.r(hx + hw - 4, hy + 2, 4, 2, pal.visor || '#A8E4FC'); break;
      case 'beanie': p.r(hx, hy - 3, hw, 4, hat); p.r(hx, hy, hw, 1, pal.hat2 || hat); p.r(hx, hy + 1, 2, 3, hair); break;
      case 'hood': p.r(hx - 2, hy - 2, hw + 2, hh + 1, hat); p.r(hx + 2, hy + 1, hw - 2, hh - 2, pal.skin); break;
      case 'hair': p.r(hx, hy - 1, hw, 3, hair); p.r(hx, hy, 3, 5, hair); break;
      case 'cappony': p.r(hx - 3, hy + 1, 3, 6, hair); p.r(hx, hy, 3, 5, hair); p.r(hx - 1, hy - 3, hw + 1, 4, hat); p.r(hx + hw - 2, hy + 1, 4, 1, '#000000'); p.r(hx + hw - 4, hy - 2, 2, 2, pal.accent || '#F0BC3C'); break;
      case 'pony': p.r(hx, hy - 1, hw, 3, hair); p.r(hx, hy, 3, 4, hair); p.r(hx - 3, hy + 1, 3, 6, hair); break;
      case 'bun': p.r(hx, hy - 1, hw, 3, hair); p.r(hx, hy, 3, 5, hair); p.r(hx - 2, hy - 1, 3, 3, hair); break;
      case 'long': p.r(hx, hy - 1, hw, 3, hair); p.r(hx - 1, hy, 4, hh + 3, hair); break;
      case 'fedora': p.r(hx - 2, hy, hw + 4, 1, hat); p.r(hx, hy - 3, hw, 3, hat); p.r(hx, hy - 1, hw, 1, pal.hat2 || '#000000'); p.r(hx, hy + 1, 2, 3, hair); break;
      case 'mohawk': p.r(hx + 2, hy - 3, 4, 4, hair); break;
      case 'bandana': p.r(hx, hy - 1, hw, 3, hat); p.r(hx - 2, hy, 2, 3, hat); break;
      case 'crown': p.r(hx, hy - 1, hw, 2, hair); p.r(hx, hy - 4, hw, 3, '#F0BC3C'); p.px(hx, hy - 5, '#F0BC3C'); p.px(hx + (hw >> 1), hy - 5, '#F0BC3C'); p.px(hx + hw - 1, hy - 5, '#F0BC3C'); p.px(hx + (hw >> 1), hy - 3, '#E40058'); break;
      case 'bald': p.px(hx + 2, hy + 1, '#FCFCFC'); break;
      default: break;
    }
    // face
    const ex = hx + hw - 3, ey = hy + Math.round(hh * 0.45);
    if (o.face === 'shades') p.r(ex - 2, ey, 5, 2, '#000000');
    else if (o.face === 'visor') { /* helmet visor covers */ }
    else { p.r(ex, ey, 1, 2, '#000000'); }
    if (o.face === 'angry') p.r(ex - 1, ey - 1, 3, 1, '#000000');
    if (o.mustache) p.r(hx + hw - 4, hy + hh - 3, 4, 1, hair);
    if (o.beard) p.r(hx + 2, hy + hh - 3, hw - 2, 3, hair);
    if (o.monocle) { p.px(ex - 1, ey - 1, '#F0BC3C'); p.px(ex + 1, ey - 1, '#F0BC3C'); p.px(ex - 1, ey + 2, '#F0BC3C'); p.px(ex + 1, ey + 2, '#F0BC3C'); }
    // front arm
    const [hf, kf] = limb(shF, ps.armF, d.aw, pal.shirt, pal.sleeve || pal.shirt);
    if (o.item) item(hf, kf, o.item);
    hand(hf, pal.glove || pal.skin);
  };
  // Trim helper: compute opaque bbox, set anchor bottom-center of bbox
  E.finishAuto = function (c) {
    const d = E.pixels(c).data;
    let x0 = c.width, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return E.finish(c, Math.round((x0 + x1) / 2), y1);
  };
})();
