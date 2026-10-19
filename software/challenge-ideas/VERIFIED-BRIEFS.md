# Verified Event Briefs — Alliance ONE 2026

Source: `https://one.alliance.edu.in/assets/js/events.js?v=20260921-2` (retrieved 2026-10-10)
Cross-checked against the original WhatsApp forward.

> **Reliability caveat, stated up front:** the top of that JS file reads
> *"Demo data for the interactive prototype. Replace titles/content with the final official event data."*
> The coordinator contacts in the same file claim to come from the official brochure.
> Treat **fees, team sizes and prizes as high-confidence** (they match the forward) and
> **any future additions as unconfirmed**. No specific event dates are published — only
> "Alliance ONE 2026". Campus: Chandapura-Anekal Main Road, Bengaluru 562 106.

---

## CONFIRMED — brief was correct

| Event | Platform | Team | Fee | Prizes |
|---|---|---|---|---|
| Launchpad: Vision to Venture | CHATURANGA (Business) | Team of 2 | ₹500/Team | ₹1,00,000 / ₹50,000 / ₹25,000 |
| CodeSangram 3.0 | SHASTRA (Computing) | 1–5 members | ₹1,500/Team | ₹1,00,000 / ₹50,000 / ₹25,000 SM + special awards |
| Citi-Zen 2.0 | YANTRA (Applied Eng.) | 2–5 members | ₹799/Team | ₹15,000 / ₹10,000 / ₹5,000 track-wise + 4× ₹4,000 special |
| ProtoVision Ignite | YANTRA | 4 Participants | ₹500/Team | ₹10,000 / ₹5,000 / ₹3,000 + special awards |

**Citi-Zen special awards CONFIRMED verbatim** — Best Nature Based Solution ₹4,000 ·
Best Sustainable Infrastructure Innovation ₹4,000 · Best School Innovation ₹4,000 ·
Impact Award ₹4,000 (common to both tracks). Tracks are officially named
*Track 1: Citizen 2.0 - Build-Wise* and *Track 2: Citizen 2.0 - Nature-based Bengaluru*.

All six selected events are **Offline**.

---

## BREAKAGE 1 — Yuktih has a mandatory theme we never saw

```
theme: 'RENEWABLES & SUSTAINABLE ENERGY'
```

This field exists on **only one event in the entire slate**, and it is Yuktih.

**Impact:** the declared winner **THERMOLATCH** is a pharma cold-chain excursion tag.
Off-theme. Its runner-up **Rock** (vibration isolator) is also off-theme.

An off-theme entry is dead on arrival regardless of engineering quality. Yuktih must be
re-synthesised under the theme constraint.

**RESOLVED.** Re-synthesis rejected **13 of 20 concepts as off-theme**, including both the
old winner (THERMOLATCH) and the old runner-up (Rock). New winner **HALF-PULL** (human-powered
pumping energy harvester: PMDC turbine → BQ25570 → supercap/LFP, × Hall+IMU stroke-phase
gating), 55/60. Runner-up TEGARD, 53/60 — lost only on demo punch.

---

## BREAKAGE 2 — RanShastra registers PER GAME with fixed team sizes

The WhatsApp forward said "1–6 members, ₹100–₹500/team". Wrong. It is a **per-game,
per-platform registration table**:

| Platform | Game | Team format | Fee |
|---|---|---|---|
| PC | AstraArena – Valorant | **5 players per team** | ₹500 per team |
| PC | AstraArena – EAFC 25 (FIFA) | **Solo (1 player)** | ₹250 per player |
| Mobile | AstraArena – BGMI | **4 players per squad** | ₹500 per squad |
| Mobile | AstraArena – Free Fire Max | **4 players per squad** | ₹500 per squad |
| Mobile | AstraArena – Clash Royale | **Solo (1 player)** | ₹100 per player |

**Impact:** declared winner **SILENT-SQUAD** was justified as "₹470/unit, shared by the
squad, works for 1–6 players identically". That premise is false:

- Valorant's ₹500 is **₹100 per player**, so a ₹470 device is 4.7× the per-player budget
- Clash Royale is **solo** at ₹100 — there is no squad to share a device with
- FIFA is **solo** at ₹250

RanShastra must be re-synthesised against the real registration model.

**RESOLVED — and the old winner is now impossible, not merely weaker.** Both solo slots
(Clash Royale ₹100, FIFA ₹250) are un-enterable: the cheapest per-player device anywhere in
the four lens files is ₹410. The concept moved to **BGMI, 4-player squad, ₹500 → ₹125/player**.
New winner **SixBreaths** (PCM thermal-mass slab × CO₂ + ToF presence gating), 51/325,
₹122/player. Compliance is now trivially airtight — no camera, no microphone, no radio,
no path from any sensor to any button.

---

## NOT ONE OF OUR SIX, BUT IT WILL BITE SOMEONE

**The City Strategy Challenge is "Team of 2"** on the official site. The WhatsApp forward
said **Team of 4**. If anyone in your circle is planning on a 4-person strategy team,
they are planning wrong.

---

## Full platform map (8 platforms, 49 events)

| Platform | School | Events |
|---|---|---|
| CHATURANGA | Business / Ascent / Mgmt & Tech | 7 — incl. City Strategy, **Launchpad**, PeoplePulse, Bengaluru Analytics, Battle for Bengaluru, Finnova, Solving for Bengaluru |
| YANTRA | Applied Engineering | 6 — incl. **Citi-Zen**, **ProtoVision**, **Yuktih**, Aviation Aces, Bio-Bengaluru, Industry 4.0 |
| SHASTRA | Advanced Computing | 4 — **CodeSangram**, **RanShastra**, iPragyan ×2 |
| THE ART ALLY | Performing / Visual / Creative Arts | 6 |
| NYAYA SAMVADA | Law | 2 |
| MANTHAN | Liberal Arts & Humanities | 7 |
| SRIJAN | Design | 1 |
| ATHLOS | Student Support Services | 16 (sports) |