/* Skyline Siege: game logic. Original NES-style run-and-gun. */
(function () {
  'use strict';
  const E = window.RetroEngine, P = E.P, I = E.input, A = E.audio;
  const ART = window.SS_ART, BGS = window.SS_BG, CFG = window.SS_CONFIG, STAGES = window.SS_STAGES;
  E.init('skyline-siege');
  ART.build(); ART.buildBosses();
  const ctx = E.ctx, W = E.W, H = E.H, TS = 16;
  const prm = E.params, GOD = prm.get('god') === '1';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rand = (a, b) => a + Math.random() * (b - a);
  const sgn = v => v < 0 ? -1 : v > 0 ? 1 : 0;
  const B = ART.bossArt;

  // ---------------------------------------------------------------- music (all original)
  const SONGS = {
    title: A.compose({ bpm: 116, chords: ['Em', 'C', 'G', 'D'], bass: 'octave', drums: 'k.....s.k.k...s.', leadWave: 'p50', lead: 'B4:4 E5:4 G5:4 F#5:2 E5:2 E5:4 G5:2 C6:6 B5:2 A5:2 B5:4 D6:4 B5:2 G5:2 D5:4 F#5:4 A5:4 D6:8' }),
    docks: A.compose({ bpm: 144, chords: ['Gm', 'D#', 'F', 'D'], bass: 'octave', drums: 'k.h.s.hkk.h.s.h.', lead: 'G4:2 A#4:2 D5:2 G5:4 F5:2 D5:2 A#4:2 D#5:4 D5:2 C5:2 A#4:4 G4:4 F4:2 A4:2 C5:2 F5:4 D#5:2 D5:2 C5:2 D5:6 F#5:2 A5:4 r:4' }),
    train: A.compose({ bpm: 172, chords: ['Am', 'Am', 'F', 'G'], bass: 'drive', drums: 'k.hkk.hsk.hkk.hs', lead: 'A5:1 r:1 A5:1 r:1 E5:2 A5:2 C6:2 B5:2 A5:2 G5:2 E5:4 A4:2 B4:2 C5:4 D5:4 F5:2 E5:2 F5:2 A5:2 C6:4 A5:4 G5:4 B5:4 D6:4 B5:4' }),
    tower: A.compose({ bpm: 132, chords: ['Bm', 'G', 'A', 'F#'], bass: 'walk', drums: 'k...s.h.k.k.s.h.', lead: 'B4:2 D5:2 F#5:4 B5:2 A5:2 F#5:4 G5:4 F#5:2 E5:2 D5:4 B4:4 A4:2 C#5:2 E5:2 A5:4 G5:2 F#5:2 E5:2 F#5:6 A#5:2 C#6:4 r:4' }),
    boss: A.compose({ bpm: 176, chords: ['Cm', 'C#', 'Cm', 'G'], bass: 'drive', drums: 'kkhskkhskkhskshs', lead: 'C5:1 C5:1 D#5:2 G5:2 C6:2 G5:2 D#5:2 C5:4 C#5:2 F5:2 G#5:2 C#6:4 G#5:2 F5:4 D#5:2 G5:2 C6:2 D#6:4 D6:2 C6:4 B5:4 G5:4 D5:4 B4:4' }),
    victory: A.compose({ bpm: 140, chords: ['D', 'A', 'Bm', 'G'], bass: 'march', drums: 'k.h.s.h.k.h.s.hh', arpUp: true, lead: 'D5:2 F#5:2 A5:4 D6:4 A5:4 C#6:4 A5:2 E5:2 A5:8 B5:2 D6:2 F#6:4 E6:2 D6:2 B5:4 G5:4 B5:2 D6:2 A5:8' }),
    clear: A.compile({ bpm: 150, loop: false, channels: [{ wave: 'p25', vol: 0.12, notes: 'G5:2 B5:2 D6:2 G6:6 D6:2 G6:10' }, { wave: 'tri', vol: 0.2, notes: 'G2:8 D2:8 G2:8' }] }),
    over: A.compile({ bpm: 100, loop: false, channels: [{ wave: 'p25', vol: 0.12, notes: 'E5:4 D5:4 C5:4 B4:12' }, { wave: 'tri', vol: 0.2, notes: 'E2:8 C2:8 B1:8' }] })
  };

  // ---------------------------------------------------------------- settings
  let autoFire = !!E.store.get('ss_autofire', false);
  function setAuto(v) {
    autoFire = !!v; E.store.set('ss_autofire', autoFire);
    document.querySelectorAll('.auto-toggle').forEach(b => { b.setAttribute('aria-pressed', autoFire ? 'true' : 'false'); b.textContent = autoFire ? 'AUTO ON' : 'AUTO OFF'; });
    E.refreshMenu && E.refreshMenu();
  }
  document.querySelectorAll('.auto-toggle').forEach(b => {
    const flip = e => { e.preventDefault(); e.stopPropagation(); setAuto(!autoFire); A.fx('select'); b.blur(); };
    if (b.tagName === 'BUTTON') E.onTap(b, flip); else b.addEventListener('pointerdown', flip);
  });
  setAuto(autoFire);
  const G = window.__GAME = { state: 'title', t: 0, menu: 0, stage: 0, score: 0, lives: CFG.lives, nextLife: CFG.extraLifeEvery, continues: 0,
    cam: 0, enemies: [], pb: [], eb: [], fx: [], pops: [], pickups: [], hazards: [], boss: null, p: null, contSel: 0, shotsFired: 0 };
  G.autoFire = () => autoFire;
  E.setupChrome({ toggles: [{ key: 'autofire', label: 'Auto-fire', get: () => autoFire, set: setAuto }], actions: [{ key: 'quit', label: 'Quit to title', fn: () => toTitle() }] });
  E.canPause = () => G.state === 'play' || G.state === 'intro' || G.state === 'clear';

  // ---------------------------------------------------------------- level
  function buildMap(S) {
    const rows = []; for (let r = 0; r < 12; r++) rows.push('');
    for (const sec of S.sections) { const w = Math.max.apply(null, sec.map(s => s.length)); for (let r = 0; r < 12; r++) rows[r] += (sec[r] || '').padEnd(w, '.'); }
    const ents = [], arenas = [], checks = [];
    const grid = rows.map((row, r) => row.split('').map((ch, c) => {
      if ('#[=~.'.includes(ch)) return ch;
      const right = row[c + 1] && '#[=~.'.includes(row[c + 1]) ? row[c + 1] : '.';
      if (ch === 'M' || ch === 'E') { arenas.push({ kind: ch === 'M' ? 'mid' : 'end', x: c * TS, done: false }); return right; }
      if (ch === 'k') { checks.push(c * TS + 8); return '.'; }
      ents.push({ ch, c, r, x: c * TS + 8, y: (r + 1) * TS, spawned: false }); return '.';
    }));
    ents.sort((a, b) => a.x - b.x); arenas.sort((a, b) => a.x - b.x);
    return { grid, cols: rows[0].length, ents, arenas, checks, rows: grid.map(r => r.join('')) };
  }
  const tile = (c, r) => (r < 0 || r >= 12) ? '.' : (c < 0 || c >= G.map.cols) ? '#' : G.map.grid[r][c];
  const solidCh = ch => ch === '#' || ch === '[';
  const solidPx = (x, y) => solidCh(tile(Math.floor(x / TS), Math.floor(y / TS)));
  function groundBelow(x, y) { // first standable surface at or below y
    const c = Math.floor(x / TS);
    for (let r = Math.max(0, Math.floor(y / TS)); r < 12; r++) { const ch = tile(c, r); if (solidCh(ch) || ch === '=') return r * TS; }
    return null;
  }

  // ---------------------------------------------------------------- flow
  const layerCache = {};
  function toTitle() { G.state = 'title'; G.t = 0; G.menu = 0; G.howto = false; A.music(SONGS.title); }
  function newGame(stageIdx) { G.score = 0; G.lives = CFG.lives; G.nextLife = CFG.extraLifeEvery; G.continues = 0; loadStage(stageIdx || 0); }
  function loadStage(i) {
    const S = G.S = STAGES[i]; G.stage = i;
    G.map = buildMap(S); G.tiles = BGS.tiles(G.map.rows, S.theme);
    if (!layerCache[S.theme]) layerCache[S.theme] = BGS.layers(S.theme); G.layers = layerCache[S.theme];
    G.mapW = G.map.cols * TS; G.cam = 0; G.enemies = []; G.pb = []; G.eb = []; G.fx = []; G.pops = []; G.pickups = []; G.hazards = []; G.boss = null; G.arena = null;
    G.p = newPlayer(48); G.checkpoint = 48;
    G.state = 'intro'; G.t = 0; A.stop(); A.music(null);
  }
  function startPlay() { G.state = 'play'; G.t = 0; A.music(SONGS[G.S.music]); }
  function newPlayer(x) {
    const gy = groundBelow(x, 40);
    return { x, y: gy === null ? 40 : Math.max(40, gy - 48), vx: 0, vy: 0, face: 1, onGround: false, state: 'normal', crouchT: 0, crouch: false, prone: false, aim: [1, 0], jumping: false,
      inv: CFG.respawnIframes, weapon: 'P', fireCD: 0, bangs: CFG.flashbangs, dropT: 0, deadT: 0, runT: 0, frame: 'stand_f' };
  }
  function addScore(n) { G.score += n; if (G.score >= G.nextLife) { G.lives++; G.nextLife += CFG.extraLifeEvery; A.fx('oneup'); pop(G.p.x, G.p.y - 34, '1UP', P.mint); } }
  function pop(x, y, text, col) { G.pops.push({ x, y, text, col: col || P.white, t: 0 }); }
  function boom(x, y, big) { G.fx.push({ k: 'boom', x, y, t: 0, life: 16 }); A.fx(big ? 'bigboom' : 'explode'); if (big) E.shake(3, 10); }
  function stageClear() {
    G.state = 'clear'; G.t = 0; G.bonus = G.lives * 1000; G.bonusShown = 0; G.p.state = 'win';
    A.music(SONGS.clear); E.reportScore({ score: G.score, event: 'stage_clear', stage: G.stage + 1 });
  }
  function victory() { G.state = 'victory'; G.t = 0; A.music(SONGS.victory); E.reportScore({ score: G.score, event: 'victory', stage: STAGES.length, continues: G.continues }); }
  function gameOver() { G.state = 'gameover'; G.t = 0; A.music(SONGS.over); E.reportScore({ score: G.score, event: 'game_over', stage: G.stage + 1 }); }

  // ---------------------------------------------------------------- player
  function pbox(p) {
    if (p.prone) return [p.x - 10, p.y - 7, p.x + 10, p.y];
    if (p.crouch) return [p.x - 4, p.y - 14, p.x + 4, p.y];
    if (p.jumping) return [p.x - 5, p.y - 18, p.x + 5, p.y - 4];
    return [p.x - 4, p.y - 22, p.x + 4, p.y];
  }
  function moveX(o, dx, hw, hh) {
    if (!dx) return false;
    o.x += dx; const edge = o.x + sgn(dx) * hw;
    for (let yy = o.y - hh; yy < o.y - 1; yy += 6) if (solidPx(edge, yy)) { o.x = sgn(dx) > 0 ? Math.floor(edge / TS) * TS - hw - 0.01 : (Math.floor(edge / TS) + 1) * TS + hw + 0.01; return true; }
    if (solidPx(edge, o.y - 2)) { o.x -= dx; return true; }
    return false;
  }
  function moveY(o, hw, hh, allowOneWay) {
    const prevY = o.y; o.y += o.vy; o.onGround = false;
    if (o.vy >= 0) {
      for (const xx of [o.x - hw + 1, o.x + hw - 1]) {
        const c = Math.floor(xx / TS), r = Math.floor(o.y / TS), ch = tile(c, r), top = r * TS;
        if (solidCh(ch) || (allowOneWay && ch === '=' && prevY <= top + 0.5)) { o.y = top; o.vy = 0; o.onGround = true; return; }
      }
    } else {
      for (const xx of [o.x - hw + 1, o.x + hw - 1]) if (solidPx(xx, o.y - hh)) { o.y = (Math.floor((o.y - hh) / TS) + 1) * TS + hh; o.vy = 0; return; }
    }
  }
  function onOneWay(p) { return tile(Math.floor(p.x / TS), Math.floor(p.y / TS)) === '='; }
  function killPlayer() {
    const p = G.p; if (GOD || p.inv > 0 || p.state !== 'normal') return;
    p.state = 'dead'; p.deadT = 0; p.vx = -p.face * 1.2; p.vy = -3.6; p.weapon = 'P'; A.fx('die'); E.shake(2, 8);
    pop(p.x, p.y - 30, 'OUCH!', P.salmon);
  }
  function respawn() {
    const p = G.p;
    let x = G.cam + 40, found = null;
    for (let k = 0; k < 16 && found === null; k++) { const xx = G.cam + 32 + k * 12; if (groundBelow(xx, 40) !== null) { found = xx; } }
    x = found || G.cam + 40;
    Object.assign(p, newPlayer(x)); G.eb = [];
  }
  function fire(p) {
    const w = CFG.weapons[p.weapon];
    if (G.pb.filter(b => b.owner === p.weapon).length >= w.max) return;
    let [ax, ay] = p.aim; const m = Math.hypot(ax, ay) || 1; ax /= m; ay /= m;
    let mx, my;
    if (p.prone) { mx = p.x + p.face * 13; my = p.y - 3; }
    else if (p.crouch) { mx = p.x + p.face * 10; my = p.y - 9; }
    else if (p.jumping) { mx = p.x + ax * 9; my = p.y - 12 + ay * 9; }
    else if (ay < 0 && ax === 0) { mx = p.x + p.face * 2; my = p.y - 28; }
    else if (ay < 0) { mx = p.x + ax * 9; my = p.y - 23; }
    else if (ay > 0) { mx = p.x + ax * 9; my = p.y - 9; }
    else { mx = p.x + p.face * 11; my = p.y - 15; }
    const shot = (ang, extra) => { const s = w.speed; G.pb.push(Object.assign({ x: mx, y: my, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s, dmg: w.dmg, kind: p.weapon, owner: p.weapon, life: 90, hits: new Set() }, extra || {})); };
    const base = Math.atan2(ay, ax);
    if (p.weapon === 'S') { for (const d of [-0.32, -0.16, 0, 0.16, 0.32]) shot(base + d); A.fx('spread'); }
    else if (p.weapon === 'R') { shot(base + rand(-0.04, 0.04)); A.fx('rapid'); }
    else if (p.weapon === 'L') { shot(base, { len: 22, pierce: true, life: 60 }); A.fx('laser'); }
    else if (p.weapon === 'B') { shot(base, { bounces: 3, life: 150 }); A.fx('bounce'); }
    else { shot(base); A.fx('shoot'); }
    p.fireCD = w.rate; G.shotsFired++;
  }
  function flashbang() {
    const p = G.p; p.bangs--; A.fx('special'); E.flash(6); E.shake(3, 10);
    G.eb = []; G.bangT = E.reducedMotion ? 0 : 6;
    for (const e of G.enemies) if (onScreen(e.x, e.y) && !e.dead) hurtEnemy(e, 4);
    if (G.boss) for (const part of G.boss.parts) if (part.hp > 0 && part.vuln()) damagePart(part, 4);
    pop(p.x, p.y - 34, 'FLASH-BANG!', P.ice);
  }
  function updatePlayer() {
    const p = G.p, C = CFG.player;
    if (p.state === 'dead') {
      p.deadT++; p.x += p.vx; p.vy += C.gravity; p.y += p.vy; p.frame = 'down';
      if (p.deadT > 80) { G.lives--; if (G.lives > 0) respawn(); else { G.state = 'continue'; G.t = 0; G.contSel = 0; A.music(null); A.stop(); } }
      return;
    }
    if (p.state === 'win') { p.frame = 'win'; p.vy += C.gravity; moveY(p, 4, 22, true); return; }
    if (p.inv > 0) p.inv--; if (p.fireCD > 0) p.fireCD--; if (p.dropT > 0) p.dropT--;
    const L = I.held.left, R = I.held.right, U = I.held.up, D = I.held.down;
    const h = R && !L ? 1 : L && !R ? -1 : 0;
    if (h) p.face = h;
    let crouch = false, prone = false;
    if (p.onGround && D && !h) { p.crouchT++; crouch = true; if (p.crouchT > 18) prone = true; } else p.crouchT = 0;
    p.vx = crouch ? 0 : h * C.speed;
    if (I.pressed.b && p.onGround) {
      if (D && onOneWay(p)) { p.dropT = 14; p.onGround = false; p.y += 2; }
      else { p.vy = -C.jump; p.onGround = false; p.jumping = true; crouch = prone = false; A.fx('jump'); }
    }
    moveX(p, p.vx, 4, 20);
    p.vy = Math.min(p.vy + C.gravity, C.maxFall);
    moveY(p, 4, crouch ? 14 : 22, p.dropT <= 0);
    if (p.onGround) p.jumping = false;
    let ax, ay;
    if (U && h) { ax = h; ay = -1; } else if (U) { ax = 0; ay = -1; } else if (D && h) { ax = h; ay = 1; } else if (D && !p.onGround) { ax = 0; ay = 1; } else { ax = p.face; ay = 0; }
    if (crouch) { ax = p.face; ay = 0; }
    p.aim = [ax, ay]; p.crouch = crouch; p.prone = prone;
    const w = CFG.weapons[p.weapon];
    const wantFire = autoFire || (p.weapon === 'R' && I.held.a);
    if ((I.pressed.a && p.fireCD <= Math.floor(w.rate * 0.4)) || (wantFire && p.fireCD <= 0)) fire(p);
    if (I.pressed.c && p.bangs > 0) flashbang();
    p.x = clamp(p.x, G.cam + 6, Math.min(G.cam + W - 6, G.mapW - 6));
    if (G.arenaWall && p.x > G.arenaWall) p.x = G.arenaWall;
    if (p.y > 200) { if (GOD) { const wpn = p.weapon; respawn(); G.p.weapon = wpn; return; } p.inv = 0; killPlayer(); }
    // pose
    if (p.onGround && h) p.runT++;
    const a = ay < 0 ? (ax ? 'uf' : 'u') : ay > 0 ? (ax ? 'df' : 'd') : 'f';
    if (p.jumping) p.frame = 'tuck' + (Math.floor(G.t / 4) % 4);
    else if (!p.onGround && a === 'd') p.frame = 'air_d';
    else if (prone) p.frame = 'prone';
    else if (crouch) p.frame = 'crouch';
    else if (p.onGround && h && a !== 'u') p.frame = 'run' + (Math.floor(p.runT / 6) % 4) + '_' + (a === 'd' ? 'df' : a);
    else p.frame = 'stand_' + (a === 'd' ? 'f' : a);
  }

  // ---------------------------------------------------------------- enemies
  const onScreen = (x, y) => x > G.cam - 16 && x < G.cam + W + 16 && y > -16 && y < H + 24;
  function aimAt(x, y, speed, spread) {
    const p = G.p; let ang = Math.atan2((p.y - 14) - y, p.x - x);
    ang = Math.round(ang / (Math.PI / 8)) * (Math.PI / 8) + (spread || 0);
    return [Math.cos(ang) * speed, Math.sin(ang) * speed];
  }
  function eshot(x, y, vx, vy, opt) { G.eb.push(Object.assign({ x, y, vx, vy, g: 0, r: 2, spr: 'ebullet', life: 300 }, opt || {})); A.fx('eshoot'); }
  function spawnEnt(en) {
    const C = CFG.enemies, x = en.x, y = en.y;
    const mk = (type, o) => { const e = Object.assign({ type, x, y, vx: 0, vy: 0, hp: 1, flash: 0, t: 0, dead: false, face: -1, w: 8, h: 22, onGround: false, cd: rand(30, 80) }, o); G.enemies.push(e); return e; };
    switch (en.ch) {
      case 'r': mk('runSpawner', { hp: 0, count: 3, cd: 0, invisible: true }); break;
      case 'g': mk('gunner', { hp: C.gunner.hp, aim: 'f' }); break;
      case 'n': mk('sniper', { hp: C.sniper.hp, w: 10, h: 18, up: false }); break;
      case 't': mk('turret', { hp: C.turret.hp, dir: 4, w: 16, h: 16, y: y - 8, fixed: true }); break;
      case 'c': mk('cannon', { hp: C.cannon.hp, w: 20, h: 14, fixed: true }); break;
      case 'b': mk('grenadier', { hp: C.grenadier.hp }); break;
      case 'd': for (let k = 0; k < 3; k++) mk('drone', { hp: C.drone.hp, x: G.cam + W + 16 + k * 26, y: y - 8, baseY: y - 8, w: 16, h: 8, phase: k * 1.3, fly: true }); break;
      case 'S': case 'R': case 'L': case 'B': mk('supply', { hp: 1, carry: en.ch, x: G.cam + W + 12, y: Math.max(20, y - 8), baseY: Math.max(20, y - 8), w: 16, h: 10, fly: true }); break;
      case 'v': G.hazards.push({ type: 'vent', x, y, t: Math.floor(Math.random() * 60) }); break;
      case 'x': { let top = en.r, bot = en.r; while (top > 0 && !solidCh(tile(en.c, top - 1))) top--; while (bot < 11 && !solidCh(tile(en.c, bot + 1))) bot++; G.hazards.push({ type: 'laser', x, y0: top * TS, y1: (bot + 1) * TS, t: Math.floor(Math.random() * 50) }); break; }
      case 'h': G.hazards.push({ type: 'beamSpawner', x, y, t: 60, left: 3 }); break;
    }
  }
  function hurtEnemy(e, dmg) {
    if (e.dead || e.hp <= 0) return;
    if (e.type === 'sniper' && !e.up) return;
    e.hp -= dmg; e.flash = 6; A.fx('ehit');
    if (e.hp <= 0) killEnemy(e);
  }
  function killEnemy(e) {
    e.dead = true;
    const sc = { gunner: 'gunner', sniper: 'sniper', turret: 'turret', cannon: 'cannon', grenadier: 'grenadier', drone: 'drone', runner: 'runner', supply: null }[e.type];
    if (sc) addScore(CFG.enemies[sc].score);
    if (e.fixed || e.fly) boom(e.x, e.y - (e.fly ? 0 : 6), e.type === 'cannon');
    else { G.fx.push({ k: 'ko', x: e.x, y: e.y, t: 0, life: 40, spr: ART.enemy[e.type === 'sniper' ? 'gunner' : e.type].down, face: e.face }); A.fx('cuff'); }
    if (e.type === 'supply') { G.pickups.push({ k: e.carry, x: e.x, y: e.y, vx: 0.6, vy: -2.5, t: 0 }); A.fx('pickup'); }
  }
  function updateEnemy(e) {
    const p = G.p, C = CFG.enemies; e.t++; if (e.flash > 0) e.flash--; if (e.cd > 0) e.cd--;
    const dx = p.x - e.x;
    switch (e.type) {
      case 'runSpawner':
        if (e.cd <= 0 && e.count > 0 && G.boss === null) {
          e.count--; e.cd = 50;
          const sx = G.cam + W + 8;
          G.enemies.push({ type: 'runner', x: sx, y: e.y - 2, vx: 0, vy: 0, hp: C.runner.hp, flash: 0, t: 0, dead: false, face: -1, w: 8, h: 22, onGround: false, cd: 0 });
        }
        if (e.count <= 0) e.dead = true;
        break;
      case 'runner': {
        if (e.t === 1) e.face = sgn(dx) || -1;
        e.vx = e.face * C.runner.speed;
        const hit = moveX(e, e.vx, 4, 20); if (hit && e.onGround) e.vy = -4;
        e.vy = Math.min(e.vy + 0.25, 5); moveY(e, 4, 22, true);
        if (e.y > 210) e.dead = true;
        break;
      }
      case 'gunner': case 'grenadier': {
        e.face = sgn(dx) || e.face;
        e.vy = Math.min(e.vy + 0.25, 5); moveY(e, 4, 22, true);
        if (!onScreen(e.x, e.y)) break;
        if (e.type === 'gunner') {
          const ang = Math.atan2((p.y - 14) - (e.y - 15), p.x - e.x), deg = Math.abs(ang * 180 / Math.PI);
          e.aim = ang < -1.2 && ang > -1.95 ? 'u' : ang < -0.35 ? 'uf' : ang > 0.35 ? 'df' : 'f'; if (deg > 160 || deg < 20) e.aim = 'f';
          if (e.cd <= 0) { e.burst = G.stage >= 1 ? 3 : 2; e.cd = C.gunner.fireEvery; }
          if (e.burst > 0 && e.t % 10 === 0) { e.burst--; const mx = e.x + e.face * 9, my = e.y - (e.aim === 'u' ? 26 : e.aim === 'uf' ? 22 : e.aim === 'df' ? 9 : 15); const [vx, vy] = aimAt(mx, my, C.gunner.bulletSpeed); eshot(mx, my, vx, vy); }
        } else {
          if (e.cd <= 0) { e.cd = C.grenadier.fireEvery; e.tossT = 20; }
          if (e.tossT > 0 && --e.tossT === 0) { const t = 50, vx = clamp((p.x - e.x) / t, -2.4, 2.4); eshot(e.x + e.face * 6, e.y - 20, vx, -3.4, { g: 0.13, spr: 'grenade', r: 3, grenade: true }); }
        }
        break;
      }
      case 'sniper': {
        const cyc = e.t % 130; e.up = cyc > 70; e.face = sgn(dx) || e.face;
        if (cyc === 95 && onScreen(e.x, e.y)) { const [vx, vy] = aimAt(e.x + e.face * 6, e.y - 14, C.sniper.bulletSpeed); eshot(e.x + e.face * 6, e.y - 14, vx, vy); }
        break;
      }
      case 'turret': {
        if (!onScreen(e.x, e.y)) break;
        const ang = Math.atan2(-((p.y - 14) - e.y), p.x - e.x); let want = Math.round(ang / (Math.PI / 4)); want = ((want % 8) + 8) % 8;
        if (e.t % 16 === 0 && want !== e.dir) { const diff = ((want - e.dir + 12) % 8) - 4; e.dir = (e.dir + (diff > 0 ? 1 : -1) + 8) % 8; }
        if (e.cd <= 0 && want === e.dir) { e.cd = C.turret.fireEvery; const a = e.dir * Math.PI / 4; eshot(e.x + Math.cos(a) * 10, e.y - Math.sin(a) * 10, Math.cos(a) * C.turret.bulletSpeed, -Math.sin(a) * C.turret.bulletSpeed); }
        break;
      }
      case 'cannon':
        if (!onScreen(e.x, e.y)) break;
        e.up = Math.abs(dx) < 90;
        if (e.cd <= 0) { e.cd = C.cannon.fireEvery; if (e.up) eshot(e.x - 10, e.y - 14, -1.2, -3.8, { g: 0.11, spr: 'ebig', r: 4 }); else eshot(e.x - 12, e.y - 9, -2.2, 0, { spr: 'ebig', r: 4 }); }
        break;
      case 'drone':
        e.x -= 1.3; e.y = e.baseY + Math.sin(e.t * 0.06 + e.phase) * 16;
        if (e.cd <= 0 && Math.abs(dx) < 20 && e.y < p.y - 30) { e.cd = 90; eshot(e.x, e.y + 6, 0, 1.2, { g: 0.05, spr: 'grenade', r: 3, grenade: true }); }
        if (e.x < G.cam - 30) e.dead = true;
        break;
      case 'supply':
        e.x -= 0.8; e.y = e.baseY + Math.sin(e.t * 0.05) * 10; if (e.x < G.cam - 30) e.dead = true;
        break;
    }
    if (!e.fixed && !e.fly && e.type !== 'runSpawner' && e.x < G.cam - 40) e.dead = true;
  }
  function ebox(e) {
    if (e.type === 'sniper') return [e.x - 5, e.y - 18, e.x + 5, e.y - 6];
    if (e.fixed) return [e.x - e.w / 2, e.y - e.h, e.x + e.w / 2, e.y];
    if (e.fly) return [e.x - e.w / 2, e.y - e.h / 2, e.x + e.w / 2, e.y + e.h / 2];
    return [e.x - 4, e.y - 22, e.x + 4, e.y];
  }
  const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

  // ---------------------------------------------------------------- hazards
  function updateHazards() {
    const p = G.p, pb = pbox(p);
    for (const hz of G.hazards) {
      hz.t++;
      if (hz.type === 'vent') { const cyc = hz.t % 170; hz.on = cyc > 110; hz.warn = cyc > 80 && cyc <= 110; if (hz.on && overlap(pb, [hz.x - 6, hz.y - 52, hz.x + 6, hz.y])) killPlayer(); }
      else if (hz.type === 'laser') { const cyc = hz.t % 150; hz.on = cyc > 80; hz.warn = cyc > 60 && cyc <= 80; if (hz.on && overlap(pb, [hz.x - 2, hz.y0, hz.x + 2, hz.y1])) killPlayer(); }
      else if (hz.type === 'beamSpawner') {
        if (hz.left > 0 && hz.x < G.cam + W + 60 && --hz.t <= 0) { hz.left--; hz.t = 170; const gy = groundBelow(hz.x, hz.y - 8) || 128; G.hazards.push({ type: 'beam', x: G.cam + W + 12, y: gy - 26, t: 0 }); }
      } else if (hz.type === 'beam') { hz.x -= 2.6; if (overlap(pb, [hz.x - 4, -10, hz.x + 4, hz.y + 10])) killPlayer(); if (hz.x < G.cam - 20) hz.dead = true; }
    }
    G.hazards = G.hazards.filter(h => !h.dead && h.x > G.cam - 80);
  }

  // ---------------------------------------------------------------- bosses
  function part(o) { return Object.assign({ hp: 1, max: 1, flash: 0, vuln: () => true }, o); }
  function damagePart(pt, dmg) { if (pt.hp <= 0 || !pt.vuln()) return false; pt.hp -= dmg; pt.flash = 5; A.fx('ehit'); if (pt.hp <= 0) { pt.hp = 0; boom(pt.cx(), pt.cy(), true); addScore(500); if (pt.onDie) pt.onDie(); } return true; }
  const BOSS = {};
  BOSS.forklift = function (x0) {
    const c = CFG.bosses.forklift, b = { name: 'FORKLIFT FRITZ', x: x0 + 270, y: 160, dir: -1, t: 0, fork: 0, st: 'drive', stT: 0 };
    const body = part({ hp: c.hp, max: c.hp, box: () => [b.x - 26, b.y - 40, b.x + 26, b.y - 4], cx: () => b.x, cy: () => b.y - 22 });
    b.parts = [body]; b.score = c.score;
    b.update = () => {
      b.t++; b.stT++; const p = G.p, fast = body.hp < c.hp / 2;
      if (b.st === 'drive') { b.x += b.dir * (fast ? 1.4 : 0.9); if (b.x < x0 + 80) b.dir = 1; if (b.x > x0 + 290) b.dir = -1; b.fork = Math.max(0, b.fork - 1); if (b.stT > (fast ? 100 : 150)) { b.st = 'lift'; b.stT = 0; } }
      else if (b.st === 'lift') { b.fork = Math.min(18, b.fork + 1); if (b.stT === 34) { const t = 46; eshot(b.x - 22 * -b.dir * -1, b.y - 26, clamp((p.x - b.x) / t, -3, 3), -4, { g: 0.17, spr: 'crateProj', r: 6, grenade: true }); } if (b.stT > 50) { b.st = 'drive'; b.stT = 0; } }
      if (overlap(pbox(p), [b.x - 26, b.y - 36, b.x + 26, b.y])) killPlayer();
      return body.hp <= 0;
    };
    b.draw = (cam) => { const fl = b.dir > 0; E.draw(ctx, B.forklift, b.x - cam, b.y, fl, body.flash > 0 && body.flash % 4 < 2); E.draw(ctx, B.fork, b.x - cam + (fl ? 18 : -18), b.y - 6 - b.fork, fl); };
    return b;
  };
  BOSS.barnacle = function (x0) {
    const c = CFG.bosses.barnacle, b = { name: 'THE BARNACLE', x: x0 + 196, t: 0 };
    const gunA = part({ hp: c.gunHp, max: c.gunHp, gx: x0 + 220, gy: 139, box: () => [gunA.gx - 12, gunA.gy - 14, gunA.gx + 12, gunA.gy + 10], cx: () => gunA.gx, cy: () => gunA.gy - 6 });
    const gunB = part({ hp: c.gunHp, max: c.gunHp, gx: x0 + 312, gy: 139, box: () => [gunB.gx - 12, gunB.gy - 14, gunB.gx + 12, gunB.gy + 10], cx: () => gunB.gx, cy: () => gunB.gy - 6 });
    const core = part({ hp: c.coreHp, max: c.coreHp, vuln: () => gunA.hp <= 0 && gunB.hp <= 0, box: () => [x0 + 258, 118, x0 + 282, 136], cx: () => x0 + 270, cy: () => 127 });
    b.parts = [gunA, gunB, core]; b.score = c.score; b.hpParts = [gunA, gunB, core];
    G.arenaWall = x0 + 190; // the hull is a wall
    b.update = () => {
      b.t++; const p = G.p;
      if (!core.vuln()) {
        const g = b.t % 140 < 70 ? gunA : gunB; if (g.hp <= 0) { /* other gun */ }
        if (b.t % 70 === 0) { const gg = g.hp > 0 ? g : (gunA.hp > 0 ? gunA : gunB); if (gg.hp > 0) { const [vx, vy] = aimAt(gg.gx - 10, gg.gy - 8, 1.9); eshot(gg.gx - 10, gg.gy - 8, vx, vy, { spr: 'ebig', r: 4 }); } }
        if (b.t % 200 === 100) eshot(x0 + 200, 157, -1.3, 0, { spr: 'emine', r: 3, ground: true });
      } else {
        if (b.t % 90 === 0) for (const d of [-0.5, -0.25, 0, 0.25, 0.5]) { const [vx, vy] = aimAt(x0 + 262, 128, 1.8, d); eshot(x0 + 262, 128, vx, vy); }
        if (b.t % 130 === 65) eshot(x0 + 200, 157, -1.6, 0, { spr: 'emine', r: 3, ground: true });
      }
      return core.hp <= 0;
    };
    b.draw = (cam) => {
      const bob = Math.round(Math.sin(b.t * 0.05) * 1.5);
      E.draw(ctx, B.hull, b.x - cam, 186 + bob);
      for (const g of [gunA, gunB]) if (g.hp > 0) E.draw(ctx, B.deckGun, g.gx - cam, g.gy + bob, false, g.flash > 0 && g.flash % 4 < 2);
      E.draw(ctx, B.core, x0 + 270 - cam, 127 + bob, false, core.flash > 0 && core.flash % 4 < 2);
      if (!core.vuln()) E.draw(ctx, B.shutter, x0 + 258 - cam, 118 + bob);
    };
    return b;
  };
  BOSS.hornet = function (x0) {
    const c = CFG.bosses.hornet, b = { name: 'SKY HORNET', x: x0 + 260, y: 50, t: 0, st: 'hover', stT: 0 };
    const body = part({ hp: c.hp, max: c.hp, box: () => [b.x - 22, b.y - 8, b.x + 22, b.y + 10], cx: () => b.x, cy: () => b.y });
    b.parts = [body]; b.score = c.score;
    b.update = () => {
      b.t++; b.stT++; const p = G.p;
      if (b.st === 'hover') {
        b.x = x0 + 170 + Math.sin(b.t * 0.018) * 110; b.y = 46 + Math.sin(b.t * 0.05) * 14;
        if (b.t % 100 === 50) for (let k = 0; k < 3; k++) eshot(b.x - 8 + k * 8, b.y + 12, rand(-0.3, 0.3), 0.6, { g: 0.08, spr: 'grenade', r: 3, grenade: true });
        if (b.stT > 260) { b.st = 'warn'; b.stT = 0; b.tx = p.x; }
      } else if (b.st === 'warn') { body.flash = b.stT % 6 < 3 ? 2 : 0; if (b.stT > 30) { b.st = 'dive'; b.stT = 0; } }
      else if (b.st === 'dive') { b.x += (b.tx - b.x) * 0.06; b.y += (b.stT < 30 ? 2.4 : -2.4); if (b.stT > 60) { b.st = 'hover'; b.stT = 0; } }
      if (b.st === 'hover' && b.t % 150 === 0) for (const d of [-0.3, 0, 0.3]) { const [vx, vy] = aimAt(b.x, b.y + 8, 1.8, d); eshot(b.x, b.y + 8, vx, vy); }
      if (overlap(pbox(p), [b.x - 18, b.y - 6, b.x + 18, b.y + 10])) killPlayer();
      return body.hp <= 0;
    };
    b.draw = (cam) => E.draw(ctx, B.hornet[Math.floor(b.t / 3) % 2], b.x - cam, b.y, false, body.flash > 0 && body.flash % 4 < 2);
    return b;
  };
  BOSS.caboose = function (x0) {
    const c = CFG.bosses.caboose, b = { name: 'IRON CABOOSE', x: x0 + 204, t: 0 };
    G.arenaWall = x0 + 196;
    const gat = part({ hp: c.gatlingHp, max: c.gatlingHp, box: () => [x0 + 250, 70, x0 + 280, 90], cx: () => x0 + 265, cy: () => 80, dir: 2 });
    const core = part({ hp: c.coreHp, max: c.coreHp, vuln: () => gat.hp <= 0, box: () => [x0 + 268, 100, x0 + 292, 124], cx: () => x0 + 280, cy: () => 112 });
    b.parts = [gat, core]; b.score = c.score;
    b.update = () => {
      b.t++; const p = G.p;
      if (gat.hp > 0) {
        const ang = Math.atan2(-((p.y - 14) - 76), p.x - (x0 + 265)); gat.dir = clamp(Math.round((Math.PI - ang) / (Math.PI / 8)), 0, 4);
        const cyc = b.t % 120; if (cyc > 80 && cyc % 6 === 0) { const a = Math.PI - gat.dir * Math.PI / 8; eshot(x0 + 265 + Math.cos(a) * 14, 76 - Math.sin(a) * 14, Math.cos(a) * 2.4, -Math.sin(a) * 2.4); }
        if (b.t % 170 === 0) G.enemies.push({ type: 'runner', x: x0 + 214, y: 126, vx: 0, vy: 0, hp: 1, flash: 0, t: 0, dead: false, face: -1, w: 8, h: 22, onGround: false, cd: 0 });
      } else {
        if (b.t % 80 === 0) for (const vx of [-1.2, -1.8, -2.4]) eshot(x0 + 270, 108, vx, -3, { g: 0.1, spr: 'ebig', r: 4 });
        if (b.t % 120 === 60) eshot(x0 + 200, 125, -2, 0, { spr: 'emine', r: 3, ground: true });
      }
      return core.hp <= 0;
    };
    b.draw = (cam) => {
      E.draw(ctx, B.caboose, b.x - cam, 160);
      if (gat.hp > 0) E.draw(ctx, B.gatling[gat.dir], x0 + 265 - cam, 90, false, gat.flash > 0 && gat.flash % 4 < 2);
      if (core.vuln()) E.draw(ctx, B.steamCore, x0 + 280 - cam, 112, false, core.flash > 0 && core.flash % 4 < 2);
      else E.draw(ctx, B.shutterBig, x0 + 266 - cam, 98);
    };
    return b;
  };
  BOSS.sentinel = function (x0) {
    const c = CFG.bosses.sentinel, b = { name: 'SENTINEL-9', x: x0 + 270, y: 160, vy: 0, t: 0, st: 'idle', stT: 0, side: 1 };
    const body = part({ hp: c.hp, max: c.hp, box: () => [b.x - 14, b.y - 46, b.x + 14, b.y], cx: () => b.x, cy: () => b.y - 24 });
    b.parts = [body]; b.score = c.score;
    b.update = () => {
      b.t++; b.stT++; const p = G.p; b.face = sgn(p.x - b.x) || -1;
      if (b.st === 'idle') { if (b.stT > 50) { b.st = Math.random() < 0.5 ? 'laser' : 'shoot'; b.stT = 0; } }
      else if (b.st === 'laser') { if (b.stT > 40 && b.stT < 75) { b.beam = true; if (overlap(pbox(p), [G.cam, b.y - 22, G.cam + W, b.y - 12])) killPlayer(); } else b.beam = false; if (b.stT > 85) { b.beam = false; b.st = 'jump'; b.stT = 0; b.vy = -5.5; b.side = -b.side; } }
      else if (b.st === 'shoot') { if (b.stT % 30 === 10) for (const d of [-0.4, 0, 0.4]) { const [vx, vy] = aimAt(b.x, b.y - 30, 2, d); eshot(b.x, b.y - 30, vx, vy); } if (b.stT > 80) { b.st = 'jump'; b.stT = 0; b.vy = -5.5; b.side = -b.side; } }
      else if (b.st === 'jump') { const tx = b.side > 0 ? x0 + 270 : x0 + 50; b.x += (tx - b.x) * 0.05; b.vy += 0.2; b.y += b.vy; if (b.y >= 160 && b.vy > 0) { b.y = 160; b.vy = 0; b.st = 'idle'; b.stT = 0; E.shake(3, 8); A.fx('land'); } }
      if (overlap(pbox(p), [b.x - 12, b.y - 44, b.x + 12, b.y])) killPlayer();
      return body.hp <= 0;
    };
    b.draw = (cam) => {
      if (b.st === 'laser' && b.stT < 40 && E.blink(b.stT, 4)) { ctx.fillStyle = P.rose; ctx.fillRect(0, b.y - 17 - 0, W, 1); }
      if (b.beam) { ctx.fillStyle = P.rose; ctx.fillRect(0, b.y - 21, W, 9); ctx.fillStyle = P.white; ctx.fillRect(0, b.y - 18, W, 3); }
      E.draw(ctx, B.sentinel[Math.floor(b.t / 10) % 2], b.x - cam, b.y, b.face > 0, body.flash > 0 && body.flash % 4 < 2);
    };
    return b;
  };
  BOSS.goliath = function (x0) {
    const c = CFG.bosses.goliath, b = { name: 'GILDED GOLIATH', x: x0 + 240, y: 160, t: 0, dir: -1, phase: 1, pod: null };
    const shL = part({ hp: c.shoulderHp, max: c.shoulderHp, box: () => [b.x - 46, b.y - 90, b.x - 22, b.y - 72], cx: () => b.x - 34, cy: () => b.y - 81 });
    const shR = part({ hp: c.shoulderHp, max: c.shoulderHp, box: () => [b.x + 22, b.y - 90, b.x + 46, b.y - 72], cx: () => b.x + 34, cy: () => b.y - 81 });
    const core = part({ hp: c.coreHp, max: c.coreHp, vuln: () => shL.hp <= 0 && shR.hp <= 0, box: () => [b.x - 12, b.y - 66, b.x + 12, b.y - 48], cx: () => b.x, cy: () => b.y - 57, onDie: () => { b.phase = 3; b.podT = 0; for (let k = 0; k < 5; k++) G.fx.push({ k: 'boom', x: b.x + rand(-30, 30), y: b.y - rand(10, 80), t: -k * 6, life: 16 }); A.fx('bigboom'); } });
    const pod = part({ hp: c.podHp, max: c.podHp, vuln: () => b.phase === 3 && b.podT > 40, box: () => [b.px - 16, b.py - 10, b.px + 16, b.py + 10], cx: () => b.px, cy: () => b.py });
    b.parts = [shL, shR, core, pod]; b.score = c.score; b.px = b.x; b.py = b.y - 60;
    b.update = () => {
      b.t++; const p = G.p;
      if (b.phase < 3) {
        if (core.vuln()) b.phase = 2;
        if (b.t % 3 === 0) b.x += b.dir * 0.5; if (b.x < x0 + 200) b.dir = 1; if (b.x > x0 + 270) b.dir = -1;
        if (b.phase === 1 && b.t % 80 === 0) { const s = b.t % 160 === 0 ? shL : shR; const so = s.hp > 0 ? s : (shL.hp > 0 ? shL : shR); if (so.hp > 0) { const [vx, vy] = aimAt(so.cx(), so.cy(), 2); eshot(so.cx(), so.cy(), vx, vy, { spr: 'ebig', r: 4 }); } }
        if (b.phase === 2 && b.t % 70 === 0) for (const d of [-0.5, -0.25, 0, 0.25, 0.5]) { const [vx, vy] = aimAt(b.x, b.y - 57, 1.9, d); eshot(b.x - 10, b.y - 57, vx, vy); }
        if (b.t % (b.phase === 2 ? 110 : 170) === 0) { E.shake(3, 10); A.fx('land'); eshot(b.x - 30, b.y - 4, -2, 0, { spr: 'emine', r: 4, ground: true }); if (b.phase === 2) eshot(b.x + 30, b.y - 4, 2, 0, { spr: 'emine', r: 4, ground: true }); }
        if (overlap(pbox(p), [b.x - 30, b.y - 80, b.x + 30, b.y])) killPlayer();
      } else {
        b.podT++;
        if (b.podT < 40) { b.py -= 1; } else { const tt = b.podT * 0.02; b.px = x0 + 160 + Math.sin(tt) * 120; b.py = 60 + Math.sin(tt * 2) * 30; }
        if (b.podT > 40 && b.podT % 100 === 0) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + (b.podT % 200 ? 0.39 : 0); eshot(b.px, b.py, Math.cos(a) * 1.5, Math.sin(a) * 1.5); }
        if (b.podT > 40 && b.podT % 160 === 80) for (const vx of [-0.6, 0.6]) eshot(b.px, b.py + 8, vx, 0.5, { g: 0.08, spr: 'grenade', r: 3, grenade: true });
        if (overlap(pbox(p), [b.px - 14, b.py - 8, b.px + 14, b.py + 10])) killPlayer();
      }
      return pod.hp <= 0;
    };
    b.draw = (cam) => {
      if (b.phase < 3) {
        E.draw(ctx, B.goliath, b.x - cam, b.y, false, (core.flash > 0 && core.flash % 4 < 2));
        for (const s of [shL, shR]) if (s.hp > 0) E.draw(ctx, B.shoulder, s.cx() - cam, s.cy(), s === shR, s.flash > 0 && s.flash % 4 < 2);
        if (core.vuln()) E.draw(ctx, B.core, b.x - cam, b.y - 57, false, core.flash > 0 && core.flash % 4 < 2);
      } else {
        ctx.globalAlpha = 0.6; E.draw(ctx, B.goliath, b.x - cam, b.y + 10); ctx.globalAlpha = 1;
        E.draw(ctx, B.pod[Math.floor(b.t / 4) % 2], b.px - cam, b.py, false, pod.flash > 0 && pod.flash % 4 < 2);
      }
    };
    return b;
  };
  function startBoss(ar) {
    const key = ar.kind === 'mid' ? G.S.mid : G.S.boss;
    G.arena = ar; G.cam = ar.x; G.boss = BOSS[key](ar.x); G.boss.key = key; G.boss.kind = ar.kind; G.bannerT = 140;
    A.music(SONGS.boss); A.fx('boss');
  }
  function bossDefeated() {
    const b = G.boss; addScore(b.score);
    for (let k = 0; k < 8; k++) G.fx.push({ k: 'boom', x: (b.parts[0].cx ? b.parts[b.parts.length - 1].cx() : b.x) + rand(-30, 30), y: rand(60, 150), t: -k * 7, life: 16 });
    A.fx('bigboom'); E.shake(4, 30); E.flash(6);
    pop(G.cam + W / 2, 80, b.kind === 'end' ? (G.stage === STAGES.length - 1 ? 'DUKE ARRESTED!' : 'CREW ARRESTED!') : 'BUSTED!', P.gold);
    G.arena.done = true; G.boss = null; G.eb = []; G.arenaWall = null;
    if (G.arena.kind === 'end') { G.endT = 120; }
    else { A.music(SONGS[G.S.music]); }
  }

  // ---------------------------------------------------------------- world update
  function updatePlay() {
    const p = G.p;
    if (G.bannerT > 0) G.bannerT--;
    if (G.bangT > 0) G.bangT--;
    for (const f of G.fx) f.t++; G.fx = G.fx.filter(f => f.t < f.life);
    for (const pp of G.pops) { pp.t++; pp.y -= 0.4; } G.pops = G.pops.filter(pp => pp.t < 60);
    if (I.pressed.start) { E.pause(); return; }
    if (G.endT > 0) { G.endT--; updatePlayer(); if (G.endT === 0) stageClear(); return; }
    updatePlayer();
    // camera + arenas
    const next = G.map.arenas.find(a => !a.done);
    const limit = Math.min(next ? next.x : G.mapW - W, G.mapW - W);
    if (!G.boss) { const target = p.x - 120; if (target > G.cam) G.cam = Math.min(G.cam + Math.min(3, target - G.cam), limit); if (next && G.cam >= next.x - 0.01 && p.state === 'normal') startBoss(next); }
    for (const cx of G.map.checks) if (p.x > cx) G.checkpoint = cx;
    // spawns
    for (const en of G.map.ents) { if (en.spawned) continue; if (en.x > G.cam + W + 24) break; en.spawned = true; if (en.x > G.cam - 24) spawnEnt(en); }
    for (const e of G.enemies) updateEnemy(e);
    updateHazards();
    if (G.boss) { G.boss.t2 = (G.boss.t2 || 0) + 1; if (G.boss.update()) bossDefeated(); for (const pt of G.boss ? G.boss.parts : []) if (pt.flash > 0) pt.flash--; }
    // player bullets
    for (const b of G.pb) {
      if (b.bounces !== undefined) {
        if (solidPx(b.x + b.vx, b.y)) { b.vx = -b.vx; b.bounces--; A.fx('bounce'); }
        if (solidPx(b.x, b.y + b.vy) || b.y + b.vy < 0 || b.y + b.vy > 176) { b.vy = -b.vy; b.bounces--; A.fx('bounce'); }
        if (b.bounces < 0) b.dead = true;
      }
      b.x += b.vx; b.y += b.vy; b.life--;
      if (b.life <= 0 || b.x < G.cam - 12 || b.x > G.cam + W + 12 || b.y < -12 || b.y > 200) b.dead = true;
      if (b.dead) continue;
      const bb = b.len ? [Math.min(b.x, b.x - b.vx * 3) - 2, Math.min(b.y, b.y - b.vy * 3) - 2, Math.max(b.x, b.x - b.vx * 3) + 2, Math.max(b.y, b.y - b.vy * 3) + 2] : [b.x - 2, b.y - 2, b.x + 2, b.y + 2];
      for (const e of G.enemies) {
        if (e.dead || e.invisible || e.hp <= 0 || b.hits.has(e)) continue;
        if (e.type === 'sniper' && !e.up) { if (overlap(bb, [e.x - 12, e.y - 12, e.x + 12, e.y])) { if (!b.pierce) b.dead = true; } continue; }
        if (overlap(bb, ebox(e))) { b.hits.add(e); hurtEnemy(e, b.dmg); if (!b.pierce) { b.dead = true; break; } }
      }
      if (!b.dead && G.boss) for (const pt of G.boss.parts) {
        if (pt.hp <= 0 || b.hits.has(pt)) continue;
        if (overlap(bb, pt.box())) { b.hits.add(pt); if (damagePart(pt, b.dmg) || !pt.vuln()) { if (!b.pierce) { b.dead = true; break; } } }
      }
    }
    G.pb = G.pb.filter(b => !b.dead);
    // enemy bullets
    const pbx = pbox(p);
    for (const b of G.eb) {
      b.vy += b.g; b.x += b.vx; b.y += b.vy; b.life--;
      if (b.grenade && b.vy > 0 && (solidPx(b.x, b.y + 2) || (tile(Math.floor(b.x / TS), Math.floor((b.y + 2) / TS)) === '=' && b.vy > 0))) { b.dead = true; G.fx.push({ k: 'boom', x: b.x, y: b.y - 4, t: 0, life: 16 }); A.fx('explode'); if (Math.abs(p.x - b.x) < 14 && Math.abs((p.y - 8) - b.y) < 16) killPlayer(); continue; }
      if (b.life <= 0 || b.x < G.cam - 30 || b.x > G.cam + W + 30 || b.y > 200 || b.y < -40) { b.dead = true; continue; }
      if (overlap(pbx, [b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r])) { killPlayer(); if (p.state === 'dead') b.dead = true; }
    }
    G.eb = G.eb.filter(b => !b.dead);
    // contact with enemies
    for (const e of G.enemies) if (!e.dead && !e.invisible && e.hp > 0 && (e.type === 'runner' || e.type === 'drone') && overlap(pbx, ebox(e))) killPlayer();
    G.enemies = G.enemies.filter(e => !e.dead);
    // pickups
    for (const k of G.pickups) {
      k.t++; k.vy = Math.min(k.vy + 0.15, 3); k.x += k.vx; k.y += k.vy;
      const gy = groundBelow(k.x, k.y - 8); if (gy !== null && k.y >= gy && k.vy > 0) { k.y = gy; k.vy = k.t < 40 ? -1.2 : 0; k.vx = 0; }
      if (k.y > 200) k.dead = true;
      if (p.state === 'normal' && overlap(pbx, [k.x - 8, k.y - 14, k.x + 8, k.y])) { k.dead = true; p.weapon = k.k; A.fx('power'); addScore(500); pop(p.x, p.y - 34, CFG.weapons[k.k].name + '!', P.gold); }
    }
    G.pickups = G.pickups.filter(k => !k.dead && k.x > G.cam - 20);
  }

  // ---------------------------------------------------------------- update dispatch
  function update() {
    G.t++;
    const tap = I.tap;
    switch (G.state) {
      case 'title': {
        if (G.howto) { if (I.confirm() || I.pressed.c || tap) { G.howto = false; A.fx('select'); } break; }
        if (I.pressed.up || I.pressed.down) { G.menu = 1 - G.menu; A.fx('select'); }
        let go = I.confirm();
        if (tap) { if (tap.y > 112 && tap.y < 125) G.menu = 0; else if (tap.y >= 125 && tap.y < 138) G.menu = 1; go = true; }
        if (go && G.t > 10) { A.fx('confirm'); if (G.menu === 0) newGame(0); else G.howto = true; }
        break;
      }
      case 'intro': if ((G.t > 30 && (I.confirm() || tap)) || G.t > 190) startPlay(); break;
      case 'play': updatePlay(); break;
      case 'clear': {
        updatePlayer();
        if (G.bonusShown < G.bonus) { const s = Math.min(100, G.bonus - G.bonusShown); G.bonusShown += s; addScore(s); }
        for (const f of G.fx) f.t++; G.fx = G.fx.filter(f => f.t < f.life);
        if (G.t > 240 || (G.t > 90 && (I.confirm() || tap))) { if (G.bonusShown < G.bonus) addScore(G.bonus - G.bonusShown); if (G.stage < STAGES.length - 1) loadStage(G.stage + 1); else victory(); }
        break;
      }
      case 'continue': {
        const left = 9 - Math.floor(G.t / 60);
        if (I.pressed.left || I.pressed.right || I.pressed.up || I.pressed.down) { G.contSel = 1 - G.contSel; A.fx('select'); }
        let go = I.confirm() && G.t > 20;
        if (tap) { G.contSel = tap.x < W / 2 ? 0 : 1; go = true; }
        if (go) { if (G.contSel === 0) { G.lives = CFG.lives; G.continues++; respawn(); G.state = 'play'; A.music(G.boss ? SONGS.boss : SONGS[G.S.music]); A.fx('confirm'); } else gameOver(); }
        else if (left < 0) gameOver();
        break;
      }
      case 'gameover': if (G.t > 300 || (G.t > 60 && (I.confirm() || tap))) toTitle(); break;
      case 'victory': if (G.t > 120 && (I.confirm() || tap)) toTitle(); break;
    }
  }

  // ---------------------------------------------------------------- rendering
  function bar(x, y, w, h, frac, col, back) { // beveled gauge
    const Rc = E.ramp(col), fw = Math.max(0, w * Math.max(0, Math.min(1, frac)));
    ctx.fillStyle = '#06020E'; ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    ctx.fillStyle = E.grad('bb' + y + h + back, () => { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, E.ramp(back).d2); g.addColorStop(1, E.ramp(back).d1); return g; }); ctx.fillRect(x, y, w, h);
    if (fw > 0) { const g = E.grad('bf' + y + h + col, () => { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, Rc.h2); g.addColorStop(0.35, Rc.h1); g.addColorStop(0.55, Rc.b); g.addColorStop(1, Rc.d2); return g; }); ctx.fillStyle = g; ctx.fillRect(x, y, fw, h); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x, y, fw, 0.5); }
    for (let i = x + 5; i < x + w; i += 5) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(i, y, 0.5, h); }
  }
  const THEME = {
    docks: { weather: 'rain', far: 0.35, glow: 0.55 },
    train: { weather: 'embers', far: 0.5, glow: 0.45, emit: [60, 230, 400, 560, 740, 900, 1080, 1260, 1440, 1620, 1800, 1980, 2160, 2340, 2520, 2700, 2880, 3060, 3240, 3420, 3600].map(x => ({ x, y: 176, h: 120 })) },
    tower: { weather: 'dust', far: 0.4, glow: 0.6, emit: [80, 300, 520, 740, 960, 1180, 1400, 1620, 1840, 2060, 2280, 2500, 2720, 2940, 3160, 3380].map(x => ({ x, y: 170, h: 130 })), shafts: [100, 520, 940, 1360, 1780, 2200, 2620, 3040].map(x => ({ x, col: 'rgba(200,210,255,0.14)' })) }
  };
  function drawLayers(cam, t) {
    const L = G.layers || layerCache.docks || (layerCache.docks = BGS.layers('docks')), th = THEME[(G.S && G.S.theme) || 'docks'] || {};
    E.bgPrep(L, th);
    const moving = G.S && G.S.theme === 'train' && !E.reducedMotion ? t * 2 : 0;
    E.drawLayer(ctx, L, 'far', cam * 0.2 + moving * 0.3, 0, true);
    if (!E.lowFx) E.drawGlow(ctx, L.farGlow, 512, cam * 0.2 + moving * 0.3, th.far || 0.4, true);
    E.drawLayer(ctx, L, 'mid', cam * 0.5 + moving, 0, true);
  }
  function drawTiles(cam) {
    if (!G.tilesBg || G.tilesBg.tiles !== G.tiles) G.tilesBg = E.bgPrep({ tiles: G.tiles });
    E.drawLayer(ctx, G.tilesBg, 'tiles', cam);
    E.drawGlow(ctx, G.tilesBg.glow, G.tiles.width, cam, 0.45);
  }
  function glowDot(x, y, r, col) { ctx.drawImage(E.puff(col), x - r, y - r, r * 2, r * 2); }
  function drawSprite(s, x, y, flip, flash) { E.draw(ctx, s, x, y, flip, flash > 0 && (E.reducedMotion ? flash > 3 : flash % 4 < 2)); }
  function renderPlay() {
    const [sx, sy] = E.shakeOffset(), cam = Math.round(G.cam), p = G.p;
    ctx.save(); ctx.translate(sx, sy);
    drawLayers(cam, G.t);
    drawTiles(cam);
    for (const hz of G.hazards) {
      const x = Math.round(hz.x - cam);
      if (hz.type === 'vent') { E.draw(ctx, ART.vent, x, hz.y); if (hz.warn && E.blink(hz.t, 6)) { ctx.fillStyle = P.lgray; ctx.fillRect(x - 3, hz.y - 10, 6, 4); } if (hz.on) { for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? P.white : P.lgray; const w = 6 + (k % 3) * 2; ctx.fillRect(x - w / 2 + Math.sin(hz.t * 0.4 + k) * 2, hz.y - 8 - k * 8, w, 8); } } }
      else if (hz.type === 'laser') { ctx.fillStyle = P.dgray; ctx.fillRect(x - 4, hz.y0, 8, 4); ctx.fillRect(x - 4, hz.y1 - 4, 8, 4); if (hz.on) { ctx.fillStyle = P.rose; ctx.fillRect(x - 2, hz.y0 + 4, 4, hz.y1 - hz.y0 - 8); ctx.fillStyle = P.white; ctx.fillRect(x - 1, hz.y0 + 4, 1, hz.y1 - hz.y0 - 8); } else if (hz.warn && E.blink(hz.t, 4)) { ctx.fillStyle = P.salmon; ctx.fillRect(x, hz.y0 + 4, 1, hz.y1 - hz.y0 - 8); } }
      else if (hz.type === 'beam') { ctx.fillStyle = P.dgray; ctx.fillRect(x - 3, 0, 6, hz.y); ctx.fillStyle = P.gold; ctx.fillRect(x - 8, hz.y, 16, 8); ctx.fillStyle = P.black; for (let k = 0; k < 16; k += 4) ctx.fillRect(x - 8 + k, hz.y, 2, 8); ctx.fillStyle = P.rose; ctx.fillRect(x - 2, hz.y + 2, 4, 4); }
    }
    if (G.boss) G.boss.draw(cam);
    for (const e of G.enemies) {
      if (e.invisible) continue;
      const x = e.x - cam, fl = e.face > 0;
      switch (e.type) {
        case 'runner': drawSprite(ART.enemy.runner['run' + (Math.floor(e.t / 6) % 4)], x, e.y, fl, e.flash); break;
        case 'gunner': drawSprite(ART.enemy.gunner['stand_' + e.aim], x, e.y, fl, e.flash); break;
        case 'grenadier': drawSprite(ART.enemy.grenadier[e.tossT > 10 ? 'wind' : e.tossT > 0 ? 'toss' : 'idle'], x, e.y, fl, e.flash); break;
        case 'sniper': if (e.up) drawSprite(ART.enemy.gunner.stand_f, x, e.y - 4, fl, e.flash); E.draw(ctx, ART.bunker, x, e.y); break;
        case 'turret': drawSprite(ART.turret[e.dir], x, e.y, false, e.flash); break;
        case 'cannon': drawSprite(ART.cannon[e.up ? 1 : 0], x, e.y, false, e.flash); break;
        case 'drone': drawSprite(ART.drone[Math.floor(e.t / 3) % 2], x, e.y, false, e.flash); break;
        case 'supply': drawSprite(ART.supply[Math.floor(e.t / 3) % 2], x, e.y, false, e.flash); E.draw(ctx, ART.cap[e.carry], x, e.y + 12); break;
      }
    }
    for (const k of G.pickups) if (k.t > 300 ? E.blink(k.t, 4) : true) E.draw(ctx, ART.cap[k.k], k.x - cam, k.y - 8);
    // player
    if (p.state !== 'dead' || p.deadT < 80) {
      let vis = true, alpha = 1;
      if (p.inv > 0 && p.state === 'normal') { if (E.reducedMotion) alpha = 0.6; else vis = E.blink(p.inv, 3); }
      if (vis) { ctx.globalAlpha = alpha; E.draw(ctx, ART.hero[p.frame] || ART.hero.stand_f, p.x - cam, p.y, p.face < 0); ctx.globalAlpha = 1; }
    }
    for (const b of G.pb) {
      const x = Math.round(b.x - cam), y = Math.round(b.y);
      if (b.len) { ctx.fillStyle = P.aqua; const n = 7; for (let k = 0; k < n; k++) ctx.fillRect(Math.round(x - b.vx * k * 0.45) - 1, Math.round(y - b.vy * k * 0.45) - 1, 3, 3); ctx.fillStyle = P.white; ctx.fillRect(x - 1, y - 1, 2, 2); }
      else E.draw(ctx, b.kind === 'S' ? ART.pshotS : b.kind === 'R' ? ART.pshotR : b.kind === 'B' ? ART.pshotB : ART.pshot, x, y);
    }
    if (!E.lowFx) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const b of G.pb) glowDot(b.x - cam, b.y, b.len ? 9 : 6, 'rgba(90,220,255,0.55)');
      for (const b of G.eb) glowDot(b.x - cam, b.y, 6, 'rgba(255,90,60,0.5)');
      for (const f of G.fx) if (f.k === 'boom' && f.t >= 0 && f.t < 16) { ctx.globalAlpha = Math.max(0, 1 - f.t / 16); glowDot(f.x - cam, f.y - 6, 26 - f.t, 'rgba(255,180,80,0.6)'); ctx.globalAlpha = 1; }
      ctx.restore(); }
    for (const b of G.eb) E.draw(ctx, ART[b.spr], b.x - cam, b.y);
    for (const f of G.fx) {
      if (f.t < 0) continue;
      if (f.k === 'boom') E.draw(ctx, ART.boom[Math.min(3, Math.floor(f.t / 4))], f.x - cam, f.y);
      else if (f.k === 'ko') { if (E.blink(f.t, 4)) E.draw(ctx, f.spr, f.x - cam, f.y, f.face > 0); E.draw(ctx, ART.stars, f.x - cam, f.y - 12); if (f.t > 20) E.draw(ctx, ART.cuffs, f.x - cam, f.y - 20); }
    }
    { const th = THEME[G.S.theme]; if (th) E.atmos(ctx, th.weather, G.t, cam, th); }
    for (const pp of G.pops) E.text(ctx, pp.text, pp.x - cam, pp.y, pp.col, 1, 'center', { outline: P.black });
    ctx.restore();
    if (E.flashOn() || G.bangT > 0) { ctx.fillStyle = 'rgba(252,252,252,0.55)'; ctx.fillRect(0, 0, W, H); }
    drawHud();
    if (G.bannerT > 0 && G.boss) { ctx.fillStyle = P.black; ctx.fillRect(0, 70, W, 26); ctx.fillStyle = P.crimson; ctx.fillRect(0, 70, W, 2); ctx.fillRect(0, 94, W, 2); E.text(ctx, G.boss.kind === 'mid' ? 'WARNING' : 'MOST WANTED', W / 2, 74, P.salmon, 1, 'center'); E.text(ctx, G.boss.name, W / 2, 84, P.gold, 1, 'center'); }
  }
  function drawHud() {
    const p = G.p, R = E.isTouch ? 162 : 226; // keep clear of the HTML buttons (on touch the AUTO pill sits left of them)
    for (let i = 0; i < Math.min(6, G.lives); i++) E.draw(ctx, ART.lifeIcon, 4 + i * 9, 3);
    if (G.lives > 6) E.text(ctx, '+' + (G.lives - 6), 60, 4, P.white, 1, 'left', { outline: P.black });
    E.panel(ctx, 4, 15, 10, 9, { rim: '#F0BC3C' });
    E.text(ctx, p.weapon === 'P' ? '-' : p.weapon, 6, 16, P.gold);
    E.text(ctx, CFG.weapons[p.weapon].name, 18, 16, P.white, 1, 'left', { outline: P.black });
    E.text(ctx, 'FB' + p.bangs, 18 + E.textWidth(CFG.weapons[p.weapon].name) + 6, 16, P.ice, 1, 'left', { outline: P.black });
    { ctx.fillStyle = E.grad('ssh', () => { const sg = ctx.createLinearGradient(0, 0, 0, 30); sg.addColorStop(0, 'rgba(6,2,20,0.7)'); sg.addColorStop(1, 'rgba(6,2,20,0)'); return sg; }); ctx.fillRect(0, 0, W, 30); }
    E.text(ctx, String(G.score).padStart(7, '0'), R, 4, P.white, 1, 'right', { outline: '#140A28' });
    if (autoFire) E.text(ctx, 'AUTO', R, 16, P.mint, 1, 'right', { outline: P.black });
    if (G.boss) {
      let hp = 0, max = 0; for (const pt of G.boss.parts) { hp += pt.hp; max += pt.max; }
      E.text(ctx, G.boss.name, 160 - 40, 28, P.salmon, 1, 'center', { outline: P.black });
      bar(160 - 40 - 50, 38, 100, 4, hp / max, P.rose, P.dgray);
    }
  }
  function renderTitle() {
    G.layers = layerCache.tower || (layerCache.tower = BGS.layers('tower'));
    const L = layerCache.tower; const off = E.reducedMotion ? 0 : G.t * 0.3; E.bgPrep(L, THEME.tower);
    E.drawLayer(ctx, L, 'far', off, 0, true); E.drawGlow(ctx, L.farGlow, 512, off, 0.5, true);
    const sh = ctx.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(6,2,24,0.45)'); sh.addColorStop(0.6, 'rgba(6,2,24,0.05)'); sh.addColorStop(1, 'rgba(6,2,24,0.35)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
    if (!E.reducedMotion) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const x = ((G.t * (0.6 + i * 0.25) + i * 140) % (W + 120)) - 60, y = 96 + i * 9; const g = ctx.createLinearGradient(x - 40, 0, x + 40, 0); g.addColorStop(0, 'rgba(120,220,255,0)'); g.addColorStop(0.5, 'rgba(120,220,255,0.25)'); g.addColorStop(1, 'rgba(120,220,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 40, y, 80, 1); } ctx.restore(); }
    E.drawLogo(ctx, E.logo('SKYLINE', 4, ['#FFFFFF', '#C8F0FF', '#54C8FF', '#1C68E0', '#0C2478'], { shadow: '#0C1448' }), W / 2, 6);
    E.drawLogo(ctx, E.logo('SIEGE', 4, ['#FFFBE0', '#FFE070', '#F8A000', '#C04800', '#7C1800'], { shadow: '#5C0C20' }), W / 2, 40);
    E.text(ctx, 'CROOKED CROWN CRACKDOWN', W / 2, 82, P.white, 1, 'center', { outline: P.black });
    E.draw(ctx, ART.hero.stand_uf, 40, 170); E.draw(ctx, ART.enemy.gunner.stand_f, 280, 170, false);
    { const fl = ctx.createLinearGradient(0, 170, 0, H); fl.addColorStop(0, '#3C3450'); fl.addColorStop(1, '#100C1C'); ctx.fillStyle = fl; ctx.fillRect(0, 170, W, 10); ctx.fillStyle = '#F8D878'; ctx.fillRect(0, 170, W, 0.5); }
    E.atmos(ctx, 'none', G.t, 0, { vignette: true });
    if (G.howto) return renderHowto();
    E.panel(ctx, W / 2 - 60, 110, 120, 29, { rim: '#54C8FF' });
    ['START GAME', 'HOW TO PLAY'].forEach((s, i) => { const on = G.menu === i; E.text(ctx, (on ? '> ' : '  ') + s + (on ? ' <' : '  '), W / 2, 115 + i * 13, on ? P.gold : P.lgray, 1, 'center', { outline: P.black }); });
    if (E.blink(G.t, 30)) E.text(ctx, E.isTouch ? 'TAP TO START' : 'PRESS ENTER', W / 2, 146, P.white, 1, 'center', { outline: P.black });
    E.text(ctx, 'HI ' + String(E.hiScore()).padStart(7, '0'), W / 2, 158, P.lgray, 1, 'center', { outline: P.black });
  }
  function renderHowto() {
    E.panel(ctx, 10, 92, W - 20, 83, { rim: '#54C8FF' });
    const lines = E.isTouch ? ['STICK: RUN AND AIM IN 8 DIRECTIONS', 'HOLD DOWN: CROUCH, KEEP HOLDING: PRONE', 'FIRE: SHOOT   JUMP: JUMP   BANG: FLASH-BANG', 'AUTO BUTTON: AUTO-FIRE ON/OFF (SAVED)', 'SHOOT SUPPLY DRONES FOR S R L B WEAPONS']
      : ['ARROWS/WASD: RUN + AIM 8 WAYS', 'HOLD DOWN: CROUCH, KEEP HOLDING: PRONE', 'J/Z: FIRE  K/X: JUMP  L/C: FLASH-BANG', 'AUTO-FIRE: AUTO BUTTON OR PAUSE MENU', 'SHOOT SUPPLY DRONES FOR S R L B WEAPONS'];
    lines.forEach((l, i) => E.text(ctx, l, W / 2, 97 + i * 12, i === 4 ? P.gold : P.white, 1, 'center'));
    if (E.blink(G.t, 30)) E.text(ctx, 'BACK', W / 2, 162, P.gold, 1, 'center');
  }
  function renderIntro() {
    ctx.fillStyle = P.black; ctx.fillRect(0, 0, W, H);
    E.text(ctx, G.S.title, W / 2, 30, P.gold, 2, 'center');
    E.text(ctx, G.S.name, W / 2, 54, P.white, 2, 'center', { shadow: P.royal });
    G.S.intro.forEach((l, i) => E.text(ctx, l, W / 2, 88 + i * 12, P.ice, 1, 'center'));
    E.draw(ctx, ART.hero['run' + (Math.floor(G.t / 6) % 4) + '_f'], 40 + Math.min(G.t, 120) * 2, 166);
    if (E.blink(G.t, 20)) E.text(ctx, 'GET READY', W / 2, 136, P.gold, 1, 'center');
  }
  function renderClear() {
    renderPlay(); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 50, W, 66);
    E.text(ctx, 'STAGE CLEAR!', W / 2, 58, P.gold, 2, 'center', { outline: P.black });
    E.text(ctx, 'LIVES BONUS  ' + G.bonusShown, W / 2, 84, P.white, 1, 'center');
    E.text(ctx, 'SCORE  ' + G.score, W / 2, 98, P.white, 1, 'center');
  }
  function renderContinue() {
    renderPlay(); ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
    E.text(ctx, 'CONTINUE?', W / 2, 40, P.gold, 3, 'center', { outline: P.black });
    E.text(ctx, String(Math.max(0, 9 - Math.floor(G.t / 60))), W / 2, 74, P.white, 4, 'center');
    E.text(ctx, (G.contSel === 0 ? '> ' : '  ') + 'YES', W / 4, 126, G.contSel === 0 ? P.gold : P.lgray, 2, 'center');
    E.text(ctx, (G.contSel === 1 ? '> ' : '  ') + 'NO', W * 3 / 4, 126, G.contSel === 1 ? P.gold : P.lgray, 2, 'center');
    E.text(ctx, 'FREE CONTINUE - YOUR SCORE IS KEPT', W / 2, 156, P.ice, 1, 'center');
  }
  function renderGameOver() {
    ctx.fillStyle = P.black; ctx.fillRect(0, 0, W, H);
    E.text(ctx, 'GAME OVER', W / 2, 50, P.salmon, 3, 'center');
    E.text(ctx, 'FINAL SCORE ' + G.score, W / 2, 96, P.white, 1, 'center');
    E.text(ctx, 'PUZZLE POINTS +' + Math.floor(G.score / 100), W / 2, 110, P.gold, 1, 'center');
    E.text(ctx, 'REGROUP AND TRY AGAIN, OFFICER.', W / 2, 134, P.ice, 1, 'center');
  }
  function renderVictory() {
    const L = layerCache.train || (layerCache.train = BGS.layers('train'));
    ctx.drawImage(L.far, 0, 0); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
    E.text(ctx, 'CROWN CRUSHED!', W / 2, 14, P.gold, 3, 'center', { outline: P.black, shadow: P.rust });
    ['DUKE DELLACROIX IS IN CUSTODY.', 'THE SKYLINE IS SAFE AGAIN.', 'OUTSTANDING WORK, OFFICER REYES.'].forEach((l, i) => E.text(ctx, l, W / 2, 46 + i * 11, P.white, 1, 'center', { outline: P.black }));
    E.text(ctx, 'FINAL SCORE ' + G.score, W / 2, 88, P.gold, 1, 'center', { outline: P.black });
    E.text(ctx, 'PUZZLE POINTS +' + Math.floor(G.score / 100), W / 2, 100, P.mint, 1, 'center', { outline: P.black });
    ctx.fillStyle = P.dgray; ctx.fillRect(0, 160, W, 20); ctx.fillStyle = P.gold; ctx.fillRect(0, 160, W, 1);
    E.draw(ctx, ART.hero.win, 140, 160); E.draw(ctx, ART.enemy.duke.hurt, 184, 160, true); E.draw(ctx, ART.cuffs, 182, 140);
    if (G.t > 120 && E.blink(G.t, 30)) E.text(ctx, E.isTouch ? 'TAP FOR TITLE' : 'PRESS ENTER', W / 2, 168, P.white, 1, 'center', { outline: P.black });
  }
  function render() {
    ctx.imageSmoothingEnabled = false;
    switch (G.state) {
      case 'title': renderTitle(); break;
      case 'intro': renderIntro(); break;
      case 'play': renderPlay(); break;
      case 'clear': renderClear(); break;
      case 'continue': renderContinue(); break;
      case 'gameover': renderGameOver(); break;
      case 'victory': renderVictory(); break;
    }
  }

  // ---------------------------------------------------------------- debug hooks (tests/smoke.py)
  G.debug = {
    start(stage, warp) {
      newGame(stage || 0); startPlay();
      if (warp) { const ar = G.map.arenas.find(a => a.kind === warp); if (ar) { G.map.arenas.forEach(a => { if (a.x < ar.x) a.done = true; }); G.map.ents.forEach(en => { if (en.x < ar.x + W) en.spawned = true; }); G.cam = ar.x; G.p.x = ar.x + 60; G.p.y = 40; } }
    },
    weapon(k) { G.p.weapon = k; }, defeatBoss() { if (G.boss) for (const pt of G.boss.parts) { pt.hp = 0; } },
    win() { victory(); }, lose() { G.lives = 1; G.p.inv = 0; killPlayer(); }
  };
  const qs = parseInt(prm.get('stage') || (prm.get('autostart') === '1' ? '1' : '0'), 10);
  if (qs >= 1 && qs <= STAGES.length) {
    newGame(qs - 1);
    const warp = prm.get('boss') === '1' ? 'end' : prm.get('mid') === '1' ? 'mid' : null;
    if (prm.get('autostart') === '1' || warp) G.debug.start(qs - 1, warp);
  } else toTitle();
  E.start(update, render);
})();
