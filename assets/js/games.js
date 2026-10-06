/* Scripted sample rounds. Fixed sequences only. No Math.random and no payout math. */
(function () {
  var id = document.body.getAttribute("data-game");
  if (!id || !window.Valorem) return;
  var V = window.Valorem;
  var spec = V.games.filter(function (g) { return g.id === id; })[0];
  var skin = V.skin(id);
  if (!spec || !skin) return;
  var colors = skin.colors;
  Object.keys(colors).forEach(function (k) {
    document.documentElement.style.setProperty("--game-" + k.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); }), colors[k]);
  });
  ["felt", "surface", "text", "muted", "accent", "win", "danger", "peg", "ball", "chip", "line"].forEach(function (k) {
    if (colors[k]) document.documentElement.style.setProperty("--game-" + k, colors[k]);
  });

  if (spec.arcade) document.body.classList.add("is-arcade");
  var signed = V.state.signedIn;
  var stake = id === "vault-stack" ? 25 : 1;
  var low = signed && spec.kind !== "Free play" && V.state.gold < stake;
  var nextUrl = "login.html?next=" + encodeURIComponent(location.pathname);
  var wallet = document.querySelector(".shell-wallet");
  if (wallet) {
    var note = spec.kind === "Free play" ? "Free play. Balances are not used." : "Sample round. Balances are not changed.";
    var extra = "";
    if (spec.kind !== "Free play" && !signed) extra = '<a class="btn btn-ghost" href="' + nextUrl + '">Sign in to play</a>';
    else if (low) extra = '<p class="note">Not enough ' + V.goldName + (id === "vault-stack" ? ". A board starts at 25." : " for a sample round.") + "</p>";
    wallet.innerHTML = '<div><p class="stage-label">Wallet</p><div class="wallet-pair"><div><small>' + V.goldName + '</small><b>' + (signed ? V.state.gold.toLocaleString("en-US") : "—") + '</b></div><div><small>' + V.ipsName + '</small><b>' + (signed ? V.state.ips.toLocaleString("en-US") : "—") + '</b></div></div></div><p class="muted">' + note + "</p>" + extra;
  }
  var resultEl = document.querySelector(".shell-result");
  var historyEl = document.querySelector(".shell-history ul");
  var step = 0;

  var userMovedSincePlay = false;
  var programmaticScroll = false;
  function noteUserMove() { userMovedSincePlay = true; }
  function noteTouch(e) {
    if (e.target && e.target.closest && e.target.closest(".shell-controls")) return;
    userMovedSincePlay = true;
  }
  window.addEventListener("touchstart", noteTouch, { passive: true });
  window.addEventListener("wheel", noteUserMove, { passive: true });
  window.addEventListener("scroll", function () {
    if (!programmaticScroll) userMovedSincePlay = true;
  }, { passive: true });
  function syncPlayBar() {
    var bar = document.querySelector(".shell-controls");
    if (!bar) return;
    var h = Math.ceil(bar.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty("--play-bar", h + "px");
  }
  function showResult(text, scroll) {
    if (resultEl) resultEl.innerHTML = "<p class='stage-label'>Result</p><p>" + text + "</p>";
    var barLine = document.getElementById("bar-result");
    if (barLine) barLine.textContent = text;
    syncPlayBar();
    if (scroll && resultEl && !userMovedSincePlay) {
      var bar = document.querySelector(".shell-controls");
      var barTop = bar && getComputedStyle(bar).position === "fixed" ? bar.getBoundingClientRect().top : window.innerHeight;
      var rect = resultEl.getBoundingClientRect();
      var header = document.getElementById("chrome-top");
      var headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      if (rect.bottom > barTop - 8 || rect.top < headerBottom) {
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        programmaticScroll = true;
        resultEl.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
        setTimeout(function () { programmaticScroll = false; }, 900);
      }
    }
    if (historyEl) {
      if (!historyEl.dataset.live) { historyEl.innerHTML = ""; historyEl.dataset.live = "1"; }
      var li = document.createElement("li");
      li.textContent = text;
      historyEl.prepend(li);
    }
  }

  function glyph(symId) {
    var row = skin.symbols.filter(function (s) { return s.id === symId; })[0];
    return row ? row.art.value : "·";
  }

  var rounds = {
    slots: [
      { grid: [["s1", "s3", "s5", "s2", "s6"], ["s4", "s2", "s1", "s6", "s3"], ["s6", "s5", "s4", "s1", "s2"]], text: "Sample round. No aligned line." },
      { grid: [["s2", "wild", "s4", "s1", "s3"], ["wild", "wild", "wild", "wild", "wild"], ["s5", "s6", "s2", "s4", "s1"]], text: "Sample round. A scripted line of diamonds. No return is calculated here." }
    ],
    plinko: [
      { path: [1, 0, 1, 1, 0, 1, 0, 0], text: "Sample round. The ball followed a fixed path. No return is calculated here." },
      { path: [0, 0, 1, 0, 0, 1, 0, 1], text: "Sample round. A second fixed path. No return is calculated here." }
    ],
    "vault-stack": [
      { board: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], text: "Sample round. Empty board. Starting a board is 25 Valorem in the live game." },
      { board: [1, 0, 2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], text: "Sample round. Board started. Mint shown as a fixed placement, 10 Valorem in the live game." },
      { board: [0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], text: "Sample round. Two matching coins occupy one cell in the script. No value is calculated here." }
    ],
    keno: [
      { picks: [3, 14, 22, 41, 60], hits: [], draw: [], text: "Sample round. Five spots marked. The draw has not been shown." },
      { picks: [3, 14, 22, 41, 60], hits: [14, 22, 41, 60], draw: [7, 14, 19, 22, 28, 33, 41, 55, 60, 72], text: "Sample round. Scripted hits are 14, 22, 41, and 60. No return is calculated here." }
    ],
    scratch: [
      { marks: ["m1", "m5", "m2", "m10", "m1", "m25", "m2", "m50", "m5"], open: false, text: "Sample round. The card is still covered." },
      { marks: ["m10", "m10", "m2", "m5", "m10", "m1", "m25", "m2", "m50"], open: true, text: "Sample round. Three tens are on the scripted card. No return is calculated here." }
    ],
    roulette: [
      { turn: 0, text: "Sample round. The wheel is at rest." },
      { turn: 196, pocket: "17 red", text: "Sample round. The scripted pocket is 17 red. No bet is priced here." }
    ],
    blackjack: [
      { you: [["A", "spade", ""], ["9", "heart", "red"]], dealer: [["7", "club", ""]], text: "Sample round. Cards are placed from a fixed hand." },
      { you: [["A", "spade", ""], ["9", "heart", "red"]], dealer: [["7", "club", ""], ["K", "diamond", "red"]], text: "Sample round. The scripted hand stands. No total decides a return here." }
    ]
  };

  var SYM = { wild: "diamond", s1: "ring", s2: "key", s3: "ingot", s4: "coin", s5: "silverbar", s6: "crown" };
  var SCR = { m1: "coin", m2: "ring", m5: "key", m10: "diamond", m25: "ingot", m50: "silverbar", m100: "crown" };
  var ORDER = ["crown", "diamond", "silverbar", "ingot", "ring", "key", "coin"];
  function symSvg(name, size) {
    return window.ValoremArt ? ValoremArt.symbol(name, size || 64) : "";
  }
  function renderSlots(data, spinning) {
    var stage = document.querySelector("[data-stage]");
    var html = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="sl-cabinet"><div class="sl-marquee"><b>' + skin.displayName + '</b><small>Five reels. The diamond stands in.</small></div><div class="sl-window" role="img" aria-label="Reels">';
    for (var col = 0; col < 5; col++) {
      var face = [0, 1, 2].map(function (row) { return SYM[data.grid[row][col]] || "coin"; });
      var strip = face;
      if (spinning) {
        var fill = [];
        for (var i = 0; i < 18 + col * 2; i++) fill.push(ORDER[(i + col * 3) % ORDER.length]);
        strip = face.concat(fill);
      }
      var winRow = !spinning && data.grid[1].every(function (s) { return s === "wild"; });
      html += '<div class="sl-reel' + (spinning ? " is-spin" : "") + '"><div class="sl-strip">' + strip.map(function (s, i) {
        return '<div class="sl-cell' + (winRow && i === 1 ? " win" : "") + '">' + symSvg(s, 72) + "</div>";
      }).join("") + "</div></div>";
    }
    html += "</div></div>";
    stage.innerHTML = html;
    if (!spinning) return;
    stage.querySelectorAll(".sl-reel").forEach(function (re, r) {
      var stripEl = re.querySelector(".sl-strip");
      var cellH = re.clientHeight / 3 || 72;
      var n = stripEl.children.length;
      stripEl.style.transition = "none";
      stripEl.style.transform = "translateY(" + (-(n - 3) * cellH) + "px)";
      void stripEl.offsetHeight;
      stripEl.style.transition = "transform " + (780 + r * 90) + "ms cubic-bezier(.18,.72,.3,1)";
      stripEl.style.transform = "translateY(0)";
    });
  }
  var PK = { LEFT: 13, RIGHT: 387, PITCH: 34, SLOTS: 11, ROWS: 10, WALL: 3, RAIL: 24, TOP: 64, GAP: 27, PEG: 3.6, BALL: 8, SLOT_H: 36, W: 400 };
  PK.SLOT_Y = PK.TOP + (PK.ROWS - 1) * PK.GAP + 22;
  PK.H = PK.SLOT_Y + PK.SLOT_H + 8;
  var PK_VALUES = [0.2, 0.3, 0.4, 0.7, 1, 1.4, 1, 0.7, 0.4, 0.3, 0.2];
  function pkCenter(k) { return PK.LEFT + (k + 0.5) * PK.PITCH; }
  function pkEdge(j) { return PK.LEFT + j * PK.PITCH; }
  function pkRowY(r) { return PK.TOP + r * PK.GAP; }
  function plinkoPath(bits) {
    var a = 5, onCenter = true, i = a, lift = PK.PEG + PK.BALL - 1, pts = [{ x: pkCenter(a), y: PK.RAIL }], bi = 0;
    function bit() { var v = bits[bi % bits.length]; bi++; return v; }
    for (var r = 0; r < PK.ROWS; r++) {
      var y = pkRowY(r);
      if (onCenter) { pts.push({ x: pkCenter(i), y: y - lift }); if (bit()) i += 1; onCenter = false; }
      else if (i === 0) { pts.push({ x: PK.LEFT + PK.PEG + PK.BALL, y: y }); i = 0; onCenter = true; }
      else if (i === PK.SLOTS) { pts.push({ x: PK.RIGHT - PK.PEG - PK.BALL, y: y }); i = PK.SLOTS - 1; onCenter = true; }
      else { pts.push({ x: pkEdge(i), y: y - lift }); if (!bit()) i -= 1; onCenter = true; }
    }
    pts.push({ x: pkCenter(i), y: PK.SLOT_Y - PK.BALL - 1 });
    return { slot: i, points: pts };
  }
  function renderPlinko(data, animate) {
    var stage = document.querySelector("[data-stage]");
    var drop = plinkoPath(data.path || [0]);
    var pegs = "";
    for (var r = 0; r < PK.ROWS; r++) {
      if (r % 2 === 0) {
        for (var k = 0; k < PK.SLOTS; k++) pegs += '<circle class="pk-peg" cx="' + pkCenter(k) + '" cy="' + pkRowY(r) + '" r="' + PK.PEG + '"/>';
      } else {
        pegs += '<circle class="pk-peg wall" cx="' + PK.LEFT + '" cy="' + pkRowY(r) + '" r="' + PK.PEG + '"/>';
        for (var j = 1; j < PK.SLOTS; j++) pegs += '<circle class="pk-peg" cx="' + pkEdge(j) + '" cy="' + pkRowY(r) + '" r="' + PK.PEG + '"/>';
        pegs += '<circle class="pk-peg wall" cx="' + PK.RIGHT + '" cy="' + pkRowY(r) + '" r="' + PK.PEG + '"/>';
      }
    }
    var slots = "";
    PK_VALUES.forEach(function (m, k) {
      var x = pkEdge(k) + PK.WALL / 2, w = PK.PITCH - PK.WALL;
      var tier = m >= 1.4 ? "t1" : m >= 1 ? "t2" : m >= 0.7 ? "t3" : m >= 0.4 ? "t4" : "t5";
      slots += '<g class="pk-slot ' + tier + ( !animate && drop.slot === k ? " landed" : "") + '" data-slot="' + k + '"><rect x="' + x + '" y="' + PK.SLOT_Y + '" width="' + w + '" height="' + PK.SLOT_H + '" rx="4"/><text x="' + (x + w / 2) + '" y="' + (PK.SLOT_Y + 23) + '" text-anchor="middle">' + m + "</text></g>";
    });
    var start = animate ? drop.points[0] : drop.points[drop.points.length - 1];
    var svg = '<svg class="pk-svg" viewBox="0 0 ' + PK.W + " " + PK.H + '" role="img" aria-label="Plinko board">' +
      '<rect x="' + PK.LEFT + '" y="18" width="' + (PK.RIGHT - PK.LEFT) + '" height="' + (PK.SLOT_Y - 10) + '" rx="8" class="pk-well"/>' +
      pegs + slots +
      '<circle class="pk-ball" data-land="' + drop.slot + '" cx="' + start.x + '" cy="' + start.y + '" r="' + PK.BALL + '"/>' +
      "</svg>";
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="pk-stage">' + svg + '</div><p class="muted">' + (skin.copy["aim-note"] || "") + "</p>";
    if (!animate) return;
    var ball = stage.querySelector(".pk-ball");
    var pts = drop.points;
    var seg = 110;
    var t0 = performance.now();
    function frame(now) {
      if (!ball.isConnected) return;
      var t = Math.min(1, (now - t0) / ((pts.length - 1) * seg));
      var f = t * (pts.length - 1);
      var i = Math.min(pts.length - 2, Math.floor(f));
      var u = f - i;
      ball.setAttribute("cx", (pts[i].x + (pts[i + 1].x - pts[i].x) * u).toFixed(2));
      ball.setAttribute("cy", (pts[i].y + (pts[i + 1].y - pts[i].y) * u).toFixed(2));
      if (t < 1) requestAnimationFrame(frame);
      else {
        var landed = stage.querySelector('[data-slot="' + drop.slot + '"]');
        if (landed) landed.classList.add("landed");
      }
    }
    requestAnimationFrame(frame);
  }
  function renderVault(data) {
    var stage = document.querySelector("[data-stage]");
    var trays = data.board.map(function (n) {
      var pile = "";
      for (var k = 0; k < n; k++) {
        pile += '<i class="vs-coin' + (k === n - 1 ? " top" : "") + '" style="--k:' + k + '"><b>' + n + "</b></i>";
      }
      return '<div class="vs-tray' + (n ? " has" : "") + '">' + (n ? '<span class="vs-pile" style="--n:' + n + '">' + pile + "</span>" : "") + "</div>";
    }).join("");
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="vs-frame"><div class="vs-board">' + trays + '</div><div class="vs-mint" aria-hidden="true"><span>Mint</span><b>10 ' + V.goldName + '</b></div></div><div class="schedule"><span>Start 25 ' + V.goldName + '</span><span>Mint 10 ' + V.goldName + '</span><span>No boosters</span><span>No race room</span></div>';
  }
  var kenoPicked = [];
  function renderKeno(data) {
    var stage = document.querySelector("[data-stage]");
    var draws = data.draw || [];
    var hits = data.hits || [];
    var cells = "";
    for (var n = 1; n <= 80; n++) {
      var mine = kenoPicked.indexOf(n) >= 0;
      var drawn = !data.animate && draws.indexOf(n) >= 0;
      var hit = mine && !data.animate && hits.indexOf(n) >= 0;
      var cls = "spot" + (mine ? " pick" : "") + (drawn ? " draw" : "") + (hit ? " hit" : "");
      cells += '<button class="' + cls + '" type="button" data-n="' + n + '" aria-pressed="' + (mine ? "true" : "false") + '" aria-label="Spot ' + n + '">' + n + "</button>";
    }
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="kn-head"><p class="keno-tools"><button class="btn btn-ghost" type="button" id="quick-pick">Quick pick</button></p><div class="kn-balls" aria-hidden="true"></div></div><div class="keno-grid">' + cells + "</div>";
    stage.querySelector(".keno-grid").onclick = function (e) {
      var btn = e.target.closest("[data-n]");
      if (!btn) return;
      var num = Number(btn.getAttribute("data-n"));
      var at = kenoPicked.indexOf(num);
      if (at >= 0) kenoPicked.splice(at, 1);
      else if (kenoPicked.length < 10) kenoPicked.push(num);
      renderKeno(data);
    };
    var quick = document.getElementById("quick-pick");
    if (quick) quick.onclick = function () {
      kenoPicked = [3, 14, 22, 41, 60].slice();
      renderKeno(data);
    };
    if (data.animate && draws.length) {
      draws.forEach(function (n, i) {
        setTimeout(function () {
          if (!stage.isConnected) return;
          var b = stage.querySelector('[data-n="' + n + '"]');
          if (!b) return;
          b.classList.add("draw");
          if (kenoPicked.indexOf(n) >= 0 && hits.indexOf(n) >= 0) b.classList.add("hit");
          var rail = stage.querySelector(".kn-balls");
          if (rail) rail.insertAdjacentHTML("beforeend", "<b>" + n + "</b>");
        }, 90 * i);
      });
    }
  }
  function renderScratch(data) {
    var stage = document.querySelector("[data-stage]");
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="sc-card"><div class="sc-title"><b>' + skin.displayName + '</b><small>Match three</small></div><div class="scratch-grid">' + data.marks.map(function (m, i) {
      return '<button class="foil sc-cell' + (data.open ? " open" : "") + '" type="button" data-i="' + i + '" aria-label="Scratch spot ' + (i + 1) + '"><span class="sc-prize">' + symSvg(SCR[m] || "coin", 48) + "<b>" + glyph(m) + '</b></span><span class="sc-foil"></span></button>';
    }).join("") + "</div></div>";
    var grid = stage.querySelector(".scratch-grid");
    var dragging = false;
    function reveal(el) {
      if (el && el.classList.contains("foil")) el.classList.add("open");
    }
    grid.addEventListener("pointerdown", function (e) {
      var el = e.target.closest(".foil");
      if (!el) return;
      dragging = true;
      reveal(el);
      try { grid.setPointerCapture(e.pointerId); } catch (err) { /* already captured */ }
    });
    grid.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var hit = document.elementFromPoint(e.clientX, e.clientY);
      reveal(hit && hit.closest ? hit.closest(".foil") : null);
    });
    function stopDrag() { dragging = false; }
    grid.addEventListener("pointerup", stopDrag);
    grid.addEventListener("pointercancel", stopDrag);
  }
  var WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var REDS = { 1: 1, 3: 1, 5: 1, 7: 1, 9: 1, 12: 1, 14: 1, 16: 1, 18: 1, 19: 1, 21: 1, 23: 1, 25: 1, 27: 1, 30: 1, 32: 1, 34: 1, 36: 1 };
  function renderRoulette(data, animate) {
    var stage = document.querySelector("[data-stage]");
    var n = WHEEL.length;
    var slice = Math.PI * 2 / n;
    var wedges = WHEEL.map(function (num, i) {
      var a0 = i * slice - Math.PI / 2;
      var a1 = (i + 1) * slice - Math.PI / 2;
      var R = 142, r = 78;
      function pt(a, rad) { return (160 + rad * Math.cos(a)).toFixed(2) + " " + (160 + rad * Math.sin(a)).toFixed(2); }
      var mid = (a0 + a1) / 2;
      var color = num === 0 ? "#0d3b28" : REDS[num] ? "#9d2a32" : "#123024";
      var tx = (160 + 112 * Math.cos(mid)).toFixed(2);
      var ty = (160 + 112 * Math.sin(mid)).toFixed(2);
      return '<path d="M' + pt(a0, R) + " A" + R + " " + R + " 0 0 1 " + pt(a1, R) + " L" + pt(a1, r) + " A" + r + " " + r + " 0 0 0 " + pt(a0, r) + ' Z" fill="' + color + '"/><text aria-hidden="true" x="' + tx + '" y="' + ty + '" fill="#f4f6f4" font-size="14" font-weight="700" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + ((mid * 180 / Math.PI) + 90).toFixed(2) + " " + tx + " " + ty + ')">' + num + "</text>";
    }).join("");
    var pocket = data.pocket ? parseInt(data.pocket, 10) : 0;
    var idx = WHEEL.indexOf(pocket);
    if (idx < 0) idx = 0;
    var align = -((idx + 0.5) * (360 / n));
    var end = data.pocket ? align + 360 * 5 : 0;
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="rl-wrap"><div class="rl-pointer"></div><div class="rl-rotor" style="transform:rotate(' + (animate ? 0 : end) + 'deg)"><svg viewBox="0 0 320 320" class="rl-svg" role="img" aria-label="Roulette wheel">' + wedges + '<circle cx="160" cy="160" r="46" fill="#07140e" stroke="#d9b75f" stroke-width="3"/><circle cx="160" cy="160" r="150" fill="none" stroke="#d9b75f" stroke-width="8"/><circle cx="160" cy="160" r="70" fill="none" stroke="#c3cad6" stroke-width="2"/></svg></div><div class="rl-arm' + (animate ? " is-spin" : "") + '"><i class="rl-ball"></i></div></div><p class="muted">' + (data.pocket ? "Scripted pocket " + data.pocket + "." : "Wheel at rest.") + "</p>";
    if (!animate) return;
    var rotor = stage.querySelector(".rl-rotor");
    void rotor.offsetHeight;
    rotor.style.transition = "transform 1.5s cubic-bezier(.15,.7,.2,1)";
    rotor.style.transform = "rotate(" + end + "deg)";
  }
  var suitSvg = {
    spade: '<svg class="suit" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 1.2c.4 2.2 2.2 3.6 4.2 4.6 1.6.8 2.8 2.2 2.8 4.1a3.4 3.4 0 0 1-5.2 2.9c.5 1.6 1.2 3.2 1.6 4.4H6.6c.4-1.2 1.1-2.8 1.6-4.4A3.4 3.4 0 0 1 3 9.9c0-1.9 1.2-3.3 2.8-4.1C7.8 4.8 9.6 3.4 10 1.2z"/></svg>',
    heart: '<svg class="suit" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 17.2C5.2 13.6 2 10.6 2 7.4A3.6 3.6 0 0 1 8.2 6L10 7.8 11.8 6A3.6 3.6 0 0 1 18 7.4c0 3.2-3.2 6.2-8 9.8z"/></svg>',
    diamond: '<svg class="suit" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 1.5 17.5 10 10 18.5 2.5 10z"/></svg>',
    club: '<svg class="suit" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 2.2a3.1 3.1 0 0 1 1.6 5.7 3.2 3.2 0 1 1-1.2 6.1c.4 1.2.9 2.4 1.2 3.2H8.4c.3-.8.8-2 1.2-3.2A3.2 3.2 0 1 1 8.4 7.9 3.1 3.1 0 0 1 10 2.2z"/></svg>'
  };
  function renderBlackjack(data) {
    var stage = document.querySelector("[data-stage]");
    function cards(list) {
      return '<div class="cards">' + list.map(function (c) {
        return '<div class="playing-card ' + c[2] + '"><span>' + c[0] + "</span>" + (suitSvg[c[1]] || "") + "</div>";
      }).join("") + "</div>";
    }
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="bj-table"><p class="bj-who">Dealer</p>' + cards(data.dealer) + '<p class="bj-who">You</p>' + cards(data.you) + "</div>";
  }
  function renderArcade() {
    var stage = document.querySelector("[data-stage]");
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><iframe class="arcade-frame" title="' + skin.displayName + '" src="' + spec.arcade + '"></iframe>';
  }

  var painters = {
    slots: renderSlots,
    plinko: renderPlinko,
    "vault-stack": renderVault,
    keno: renderKeno,
    scratch: renderScratch,
    roulette: renderRoulette,
    blackjack: renderBlackjack
  };

  var controls = document.querySelector(".shell-controls");
  if (spec.arcade) {
    renderArcade();
    if (controls) controls.innerHTML = "<p class='stage-label'>Controls</p><p>" + (skin.copy.intro || "") + "</p><p class='bar-result' id='bar-result' aria-live='polite'></p><p class='muted'>" + (skin.copy.free || "") + "</p>";
    showResult("Free play stays inside the stage. Nothing is added to the wallet.");
    document.body.classList.add("game-ready");
    syncPlayBar();
    return;
  }

  var busy = false;
  var lastTap = 0;
  function release(btn) {
    setTimeout(function () {
      busy = false;
      if (!btn) return;
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
    }, 400);
  }
  function play(index, btn) {
    userMovedSincePlay = false;
    var data = rounds[id][index];
    var painter = painters[id];
    if (id === "slots") {
      painter(data, true);
      setTimeout(function () {
        painter(data, false);
        showResult(data.text, true);
        release(btn);
      }, 1400);
    } else if (id === "plinko" || id === "roulette") {
      painter(data, true);
      setTimeout(function () {
        showResult(data.text, true);
        release(btn);
      }, id === "roulette" ? 1600 : 1500);
    } else if (id === "keno") {
      if (data.picks && data.picks.length) kenoPicked = data.picks.slice();
      var drawing = data.draw && data.draw.length;
      painter(Object.assign({}, data, { animate: !!drawing }));
      setTimeout(function () {
        showResult(data.text, true);
        release(btn);
      }, drawing ? 90 * data.draw.length + 200 : 0);
    } else {
      painter(data, false);
      showResult(data.text, true);
      release(btn);
    }
  }

  if (controls) {
    var intro = skin.copy.intro || skin.copy["aim-note"] || skin.copy["empty-board"] || "";
    var barResult = '<p class="bar-result" id="bar-result" aria-live="polite"></p>';
    if (!signed) {
      controls.innerHTML = '<p class="stage-label">Controls</p><p>' + intro + '</p><a class="btn btn-gold" href="' + nextUrl + '">Sign in to play</a>' + barResult + '<p class="fine">' + spec.rtp + "</p>";
    } else if (low) {
      controls.innerHTML = '<p class="stage-label">Controls</p><p>' + intro + '</p><button class="btn btn-gold" type="button" disabled>Not enough ' + V.goldName + '</button><p class="note">Not enough ' + V.goldName + (id === "vault-stack" ? " to start a board. The live game starts at 25." : " to play a sample round.") + " The sample wallet is not changed.</p>" + barResult + "<p class='fine'>" + spec.rtp + "</p>";
    } else {
      controls.innerHTML = '<p class="stage-label">Controls</p><p>' + intro + '</p><button class="btn btn-gold" type="button" id="play-sample">Play sample round</button>' + barResult + '<p class="fine">' + spec.rtp + "</p>";
      document.getElementById("play-sample").onclick = function () {
        var now = Date.now();
        var btn = document.getElementById("play-sample");
        if (busy || !btn || btn.disabled || now - lastTap < 400) return;
        lastTap = now;
        busy = true;
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
        var data = rounds[id];
        play(step % data.length, btn);
        step += 1;
      };
    }
  }
  if (painters[id]) {
    if (id === "keno") painters[id]({ picks: [], hits: [], draw: [] });
    else if (id === "scratch") painters[id]({ marks: rounds.scratch[0].marks, open: false });
    else painters[id](rounds[id][0], false);
  }
  if (resultEl) resultEl.innerHTML = "<p class='stage-label'>Result</p><p>Play a sample round. The sequence is fixed.</p>";
  if (historyEl && !historyEl.children.length) {
    var li = document.createElement("li");
    li.textContent = "History appears here after a sample round.";
    historyEl.appendChild(li);
  }
  document.body.classList.add("game-ready");
  syncPlayBar();
  if (window.ResizeObserver && controls) new ResizeObserver(syncPlayBar).observe(controls);
  window.addEventListener("resize", syncPlayBar);
})();
