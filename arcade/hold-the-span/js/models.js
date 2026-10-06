// Procedural models for Hold the Span. Everything is generated from primitives at runtime: no model files.
// Parts carry vertex colour plus two extra attributes used by the unit material in main.js:
//   aEmit  (float) self-illumination (visors, eyes, lamps) that the bloom pass picks up
//   aMask  (vec2)  x = skin, y = cloth; zombies swap these for per-instance skin/cloth colours
import * as THREE from './vendor/three.module.min.js';

const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
const _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _v = new THREE.Vector3(), _s = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);

function bake(geo, color, matrix, opts = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  geo.dispose();
  g.applyMatrix4(matrix);
  const c = new THREE.Color(color), n = g.attributes.position.count;
  const col = new Float32Array(n * 3), emit = new Float32Array(n), mask = new Float32Array(n * 2);
  const e = opts.emit || 0, mk = opts.mask || [0, 0];
  for (let i = 0; i < n; i++) {
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    emit[i] = e; mask[i * 2] = mk[0]; mask[i * 2 + 1] = mk[1];
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aEmit', new THREE.BufferAttribute(emit, 1));
  g.setAttribute('aMask', new THREE.BufferAttribute(mask, 2));
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (g.attributes.uv1) g.deleteAttribute('uv1');
  return g;
}

// Bake a primitive with position, rotation (Euler XYZ) and scale.
export function part(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, opts) {
  _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
  return bake(geo, color, _m, opts);
}
// A capsule stretched between two points (limbs, cables).
function limb(a, b, r, color, opts, rad = 6) {
  _a.set(...a); _b.set(...b);
  const len = _a.distanceTo(_b);
  const geo = new THREE.CapsuleGeometry(r, Math.max(0.001, len), rad > 6 ? 2 : 1, rad);
  _v.subVectors(_b, _a).normalize();
  _q.setFromUnitVectors(Y, _v);
  _m.compose(_s.addVectors(_a, _b).multiplyScalar(0.5), _q, _v.set(1, 1, 1));
  return bake(geo, color, _m, opts);
}
// Apply one transform to a list of baked parts (used to hunch a zombie's upper body).
function xform(parts, m) { for (const p of parts) { p.applyMatrix4(m); } return parts; }

export function merge(parts) {
  let total = 0;
  for (const p of parts) total += p.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  const emit = new Float32Array(total), mask = new Float32Array(total * 2);
  let o = 0;
  for (const p of parts) {
    const n = p.attributes.position.count;
    pos.set(p.attributes.position.array, o * 3);
    nor.set(p.attributes.normal.array, o * 3);
    col.set(p.attributes.color.array, o * 3);
    if (p.attributes.aEmit) emit.set(p.attributes.aEmit.array, o);
    if (p.attributes.aMask) mask.set(p.attributes.aMask.array, o * 2);
    o += n;
    p.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aEmit', new THREE.BufferAttribute(emit, 1));
  g.setAttribute('aMask', new THREE.BufferAttribute(mask, 2));
  g.computeBoundingSphere();
  return g;
}

// Rounded box with exact normals: vertices outside the inner box are pushed onto radius r.
export function rbox(w, h, d, r = 0.05, seg = 2) {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const p = g.attributes.position, nrm = g.attributes.normal;
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const cx = Math.max(-hx, Math.min(hx, x)), cy = Math.max(-hy, Math.min(hy, y)), cz = Math.max(-hz, Math.min(hz, z));
    _v.set(x - cx, y - cy, z - cz);
    if (_v.lengthSq() < 1e-10) continue;
    _v.normalize();
    p.setXYZ(i, cx + _v.x * r, cy + _v.y * r, cz + _v.z * r);
    nrm.setXYZ(i, _v.x, _v.y, _v.z);
  }
  return g;
}
const ball = (r, ws = 8, hs = 6) => new THREE.SphereGeometry(r, ws, hs);
const cyl = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const cone = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s);
const cap = (r, l, rad = 6) => new THREE.CapsuleGeometry(r, l, rad > 6 ? 2 : 1, rad);

// ---------------------------------------------------------------- soldiers
// Units face -Z with feet at y = 0. Legs are separate meshes pivoting at the hip so the instanced crowd can run.
export const HIP_Y = 0.78;
export const HIP_X = 0.1;
export const MUZZLE = [0.07, 1.17, -1.06];

function trooper(c, lod = 0) {
  const r = lod ? 4 : 6;
  const parts = [
    part(rbox(0.34, 0.16, 0.22, 0.06, lod ? 1 : 2), c.dark, 0, 0.86, 0),
    part(rbox(0.37, 0.05, 0.25, 0.02, 1), '#0f1420', 0, 0.93, 0),
    part(cap(0.17, 0.2, r), c.uniform, 0, 1.12, 0, 0, 0, 0, 1.2, 1, 0.85),
    part(rbox(0.42, 0.36, 0.29, 0.08, lod ? 1 : 2), c.vest, 0, 1.13, 0),
    part(cyl(0.11, 0.13, 0.06, 6), c.dark, 0, 1.33, 0),
    part(ball(0.09, 6, 4), c.pad, 0.23, 1.27, 0, 0, 0, 0, 1.1, 0.8, 1),
    part(ball(0.09, 6, 4), c.pad, -0.23, 1.27, 0, 0, 0, 0, 1.1, 0.8, 1),
    part(cyl(0.06, 0.065, 0.08, 6), c.skin, 0, 1.38, 0),
    part(ball(0.13, lod ? 6 : 9, lod ? 5 : 7), c.skin, 0, 1.48, 0, 0, 0, 0, 0.95, 1.05, 1),
    part(new THREE.SphereGeometry(0.158, lod ? 7 : 10, lod ? 3 : 5, 0, Math.PI * 2, 0, Math.PI * 0.52), c.helmet, 0, 1.5, 0.01, 0, 0, 0, 1, 0.92, 1.05),
    part(new THREE.TorusGeometry(0.152, 0.018, 3, lod ? 7 : 10), c.rim, 0, 1.5, 0.01, Math.PI / 2, 0, 0),
    part(new THREE.SphereGeometry(0.143, lod ? 5 : 8, 2, Math.PI * 1.5 - 0.9, 1.8, 1.27, 0.36), c.visor, 0, 1.49, 0, 0, 0, 0, 1, 1, 1, { emit: c.visorEmit }),
    // backpack + bedroll
    part(rbox(0.3, 0.32, 0.14, 0.05, lod ? 1 : 2), c.pack, 0, 1.12, 0.2),
    part(cyl(0.06, 0.06, 0.3, 5), c.roll, 0, 1.32, 0.2, 0, 0, Math.PI / 2),
    // arms holding the rifle
    limb([0.23, 1.27, 0], [0.21, 1.08, -0.17], 0.062, c.uniform, undefined, r),
    limb([0.21, 1.08, -0.17], [0.1, 1.13, -0.37], 0.056, c.uniform, undefined, r),
    part(ball(0.056, 5, 4), c.glove, 0.1, 1.13, -0.38),
    limb([-0.23, 1.27, 0], [-0.21, 1.12, -0.28], 0.062, c.uniform, undefined, r),
    limb([-0.21, 1.12, -0.28], [0.03, 1.15, -0.6], 0.056, c.uniform, undefined, r),
    part(ball(0.056, 5, 4), c.glove, 0.04, 1.15, -0.61),
    // rifle
    part(rbox(0.07, 0.12, 0.5, 0.02, 1), c.gun, 0.07, 1.17, -0.42),
    part(rbox(0.06, 0.11, 0.2, 0.02, 1), c.gun, 0.07, 1.14, -0.1),
    part(cyl(0.022, 0.022, 0.36, 6), c.metal, 0.07, 1.18, -0.84, Math.PI / 2, 0, 0),
    part(cyl(0.033, 0.033, 0.07, 6), c.metal, 0.07, 1.18, -1.02, Math.PI / 2, 0, 0),
    part(rbox(0.05, 0.14, 0.07, 0.015, 1), c.gun, 0.07, 1.06, -0.45, 0.2, 0, 0),
    part(cyl(0.03, 0.03, 0.16, 5), c.metal, 0.07, 1.26, -0.4, Math.PI / 2, 0, 0),
  ];
  if (!lod) {
    for (const px of [-0.12, 0, 0.12]) parts.push(part(rbox(0.09, 0.09, 0.05, 0.02, 1), c.pouch, px, 1.02, -0.155));
    parts.push(part(rbox(0.3, 0.035, 0.02, 0.01, 1), c.stripe, 0, 1.2, -0.152, 0, 0, 0, 1, 1, 1, { emit: c.stripeEmit }));
  }
  if (c.leader) {
    // officer crest, cape and a glowing chest star so the leader reads at phone size
    parts.push(part(rbox(0.045, 0.11, 0.3, 0.02, 1), c.crest, 0, 1.66, 0.03));
    parts.push(part(rbox(0.46, 0.66, 0.03, 0.015, 2), c.cape, 0, 0.98, 0.29, 0.16, 0, 0));
    parts.push(part(rbox(0.5, 0.08, 0.06, 0.03, 1), c.cape, 0, 1.3, 0.24));
    parts.push(part(new THREE.OctahedronGeometry(0.05, 0), '#ffe9a6', 0, 1.22, -0.17, 0, 0, Math.PI / 4, 1, 1, 0.4, { emit: 2.2 }));
  }
  const body = merge(parts);
  const leg = merge([
    part(cap(0.075, 0.26, r), c.trousers, 0, -0.2, 0),
    part(rbox(0.1, 0.09, 0.06, 0.03, 1), c.dark, 0, -0.4, -0.07),
    part(cap(0.066, 0.22, r), c.trousers, 0, -0.55, 0),
    part(rbox(0.13, 0.12, 0.25, 0.04, lod ? 1 : 2), c.boot, 0, -0.71, -0.04),
  ]);
  return { body, leg };
}
const SOLDIER = {
  uniform: '#2d63c8', vest: '#1c2d50', dark: '#141a26', pad: '#2a4f99', skin: '#e0a982', helmet: '#3b70d4', rim: '#1d3263',
  visor: '#86e8ff', visorEmit: 1.4, pack: '#1a2846', roll: '#3d4f6e', glove: '#1d2129', gun: '#262a31', metal: '#4b525d',
  pouch: '#26395f', stripe: '#9fd2ff', stripeEmit: 0.9, trousers: '#22396a', boot: '#171a21',
};
const LEADER = {
  ...SOLDIER, uniform: '#2a4f9a', vest: '#d9a032', pad: '#f0c24a', helmet: '#f2c64c', rim: '#a8741a', visor: '#ffe28a', visorEmit: 1.6,
  stripe: '#fff1c4', stripeEmit: 1.2, crest: '#e3342f', cape: '#c9262a', leader: true,
};
export function soldierGeos(lod = 0) { return trooper(SOLDIER, lod); }
export function leaderGeos() { return trooper(LEADER, 0); }

// ---------------------------------------------------------------- zombies
// Hunched walkers: the upper body is built upright and then pitched forward about the hips. Skin and cloth parts
// are masked so every instance can get its own skin tone and shirt colour.
const SKIN = { mask: [1, 0] }, CLOTH = { mask: [0, 1] }, SKIN_DARK = { mask: [0.7, 0] };
export function zombieGeos(armored = false, lod = 0) {
  if (lod === 2) {
    // far LOD: a few boxes with the same masks and silhouette
    const up = [
      part(new THREE.BoxGeometry(0.38, 0.42, 0.26), '#888', 0, 0.27, 0, 0, 0, 0, 1, 1, 1, CLOTH),
      part(new THREE.BoxGeometry(0.24, 0.26, 0.24), '#888', 0, 0.58, -0.07, 0, 0, 0, 1, 1, 1, SKIN),
      part(new THREE.BoxGeometry(0.12, 0.12, 0.56), '#888', 0.24, 0.36, -0.3, 0, 0, 0, 1, 1, 1, SKIN),
      part(new THREE.BoxGeometry(0.12, 0.12, 0.56), '#888', -0.24, 0.3, -0.26, 0, 0, 0, 1, 1, 1, SKIN),
    ];
    if (armored) up.push(part(new THREE.BoxGeometry(0.48, 0.38, 0.32), '#7f8892', 0, 0.28, -0.02));
    _m2.compose(_v.set(0, 0.86, 0), _q.setFromEuler(_e.set(-0.42, 0, 0)), _s.set(1, 1, 1));
    xform(up, _m2);
    return { body: merge([part(new THREE.BoxGeometry(0.34, 0.17, 0.22), '#3d342c', 0, 0.86, 0), ...up]),
      leg: merge([part(new THREE.BoxGeometry(0.15, 0.74, 0.18), '#3d342c', 0, -0.4, 0)]) };
  }
  const r = lod ? 4 : 6, pants = '#3d342c', dark = '#16110e';
  const up = [
    part(cap(0.17, 0.2, r), '#888', 0, 0.27, 0, 0, 0, 0, 1.15, 1, 0.85, CLOTH),
    part(ball(0.13, lod ? 6 : 9, lod ? 4 : 7), '#888', 0, 0.58, -0.07, 0, 0, 0, 0.95, 1.05, 1.02, SKIN),
    part(rbox(0.17, 0.08, 0.13, 0.03, 1), '#3a2a20', 0, 0.48, -0.12, 0.3, 0, 0, 1, 1, 1, SKIN_DARK),
    part(ball(0.025, 5, 4), '#fff1a0', 0.047, 0.6, -0.185, 0, 0, 0, 1, 0.7, 1, { emit: 2.0 }),
    part(ball(0.025, 5, 4), '#fff1a0', -0.047, 0.6, -0.185, 0, 0, 0, 1, 0.7, 1, { emit: 2.0 }),
    limb([0.21, 0.4, 0], [0.25, 0.33, -0.27], 0.064, '#888', CLOTH, r),
    limb([0.25, 0.33, -0.27], [0.22, 0.37, -0.54], 0.055, '#888', SKIN, r),
    part(ball(0.06, 5, 4), '#888', 0.22, 0.37, -0.57, 0, 0, 0, 1, 0.8, 1.3, SKIN),
    limb([-0.21, 0.4, 0], [-0.27, 0.27, -0.21], 0.064, '#888', SKIN, r),
    limb([-0.27, 0.27, -0.21], [-0.23, 0.31, -0.48], 0.055, '#888', SKIN, r),
    part(ball(0.06, 5, 4), '#888', -0.23, 0.31, -0.51, 0, 0, 0, 1, 0.8, 1.3, SKIN),
    part(ball(0.09, 6, 4), '#888', -0.21, 0.42, 0, 0, 0, 0, 1, 0.8, 1, CLOTH),
  ];
  if (!lod) {
    // torn shirt hem, a rip showing skin, and straggly hair
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      up.push(part(cone(0.045, 0.13, 3), '#888', Math.cos(a) * 0.19, 0.06, Math.sin(a) * 0.15, Math.PI, a, (i % 2 ? 0.25 : -0.2), 1, 1, 1, CLOTH));
    }
    up.push(part(ball(0.075, 6, 4), '#888', 0.11, 0.32, -0.14, 0, 0, 0, 1, 1.3, 0.35, SKIN));
    up.push(part(ball(0.06, 6, 4), '#888', -0.1, 0.17, -0.15, 0, 0, 0, 1.2, 0.8, 0.35, SKIN));
    for (let i = 0; i < 3; i++) up.push(part(cone(0.035, 0.12, 3), '#2a2420', (i - 1.5) * 0.06, 0.7, 0.0, -0.5 + i * 0.1, 0, (i - 1.5) * 0.4));
  }
  if (armored) {
    up.push(part(rbox(0.5, 0.4, 0.34, 0.07, lod ? 1 : 2), '#7f8892', 0, 0.28, -0.02));
    up.push(part(rbox(0.2, 0.09, 0.28, 0.04, 1), '#5f6872', 0.29, 0.43, 0));
    up.push(part(rbox(0.2, 0.09, 0.28, 0.04, 1), '#5f6872', -0.29, 0.43, 0));
    up.push(part(new THREE.SphereGeometry(0.16, lod ? 6 : 9, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), '#5f6872', 0, 0.6, -0.06));
    up.push(part(rbox(0.3, 0.05, 0.04, 0.02, 1), '#ff7a3a', 0, 0.56, -0.2, 0, 0, 0, 1, 1, 1, { emit: 1.4 }));
  }
  _m2.compose(_v.set(0, 0.86, 0), _q.setFromEuler(_e.set(-0.42, 0, 0)), _s.set(1, 1, 1));
  xform(up, _m2);
  const body = merge([part(rbox(0.34, 0.17, 0.22, 0.06, lod ? 1 : 2), pants, 0, 0.86, 0), ...up]);
  const leg = merge([
    part(cap(0.078, 0.26, r), pants, 0, -0.2, 0),
    part(cap(0.068, 0.22, r), pants, 0, -0.55, 0),
    part(rbox(0.13, 0.11, 0.24, 0.04, 1), dark, 0, -0.71, -0.03),
  ]);
  return { body, leg };
}
export const SKIN_TONES = ['#8fae78', '#9fb39a', '#b5b07a', '#8b9cab', '#a69a8a', '#7e9a6a', '#b2a49a', '#9a8fb0'];
export const CLOTH_TONES = ['#6b7c88', '#7a5a4a', '#55606e', '#8a7a5a', '#4e5f4a', '#6e4e5e', '#8c8c80', '#4a5470'];
export const RUNNER_CLOTH = '#b2342c';

// ---------------------------------------------------------------- boss
// A hulking brute with real anatomy: heavy traps, pecs, abs, huge forearms, a low jutting head and bone spikes.
// Arms have shoulder and elbow pivots so it can wind up, slam, roar and throw.
let bossShared = null;
function bossAssets() {
  if (bossShared) return bossShared;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.08 });
  const skin = '#6f8f55', skinD = '#56703f', skinL = '#86a566', bone = '#e6dcc2', metal = '#545d68', strap = '#3a2a22', cloth = '#3e3250';
  const torso = merge([
    part(rbox(1.5, 0.55, 1.0, 0.22), cloth, 0, 1.28, 0),
    part(rbox(1.62, 0.16, 1.08, 0.06), metal, 0, 1.5, 0),
    part(rbox(0.5, 0.5, 0.12, 0.05), cloth, 0, 1.0, -0.48, 0.15, 0, 0),
    part(ball(0.72, 16, 12), skin, 0, 1.95, -0.02, -0.2, 0, 0, 1.15, 0.9, 0.82),
    part(ball(0.82, 16, 12), skin, 0, 2.45, 0.02, -0.3, 0, 0, 1.25, 0.82, 0.9),
    part(ball(0.42, 12, 10), skinL, 0.36, 2.48, -0.52, -0.3, 0, 0, 1.15, 0.8, 0.5),
    part(ball(0.42, 12, 10), skinL, -0.36, 2.48, -0.52, -0.3, 0, 0, 1.15, 0.8, 0.5),
    ...[0, 1, 2].flatMap((i) => [-1, 1].map((sd) => part(ball(0.16, 8, 6), skinL, sd * 0.17, 2.06 - i * 0.22, -0.6 + i * 0.03, 0, 0, 0, 1.1, 0.8, 0.5))),
    part(ball(0.62, 14, 10), skinD, 0, 2.95, 0.22, 0, 0, 0, 1.5, 0.75, 1),
    part(ball(0.34, 14, 12), skin, 0, 3.0, -0.6, 0, 0, 0, 1, 0.95, 1.05),
    part(rbox(0.5, 0.2, 0.42, 0.08), skinD, 0, 2.78, -0.72, 0.25, 0, 0),
    ...[-0.16, -0.06, 0.06, 0.16].map((x) => part(cone(0.035, 0.12, 4), bone, x, 2.86, -0.93, Math.PI, 0, 0)),
    part(rbox(0.5, 0.08, 0.16, 0.04), skinD, 0, 3.15, -0.84, -0.2, 0, 0),
    part(ball(0.055, 6, 5), '#ffd23a', 0.13, 3.06, -0.9, 0, 0, 0, 1.2, 0.7, 0.6, { emit: 3.0 }),
    part(ball(0.055, 6, 5), '#ffd23a', -0.13, 3.06, -0.9, 0, 0, 0, 1.2, 0.7, 0.6, { emit: 3.0 }),
    ...[[0.5, 3.2, 0.35, -0.5, -0.4], [-0.5, 3.2, 0.35, -0.5, 0.4], [0.3, 3.35, 0.55, -0.8, -0.2], [-0.3, 3.35, 0.55, -0.8, 0.2], [0, 3.3, 0.7, -1.0, 0], [0, 2.7, 0.85, -1.3, 0], [0, 2.2, 0.85, -1.5, 0]]
      .map(([x, y, z, rx, rz]) => part(cone(0.13, 0.55, 6), bone, x, y, z, rx, 0, rz)),
    part(rbox(1.9, 0.14, 0.18, 0.05), strap, 0, 2.4, -0.05, 0, 0, 0.62),
    part(rbox(0.9, 0.3, 0.9, 0.12), metal, 0.82, 2.92, 0.05, 0, 0, -0.35),
    ...[-0.25, 0, 0.25].map((z) => part(cone(0.07, 0.3, 5), bone, 0.98, 3.12, z, 0, 0, -0.35)),
  ]);
  const upper = (side) => merge([
    part(ball(0.42, 12, 10), skin, 0, 0, 0, 0, 0, 0, 1.1, 1, 1),
    limb([side * 0.05, -0.1, 0], [side * 0.08, -0.9, 0], 0.27, skin, undefined, 12),
    part(ball(0.24, 10, 8), skinL, side * 0.04, -0.45, -0.2, 0, 0, 0, 1, 1.3, 0.7),
  ]);
  const fore = (side) => merge([
    limb([0, 0, 0], [side * 0.02, -0.95, -0.05], 0.3, skin, undefined, 12),
    part(rbox(0.68, 0.36, 0.68, 0.1), metal, side * 0.01, -0.6, -0.03),
    ...[-0.2, 0.2].map((z) => part(cone(0.06, 0.26, 5), bone, side * 0.36, -0.6, z, 0, 0, -side * Math.PI / 2)),
    part(ball(0.36, 12, 10), skinD, side * 0.03, -1.22, -0.07, 0, 0, 0, 1.05, 0.9, 1.1),
    ...[-0.16, -0.05, 0.06, 0.17].map((x) => part(ball(0.09, 6, 5), skinL, side * 0.03 + x, -1.36, -0.32)),
  ]);
  const leg = merge([
    limb([0, 0, 0], [0, -0.62, -0.05], 0.33, cloth, undefined, 12),
    limb([0, -0.62, -0.05], [0, -1.05, 0.02], 0.25, skinD, undefined, 10),
    part(rbox(0.62, 0.24, 0.8, 0.1), '#2a2420', 0, -1.18, -0.12),
    ...[-0.18, 0, 0.18].map((x) => part(cone(0.06, 0.16, 4), bone, x, -1.2, -0.56, -Math.PI / 2, 0, 0)),
  ]);
  bossShared = { mat, torso, upperL: upper(-1), upperR: upper(1), foreL: fore(-1), foreR: fore(1), leg };
  return bossShared;
}
export function buildBoss() {
  const A = bossAssets();
  A.mat.emissive.setRGB(0, 0, 0);
  const group = new THREE.Group(), rig = new THREE.Group();
  group.add(rig);
  const torso = new THREE.Mesh(A.torso, A.mat); torso.castShadow = true; rig.add(torso);
  const pivot = (parent, geo, x, y, z) => {
    const p = new THREE.Group(); p.position.set(x, y, z);
    const mesh = new THREE.Mesh(geo, A.mat); mesh.castShadow = true; p.add(mesh);
    parent.add(p); return p;
  };
  const armL = pivot(rig, A.upperL, -1.22, 2.62, -0.05), armR = pivot(rig, A.upperR, 1.22, 2.62, -0.05);
  const elbowL = pivot(armL, A.foreL, -0.08, -0.95, 0), elbowR = pivot(armR, A.foreR, 0.08, -0.95, 0);
  const legL = pivot(rig, A.leg, -0.45, 1.22, 0), legR = pivot(rig, A.leg, 0.45, 1.22, 0);
  return { group, rig, armL, armR, elbowL, elbowR, legL, legR, mat: A.mat };
}

// ---------------------------------------------------------------- tank
// Sloped hull, skirted tracks with road wheels, faceted turret, mantlet, barrel with muzzle brake, hatch, antenna.
function hullProfile() {
  const s = new THREE.Shape();
  s.moveTo(-2.0, 0); s.lineTo(1.75, 0); s.lineTo(2.05, 0.38); s.lineTo(1.5, 0.78); s.lineTo(-1.85, 0.78); s.lineTo(-2.05, 0.4); s.closePath();
  return s;
}
function turretProfile() {
  const s = new THREE.Shape();
  s.moveTo(-0.95, -0.85); s.lineTo(0.6, -0.95); s.lineTo(1.15, -0.45); s.lineTo(1.15, 0.45); s.lineTo(0.6, 0.95); s.lineTo(-0.95, 0.85); s.lineTo(-1.15, 0); s.closePath();
  return s;
}
let tankShared = null;
function tankAssets() {
  if (tankShared) return tankShared;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.25 });
  const green = '#56713a', dgreen = '#3f5529', track = '#22242a', wheel = '#3a3d42', metal = '#4a4f55';
  const hullG = new THREE.ExtrudeGeometry(hullProfile(), { depth: 2.0, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 });
  hullG.translate(0, 0, -1.0);
  const hull = [part(hullG, green, 0, 5.45, 0, 0, Math.PI / 2, 0)];
  for (const sd of [-1, 1]) {
    hull.push(part(rbox(0.55, 0.62, 4.2, 0.2, 2), track, sd * 1.2, 5.55, 0));
    hull.push(part(rbox(0.12, 0.36, 3.7, 0.04, 1), dgreen, sd * 1.5, 5.74, 0));
    for (let i = 0; i < 6; i++) hull.push(part(cyl(0.26, 0.26, 0.2, 10), wheel, sd * 1.36, 5.48, -1.6 + i * 0.64, 0, 0, Math.PI / 2));
    hull.push(part(rbox(0.3, 0.2, 0.6, 0.05, 1), '#5b4a36', sd * 0.6, 6.32, 1.4));
  }
  hull.push(part(rbox(0.5, 0.12, 0.3, 0.04, 1), '#ffcf6a', 0.75, 5.95, -2.04, 0, 0, 0, 1, 1, 1, { emit: 1.5 }));
  hull.push(part(rbox(0.5, 0.12, 0.3, 0.04, 1), '#ffcf6a', -0.75, 5.95, -2.04, 0, 0, 0, 1, 1, 1, { emit: 1.5 }));
  const turG = new THREE.ExtrudeGeometry(turretProfile(), { depth: 0.55, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 1 });
  const turret = [
    part(turG, dgreen, 0, -0.18, 0, -Math.PI / 2, 0, Math.PI / 2),
    part(rbox(0.7, 0.5, 0.4, 0.08, 2), green, 0, 0.12, -1.1),
    part(cyl(0.1, 0.12, 2.3, 10), metal, 0, 0.14, -2.3, Math.PI / 2, 0, 0),
    part(cyl(0.17, 0.17, 0.36, 10), metal, 0, 0.14, -3.45, Math.PI / 2, 0, 0),
    part(cyl(0.28, 0.3, 0.14, 12), dgreen, 0.35, 0.47, 0.25),
    part(cyl(0.012, 0.012, 1.6, 4), '#222', -0.55, 1.15, 0.55),
    part(rbox(0.5, 0.3, 0.5, 0.06, 1), dgreen, 0, 0.12, 0.9),
  ];
  tankShared = { mat, hull: merge(hull), turret: merge(turret) };
  return tankShared;
}
export function buildTank(containerGeo, containerMat) {
  const A = tankAssets();
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const c = new THREE.Mesh(containerGeo, containerMat);
    c.position.set(0, 1.3 + i * 2.6, 0); c.castShadow = c.receiveShadow = true;
    g.add(c);
  }
  const hull = new THREE.Mesh(A.hull, A.mat); hull.castShadow = true; g.add(hull);
  const turret = new THREE.Group();
  turret.position.set(0, 6.25, 0.2);
  const tm = new THREE.Mesh(A.turret, A.mat); tm.castShadow = true; turret.add(tm);
  g.add(turret);
  return { group: g, turret };
}

// ---------------------------------------------------------------- props and hazards
export function rocketGeo() {
  return merge([
    part(cyl(0.12, 0.12, 0.9, 8), '#d9dde2', 0, 0, 0, Math.PI / 2, 0, 0),
    part(cone(0.12, 0.3, 8), '#e2442f', 0, 0, -0.6, -Math.PI / 2, 0, 0),
    part(rbox(0.5, 0.04, 0.2, 0.01, 1), '#59616b', 0, 0, 0.4),
    part(rbox(0.04, 0.5, 0.2, 0.01, 1), '#59616b', 0, 0, 0.4),
    part(cyl(0.09, 0.05, 0.1, 8), '#ffd27a', 0, 0, 0.5, Math.PI / 2, 0, 0, 1, 1, 1, { emit: 4 }),
  ]);
}
export function boulderGeo() {
  const g = new THREE.IcosahedronGeometry(0.7, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.82 + 0.3 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
  g.computeVertexNormals();
  return merge([part(g, '#6d6258'), part(ball(0.3, 6, 5), '#ff7a2a', 0, 0, 0, 0, 0, 0, 1, 1, 1, { emit: 0.0 })]);
}
// Traffic cone with reflective band.
export function coneGeo() {
  return merge([
    part(rbox(0.5, 0.06, 0.5, 0.03, 1), '#222', 0, 0.03, 0),
    part(cyl(0.05, 0.2, 0.7, 10), '#ff6a1a', 0, 0.4, 0),
    part(cyl(0.11, 0.15, 0.13, 10), '#f4f4f4', 0, 0.42, 0, 0, 0, 0, 1, 1, 1, { emit: 0.5 }),
  ]);
}
// Warning beacon: pole with a lamp head (the lamp flashes via instance colour + bloom).
export function beaconPoleGeo() {
  return merge([
    part(rbox(0.36, 0.1, 0.36, 0.04, 1), '#2b2f36', 0, 0.05, 0),
    part(cyl(0.05, 0.05, 2.4, 6), '#f2c230', 0, 1.25, 0),
    part(cyl(0.055, 0.055, 0.3, 6), '#1b1d22', 0, 1.0, 0),
    part(cyl(0.055, 0.055, 0.3, 6), '#1b1d22', 0, 1.7, 0),
  ]);
}
export function beaconLampGeo() { return merge([part(ball(0.2, 10, 8), '#ffffff', 0, 0, 0, 0, 0, 0, 1, 1, 1, { emit: 1 })]); }
// Burnt-out car wreck.
export function wreckGeo() {
  const body = '#4c4f55', rust = '#6b4a32', dark = '#16181c', glass = '#2b3440';
  return merge([
    part(rbox(1.9, 0.6, 4.1, 0.18, 2), body, 0, 0.62, 0, 0, 0, 0.06),
    part(rbox(1.6, 0.55, 2.0, 0.2, 2), rust, 0.05, 1.12, 0.25, 0.08, 0, 0.1),
    part(rbox(1.5, 0.42, 0.06, 0.04, 1), glass, 0.05, 1.12, -0.78, -0.6, 0, 0.1),
    part(rbox(1.92, 0.2, 0.9, 0.08, 1), rust, 0, 0.98, -1.6, -0.25, 0, 0.12),
    ...[[-0.85, -1.35], [0.85, -1.35], [-0.85, 1.35], [0.85, 1.35]].map(([x, z]) => part(cyl(0.34, 0.34, 0.26, 10), dark, x, 0.3, z, 0, 0, Math.PI / 2)),
    part(rbox(0.4, 0.12, 0.08, 0.03, 1), '#ff5a3a', 0.6, 0.72, 2.06, 0, 0, 0, 1, 1, 1, { emit: 1.2 }),
    part(rbox(0.4, 0.12, 0.08, 0.03, 1), '#ff5a3a', -0.6, 0.72, 2.06, 0, 0, 0, 1, 1, 1, { emit: 1.2 }),
    part(rbox(0.9, 0.4, 0.7, 0.12, 1), '#3b3329', 1.4, 0.2, 1.2, 0.3, 0.6, 0.2),
    part(rbox(0.7, 0.3, 0.6, 0.1, 1), '#3b3329', -1.3, 0.15, -1.8, 0.2, -0.4, -0.2),
  ]);
}
// Swinging-girder gantry: posts on the road edges and a crossbeam; the girder hangs from a pivot at the top.
export function gantryGeo() {
  const y = '#f2c230', k = '#1b1d22';
  const parts = [];
  for (const sd of [-1, 1]) {
    parts.push(part(rbox(0.5, 7.4, 0.5, 0.08, 1), y, sd * 6.7, 3.7, 0));
    for (let i = 0; i < 6; i++) parts.push(part(rbox(0.52, 0.28, 0.52, 0.04, 1), k, sd * 6.7, 0.8 + i * 1.1, 0));
    parts.push(part(ball(0.18, 8, 6), '#ffb020', sd * 6.7, 7.6, 0, 0, 0, 0, 1, 1, 1, { emit: 2.5 }));
  }
  parts.push(part(rbox(14, 0.55, 0.6, 0.1, 1), y, 0, 7.3, 0));
  for (let i = -6; i <= 6; i++) parts.push(part(rbox(0.5, 0.56, 0.62, 0.02, 1), k, i, 7.3, 0, 0, 0, 0.6));
  return merge(parts);
}
export function girderGeo() {
  return merge([
    part(cyl(0.04, 0.04, 4.8, 4), '#2a2a2a', -0.25, -2.4, 0, 0, 0, 0.05),
    part(cyl(0.04, 0.04, 4.8, 4), '#2a2a2a', 0.25, -2.4, 0, 0, 0, -0.05),
    part(rbox(2.2, 0.55, 0.7, 0.06, 1), '#c43c2c', 0, -5.0, 0),
    ...[-0.8, -0.27, 0.27, 0.8].map((x) => part(rbox(0.2, 0.57, 0.72, 0.02, 1), '#f2f2f2', x, -5.0, 0)),
  ]);
}
// Railing segment (2.5 long): top rail, mid rail and a post. Instanced along the deck edges.
export function railGeo() {
  return merge([
    part(rbox(0.14, 0.12, 2.52, 0.04, 1), '#9aa6b4', 0, 1.0, 0),
    part(rbox(0.1, 0.08, 2.52, 0.03, 1), '#7f8b99', 0, 0.55, 0),
    part(rbox(0.16, 1.05, 0.16, 0.04, 1), '#5f6b78', 0, 0.52, -1.25),
    part(rbox(0.06, 0.05, 2.5, 0.02, 1), '#ffb43a', 0.06, 0.78, 0, 0, 0, 0, 1, 1, 1, { emit: 0.35 }),
  ]);
}
// Street lamp on the deck edge, head leaning over the road.
export function lampGeo() {
  return merge([
    part(cyl(0.09, 0.12, 7, 8), '#59626d', 0, 3.5, 0),
    part(limb ? cyl(0.06, 0.06, 1.6, 6) : cyl(0.06, 0.06, 1.6, 6), '#59626d', -0.7, 7.0, 0, 0, 0, Math.PI / 2 - 0.2),
    part(rbox(0.7, 0.16, 0.34, 0.06, 1), '#3a414a', -1.45, 7.1, 0),
    part(rbox(0.58, 0.05, 0.26, 0.02, 1), '#fff2cf', -1.45, 7.0, 0, 0, 0, 0, 1, 1, 1, { emit: 3.0 }),
  ]);
}
