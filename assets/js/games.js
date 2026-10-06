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

  function showResult(text) {
    if (resultEl) resultEl.innerHTML = "<p class='stage-label'>Result</p><p>" + text + "</p>";
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

  function renderSlots(data, spinning) {
    var stage = document.querySelector("[data-stage]");
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="reels">' + data.grid[0].map(function (_, col) {
      return '<div class="reel' + (spinning ? " is-spin" : "") + '">' + [0, 1, 2].map(function (row) {
        return '<div class="sym">' + glyph(data.grid[row][col]) + "</div>";
      }).join("") + "</div>";
    }).join("") + "</div>";
  }
  function renderPlinko(data) {
    var stage = document.querySelector("[data-stage]");
    var rows = 8;
    var pegs = "";
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c <= r; c++) {
        var x = 50 + (c - r / 2) * 8;
        var y = 12 + r * 10;
        pegs += '<i class="peg" style="left:' + x + '%;top:' + y + '%"></i>';
      }
    }
    var x = 50;
    var rights = 0;
    data.path.forEach(function (bit) { rights += bit; });
    x = 50 + (rights - (data.path.length - rights)) * 4;
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="pegboard">' + pegs + '<i class="ball" style="left:' + x + '%;top:92%"></i></div><p class="muted">' + (skin.copy["aim-note"] || "") + "</p>";
  }
  function renderVault(data) {
    var stage = document.querySelector("[data-stage]");
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="board">' + data.board.map(function (n) {
      return '<div class="cell' + (n ? " on" : "") + '">' + (n ? n : "") + "</div>";
    }).join("") + '</div><div class="schedule"><span>Start 25 ' + V.goldName + '</span><span>Mint 10 ' + V.goldName + '</span><span>No boosters</span><span>No race room</span></div>';
  }
  var kenoPicked = [];
  function renderKeno(data) {
    var stage = document.querySelector("[data-stage]");
    var cells = "";
    for (var n = 1; n <= 80; n++) {
      var picked = kenoPicked.indexOf(n) >= 0 || data.picks.indexOf(n) >= 0;
      var cls = "spot" + (picked ? " pick" : "") + (data.draw.indexOf(n) >= 0 ? " draw" : "") + (data.hits.indexOf(n) >= 0 ? " hit" : "");
      cells += '<button class="' + cls + '" type="button" data-n="' + n + '" aria-pressed="' + (picked ? "true" : "false") + '" aria-label="Spot ' + n + '">' + n + "</button>";
    }
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="keno-grid">' + cells + "</div>";
    stage.querySelector(".keno-grid").onclick = function (e) {
      var btn = e.target.closest("[data-n]");
      if (!btn) return;
      var num = Number(btn.getAttribute("data-n"));
      var at = kenoPicked.indexOf(num);
      if (at >= 0) kenoPicked.splice(at, 1);
      else if (kenoPicked.length < 10) kenoPicked.push(num);
      renderKeno(data);
    };
  }
  function renderScratch(data) {
    var stage = document.querySelector("[data-stage]");
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="scratch-grid">' + data.marks.map(function (m, i) {
      return '<button class="foil' + (data.open ? " open" : "") + '" type="button" data-i="' + i + '" aria-label="Scratch spot ' + (i + 1) + '">' + glyph(m) + "</button>";
    }).join("") + "</div>";
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
  function renderRoulette(data) {
    var stage = document.querySelector("[data-stage]");
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><div class="wheel-wrap"><div class="pointer"></div><div class="wheel" style="transform:rotate(' + data.turn + 'deg)"></div></div><p class="muted">' + (data.pocket ? "Scripted pocket " + data.pocket + "." : "Wheel at rest.") + "</p>";
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
    stage.innerHTML = '<p class="stage-label">Stage · ' + skin.displayName + '</p><p class="hand-label">You</p>' + cards(data.you) + '<p class="hand-label">Dealer</p>' + cards(data.dealer);
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
    if (controls) controls.innerHTML = "<p class='stage-label'>Controls</p><p>" + (skin.copy.intro || "") + "</p><p class='muted'>" + (skin.copy.free || "") + "</p>";
    showResult("Free play stays inside the stage. Nothing is added to the wallet.");
    document.body.classList.add("game-ready");
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
    var data = rounds[id][index];
    var painter = painters[id];
    if (id === "slots") {
      painter(data, true);
      setTimeout(function () {
        painter(data, false);
        showResult(data.text);
        release(btn);
      }, 700);
    } else {
      painter(data, false);
      showResult(data.text);
      release(btn);
    }
  }

  if (controls) {
    var intro = skin.copy.intro || skin.copy["aim-note"] || skin.copy["empty-board"] || "";
    if (!signed) {
      controls.innerHTML = '<p class="stage-label">Controls</p><p>' + intro + '</p><a class="btn btn-gold" href="' + nextUrl + '">Sign in to play</a><p class="fine">' + spec.rtp + "</p>";
    } else if (low) {
      controls.innerHTML = '<p class="stage-label">Controls</p><p>' + intro + '</p><button class="btn btn-gold" type="button" disabled>Not enough ' + V.goldName + '</button><p class="note">Not enough ' + V.goldName + (id === "vault-stack" ? " to start a board. The live game starts at 25." : " to play a sample round.") + " The sample wallet is not changed.</p><p class='fine'>" + spec.rtp + "</p>";
    } else {
      controls.innerHTML = '<p class="stage-label">Controls</p><p>' + intro + '</p><button class="btn btn-gold" type="button" id="play-sample">Play sample round</button><p class="fine">' + spec.rtp + "</p>";
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
})();
