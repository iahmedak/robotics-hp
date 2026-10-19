# SYNTHESIS — Launchpad: Vision to Venture

**Council:** 5 lenses, 28 concepts, one rubric.
**Weighting:** Venture quality ×3, Fusion strength ×2, Buildability / Capital efficiency / Pitch punch ×1. Max = 45.

---

## WINNER — **ARCSEAM**

**Parent technologies:**
- **A — mmWave RF sensing:** 60 GHz FMCW radar (IWR6843AOP / BGT60TR13C) reading arc and puddle through spatter, smoke and blackout.
- **B — Mechatronic closed-loop actuation:** PID controller (STM32G4) trimming wire-feed and travel speed in real time to hold penetration and bead height.

**One-line product:** A retrofit kit for GMAW/MIG welding cells that senses the weld through the arc glare and closed-loops wire feed to hold penetration — making the highest-volume, most spattery welding process adaptive for the first time.

**Why it wins the room:** Every other concept in the council is competing for attention. ARCSEAM is the only one where the two technologies are not just both-needed but *mutually forced*: a 20,000 K arc destroys optical sensing, so the radar isn't a preference, it's the only instrument that survives the environment. And the radar without the actuator is a thermometer. The counterfactual doesn't degrade the product — it deletes it. That, plus a buyer who already loses 8–15% of welded-assembly cost to weld repair, plus a 55-hour demo, is the highest weighted score in the set.

---

## RUNNER-UP — **ZONEGUARD**

60 GHz radar + edge NPU classifying a machine-cell occupancy map into `clear` / `material-pass` / `human-entry`, replacing safety laser curtains that plants either bypass or fight for 10–30 nuisance stops a shift.

**Why it lost:** It lost on one point and only one — **buildability**. ARCSEAM needs one radar module, one MCU and a borrowed MIG rig. ZONEGUARD needs a TI IWR6843AOP, an STM32N6 (Neural-ART NPU, thin Indian distributor availability in 2026), a force-guided safety relay, and 72 h burn-in on a device whose failure mode is a press injury. For a team of exactly 2, a safety-rated electrical build is a different risk class than a weld cell. ZONEGUARD is arguably the *better company*; ARCSEAM is the one that survives judging day and can be handed to a real plant in three weeks.

*Honourable mention:* **SEATBEAT** (₹3.2k production BOM, Euro NCAP regulatory pull, 5–7 year design-in lock) is the highest-leverage concept in the corpus — but its first ₹1 of revenue is 3–5 years out, behind IATF 16949 and PPAP. A prize of ₹1,00,000 does not fund a PPAP programme.

---

## FULL SCORECARD — all 28 concepts, sorted

| # | Concept | Build | CapEff | Fusion | Venture | Pitch | **Weighted** |
|---|---|---|---|---|---|---|---|
| 1 | **ARCSEAM** (RF×actuation) | 4 | 4 | 5 | 5 | 5 | **38** |
| 2 | **ZONEGUARD** (vision×edge AI) | 3 | 5 | 5 | 5 | 4 | **37** |
| 3 | **SEATBEAT** (Wi-Fi CSI×IMU) | 5 | 5 | 5 | 4 | 4 | **36** |
| 4 | **SPINWARD** (event cam×edge NPU) | 2 | 4 | 5 | 5 | 4 | **35** |
| 5 | **TIPTRUE** (UWB×force-torque) | 3 | 3 | 5 | 4 | 4 | **32** |
| 6 | **SPECLINE** (hyperspectral×edge NPU) | 2 | 5 | 4 | 4 | 4 | **31** |
| 7 | **SYNCLINE** (GNSS PPS×strain gauge) | 5 | 3 | 5 | 3 | 3 | **30** |
| 8 | **TorqueHarvest** (actuation×kinetic harvest) | 4 | 3 | 5 | 3 | 4 | **30** |
| 9 | **CLEARNODE** (ceramic nanogrid×Matter) | 3 | 4 | 5 | 3 | 4 | **30** |
| 10 | **GLASSBOX** (moulded optic×surgical) | 1 | 3 | 5 | 4 | 4 | **30** |
| 11 | GLOWLINE (hydrogel×optical mesh) | 3 | 4 | 4 | 3 | 4 | **28** |
| 12 | SPARKPLATE (bio-composite×LoRaWAN) | 2 | 5 | 4 | 3 | 4 | **28** |
| 13 | COLDSPINE (aerogel×BLE telemetry) | 2 | 5 | 4 | 3 | 4 | **28** |
| 14 | THERMWATCH (thermal×edge NPU) | 4 | 4 | 3 | 3 | 4 | **27** |
| 15 | DOCKTRACE (stereo depth×edge NPU) | 4 | 4 | 3 | 3 | 4 | **27** |
| 16 | WEIGHPOINT (chipless RFID×strain gauge) | 5 | 2 | 5 | 2 | 4 | **27** |
| 17 | OVERTOOK (insert wear×SMT process) | 2 | 4 | 2 | 4 | 5 | **27** |
| 18 | BONDCHECK (bond mechanics×certification) | 3 | 4 | 3 | 3 | 5 | **27** |
| 19 | RAILKEEPER (rail wear×CFDS certification) | 2 | 4 | 3 | 3 | 5 | **26** |
| 20 | KERB (ceramic e-ink×DTN) | 4 | 4 | 3 | 3 | 3 | **26** |
| 21 | SEALED (thread chemistry×lift retrofit) | 3 | 3 | 4 | 3 | 3 | **26** |
| 22 | PolyPulse (actuator×PCM thermal cycling) | 4 | 3 | 3 | 3 | 3 | **25** |
| 23 | SIDEMOVE (CNC×post-processor SaaS) | 2 | 4 | 2 | 3 | 5 | **24** |
| 24 | SETPOINT (thermal comp×credit-back billing) | 3 | 5 | 2 | 2 | 5 | **23** |
| 25 | LINEUP (ultrasonic leak×ESCO finance) | 4 | 5 | 2 | 2 | 4 | **23** |
| 26 | KilnLock (delta robot×PCM kiln) | 4 | 2 | 3 | 2 | 3 | **21** |
| 27 | ColdChain Fermenter (servo×TEG cold stage) | 4 | 2 | 3 | 2 | 2 | **20** |
| 28 | SunSpine (tracker×TEG/PCM self-power) | 2 | 1 | 3 | 2 | 3 | **18** |

### Where the whole council splits

- **The 5s on fusion are not free.** Seventeen concepts reach 4–5 on fusion, which means the counterfactual test is satisfied by many lenses — it is not the discriminator it was meant to be. Fusion separates the top 6 from the rest.
- **The real discriminator is Venture Quality ×3.** That column is where SEATBEAT (36) and SPINWARD (35) lose to ARCSEAM and ZONEGUARD: a 3–5 year automotive design-in and an un-serviced 2-person team are different things.
- **Buildability quietly punished the software concepts.** SIDEMOVE, SETPOINT, LINEUP and RAILKEEPER all look excellent on paper and all fail on the same unexamined line: SIDEMOVE claims a **₹6,000 second-hand 5-axis VMC**. A used 5-axis VMC is ₹3–8 lakh. A used 3-axis VMC is ₹1.5–3 lakh. Setpoint's ₹7,000 "used CNC VMC" has the same problem. These BOMs were written without checking the market they named, and a team of 2 that budgets on them is out of money before the demo. **I have scored those concepts on the real cost, not the stated cost.**
- **Hobbyist and lab buyers are not ventures.** KilnLock, ColdChain Fermenter and SunSpine all find real users who will never pay venture prices. Potters and PhD labs are customers, not a market.

---

## MVP PLAN — ARCSEAM

### What to build in the first 2 weeks (280 hours available, 55 needed for the demo core)

**Week 1 — make the radar see the seam.**
1. Bench-bring a BGT60TR13C / IWR6843 FMCW radar module on a 300 mm stand over a stationary plate. Get a clean range–velocity map of a moving steel coupon. (6 h)
2. Mount it 400 mm off a real MIG torch on a working cell. Prove it still resolves the seam and puddle with the arc lit, spatter flying, and a spatter shield on. **This is the load-bearing experiment of the whole venture** — if radar fails through a live arc, nothing else matters. (12 h)
3. Characterise puddle cooling rate → a penetration proxy. Log it. (10 h)
4. Add arc-current sense via shunt + optocoupler. (4 h)

**Week 2 — close the loop.**
5. STM32G4 PID on wire-feed trim, ≥50 Hz error signal, with an independent watchdog so a controller fault opens the contactor rather than freezing the feed. (12 h)
6. Two passes on 6 mm plate: one open-loop, one closed-loop. Log wire-feed trace, arc current, and radar puddle signal. (6 h)
7. Section and measure penetration depth on both coupons. Produce the delta number. (5 h)

**Do NOT do in the MVP:** the production enclosure, the safety contactor cabinet, the certification path, the cross-check camera, or a mobile app. None of them prove the claim; all of them cost time you don't have.

### ₹ BOM — demo rig

| Item | ₹ |
|---|---|
| BGT60TR13C / IWR6843 FMCW radar module (×2 — one spare) | 9,000 |
| STM32G4 PID board, isolated DAC, hardware watchdog | 2,500 |
| Shunt + optocoupler-isolated arc-current sensing | 1,200 |
| Opto-isolated wire-feed trim interface to feeder | 2,000 |
| MIG torch, liner, feeder (borrow if possible — see mitigation) | 12,000 |
| 24 V PSU, safety contactor, interlock cabinet | 6,000 |
| Enclosure, shielded cable, harness | 9,000 |
| **Total (cross-check camera deliberately omitted)** | **₹41,700** |
| Production BOM target at 1,000 units | **₹18,000–22,000** |

Radar module and STM32G4 both ship from Mouser/Digikey/element14 into India without a letter of authorisation. Nothing in this BOM needs a certification mark, a licence, or an import licence.

### First paying customer — be specific

**Company type:** a **Tier-1 automotive component fabricator or pressure-pipe / shipbuilding contractor with 3–10 manual MIG cells** — i.e. someone who is *already* losing money to weld repair but has not yet bought a robotic welding cell.

**The person to call:** the **Process Engineering Manager (Welding)** — not the purchase manager, not the production head. This person owns weld-repair cost as a line on their own report, is technical enough to understand a closed-loop plot, and can authorise a ₹1–3 lakh trial out of a scrap-reduction budget without a board meeting.

**Named approach in the Pune–Aurangabad–Chakan auto-supplier belt:** walk in with the two coupons and the logged traces. The ask is not "buy a system" — it is **"let us run one week on cell #3 and credit the trial against your weld-repair scrap."** If the scrap line does not move, they have spent nothing. That is the whole pitch, and it is why this sells to a plant while almost every sensor company in the council sells to nobody.

**Second call:** once that cell has produced a month of scrap data, the same document opens the **welding automation integrator** channel — the ~40–60 firms in India who build robotic cells and currently burn margin on weld repair and NCRs. Integrators buy a kit that makes their cells better; they do not buy R&D.

### 3-slide deck structure

**Slide 1 — The wedge (the 90-second hook).**
> *"An arc is 20,000 Kelvin. Cameras cannot see a weld through it — which is why every 'adaptive welding' cell sold today is vision-based and why adaptive welding only exists on low-heat TIG. GMAW is 70% of the world's weld volume and it has never been closed-loop. Weld repair and distortion rework is 8–15% of the cost of a welded assembly. We close the loop on it for the first time."*
>
> Visual: one photo of an arc flare, one radar range–Doppler plot taken **through** it. That contrast is the slide.

**Slide 2 — The proof.**
Two 6 mm coupons, sectioned, side by side. Open-loop penetration vs closed-loop penetration, with the actual number. Wire-feed trace on a scope showing the loop trimming inside band. Radar still resolving the puddle with the arc lit and spatter in the air.
> Line: *"This is not a simulation. This is a Tuesday on cell 3."*

**Slide 3 — The venture.**
₹41.7k demo → ₹18–22k production BOM → kit priced into a Tier-1 integrator's cell at a fraction of robotic retrofit. Gross margin band. The moat stated honestly: **PID tuning constants per wire diameter × transfer mode × position — process IP that only exists after thousands of real welds, and that a camera vendor cannot jump without owning the actuator.** Plus the retention answer: every cell teaches the loop, so the third customer is cheaper for us to serve than the first.

---

## BIGGEST RISK

**The customer is an integrator whose buying habit is to buy proven automation from a robot OEM — and our closed loop only proves itself on the customer's specific wire, transfer mode and joint position, so the first three customers each need re-tuning we cannot bill for.**

This is the one that sinks it. Everything else is engineering we can do. This is a business-model trap: we can be technically right, demo beautifully, and still fail to convert because the buyer has no reason to take procurement risk on a two-person startup, and because our first revenue is a services act wearing a product's clothes.

**Mitigation, in order:**
1. **Sell to the plant, not the integrator, first.** An integrator sells automation and carries *your* risk. A plant with ₹15–40 lakh of annual weld repair carries its own and only needs the number to move. Plant = fast, low-friction, and produces the reference data that makes the integrator call safe.
2. **Contract on the customer's scrap line, not on our hardware.** "We get paid when your weld-repair NCR count drops, credited against a fixed monthly fee." Zero capex ask, zero procurement risk, and it converts the hardest objection (trust) into the easiest (a number we both watch).
3. **Ship a one-parameter autotune, not a tuning service.** The mitigation for re-tuning cost is that autotune must be a 20-minute commissioning job a plant technician can run, not a two-person-team site visit. Design for this from day one — it is a firmware problem, not a services problem, and it is the difference between a venture and a consultancy.
4. **Rigor-access hedge.** Welding rigs are expensive to rent. Open a written tie-up with a Government ITI / welding training institute in week 1 — rig access in exchange for a free training tie-up and a shared case study. Without this the whole plan is unfunded.

---

## WHAT TO BUILD IN 48 HOURS IF YOU HAD A HACKATHON

The thinnest demo that still proves the claim. The claim has two halves and **both must be live** — a radar that sees the arc but doesn't move the wire, or a wire that moves but can't see, both fail.

**Scope: one MIG cell, one 6 mm plate, two beads.**

- **Hours 0–12 — Rig access and radar bring-up.** Borrow/lease one MIG cell and torch. Get a clean range–velocity map of a moving coupon on the bench. Wire radar output to a laptop plot.
- **Hours 12–24 — The load-bearing test.** Radar mounted 400 mm off the torch on the *live* cell. Arc lit, spatter flying. Prove the seam and puddle signature survives. **If this fails, stop here — you have your answer and you have learned it in 24 hours instead of ₹40,000.**
- **Hours 24–36 — Close the loop.** STM32G4 (or a $4 Blue Pill if the G4 is late) running a PID trim on wire feed, ≥50 Hz, fed by radar puddle signal minus arc-current-derived setpoint. Hard watchdog on the feed.
- **Hours 36–44 — Two beads.** One open-loop, one closed-loop, both logged. Section and measure penetration depth.
- **Hours 44–48 — The slide.** Two coupons side by side, the penetration delta as one number, and the wire-feed trace on a scope.

**Spend: ~₹18,000** (radar ₹4,500 · MCU ₹2,500 · current sense ₹1,200 · trim interface ₹2,000 · torch/liner consumables ₹3,000 · cables/enclosure ₹4,800).

**The one slide that wins:**
> *"Left bead: constant wire feed, constant parameters. Right bead: same wire, same torch, same operator — with a ₹4,500 radar closing the loop at 50 Hz. Penetration: [A] mm vs [B] mm, spread [C] mm vs [D] mm. The arc is 20,000 Kelvin. We are the only sensor that can see it, and the only one that closes it."*

No enclosure. No app. No certification story. Two numbers on a screen and two cut coupons on a table. Everything else is a promise; that is the proof.