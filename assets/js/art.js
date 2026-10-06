/* Generated SVG art: logo, coins, icons, prize/product/game illustrations and slot symbols.
   Gold and silver are SVG gradients defined per drawing with unique ids. No raster images. */
(function () {
  var uid = 0;
  function ids() { uid++; return { g: "g" + uid, gh: "gh" + uid, s: "s" + uid, sh: "sh" + uid, r: "r" + uid, gl: "gl" + uid }; }
  function defs(i) {
    return '<defs>' +
      '<linearGradient id="' + i.g + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbeab0"/><stop offset=".45" stop-color="#d9b75f"/><stop offset="1" stop-color="#9c7a2a"/></linearGradient>' +
      '<linearGradient id="' + i.gh + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset="1" stop-color="#c9a145"/></linearGradient>' +
      '<linearGradient id="' + i.s + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c3cad6"/><stop offset="1" stop-color="#7d8696"/></linearGradient>' +
      '<linearGradient id="' + i.sh + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f9"/><stop offset="1" stop-color="#9aa3b2"/></linearGradient>' +
      '<radialGradient id="' + i.r + '" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#123024"/><stop offset="1" stop-color="#07140e"/></radialGradient>' +
      '<radialGradient id="' + i.gl + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d9b75f" stop-opacity=".35"/><stop offset="1" stop-color="#d9b75f" stop-opacity="0"/></radialGradient>' +
      '</defs>';
  }
  var u = function (id) { return "url(#" + id + ")"; };

  /* ---------- icons (24px line set) ---------- */
  var P = { pause: "M9 5v14M15 5v14",
    arrow: "M5 12h14M13 6l6 6-6 6", back: "M19 12H5M11 6l-6 6 6 6", plus: "M12 5v14M5 12h14", minus: "M5 12h14", x: "M6 6l12 12M18 6L6 18",
    check: "M5 12.5l4.5 4.5L19 7", menu: "M4 7h16M4 12h16M4 17h16", user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    wallet: "M3 7.5A2.5 2.5 0 015.5 5H18v3M3 7.5V18a2 2 0 002 2h15V8H5.5A2.5 2.5 0 013 5.5M16 14h1", gift: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0",
    ticket: "M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4zM14 7v10", play: "M8 5l11 7-11 7z", cart: "M3 4h2l2.4 11h10.2L20 8H6.2M10 20a1 1 0 100-2 1 1 0 000 2zM17 20a1 1 0 100-2 1 1 0 000 2z",
    bag: "M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2", shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-5",
    clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2", cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4", info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.5",
    sound: "M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12", mute: "M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6",
    search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4", star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z",
    trophy: "M8 4h8v5a4 4 0 01-8 0zM8 6H4.5a3 3 0 003.5 4M16 6h3.5a3 3 0 01-3.5 4M12 13v4M8 20h8M9.5 17h5",
    down: "M6 9l6 6 6-6", right: "M9 6l6 6-6 6", left: "M15 6l-6 6 6 6", refresh: "M20 12a8 8 0 11-2.3-5.7M20 4v5h-5", lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3",
    mail: "M4 6h16v12H4zM4 7l8 6 8-6", home: "M4 11l8-7 8 7v9H4zM10 20v-6h4v6", chart: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6",
    gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 13a7.5 7.5 0 000-2l2-1.5-2-3.5-2.4 1a7.5 7.5 0 00-1.7-1L15 3.5h-4L10.7 6a7.5 7.5 0 00-1.7 1l-2.4-1-2 3.5 2 1.5a7.5 7.5 0 000 2l-2 1.5 2 3.5 2.4-1a7.5 7.5 0 001.7 1l.3 2.5h4l.3-2.5a7.5 7.5 0 001.7-1l2.4 1 2-3.5z",
    users: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 6.5M18 14a6.5 6.5 0 013.5 6",
    copy: "M9 9h11v11H9zM5 15V4h11", spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6", out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
    eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z", bell: "M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4",
    pin: "M12 21s7-6.2 7-12a7 7 0 00-14 0c0 5.8 7 12 7 12zM12 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5z", video: "M3 7h12v10H3zM15 10l6-3v10l-6-3",
    seat: "M6 11V6a2 2 0 012-2h8a2 2 0 012 2v5M4 11h16v5H4zM6 16v4M18 16v4", vault: "M4 4h16v15H4zM6 19v2M18 19v2M12 8.5a3 3 0 100 6 3 3 0 000-6zM12 7v1.5M12 14.5V16M8.5 11.5H10M14 11.5h1.5M17 8v7", verified: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4", dice: "M5 5h14v14H5zM9 9h.01M15 15h.01M15 9h.01M9 15h.01M12 12h.01",
    truck: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z", heart: "M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z",
    help: "M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5M12 17v.5", list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
  };
  function icon(n, s, cls) { s = s || 20; return '<svg class="ic ' + (cls || "") + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (P[n] || P.info) + '"/></svg>'; }

  /* ---------- logo + coins ---------- */
  function logo(s) {
    var i = ids(); s = s || 38;
    return '<svg class="logo-mark" width="' + s + '" height="' + s + '" viewBox="0 0 48 48" aria-hidden="true">' + defs(i) +
      '<circle cx="24" cy="24" r="22.5" fill="none" stroke="' + u(i.g) + '" stroke-width="1.5"/>' +
      '<circle cx="24" cy="24" r="19" fill="#07140e" stroke="' + u(i.s) + '" stroke-opacity=".5" stroke-width=".8"/>' +
      '<path d="M24 9l11 10-11 20L13 19z" fill="' + u(i.g) + '"/><path d="M13 19h22M24 9l-4.5 10L24 39M24 9l4.5 10L24 39" stroke="#3f2f08" stroke-opacity=".55" stroke-width=".9" fill="none"/>' +
      '<path d="M24 9l11 10H13z" fill="#fff6d6" fill-opacity=".25"/></svg>';
  }
  function coin(key, s, cls) {
    var i = ids(), gold = key === "SOV"; s = s || 24;
    var face = gold ? u(i.g) : u(i.s), rim = gold ? u(i.gh) : u(i.sh), ink = gold ? "#5a4210" : "#3a414d";
    var mark = gold
      ? '<path d="M15 29l-2-11 6 5 5-8 5 8 6-5-2 11z" fill="' + ink + '" fill-opacity=".72"/><rect x="15" y="30.5" width="18" height="2.6" rx="1.2" fill="' + ink + '" fill-opacity=".72"/>'
      : '<path d="M24 13l9 8-9 14-9-14z" fill="' + ink + '" fill-opacity=".55"/><path d="M15 21h18M24 13l-3.5 8L24 35M24 13l3.5 8L24 35" stroke="#f4f6f9" stroke-opacity=".7" stroke-width=".8" fill="none"/>';
    return '<svg class="coin ' + (cls || "") + '" width="' + s + '" height="' + s + '" viewBox="0 0 48 48" aria-hidden="true">' + defs(i) +
      '<circle cx="24" cy="24" r="23" fill="' + rim + '"/><circle cx="24" cy="24" r="23" fill="none" stroke="' + ink + '" stroke-opacity=".35" stroke-width="1" stroke-dasharray="1.2 1.6"/>' +
      '<circle cx="24" cy="24" r="18.5" fill="' + face + '" stroke="' + ink + '" stroke-opacity=".4" stroke-width="1"/>' + mark +
      '<ellipse cx="18" cy="15" rx="9" ry="4" fill="#fff" fill-opacity=".22" transform="rotate(-25 18 15)"/></svg>';
  }

  /* ---------- prize + product illustrations (viewBox 240x160) ---------- */
  function stage(i, inner, glow) {
    return '<svg class="art" viewBox="0 0 240 160" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + defs(i) +
      (glow !== false ? '<ellipse cx="120" cy="86" rx="96" ry="66" fill="' + u(i.gl) + '"/>' : "") +
      '<ellipse cx="120" cy="140" rx="78" ry="7" fill="#000" fill-opacity=".45"/>' + inner + '</svg>';
  }
  var DRAW = {
    bullion: function (i) { var bar = function (x, y) { return '<path d="M' + x + ' ' + (y + 26) + 'l10-26h44l10 26z" fill="' + u(i.g) + '" stroke="#7a5d1a" stroke-width="1"/><path d="M' + (x + 10) + ' ' + y + 'h44l-4 6h-36z" fill="#fff3c9" fill-opacity=".5"/><text x="' + (x + 32) + '" y="' + (y + 19) + '" text-anchor="middle" font-family="Georgia,serif" font-size="8" fill="#5a4210">1 OZ</text>'; };
      return bar(54, 108) + bar(122, 108) + bar(88, 80) + bar(64, 52) + bar(112, 52) + '<path d="M60 56l6 6M168 84l7 4" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>'; },
    bracelet: function (i) { var s = ""; for (var k = 0; k < 18; k++) { var a = k / 18 * Math.PI * 2, x = 120 + 66 * Math.cos(a), y = 84 + 34 * Math.sin(a); s += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><rect x="-7" y="-7" width="14" height="14" rx="3" fill="' + u(i.s) + '"/><path d="M0-5l5 5-5 5-5-5z" fill="#fff" fill-opacity=".9"/></g>'; } return '<ellipse cx="120" cy="84" rx="66" ry="34" fill="none" stroke="' + u(i.s) + '" stroke-width="3"/>' + s + '<path d="M70 60l4-4M170 64l5 2M120 46l0-6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>'; },
    bag: function (i) { return '<path d="M48 70h144l-8 62H56z" fill="#3b2a1c" stroke="' + u(i.g) + '" stroke-width="2"/><path d="M90 70c0-26 60-26 60 0" fill="none" stroke="#5a3e28" stroke-width="7"/><path d="M48 70h144" stroke="' + u(i.g) + '" stroke-width="3"/><rect x="110" y="84" width="20" height="14" rx="2" fill="' + u(i.g) + '"/><path d="M60 108h120" stroke="#d9b75f" stroke-opacity=".4" stroke-dasharray="3 4"/>'; },
    /* Plinko Royale thumbnail, drawn like the real board (games/plinko-engine.js): walls flush with 11 slots, 10 staggered peg rows
       (11 pegs on slot centers, then 10 on slot edges), the aim rail with the ball just dropped, and the real slot values. */
    plinko: function (i) {
      var L = 34, R = 206, P = (R - L) / 11, top = 34, gap = 8.6, V = [0.2, 0.3, 0.4, 0.7, 1, 1.4, 1, 0.7, 0.4, 0.3, 0.2], s = "";
      var fill = function (m) { return m >= 1.4 ? "#e6c872" : m >= 1 ? "#b8953f" : m >= 0.7 ? "#d5dae3" : m >= 0.4 ? "#3a4560" : "#123024"; };
      var ink = function (m) { return m >= 0.7 ? "#14100a" : m >= 0.4 ? "#eef0f4" : "#b8bfcd"; };
      s += '<rect x="' + (L - 8) + '" y="10" width="' + (R - L + 16) + '" height="134" rx="9" fill="' + u(i.r) + '" stroke="#d9b75f" stroke-opacity=".18"/>';
      s += '<ellipse cx="120" cy="66" rx="70" ry="50" fill="' + u(i.gl) + '"/>';
      s += '<path d="M' + L + ' 14V128M' + R + ' 14V128" stroke="' + u(i.gh) + '" stroke-width="2" stroke-linecap="round"/>';
      s += '<path d="M' + (L + 18) + ' 20H' + (R - 18) + '" stroke="#c3cad6" stroke-opacity=".28" stroke-width="1"/>';
      for (var a = 0; a < 9; a++) s += '<circle cx="' + (L + 18 + a * (R - L - 36) / 8).toFixed(1) + '" cy="20" r="1" fill="#c3cad6" fill-opacity=".45"/>';
      for (var r = 0; r < 10; r++) {
        var y = top + r * gap;
        if (r % 2 === 0) for (var k = 0; k < 11; k++) s += '<circle cx="' + (L + (k + .5) * P).toFixed(1) + '" cy="' + y.toFixed(1) + '" r="1.7" fill="' + u(i.g) + '"/>';
        else for (var j = 1; j < 11; j++) s += '<circle cx="' + (L + j * P).toFixed(1) + '" cy="' + y.toFixed(1) + '" r="1.7" fill="' + u(i.g) + '"/>';
      }
      var bx = L + 5.5 * P;
      s += '<path d="M' + (bx - 2.6).toFixed(1) + ' 21L' + (bx - 4).toFixed(1) + ' 28h8L' + (bx + 2.6).toFixed(1) + ' 21z" fill="#eef0f4" fill-opacity=".16"/><circle cx="' + bx.toFixed(1) + '" cy="23" r="2.6" fill="#eef0f4" fill-opacity=".22"/>';
      s += '<circle cx="' + bx.toFixed(1) + '" cy="29.5" r="9" fill="#eef0f4" fill-opacity=".1"/><circle cx="' + bx.toFixed(1) + '" cy="29.5" r="4.6" fill="' + u(i.s) + '"/><circle cx="' + (bx - 1.5).toFixed(1) + '" cy="28" r="1.4" fill="#fff"/>';
      for (var k2 = 0; k2 < 11; k2++) {
        var x = L + k2 * P + 1, m = V[k2];
        s += '<g><rect x="' + x.toFixed(1) + '" y="121" width="' + (P - 2).toFixed(1) + '" height="15" rx="2.5" fill="' + fill(m) + '"' + (m < 0.7 ? ' stroke="#c3cad6" stroke-opacity=".18" stroke-width=".6"' : "") + '/>';
        s += '<rect x="' + (x + (P - 2) / 2 - 2.2).toFixed(1) + '" y="127.4" width="4.4" height="2.2" rx="1.1" fill="' + ink(m) + '" fill-opacity=".55"/></g>';  /* r8 L4: no tiny value text (was 5.8px on small tiles) */
      }
      return s;
    },
    /* Crown Jewels thumbnail: a cabinet with a title plaque, five reels by three rows set inside the window with even insets,
       every symbol inside its cell, three wild crowns on the middle win line, and a soft diagonal shine over the glass. */
    slots: function (i) {
      var cid = i.r + "c", sid = i.r + "s", W0 = 46, Y0 = 44, CW = 28, CH = 24, G = 2, s = "";
      var grid = [["diamond", "ring", "coin", "silverbar", "key"], ["crown", "crown", "crown", "diamond", "ingot"], ["ingot", "silverbar", "key", "ring", "coin"]];
      s += '<defs><clipPath id="' + cid + '"><rect x="' + (W0 - 4) + '" y="' + (Y0 - 4) + '" width="' + (5 * CW + 4 * G + 8) + '" height="' + (3 * CH + 8) + '" rx="6"/></clipPath>' +
        '<linearGradient id="' + sid + '" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity=".13"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
      s += '<rect x="28" y="12" width="184" height="128" rx="14" fill="#0e1424" stroke="' + u(i.g) + '" stroke-width="3"/>';
      s += '<rect x="33" y="17" width="174" height="118" rx="10" fill="none" stroke="#d9b75f" stroke-opacity=".25"/>';
      s += '<g><rect x="80" y="20" width="80" height="15" rx="7.5" fill="#e6c872" stroke="#fff3c9" stroke-opacity=".6" stroke-width=".6"/><text x="120" y="30.6" text-anchor="middle" font-family="Georgia,serif" font-size="7.6" font-weight="700" letter-spacing=".8" fill="#2a1d05">CROWN JEWELS</text></g>';
      s += '<rect x="' + (W0 - 4) + '" y="' + (Y0 - 4) + '" width="' + (5 * CW + 4 * G + 8) + '" height="' + (3 * CH + 8) + '" rx="6" fill="#070a12" stroke="' + u(i.s) + '" stroke-opacity=".35"/>';
      s += '<g clip-path="url(#' + cid + ')">';
      for (var c = 0; c < 5; c++) {
        var x = W0 + c * (CW + G);
        s += '<rect x="' + x + '" y="' + Y0 + '" width="' + CW + '" height="' + 3 * CH + '" rx="3" fill="' + u(i.r) + '"/>';
        for (var r = 0; r < 3; r++) {
          var win = r === 1 && c < 3, cx = x + CW / 2, cy = Y0 + r * CH + CH / 2, k = .3;
          if (win) s += '<rect x="' + (x + 1.5) + '" y="' + (Y0 + r * CH + 1.5) + '" width="' + (CW - 3) + '" height="' + (CH - 3) + '" rx="3" fill="#d9b75f" fill-opacity=".14" stroke="#e9cd7d" stroke-opacity=".7" stroke-width=".8"/>';
          s += '<g transform="translate(' + (cx - 32 * k).toFixed(2) + ' ' + (cy - 32 * k).toFixed(2) + ') scale(' + k + ')"' + (win || r === 1 ? "" : ' opacity=".8"') + ">" + SYMB[grid[r][c]](i) + "</g>";
        }
      }
      s += '<rect x="0" y="0" width="240" height="160" fill="url(#' + sid + ')"/></g>';
      var ly = Y0 + 1.5 * CH;
      s += '<path d="M' + (W0 - 10) + ' ' + ly + 'H' + (W0 + 5 * CW + 4 * G + 10) + '" stroke="#e9cd7d" stroke-width="1" stroke-opacity=".55" stroke-dasharray="3 2.5"/>';
      s += '<circle cx="' + (W0 - 10) + '" cy="' + ly + '" r="2.6" fill="' + u(i.gh) + '"/><circle cx="' + (W0 + 5 * CW + 4 * G + 10) + '" cy="' + ly + '" r="2.6" fill="' + u(i.gh) + '"/>';
      for (var d = 0; d < 7; d++) s += '<circle cx="' + (84 + d * 12) + '" cy="129" r="1.6" fill="' + (d % 2 ? "#c3cad6" : "#d9b75f") + '" fill-opacity="' + (d === 3 ? 1 : .6) + '"/>';
      return s;
    },
    /* Vault Stack thumbnail: a vault panel with three columns of trays holding side-view coin piles in the tier colours
       (red Copper, orange Bronze, blue Silver, green Electrum); one full pile of ten Bronze glows as it mints a Silver coin in its own tray. */
    vault: function (i) {
      var s = '<rect x="38" y="14" width="164" height="124" rx="14" fill="#0e1424" stroke="' + u(i.g) + '" stroke-width="2.4"/><rect x="43" y="19" width="154" height="114" rx="10" fill="none" stroke="#d9b75f" stroke-opacity=".22"/>';
      var piles = [[[0, 0, 0, 1, 1], [2, 2, 2]], [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [3, 3]], [[0, 0, 2, 2, 2, 2], [3]]];
      for (var c = 0; c < 3; c++) for (var r = 0; r < 2; r++) {
        var x = 52 + c * 47, y = 30 + r * 52, st = piles[c][r], glow = c === 1 && r === 0;
        s += '<rect x="' + x + '" y="' + y + '" width="42" height="46" rx="7" fill="' + u(i.r) + '" stroke="' + (glow ? "#f3dc94" : "#c3cad6") + '" stroke-opacity="' + (glow ? .9 : .22) + '"' + (glow ? ' stroke-width="1.4"' : "") + "/>";
        if (glow) s += '<rect x="' + (x - 3) + '" y="' + (y - 3) + '" width="48" height="52" rx="9" fill="none" stroke="#f3dc94" stroke-opacity=".25" stroke-width="3"/>';
        st.forEach(function (t, k) { var m = VS[t], yy = y + 40 - k * 3.6; s += '<rect x="' + (x + 8) + '" y="' + yy.toFixed(1) + '" width="26" height="2.8" rx="1.2" fill="' + m.face + '"/><rect x="' + (x + 8) + '" y="' + yy.toFixed(1) + '" width="9" height="2.8" rx="1.2" fill="' + m.hi + '" fill-opacity=".8"/>'; });
      }
      for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2; s += '<circle cx="' + (120 + Math.cos(a) * 17).toFixed(1) + '" cy="' + (27 + Math.sin(a) * 13).toFixed(1) + '" r="1.5" fill="#f3dc94" fill-opacity=".85"/>'; }
      var ag = VS[2];
      s += '<g transform="translate(120 27)"><circle r="10.5" fill="' + ag.hi + '" stroke="' + ag.sh + '" stroke-width=".8"/><circle r="8" fill="' + ag.face + '" stroke="' + ag.sh + '" stroke-opacity=".5"/><text y="3" text-anchor="middle" font-family="Jost,Arial,sans-serif" font-size="7.5" font-weight="700" fill="#ffffff">Ag</text></g>';
      return s;
    },
    /* Coming-soon thumbnails (r5 polish): every part sits inside its frame, with the same gold, silver and night palette */
    roulette: function (i) {
      var s = '<circle cx="120" cy="80" r="62" fill="' + u(i.g) + '"/><circle cx="120" cy="80" r="57" fill="#2a1d0c"/><circle cx="120" cy="80" r="53" fill="#07140e" stroke="#d9b75f" stroke-opacity=".35"/>', N = 19;
      for (var k = 0; k < N; k++) {
        var a0 = (k / N - .25) * Math.PI * 2, a1 = ((k + 1) / N - .25) * Math.PI * 2, R0 = 46, R1 = 32;
        var P = function (r, a) { return (120 + r * Math.cos(a)).toFixed(1) + " " + (80 + r * Math.sin(a)).toFixed(1); };
        s += '<path d="M' + P(R1, a0) + "L" + P(R0, a0) + "A" + R0 + " " + R0 + " 0 0 1 " + P(R0, a1) + "L" + P(R1, a1) + "A" + R1 + " " + R1 + ' 0 0 0 ' + P(R1, a0) + 'z" fill="' + (k === 0 ? "#2e7d5b" : k % 2 ? "#0c1f16" : "#8a2424") + '" stroke="#d9b75f" stroke-opacity=".55" stroke-width=".6"/>';
      }
      s += '<circle cx="120" cy="80" r="32" fill="' + u(i.r) + '" stroke="' + u(i.g) + '" stroke-width="1.5"/><circle cx="120" cy="80" r="9" fill="' + u(i.g) + '"/>';
      [0, 1, 2, 3].forEach(function (q) { var a = q * Math.PI / 2 + Math.PI / 4, x = 120 + 22 * Math.cos(a), y = 80 + 22 * Math.sin(a); s += '<path d="M120 80L' + x.toFixed(1) + " " + y.toFixed(1) + '" stroke="' + u(i.g) + '" stroke-width="2.4" stroke-linecap="round"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6" fill="' + u(i.gh) + '"/>'; });
      return s + '<circle cx="' + (120 + 49.5 * Math.cos(-1.1)).toFixed(1) + '" cy="' + (80 + 49.5 * Math.sin(-1.1)).toFixed(1) + '" r="3.2" fill="' + u(i.s) + '"/>';
    },
    cards: function (i) {
      var suit = function (x, y, k) { return '<path transform="translate(' + x + " " + y + ") scale(" + k + ')" d="M0-8L6 0 0 8-6 0z" fill="#9c2a2a"/>'; };
      var spade = function (x, y, k) { return '<path transform="translate(' + x + " " + y + ") scale(" + k + ')" d="M0-8C3-4 8-1 8 3c0 3-3 5-6 3l1 4h-6l1-4c-3 2-6 0-6-3 0-4 5-7 8-11z" fill="#0c1f16"/>'; };
      var c = function (x, rot, l, red) { return '<g transform="rotate(' + rot + " " + (x + 29) + ' 128)"><rect x="' + x + '" y="34" width="58" height="84" rx="6" fill="#f4f1e8" stroke="' + u(i.g) + '" stroke-width="1.6"/><rect x="' + (x + 4) + '" y="38" width="50" height="76" rx="4" fill="none" stroke="#d9b75f" stroke-opacity=".45"/><text x="' + (x + 8) + '" y="51" font-family="Georgia,serif" font-size="12" font-weight="700" fill="' + (red ? "#9c2a2a" : "#0c1f16") + '">' + l + "</text>" + (red ? suit(x + 29, 78, 1.6) : spade(x + 29, 77, 1.6)) + "</g>"; };
      var chip = function (x, y, col) { return '<ellipse cx="' + x + '" cy="' + (y + 3) + '" rx="13" ry="4.5" fill="#000" fill-opacity=".35"/><ellipse cx="' + x + '" cy="' + y + '" rx="13" ry="4.5" fill="' + col + '" stroke="#eef0f4" stroke-opacity=".6" stroke-dasharray="3 3"/>'; };
      return '<ellipse cx="120" cy="118" rx="96" ry="22" fill="#123b2c" fill-opacity=".55" stroke="#d9b75f" stroke-opacity=".3"/>' + c(66, -11, "A", false) + c(112, 9, "K", true) + chip(190, 122, u(i.g)) + chip(190, 116, u(i.s)) + chip(190, 110, u(i.g)) + chip(52, 124, u(i.s));
    },
    keno: function (i) {
      var s = '<rect x="46" y="24" width="148" height="112" rx="10" fill="' + u(i.r) + '" stroke="#d9b75f" stroke-opacity=".3"/>', picks = [3, 8, 11, 14, 17, 22], hits = [8, 14, 22];
      for (var r = 0; r < 4; r++) for (var c = 0; c < 6; c++) {
        var n = r * 6 + c + 1, on = picks.indexOf(n) >= 0, hit = hits.indexOf(n) >= 0, x = 66 + c * 21.6, y = 44 + r * 24;
        s += '<circle cx="' + x.toFixed(1) + '" cy="' + y + '" r="8.5" fill="' + (hit ? u(i.gh) : on ? "#3a3220" : "#0c1f16") + '" stroke="' + (on ? "#d9b75f" : "#c3cad6") + '" stroke-opacity="' + (on ? .9 : .3) + '"/>' +
          '<text x="' + x.toFixed(1) + '" y="' + (y + 2.6) + '" text-anchor="middle" font-family="Jost,Arial,sans-serif" font-size="7.4" font-weight="700" fill="' + (hit ? "#1a1203" : on ? "#e9cd7d" : "#98a1b4") + '">' + n + "</text>";
      }
      return s;
    },
    scratch: function (i) {
      var s = '<rect x="50" y="26" width="140" height="106" rx="10" fill="' + u(i.r) + '" stroke="' + u(i.g) + '" stroke-width="2.2"/><text x="120" y="42" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-weight="700" letter-spacing="1" fill="#e0c06e">MATCH 3</text>';
      [0, 1, 2].forEach(function (k) {
        var x = 64 + k * 38;
        s += '<rect x="' + x + '" y="52" width="34" height="34" rx="5" fill="#070a12" stroke="#d9b75f" stroke-opacity=".4"/><g transform="translate(' + (x + 5) + ' 57) scale(.375)">' + SYMB.crown(i) + "</g>";
        if (k === 2) s += '<rect x="' + x + '" y="52" width="34" height="34" rx="5" fill="' + u(i.sh) + '"/><path d="M' + (x + 4) + " 82c6-8 10-2 14-10s8-2 12-12" + '" stroke="#070a12" stroke-width="5" stroke-linecap="round" fill="none" opacity=".85"/>';
      });
      s += '<g><rect x="64" y="94" width="110" height="26" rx="5" fill="#c9cfd9"/><text x="119" y="111" text-anchor="middle" font-family="Jost,Arial,sans-serif" font-size="8" font-weight="700" letter-spacing=".6" fill="#262b34">SCRATCH HERE</text></g>';
      return s + '<g transform="translate(168 98) rotate(-24)"><circle r="12" fill="' + u(i.gh) + '" stroke="#7a5d1a"/><circle r="8.5" fill="none" stroke="#7a5d1a" stroke-opacity=".6"/></g>';
    }
  };
  function art(kind, cls) { var i = ids(); var d = DRAW[kind] || DRAW.bullion; return stage(i, d(i)).replace('class="art"', 'class="art ' + (cls || "") + '"'); }

  /* ---------- slot symbols (viewBox 0 0 64 64 content) ---------- */
  var SYMB = {
    crown: function (i) { return '<path d="M8 46L4 18l15 12 13-20 13 20 15-12-4 28z" fill="' + u(i.g) + '" stroke="#7a5d1a" stroke-width="1.5"/><rect x="8" y="48" width="48" height="8" rx="3" fill="' + u(i.gh) + '" stroke="#7a5d1a"/><circle cx="32" cy="34" r="4.5" fill="#b3263a"/><circle cx="18" cy="38" r="3" fill="' + u(i.s) + '"/><circle cx="46" cy="38" r="3" fill="' + u(i.s) + '"/>'; },
    diamond: function (i) { return '<path d="M10 24l10-12h24l10 12-22 30z" fill="' + u(i.s) + '" stroke="#5a6372" stroke-width="1.2"/><path d="M10 24h44M20 12l6 12 6-12 6 12 6-12M26 24l6 30 6-30" stroke="#fff" stroke-opacity=".8" stroke-width="1" fill="none"/><path d="M20 12l-10 12h16z" fill="#fff" fill-opacity=".35"/>'; },
    silverbar: function (i) { return '<rect x="12" y="4" width="40" height="56" rx="4.5" fill="' + u(i.s) + '" stroke="#5a6372" stroke-width="1.3"/><rect x="17" y="9" width="30" height="46" rx="2.5" fill="none" stroke="#5a6372" stroke-opacity=".7" stroke-width="1"/><path d="M14 6h36l-4 4H18z" fill="#fff" fill-opacity=".55"/><text x="32" y="30" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" fill="#3a414d">999</text><path d="M22 36h20" stroke="#3a414d" stroke-opacity=".6" stroke-width="1"/><text x="32" y="48" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" fill="#3a414d">Ag</text><path d="M44 14l2.5 3.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".8"/>'; },
    ingot: function (i) { return '<path d="M4 46l12-26h32l12 26z" fill="' + u(i.g) + '" stroke="#7a5d1a" stroke-width="1.2"/><path d="M16 20h32l-5 8H21z" fill="#fff3c9" fill-opacity=".55"/><text x="32" y="42" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="700" fill="#5a4210">999.9</text>'; },
    coin: function (i) { return '<circle cx="32" cy="32" r="26" fill="' + u(i.gh) + '"/><circle cx="32" cy="32" r="20" fill="' + u(i.g) + '" stroke="#7a5d1a"/><text x="32" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="22" font-weight="700" fill="#5a4210">V</text>'; },
    key: function (i) { return '<circle cx="20" cy="22" r="13" fill="none" stroke="' + u(i.s) + '" stroke-width="6"/><path d="M29 31l24 24M44 46l6-6M50 52l6-6" stroke="' + u(i.s) + '" stroke-width="6" stroke-linecap="round"/>'; },
    ring: function (i) { return '<circle cx="32" cy="40" r="17" fill="none" stroke="' + u(i.g) + '" stroke-width="5"/><path d="M22 18l10-12 10 12-10 10z" fill="' + u(i.s) + '" stroke="#5a6372"/><path d="M22 18h20" stroke="#fff" stroke-opacity=".8"/>'; }
  };
  function symbol(name, s) { var i = ids(); s = s || 64; return '<svg class="sym sym-' + name + '" width="' + s + '" height="' + s + '" viewBox="0 0 64 64" aria-hidden="true">' + defs(i) + (SYMB[name] || SYMB.coin)(i) + '</svg>'; }

  /* ---------- empty-state art ---------- */
  function empty(kind) { var i = ids(); var inner = kind === "cart" ? DRAW.bag(i) : kind === "seat" ? '<g transform="translate(60 20)">' + [0, 1, 2].map(function (k) { return '<rect x="' + (k * 42) + '" y="40" width="34" height="34" rx="6" fill="#0c1f16" stroke="' + u(i.s) + '" stroke-opacity=".5" stroke-dasharray="4 3"/>'; }).join("") + '</g>' : '<g transform="translate(84 44)"><circle cx="36" cy="36" r="34" fill="none" stroke="' + u(i.s) + '" stroke-opacity=".5" stroke-dasharray="5 5"/><path d="M24 36h24M36 24v24" stroke="' + u(i.g) + '" stroke-width="3" stroke-linecap="round"/></g>'; return stage(i, inner); }

  /* ---------- Vault Stack coin tiers: one palette for the board (vault.js writes it into CSS variables), the SVG coin faces,
     the games tile and the VIP row. Nine clearly different hues; dark faces carry white marks, light faces dark marks, and every
     mark keeps 4.5:1 or better on its face and 6:1 or better on its backdrop (mk). r12: Pd is darker than
     teal Pt so the two separate by lightness under deuteranopia. The mark on the top coin means tiers never rely on colour. */
  var VS = [
    { key: "cu", mark: "Cu", hue: "red", hi: "#ff8a80", face: "#c62828", sh: "#5c0b0b", edge: "#a81f1f", mk: "#b92828", ink: "#ffffff" },
    { key: "bz", mark: "Bz", hue: "orange", hi: "#ffd29a", face: "#f7901f", sh: "#8a4300", edge: "#d97510", mk: "#ffd29a", ink: "#2a1300" },
    { key: "ag", mark: "Ag", hue: "blue", hi: "#8fb2ff", face: "#173a8c", sh: "#081a45", edge: "#13317a", mk: "#1d43a0", ink: "#ffffff" },
    { key: "el", mark: "El", hue: "green", hi: "#8fe39a", face: "#18772f", sh: "#073516", edge: "#146428", mk: "#1a6f30", ink: "#ffffff" },
    { key: "au", mark: "Au", hue: "yellow", hi: "#fff6b0", face: "#ffd02a", sh: "#8f6a00", edge: "#e0ad12", mk: "#fff6b0", ink: "#2a1d00" },
    { key: "rg", mark: "RG", hue: "pink", hi: "#ffd6ea", face: "#ff78b6", sh: "#9c2a62", edge: "#e85d9f", mk: "#ffd6ea", ink: "#3a0620" },
    { key: "pt", mark: "Pt", hue: "teal", hi: "#7fe8dc", face: "#08766c", sh: "#023530", edge: "#07655d", mk: "#0b6e65", ink: "#ffffff" },
    { key: "pd", mark: "Pd", hue: "purple", hi: "#dcc2ff", face: "#7038cc", sh: "#2c0c5e", edge: "#5e2cb8", mk: "#7642d2", ink: "#ffffff" },
    { key: "cr", mark: "Cr", hue: "black and gold", hi: "#6a6478", face: "#16141c", sh: "#040306", edge: "#d4a437", mk: "#2c2934", ink: "#f5c84a" }];
  /* r1 N3: blue is a deeper royal navy and purple a touch lighter, so the two separate by lightness under deutan/protan
     (simulated dE 1.4 -> 21.1 deutan, 11.3 -> 25.6 protan); purple stays darker than teal (r12). */
  /* a Vault Stack coin seen from above: ridged rim, face, mark (Crown adds a crown), soft shine */
  /* v4: the label is the coin's number (Vault Stack v2); colours cycle, so t is the palette slot. Without a label the tier mark is drawn.
     Numbers use 24/48 of the coin (1-2 digits), so a 34px coin shows a 17px number; 3+ digits are fitted to the face. */
  function vsCoin(t, size, cls, label) {
    var p = VS[t], id = "vc" + (++uid), light = p.ink !== "#ffffff" && t !== 8, txt = label == null ? p.mark : String(label);
    var crown = t === 8 && label == null ? '<path d="M17 14.5l-1.2-6 3.8 3 4.4-5 4.4 5 3.8-3-1.2 6z" fill="' + p.ink + '"/>' : "";
    return '<svg class="vs-face ' + (cls || "") + '" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + id + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (t === 8 ? "#f8e2a0" : p.hi) + '"/><stop offset="1" stop-color="' + (t === 8 ? "#7a531a" : p.sh) + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.mk + '"/><stop offset=".6" stop-color="' + p.face + '"/><stop offset="1" stop-color="' + (light ? p.edge : p.sh) + '"/></linearGradient></defs>' +
      '<circle cx="24" cy="24" r="23" fill="url(#' + id + 'r)"/><circle cx="24" cy="24" r="22" fill="none" stroke="' + (light ? p.sh : "#000") + '" stroke-opacity=".35" stroke-dasharray="1.1 1.7"/>' +
      '<circle cx="24" cy="24" r="18.5" fill="url(#' + id + 'f)" stroke="' + (light ? p.sh : "#000") + '" stroke-opacity=".4"/>' + crown +
      '<text x="24" y="' + (crown ? 32.5 : label == null ? 30.5 : txt.length > 3 ? 29.6 : txt.length > 2 ? 31 : 32.4) + '" text-anchor="middle" font-family="Jost,Arial,sans-serif" font-size="' + (label == null ? (p.mark === p.mark.toUpperCase() ? 16 : 18) : txt.length > 3 ? 15 : txt.length > 2 ? 20 : 24) + '"' + (label != null && txt.length > 2 ? ' textLength="' + (txt.length > 3 ? 32 : 31) + '" lengthAdjust="spacingAndGlyphs"' : "") + ' font-weight="700" fill="' + p.ink + '">' + txt + "</text>" +
      '<ellipse cx="18" cy="13" rx="7" ry="2.6" fill="#fff" fill-opacity="' + (light ? .3 : .18) + '" transform="rotate(-25 18 13)"/></svg>';
  }
  window.Art = window.ValoremArt = { icon: icon, logo: logo, coin: coin, art: art, symbol: symbol, empty: empty, SYMBOLS: Object.keys(SYMB), VS: VS, vsCoin: vsCoin };
})();
