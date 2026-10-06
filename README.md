# Valorem prototype

Clickable design for Valorem, a sample operator on The Rez. Plain HTML, CSS, and JavaScript. No framework and no build step. GitHub Pages serves the site from the `main` branch at `https://valorem.clientreview.co`.

## Run it locally

```bash
python3 -m http.server 9061
```

Open `http://127.0.0.1:9061/`.

## Where decisions live

Coin names, colors, type, the tagline, and the seat-hold sentence live in `theme/valorem.theme.json`. `theme/valorem.pack.js` and `assets/css/tokens.css` mirror that file so the pages can read the same tokens. Change the JSON, then keep the two mirrors in step.

## Decisions Mike has set

- Game coin (GOLD): **Valorem**. Plural is also Valorem.
- Seat and shop coin (SWEEP): **Ips**.
- Field color is deep green (`#07140e`), with gold and silver accents.
- All ten games are on, as separate tiles.
- Vault Stack is the Rez wager: 25 Valorem to start a board, 10 Valorem to mint. No boosters and no race room.
- Arcade games are three separate tiles, free play, nothing paid.
- Seats are numbered only, with a 45-second hold, then confirm.
- Free entry is a web form for a signed-in player. Amount and caps are set by the operator. No mail-in.
- No VIP ranks, live draw room, winner marquee, host console, admin, or email templates.

## Defaults Mike can still change

| Item | Current value | Notes |
|---|---|---|
| Slug / operator id | `valorem` / `op_valorem` | |
| Legal entity | Valorem (Yavin Digital sample operator) | Placeholder |
| Support email | concierge@valorem.example | Placeholder |
| Tagline | Fine jewelry, gold and silver bullion, and live webinars. | |
| Logo glyph | ◆ | |
| Suggested Ips per dollar | 1 | Live rate is the control plane, not this pack |
| Sample Valorem in coin packs | 1,000 Valorem per $1 | Sample amounts, not a published rate |
| Payment adapter | mock | |
| Capacity tier | blank in SCOPE | Pipeline treats blank as small |
| Domains | blank | |
| Webinar copy and catalog | Sample listings and the eight sample products | |

## Gaps for Rath

- rez-core v0.2.0 has no product-detail route. This prototype still has `product.html` because the screen is required.
- The operator template `.do/app.yaml` uses `basic-xxs`. The Rez pipeline names `apps-s-1vcpu-1gb` times two.
- The rollout's first site is hard-coded as `yavin-rez`, not `valorem`.
- State eligibility, bullion compliance, and the real sweeps rules are for Rath and counsel. They are not invented here.
- This environment could not read the private `rez-core` repository, so `parseThemePack` from v0.2.0 was not executed here. The pack is written to that contract. See `PROJECT_GUIDE.md`.

## Sample photography

Product, webinar, and hero photographs are the sample set from the Sterling Reserve sales demo (`Yavin-Digital/sweeps-sales-demo`, branch `vault-v2`). They are samples, not a live catalog. The three free games are those demo builds, recolored with Valorem tokens, with sponsor placements removed.
