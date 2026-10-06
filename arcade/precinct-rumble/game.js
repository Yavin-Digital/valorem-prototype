/* Precinct Rumble: game logic. Original NES-style belt-scroll brawler. */
(function () {
  'use strict';
  const E = window.RetroEngine, P = E.P, I = E.input, A = E.audio;
  const ART = window.PR_ART, BG = window.PR_BG, CFG = window.PR_CONFIG, STAGES = window.PR_STAGES;
  E.init('precinct-rumble');
  ART.build();
  const ctx = E.ctx, W = E.W, H = E.H;
  const FT = 122, FB = 174, GRAV = 0.3;
  const prm = E.params, GOD = prm.get('god') === '1';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rand = (a, b) => a + Math.random() * (b - a);
  const sgn = v => v < 0 ? -1 : v > 0 ? 1 : 0;

  // ---------------------------------------------------------------- music (all original)
  const SONGS = {
    title: A.compose({ bpm: 128, chords: ['Am', 'F', 'C', 'G'], bass: 'octave', drums: 'k...s...k.k.s...', lead: 'A4:3 C5:1 E5:2 A5:4 G5:2 E5:2 C5:2 F5:4 E5:2 D5:2 C5:4 A4:4 G4:2 C5:2 E5:2 G5:4 F5:2 E5:2 D5:2 D5:6 B4:2 G4:4 r:4' }),
    street: A.compose({ bpm: 150, chords: ['Em', 'C', 'D', 'Em'], bass: 'octave', drums: 'k.h.s.h.k.k.s.h.', lead: 'E5:2 r:1 E5:1 G5:2 E5:2 B5:3 A5:1 G5:2 F#5:2 E5:2 C5:2 G4:2 C5:2 E5:4 D5:2 C5:2 D5:2 r:1 D5:1 F#5:2 A5:2 D6:4 C6:2 A5:2 B5:4 G5:2 E5:2 B4:4 r:4' }),
    subway: A.compose({ bpm: 140, chords: ['Dm', 'A#', 'C', 'A'], bass: 'drive', drums: 'k.hhs.hkk.hhs.h.', lead: 'D5:2 F5:2 A5:2 F5:2 D5:2 F5:1 G5:1 A5:4 A#5:3 A5:1 G5:2 F5:2 D5:4 r:4 C5:2 E5:2 G5:2 E5:2 C6:4 A#5:2 G5:2 A5:4 C#6:2 A5:2 E5:4 C#5:4' }),
    rooftop: A.compose({ bpm: 120, chords: ['Am', 'G', 'F', 'E'], bass: 'walk', drums: 'k...s...k.k.s..h', leadWave: 'p50', lead: 'E5:4 A5:4 C6:2 B5:2 A5:4 G5:4 D5:4 B4:4 D5:4 F5:2 A5:2 C6:4 A5:2 F5:2 C5:4 E5:2 G#5:2 B5:4 E6:4 r:4' }),
    warehouse: A.compose({ bpm: 156, chords: ['Cm', 'G#', 'A#', 'G'], bass: 'octave', drums: 'k.hsk.hsk.hsk.ss', lead: 'C5:2 C5:1 D#5:1 G5:2 C5:2 D#5:2 F5:2 G5:4 G#5:4 G5:2 F5:2 D#5:2 C5:2 G4:4 A#4:2 D5:2 F5:2 A#5:4 G#5:2 G5:2 F5:2 G5:6 B4:2 D5:4 G5:4' }),
    boss: A.compose({ bpm: 168, chords: ['Em', 'F', 'Em', 'B'], bass: 'drive', drums: 'kkhskkhskkhsk.ss', lead: 'E5:1 E5:1 r:1 E5:1 G5:2 F#5:2 E5:2 B4:2 E5:4 F5:2 A5:2 C6:2 A5:2 F5:4 E5:4 G5:2 B5:2 E6:4 D6:2 B5:2 G5:4 F#5:4 D#5:4 B4:4 F#5:4' }),
    victory: A.compose({ bpm: 132, chords: ['C', 'G', 'Am', 'F'], bass: 'march', drums: 'k.h.s.h.k.h.s.hh', arpUp: true, lead: 'E5:2 G5:2 C6:4 B5:2 C6:2 D6:4 B5:4 G5:4 D5:4 G5:4 A5:2 C6:2 E6:4 D6:2 C6:2 A5:4 F5:4 A5:2 C6:2 G5:8' }),
    clear: A.compile({ bpm: 150, loop: false, channels: [{ wave: 'p25', vol: 0.12, notes: 'C5:2 E5:2 G5:2 C6:6 G5:2 C6:10' }, { wave: 'tri', vol: 0.2, notes: 'C3:8 G2:8 C3:8' }] }),
    over: A.compile({ bpm: 100, loop: false, channels: [{ wave: 'p25', vol: 0.12, notes: 'A4:4 G4:4 F4:4 E4:12' }, { wave: 'tri', vol: 0.2, notes: 'A2:8 F2:8 E2:8' }] })
  };

  // ---------------------------------------------------------------- settings + chrome
  let tapMove = !!E.store.get('pr_tapmove', false);
  const applyTap = () => document.body.classList.toggle('tapmove', tapMove);
  applyTap();
  const MAXP = CFG.coop.maxPlayers;
  const PCOL = [P.gold, P.ice, P.mint, P.salmon];
  const G = window.__GAME = {
    state: 'title', t: 0, menu: 0, sel: 0, stage: 0, score: 0, nextLife: CFG.extraLifeEvery, continues: 0,
    cam: 0, maxCam: 0, lock: null, wave: 0, spawnQ: [], enemies: [], projs: [], props: [], items: [], loose: [], debris: [], fx: [], pops: [], dogs: [], screenFx: [],
    boss: null, p: null, players: [], hitstop: 0, goT: 0, bannerT: 0, contSel: 0, serial: 0, titleCam: 0, tapHintT: 0, stats: { ko: 0, broken: 0, thrown: 0, slams: 0, dashes: 0, bestChain: 0 },
    picks: [], readyT: 0
  };
  Object.defineProperty(G, 'lives', { get: () => (G.p ? G.p.lives : 0) });
  E.setupChrome({
    toggles: [{ key: 'tapmove', label: 'Tap-to-move', get: () => tapMove, set: v => { tapMove = v; E.store.set('pr_tapmove', v); applyTap(); if (G.p) G.p.target = null; G.tapHintT = v ? 200 : 0; } }],
    actions: [{ key: 'quit', label: 'Quit to title', fn: () => toTitle() }]
  });
  E.canPause = () => G.state === 'play' || G.state === 'intro' || G.state === 'clear';
  E.onPadStart = () => { if (E.paused) E.resume(); }; // in play, controller START is handled per player (join / pause)
  G.tapMove = () => tapMove;

  // ---------------------------------------------------------------- per-player input devices
  // kb1 = P1 (WASD + J/K/L, also Z/X/C/Space), kb2 = P2 (arrows + numpad 1/2/3 or , . /), pad0-3 = controllers, touch = phone controls (P1)
  const KB = {
    kb1: { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], a: ['KeyJ', 'KeyZ'], b: ['KeyK', 'KeyX', 'Space'], c: ['KeyL', 'KeyC'], d: ['ShiftLeft', 'Semicolon'], start: ['Enter'] },
    kb2: { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], a: ['Numpad1', 'Comma'], b: ['Numpad2', 'Period'], c: ['Numpad3', 'Slash'], d: ['Numpad0', 'Quote'], start: ['NumpadEnter', 'ShiftRight'] }
  };
  ['kb1', 'kb2'].forEach(k => Object.values(KB[k]).forEach(list => list.forEach(c => I.extraKeys.add(c))));
  // dtl/dtr = left/right presses that may count toward a double-tap dash (keyboard keys and d-pad buttons only;
  // analog sticks and the touch stick never double-tap, the touch stick dashes with a double flick instead)
  const ACTS = ['left', 'right', 'up', 'down', 'a', 'b', 'c', 'd', 'start', 'dtl', 'dtr'];
  const PADMAP = { a: [2, 3], b: [0], c: [1, 5], d: [4, 7], start: [9] };
  const DEV = {}, padPrev = [{}, {}, {}, {}];
  const blank = () => { const o = { held: {}, pressed: {} }; ACTS.forEach(a => { o.held[a] = false; o.pressed[a] = false; }); return o; };
  function pollDevices() {
    for (const k of ['kb1', 'kb2']) {
      const o = blank();
      for (const a of ACTS) for (const c of KB[k][a] || []) { if (I.keys[c] || I.keyHit[c]) o.held[a] = true; if (I.keyHit[c]) o.pressed[a] = true; }
      o.held.dtl = o.held.left; o.pressed.dtl = o.pressed.left; o.held.dtr = o.held.right; o.pressed.dtr = o.pressed.right;
      DEV[k] = o;
    }
    const t = blank(); for (const a of ['left', 'right', 'up', 'down', 'a', 'b', 'c']) { t.held[a] = !!I.touch[a]; t.pressed[a] = !!I.tpressed[a]; }
    if (I.tdash) { t.pressed.d = true; t.dashDir = I.tdash; } // double flick on the touch stick
    DEV.touch = t;
    let pads = [];
    try { pads = navigator.getGamepads ? navigator.getGamepads() || [] : []; } catch (e) { pads = []; }
    for (let i = 0; i < 4; i++) {
      const pd = pads[i];
      if (!pd || !pd.connected) { DEV['pad' + i] = null; padPrev[i] = {}; continue; }
      const b = n => !!(pd.buttons[n] && (pd.buttons[n].pressed || pd.buttons[n].value > 0.5)), ax = pd.axes[0] || 0, ay = pd.axes[1] || 0;
      const o = blank();
      o.held.left = ax < -0.45 || b(14); o.held.right = ax > 0.45 || b(15); o.held.up = ay < -0.45 || b(12); o.held.down = ay > 0.45 || b(13);
      for (const a in PADMAP) o.held[a] = PADMAP[a].some(b);
      o.held.dtl = b(14); o.held.dtr = b(15);
      for (const a of ACTS) { o.pressed[a] = o.held[a] && !padPrev[i][a]; padPrev[i][a] = o.held[a]; }
      DEV['pad' + i] = o;
    }
  }
  const usedDevs = () => { const s = new Set(); for (const p of G.players) if (p) p.devs.forEach(d => s.add(d)); return s; };
  function playerInput(p) {
    const o = blank(), used = usedDevs();
    const list = p.devs.slice();
    if (p.slot === 0 && !used.has('kb2')) list.push('kb2*'); // solo: arrows also drive P1 until P2 joins
    for (const name of list) {
      const alias = name.endsWith('*'), d = DEV[alias ? name.slice(0, -1) : name];
      if (!d) continue;
      for (const a of ACTS) { if (alias && a === 'start') continue; o.held[a] = o.held[a] || d.held[a]; o.pressed[a] = o.pressed[a] || d.pressed[a]; }
      if (d.dashDir) o.dashDir = d.dashDir;
    }
    return o;
  }
  // a device that is not bound to anyone pressed START (or attack): returns its name
  function joinRequest() {
    const used = new Set(); for (const p of G.players) if (p && !p.out) p.devs.forEach(d => used.add(d));
    for (const k of ['kb2', 'kb1', 'pad0', 'pad1', 'pad2', 'pad3']) {
      if (used.has(k) || !DEV[k]) continue;
      if (DEV[k].pressed.start || (k.startsWith('pad') && DEV[k].pressed.a)) return k;
    }
    return null;
  }

  // ---------------------------------------------------------------- flow
  const bgCache = {};
  function stageBg(S) { if (!bgCache[S.id]) { bgCache[S.id] = BG[S.bg](S.length); bgCache[S.id].theme = S.bg; } return bgCache[S.id]; }
  function toTitle() { G.state = 'title'; G.t = 0; G.menu = 0; G.players = []; G.p = null; A.music(SONGS.title); }
  const joined = () => G.players.filter(Boolean);
  const active = () => G.players.filter(p => p && !p.out);
  const nPlayers = () => Math.max(1, active().length);
  const hpScale = () => 1 + CFG.coop.hpPerPlayer * (nPlayers() - 1);
  function newGame(picks, stageIdx) {
    // picks: [{ hi, devs }] in slot order
    if (typeof picks === 'number') picks = [{ hi: picks, devs: ['kb1', 'touch'] }];
    G.score = 0; G.nextLife = CFG.extraLifeEvery; G.continues = 0; Object.keys(G.stats).forEach(k => { G.stats[k] = 0; });
    G.players = [];
    picks.forEach((pk, i) => { if (pk) G.players[i] = newPlayer(pk.hi, i, pk.devs); });
    G.p = G.players[0] || null;
    loadStage(stageIdx || 0, true);
  }
  function loadStage(i, fresh) {
    const S = G.S = STAGES[i]; G.stage = i; G.bg = stageBg(S);
    G.cam = 0; G.maxCam = S.length - W; G.lock = null; G.wave = 0; G.spawnQ = []; G.enemies = []; G.projs = []; G.fx = []; G.pops = []; G.dogs = []; G.debris = []; G.screenFx = []; G.boss = null;
    G.items = (S.food || []).map(f => ({ x: f.x, y: f.y, type: f.type, t: 0 }));
    G.props = S.props.map(pr => Object.assign({ hp: (CFG.props[pr.type] || { hp: 3 }).hp, shakeT: 0, lastHit: -1 }, pr));
    G.loose = (S.loose || []).map(o => ({ x: o.x, y: o.y, kind: o.kind, t: 0 }));
    joined().forEach((p, k) => {
      const hp = p.hp, keep = !fresh && !p.out;
      Object.assign(p, newPlayer(p.hi, p.slot, p.devs, p.lives));
      p.x = 50 + k * 18; p.y = 136 + k * 10;
      if (keep) p.hp = Math.max(hp, Math.ceil(p.maxHp * 0.6));
    });
    G.trainX = -500; G.trainT = 200;
    G.state = 'intro'; G.t = 0; A.stop(); A.music(null);
  }
  function startPlay() { G.state = 'play'; G.t = 0; A.music(SONGS[G.S.music]); if (tapMove) G.tapHintT = 200; }
  function stageClear() {
    G.state = 'clear'; G.t = 0; G.bonus = active().reduce((s, p) => s + p.hp * 50, 0); G.bonusShown = 0;
    for (const p of active()) { p.hold = null; p.grab = null; }
    A.music(SONGS.clear);
    E.reportScore({ score: G.score, event: 'stage_clear', stage: G.stage + 1, players: joined().length });
  }
  function victory() { G.state = 'victory'; G.t = 0; A.music(SONGS.victory); E.reportScore({ score: G.score, event: 'victory', stage: 4, continues: G.continues, players: joined().length }); }
  function gameOver() { G.state = 'gameover'; G.t = 0; A.music(SONGS.over); E.reportScore({ score: G.score, event: 'game_over', stage: G.stage + 1, players: joined().length }); }
  function addScore(n) {
    G.score += n;
    if (G.score >= G.nextLife) { G.nextLife += CFG.extraLifeEvery; A.fx('oneup'); for (const p of active()) { p.lives++; pop(p.x, p.y - 50, '1UP', P.mint); } }
  }
  function pop(x, y, text, col) { G.pops.push({ x, y, text, col: col || P.white, t: 0 }); }
  function spark(x, y) { G.fx.push({ k: 'spark', x, y, t: 0, life: 8 }); }
  function dust(x, y) { G.fx.push({ k: 'dust', x, y, t: 0, life: 12 }); }
  function burst(x, y, cols, n, power) {
    n = E.reducedMotion ? Math.ceil(n / 2) : n; if (E.lowFx2) n = Math.ceil(n / 2); power = power || 1; // adaptive tier 2: fewer chips
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(0.6, 2.2) * power;
      G.debris.push({ x, y: y + rand(-3, 3), z: rand(4, 16), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.35, vz: rand(1.5, 4) * power, col: cols[i % cols.length], t: 0, life: 50 + Math.floor(rand(0, 30)), sz: Math.random() < 0.3 ? 3 : 2, bounced: false });
    }
  }

  // ---------------------------------------------------------------- actors
  function newPlayer(hi, slot, devs, lives) {
    const h = ART.HEROES[hi];
    return { isPlayer: true, slot: slot || 0, devs: devs || ['kb1', 'touch'], col: PCOL[slot || 0], hi, h, st: h.stats, fr: ART.hero[hi], x: 60, y: 150, z: 0, vx: 0, vz: 0, face: 1, state: 'idle', t: 0, frame: 'idle0',
      hp: h.stats.hp, maxHp: h.stats.hp, lives: lives === undefined ? CFG.lives : lives, out: false, inv: 60, flash: 0, combo: -1, comboT: 0, atk: null, serial: 0, hitsTaken: 0, hitsT: 0, grab: null, grabHold: 0,
      target: null, airAtk: false, buffer: false, walkT: 0, knees: 0, hold: null, chain: 0, chainT: 0, chainShow: 0, lastTapDir: 0, lastTapT: -99, inp: blank() };
  }
  function freeHero(skip) { const used = new Set(joined().filter(p => p !== skip).map(p => p.hi)); for (let i = 0; i < 4; i++) if (!used.has(i)) return i; return 0; }
  function dropIn(dev) {
    let slot = -1; for (let i = 0; i < MAXP; i++) if (!G.players[i]) { slot = i; break; }
    // an out-of-lives player rejoining with their own device keeps their slot
    const back = G.players.find(p => p && p.out && p.devs.includes(dev));
    if (back) { reviveP(back); G.continues++; return back; }
    if (slot < 0) return null;
    const p = newPlayer(freeHero(), slot, [dev]);
    p.x = G.cam + 40 + slot * 20; p.y = 140 + slot * 6; p.z = 70; p.state = 'fall'; p.vz = 0; p.vx = 0; p.inv = 120; p.dropIn = true;
    G.players[slot] = p; A.fx('join'); pop(p.x, p.y - 60, 'P' + (slot + 1) + ' JOINED!', p.col);
    return p;
  }
  function reviveP(p) {
    p.out = false; p.lives = CFG.lives; p.hp = p.maxHp; p.state = 'fall'; p.z = 70; p.vz = 0; p.vx = 0; p.inv = 120; p.dropIn = true; p.hold = null; p.grab = null;
    p.x = clamp(p.x, G.cam + 30, G.cam + W - 30); A.fx('join');
  }
  function newEnemy(type, x, y) {
    const c = CFG.enemies[type], hp = Math.round(c.hp * hpScale());
    return { type, def: c, fr: ART.enemy[type], x, y, z: 0, vx: 0, vz: 0, face: -1, state: 'enter', t: 0, frame: 'walk0', hp, maxHp: hp, inv: 0, flash: 0,
      cool: rand(20, 60), armorHits: 0, lastHit: -1, walkT: 0, slotY: rand(-10, 10), ko: false, idx: Math.floor(Math.random() * 3), hold: null, seek: null, tgt: null, tgtT: 0,
      canCarry: type === 'grunt' || type === 'grunt2' || type === 'brick' };
  }
  function newBoss(key) {
    const c = CFG.bosses[key], hp = Math.round(c.hp * (1 + CFG.coop.bossHpPerPlayer * (nPlayers() - 1)));
    return { isBoss: true, key, type: key, def: { speed: c.speed, dmg: c.dmg, reach: 26, score: c.score }, cfg: c, fr: ART.boss[key], x: G.cam + W + 30, y: 148, z: 0, vx: 0, vz: 0, face: -1,
      state: 'enter', t: 0, frame: 'walk0', hp, maxHp: hp, inv: 0, flash: 0, cool: 60, armorCount: 0, lastHit: -1, walkT: 0, slotY: 0, ko: false, idx: 0, summoned: 0, hurtRun: 0, tgt: null, tgtT: 0 };
  }
  // Screen-x band [lo, hi] where a sprite spanning canvas rows top..bot (half-width hw) is clear of the on-screen
  // touch controls. Desktop (no touch controls) gets the full width.
  function safeBand(top, bot, hw) {
    let lo = hw + 2, hi = W - hw - 2;
    if (!E.isTouch || !E.ctrlRects) return [lo, hi];
    for (const r of E.ctrlRects()) {
      if (r.y + r.h < top + 3 || r.y > bot - 3) continue;
      if (r.x + r.w / 2 < W / 2) lo = Math.max(lo, r.x + r.w + hw + 2); else hi = Math.min(hi, r.x - hw - 2);
    }
    if (hi - lo < 40) { const mid = (lo + hi) / 2; lo = mid - 20; hi = mid + 20; }
    return [lo, hi];
  }
  G.safeBand = safeBand;
  function spawnEnemy(type, side, sx) {
    let e;
    if (side === 'M' || side === 'D' || side === 'W') {
      // entrances are clamped into the band the touch controls leave clear (whole entry path, not just the landing)
      const y = side === 'M' ? rand(142, 166) : side === 'D' ? FT + 1 : rand(132, 152);
      // span = canvas rows the 64x70 sprite box covers during the whole entry (rise from the street, walk down from
      // the door, fall from the window); the band keeps that full box clear of the controls
      const span = side === 'M' ? [y - 66, y + 2] : side === 'D' ? [FT - 65, FT + 27] : [y - 64 - 66, y + 4];
      const band = safeBand(span[0], span[1], 32);
      const x = G.cam + clamp(sx === undefined ? 160 : sx, Math.max(20, band[0]), Math.min(W - 20, band[1]));
      if (side === 'M') { e = newEnemy(type, x, y); e.state = 'rise'; G.fx.push({ k: 'manhole', x, y: e.y, t: 0, life: 90 }); }
      else if (side === 'D') { e = newEnemy(type, x, y); e.state = 'door'; G.fx.push({ k: 'door', x, y: FT, t: 0, life: 64 }); }
      else { e = newEnemy(type, x, y); e.state = 'drop'; e.z = 64; G.fx.push({ k: 'window', x, y: e.y - 64 - 2, t: 0, life: 40 }); }
      e.face = x < G.cam + W / 2 ? 1 : -1;
    } else {
      e = newEnemy(type, side === 'L' ? G.cam - 24 : G.cam + W + 24, rand(FT + 4, FB - 4));
      e.face = side === 'L' ? 1 : -1;
    }
    e.side = side; G.enemies.push(e); return e;
  }
  function startBoss() {
    const b = newBoss(G.S.boss); G.boss = b; G.enemies.push(b); G.lock = G.maxCam; G.bannerT = 160;
    A.music(SONGS.boss); A.fx('boss');
  }
  const SOLID_STATES = ['fall', 'down', 'ko', 'getup', 'thrown', 'enter', 'rise', 'door', 'drop', 'screen'];
  function hittable(e) { return !SOLID_STATES.includes(e.state) && !(e.inv > 0) && e.state !== 'grabbed'; }
  function target(e) {
    const list = active().filter(p => p.state !== 'out');
    if (!list.length) return G.p || { x: G.cam + W / 2, y: 150, z: 0, state: 'idle' };
    if (!e.tgt || e.tgt.out || --e.tgtT <= 0 || !list.includes(e.tgt)) {
      let best = null, bd = 1e9;
      for (const p of list) { let d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y) * 2; if (['down', 'fall', 'getup'].includes(p.state)) d += 200; if (d < bd) { bd = d; best = p; } }
      e.tgt = best; e.tgtT = 40 + Math.floor(Math.random() * 30);
    }
    return e.tgt;
  }

  // ---------------------------------------------------------------- player
  const ATK = {
    jab: { f: 'jab', s: 2, a: 3, r: 7, d: 'jab', reach: 20, kd: false, push: 1.5 },
    cross: { f: 'cross', s: 2, a: 3, r: 8, d: 'cross', reach: 22, kd: false, push: 1.5 },
    hook: { f: 'hook', s: 3, a: 3, r: 10, d: 'hook', reach: 20, kd: false, push: 2 },
    kick: { f: 'kick', s: 4, a: 4, r: 14, d: 'kick', reach: 28, kd: true, push: 3 }
  };
  const HALE_F = { jab: 'swingMid', cross: 'swingHi', hook: 'swingLo' };
  const COMBO = ['jab', 'cross', 'hook', 'kick'];
  function atkFrame(p, k) { return p.h.id === 'hale' && HALE_F[k] ? HALE_F[k] : ATK[k].f; }
  function beginAtk(p) { p.atk = COMBO[p.combo]; p.state = 'attack'; p.t = 0; p.serial = ++G.serial; p.buffer = false; p.frame = atkFrame(p, p.atk); A.fx('whiff'); }
  function startAttack(p) { if (p.comboT > 0 && p.combo >= 0 && p.combo < 3) p.combo++; else p.combo = 0; beginAtk(p); }
  function startJump(p, mx) { p.state = 'jump'; p.t = 0; p.vz = 4.4; p.vx = mx * p.st.speed * 1.15; p.airAtk = false; p.z = 0.1; A.fx('jump'); }
  function startDash(p) { p.state = 'dash'; p.t = 0; p.serial = ++G.serial; p.target = null; G.stats.dashes++; A.fx('dash'); dust(p.x - p.face * 6, p.y); }
  function faceNearest(p) {
    let best = null, bd = 1e9; for (const e of G.enemies) { const d = Math.abs(e.x - p.x) + Math.abs(e.y - p.y) * 2; if (d < bd) { bd = d; best = e; } }
    if (best && Math.abs(best.x - p.x) > 2) p.face = sgn(best.x - p.x);
  }
  function findGrabbable(p) {
    for (const e of G.enemies) {
      if (e.isBoss || e.z > 0 || !['idle', 'walk', 'hurt'].includes(e.state)) continue;
      if (joined().some(q => q.grab === e)) continue;
      if (Math.abs(e.x - (p.x + p.face * 13)) < 8 && Math.abs(e.y - p.y) < 6) return e;
    }
    return null;
  }
  function looseAt(x, y) { for (const o of G.loose) if (!o.dead && Math.abs(o.x - x) < 12 && Math.abs(o.y - y) < 8) return o; return null; }
  function startGrab(p, e) { p.state = 'grab'; p.t = 0; p.grab = e; p.knees = 0; p.grabHold = 0; e.state = 'grabbed'; e.t = 0; enemyDrop(e); A.fx('punch'); }
  function releaseGrab(p) { if (p.grab && p.grab.state === 'grabbed') { p.grab.state = 'idle'; p.grab.cool = 30; } p.grab = null; if (p.state === 'grab' || p.state === 'knee') p.state = 'idle'; }
  function throwEnemy(p, e, dir) {
    p.state = 'throw'; p.t = 0; p.grab = null; p.face = dir;
    e.state = 'thrown'; e.t = 0; e.vx = dir * 4; e.vz = 3; e.z = 10; e.x = p.x + dir * 6; e.serial = ++G.serial; e.thrower = p;
    e.hp -= Math.round(CFG.playerDamage.throw * p.st.power); e.flash = 8; if (e.hp <= 0) { e.hp = 0; e.ko = true; }
    addScore(50); A.fx('whiff'); G.stats.thrown++; chainHit(p);
  }
  // grab + up/down + attack: hurl the thug at the screen
  function slamScreen(p, e) {
    p.state = 'throw'; p.t = 0; p.grab = null;
    e.state = 'screen'; e.t = 0; e.sx0 = e.x - G.cam; e.sy0 = e.y - 24; e.ox = e.x; e.oy = e.y; e.thrower = p; e.serial = ++G.serial; slamPlan(e);
    e.hp -= Math.round(CFG.playerDamage.slam * p.st.power); if (e.hp <= 0) { e.hp = 0; e.ko = true; }
    G.stats.slams++; addScore(200); A.fx('whiff'); chainHit(p);
    // the swing itself bowls over anyone standing next to the grab
    for (const o of G.enemies) if (o !== e && hittable(o) && Math.abs(o.x - p.x) < 40 && Math.abs(o.y - p.y) < 12) hitEnemy(o, 6, true, sgn(o.x - p.x) || p.face, 2, false, p);
  }
  function chainHit(by) {
    if (!by || !by.isPlayer) return;
    by.chain = by.chainT > 0 ? by.chain + 1 : 1; by.chainT = 100; if (by.chain >= 2) by.chainShow = 100;
    if (by.chain > G.stats.bestChain) G.stats.bestChain = by.chain;
  }
  function doAttack(p, reach, dmg, kd, push) {
    for (const e of G.enemies) {
      if (e.lastHit === p.serial || !hittable(e)) continue;
      const dx = (e.x - p.x) * p.face;
      if (dx < -6 || dx > reach || Math.abs(e.y - p.y) > 9 || Math.abs(e.z - p.z) > 26) continue;
      e.lastHit = p.serial; hitEnemy(e, Math.round(dmg), kd, p.face, push, false, p);
    }
    for (const pr of G.props) {
      if (pr.dead || pr.lastHit === p.serial) continue;
      const dx = (pr.x - p.x) * p.face; if (dx < -4 || dx > reach + 4 || Math.abs(pr.y - p.y) > 10) continue;
      pr.lastHit = p.serial; hitProp(pr, p);
    }
    for (const pj of G.projs) { if (!pj.dead && !pj.friendly && Math.abs(pj.x - (p.x + p.face * 14)) < 12 && Math.abs(pj.y - p.y) < 9 && pj.k !== 'shock') { pj.dead = true; spark(pj.x, pj.y - pj.z); addScore(20); A.fx('punch'); if (pj.k === 'obj') landObj(pj, true); } }
  }
  function areaHit(src, rx, ry, dmg, kd) {
    const by = src.isPlayer ? src : src.owner;
    for (const e of G.enemies) {
      if (e.lastHit === src.serial || !hittable(e)) continue;
      if (Math.abs(e.x - src.x) > rx || Math.abs(e.y - src.y) > ry || e.z > 30) continue;
      e.lastHit = src.serial; hitEnemy(e, Math.round(dmg), kd, sgn(e.x - src.x) || src.face, 2.5, false, by);
    }
    for (const pr of G.props) if (!pr.dead && pr.lastHit !== src.serial && Math.abs(pr.x - src.x) < rx && Math.abs(pr.y - src.y) < ry) { pr.lastHit = src.serial; hitProp(pr, by); }
  }
  function hitProp(pr, by, dmg) {
    pr.hp -= dmg || 1; pr.shakeT = 8; spark(pr.x, pr.y - 10); A.fx('punch'); burst(pr.x, pr.y - 6, ART.debris[pr.type] || [P.lgray], 3, 0.6);
    if (pr.hp <= 0) breakProp(pr, by);
  }
  function breakProp(pr) {
    pr.dead = true; A.fx('break'); addScore(50); G.stats.broken++; G.hitstop = Math.max(G.hitstop, 3); E.shake(1, 4);
    burst(pr.x, pr.y - 8, ART.debris[pr.type] || [P.lgray, P.white], 16, 1); spark(pr.x, pr.y - 12); dust(pr.x, pr.y);
    pop(pr.x, pr.y - 26, '+50', P.white);
    const def = CFG.props[pr.type] || {};
    if (pr.drop) G.items.push({ x: pr.x, y: pr.y + 2, type: pr.drop, t: 0 });
    if (def.leaves) G.loose.push({ x: pr.x + 10, y: Math.min(FB, pr.y + 8), kind: def.leaves, t: 0 });
    if (pr.type === 'hydrant') { G.fx.push({ k: 'stub', x: pr.x, y: pr.y, t: 0, life: 99999 }); G.fx.push({ k: 'spray', x: pr.x, y: pr.y - 6, t: 0, life: 200 }); A.fx('splash'); }
  }
  function startSpecial(p) {
    if (p.hp <= p.st.cost) { pop(p.x, p.y - 46, 'LOW HP', P.salmon); A.fx('ehit'); return false; }
    p.hp -= p.st.cost; p.state = 'special'; p.t = 0; p.serial = ++G.serial; p.inv = Math.max(p.inv, 44); p.target = null;
    A.fx('special'); E.flash(2); return true;
  }
  function updateSpecial(p) {
    const id = p.h.id, dmg = CFG.playerDamage.special * p.st.power;
    p.flipAlt = false;
    if (id === 'turbo') {
      p.x += p.face * 2.2; p.frame = 'kick'; p.flipAlt = Math.floor(p.t / 4) % 2 === 1;
      if (p.t % 10 === 0) p.serial = ++G.serial;
      areaHit(p, 26, 12, dmg * 0.5, true);
      if (p.t >= 40) p.state = 'idle';
    } else if (id === 'bo') {
      p.frame = p.t < 16 ? 'slamup' : 'slam';
      if (p.t === 16) { areaHit(p, 84, 22, dmg, true); E.shake(4, 14); A.fx('explode'); for (const d of [-1, 1]) for (let k = 1; k <= 3; k++) G.fx.push({ k: 'shock', x: p.x + d * k * 22, y: p.y, t: -k * 3, life: 18 }); }
      if (p.t >= 36) p.state = 'idle';
    } else if (id === 'dana') {
      p.frame = 'point';
      if (p.t === 6) { G.dogs.push({ x: p.x - p.face * 30, y: p.y, z: 0, face: p.face, vx: p.face * 4.6, serial: ++G.serial, t: 0, owner: p }); A.fx('bark'); }
      if (p.t >= 24) p.state = 'idle';
    } else {
      const seq = ['swingHi', 'swingMid', 'swingLo'];
      p.frame = seq[Math.floor(p.t / 4) % 3]; p.flipAlt = Math.floor(p.t / 12) % 2 === 1;
      if (p.t % 12 === 0) p.serial = ++G.serial;
      areaHit(p, 36, 12, dmg * 0.45, p.t >= 24);
      if (p.t >= 36) p.state = 'idle';
    }
    if (p.state === 'idle') p.flipAlt = false;
  }
  function dropHeld(p) { if (p.hold) { G.loose.push({ x: p.x + p.face * 8, y: p.y, kind: p.hold, t: 0 }); p.hold = null; } }
  function damagePlayer(p, dmg, kd, dir) {
    if (!p || p.out || GOD || p.inv > 0 || ['fall', 'down', 'getup', 'dead', 'special', 'win', 'out'].includes(p.state)) return false;
    dmg = Math.max(1, Math.round(dmg * CFG.difficulty));
    p.hp -= dmg; p.flash = 8; A.fx('hurt'); E.shake(2, 6); G.hitstop = 4; spark(p.x, p.y - 22 - p.z);
    if (p.grab) releaseGrab(p);
    dropHeld(p); p.chainT = 0;
    p.hitsTaken++; p.hitsT = 70; p.target = null;
    if (p.hp <= 0 || kd || p.hitsTaken >= 3) { p.hp = Math.max(0, p.hp); p.hitsTaken = 0; p.state = 'fall'; p.t = 0; p.vz = 2.6; p.vx = dir * 1.6; p.z = 0.1; }
    else { p.state = 'hurt'; p.t = 0; p.x += dir * 3; }
    return true;
  }
  function playerDied(p) {
    p.lives--;
    if (p.lives > 0) { p.hp = p.maxHp; p.state = 'idle'; p.inv = CFG.respawnIframes; pop(p.x, p.y - 50, 'READY!', P.gold); G.projs = G.projs.filter(pj => pj.friendly); return; }
    p.out = true; p.state = 'out'; p.hold = null; p.grab = null;
    if (!active().length) { G.state = 'continue'; G.t = 0; G.contSel = 0; A.music(null); A.stop(); }
    else pop(p.x, p.y - 50, 'P' + (p.slot + 1) + ' PRESS START', p.col);
  }
  function tossHeld(p) {
    const kind = p.hold, o = CFG.objects[kind]; p.hold = null; p.state = 'toss'; p.t = 0; A.fx('toss');
    G.projs.push({ k: 'obj', kind, friendly: true, owner: p, x: p.x + p.face * 10, y: p.y, z: 30, vx: p.face * o.speed, vy: 0, vz: 0.5, dmg: o.dmg * p.st.power, t: 0, serial: ++G.serial });
  }
  function updatePlayer(p) {
    if (p.out) return;
    if (p.inv > 0) p.inv--; if (p.flash > 0) p.flash--; if (p.hitsT > 0 && --p.hitsT === 0) p.hitsTaken = 0; if (p.comboT > 0) p.comboT--;
    if (p.chainT > 0) p.chainT--; if (p.chainShow > 0) p.chainShow--;
    p.t++;
    const st = p.st, inp = p.inp;
    let mx = (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0), my = (inp.held.down ? 1 : 0) - (inp.held.up ? 1 : 0);
    switch (p.state) {
      case 'idle': case 'walk': {
        if (mx || my) p.target = null;
        else if (p.target) {
          const dx = p.target.x - p.x, dy = p.target.y - p.y;
          if (Math.abs(dx) > st.speed) mx = sgn(dx); if (Math.abs(dy) > st.speed * 0.7) my = sgn(dy);
          if (!mx && !my) { p.target = null; faceNearest(p); }
        }
        // dash: double-tap left/right (keyboard, d-pad), double flick (touch stick), or the dash key / button
        let dashNow = false;
        if (!p.hold) {
          for (const d of [-1, 1]) {
            if (inp.pressed[d < 0 ? 'dtl' : 'dtr']) {
              if (p.lastTapDir === d && G.t - p.lastTapT < 15) { p.face = d; dashNow = true; p.lastTapT = -99; } else { p.lastTapDir = d; p.lastTapT = G.t; }
            }
          }
          if (inp.pressed.d) { if (inp.dashDir) p.face = inp.dashDir; else if (mx) p.face = mx; dashNow = true; }
        }
        if (dashNow) { startDash(p); break; }
        if (p.hold) {
          if (inp.pressed.a) { tossHeld(p); break; }
          if (inp.pressed.b || inp.pressed.c) { dropHeld(p); A.fx('land'); break; }
        } else {
          if (inp.pressed.b) { startJump(p, mx); break; }
          if (inp.pressed.c && startSpecial(p)) break;
          if (inp.pressed.a) {
            const o = looseAt(p.x, p.y);
            if (o) { o.dead = true; p.liftKind = o.kind; p.state = 'lift'; p.t = 0; p.target = null; A.fx('lift'); break; }
            startAttack(p); break;
          }
        }
        const spd = st.speed * (p.hold ? 0.85 : 1);
        if (mx || my) { p.x += mx * spd; p.y += my * spd * 0.7; if (mx) p.face = mx; p.state = 'walk'; p.walkT++; } else p.state = 'idle';
        if (!p.hold && mx && mx === p.face) { const e = findGrabbable(p); if (e) { if (++p.grabHold > 6) startGrab(p, e); } else p.grabHold = 0; } else p.grabHold = 0;
        if (p.hold) p.frame = 'carry' + (p.state === 'walk' ? Math.floor(p.walkT / 8) % 2 : 0);
        else p.frame = p.state === 'walk' ? 'walk' + (Math.floor(p.walkT / 5) % 6) : ('idle' + (Math.floor(G.t / 12) % 4));
        break;
      }
      case 'lift': p.frame = 'slam'; if (p.t >= 8) { p.hold = p.liftKind; p.state = 'idle'; } break;
      case 'toss': p.frame = 'throw1'; if (p.t >= 14) p.state = 'idle'; break;
      case 'dash': {
        const sp = Math.max(1.2, 3.6 - p.t * 0.11);
        p.x += p.face * sp; p.z = p.t < 18 ? Math.sin(p.t / 18 * Math.PI) * 5 : 0; p.frame = 'charge';
        if (p.t % 4 === 0 && !E.reducedMotion) dust(p.x - p.face * 8, p.y);
        if (p.t < 18) doAttack(p, 20 + st.reach * 0.5, CFG.playerDamage.dash * st.power, true, 3);
        if (p.t >= 22) { p.z = 0; p.state = 'land'; p.t = 0; }
        break;
      }
      case 'attack': {
        const a = ATK[p.atk];
        { const f0 = atkFrame(p, p.atk), ph = p.t < a.s ? 'W' : p.t >= a.s + a.a ? 'F' : ''; p.frame = ph && p.fr[f0 + ph] ? f0 + ph : f0; } // wind-up, strike, follow-through
        if (p.t >= a.s && p.t < a.s + a.a) doAttack(p, a.reach + st.reach, CFG.playerDamage[a.d] * st.power, a.kd, a.push);
        if (inp.pressed.a && p.t >= 2) p.buffer = true;
        if (p.t >= a.s + a.a + a.r) { if (p.buffer && p.combo < 3) { p.combo++; beginAtk(p); } else { p.state = 'idle'; p.comboT = CFG.comboWindow; if (p.combo >= 3) p.combo = -1; } }
        break;
      }
      case 'jump':
        p.x += p.vx; p.z += p.vz; p.vz -= GRAV;
        if (inp.pressed.a && !p.airAtk) { p.airAtk = true; p.serial = ++G.serial; A.fx('whiff'); }
        if (p.airAtk) doAttack(p, 24 + st.reach * 0.5, CFG.playerDamage.jumpkick * st.power, true, 3);
        if (p.z <= 0) { p.z = 0; p.state = 'land'; p.t = 0; A.fx('land'); dust(p.x, p.y); }
        p.frame = p.airAtk ? 'jumpkick' : 'jump';
        break;
      case 'land': p.frame = 'idle1'; if (p.t >= 5) p.state = 'idle'; break;
      case 'grab': {
        const e = p.grab;
        if (!e || e.state !== 'grabbed') { p.state = 'idle'; p.grab = null; break; }
        e.x = p.x + p.face * 14; e.y = p.y + 0.1; e.face = -p.face; p.frame = 'grab';
        if (inp.pressed.a) {
          if (my) slamScreen(p, e);
          else if (mx && mx === -p.face) throwEnemy(p, e, -p.face);
          else if (p.knees >= 2) throwEnemy(p, e, p.face);
          else { p.state = 'knee'; p.t = 0; p.knees++; }
        } else if (inp.pressed.b) throwEnemy(p, e, -p.face);
        else if (p.t > 110) releaseGrab(p);
        break;
      }
      case 'knee': {
        const e = p.grab; p.frame = 'knee';
        if (e) { e.x = p.x + p.face * 14; e.y = p.y + 0.1; }
        if (p.t === 4 && e) hitEnemy(e, Math.round(CFG.playerDamage.knee * st.power), false, p.face, 0, true, p);
        if (p.t >= 13) { if (e && e.state === 'grabbed' && e.hp > 0) { p.state = 'grab'; p.t = 20; } else { p.state = 'idle'; p.grab = null; } }
        break;
      }
      case 'throw': p.frame = 'throw'; if (p.t >= 18) p.state = 'idle'; break;
      case 'special': updateSpecial(p); break;
      case 'hurt': p.frame = 'hurt'; if (p.t >= 14) p.state = 'idle'; break;
      case 'fall':
        p.x += p.vx; p.z += p.vz; p.vz -= GRAV; p.frame = p.dropIn ? 'jump' : 'hurt';
        if (p.z <= 0) { p.z = 0; if (p.dropIn) { p.dropIn = false; p.state = 'land'; p.t = 0; dust(p.x, p.y); A.fx('land'); } else { p.state = 'down'; p.t = 0; A.fx('down'); E.shake(2, 6); dust(p.x, p.y); } }
        break;
      case 'down': p.frame = 'down'; if (p.t >= (p.hp <= 0 ? 70 : 36)) { if (p.hp <= 0) playerDied(p); else { p.state = 'getup'; p.t = 0; } } break;
      case 'getup': p.frame = 'idle1'; if (p.t >= 12) { p.state = 'idle'; p.inv = CFG.getupIframes; } break;
      case 'win': p.frame = 'win'; break;
    }
    p.y = clamp(p.y, FT, FB); p.x = clamp(p.x, G.cam + 10, G.cam + W - 10);
    if (E.isTouch && !['fall', 'down', 'dead', 'out'].includes(p.state)) { const b = safeBand(p.y - 42 - p.z, p.y, 10); p.x = clamp(p.x, G.cam + b[0], G.cam + b[1]); } // never park under the stick or buttons
    if (p.z === 0 && !['down', 'fall', 'dead', 'out'].includes(p.state)) {
      for (const it of G.items) if (!it.dead && Math.abs(it.x - p.x) < 12 && Math.abs(it.y - p.y) < 8) {
        it.dead = true; const heal = CFG.food[it.type] || 0;
        if (heal) { p.hp = Math.min(p.maxHp, p.hp + heal); A.fx('heal'); pop(p.x, p.y - 46, '+' + heal + ' HP', P.mint); addScore(100); }
        else { const sc = CFG.scoreItems[it.type] || 500; addScore(sc); A.fx('pickup'); pop(p.x, p.y - 46, '+' + sc, P.gold); }
      }
    }
  }

  // ---------------------------------------------------------------- enemies
  function enemyDrop(e) { if (e.hold) { G.loose.push({ x: e.x, y: e.y, kind: e.hold, t: 0 }); e.hold = null; } e.seek = null; }
  function hitEnemy(e, dmg, kd, dir, push, keepGrab, by) {
    e.hp -= dmg; e.flash = 8; G.hitstop = Math.max(G.hitstop, kd ? 5 : 3);
    addScore(10); spark(e.x - dir * 4, e.y - 24 - e.z); A.fx(kd ? 'hit' : 'punch'); chainHit(by);
    if (!e.isBoss && !keepGrab) enemyDrop(e);
    if (e.hp <= 0) { e.hp = 0; e.ko = true; for (const p of joined()) if (p.grab === e) p.grab = null; knock(e, dir, 1.1); if (e.isBoss) { E.shake(4, 20); E.flash(4); } return; }
    if (keepGrab) return;
    if (e.isBoss) {
      e.armorCount++; e.hurtRun++;
      if (e.armorCount >= e.cfg.armorEvery) { e.armorCount = 0; if (kd) knock(e, dir, 0.8); else hurt(e, dir, push); }
      return;
    }
    if (e.def.armor && !kd) { e.armorHits++; if (e.armorHits <= e.def.armor) return; e.armorHits = 0; }
    if (kd) knock(e, dir, 1); else hurt(e, dir, push);
  }
  function hurt(e, dir, push) { e.state = 'hurt'; e.t = 0; e.vx = dir * (push || 1.5); }
  function knock(e, dir, f) { e.state = 'fall'; e.t = 0; e.vz = 2.6; e.vx = dir * 1.6 * f; e.z = Math.max(e.z, 0.1); }
  function arrest(e) {
    e.dead = true; addScore(e.def.score || 100); G.stats.ko++;
    G.fx.push({ k: 'cuffs', x: e.x, y: e.y, t: 0, life: 50 }); pop(e.x, e.y - 30, e.isBoss ? 'ARRESTED!' : 'CUFFED!', P.ice); A.fx('cuff');
    if (e.isBoss) {
      for (const o of G.enemies) if (!o.isBoss && !o.ko) { o.ko = true; o.hp = 0; knock(o, sgn(o.x - e.x) || 1, 0.5); }
    }
  }
  function attackers() { let n = 0; for (const e of G.enemies) if (!e.isBoss && (e.state === 'windup' || e.state === 'attack' || e.state === 'charge')) n++; return n; }
  function walkFrame(e) { return e.hold ? 'carry' + (Math.floor(e.walkT / 8) % 2) : 'walk' + (Math.floor(e.walkT / 6) % 6); }
  function moveToward(e, tx, ty, spd) {
    const mx = Math.abs(tx - e.x) > 2 ? sgn(tx - e.x) * spd : 0, my = Math.abs(ty - e.y) > 1.5 ? sgn(ty - e.y) * spd * 0.6 : 0;
    e.x += mx; e.y += my;
    if (mx || my) { e.state = 'walk'; e.walkT++; e.frame = walkFrame(e); } else { e.state = 'idle'; e.frame = e.hold ? 'carry0' : 'idle' + (Math.floor((G.t + e.idx * 13) / 13) % 4); }
  }
  function enemyHitsPlayer(e, reach, dmg, kd) {
    let hit = false;
    for (const p of active()) {
      const dx = (p.x - e.x) * e.face;
      if (dx > -6 && dx < reach + 6 && Math.abs(p.y - e.y) < 8 && p.z < 22) hit = damagePlayer(p, dmg, kd, e.face) || hit;
    }
    return hit;
  }
  function ai(e) {
    const p = target(e), d = e.def, dx = p.x - e.x, dy = p.y - e.y;
    if (Math.abs(dx) > 2) e.face = sgn(dx);
    // carrying something: line up and throw it
    if (e.hold) {
      const side = e.x < p.x ? -1 : 1; let tx = p.x + side * 90;
      if (tx < G.cam + 16 || tx > G.cam + W - 16) tx = p.x - side * 90;
      moveToward(e, aiX(tx, p), p.y, d.speed * 0.9); e.face = sgn(dx) || e.face;
      if (e.cool <= 0 && Math.abs(dy) < 6 && Math.abs(dx) > 36 && Math.abs(dx) < 200) { e.state = 'etoss'; e.t = 0; }
      return;
    }
    if (e.seek) {
      if (e.seek.dead) { e.seek = null; }
      else { moveToward(e, e.seek.x, e.seek.y, d.speed); if (Math.abs(e.seek.x - e.x) < 4 && Math.abs(e.seek.y - e.y) < 3) { e.state = 'elift'; e.t = 0; } return; }
    }
    if (G.frozen) return; // test hook: thugs stand still unless they are carrying something
    if (e.canCarry && G.loose.length && Math.random() < CFG.enemyThrowChance && G.enemies.filter(o => o.hold || o.seek).length < 2) {
      let best = null, bd = 130; for (const o of G.loose) { if (o.dead || o.x < G.cam + 10 || o.x > G.cam + W - 10 || G.enemies.some(q => q.seek === o)) continue; const dd = Math.abs(o.x - e.x) + Math.abs(o.y - e.y); if (dd < bd) { bd = dd; best = o; } }
      if (best) { e.seek = best; return; }
    }
    if (['down', 'fall', 'getup'].includes(p.state)) { moveToward(e, aiX(p.x - sgn(dx || 1) * 60, p), p.y + e.slotY * 2, d.speed * 0.6); e.face = sgn(dx) || e.face; return; }
    if (e.type === 'pitcher') {
      const side = e.x < p.x ? -1 : 1; let tx = p.x + side * 110;
      if (tx < G.cam + 16 || tx > G.cam + W - 16) tx = p.x - side * 110;
      moveToward(e, aiX(tx, p), p.y, d.speed); e.face = sgn(dx) || e.face;
      if (e.cool <= 0 && Math.abs(dy) < 6 && Math.abs(dx) > 40 && Math.abs(dx) < 230) { e.state = 'windup'; e.t = 0; }
      return;
    }
    if (e.cool > 0 || attackers() >= CFG.maxAttackers + CFG.coop.attackersPerPlayer * (nPlayers() - 1)) {
      moveToward(e, aiX(p.x - sgn(dx || 1) * (d.reach + 30 + e.idx * 12), p), p.y + e.slotY * 2, d.speed * 0.7); e.face = sgn(dx) || e.face; return;
    }
    if (e.type === 'dasher' && Math.abs(dy) < 6 && Math.abs(dx) < 110 && Math.abs(dx) > 30) { e.state = 'windup'; e.t = 0; return; }
    if (e.type === 'brick' && Math.abs(dy) < 6 && Math.abs(dx) > 70 && Math.abs(dx) < 150 && Math.random() < 0.02) { e.state = 'windup'; e.t = 0; e.chargeNext = true; return; }
    moveToward(e, aiX(p.x - sgn(dx || 1) * (d.reach - 4), p), p.y, d.speed); e.face = sgn(dx) || e.face;
    if (Math.abs(dx) <= d.reach + 2 && Math.abs(dy) < 5 && p.z < 20) { e.state = 'windup'; e.t = 0; e.chargeNext = false; }
  }
  function updateEnemy(e) {
    e.t++; if (e.flash > 0) e.flash--; if (e.inv > 0) e.inv--; if (e.cool > 0) e.cool--;
    const d = e.def;
    switch (e.state) {
      case 'enter': {
        const tx = e.x < G.cam + W / 2 ? G.cam + 26 : G.cam + W - 26;
        e.x += sgn(tx - e.x) * Math.max(d.speed, 0.9); e.walkT++; e.frame = walkFrame(e); e.face = sgn(tx - e.x) || e.face;
        if (Math.abs(tx - e.x) < 2 || (e.x > G.cam + 20 && e.x < G.cam + W - 20)) { e.state = 'idle'; e.t = 0; if (e.isBoss) e.cool = 40; }
        break;
      }
      case 'rise': e.frame = e.t < 30 ? 'jump' : 'idle1'; if (e.t >= 42) { e.state = 'idle'; e.t = 0; e.cool = 30; dust(e.x, e.y); } break;
      case 'door': e.frame = walkFrame(e); if (e.t > 16) { e.y += 0.9; e.walkT++; } if (e.t >= 40) { e.state = 'idle'; e.t = 0; e.cool = 20; } break;
      case 'drop':
        e.frame = 'jump';
        if (e.t > 14) { e.z += e.vz; e.vz -= GRAV; if (e.z <= 0) { e.z = 0; e.vz = 0; e.state = 'idle'; e.t = 0; e.cool = 30; dust(e.x, e.y); A.fx('land'); } }
        break;
      case 'idle': case 'walk': if (e.isBoss) bossAI(e); else ai(e); break;
      case 'elift': e.frame = 'windup'; if (e.t >= 12) { if (e.seek && !e.seek.dead) { e.seek.dead = true; e.hold = e.seek.kind; A.fx('lift'); } e.seek = null; e.state = 'idle'; e.cool = 40; } break;
      case 'etoss':
        e.frame = e.t < 16 ? 'carry0' : 'throw1';
        if (e.t === 16 && e.hold) { const o = CFG.objects[e.hold]; G.projs.push({ k: 'obj', kind: e.hold, friendly: false, owner: e, x: e.x + e.face * 10, y: e.y, z: 30, vx: e.face * o.speed * 0.8, vy: 0, vz: 0.5, dmg: Math.round(o.dmg * 0.6), t: 0, serial: ++G.serial }); e.hold = null; A.fx('toss'); }
        if (e.t >= 28) { e.state = 'idle'; e.cool = rand(d.cooldown[0], d.cooldown[1]); }
        break;
      case 'windup':
        e.frame = e.type === 'pitcher' ? 'throw0' : e.chargeNext ? 'charge' : 'windup';
        if (e.t >= d.windup) { e.state = e.chargeNext ? 'charge' : 'attack'; e.t = 0; e.serial = ++G.serial; if (e.type === 'dasher') e.vx = e.face * 3.2; }
        break;
      case 'attack':
        if (e.type === 'pitcher') {
          e.frame = 'throw1';
          if (e.t === 1) G.projs.push({ k: 'wrench', x: e.x + e.face * 8, y: e.y, z: 20, vx: e.face * 2.6, vy: 0, dmg: d.dmg, t: 0 });
          if (e.t >= 14) { e.state = 'idle'; e.cool = rand(d.cooldown[0], d.cooldown[1]); }
        } else if (e.type === 'dasher') {
          e.frame = 'slash'; e.x += e.vx; e.vx *= 0.95;
          if (!e.hitDone && enemyHitsPlayer(e, 16, d.dmg, false)) e.hitDone = true;
          if (e.t >= 20) { e.state = 'idle'; e.hitDone = false; e.cool = rand(d.cooldown[0], d.cooldown[1]); }
        } else {
          e.frame = e.t < 2 ? 'jabW' : e.t < 9 ? 'jab' : 'jabF';
          if (e.t === 2) enemyHitsPlayer(e, d.reach, d.dmg, e.type === 'brick');
          if (e.t >= (e.type === 'brick' ? 20 : 14)) { e.state = 'idle'; e.cool = rand(d.cooldown[0], d.cooldown[1]); }
        }
        break;
      case 'charge':
        e.frame = 'charge'; e.x += e.face * 2.6;
        if (!e.hitDone && enemyHitsPlayer(e, 14, d.dmg, true)) e.hitDone = true;
        if (e.t > 60 || e.x < G.cam + 12 || e.x > G.cam + W - 12) { e.state = 'idle'; e.hitDone = false; e.chargeNext = false; e.cool = rand(60, 100); }
        break;
      case 'hurt': e.frame = 'hurt'; e.x += e.vx; e.vx *= 0.8; if (e.t >= 16) { e.state = 'idle'; e.cool = Math.max(e.cool, 18); } break;
      case 'fall': case 'thrown':
        e.x += e.vx; e.z += e.vz; e.vz -= GRAV; e.frame = 'hurt';
        if (e.state === 'thrown') {
          for (const o of G.enemies) if (o !== e && hittable(o) && Math.abs(o.x - e.x) < 16 && Math.abs(o.y - e.y) < 10 && o.lastHit !== e.serial) { o.lastHit = e.serial; hitEnemy(o, 8, true, sgn(e.vx), 2, false, e.thrower); pop(o.x, o.y - 40, 'BOWLED!', P.gold); }
          for (const pr of G.props) if (!pr.dead && Math.abs(pr.x - e.x) < 14 && Math.abs(pr.y - e.y) < 12 && pr.lastHit !== e.serial) { pr.lastHit = e.serial; hitProp(pr, e.thrower, 3); }
        }
        e.x = clamp(e.x, G.cam + 8, G.cam + W - 8);
        if (e.z <= 0) { e.z = 0; e.vx = 0; e.state = e.ko ? 'ko' : 'down'; e.t = 0; A.fx('down'); dust(e.x, e.y); if (e.isBoss || e.type === 'brick') E.shake(2, 6); }
        break;
      case 'screen': {
        // flies at the viewer, smacks the screen, slides down, then drops back into the street
        if (e.t === 26) { E.shake(5, 16); E.flash(3); A.fx('smash'); G.hitstop = Math.max(G.hitstop, 6); G.screenFx.push({ x: e.stx !== undefined ? e.stx : slamTX(e.sx0), y: 74, t: 0, life: 50 }); }
        if (e.t >= 70) { e.x = clamp(e.ox, G.cam + 20, G.cam + W - 20); e.y = e.oy; e.z = 0; e.state = e.ko ? 'ko' : 'down'; e.t = 0; dust(e.x, e.y); A.fx('down'); }
        break;
      }
      case 'down': e.frame = 'down'; if (e.t >= (e.isBoss ? 30 : 44)) { e.state = 'getup'; e.t = 0; } break;
      case 'getup': e.frame = 'idle1'; if (e.t >= 12) { e.state = 'idle'; e.inv = e.isBoss ? 40 : 24; e.cool = e.isBoss ? 20 : rand(20, 50); } break;
      case 'ko': e.frame = 'down'; if (e.t >= (e.isBoss ? 90 : 46)) arrest(e); break;
      case 'grabbed': e.frame = 'hurt'; if (!joined().some(p => p.grab === e)) { e.state = 'idle'; e.cool = 30; } break;
      default: if (e.isBoss) bossPattern(e); break;
    }
    if (!['enter', 'door', 'screen'].includes(e.state)) { e.y = clamp(e.y, FT, FB); if (e.isBoss) e.x = clamp(e.x, G.cam + 14, G.cam + W - 14); }
  }

  // ---------------------------------------------------------------- bosses
  function bossAI(e) {
    const p = target(e), c = e.cfg, dx = p.x - e.x, dy = p.y - e.y, adx = Math.abs(dx);
    const enraged = e.hp < e.maxHp * 0.34, spd = c.speed * (enraged ? 1.3 : 1);
    if (Math.abs(dx) > 2) e.face = sgn(dx);
    const go = (s) => { e.state = s; e.t = 0; e.serial = ++G.serial; e.hitDone = false; };
    const minions = G.enemies.filter(o => !o.isBoss && !o.ko).length;
    if (e.cool <= 0) {
      if (e.hurtRun >= 3 && (e.key === 'tess' || e.key === 'duke')) { e.hurtRun = 0; go('b_back'); return; }
      if ((e.key === 'rocco' || e.key === 'gus') && e.summoned === 0 && e.hp < e.maxHp * 0.5) { e.summoned = 1; go('b_summon'); return; }
      if (e.key === 'duke' && ((e.summoned === 0 && e.hp < e.maxHp * 0.67) || (e.summoned === 1 && e.hp < e.maxHp * 0.34)) && minions < 2) { e.summoned++; go('b_summon'); return; }
      const r = Math.random();
      if (e.key === 'rocco') {
        if (adx > 90 && Math.abs(dy) < 14 && r < 0.05) return go('b_charge');
        if (adx < 30 && Math.abs(dy) < 6) return go('b_combo');
      } else if (e.key === 'tess') {
        if (adx > 60 && Math.abs(dy) < 8 && r < 0.04) return go('b_dash');
        if (adx > 80 && r < 0.02) return go('b_tokens');
        if (r < 0.008) return go('b_jump');
        if (adx < 30 && Math.abs(dy) < 6) return go('b_dash');
      } else if (e.key === 'gus') {
        if (adx > 50 && r < 0.02) return go('b_jump');
        if (adx < 34 && Math.abs(dy) < 7) return go('b_swing');
      } else if (e.key === 'duke') {
        if (adx > 70 && Math.abs(dy) < 8 && r < 0.03) return go('b_cane');
        if (adx < 38 && Math.abs(dy) < 6) return go('b_thrust');
      }
    }
    const want = e.key === 'duke' && e.cool > 0 ? 60 : 24;
    let tx = p.x - sgn(dx || 1) * want;
    if (tx < G.cam + 16 || tx > G.cam + W - 16) tx = p.x + sgn(dx || 1) * want; // no room behind: step around
    moveToward(e, aiX(tx, p), p.y, spd);
    e.face = sgn(dx) || e.face;
  }
  function bossPattern(e) {
    const p = target(e), c = e.cfg, enraged = e.hp < e.maxHp * 0.34;
    const end = (cool) => { e.state = 'idle'; e.t = 0; e.cool = Math.round(cool * (enraged ? 0.7 : 1)); };
    switch (e.state) {
      case 'b_combo':
        e.frame = e.t < 14 ? 'windup' : e.t < 24 ? 'jab' : e.t < 34 ? 'kick' : 'idle0';
        if (e.t === 14 || e.t === 24) { e.serial = ++G.serial; enemyHitsPlayer(e, 28, c.dmg, e.t === 24); }
        if (e.t >= 44) end(50); break;
      case 'b_charge':
        if (e.t < 30) { e.frame = 'charge'; e.flash = e.t % 6 < 3 ? 2 : 0; }
        else { e.frame = 'charge'; e.x += e.face * 3.4; if (!e.hitDone && enemyHitsPlayer(e, 16, c.dmg + 2, true)) e.hitDone = true; if (e.x < G.cam + 14 || e.x > G.cam + W - 14 || e.t > 140) { E.shake(2, 8); end(60); } }
        break;
      case 'b_summon':
        e.frame = 'laugh';
        if (e.t === 20) { const n = e.key === 'duke' ? (e.summoned === 2 ? ['brick', 'dasher'] : ['grunt', 'dasher']) : e.key === 'gus' ? ['brick'] : ['grunt', 'grunt2']; n.forEach((t, i) => spawnEnemy(t, i % 2 ? 'L' : 'R')); A.fx('boss'); }
        if (e.t >= 60) end(40); break;
      case 'b_dash':
        if (e.t < 14) { e.frame = 'windup'; e.flash = e.t % 6 < 3 ? 2 : 0; }
        else { e.frame = 'kick'; e.x += e.face * 3.8; if (!e.hitDone && enemyHitsPlayer(e, 18, c.dmg, true)) e.hitDone = true; }
        if (e.t >= 38 || (e.t > 14 && (e.x < G.cam + 12 || e.x > G.cam + W - 12))) end(45); break;
      case 'b_tokens':
        e.frame = e.t < 12 ? 'throw0' : 'throw1';
        if (e.t === 12) for (const vy of [-0.5, 0, 0.5]) G.projs.push({ k: 'token', x: e.x + e.face * 8, y: e.y, z: 18, vx: e.face * 2.4, vy, dmg: 5, t: 0 });
        if (e.t >= 30) end(40); break;
      case 'b_jump':
        if (e.t === 1) { e.vz = e.key === 'gus' ? 5.2 : 4.8; e.vx = clamp((p.x - e.x) / 34, -3, 3); e.vy = clamp((p.y - e.y) / 34, -1.5, 1.5); e.z = 0.1; A.fx('jump'); }
        e.frame = 'jump'; e.x += e.vx; e.y += e.vy; e.z += e.vz; e.vz -= GRAV;
        if (e.z <= 0 && e.t > 2) {
          e.z = 0; E.shake(e.key === 'gus' ? 5 : 2, 12); A.fx('explode'); dust(e.x, e.y);
          if (e.key === 'gus') for (const d of [-1, 1]) for (let k = 1; k <= 3; k++) G.fx.push({ k: 'shock', x: e.x + d * k * 22, y: e.y, t: -k * 3, life: 18 });
          const r = e.key === 'gus' ? 72 : 26;
          for (const q of active()) if (Math.abs(q.x - e.x) < r && Math.abs(q.y - e.y) < 14 && q.z < 4) damagePlayer(q, c.dmg - 1, true, sgn(q.x - e.x) || 1);
          e.state = 'b_land'; e.t = 0;
        }
        break;
      case 'b_land': e.frame = 'slam'; if (e.t >= 20) end(50); break;
      case 'b_swing':
        e.frame = e.t < 22 ? 'slamup' : e.t < 34 ? 'jab' : 'idle0';
        if (e.t < 22) e.flash = e.t % 6 < 3 ? 2 : 0;
        if (e.t === 22) enemyHitsPlayer(e, 32, c.dmg + 2, true);
        if (e.t >= 44) end(50); break;
      case 'b_thrust':
        e.frame = e.t < 12 ? 'swingHi' : e.t < 24 ? 'swingMid' : 'idle0';
        if (e.t === 12) enemyHitsPlayer(e, 36, c.dmg, false);
        if (e.t >= 30) end(35); break;
      case 'b_cane':
        e.frame = e.t < 14 ? 'throw0' : e.t < 120 ? 'laugh' : 'idle0';
        if (e.t === 14) G.projs.push({ k: 'cane', x: e.x + e.face * 10, y: e.y, z: 20, vx: e.face * 3, vy: 0, dmg: 6, t: 0, owner: e });
        if (e.t >= 120) end(30); break;
      case 'b_back':
        if (e.t === 1) { e.vz = 4; e.vx = -e.face * 2.6; e.z = 0.1; e.inv = 30; }
        e.frame = 'jump'; e.x += e.vx; e.z += e.vz; e.vz -= GRAV; e.x = clamp(e.x, G.cam + 16, G.cam + W - 16);
        if (e.z <= 0 && e.t > 2) { e.z = 0; end(20); }
        break;
      default: end(30);
    }
  }

  // ---------------------------------------------------------------- thrown objects
  function landObj(pj, knocked) {
    pj.dead = true;
    const o = CFG.objects[pj.kind];
    if (o.shatter) { burst(pj.x, pj.y - 4, ART.debris.crate, 14, 0.9); A.fx('break'); spark(pj.x, pj.y - 8); return; }
    if (pj.x > G.cam - 10 && pj.x < G.cam + W + 10) G.loose.push({ x: clamp(pj.x, G.cam + 12, G.cam + W - 12), y: clamp(pj.y, FT, FB), kind: pj.kind, t: 0 });
    if (!knocked) A.fx('land');
  }
  function updateObj(pj) {
    const o = CFG.objects[pj.kind];
    pj.x += pj.vx;
    if (!pj.rolling) { pj.z += pj.vz; pj.vz -= 0.12; if (pj.z <= 0) { pj.z = 0; if (o.roll && !pj.spent) { pj.rolling = true; pj.vz = 0; dust(pj.x, pj.y); A.fx('land'); } else { landObj(pj); return; } } }
    if (pj.spent) return;
    if (pj.friendly) {
      for (const e of G.enemies) {
        if (!hittable(e) || e.lastHit === pj.serial) continue;
        if (Math.abs(e.x - pj.x) < 12 && Math.abs(e.y - pj.y) < 9 && Math.abs((pj.z - 18) - e.z) < 28) {
          e.lastHit = pj.serial; hitEnemy(e, Math.round(pj.dmg), true, sgn(pj.vx), 3, false, pj.owner); pop(e.x, e.y - 40, 'BONK!', P.gold);
          if (!o.roll) { if (o.shatter) { landObj(pj, true); return; } pj.vx = -pj.vx * 0.25; pj.vz = 1.6; pj.spent = true; return; }
        }
      }
      for (const pr of G.props) if (!pr.dead && pr.lastHit !== pj.serial && Math.abs(pr.x - pj.x) < 12 && Math.abs(pr.y - pj.y) < 12) { pr.lastHit = pj.serial; hitProp(pr, pj.owner, 2); if (!o.roll) { if (o.shatter) { landObj(pj, true); return; } pj.vx = -pj.vx * 0.25; pj.vz = 1.6; pj.spent = true; return; } }
    } else {
      for (const p of active()) {
        if (Math.abs(p.x - pj.x) < 10 && Math.abs(p.y - pj.y) < 8 && p.z < 16 && damagePlayer(p, pj.dmg, true, sgn(pj.vx))) {
          if (!o.roll) { if (o.shatter) { landObj(pj, true); return; } pj.vx = -pj.vx * 0.25; pj.vz = 1.6; pj.spent = true; return; }
        }
      }
    }
    if (pj.x < G.cam - 30 || pj.x > G.cam + W + 30) pj.dead = true;
  }

  // ---------------------------------------------------------------- world update
  function handleJoins() {
    const dev = joinRequest();
    if (!dev) return;
    if (joined().length >= MAXP && !G.players.some(p => p && p.out && p.devs.includes(dev))) return;
    if (dev === 'kb1' && G.p && !G.p.out) return;
    const p = dropIn(dev);
    if (p) p.joinT = G.t; // the START that joined must not also pause
  }
  function updatePlay() {
    if (G.goT > 0) { G.goT--; if (G.goT % 40 === 39) A.fx('go'); }
    if (G.bannerT > 0) G.bannerT--; if (G.tapHintT > 0) G.tapHintT--;
    for (const f of G.fx) { f.t++; if (f.k === 'spray' && f.t > 0 && (!E.reducedMotion || f.t % 2 === 0) && f.t < f.life - 20) for (let k = 0; k < (E.lowFx2 ? 1 : 2); k++) G.debris.push({ x: f.x + rand(-2, 2), y: f.y + 6, z: 12, vx: rand(-0.6, 0.6), vy: rand(-0.1, 0.1), vz: rand(2.5, 4.2), col: k ? P.ice : P.white, t: 0, life: 36, sz: 2, water: true }); }
    G.fx = G.fx.filter(f => f.t < f.life);
    for (const pp of G.pops) { pp.t++; pp.y -= 0.4; } G.pops = G.pops.filter(pp => pp.t < 50);
    for (const sf of G.screenFx) sf.t++; G.screenFx = G.screenFx.filter(sf => sf.t < sf.life);
    for (const d of G.debris) { d.t++; d.x += d.vx; d.y += d.vy; d.z += d.vz; d.vz -= 0.25; if (d.z <= 0) { d.z = 0; if (d.water) d.t = d.life; else if (!d.bounced) { d.bounced = true; d.vz = -d.vz * 0.3 + 0.8; d.vx *= 0.5; } else { d.vx *= 0.8; d.vz = 0; } } }
    G.debris = G.debris.filter(d => d.t < d.life);
    if (G.debris.length > E.particleCap) G.debris.splice(0, G.debris.length - E.particleCap); // adaptive quality cap (oldest go first)
    for (const o of G.loose) o.t++;
    if (G.hitstop > 0) { G.hitstop--; for (const e of G.enemies) if (e.state === 'screen') e.t++; return; }
    const S = G.S, p1 = G.p;
    handleJoins();
    // tap-to-move (P1 only)
    if (tapMove && p1 && !p1.out) {
      if (I.tap && I.tap.y > 24) p1.target = { x: G.cam + clamp(I.tap.x, 8, W - 8), y: clamp(I.tap.y, FT, FB) };
      else if (I.pointer.down && p1.target && I.pointer.y > 24) p1.target = { x: G.cam + clamp(I.pointer.x, 8, W - 8), y: clamp(I.pointer.y, FT, FB) };
    }
    for (const p of joined()) p.inp = playerInput(p);
    if (active().some(p => p.inp.pressed.start && p.joinT !== G.t)) { E.pause(); return; }
    for (const p of joined()) updatePlayer(p);
    if (G.state !== 'play') return;
    for (const e of G.enemies) updateEnemy(e);
    G.enemies = G.enemies.filter(e => !e.dead);
    for (const d of G.dogs) { d.t++; d.x += d.vx; areaHit(d, 16, 14, CFG.playerDamage.special * 0.9, true); if (d.x < G.cam - 40 || d.x > G.cam + W + 40) d.dead = true; }
    G.dogs = G.dogs.filter(d => !d.dead);
    for (const pj of G.projs) {
      pj.t++;
      if (pj.k === 'obj') { updateObj(pj); continue; }
      pj.x += pj.vx; pj.y += pj.vy;
      if (pj.k === 'cane') { if (pj.t === 46) pj.vx = -pj.vx; if (pj.t > 46 && pj.owner && Math.abs(pj.x - pj.owner.x) < 8) pj.dead = true; if (pj.t > 140) pj.dead = true; }
      if (pj.x < G.cam - 30 || pj.x > G.cam + W + 30 || pj.y < FT - 6 || pj.y > FB + 6) pj.dead = true;
      if (!pj.dead) for (const p of active()) if (Math.abs(pj.x - p.x) < 9 && Math.abs(pj.y - p.y) < 7 && p.z < 14) { if (damagePlayer(p, pj.dmg, false, sgn(pj.vx))) { pj.dead = pj.k !== 'cane'; break; } }
    }
    G.projs = G.projs.filter(pj => !pj.dead);
    for (const pr of G.props) if (pr.shakeT > 0) pr.shakeT--;
    G.props = G.props.filter(pr => !pr.dead);
    G.items = G.items.filter(it => !it.dead); for (const it of G.items) it.t++;
    G.loose = G.loose.filter(o => !o.dead);
    // waves (thug count scales with the number of players)
    if (G.lock === null) {
      const w = S.waves[G.wave];
      if (w && G.cam >= w.at) {
        G.lock = w.at; G.cam = w.at; G.goT = 0;
        G.spawnQ = w.spawn.map(s => ({ type: s[0], side: s[1], t: s[2] || 0, sx: s[3] }));
        const extra = Math.round(w.spawn.length * CFG.coop.extraEnemiesPerPlayer * (nPlayers() - 1));
        const pool = w.spawn.filter(s => s[0] !== 'brick');
        for (let k = 0; k < extra; k++) { const s = pool[k % pool.length] || w.spawn[0]; G.spawnQ.push({ type: s[0], side: k % 2 ? 'L' : 'R', t: 70 + k * 45 }); }
      } else if (!w && !G.boss && G.cam >= G.maxCam) startBoss();
    } else {
      for (const s of G.spawnQ) if (--s.t <= 0) { s.done = true; spawnEnemy(s.type, s.side, s.sx); }
      G.spawnQ = G.spawnQ.filter(s => !s.done);
      if (!G.spawnQ.length && !G.enemies.length) {
        if (G.boss) { stageClear(); return; }
        G.lock = null; G.wave++; G.goT = 160; A.fx('go');
      }
    }
    if (G.lock === null) {
      const xs = active().filter(p => p.state !== 'out').map(p => p.x);
      const w = S.waves[G.wave], limit = Math.min(w ? w.at : G.maxCam, G.maxCam), target = (xs.length ? Math.max.apply(null, xs) : G.cam + 130) - 130;
      const keep = xs.length ? Math.min.apply(null, xs) - 24 : target; // co-op: never scroll the last player off the left edge
      const goal = Math.min(target, Math.max(G.cam, keep));
      if (goal > G.cam) G.cam = Math.min(G.cam + Math.min(3, goal - G.cam), limit);
    }
    // subway train
    if (G.bg.train) { if (G.trainT > 0) G.trainT--; else { G.trainX += 9; if (G.trainX > W + 40) { G.trainX = -460; G.trainT = 400 + Math.floor(Math.random() * 300); } } }
  }

  // ---------------------------------------------------------------- character select (press start to join)
  function selectInit(firstDev) {
    G.state = 'select'; G.t = 0; G.readyT = 0;
    G.picks = [{ slot: 0, devs: firstDev && firstDev.startsWith('pad') ? ['kb1', 'touch', firstDev] : ['kb1', 'touch'], cur: G.sel || 0, ready: false }];
  }
  const pickTaken = (hi, me) => G.picks.some(k => k && k !== me && k.ready && k.cur === hi);
  function stepCursor(k, dir) { for (let n = 0; n < 4; n++) { k.cur = (k.cur + dir + 4) % 4; if (!pickTaken(k.cur, k)) break; } A.fx('select'); }
  function pickInput(k) {
    const fake = { slot: k.slot, devs: k.devs };
    const used = new Set(); for (const q of G.picks) if (q) q.devs.forEach(d => used.add(d));
    const o = blank(), list = k.devs.slice(); if (k.slot === 0 && !used.has('kb2')) list.push('kb2*');
    for (const name of list) { const alias = name.endsWith('*'), d = DEV[alias ? name.slice(0, -1) : name]; if (!d) continue; for (const a of ACTS) { if (alias && a === 'start') continue; o.held[a] = o.held[a] || d.held[a]; o.pressed[a] = o.pressed[a] || d.pressed[a]; } }
    return o;
  }
  function updateSelect() {
    const tap = I.tap;
    // join: any unbound device presses START (controllers: START or attack)
    const used = new Set(); for (const q of G.picks) if (q) q.devs.forEach(d => used.add(d));
    for (const k of ['kb2', 'pad0', 'pad1', 'pad2', 'pad3']) {
      if (used.has(k) || !DEV[k]) continue;
      if (DEV[k].pressed.start || (k.startsWith('pad') && DEV[k].pressed.a)) {
        let slot = -1; for (let i = 0; i < MAXP; i++) if (!G.picks[i]) { slot = i; break; }
        if (slot < 0) break;
        const k2 = { slot, devs: [k], cur: 0, ready: false, joinT: G.t };
        k2.cur = -1; stepCursor(k2, 1); G.picks[slot] = k2; G.readyT = 0; A.fx('join'); used.add(k);
      }
    }
    for (const k of G.picks) {
      if (!k || k.joinT === G.t) continue;
      const inp = pickInput(k);
      if (!k.ready) {
        if (inp.pressed.left) stepCursor(k, -1);
        if (inp.pressed.right) stepCursor(k, 1);
        if ((inp.pressed.a || inp.pressed.start || inp.pressed.b) && G.t > 10) { if (pickTaken(k.cur, k)) A.fx('ehit'); else { k.ready = true; A.fx('confirm'); for (const q of G.picks) if (q && q !== k && !q.ready && q.cur === k.cur) stepCursor(q, 1); } }
        if (inp.pressed.c) { if (k.slot === 0) { toTitle(); return; } G.picks[k.slot] = null; A.fx('select'); }
      } else if (inp.pressed.c) { k.ready = false; G.readyT = 0; A.fx('select'); }
    }
    // touch: tap a card to pick it, tap it again (or below) to confirm (P1)
    const k0 = G.picks[0];
    if (tap && k0) {
      if (tap.y > 20 && tap.y < 128) { const i = clamp(Math.floor(tap.x / 80), 0, 3); if (i === k0.cur && !pickTaken(i, k0)) { k0.ready = true; A.fx('confirm'); } else if (!pickTaken(i, k0)) { k0.cur = i; k0.ready = false; A.fx('select'); } }
      else if (tap.y >= 128 && !pickTaken(k0.cur, k0)) { k0.ready = true; A.fx('confirm'); }
    }
    const list = G.picks.filter(Boolean);
    if (list.length && list.every(k => k.ready)) {
      if (++G.readyT > 36) { G.sel = k0 ? k0.cur : 0; newGame(G.picks.map(k => k ? { hi: k.cur, devs: k.devs } : null), 0); }
    } else G.readyT = 0;
  }

  // ---------------------------------------------------------------- update dispatch
  function update() {
    G.t++;
    pollDevices();
    const tap = I.tap;
    switch (G.state) {
      case 'title': {
        if (!E.reducedMotion) G.titleCam = (G.titleCam + 0.3) % 1000;
        if (G.howto) { if (I.confirm() || I.pressed.c || tap) { G.howto = false; A.fx('select'); } break; }
        if (I.pressed.up || I.pressed.down) { G.menu = 1 - G.menu; A.fx('select'); }
        let go = I.confirm();
        if (tap) { if (tap.y > 118 && tap.y < 131) G.menu = 0; else if (tap.y >= 131 && tap.y < 144) G.menu = 1; go = true; }
        if (go && G.t > 10) {
          A.fx('confirm');
          if (G.menu === 0) { let pad = null; for (let i = 0; i < 4; i++) { const d = DEV['pad' + i]; if (d && (d.pressed.start || d.pressed.a || d.pressed.b)) { pad = 'pad' + i; break; } } selectInit(pad); }
          else G.howto = true;
        }
        break;
      }
      case 'select': updateSelect(); break;
      case 'intro': if ((G.t > 30 && (I.confirm() || tap)) || G.t > 190) startPlay(); break;
      case 'play': updatePlay(); break;
      case 'clear': {
        for (const p of active()) { p.state = 'win'; p.frame = 'win'; p.z = 0; }
        if (G.bonusShown < G.bonus) { const s = Math.min(100, G.bonus - G.bonusShown); G.bonusShown += s; addScore(s); }
        for (const f of G.fx) f.t++; G.fx = G.fx.filter(f => f.t < f.life);
        if (G.t > 260 || (G.t > 90 && (I.confirm() || tap))) { if (G.bonusShown < G.bonus) addScore(G.bonus - G.bonusShown); if (G.stage < STAGES.length - 1) loadStage(G.stage + 1); else victory(); }
        break;
      }
      case 'continue': {
        const left = CFG.continueSeconds - Math.floor(G.t / 60);
        if (I.pressed.left || I.pressed.right || I.pressed.up || I.pressed.down) { G.contSel = 1 - G.contSel; A.fx('select'); }
        let go = I.confirm() && G.t > 20;
        if (tap) { if (tap.x < W / 2) G.contSel = 0; else G.contSel = 1; go = true; }
        if (go) {
          if (G.contSel === 0) { G.continues++; for (const p of joined()) { reviveP(p); p.state = 'idle'; p.z = 0; p.dropIn = false; } G.state = 'play'; A.music(G.boss ? SONGS.boss : SONGS[G.S.music]); A.fx('confirm'); }
          else gameOver();
        } else if (left < 0) gameOver();
        break;
      }
      case 'gameover': if (G.t > 300 || (G.t > 60 && (I.confirm() || tap))) toTitle(); break;
      case 'victory': if (G.t > 120 && (I.confirm() || tap)) toTitle(); break;
    }
    I.keyHit = {};
    updateTouchLabels();
  }
  // phones: the ATK button becomes a pickup prompt when you stand on something you can throw
  let atkLabel = 'ATK', atkBtn = null;
  function updateTouchLabels() {
    if (!E.isTouch) return;
    if (!atkBtn) atkBtn = document.querySelector('.tbtn[data-act="a"]');
    if (!atkBtn) return;
    const p = G.p; let lab = 'ATK';
    if (G.state === 'play' && p && !p.out) { if (p.hold) lab = 'TOSS'; else if (['idle', 'walk'].includes(p.state) && looseAt(p.x, p.y)) lab = 'LIFT'; }
    if (lab !== atkLabel) { atkLabel = lab; atkBtn.textContent = lab; atkBtn.classList.toggle('prompt', lab !== 'ATK'); }
  }

  // ---------------------------------------------------------------- rendering
  function bar(x, y, w, h, frac, col, back) { // beveled gauge: dark well, glossy ramp fill, segment ticks, rim
    const Rc = E.ramp(col), fw = Math.max(0, w * Math.max(0, Math.min(1, frac)));
    ctx.fillStyle = '#06020E'; ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 1, y + h + 0.5, w + 2, 0.5);
    const gb = E.grad('bb' + y + h + back, () => { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, E.ramp(back).d2); g.addColorStop(1, E.ramp(back).d1); return g; }); ctx.fillStyle = gb; ctx.fillRect(x, y, w, h);
    if (fw > 0) {
      const g = E.grad('bf' + y + h + col, () => { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, Rc.h2); g.addColorStop(0.35, Rc.h1); g.addColorStop(0.55, Rc.b); g.addColorStop(1, Rc.d2); return g; });
      ctx.fillStyle = g; ctx.fillRect(x, y, fw, h); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x, y, fw, 0.5); ctx.fillStyle = Rc.h2; ctx.fillRect(x + fw - 0.5, y, 0.5, h);
    }
    for (let i = x + 6; i < x + w; i += 6) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(i, y, 0.5, h); }
  }
  function hudStrip(h) { // glossy top bar
    const g = E.grad('hs' + h, () => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1C1238'); g.addColorStop(0.5, '#0C0820'); g.addColorStop(1, '#05030E'); return g; });
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, h); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(0, 0, W, 1);
    const g2 = E.grad('hs2', () => { const g2 = ctx.createLinearGradient(0, 0, W, 0); g2.addColorStop(0, '#8C6000'); g2.addColorStop(0.5, '#F8D878'); g2.addColorStop(1, '#8C6000'); return g2; });
    ctx.fillStyle = g2; ctx.fillRect(0, h, W, 1); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, h + 1, W, 1);
  }
  function portraitFrame(img, x, y, col) {
    ctx.fillStyle = '#06020E'; ctx.fillRect(x - 1.5, y - 1.5, 21, 21); ctx.fillStyle = col || '#F0BC3C'; ctx.fillRect(x - 1, y - 1, 20, 20);
    ctx.fillStyle = E.grad('pf' + y, () => { const g = ctx.createLinearGradient(0, y, 0, y + 18); g.addColorStop(0, '#3C2C78'); g.addColorStop(1, '#100828'); return g; }); ctx.fillRect(x, y, 18, 18);
    ctx.drawImage(img, x, y, 18, 18); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, 18, 4);
  }
  // per-stage light and weather (drawn by E.atmos over the street, under the HUD)
  const every = (a, b, step, f) => { const o = []; for (let x = a; x < b; x += step) o.push(f(x)); return o; };
  const THEME = {
    street: { weather: 'rain', glow: 0.6, farGlow: 0.4, reflect: [119, 180], floor: [124, 176] },
    subway: { weather: 'steam', glow: 0.5, farGlow: 0.3, reflect: [119, 180], emit: every(260, 2000, 430, x => ({ x, y: 124, h: 64 })),
      pools: every(180, 2000, 300, x => ({ x, y: 150, y0: 40, r: 46, col: 'rgba(190,255,235,0.55)', a: 0.22, flicker: true, cone: true })) },
    rooftop: { weather: 'dust', glow: 0.45, farGlow: 0.5, emit: every(100, 2000, 140, x => ({ x, y: 160, h: 90 })) },
    warehouse: { weather: 'dust', glow: 0.42, farGlow: 0.3, emit: every(150, 2200, 200, x => ({ x, y: 170, h: 120 })), shafts: every(140, 2200, 380, x => ({ x })) }
  };
  function drawBgLayers(bg, cam) {
    const th = THEME[bg.theme] || {}; E.bgPrep(bg, th);
    E.drawLayer(ctx, bg, 'far', cam * 0.3, 0, true);
    if (!E.lowFx) E.drawGlow(ctx, bg.farGlow, bg.far.width, cam * 0.3, th.farGlow || 0.3, true);
    if (bg.mid) E.drawLayer(ctx, bg, 'mid', cam * 0.6);
    E.drawLayer(ctx, bg, 'main', cam);
    if (bg.train && G.trainX > -460) {
      const tr = BG.trainSprite(); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 104); ctx.clip(); ctx.drawImage(tr, Math.round(G.trainX), 64); ctx.restore();
    }
    if (bg.over) E.drawLayer(ctx, bg, 'over', cam);
    E.drawGlow(ctx, bg.glow, bg.main.width, cam, th.glow || 0.5);
    if (th.reflect && !E.lowFx) { // wet street: the neon and windows mirrored on the road
      ctx.save(); ctx.beginPath(); ctx.rect(0, th.reflect[0], W, th.reflect[1] - th.reflect[0]); ctx.clip();
      ctx.translate(0, th.reflect[0] * 2 + 2); ctx.scale(1, -1); E.drawGlow(ctx, bg.glow, bg.main.width, cam, 0.22); ctx.restore();
    }
  }
  function drawAtmos(bg, cam) { const th = THEME[bg.theme]; if (th) E.atmos(ctx, th.weather, G.t, cam, th); }
  // chunky impact burst for hit sparks: a jagged white/gold star and an expanding ring
  function impact(x, y, t, big) {
    if (t > 7) return; const k = t / 7, r = (big ? 15 : 10) * (0.5 + k), n = 8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k * 0.8;
    ctx.fillStyle = t < 2 ? '#FFFFFF' : '#FFD860'; ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n + t * 0.2, rr = i % 2 ? r * 0.38 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,200,0.9)'; ctx.lineWidth = 1.5 * (1 - k); ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r, 0, 0, 7); ctx.stroke();
    ctx.restore();
  }
  const coop = () => joined().length > 1;
  function drawActor(a, cam) {
    if (a.out || a.state === 'screen') return;
    const fr = a.fr[a.frame] || a.fr.idle0;
    let flip = a.face < 0; if (a.flipAlt) flip = !flip;
    let alpha = 1;
    if ((a.isPlayer && a.inv > 0 && a.state !== 'special') || a.state === 'ko') {
      if (E.reducedMotion) alpha = 0.6; else if (!E.blink(a.isPlayer ? a.inv : a.t, a.state === 'ko' ? 4 : 3)) return;
    }
    if (a.state === 'door' && a.t < 14) return;
    const white = a.flash > 0 && (E.reducedMotion ? a.flash > 5 : a.flash % 4 < 2);
    ctx.globalAlpha = alpha;
    if (a.state === 'rise') {
      // climbing out of the manhole: clip at street level
      const off = Math.max(0, 44 - a.t * 1.6);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, Math.round(a.y + 1)); ctx.clip(); E.draw(ctx, fr, a.x - cam, a.y + off, flip, white); ctx.restore();
    } else {
      // squash and stretch on impacts (visual only; hitboxes are unchanged)
      let sx = 1, sy = 1;
      if (!E.reducedMotion) {
        if (a.state === 'hurt' && a.t < 5) { sx = 1.1; sy = 0.92; }
        else if ((a.state === 'land' || a.state === 'down') && a.t < 4) { sx = 1.12; sy = 0.88; }
        else if (a.state === 'jump' && a.t < 5) { sx = 0.9; sy = 1.1; }
        else if (a.state === 'attack' && a.t >= 2 && a.t < 5) { sx = 1.05; sy = 0.97; }
      }
      if (sx !== 1) { const ax = Math.round(a.x - cam), ay = Math.round(a.y - a.z); ctx.save(); ctx.translate(ax, ay); ctx.scale(sx, sy); E.draw(ctx, fr, 0, 0, flip, white); ctx.restore(); }
      else E.draw(ctx, fr, a.x - cam, a.y - a.z, flip, white);
    }
    if (a.hold && ART.obj[a.hold]) E.draw(ctx, ART.obj[a.hold], a.x - cam + (a.face < 0 ? -1 : 1), a.y - a.z - 46);
    ctx.globalAlpha = 1;
    if (a.state === 'down' || (a.state === 'ko' && a.isBoss)) for (let i = 0; i < 3; i++) { const ang = G.t * 0.12 + i * 2.1; E.draw(ctx, ART.star, a.x - cam + Math.cos(ang) * 9, a.y - 14 + Math.sin(ang) * 3); }
    if ((a.state === 'windup' && (a.type === 'dasher' || a.chargeNext) || a.state === 'etoss' && a.t < 16) && E.blink(a.t, 4)) E.text(ctx, '!', a.x - cam - 2, a.y - 46 - (a.hold ? 14 : 0), P.gold);
    if (a.isPlayer && coop()) { const tag = 'P' + (a.slot + 1); E.text(ctx, tag, a.x - cam, a.y - a.z - (a.hold ? 66 : 52), a.col, 1, 'center', { outline: P.black }); }
  }
  function drawObjSprite(kind, x, y, t, rolling) {
    if (kind === 'barrel' && rolling) E.draw(ctx, ART.barrelRoll[Math.floor(t / 4) % 2], x, y);
    else E.draw(ctx, ART.obj[kind], x, y, kind === 'lid' ? false : Math.floor(t / 6) % 2 === 1 && kind === 'cone');
  }
  function renderPlay() {
    const [sx, sy] = E.shakeOffset(), cam = Math.round(G.cam);
    ctx.save(); ctx.translate(sx, sy);
    drawBgLayers(G.bg, cam);
    // entrances that belong to the back wall / street surface
    for (const f of G.fx) {
      if (f.t < 0) continue;
      if (f.k === 'door') { if (f.t < f.life) E.draw(ctx, ART.doorway, f.x - cam, f.y); }
      else if (f.k === 'window') E.draw(ctx, ART.windowOpen, f.x - cam, f.y + 12);
      else if (f.k === 'manhole') { E.draw(ctx, f.t < 60 ? ART.manholeOpen : ART.manhole, f.x - cam, f.y + 1); }
    }
    const all = [];
    for (const pr of G.props) all.push({ y: pr.y, d: () => E.draw(ctx, ART[pr.type], pr.x - cam + (pr.shakeT ? (pr.shakeT % 2 ? 1 : -1) : 0), pr.y, false, pr.shakeT > 5), sh: pr });
    for (const f of G.fx) if (f.k === 'stub') all.push({ y: f.y - 0.5, d: () => E.draw(ctx, ART.hydrantBroken, f.x - cam, f.y) });
    for (const o of G.loose) all.push({ y: o.y - 0.5, d: () => drawObjSprite(o.kind, o.x - cam, o.y, 0), sh: o });
    for (const it of G.items) all.push({ y: it.y - 1, d: () => { if (it.t % 40 < 30 || E.reducedMotion) E.draw(ctx, ART.items[it.type], it.x - cam, it.y); }, sh: it });
    for (const e of G.enemies) if (e.state !== 'screen' && !(e.state === 'door' && e.t < 14)) all.push({ y: e.y, d: () => drawActor(e, cam), sh: e.state === 'rise' && e.t < 20 ? null : e, big: e.isBoss || e.type === 'brick' });
    for (const p of joined()) if (!p.out) all.push({ y: p.y + 0.05, d: () => drawActor(p, cam), sh: p });
    for (const d of G.dogs) all.push({ y: d.y + 0.1, d: () => E.draw(ctx, ART.dog[Math.floor(d.t / 3) % 4], d.x - cam, d.y, d.face < 0), sh: d });
    for (const pj of G.projs) all.push({ y: pj.y, d: () => {
      if (pj.k === 'obj') { drawObjSprite(pj.kind, pj.x - cam, pj.y - pj.z, pj.t, pj.rolling); return; }
      const s = pj.k === 'token' ? ART.token : pj.k === 'cane' ? ART.cane[Math.floor(pj.t / 3) % 4] : ART.wrench[Math.floor(pj.t / 3) % 4]; E.draw(ctx, s, pj.x - cam, pj.y - pj.z);
    }, sh: pj });
    ctx.globalAlpha = 0.35;
    for (const o of all) { const s = o.sh; if (!s) continue; const img = o.big ? ART.shadowBig : ART.shadow, sw = o.big ? 44 : 28, shh = o.big ? 10 : 8; ctx.drawImage(img, Math.round(s.x - cam - sw / 2), Math.round(s.y - shh / 2), sw, shh); }
    ctx.globalAlpha = 1;
    all.sort((a, b) => a.y - b.y);
    for (const o of all) o.d();
    for (const d of G.debris) { ctx.fillStyle = d.col; ctx.fillRect(Math.round(d.x - cam), Math.round(d.y - d.z), d.sz, d.sz); }
    for (const f of G.fx) {
      if (f.t < 0) continue;
      if (f.k === 'spark') { impact(f.x - cam, f.y - 4, f.t, f.big); E.draw(ctx, ART.spark[f.t < 4 ? 1 : 0], f.x - cam, f.y); }
      else if (f.k === 'dust') E.draw(ctx, ART.dust[Math.min(2, Math.floor(f.t / 4))], f.x - cam, f.y);
      else if (f.k === 'shock') E.draw(ctx, ART.shock[Math.min(2, Math.floor(f.t / 4))], f.x - cam, f.y);
      else if (f.k === 'cuffs') { E.draw(ctx, ART.cuffs, f.x - cam, f.y - 20 - f.t * 0.3); if (f.t < 12) E.draw(ctx, ART.spark[1], f.x - cam, f.y - 12); }
      else if (f.k === 'manhole' && f.t < 40) { const lift = Math.min(f.t, 12); E.draw(ctx, ART.manhole, f.x - cam + 14, f.y - lift); }
    }
    drawAtmos(G.bg, cam);
    // pickup prompts above loose objects players are standing on
    G.bubble = null;
    for (const p of active()) {
      if (p.hold || !['idle', 'walk'].includes(p.state)) continue;
      const o = looseAt(p.x, p.y); if (!o) continue;
      const lab = E.isTouch ? 'LIFT' : p.slot === 0 ? 'LIFT: J' : p.slot === 1 ? 'LIFT: ,' : 'LIFT: X';
      const tw = E.textWidth(lab) + 6;
      const [bx, by] = placeBubble(p.x - cam, p.y - 64 - (coop() ? 10 : 0), tw);
      const bob = E.reducedMotion ? 0 : Math.floor(G.t / 10) % 2;
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(Math.round(bx - tw / 2), by - 2 - bob, tw, 11);
      if (Math.abs(bx - (p.x - cam)) < tw / 2) ctx.fillRect(Math.round(bx) - 1, by + 9 - bob, 3, 2);
      E.text(ctx, lab, bx, by - bob, P.gold, 1, 'center');
      if (p.slot === 0) G.bubble = { x: Math.round(bx - tw / 2), y: by - 3, w: tw, h: 14 };
    }
    if (G.p && G.p.target && tapMove) { const tx = Math.round(G.p.target.x - cam), ty = Math.round(G.p.target.y); ctx.fillStyle = P.gold; ctx.fillRect(tx - 3, ty, 7, 1); ctx.fillRect(tx, ty - 2, 1, 5); }
    for (const pp of G.pops) E.text(ctx, pp.text, pp.x - cam, pp.y, pp.col, 1, 'center', { outline: P.black });
    ctx.restore();
    // thugs hurled at the screen (drawn in screen space, over the street)
    for (const e of G.enemies) if (e.state === 'screen') drawScreenSlam(e);
    for (const sf of G.screenFx) {
      if (sf.t < 30 || E.blink(sf.t, 4)) E.text(ctx, 'SMACK!', sf.x, sf.y - 30 - Math.min(sf.t, 6), P.gold, 2, 'center', { outline: P.black });
      if (!E.reducedMotion) for (let i = 0; i < 6; i++) { const ang = i * Math.PI / 3 + sf.t * 0.05, r = 16 + sf.t * 0.8; E.draw(ctx, ART.star, sf.x + Math.cos(ang) * r, sf.y - 10 + Math.sin(ang) * r * 0.6); }
    }
    if (E.flashOn()) { ctx.fillStyle = 'rgba(252,252,252,0.5)'; ctx.fillRect(0, 0, W, H); }
    drawHud();
    if (G.goT > 0 && E.blink(G.goT, 14)) { const nx = E.reducedMotion ? 0 : (Math.floor(G.goT / 6) % 3) * 2; E.draw(ctx, ART.goBig, W - 30 + nx, 82); }
    if (G.bannerT > 0 && G.boss) {
      ctx.fillStyle = P.black; ctx.fillRect(0, 64, W, 30); ctx.fillStyle = P.crimson; ctx.fillRect(0, 64, W, 2); ctx.fillRect(0, 92, W, 2);
      E.text(ctx, 'WANTED', W / 2, 69, P.salmon, 1, 'center'); E.text(ctx, ART.BOSSES[G.boss.key].name, W / 2, 80, P.gold, 1, 'center');
    }
    if (G.tapHintT > 0 && tapMove) E.text(ctx, 'TAP THE GROUND TO WALK', W / 2, 166, P.white, 1, 'center', { outline: P.black });
  }
  function opaqueBox(spr) { // bounding box of the non-transparent pixels of a sprite (cached)
    if (spr.ob) return spr.ob;
    const d = E.pixels(spr.src, spr.w, spr.h).data; let x0 = spr.w, y0 = spr.h, x1 = -1, y1 = -1;
    for (let y = 0; y < spr.h; y++) for (let x = 0; x < spr.w; x++) if (d[(y * spr.w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return (spr.ob = x1 < 0 ? { x: 0, y: 0, w: spr.w, h: spr.h } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
  }
  // where a thug may walk to. On touch it stays within jab reach of the cop's safe band, so a thug (or a wrench pitcher
  // keeping its distance) can never hide under the stick or buttons where the clamped cop can't reach it
  function aiX(tx, p) {
    let lo = G.cam + 16, hi = G.cam + W - 16;
    if (E.isTouch) { const b = safeBand(p.y - 42, p.y, 10); lo = Math.max(lo, G.cam + b[0] - 16); hi = Math.min(hi, G.cam + b[1] + 16); }
    return clamp(tx, lo, hi);
  }
  function slamTX(sx0) { return W / 2 + (sx0 - W / 2) * 0.25; } // aim near the middle of the screen
  // On touch, keep the whole flight inside the control-free band: the launch point and the peak are clamped so the
  // visible box never crosses the stick or buttons (the box grows linearly, so the path between stays clear too).
  // On very narrow bands the peak scale shrinks to fit. Stores e.sx0, e.stx (target x) and e.ssc (peak scale).
  const SLAM_TY = 74, SLAM_SC = 2.9;
  function slamPlan(e) {
    const fr = e.fr.hurt, ob = opaqueBox(fr), a = ob.x - fr.w / 2, bR = ob.x + ob.w - fr.w / 2; // box edges relative to x, per unit scale
    let sc = SLAM_SC, tx = slamTX(e.sx0);
    if (E.isTouch && E.ctrlRects) {
      const c0 = safeBand(e.sy0 - 20 - fr.h / 2 + ob.y, e.sy0 - 20 - fr.h / 2 + ob.y + ob.h, 0); // launch box (after the lift)
      e.sx0 = clamp(e.sx0, c0[0] + 1 - a, c0[1] - 1 - bR);
      const top = SLAM_TY - fr.h * sc / 2 + ob.y * sc, bot = top + ob.h * sc + 14; // peak box plus the fade-out slide
      const c1 = safeBand(top, bot, 0), room = c1[1] - c1[0] - 4;
      if (ob.w * sc > room) sc = Math.max(1.6, room / ob.w);
      tx = clamp(slamTX(e.sx0), c1[0] + 2 - sc * a, c1[1] - 2 - sc * bR);
      if (c1[1] - 2 - sc * bR < c1[0] + 2 - sc * a) tx = (c1[0] + c1[1]) / 2 - sc * (a + bR) / 2;
    }
    e.stx = tx; e.ssc = sc;
  }
  // Put the LIFT bubble (text top at y, box y-3..y+11 including the bob) where no touch control covers it:
  // the spot above the head if clear, otherwise the nearest clear spot sideways or above the control.
  function placeBubble(cx, y0, tw) {
    const R = E.isTouch && E.ctrlRects ? E.ctrlRects() : [], m = 3, th = 14;
    const lim = x => clamp(x, tw / 2 + 2, W - tw / 2 - 2);
    const hits = (x, y) => R.filter(r => x - tw / 2 < r.x + r.w + m && x + tw / 2 > r.x - m && y - 3 < r.y + r.h + m && y - 3 + th > r.y - m);
    const x0 = lim(cx);
    if (!hits(x0, y0).length) return [x0, y0];
    const cands = [];
    for (const r of R) {
      cands.push([lim(r.x + r.w + m + tw / 2 + 1), y0], [lim(r.x - m - tw / 2 - 1), y0]);
      cands.push([x0, r.y - m - th + 2], [x0, r.y + r.h + m + 4]);
    }
    let best = null, bd = 1e9;
    for (const c of cands) {
      if (c[1] < 26 || c[1] > H - 14 || hits(c[0], c[1]).length) continue;
      const d = Math.abs(c[0] - x0) + Math.abs(c[1] - y0) * 1.2;
      if (d < bd) { bd = d; best = c; }
    }
    return best || [x0, y0];
  }
  function drawScreenSlam(e) {
    if (e.t >= 34) { G.slamRect = null; return; } // gone before the slide reaches canvas y 90 (above the touch buttons)
    const fr = e.fr.hurt, t = Math.min(e.t, 26), k = t / 26;
    const tx = e.stx !== undefined ? e.stx : slamTX(e.sx0), ty = SLAM_TY;
    let sc = 1 + k * ((e.ssc || SLAM_SC) - 1), x = e.sx0 + (tx - e.sx0) * k, y = e.sy0 + (ty - e.sy0) * k - Math.sin(k * Math.PI) * 30 - 20 * (1 - k); // pops off the street at once (clear of the touch buttons)
    if (e.t > 26) { y += (e.t - 26) * 1.8; }
    const w = fr.w * sc, h = fr.h * sc;
    const ob = opaqueBox(fr);
    if (E.isTouch && E.ctrlRects) { // per-frame guard: keep the visible box out of the stick/button columns for the rows it covers
      const top = y - h / 2 + ob.y * sc, band = safeBand(top, top + ob.h * sc, 0), l = ob.x * sc - w / 2, r = l + ob.w * sc;
      if (band[1] - band[0] >= ob.w * sc + 2) x = clamp(x, band[0] + 1 - l, band[1] - 1 - r);
    }
    ctx.save();
    if (e.t > 26) ctx.globalAlpha = Math.max(0, 1 - (e.t - 26) / 8);
    const ox = x - w / 2 + ob.x * sc, oy = y - h / 2 + ob.y * sc; // visible pixels, for tests
    G.slamRect = { x: ox, y: oy, w: ob.w * sc, h: ob.h * sc, alpha: ctx.globalAlpha, t: e.t };
    if (e.t <= 26 && !E.reducedMotion) { ctx.translate(x, y); ctx.rotate((1 - k) * 0.6 - 0.3); ctx.drawImage(fr.img, -w / 2, -h / 2, w, h); }
    else ctx.drawImage(fr.img, x - w / 2, y - h / 2, w, h);
    ctx.restore();
  }
  function drawHud() {
    if (E.isTouch && !coop()) return drawHudSolo();
    // desktop: four player panels (empty ones say PRESS START), score + boss underneath
    const R = 248;
    hudStrip(34);
    for (let i = 0; i < MAXP; i++) {
      const p = G.players[i], x = i * 62;
      ctx.fillStyle = PCOL[i]; ctx.fillRect(x, 0, 60, 1);
      if (p && !p.out) {
        portraitFrame(p.fr.portrait, x + 1, 3, PCOL[i]);
        E.text(ctx, p.h.short, x + 22, 2, P.white, 1, 'left', { shadow: P.black });
        bar(x + 21, 11, 38, 4, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? P.salmon : PCOL[i], P.crimson);
        E.text(ctx, 'P' + (i + 1), x + 21, 17, PCOL[i]); E.text(ctx, 'x' + Math.max(0, p.lives), x + 37, 17, P.lgray);
        if (p.chainShow > 0 && p.chain >= 2) E.text(ctx, p.chain + ' HITS', x + 1, 38, PCOL[i], 1, 'left', { outline: P.black });
      } else {
        if (p && p.out) { ctx.globalAlpha = 0.4; ctx.drawImage(p.fr.portrait, x + 1, 3, 18, 18); ctx.globalAlpha = 1; }
        else E.text(ctx, 'P' + (i + 1), x + 4, 4, PCOL[i]);
        if (E.blink(G.t, 30)) { E.text(ctx, 'PRESS', x + 22, 4, P.lgray); E.text(ctx, 'START', x + 22, 13, P.lgray); }
      }
    }
    E.text(ctx, 'SCORE ' + String(G.score).padStart(7, '0'), 2, 26, P.white, 1, 'left', { outline: '#140A28' });
    if (G.boss && G.boss.hp >= 0) {
      E.text(ctx, G.boss.key.toUpperCase(), R - 72, 26, P.salmon, 1, 'right');
      bar(R - 68, 27, 66, 4, G.boss.hp / G.boss.maxHp, P.rose, P.dgray);
    }
  }
  function drawHudSolo() {
    const p = G.p, R = 248; // keep x > 250 clear for the HTML pause/sound buttons
    hudStrip(23);
    if (!p) return;
    portraitFrame(p.fr.portrait, 2, 3, P.gold);
    E.text(ctx, p.h.short, 23, 3, P.white, 1, 'left', { outline: '#140A28' });
    E.text(ctx, 'x' + Math.max(0, p.lives), 23 + E.textWidth(p.h.short) + 6, 3, P.gold);
    bar(23, 13, 84, 5, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? P.salmon : P.gold, P.crimson);
    E.text(ctx, 'SCORE ' + String(G.score).padStart(7, '0'), R, 3, P.white, 1, 'right', { outline: '#140A28' });
    if (G.boss && G.boss.hp >= 0) {
      E.text(ctx, G.boss.key.toUpperCase(), R - 90, 13, P.salmon, 1, 'right');
      bar(R - 85, 13, 84, 5, G.boss.hp / G.boss.maxHp, P.rose, P.dgray);
    }
    if (p.chainShow > 0 && p.chain >= 2) E.text(ctx, p.chain + ' HITS', 4, 28, P.gold, 2, 'left', { outline: P.black });
  }
  function renderTitle() {
    const bg = stageBg(STAGES[0]); drawBgLayers(bg, G.titleCam); drawAtmos(bg, G.titleCam);
    const sh = ctx.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(8,2,24,0.5)'); sh.addColorStop(0.5, 'rgba(8,2,24,0.06)'); sh.addColorStop(1, 'rgba(8,2,24,0.4)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
    if (!E.reducedMotion) { // two searchlights sweeping behind the logo
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [bx, ph] of [[70, 0], [250, 2.1]]) { const a = Math.sin(G.t * 0.012 + ph) * 0.55 - Math.PI / 2, gl = ctx.createLinearGradient(bx, H, bx + Math.cos(a) * 200, H + Math.sin(a) * 200);
        gl.addColorStop(0, 'rgba(200,220,255,0.22)'); gl.addColorStop(1, 'rgba(200,220,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(bx, H);
        ctx.lineTo(bx + Math.cos(a - 0.09) * 260, H + Math.sin(a - 0.09) * 260); ctx.lineTo(bx + Math.cos(a + 0.09) * 260, H + Math.sin(a + 0.09) * 260); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    E.drawLogo(ctx, E.logo('PRECINCT', 4, ['#FFFBE0', '#FFE070', '#F8A000', '#C04800', '#7C1800'], { shadow: '#5C0C20' }), W / 2, 6);
    E.drawLogo(ctx, E.logo('RUMBLE', 4, ['#FFFFFF', '#C8E8FF', '#5CA8FF', '#2048D0', '#101C78'], { shadow: '#140C48' }), W / 2, 38);
    E.text(ctx, 'THE CROOKED CROWN TAKEDOWN', W / 2, 80, P.ice, 1, 'center', { outline: P.black });
    G.titleNote = E.isTouch ? 'CO-OP ON DESKTOP WITH KEYBOARD OR CONTROLLERS' : 'UP TO 4 PLAYERS - PRESS START TO JOIN';
    E.text(ctx, G.titleNote, W / 2, 93, P.mint, 1, 'center', { outline: P.black });
    if (G.howto) return renderHowto();
    const items = ['START GAME', 'HOW TO PLAY'];
    E.panel(ctx, W / 2 - 62, 115, 124, 30, { rim: '#C89C30' });
    items.forEach((s, i) => { const y = 121 + i * 13, on = G.menu === i; E.text(ctx, (on ? '> ' : '  ') + s + (on ? ' <' : '  '), W / 2, y, on ? P.gold : P.lgray, 1, 'center', { outline: P.black }); });
    for (let i = 0; i < 4; i++) E.draw(ctx, ART.hero[i]['idle' + (Math.floor(G.t / 12) % 4)], 30 + i * 18 + (i > 1 ? 210 : 0), 172, i > 1);
    if (E.blink(G.t, 30)) E.text(ctx, E.isTouch ? 'TAP TO START' : 'PRESS ENTER', W / 2, 152, P.white, 1, 'center', { outline: P.black });
    E.text(ctx, 'HI ' + String(E.hiScore()).padStart(7, '0'), W / 2, 164, P.lgray, 1, 'center', { outline: P.black });
  }
  function renderHowto() {
    E.panel(ctx, 8, 100, W - 16, 77, { rim: '#5CA8FF' });
    const lines = E.isTouch ? ['STICK: MOVE (OR TAP-TO-MOVE IN PAUSE MENU)', 'ATK: COMBO, LIFT + THROW OBJECTS  JUMP: JUMP', 'SPL: SPECIAL (COSTS A LITTLE HEALTH)', 'FLICK THE STICK SIDEWAYS TWICE TO DASH', 'GRAB: WALK INTO A THUG. UP/DOWN + ATK = SLAM', 'CO-OP ON DESKTOP WITH KEYBOARD OR CONTROLLERS']
      : ['P1: WASD + J ATTACK, K JUMP, L SPECIAL', 'P2: ARROWS + NUM 1/2/3 OR , . /', 'P3/P4: CONTROLLERS. START JOINS ANY TIME', 'DASH: DOUBLE-TAP OR L-SHIFT / NUM 0', 'GRAB A THUG: UP/DOWN + ATTACK = SCREEN SLAM', 'STAND ON A CONE, LID, CRATE: ATTACK = LIFT'];
    lines.forEach((l, i) => E.text(ctx, l, W / 2, 104 + i * 11, i === 5 ? P.gold : P.white, 1, 'center'));
  }
  function renderSelect() {
    const bgr = ctx.createLinearGradient(0, 0, 0, H); bgr.addColorStop(0, '#2A1060'); bgr.addColorStop(0.6, '#0E0630'); bgr.addColorStop(1, '#04020E'); ctx.fillStyle = bgr; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#8CA8FF'; const off = E.reducedMotion ? 0 : (G.t * 0.4) % 24;
    for (let x = -H; x < W + H; x += 24) { ctx.beginPath(); ctx.moveTo(x + off, 0); ctx.lineTo(x + off + 10, 0); ctx.lineTo(x + off + 10 - H, H); ctx.lineTo(x + off - H, H); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    E.drawLogo(ctx, E.logo('CHOOSE YOUR OFFICER', 1, ['#FFFBE0', '#FFD040', '#E07000']), W / 2, 2);
    for (let i = 0; i < 4; i++) {
      const h = ART.HEROES[i], x = i * 80 + 4;
      const here = G.picks.filter(k => k && k.cur === i), owner = here.find(k => k.ready), on = here.length > 0;
      const bc = owner ? PCOL[owner.slot] : on ? (E.blink(G.t, 10) ? PCOL[here[0].slot] : P.cream) : '#6C6C8C';
      E.panel(ctx, x + 1, 19, 70, 106, { rim: bc, top: owner ? 'rgba(24,70,40,0.95)' : on ? 'rgba(60,44,130,0.95)' : 'rgba(26,18,56,0.95)', bot: 'rgba(6,4,18,0.95)' });
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sp = ctx.createRadialGradient(x + 36, 80, 2, x + 36, 80, 34); sp.addColorStop(0, 'rgba(255,230,160,0.35)'); sp.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = sp; ctx.fillRect(x + 2, 40, 68, 50); ctx.restore(); }
      E.text(ctx, h.short, x + 36, 23, on ? P.gold : P.white, 1, 'center');
      ctx.drawImage(ART.shadow, x + 22, 77, 28, 8);
      const fr = owner ? ART.hero[i].win : on ? ART.hero[i]['walk' + (Math.floor(G.t / 5) % 6)] : ART.hero[i]['idle' + (Math.floor(G.t / 12) % 4)];
      E.draw(ctx, fr, x + 36, 81);
      if (i === 2) E.draw(ctx, ART.dog[on ? Math.floor(G.t / 4) % 4 : 0], x + 58, 81);
      here.forEach((k, n) => E.text(ctx, 'P' + (k.slot + 1) + (k.ready ? ' OK' : ''), x + 5 + (n % 2) * 34, 32 + Math.floor(n / 2) * 10, PCOL[k.slot], 1, 'left', { outline: P.black }));
      ['SPD', 'PWR', 'HP '].forEach((lab, k) => { E.text(ctx, lab, x + 6, 90 + k * 10, P.lgray); for (let n = 0; n < 5; n++) bar(x + 28 + n * 8, 91 + k * 10, 6, 5, n < h.bars[k] ? 1 : 0, P.gold, P.dgray); });
    }
    const k0 = G.picks[0], h = ART.HEROES[k0 ? k0.cur : 0];
    E.text(ctx, h.name + '  -  ' + h.special, W / 2, 131, P.white, 1, 'center');
    if (E.isTouch) {
      E.wrapText(h.blurb, 50).forEach((l, i) => E.text(ctx, l, W / 2, 142 + i * 9, P.ice, 1, 'center'));
      if (E.blink(G.t, 30)) E.text(ctx, 'TAP AGAIN TO CONFIRM', W / 2, 166, P.lgray, 1, 'center');
      return;
    }
    const n = G.picks.filter(Boolean).length;
    E.text(ctx, 'ATTACK: CONFIRM   SPECIAL: BACK', W / 2, 142, P.ice, 1, 'center');
    if (n < MAXP && E.blink(G.t, 40)) {
      E.text(ctx, G.picks[1] ? 'MORE PLAYERS: PRESS START ON A CONTROLLER' : 'P2: RIGHT SHIFT OR NUM ENTER TO JOIN', W / 2, 154, P.gold, 1, 'center');
      E.text(ctx, G.picks[1] ? '' : 'P3 / P4: PRESS START ON A CONTROLLER', W / 2, 165, P.gold, 1, 'center');
    }
    if (G.readyT > 0) E.text(ctx, 'GET READY!', W / 2, 165, P.white, 1, 'center', { outline: P.black });
  }
  function renderIntro() {
    ctx.fillStyle = P.black; ctx.fillRect(0, 0, W, H);
    const S = G.S;
    E.text(ctx, S.card, W / 2, 30, P.gold, 2, 'center');
    E.text(ctx, S.name, W / 2, 54, P.white, 2, 'center', { shadow: P.royal });
    S.intro.forEach((l, i) => E.text(ctx, l, W / 2, 88 + i * 12, P.ice, 1, 'center'));
    joined().forEach((p, k) => { const fr = p.fr['walk' + (Math.floor((G.t + k * 3) / 5) % 6)]; E.draw(ctx, fr, 40 + Math.min(G.t, 120) * 2 - k * 22, 160 + (k % 2) * 6); });
    if (E.blink(G.t, 20)) E.text(ctx, 'GET READY', W / 2, 136, P.gold, 1, 'center');
  }
  function renderClear() {
    renderPlay();
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 50, W, 70);
    E.text(ctx, 'STAGE CLEAR!', W / 2, 58, P.gold, 2, 'center', { outline: P.black });
    E.text(ctx, 'HEALTH BONUS  ' + G.bonusShown, W / 2, 84, P.white, 1, 'center');
    E.text(ctx, 'SCORE  ' + G.score, W / 2, 98, P.white, 1, 'center');
    E.text(ctx, 'BEST COMBO ' + G.stats.bestChain + ' HITS', W / 2, 110, P.ice, 1, 'center');
  }
  function renderContinue() {
    renderPlay();
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
    const left = Math.max(0, CFG.continueSeconds - Math.floor(G.t / 60));
    E.text(ctx, 'CONTINUE?', W / 2, 40, P.gold, 3, 'center', { outline: P.black });
    E.text(ctx, String(left), W / 2, 74, P.white, 4, 'center');
    E.text(ctx, (G.contSel === 0 ? '> ' : '  ') + 'YES', W / 4, 126, G.contSel === 0 ? P.gold : P.lgray, 2, 'center');
    E.text(ctx, (G.contSel === 1 ? '> ' : '  ') + 'NO', W * 3 / 4, 126, G.contSel === 1 ? P.gold : P.lgray, 2, 'center');
    E.text(ctx, 'FREE CONTINUE - YOUR SCORE IS KEPT', W / 2, 156, P.ice, 1, 'center');
  }
  function renderGameOver() {
    ctx.fillStyle = P.black; ctx.fillRect(0, 0, W, H);
    E.text(ctx, 'GAME OVER', W / 2, 50, P.salmon, 3, 'center');
    E.text(ctx, 'FINAL SCORE ' + G.score, W / 2, 96, P.white, 1, 'center');
    E.text(ctx, 'PUZZLE POINTS +' + Math.floor(G.score / 100), W / 2, 110, P.gold, 1, 'center');
    E.text(ctx, 'THE CROWN WILL BE BACK. SO WILL YOU.', W / 2, 134, P.ice, 1, 'center');
  }
  function renderVictory() {
    const bg = stageBg(STAGES[2]); drawBgLayers(bg, 200);
    ctx.fillStyle = 'rgba(252,152,56,0.25)'; ctx.fillRect(0, 0, W, 100);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
    E.text(ctx, 'CASE CLOSED!', W / 2, 14, P.gold, 3, 'center', { outline: P.black, shadow: P.rust });
    ['THE CROOKED CROWN IS BEHIND BARS.', 'MULBERRY AVENUE SLEEPS EASY TONIGHT.', 'THANKS FOR WALKING THE BEAT, OFFICER' + (joined().length > 1 ? 'S.' : '.')].forEach((l, i) => E.text(ctx, l, W / 2, 46 + i * 11, P.white, 1, 'center', { outline: P.black }));
    const team = joined(); const list = team.length ? team : [newPlayer(0, 0)];
    list.forEach((p, k) => E.draw(ctx, p.fr.win, 120 - k * 26, 160 + (k % 2) * 6));
    const duke = ART.boss.duke; E.draw(ctx, duke.hurt, 196, 160, true); E.draw(ctx, ART.cuffs, 194, 138);
    E.text(ctx, 'FINAL SCORE ' + G.score, W / 2, 88, P.gold, 1, 'center', { outline: P.black });
    E.text(ctx, 'PUZZLE POINTS +' + Math.floor(G.score / 100), W / 2, 100, P.mint, 1, 'center', { outline: P.black });
    if (G.t > 120 && E.blink(G.t, 30)) E.text(ctx, E.isTouch ? 'TAP FOR TITLE' : 'PRESS ENTER', W / 2, 170, P.white, 1, 'center', { outline: P.black });
  }
  function render() {
    ctx.imageSmoothingEnabled = false;
    switch (G.state) {
      case 'title': renderTitle(); break;
      case 'select': renderSelect(); break;
      case 'intro': renderIntro(); break;
      case 'play': renderPlay(); break;
      case 'clear': renderClear(); break;
      case 'continue': renderContinue(); break;
      case 'gameover': renderGameOver(); break;
      case 'victory': renderVictory(); break;
    }
  }

  // ---------------------------------------------------------------- debug hooks (used by tests/smoke.py)
  const COOP_DEVS = ['kb1', 'kb2', 'pad0', 'pad1'];
  G.debug = {
    start(stage, hero, boss, n) {
      const picks = [{ hi: hero || 0, devs: ['kb1', 'touch'] }];
      for (let i = 1; i < (n || 1); i++) picks.push({ hi: ((hero || 0) + i) % 4, devs: [COOP_DEVS[i]] });
      newGame(picks, stage || 0); startPlay();
      if (boss) { G.wave = G.S.waves.length; G.cam = G.maxCam; joined().forEach((p, k) => { p.x = G.cam + 70 + k * 14; }); }
    },
    clearWave() { for (const e of G.enemies) { e.hp = 0; e.ko = true; knock(e, 1, 1); } G.spawnQ = []; },
    defeatBoss() { if (G.boss) { G.boss.hp = 1; hitEnemy(G.boss, 5, true, 1, 2); } },
    win() { victory(); }, lose() { for (const p of active()) { p.lives = 1; p.hp = 0; playerDied(p); } },
    spawnEnemy(type, side, sx) { const e = spawnEnemy(type, side || 'R', sx); return G.enemies.indexOf(e); },
    placeEnemy(type, x, y) { const e = newEnemy(type, x, y); e.state = 'idle'; e.cool = 200; G.enemies.push(e); return G.enemies.length - 1; },
    addLoose(kind, x, y) { G.loose.push({ kind, x, y, t: 0 }); },
    freeze(on) { G.frozen = !!on; },
    carry(i, kind) { const e = G.enemies[i]; if (e) { e.hold = kind; e.cool = 0; } },
    kill(slot) { const p = G.players[slot]; if (p && !p.out) { p.lives = 1; p.hp = 0; playerDied(p); } return G.state; },
    join(dev) { const p = dropIn(dev); return p ? p.slot : -1; },
    songs: Object.keys(SONGS)
  };
  const qs = parseInt(prm.get('stage') || (prm.get('autostart') === '1' ? '1' : '0'), 10);
  if (qs >= 1 && qs <= STAGES.length) {
    const hero = clamp(parseInt(prm.get('char') || '0', 10) || 0, 0, 3), n = clamp(parseInt(prm.get('coop') || '1', 10) || 1, 1, 4);
    newGame(hero, qs - 1);
    if (prm.get('autostart') === '1' || prm.get('boss') === '1') G.debug.start(qs - 1, hero, prm.get('boss') === '1', n);
  } else toTitle();
  E.start(update, render);
})();
