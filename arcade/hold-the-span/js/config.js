// Hold the Span integration config: one place for embedding settings.
// Difficulty (DIFFICULTY / ENDLESS) and billboard ads (ADS) live here too so a host site edits one file.

// Embedding. The game only uses relative URLs, so it runs from any subpath (e.g. /games/hold-the-span/).
// The "Back to games" link target can be set, highest priority first, by:
//   1. window.HTS_CONFIG = { backHref: '/games/' } set by the host page before js/main.js loads
//   2. <html data-back-href="../"> on index.html
//   3. ?back=/games/ in the URL (relative or same-origin paths only; anything else is ignored)
//   4. the default below
// An empty string hides the link.
export const EMBED = { backHref: '../', backLabel: 'Back to games' };

export function resolveBackHref() {
  const cfg = (window.HTS_CONFIG && typeof window.HTS_CONFIG.backHref === 'string') ? window.HTS_CONFIG.backHref : null;
  if (cfg !== null) return cfg;
  const attr = document.documentElement.getAttribute('data-back-href');
  if (attr !== null) return attr;
  const q = new URLSearchParams(location.search).get('back');
  if (q !== null && isSafeRelative(q)) return q;
  return EMBED.backHref;
}

// Only same-site paths: no scheme, no protocol-relative //host, no backslashes.
function isSafeRelative(href) {
  if (href === '') return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//') || href.includes('\\')) return false;
  try { return new URL(href, location.href).origin === location.origin; } catch (e) { return false; }
}

// ---------------------------------------------------------------- difficulty ramp
// One row per level. The event scripts in levels.js give each level its shape (where gates, hordes, tanks and
// the boss sit); every number that makes a level harder comes from this table.
//   speed        run speed (world units / s)
//   horde        multiplier on scripted horde sizes          hp      zombie toughness multiplier
//   runner/armor share (0-1) of fast / armored zombies added to every horde's mix
//   gate         multiplier on negative gate values (-n), min 1; divide gates (/2) only appear where scripted
//   spacing      multiplier on time between events (higher = more breathing room)
//   boss         hp, smash (soldiers lost per hit), smashEvery (s), escorts (zombies per wave), escortEvery (s),
//                throwEvery (s between boulder throws while approaching, 0 = never), throwHit (soldiers lost per hit)
//   tankShots    rockets per friendly tank
//   hazards      count (per level, or per Endless cycle), types allowed, gap = hole width across the road (units),
//                gapDepth = hole length along the road, railGap = length of missing railing, sweepSpeed (rad/s),
//                telegraphS = seconds before contact when the hazard's beacons start flashing (telegraph distance =
//                telegraphS * speed). Stripes, cones and beacons are already in place 130 units out (HAZ_AHEAD in main.js).
//   formation    spacing between soldiers, minSpacing when compressed, compressFrom (count where spacing starts
//                shrinking), maxVisible (soldiers drawn; the rest still count and fight), growth ('hex': new soldiers
//                fill hex rings outward from the leader, flanks first, then front, then back), promote (who replaces a
//                lost leader: 'nearest' soldier to the leader's slot, or 'next' in ring order)
//   billboards   ad placements in the city for this level (1 or 2; 2 are always at least 300 units apart)
export const DIFFICULTY = [
  { level: 1, speed: 10.5, horde: 0.8, hp: 0.9, runner: 0, armor: 0, gate: 0.67, spacing: 1.15,
    boss: { hp: 420, smash: 1, smashEvery: 1.3, escorts: 0, escortEvery: 0, throwEvery: 0, throwHit: 0 }, tankShots: 4,
    hazards: { count: 1, types: ['railgap'], gap: 0, gapDepth: 0, railGap: 10, sweepSpeed: 0, telegraphS: 3.0 },
    formation: { spacing: 0.66, minSpacing: 0.46, compressFrom: 40, maxVisible: 200, growth: 'hex', promote: 'nearest' }, billboards: 1 },
  { level: 2, speed: 11.3, horde: 1.0, hp: 1.1, runner: 0.05, armor: 0, gate: 1.0, spacing: 1.05,
    boss: { hp: 1100, smash: 3, smashEvery: 1.1, escorts: 5, escortEvery: 4.5, throwEvery: 0, throwHit: 0 }, tankShots: 5,
    hazards: { count: 2, types: ['railgap', 'wreck'], gap: 0, gapDepth: 0, railGap: 12, sweepSpeed: 0, telegraphS: 2.8 },
    formation: { spacing: 0.64, minSpacing: 0.45, compressFrom: 45, maxVisible: 200, growth: 'hex', promote: 'nearest' }, billboards: 1 },
  { level: 3, speed: 11.8, horde: 1.1, hp: 1.3, runner: 0.05, armor: 0.05, gate: 1.1, spacing: 1.0,
    boss: { hp: 2800, smash: 4, smashEvery: 1.0, escorts: 8, escortEvery: 4.0, throwEvery: 6, throwHit: 2 }, tankShots: 6,
    hazards: { count: 3, types: ['railgap', 'wreck', 'hole'], gap: 3.2, gapDepth: 4, railGap: 14, sweepSpeed: 0, telegraphS: 2.6 },
    formation: { spacing: 0.62, minSpacing: 0.44, compressFrom: 50, maxVisible: 200, growth: 'hex', promote: 'nearest' }, billboards: 2 },
  { level: 4, speed: 12.2, horde: 1.2, hp: 1.55, runner: 0.1, armor: 0.08, gate: 1.2, spacing: 0.95,
    boss: { hp: 8000, smash: 6, smashEvery: 0.95, escorts: 12, escortEvery: 3.6, throwEvery: 5, throwHit: 3 }, tankShots: 7,
    hazards: { count: 4, types: ['railgap', 'wreck', 'hole', 'sweeper'], gap: 3.6, gapDepth: 4.5, railGap: 16, sweepSpeed: 1.5, telegraphS: 2.4 },
    formation: { spacing: 0.62, minSpacing: 0.43, compressFrom: 55, maxVisible: 200, growth: 'hex', promote: 'nearest' }, billboards: 2 },
  { level: 5, speed: 12.6, horde: 1.3, hp: 1.85, runner: 0.12, armor: 0.12, gate: 1.3, spacing: 0.9,
    boss: { hp: 15000, smash: 8, smashEvery: 0.9, escorts: 16, escortEvery: 3.2, throwEvery: 4, throwHit: 4 }, tankShots: 8,
    hazards: { count: 5, types: ['railgap', 'wreck', 'hole', 'sweeper'], gap: 4.0, gapDepth: 5, railGap: 18, sweepSpeed: 1.7, telegraphS: 2.2 },
    formation: { spacing: 0.6, minSpacing: 0.42, compressFrom: 60, maxVisible: 200, growth: 'hex', promote: 'nearest' }, billboards: 2 },
];
// Telegraph distance (units of road ahead when the warning beacons start flashing) for each row.
for (const row of DIFFICULTY) row.hazards.telegraphDist = Math.round(row.hazards.telegraphS * row.speed);

// Endless: wave 1 (cycle 0) plays like level 2, then level 3, 4 and 5; every further wave adds `perCycle` on top of
// level 5 (boss hp multiplies), up to `caps`.
export const ENDLESS = {
  startRow: 1,
  perCycle: { speed: 0.3, horde: 0.12, hp: 0.15, runner: 0.03, armor: 0.03, gate: 0.08, spacing: -0.02,
    bossHp: 1.35, smash: 1, smashEvery: -0.03, escorts: 2, escortEvery: -0.15, throwEvery: -0.3, throwHit: 1,
    tankShots: 1, hazards: 1, gap: 0.2, gapDepth: 0.2, railGap: 1, sweepSpeed: 0.1, telegraphS: -0.05 },
  caps: { speed: 14.5, horde: 2.4, hp: 3.6, runner: 0.4, armor: 0.4, gate: 2.2, spacing: 0.75, smash: 14, smashEvery: 0.6,
    escorts: 24, escortEvery: 2.0, throwEvery: 2.5, throwHit: 8, tankShots: 10, hazards: 9, gap: 4.8, gapDepth: 6,
    railGap: 24, sweepSpeed: 2.2, telegraphS: 2.0 },
  billboardsPerCycle: 1,
};

// Leader: every run starts with one leader, drawn larger with a cape and gold trim. If the leader is lost the
// nearest soldier is promoted (brief highlight); the run only ends when the count reaches zero.
export const LEADER = { scale: 1.18, promote: 'nearest', highlightS: 1.2 };

export function difficultyFor(levelId, cycle = 0) {
  if (levelId !== 'E') return DIFFICULTY[Math.max(0, Math.min(DIFFICULTY.length - 1, levelId - 1))];
  const base = DIFFICULTY[Math.min(DIFFICULTY.length - 1, ENDLESS.startRow + cycle)];
  const extra = Math.max(0, ENDLESS.startRow + cycle - (DIFFICULTY.length - 1));
  if (!extra) return { ...base, level: 'E', cycle, billboards: ENDLESS.billboardsPerCycle };
  const p = ENDLESS.perCycle, c = ENDLESS.caps;
  const add = (v, k) => Math.round(1000 * (c[k] !== undefined ? (p[k] < 0 ? Math.max(c[k], v + p[k] * extra) : Math.min(c[k], v + p[k] * extra)) : v + p[k] * extra)) / 1000;
  const b = base.boss, h = base.hazards;
  return {
    level: 'E', cycle, speed: add(base.speed, 'speed'), horde: add(base.horde, 'horde'), hp: add(base.hp, 'hp'),
    runner: add(base.runner, 'runner'), armor: add(base.armor, 'armor'), gate: add(base.gate, 'gate'), spacing: add(base.spacing, 'spacing'),
    boss: { hp: Math.round(b.hp * Math.pow(p.bossHp, extra)), smash: add(b.smash, 'smash'), smashEvery: add(b.smashEvery, 'smashEvery'),
      escorts: add(b.escorts, 'escorts'), escortEvery: add(b.escortEvery, 'escortEvery'), throwEvery: add(b.throwEvery, 'throwEvery'), throwHit: add(b.throwHit, 'throwHit') },
    tankShots: add(base.tankShots, 'tankShots'),
    hazards: { count: Math.round(Math.min(c.hazards, h.count + p.hazards * extra)), types: h.types, gap: add(h.gap, 'gap'), gapDepth: add(h.gapDepth, 'gapDepth'),
      railGap: add(h.railGap, 'railGap'), sweepSpeed: add(h.sweepSpeed, 'sweepSpeed'), telegraphS: add(h.telegraphS, 'telegraphS'),
      telegraphDist: Math.round(add(h.telegraphS, 'telegraphS') * add(base.speed, 'speed')) },
    formation: base.formation, billboards: ENDLESS.billboardsPerCycle,
  };
}

// ---------------------------------------------------------------- billboard ads
// One list of creatives; placements cycle through it in order. Each placement is real 3D geometry in the city
// (a rooftop frame, a building face, or a sign gantry high over the road), never an HTML overlay, and is not
// clickable during a run.
//   id       unique key (textures are cached and shared per id)
//   sponsor  sponsor name (used as the alt text in the README/report; not drawn separately)
//   image    relative path to the creative, 2:1 aspect (1024x512 recommended), bundled with the game
//   link     optional sponsor URL for the host page (the game never opens it mid-run)
//   headline / sub / bg / accent / fg: text fallback drawn in code when `image` is missing or fails to load
// To swap an ad: drop a 1024x512 PNG/JPG/WebP into ads/ and point `image` at it (or add another entry).
// Valorem prototype: sponsor placements are off.
export const ADS = [];
// Placement kinds rotate per level in this order: 'rooftop' (lit frame on a warehouse roof behind the container
// stacks) and 'facade' (mounted on the corner face of a tower block). Both stand beside the road with their inner edge
// outside it, so they never cover the squad, gates or hordes. 'overpass' (a high sign gantry across the bridge) is
// also supported; it sits above the camera, which puts it off the top of a portrait phone screen, so it is left out
// of the default rotation (add it for landscape/desktop-first hosts). A gantry in the boss arena becomes a rooftop.
export const AD_KINDS = ['rooftop', 'facade'];
