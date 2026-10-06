/* Precinct Rumble: procedural pixel-art stage backgrounds (pre-rendered once per stage). */
(function () {
  'use strict';
  const E = window.RetroEngine, P = E.P;
  const BG = window.PR_BG = {};
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function canvas(w, h) { const c = E.makeCanvas(w, h); return { c, p: E.painter(c.getContext('2d')), g: c.getContext('2d') }; }
  function dither(p, x, y, w, h, col, step) { step = step || 2; for (let yy = y; yy < y + h; yy++) for (let xx = x + ((yy & 1) ? 1 : 0); xx < x + w; xx += step) p.px(xx, yy, col); }
  function sky(p, w, h, r, cols) {
    const gr = p.g.createLinearGradient(0, 0, 0, h); cols.forEach((c, i) => gr.addColorStop(i / Math.max(1, cols.length - 1), c));
    p.g.fillStyle = gr; p.g.fillRect(0, 0, w, h);
    for (let i = 0; i < w / 6; i++) p.px(Math.floor(r() * w), Math.floor(r() * h * 0.6), r() < 0.3 ? P.white : P.periwinkle);
  }
  function skyline(p, w, base, r, col, winCol, minH, maxH) {
    let x = 0;
    while (x < w) {
      const bw = 18 + Math.floor(r() * 30), bh = minH + Math.floor(r() * (maxH - minH));
      p.r(x, base - bh, bw, bh, col);
      if (r() < 0.3) p.r(x + (bw >> 1) - 1, base - bh - 6, 2, 6, col);
      for (let yy = base - bh + 4; yy < base - 3; yy += 5) for (let xx = x + 2; xx < x + bw - 2; xx += 4) if (r() < 0.22) p.r(xx, yy, 2, 2, winCol);
      x += bw + Math.floor(r() * 4);
    }
  }
  function moon(p, x, y) { p.ell(x, y, 9, 9, P.cream); p.ell(x - 3, y - 2, 2, 2, P.pale); p.ell(x + 3, y + 3, 2, 1, P.pale); }

  // ---------------------------------------------------------------- STREET: Mulberry Avenue
  // far: sky + distant skyline (parallax 0.3); mid: neighbouring blocks (0.6); main: storefront row + street.
  BG.street = function (L) {
    const r = rng(11), K = E.BK, R = K.R;
    // far
    const F = K.layer(512, 130), fg = F.g;
    K.sky(fg, 512, 130, [[0, '#0A0826'], [0.35, '#1E1660'], [0.62, '#4A2483'], [0.85, '#9A3C8C'], [1, '#D86A8A']], r, 160);
    K.moon(fg, 404, 22, 8);
    K.skyline(fg, 512, 130, r, { col: '#3A2C78', edge: '#4E3E96', minW: 14, maxW: 30, minH: 50, maxH: 100, win: ['#8C7CD8', '#B8A0F0'], density: 0.12, beacon: '#FF4060' });
    K.skyline(fg, 512, 130, r, { col: '#24195A', edge: '#34287A', minW: 16, maxW: 34, minH: 30, maxH: 70, win: ['#FFD27A', '#FFE9B0', '#7FD8FF'], density: 0.2 });
    K.done(F);
    // mid: neighbouring blocks, lit faces with shaded returns, water tanks, a rooftop sign
    const MW = Math.ceil(L * 0.6) + 340, M = K.layer(MW, 130), mg = M.g;
    { let x = -6; const cols = ['#4A3A8C', '#3C4A92', '#5A3C7C', '#38507C', '#54448E'];
      while (x < MW) {
        const bw = 40 + r() * 50, top = 14 + r() * 34, c = cols[Math.floor(r() * cols.length)];
        R(mg, x, top, bw, 130 - top, c); K.Hz(mg, x + bw - 6, top, 6, 130 - top, [c, K.dk(c, 0.45)]); R(mg, x, top, 1, 130 - top, K.lit(c, 0.25));
        R(mg, x - 1, top - 2, bw + 2, 2, K.lit(c, 0.3)); R(mg, x - 1, top, bw + 2, 0.5, K.dk(c, 0.4));
        for (let yy = top + 6; yy < 122; yy += 8) for (let xx = x + 4; xx < x + bw - 9; xx += 7) {
          const on = r() < 0.38; R(mg, xx, yy, 4, 5, on ? (r() < 0.8 ? '#FFD887' : '#9FE4FF') : K.dk(c, 0.55)); if (on) R(mg, xx, yy, 4, 1, '#FFF4D0'); R(mg, xx - 0.5, yy + 5, 5, 0.5, K.lit(c, 0.2));
        }
        if (r() < 0.45) { const tx = x + 8 + r() * (bw - 26); // water tank
          R(mg, tx + 1, top - 6, 1, 6, '#1C1630'); R(mg, tx + 9, top - 6, 1, 6, '#1C1630');
          K.Hz(mg, tx, top - 16, 11, 10, ['#8A5A3A', '#6A4028', '#3E2418']); for (let k = 1; k < 11; k += 2.5) R(mg, tx + k, top - 16, 0.5, 10, '#3E2418');
          mg.fillStyle = '#4A2C1C'; mg.beginPath(); mg.moveTo(tx - 1, top - 16); mg.lineTo(tx + 5.5, top - 21); mg.lineTo(tx + 12, top - 16); mg.fill(); }
        else if (r() < 0.3) { const sx = x + 6; R(mg, sx, top - 13, bw - 14, 11, '#140C24'); K.neonText(mg, ['HOTEL', 'GARAGE', 'RADIO', 'CAFE'][Math.floor(r() * 4)], sx + (bw - 14) / 2, top - 11.5, ['#FF5AA8', '#5AF0FF', '#FFD040'][Math.floor(r() * 3)]); R(mg, sx + 3, top - 2, 1, 2, '#140C24'); R(mg, sx + bw - 18, top - 2, 1, 2, '#140C24'); }
        x += bw + (r() < 0.3 ? 6 + r() * 10 : 0);
      } }
    K.done(M);
    // main
    const A = K.layer(L, 180), g = A.g;
    const facades = ['#A8402C', '#7A4A36', '#5C5A80', '#9A2E3C', '#7E3C6E', '#B05A34'];
    const shops = ['PIZZA', 'DELI', 'BAGELS', 'LAUNDRY', 'BODEGA', 'BOOKS', 'DINER', 'TAILOR', 'FLOWERS', 'HARDWARE'];
    const blades = ['HOTEL', 'BAR', 'JAZZ', 'PAWN', 'EAT'];
    let x = 0, si = 0, bi = 0;
    while (x < L) {
      const bw = 80 + Math.floor(r() * 40), isClub = x > L - 300 && x < L - 60;
      const top = isClub ? 30 : 26 + Math.floor(r() * 34), col = isClub ? '#3A2470' : facades[Math.floor(r() * facades.length)];
      const stone = isClub ? '#B89CE0' : K.lit(K.mix(col, '#C8B8A0', 0.6), 0.1);
      // facade
      K.bricks(g, x, top, bw, 118 - top, col, r);
      K.V(g, x, top, bw, 118 - top, ['rgba(20,8,50,0.0)', 'rgba(20,8,50,0.0)', 'rgba(20,8,50,0.18)']);
      R(g, x, top, 2.5, 118 - top, K.lit(stone, 0.1)); R(g, x + bw - 2.5, top, 2.5, 118 - top, K.dk(stone, 0.25)); R(g, x + 2.5, top, 0.5, 118 - top, 'rgba(10,4,24,0.35)');
      K.cornice(g, x, top - 4, bw, stone, 5);
      if (r() < 0.35 && !isClub) { R(g, x + 10, top - 12, 5, 8, K.dk(col, 0.2)); R(g, x + 9, top - 13, 7, 1.5, stone); }
      // upper windows
      const floors = []; for (let yy = top + 8; yy < 66; yy += 18) floors.push(yy);
      const ncol = Math.max(2, Math.floor((bw - 12) / 18));
      const span = (bw - 12) / ncol;
      floors.forEach((yy, fi) => { for (let c = 0; c < ncol; c++) K.window(g, x + 6 + c * span + (span - 9) / 2, yy, 9, 12, r, { stone, ac: r() < 0.18 && fi < floors.length - 1 }); });
      if (!isClub && r() < 0.55 && floors.length > 1) { const fx = x + 6 + Math.floor(r() * Math.max(1, ncol - 1)) * span + span / 2 - 6; K.fireEscape(g, fx, floors[1] - 2.5, floors[floors.length - 1] + 13.5, 26, 18); }
      // blade sign
      if (!isClub && r() < 0.4) { const word = blades[bi++ % blades.length], sx = x + bw - 9, sy = 44, hgt = word.length * 8 + 4, nc = ['#FF4C9C', '#4CF0FF', '#FFD84C', '#7CFF6C'][bi % 4];
        R(g, sx - 1, sy + 4, 3, 1, '#20182C'); R(g, sx - 1, sy + hgt - 6, 3, 1, '#20182C');
        R(g, sx + 1, sy, 8, hgt, '#1A0E2A'); R(g, sx + 1, sy, 8, 0.5, '#5A4A70'); R(g, sx + 1.5, sy + 0.5, 0.5, hgt - 1, nc); R(g, sx + 8, sy + 0.5, 0.5, hgt - 1, nc);
        for (let k = 0; k < word.length; k++) E.text(g, word[k], sx + 2.5, sy + 3 + k * 8, nc, 1); }
      if (isClub) { R(g, x + 10, 40, bw - 20, 24, '#120A20'); R(g, x + 11, 41, bw - 22, 22, '#2A1050'); for (let k = 0; k < bw - 22; k += 3) { R(g, x + 11 + k, 41, 1.5, 1.5, k % 6 ? '#FFD040' : '#FF60B0'); R(g, x + 11 + k, 61.5, 1.5, 1.5, k % 6 ? '#FF60B0' : '#FFD040'); }
        E.text(g, 'CROWN', x + bw / 2, 44, '#FFD040', 1, 'center'); E.text(g, 'CLUB', x + bw / 2, 53, '#FF7AC0', 1, 'center'); }
      // storefront
      const aw = isClub ? ['#8C2CE8', '#F0BC3C'] : [['#D82838', '#F8F4F0'], ['#20A048', '#F8F4F0'], ['#2848D8', '#F8F4F0'], ['#F0BC3C', '#A83818'], ['#C83CA0', '#F8F4F0']][Math.floor(r() * 5)];
      R(g, x + 3, 74.5, bw - 6, 10.5, '#100818'); R(g, x + 3.5, 75, bw - 7, 0.5, '#5C4C6C'); R(g, x + 4, 84, bw - 8, 0.5, '#2C2038');
      const sign = isClub ? 'CROWN CLUB' : shops[si++ % shops.length];
      K.neonText(g, sign, x + bw / 2, 76.5, isClub ? '#FFD040' : ['#FFD040', '#F8F8FF', '#FF6AB8', '#5AF0F0'][si % 4]);
      K.awning(g, x + 2, 85, bw - 4, 6, aw[0], aw[1]);
      const wx = x + 6, ww = bw - 30;
      R(g, wx - 1, 93.5, ww + 2, 18.5, '#1A1222');
      K.V(g, wx, 94, ww, 17, isClub ? ['#5A1E88', '#C04CC0', '#FF9ADC'] : ['#FFE7B0', '#F8C878', '#E0A060']);
      for (let k = 0; k < 2; k++) { const sy = 99 + k * 6; R(g, wx + 1, sy, ww - 2, 0.8, '#8A5A38'); for (let xx = wx + 2; xx < wx + ww - 3; xx += 3 + r() * 2) R(g, xx, sy - 2 - r() * 1.5, 2, 2 + r(), ['#D83848', '#3C78D8', '#38A060', '#F0D040', '#E870B0', '#FFFFFF'][Math.floor(r() * 6)]); }
      g.fillStyle = 'rgba(255,255,255,0.32)'; for (let k = 0; k < 3; k++) { const sx = wx + 6 + k * (ww / 3); g.beginPath(); g.moveTo(sx, 111); g.lineTo(sx + 8, 94); g.lineTo(sx + 11, 94); g.lineTo(sx + 3, 111); g.fill(); }
      R(g, wx + ww / 2 - 0.5, 94, 1, 17, '#1A1222');
      K.V(g, wx - 1, 112, ww + 2, 6, [K.lit(stone, 0.2), stone, K.dk(stone, 0.35)]);
      const dx = x + bw - 22; R(g, dx - 1, 93, 15, 25, '#140C1C'); K.V(g, dx, 94, 13, 24, isClub ? ['#FFE070', '#E0A020'] : [K.lit('#6A3A24', 0.15), '#5A3020', '#3A1C10']);
      R(g, dx + 2, 96, 9, 9, isClub ? '#FFF4C0' : '#FFD890'); R(g, dx + 2, 96, 9, 0.5, '#FFFFFF'); R(g, dx + 10, 106, 1.5, 1.5, '#F0D060'); R(g, dx, 116, 13, 2, '#2A2030');
      R(g, x + bw - 0.5, top - 4, 0.5, 122 - top, '#100818');
      x += bw;
    }
    // sidewalk, curb, street
    K.V(g, 0, 118, L, 11, ['#BDB8CC', '#A8A2BC', '#9A94B0']);
    for (let xx = 0; xx < L; xx += 16) { R(g, xx, 118, 0.5, 11, '#7A7490'); R(g, xx + 0.5, 118, 0.5, 11, '#D4D0E0'); }
    R(g, 0, 121.5, L, 0.5, '#8E88A4');
    for (let i = 0; i < L / 4; i++) R(g, r() * L, 118 + r() * 11, 0.5, 0.5, r() < 0.5 ? '#8A84A0' : '#D0CCDC');
    R(g, 0, 118, L, 0.5, '#6A6480'); R(g, 0, 129, L, 1, '#E4E0EC'); R(g, 0, 130, L, 1.5, '#7A748C'); R(g, 0, 131.5, L, 1, '#2A2636');
    K.V(g, 0, 132.5, L, 48, ['#2C2A3C', '#3A3850', '#34324A']);
    for (let i = 0; i < L * 0.9; i++) R(g, r() * L, 133 + r() * 47, 0.5, 0.5, r() < 0.5 ? '#4C4A62' : '#222032');
    for (let i = 0; i < L / 60; i++) { const px = r() * L, py = 140 + r() * 36, pw = 8 + r() * 18; K.ell(g, px, py, pw, 1.4, 'rgba(120,130,200,0.18)'); }
    for (let xx = 8; xx < L; xx += 36) { R(g, xx, 153, 18, 2, '#F0C040'); R(g, xx, 153, 18, 0.5, '#FFE890'); }
    for (let xx = 140; xx < L; xx += 410) { K.ell(g, xx, 166, 9.5, 3.4, '#141220'); K.ell(g, xx, 166, 8, 2.6, '#5A5870'); K.ell(g, xx, 165.6, 7, 2.1, '#46445A'); for (let k = -5; k <= 5; k += 2.5) R(g, xx + k, 164.5, 1.5, 2.6, '#5E5C74'); }
    // street furniture: lamps (with light pools), hydrants
    for (let xx = 90; xx < L; xx += 230) { K.glowSpot(g, xx + 1, 124, 30, 7, 'rgba(255,214,140,A)', 0.35); K.lamp(g, xx + 1, 64, 122); }
    K.done(A);
    return { far: F.lo, farHi: F.hi, farY: 0, mid: M.lo, midHi: M.hi, main: A.lo, mainHi: A.hi };
  };

  // ---------------------------------------------------------------- SUBWAY: Orchard Junction
  BG.subway = function (L) {
    const r = rng(23), K = E.BK, R = K.R;
    const F = K.layer(512, 130); R(F.g, 0, 0, 512, 130, '#06040C'); K.done(F);
    const A = K.layer(L, 180), g = A.g, O = K.layer(L, 180), og = O.g;
    // ceiling with girders and strip lights
    K.V(g, 0, 0, L, 12, ['#1C1A28', '#2E2C40']);
    for (let xx = 0; xx < L; xx += 32) { K.Hz(g, xx, 0, 7, 12, ['#4A4660', '#2A283A', '#141220']); for (let yy = 2; yy < 12; yy += 3) K.ell(g, xx + 3.5, yy, 0.6, 0.6, '#6A6680'); }
    for (let xx = 16; xx < L; xx += 96) { R(g, xx, 9, 26, 2.5, '#0E0C16'); K.V(g, xx + 1, 9.5, 24, 1.5, ['#F4FFFF', '#B8F0FF']); K.glowSpot(g, xx + 13, 14, 30, 10, 'rgba(200,255,255,A)', 0.22); }
    R(g, 0, 11.5, L, 1, '#0A0810');
    // tiled wall: bevelled white subway tile, teal mosaic band, name tablets, posters
    R(g, 0, 12.5, L, 59.5, '#9A9EAA');
    for (let yy = 12.5, row = 0; yy < 72; yy += 3, row++) for (let xx = (row % 2) * 3 - 3; xx < L; xx += 6) {
      K.V(g, xx + 0.5, yy + 0.5, 5, 2, ['#EEF0F2', '#D4D8E2', '#B4B8CA']); R(g, xx + 0.5, yy + 0.5, 5, 0.5, '#FCFCFC');
    }
    K.V(g, 0, 12.5, L, 60, ['rgba(40,30,80,0.18)', 'rgba(40,30,80,0)', 'rgba(40,30,80,0.12)']);
    R(g, 0, 57, L, 9, '#0C3C44'); for (let xx = 0; xx < L; xx += 2) for (let yy = 57.5; yy < 65.5; yy += 2) R(g, xx + 0.25, yy + 0.25, 1.5, 1.5, ((xx + yy * 3) | 0) % 7 < 2 ? '#F0D060' : ((xx * 5 + yy) | 0) % 3 ? '#109098' : '#18B8B8');
    R(g, 0, 56.5, L, 1, '#E8E0C8'); R(g, 0, 65.5, L, 1, '#E8E0C8');
    for (let xx = 60; xx < L; xx += 300) { R(g, xx - 1, 53, 78, 16, '#E8E0C8'); R(g, xx, 54, 76, 14, '#101018'); R(g, xx + 0.5, 54.5, 75, 0.5, '#4A4A60'); E.text(g, 'ORCHARD JCT', xx + 38, 57.5, '#FFFFFF', 1, 'center'); }
    const posters = [['RIDE', 'KIND', '#FF5AA0', '#3A1040'], ['LOST', 'CAT?', '#58C8FF', '#102840'], ['JAZZ', 'NITE', '#FFC840', '#401C08'], ['SEE IT', 'SAY IT', '#70F0A0', '#0C3020']];
    for (let xx = 200, k = 0; xx < L; xx += 300, k++) { const pp = posters[k % 4];
      R(g, xx - 1.5, 33, 39, 23, '#2A2A34'); R(g, xx - 1, 33.5, 38, 22, '#C8C4B8'); K.V(g, xx + 1, 35.5, 34, 18, [K.lit(pp[2], 0.25), pp[2], K.dk(pp[2], 0.3)]);
      K.ell(g, xx + 28, 41, 4, 4, K.lit(pp[2], 0.5)); E.text(g, pp[0], xx + 18, 37, pp[3], 1, 'center'); E.text(g, pp[1], xx + 18, 45, pp[3], 1, 'center');
      g.fillStyle = 'rgba(241,241,241,0.25)'; g.beginPath(); g.moveTo(xx + 4, 53.5); g.lineTo(xx + 14, 35.5); g.lineTo(xx + 18, 35.5); g.lineTo(xx + 8, 53.5); g.fill(); }
    R(g, 0, 70, L, 2, '#5A5C68'); R(g, 0, 70, L, 0.5, '#C8CAD4');
    // track pit: dark tunnel, ties, gleaming rails, yellow tactile edge
    K.V(g, 0, 72, L, 32, ['#0A0812', '#120E1C', '#1A1424']);
    for (let xx = 0; xx < L; xx += 10) { K.V(g, xx, 94, 6, 6.5, ['#6A4A30', '#3A2414']); }
    for (const ry of [92, 99]) { R(g, 0, ry, L, 2, '#5A5C6C'); R(g, 0, ry, L, 0.5, '#E8F0FF'); R(g, 0, ry + 1.5, L, 0.5, '#2A2A34'); }
    R(g, 0, 102.5, L, 1.5, '#1A1620');
    R(g, 0, 104, L, 4, '#F0C030'); for (let xx = 0; xx < L; xx += 1.5) for (let yy = 104.5; yy < 107.5; yy += 1.5) R(g, xx + 0.25, yy + 0.25, 0.75, 0.75, '#C89818'); R(g, 0, 104, L, 0.5, '#FFE890');
    // platform floor: big terrazzo tiles with sheen
    K.V(g, 0, 108, L, 72, ['#8E8AA0', '#7E7A92', '#6E6A84']);
    for (let yy = 108; yy < 180; yy += 8) { R(g, 0, yy, L, 0.5, '#5A566E'); R(g, 0, yy + 0.5, L, 0.5, '#A8A4BC'); }
    for (let yy = 108, row = 0; yy < 180; yy += 8, row++) for (let xx = (row % 2) * 8; xx < L; xx += 16) { R(g, xx, yy, 0.5, 8, '#5A566E'); R(g, xx + 0.5, yy, 0.5, 8, '#A8A4BC'); }
    for (let i = 0; i < L * 1.2; i++) R(g, r() * L, 109 + r() * 70, 0.5, 0.5, ['#B8B4CC', '#5C5870', '#C8A8A0'][Math.floor(r() * 3)]);
    for (let xx = 300; xx < L; xx += 380) { K.ell(g, xx + 15, 123, 18, 2, 'rgba(10,4,24,0.4)'); K.V(g, xx, 111, 30, 4, ['#A06840', '#6A3C1C']); R(g, xx, 111, 30, 0.5, '#D09868'); R(g, xx + 2, 115, 2, 7, '#1A1A24'); R(g, xx + 26, 115, 2, 7, '#1A1A24'); }
    K.done(A);
    // pillars in front of passing trains
    for (let xx = 40; xx < L; xx += 160) {
      R(og, xx - 0.5, 12, 11, 106, '#0A0A1A'); K.Hz(og, xx, 12, 10, 106, ['#7090FF', '#3050E0', '#2034B0', '#101C60']); R(og, xx + 2, 12, 1, 106, '#B8C8FF');
      R(og, xx - 2.5, 12, 15, 5, '#0A0A1A'); K.V(og, xx - 2, 12, 14, 4, ['#4058D8', '#18206A']); R(og, xx - 2.5, 113, 15, 5, '#0A0A1A'); K.V(og, xx - 2, 113.5, 14, 4, ['#4058D8', '#18206A']); R(og, xx - 2, 113.5, 14, 0.5, '#9AB0FF');
      for (let yy = 22; yy < 112; yy += 12) { K.ell(og, xx + 1.5, yy, 0.8, 0.8, '#D8E4FF'); K.ell(og, xx + 8.5, yy, 0.8, 0.8, '#5A70D0'); }
    }
    K.done(O);
    return { far: F.lo, farHi: F.hi, farY: 0, main: A.lo, mainHi: A.hi, over: O.lo, overHi: O.hi, train: true };
  };
  BG.trainSprite = (function () {
    let c = null;
    return function () {
      if (c) return c;
      const t = canvas(420, 36), p = t.p;
      for (let k = 0; k < 3; k++) {
        const x = k * 140; p.r(x + 2, 0, 134, 34, P.lgray); p.r(x + 2, 0, 134, 3, P.gray); p.r(x + 2, 22, 134, 3, P.rose);
        for (let w = 0; w < 5; w++) { p.r(x + 10 + w * 25, 6, 16, 12, P.cream); p.r(x + 10 + w * 25, 6, 16, 3, P.gold); }
        p.r(x + 2, 31, 134, 3, P.dgray);
      }
      E.text(t.g, 'EXPRESS', 70, 25, P.white); c = t.c; return c;
    };
  })();

  // ---------------------------------------------------------------- ROOFTOP: Skyline Heights
  BG.rooftop = function (L) {
    const r = rng(37), K = E.BK, R = K.R;
    const F = K.layer(512, 130), fg = F.g;
    K.sky(fg, 512, 130, [[0, '#120A30'], [0.3, '#2A1A6A'], [0.55, '#6A2A8A'], [0.78, '#D85A7A'], [1, '#FFB070']], r, 120);
    K.moon(fg, 90, 24, 10);
    K.skyline(fg, 512, 130, r, { col: '#5A3C8C', edge: '#7A58AC', minW: 14, maxW: 28, minH: 60, maxH: 110, win: ['#C8A8F0'], density: 0.1, beacon: '#FF4060' });
    K.skyline(fg, 512, 130, r, { col: '#2E1E5C', edge: '#44307C', minW: 16, maxW: 34, minH: 30, maxH: 74, win: ['#FFD27A', '#FFE9B0', '#7FD8FF'], density: 0.24 });
    K.done(F);
    // mid: neighbouring rooftops with tanks, a lit billboard and a radio mast
    const MW = Math.ceil(L * 0.6) + 340, M = K.layer(MW, 130), mg = M.g;
    { let x = -4; const cols = ['#3A2A6C', '#2E3A70', '#46306E'];
      while (x < MW) { const bw = 50 + r() * 60, top = 44 + r() * 30, c = cols[Math.floor(r() * 3)];
        R(mg, x, top, bw, 130 - top, c); K.Hz(mg, x + bw - 5, top, 5, 130 - top, [c, K.dk(c, 0.5)]); R(mg, x - 1, top - 1.5, bw + 2, 1.5, K.lit(c, 0.3));
        for (let yy = top + 5; yy < 128; yy += 7) for (let xx = x + 4; xx < x + bw - 8; xx += 6) if (r() < 0.4) R(mg, xx, yy, 3, 4, r() < 0.8 ? '#FFD887' : '#9FE4FF');
        if (r() < 0.5) { const tx = x + 6 + r() * (bw - 20); R(mg, tx + 1, top - 6, 1, 6, '#140C24'); R(mg, tx + 8, top - 6, 1, 6, '#140C24'); K.Hz(mg, tx, top - 15, 10, 9, ['#7A4E34', '#5A3420', '#341C10']); mg.fillStyle = '#3A2010'; mg.beginPath(); mg.moveTo(tx - 1, top - 15); mg.lineTo(tx + 5, top - 20); mg.lineTo(tx + 11, top - 15); mg.fill(); }
        else if (r() < 0.25) { R(mg, x + bw / 2, top - 40, 1, 40, '#140C24'); for (let k = 0; k < 4; k++) R(mg, x + bw / 2 - 3 + k * 0.5, top - 34 + k * 8, 7 - k, 0.5, '#140C24'); R(mg, x + bw / 2 - 0.5, top - 42, 2, 2, '#FF3050'); }
        x += bw + r() * 8; } }
    K.done(M);
    const A = K.layer(L, 180), g = A.g;
    // water towers
    for (let xx = 120; xx < L; xx += 420) {
      for (const lx of [3, 28]) K.Hz(g, xx + lx, 74, 3, 24, ['#5A5468', '#2A2634']);
      BK2.cross(g, xx + 4, 78, xx + 30, 96); BK2.cross(g, xx + 30, 78, xx + 4, 96);
      R(g, xx - 1, 73, 36, 2, '#2A2634');
      K.Hz(g, xx, 40, 34, 34, ['#E09050', '#C06A30', '#8A4420', '#5A2C14']); for (let k = 2; k < 34; k += 4) R(g, xx + k, 40, 0.5, 34, 'rgba(60,20,8,0.6)');
      for (const by of [48, 66]) { R(g, xx - 0.5, by, 35, 1.5, '#3A3440'); R(g, xx - 0.5, by, 35, 0.5, '#8A8494'); }
      g.fillStyle = '#6A3418'; g.beginPath(); g.moveTo(xx - 2, 40.5); g.lineTo(xx + 17, 30); g.lineTo(xx + 36, 40.5); g.fill(); g.fillStyle = '#A85A2C'; g.beginPath(); g.moveTo(xx - 2, 40.5); g.lineTo(xx + 17, 30); g.lineTo(xx + 17, 40.5); g.fill();
      R(g, xx + 16, 26, 2, 4, '#3A2010'); K.V(g, xx, 70, 34, 4, ['rgba(10,4,24,0)', 'rgba(10,4,24,0.35)']);
    }
    // billboard
    for (let xx = 330; xx < L; xx += 640) {
      for (const lx of [10, 82]) K.Hz(g, xx + lx, 70, 3, 28, ['#5A5468', '#2A2634']);
      R(g, xx - 1, 29, 98, 42, '#14101C'); R(g, xx + 1, 31, 94, 38, '#F0BC3C'); K.V(g, xx + 3, 33, 90, 34, ['#FFF8E4', '#FCE8B8', '#F0D090']);
      E.text(g, 'SLICE OF', xx + 48, 37, '#C01828', 1, 'center'); E.text(g, 'HEAVEN', xx + 48, 47, '#C01828', 1, 'center'); E.text(g, 'PIZZA', xx + 48, 57, '#6A5000', 1, 'center');
      K.ell(g, xx + 13, 50, 7, 7, '#E8A040'); K.ell(g, xx + 13, 50, 5.5, 5.5, '#F8D060'); for (const [a, b] of [[-2, -2], [2, 1], [-1, 3], [3, -3]]) K.ell(g, xx + 13 + a, 50 + b, 1, 1, '#C02818');
      for (let k = 0; k < 4; k++) { R(g, xx + 8 + k * 26, 69, 4, 2, '#2A2634'); K.glowSpot(g, xx + 10 + k * 26, 62, 16, 12, 'rgba(255,240,200,A)', 0.18); }
    }
    for (let xx = 60; xx < L; xx += 520) { K.Hz(g, xx, 20, 2, 78, ['#9A94AC', '#4A4458']); R(g, xx - 6, 30, 14, 1, '#6A647C'); R(g, xx - 4, 42, 10, 1, '#6A647C'); K.ell(g, xx + 1, 18.5, 1.4, 1.4, '#FF3050'); K.glowSpot(g, xx + 1, 18.5, 8, 8, 'rgba(255,60,90,A)', 0.4); }
    // parapet: brick with stone coping
    K.bricks(g, 0, 97, L, 21, '#A8382C', r);
    K.V(g, 0, 97, L, 21, ['rgba(20,8,50,0.25)', 'rgba(20,8,50,0)', 'rgba(20,8,50,0.2)']);
    R(g, 0, 93, L, 4.5, '#C8BCB4'); R(g, 0, 93, L, 1, '#FFF4E8'); R(g, 0, 96.5, L, 1, '#6A5C64'); for (let xx = 0; xx < L; xx += 24) R(g, xx, 93, 0.5, 4, '#8A7C84');
    // tar roof with gravel, seams, vents, skylights
    K.V(g, 0, 118, L, 62, ['#4A4658', '#5A566A', '#504C60']); R(g, 0, 118, L, 1.5, '#2A2634');
    for (let i = 0; i < L * 1.6; i++) R(g, r() * L, 119 + r() * 61, 0.5, 0.5, ['#6E6A80', '#3A3648', '#7A7088'][Math.floor(r() * 3)]);
    for (let xx = 0; xx < L; xx += 96) { R(g, xx, 118, 1, 62, '#3A3648'); R(g, xx + 1, 118, 0.5, 62, '#6E6A80'); }
    for (let xx = 240; xx < L; xx += 300) { K.ell(g, xx + 14, 121.5, 16, 2, 'rgba(10,4,24,0.4)'); K.V(g, xx, 106, 28, 16, ['#D0D4E0', '#9A9EB0', '#6A6E80']); for (let k = 0; k < 4; k++) R(g, xx + 2, 108 + k * 3, 24, 1, '#5A5E70'); K.ell(g, xx + 14, 104.5, 7, 2.2, '#8A8EA0'); K.ell(g, xx + 14, 104, 5, 1.4, '#3A3E4C'); }
    for (let xx = 520; xx < L; xx += 470) { K.V(g, xx, 115, 34, 9, ['#E0F4FF', '#8AC8F0', '#5A90C8']); R(g, xx, 115, 34, 1, '#FFFFFF'); R(g, xx + 16.5, 115, 1, 9, '#3A5070'); BK2.cross(g, xx + 3, 123, xx + 13, 116); }
    K.done(A);
    return { far: F.lo, farHi: F.hi, farY: 0, mid: M.lo, midHi: M.hi, main: A.lo, mainHi: A.hi };
  };
  const BK2 = { cross(g, x0, y0, x1, y1) { E.BK.line(g, [x0, y0, x1, y1], 0.8, '#2A2634'); } };

  // ---------------------------------------------------------------- WAREHOUSE: Crown Imports, Pier 40
  BG.warehouse = function (L) {
    const r = rng(53), K = E.BK, R = K.R;
    const F = K.layer(512, 130); R(F.g, 0, 0, 512, 130, '#06040C'); K.done(F);
    const A = K.layer(L, 180), g = A.g;
    // corrugated steel wall
    K.V(g, 0, 0, L, 118, ['#24304C', '#34466A', '#2C3A5A']);
    for (let xx = 0; xx < L; xx += 4) { R(g, xx, 0, 1.2, 118, '#4A5E88'); R(g, xx + 1.2, 0, 1, 118, '#3A4C74'); R(g, xx + 2.8, 0, 1, 118, '#1A2238'); }
    for (let i = 0; i < L / 3; i++) { const sx = r() * L, sy = r() * 110; R(g, sx, sy, 0.5, 2 + r() * 6, 'rgba(160,90,60,0.35)'); }
    for (let xx = 0; xx < L; xx += 120) { R(g, xx, 0, 0.5, 118, '#141A2C'); for (let yy = 6; yy < 116; yy += 10) K.ell(g, xx + 2, yy, 0.6, 0.6, '#7A8CB0'); }
    // roof truss
    K.V(g, 0, 15, L, 7, ['#5A5C70', '#3A3C50', '#22242E']); R(g, 0, 15, L, 0.5, '#9A9CB0');
    for (let xx = 0; xx < L; xx += 24) { K.line(g, [xx, 22, xx + 12, 34], 1.2, '#2A2C3A'); K.line(g, [xx + 24, 22, xx + 12, 34], 1.2, '#2A2C3A'); K.line(g, [xx + 0.5, 22, xx + 12.5, 34], 0.4, '#6A6C80'); }
    K.V(g, 0, 33, L, 4, ['#4A4C60', '#22242E']); R(g, 0, 33, L, 0.5, '#8A8CA0');
    // high windows with moonlight
    for (let xx = 70; xx < L; xx += 170) {
      R(g, xx - 1, 39, 42, 18, '#0E0C18'); K.V(g, xx, 40, 40, 16, ['#C8E4FF', '#8AB8F0', '#5A84C8']);
      for (let k = 1; k < 4; k++) R(g, xx + k * 10 - 0.5, 40, 1, 16, '#1A1A28'); R(g, xx, 47.5, 40, 1, '#1A1A28');
      for (let k = 0; k < 6; k++) R(g, xx + r() * 38, 40 + r() * 14, 1.5, 1, '#E8F4FF');
      g.fillStyle = 'rgba(180,210,255,0.10)'; g.beginPath(); g.moveTo(xx, 56); g.lineTo(xx + 40, 56); g.lineTo(xx + 64, 118); g.lineTo(xx + 18, 118); g.fill();
    }
    // shelving with crates
    const crateCols = [['#D8904A', '#A86028', '#6A3818'], ['#9AA040', '#6E7420', '#404410'], ['#C86040', '#943820', '#5A1C10']];
    for (let xx = 0; xx < L; xx += 150) {
      for (const lx of [4, 98]) K.Hz(g, xx + lx, 62, 3, 56, ['#E0A030', '#B07010', '#6A4008']);
      for (const shelf of [76, 96, 116]) {
        let cx = xx + 8;
        while (cx < xx + 92) { const cw = 10 + Math.floor(r() * 10), ch = 8 + Math.floor(r() * 8);
          if (r() < 0.8) { const cc = crateCols[Math.floor(r() * 3)];
            R(g, cx - 0.5, shelf - ch - 0.5, cw + 1, ch + 0.5, '#1A0E08'); K.Hz(g, cx, shelf - ch, cw, ch, [cc[0], cc[1]]); R(g, cx, shelf - ch, cw, 1, K.lit(cc[0], 0.4));
            R(g, cx, shelf - ch + 2.5, cw, 0.5, cc[2]); R(g, cx, shelf - 3, cw, 0.5, cc[2]); K.line(g, [cx + 1, shelf - 3.5, cx + cw - 1, shelf - ch + 3], 0.8, cc[2]);
            if (r() < 0.3) { R(g, cx + cw / 2 - 2.5, shelf - ch / 2 - 1.5, 5, 3, '#F0E8D0'); R(g, cx + cw / 2 - 1.5, shelf - ch / 2 - 0.5, 3, 0.5, '#A82018'); } }
          cx += cw + 2; }
        K.V(g, xx + 4, shelf, 97, 2.5, ['#58A0E0', '#2A5A98']); R(g, xx + 4, shelf, 97, 0.5, '#B0D8FF'); R(g, xx + 4, shelf + 2.5, 97, 1, 'rgba(10,4,24,0.4)');
      }
    }
    for (let xx = 230; xx < L; xx += 450) { R(g, xx - 1, 43, 92, 16, '#140A24'); K.V(g, xx, 44, 90, 14, ['#6A2AC0', '#4A148C']); R(g, xx, 44, 90, 0.5, '#B080FF'); BK2.crown(g, xx + 8, 51); E.text(g, 'CROWN IMPORTS', xx + 49, 47.5, '#FFD040', 1, 'center'); }
    // floor: sealed concrete, hazard edge, light pools
    K.V(g, 0, 118, L, 62, ['#3C3A48', '#4A4858', '#42404E']);
    for (let i = 0; i < L / 1.5; i++) R(g, r() * L, 121 + r() * 59, 0.5, 0.5, r() < 0.5 ? '#5C5A6C' : '#2E2C38');
    for (let i = 0; i < L / 90; i++) K.ell(g, r() * L, 135 + r() * 40, 6 + r() * 12, 1.5, 'rgba(10,6,20,0.25)');
    for (let xx = 0; xx < L; xx += 8) { g.fillStyle = '#F0C030'; g.beginPath(); g.moveTo(xx, 121); g.lineTo(xx + 3, 118); g.lineTo(xx + 7, 118); g.lineTo(xx + 4, 121); g.fill(); }
    R(g, 0, 117.5, L, 0.5, '#FFE890'); R(g, 0, 121, L, 0.5, '#1A1820');
    for (let xx = 0; xx < L; xx += 64) { R(g, xx, 121.5, 0.5, 58.5, '#24222C'); R(g, xx + 0.5, 121.5, 0.5, 58.5, '#5A5868'); }
    // hanging lamps with cones
    for (let xx = 40; xx < L; xx += 200) {
      R(g, xx + 9.5, 0, 1, 10, '#0A0810'); g.fillStyle = '#2A6A48'; g.beginPath(); g.moveTo(xx + 3, 14); g.lineTo(xx + 7, 9.5); g.lineTo(xx + 13, 9.5); g.lineTo(xx + 17, 14); g.fill();
      R(g, xx + 3, 13.5, 14, 0.5, '#5ACC90'); K.ell(g, xx + 10, 14.5, 4, 1.2, '#FFF8D0');
      g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, 15, 0, 160); gr.addColorStop(0, 'rgba(255,236,170,0.32)'); gr.addColorStop(1, 'rgba(255,236,170,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(xx + 5, 15); g.lineTo(xx + 15, 15); g.lineTo(xx + 46, 150); g.lineTo(xx - 26, 150); g.fill(); g.restore();
      K.glowSpot(g, xx + 10, 142, 36, 8, 'rgba(255,230,160,A)', 0.3);
    }
    // throne at the end
    const tx = L - 110;
    K.ell(g, tx + 20, 120, 30, 3, 'rgba(10,4,24,0.5)');
    K.Hz(g, tx, 70, 40, 48, ['#FFE070', '#F0BC3C', '#A87010']); K.V(g, tx + 4, 74, 32, 30, ['#E83048', '#A81028', '#6A0818']);
    for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) K.ell(g, tx + 9 + k * 11, 79 + j * 7, 0.8, 0.8, '#FF90A0');
    K.Hz(g, tx - 6, 96, 52, 8, ['#FFE070', '#F0BC3C', '#A87010']); R(g, tx - 6, 96, 52, 1, '#FFF8C0');
    K.Hz(g, tx, 104, 6, 14, ['#C09020', '#6A5000']); K.Hz(g, tx + 34, 104, 6, 14, ['#C09020', '#6A5000']);
    BK2.crown(g, tx + 14, 60);
    K.V(g, tx - 60, 122, 160, 50, ['#C01830', '#901024', '#6A0818']); R(g, tx - 60, 122, 160, 2, '#F0BC3C'); R(g, tx - 60, 170, 160, 2, '#F0BC3C'); R(g, tx - 60, 122, 160, 0.5, '#FFF0A0');
    K.done(A);
    return { far: F.lo, farHi: F.hi, farY: 0, main: A.lo, mainHi: A.hi };
  };
  BK2.crown = function (g, x, y) { const R = E.BK.R; g.fillStyle = '#F0BC3C'; g.beginPath(); g.moveTo(x, y + 7); g.lineTo(x, y + 1); g.lineTo(x + 3, y + 4); g.lineTo(x + 6, y); g.lineTo(x + 9, y + 4); g.lineTo(x + 12, y + 1); g.lineTo(x + 12, y + 7); g.fill(); R(g, x, y + 6, 12, 1.5, '#A87010'); E.BK.ell(g, x + 6, y + 4.5, 1, 1, '#E8204A'); };
})();
