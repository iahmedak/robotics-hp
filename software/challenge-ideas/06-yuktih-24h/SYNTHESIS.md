# SYNTHESIS (v2) — Yuktih 24-Hour Hackathon Council, re-run under the RENEWABLES & SUSTAINABLE ENERGY theme

**Event:** Yuktih – Innovate Today, Sustain Tomorrow · literal 24h overnight · 2–4 pax · ₹1,500 entry · ₹10,000 / ₹7,500 / ₹5,000
**New binding constraint:** compulsory theme **RENEWABLES & SUSTAINABLE ENERGY**. A concept qualifies only if it demonstrably (a) generates renewable energy, (b) harvests otherwise-wasted energy, (c) stores renewable/waste energy, (d) reduces consumption / improves energy efficiency measurably, or (e) advances renewables as a *system* (grid, dispatch, forecasting, storage management, power electronics, efficiency). Generic sustainability, waste reduction, recycling-as-lifestyle, green labelling, and cold-chain/medical devices with no energy link are **off-theme and disqualified regardless of engineering quality**.

**v1 pick THERMOLATCH is discarded** — a pharma cold-chain tag whose energy content is only "we ship fewer primary cells." That is supply-chain mass, not an energy mechanism. The previous council scored engineering quality and never checked the theme gate. That was the failure.

**Inputs:** 4 lens files, 20 concepts. Rubric (on-theme survivors only): 24-hour build realism ×3 · failure recovery ×2 · theme fit ×3 · energy-impact verifiability ×3 · demo punch at 09:00 ×1. **Max weighted = 60.**

---

## THEME FILTER — all 20 concepts ruled

| # | Concept | Lens | Ruling | Energy mechanism, or its absence |
|---|---|---|---|---|
| 1 | **THERMOLATCH** | 1 | **OFF** | PCM used as a *bit latch*, not as stored thermal energy; claim is −90% primary-lithium mass. Waste reduction, not energy. |
| 2 | **PEAKLATCH** | 1 | **OFF** | Nitinol absorbs impact energy and *dissipates* it. Harvesting requires capture; this spends. Safety device, not energy. |
| 3 | **INKSTAMP** | 1 | **OFF** | E-ink bistability is a display-power property of a chosen BOM line, not the product's thesis. Claim is pallet-label replacement count. |
| 4 | **AEROSHIP** | 1 | **OFF** | Aerogel insulation *could* be an efficiency argument, but the concept measures kg CO₂e per shipment, never kWh. Textual cold-chain, no energy link — explicitly disqualified. |
| 5 | **HIVE-GATE** | 1 | **ON (re-scoped)** | **Cold-room door heat ingress → refrigeration energy waste.** A leaking cold-store door is one of the largest single loads in the building; detecting it is a direct, watt-hour-measurable efficiency win. Qualifies only if a watt-hour meter and a closed-vs-ajar load comparison are on the bench. |
| 6 | **THERMAL CRACK MONITOR** | 2 | **OFF** | Claims avoided embodied carbon from patch-level repair. No generation, harvest, storage, or kWh anywhere. |
| 7 | **SIFT** (bin-picking arm) | 2 | **OFF** | Recycling-contamination logic. "Waste reduction / recycling" is named as off-theme. |
| 8 | **DRIP** (water router) | 2 | **OFF** | The 5 W panels are incidental power for a node whose thesis is *water* delivered. Panel is a BOM line, not the mechanism. |
| 9 | **ROCK** (vibration jig) | 2 | **OFF** | A tuned mass damper *absorbs* vibration. It dissipates the very energy the brief lists as harvestable, and its own metric is frame displacement in mm, not watts. Mechanical-service-life claim. |
| 10 | **AMBER** (spectral sort) | 2 | **OFF** | Polymer recovery. Explicitly banned recycling category. |
| 11 | **LOADBEAR** | 3 | **OFF** | Structural panel sensing; no energy mechanism of any kind. |
| 12 | **COLDCHAIN** | 3 | **ON** | **NFC/RF field energy harvesting** — the phone's inductive field is the only power source, harvested into a supercapacitor to drive a Nitinol actuator. "Radio" is explicitly named harvestable waste energy. |
| 13 | **PHASEFENCE** | 3 | **OFF** | Wi-Fi CSI used to sense, not to harvest. Structural monitoring. |
| 14 | **CRYO-MARK** | 3 | **OFF** | UWB ranging only. Positioning; no energy path. |
| 15 | **MYCELGRID** | 3 | **OFF** | Soil-moisture sensing on a biodegradable puck. Adjacent to water, zero energy content. |
| 16 | **TEGARD** | 4 | **ON** | **Thermoelectric (Seebeck) waste-heat harvesting** with PID-driven load-point matching, so the storage cell survives 500 cycles instead of 30% loss. |
| 17 | **HALF-PULL** | 4 | **ON** | **Human-powered mechanical generation** from the ~78 J/stroke a hand pump already expends and wastes, harvested through a gate that also *raises* pumping efficiency ≥10% J/stroke. |
| 18 | **PHASEWALL** | 4 | **ON** | **PCM latent-heat thermal storage** with occupancy/CO₂-gated discharge into a useful load. |
| 19 | **CRYONOSE** | 4 | **ON** | **Thin-film amorphous PV generation** + supercapacitor buffering with event-gated duty cycling. On-theme via the energy path even though the application is cold chain. |
| 20 | **STRAINHARV** | 4 | **ON** | **Piezoelectric footfall harvesting**, force-gated so ambient building vibration cannot poison the output. |

**7 survive. 13 rejected as off-theme.** More than three — no fresh generation is required.

*Slate gap worth naming:* nothing in the 20 attacks **(e) — renewables as a system**. There is no forecasting, dispatch, storage-management or power-electronics concept anywhere. If a team wants that lane it must be generated fresh: a battery/thermal **storage-management controller** that schedules charge/discharge against measured load and a price/availability signal. That is the highest-ceiling theme fit available and the slate is empty on it.

---

## ON-THEME SHORTLIST — survivors, each with its energy mechanism named

1. **HALF-PULL** — *human-powered mechanical generation + gated capture + supercapacitor/LFP storage.* Generates renewable energy from the operator's own stroke, harvests the part of the stroke the linkage currently dissipates for nothing, and measurably cuts the human joules needed per litre of water.
2. **TEGARD** — *thermoelectric waste-heat harvesting + PID load-point matching + LTO storage health.* Harvests ΔT that a cold gutter is throwing away, and — the real thesis — does it in a way that keeps >90% cell capacity at 500 cycles instead of losing >30%.
3. **STRAINHARV** — *piezoelectric kinetic harvesting from footsteps + strain-gated latching.* Harvests energy that is otherwise entirely lost as a spike into the floor, and uses force discrimination to reject ambient vibration.
4. **PHASEWALL** — *PCM latent-heat storage + CO₂-gated discharge scheduling.* Stores thermal energy at a set point and refuses to dump it into an empty or already-warm room.
5. **CRYONOSE** — *amorphous PV generation + supercapacitor buffer + event-triggered duty cycle.* Runs a 30-day sensor head off harvested light by waking only on a real event.
6. **HIVE-GATE** (re-scoped) — *refrigeration-efficiency monitoring of cold-room door heat ingress via BLE mesh.* Detects the load that wastes compressor energy. Conditional on the kWh demo.
7. **COLDCHAIN** — *NFC/RF field energy harvesting + supercapacitor + shape-memory actuation.* Zero-battery device powered entirely by harvested radio energy. On-theme, but the sourcing risk is fatal.

---

## OFF-THEME REJECTED — blunt reasons

- **THERMOLATCH** — wax that remembers a boolean is not energy storage. The pitch is "we ship 90% less lithium mass," which is e-waste accounting wearing a sustainability costume.
- **PEAKLATCH** — absorbs impact energy and discards it. Harvesting is capture; this is the opposite.
- **INKSTAMP** — e-ink is a smart BOM choice, not an energy thesis. Sustainability claim is "5 labels instead of 1,000." Banned category.
- **AEROSHIP** — insulation without a kWh number is packaging. The brief says cold-chain with no energy link is off-theme; this one has the insulation and forgot the energy.
- **THERMAL CRACK MONITOR** — avoids panel replacement. Embodied carbon. No electrons touched.
- **SIFT** — contamination sorting. Banned recycling.
- **DRIP** — the solar panels are scenery. The product moves water; the theme wants watts.
- **ROCK** — a damper that eats vibration while the brief calls vibration harvestable. It could be re-scoped into a harvester by forcing its unused stroke through a piezo, but as written it is a millimetre measurement.
- **AMBER** — polymer recovery. Banned recycling.
- **LOADBEAR** — a wall that feels load. Nothing about energy exists in it.
- **PHASEFENCE** — uses the Wi-Fi radio; harvests nothing from it. Sensing ≠ harvesting.
- **CRYO-MARK** — a locator. Positioning is not energy.
- **MYCELGRID** — a biodegradable soil sensor. Cute. Off-theme.

---

## WINNER — **HALF-PULL**

- **Parent technology A (energy):** **human-powered mechanical harvesting** — crank-shaft → PMDC micro-turbine (or salvage stepper) → flyback/rectifier → **BQ25570-class energy-harvesting PMIC** → 10 F supercapacitor bank with a 2S LiFePO₄ buffer.
- **Parent technology B (sensing):** **Hall-effect end-stop switches + 6-DOF IMU stroke-phase sensing**, driving an MPPT-equivalent rectifier gate that latches energy only during the low-force recovery phase and shorts nothing at the dead-stop.
- **One-line product:** A retro-fit lever module on a standard India Mark-II village hand pump that harvests the ~78 J of energy every stroke already spends and wastes, powers a village LED head and water-quality sensor with no battery ever shipped, and — because it never back-drags the handle — cuts the human effort per litre of water by ≥10%.
- **The exact in-theme proof sentence:**

  > "HALF-PULL generates renewable energy directly from human muscle at roughly 78 joules per pump stroke, harvests the portion of that stroke the pump linkage currently dissipates for nothing, stores it in a supercapacitor with a lithium-iron-phosphate buffer, and measurably improves energy efficiency by reducing pumping effort to at least 10% fewer joules per stroke than the unmodified pump."

  That sentence contains all five qualifying verbs: **generates** (human-powered), **harvests** (wasted mechanical energy), **stores** (supercap + LFP), **improves efficiency** (J/stroke), **system** (gated capture + storage management). It is also fully measurable on a bench in a night, which is the part the other energy concepts cannot claim.

**Why it takes the council:** it is the only entry where the judge can *feel the counterfactual in five seconds*. Yank the gate and the pump gets measurably heavier — the user's arm pays the tax. No slide can fake that, and it directly hits three of the five theme clauses at once.

---

## RUNNER-UP — **TEGARD**

Weighted **53** against the winner's **55**. TEGARD's theme fit and verifiability are just as strong (waste-heat harvesting is named in the brief, and "fixed-duty loses >30% capacity by cycle 500, adaptive holds >90%" is the single most defensible storage-health number in the slate).

It lost on exactly one thing: **demo punch at 09:00, 3 versus 5.** A TEG demo is two aluminium gutters and a chart. It needs a freezer or a controlled cold rig to produce a real ΔT, it produces no physical artefact a judge can hold, and — worst — TEG modules and TMP117 breakouts are AliExpress SKUs that can simply not arrive on a night. HALF-PULL's generator is a mechanical part a team can source or salvage from a scrap market at 21:00, and its demo is a bucket and a handle.

**When TEGARD should win instead:** if the team is 3–4 people, has no mechanically-skilled member, and can pre-order the TEGs and TMP117s a week ahead. Then swap the punch score to 5 and it takes the event.

---

## SCORECARD — on-theme survivors only, sorted

Weighted total = (realism × 3) + (recovery × 2) + (theme fit × 3) + (verifiability × 3) + (punch × 1). Max 60.

| # | Concept | Realism ×3 | Recovery ×2 | Theme fit ×3 | Verifiability ×3 | Punch ×1 | **Weighted** |
|---|---|---|---|---|---|---|---|
| 1 | **HALF-PULL** | 4 → 12 | 4 → 8 | 5 → 15 | 5 → 15 | 5 → 5 | **55** |
| 2 | **TEGARD** | 4 → 12 | 4 → 8 | 5 → 15 | 5 → 15 | 3 → 3 | **53** |
| 3 | **STRAINHARV** | 4 → 12 | 3 → 6 | 5 → 15 | 4 → 12 | 5 → 5 | **50** |
| 4 | **PHASEWALL** | 3 → 9 | 3 → 6 | 5 → 15 | 4 → 12 | 4 → 4 | **46** |
| 5 | **CRYONOSE** | 4 → 12 | 5 → 10 | 4 → 12 | 3 → 9 | 3 → 3 | **46** |
| 6 | **HIVE-GATE** (re-scoped) | 3 → 9 | 4 → 8 | 3 → 9 | 4 → 12 | 3 → 3 | **41** |
| 7 | **COLDCHAIN** | 2 → 6 | 2 → 4 | 5 → 15 | 3 → 9 | 4 → 4 | **38** |

**Why STRAINHARV scores 3 on recovery:** its own cut list says that if the classifier collapses to a threshold, "drop the energy-harvesting claim to a measured side-note and lead entirely with the health classifier." That fallback is a stairwell counter — **off-theme**. Its failure mode exits the theme, which is the worst kind of recovery.

**Why COLDCHAIN scores 2/2:** its stated fallback ("re-scope to a mechanical cam") destroys the counterfactual — the same defect that sank it to 19 in v1, now compounded by Nitinol sourcing from an orthodontic clinic. No fallback that preserves the fusion is not a fallback.

---

## 24-HOUR PLAN — HALF-PULL

**Premise that makes this plan work: every part is pre-bought.** Night one is measurement and firmware, not procurement.

### 21:00–22:00 — Unpack and rig
Verify every part against the pre-buy list *before* touching a tool. Bolt the India Mark-II handle into a plywood/mild-steel jig at desk height with a 2 kg bucket hanging. Direct-belt the turbine to the crank. Confirm free rotation by hand.

### 22:00–00:00 — **The baseline. Do this first, deliberately.**
Two 100-stroke runs: **(1)** generator fully decoupled, **(2)** generator coupled but ungated. HX711 + 1 kg S-beam load cell on the handle → force trace at ≥100 Hz → numerically integrate F·dx to get **J/stroke** per run. These two curves *are the thesis*. If integration is noisy, hand-check with a ₹250 spring scale first and reserve the load cell for the headline number. **If effort cannot be measured reliably by 00:00, the concept is dead — stop and do not pretend.**

### 00:00–01:30 — Energy chain
Generator → rectifier → supercapacitor. Scope the raw rectified output and measure V-oc vs. crank angular velocity. Compute mWh/stroke ungated and size the supercap bank from that number, not from the datasheet. Wire the INA219 energy ledger.

### 01:30–03:00 — The gate (this is the fusion)
Hall end-stops (magnet + switch at the stroke extremes) + IMU stroke-phase state machine → MOSFET load switch. Latch energy **only** during the low-force recovery phase; hard-disconnect through the dead-stop. Log the gate state per stroke.

### **02:00 CHECKPOINT — hard go/no-go on the energy path**
- [ ] Load cell produces a clean F·dx curve for 100 consecutive strokes.
- [ ] Supercap voltage rises measurably over 20 ungated strokes (target ≥1.2 V from 0).
- [ ] Rectified trace visible on the bench scope.

**Fail path:** if the turbine is dead or the curve is garbage, swap to a **salvaged 4-wire bipolar stepper** (any printer/floppy/scanner motor) direct-cranked as a low-RPM generator, and re-run the 22:00–00:00 baseline. Budget 45 minutes for the swap.
**Absolute fail path:** if neither generator delivers usable energy by 03:00, **withdraw from the demo slot and present the measurement rig as a failed-result poster.** Do not present an off-theme device. Losing the slot is survivable; a disqualification is not.

### 03:00–04:00 — Buffer + logging
2S LFP buffer across the supercap, ESP32-C3 + microSD logging every stroke (effort, gate state, mWh captured). If the logging fight goes long, cut to USB-serial to a laptop.

### 04:00–06:00 — **The A/B run**
Alternating randomized blocks, 50 strokes per block, 3 blocks per arm, n ≥ 150 per arm (300 target). Full INA219 and load-cell logging. This is the money data and it needs 2 clean hours.

### **06:00 WORKING GATE — binary**
- [ ] **J/stroke(gate ON) ≤ 0.90 × J/stroke(gate OFF)** across ≥150 logged strokes each side.
- [ ] **≥6.0 J captured per 100 strokes** with the gate ON.
- [ ] LED head lights from 100 strokes and holds ≥30 min.

**If the effort gate misses:** by 06:10 swap the PMDC turbine for the salvage stepper, re-run one A/B block (30 min), and **re-headline to harvested mJ/stroke and LED autonomy**, publishing the measured effort number whatever it is (e.g. "6% effort reduction," not a fabricated 10%).
**If the energy gate misses:** re-headline entirely to the capture-efficiency number, which is still on-theme generation + harvesting.
**Never** pivot to a non-energy demo. There is no on-theme fallback below this line.

### 06:00–07:00 — LED autonomy run
100 strokes → 3 W LED head, timed to 50% brightness. Film it.

### 07:00–08:00 — Stage
Mount the rig where judges can reach the handle. Printed board with the three headline numbers. Bench scope visible with the gated latch window on screen. Spare belt, spare Hall switch, spare coupling.

### 08:00–09:00 — Three dry runs. Pack.

### **EXPLICIT CUT LIST — written on the board now, not renegotiated at 03:00**
- ~~Water-quality sensor head~~ — it was always garnish.
- ~~12 V solar panel~~ — irrelevant to the thesis.
- ~~BQ25570 PMIC~~ → plain boost converter. Loses the "harvesting IC" name, keeps every joule of physics.
- ~~Gearbox~~ → direct belt. Slightly lower voltage, far faster.
- ~~ESP32-C3 + SD~~ → USB-serial logger if the log fight goes past 30 min.
- ~~6-DOF IMU~~ → Hall end-stop only, single latch. Still recovers most of the effort gain.
- ~~Printed lever housing~~ → bolted aluminium plate and a zip-tie clamp.
- **NEVER CUT:** the pre-buy list · the load cell · the alternating A/B protocol · the supercap · the generator · the measured numbers.

---

## PARTS RUN — buy BEFORE the event

Overnight procurement is what killed the previous synthesis. Everything below is a 21:00 liability unless it is already in the bag.

| Buy before the event | Qty | ₹ | Why it must be pre-bought |
|---|---|---|---|
| **Surplus 12 V / 24 V PMDC micro-turbine + gearbox** | **2** | 1,200 | **The single point of failure.** Buy two. No same-night substitute exists. |
| **Salvaged 4-wire bipolar stepper** (printer / floppy / scanner) | 3 | 0–150 | Backup generator. Direct-crank as low-RPM gen. Free and universal. |
| **BQ25570 harvesting PMIC breakout** | 2 | 650 | Verify the part number exists on Robu *this week*, not on the night. |
| Plain boost-converter module (fallback path) | 2 | 150 | The cut you will actually make at 03:00. |
| 10 F supercapacitor module + protection | 2 | 700 | |
| 2S LiFePO₄ 18650 (3000 mAh) + BMS | 2 sets | 900 | |
| **HX711 + 1 kg S-beam load cell + 2 kg test bucket** | 2 sets | 900 | Two. The headline measurement; a failed load cell at 01:00 kills the run. |
| ₹250 spring scale | 1 | 250 | Hand-check the integration before trusting the load cell. |
| MPU-6050 / MPU-9250 IMU breakout | 2 | 350 | |
| Hall effect limit switches + neodymium magnets | 4 sets | 200 | |
| ESP32-C3 + microSD module | 2 | 450 | |
| INA219 + 0.1 Ω shunt + SS34 diodes + flyback | 2 sets | 300 | |
| **India Mark-II hand-pump handle + spout assembly** | 1 | 0–800 | Borrow from a panchayat / college hostel if you must. This is the demo rig. |
| 3 W LED head + 12 V driver + lamp housing | 1 | 600 | |
| Belt, pulley, coupler, M3 hardware, epoxy, crimps | kit | 700 | |
| Aluminium / mild-steel stock for jig + housing | — | 500 | |
| Bench oscilloscope access, or a ₹600 USB scope | 1 | 600 | **You must be able to *see* the gated latch window.** Not optional. |
| **Pre-bought total** | | **≈ ₹7,900** | plus ₹1,500 entry. Keep ₹1,500 contingency. |

**Pre-built before you leave home:** the plywood jig with the pump bolted in, the belt and coupling already fitted, one complete supercap + rectifier chain soldered and bench-tested. A team that arrives with a working, unwired energy chain loses an hour it cannot spare.

---

## THE A/B TEST — what makes the energy claim believable by 09:00

**The question:** *does gating the capture window make the pump easier to pump, and does it harvest more energy at the same time?*

**Arm B (control, ungated):** generator permanently coupled. Energy is harvested whenever the crank turns, including through the high-load phase where the generator back-drags and efficiency collapses.

**Arm A (treatment, gated):** Hall end-stop + IMU state machine disconnects the generator through the dead-stop and latches only inside the low-force recovery window.

**Protocol:** alternating, randomized arm order per block (kills thermal drift and fatigue-order bias). 50 strokes per block, 3 blocks per arm. n ≥ 150 strokes per arm, 300 target. Same operator, same cadence, same bucket mass.

**Instruments:** HX711 load cell on the handle → force trace at ≥100 Hz; numeric integration of F·dx → J/stroke. INA219 → mWh into the supercap per stroke. Bench scope → rectified generator voltage with the latch window visible.

**Acceptance numbers, all four on the printed board:**

| Metric | Gate | Why it's believable |
|---|---|---|
| Human effort | **J/stroke(ON) ≤ 0.90 × J/stroke(OFF)** | The headline. Direct integration of a force trace a judge can watch being taken. |
| Energy captured | **≥6.0 J per 100 strokes ON**, and **≥1.4× that OFF** | Proves the gate *raises* capture, not just effort. INA219, one number, no argument. |
| Storage autonomy | **100 strokes ON → 3 W LED ≥30 min** (≥0.75 Wh delivered) | Turns joules into a visible consequence. Judges watch the lamp stay lit. |
| Peak V-oc trace | Latch window visibly closed at the dead-stop | The scope shot that shows the *mechanism*, not just the outcome. |

**If the 10% effort gate misses, publish what you measured.** A 6% reduction, honestly stated and correctly measured, beats a fabricated 10% every time — and the harvesting numbers still carry the theme. **No EPD estimates, no order-of-magnitude guesses.** Every number above is one arithmetic step from a quantity measured tonight on a load cell.

---

## BIGGEST RISK

**The generator is unobtainable on the night, and there is no on-theme fallback below it.**

HALF-PULL is a *mechanical energy* concept. There is no software-only version of it. If the turbine never arrives and the salvage stepper doesn't turn, you have a load-cell rig, a bucket and a handle — an excellent effort-measurement demo for a **different, off-theme** event, and nothing at all for this one. That is the same structural flaw that sank COLDCHAIN (Nitinol with no fallback that preserves the fusion), and it is the reason COLDCHAIN scores 38 while HALF-PULL scores 55.

**Mitigations, decided at home, not at 22:00:**

1. **Pre-buy two turbines.** The single cheapest insurance in this document. A PMDC micro-turbine is ₹600; buying two costs ₹600 more and removes the most likely total loss.
2. **Carry the stepper fallback in the bag already.** Three salvaged bipolar stepper motors cost under ₹150 and exist in every scrap market in India. Direct-crank them as low-RPM generators; the whole conversion chain is rectifier + supercap and needs no new physics. Practice this swap *at home*, timed, so 03:00 is a 45-minute job and not a 90-minute one.
3. **Verify the BQ25570 exists today.** If the harvesting PMIC is not stocked, buy the plain boost converter and re-plan around it from the start rather than discovering it at 01:00.
4. **Test the complete energy path at home on the kitchen table** — stepper, belt, crank, rectifier, supercap, LED — with a coffee tin and a shoelace. Thirty minutes on Saturday removes the overnight risk entirely. A team that has already seen the lamp light before 22:00 will not panic at 02:00.
5. **Know the withdraw line.** If neither generator delivers usable energy by 03:00, present the failed-result poster. Losing the slot is a bad night. A disqualified entry is the end of the event.

**Second-order risk:** the F·dx integration is noisy and the A/B fails to clear 10%. Hand-check with the spring scale first, use the same cadence and operator in both arms, randomize block order, and publish the measured delta whatever it is. The harvesting numbers carry the theme on their own — do not let a missed effort threshold push you off-theme.