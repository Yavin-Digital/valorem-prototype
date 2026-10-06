// Hold the Span: a soldiers-vs-horde squad lane runner.
import * as THREE from './vendor/three.module.min.js';
import { soldierGeos, leaderGeos, zombieGeos, buildBoss, buildTank, rocketGeo, boulderGeo, coneGeo, beaconPoleGeo, beaconLampGeo,
  wreckGeo, gantryGeo, girderGeo, railGeo, lampGeo, rbox, part, merge, HIP_X, HIP_Y, MUZZLE, SKIN_TONES, CLOTH_TONES, RUNNER_CLOTH } from './models.js';
import { Post, makeEnvironment } from './fx.js';
import { LEVELS, endlessCycle, mulberry32 } from './levels.js';
import { Sfx } from './audio.js';
import { EMBED, resolveBackHref, difficultyFor, LEADER, ADS, AD_KINDS } from './config.js';

// ---------------------------------------------------------------- params
const Q = new URLSearchParams(location.search);
const DBG = {
  level: Q.get('level'),
  god: Q.get('god') === '1',
  skip: Q.get('skip') || '',
  squad: parseInt(Q.get('squad'), 10) || 0,
  horde: parseInt(Q.get('horde'), 10) || 0,
  bot: Q.get('bot') === '1',
  ts: Math.max(1, Math.min(8, parseFloat(Q.get('timescale')) || 1)),
  upg: Q.get('upg'),
  hz: Q.get('hz'),
  q: Q.get('q') === null ? null : parseInt(Q.get('q'), 10),
  ady: parseFloat(Q.get('ady')) || 0, adx: parseFloat(Q.get('adx')) || 0,
};
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = mqReduce.matches;
if (mqReduce.addEventListener) mqReduce.addEventListener('change', (e) => { reduceMotion = e.matches; });

// ---------------------------------------------------------------- save data
const SAVE_KEY = 'holdthespan.v1';
const defaults = () => ({ unlocked: 1, stars: {}, best: {}, points: 0, upg: { fire: 0, dmg: 0, squad: 0 }, endlessBest: 0, sound: false });
function loadSave() {
  try { const s = Object.assign(defaults(), JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); s.upg = Object.assign(defaults().upg, s.upg); return s; }
  catch (e) { return defaults(); }
}
let save = loadSave();
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* storage unavailable */ } };
if (DBG.upg) { const [f, d, s] = DBG.upg.split(',').map((v) => parseInt(v, 10) || 0); save.upg = { fire: f, dmg: d, squad: s }; }

const UPGRADES = [
  { key: 'fire', name: 'Fire rate', desc: '+12% shots per second', cost: [300, 650, 1100, 1700, 2500] },
  { key: 'dmg', name: 'Damage', desc: '+20% damage per shot', cost: [350, 700, 1200, 1800, 2700] },
  { key: 'squad', name: 'Recruits', desc: '+2 soldiers join the leader at the start', cost: [250, 550, 950, 1500, 2200] },
];
const fireMul = () => 1 + 0.12 * save.upg.fire;
const dmgMul = () => 1 + 0.2 * save.upg.dmg;
// Every run starts with the leader alone; the Recruits upgrade adds soldiers who form up around them a moment later.
const startRecruits = () => 2 * save.upg.squad;
let recruitsPending = 0;

// ---------------------------------------------------------------- constants
const CH = 40, NCH = 9, CPC = 72, BPC = 6;
const MAX_SOLDIERS = 200, MAX_Z = 420, MAX_DEAD = 260;
const RANGE = 48, BULLET_SPEED = 120, BASE_FIRE = 0.27;
const ZHP = [3, 2, 9], ZSCORE = [10, 15, 30];
const UP = new THREE.Vector3(0, 1, 0);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
let rnd = Math.random;

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById('game');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
} catch (e) {
  document.body.insertAdjacentHTML('beforeend', '<p class="noscript">WebGL is not available on this device.</p>');
  throw e;
}
const MAX_PR = Math.min(window.devicePixelRatio || 1, 2);
let pr = MAX_PR;
renderer.setPixelRatio(pr);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
// Quality tier: 2 = bloom + soft shadows, 1 = bloom only, 0 = neither. Steps down if the frame rate can't hold.
const COARSE = window.matchMedia('(pointer: coarse)').matches;
let quality = 2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const post = new Post(renderer);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1, 0.5, 440);
const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 1.2);
const sun = new THREE.DirectionalLight(0xffffff, 2.6);
sun.position.set(12, 26, 10);
// Soft shadows only from big shapes (boss, tanks, wrecks, gantries, containers, towers) on a tight box that
// follows the camera; the crowds use soft blob shadows, which cost nothing.
sun.castShadow = true;
sun.shadow.mapSize.set(COARSE ? 1024 : 2048, COARSE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 40, bottom: -40, near: 1, far: 120 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
scene.add(hemi, sun, sun.target);
scene.fog = new THREE.Fog(0xd6e7f5, 70, 270);
function setQuality(q) {
  quality = q;
  post.enabled = q >= 1;
  if (sun.castShadow !== (q >= 2)) sun.castShadow = q >= 2;
}
// Phones start without the soft shadow pass (blob shadows still ground every unit); desktops get everything.
setQuality(DBG.q !== null && !isNaN(DBG.q) ? clamp(DBG.q, 0, 2) : (COARSE ? 1 : 2));

const THEMES = {
  day: { exp: 1.0, bloom: 0.55, bloomT: 1.8, top: '#4f93dc', bot: '#d9e8f4', fog: '#d9e8f4', sky: '#eaf4ff', ground: '#56606c', hemiI: 2.0, sunC: '#fff4e2', sunI: 2.4, win: 0.05, water: '#2f6286', bld: ['#9fb1c4', '#b7c3cf', '#8597ab', '#cfd6de', '#7a8ca0'] },
  dusk: { exp: 1.0, bloom: 0.8, top: '#2b3776', bot: '#f2a26b', fog: '#dc9c7a', sky: '#ffd4b2', ground: '#3d3550', hemiI: 1.8, sunC: '#ffb07a', sunI: 2.1, win: 0.6, water: '#3b3f66', bld: ['#6d6a86', '#857d96', '#5b5a75', '#9a8ea5', '#4f5068'] },
  night: { exp: 1.15, bloom: 1.1, top: '#050918', bot: '#1d2b52', fog: '#18244a', sky: '#b4c4ff', ground: '#343b55', hemiI: 2.25, road: '#2a2e36', sunC: '#c2d0ff', sunI: 1.2, win: 1.1, water: '#0d1630', bld: ['#3a4560', '#46526e', '#2f3850', '#525d78', '#283046'] },
  storm: { exp: 1.05, bloom: 0.7, bloomT: 1.5, top: '#3a4450', bot: '#8e9aa6', fog: '#8e9aa6', sky: '#dbe3ec', ground: '#3a424c', hemiI: 1.8, sunC: '#e6eef7', sunI: 1.5, win: 0.35, water: '#3a4a58', bld: ['#717d89', '#87929d', '#5f6a75', '#9aa4ae', '#56606a'] },
  ember: { exp: 1.0, bloom: 0.9, top: '#24112e', bot: '#ff8a4c', fog: '#c8664a', sky: '#ffc6a0', ground: '#3a2228', hemiI: 1.7, sunC: '#ff9c6a', sunI: 2.1, win: 0.75, water: '#4a2a3a', bld: ['#5c4250', '#70505c', '#4a3442', '#835e66', '#3e2c38'] },
};

// ---------------------------------------------------------------- textures
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
// Normal map from a canvas height field (grey = height).
function normalFromHeight(w, h, draw, strength = 2) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const src = g.getImageData(0, 0, w, h).data, out = g.createImageData(w, h), d = out.data;
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
  return t;
}
const roadTex = canvasTex(512, 1024, (g, w, h) => {
  g.fillStyle = '#4a4f58'; g.fillRect(0, 0, w, h);
  const r = mulberry32(5);
  for (let i = 0; i < 14000; i++) { const v = r(); g.fillStyle = v < 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.08)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(r() * (w - 120), r() * h, 60 + r() * 80, 40 + r() * 120); }
  for (const lx of [-4, 0, 4]) { const u = (lx + 6) / 12 * w; g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(u - 52, 0, 26, h); g.fillRect(u + 26, 0, 26, h); }
  g.strokeStyle = 'rgba(15,17,20,0.55)'; g.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 40; y += r() * 30; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = '#eef1f4'; g.fillRect(12, 0, 10, h); g.fillRect(w - 22, 0, 10, h);
  g.fillStyle = '#f2c230';
  for (const lx of [-2, 2]) { const u = (lx + 6) / 12 * w; for (let y = 0; y < h; y += 256) g.fillRect(u - 5, y + 40, 10, 140); }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(w * 0.8, h * 0.4, 18, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(w * 0.8, h * 0.4, 18, 0, 7); g.stroke();
});
roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
// Shipping container atlas: side (ribbed + decal) | door end (doors, lock rods, hinges) | roof.
const CONT_W = 512, CONT_H = 256;
function containerPaint(g, w, h, heightOnly) {
  const side = w / 2, door = w / 4;
  g.fillStyle = heightOnly ? '#808080' : '#e2e2e2'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < side; x += 12) {
    const gr = g.createLinearGradient(x, 0, x + 12, 0);
    if (heightOnly) { gr.addColorStop(0, '#606060'); gr.addColorStop(0.5, '#d0d0d0'); gr.addColorStop(1, '#606060'); }
    else { gr.addColorStop(0, '#b8b8b8'); gr.addColorStop(0.5, '#f4f4f4'); gr.addColorStop(1, '#bcbcbc'); }
    g.fillStyle = gr; g.fillRect(x, 10, 12, h - 20);
  }
  g.fillStyle = heightOnly ? '#a0a0a0' : '#9a9a9a'; g.fillRect(0, 0, side, 10); g.fillRect(0, h - 10, side, 10);
  if (!heightOnly) {
    g.fillStyle = 'rgba(30,30,34,0.78)'; g.font = '900 44px "Segoe UI", system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText('YAVIN LINES', side / 2, h / 2 + 8);
    g.font = '700 16px "Segoe UI", system-ui, sans-serif'; g.fillText('YVNU 482193 4  22G1', side / 2, h / 2 + 34);
    g.beginPath(); g.moveTo(side / 2 - 150, h / 2 - 30); g.lineTo(side / 2 - 120, h / 2 - 58); g.lineTo(side / 2 - 90, h / 2 - 30); g.closePath(); g.fill();
    g.fillStyle = 'rgba(80,60,40,0.18)'; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * side, h - 30 + Math.random() * 18, 3 + Math.random() * 8, 2 + Math.random() * 10);
  }
  // door end
  const dx = side;
  g.fillStyle = heightOnly ? '#909090' : '#d8d8d8'; g.fillRect(dx, 0, door, h);
  g.fillStyle = heightOnly ? '#404040' : '#6a6a6a'; g.fillRect(dx + door / 2 - 1, 8, 2, h - 16);
  g.fillRect(dx + 4, 8, 3, h - 16); g.fillRect(dx + door - 7, 8, 3, h - 16);
  for (const fx of [0.18, 0.36, 0.64, 0.82]) {
    g.fillStyle = heightOnly ? '#e0e0e0' : '#5a5f66'; g.fillRect(dx + door * fx - 3, 12, 6, h - 24);
    g.fillStyle = heightOnly ? '#f0f0f0' : '#3a3d42'; g.fillRect(dx + door * fx - 5, h * 0.55, 10, 14);
  }
  for (const hy of [0.15, 0.5, 0.85]) { g.fillStyle = heightOnly ? '#d0d0d0' : '#55595f'; g.fillRect(dx + 2, h * hy - 6, 9, 12); g.fillRect(dx + door - 11, h * hy - 6, 9, 12); }
  if (!heightOnly) { g.fillStyle = '#f2f2f2'; g.fillRect(dx + door * 0.6, h * 0.22, 30, 20); g.fillStyle = '#333'; g.font = '700 9px sans-serif'; g.fillText('MAX 30480', dx + door * 0.6 + 15, h * 0.22 + 13); }
  // roof
  const rx = side + door;
  g.fillStyle = heightOnly ? '#888' : '#cfcfcf'; g.fillRect(rx, 0, door, h);
  for (let y = 0; y < h; y += 16) { g.fillStyle = heightOnly ? '#a8a8a8' : '#bdbdbd'; g.fillRect(rx, y, door, 6); }
}
const containerTex = canvasTex(CONT_W, CONT_H, (g, w, h) => containerPaint(g, w, h, false));
const containerNormal = normalFromHeight(CONT_W, CONT_H, (g, w, h) => containerPaint(g, w, h, true), 3);
function containerGeometry() {
  const geo = new THREE.BoxGeometry(2.5, 2.6, 6.1);
  const uv = geo.attributes.uv;
  // face order: +x, -x, +y, -y, +z, -z (4 vertices each)
  const regions = [[0, 0.5], [0, 0.5], [0.75, 1], [0.75, 1], [0.5, 0.75], [0.5, 0.75]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k, [u0, u1] = regions[f];
    uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
  }
  return geo;
}
const facadeTex = canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) { g.fillStyle = '#cfd3d8'; g.fillRect(0, y + 13, w, 3); }
  g.fillStyle = '#58626f';
  for (let y = 4; y < h - 6; y += 16) for (let x = 6; x < w - 6; x += 14) g.fillRect(x, y, 9, 9);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (let y = 4; y < h - 6; y += 16) for (let x = 6; x < w - 6; x += 14) g.fillRect(x, y, 9, 2);
});
const windowTex = canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const r = mulberry32(9);
  for (let y = 4; y < h - 6; y += 16) for (let x = 6; x < w - 6; x += 14) if (r() < 0.42) {
    g.fillStyle = r() < 0.7 ? `rgb(255,${200 + Math.floor(r() * 40)},${130 + Math.floor(r() * 50)})` : '#bfe0ff';
    g.fillRect(x, y, 9, 9);
  }
});
const blobTex = canvasTex(64, 64, (g, w, h) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, false);
const glowTex = canvasTex(64, 64, (g, w, h) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, false);
const flashTex = canvasTex(64, 64, (g, w, h) => {
  g.translate(32, 32);
  for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 4); const gr = g.createLinearGradient(-32, 0, 32, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-32, -2 + (i % 2), 64, 4 - (i % 2) * 2); }
  const c = g.createRadialGradient(0, 0, 0, 0, 0, 14); c.addColorStop(0, 'rgba(255,255,255,1)'); c.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = c; g.fillRect(-16, -16, 32, 32);
}, false);
const stripeTex = canvasTex(128, 32, (g, w, h) => {
  g.fillStyle = '#f2c230'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#16181c';
  for (let x = -h; x < w + h; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 16 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); }
});
stripeTex.wrapS = THREE.RepeatWrapping;
// Deck hole: cracked rim, broken rebar and a long drop to dark water.
const holeTex = canvasTex(256, 256, (g, w, h) => {
  const r = mulberry32(17), pts = [];
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, rr = 0.36 + r() * 0.1; pts.push([0.5 + Math.cos(a) * rr * 1.25, 0.5 + Math.sin(a) * rr]); }
  const path = (k) => { g.beginPath(); pts.forEach(([x, y], i) => { const X = (0.5 + (x - 0.5) * k) * w, Y = (0.5 + (y - 0.5) * k) * h; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); };
  path(1.18); g.fillStyle = '#5a5f66'; g.fill();
  path(1.06); g.fillStyle = '#3a3d42'; g.fill();
  path(1.0); const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.45); gr.addColorStop(0, '#0d2233'); gr.addColorStop(0.6, '#05090d'); gr.addColorStop(1, '#020304'); g.fillStyle = gr; g.fill();
  g.strokeStyle = '#7a5a40'; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) { const [x, y] = pts[Math.floor(r() * pts.length)]; g.beginPath(); g.moveTo(x * w, y * h); g.lineTo((x + (0.5 - x) * 0.35) * w, (y + (0.5 - y) * 0.35 + 0.04) * h); g.stroke(); }
  g.strokeStyle = 'rgba(20,20,22,0.8)'; g.lineWidth = 2;
  for (let i = 0; i < 10; i++) { const [x, y] = pts[i * 2]; g.beginPath(); g.moveTo(x * w, y * h); g.lineTo((x + (x - 0.5) * 0.5) * w, (y + (y - 0.5) * 0.5) * h); g.stroke(); }
});
// Distant skyline ring: R = building silhouette, G = lit windows.
const skylineTex = canvasTex(2048, 256, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const r = mulberry32(31);
  for (let layer = 0; layer < 2; layer++) {
    let x = 0;
    while (x < w) {
      const bw = 18 + r() * 60, bh = (layer ? 40 : 70) + r() * (layer ? 90 : 150);
      g.fillStyle = layer ? 'rgb(255,0,0)' : 'rgb(170,0,0)';
      g.fillRect(x, h - bh, bw, bh);
      if (r() < 0.3) g.fillRect(x + bw * 0.4, h - bh - 18, 3, 18);
      g.fillStyle = 'rgb(255,255,0)';
      for (let yy = h - bh + 6; yy < h - 4; yy += 7) for (let xx = x + 3; xx < x + bw - 3; xx += 6) if (r() < 0.22) g.fillRect(xx, yy, 2, 3);
      x += bw + (layer ? 2 : 6);
    }
  }
}, false);
const labelCache = new Map();
const isGood = (op) => op[0] === '+' || op[0] === 'x';
function opText(op) {
  const v = op.slice(1);
  return op[0] === '+' ? '+' + v : op[0] === '-' ? '\u2212' + v : op[0] === 'x' ? '\u00d7' + v : '\u00f7' + v;
}
// Endless keeps inventing new gate values; drop labels no live row uses so textures stay bounded.
// Called before a new row is built, so nothing being built can be evicted.
function pruneLabels() {
  if (labelCache.size < 40) return;
  const inUse = new Set();
  for (const r of gateRows) for (const sl of r.slots) if (sl.op) inUse.add(sl.op);
  for (const [k, t] of labelCache) if (!inUse.has(k)) { t.dispose(); labelCache.delete(k); }
}
// Big, heavy gate numbers: white with a thick coloured outline and a soft glow.
function labelTex(op) {
  if (labelCache.has(op)) return labelCache.get(op);
  const good = isGood(op);
  const t = canvasTex(512, 256, (g, w, h) => {
    g.font = '900 176px "Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = good ? 'rgba(90,180,255,1)' : 'rgba(255,80,96,1)'; g.shadowBlur = 34;
    g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = good ? '#0a2a66' : '#5c0a16';
    g.strokeText(opText(op), w / 2, h / 2 + 8);
    g.shadowBlur = 0;
    const gr = g.createLinearGradient(0, h * 0.2, 0, h * 0.85);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, good ? '#d4ecff' : '#ffe0e4');
    g.fillStyle = gr; g.fillText(opText(op), w / 2, h / 2 + 8);
  });
  labelCache.set(op, t);
  return t;
}

// ---------------------------------------------------------------- environment
const zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _ml = new THREE.Matrix4();
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();

// Unit material: PBR with vertex colour, per-vertex emissive (aEmit) and, for zombies, per-instance skin and
// cloth colours (aMask x/y). The fade variant dissolves (noise discard with an ember edge) for deaths.
const unitMatEnv = () => (theme === THEMES.night ? 0.5 : 0.8);
function makeUnitMat({ mask = false, fade = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.66, metalness: 0.06 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aEmit; attribute vec2 aMask; varying float vEmit;
        ${mask ? 'attribute vec3 iSkin; attribute vec3 iCloth;' : ''}
        ${fade ? 'attribute float aAlpha; varying float vAlpha; varying vec3 vObj;' : ''}`)
      .replace('#include <color_vertex>', `
        vColor = vec3(1.0);
        vec3 baseC = color;
        ${mask ? 'baseC = mix(baseC, iSkin, aMask.x); baseC = mix(baseC, iCloth, aMask.y);' : ''}
        vColor *= baseC;
        #ifdef USE_INSTANCING_COLOR
          vColor *= instanceColor.xyz;
        #endif
        vEmit = aEmit;
        ${fade ? 'vAlpha = aAlpha; vObj = position;' : ''}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vEmit;
        ${fade ? 'varying float vAlpha; varying vec3 vObj;' : ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * vEmit;
        ${fade ? `float nz = fract(sin(dot(floor(vObj * 24.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        if (nz > vAlpha) discard;
        if (vAlpha < 0.999 && nz > vAlpha - 0.14) totalEmissiveRadiance += vec3(2.4, 1.2, 0.35);` : ''}`);
  };
  m.customProgramCacheKey = () => `unit-${mask}-${fade}`;
  return m;
}
const propMat = makeUnitMat();

const roadGeo = new THREE.PlaneGeometry(12, CH).rotateX(-Math.PI / 2);
const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.88, metalness: 0.0 });
// Suspension bridge: a tower pair every other chunk with main cables that sag to mid-span, vertical
// suspenders, side walkways, a steel truss under the deck edge and a concrete deck. Two variants
// (tower chunk and mid-span chunk) so the cable curve is continuous.
const TOWER_X = 16.6, TOWER_H = 52, SAG_LOW = 9;
function cableY(u) { return SAG_LOW + (TOWER_H - 2 - SAG_LOW) * u * u; } // u = distance from mid-span / half-span
function bridgeGeo(towerChunk) {
  const parts = [];
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.BoxGeometry(9.2, 0.25, CH), '#8a9098', side * 10.6, -0.12, 0));
    parts.push(part(new THREE.BoxGeometry(0.6, 0.35, CH), '#c9ced4', side * 6.45, 0.17, 0));
    parts.push(part(new THREE.BoxGeometry(0.5, 1.2, CH), '#9aa0a7', side * 15.3, 0.45, 0));
    parts.push(part(new THREE.BoxGeometry(0.3, 2.6, CH), '#4f5864', side * 15.6, -1.9, 0));
    for (let z = -CH / 2; z < CH / 2; z += 4) {
      parts.push(part(new THREE.BoxGeometry(0.25, 3.2, 0.25), '#5b6573', side * 15.6, -1.9, z + 1, 0.75, 0, 0));
      parts.push(part(new THREE.BoxGeometry(0.25, 3.2, 0.25), '#5b6573', side * 15.6, -1.9, z + 3, -0.75, 0, 0));
    }
    // cable: chunk spans z in [-CH/2, CH/2]; tower chunk has the tower at +CH/2 (near end), mid-span at -CH/2
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const z = CH / 2 - (i / 16) * CH;
      const u = towerChunk ? 1 - i / 16 : i / 16;
      pts.push(new THREE.Vector3(side * TOWER_X, cableY(u), z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    parts.push(part(new THREE.TubeGeometry(curve, 24, 0.32, 6, false), '#c43c2c', 0, 0, 0));
    for (let z = CH / 2 - 4; z > -CH / 2; z -= 4) {
      const u = towerChunk ? (z + CH / 2) / CH : (CH / 2 - z) / CH;
      const y = cableY(u);
      parts.push(part(new THREE.CylinderGeometry(0.05, 0.05, y - 1.0, 4), '#d9dde2', side * TOWER_X, (y + 1.0) / 2, z));
    }
    if (towerChunk) {
      const z0 = CH / 2 - 1.5;
      for (const dx of [-1.6, 1.6]) {
        parts.push(part(rbox(1.8, TOWER_H + 18, 2.6, 0.25, 1), '#b5392b', side * TOWER_X + dx, TOWER_H / 2 - 9, z0));
        parts.push(part(rbox(2.0, 1.2, 2.8, 0.1, 1), '#8d2b20', side * TOWER_X + dx, TOWER_H + 0.2, z0));
      }
      for (const y of [14, 30, 44]) parts.push(part(rbox(4.6, 1.6, 2.2, 0.2, 1), '#a3342a', side * TOWER_X, y, z0));
      parts.push(part(new THREE.SphereGeometry(0.35, 8, 6), '#ff3b30', side * TOWER_X, TOWER_H + 1.4, z0, 0, 0, 0, 1, 1, 1, { emit: 4 }));
      parts.push(part(new THREE.BoxGeometry(6.5, 14, 4.2), '#646b74', side * TOWER_X, -9, z0));
    }
  }
  parts.push(part(new THREE.BoxGeometry(33, 1.4, CH), '#6f757c', 0, -0.9, 0));
  parts.push(part(new THREE.BoxGeometry(22, 1.4, 2.6), '#5a6068', 0, -2.2, 0));
  return merge(parts);
}
const bridgeGeos = [bridgeGeo(true), bridgeGeo(false)];
const staticMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.15 });
const containerGeo = containerGeometry();
const containerMat = new THREE.MeshStandardMaterial({ map: containerTex, normalMap: containerNormal, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.62, metalness: 0.35 });
const containers = new THREE.InstancedMesh(containerGeo, containerMat, NCH * CPC);
containers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
containers.frustumCulled = false; containers.castShadow = true; containers.receiveShadow = true;
scene.add(containers);
const bldMat = new THREE.MeshStandardMaterial({ map: facadeTex, emissive: 0xffe1a8, emissiveMap: windowTex, emissiveIntensity: 0.1, roughness: 0.7, metalness: 0.2 });
const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), bldMat, NCH * BPC);
buildings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
buildings.frustumCulled = false;
scene.add(buildings);
// rooftop plant: water tanks / plant rooms with blinking red aircraft lights
const roofGeo = merge([
  part(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 8), '#6b5a48', 0.2, 0.15, 0.2),
  part(new THREE.BoxGeometry(0.35, 0.18, 0.3), '#7d858f', -0.22, 0.09, -0.15),
  part(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 4), '#333', -0.3, 0.3, 0.3),
  part(new THREE.SphereGeometry(0.03, 6, 4), '#ff2a2a', -0.3, 0.62, 0.3, 0, 0, 0, 1, 1, 1, { emit: 6 }),
]);
const roofs = new THREE.InstancedMesh(roofGeo, null, NCH * BPC);
roofs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); roofs.frustumCulled = false;
// Railings and street lamps are instanced so hazard sections can break the railing.
const RAIL_N = 16, LAMP_N = 2;
const rails = new THREE.InstancedMesh(railGeo(), null, NCH * RAIL_N * 2);
rails.instanceMatrix.setUsage(THREE.DynamicDrawUsage); rails.frustumCulled = false;
const lamps = new THREE.InstancedMesh(lampGeo(), null, NCH * LAMP_N * 2);
for (const m of [roofs, rails, lamps]) { m.material = propMat; scene.add(m); }
rails.castShadow = true;
lamps.instanceMatrix.setUsage(THREE.DynamicDrawUsage); lamps.frustumCulled = false;
// skyline ring that follows the camera
const skylineMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, fog: false,
  uniforms: { tex: { value: skylineTex }, silA: { value: new THREE.Color() }, silB: { value: new THREE.Color() }, win: { value: 0.5 }, haze: { value: new THREE.Color() } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tex; uniform vec3 silA, silB, haze; uniform float win; varying vec2 vUv;
    void main() {
      vec4 t = texture2D(tex, vec2(vUv.x * 3.0, vUv.y));
      if (t.r < 0.05) discard;
      vec3 c = mix(silB, silA, step(0.8, t.r));
      c = mix(c, haze, 0.35 + (1.0 - vUv.y) * 0.25);
      c += vec3(1.0, 0.82, 0.55) * t.g * win * 2.2;
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
});
const skyline = new THREE.Mesh(new THREE.CylinderGeometry(380, 380, 150, 48, 1, true), skylineMat);
skyline.position.y = 40; skyline.renderOrder = -1;
scene.add(skyline);
const waterMat = new THREE.MeshStandardMaterial({ color: 0x2f6286, roughness: 0.18, metalness: 0.2 });
const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400).rotateX(-Math.PI / 2), waterMat);
water.position.y = -17;
scene.add(water);
const CONTAINER_COLORS = ['#d9572b', '#b8322f', '#2e8b7a', '#e3b23c', '#7d8a96', '#5c6f3a', '#e6e1d6', '#9c4a2a', '#3f7f6e', '#2f5d9e'].map((c) => new THREE.Color(c));
let theme = THEMES.day;
let envSeed = 1;
const tankSlots = []; // inner-row container slots cleared to make room for tank platforms
const railGaps = [];  // {side, z0, z1} railing removed for rail-gap hazards

const chunks = [];
for (let i = 0; i < NCH; i++) {
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.receiveShadow = true;
  const stat = new THREE.Mesh(bridgeGeos[0], staticMat);
  stat.receiveShadow = true; stat.castShadow = true;
  scene.add(road, stat);
  chunks.push({ i, k: 0, road, stat });
}
function layoutChunk(ch) {
  const z0 = -ch.k * CH;
  const zc = z0 - CH / 2;
  ch.road.position.set(0, 0, zc);
  ch.stat.position.set(0, 0, zc);
  ch.stat.geometry = bridgeGeos[((ch.k % 2) + 2) % 2];
  const r = mulberry32((envSeed * 7919 + (ch.k + 1000) * 104729) >>> 0);
  let idx = ch.i * CPC;
  for (const side of [-1, 1]) {
    for (let row = 0; row < 2; row++) {
      const x = side * (8.1 + row * 2.75);
      for (let k = 0; k < 6; k++) {
        const zz = z0 - 3.4 - k * 6.5;
        let h = row === 0 ? 1 + (r() < 0.4 ? 1 : 0) : 1 + Math.floor(r() * 3);
        if (r() < 0.12) h = 0;
        if (row === 0 && tankSlots.some((t) => t.side === side && Math.abs(t.z - zz) < 5)) h = 0;
        if (railGaps.some((g) => g.side === side && zz < g.z1 + 4 && zz > g.z0 - 4)) h = 0;
        if (billboards.length && adSlotAt(side, zz)) h = 0;
        for (let j = 0; j < 3; j++) {
          if (j < h) {
            _q.setFromAxisAngle(UP, (r() - 0.5) * 0.06 + (r() < 0.5 ? Math.PI : 0));
            _m.compose(_p.set(x + (r() - 0.5) * 0.2, 1.3 + j * 2.6, zz + (r() - 0.5) * 0.3), _q, _s.set(1, 1, 1));
            containers.setMatrixAt(idx, _m);
            containers.setColorAt(idx, CONTAINER_COLORS[Math.floor(r() * CONTAINER_COLORS.length)]);
          } else containers.setMatrixAt(idx, zeroM);
          idx++;
        }
      }
    }
  }
  let ri = ch.i * RAIL_N * 2;
  for (const side of [-1, 1]) {
    for (let k = 0; k < RAIL_N; k++) {
      const zz = z0 - 1.25 - k * 2.5;
      const gap = railGaps.find((g) => g.side === side && zz <= g.z1 && zz >= g.z0);
      if (gap) {
        // broken ends lean outward; the middle of the gap is open
        const edge = zz > gap.z1 - 2.5 || zz < gap.z0 + 2.5;
        if (edge) { _q.setFromEuler(_e.set(0, 0, side * 0.6)); _m.compose(_p.set(side * 6.55, -0.1, zz), _q, _s.set(1, 1, 0.6)); rails.setMatrixAt(ri++, _m); }
        else rails.setMatrixAt(ri++, zeroM);
        continue;
      }
      _m.makeTranslation(side * 6.55, 0.0, zz); rails.setMatrixAt(ri++, _m);
    }
  }
  let li = ch.i * LAMP_N * 2;
  for (const side of [-1, 1]) for (let k = 0; k < LAMP_N; k++) {
    const zz = z0 - 10 - k * 20;
    _q.setFromAxisAngle(UP, side > 0 ? 0 : Math.PI);
    if (billboards.length && adSlotAt(side, zz)) { lamps.setMatrixAt(li++, zeroM); continue; } // keep lamps out of the sign's sightline
    _m.compose(_p.set(side * 7.3, 0, zz), _q, _s.set(1, 1, 1)); lamps.setMatrixAt(li++, _m);
  }
  let b = ch.i * BPC;
  for (const side of [-1, 1]) {
    for (let n = 0; n < 3; n++) {
      const w = 9 + r() * 8, d = 10 + r() * 6, h = 22 + r() * 46 + n * 10;
      const bx = side * (28 + n * 15 + r() * 6), bz = z0 - 7 - n * 12 - r() * 6;
      _m.compose(_p.set(bx, -17, bz), _q.identity(), _s.set(w, h, d));
      buildings.setMatrixAt(b, _m);
      _c.set(theme.bld[Math.floor(r() * theme.bld.length)]);
      buildings.setColorAt(b, _c);
      _m.compose(_p.set(bx, -17 + h, bz), _q.setFromAxisAngle(UP, r() * 6.28), _s.set(w * 0.8, w * 0.8, d * 0.8));
      roofs.setMatrixAt(b, _m);
      b++;
    }
  }
  for (const m of [containers, rails, lamps, buildings, roofs]) m.instanceMatrix.needsUpdate = true;
  if (containers.instanceColor) containers.instanceColor.needsUpdate = true;
  if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
}
// The deck is a window of NCH chunks that always starts behind the camera (chunk k spans z in
// [-(k+1)*CH, -k*CH]). Any chunk outside the window is re-laid at a missing slot, so the road is under
// and behind the squad on the very first frame no matter where the camera was before.
function chunkWindowStart() {
  const back = Math.max(camera.position.z, squad.z + 10) + 30;
  return Math.floor(-back / CH);
}
function resetChunks() {
  const k0 = chunkWindowStart();
  chunks.forEach((ch, i) => { ch.k = k0 + i; layoutChunk(ch); });
}
function updateChunks() {
  const k0 = chunkWindowStart(), k1 = k0 + NCH - 1;
  let free = null;
  for (const ch of chunks) if (ch.k < k0 || ch.k > k1) (free || (free = [])).push(ch);
  if (!free) return;
  const have = new Set(chunks.map((c) => c.k));
  for (let k = k0; k <= k1 && free.length; k++) if (!have.has(k)) { const ch = free.pop(); ch.k = k; layoutChunk(ch); }
}
function relayoutRange(z0, z1) {
  for (const ch of chunks) if (z1 >= -(ch.k + 1) * CH - 8 && z0 <= -ch.k * CH + 8) layoutChunk(ch);
}
function gradientTex(top, bot) {
  return canvasTex(2, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, top); gr.addColorStop(0.6, bot); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
  });
}
function applyTheme(name) {
  theme = THEMES[name] || THEMES.day;
  if (scene.background && scene.background.dispose) scene.background.dispose();
  scene.background = gradientTex(theme.top, theme.bot);
  scene.environment = makeEnvironment(renderer, name, theme.top, theme.bot, theme.ground, theme.sunC);
  scene.fog.color.set(theme.fog);
  hemi.color.set(theme.sky); hemi.groundColor.set(theme.ground); hemi.intensity = theme.hemiI * 0.6;
  sun.color.set(theme.sunC); sun.intensity = theme.sunI * 1.1;
  bldMat.emissiveIntensity = theme.win * 1.6;
  waterMat.color.set(theme.water);
  roadMat.emissive.set(theme.road || '#000000');
  renderer.toneMappingExposure = theme.exp;
  post.strength = theme.bloom; post.threshold = theme.bloomT || 1.2;
  skylineMat.uniforms.silA.value.set(theme.bld[2]).multiplyScalar(0.55);
  skylineMat.uniforms.silB.value.set(theme.bld[4]).multiplyScalar(0.75);
  skylineMat.uniforms.haze.value.set(theme.fog);
  skylineMat.uniforms.win.value = Math.min(1, theme.win);
  propMat.envMapIntensity = unitMatEnv();
}

// ---------------------------------------------------------------- instanced unit renderers
// Each unit type is three instanced meshes (body + two legs pivoting at the hip) per level of detail.
const WHITE = new THREE.Color(1, 1, 1);
class UnitRenderer {
  constructor(lods, max, { fade = false, mask = false } = {}) {
    this.max = max; this.fade = fade; this.mask = mask;
    const mat = makeUnitMat({ mask, fade });
    this.sets = lods.map((geos) => {
      const mk = (g, withMask) => {
        const geo = g.clone();
        const mesh = new THREE.InstancedMesh(geo, mat, max);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.frustumCulled = false; mesh.count = 0;
        const attr = (name, size) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * size).fill(1), size); a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, a); return a; };
        if (fade) mesh.userData.alpha = attr('aAlpha', 1);
        if (mask) {
          // legs share the body's per-instance colours through their own copies
          mesh.userData.skin = attr('iSkin', 3); mesh.userData.cloth = attr('iCloth', 3);
        }
        mesh.setColorAt(0, WHITE); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
        scene.add(mesh);
        return mesh;
      };
      const set = { body: mk(geos.body), legL: mk(geos.leg), legR: mk(geos.leg), n: 0 };
      set.meshes = [set.body, set.legL, set.legR];
      return set;
    });
  }
  begin() { for (const s of this.sets) s.n = 0; }
  // roll is the side-to-side lean; swingL/swingR are leg angles (radians) about the hip.
  push(lod, x, y, z, yaw, pitch, roll, scale, swingL, swingR, r, g, b, alpha = 1, skin, cloth) {
    const set = this.sets[Math.min(lod, this.sets.length - 1)];
    if (set.n >= this.max) return;
    const i = set.n++;
    _e.set(pitch, yaw, roll, 'YXZ');
    _q.setFromEuler(_e);
    _m.compose(_p.set(x, y, z), _q, _s.set(scale, scale, scale));
    set.body.setMatrixAt(i, _m);
    _ml.makeRotationX(swingL); _ml.setPosition(HIP_X, HIP_Y, 0);
    _m2.multiplyMatrices(_m, _ml); set.legL.setMatrixAt(i, _m2);
    _ml.makeRotationX(swingR); _ml.setPosition(-HIP_X, HIP_Y, 0);
    _m2.multiplyMatrices(_m, _ml); set.legR.setMatrixAt(i, _m2);
    _c.setRGB(r, g, b);
    for (const m of set.meshes) {
      m.setColorAt(i, _c);
      if (this.fade) m.userData.alpha.array[i] = alpha;
      if (this.mask) { m.userData.skin.setXYZ(i, skin.r, skin.g, skin.b); m.userData.cloth.setXYZ(i, cloth.r, cloth.g, cloth.b); }
    }
  }
  end() {
    for (const set of this.sets) for (const m of set.meshes) {
      m.count = set.n; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
      if (this.fade) m.userData.alpha.needsUpdate = true;
      if (this.mask) { m.userData.skin.needsUpdate = true; m.userData.cloth.needsUpdate = true; }
    }
  }
  get count() { return this.sets.reduce((a, s) => a + s.n, 0); }
}
const sHi = soldierGeos(0), sLo = soldierGeos(1);
const RS = new UnitRenderer([sHi, sLo], MAX_SOLDIERS);
const RL = new UnitRenderer([leaderGeos()], 2);
const RSf = new UnitRenderer([sLo], 160, { fade: true });
const zL = [zombieGeos(false, 0), zombieGeos(false, 1), zombieGeos(false, 2)];
const aL = [zombieGeos(true, 0), zombieGeos(true, 1), zombieGeos(true, 2)];
const RZ = new UnitRenderer(zL, MAX_Z, { mask: true });
const RA = new UnitRenderer(aL, 220, { mask: true });
const RZf = new UnitRenderer([zL[1]], MAX_DEAD, { mask: true, fade: true });
const RAf = new UnitRenderer([aL[1]], 120, { mask: true, fade: true });
const SKIN_C = SKIN_TONES.map((c) => new THREE.Color(c)), CLOTH_C = CLOTH_TONES.map((c) => new THREE.Color(c));
const RUNNER_C = new THREE.Color(RUNNER_CLOTH), ARMOR_CLOTH = new THREE.Color('#4c5560');

class SimpleInst {
  constructor(geo, mat, max) {
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false; this.mesh.count = 0; this.max = max; this.n = 0;
    scene.add(this.mesh);
  }
  begin() { this.n = 0; }
  set(m, color) { if (this.n < this.max) { if (color) this.mesh.setColorAt(this.n, color); this.mesh.setMatrixAt(this.n++, m); } }
  end() { this.mesh.count = this.n; this.mesh.instanceMatrix.needsUpdate = true; if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true; }
}
const additive = (map, hdr = 1) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(hdr, hdr, hdr), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
const shadows = new SimpleInst(new THREE.PlaneGeometry(1.1, 1.1).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, color: 0xffffff }), 900);
shadows.mesh.renderOrder = 1;
// tracers: camera-facing streaks in HDR so they glow
const tracerGeo = new THREE.PlaneGeometry(0.16, 1).rotateX(-Math.PI / 2).translate(0, 0, 0);
const tracers = new SimpleInst(tracerGeo, additive(glowTex, 6), 260);
tracers.mesh.material.color.setRGB(7, 4.6, 1.6);
tracers.mesh.renderOrder = 3;
// muzzle flashes and hit sparks: billboards
const flashes = new SimpleInst(new THREE.PlaneGeometry(1, 1), additive(flashTex, 1), 260);
flashes.mesh.material.color.setRGB(9, 6, 2.5); flashes.mesh.renderOrder = 4;
const sparks = new SimpleInst(new THREE.PlaneGeometry(1, 1), additive(glowTex, 1), 360);
sparks.mesh.material.color.setRGB(8, 5, 2); sparks.mesh.renderOrder = 4;
const sparkList = [], flashList = [];
function addSpark(x, y, z, n = 4, spread = 3) {
  for (let i = 0; i < n && sparkList.length < 360; i++) sparkList.push({ x, y, z, vx: (rnd() - 0.5) * spread, vy: 1 + rnd() * 3, vz: (rnd() - 0.2) * spread, t: 0, life: 0.22 + rnd() * 0.18, s: 0.14 + rnd() * 0.1 });
}
const puffGeo = merge([part(new THREE.IcosahedronGeometry(0.5, 1), '#bfc4c9')]);
const puffMat = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, depthWrite: false, roughness: 1 });
puffMat.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aAlpha;\nvarying float vAlpha;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlpha = aAlpha;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vAlpha;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a *= vAlpha;');
};
puffMat.customProgramCacheKey = () => 'puff';
const puffs = new THREE.InstancedMesh(puffGeo, puffMat, 220);
{
  const a = new THREE.InstancedBufferAttribute(new Float32Array(220), 1); a.setUsage(THREE.DynamicDrawUsage);
  puffGeo.setAttribute('aAlpha', a); puffs.userData.alpha = a;
  puffs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); puffs.frustumCulled = false; puffs.count = 0; puffs.renderOrder = 2;
  puffs.setColorAt(0, WHITE);
  scene.add(puffs);
}
const puffList = [];
function addPuff(x, y, z, size, life, color, vy = 1) {
  if (puffList.length >= 220) return;
  puffList.push({ x, y, z, size, life, t: 0, c: color, vy, vx: (rnd() - 0.5) * 1.5, vz: (rnd() - 0.5) * 1.5 });
}
// explosions: fireball billboard + expanding shock ring
const explMat = additive(glowTex, 1);
explMat.color.setRGB(9, 4.2, 1.2);
const ringTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 40, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }, false);
const ringGeo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
const explPool = [];
for (let i = 0; i < 10; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), explMat.clone());
  const ring = new THREE.Mesh(ringGeo, additive(ringTex, 3));
  m.visible = ring.visible = false; m.renderOrder = ring.renderOrder = 3; scene.add(m, ring);
  explPool.push({ mesh: m, ring, t: 0, life: 0.5, active: false, r: 3, color: null });
}
function shockwave(x, z, radius, color) {
  const e = explPool.find((p) => !p.active);
  if (!e) return;
  e.active = true; e.t = 0; e.r = radius; e.life = 0.55; e.mesh.visible = false; e.ringOnly = true;
  e.ring.position.set(x, 0.08, z); e.ring.visible = true; e.ring.material.color.copy(color);
}

// ---------------------------------------------------------------- game state
const squad = { x: 0, tx: 0, z: 0, speed: 0, targetSpeed: 0, rx: 0, rz: 0 };
let soldiers = [], zombies = [], dead = [], shots = [], rockets = [], gateRows = [], tanks = [], events = [], evIdx = 0;
let boss = null;
let dbgFreeze = false;
let hazards = [], fallers = [], billboards = [], boulders = [], hazardLog = [];
let leaderFlash = 0, fallPopN = 0, fallPopT = 0, leaderPromotions = 0;
// While the squad is crossing a hazard the formation holds its shape, so survivors are not pulled into a hole or
// gap when the soldiers ahead of them drop.
let formationHold = false;
let diff = null; // difficulty row for the current level / Endless cycle (config.js)
let state = 'menu'; // menu | play | paused | outro | over | win
let current = null; // level definition (or endless runtime)
let score = 0, earned = 0, peakSquad = 0, simTime = 0, outroT = 0, outroKind = '';
let startZ = 0, bossZ = -1;
let shake = 0, flashA = 0;
const gateLog = [];
const keys = { left: false, right: false };
const sfx = new Sfx();
// Sound preference is remembered (r1 QA L1). The AudioContext is still only created on a user gesture.
sfx.enabled = !!save.sound;
const unlockAudio = () => { sfx.resume(); window.removeEventListener('pointerdown', unlockAudio, true); window.removeEventListener('keydown', unlockAudio, true); };
window.addEventListener('pointerdown', unlockAudio, true);
window.addEventListener('keydown', unlockAudio, true);

// ---------------------------------------------------------------- DOM refs
const $ = (id) => document.getElementById(id);
const ui = {
  hud: $('hud'), level: $('hudLevel'), squad: $('hudSquad'), score: $('hudScore'), prog: $('progFill'),
  bossBar: $('bossBar'), bossFill: $('bossFill'), hint: $('hint'), legal: $('legal'),
  squadTag: $('squadTag'), squadTagNum: $('squadTagNum'), bossTag: $('bossTag'), bossTagNum: $('bossTagNum'),
  pops: $('pops'), flash: $('flash'),
};

// ---------------------------------------------------------------- formation helpers
// Hex packing that grows outward from the leader (slot 0 at the centre): ring r holds 6r slots, so the formation
// widens as the squad grows. Spacing compresses past `compressFrom` so very large squads stay readable.
const HEX = (() => {
  const out = [[0, 0, 0]];
  for (let ring = 1; out.length < MAX_SOLDIERS + 8; ring++) {
    const cells = [];
    for (let q = -ring; q <= ring; q++) for (let r = Math.max(-ring, -q - ring); r <= Math.min(ring, -q + ring); r++) {
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) !== ring) continue;
      const x = q + r / 2, z = r * 0.866;
      // fill a ring flank-first (beside the leader, where the camera can see new recruits), then front, then back,
      // so growth reads as "forming up" around the leader
      const ang = Math.abs(Math.atan2(x, -z));
      cells.push([x, z, ring, Math.abs(ang - Math.PI / 2) + (ang > Math.PI / 2 ? 0.05 : 0)]);
    }
    cells.sort((a, b) => a[3] - b[3] || a[0] - b[0]);
    out.push(...cells.map((c) => [c[0], c[1], c[2]]));
  }
  return out;
})();
const DEFAULT_FORM = { spacing: 0.64, minSpacing: 0.45, compressFrom: 45, maxVisible: 200 };
function formationSpacing(n) {
  const f = (diff && diff.formation) || DEFAULT_FORM;
  if (n <= f.compressFrom) return f.spacing;
  return Math.max(f.minSpacing, f.spacing - (n - f.compressFrom) * (f.spacing - f.minSpacing) / 120);
}
function slotOffset(i, sp, out) { const h = HEX[i]; out[0] = h[0] * sp; out[1] = h[1] * sp * 1.12; return out; }
const _slot = [0, 0];
function updateExtents() {
  const n = Math.max(1, soldiers.length), sp = formationSpacing(n);
  const ring = HEX[n - 1][2];
  squad.rx = ring * sp + 0.3;
  squad.rz = ring * sp * 0.97 + 0.3;
}
function newSoldier(fromX) {
  return { ox: (fromX - squad.x) * 0.6 + (rnd() - 0.5) * 2, oz: -squad.rz - rnd() * 1.5, phase: rnd() * 6.28, fireT: rnd() * 0.3, tint: 0.92 + rnd() * 0.14, flash: 0, leader: false };
}
function addSoldiers(k, fromX) {
  for (let i = 0; i < k && soldiers.length < MAX_SOLDIERS; i++) soldiers.push(newSoldier(fromX));
  if (soldiers.length && !soldiers[0].leader) soldiers[0].leader = true;
  peakSquad = Math.max(peakSquad, soldiers.length);
}
// Remove one soldier by index. The leader (index 0) is replaced by the nearest soldier, who takes the centre.
function removeAt(idx) {
  const n = soldiers.length;
  if (!n) return null;
  const s = soldiers[idx];
  if (idx === 0) {
    if (n === 1) { soldiers.pop(); return s; }
    let best = 1, bd = 1e9;
    const rule = (diff && diff.formation.promote) || LEADER.promote;
    if (rule === 'nearest') for (let j = 1; j < n; j++) { const d = Math.hypot(soldiers[j].ox - s.ox, soldiers[j].oz - s.oz); if (d < bd) { bd = d; best = j; } }
    const heir = soldiers[best];
    soldiers[best] = soldiers[n - 1]; soldiers.pop();
    soldiers[0] = heir; heir.leader = true; heir.flash = LEADER.highlightS;
    leaderFlash = LEADER.highlightS; leaderPromotions++;
    showHint('New leader!', 1200);
    return s;
  }
  soldiers[idx] = soldiers[n - 1]; soldiers.pop();
  return s;
}
function removeSoldiers(k, hitX) {
  for (let i = 0; i < k && soldiers.length; i++) {
    const n = soldiers.length;
    // losses come off the outer rings; never the leader unless it is the last soldier
    let idx = n - 1;
    if (hitX !== undefined && n > 1) {
      const lo = Math.max(1, n - Math.max(1, Math.floor(n * 0.3)));
      let best = 1e9;
      for (let j = lo; j < n; j++) { const d = Math.abs(squad.x + soldiers[j].ox - hitX); if (d < best) { best = d; idx = j; } }
    }
    if (n === 1) idx = 0;
    const s = soldiers[idx];
    addDead('s', clamp(squad.x + s.ox, -6, 6), squad.z + s.oz, 0, idx === 0 ? LEADER.scale : 1, s.tint, s.tint, s.tint);
    removeAt(idx);
  }
  sfx.lose();
}
function addDead(kind, x, z, yaw, scale, r, g, b, skin, cloth, push = 1) {
  if (dead.length >= MAX_DEAD) dead.shift();
  // ragdoll: knocked back with a random tumble, bounces once, then dissolves
  dead.push({ kind, x, z, y: 0, yaw, scale, r, g, b, skin, cloth, t: 0, vx: (rnd() - 0.5) * 3, vz: (kind === 's' ? 2.5 : -4) * push * (0.6 + rnd() * 0.6), vy: 2.5 + rnd() * 2, spin: (rnd() - 0.5) * 8, roll: 0, pitch: 0, rollV: (rnd() - 0.5) * 10, pitchV: (kind === 's' ? -1 : 1) * (5 + rnd() * 5) });
}
// Soldiers knocked or dropped off the bridge: a short fall, then removed.
function dropSoldier(idx, kind, hz) {
  const s = soldiers[idx];
  const wx = squad.x + s.ox, wz = squad.z + s.oz;
  const out = Math.sign(wx) || 1;
  const vx = kind === 'hole' ? 0 : kind === 'sweep' ? hz.dir * 9 : out * (kind === 'wreck' ? 6 : 3.5);
  fallers.push({ x: wx, y: 0, z: wz, vx, vy: kind === 'hole' ? 0 : 3.5, vz: -squad.speed * 0.6, t: 0, rx: 0, rz: 0, rv: (rnd() - 0.5) * 8, leader: idx === 0, tint: s.tint, hole: kind === 'hole' });
  removeAt(idx);
  fallPopN++; fallPopT = 0.35;
  if (hz) hz.lost = (hz.lost || 0) + 1;
}

// ---------------------------------------------------------------- zombies
function spawnZombie(x, z, type, hpMul) {
  if (zombies.length >= MAX_Z) return null;
  const hp = ZHP[type] * hpMul;
  const tint = [1, 1, 1];
  const skin = SKIN_C[Math.floor(rnd() * SKIN_C.length)];
  const cloth = type === 1 ? RUNNER_C : type === 2 ? ARMOR_CLOTH : CLOTH_C[Math.floor(rnd() * CLOTH_C.length)];
  const zb = {
    x, z, type, hp, maxHp: hp, pending: 0, dead: false,
    speed: type === 1 ? 7.2 + rnd() * 1.4 : type === 2 ? 2.8 + rnd() * 0.5 : 3.4 + rnd() * 0.9,
    phase: rnd() * 6.28, ofs: rnd() * 2 - 1, flash: 0,
    scale: (type === 2 ? 1.2 : type === 1 ? 1.02 : 1.08) * (0.95 + rnd() * 0.1),
    tr: tint[0], tg: tint[1], tb: tint[2], skin, cloth, lurch: 0.6 + rnd() * 0.5,
  };
  zombies.push(zb);
  return zb;
}
function spawnHorde(ev) {
  const n = ev.count, cx = ev.x ?? 0, w = ev.w ?? 5.4, mix = ev.mix || {};
  const depth = Math.max(5, n * 0.16);
  const baseZ = squad.z - 64;
  const hpMul = (current && current.hpMul) || 1;
  for (let i = 0; i < n; i++) {
    const r = rnd();
    const type = r < (mix.a || 0) ? 2 : r < (mix.a || 0) + (mix.r || 0) ? 1 : 0;
    spawnZombie(clamp(cx + (rnd() * 2 - 1) * w, -5.7, 5.7), baseZ - rnd() * depth, type, hpMul);
  }
}
function killZombie(zb, scored) {
  if (zb.dead) return;
  zb.dead = true; zb.hp = 0;
  addDead(zb.type === 2 ? 'a' : 'z', zb.x, zb.z, Math.PI, zb.scale, zb.tr, zb.tg, zb.tb, zb.skin, zb.cloth);
  if (scored) { score += ZSCORE[zb.type]; sfx.hit(); addSpark(zb.x, 1.1 * zb.scale, zb.z, 5, 4); }
}

// ---------------------------------------------------------------- gates
// Glass gate panels: tinted glass with bright edges, a sheen band sweeping across and faint scanlines.
// Frames and light bars are HDR so the bloom pass makes them glow.
function glassMat(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { color: { value: new THREE.Color(color) }, time: { value: 0 }, fade: { value: 1 } }]),
    vertexShader: `varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 color; uniform float time, fade; varying vec2 vUv;
      #include <fog_pars_fragment>
      void main() {
        vec2 e = min(vUv, 1.0 - vUv);
        float edge = pow(1.0 - clamp(min(e.x * 3.0, e.y * 2.2) * 2.5, 0.0, 1.0), 3.0);
        float sheen = smoothstep(0.08, 0.0, abs(fract(vUv.x * 0.7 + vUv.y * 0.35 - time * 0.35) - 0.5));
        float scan = 0.06 * step(0.5, fract(vUv.y * 40.0 - time * 2.0));
        float a = (0.22 + edge * 0.55 + sheen * 0.22 + scan) * fade;
        vec3 c = color * (0.55 + edge * 2.6 + sheen * 1.6);
        gl_FragColor = vec4(c, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}
const gateMats = {
  goodPanel: glassMat('#3d9bff'),
  badPanel: glassMat('#ff4256'),
  goodFrame: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 1.1, 2.6) }),
  badFrame: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.55, 0.7) }),
};
const gateGeoCache = new Map();
function gateGeos(w) {
  if (gateGeoCache.has(w)) return gateGeoCache.get(w);
  const g = {
    panel: new THREE.PlaneGeometry(w - 0.3, 3.0),
    frame: merge([
      part(rbox(0.2, 3.5, 0.2, 0.07, 1), '#ffffff', -w / 2 + 0.12, 1.75, 0),
      part(rbox(0.2, 3.5, 0.2, 0.07, 1), '#ffffff', w / 2 - 0.12, 1.75, 0),
      part(rbox(w - 0.05, 0.22, 0.22, 0.08, 1), '#ffffff', 0, 3.42, 0),
      part(rbox(w - 0.05, 0.06, 0.6, 0.03, 1), '#ffffff', 0, 0.03, 0),
    ]),
    label: new THREE.PlaneGeometry(Math.min(4.2, w * 0.9), Math.min(2.1, w * 0.45)),
  };
  gateGeoCache.set(w, g);
  return g;
}
function spawnGateRow(ev) {
  pruneLabels();
  const slots = [];
  const defs = ev.layout === 'pair' ? [[-3, 5.9], [3, 5.9]] : [[-4, 3.95], [0, 3.95], [4, 3.95]];
  ev.ops.forEach((op, i) => {
    const [x, w] = defs[i];
    if (!op) { slots.push({ x, w, op: null, group: null }); return; }
    const good = isGood(op), geos = gateGeos(w);
    const group = new THREE.Group();
    const panelMat = (good ? gateMats.goodPanel : gateMats.badPanel).clone();
    const panel = new THREE.Mesh(geos.panel, panelMat); panel.position.y = 1.65; panel.renderOrder = 1;
    const frame = new THREE.Mesh(geos.frame, good ? gateMats.goodFrame : gateMats.badFrame);
    const lmat = new THREE.MeshBasicMaterial({ map: labelTex(op), transparent: true, depthWrite: false, color: new THREE.Color(1.35, 1.35, 1.35) });
    const label = new THREE.Mesh(geos.label, lmat); label.position.set(0, 1.9, 0.08); label.renderOrder = 2;
    group.add(panel, frame, label);
    group.position.set(x, 0, ev.z);
    scene.add(group);
    slots.push({ x, w, op, group, panelMat, lmat });
  });
  gateRows.push({ z: ev.z, layout: ev.layout, slots, passed: false, t: 0, chosen: -1 });
}
function slotIndexFor(row, x) {
  if (row.layout === 'pair') return x < 0 ? 0 : 1;
  return x < -2 ? 0 : x > 2 ? 2 : 1;
}
function applyOp(op, gx) {
  const n = soldiers.length, v = parseInt(op.slice(1), 10);
  let target = op[0] === '+' ? n + v : op[0] === '-' ? n - v : op[0] === 'x' ? n * v : Math.floor(n / v);
  target = clamp(target, 0, MAX_SOLDIERS);
  const good = isGood(op);
  if (target > n) addSoldiers(target - n, gx);
  else if (target < n) removeSoldiers(n - target);
  gateLog.push({ op, before: n, after: soldiers.length, t: +simTime.toFixed(2) });
  pop(opText(op), good);
  tagState(good ? 'good' : 'bad');
  if (good) sfx.gateGood(); else { sfx.gateBad(); flash(0.28, '#ff3040'); addShake(0.25); }
}
function removeGateRow(row) {
  for (const s of row.slots) if (s.group) { scene.remove(s.group); s.panelMat.dispose(); s.lmat.dispose(); }
}

// ---------------------------------------------------------------- tanks and rockets
const tankContainerMat = new THREE.MeshStandardMaterial({ map: containerTex, normalMap: containerNormal, color: 0x8f9aa5, roughness: 0.6, metalness: 0.35 });
const rGeo = rocketGeo();
const rMat = propMat;
function spawnTank(ev) {
  const t = buildTank(containerGeo, tankContainerMat);
  const x = ev.side * 8.1, z = ev.z - 20;
  t.group.position.set(x, 0, z);
  scene.add(t.group);
  tanks.push({ ...t, x, z, shots: diff ? Math.round(diff.tankShots) : ev.shots, cd: 0.4, recoil: 0 });
  tankSlots.push({ side: ev.side, z });
  for (const ch of chunks) if (z <= -ch.k * CH && z >= -(ch.k + 1) * CH - 6) layoutChunk(ch);
}
function fireRocket(tank, tx, tz) {
  const m = new THREE.Mesh(rGeo, rMat);
  scene.add(m);
  const from = new THREE.Vector3(tank.x, 6.4, tank.z);
  const dist = Math.hypot(tx - tank.x, tz - tank.z);
  rockets.push({ mesh: m, from, tx, tz, t: 0, life: clamp(dist / 34, 0.55, 1.3), arc: 4 + dist * 0.08 });
  tank.recoil = 1;
  sfx.launch();
}
function explode(x, z, radius, dmg) {
  for (const zb of zombies) {
    if (zb.dead) continue;
    const d = Math.hypot(zb.x - x, zb.z - z);
    if (d < radius) { zb.hp -= dmg; zb.flash = 0.1; if (zb.hp <= 0) killZombie(zb, true); }
  }
  if (boss && boss.state !== 'dead' && Math.abs(boss.z - z) < radius + 1.5 && Math.abs(boss.x - x) < radius + boss.halfW) damageBoss(60 * (current.hpMul || 1));
  const e = explPool.find((p) => !p.active);
  if (e) {
    e.active = true; e.t = 0; e.r = radius; e.life = 0.5; e.ringOnly = false;
    e.mesh.position.set(x, 1.2, z); e.mesh.visible = true;
    e.ring.position.set(x, 0.08, z); e.ring.visible = true; e.ring.material.color.setRGB(4, 2.2, 0.8);
  }
  addSpark(x, 0.8, z, 12, 9);
  for (let i = 0; i < 6; i++) addPuff(x + (rnd() - 0.5) * 2, 0.6, z + (rnd() - 0.5) * 2, 1.2 + rnd(), 0.9, 0.35, 2.5);
  addShake(0.35);
  flash(0.12, '#ffb060');
  sfx.explode();
}

// ---------------------------------------------------------------- boss
const boulderMesh = boulderGeo();
const targetRingMat = additive(ringTex, 1);
targetRingMat.color.setRGB(3.2, 0.5, 0.4);
function spawnBoss(ev) {
  const b = buildBoss();
  const scale = ev.scale || 3.2;
  b.group.scale.setScalar(scale);
  b.group.rotation.y = Math.PI;
  const z = squad.z - 54;
  b.group.position.set(0, 0, z);
  scene.add(b.group);
  const B = (diff && diff.boss) || { hp: ev.hp || 500, smash: 2, smashEvery: 1, escorts: 0, escortEvery: 4, throwEvery: 0, throwHit: 0 };
  boss = {
    ...b, x: 0, z, hp: B.hp, maxHp: B.hp, scale, smash: Math.round(B.smash), smashEvery: B.smashEvery,
    escorts: Math.round(B.escorts), escortEvery: B.escortEvery || 4, throwEvery: B.throwEvery, throwHit: Math.round(B.throwHit),
    state: 'roar', t: 0, swing: 0, smashT: 1.2, escortT: 3, throwT: B.throwEvery ? B.throwEvery * 0.6 : 0, throwAnim: 0,
    deadT: 0, flash: 0, flashCd: 0, halfW: 0.95 * scale, gone: false,
  };
  squad.targetSpeed = 2.2;
  ui.bossBar.hidden = false; ui.bossTag.hidden = false;
  lastHud.bhp = -1;
  showHint('A brute is on the bridge', 2200);
  sfx.roar();
}
function damageBoss(d) {
  if (!boss || boss.state === 'dead') return;
  boss.hp -= d;
  if (boss.flashCd <= 0) { boss.flash = 0.05; boss.flashCd = 0.3; }
  if (boss.hp <= 0) {
    boss.hp = 0; boss.state = 'dead'; boss.deadT = 0;
    score += Math.round(boss.maxHp);
    for (const zb of zombies) killZombie(zb, true);
    for (const r of boulders) scene.remove(r.mesh, r.ring);
    boulders.length = 0;
    squad.targetSpeed = 0;
    addShake(0.6);
    sfx.roar();
    outroKind = current.endless ? 'cycle' : 'win';
    state = 'outro'; outroT = 0;
  }
}
// Boulder throw: arcs from the boss's hand to where the squad will be; a red ring on the deck marks the
// landing spot for the whole flight so the player can dodge.
function throwBoulder(b) {
  const lead = squad.speed * 1.1;
  const tx = clamp(squad.x + (rnd() - 0.5) * 2, -5.4, 5.4), tz = squad.z - lead;
  const from = new THREE.Vector3(b.x + 1.2 * b.scale * 0.5, b.scale * 3.4, b.z + 1.2);
  const mesh = new THREE.Mesh(boulderMesh, propMat); mesh.castShadow = true; mesh.scale.setScalar(0.9 + b.scale * 0.12);
  const ring = new THREE.Mesh(ringGeo, targetRingMat); ring.position.set(tx, 0.06, tz); ring.scale.setScalar(2.6); ring.renderOrder = 3;
  scene.add(mesh, ring);
  boulders.push({ mesh, ring, from, tx, tz, t: 0, life: 1.25, arc: 7 });
}
function updateBoss(dt) {
  const b = boss;
  b.t += dt;
  if (b.flash > 0) b.flash -= dt;
  b.flashCd -= dt;
  const f = b.flash > 0 && !reduceMotion;
  b.mat.emissive.setRGB(f ? 0.35 : 0, f ? 0.08 : 0, f ? 0.05 : 0);
  const S = (v) => Math.sin(v);
  if (b.state === 'dead') {
    b.deadT += dt;
    const u = Math.min(1, b.deadT / 1.3);
    b.rig.rotation.x = (1 - Math.pow(1 - u, 3)) * 1.5;
    b.armL.rotation.x = b.armR.rotation.x = -2.6 * u;
    b.elbowL.rotation.x = b.elbowR.rotation.x = -0.4 * u;
    b.group.position.y = -Math.max(0, b.deadT - 1.6) * 2;
    if (b.deadT > 2.8) { scene.remove(b.group); b.gone = true; }
    return;
  }
  const contactDist = squad.rz + b.scale * 0.8;
  if (b.state === 'roar') {
    // arrival: rears up, arms spread, head back
    const u = Math.min(1, b.t / 1.4), k = Math.sin(u * Math.PI);
    b.rig.rotation.x = -0.25 * k;
    b.armL.rotation.z = -1.1 * k; b.armR.rotation.z = 1.1 * k;
    b.elbowL.rotation.x = b.elbowR.rotation.x = -0.9 * k;
    if (u >= 1) { b.state = 'walk'; b.armL.rotation.z = b.armR.rotation.z = 0; }
  } else if (b.state === 'walk') {
    b.z += 3.0 * dt;
    b.swing += dt * 4;
    b.legL.rotation.x = S(b.swing) * 0.5; b.legR.rotation.x = -S(b.swing) * 0.5;
    b.rig.position.y = Math.abs(S(b.swing)) * 0.08;
    b.rig.rotation.z = S(b.swing) * 0.05;
    b.rig.rotation.x = 0.12;
    if (b.throwAnim > 0) {
      // right arm winds back overhead and whips forward on release
      b.throwAnim -= dt;
      const u = 1 - b.throwAnim / 0.7;
      b.armR.rotation.x = u < 0.6 ? -3.0 * (u / 0.6) : -3.0 + (u - 0.6) / 0.4 * 3.6;
      b.elbowR.rotation.x = -0.6;
      if (u >= 0.6 && !b.thrown) { b.thrown = true; throwBoulder(b); sfx.launch(); }
    } else {
      b.armR.rotation.x = S(b.swing) * 0.35 - 0.25; b.elbowR.rotation.x = -0.35;
    }
    b.armL.rotation.x = -S(b.swing) * 0.35 - 0.25; b.elbowL.rotation.x = -0.35;
    b.x += clamp(squad.x * 0.5 - b.x, -0.6 * dt, 0.6 * dt);
    if (b.throwEvery > 0 && state === 'play' && squad.z - b.z > contactDist + 8) {
      b.throwT -= dt;
      if (b.throwT <= 0 && b.throwAnim <= 0) { b.throwT = b.throwEvery; b.throwAnim = 0.7; b.thrown = false; }
    }
    if (squad.z - b.z < contactDist) { b.state = 'smash'; b.smashT = 0.8; squad.targetSpeed = 0; }
  } else if (b.state === 'smash') {
    // two-fisted slam: rear back, raise both fists overhead, then drive them into the deck
    b.z = Math.min(b.z, squad.z - contactDist + 0.2);
    b.smashT -= dt;
    const total = Math.max(0.5, b.smashEvery * 0.8);
    const wind = clamp(1 - b.smashT / total, 0, 1);
    const down = b.smashT <= 0.15;
    const arm = !down ? -0.3 - wind * 2.6 : -0.3 - (b.smashT / 0.15) * 2.9;
    b.armL.rotation.x = b.armR.rotation.x = arm;
    b.elbowL.rotation.x = b.elbowR.rotation.x = down ? -0.1 : -1.1 * wind;
    b.rig.rotation.x = down ? 0.35 : -0.2 * wind;
    b.legL.rotation.x = b.legR.rotation.x = 0;
    if (b.smashT <= 0) {
      b.smashT = total;
      if (!DBG.god) removeSoldiers(b.smash, b.x);
      addShake(0.5); sfx.smash();
      shockwave(b.x, b.z + 1.5 * b.scale * 0.5, 7, new THREE.Color(3, 2, 1.2));
      addSpark(b.x, 0.3, b.z + 2, 10, 8);
      for (let i = 0; i < 6; i++) addPuff(b.x + (rnd() - 0.5) * 3, 0.4, b.z + 2 + rnd() * 2, 1 + rnd(), 0.7, 0.3, 1.5);
    }
  }
  if (b.escorts && state === 'play') {
    b.escortT -= dt;
    if (b.escortT <= 0) {
      b.escortT = b.escortEvery;
      for (let i = 0; i < b.escorts; i++) spawnZombie(clamp(b.x + (rnd() * 2 - 1) * 5, -5.6, 5.6), b.z - 2 - rnd() * 6, rnd() < 0.3 ? 1 : rnd() < 0.3 ? 2 : 0, current.hpMul || 1);
    }
  }
  b.group.position.set(b.x, b.group.position.y, b.z);
}
function updateBoulders(dt) {
  for (let i = boulders.length - 1; i >= 0; i--) {
    const r = boulders[i];
    r.t += dt;
    const u = Math.min(1, r.t / r.life);
    r.mesh.position.set(lerp(r.from.x, r.tx, u), lerp(r.from.y, 0.6, u) + Math.sin(Math.PI * u) * r.arc, lerp(r.from.z, r.tz, u));
    r.mesh.rotation.x += dt * 6; r.mesh.rotation.z += dt * 4;
    r.ring.material.opacity = 0.5 + 0.5 * Math.sin(r.t * 18);
    if (u >= 1) {
      // soldiers inside the ring are lost
      let hit = 0;
      const rad = 2.4;
      const toLose = [];
      for (let j = 0; j < soldiers.length; j++) { const s = soldiers[j]; if (Math.hypot(squad.x + s.ox - r.tx, squad.z + s.oz - r.tz) < rad) toLose.push(j); }
      const cap = boss ? boss.throwHit : 2;
      toLose.sort((a, b2) => b2 - a);
      if (!DBG.god && state === 'play') for (const j of toLose.slice(0, cap)) { const s = soldiers[j]; addDead('s', squad.x + s.ox, squad.z + s.oz, 0, 1, s.tint, s.tint, s.tint); removeAt(j); hit++; }
      if (hit) { pop('\u2212' + hit, false); tagState('bad'); sfx.lose(); }
      shockwave(r.tx, r.tz, 3.2, new THREE.Color(3, 1.6, 0.8));
      addSpark(r.tx, 0.5, r.tz, 10, 7);
      for (let k = 0; k < 5; k++) addPuff(r.tx + (rnd() - 0.5) * 2, 0.5, r.tz + (rnd() - 0.5) * 2, 1 + rnd(), 0.8, 0.4, 2);
      addShake(0.3); sfx.explode();
      scene.remove(r.mesh, r.ring); boulders.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------- level flow
// Difficulty from config.js is applied to the scripted events: spacing scales event times, hordes grow and
// mix in more runners/armored, negative gates hit harder, boss and tank numbers come straight from the row.
function applyDifficulty(list, d) {
  return list.map((ev) => {
    const e = { ...ev, t: ev.t * d.spacing };
    if (e.type === 'horde') {
      e.count = Math.max(1, Math.round(e.count * d.horde));
      const m = e.mix || {};
      e.mix = { r: Math.min(0.5, (m.r || 0) + d.runner), a: Math.min(0.5, (m.a || 0) + d.armor) };
    } else if (e.type === 'gate') {
      e.ops = e.ops.map((op) => (op && op[0] === '-' ? '-' + Math.max(1, Math.round(parseInt(op.slice(1), 10) * d.gate)) : op));
    } else if (e.type === 'tank') e.shots = Math.round(d.tankShots);
    return e;
  });
}
function prepareEvents(list, baseZ, speed) {
  return list.map((ev) => {
    const z = baseZ - ev.t * speed;
    const trig = ev.type === 'gate' ? z + 130 : ev.type === 'tank' ? z + 150 : z;
    return { ...ev, z, trig };
  }).sort((a, b) => b.trig - a.trig);
}

// ---------------------------------------------------------------- hazards
// Rail gaps (outer soldiers spill off the edge), deck holes, burnt-out wrecks and swinging girders. Each is
// telegraphed by flashing beacons, cones and hazard stripes from well before the player reaches it.
const HAZ_AHEAD = 130;
const coneMesh = coneGeo(), poleMesh = beaconPoleGeo(), lampMesh = beaconLampGeo(), wreckMesh = wreckGeo(), gantryMesh = gantryGeo(), girderMesh = girderGeo();
const stripeMat = new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.7, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
const holeMat = new THREE.MeshBasicMaterial({ map: holeTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
const beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 3.4, 0.6) });
const haloMat = additive(glowTex, 1); haloMat.color.setRGB(3, 1.6, 0.3);
const flareMat = additive(glowTex, 1); flareMat.color.setRGB(5, 0.8, 0.5);
function planHazards(d, evs, baseZ, endZ, seed) {
  const H = d.hazards, out = [];
  if (!H || !H.count || DBG.hz === 'none') return out;
  if (DBG.hz) {
    const [type, arg] = DBG.hz.split('@');
    out.push(makeHazard(type, baseZ - 46, parseFloat(arg) || 0, H, mulberry32(seed)));
    return out;
  }
  const r = mulberry32(seed * 31 + 7);
  const gates = evs.filter((e) => e.type === 'gate').map((e) => e.z);
  const first = baseZ - d.speed * 12, last = endZ + 70;
  if (first <= last) return out;
  const span = (first - last) / H.count;
  // Types come from a bag: every type in H.types (including the level's new one) is dealt at least once when
  // count allows; the rest are random. The gentlest type (types[0], the railing gap) always comes first.
  const rest = H.types.slice(1);
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const deck = [H.types[0], ...rest].slice(0, H.count);
  while (deck.length < H.count) deck.splice(1 + Math.floor(r() * deck.length), 0, H.types[Math.floor(r() * H.types.length)]);
  for (let i = 0; i < H.count; i++) {
    let z = first - span * (i + 0.3 + r() * 0.4);
    for (let k = 0; k < 8 && gates.some((g) => Math.abs(g - z) < 20); k++) z -= 9;
    const type = deck[i];
    const side = r() < 0.5 ? -1 : 1;
    out.push(makeHazard(type, z, type === 'railgap' ? side : type === 'hole' ? (r() - 0.5) * 6 : type === 'wreck' ? side * (1.5 + r() * 2.5) : 0, H, r));
  }
  return out;
}
function makeHazard(type, z, a, H, r) {
  const h = { type, z, spawned: false, group: null, lost: 0, tele: {}, markers: [] };
  if (type === 'railgap') { h.side = a >= 0 ? 1 : -1; h.len = H.railGap || 10; h.z0 = z - h.len / 2; h.z1 = z + h.len / 2; }
  else if (type === 'hole') { h.x = clamp(a, -3.2, 3.2); h.w = H.gap || 3; h.d = H.gapDepth || 4; h.z0 = z - h.d / 2; h.z1 = z + h.d / 2; }
  else if (type === 'wreck') { h.x = clamp(a, -4.4, 4.4); h.z0 = z - 2.2; h.z1 = z + 2.2; h.yaw = (r() - 0.5) * 0.5; }
  else { h.type = 'sweeper'; h.speed = H.sweepSpeed || 1.4; h.phase = r() * 6.28; h.z0 = z - 0.8; h.z1 = z + 0.8; }
  return h;
}
function addBeacon(g, x, z, h) {
  const pole = new THREE.Mesh(poleMesh, propMat); pole.position.set(x, 0, z); pole.castShadow = true;
  const lamp = new THREE.Mesh(lampMesh, beaconMat); lamp.position.set(x, 2.6, z);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), haloMat); halo.position.set(x, 2.6, z); halo.renderOrder = 4;
  g.add(pole, lamp, halo);
  h.markers.push(new THREE.Vector3(x, 2.6, z));
  (h.lamps || (h.lamps = [])).push(lamp, halo);
}
function addCones(g, x0, x1, z, step = 1.3) {
  for (let x = x0; x <= x1 + 0.01; x += step) { const c = new THREE.Mesh(coneMesh, propMat); c.position.set(x, 0, z); c.rotation.y = rnd(); g.add(c); }
}
function addStripes(g, x, z, w, d, rot = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), stripeMat);
  m.position.set(x, 0.025, z); m.rotation.y = rot; m.renderOrder = 1;
  stripeMat.map.repeat.set(1, 1);
  g.add(m);
}
function spawnHazard(h) {
  const g = new THREE.Group();
  if (h.type === 'railgap') {
    railGaps.push({ side: h.side, z0: h.z0, z1: h.z1 });
    relayoutRange(h.z0, h.z1);
    const ex = h.side * 5.75;
    addStripes(g, h.side * 6.1, h.z, 0.7, h.len + 2, 0);
    for (let z = h.z1 + 3; z >= h.z0; z -= 2.2) { const c = new THREE.Mesh(coneMesh, propMat); c.position.set(ex - h.side * 0.3, 0, z); g.add(c); }
    addBeacon(g, h.side * 5.3, h.z1 + 4, h); addBeacon(g, h.side * 5.3, h.z0 - 1, h);
  } else if (h.type === 'hole') {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(h.w * 1.3, h.d * 1.3).rotateX(-Math.PI / 2), holeMat);
    m.position.set(h.x, 0.03, h.z); m.renderOrder = 1; g.add(m);
    addStripes(g, h.x, h.z1 + 1.6, h.w + 1.2, 0.8);
    addCones(g, h.x - h.w / 2, h.x + h.w / 2, h.z1 + 2.8, Math.max(0.9, h.w / 3));
    addBeacon(g, h.x - h.w / 2 - 0.6, h.z1 + 1.2, h); addBeacon(g, h.x + h.w / 2 + 0.6, h.z1 + 1.2, h);
  } else if (h.type === 'wreck') {
    const car = new THREE.Mesh(wreckMesh, propMat); car.position.set(h.x, 0, h.z); car.rotation.y = h.yaw; car.castShadow = true; g.add(car);
    addCones(g, h.x - 1.2, h.x + 1.2, h.z1 + 3, 1.2);
    for (const dx of [-1.4, 1.4]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), flareMat); f.position.set(h.x + dx, 0.35, h.z1 + 4.5); f.renderOrder = 4; g.add(f); }
    addBeacon(g, h.x + (h.x > 0 ? -1.6 : 1.6), h.z1 + 2, h);
    h.smokeT = 0;
  } else {
    const gan = new THREE.Mesh(gantryMesh, propMat); gan.position.set(0, 0, h.z); gan.castShadow = true; g.add(gan);
    const pivot = new THREE.Group(); pivot.position.set(0, 7.0, h.z); pivot.scale.set(1, 1.25, 1);
    const gird = new THREE.Mesh(girderMesh, propMat); gird.castShadow = true; pivot.add(gird); g.add(pivot);
    h.pivot = pivot;
    addStripes(g, 0, h.z, 10, 1.6);
    h.markers.push(new THREE.Vector3(-6.7, 7.6, h.z), new THREE.Vector3(6.7, 7.6, h.z));
    addBeacon(g, -5.8, h.z + 3, h); addBeacon(g, 5.8, h.z + 3, h);
  }
  scene.add(g);
  h.group = g; h.spawned = true;
}
function despawnHazard(h) {
  if (h.group) { scene.remove(h.group); h.group.traverse((o) => { if (o.geometry && o.geometry.type === 'PlaneGeometry') o.geometry.dispose(); }); }
  h.group = null;
}
const teleCam = new THREE.PerspectiveCamera();
function sweeperX(h) { return 6.25 * Math.sin(0.75 * Math.sin(simTime * h.speed + h.phase)); }
// Per-soldier collision against hazard volumes. Soldiers that hit one fall off; the leader is replaced.
function updateHazards(dt) {
  const vh = window.innerHeight, vw = window.innerWidth;
  formationHold = false;
  for (const h of hazards) {
    if (!h.spawned && squad.z - h.z1 < HAZ_AHEAD && h.z0 < squad.z + 30) spawnHazard(h);
    if (!h.group) continue;
    // props (stripes, cones, beacons, wreck smoke) are in place from HAZ_AHEAD units out; the beacons switch to
    // fast flashing once contact is telegraphS seconds away
    const ttsB = (squad.z - h.z1) / Math.max(0.1, squad.speed);
    const on = ttsB > diff.hazards.telegraphS || (Math.sin(simTime * 9 + h.z) > 0) || reduceMotion;
    if (h.lamps) for (const l of h.lamps) l.visible = on;
    if (h.type === 'sweeper') h.pivot.rotation.z = Math.asin(clamp(sweeperX(h) / 6.25, -1, 1));
    if (h.type === 'wreck' && (h.smokeT -= dt) <= 0) { h.smokeT = 0.35; addPuff(h.x + (rnd() - 0.5), 1.4, h.z + (rnd() - 0.5) * 2, 0.9, 1.6, 0.18, 1.6); }
    // telegraph audit: is the warning on screen 2 s (and telegraphS) before contact? Measured with the settled
    // follow camera (what the player sees at normal speed), so the result doesn't depend on test time-scaling.
    const tts = (squad.z - h.z1) / Math.max(0.1, squad.speed);
    for (const mark of [2.0, +(diff.hazards.telegraphS || 2).toFixed(2)]) {
      if (h.tele[mark] || tts > mark || tts < 0) continue;
      teleCam.copy(camera);
      desiredCamera(teleCam.position, _v3); teleCam.lookAt(_v3); teleCam.updateMatrixWorld();
      let vis = 0;
      for (const m of h.markers) {
        _proj.copy(m).project(teleCam);
        const sx = (_proj.x * 0.5 + 0.5) * vw, sy = (-_proj.y * 0.5 + 0.5) * vh;
        if (_proj.z < 1 && sx > 0 && sx < vw && sy > hudBottom && sy < vh) vis++;
      }
      h.tele[mark] = { tts: +tts.toFixed(2), dist: +(squad.z - h.z1).toFixed(1), visible: vis, of: h.markers.length };
    }
    if (h.z0 > camera.position.z + 4) { despawnHazard(h); continue; }
    if (state === 'play' && squad.z - squad.rz - 0.6 < h.z1 && squad.z + squad.rz + 0.6 > h.z0) formationHold = true;
    if (state !== 'play' || DBG.god || Math.abs(h.z - squad.z) > 6 + squad.rz) continue;
    let kind = null;
    for (let i = soldiers.length - 1; i >= 0; i--) {
      const s = soldiers[i];
      const wx = squad.x + s.ox, wz = squad.z + s.oz;
      if (wz > h.z1 + 0.3 || wz < h.z0 - 0.3) continue;
      let hit = false;
      if (h.type === 'railgap') hit = h.side * wx > 5.95;
      else if (h.type === 'hole') hit = Math.abs(wx - h.x) < h.w / 2 - 0.15 && Math.abs(wz - h.z) < h.d / 2;
      else if (h.type === 'wreck') hit = Math.abs(wx - h.x) < 1.05 && Math.abs(wz - h.z) < 2.1;
      else { const bx = sweeperX(h); hit = Math.abs(wx - bx) < 1.15 && Math.abs(wz - h.z) < 0.55; h.dir = Math.sign(Math.cos(simTime * h.speed + h.phase)) || 1; }
      if (hit) { kind = h.type === 'sweeper' ? 'sweep' : h.type; dropSoldier(i, kind, h); }
    }
    if (kind) { tagState('bad'); sfx.lose(); addShake(0.12); }
  }
  for (let i = hazards.length - 1; i >= 0; i--) if (hazards[i].spawned && !hazards[i].group && hazards[i].z0 > squad.z + 40) hazards.splice(i, 1);
  if (fallPopT > 0) { fallPopT -= dt; if (fallPopT <= 0 && fallPopN) { pop('\u2212' + fallPopN, false); fallPopN = 0; } }
  for (let i = fallers.length - 1; i >= 0; i--) {
    const f = fallers[i];
    f.t += dt; f.vy -= 22 * dt;
    f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
    if (!f.hole && Math.abs(f.x) < 6.3 && f.y < 0) { f.y = 0; f.vy = Math.abs(f.vy) * 0.2; }
    f.rx += f.rv * dt; f.rz += f.rv * 0.6 * dt;
    if (f.t > 1.4 || f.y < -16) fallers.splice(i, 1);
  }
}

// ---------------------------------------------------------------- billboards
// Ad placements in the city, read from ADS in config.js. One or two per level (two are >= 300 units apart, so
// never both in view); Endless places one per cycle.
function adFallback(ad) {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = ad.bg || '#0d1b3d'; g.fillRect(0, 0, w, h);
    g.fillStyle = ad.accent || '#f2c230'; g.fillRect(0, h - 110, w, 110);
    g.fillStyle = ad.fg || '#fff'; g.textBaseline = 'middle';
    let fs = 110; g.font = `800 ${fs}px system-ui, sans-serif`;
    while (g.measureText(ad.headline || '').width > w - 120 && fs > 40) { fs -= 6; g.font = `800 ${fs}px system-ui, sans-serif`; }
    g.fillText(ad.headline || '', 60, 150);
    g.font = '600 44px system-ui, sans-serif'; g.fillText(ad.sub || '', 60, 280);
  });
}
// One texture and one material per creative, shared by every placement that shows it.
const adMatCache = new Map();
function adMaterial(ad) {
  if (adMatCache.has(ad.id)) return adMatCache.get(ad.id);
  const mat = new THREE.MeshBasicMaterial({ map: adFallback(ad), toneMapped: false });
  if (ad.image) {
    new THREE.TextureLoader().load(ad.image, (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const old = mat.map; mat.map = t; mat.needsUpdate = true; old.dispose();
    }, undefined, () => { /* keep the text fallback */ });
  }
  adMatCache.set(ad.id, mat);
  return mat;
}
for (const ad of ADS) adMaterial(ad); // load creatives up front so the first placement is ready
const adFrameMat = new THREE.MeshStandardMaterial({ color: 0x3a414a, roughness: 0.5, metalness: 0.6 });
const adBldMat = new THREE.MeshStandardMaterial({ map: facadeTex, emissive: 0xffe1a8, emissiveMap: windowTex, emissiveIntensity: 0.3, roughness: 0.7, color: 0x8a96a6 });
const adLampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.4) });
// shared billboard geometry (unit sign scaled per placement)
const AD_GEO = {
  panel: new THREE.PlaneGeometry(1, 0.5),
  frame: new THREE.BoxGeometry(1.04, 0.54, 0.03).translate(0, 0, -0.02),
  lamp: new THREE.BoxGeometry(0.9, 0.012, 0.02).translate(0, 0.27, 0.04),
  post: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
  roofBld: new THREE.BoxGeometry(8.4, 1.3, 6).translate(0, 0.65, 0),
  roofVent: new THREE.BoxGeometry(1.4, 0.7, 1.2).translate(0, 0.35, 0),
  faceBld: new THREE.BoxGeometry(7.6, 8, 7).translate(0, 4, 0),
};
// Placements: 1 or 2 per level from DIFFICULTY.billboards. Two are spread to 28% and 78% of the run (>= 300
// units apart, so never both on screen); if the run is too short for that, only one is placed.
function planBillboards(count, baseZ, endZ, levelIdx) {
  if (!ADS.length || !count) return [];
  const len = baseZ - endZ;
  let fr = count >= 2 ? [0.28, 0.78] : [0.5];
  if (count >= 2 && len * 0.5 < 300) fr = [0.5];
  return fr.map((f, i) => {
    const z = baseZ - len * f;
    let kind = AD_KINDS[(levelIdx + i) % AD_KINDS.length];
    // no overhead gantry over the boss arena
    if (kind === 'overpass' && z - endZ < 110) kind = 'rooftop';
    let side = (levelIdx + i) % 2 ? 1 : -1;
    // keep clear of tank platforms (they use the inner container row)
    if (events.some((e) => e.type === 'tank' && e.side === side && Math.abs(e.z - z) < 60)) side = -side;
    return { z, kind, ad: ADS[(levelIdx + i) % ADS.length], side, group: null, done: false };
  });
}
function adSign(ad, scale) {
  const sign = new THREE.Group();
  sign.add(new THREE.Mesh(AD_GEO.frame, adFrameMat), new THREE.Mesh(AD_GEO.panel, adMaterial(ad)), new THREE.Mesh(AD_GEO.lamp, adLampMat));
  sign.scale.setScalar(scale);
  return sign;
}
function adPost(g, x, y, z, w, h) { const p = new THREE.Mesh(AD_GEO.post, adFrameMat); p.position.set(x, y, z); p.scale.set(w, h, w); p.castShadow = true; g.add(p); }
// Side signs stand on the bridge deck just outside the railing, in a stretch where the container stacks are
// cleared (adSlotAt), facing the oncoming squad. Their inner edge is outside the road (|x| > 6.9), and because
// screen x scales with x / depth, anything on the road beyond a sign projects closer to the screen centre than
// the sign's inner edge, while anything nearer is drawn in front of it: a side sign can never cover the squad,
// gates or hordes. They are kept low (top about 5.3 units) so that in portrait the whole sign is below the HUD
// while it is still far enough away to fit on screen; at 390x844 it reads at about 95-105 CSS px wide.
const AD_SIDE_IN = 7.0, AD_SIDE_SCALE = 8, AD_ANGLE = 0.25, AD_SIDE_Y = 3.6;
const AD_SIDE_X = AD_SIDE_IN + AD_SIDE_SCALE * Math.cos(AD_ANGLE) / 2;
function sidePose(sign, side, z) { sign.position.set(side * (DBG.adx || AD_SIDE_X), DBG.ady || AD_SIDE_Y, z); sign.rotation.y = -side * AD_ANGLE; }
// containers are left out of this window on the sign's side so nothing nearer the camera hides it
function adSlotAt(side, zz) {
  for (const b of billboards) if (b.kind !== 'overpass' && b.side === side && zz > b.z - 9 && zz < b.z + 38) return true;
  return false;
}
function spawnBillboard(b) {
  const g = new THREE.Group();
  let sign;
  if (b.kind === 'overpass') {
    // high sign gantry spanning the bridge, above every camera height (best in landscape / desktop)
    sign = adSign(b.ad, 22); sign.position.set(0, 26.5, b.z); g.add(sign);
    adPost(g, -12.5, 0, b.z, 0.8, 22); adPost(g, 12.5, 0, b.z, 0.8, 22);
    const beam = new THREE.Mesh(AD_GEO.post, adFrameMat); beam.position.set(0, 20.4, b.z); beam.scale.set(26, 0.9, 0.9); g.add(beam);
  } else if (b.kind === 'rooftop') {
    // lit frame on the roof of a low harbour office, with roof vents
    const bx = b.side * (AD_SIDE_IN + 4.4);
    const bld = new THREE.Mesh(AD_GEO.roofBld, adBldMat); bld.position.set(bx, 0, b.z - 3.4); bld.castShadow = true; g.add(bld);
    for (const dx of [-2.6, 2.8]) { const v = new THREE.Mesh(AD_GEO.roofVent, adFrameMat); v.position.set(bx + dx, 1.3, b.z - 5.2); g.add(v); }
    sign = adSign(b.ad, AD_SIDE_SCALE); sidePose(sign, b.side, b.z); g.add(sign);
    for (const dx of [-3, 3]) adPost(g, b.side * (AD_SIDE_X + dx * Math.cos(AD_ANGLE)), 1.3, b.z + b.side * dx * Math.sin(AD_ANGLE) - 0.15, 0.22, 0.75);
  } else {
    // mounted on the front face of a small warehouse block that stands where the stacks were
    const bld = new THREE.Mesh(AD_GEO.faceBld, adBldMat); bld.position.set(b.side * (AD_SIDE_IN + 0.3 + 3.8), 0, b.z - 4.6); bld.castShadow = true; g.add(bld);
    sign = adSign(b.ad, AD_SIDE_SCALE); sidePose(sign, b.side, b.z); g.add(sign);
    for (const dx of [-3, 3]) { const arm = new THREE.Mesh(AD_GEO.post, adFrameMat); arm.position.set(b.side * (AD_SIDE_X + dx * Math.cos(AD_ANGLE)), AD_SIDE_Y - 0.15, b.z - 1.1); arm.scale.set(0.18, 0.3, 1.2); g.add(arm); }
  }
  scene.add(g);
  b.group = g; b.sign = sign;
  b.maxPx = 0; b.coversSquad = false; b.shownWith = 0;
}
// Screen audit (read by the smoke test): biggest on-screen width of each sign in CSS px, whether it ever covered
// the squad, and whether two signs were ever on screen together.
const AD_CORNERS = [[-0.5, -0.25], [0.5, -0.25], [0.5, 0.25], [-0.5, 0.25]].map(([x, y]) => new THREE.Vector3(x, y, 0));
function signRect(b) {
  b.sign.updateMatrixWorld(true);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, front = true;
  for (const c of AD_CORNERS) {
    _proj.copy(c).applyMatrix4(b.sign.matrixWorld).project(camera);
    if (_proj.z > 1) front = false;
    const sx = (_proj.x * 0.5 + 0.5) * window.innerWidth, sy = (-_proj.y * 0.5 + 0.5) * window.innerHeight;
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  }
  return front ? { x0, x1, y0, y1 } : null;
}
function updateBillboards() {
  let onScreen = 0;
  const vw = window.innerWidth, vh = window.innerHeight;
  for (const b of billboards) {
    if (!b.group || !b.sign) continue;
    const r = signRect(b);
    b.lastRect = r ? [Math.round(r.x0), Math.round(r.y0), Math.round(r.x1), Math.round(r.y1)] : null;
    b.visible = !!r && r.x1 > 0 && r.x0 < vw && r.y1 > 0 && r.y0 < vh;
    if (!b.visible) continue;
    onScreen++;
    if (r.x0 >= 0 && r.x1 <= vw && r.y0 >= hudBottom && r.y1 <= vh) b.maxPx = Math.max(b.maxPx, Math.round(r.x1 - r.x0));
    if (tagPos[0] > r.x0 && tagPos[0] < r.x1 && tagPos[1] + 40 > r.y0 && tagPos[1] + 40 < r.y1) b.coversSquad = true;
  }
  if (onScreen > 1) for (const b of billboards) if (b.visible) b.shownWith = onScreen;
  for (const b of billboards) {
    if (!b.group && !b.done && squad.z - b.z < 270) spawnBillboard(b);
    // geometry and materials are shared, so removing a placement disposes nothing
    if (b.group && b.z > camera.position.z + 30) { scene.remove(b.group); b.group = null; b.done = true; }
  }
}

function clearWorld() {
  formationHold = false;
  for (const r of gateRows) removeGateRow(r);
  for (const t of tanks) scene.remove(t.group);
  for (const r of rockets) scene.remove(r.mesh);
  for (const r of boulders) scene.remove(r.mesh, r.ring);
  for (const h of hazards) despawnHazard(h);
  // billboard geometry (AD_GEO) and materials (frame, building, lamp, cached creative) are shared: remove only
  for (const b of billboards) if (b.group) scene.remove(b.group);
  if (boss) scene.remove(boss.group);
  tankSlots.length = 0; railGaps.length = 0;
  gateRows = []; tanks = []; rockets = []; zombies = []; dead = []; shots = []; puffList.length = 0; boss = null;
  hazards = []; fallers = []; billboards = []; boulders = []; sparkList.length = 0; flashList.length = 0;
  fallPopN = 0; fallPopT = 0; leaderFlash = 0; leaderPromotions = 0;
  for (const e of explPool) { e.active = false; e.mesh.visible = false; e.ring.visible = false; }
  ui.bossBar.hidden = true; ui.bossTag.hidden = true;
  ui.pops.textContent = '';
}
function startLevel(id) {
  clearWorld();
  const endless = id === 'E';
  rnd = mulberry32((((endless ? 999 : id) * 2654435761) ^ (Date.now() & 0xffff)) >>> 0);
  diff = difficultyFor(endless ? 'E' : id, 0);
  let script;
  if (endless) {
    script = endlessCycle(0).events;
    current = { id: 'E', endless: true, name: 'Endless', theme: 'night', cycle: 0, seed: 77 };
  } else {
    current = { ...LEVELS[id - 1] };
    script = current.events;
  }
  current.speed = diff.speed; current.hpMul = diff.hp;
  events = prepareEvents(applyDifficulty(script, diff), 0, diff.speed);
  evIdx = 0;
  envSeed = current.seed;
  applyTheme(current.theme);
  squad.x = squad.tx = 0; squad.z = 0; squad.speed = squad.targetSpeed = current.speed;
  soldiers = [];
  updateExtents();
  let n0 = DBG.squad || 1;
  recruitsPending = DBG.squad ? 0 : startRecruits();
  if (DBG.skip === 'boss') {
    const b = events.find((e) => e.type === 'boss');
    events = b ? [{ ...b, z: -6, trig: -6 }] : [];
    if (!DBG.squad) n0 = 40;
  }
  addSoldiers(n0, 0);
  soldiers.forEach((s) => { s.oz = 0; s.ox = 0; });
  const bossEv = events.find((e) => e.type === 'boss');
  startZ = 0; bossZ = bossEv ? bossEv.z : -1000;
  hazards = DBG.skip === 'boss' ? [] : planHazards(diff, events, 0, bossZ, current.seed);
  hazardLog = hazards.slice();
  billboards = DBG.skip === 'boss' ? [] : planBillboards(diff.billboards, 0, bossZ, endless ? 0 : id - 1);
  score = 0; earned = 0; peakSquad = soldiers.length; simTime = 0; shake = 0; acc = 0;
  gateLog.length = 0;
  state = 'play';
  snapCamera();
  resetChunks();
  if (DBG.horde) spawnHorde({ count: DBG.horde, mix: { r: 0.2, a: 0.15 } });
  lastHud = {};
  showScreen(null);
  setLevelLabel(endless ? 'Endless' : `Level ${current.id}`, endless ? 'Wave 1' : current.name);
  showHint(window.matchMedia('(pointer: fine)').matches ? 'Drag, or use Arrow keys or A and D' : 'Drag anywhere to steer', 2600);
  snapCamera();
}
// HUD level label: the prefix ("Level 2") is hidden under 360px so the name fits (r1 QA L6).
function setLevelLabel(prefix, name) {
  ui.level.querySelector('.lvl-prefix').textContent = prefix;
  ui.level.querySelector('.lvl-name').textContent = name;
  ui.level.setAttribute('aria-label', `${prefix} ${name}`);
}
function nextEndlessCycle() {
  current.cycle++;
  diff = difficultyFor('E', current.cycle);
  current.hpMul = diff.hp; current.speed = diff.speed;
  events = prepareEvents(applyDifficulty(endlessCycle(current.cycle).events, diff), squad.z - 4, diff.speed); evIdx = 0;
  const bossEv = events.find((e) => e.type === 'boss');
  startZ = squad.z; bossZ = bossEv.z;
  for (const h of hazards) despawnHazard(h);
  const oldGaps = railGaps.splice(0);
  for (const g of oldGaps) relayoutRange(g.z0, g.z1);
  hazards = planHazards(diff, events, squad.z, bossZ, current.seed + current.cycle * 13);
  hazardLog = hazards.slice();
  billboards = billboards.filter((b) => b.group).concat(planBillboards(diff.billboards, squad.z, bossZ, current.cycle));
  for (const b of billboards) if (!b.group) relayoutRange(b.z - 10, b.z + 40);
  if (boss) scene.remove(boss.group);
  boss = null; ui.bossBar.hidden = true; ui.bossTag.hidden = true;
  squad.targetSpeed = diff.speed;
  setLevelLabel('Endless', `Wave ${current.cycle + 1}`);
  showHint(`Wave ${current.cycle + 1}`, 1600);
  state = 'play';
}
function finishWin() {
  state = 'win';
  const n = soldiers.length;
  const bonus = 250 * current.id + n * 10;
  score += bonus;
  const stars = 1 + (n >= current.stars[0] ? 1 : 0) + (n >= current.stars[1] ? 1 : 0);
  earned = score;
  save.points += earned;
  save.stars[current.id] = Math.max(save.stars[current.id] || 0, stars);
  save.best[current.id] = Math.max(save.best[current.id] || 0, score);
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, current.id + 1));
  persist();
  $('winSquad').textContent = n; $('winScore').textContent = score.toLocaleString(); $('winPts').textContent = '+' + earned.toLocaleString();
  $('winStars').innerHTML = [0, 1, 2].map((i) => starSvg(i < stars)).join('');
  $('winStars').setAttribute('aria-label', `${stars} of 3 stars`);
  $('btnNext').textContent = current.id < LEVELS.length ? 'Next level' : 'Play endless';
  showScreen('scrWin');
  sfx.victory();
}
function finishOver() {
  state = 'over';
  earned = score;
  save.points += earned;
  if (current.endless) save.endlessBest = Math.max(save.endlessBest, score);
  persist();
  $('overScore').textContent = score.toLocaleString();
  $('overProg').textContent = current.endless ? `Wave ${current.cycle + 1}` : Math.round(progress() * 100) + '%';
  $('overProg').previousElementSibling.textContent = current.endless ? 'Reached' : 'Progress';
  $('overPts').textContent = '+' + earned.toLocaleString();
  showScreen('scrOver');
  sfx.gameOver();
}
function progress() { return clamp((startZ - squad.z) / Math.max(1, startZ - bossZ), 0, 1); }

// ---------------------------------------------------------------- simulation
const targetable = [];
function step(dt) {
  simTime += dt;
  if (recruitsPending && simTime > 0.9 && state === 'play') { addSoldiers(recruitsPending, squad.x); pop('+' + recruitsPending, true); recruitsPending = 0; }
  const playing = state === 'play';
  while (playing && evIdx < events.length && squad.z <= events[evIdx].trig) {
    const ev = events[evIdx++];
    if (ev.type === 'gate') spawnGateRow(ev);
    else if (ev.type === 'horde') spawnHorde(ev);
    else if (ev.type === 'tank') spawnTank(ev);
    else if (ev.type === 'boss') spawnBoss(ev);
  }
  if (playing) {
    if (DBG.bot) botSteer();
    if (keys.left) squad.tx -= 13 * dt;
    if (keys.right) squad.tx += 13 * dt;
  }
  updateExtents();
  const lim = Math.max(3.0, 5.7 - squad.rx * 0.5);
  squad.tx = clamp(squad.tx, -lim, lim);
  squad.x += (squad.tx - squad.x) * Math.min(1, dt * 14);
  squad.speed += (squad.targetSpeed - squad.speed) * Math.min(1, dt * 2.2);
  squad.z -= squad.speed * dt;

  // formation: hex rings around the leader, eased so the crowd visibly forms up, swells and shrinks
  const n = soldiers.length, sp = formationSpacing(n), fk = Math.min(1, dt * 6);
  for (let i = 0; i < n; i++) {
    const s = soldiers[i];
    slotOffset(i, sp, _slot);
    if (!formationHold) {
      s.ox += (_slot[0] - s.ox) * fk;
      s.oz += (_slot[1] - s.oz) * fk;
    }
    s.phase += dt * (squad.speed > 0.5 ? 11 : 0);
    if (s.flash > 0) s.flash -= dt;
  }
  if (leaderFlash > 0) leaderFlash -= dt;

  // gates
  for (let i = gateRows.length - 1; i >= 0; i--) {
    const row = gateRows[i];
    if (!row.passed && squad.z <= row.z && playing) {
      row.passed = true;
      const si = slotIndexFor(row, squad.x);
      row.chosen = si;
      const slot = row.slots[si];
      if (slot && slot.op) applyOp(slot.op, slot.x);
    }
    if (row.passed) row.t += dt;
    if (row.z > camera.position.z + 6) { removeGateRow(row); gateRows.splice(i, 1); }
  }

  // zombies
  targetable.length = 0;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zb = zombies[i];
    if (zb.dead) { zombies[i] = zombies[zombies.length - 1]; zombies.pop(); continue; }
    zb.z += zb.speed * dt;
    zb.phase += dt * zb.speed * 2.1;
    if (zb.flash > 0) zb.flash -= dt;
    const dz = squad.z - zb.z;
    if (dz < 26) {
      const tx = squad.x + zb.ofs * Math.min(squad.rx, 3.2);
      const lat = zb.type === 1 ? 5 : 3;
      zb.x += clamp(tx - zb.x, -lat * dt, lat * dt);
    } else zb.x += Math.sin(simTime * 2 + zb.phase) * 0.25 * dt;
    if (soldiers.length > 0 && dz < squad.rz + 0.6 && dz > -squad.rz - 0.6) {
      const ex = (zb.x - squad.x) / (squad.rx + 0.5), ez = dz / (squad.rz + 0.6);
      if (ex * ex + ez * ez < 1) {
        if (!DBG.god && state === 'play') removeSoldiers(zb.type === 2 ? 2 : 1, zb.x);
        killZombie(zb, false);
        addShake(0.08);
        continue;
      }
    }
    if (dz < -10) { zb.dead = true; continue; }
    if (dz > -1 && dz < RANGE + 2) targetable.push(zb);
  }

  // shooting: every soldier fires on its own timer at the nearest zombie in its line
  const ns = soldiers.length;
  if (ns > 0 && (state === 'play' || state === 'outro')) {
    const interval = BASE_FIRE / fireMul();
    const dmg = dmgMul();
    const bossTarget = boss && boss.state !== 'dead' && squad.z - boss.z < RANGE + 8;
    let fired = 0;
    for (let i = 0; i < ns; i++) {
      const s = soldiers[i];
      s.fireT -= dt;
      if (s.fireT > 0) continue;
      s.fireT += interval * (0.85 + rnd() * 0.3);
      const sx = clamp(squad.x + s.ox, -6, 6), sz = squad.z + s.oz;
      let best = null, bestDz = 1e9;
      for (let k = 0; k < targetable.length; k++) {
        const zb = targetable[k];
        if (zb.dead || zb.hp - zb.pending <= 0) continue;
        const dz = sz - zb.z;
        if (dz < -0.5 || dz > RANGE || dz >= bestDz) continue;
        if (Math.abs(zb.x - sx) > 1.0 + dz * 0.05) continue;
        best = zb; bestDz = dz;
      }
      if (flashList.length < 240 && (best || bossTarget)) flashList.push({ x: sx + MUZZLE[0], y: MUZZLE[1] * (i === 0 ? LEADER.scale : 1), z: sz + MUZZLE[2], t: 0, r: rnd() * 6.28 });
      if (best) {
        best.pending += dmg;
        shots.push({ x0: sx + 0.08, y0: 1.13, z0: sz - 0.9, tgt: best, boss: false, miss: false, t: 0, life: Math.max(0.04, bestDz / BULLET_SPEED), dmg });
      } else if (bossTarget && Math.abs(boss.x - sx) < boss.halfW + 1.2 && state === 'play') {
        const bd = sz - boss.z;
        shots.push({ x0: sx + 0.08, y0: 1.13, z0: sz - 0.9, tgt: null, boss: true, miss: false, ox: (rnd() - 0.5) * boss.halfW * 1.4, oy: (0.35 + rnd() * 0.5) * boss.scale * 2.6, t: 0, life: Math.max(0.05, bd / BULLET_SPEED), dmg });
      } else if (rnd() < 0.35) {
        shots.push({ x0: sx + 0.08, y0: 1.13, z0: sz - 0.9, tgt: null, boss: false, miss: true, mx: sx + (rnd() - 0.5), mz: sz - RANGE * 0.8, t: 0, life: (RANGE * 0.8) / BULLET_SPEED, dmg: 0 });
      }
      fired++;
    }
    if (fired) sfx.shot();
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const sh = shots[i];
    sh.t += dt;
    if (sh.t >= sh.life) {
      if (sh.tgt) {
        sh.tgt.pending -= sh.dmg;
        if (!sh.tgt.dead) {
          sh.tgt.hp -= sh.dmg; sh.tgt.flash = 0.07;
          if (sh.tgt.hp <= 0) killZombie(sh.tgt, true);
          else if (rnd() < 0.5) addSpark(sh.tgt.x, 1.1 * sh.tgt.scale, sh.tgt.z + 0.3, 2, 2.5);
        }
      } else if (sh.boss) { damageBoss(sh.dmg); if (boss && rnd() < 0.3) addSpark(boss.x + sh.ox, sh.oy, boss.z + 1.5, 2, 3); }
      shots[i] = shots[shots.length - 1]; shots.pop();
    }
  }

  // tanks
  for (let i = tanks.length - 1; i >= 0; i--) {
    const t = tanks[i];
    t.recoil = Math.max(0, t.recoil - dt * 4);
    if (t.shots > 0 && t.z > squad.z - 58 && t.z < squad.z + 6 && state === 'play') {
      t.cd -= dt;
      let aim = null, aimScore = 1e9;
      for (const zb of zombies) {
        if (zb.dead) continue;
        const dz = squad.z - zb.z;
        if (dz > 8 && dz < 50 && Math.abs(dz - 24) < aimScore) { aim = zb; aimScore = Math.abs(dz - 24); }
      }
      const bossOk = boss && boss.state !== 'dead';
      if (aim) t.turret.rotation.y = Math.atan2(-(aim.x - t.x), -(aim.z - t.z));
      else if (bossOk) t.turret.rotation.y = Math.atan2(-(boss.x - t.x), -(boss.z - t.z));
      if (t.cd <= 0 && (aim || bossOk)) {
        t.cd = 0.85; t.shots--;
        if (aim) {
          const life = clamp(Math.hypot(aim.x - t.x, aim.z - t.z) / 34, 0.55, 1.3);
          fireRocket(t, aim.x, aim.z + aim.speed * life);
        } else fireRocket(t, boss.x, boss.z);
      }
    }
    t.turret.position.z = 0.2 + t.recoil * 0.3;
    if (t.z > camera.position.z + 10) { scene.remove(t.group); tanks.splice(i, 1); }
  }
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.t += dt;
    const u = Math.min(1, r.t / r.life);
    const x = lerp(r.from.x, r.tx, u), z = lerp(r.from.z, r.tz, u), y = lerp(r.from.y, 0.5, u) + Math.sin(Math.PI * u) * r.arc;
    const u2 = Math.min(1, u + 0.02);
    _v1.set(lerp(r.from.x, r.tx, u2), lerp(r.from.y, 0.5, u2) + Math.sin(Math.PI * u2) * r.arc, lerp(r.from.z, r.tz, u2));
    r.mesh.position.set(x, y, z);
    r.mesh.lookAt(_v1); r.mesh.rotateY(Math.PI);
    if (rnd() < 0.6) addPuff(x, y, z, 0.5, 0.5, 0.75, 0.3);
    if (u >= 1) { explode(r.tx, r.tz, 3.6, 12 * (current.hpMul || 1)); scene.remove(r.mesh); rockets.splice(i, 1); }
  }

  if (boss && !boss.gone) updateBoss(dt);
  updateBoulders(dt);
  if (diff) updateHazards(dt);
  updateBillboards();

  for (let i = dead.length - 1; i >= 0; i--) {
    const d = dead[i];
    d.t += dt;
    // ragdoll tumble: thrown back, spins, bounces once on the deck, settles, then dissolves (no gore)
    d.vy -= 18 * dt;
    d.x += d.vx * dt; d.z += d.vz * dt; d.y += d.vy * dt;
    if (d.y < 0) { d.y = 0; d.vy = Math.abs(d.vy) * 0.3; d.vx *= 0.5; d.vz *= 0.5; d.rollV *= 0.4; d.pitchV *= 0.4; }
    d.roll += d.rollV * dt; d.yaw += d.spin * dt * 0.3;
    d.pitch = clamp(d.pitch + d.pitchV * dt, -1.55, 1.55);
    if (d.t > 1.25) dead.splice(i, 1);
  }

  if (state === 'play' && soldiers.length === 0) {
    state = 'outro'; outroKind = 'over'; outroT = 0; squad.targetSpeed = 0;
  }
  if (state === 'outro') {
    outroT += dt;
    if (outroKind === 'over' && outroT > 1.3) finishOver();
    else if (outroKind === 'win' && outroT > 2.4) finishWin();
    else if (outroKind === 'cycle' && outroT > 2.4) nextEndlessCycle();
  }
}

// Soldiers that would be lost if the squad centre were at x when it reaches hazard h.
function hazardLossAt(h, x, tAhead) {
  let lost = 0;
  const bx = h.type === 'sweeper' ? 6.25 * Math.sin(0.75 * Math.sin((simTime + tAhead) * h.speed + h.phase)) : 0;
  for (const s of soldiers) {
    const wx = x + s.ox;
    if (h.type === 'railgap') { if (h.side * wx > 5.75) lost++; }
    else if (h.type === 'hole') { if (Math.abs(wx - h.x) < h.w / 2 + 0.2) lost++; }
    else if (h.type === 'wreck') { if (Math.abs(wx - h.x) < 1.3) lost++; }
    else if (Math.abs(wx - bx) < 1.5) lost++;
  }
  return lost;
}
function botSteer() {
  // Debug autopilot (?bot=1) used by the smoke test to validate level balance (now hazard-aware).
  const n = soldiers.length;
  const lim = Math.max(3.0, 5.7 - squad.rx * 0.5);
  let hz = null;
  for (const h of hazards) { const d = squad.z - squad.rz - h.z1; if (d > -2 * squad.rz - 1 && d < 34 && (!hz || h.z1 > hz.z1)) hz = h; }
  if (hz) {
    const tAhead = Math.max(0, (squad.z - hz.z) / Math.max(1, squad.speed));
    let bestX = squad.tx, bestL = 1e9;
    for (let x = -lim; x <= lim + 1e-6; x += 0.25) {
      const L = hazardLossAt(hz, x, tAhead) + Math.abs(x - squad.x) * 0.02;
      if (L < bestL) { bestL = L; bestX = x; }
    }
    squad.tx = bestX;
    return;
  }
  const val = (op) => (!op ? n : op[0] === '+' ? n + +op.slice(1) : op[0] === '-' ? n - +op.slice(1) : op[0] === 'x' ? n * +op.slice(1) : Math.floor(n / +op.slice(1)));
  let row = null;
  for (const r of gateRows) if (!r.passed && r.z < squad.z && squad.z - r.z < 70 && (!row || r.z > row.z)) row = r;
  if (row) {
    let best = -1e9, bx = 0;
    row.slots.forEach((s) => { const v = val(s.op); if (v > best || (v === best && Math.abs(s.x) < Math.abs(bx))) { best = v; bx = s.x; } });
    squad.tx = bx;
    return;
  }
  let sx = 0, c = 0;
  for (const zb of zombies) { const dz = squad.z - zb.z; if (!zb.dead && dz > 0 && dz < 35) { sx += zb.x; c++; } }
  squad.tx = c ? sx / c : 0;
}

// ---------------------------------------------------------------- visuals
let animT = 0;
const leaderRing = new THREE.Mesh(ringGeo, additive(ringTex, 1));
leaderRing.material.color.setRGB(2.6, 1.9, 0.6); leaderRing.visible = false;
// drawn through the crowd so the gold ring still marks the leader inside a big squad (r2 High)
leaderRing.material.depthTest = false; leaderRing.renderOrder = 5;
scene.add(leaderRing);
// Leader's pennant: a gold standard on a pole above his helmet, tall enough to clear the rows in front of him
// from the game camera at any squad size.
const PENNANT_POLE = 1.7, PENNANT_TOP = 2.05 + PENNANT_POLE;
const pennant = new THREE.Group();
{
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, PENNANT_POLE, 6).translate(0, PENNANT_POLE / 2, 0), new THREE.MeshStandardMaterial({ color: 0x3b2a14, roughness: 0.5, metalness: 0.4 }));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.8, 0.5) }));
  tip.position.y = PENNANT_POLE + 0.05;
  const flagGeo = new THREE.PlaneGeometry(0.95, 0.56, 6, 1).translate(0.475, 0, 0);
  const flag = new THREE.Mesh(flagGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, 0.66, 0.06), side: THREE.DoubleSide }));
  flag.position.y = PENNANT_POLE - 0.32;
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.16).translate(0.475, 0, 0.002), new THREE.MeshBasicMaterial({ color: 0x9e0f1b, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
  stripe.position.y = PENNANT_POLE - 0.32;
  pennant.add(pole, tip, flag, stripe);
  pennant.userData.flag = flag; pennant.userData.stripe = stripe; pennant.userData.base = flagGeo.attributes.position.array.slice();
  pennant.visible = false;
  scene.add(pennant);
}
function updatePennant(x, y, z, sc) {
  pennant.visible = true;
  pennant.position.set(x, y + 2.05 * sc, z); pennant.scale.setScalar(sc / LEADER.scale);
  // flag ripple (6 segments): bend the free end around the pole
  const pos = pennant.userData.flag.geometry.attributes.position, base = pennant.userData.base;
  for (let i = 0; i < pos.count; i++) { const u = base[i * 3] / 0.95; pos.array[i * 3 + 2] = Math.sin(animT * 7 - u * 3) * 0.12 * u; }
  pos.needsUpdate = true;
  pennant.userData.stripe.rotation.y = 0;
  pennant.rotation.y = Math.sin(animT * 1.3) * 0.25 - 0.5;
}
const _camQ = new THREE.Quaternion(), _bill = new THREE.Matrix4(), _dir = new THREE.Vector3(), _side = new THREE.Vector3(), _toCam = new THREE.Vector3();
function billboard(x, y, z, size, rot = 0) {
  _e.set(0, 0, rot); _q.setFromEuler(_e).premultiply(_camQ);
  _bill.compose(_p.set(x, y, z), _q, _s.set(size, size, size));
  return _bill;
}
function renderUnits(dt) {
  animT += dt;
  _camQ.copy(camera.quaternion);
  RS.begin(); RL.begin(); RSf.begin(); RZ.begin(); RZf.begin(); RA.begin(); RAf.begin(); shadows.begin();
  const running = squad.speed > 0.5;
  const cheer = state === 'win' || (state === 'outro' && outroKind !== 'over');
  const camZ = camera.position.z;
  const vis = Math.min(soldiers.length, (diff && diff.formation.maxVisible) || 200);
  const sLod = soldiers.length > 70 ? 1 : 0;
  for (let i = 0; i < vis; i++) {
    const s = soldiers[i];
    const x = clamp(squad.x + s.ox, -6, 6), z = squad.z + s.oz;
    const bob = running ? Math.abs(Math.sin(s.phase)) * 0.09 : cheer ? Math.abs(Math.sin(animT * 6 + i)) * 0.25 : 0;
    const sw = running ? Math.sin(s.phase) * 0.8 : 0;
    const lean = running ? -0.08 : 0;
    if (i === 0) {
      const k = leaderFlash > 0 ? 1 + Math.abs(Math.sin(animT * 14)) * 0.9 : 1;
      // grows a little with the squad so he still stands out in a big hex
      const sc = LEADER.scale * (1 + 0.2 * Math.min(1, soldiers.length / 60)) * (leaderFlash > 0 ? 1 + 0.12 * Math.sin(Math.min(1, leaderFlash) * Math.PI) : 1);
      RL.push(0, x, bob, z, Math.sin(s.phase * 0.5) * 0.05, lean, 0, sc, sw, -sw, k, k, k);
      leaderRing.visible = true;
      leaderRing.position.set(x, 0.05, z);
      leaderRing.scale.setScalar(0.75 + 0.02 * Math.sqrt(soldiers.length) + (leaderFlash > 0 ? (1 - leaderFlash / LEADER.highlightS) * 1.6 : 0.05 * Math.sin(animT * 4)));
      updatePennant(x, bob, z, sc);
    } else RS.push(sLod, x, bob, z, Math.sin(s.phase * 0.5) * 0.05, lean, Math.sin(s.phase) * 0.03, 1, sw, -sw, s.tint, s.tint, s.tint * 1.02);
    _m.makeScale(i === 0 ? 1.3 : 1, 1, i === 0 ? 1.3 : 1); _m.setPosition(x, 0.04, z); shadows.set(_m);
  }
  if (!soldiers.length) { leaderRing.visible = false; pennant.visible = false; }
  for (let i = 0; i < zombies.length; i++) {
    const zb = zombies[i];
    if (zb.dead) continue;
    const f = zb.flash > 0 ? 2.6 : 1;
    const R = zb.type === 2 ? RA : RZ;
    const d = camZ - zb.z, lod = d < 46 ? 0 : d < 80 ? 1 : 2;
    // lurching run: heavy sway, a dragging leg, head bob
    const ph = zb.phase, L = zb.lurch;
    const roll = Math.sin(ph * 0.5) * 0.16 * L;
    const pitch = -0.06 - Math.abs(Math.sin(ph)) * 0.08;
    R.push(lod, zb.x, Math.abs(Math.sin(ph)) * 0.07, zb.z, Math.PI + Math.sin(ph * 0.5) * 0.14, pitch, roll, zb.scale,
      Math.sin(ph) * 0.95, -Math.sin(ph) * 0.45 * L, zb.tr * f, zb.tg * f, zb.tb * f, 1, zb.skin, zb.cloth);
    _m.makeScale(zb.scale, 1, zb.scale); _m.setPosition(zb.x, 0.04, zb.z); shadows.set(_m);
  }
  for (const d of dead) {
    const alpha = d.t < 0.55 ? 1 : Math.max(0, 1 - (d.t - 0.55) / 0.7);
    const R = d.kind === 's' ? RSf : d.kind === 'a' ? RAf : RZf;
    const pitch = d.kind === 's' ? -Math.abs(d.pitch) : d.pitch;
    R.push(0, d.x, d.y, d.z, d.yaw, pitch, d.roll, d.scale, 0.3, -0.2, d.r, d.g, d.b, alpha, d.skin || WHITE, d.cloth || WHITE);
  }
  for (const f of fallers) {
    RSf.push(0, f.x, f.y, f.z, 0, f.rx, f.rz, f.leader ? LEADER.scale : 1, Math.sin(f.t * 20) * 0.8, -Math.sin(f.t * 20) * 0.8, f.tint, f.tint, f.tint, 1);
  }
  RS.end(); RL.end(); RSf.end(); RZ.end(); RZf.end(); RA.end(); RAf.end(); shadows.end();

  // tracers: streaks that travel from muzzle to target, turned to face the camera
  tracers.begin();
  for (let i = 0; i < shots.length && tracers.n < tracers.max; i++) {
    const sh = shots[i];
    let tx, ty, tz;
    if (sh.tgt) { tx = sh.tgt.x; ty = 1.1 * sh.tgt.scale; tz = sh.tgt.z; }
    else if (sh.boss && boss) { tx = boss.x + sh.ox; ty = sh.oy; tz = boss.z; }
    else if (sh.miss) { tx = sh.mx; ty = 1.0; tz = sh.mz; }
    else continue;
    const u = Math.min(1, sh.t / sh.life);
    _v1.set(sh.x0, sh.y0, sh.z0); _v2.set(tx, ty, tz);
    const len = _v1.distanceTo(_v2);
    if (len < 0.3) continue;
    const Lh = Math.min(2.2, len * 0.5);
    _v3.lerpVectors(_v1, _v2, u);
    _dir.subVectors(_v2, _v1).normalize();
    _toCam.subVectors(camera.position, _v3).normalize();
    _side.crossVectors(_dir, _toCam).normalize();
    const up = _v1.crossVectors(_side, _dir);
    _m.makeBasis(_side, up, _dir).scale(_s.set(1, 1, Lh));
    _v3.addScaledVector(_dir, -Lh * 0.5);
    _m.setPosition(_v3);
    tracers.set(_m);
  }
  tracers.end();
  flashes.begin();
  for (let i = flashList.length - 1; i >= 0; i--) {
    const f = flashList[i];
    f.t += dt;
    if (f.t > 0.06) { flashList[i] = flashList[flashList.length - 1]; flashList.pop(); continue; }
    flashes.set(billboard(f.x, f.y, f.z, 0.55 * (1 - f.t * 6), f.r));
  }
  flashes.end();
  sparks.begin();
  for (let i = sparkList.length - 1; i >= 0; i--) {
    const p = sparkList[i];
    p.t += dt;
    if (p.t >= p.life) { sparkList[i] = sparkList[sparkList.length - 1]; sparkList.pop(); continue; }
    p.vy -= 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    sparks.set(billboard(p.x, p.y, p.z, p.s * (1 - p.t / p.life)));
  }
  sparks.end();

  let pn = 0;
  for (let i = puffList.length - 1; i >= 0; i--) {
    const p = puffList[i];
    p.t += dt;
    if (p.t >= p.life) { puffList[i] = puffList[puffList.length - 1]; puffList.pop(); continue; }
    const u = p.t / p.life;
    p.y += p.vy * dt; p.x += p.vx * dt; p.z += p.vz * dt;
    const sc = p.size * (0.6 + u * 0.9);
    _m.makeScale(sc, sc, sc); _m.setPosition(p.x, p.y, p.z);
    puffs.setMatrixAt(pn, _m);
    _c.setRGB(p.c * 1.6, p.c * 1.55, p.c * 1.5); puffs.setColorAt(pn, _c);
    puffs.userData.alpha.array[pn] = (1 - u) * 0.7;
    pn++;
  }
  puffs.count = pn; puffs.instanceMatrix.needsUpdate = true; puffs.userData.alpha.needsUpdate = true;
  if (puffs.instanceColor) puffs.instanceColor.needsUpdate = true;

  for (const e of explPool) {
    if (!e.active) continue;
    e.t += dt;
    const u = e.t / e.life;
    if (u >= 1) { e.active = false; e.mesh.visible = false; e.ring.visible = false; continue; }
    if (!e.ringOnly) {
      e.mesh.quaternion.copy(_camQ);
      e.mesh.scale.setScalar(e.r * (0.5 + u * 0.9));
      e.mesh.material.opacity = (1 - u) * (reduceMotion ? 0.45 : 1);
    }
    e.ring.scale.setScalar(e.r * (0.3 + u * 1.4));
    e.ring.material.opacity = (1 - u);
  }

  const pulse = 1 + Math.sin(animT * 4) * 0.12;
  gateMats.goodPanel.uniforms.time.value = gateMats.badPanel.uniforms.time.value = animT;
  for (const row of gateRows) {
    row.slots.forEach((s, i) => {
      if (!s.group) return;
      const U = s.panelMat.uniforms;
      U.time.value = animT;
      if (!row.passed) { U.fade.value = pulse; return; }
      const u = Math.min(1, row.t / 0.25);
      if (i === row.chosen) { s.group.scale.set(1 + u * 0.15, 1 + u * 0.15, 1); U.fade.value = 1.8 * (1 - u); s.lmat.opacity = 1 - u; }
      else { U.fade.value = pulse * (1 - u); s.lmat.opacity = 1 - u * 0.8; }
      if (u >= 1) s.group.visible = false;
    });
  }
  // sun and its shadow box follow the camera
  sun.position.set(camPos.x + 14, 34, camPos.z - 8);
  sun.target.position.set(camPos.x, 0, camPos.z - 30);
  skyline.position.x = camPos.x; skyline.position.z = camPos.z - 60;
}

// ---------------------------------------------------------------- camera
let camDist = 26, lookAhead = 8, portrait = true;
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function desiredCamera(out, look) {
  if (state === 'menu') {
    look.set(squad.x, 1.2, squad.z - 4);
    const a = animT * 0.12;
    out.set(look.x + Math.sin(a) * 9, 6.5, look.z + 13 + Math.cos(a) * 3);
    return;
  }
  const bossMode = boss && !boss.gone;
  if (bossMode && !portrait) {
    // Landscape / desktop boss fight: a lower, flatter shot from further back so the brute's head stays below the
    // HUD and boss bar (about the top 31% at 844x390) from the moment it lands until contact, with the squad at the bottom.
    const k = 1 + Math.min(0.22, squad.rx * 0.025);
    look.set(squad.x * CAM_FOLLOW_X, 4, squad.z - 20 * k);
    out.set(look.x, 14 * k, squad.z + 26 * k);
    return;
  }
  // boss fight in portrait: pull back further
  const d = camDist * (bossMode ? 1.18 : 1) * (1 + Math.min(0.22, squad.rx * 0.025));
  look.set(squad.x * CAM_FOLLOW_X, 0, squad.z - lookAhead - (bossMode ? 5 : 0));
  out.set(look.x, d * 0.5, look.z + d * 0.87 + lookAhead * 0.15);
}
function snapCamera() {
  desiredCamera(camPos, camLook);
  camera.position.copy(camPos); camera.lookAt(camLook); camera.updateMatrixWorld();
}
function updateCamera(dt) {
  desiredCamera(_v1, _v2);
  const k = Math.min(1, dt * 4);
  camPos.lerp(_v1, k); camLook.lerp(_v2, k);
  camera.position.copy(camPos);
  if (shake > 0 && !reduceMotion) {
    camera.position.x += (rnd() - 0.5) * shake;
    camera.position.y += (rnd() - 0.5) * shake;
  }
  shake = Math.max(0, shake - dt * 1.6);
  camera.lookAt(camLook);
  water.position.z = camPos.z - 200;
}
function addShake(a) { if (!reduceMotion) shake = Math.min(1, shake + a); }
function flash(a, color) {
  if (reduceMotion) return;
  ui.flash.style.background = color;
  flashA = Math.max(flashA, a);
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  post.setSize(w, h, pr);
  const aspect = w / h;
  portrait = aspect < 1;
  camera.fov = portrait ? 58 : 46;
  camera.aspect = aspect;
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // Landscape / desktop (r2 Blocker, r1 M3): the far end of the 22-30 range with a look-ahead of 9 puts the
  // squad's front rank at about 79% of the height and the hazard beacons 2 s ahead (25 units at L5 speed, 2.6 up)
  // at about 21%, below the compact landscape HUD. A closer camera can't fit both in a 46 degree frame.
  camDist = portrait ? clamp(7.4 / (tanV * aspect), 17, 31) : 30;
  lookAhead = portrait ? 11 : 9;
  camera.updateProjectionMatrix();
  syncLegalHeight();
  measureDragScale();
  // Rotating the phone mid-run pauses so the player can re-grip (r1 QA M4).
  if (lastPortrait !== null && lastPortrait !== portrait && state === 'play') pauseGame();
  lastPortrait = portrait;
}
let lastPortrait = null;

// Drag follows the finger 1:1 (r1 QA M2): measure screen pixels per world unit at the squad's depth
// with the camera where it will settle, then account for the camera tracking 35% of squad x.
const measureCam = new THREE.PerspectiveCamera();
const CAM_FOLLOW_X = 0.35;
let dragPxPerUnit = 30, dragMeasureT = 0;
function measureDragScale() {
  measureCam.copy(camera);
  desiredCamera(measureCam.position, _v3);
  measureCam.lookAt(_v3);
  measureCam.updateMatrixWorld();
  _v1.set(squad.x - 3, 0.9, squad.z).project(measureCam);
  _v2.set(squad.x + 3, 0.9, squad.z).project(measureCam);
  const px = Math.abs(_v2.x - _v1.x) * 0.5 * window.innerWidth / 6;
  if (px > 1) dragPxPerUnit = px * (1 - CAM_FOLLOW_X);
}
window.addEventListener('resize', resize);

// ---------------------------------------------------------------- labels & HUD
let lastHud = {};
let minTagY = 0, hudBottom = 0, hudRectT = 0;
const _proj = new THREE.Vector3();
function placeTag(el, x, y, z, hideIfClamped = false) {
  _proj.set(x, y, z).project(camera);
  if (_proj.z > 1 || (hideIfClamped && (-_proj.y * 0.5 + 0.5) * window.innerHeight < minTagY)) { el.style.visibility = 'hidden'; return null; }
  el.style.visibility = 'visible';
  const sx = (_proj.x * 0.5 + 0.5) * window.innerWidth;
  const sy = Math.max(minTagY, (-_proj.y * 0.5 + 0.5) * window.innerHeight);
  el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
  return [sx, sy];
}
let tagPos = [0, 0], tagTimer = 0;
function tagState(cls) {
  ui.squadTag.classList.remove('good', 'bad', 'bump');
  void ui.squadTag.offsetWidth;
  ui.squadTag.classList.add(cls, 'bump');
  tagTimer = 0.6;
}
const popLog = [];
function pop(text, good) {
  const el = document.createElement('div');
  el.className = 'pop ' + (good ? 'good' : 'bad');
  el.textContent = text;
  popLog.push(text); if (popLog.length > 20) popLog.shift();
  el.style.left = tagPos[0] + 'px'; el.style.top = (tagPos[1] - 40) + 'px';
  ui.pops.appendChild(el);
  setTimeout(() => el.remove(), 950);
}
let hintTimer = 0;
function showHint(text, ms) { ui.hint.textContent = text; ui.hint.hidden = false; clearTimeout(hintTimer); hintTimer = setTimeout(() => { ui.hint.hidden = true; }, ms); }
function updateHud(dt) {
  if (state === 'menu' || !current) { ui.squadTag.hidden = true; ui.bossTag.hidden = true; return; }
  const n = soldiers.length;
  ui.squadTag.hidden = n === 0 || state === 'win' || state === 'over';
  if (lastHud.n !== n) { ui.squadTagNum.textContent = n; ui.squad.textContent = n; lastHud.n = n; }
  minTagY = 0;
  // HUD bottom edge (the billboard audit and the boss tag both keep clear of it)
  if ((hudRectT -= dt) <= 0) { hudRectT = 0.5; hudBottom = ui.hud.getBoundingClientRect().bottom; }
  // above the leader's pennant, so the count never sits on his crest or flag (r2 High)
  const p = placeTag(ui.squadTag, squad.x, PENNANT_TOP * LEADER.scale * (1 + 0.2 * Math.min(1, soldiers.length / 60)) + 0.35, squad.z);
  if (p) tagPos = p;
  if (tagTimer > 0) { tagTimer -= dt; if (tagTimer <= 0) ui.squadTag.classList.remove('good', 'bad'); }
  if (lastHud.score !== score) { ui.score.textContent = score.toLocaleString(); lastHud.score = score; }
  const pg = Math.round(progress() * 1000) / 10;
  if (lastHud.pg !== pg) { ui.prog.style.width = pg + '%'; lastHud.pg = pg; }
  if (boss && !boss.gone && state !== 'win' && state !== 'over') {
    const hp = Math.ceil(boss.hp);
    if (lastHud.bhp !== hp) { ui.bossTagNum.textContent = hp; ui.bossFill.style.width = (100 * boss.hp / boss.maxHp) + '%'; lastHud.bhp = hp; }
    ui.bossTag.hidden = boss.state === 'dead' && boss.deadT > 0.8;
    minTagY = hudBottom + 56;
    // Above the head only; when the head is under the HUD the tag hides instead of covering the boss.
    placeTag(ui.bossTag, boss.x, boss.scale * 3.25 + 0.6, boss.z, true);
  } else ui.bossTag.hidden = true;
  if (flashA > 0) { ui.flash.style.opacity = flashA.toFixed(3); flashA = Math.max(0, flashA - dt * 1.5); if (flashA === 0) ui.flash.style.opacity = '0'; }
}

// ---------------------------------------------------------------- menu idle
function menuSetup() {
  clearWorld();
  current = null; diff = null;
  envSeed = 3; applyTheme('dusk');
  squad.x = squad.tx = 0; squad.z = 0; squad.speed = squad.targetSpeed = 5;
  soldiers = []; addSoldiers(14, 0); soldiers.forEach((s) => { s.ox = 0; s.oz = 0; });
  snapCamera();
  resetChunks();
}
function menuStep(dt) {
  squad.z -= squad.speed * dt;
  updateExtents();
  const n = soldiers.length, sp = formationSpacing(n);
  for (let i = 0; i < n; i++) {
    const s = soldiers[i];
    slotOffset(i, sp, _slot);
    s.ox += (_slot[0] - s.ox) * Math.min(1, dt * 4);
    s.oz += (_slot[1] - s.oz) * Math.min(1, dt * 4);
    s.phase += dt * 7;
  }
}

// ---------------------------------------------------------------- screens
const SCREENS = ['scrTitle', 'scrLevels', 'scrUpgrades', 'scrPause', 'scrOver', 'scrWin'];
let upgradesFrom = 'title';
function showScreen(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  ui.legal.hidden = !id;
  syncLegalHeight();
  ui.hud.hidden = !(state === 'play' || state === 'outro' || state === 'paused');
  // While a dialog covers the run, the HUD and canvas behind it are inert (r1 QA L2).
  const covered = id === 'scrPause';
  ui.hud.inert = covered; canvas.inert = covered;
  if (id === 'scrLevels') renderLevels();
  if (id === 'scrUpgrades') renderUpgrades();
  if (id === 'scrTitle') renderTitle();
  if (id) {
    const first = $(id).querySelector('.btn-primary, .level-card, .btn');
    if (first && window.matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
  } else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}
// Menu screens stop at the top of the legal footer (r1 QA H1).
function syncLegalHeight() {
  const h = ui.legal.hidden ? 0 : ui.legal.offsetHeight;
  document.documentElement.style.setProperty('--legal-h', h + 'px');
}
function starSvg(on) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="${on ? 'star-on' : 'star-off'}" stroke-width="1.2" d="M12 2.6l2.85 5.95 6.55.8-4.83 4.5 1.25 6.5L12 17.2l-5.82 3.15 1.25-6.5L2.6 9.35l6.55-.8z"/></svg>`;
}
const lockSvg = '<svg class="lock" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z"/></svg>';
function renderPoints() { document.querySelectorAll('.js-points').forEach((e) => { e.textContent = save.points.toLocaleString(); }); }
function renderTitle() {
  renderPoints();
  $('btnPlay').textContent = `Play  Level ${Math.min(save.unlocked, LEVELS.length)}`;
  syncSound();
}
function renderLevels() {
  const list = $('levelList');
  list.innerHTML = '';
  LEVELS.forEach((lv) => {
    const locked = lv.id > save.unlocked;
    const st = save.stars[lv.id] || 0;
    const b = document.createElement('button');
    b.className = 'level-card';
    b.disabled = locked;
    b.setAttribute('aria-label', locked ? `Level ${lv.id} ${lv.name}, locked` : `Level ${lv.id} ${lv.name}, ${st} of 3 stars`);
    b.innerHTML = `<span class="level-num">${lv.id}</span><span><span class="level-name">${lv.name}</span><span class="level-blurb">${lv.blurb}</span></span>` +
      (locked ? lockSvg : `<span class="mini-stars">${[0, 1, 2].map((i) => starSvg(i < st)).join('')}</span>`);
    b.addEventListener('click', () => { sfx.click(); startLevel(lv.id); });
    list.appendChild(b);
  });
  const e = document.createElement('button');
  e.className = 'level-card endless';
  e.innerHTML = `<span class="level-num">E</span><span><span class="level-name">Endless</span><span class="level-blurb">Waves until the squad falls. Best ${save.endlessBest.toLocaleString()}</span></span><span></span>`;
  e.addEventListener('click', () => { sfx.click(); startLevel('E'); });
  list.appendChild(e);
}
function renderUpgrades() {
  renderPoints();
  const list = $('upgradeList');
  list.innerHTML = '';
  UPGRADES.forEach((u) => {
    const lv = save.upg[u.key], maxed = lv >= u.cost.length, cost = maxed ? 0 : u.cost[lv];
    const row = document.createElement('div');
    row.className = 'upgrade';
    row.innerHTML = `<div><h3>${u.name}</h3><p>${u.desc}</p></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn' + (!maxed && save.points >= cost ? ' btn-primary' : '');
    btn.textContent = maxed ? 'Maxed' : `Buy ${cost.toLocaleString()}`;
    btn.disabled = maxed || save.points < cost;
    btn.dataset.upg = u.key;
    btn.setAttribute('aria-label', maxed ? `${u.name} maxed` : `Buy ${u.name} level ${lv + 1} for ${cost} points`);
    btn.addEventListener('click', () => {
      if (maxed || save.points < cost) return;
      save.points -= cost; save.upg[u.key]++; persist(); sfx.buy(); renderUpgrades();
    });
    row.appendChild(btn);
    const pips = document.createElement('div');
    pips.className = 'pips';
    pips.setAttribute('aria-hidden', 'true');
    pips.innerHTML = u.cost.map((_, i) => `<span class="pip${i < lv ? ' on' : ''}"></span>`).join('');
    row.appendChild(pips);
    list.appendChild(row);
  });
  $('scrUpgrades').querySelector('.js-up-continue').textContent = upgradesFrom === 'over' ? 'Retry level' : upgradesFrom === 'win' ? 'Next level' : 'Done';
}
function syncSound() {
  document.querySelectorAll('.js-sound').forEach((b) => { b.textContent = sfx.enabled ? 'Sound on' : 'Sound off'; b.setAttribute('aria-pressed', String(sfx.enabled)); });
}
// Esc acts as Back on the Levels and Upgrades screens (r1 QA L3).
function escapeBack() {
  if (!$('scrLevels').hidden) $('scrLevels').querySelector('[data-go="title"]').click();
  else if (!$('scrUpgrades').hidden) document.querySelector('.js-up-back').click();
}
function goMenu() { state = 'menu'; menuSetup(); showScreen('scrTitle'); }
let pausedFrom = 'play';
function pauseGame() {
  if (state !== 'play' && state !== 'outro') return;
  pausedFrom = state; state = 'paused';
  keys.left = keys.right = false; dragId = null;
  sfx.suspend();
  showScreen('scrPause');
}
function resumeGame() {
  if (state !== 'paused') return;
  state = pausedFrom; sfx.resume();
  showScreen(null);
  last = performance.now(); acc = 0;
}
function nextLevel() {
  if (current && !current.endless && current.id < LEVELS.length) startLevel(current.id + 1);
  else startLevel('E');
}

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (!go) return;
  sfx.click();
  const target = go.dataset.go;
  if (target === 'upgrades') { upgradesFrom = go.dataset.from || 'title'; showScreen('scrUpgrades'); }
  else if (target === 'levels') showScreen('scrLevels');
  else if (target === 'title') goMenu();
});
$('btnPlay').addEventListener('click', () => { sfx.click(); startLevel(Math.min(save.unlocked, LEVELS.length)); });
$('btnEndless').addEventListener('click', () => { sfx.click(); startLevel('E'); });
$('btnPause').addEventListener('click', () => { sfx.click(); pauseGame(); });
$('btnResume').addEventListener('click', () => { sfx.click(); resumeGame(); });
$('btnRestart').addEventListener('click', () => { sfx.click(); startLevel(current.id); });
$('btnQuit').addEventListener('click', () => { sfx.click(); goMenu(); });
$('btnRetry').addEventListener('click', () => { sfx.click(); startLevel(current.id); });
$('btnNext').addEventListener('click', () => { sfx.click(); nextLevel(); });
document.querySelector('.js-up-back').addEventListener('click', () => {
  sfx.click();
  if (upgradesFrom === 'over') showScreen('scrOver'); else if (upgradesFrom === 'win') showScreen('scrWin'); else goMenu();
});
document.querySelector('.js-up-continue').addEventListener('click', () => {
  sfx.click();
  if (upgradesFrom === 'over') startLevel(current.id); else if (upgradesFrom === 'win') nextLevel(); else goMenu();
});
document.querySelectorAll('.js-sound').forEach((b) => b.addEventListener('click', () => {
  sfx.setEnabled(!sfx.enabled); save.sound = sfx.enabled; persist(); syncSound(); sfx.click();
}));

// ---------------------------------------------------------------- input
let dragId = null, dragX = 0;
canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'play') return;
  dragId = e.pointerId; dragX = e.clientX;
  measureDragScale();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== dragId || state !== 'play') return;
  squad.tx += (e.clientX - dragX) / dragPxPerUnit;
  dragX = e.clientX;
});
const endDrag = (e) => { if (e.pointerId === dragId) dragId = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
const isLeft = (k) => k === 'ArrowLeft' || k === 'a' || k === 'A';
const isRight = (k) => k === 'ArrowRight' || k === 'd' || k === 'D';
window.addEventListener('keydown', (e) => {
  const k = e.key;
  if (isLeft(k)) { keys.left = true; if (state === 'play') e.preventDefault(); }
  else if (isRight(k)) { keys.right = true; if (state === 'play') e.preventDefault(); }
  else if (k === 'Escape' || k === 'p' || k === 'P') {
    if (state === 'play' || state === 'outro') pauseGame();
    else if (state === 'paused') resumeGame();
    else if (k === 'Escape') escapeBack();
  }
});
window.addEventListener('keyup', (e) => {
  if (isLeft(e.key)) keys.left = false;
  else if (isRight(e.key)) keys.right = false;
});
window.addEventListener('blur', () => { keys.left = keys.right = false; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (state === 'play' || state === 'outro') pauseGame(); sfx.suspend(); }
});

// ---------------------------------------------------------------- main loop
let last = performance.now(), acc = 0;
const STEP = 1 / 60;
let fps = 60, fpsFrames = 0, fpsClock = 0, simMs = 0, renderMs = 0, lowFpsStrikes = 0;
let loopStopped = false;
function syncGameBusy() {
  const live = state === 'play' || state === 'outro';
  if (live) document.body.dataset.gameBusy = '1';
  else if (document.body.dataset.gameBusy) delete document.body.dataset.gameBusy;
}
function frame(now) {
  syncGameBusy();
  if (loopStopped) return;
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.1) dt = 0.1;
  if (dt < 0) dt = 0;
  fpsFrames++; fpsClock += dt;
  if (fpsClock >= 1) {
    fps = fpsFrames / fpsClock; fpsFrames = 0; fpsClock = 0;
    // Adaptive resolution: step the pixel ratio down if the device cannot hold ~45fps.
    // Adaptive quality: drop soft shadows, then bloom, then step the pixel ratio down if the device can't hold ~45fps.
    if (fps < 45 && state === 'play' && DBG.q === null) {
      if (++lowFpsStrikes >= 2) {
        lowFpsStrikes = 0;
        if (quality > 0) setQuality(quality - 1);
        else if (pr > 1) { pr = Math.max(1, pr - 0.25); renderer.setPixelRatio(pr); resize(); }
      }
    } else lowFpsStrikes = 0;
  }
  const t0 = performance.now();
  let animDt = dt;
  if (dbgFreeze && state === 'play') {
    acc = 0; animDt = 0; // screenshot helper: hold the current frame
  } else if (state === 'play' || state === 'outro') {
    acc += dt * DBG.ts;
    let steps = 0;
    const maxSteps = 8 * DBG.ts;
    while (acc >= STEP && steps < maxSteps) { step(STEP); acc -= STEP; steps++; if (state !== 'play' && state !== 'outro') break; }
    if (steps >= maxSteps) acc = 0;
    animDt = dt * DBG.ts;
  } else if (state === 'win' || state === 'over') {
    step(dt);
  } else if (state === 'menu') {
    menuStep(dt);
  } else animDt = 0;
  const t1 = performance.now();
  updateChunks();
  if (state === 'play' && (dragMeasureT -= dt) <= 0) { dragMeasureT = 0.5; measureDragScale(); }
  renderUnits(animDt);
  if (state !== 'paused') updateCamera(dt);
  updateHud(dt);
  post.render(scene, camera);
  const t2 = performance.now();
  simMs = simMs * 0.9 + (t1 - t0) * 0.1;
  renderMs = renderMs * 0.9 + (t2 - t1) * 0.1;
}

// ---------------------------------------------------------------- test hooks
// Back to games link (configurable for embedding; see js/config.js).
{
  const link = document.getElementById('backLink'), href = resolveBackHref();
  if (href) { link.href = href; link.querySelector('span').textContent = EMBED.backLabel; } else link.hidden = true;
  // stop rendering as soon as Back is pressed so the click is never queued behind a long frame on weak devices
  link.addEventListener('pointerdown', () => { loopStopped = true; });
  window.addEventListener('pageshow', (e) => { if (e.persisted && loopStopped) { loopStopped = false; last = performance.now(); requestAnimationFrame(frame); } });
}

window.__HTS = {
  get state() { return state; },
  squad: () => soldiers.length,
  zombies: () => zombies.filter((z) => !z.dead).length,
  score: () => score,
  fps: () => fps,
  boss: () => (boss ? { hp: boss.hp, max: boss.maxHp, state: boss.state } : null),
  level: () => (current ? current.id : null),
  progress: () => progress(),
  gates: () => gateLog.slice(),
  squadX: () => squad.x,
  rockets: () => rockets.length,
  start: (id) => startLevel(id),
  finish: (won) => { if (current && (state === 'play' || state === 'outro')) (won ? finishWin() : finishOver()); },
  spawnHorde: (count, mix) => spawnHorde({ count, mix: mix || { r: 0.2, a: 0.15 } }),
  // Opening-frame ground check: screen points beside and behind the squad, with what a ray through each hits.
  groundProbe: () => {
    const ray = new THREE.Raycaster(), roads = chunks.map((c) => c.road), out = [];
    for (const [dx, dz] of [[-3.2, 2.5], [3.2, 2.5], [0, 6], [-4.5, -1], [4.5, -1]]) {
      _proj.set(squad.x + dx, 0, squad.z + dz).project(camera);
      ray.setFromCamera({ x: _proj.x, y: _proj.y }, camera);
      const hit = ray.intersectObjects(roads, false)[0];
      out.push({ sx: (_proj.x * 0.5 + 0.5) * window.innerWidth, sy: (-_proj.y * 0.5 + 0.5) * window.innerHeight, road: !!hit });
    }
    return { points: out, bgTop: theme.top, bgBot: theme.bot, fog: theme.fog, theme: current && current.theme };
  },
  // Reads the drawing buffer; call from a rAF callback right after the game's frame so frame N is intact.
  pixel: (sx, sy) => {
    const gl = renderer.getContext(), px = new Uint8Array(4), r = renderer.getPixelRatio();
    gl.readPixels(Math.round(sx * r), Math.round(gl.drawingBufferHeight - sy * r), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return [px[0], px[1], px[2]];
  },
  menuDrift: (dz) => { if (state === 'menu') { squad.z -= dz; snapCamera(); } },
  memory: () => ({ geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }),
  dragPxPerUnit: () => dragPxPerUnit,
  diff: () => (diff ? JSON.parse(JSON.stringify(diff)) : null),
  leader: () => {
    const l = soldiers[0];
    return { exists: !!(l && l.leader), ox: l ? +l.ox.toFixed(3) : null, oz: l ? +l.oz.toFixed(3) : null, promotions: leaderPromotions, flash: leaderFlash, count: soldiers.length, leaders: soldiers.filter((s) => s.leader).length };
  },
  formation: () => soldiers.map((s) => [+s.ox.toFixed(3), +s.oz.toFixed(3)]),
  formationSlots: (n) => { const sp = formationSpacing(n), out = []; for (let i = 0; i < n; i++) { slotOffset(i, sp, _slot); out.push([+_slot[0].toFixed(3), +_slot[1].toFixed(3)]); } return out; },
  hazards: () => hazardLog.map((h) => ({ type: h.type, z: Math.round(h.z), x: h.x != null ? +h.x.toFixed(2) : h.side || 0, lost: h.lost, tele: h.tele })),
  billboards: () => billboards.map((b) => ({ kind: b.kind, z: Math.round(b.z), ad: b.ad.id, spawned: !!b.group || b.done, maxPx: b.maxPx || 0, rect: b.lastRect || null, coversSquad: !!b.coversSquad, shownWith: b.shownWith || 0 })),
  fallers: () => fallers.length,
  pops: () => popLog.slice(),
  grow: (k) => { addSoldiers(k, squad.x); updateExtents(); },
  // screenshot helper: jump the run forward to a fraction of the way to the boss (skips the events in between)
  warp: (f) => { const z = Math.abs(f) > 1 ? f : startZ + (bossZ - startZ) * f; squad.z = z; while (evIdx < events.length && events[evIdx].trig >= z) evIdx++; snapCamera(); resetChunks(); },
  setSquadX: (x) => { squad.x = squad.tx = x; },
  freeze: (on) => { dbgFreeze = !!on; },
  // framing audit: screen extent of every drawn soldier (feet to helmet) and the leader's pennant
  squadFrame: () => {
    let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9;
    const vis = Math.min(soldiers.length, 200);
    for (let i = 0; i < vis; i++) {
      const s = soldiers[i], x = clamp(squad.x + s.ox, -6, 6), z = squad.z + s.oz;
      for (const y of [0, 1.9]) {
        _proj.set(x, y, z).project(camera);
        const sx = (_proj.x * 0.5 + 0.5) * innerWidth, sy = (-_proj.y * 0.5 + 0.5) * innerHeight;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      }
    }
    return { n: soldiers.length, x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1), vw: innerWidth, vh: innerHeight, hud: Math.round(hudBottom) };
  },
  leaderMarker: () => {
    if (!pennant.visible) return null;
    const f = pennant.userData.flag; f.updateMatrixWorld(true);
    _proj.set(0.5, 0.19, 0).applyMatrix4(f.matrixWorld).project(camera);
    return { sx: (_proj.x * 0.5 + 0.5) * innerWidth, sy: (-_proj.y * 0.5 + 0.5) * innerHeight, tag: tagPos.slice() };
  },
  steer: (x) => { squad.tx = x; },
  stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, pixelRatio: pr, simMs: +simMs.toFixed(2), renderMs: +renderMs.toFixed(2), fps: +fps.toFixed(1), zombies: zombies.length, soldiers: soldiers.length }),
  save: () => JSON.parse(JSON.stringify(save)),
};

resize();
menuSetup();
if (DBG.level) {
  startLevel(DBG.level === 'E' ? 'E' : clamp(parseInt(DBG.level, 10) || 1, 1, LEVELS.length));
} else showScreen('scrTitle');
requestAnimationFrame(frame);
