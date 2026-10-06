// Level data for Hold the Span.
// Every event has a time `t` in seconds at the level's base run speed; the game
// converts it to a distance on the bridge (z = -t * speed).
//   gate  : layout 'pair' (two half-road gates) or 'tri' (three lanes, null = open lane)
//           ops: '+n' add, '-n' remove, 'xn' multiply, '/n' divide
//   horde : count, optional x (center), w (half width), mix {r: runner share, a: armored share}
//   tank  : container-top tank on side -1 (left) or 1 (right) that fires `shots` rockets
//   boss  : scale only
// Level rows here carry shape only (name, theme, stars, seed, script). Every difficulty number (speed, horde size,
// toughness, gate penalties, spacing, boss HP and attacks, hazards, formation) comes from DIFFICULTY in config.js.

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const G = (t, layout, ops) => ({ t, type: 'gate', layout, ops });
const H = (t, count, o = {}) => ({ t, type: 'horde', count, ...o });
const T = (t, side, shots = 4) => ({ t, type: 'tank', side, shots });
const B = (t, o = {}) => ({ t, type: 'boss', ...o });

export const LEVELS = [
  {
    id: 1, name: 'Harbor Span', blurb: 'Learn the gates. Grow the squad.',
    theme: 'day', stars: [14, 24], seed: 11,
    events: [
      G(1, 'pair', ['+2', '+1']),
      G(4.5, 'pair', ['x2', '+2']),
      H(5, 8),
      G(9, 'pair', ['+3', '-1']),
      G(12, 'tri', [null, '-2', null]),
      H(13, 14),
      T(18, -1, 4),
      H(19, 18, { x: -2, w: 4 }),
      G(24, 'pair', ['+4', 'x2']),
      H(27, 30),
      G(32, 'tri', ['-3', null, '-3']),
      H(34, 28, { mix: { r: 0.1 } }),
      G(38, 'pair', ['+5', '+2']),
      B(42, { scale: 3.2 }),
    ],
  },
  {
    id: 2, name: 'Container Yard', blurb: 'Runners close the gap fast.',
    theme: 'dusk', stars: [18, 34], seed: 23,
    events: [
      G(1, 'pair', ['+7', '+5']),
      G(3, 'pair', ['+3', '-2']),
      H(4, 16),
      G(8, 'tri', ['+2', '-3', '+2']),
      H(10, 22, { mix: { r: 0.3 } }),
      G(14, 'pair', ['x2', '-4']),
      T(15, 1, 5),
      H(16, 32, { mix: { r: 0.25 } }),
      G(21, 'tri', [null, '+6', null]),
      H(23, 26, { x: 3, w: 3, mix: { r: 0.4 } }),
      H(25, 26, { x: -3, w: 3 }),
      G(29, 'pair', ['-5', '+3']),
      G(32, 'pair', ['x2', '+8']),
      H(34, 44, { mix: { r: 0.3 } }),
      T(38, -1, 5),
      H(40, 40, { mix: { r: 0.35 } }),
      G(45, 'tri', ['-4', '+4', '-4']),
      H(47, 36, { mix: { r: 0.4 } }),
      B(52, { scale: 3.6 }),
    ],
  },
  {
    id: 3, name: 'Night Overpass', blurb: 'Armored walkers soak up fire.',
    theme: 'night', stars: [30, 55], seed: 37,
    events: [
      G(1, 'pair', ['+6', '+4']),
      G(2.6, 'pair', ['x2', '+5']),
      H(3.6, 20),
      G(7, 'pair', ['x2', '-3']),
      H(9, 26, { mix: { a: 0.15 } }),
      G(13, 'tri', ['-4', '+3', '-4']),
      T(14, -1, 5),
      H(16, 34, { mix: { a: 0.2, r: 0.1 } }),
      G(20, 'pair', ['+6', 'x2']),
      H(22, 40, { mix: { r: 0.25 } }),
      G(27, 'tri', ['+5', null, '-6']),
      H(29, 30, { x: -3, w: 3, mix: { a: 0.3 } }),
      H(31, 30, { x: 3, w: 3, mix: { r: 0.4 } }),
      G(35, 'pair', ['x2', '+10']),
      T(36, 1, 6),
      H(38, 56, { mix: { a: 0.2, r: 0.2 } }),
      G(43, 'tri', ['-8', '-3', '-8']),
      H(45, 44, { mix: { a: 0.25 } }),
      G(50, 'pair', ['+8', '-2']),
      H(52, 50, { mix: { r: 0.3, a: 0.2 } }),
      B(58, { scale: 4 }),
    ],
  },
  {
    id: 4, name: 'Storm Causeway', blurb: 'Split hordes and divide gates.',
    theme: 'storm', stars: [45, 95], seed: 41,
    events: [
      G(1, 'pair', ['+7', '+5']),
      G(2.6, 'pair', ['x2', '+6']),
      H(3.6, 22, { mix: { r: 0.2 } }),
      G(7, 'tri', ['/2', '+4', '/2']),
      H(9, 36, { mix: { a: 0.2 } }),
      G(13, 'pair', ['-6', '+6']),
      T(14, 1, 6),
      H(15, 46, { mix: { r: 0.3, a: 0.15 } }),
      G(20, 'tri', ['+8', '-10', '/2']),
      H(22, 36, { x: -3, w: 3, mix: { a: 0.3 } }),
      H(23, 36, { x: 3, w: 3, mix: { r: 0.4 } }),
      G(28, 'pair', ['+12', '/2']),
      T(29, -1, 6),
      H(31, 58, { mix: { r: 0.25, a: 0.2 } }),
      G(36, 'tri', ['-5', 'x2', '-5']),
      H(38, 54, { mix: { a: 0.3 } }),
      G(43, 'pair', ['+10', '-8']),
      H(45, 66, { mix: { r: 0.3, a: 0.2 } }),
      T(48, 1, 7),
      G(52, 'tri', ['-12', null, '-12']),
      H(54, 60, { mix: { r: 0.4, a: 0.25 } }),
      G(59, 'pair', ['+20', '+15']),
      H(61, 62, { mix: { a: 0.35 } }),
      B(67, { scale: 4.4 }),
    ],
  },
  {
    id: 5, name: 'Last Light Bridge', blurb: 'The biggest horde. The biggest brute.',
    theme: 'ember', stars: [60, 120], seed: 53,
    events: [
      G(1, 'pair', ['+8', '+5']),
      G(2.6, 'pair', ['x2', '+6']),
      H(3.6, 26, { mix: { r: 0.25 } }),
      G(7, 'tri', ['-6', '+10', '-6']),
      H(9, 44, { mix: { a: 0.2, r: 0.1 } }),
      G(13, 'pair', ['+8', '/2']),
      T(14, -1, 6),
      H(15, 56, { mix: { r: 0.35, a: 0.15 } }),
      G(20, 'tri', ['+10', '-15', 'x2']),
      H(22, 44, { x: -3, w: 3, mix: { a: 0.35 } }),
      H(23, 44, { x: 3, w: 3, mix: { r: 0.45 } }),
      T(26, 1, 7),
      G(28, 'pair', ['+15', '-10']),
      H(30, 72, { mix: { r: 0.3, a: 0.25 } }),
      G(35, 'tri', ['/2', '+12', '/2']),
      H(37, 66, { mix: { a: 0.35 } }),
      G(42, 'pair', ['+15', '-12']),
      T(43, -1, 8),
      H(44, 84, { mix: { r: 0.35, a: 0.25 } }),
      G(50, 'tri', ['-20', '+12', '-20']),
      H(52, 70, { x: 0, w: 4, mix: { a: 0.4 } }),
      G(57, 'pair', ['+12', '+20']),
      H(59, 90, { mix: { r: 0.4, a: 0.3 } }),
      T(62, 1, 8),
      G(65, 'tri', ['-25', '/2', '+20']),
      H(67, 80, { mix: { r: 0.35, a: 0.35 } }),
      G(72, 'pair', ['-20', '+25']),
      H(74, 70, { mix: { a: 0.45 } }),
      B(80, { scale: 5 }),
    ],
  },
];

// Endless mode: an infinite chain of generated cycles, each ending in a boss. The cycle index `c` only varies the
// pattern; difficulty for cycle c comes from difficultyFor('E', c) in config.js.
export function endlessCycle(c, seed = 777) {
  const rand = mulberry32(seed + c * 101);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const ev = [];
  const good = () => pick(['+' + (3 + Math.floor(rand() * (4 + c * 2))), 'x2', '+' + (5 + c * 3)]);
  const bad = () => pick(['-' + (2 + Math.floor(rand() * (3 + c * 3))), '/2']);
  let t = 1;
  if (c === 0) {
    // wave 1 starts from a lone leader: two growth rows before the first horde
    ev.push(G(t, 'pair', ['+7', '+5']));
    t += 2.5;
    ev.push(G(t, 'pair', ['x2', '+4']));
  } else ev.push(G(t, 'pair', rand() < 0.5 ? [good(), good()] : ['x2', good()]));
  const sections = 5 + Math.min(c, 3);
  for (let s = 0; s < sections; s++) {
    t += 3;
    const count = Math.round(16 + s * 6 + Math.min(c, 4) * 5);
    const mix = { r: 0.15, a: 0.1 + s * 0.01 };
    if (rand() < 0.3) {
      ev.push(H(t, Math.round(count * 0.6), { x: -3, w: 3, mix }));
      ev.push(H(t + 1.2, Math.round(count * 0.6), { x: 3, w: 3, mix }));
    } else ev.push(H(t, count, { mix }));
    if (rand() < 0.45) ev.push(T(t + 1, rand() < 0.5 ? -1 : 1, 5 + Math.min(c, 3)));
    t += 4;
    const r = rand();
    if (r < 0.4) ev.push(G(t, 'pair', rand() < 0.5 ? [good(), bad()] : [bad(), good()]));
    else if (r < 0.75) {
      const ops = [bad(), bad(), bad()];
      ops[Math.floor(rand() * 3)] = good();
      ev.push(G(t, 'tri', ops));
    } else {
      const ops = [null, null, null];
      ops[Math.floor(rand() * 3)] = bad();
      ev.push(G(t, 'tri', ops));
      ev.push(G(t + 2.5, 'pair', [good(), good()]));
    }
  }
  t += 4;
  ev.push(B(t, { scale: Math.min(5.2, 4.2 + c * 0.25) }));
  return { events: ev };
}
