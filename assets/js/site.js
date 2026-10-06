/* Valorem prototype data and page behavior. Coin names and tokens come from VALOREM_PACK. */
(function () {
  var PACK = window.VALOREM_PACK;
  var GOLD = PACK.coins.GOLD.name;
  var IPS = PACK.coins.SWEEP.name;
  var HOLD_MS = 45 * 1000;
  var KEY = "valorem-prototype-v1";

  function skin(id) {
    return PACK.gameSkins.filter(function (s) { return s.gameId === id; })[0];
  }

  var games = [
    { id: "slots", href: "game-slots.html", kind: "Valorem wager", line: "Five reels and a diamond that stands in.", rtp: "Package figure 96.04 percent. Not a certified PAR sheet." },
    { id: "plinko", href: "game-plinko.html", kind: "Valorem wager", line: "A fixed sample path through the pegs.", rtp: "Package figure 96.02 percent at center aim. Other aims return less. Not a certified PAR sheet." },
    { id: "vault-stack", href: "game-vault-stack.html", kind: "Valorem wager", line: "25 Valorem to start. 10 Valorem to mint.", rtp: "No single RTP. Published schedule: start 25, mint 10, merges 20 and 5, peak 10, tier clear 100." },
    { id: "keno", href: "game-keno.html", kind: "Valorem wager", line: "Pick spots. The draw is server-side.", rtp: "Package figures 95.00 to 96.05 percent by pick count. Not a certified PAR sheet." },
    { id: "scratch", href: "game-scratch.html", kind: "Valorem wager", line: "A sample card with a fixed reveal.", rtp: "Package figure 94 percent. Not a certified PAR sheet." },
    { id: "roulette", href: "game-roulette.html", kind: "Valorem wager", line: "Single-zero wheel. Sample pocket only.", rtp: "Package figure 97.30 percent. Not a certified PAR sheet." },
    { id: "blackjack", href: "game-blackjack.html", kind: "Valorem wager", line: "A scripted hand. No total is scored here.", rtp: "Package figure 99.49 percent (95 percent CI 99.29 to 99.69). Not a certified PAR sheet." },
    { id: "hold-the-span", href: "game-hold-the-span.html", kind: "Free play", line: "Steer a squad. No wager.", rtp: "No wager and nothing is paid.", arcade: "arcade/hold-the-span/index.html", art: "assets/img/hold-the-span-card.webp" },
    { id: "precinct-rumble", href: "game-precinct-rumble.html", kind: "Free play", line: "A brawler. No wager.", rtp: "No wager and nothing is paid.", arcade: "arcade/precinct-rumble/index.html", art: "assets/img/precinct-rumble-card.webp" },
    { id: "skyline-siege", href: "game-skyline-siege.html", kind: "Free play", line: "A run-and-gun. No wager.", rtp: "No wager and nothing is paid.", arcade: "arcade/skyline-siege/index.html", art: "assets/img/skyline-siege-card.webp" }
  ];

  var packs = [
    { id: "starter", name: "Starter", usd: 5, gold: 5000, ips: 5 },
    { id: "classic", name: "Classic", usd: 10, gold: 10000, ips: 10 },
    { id: "reserve", name: "Reserve", usd: 20, gold: 20000, ips: 20, badge: "Sample favorite" },
    { id: "estate", name: "Estate", usd: 50, gold: 50000, ips: 50 },
    { id: "atelier", name: "Atelier", usd: 100, gold: 100000, ips: 100 },
    { id: "vault", name: "Vault", usd: 250, gold: 250000, ips: 250 }
  ];

  var products = [
    { sku: "gold-1oz-bar", name: "1 oz gold bar", maker: "Calder Refining", cat: "Gold bullion", usd: 4295, photo: "assets/img/gold-1oz-bar.webp", alt: "Small gold bar stamped 999.9 in warm low light", about: "Sample listing. A one-troy-ounce bar of .9999 fine gold, sealed with a serial-numbered assay card.", specs: [".9999 fine gold", "1 troy oz (31.1 g)", "Sealed assay card"] },
    { sku: "silver-kilo-bar", name: "1 kilo silver bar", maker: "Calder Refining", cat: "Silver bullion", usd: 2095, photo: "assets/img/silver-kilo-bar.webp", alt: "Fine-silver bar with a lion relief on a dark surface", about: "Sample listing. A one-kilogram bar of .999 fine silver with an assay card.", specs: [".999 fine silver", "1 kg (32.15 troy oz)", "Serial numbered"] },
    { sku: "diamond-solitaire-studs", name: "Diamond solitaire studs, 1 carat", maker: "Maison Vell", cat: "Jewelry", usd: 2450, photo: "assets/img/diamond-solitaire-studs.webp", alt: "Pair of diamond solitaire studs on a green card", about: "Sample listing. Two round brilliant diamonds, 1 carat total weight, in 14k rose gold.", specs: ["1 ct total weight", "14k rose gold", "Screw backs"] },
    { sku: "gold-cable-chain", name: "14k gold cable chain", maker: "Halden & Co.", cat: "Jewelry", usd: 850, photo: "assets/img/gold-cable-chain.webp", alt: "Fine gold chains on a grey stone slab", about: "Sample listing. A 20-inch cable chain in solid 14k yellow gold.", specs: ["14k yellow gold", "20 in, 1.5 mm", "Lobster clasp"] },
    { sku: "gold-50g-bar", name: "50 gram gold bar", maker: "Calder Refining", cat: "Gold bullion", usd: 6890, photo: "assets/img/gold-50g-bar.webp", alt: "Macro of a gold bar stamped 50 g fine gold 999.9", about: "Sample listing. A 50-gram minted bar of .9999 fine gold with an assay card.", specs: [".9999 fine gold", "50 g (1.61 troy oz)", "Sealed assay card"] },
    { sku: "gold-huggie-hoops", name: "14k gold huggie hoops", maker: "Maison Vell", cat: "Jewelry", usd: 695, photo: "assets/img/gold-huggie-hoops.webp", alt: "Gold huggie hoop earrings on a white block", about: "Sample listing. Solid 14k gold hoops with white sapphires and a hinged closure.", specs: ["14k yellow gold", "White sapphire accents", "Hinged snap closure"] },
    { sku: "sterling-anchor-chain", name: "Sterling silver anchor chain", maker: "Halden & Co.", cat: "Jewelry", usd: 245, photo: "assets/img/sterling-anchor-chain.webp", alt: "Polished sterling silver anchor chain", about: "Sample listing. A 20-inch anchor chain in polished 925 sterling silver.", specs: ["925 sterling silver", "20 in, 6 mm", "Lobster clasp"] },
    { sku: "pearl-bracelet-set", name: "Pearl bracelet and stud set", maker: "Maison Vell", cat: "Jewelry", usd: 395, photo: "assets/img/pearl-bracelet-set.webp", alt: "Pearl bracelet with golden pearl studs on black glass", about: "Sample listing. Freshwater pearls with a sterling clasp and golden pearl studs.", specs: ["Freshwater pearls", "7.5 in bracelet", "14k gold posts"] }
  ];

  var webinars = [
    { slug: "silver-100oz-pair", title: "Two 100-ounce silver bars", photo: "assets/img/silver-100oz-pair.webp", alt: "Two fine-silver bars on dark slate", state: "open", blurb: "Sample webinar. Two 100 oz bars of .999 fine silver, each with an assay card.", value: 12700, seats: 250, price: 10, when: "Sample listing, next evening", host: "Celeste Moreau", role: "Sample host" },
    { slug: "diamond-halo-studs", title: "Diamond halo stud earrings, 2 carats", photo: "assets/img/diamond-halo-studs.webp", alt: "Diamond halo stud earrings on black glass", state: "open", blurb: "Sample webinar. Round brilliant centers in a diamond halo, set in 14k white gold.", value: 8400, seats: 300, price: 15, when: "Sample listing", host: "Julian Hart", role: "Sample host" },
    { slug: "cuban-link-chain", title: "18k gold Cuban link chain", photo: "assets/img/cuban-link-chain.webp", alt: "Polished gold curb link chain", state: "open", blurb: "Sample webinar. A 22-inch solid 18k yellow gold Cuban link chain.", value: 7400, seats: 300, price: 15, when: "Sample listing", host: "Celeste Moreau", role: "Sample host" },
    { slug: "ten-ounce-gold-bar", title: "Ten-ounce gold bar", photo: "assets/img/ten-ounce-gold-bar.webp", alt: "Gold bar on deep red cloth", state: "soon", blurb: "Sample webinar. A 10 oz cast bar of .9999 fine gold with an assay certificate.", value: 42600, seats: 500, price: 25, when: "Seats are not open in this sample", host: "Celeste Moreau", role: "Sample host" },
    { slug: "akoya-pearl-strand", title: "Akoya pearl strand", photo: "assets/img/akoya-pearl-strand.webp", alt: "Strand of white pearls on slate-blue cloth", state: "soon", blurb: "Sample webinar. An 18-inch strand of Akoya pearls with an 18k gold clasp.", value: 3200, seats: 200, price: 10, when: "Seats are not open in this sample", host: "Julian Hart", role: "Sample host" },
    { slug: "gold-bullion-set", title: "Five one-ounce gold bars", photo: "assets/img/gold-bullion-set.webp", alt: "Stacked fine-gold bullion bars", state: "full", blurb: "Sample webinar. Five 1 oz bars of .9999 fine gold in a presentation case.", value: 21500, seats: 400, price: 20, when: "Sample listing, seats marked full", host: "Celeste Moreau", role: "Sample host" },
    { slug: "gold-signet-ring", title: "18k gold signet ring", photo: "assets/img/gold-signet-ring.webp", alt: "Gold signet ring on a red cushion", state: "full", blurb: "Sample webinar. A solid 18k yellow gold signet ring.", value: 3400, seats: 250, price: 10, when: "Sample listing, seats marked full", host: "Julian Hart", role: "Sample host" },
    { slug: "diamond-tennis-bracelet", title: "Diamond tennis bracelet", photo: "assets/img/diamond-tennis-bracelet.webp", alt: "Diamond tennis bracelet on black fabric", state: "closed", blurb: "Sample webinar. A tennis bracelet in 14k white gold. This listing is closed.", value: 9800, seats: 300, price: 20, when: "Sample listing, closed", host: "Celeste Moreau", role: "Sample host" }
  ];

  var taken = {
    "silver-100oz-pair": [4, 11, 18, 27, 33, 46, 52, 61, 77, 84, 90, 102, 118, 140, 155, 166, 188, 201, 219, 240],
    "diamond-halo-studs": [2, 9, 15, 22, 40, 58, 73, 91, 110, 134],
    "cuban-link-chain": [6, 13, 29, 44, 67, 88, 121, 150, 177, 203]
  };

  var screens = [
    ["Home", "index.html"],
    ["Games", "games.html"],
    ["Shop", "shop.html"],
    ["Product", "product.html?sku=gold-1oz-bar"],
    ["Cart", "cart.html"],
    ["Checkout", "checkout.html"],
    ["Checkout complete", "checkout-complete.html"],
    ["Sign in", "login.html"],
    ["Register", "register.html"],
    ["Wallet", "wallet.html"],
    ["Webinars", "webinars.html"],
    ["Seat hold", "webinar.html?e=silver-100oz-pair"],
    ["Seat confirm", "webinar-confirm.html?e=silver-100oz-pair"],
    ["Free entry", "amoe.html"],
    ["Account", "account.html"],
    ["Terms", "terms.html"],
    ["Sweeps rules", "rules.html"],
    ["Privacy", "privacy.html"],
    ["Responsible play", "responsible-play.html"],
    ["How it works", "how-it-works.html"]
  ];

  function blank() {
    return { signedIn: false, name: "", email: "", gold: 0, ips: 0, cart: [], ledger: [], holds: {}, confirmed: {}, orders: [], requests: [], reminder: 0, ipsOnOrder: 0, receipt: null };
  }
  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw) return blank();
      var b = blank();
      Object.keys(b).forEach(function (k) { if (raw[k] !== undefined) b[k] = raw[k]; });
      return b;
    } catch (e) { return blank(); }
  }
  var state = load();
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    var badge = $(".cart-count");
    if (badge) badge.textContent = String(cartCount());
    var cartLink = $(".cart-link");
    if (cartLink) cartLink.setAttribute("aria-label", "Cart, " + cartCount() + (cartCount() === 1 ? " item" : " items"));
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function money(n) { return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(n) { return Number(n).toLocaleString("en-US"); }
  function coin(kind, amount) { return num(amount) + " " + (kind === "GOLD" ? GOLD : IPS); }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function product(sku) { return products.filter(function (p) { return p.sku === sku; })[0]; }
  function webinar(slug) { return webinars.filter(function (w) { return w.slug === slug; })[0]; }
  function packById(id) { return packs.filter(function (p) { return p.id === id; })[0]; }
  function gameById(id) { return games.filter(function (g) { return g.id === id; })[0]; }

  function toast(title, body) {
    var host = $("#toasts");
    if (!host) {
      host = document.createElement("div");
      host.id = "toasts";
      host.className = "toast-host";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = "<b>" + title + "</b>" + (body ? "<div class='muted'>" + body + "</div>" : "");
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 4200);
  }

  function cartCount() {
    return state.cart.reduce(function (s, l) { return s + l.qty; }, 0);
  }
  function cartTotal() {
    return state.cart.reduce(function (s, l) {
      var p = product(l.sku);
      return s + (p ? p.usd * l.qty : 0);
    }, 0);
  }
  function addLedger(coinKind, amt, note) {
    state.ledger.unshift({ t: Date.now(), coin: coinKind, amt: amt, note: note });
  }
  function signIn(name, email) {
    state.signedIn = true;
    state.name = name || state.name || "Sample player";
    state.email = email;
    if (!state.ledger.length) {
      state.gold = 25000;
      state.ips = 80;
      state.ledger = [
        { t: Date.now(), coin: "GOLD", amt: 25000, note: "Sample opening balance" },
        { t: Date.now(), coin: "SWEEP", amt: 80, note: "Sample opening balance" }
      ];
    }
    save();
  }

  function headerHTML() {
    var page = document.body.getAttribute("data-nav") || "";
    var primary = [
      ["Home", "index.html", "home"],
      ["Games", "games.html", "games"],
      ["Webinars", "webinars.html", "webinars"],
      ["Shop", "shop.html", "shop"],
      ["Wallet", "wallet.html", "wallet"],
      ["How it works", "how-it-works.html", "how"]
    ];
    var links = primary.map(function (item) {
      var cur = item[2] === page ? ' aria-current="page"' : "";
      return '<a href="' + item[1] + '"' + cur + ">" + item[0] + "</a>";
    }).join("");
    var cartLink = '<a class="tool-link cart-link" href="cart.html" aria-label="Cart, ' + cartCount() + (cartCount() === 1 ? " item" : " items") + '"><span class="cart-word">Cart</span><span class="cart-count">' + cartCount() + "</span></a>";
    var tool = state.signedIn
      ? '<a class="bal-link" href="wallet.html"><span class="bal-full"><small>' + GOLD + '</small>' + num(state.gold) + '</span><span class="bal-full"><small>' + IPS + '</small>' + num(state.ips) + '</span><span class="bal-short">Wallet</span></a>'
      : '<a class="tool-link" href="login.html">Sign in</a>';
    var screenLinks = screens.map(function (s) {
      return '<a class="screen-link" href="' + s[1] + '">' + s[0] + "</a>";
    }).join("");
    var gameLinks = games.map(function (g) {
      return '<a class="screen-link" href="' + g.href + '">' + skin(g.id).displayName + "</a>";
    }).join("");
    return ''
      + '<a class="skip" href="#main">Skip to content</a>'
      + '<header class="site-header"><div class="wrap header-bar">'
      + '<a class="brand" href="index.html"><img src="assets/img/mark.svg" alt="" width="36" height="36"><span>Valorem</span></a>'
      + '<nav class="primary" aria-label="Primary">' + links + "</nav>"
      + '<div class="header-tools">' + cartLink + tool
      + '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-panel">Menu</button>'
      + "</div></div>"
      + '<div id="menu-panel" class="menu-panel" hidden><div class="wrap">'
      + '<nav class="menu-primary" aria-label="Primary">' + links + "</nav>"
      + '<p class="menu-label">All screens</p><nav class="screen-nav" aria-label="All screens">' + screenLinks + "</nav>"
      + '<p class="menu-label">Game shells</p><nav class="screen-nav" aria-label="Game shells">' + gameLinks + "</nav>"
      + "</div></div></header>";
  }

  function footerHTML() {
    return ''
      + '<footer class="site-footer"><div class="wrap footer-grid">'
      + '<div><a class="brand" href="index.html"><img src="assets/img/mark.svg" alt="" width="28" height="28"><span>Valorem</span></a>'
      + "<p>" + PACK.copy.tagline + "</p>"
      + '<p class="fine">Sample operator prototype. ' + PACK.legalEntity + ". Support " + PACK.supportEmail + " is a placeholder.</p></div>"
      + '<nav class="footer-links" aria-label="Legal">'
      + '<a href="terms.html">Terms</a><a href="rules.html">Sweeps rules</a><a href="privacy.html">Privacy</a>'
      + '<a href="responsible-play.html">Responsible play</a><a href="amoe.html">Free entry</a>'
      + "</nav>"
      + '<p class="fine">No purchase necessary. Free entry is a web form for signed-in players. The amount and any caps are set by the operator. ' + GOLD + " has no cash value. " + IPS + " are not sold.</p>"
      + "</div></footer>";
  }

  function mountChrome() {
    var top = $("#chrome-top");
    if (top && !top.dataset.ready) {
      top.innerHTML = headerHTML();
      top.dataset.ready = "1";
      var btn = $(".nav-toggle", top);
      var panel = $("#menu-panel", top);
      if (btn && panel) {
        function setMenu(open) {
          btn.setAttribute("aria-expanded", open ? "true" : "false");
          panel.hidden = !open;
        }
        btn.addEventListener("click", function () {
          setMenu(btn.getAttribute("aria-expanded") !== "true");
        });
        panel.addEventListener("click", function (e) {
          if (e.target.closest("a")) setMenu(false);
        });
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
            setMenu(false);
            btn.focus();
          }
        });
        document.addEventListener("click", function (e) {
          if (panel.hidden) return;
          if (!top.contains(e.target)) setMenu(false);
        });
      }
    }
  }
  function mountFooter() {
    var foot = $("#chrome-bottom");
    if (foot && !foot.dataset.ready) {
      foot.innerHTML = footerHTML();
      foot.dataset.ready = "1";
    }
  }

  function gameTile(g) {
    var s = skin(g.id);
    var media = g.art
      ? '<img src="' + g.art + '" alt="" width="640" height="360">'
      : '<span class="mark" aria-hidden="true">' + PACK.logoGlyph + "</span>";
    return '<a class="card tile lift" href="' + g.href + '"><div class="tile-media">' + media + '</div><div class="tile-body"><span class="tag">' + g.kind + "</span><h3>" + s.displayName + "</h3><p class='muted'>" + g.line + '</p><div class="tile-foot"><span class="faint">' + (g.kind === "Free play" ? "No wager" : GOLD) + '</span><span class="btn btn-gold">Open</span></div></div></a>';
  }
  function webinarCard(w) {
    var label = { open: "Seats open", soon: "Opens later", full: "Full", closed: "Closed" }[w.state];
    return '<a class="card lift photo-card" href="webinar.html?e=' + w.slug + '"><img src="' + w.photo + '" alt="' + w.alt + '" width="800" height="600"><div class="wcard-body"><span class="tag tag-silver">' + label + "</span><h3>" + w.title + "</h3><p class='muted'>" + w.price + " " + IPS + " per numbered seat</p></div></a>";
  }
  function productCard(p) {
    return '<a class="card lift photo-card" href="product.html?sku=' + p.sku + '"><img src="' + p.photo + '" alt="' + p.alt + '" width="800" height="600"><div class="wcard-body"><span class="sample">Sample</span><h3>' + p.name + '</h3><p class="muted">' + p.cat + " · " + p.maker + "</p><b>" + money(p.usd) + "</b></div></a>";
  }

  function paintHome() {
    var w = $("#home-webinars");
    var g = $("#home-games");
    if (w) w.innerHTML = webinars.filter(function (x) { return x.state === "open"; }).map(webinarCard).join("");
    if (g) g.innerHTML = games.slice(0, 4).map(gameTile).join("");
  }
  function paintGames() {
    var g = $("#game-floor");
    if (g) g.innerHTML = games.map(gameTile).join("");
  }
  function paintShop(cat) {
    var host = $("#catalog");
    if (!host) return;
    var list = products.filter(function (p) { return !cat || cat === "All" || p.cat === cat; });
    host.innerHTML = list.map(productCard).join("");
  }
  function paintProduct() {
    var host = $("#product");
    if (!host) return;
    var p = product(qs("sku")) || products[0];
    document.title = p.name + " · Valorem";
    host.innerHTML = '<div class="split"><img src="' + p.photo + '" alt="' + p.alt + '" width="900" height="700"><div><p class="crumbs"><a href="shop.html">Shop</a><span>/</span><span>' + p.cat + '</span></p><span class="sample">Sample listing</span><h1>' + p.name + '</h1><p class="lede">' + p.about + '</p><p><b>' + money(p.usd) + '</b></p><ul class="muted">' + p.specs.map(function (s) { return "<li>" + s + "</li>"; }).join("") + '</ul><p class="fine">Sample price. ' + IPS + " can mark a shop total down to $0. There is no per-item cap.</p><button class='btn btn-gold' type='button' id='add'>Add to cart</button></div></div>";
    $("#add").onclick = function () {
      var line = state.cart.filter(function (l) { return l.sku === p.sku; })[0];
      if (line) line.qty += 1; else state.cart.push({ sku: p.sku, qty: 1 });
      save();
      toast("Added to cart", p.name + ' <a href="cart.html">View cart</a>');
    };
  }
  function paintCart() {
    var host = $("#cart");
    if (!host) return;
    if (!state.cart.length) {
      host.innerHTML = '<div class="card card-pad"><h2>Your cart is empty</h2><p class="muted">The sample catalog is on the shop page.</p><a class="btn btn-gold" href="shop.html">Browse the shop</a></div>';
      return;
    }
    host.innerHTML = '<div class="split"><div class="card">' + state.cart.map(function (l) {
      var p = product(l.sku);
      return '<div class="cart-line"><img src="' + p.photo + '" alt="" width="96" height="72"><div><b>' + p.name + '</b><div class="muted">' + money(p.usd) + '</div></div><div class="qty"><button class="btn btn-quiet" type="button" data-dec="' + p.sku + '" aria-label="Decrease quantity, ' + p.name + '">−</button><span aria-live="polite">' + l.qty + '</span><button class="btn btn-quiet" type="button" data-inc="' + p.sku + '" aria-label="Increase quantity, ' + p.name + '">+</button></div></div>';
    }).join("") + '</div><aside class="card card-pad"><h2>Summary</h2><dl class="kv"><dt>Items</dt><dd>' + cartCount() + '</dd><dt class="total">Total</dt><dd class="total">' + money(cartTotal()) + '</dd></dl><p class="fine">Sample merchandise. ' + IPS + " may be applied at checkout, 1 " + IPS + " per $1, down to $0.</p><a class='btn btn-gold btn-block' href='checkout.html'>Checkout</a></aside></div>";
    host.onclick = function (e) {
      var d = e.target.getAttribute("data-dec");
      var i = e.target.getAttribute("data-inc");
      var sku = d || i;
      if (!sku) return;
      var line = state.cart.filter(function (l) { return l.sku === sku; })[0];
      if (!line) return;
      line.qty += i ? 1 : -1;
      if (line.qty <= 0) state.cart = state.cart.filter(function (l) { return l.sku !== sku; });
      save();
      paintCart();
    };
  }

  function gate(next) {
    return '<div class="card card-pad"><h2>Sign in to continue</h2><p class="muted">This sample flow keeps the account step. No server account is created.</p><a class="btn btn-gold" href="login.html?next=' + encodeURIComponent(next) + '">Sign in</a></div>';
  }

  function paintCheckout() {
    var host = $("#checkout");
    if (!host) return;
    if (!state.signedIn) { host.innerHTML = gate("checkout.html" + location.search); return; }
    var pack = packById(qs("pack"));
    var mode = pack ? "pack" : "shop";
    if (mode === "shop" && !state.cart.length) {
      host.innerHTML = '<div class="card card-pad"><h2>Nothing to check out</h2><p class="muted">Add a sample item, or choose a coin pack from the wallet.</p><div class="btn-row"><a class="btn btn-gold" href="shop.html">Shop</a><a class="btn btn-ghost" href="wallet.html">Wallet</a></div></div>';
      return;
    }
    var total = mode === "pack" ? pack.usd : cartTotal();
    var maxIps = mode === "shop" ? Math.min(state.ips, Math.floor(total)) : 0;
    state.ipsOnOrder = Math.min(state.ipsOnOrder || 0, maxIps);
    var due = Math.max(0, total - (mode === "shop" ? state.ipsOnOrder : 0));
    var kept = {
      name: $("#name") ? $("#name").value : state.name,
      num: $("#num") ? $("#num").value : "",
      exp: $("#exp") ? $("#exp").value : "",
      cvc: $("#cvc") ? $("#cvc").value : ""
    };
    var summary = mode === "pack"
      ? '<h2>' + pack.name + ' pack</h2><dl class="kv"><dt>Price</dt><dd>' + money(pack.usd) + '</dd><dt>' + GOLD + '</dt><dd>' + num(pack.gold) + '</dd><dt>' + IPS + ' included</dt><dd>' + pack.ips + '</dd><dt class="total">Due</dt><dd class="total">' + money(pack.usd) + '</dd></dl><p class="fine">Sample pack. ' + IPS + " are included at 1 per $1 and are not sold on their own. " + GOLD + " packs are non-refundable in the live product. A declined payment adds nothing.</p>"
      : '<h2>Shop order</h2><dl class="kv"><dt>Merchandise</dt><dd>' + money(total) + '</dd><dt>' + IPS + ' applied</dt><dd>' + state.ipsOnOrder + '</dd><dt class="total">Due</dt><dd class="total">' + money(due) + '</dd></dl><div class="btn-row" style="margin:12px 0"><button class="btn btn-quiet" type="button" id="ips-dec">Fewer ' + IPS + '</button><button class="btn btn-quiet" type="button" id="ips-inc">More ' + IPS + '</button></div><p class="fine">1 ' + IPS + ' marks $1 off, down to $0. You have ' + num(state.ips) + ' ' + IPS + '.</p>';
    host.innerHTML = '<div class="split"><form class="card card-pad" id="pay"><h2>Payment</h2><div class="note">Sample checkout. No card is charged. Use 4242 4242 4242 4242 to complete, or 4000 0000 0000 0002 to see a decline.</div><div class="field"><label for="name">Name on card</label><input class="input" id="name" autocomplete="cc-name"></div><div class="field"><label for="num">Card number</label><input class="input" id="num" inputmode="numeric" autocomplete="cc-number" maxlength="19" placeholder="1234 5678 9012 3456"></div><div class="grid g2"><div class="field"><label for="exp">Expiry</label><input class="input" id="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY"></div><div class="field"><label for="cvc">Security code</label><input class="input" id="cvc" inputmode="numeric" autocomplete="cc-csc" enterkeyhint="go" placeholder="123"></div></div><p class="err" id="pay-err" role="alert" hidden></p><button class="btn btn-gold btn-block" type="submit">Pay ' + money(due) + '</button></form><aside class="card card-pad">' + summary + '</aside></div>';
    $("#name").value = kept.name;
    $("#num").value = kept.num;
    $("#exp").value = kept.exp;
    $("#cvc").value = kept.cvc;
    var dec = $("#ips-dec");
    var inc = $("#ips-inc");
    if (dec) dec.onclick = function () { state.ipsOnOrder = Math.max(0, state.ipsOnOrder - 1); save(); paintCheckout(); };
    if (inc) inc.onclick = function () { state.ipsOnOrder = Math.min(maxIps, state.ipsOnOrder + 1); save(); paintCheckout(); };
    $("#pay").onsubmit = function (e) {
      e.preventDefault();
      var digits = ($("#num").value || "").replace(/\D/g, "");
      var err = $("#pay-err");
      if (digits.length < 16) { err.hidden = false; err.textContent = "Enter a 16-digit sample card."; return; }
      if (digits.indexOf("4000000000000002") === 0) {
        err.hidden = false;
        err.textContent = "Sample decline. Nothing was added and no " + IPS + " were spent.";
        return;
      }
      if (digits.indexOf("4242424242424242") !== 0) {
        err.hidden = false;
        err.textContent = "Use a labelled sample card to continue.";
        return;
      }
      var receipt;
      if (mode === "pack") {
        state.gold += pack.gold;
        state.ips += pack.ips;
        addLedger("GOLD", pack.gold, "Sample pack, " + pack.name);
        addLedger("SWEEP", pack.ips, "Sample " + IPS + " included with " + pack.name);
        receipt = { kind: "pack", title: pack.name + " pack", detail: coin("GOLD", pack.gold) + " and " + coin("SWEEP", pack.ips) + " added. Sample only." };
      } else {
        var spent = state.ipsOnOrder;
        state.ips -= spent;
        if (spent) addLedger("SWEEP", -spent, "Sample shop markdown");
        var id = "VL-" + String(state.orders.length + 41820);
        state.orders.unshift({ id: id, total: due, saved: spent, items: state.cart.map(function (l) { return product(l.sku).name + " × " + l.qty; }).join(", ") });
        state.cart = [];
        state.ipsOnOrder = 0;
        receipt = { kind: "shop", title: "Order " + id, detail: "Sample order recorded on this device. Due was " + money(due) + ". " + spent + " " + IPS + " applied." };
      }
      state.receipt = receipt;
      save();
      location.href = "checkout-complete.html";
    };
  }

  function paintComplete() {
    var host = $("#complete");
    if (!host) return;
    var r = state.receipt;
    if (!r) { host.innerHTML = '<div class="card card-pad"><h1>No sample receipt</h1><p class="muted">Complete a checkout to see this state.</p><a class="btn btn-gold" href="checkout.html">Checkout</a></div>'; return; }
    host.innerHTML = '<div class="card card-pad" style="text-align:center"><div class="success-mark" aria-hidden="true">◆</div><h1>' + r.title + '</h1><p class="lede" style="margin-inline:auto">' + r.detail + '</p><div class="btn-row" style="justify-content:center"><a class="btn btn-gold" href="wallet.html">Wallet</a><a class="btn btn-ghost" href="shop.html">Shop</a></div></div>';
  }

  function paintWallet() {
    var host = $("#wallet");
    if (!host) return;
    if (!state.signedIn) { host.innerHTML = gate("wallet.html"); return; }
    host.innerHTML = '<div class="coins">'
      + '<article class="coin-card gold"><span class="tag tag-gold">GOLD</span><h2>' + GOLD + '</h2><p style="font-size:2rem;margin:0">' + num(state.gold) + '</p><p class="muted">For games. No cash value. Sample balance.</p></article>'
      + '<article class="coin-card ips"><span class="tag tag-silver">SWEEP</span><h2>' + IPS + '</h2><p style="font-size:2rem;margin:0">' + num(state.ips) + '</p><p class="muted">For numbered seats and shop markdown. Not sold. Sample balance.</p></article>'
      + '</div><h2 style="margin-top:28px">Sample coin packs</h2><p class="muted">1 ' + IPS + ' per $1, the pack suggestion. The live rate is set in the control plane. ' + GOLD + ' amounts are samples.</p><div class="grid g3" id="pack-grid"></div><h2 style="margin-top:28px">Sample ledger</h2><div class="table-wrap"><table><thead><tr><th>Note</th><th>Amount</th></tr></thead><tbody>'
      + state.ledger.map(function (row) {
        var cls = row.amt >= 0 ? "pos" : "neg";
        return "<tr><td>" + row.note + "</td><td class='" + cls + "'>" + (row.amt > 0 ? "+" : "") + coin(row.coin, row.amt) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
    $("#pack-grid").innerHTML = packs.map(function (p) {
      return '<article class="card card-pad"><span class="sample">Sample</span>' + (p.badge ? '<div class="tag tag-gold" style="margin-top:8px">' + p.badge + "</div>" : "") + "<h3>" + p.name + "</h3><p><b>" + money(p.usd) + "</b></p><p class='muted'>" + num(p.gold) + " " + GOLD + "<br>" + p.ips + " " + IPS + " included</p><a class='btn btn-gold btn-block' href='checkout.html?pack=" + p.id + "'>Buy pack</a></article>";
    }).join("");
  }

  function paintAccount() {
    var host = $("#account");
    if (!host) return;
    if (!state.signedIn) { host.innerHTML = gate("account.html"); return; }
    host.innerHTML = '<div class="card card-pad"><h1>' + state.name + '</h1><p class="muted">' + state.email + "</p><dl class='kv'><dt>" + GOLD + "</dt><dd>" + num(state.gold) + "</dd><dt>" + IPS + "</dt><dd>" + num(state.ips) + "</dd><dt>Orders</dt><dd>" + state.orders.length + "</dd></dl><div class='btn-row'><a class='btn btn-gold' href='wallet.html'>Wallet</a><button class='btn btn-ghost' type='button' id='out'>Sign out</button></div></div>";
    $("#out").onclick = function () { state.signedIn = false; save(); location.href = "index.html"; };
  }

  function authForm(mode) {
    var host = $("#auth");
    if (!host) return;
    var next = qs("next") || "wallet.html";
    host.innerHTML = '<form class="card card-pad" id="form"><h1>' + (mode === "register" ? "Create a sample account" : "Sign in") + '</h1><p class="muted">Sample only. Any password of 4 or more characters is accepted on this device.</p>'
      + (mode === "register" ? '<div class="field"><label for="name">Name</label><input class="input" id="name" autocomplete="name" required></div>' : "")
      + '<div class="field"><label for="email">Email</label><input class="input" id="email" type="email" autocomplete="email" required></div>'
      + '<div class="field"><label for="pw">Password</label><input class="input" id="pw" type="password" autocomplete="' + (mode === "register" ? "new-password" : "current-password") + '" required></div>'
      + (mode === "register" ? '<label class="check"><input type="checkbox" id="age"><span>I am 18 or older.</span></label>' : "")
      + '<p class="err" id="err" role="alert" hidden></p><button class="btn btn-gold btn-block" type="submit">' + (mode === "register" ? "Register" : "Sign in") + '</button><p class="auth-switch">' + (mode === "register" ? '<a class="btn btn-ghost" href="login.html">Already have a sample session?</a>' : '<a class="btn btn-ghost" href="register.html">Register</a>') + "</p></form>";
    $("#form").onsubmit = function (e) {
      e.preventDefault();
      var err = $("#err");
      function fail(msg, field) {
        err.hidden = false;
        err.textContent = msg;
        if (field) {
          if (field.id === "age") field.setAttribute("aria-describedby", "err");
          field.focus();
        }
      }
      var email = $("#email").value.trim();
      var pw = $("#pw").value;
      if (email.indexOf("@") < 1) { fail("Enter an email address.", $("#email")); return; }
      if (pw.length < 4) { fail("Use at least 4 characters.", $("#pw")); return; }
      if (mode === "register" && !$("#age").checked) { fail("Confirm that you are 18 or older.", $("#age")); return; }
      var entered = mode === "register" ? $("#name").value.trim() : "";
      var keep = state.email === email && state.name ? state.name : "Sample player";
      signIn(entered || keep, email);
      location.href = next;
    };
  }

  function paintWebinars() {
    var host = $("#webinar-list");
    if (host) host.innerHTML = webinars.map(webinarCard).join("");
  }

  function holdLeft(slug) {
    var h = state.holds[slug];
    if (!h) return 0;
    return Math.max(0, h.until - Date.now());
  }
  function clearHold(slug) {
    delete state.holds[slug];
    save();
  }

  function paintWebinar() {
    var host = $("#webinar");
    if (!host) return;
    var w = webinar(qs("e")) || webinars[0];
    document.title = w.title + " · Valorem";
    var status = { open: "Seats open", soon: "Opens later", full: "Full", closed: "Closed" }[w.state];
    var body = '<div class="split"><div><img src="' + w.photo + '" alt="' + w.alt + '" width="900" height="680" style="border-radius:14px"><div class="card card-pad" style="margin-top:16px"><span class="sample">Sample webinar</span><h1>' + w.title + '</h1><p>' + w.blurb + '</p><dl class="kv"><dt>Seat price</dt><dd>' + w.price + " " + IPS + '</dd><dt>Numbered seats</dt><dd>' + num(w.seats) + '</dd><dt>When</dt><dd>' + w.when + '</dd><dt>Host</dt><dd>' + w.host + " · " + w.role + '</dd><dt>Sample catalog value</dt><dd>' + money(w.value) + "</dd></dl></div></div><div id='seat-side'></div></div>";
    host.innerHTML = body;
    var side = $("#seat-side");
    if (w.state !== "open") {
      side.innerHTML = '<div class="card card-pad"><h2>' + status + '</h2><p class="muted">The numbered seat map is available on open sample webinars.</p><a class="btn btn-ghost" href="webinars.html">All webinars</a></div>';
      return;
    }
    var confirmed = state.confirmed[w.slug] || [];
    var hold = state.holds[w.slug];
    if (hold && holdLeft(w.slug) <= 0) { clearHold(w.slug); hold = null; }
    var selected = hold ? hold.seats.slice() : [];
    var block = 0;
    var size = 50;
    function draw() {
      var left = holdLeft(w.slug);
      if (selected.length && left <= 0) { selected = []; clearHold(w.slug); toast("Hold ended", "The numbered seats returned to the map."); }
      var blocks = Math.ceil(w.seats / size);
      var lo = block * size + 1;
      var hi = Math.min(w.seats, lo + size - 1);
      var seats = "";
      for (var n = lo; n <= hi; n++) {
        var cls = "seat";
        var disabled = "";
        if (confirmed.indexOf(n) >= 0) { cls += " confirmed"; disabled = " disabled"; }
        else if ((taken[w.slug] || []).indexOf(n) >= 0) { cls += " taken"; disabled = " disabled"; }
        else if (selected.indexOf(n) >= 0) cls += " mine";
        seats += '<button class="' + cls + '" type="button" data-n="' + n + '"' + disabled + ' aria-label="Seat ' + n + '">' + n + "</button>";
      }
      var pager = "";
      for (var b = 0; b < blocks; b++) {
        var a = b * size + 1;
        var z = Math.min(w.seats, a + size - 1);
        pager += '<button class="pill" type="button" data-b="' + b + '" aria-pressed="' + (b === block) + '">' + a + "–" + z + "</button>";
      }
      var secs = Math.ceil(holdLeft(w.slug) / 1000);
      var clock = selected.length
        ? '<p class="hold-clock" id="clock" aria-hidden="true">Held for ' + secs + ' seconds</p><span id="clock-live" class="sr-only" aria-live="polite">Held for ' + secs + " seconds</span>"
        : '<p class="hold-clock">Choose a numbered seat</p>';
      var review = selected.length ? '<a class="btn btn-silver" href="webinar-confirm.html?e=' + w.slug + '">Review ' + selected.length + "</a>" : "";
      side.innerHTML = '<section class="card card-pad seat-card" aria-label="Seat map"><h2>Numbered seats</h2><p class="muted">' + PACK.copy.seatHoldHint + '</p>'
        + '<div class="legend"><span><i class="swatch" style="background:var(--seat-open-bg);border:1px solid var(--seat-open-line)"></i>Open</span><span><i class="swatch" style="background:var(--seat-mine-bg)"></i>Held</span><span><i class="swatch" style="background:var(--seat-taken-bg)"></i>Taken</span><span><i class="swatch" style="background:var(--seat-confirmed)"></i>Confirmed</span></div>'
        + '<div class="filters" id="pager">' + pager + '</div>'
        + '<div class="hold-bar">' + clock + review + '</div>'
        + '<div class="seat-map" id="map">' + seats + '</div>'
        + '<div class="btn-row" style="margin-top:12px"><button class="btn btn-ghost" type="button" id="pick">Pick numbered seats</button></div></section>';
      $("#pager").onclick = function (e) {
        var btn = e.target.closest("[data-b]");
        if (!btn) return;
        block = Number(btn.getAttribute("data-b"));
        draw();
      };
      $("#map").onclick = function (e) {
        var btn = e.target.closest("[data-n]");
        if (!btn || btn.disabled) return;
        if (!state.signedIn) { location.href = "login.html?next=" + encodeURIComponent(location.pathname + location.search); return; }
        var n = Number(btn.getAttribute("data-n"));
        var i = selected.indexOf(n);
        if (i >= 0) selected.splice(i, 1);
        else selected.push(n);
        if (!selected.length) clearHold(w.slug);
        else if (!state.holds[w.slug]) state.holds[w.slug] = { seats: selected.slice(), until: Date.now() + HOLD_MS };
        else state.holds[w.slug].seats = selected.slice();
        save();
        draw();
      };
      var pick = $("#pick");
      if (pick) pick.onclick = function () {
        if (!state.signedIn) { location.href = "login.html?next=" + encodeURIComponent(location.pathname + location.search); return; }
        var fixed = [7, 14, 21, 28, 36, 42, 55, 63, 70, 88, 96, 105];
        fixed.forEach(function (n) {
          if (selected.length >= 3) return;
          if (n > w.seats) return;
          if (selected.indexOf(n) >= 0 || confirmed.indexOf(n) >= 0 || (taken[w.slug] || []).indexOf(n) >= 0) return;
          selected.push(n);
        });
        if (!state.holds[w.slug]) state.holds[w.slug] = { seats: selected.slice(), until: Date.now() + HOLD_MS };
        else state.holds[w.slug].seats = selected.slice();
        save();
        block = 0;
        draw();
      };
    }
    draw();
    var spokenBucket = -1;
    setInterval(function () {
      var clock = $("#clock");
      if (!clock) return;
      var secs = Math.ceil(holdLeft(w.slug) / 1000);
      if (secs <= 0) { spokenBucket = -1; draw(); return; }
      clock.textContent = "Held for " + secs + " seconds";
      var live = $("#clock-live");
      var bucket = Math.ceil(secs / 5);
      if (live && bucket !== spokenBucket) {
        spokenBucket = bucket;
        live.textContent = "Held for " + secs + " seconds";
      }
    }, 250);
  }

  function paintConfirm() {
    var host = $("#confirm");
    if (!host) return;
    var w = webinar(qs("e")) || webinars[0];
    if (!state.signedIn) { host.innerHTML = gate("webinar-confirm.html?e=" + w.slug); return; }
    function draw() {
      var h = state.holds[w.slug];
      var left = holdLeft(w.slug);
      if (!h || !h.seats.length || left <= 0) {
        if (h && left <= 0) clearHold(w.slug);
        host.innerHTML = '<div class="card card-pad"><h1>No seats held</h1><p class="muted">A hold lasts 45 seconds. Choose numbered seats again.</p><a class="btn btn-gold" href="webinar.html?e=' + w.slug + '">Seat map</a></div>';
        return;
      }
      var cost = h.seats.length * w.price;
      var secs = Math.ceil(left / 1000);
      host.innerHTML = '<div class="card card-pad"><span class="sample">Confirm</span><h1>Confirm seats</h1><p>' + w.title + "</p><p>Seats " + h.seats.slice().sort(function (a, b) { return a - b; }).join(", ") + "</p><dl class='kv'><dt>Price</dt><dd>" + cost + " " + IPS + "</dd><dt>Your " + IPS + "</dt><dd>" + num(state.ips) + '</dd><dt>Hold</dt><dd class="hold-clock" id="cclock">' + secs + " seconds</dd></dl><p class='muted'>Confirming extends the hold briefly, then burns " + IPS + ".</p><p class='err' id='cerr' role='alert' hidden></p><div class='btn-row'><button class='btn btn-silver' type='button' id='do'>Confirm seats</button><a class='btn btn-ghost' href='webinar.html?e=" + w.slug + "'>Back to the map</a></div></div>";
      $("#do").onclick = function () {
        if (holdLeft(w.slug) <= 0) { draw(); return; }
        var need = h.seats.length * w.price;
        var err = $("#cerr");
        if (state.ips < need) { err.hidden = false; err.textContent = "Not enough " + IPS + " in the sample balance."; return; }
        state.ips -= need;
        addLedger("SWEEP", -need, "Sample seat confirm, " + w.title);
        state.confirmed[w.slug] = (state.confirmed[w.slug] || []).concat(h.seats);
        delete state.holds[w.slug];
        save();
        host.innerHTML = '<div class="card card-pad" style="text-align:center"><div class="success-mark">◆</div><h1>Seats confirmed</h1><p class="lede" style="margin-inline:auto">Sample burn of ' + need + " " + IPS + ". The live product does this on the server.</p><a class='btn btn-gold' href='wallet.html'>Wallet</a></div>";
      };
    }
    draw();
    setInterval(function () {
      var clock = $("#cclock");
      if (!clock) return;
      var secs = Math.ceil(holdLeft(w.slug) / 1000);
      if (secs <= 0) draw();
      else clock.textContent = secs + " seconds";
    }, 250);
  }

  function paintAmoe() {
    var host = $("#amoe");
    if (!host) return;
    if (!state.signedIn) { host.innerHTML = gate("amoe.html"); return; }
    host.innerHTML = '<form class="card card-pad" id="amoe-form"><h1>Free entry</h1><p class="muted">Web form for a signed-in player. The amount and any caps are set by the operator. There is no mail-in path in this prototype.</p><div class="field"><label for="nm">Name</label><input class="input" id="nm" autocomplete="name" required></div><div class="field"><label for="em">Email</label><input class="input" id="em" type="email" autocomplete="email" required></div><p class="fine">Submitting records a sample request on this device. It does not add ' + IPS + '.</p><button class="btn btn-ghost" type="submit">Submit request</button><p class="err" id="aerr" role="alert" hidden></p><div id="adone"></div></form>';
    $("#nm").value = state.name;
    $("#em").value = state.email;
    $("#amoe-form").onsubmit = function (e) {
      e.preventDefault();
      state.requests.unshift({ t: Date.now(), email: $("#em").value });
      save();
      $("#adone").innerHTML = '<p class="note" style="margin-top:12px">Request recorded. Amount and caps remain set by the operator.</p>';
    };
  }

  function paintResponsible() {
    var host = $("#remind");
    if (!host || !state.signedIn) return;
    host.innerHTML = '<form class="card card-pad" id="rform"><h2>Session reminder</h2><p class="muted">Stored on this device only.</p><div class="field"><label for="mins">Remind me after (minutes)</label><input class="input" id="mins" inputmode="numeric" value="' + (state.reminder || "") + '" placeholder="30"></div><button class="btn btn-gold" type="submit">Save reminder</button></form>';
    $("#rform").onsubmit = function (e) {
      e.preventDefault();
      var n = parseInt($("#mins").value, 10);
      state.reminder = n > 0 ? n : 0;
      save();
      toast("Reminder saved", state.reminder ? "Every " + state.reminder + " minutes, on this device." : "Reminder cleared.");
    };
  }

  function initPage() {
    var page = document.body.getAttribute("data-page");
    if (page === "home") paintHome();
    if (page === "games") paintGames();
    if (page === "shop") {
      paintShop("All");
      var bar = $("#cats");
      if (bar) bar.onclick = function (e) {
        var b = e.target.closest("[data-c]");
        if (!b) return;
        bar.querySelectorAll(".pill").forEach(function (p) { p.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        paintShop(b.getAttribute("data-c"));
      };
    }
    if (page === "product") paintProduct();
    if (page === "cart") paintCart();
    if (page === "checkout") paintCheckout();
    if (page === "checkout-complete") paintComplete();
    if (page === "wallet") paintWallet();
    if (page === "account") paintAccount();
    if (page === "login") authForm("login");
    if (page === "register") authForm("register");
    if (page === "webinars") paintWebinars();
    if (page === "webinar") paintWebinar();
    if (page === "webinar-confirm") paintConfirm();
    if (page === "amoe") paintAmoe();
    if (page === "responsible") paintResponsible();
  }

  window.Valorem = {
    pack: PACK,
    goldName: GOLD,
    ipsName: IPS,
    games: games,
    skin: skin,
    state: state,
    coin: coin,
    mountChrome: mountChrome,
    mountFooter: mountFooter,
    initPage: initPage,
    toast: toast
  };
})();
