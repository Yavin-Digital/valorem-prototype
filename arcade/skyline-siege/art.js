/* Skyline Siege: all pixel art generated in code. */
(function () {
  'use strict';
  const E = window.RetroEngine, P = E.P;
  const ART = window.SS_ART = {};
  const CW = 44, CH = 46, CX = 22, BASE = 43, K = 1.25; // K: figure scale (about 32 units / 64 display px tall)
  const D = { leg: 9, torso: 8, tw: 7, hw: 7, hh: 7, lw: 2, aw: 2, hand: 2 };
  const LS = { legF: [1, 4, 1, 9], legB: [-1, 4, -2, 9] };
  const RUN = [
    { legF: [2, 4, 4, 9], legB: [-2, 4, -3, 9] },
    { hy: -1, legF: [1, 5, 1, 10], legB: [1, 3, -1, 7] },
    { legF: [-2, 4, -3, 9], legB: [2, 4, 4, 9] },
    { hy: -1, legF: [1, 3, -1, 7], legB: [1, 5, 1, 10] }
  ];
  const ARMS = {
    f: { armF: [3, 1, 6, 0], armB: [2, 2, 5, 1] },
    uf: { armF: [2, -2, 5, -5], armB: [2, -1, 4, -4] },
    u: { armF: [1, -3, 1, -7], armB: [0, -3, 0, -6] },
    df: { armF: [3, 2, 5, 5], armB: [2, 3, 4, 5] },
    d: { armF: [1, 3, 1, 7], armB: [0, 3, 0, 6] }
  };
  ART.ARMS = ARMS;
  function person(def, pose, item) {
    const c = E.makeCanvas(CW, CH), p = E.painter(c.getContext('2d'));
    E.human(p, Object.assign({}, def, { k: K, cx: CX, base: BASE, d: def.d || D, item: item === undefined ? def.item : item, pose }));
    E.outline(c, '#000000');
    return c;
  }
  const fin = c => E.finish(c, CX, BASE);
  const rot = (c, n) => { for (let i = 0; i < n; i++) c = E.rotate90(c, true); return c; };

  // ---------------------------------------------------------------- hero: Officer Nova Reyes, Tactical Unit
  ART.HERO = { name: 'OFC. NOVA REYES', d: D, hat: 'helmet', face: 'visor', badge: true, item: 'gun', sleeve: 'long', build: 'avg', jaw: 'square',
    pal: { skin: '#F0B890', hair: '#3C2414', hat: '#22308C', hat2: '#141C5C', visor: '#5CD8FF', shirt: '#2C50D8', shirt2: '#1C2C8C', sleeve: '#2C50D8', vest: '#2C3C5C', pants: '#1C2870', pants2: '#101848', shoes: '#18141C', belt: '#F0BC3C', accent: '#F0BC3C', glove: '#3C3C48', glove2: '#24242C' } };
  function buildHero(def) {
    const f = {};
    for (const a of ['f', 'uf', 'u', 'df']) f['stand_' + a] = fin(person(def, Object.assign({}, LS, ARMS[a])));
    for (const a of ['f', 'uf', 'df']) for (let i = 0; i < 4; i++) f['run' + i + '_' + a] = fin(person(def, Object.assign({}, RUN[i], ARMS[a])));
    f.crouch = fin(person(def, Object.assign({ hy: 3, legF: [3, 2, 3, 6], legB: [-2, 3, -4, 6] }, ARMS.f)));
    f.prone = E.finishAuto(E.rotate90(person(def, Object.assign({}, LS, ARMS.u)), true));
    const tuck = person(def, { hy: -3, legF: [4, 2, 1, 5], legB: [2, 3, -1, 6], armF: [3, 3, 5, 6], armB: [2, 3, 4, 6] }, null);
    for (let i = 0; i < 4; i++) { const c = rot(tuck, i); f['tuck' + i] = E.finish(c, c.width >> 1, Math.round(c.height * 0.72)); }
    f.air_d = fin(person(def, Object.assign({ legF: [2, 3, 2, 7], legB: [-1, 3, -2, 8] }, ARMS.d)));
    const hurt = person(def, { legF: [2, 4, 3, 9], legB: [-1, 4, -3, 9], lean: -2, armF: [1, -3, 3, -7], armB: [-2, -2, -4, -6] }, null);
    f.hurt = fin(hurt); f.down = E.finishAuto(E.rotate90(hurt, false));
    f.win = fin(person(def, Object.assign({}, LS, { armF: [1, -3, 2, -7], armB: [2, 2, 4, 6] }), null));
    return f;
  }

  // ---------------------------------------------------------------- Crooked Crown troops
  ART.ENEMY_DEFS = {
    runner: { d: Object.assign({}, D, { tw: 6 }), hat: 'bandana', shoe: 'sneaker', sleeve: 'none', tank: true, build: 'lean', limbK: 0.85, face: 'angry',
      pal: { skin: '#E8A880', hair: '#14101C', hat: '#F0BC3C', shirt: '#8C3CE0', top: '#8C3CE0', shirt2: '#5C1CA8', sleeve: '#E8A880', pants: '#3C2C8C', pants2: '#24185C', shoes: '#F4F4F0', shoeStripe: '#E40058' } },
    gunner: { d: D, hat: 'beanie', face: 'shades', item: 'gun', sleeve: 'long', jaw: 'square',
      pal: { skin: '#C07848', hair: '#14101C', hat: '#C8102C', hat2: '#7C0818', shirt: '#2C9C4C', shirt2: '#1C6C34', sleeve: '#2C9C4C', vest: '#3C4C34', pants: '#3C3C44', pants2: '#24242C', shoes: '#18141C', belt: '#F0BC3C', glove: '#24242C' } },
    grenadier: { d: Object.assign({}, D, { tw: 9 }), hat: 'beanie', beard: true, sleeve: 'short', build: 'heavy', jaw: 'square', face: 'angry',
      pal: { skin: '#F0B890', hair: '#B84818', hat: '#4C4C58', hat2: '#2C2C34', shirt: '#F08828', shirt2: '#C05C10', sleeve: '#F08828', vest: '#E86C10', pants: '#6C6C2C', pants2: '#44441C', shoes: '#18141C', belt: '#3C2410' } },
    duke: { d: Object.assign({}, D, { tw: 8 }), hat: 'crown', item: null, monocle: true, mustache: true, sleeve: 'long', jaw: 'square', rigBack: null,
      pal: { skin: '#F0C0A0', hair: '#F4F4F0', shirt: '#6C2C8C', shirt2: '#4C1C6C', sleeve: '#6C2C8C', vest: '#E8B020', pants: '#4C1C6C', pants2: '#30104C', shoes: '#14101C', belt: '#14101C', glove: '#F4F4F0', glove2: '#D8D8E0' } }
  };
  ART.ENEMY_DEFS.duke.rigBack = (g, J, T) => { const { sh, hip, cw, u } = J;
    T.part(g, T.pathOf(g, [[sh[0] - cw * 0.9, sh[1] - u * 0.2], [sh[0] + cw * 0.5, sh[1] - u * 0.4], [hip[0] - cw * 0.2, hip[1] + u * 9], [hip[0] - cw * 1.6, hip[1] + u * 10.5, hip[0] - cw * 2.4, hip[1] + u * 9], [hip[0] - cw * 2.1, hip[1], sh[0] - cw * 0.9, sh[1] - u * 0.2]]), '#A8102C', { r: cw, spec: true }); };
  function buildEnemies() {
    const out = {};
    const R = ART.ENEMY_DEFS.runner, Gn = ART.ENEMY_DEFS.gunner, Gr = ART.ENEMY_DEFS.grenadier;
    out.runner = {}; for (let i = 0; i < 4; i++) out.runner['run' + i] = fin(person(R, Object.assign({}, RUN[i], { armF: [2, 3, 5, 1], armB: [-2, 3, -4, 6] })));
    const rh = person(R, { legF: [2, 4, 3, 9], legB: [-1, 4, -3, 9], lean: -2, armF: [1, -3, 3, -7], armB: [-2, -2, -4, -6] }); out.runner.hurt = fin(rh); out.runner.down = E.finishAuto(E.rotate90(rh, false));
    out.gunner = {};
    for (const a of ['f', 'uf', 'u', 'df']) out.gunner['stand_' + a] = fin(person(Gn, Object.assign({}, LS, ARMS[a])));
    out.gunner.crouch = fin(person(Gn, Object.assign({ hy: 3, legF: [3, 2, 3, 6], legB: [-2, 3, -4, 6] }, ARMS.f)));
    for (let i = 0; i < 4; i++) out.gunner['run' + i] = fin(person(Gn, Object.assign({}, RUN[i], ARMS.f)));
    const gh = person(Gn, { legF: [2, 4, 3, 9], legB: [-1, 4, -3, 9], lean: -2, armF: [1, -3, 3, -7], armB: [-2, -2, -4, -6] }, null); out.gunner.hurt = fin(gh); out.gunner.down = E.finishAuto(E.rotate90(gh, false));
    out.grenadier = {
      idle: fin(person(Gr, Object.assign({}, LS, { armF: [2, 3, 4, 6], armB: [1, 3, 2, 7] }))),
      wind: fin(person(Gr, Object.assign({}, LS, { lean: -1, armF: [-2, -2, -3, -6], armB: [1, 3, 2, 7] }))),
      toss: fin(person(Gr, Object.assign({}, LS, { lean: 1, armF: [3, -2, 6, -4], armB: [1, 3, 2, 7] })))
    };
    const grh = person(Gr, { legF: [2, 4, 3, 9], legB: [-1, 4, -3, 9], lean: -2, armF: [1, -3, 3, -7], armB: [-2, -2, -4, -6] }); out.grenadier.hurt = fin(grh); out.grenadier.down = E.finishAuto(E.rotate90(grh, false));
    const Dk = ART.ENEMY_DEFS.duke;
    out.duke = { stand: fin(person(Dk, Object.assign({}, LS, { armF: [2, 3, 4, 6], armB: [1, 3, 2, 7] }))), hurt: fin(person(Dk, { legF: [2, 4, 3, 9], legB: [-1, 4, -3, 9], lean: -1, armF: [1, -3, 3, -7], armB: [-1, -3, -2, -7] })) };
    return out;
  }

  // ---------------------------------------------------------------- machines + props (canvas paths at display resolution)
  const SH = E.spriteHD;
  const bolt = (g, H, x, y, r) => { H.P(g, H.ell(g, x, y, r || 0.8, r || 0.8), '#B8BCCC', r || 0.8, true, { rim: false }); };
  const barrel = (g, H, x0, y0, x1, y1, r, col) => { H.P(g, H.seg(g, [x0, y0], [x1, y1], r, r * 0.9), col || '#2E3240', r, true); H.P(g, H.ell(g, x1, y1, r * 1.15, r * 1.15), '#4A4E60', r, true); H.P(g, H.ell(g, x1, y1, r * 0.55, r * 0.55), '#0A0A10', r * 0.5, false, { rim: false, ink: false }); };
  function turret(dir) { // dir 0..7, 0 = right, counter-clockwise steps of 45 deg in screen space (y down)
    const a = dir * Math.PI / 4;
    return SH(22, 22, (g, H) => {
      H.P(g, H.rrect(g, 3, 3, 16, 16, 2.5), '#6E7488', 4, true); H.P(g, H.rrect(g, 5, 5, 12, 12, 2), '#4A5064', 3);
      for (const [x, y] of [[4.8, 4.8], [17.2, 4.8], [4.8, 17.2], [17.2, 17.2]]) bolt(g, H, x, y, 0.7);
      barrel(g, H, 11, 11, 11 + Math.cos(a) * 9.5, 11 - Math.sin(a) * 9.5, 1.6);
      H.P(g, H.ell(g, 11, 11, 5, 5), '#2C4C8C', 5, true); H.P(g, H.ell(g, 11, 11, 2, 2), '#FF2C5C', 2, true, { rim: false });
    }, { ax: 11, ay: 11 });
  }
  function cannon(up) {
    return SH(26, 18, (g, H) => {
      if (up) barrel(g, H, 13, 8, 4, 1.5, 1.9); else barrel(g, H, 13, 8, 1.8, 8, 1.9);
      H.P(g, H.poly(g, [[3, 17], [5, 10], [21, 10], [23, 17]]), '#5A6074', 4, true); H.P(g, H.ell(g, 13, 9, 6, 4.2), '#3A4A6A', 4, true);
      H.P(g, H.rrect(g, 3, 15, 20, 2.2, 0.8), '#2A2C38', 1); for (let x = 6; x < 22; x += 5) bolt(g, H, x, 13, 0.6);
    }, { ax: 13, ay: 17 });
  }
  function drone(f, police) {
    return SH(22, 14, (g, H) => {
      const body = police ? '#F0F2F8' : '#5A2CB0', trim = police ? '#2C7CE8' : '#F0BC3C';
      for (const x of [4, 18]) { H.P(g, H.rrect(g, x - 1.5, 3, 3, 2.5, 0.8), '#4A4E60', 1.5); g.fillStyle = 'rgba(220,230,255,0.75)'; g.beginPath(); g.ellipse(x, 2.6, f ? 4.2 : 2.4, 0.7, 0, 0, Math.PI * 2); g.fill(); }
      H.P(g, H.rrect(g, 3.5, 4.5, 15, 6, 2.5), body, 3, true); H.P(g, H.rrect(g, 6, 9, 10, 2.2, 1), trim, 1.2, true);
      H.P(g, H.ell(g, 11, 7, 2.2, 1.6), police ? '#5CD8FF' : '#FF2C5C', 1.6, true, { rim: false });
      if (police) H.P(g, H.rrect(g, 9, 11, 4, 2, 0.6), '#F0BC3C', 1, true);
    }, { ax: 11, ay: 7 });
  }
  function capsule(letter) {
    return SH(16, 16, (g, H) => {
      H.P(g, H.poly(g, [[1, 7], [4, 4], [4, 10]]), '#F0BC3C', 2, true); H.P(g, H.poly(g, [[15, 7], [12, 4], [12, 10]]), '#F0BC3C', 2, true);
      H.P(g, H.ell(g, 8, 7.5, 5.8, 6), '#F0BC3C', 5, true); H.P(g, H.ell(g, 8, 7.5, 4.6, 4.8), '#2C50D8', 4, true);
      E.text(g, letter, 5.5, 4, '#FCFCFC');
    }, { ax: 8, ay: 8 });
  }
  function bullet(col, r) { return E.sprite(r * 2 + 3, r * 2 + 3, p => { p.ell(r + 1, r + 1, r, r, col); p.px(r, r, P.white); }, { ax: r + 1, ay: r + 1 }); }

  ART.build = function () {
    ART.hero = buildHero(ART.HERO);
    ART.enemy = buildEnemies();
    ART.turret = [0, 1, 2, 3, 4, 5, 6, 7].map(turret);
    ART.cannon = [cannon(false), cannon(true)];
    ART.drone = [drone(0), drone(1)]; ART.supply = [drone(0, true), drone(1, true)];
    ART.cap = {}; for (const k of ['S', 'R', 'L', 'B']) ART.cap[k] = capsule(k);
    ART.pshot = E.sprite(6, 6, p => { p.r(1, 1, 4, 4, P.sky); p.r(2, 2, 2, 2, P.white); }, { ax: 3, ay: 3, outline: false });
    ART.pshotS = E.sprite(6, 6, p => { p.r(1, 1, 4, 4, P.salmon); p.r(2, 2, 2, 2, P.white); }, { ax: 3, ay: 3, outline: false });
    ART.pshotR = E.sprite(5, 5, p => { p.r(1, 1, 3, 3, P.gold); p.px(2, 2, P.white); }, { ax: 2, ay: 2, outline: false });
    ART.pshotB = E.sprite(8, 8, p => { p.ell(4, 4, 3, 3, P.mint); p.r(3, 3, 2, 2, P.white); }, { ax: 4, ay: 4, outline: false });
    ART.ebullet = bullet(P.rose, 2); ART.ebig = bullet(P.tangerine, 4); ART.emine = bullet(P.magenta, 3);
    ART.grenade = SH(8, 8, (g, H) => { H.P(g, H.ell(g, 4, 4.5, 3, 3), '#4A5A34', 3, true); H.P(g, H.rrect(g, 3, 0.5, 2.5, 2, 0.5), '#F0BC3C', 1, true); }, { ax: 4, ay: 4 });
    ART.crateProj = SH(16, 16, (g, H) => { H.P(g, H.rrect(g, 1, 1, 14, 14, 1), '#D8904A', 5, true); g.strokeStyle = '#6A3818'; g.lineWidth = 1; g.strokeRect(2.5, 2.5, 11, 11); g.beginPath(); g.moveTo(3, 13); g.lineTo(13, 3); g.stroke(); }, { ax: 8, ay: 8 });
    ART.boom = [0, 1, 2, 3].map(f => E.sprite(28, 28, p => {
      const r = 4 + f * 3, cols = [P.white, P.gold, P.tangerine, P.lgray];
      p.ell(14, 14, r, r, cols[f]); if (f < 3) p.ell(14, 14, Math.max(1, r - 3), Math.max(1, r - 3), cols[Math.max(0, f - 1)]);
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + f; p.r(14 + Math.cos(a) * (r + 2), 14 + Math.sin(a) * (r + 2), 2, 2, P.gold); }
    }, { ax: 14, ay: 14, outline: false }));
    ART.stars = E.sprite(16, 8, p => { p.rows(['..y.....y..', '.yyy...yyy.', '..y..y..y..', '....yyy....', '.....y.....'], { y: P.gold }, 2, 1); }, { ax: 8, ay: 4, outline: false });
    ART.cuffs = E.sprite(16, 9, p => { p.ell(4, 4, 3, 3, P.lgray); p.ell(11, 4, 3, 3, P.lgray); p.r(3, 3, 3, 3, P.black); p.r(10, 3, 3, 3, P.black); p.r(7, 4, 2, 1, P.white); }, { ax: 8, ay: 4 });
    ART.lifeIcon = E.sprite(8, 10, p => { p.rows(['..gg..', '.gGGg.', 'gGGGGg', 'gGwwGg', 'gGGGGg', '.gGGg.', '..gg..'], { g: P.gold, G: P.cream, w: P.royal }, 1, 1); }, { ax: 0, ay: 0 });
    ART.bunker = SH(26, 18, (g, H) => { H.P(g, H.pathOf(g, [[1, 17], [2, 6], [5, 3.5], [21, 3.5], [24, 6], [25, 17]]), '#8A8C9C', 6, true); H.P(g, H.rrect(g, 5, 7.5, 16, 3.5, 1.2), '#121018', 1.5); for (let x = 1.5; x < 24; x += 6) H.P(g, H.ell(g, x + 2.5, 15, 3.2, 2.2), '#A8946C', 2.5, true); }, { ax: 13, ay: 17 });
    ART.vent = E.sprite(18, 6, p => { p.r(1, 1, 16, 4, P.dgray); for (let x = 3; x < 16; x += 3) p.r(x, 2, 1, 2, P.black); }, { ax: 9, ay: 5 });
  };

  // ---------------------------------------------------------------- bosses (composited parts, canvas paths at display resolution)
  ART.buildBosses = function () {
    const B = ART.bossArt = {};
    const thug = (g, H, x, y) => { // driver / pilot head and shoulders
      H.P(g, H.rrect(g, x - 5, y + 3, 10, 6, 2.5), '#6C44B8', 3, true);
      H.P(g, H.ell(g, x, y, 3.4, 3.8), '#E0A070', 3, true); H.P(g, H.ell(g, x + 2.6, y + 0.5, 1, 1.4), '#E0A070', 1, false, { rim: false });
      H.P(g, H.pathOf(g, [[x - 3.6, y - 0.6], [x - 3.4, y - 4.6, x + 0.5, y - 4.8], [x + 3.8, y - 4.2, x + 3.6, y - 0.8]]), '#C8102C', 2.5, true);
      g.fillStyle = '#14101C'; g.fillRect(x + 1.2, y - 0.4, 1.1, 1.1); g.fillRect(x + 0.6, y - 1.4, 2, 0.5);
    };
    B.forklift = SH(58, 44, (g, H) => {
      H.P(g, H.rrect(g, 9.5, 3, 4.5, 36, 1), '#4A5064', 2.5, true); for (let y = 6; y < 36; y += 3) { g.fillStyle = '#20222C'; g.fillRect(11.2, y, 1.2, 1.6); }
      for (const x of [22, 44]) H.P(g, H.rrect(g, x - 1, 3, 2.2, 15, 0.8), '#3A3E4C', 1.2, true);
      H.P(g, H.rrect(g, 20, 1, 28, 3, 1), '#3A3E4C', 1.5, true);
      thug(g, H, 32, 10);
      H.P(g, H.rrect(g, 45, 22, 11, 14, 2), '#3A3E4C', 4, true);
      H.P(g, H.pathOf(g, [[16, 18], [18, 15.5], [50, 15.5], [52, 18], [52, 36], [16, 36]]), '#F0BC3C', 7, true);
      g.save(); g.beginPath(); g.rect(17, 31, 34, 4); g.clip(); for (let x = 12; x < 54; x += 4) { g.fillStyle = '#18141C'; g.beginPath(); g.moveTo(x, 35); g.lineTo(x + 2, 31); g.lineTo(x + 4, 31); g.lineTo(x + 2, 35); g.fill(); } g.restore();
      E.text(g, 'CROWN', 20, 22.5, '#2A1A08');
      for (const x of [24, 46]) { H.P(g, H.ell(g, x, 37, 6, 6), '#1C1C24', 6, true); H.P(g, H.ell(g, x, 37, 3, 3), '#A8ACBC', 3, true); bolt(g, H, x, 37, 0.8); }
    }, { ax: 30, ay: 43 });
    B.fork = SH(16, 6, (g, H) => { H.P(g, H.rrect(g, 0, 3, 14, 2, 0.6), '#C8CCD8', 1.2, true); H.P(g, H.rrect(g, 12, 0, 3, 5.5, 0.8), '#6A6E80', 1.5, true); }, { ax: 14, ay: 4 });
    B.hull = SH(130, 66, (g, H) => {
      // superstructure
      H.P(g, H.rrect(g, 40, 1, 60, 20, 2), '#DCE0EA', 8, true); H.P(g, H.rrect(g, 38, 0.5, 64, 2.5, 1), '#9AA0B4', 1.5, true);
      for (let x = 44; x < 96; x += 10) { H.P(g, H.rrect(g, x, 6, 6.5, 6.5, 1), '#1C2C48', 3); g.fillStyle = 'rgba(160,220,255,0.6)'; g.beginPath(); g.moveTo(x + 1, 12); g.lineTo(x + 4, 6.5); g.lineTo(x + 5.5, 6.5); g.lineTo(x + 2.5, 12); g.fill(); }
      g.fillStyle = '#A8102C'; g.fillRect(40, 15, 60, 2);
      // hull
      H.P(g, H.pathOf(g, [[0, 20], [130, 20], [130, 64], [24, 64], [0, 40]]), '#3C4660', 14, true);
      H.P(g, H.pathOf(g, [[0, 20], [130, 20], [130, 27], [0, 27]]), '#C8182C', 4, true);
      H.P(g, H.rrect(g, -1, 17, 132, 4, 1.2), '#F0BC3C', 2, true);
      for (let x = 4; x < 128; x += 6) { g.fillStyle = '#8A6010'; g.fillRect(x, 15, 0.8, 2.5); } g.fillStyle = '#8A6010'; g.fillRect(0, 14.5, 130, 0.8);
      for (let x = 10; x < 120; x += 16) { H.P(g, H.ell(g, x, 32, 3.2, 3.2), '#B8BCCC', 3, true); H.P(g, H.ell(g, x, 32, 2.1, 2.1), '#5CD8FF', 2, true, { rim: false }); g.fillStyle = 'rgba(160,80,50,0.45)'; g.fillRect(x - 0.5, 35.5, 1, 5 + (x % 7)); }
      for (let x = 30; x < 130; x += 20) { g.fillStyle = 'rgba(10,8,20,0.35)'; g.fillRect(x, 27, 0.6, 37); }
      for (let y = 46; y < 62; y += 5) for (let x = 30 + (y % 2) * 3; x < 128; x += 7) { g.fillStyle = '#5A6680'; g.fillRect(x, y, 0.7, 0.7); }
      H.P(g, H.rrect(g, 37, 42, 56, 11, 1.5), '#1A1C28', 2); E.text(g, 'BARNACLE', 40, 44, '#F0BC3C');
    }, { ax: 0, ay: 65 });
    B.deckGun = SH(22, 14, (g, H) => { barrel(g, H, 11, 6, 0.8, 2.2, 1.5); H.P(g, H.rrect(g, 3, 7, 16, 6.5, 1.5), '#4A5064', 3, true); H.P(g, H.ell(g, 11, 6.5, 5, 4), '#5A6A90', 4, true); bolt(g, H, 6, 11, 0.6); bolt(g, H, 16, 11, 0.6); }, { ax: 11, ay: 13 });
    const coreArt = (g, H) => {
      H.P(g, H.rrect(g, 1, 1, 24, 18, 3), '#4A4E62', 5, true); H.P(g, H.rrect(g, 3.5, 3, 19, 14, 2.5), '#121018', 3);
      const gr = g.createRadialGradient(12, 8.5, 0.5, 13, 10, 6.5); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.25, '#FF9AB8'); gr.addColorStop(0.6, '#FF1C5C'); gr.addColorStop(1, '#6A0828');
      g.fillStyle = gr; g.beginPath(); g.arc(13, 10, 6, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#2A0410'; g.lineWidth = 0.5; g.stroke();
      for (const [x, y] of [[3, 3], [23, 3], [3, 17], [23, 17]]) bolt(g, H, x, y, 0.7);
    };
    B.core = SH(26, 20, coreArt, { ax: 13, ay: 10 });
    const shutter = (w, h) => SH(w, h, (g, H) => { H.P(g, H.rrect(g, 0.5, 0.5, w - 1, h - 1, 2.5), '#5A6074', 6, true); H.P(g, H.rrect(g, 2.5, 2.5, w - 5, h - 5, 1.5), '#7A8098', 4, true);
      g.save(); g.beginPath(); g.rect(3, h / 2 - 1.6, w - 6, 3.2); g.clip(); for (let x = -2; x < w; x += 3) { g.fillStyle = '#F0BC3C'; g.beginPath(); g.moveTo(x, h / 2 + 1.6); g.lineTo(x + 1.5, h / 2 - 1.6); g.lineTo(x + 3, h / 2 - 1.6); g.lineTo(x + 1.5, h / 2 + 1.6); g.fill(); } g.restore();
      for (const [x, y] of [[2, 2], [w - 2, 2], [2, h - 2], [w - 2, h - 2]]) bolt(g, H, x, y, 0.7); }, { ax: 0, ay: 0 });
    B.shutter = shutter(24, 18); B.shutterBig = shutter(28, 28);
    B.hornet = [0, 1].map(f => SH(56, 30, (g, H) => {
      H.P(g, H.rrect(g, 26, 5.5, 3, 5, 0.8), '#3A3E4C', 1.5, true);
      H.P(g, H.pathOf(g, [[1, 9], [3.5, 9], [5, 13], [12, 13], [12, 16.5], [4, 16.5], [1, 17.5]]), '#4A1C98', 3, true);
      H.P(g, H.pathOf(g, [[10, 11.5], [34, 9.5], [44, 11], [46, 16], [42, 21.5], [14, 22], [10, 18]]), '#6A34D0', 8, true);
      H.P(g, H.pathOf(g, [[34, 10.2], [43, 11.6], [45.5, 16.5], [36, 16.5]]), '#7FD8FF', 4, true);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.moveTo(37, 15.5); g.lineTo(39.5, 11); g.lineTo(41, 11.2); g.lineTo(38.5, 15.5); g.fill();
      H.P(g, H.rrect(g, 13, 15, 22, 1.8, 0.6), '#F0BC3C', 1, true);
      H.P(g, H.rrect(g, 22, 19.5, 10, 4, 1.5), '#F0BC3C', 2, true); barrel(g, H, 30, 21.5, 37, 22.5, 0.9);
      for (const x of [17, 37]) H.P(g, H.rrect(g, x - 0.6, 21, 1.4, 3.5, 0.5), '#3A3E4C', 1);
      H.P(g, H.rrect(g, 13, 24, 28, 1.8, 0.9), '#3A3E4C', 1, true);
      g.fillStyle = 'rgba(220,230,255,0.8)'; if (f) { g.fillRect(5, 4, 46, 1.4); } else { g.fillRect(17, 4, 22, 1.4); g.fillStyle = 'rgba(220,230,255,0.3)'; g.fillRect(6, 4.2, 44, 1); }
      g.fillStyle = 'rgba(220,230,255,0.55)'; g.beginPath(); g.ellipse(2, 13, 0.8, f ? 4 : 2, 0, 0, Math.PI * 2); g.fill();
    }, { ax: 28, ay: 15 }));
    B.caboose = SH(110, 72, (g, H) => {
      H.P(g, H.pathOf(g, [[4, 14], [8, 9], [104, 9], [108, 14], [108, 62], [4, 62]]), '#3E4456', 14, true);
      H.P(g, H.rrect(g, 2, 8, 108, 3.5, 1.5), '#6A7088', 2, true);
      for (let x = 8; x < 106; x += 8) { bolt(g, H, x, 17, 0.55); bolt(g, H, x, 59, 0.55); g.fillStyle = 'rgba(10,8,20,0.35)'; g.fillRect(x + 3.8, 14, 0.5, 46); }
      H.P(g, H.rrect(g, 8, 22, 20, 30, 2), '#2C3C5C', 5, true); H.P(g, H.rrect(g, 10.5, 24.5, 15, 25, 1.5), '#0E0C16', 3); for (let y = 27; y < 49; y += 4) { g.fillStyle = '#3A4A6A'; g.fillRect(11, y, 14, 0.6); }
      for (let y = 18; y < 58; y += 4) { g.fillStyle = '#9AA0B4'; g.fillRect(98, y, 6, 0.8); } g.fillStyle = '#9AA0B4'; g.fillRect(98, 16, 0.8, 44); g.fillRect(103.2, 16, 0.8, 44);
      H.P(g, H.rrect(g, 34, 42, 44, 13, 1.5), '#B8102C', 4, true); E.text(g, 'IRON', 44, 45, '#F0BC3C');
      g.fillStyle = 'rgba(160,80,50,0.4)'; for (let i = 0; i < 14; i++) g.fillRect(30 + (i * 37) % 70, 20 + (i * 13) % 18, 0.6, 4 + (i % 5));
      H.P(g, H.rrect(g, 0, 59, 110, 8.5, 1.5), '#16141C', 3);
      for (const x of [20, 90]) { H.P(g, H.ell(g, x, 67.5, 6.5, 4.5), '#5A5E70', 4, true); H.P(g, H.ell(g, x, 67.5, 2.6, 2), '#A8ACBC', 2, true); }
      H.P(g, H.ell(g, 56, 8, 3, 2), '#FF2C3C', 2, true, { rim: false });
    }, { ax: 0, ay: 71 });
    B.gatling = [0, 1, 2, 3, 4].map(f => SH(30, 20, (g, H) => {
      const a = Math.PI - f * Math.PI / 8, c = Math.cos(a), s = -Math.sin(a), nx = -s, ny = c;
      for (const k of [-1.4, 0, 1.4]) barrel(g, H, 15 + nx * k, 10 + ny * k, 15 + c * 14 + nx * k, 10 + s * 14 + ny * k, 0.85, '#2A2C38');
      H.P(g, H.ell(g, 15 + c * 8, 10 + s * 8, 2.2, 2.2), '#4A4E60', 2, true);
      H.P(g, H.pathOf(g, [[6, 19], [8, 11], [22, 11], [24, 19]]), '#6A7088', 4, true); H.P(g, H.ell(g, 15, 10, 6, 5), '#3A4A6A', 5, true); bolt(g, H, 15, 10, 1);
    }, { ax: 15, ay: 19 }));
    B.steamCore = SH(30, 30, (g, H) => {
      H.P(g, H.ell(g, 15, 15, 13.5, 13.5), '#4A4E62', 8, true);
      const gr = g.createRadialGradient(14, 13, 1, 15, 15, 10); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.3, '#FFE890'); gr.addColorStop(0.65, '#FF9030'); gr.addColorStop(1, '#A83010');
      g.fillStyle = gr; g.beginPath(); g.arc(15, 15, 10, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#2A1408'; g.lineWidth = 0.9; for (let k = -6; k <= 6; k += 4) { g.beginPath(); g.moveTo(15 + k, 6); g.lineTo(15 + k, 24); g.stroke(); }
      for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4; bolt(g, H, 15 + Math.cos(an) * 12, 15 + Math.sin(an) * 12, 0.7); }
    }, { ax: 15, ay: 15 });
    B.sentinel = [0, 1].map(f => SH(40, 50, (g, H) => {
      H.P(g, H.rrect(g, 18.5, 1.5, 3, 7, 1), '#8A90A4', 1.5, true); H.P(g, H.ell(g, 20, 1.5, 1.2, 1.2), '#FF2C5C', 1, true, { rim: false });
      H.P(g, H.rrect(g, 20.5, 29, 7, 12 + f * 2, 2.5), '#6A7088', 3, true); H.P(g, H.rrect(g, 19.5, 39 + f * 2, 11, 6.5, 2), '#3A3E4C', 3, true);
      H.P(g, H.pathOf(g, [[13, 30], [12, 34], [12.5, 40 - f * 2], [18, 40 - f * 2], [18.5, 30]]), '#8A90A4', 3, true); H.P(g, H.rrect(g, 9.5, 41 - f * 2, 11, 6.5, 2), '#4A4E60', 3, true);
      H.P(g, H.rrect(g, 3.5, 11, 7, 15, 3), '#7A8094', 3, true); H.P(g, H.rrect(g, 1.5, 24, 9, 4.5, 1.5), '#3A3E4C', 2, true);
      H.P(g, H.pathOf(g, [[10, 10], [13, 7.5], [27, 7.5], [30, 10], [30, 26], [26, 30.5], [14, 30.5], [10, 26]]), '#D8DCE6', 8, true);
      H.P(g, H.rrect(g, 12.5, 13.5, 15, 5.5, 2), '#121018', 2); H.P(g, H.ell(g, 15.5 + f * 8, 16.2, 2.2, 1.6), '#FF2C5C', 1.6, true, { rim: false });
      H.P(g, H.rrect(g, 12, 22, 16, 2.2, 1), '#F0BC3C', 1.5, true);
      H.P(g, H.rrect(g, 29.5, 11, 7, 15, 3), '#9AA0B4', 3, true); H.P(g, H.rrect(g, 29.5, 24, 9, 4.5, 1.5), '#4A4E60', 2, true);
    }, { ax: 20, ay: 49 }));
    B.goliath = SH(96, 100, (g, H) => {
      const GOLD = '#F0BC3C', DG = '#B8861C', STEEL = '#3E4458';
      // legs
      for (const x of [30, 52]) { H.P(g, H.rrect(g, x, 60, 14, 14, 3), STEEL, 6, true); H.P(g, H.ell(g, x + 7, 75, 6, 5), DG, 5, true); H.P(g, H.rrect(g, x + 1, 77, 12, 10, 2.5), STEEL, 5, true); }
      for (const x of [24, 48]) { H.P(g, H.pathOf(g, [[x, 98], [x + 2, 88], [x + 10, 85.5], [x + 18, 86], [x + 24, 92], [x + 24, 98]]), '#2A2C38', 6, true); H.P(g, H.rrect(g, x + 2, 95.5, 20, 2.5, 1), GOLD, 1.2, true); }
      // arms
      for (const [x, s] of [[14, 1], [70, -1]]) {
        H.P(g, H.rrect(g, x, 22, 12, 30, 4), DG, 6, true); g.fillStyle = '#6A4C10'; g.fillRect(x + 5.5, 26, 1, 22); H.P(g, H.rrect(g, x + 4, 30, 4, 12, 1.5), '#C8CCD8', 2, true);
        H.P(g, H.rrect(g, x - 4 + (s < 0 ? 4 : 0), 49, 16, 11, 3), STEEL, 6, true); for (let k = 0; k < 3; k++) H.P(g, H.ell(g, x + 1 + k * 4 + (s < 0 ? 2 : -2), 59, 1.4, 1.4), '#121018', 1, false, { rim: false });
      }
      // hip skirt + torso
      H.P(g, H.pathOf(g, [[28, 56], [68, 56], [64, 64], [32, 64]]), STEEL, 5, true);
      H.P(g, H.pathOf(g, [[26, 24], [32, 19], [64, 19], [70, 24], [70, 52], [62, 60], [34, 60], [26, 52]]), GOLD, 16, true);
      for (const y of [28, 54]) { g.fillStyle = '#8A6010'; g.fillRect(28, y, 40, 0.8); }
      H.P(g, H.rrect(g, 35, 33, 26, 20, 3), '#121018', 4); for (let y = 36; y < 52; y += 3) { g.fillStyle = '#2A2434'; g.fillRect(37, y, 22, 0.8); }
      for (const [x, y] of [[29, 24], [67, 24], [29, 50], [67, 50]]) bolt(g, H, x, y, 0.9);
      // cockpit + crown
      H.P(g, H.pathOf(g, [[32, 21], [33, 9], [38, 5.5], [58, 5.5], [63, 9], [64, 21]]), '#8C2CA8', 8, true);
      H.P(g, H.pathOf(g, [[36, 16], [37, 10], [40, 8.5], [56, 8.5], [59, 10], [60, 16]]), '#5CC8FF', 5, true);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(40, 15); g.lineTo(43, 9.5); g.lineTo(45.5, 9.5); g.lineTo(42.5, 15); g.fill();
      H.P(g, H.pathOf(g, [[44, 6], [44, 1.5], [46, 3.5], [48, 0.8], [50, 3.5], [52, 1.5], [52, 6]]), GOLD, 2, true); H.P(g, H.ell(g, 48, 4.5, 0.8, 0.8), '#E8204A', 0.8, false, { rim: false });
    }, { ax: 48, ay: 99 });
    B.shoulder = SH(26, 18, (g, H) => { barrel(g, H, 7, 10.5, 0.8, 10.5, 2); H.P(g, H.rrect(g, 3, 4, 21, 13, 3), '#8C2CA8', 6, true); H.P(g, H.rrect(g, 4, 4.5, 19, 2.5, 1), '#D090F0', 1.2, true); H.P(g, H.ell(g, 15, 10.5, 4, 4), '#F0BC3C', 4, true); bolt(g, H, 15, 10.5, 1); }, { ax: 13, ay: 10 });
    B.pod = [0, 1].map(f => SH(44, 30, (g, H) => {
      for (const [x, h] of [[11, 4 + f * 2], [33, 4 + (1 - f) * 2]]) { g.fillStyle = '#FF9030'; g.beginPath(); g.moveTo(x - 3, 24); g.quadraticCurveTo(x, 24 + h * 2.2, x + 3, 24); g.fill(); g.fillStyle = '#FFF0A0'; g.beginPath(); g.moveTo(x - 1.5, 24); g.quadraticCurveTo(x, 24 + h * 1.2, x + 1.5, 24); g.fill(); }
      H.P(g, H.ell(g, 22, 17, 18, 9.5), '#F0BC3C', 9, true); for (const x of [11, 33]) H.P(g, H.rrect(g, x - 3, 21, 6, 4, 1.2), '#3A3E4C', 2, true);
      // the Duke inside the dome
      H.P(g, H.ell(g, 22, 13, 5, 5.5), '#F0C0A0', 4, true); H.P(g, H.pathOf(g, [[17, 9], [17, 5], [19, 7], [22, 4], [25, 7], [27, 5], [27, 9]]), '#F0BC3C', 2, true);
      g.fillStyle = '#14101C'; g.fillRect(19.3, 12, 1.2, 1.2); g.fillRect(23.5, 12, 1.2, 1.2); g.fillStyle = '#F4F4F0'; g.fillRect(19, 15.5, 6, 1.2); g.strokeStyle = '#F0BC3C'; g.lineWidth = 0.4; g.beginPath(); g.arc(24.1, 12.6, 1.4, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(150,220,255,0.35)'; g.beginPath(); g.ellipse(22, 13, 12, 8, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#E0F4FF'; g.lineWidth = 0.6; g.beginPath(); g.ellipse(22, 13, 12, 8, 0, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
      H.P(g, H.rrect(g, 8, 15.5, 28, 2.2, 1), '#B8861C', 1.2, true);
    }, { ax: 22, ay: 16 }));
  };
})();
