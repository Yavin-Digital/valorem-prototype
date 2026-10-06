# Valorem scope

```yaml
project_type: rez-operator
```

Prototype repo: `Yavin-Digital/valorem-prototype`.
Review URL (after publish from `main`): `https://valorem.clientreview.co`.
Later app repo, not part of this phase: `Yavin-Digital/valorem-rez`.

## Intake

| Field | Value |
|---|---|
| Operator id | `op_valorem` |
| Theme pack | `valorem` (this repo, `theme/valorem.theme.json`) |
| Games installed | `slots`, `plinko`, `vault-stack`, `keno`, `scratch`, `roulette`, `blackjack`, `hold-the-span`, `precinct-rumble`, `skyline-siege` |
| Games visible | same ten ids |
| Payment adapter | `mock` |
| License percent | |
| Domains | |
| Coin display names | GOLD: Valorem (plural Valorem). SWEEP: Ips |
| Suggested sweep per dollar | 1 (pack suggestion only; live rate is the control plane) |
| Capacity tier | |
| Zoom | |
| OtterText | |
| Env var names | |
| App spec | `.do/app.yaml` is written in Phase 3, not in this prototype |

Unknowns are left blank on purpose. Do not treat a blank as a researched value.

## Identity

| Field | Value |
|---|---|
| App name | Valorem |
| Slug | `valorem` |
| Legal entity | Valorem (Yavin Digital sample operator) — placeholder |
| Support email | concierge@valorem.example — placeholder |
| Tagline | Fine jewelry, gold and silver bullion, and live webinars. |
| Logo glyph | ◆ |

## Flows the prototype must keep

- Shop to cart to checkout to complete. A declined payment completes nothing.
- Sign in and register. Register requires an 18+ confirmation. No state list.
- Wallet shows both coins and six sample packs. Ips included with a pack are not a separate sale.
- Webinar seat map is numbered seats only. Hold is 45 seconds, then confirm burns Ips.
- Game shell order is wallet, stage, controls, result, history.
- Free entry is a web form for a signed-in player. Amount and caps are set by the operator. No mail-in.

## Not in scope

VIP tiers, live draw room, winner marquees, host console, admin, email templates, client-side outcomes, payout math, and sponsor placements.
