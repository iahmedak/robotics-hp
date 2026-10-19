# SYNTHESIS — RanShastra 3.0 / AstraArena E-sports Championship

**Re-synthesised under the verified per-game, per-platform, fixed-team-size registration model.**

The previous synthesis picked SILENT-SQUAD on a premise that is now known to be false: that a ₹470 device is "shared by the squad and works for 1–6 players identically." It is not shared — a three-finger keypad clamps to *your* hand and holds *your* phone, so it is a per-player cost against a per-player budget. That pick is discarded. Everything below is re-derived from the four raw lens files against the real slot table.

## The registration model this synthesis obeys

| Slot | Platform | Game | Fixed size | Fee | **Per-player budget** |
|---|---|---|---|---|---|
| PC | AstraArena – Valorant | 5 players | ₹500 | **₹100 / player** |
| Mobile | AstraArena – BGMI | 4 players | ₹500 | **₹125 / player** |
| Mobile | AstraArena – Free Fire Max | 4 players | ₹500 | **₹125 / player** |
| PC | AstraArena – EAFC 25 | 1 (solo) | ₹250 | **₹250 (solo)** |
| Mobile | AstraArena – Clash Royale | 1 (solo) | ₹100 | **₹100 (solo)** |

Two envelopes exist, and the distinction decides eighteen of twenty concepts:

- **Per-player devices** (anything worn, clipped, held, or worn-on-hand by one human) are tested against that slot's **per-player** figure: ₹100, ₹125 or ₹250.
- **Shared squad devices** (one object at the station that the whole squad reads or sits at) are tested against the **total squad fee of ₹500**, which is identical in Valorant, BGMI and FF Max.

---

## RECOMMENDED GAME SLOT

**AstraArena – BGMI · Mobile · 4 players per squad · ₹500 squad fee · ₹125 per player.**

Reasons, in order of weight:

1. **Both solo slots are arithmetically un-enterable.** The cheapest *per-player* device in all four lens files is STRAT-BRAKE at ₹410. The richest solo budget in the entire bracket is ₹250 (EAFC 25). Every per-player concept in every lens fails a solo slot on arithmetic alone, before any other test. Solo entries are structurally out.
2. **BGMI and FF Max are structurally identical** — 4 players, ₹500, ₹30,000 purse. They tie on every constraint, so they tiebreak on the winning concept's operating window: BGMI rounds and scrim blocks are longer than FF Max rounds at tournament settings, which is exactly the condition the booth-environment argument needs in order to have a measurable effect to show.
3. **A 4-squad is a better host for a shared device than a 5-stack.** Same ₹500 either way, but four players instead of five means a shared situational device covers a higher fraction of the squad and one fewer head needs to be served.
4. **Venue Wi-Fi is not a factor for this slot's winner**, which is worth more than the purse tiebreak.

Rejected: **Valorant** (see below), **FF Max** (tiebreak only), **EAFC 25** and **Clash Royale** (un-enterable).

---

## WINNER

**SIXBREATHS** — presence-gated phase-change thermal mass for a four-player booth, with booth CO₂ driving the release schedule.

- **Parent technology A — Energy & Power:** a 250 g PCM thermal-mass slab with an aluminium desk-edge spreader, charged by the venue's air-conditioning and released deliberately rather than passively.
- **Parent technology B — Sensing & Feedback:** an electrochemical CO₂ gas sensor plus a VL53L0X ToF presence sensor, gating the slab's release so the thermal mass is only spent when players are actually seated, and driving the fan duty and the per-seat exposure log.
- **Product, one line:** a desk-edge thermal buffer that arms the moment the fourth player sits down and spends its charge on a schedule, so a five-hour BGMI scrim block does not quietly tax the squad's reaction time through stale booth air.

**Per-player BOM for this slot (4-seat build, the BGMI squad size):**

| Item | ₹ |
|---|---|
| 250 g PCM slab + aluminium desk-edge spreader plate (4-seat) | 170 |
| Electrochemical CO₂ sensor (MQ-135 / MG-812 class) | 120 |
| VL53L0X ToF presence module | 140 |
| MOSFET/PWM driver + 60 mm fan + diffuser duct | 60 |
| **Total, one squad unit** | **₹490** |
| **Against ₹500 squad fee = ₹122/player equivalent** | **₹10 slack** |

**Why both parents are load-bearing:** remove the energy side and the PCM slab is an aluminium plate that tracks ambient within twenty minutes — an empty desk edge. Remove the sensing side and the slab dumps its charge on an empty seat, or sits inert because nothing told it to release. Presence-gated release is the whole mechanism: it converts a passive thermal mass into a schedule-aware one. Neither parent survives alone.

---

## COMPLIANCE DEFENCE

> "Everything on this desk is measuring the room, not the game. There is no camera, no microphone, no radio, no screen capture and no phone on this rig at all — the only inputs are a CO₂ sensor reading booth air and a ToF sensor reading whether a seat is occupied, and the only outputs are a fan and a slab of phase-change material moving heat around the desk edge. There is no electrical path from any sensor to any button, any mouse, any phone or any game process, and the device has no radio of any kind so it cannot see another team's station or another player's anything. It cannot read the game, it cannot write to the game, and it cannot even tell you where anybody is. It measures the air you are sitting in and spends a stored cold charge on you while you are actually there. That is the whole product."

**Structural guarantee, for the record:** compliance 5/5 is not an argument, it is an absence. There is no input path from this device to a game, no capture path from a game to this device, and no path to any other human being. This is the only concept in the field that cannot be disqualified, because there is nothing to disqualify it *for*.

---

## WHY THE OTHER SLOTS ARE WORSE

- **Valorant (5-stack, ₹500)** — same ₹500 squad envelope, but split over five registered heads instead of four, and BGMI's longer blocks give the booth-air argument a bigger effect to demonstrate. Buying a fourth seat of thermal mass instead of a fifth is the strictly better allocation of an identical ₹500.
- **Free Fire Max (4)** — structurally and financially identical to BGMI; the only separation is round length, and BGMI wins that tiebreak. This slot is not worse on merit, it just lost a coin-flip.
- **EAFC 25 (solo, ₹250)** — both solo slots are un-enterable: the cheapest per-player device anywhere in the four lenses is ₹410 against a ₹250 ceiling. Eighteen of twenty concepts fail here on arithmetic before any other test, and a four-seat shared booth module has no meaning when the entry is one person.
- **Clash Royale (solo, ₹100)** — a shared four-person booth has no squad to share it with, and ₹100 is the tightest budget on the board. Nonviable on both team-size and money.

---

## RUNNER-UP

**STRAT-BRAKE** — Edge AI & TinyML (offline INT8 timing inference over the squad's own match log) × Mechatronics (a four-channel servo/relay bank driving four physical LED bars on a desk stand).

It lost on one thing: **its timing input has to originate near your own screen**, and every practical source for that — an on-device camera reading your own HUD, a phone-side recorder, an app log — is either optically confusable with a cheat from two metres away, or dies on venue Wi-Fi. It is technically legal: the compliance doctrine explicitly permits reading your own screen. But under a ×4 compliance weight, *technically legal* and *reads like a cheat to a walking admin* are not the same score, and it lost more there than it won on match impact. Its genuine strength is real and should be stated: buy-phase and drop-phase decision latency is an actual tournament variable, and four physical bars map exactly onto a four-player squad. If this team's venue has good Wi-Fi and an admin who reads, it is the better bet.

---

## SCORECARD — SURVIVORS ONLY

Weighted: compliance ×4 · match-winning impact ×3 · fit to a real fixed-size slot ×3 · practicality with bad venue Wi-Fi ×2 · fusion strength ×1. **Maximum 325.**

| Concept | Compliance ×4 | Impact ×3 | Slot fit ×3 | Bad-Wi-Fi ×2 | Fusion ×1 | **Weighted total** |
|---|---|---|---|---|---|---|
| **SixBreaths** | 5 → 20 | 2 → 6 | 4 → 12 | 5 → 10 | 3 → 3 | **51** |
| **STRAT-BRAKE** | 4 → 16 | 3 → 9 | 4 → 12 | 4 → 8 | 3 → 3 | **48** |

SixBreaths wins on the two heaviest multipliers — compliance and offline practicality — both of which it maxes. It concedes one point of match-winning impact and does not recover it. Under the stated rubric, with a zero on compliance disqualifying the concept outright, the concept with no possible cheat surface is the correct pick even when its edge is slow-acting rather than sharp. **This is a low-scoring field and the reason is structural, not a failure of the field's quality: see the eliminations below.**

---

## THE EIGHTEEN HARD ELIMINATIONS

Test order: does the BOM fit the slot's envelope → does the concept's assumed team size match the slot's fixed size.

### Eliminated on a *shared-device* BOM against the ₹500 squad envelope

| Concept | BOM | vs ₹500 | Note |
|---|---|---|---|
| ResolveBoard | ₹2,250 | 4.5× over | The old winner. One board, one camera, whole team watches — genuinely shared, and still 4.5× over a 5-stack's entire fee. Dead. |
| ClapCast | ₹1,800 | 3.6× over | Shared VOD scrubber. Same arithmetic. |
| Sub-Gig Relay | ₹2,000 | 4.0× over | One squad mesh unit. |
| Lattice Mesh Slice | ₹3,100 | 6.2× over | |
| Band Beacon | ₹3,400 | 6.8× over | |
| Reaper Beacon | ₹2,950 | 5.9× over | |
| Pose Pin | ₹1,900 | 3.8× over | |
| DropZone Sentinel | ₹1,700 | 3.4× over | |
| VeriRIG | ₹1,380 | 2.8× over | |

### Eliminated on a *per-player* BOM against ₹100 / ₹125 / ₹250

| Concept | Cheapest build | Fails by | Note |
|---|---|---|---|
| GHOST-PALM | ₹520 | 4.2× vs ₹125 | |
| RECOIL-CUE | ₹480 | 3.8× vs ₹125 | Also the highest cheat-adjacency in the field: "a camera watches your hand and a motor moves your mouse" is a disqualifying sentence in an admin's ear, whatever the technical truth. |
| TILT-BRAKE | ₹470 | 3.8× vs ₹125 | The lens proposes a shared desk module with per-player sensors — impossible: a trigger-finger limiter needs a trigger finger, and each of four players has their own. |
| HandCurrent | ₹490 | 1.96× vs ₹250 | The closest miss in the whole field. TEG ₹150 + supercap/boost ₹70 + HX711 + one load cell ≈ ₹275 minimum with both parents intact. ₹275 vs ₹250 is not a fit. |
| SteadyHand | ₹485 | 1.94× vs ₹250 | Second closest miss. Trimming to ₹250 requires deleting the PV trickle strip and PCM pad — which deletes the energy parent and therefore the fusion. |
| TapHarvest | ₹460 | 1.84× vs ₹250 | Its designed home is Clash Royale, a ₹100 solo slot. 4.6× over. |
| ColdStart | ₹430 | 1.72× vs ₹250 | Also a *station* platform, not a personal device, so per-player attribution is meaningless and it fails slot-fit independently of budget. |
| SILENT-SQUAD | ₹470 | 3.8× vs ₹125, 4.7× vs ₹100 | The discarded pick. Per-player, not shared. Additionally a hard team-size failure on both solo slots: its entire value is N fingers bound to N teammates, and a solo entry has zero teammates. |
| Referee Press | ₹4,000 | — | Eliminated as a *team entry*, not on merit. Explicitly organiser capital, operated by the admin, outside players' reach. It is the best integrity device in the field and the team should still pitch it to the organisers as a sidecar while entering with SixBreaths. |

### Eliminated on *team size*

**SixBreaths' own six-seat framing** is why it had to be rebuilt as a four-seat unit before it could be scored at all. No slot registers six players: Valorant is 5, BGMI and FF Max are 4, both solo slots are 1. The original concept as written has no home; the 4-seat rebuild is what fits.

### The structural finding

**The cheapest per-player device in the entire four-lens set is ₹410.** The richest per-player budget in the entire bracket is ₹250 (EAFC 25 solo). Therefore **both solo slots are un-enterable by every concept in the field**, and no per-player device fits any team slot either. Every surviving candidate had to be a shared squad device, and only two shared devices in twenty concepts come in under ₹500: STRAT-BRAKE (₹410) and SixBreaths (₹490). That is the real constraint this re-synthesis exposed, and it is why the winner is a desk object rather than a gaming gadget.

---

## SQUAD DEPLOYMENT

- **4-squad (BGMI — the chosen slot): the intended deployment, and the only good one.** One desk-edge module at the station, four ToF presence gates across four seats, booth CO₂ driving both the fan duty cycle and the PCM release schedule, per-seat exposure-hours logged so bench rotation is scheduled on measured air exposure instead of a stopwatch.
- **5-stack (Valorant): marginal.** The unit works but covers four of five registered players. The fifth sits uncovered, and the per-seat exposure log is short one row. It is not broken, it is just worse value for the same ₹500.
- **Solo (EAFC 25 / Clash Royale): plainly does not work.** A four-seat shared thermal buffer for one person is a fan and a slab with no squad to share it with. Say this out loud to the jury rather than pretending — claiming solo applicability would be the first lie in the pitch.

**This concept suits exactly one deployment shape: a four-player squad.**

---

## BUILD PLAN

**Budget: ₹490 against a ₹500 squad fee. ₹10 of slack — treat that as zero.**

Before the first scrim, in this order:

1. **Prove the slab, or abandon the concept.** The entire product is 250 g of phase-change material holding a band. If it cannot reach and hold a usable ΔT against the venue's actual air-conditioning airflow, there is no product and no jury answer. This is the single point of failure and it is a materials question, not a software question.
2. **Calibrate the CO₂ sensor against a reference meter for two hours.** A cheap MQ-135 drifts, and a confidently wrong CO₂ number is worse than no number — it destroys the pitch live. Log drift, then decide whether a recalibration is needed at every round break.
3. **Tune ToF gating against clutter.** A bag on a seat, a jacket over a chair back, or a leaning teammate will all false-trigger. Ungated false-positives waste the thermal charge, which is the one thing the design cannot afford.
4. **Measure the actual venue booth, during the actual scrim block, hour-0 baseline first.** The jury number is the delta. If the venue's air is already adequate and there is no delta, there is no pitch — and that has to be known before the first scrim, not discovered at the demo table.
5. **Build two.** A slab that has not reached setpoint by the team's first match is a ₹490 paperweight, and BGMI fixtures run back-to-back with no recovery gap.

**Realistic note:** ₹490 is a build cost for one unit, not a club asset amortised across a squad. With a 4-squad entry that distinction disappears — one squad, one unit, one bill — which is the cleanest budget story any concept in this set has.

---

## BIGGEST RISK

**The device clipped to a player's phone mid-round is the exact failure this winner avoids by construction.** Nothing in this build is worn, held, strapped, clipped or aimed. There is no module on a phone, no camera pointed at a screen or a face, no mic listening to a comms channel, and no radio broadcasting at the other team's station. An admin walking a BGMI row sees a desk-edge plate, a small fan and a box with a vent — office equipment, not an overlay. That absence is the entire reason it scores 5 on compliance and the entire reason it wins under a ×4 weight.

**The risk that remains is the inverse, and it is real: the venue admin rules that a team may not modify the station at all.** A thermal module on the desk edge is in the same category as a mousepad or a cooling pad, but "same category" is an assumption, not a permission. Confirm with the organiser before the build, and have the fallback framing ready — a seat-back-only variant that touches nothing on the desk.

**Second risk, and the one most likely to actually cost the pitch: the CO₂ delta may be too small to demonstrate.** If the venue's ventilation is adequate, the team arrives with a fan, a slab, and no number. Design against that before the first scrim — the honest fallback pitch is per-seat exposure-hours logged and rotation scheduled against them, which is a smaller claim but still a real one, and is far better than a live demo that shows a flat line.