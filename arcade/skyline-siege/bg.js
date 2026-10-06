/* Skyline Siege: parallax backdrops + level tiles, painted at display resolution with the engine's E.BK kit. */
(function () {
  'use strict';
  const E = window.RetroEngine;
  const BG = window.SS_BG = {};
  const K = E.BK, R = K.R;

  // ---------------------------------------------------------------- parallax layers per theme (512 wide, tiled)
  BG.layers = function (theme) {
    const r = K.rng(theme.length * 77), F = K.layer(512, 180), M = K.layer(512, 180), fg = F.g, mg = M.g;
    if (theme === 'docks') {
      // harbour at night: skyline across the water, a lit suspension bridge, reflections
      K.sky(fg, 512, 140, [[0, '#080622'], [0.4, '#1C1660'], [0.75, '#48288A'], [1, '#B04A8C']], r, 170);
      K.moon(fg, 420, 34, 10);
      K.skyline(fg, 512, 138, r, { col: '#3A2C7A', edge: '#54449C', minW: 12, maxW: 26, minH: 40, maxH: 92, win: ['#9C8CE0'], density: 0.1, beacon: '#FF4060' });
      K.skyline(fg, 512, 138, r, { col: '#221A58', edge: '#342A7C', minW: 14, maxW: 30, minH: 20, maxH: 60, win: ['#FFD27A', '#FFE9B0', '#7FD8FF'], density: 0.22 });
      // bridge
      for (const tx of [120, 330]) { R(fg, tx, 70, 4, 70, '#2A2050'); R(fg, tx, 70, 1, 70, '#5A4C9C'); R(fg, tx - 2, 84, 8, 2, '#2A2050'); R(fg, tx - 2, 104, 8, 2, '#2A2050'); R(fg, tx + 1, 68, 2, 2, '#FF4060'); }
      fg.strokeStyle = '#6A5CB0'; fg.lineWidth = 0.6; fg.beginPath(); fg.moveTo(0, 116); fg.quadraticCurveTo(60, 120, 122, 71); fg.quadraticCurveTo(226, 128, 332, 71); fg.quadraticCurveTo(420, 120, 512, 116); fg.stroke();
      R(fg, 0, 118, 512, 2.5, '#2A2050'); for (let x = 2; x < 512; x += 8) R(fg, x, 118.5, 1, 1, '#FFE6A0');
      // water
      K.V(fg, 0, 138, 512, 42, ['#1A1A5C', '#202C7C', '#141C50']);
      for (let i = 0; i < 260; i++) { const x = r() * 512, y = 140 + r() * 40, w = 2 + r() * 8; R(fg, x, y, w, 0.5, r() < 0.5 ? '#3C5CC8' : '#5C7CE8'); }
      for (let i = 0; i < 90; i++) { const x = r() * 512, y = 140 + r() * 36; R(fg, x, y, 1 + r() * 3, 0.5, ['#FFD27A', '#FF7AB8', '#7FD8FF'][Math.floor(r() * 3)]); }
      K.V(fg, 0, 138, 512, 2, ['#5A4CA0', '#1A1A5C']);
      // mid: gantry cranes, container stacks, a pier shed
      for (let x = 30; x < 512; x += 250) {
        for (const lx of [0, 40]) { K.Hz(mg, x + lx, 40, 5, 104, ['#F0703C', '#C04818', '#7A2808']); }
        for (let k = 0; k < 9; k++) K.line(mg, [x + 4, 48 + k * 10, x + 41, 58 + k * 10], 0.9, '#A83C10');
        K.V(mg, x - 34, 34, 126, 7, ['#FF9050', '#D85C20', '#8A3410']); R(mg, x - 34, 34, 126, 0.5, '#FFD0A0');
        for (let k = -30; k < 90; k += 6) K.line(mg, [x + k, 41, x + k + 3, 34], 0.6, '#8A3410');
        R(mg, x + 81.5, 41, 1, 38, '#2A2236'); K.V(mg, x + 74, 78, 16, 11, ['#6A6A7C', '#3A3A4C']); R(mg, x + 74, 78, 16, 0.5, '#A8A8BC');
        R(mg, x + 10, 22, 20, 12, '#20182C'); R(mg, x + 12, 24, 7, 5, '#FFE090'); K.glowSpot(mg, x + 15, 26, 10, 8, 'rgba(255,220,140,A)', 0.3);
        R(mg, x + 60, 30, 1, 4, '#20182C'); R(mg, x + 59.5, 29, 2, 1.5, '#FF3050');
      }
      const ccols = ['#C83030', '#2C7CC8', '#2C9C5C', '#D8A020', '#8C3CC0'];
      for (let x = 0; x < 512; x += 34) { const h = 1 + Math.floor(r() * 3); for (let k = 0; k < h; k++) { const c = ccols[Math.floor(r() * 5)], y = 140 - (k + 1) * 11; K.Hz(mg, x + 1, y, 32, 10.5, [K.lit(c, 0.15), c, K.dk(c, 0.35)]); for (let rr = x + 3; rr < x + 33; rr += 2) R(mg, rr, y + 1, 0.5, 9, K.dk(c, 0.3)); R(mg, x + 1, y, 32, 0.5, K.lit(c, 0.45)); } }
      K.V(mg, 0, 139, 512, 3, ['#3A3448', '#1A1624']);
    } else if (theme === 'train') {
      // dusk run on the express: big low sun, layered skyline, an elevated trestle racing past
      K.sky(fg, 512, 180, [[0, '#1C1460'], [0.3, '#5A2088'], [0.55, '#C83C7C'], [0.78, '#FF8048'], [1, '#FFC860']], r, 40);
      K.glowSpot(fg, 120, 132, 70, 50, 'rgba(255,220,120,A)', 0.4); K.ell(fg, 120, 132, 22, 22, '#FFD860'); K.ell(fg, 120, 132, 19, 19, '#FFE890');
      for (let k = 0; k < 4; k++) R(fg, 96, 128 + k * 5, 48, 1.5, '#FF9858');
      K.skyline(fg, 512, 180, r, { col: '#8A2C78', edge: '#B04C98', minW: 14, maxW: 28, minH: 50, maxH: 110, win: ['#FFD27A'], density: 0.08 });
      K.skyline(fg, 512, 180, r, { col: '#4A1C60', edge: '#6A3080', minW: 16, maxW: 34, minH: 30, maxH: 74, win: ['#FFD27A', '#FFE9B0'], density: 0.16 });
      K.skyline(mg, 512, 180, r, { col: '#2C1448', edge: '#46246A', minW: 22, maxW: 44, minH: 30, maxH: 70, win: ['#FFD27A', '#FFE9B0', '#7FD8FF'], density: 0.3, ws: 1.5, wh: 1.5, wx: 3.5, wy: 4 });
      for (let x = 0; x < 512; x += 64) { K.Hz(mg, x, 150, 6, 30, ['#5A4A6A', '#2A2034', '#140C1C']); K.line(mg, [x + 3, 152, x + 35, 178], 1.6, '#2A2034'); K.line(mg, [x + 67, 152, x + 35, 178], 1.6, '#2A2034'); }
      K.V(mg, 0, 145, 512, 6, ['#6A5A7C', '#3A2C48', '#1A1224']); R(mg, 0, 145, 512, 0.5, '#B8A8D0'); for (let x = 0; x < 512; x += 4) R(mg, x, 148, 1, 1, '#140C1C');
    } else {
      // Crown Tower: night skyline behind floor-to-ceiling windows
      K.sky(fg, 512, 180, [[0, '#060418'], [0.5, '#141048'], [1, '#2C1C6C']], r, 150);
      K.skyline(fg, 512, 180, r, { col: '#2A2468', edge: '#3E3688', minW: 12, maxW: 26, minH: 60, maxH: 150, win: ['#8C7CD8', '#FFD27A'], density: 0.14, beacon: '#FF4060' });
      K.skyline(fg, 512, 180, r, { col: '#18144A', edge: '#2A2468', minW: 16, maxW: 30, minH: 30, maxH: 100, win: ['#FFD27A', '#FFE9B0', '#7FD8FF'], density: 0.22 });
      K.V(mg, 0, 0, 512, 180, ['#3A1C6C', '#2C1458', '#200C44']);
      for (let x = 0; x < 512; x += 3) R(mg, x, 0, 0.5, 180, 'rgba(255,255,255,0.03)');
      for (let x = 0; x < 512; x += 64) {
        mg.clearRect(x + 8, 30, 48, 90);
        R(mg, x + 6, 27, 52, 3, '#F0BC3C'); R(mg, x + 6, 27, 52, 0.5, '#FFF0B0'); R(mg, x + 6, 120, 52, 3, '#F0BC3C'); R(mg, x + 6, 122.5, 52, 0.5, '#8A6010');
        K.Hz(mg, x + 30.5, 30, 3, 90, ['#8C4CB0', '#5C2C80', '#3C1C5C']);
        mg.fillStyle = 'rgba(200,220,255,0.10)'; mg.beginPath(); mg.moveTo(x + 10, 120); mg.lineTo(x + 24, 30); mg.lineTo(x + 29, 30); mg.lineTo(x + 15, 120); mg.fill();
        K.Hz(mg, x, 0, 6, 180, ['#8C4CB0', '#5C2C80', '#3C1C5C']); R(mg, x + 0.5, 0, 0.5, 180, '#C090E0');
      }
      for (let x = 0; x < 512; x += 128) { mg.fillStyle = '#F0BC3C'; mg.beginPath(); mg.moveTo(x + 61, 146); mg.lineTo(x + 61, 140); mg.lineTo(x + 63.5, 143); mg.lineTo(x + 66, 139); mg.lineTo(x + 68.5, 143); mg.lineTo(x + 71, 140); mg.lineTo(x + 71, 146); mg.fill(); K.ell(mg, x + 66, 143.5, 0.9, 0.9, '#E8204A'); }
      K.V(mg, 0, 127, 512, 3, ['#FFE070', '#B08010']); R(mg, 0, 130, 512, 50, '#1C0C34');
      for (let x = 0; x < 512; x += 16) { R(mg, x, 130, 0.5, 50, '#2C1848'); }
    }
    K.done(F); K.done(M);
    return { far: F.lo, farHi: F.hi, mid: M.lo, midHi: M.hi };
  };

  // ---------------------------------------------------------------- tile layer (whole level pre-rendered, 2 px per unit)
  BG.tiles = function (map, theme) {
    const cols = map[0].length, Ly = K.layer(cols * 16, 192), g = Ly.g, r = K.rng(cols);
    const T = (x, y) => (y < 0 || y >= 12) ? '.' : (x < 0 || x >= cols) ? '#' : map[y][x];
    const solid = ch => ch === '#' || ch === '[';
    const crateCols = ['#C83030', '#20A050', '#2C5CD8', '#C8A020'];
    const water = (X, Y, y0) => { K.V(g, X, Y + y0, 16, 16 - y0, ['#3C64E0', '#2038B0', '#141C70']); R(g, X, Y + y0, 16, 0.5, '#A8C8FF'); R(g, X + (X * 7 / 16) % 10, Y + y0 + 4, 5, 0.5, '#6C94FF'); R(g, X + (X * 3 / 16 + 6) % 10, Y + y0 + 8, 4, 0.5, '#4C74F0'); };
    for (let y = 0; y < 12; y++) for (let x = 0; x < cols; x++) {
      const ch = T(x, y), X = x * 16, Y = y * 16, top = !solid(T(x, y - 1)) && T(x, y - 1) !== '=';
      if (ch === '#') {
        if (theme === 'docks') {
          const piling = () => { K.Hz(g, X + 3, Y, 5, 16, ['#8A5A34', '#5A3418', '#2A1408']); R(g, X + 4, Y, 0.5, 16, '#B88050'); };
          if (top) {
            K.V(g, X, Y, 16, 5, ['#FFB868', '#E08A40', '#A85A20']); R(g, X, Y, 16, 0.5, '#FFE4B0'); R(g, X + (x % 2 ? 5 : 11), Y, 0.5, 5, '#7A3C10');
            R(g, X + 1.5, Y + 2.5, 0.6, 0.6, '#5A2C08'); R(g, X + 13.5, Y + 2.5, 0.6, 0.6, '#5A2C08');
            K.V(g, X, Y + 5, 16, 2, ['#7A3C10', '#4A2008']);
            K.Hz(g, X + 3, Y + 7, 5, 9, ['#8A5A34', '#5A3418', '#2A1408']); R(g, X + 4, Y + 7, 0.5, 9, '#B88050');
            if (x % 2 === 0) K.line(g, [X + 8, Y + 8, X + 16, Y + 15], 0.8, '#3A1C08');
          } else { piling(); if (y === 11) water(X, Y, 6); }
        } else if (theme === 'train') {
          const endL = T(x - 1, y) !== '#', endR = T(x + 1, y) !== '#';
          if (top) {
            K.V(g, X, Y, 16, 12, ['#E8ECF4', '#B8C0D0', '#8890A4']); R(g, X, Y, 16, 0.5, '#FFFFFF'); R(g, X, Y + 2, 16, 0.5, '#FCFCFC');
            for (let k = 2; k < 16; k += 5) K.ell(g, X + k, Y + 6, 0.5, 0.5, '#5A6278'); if (x % 4 === 1) { K.V(g, X + 4, Y - 0.01, 8, 2, ['#9AA2B8', '#6A7288']); }
            K.V(g, X, Y + 12, 16, 4, ['#5A6070', '#3A3E4C']);
          } else if (T(x, y - 1) === '#' && T(x, y - 2) !== '#') {
            K.V(g, X, Y, 16, 16, ['#D0D6E2', '#B0B8C8']); R(g, X + 2.5, Y + 2.5, 11, 9, '#2A2C3C'); K.V(g, X + 3, Y + 3, 10, 8, ['#FFF0B8', '#FFD070', '#F0A040']); R(g, X + 3, Y + 3, 10, 1, '#FFFFF0');
            R(g, X + 3, Y + 3, 3, 8, 'rgba(255,255,255,0.25)'); K.V(g, X, Y + 13, 16, 2, ['#FF4C7C', '#C0184C']);
          } else { K.V(g, X, Y, 16, 16, ['#C8CEDA', '#A0A8B8']); K.V(g, X, Y, 16, 2, ['#FF4C7C', '#C0184C']); K.V(g, X, Y + 12, 16, 4, ['#4A4E5C', '#2A2C38']); if (y === 11) { K.ell(g, X + 8, Y + 12, 4, 3.5, '#141418'); K.ell(g, X + 8, Y + 12, 2.5, 2, '#6A6E7C'); K.ell(g, X + 8, Y + 12, 1, 1, '#B8BCCC'); } }
          if (endL) K.Hz(g, X, Y, 2, 16, ['#2A2C38', '#4A4E5C']); if (endR) K.Hz(g, X + 14, Y, 2, 16, ['#4A4E5C', '#2A2C38']);
        } else {
          if (top) { K.V(g, X, Y, 16, 16, ['#4A4658', '#34303E', '#26222E']); for (let k = 0; k < 16; k += 4) { g.fillStyle = '#F0BC3C'; g.beginPath(); g.moveTo(X + k, Y + 2.5); g.lineTo(X + k + 2, Y); g.lineTo(X + k + 4, Y); g.lineTo(X + k + 2, Y + 2.5); g.fill(); g.fillStyle = '#1A1620'; g.beginPath(); g.moveTo(X + k + 2, Y + 2.5); g.lineTo(X + k + 4, Y); g.lineTo(X + k + 4, Y + 2.5); g.fill(); }
            R(g, X, Y, 16, 0.5, '#FFE890'); R(g, X, Y + 2.5, 16, 0.5, '#8A6A20'); R(g, X, Y + 8, 16, 0.5, '#14101C'); K.ell(g, X + 2.5, Y + 5, 0.6, 0.6, '#8A86A0'); K.ell(g, X + 13.5, Y + 5, 0.6, 0.6, '#8A86A0'); }
          else if (!solid(T(x, y + 1)) && y < 6) { K.V(g, X, Y, 16, 16, ['#3A3648', '#2A2636']); K.V(g, X, Y + 14, 16, 2, ['#F0BC3C', '#A87810']); for (let k = 0; k < 16; k += 8) { R(g, X + k + 3, Y + 4, 2, 6, '#0E0A16'); R(g, X + k + 3, Y + 4, 2, 0.5, '#5A5670'); } }
          else { K.V(g, X, Y, 16, 16, ['#3A3648', '#2E2A3A']); R(g, X, Y, 0.5, 16, '#14101C'); R(g, X + 0.5, Y, 0.5, 16, '#5A5670'); R(g, X, Y + 8, 16, 0.5, '#14101C'); R(g, X, Y + 8.5, 16, 0.5, '#5A5670'); }
        }
      } else if (ch === '[') {
        if (theme === 'tower') { K.V(g, X, Y, 16, 16, ['#8C3CA0', '#6C2884', '#4C1864']); K.V(g, X, Y, 16, 2, ['#FFE070', '#C09020']); R(g, X + 2, Y + 4, 12, 8, '#2C1048'); R(g, X + 2, Y + 4, 12, 0.5, '#14082C'); R(g, X + 2, Y + 11.5, 12, 0.5, '#B070D0'); }
        else { const c = crateCols[(Math.floor(x / 3) + y) % 4]; K.Hz(g, X, Y, 16, 16, [K.lit(c, 0.2), c, K.dk(c, 0.35)]); for (let k = 1; k < 16; k += 2.5) { R(g, X + k, Y + 1, 0.5, 14, K.dk(c, 0.45)); R(g, X + k + 0.5, Y + 1, 0.5, 14, K.lit(c, 0.25)); }
          K.V(g, X, Y, 16, 2, ['#E8E8F0', '#A0A0B0']); K.V(g, X, Y + 14, 16, 2, ['#3A3A48', '#18181E']); if ((x + y) % 3 === 0) { R(g, X + 6, Y + 5, 4, 6, K.dk(c, 0.5)); R(g, X + 6.5, Y + 7.5, 3, 0.8, '#C8C8D0'); } }
      } else if (ch === '=') {
        if (theme === 'docks') { K.V(g, X, Y, 16, 4, ['#FFB868', '#D07830']); R(g, X, Y, 16, 0.5, '#FFE4B0'); R(g, X, Y + 4, 16, 0.8, '#5A2C08'); if (x % 3 === 0) K.Hz(g, X + 6, Y + 4.8, 3, 6, ['#8A5A34', '#3A1C08']); }
        else { K.V(g, X, Y, 16, 4, ['#C8CCD8', '#7A8090']); R(g, X, Y, 16, 0.5, '#FCFCFC'); for (let k = 1; k < 16; k += 2) R(g, X + k, Y + 1.5, 1, 1, '#2A2C38'); R(g, X, Y + 4, 16, 0.8, '#2A2C38'); }
      } else if (ch === '~') {
        if (theme === 'tower') { K.V(g, X, Y, 16, 16, ['#0A0614', '#000000']); R(g, X, Y + 2, 16, 0.5, '#3A3448'); }
        else water(X, Y, 6);
      }
    }
    E.outline(Ly.hi, '#0A0614');
    K.done(Ly); Ly.lo.hi = Ly.hi;
    return Ly.lo;
  };
})();
