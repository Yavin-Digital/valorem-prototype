# Valorem project guide

Phase 0–2 prototype for a Rez operator. The design source of truth is this repository. The live app (`valorem-rez`) is a later phase and is not created here.

## Run

```bash
python3 -m http.server 9061
```

Review target once published from `main`: `https://valorem.clientreview.co`.

## Stack

Hand-written HTML. Shared `assets/js/layout.js` (header, menu, footer) and `assets/js/site.js` (sample data and flows). Theme tokens come from `theme/valorem.theme.json`, applied by `theme/valorem.pack.js`. No `build.py`, no framework, no npm script required to view the site.

## Eighteen screens

| # | Screen | File |
|---|---|---|
| 1 | Home | `index.html` |
| 2 | Games | `games.html` |
| 3 | Shop | `shop.html` |
| 4 | Product | `product.html` |
| 5 | Cart | `cart.html` |
| 6 | Checkout | `checkout.html` |
| 7 | Checkout complete | `checkout-complete.html` |
| 8 | Sign in | `login.html` |
| 9 | Register | `register.html` |
| 10 | Wallet | `wallet.html` |
| 11 | Webinars | `webinars.html` |
| 12 | Seat hold | `webinar.html` |
| 13 | Seat confirm | `webinar-confirm.html` |
| 14 | Free entry | `amoe.html` |
| 15 | Account | `account.html` |
| 16 | Terms | `terms.html` |
| 17 | Sweeps rules | `rules.html` |
| 18 | Privacy | `privacy.html` |

Also linked: How it works, Responsible play, ten game shells, `brand.html`, and `presentation.html`.

Every screen is in the header Menu, under All screens, on desktop and on a phone.

## Game shells

Order on every game page: wallet, stage, controls, result, history.

| game id | Skin | File |
|---|---|---|
| slots | Valorem Reels | `game-slots.html` |
| plinko | Valorem Drop | `game-plinko.html` |
| vault-stack | Valorem Stack | `game-vault-stack.html` |
| keno | Valorem Draw | `game-keno.html` |
| scratch | Valorem Card | `game-scratch.html` |
| roulette | Valorem Wheel | `game-roulette.html` |
| blackjack | Valorem Table | `game-blackjack.html` |
| hold-the-span | Valorem Span | `game-hold-the-span.html` |
| precinct-rumble | Valorem Beat | `game-precinct-rumble.html` |
| skyline-siege | Valorem Siege | `game-skyline-siege.html` |

Wager rounds are labelled Sample round and use fixed sequences. `assets/js` does not call `Math.random` and does not compute a payout. Free games are the demo builds in `arcade/`, recolored with Valorem tokens. Their own play loops stay inside the stage. Sponsor ads in Hold the Span are an empty list.

## Coins

- GOLD displays as Valorem. Plural is Valorem.
- SWEEP displays as Ips.
- Suggested rate on the pack: `sweepPerDollar` 1.
- Sample opening balance: 25,000 Valorem and 80 Ips, on this device only. A fresh visit starts signed in so the header shows both coins. Sign out is on the account screen.
- A declined sample card (4000 0000 0000 0002) adds nothing.
- A shop order can apply Ips at 1 per dollar, down to $0. There is no per-item cap.

## Seats

Numbered seats only. Hold is 45 seconds (`copy.seatHoldHint`). Confirm burns Ips in the sample wallet. The confirm line says the hold extends briefly and does not invent a second duration. "Pick numbered seats" uses a fixed list, not a random draw.

## Brand assets

| Asset | Path | Source |
|---|---|---|
| Wordmark SVG | `assets/img/logo.svg` | Drawn for this prototype from Cormorant Garamond |
| Wordmark on light | `assets/img/logo-on-light.svg` | Same |
| Logo PNG | `assets/img/logo.png` | Raster of the wordmark, transparent |
| Inverted PNG | `assets/img/logo-inverted.png` | Deep-green wordmark, transparent |
| Mark | `assets/img/mark.svg` | Diamond |
| Share image | `assets/img/og-1200x630.png` | 1200×630 |
| Brand page | `brand.html` | |
| Brand PDF | `assets/Valorem-Brand-Standards.pdf` | Prepared by Yavin Digital |
| Deck | `presentation.html` | Arrow keys, click, full screen |

Photography is sample art from the Sterling Reserve sales demo. See the README.

## Theme check

`theme/valorem.theme.json` is the pack. `theme/skins.ts` and `theme/valorem.theme.ts` are the same pack in the Lumen file shape for Phase 4.

The private `rez-core` tag `v0.2.0` was not readable from this environment (the GitHub token returns 404 for that repository). A local contract check, written from `packages/contracts` rules in the Valorem plan, is what was run here. It is not a substitute for `parseThemePack` inside rez-core. Re-run that when the package is available:

```bash
npx tsx check.ts
```

Point `check.ts` at `theme/valorem.theme.json` and at `rez-core` `packages/contracts/src/theme.ts` from tag `v0.2.0`.

## What this prototype does not include

VIP, live draw room, host console, admin, email templates, mail-in entry, state list, client-side game RNG, payout math, and sponsor placements. The home does include a sample winners strip and the next webinar card.
