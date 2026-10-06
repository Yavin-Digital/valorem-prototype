/*
 * Precinct Rumble: stage layout + balance. Tweak numbers here; no other file needs edits.
 *
 * Stage fields:
 *   length   world width in pixels (camera stops at length-320 for the boss)
 *   waves    { at: cameraX where the screen locks, spawn: [[type, side, delayFrames, screenX], ...] }
 *            side: 'L' / 'R' walk in from the screen edge, 'M' climbs out of a manhole, 'D' steps out of a doorway,
 *            'W' jumps down from a window. screenX (0-320) places M / D / W entrances.
 *   props    breakables { x, y, type, drop }  type: hydrant | trash | newsbox | crate | barrel | bench | vent
 *            drop: pizza | hotdog | pretzel | donut (health), badge | medal (score), or null
 *   loose    throwables lying on the ground { x, y, kind: lid | cone | crate | barrel }
 *   food     loose food on the ground { x, y, type }
 *   The walkable floor band is y = 122 (back) to 174 (front).
 *   boss     key into PR_CONFIG.bosses (and PR_ART.BOSSES)
 */
window.PR_CONFIG = {
  lives: 3,
  continueSeconds: 9,
  extraLifeEvery: 30000,
  difficulty: 1.0,          // multiplies all enemy damage
  maxAttackers: 2,          // thugs allowed to swing at once
  comboWindow: 18,          // frames to chain the next punch
  respawnIframes: 120, getupIframes: 60,
  playerDamage: { jab: 3, cross: 3, hook: 4, kick: 6, jumpkick: 6, knee: 3, throw: 9, slam: 22, dash: 7, special: 8 },
  food: { pizza: 22, hotdog: 14, pretzel: 8, donut: 10, badge: 0, medal: 0 },
  scoreItems: { badge: 1000, medal: 500 },
  // co-op scaling: each extra player adds this much enemy HP, boss HP and extra thugs per wave (fraction of the wave size)
  coop: { maxPlayers: 4, hpPerPlayer: 0.35, bossHpPerPlayer: 0.5, extraEnemiesPerPlayer: 0.4, attackersPerPlayer: 1 },
  // breakables: hp = hits to break; leaves = throwable left behind
  props: { hydrant: { hp: 4 }, trash: { hp: 2, leaves: 'lid' }, newsbox: { hp: 3 }, crate: { hp: 2 }, barrel: { hp: 3 }, bench: { hp: 3 }, vent: { hp: 3 } },
  // throwables: damage on hit; crates shatter on impact, barrels roll through everything in their path
  objects: { lid: { dmg: 7, speed: 4.4 }, cone: { dmg: 6, speed: 4.4 }, crate: { dmg: 10, speed: 3.9, shatter: true }, barrel: { dmg: 9, speed: 3.4, roll: true } },
  enemyThrowChance: 0.006,  // per-frame chance a thug goes for a loose object
  enemies: {
    grunt: { hp: 14, speed: 0.62, dmg: 4, windup: 16, cooldown: [50, 110], score: 100, reach: 20 },
    grunt2: { hp: 16, speed: 0.7, dmg: 4, windup: 14, cooldown: [45, 100], score: 120, reach: 20 },
    dasher: { hp: 12, speed: 0.85, dmg: 6, windup: 22, cooldown: [80, 130], score: 150, reach: 26 },
    brick: { hp: 34, speed: 0.45, dmg: 8, windup: 24, cooldown: [80, 140], score: 300, reach: 24, armor: 2 },
    pitcher: { hp: 12, speed: 0.6, dmg: 5, windup: 18, cooldown: [100, 150], score: 200, reach: 0 }
  },
  bosses: {
    rocco: { hp: 120, speed: 0.8, dmg: 8, score: 5000, armorEvery: 4 },
    tess: { hp: 110, speed: 1.35, dmg: 7, score: 6000, armorEvery: 1 },
    gus: { hp: 160, speed: 0.7, dmg: 10, score: 7000, armorEvery: 5 },
    duke: { hp: 170, speed: 0.95, dmg: 8, score: 10000, armorEvery: 4 }
  }
};

window.PR_STAGES = [
  {
    id: 'street', bg: 'street', music: 'street', length: 1900, boss: 'rocco',
    card: 'STAGE 1', name: 'MULBERRY AVENUE',
    intro: ['The Crooked Crown is squeezing', 'every shop on Mulberry Avenue.', 'Walk the beat and clear the block.'],
    waves: [
      { at: 90, spawn: [['grunt', 'R', 0], ['grunt', 'M', 40, 230], ['grunt2', 'L', 100]] },
      { at: 420, spawn: [['grunt', 'D', 0, 200], ['pitcher', 'R', 30], ['grunt2', 'L', 70]] },
      { at: 780, spawn: [['dasher', 'R', 0], ['grunt', 'W', 30, 120], ['grunt2', 'L', 60], ['grunt', 'M', 140, 250]] },
      { at: 1160, spawn: [['brick', 'R', 0], ['grunt', 'D', 50, 90], ['pitcher', 'W', 100, 240]] }
    ],
    props: [{ x: 210, y: 126, type: 'hydrant', drop: null }, { x: 300, y: 126, type: 'trash', drop: 'pretzel' }, { x: 560, y: 128, type: 'crate', drop: 'medal' },
      { x: 700, y: 128, type: 'newsbox', drop: 'badge' }, { x: 960, y: 127, type: 'hydrant', drop: 'donut' }, { x: 1080, y: 126, type: 'trash', drop: 'hotdog' },
      { x: 1330, y: 128, type: 'barrel', drop: null }, { x: 1500, y: 127, type: 'crate', drop: 'pizza' }, { x: 1640, y: 126, type: 'newsbox', drop: 'medal' }],
    loose: [{ x: 150, y: 150, kind: 'cone' }, { x: 470, y: 160, kind: 'cone' }, { x: 880, y: 145, kind: 'crate' }, { x: 1250, y: 158, kind: 'barrel' }],
    food: []
  },
  {
    id: 'subway', bg: 'subway', music: 'subway', length: 2000, boss: 'tess',
    card: 'STAGE 2', name: 'ORCHARD JUNCTION',
    intro: ['The gang fled underground.', 'Tess and her crew are jumping', 'turnstiles all along the line.'],
    waves: [
      { at: 100, spawn: [['dasher', 'R', 0], ['grunt', 'D', 30, 220], ['grunt2', 'R', 80]] },
      { at: 460, spawn: [['pitcher', 'R', 0], ['pitcher', 'L', 40], ['grunt', 'D', 80, 140], ['dasher', 'R', 160]] },
      { at: 860, spawn: [['brick', 'R', 0], ['dasher', 'L', 60], ['grunt2', 'D', 120, 250]] },
      { at: 1260, spawn: [['dasher', 'R', 0], ['dasher', 'L', 20], ['grunt', 'D', 90, 110], ['pitcher', 'R', 150]] }
    ],
    props: [{ x: 250, y: 125, type: 'bench', drop: null }, { x: 360, y: 126, type: 'trash', drop: 'hotdog' }, { x: 620, y: 125, type: 'bench', drop: 'medal' },
      { x: 820, y: 128, type: 'crate', drop: 'pretzel' }, { x: 1000, y: 126, type: 'newsbox', drop: 'donut' }, { x: 1200, y: 126, type: 'trash', drop: 'pizza' },
      { x: 1420, y: 125, type: 'bench', drop: 'badge' }, { x: 1600, y: 128, type: 'newsbox', drop: 'hotdog' }, { x: 1750, y: 127, type: 'barrel', drop: null }],
    loose: [{ x: 180, y: 155, kind: 'lid' }, { x: 540, y: 150, kind: 'barrel' }, { x: 1100, y: 160, kind: 'cone' }, { x: 1500, y: 150, kind: 'crate' }],
    food: []
  },
  {
    id: 'rooftop', bg: 'rooftop', music: 'rooftop', length: 2000, boss: 'gus',
    card: 'STAGE 3', name: 'SKYLINE HEIGHTS',
    intro: ['Crown lookouts are signaling', 'from the rooftops. Gargoyle Gus', 'guards the lookout post.'],
    waves: [
      { at: 100, spawn: [['brick', 'R', 0], ['grunt', 'D', 40, 200], ['grunt2', 'R', 100]] },
      { at: 480, spawn: [['pitcher', 'R', 0], ['dasher', 'L', 30], ['grunt', 'M', 70, 180], ['grunt2', 'L', 140]] },
      { at: 880, spawn: [['brick', 'R', 0], ['brick', 'L', 60], ['pitcher', 'D', 120, 120]] },
      { at: 1280, spawn: [['dasher', 'R', 0], ['grunt2', 'M', 20, 90], ['dasher', 'R', 80], ['brick', 'L', 160]] }
    ],
    props: [{ x: 240, y: 126, type: 'vent', drop: null }, { x: 330, y: 126, type: 'crate', drop: 'hotdog' }, { x: 600, y: 127, type: 'vent', drop: 'medal' },
      { x: 760, y: 128, type: 'crate', drop: 'badge' }, { x: 1000, y: 126, type: 'barrel', drop: 'donut' }, { x: 1150, y: 126, type: 'trash', drop: 'pizza' },
      { x: 1400, y: 127, type: 'vent', drop: 'pretzel' }, { x: 1580, y: 128, type: 'crate', drop: 'pizza' }],
    loose: [{ x: 170, y: 150, kind: 'crate' }, { x: 520, y: 160, kind: 'lid' }, { x: 930, y: 150, kind: 'barrel' }, { x: 1330, y: 158, kind: 'cone' }],
    food: []
  },
  {
    id: 'warehouse', bg: 'warehouse', music: 'warehouse', length: 2200, boss: 'duke',
    card: 'STAGE 4', name: 'CROWN IMPORTS',
    intro: ['The trail ends at the docks.', 'Duke Dellacroix runs the whole', 'syndicate from this warehouse.'],
    waves: [
      { at: 100, spawn: [['grunt', 'R', 0], ['grunt2', 'D', 20, 210], ['dasher', 'R', 60], ['pitcher', 'W', 120, 150]] },
      { at: 500, spawn: [['brick', 'R', 0], ['dasher', 'D', 40, 100], ['dasher', 'R', 100]] },
      { at: 900, spawn: [['pitcher', 'R', 0], ['pitcher', 'W', 30, 80], ['brick', 'D', 70, 230], ['grunt', 'L', 140]] },
      { at: 1320, spawn: [['brick', 'R', 0], ['brick', 'L', 50], ['dasher', 'M', 120, 200], ['grunt2', 'D', 180, 120]] }
    ],
    props: [{ x: 250, y: 126, type: 'barrel', drop: null }, { x: 340, y: 126, type: 'crate', drop: 'pizza' }, { x: 620, y: 127, type: 'barrel', drop: 'medal' },
      { x: 800, y: 128, type: 'crate', drop: 'hotdog' }, { x: 1060, y: 126, type: 'barrel', drop: 'donut' }, { x: 1250, y: 126, type: 'crate', drop: 'pretzel' },
      { x: 1480, y: 127, type: 'barrel', drop: 'badge' }, { x: 1700, y: 128, type: 'crate', drop: 'pizza' }],
    loose: [{ x: 180, y: 152, kind: 'crate' }, { x: 560, y: 160, kind: 'barrel' }, { x: 980, y: 150, kind: 'crate' }, { x: 1400, y: 158, kind: 'barrel' }],
    food: []
  }
];
