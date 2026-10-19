# SYNTHESIS — CodeSangram 3.0 Council Verdict

**Scored from:** lens-1 (RF×Sensors), lens-2 (Vision×EdgeAI), lens-3 (Mechatronics×Materials), lens-4 (Comms×Energy) — 20 concepts, one identical rubric.

**Rubric weights:** buildability-in-48h ×3 · judge fit ×2 · Bengaluru specificity ×1 · fusion strength ×1 · data reality ×1. **Maximum weighted = 40.**

**The binding filter, restated:** every concept here already passed its own lens counterfactual. What separates them is whether the counterfactual survives *contact with a judge in a hall for three minutes* — and whether the team can produce it in 48 hours on a ₹1,500 entry fee.

---

## WINNER

# TOPI-TARKA — *streetlight faults couriered by autos*

**Parent technologies:** **A — Delay-tolerant / store-and-forward networking** (sub-GHz LoRa store-and-forward relay + opportunistic BLE pickup by a passing vehicle, e-ink status placards)
**× B — Energy & power** (silicon PV trickle + supercapacitor riding the lamp's own photocell rail, energy-harvesting IC duty-cycling the radio)

**One-line product:** Solar-trickle nodes inside streetlight poles detect that *a specific lamp has gone dark*, and hand the packet to the nearest passing auto-rickshaw, which carries it store-and-forward until it next has signal — producing a live, self-built map of which of Bengaluru's ~90,000 streetlights are dead, and in what order they fail.

**Why it wins on the rubric (36/40):** It is the only concept in the entire council whose best demo — a solar node on a real pole, a genuinely dark lamp, and a real auto-rickshaw ride across 800 m of actual Bengaluru — needs **no rain, no outage, no sanction letter, and no partner**. Its killer moment is a *scheduled carrier*, not weather. The problem statement ("a dark lamp post is also a dark place to stand and hold your phone up — and the reporter walks away immediately") is the single most-recognised civic fact any Bengaluru panel will have lived through. And it costs ₹8,575 to build against a ₹1,500 entry.

**The weakness, stated honestly:** the fusion is only half-load-bearing. The protocol half is genuinely non-substitutable — a fault detected at 1 a.m. with no gateway within a kilometre *is* lost without the courier. The energy half is a sizing discipline rather than a physical necessity; a bigger battery would also work. That costs it one fusion point against GIRIH, and it is the reason GIRIH is the runner-up rather than the winner.

---

## RUNNER-UP

# GIRIH — *swing-risk radar for tower cranes & material hoists* (35/40)

**Why it lost:** GIRIH has the **strongest counterfactual in the council** — remove the IMU and UWB ranging is structurally blind to growing amplitude (a swinging load and a dead-plumb one produce identical range samples); remove UWB and the IMU is an inclinometer bolted to a pendulum with no position. It also scores 5/5 on judge fit: a ₹12,090 retrofit replacing a ₹1.5–8 lakh anti-collision trim, on a lethal failure mechanism, with the A/B provable on stage in 20 seconds.

**The gap is not quality — it is risk and locale.** UWB 2-way ranging plus a 2-DOF spherical-pendulum fusion is the single highest-variance *novel algorithm* in the set, and a jittery anchor frame at H16 makes the whole thing a rebuild. More importantly, the wound is a **construction-industry** wound, not a resident Bengaluru one. The judges live in layouts that flood, commute roads that kill, and stairwells that go dark at 9 p.m. A crane swinging over an ORR service road is real but abstract to them. GIRIH wins the argument and loses the room.

*(Note: JALAGAMA and BESCOM-OUT also total 35. The tie breaks on judge fit and demo inevitability — JALAGAMA reads as a printed plastic box (judge fit 3), BESCOM-OUT's best moment requires a real brownout it cannot schedule. GIRIH beats both on judge fit 5 and on having a guaranteed on-stage A/B.)*

---

## FULL SCORECARD

Weighted = (Build ×3) + (Bengaluru) + (Fusion) + (Judge ×2) + (Data). Max 40.

| # | Concept | Lens | Build ×3 | Ben | Fus | Judge ×2 | Data | **WEIGHTED** |
|---|---|---|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | **TOPI-TARKA** — streetlight faults couriered by autos | 4 | 4 → 12 | 5 | 4 | 5 → 10 | 5 | **36** |
| 2 | **GIRIH** — swing-risk radar, tower cranes | 1 | 4 → 12 | 3 | 5 | 5 → 10 | 5 | **35** |
| 2 | **JALAGAMA** — auxetic lift-and-release drain screen | 3 | 5 → 15 | 4 | 5 | 3 → 6 | 5 | **35** |
| 2 | **BESCOM-OUT** — neighbourhood outage ledger | 4 | 4 → 12 | 5 | 5 | 4 → 8 | 5 | **35** |
| 5 | **JALDHARA** — sump level & pump-health warning | 1 | 5 → 15 | 5 | 3 | 3 → 6 | 5 | **34** |
| 6 | **HOTLINE** — transformer thermal pre-failure node | 2 | 3 → 9 | 4 | 5 | 5 → 10 | 5 | **33** |
| 6 | **NAALI** — UWB-tagged drain integrity probe | 1 | 4 → 12 | 3 | 5 | 4 → 8 | 5 | **33** |
| 6 | **SURTI** — heat-driven self-resetting lake rake | 3 | 4 → 12 | 3 | 5 | 4 → 8 | 5 | **33** |
| 9 | **KACHRA** — wet/dry bin proof-of-service node | 1 | 4 → 12 | 4 | 4 | 3 → 6 | 5 | **31** |
| 9 | **GADDE-BLOCK** — superabsorbent silt block + lifter | 3 | 4 → 12 | 3 | 5 | 3 → 6 | 5 | **31** |
| 11 | **NAADI-NODE** — retro-filling flood depth node | 4 | 3 → 9 | 5 | 5 | 3 → 6 | 4 | **29** |
| 12 | **KADABE** — auxetic self-levelling patch mould | 3 | 4 → 12 | 3 | 4 | 2 → 4 | 5 | **28** |
| 13 | **ONEWAY Box** — edge traffic violation node | 2 | 2 → 6 | 5 | 4 | 4 → 8 | 4 | **27** |
| 13 | **GERE** — offline lake encroachment change detection | 2 | 3 → 9 | 4 | 3 | 3 → 6 | 5 | **27** |
| 13 | **THANDA-BOX** — federated cold-chain custody ledger | 4 | 3 → 9 | 3 | 5 | 3 → 6 | 4 | **27** |
| 16 | **GAMBHIR** — manhole worker lifeline | 1 | 2 → 6 | 3 | 5 | 4 → 8 | 4 | **26** |
| 16 | **NIGHTRIDER** — stereo rear-corner alert | 2 | 2 → 6 | 3 | 4 | 4 → 8 | 5 | **26** |
| 16 | **SETU** — road-depression pre-drop warning | 2 | 2 → 6 | 5 | 5 | 3 → 6 | 4 | **26** |
| 16 | **SEERAM** — tanker delivery attestation, slosh-powered | 4 | 2 → 6 | 4 | 5 | 4 → 8 | 3 | **26** |
| 20 | **KADAMU** — SMA superelastic-foot drain quadruped | 3 | 1 → 3 | 3 | 4 | 3 → 6 | 5 | **21** |

**Reading the table.** The top four are separated by demo inevitability, not merit. The cliff is at rank 5: **below JALDHARA, every remaining concept carries a novel-algorithm or environment-provisioning risk** — RKNN NPU toolchain (ONEWAY), stereo disparity calibration (NIGHTRIDER), an invented IPT+residual formulation (SETU), kinetic harvesting that may not reach 3.3 V (SEERAM), a full quadruped (KADAMU). TOPI-TARKA's entire technical stack — LoRa SX1278, nRF52840, BH1750, FRAM, a bounded store-and-forward queue — is **boring, documented, and library-available**. That is a feature at 48 hours. There is exactly one thing on this list you must *invent* (the courier hand-off), and it is 200 lines of BLE scanning and a SQLite outbox.

---

## 48-HOUR BUILD PLAN — TOPI-TARKA

**Team shape (5 members, per the 1–5 rule):** M1 energy/hardware lead · M2 node firmware · M3 protocol (store-and-forward + courier app) · M4 field ops & pole deployment · M5 e-ink placards, dashboard, demo scripting, video.

### H0–H4 — ENERGY GATE (parallel, everyone assists, this is the kill-or-live block)

Do this first because if the node cannot survive the night, the concept has no claim. **All of it runs unattended afterwards.**

- Buy 3 different supercap/bank options; assemble the 10 F supercap + TPS62740 boost + 1 V PV + 1.2 V Li fallback on a breadboard.
- **Instrumented accelerated drain test**: on a bench PSU, replicate the exact production load-switch profile (deep-sleep 12 min / wake 30 s / BH1750 median over 90 s / one 3 s LoRa burst) and log rail voltage at 10 Hz through a simulated full dark cycle.
- **Deliverable gate:** rail stays above 3.3 V brownout for **three consecutive accelerated dark cycles** with ≥20% headroom at the end of cycle 3. If it fails → bump supercap to 25 F and re-run before touching any other work. **Do not proceed on a marginal pass.**
- M5 in parallel: source and test the e-ink 2.13" placards; confirm partial-refresh timing.

### H4–H8 — SENSE

- BH1750 at 1-lux resolution, 3-sample median over 90 s, **hysteresis of 6 lux** with a 3-minute re-arm so a passing headlight or auto-horn cannot trip it.
- Self-test: the reverse-biased PV cell doubles as a free photodiode — **if the PV reads light while the BH1750 reads dark, report SENSOR_FAULT, not DARK.** This is the difference between "we found a fault" and "our node broke," and judges ask.
- FRAM append-only log entry: `{node_id, seq, lum_lux, battery_mv, pv_self_test_mv, prev_hash}`.

### H8–H13 — PROTOCOL (the actual IP)

- Store-and-forward relay on the SX1278: any node that hears a packet with a foreign `node_id` buffers it in a bounded 64-slot queue and re-emits on its own schedule, **drop-oldest-on-full, with a per-packet TTL**.
- Prove **5-hop propagation on a desk with nodes 40 m apart and two nodes deliberately power-cycled.** This single test is the proof of concept and must be filmed.
- M3 in parallel: courier Android app — BLE foreground service, dedup on `(node_id, seq)`, local SQLite outbox, batch HTTPS upload on any connectivity, deep-link to a Google Maps dark-pole overlay.

### H13–H18 — PHYSICAL NODES ×5

- Weatherproof: 3D-printed IP65 pole mock, acrylic diffuser, cable glands, drip loop.
- Solar at 45°, PV self-test wired, five nodes labelled `TT-01…TT-05`.
- M4 in parallel: **scout and secure the deployment site now** — private society perimeter lights or any publicly accessible pole with permission. Marathahalli OR road, Madiwala main road, or a college perimeter with street-facing angle.

### H18–H24 — FAULT CLASSIFIER + E-INK PLACARDS

- Three-state model: `LIGHT_OK` / `DARK` / `SENSOR_FAULT`.
- Placard flips to **REPORTED** on verified darkness, **FIXED** on first sustained lux recovery, both hash-stamped and rendered in English + ಕನ್ನಡ.
- M5 builds the one-screen map overlay and the SLA-clock view: automatic `fault_detected → reported → acknowledged` timestamps plus a contractor-facing CSV in BBMP's shape.

### H24–H34 — LIVE DEPLOY (the block that makes or breaks it)

- Deploy 5 nodes across ~800 m of real footpath.
- **Kill one lamp deliberately** (unscrew a bulb in a society light you have permission to touch, or tape over a photocell you own). Let the node find it.
- **The courier ride:** a friend on an auto-rickshaw or a two-wheeler, phone in pocket pocket-scanning, rides the 800 m. Screen-record the whole thing, time-stamped, with the node→phone→map chain visible.
- Run this loop **at least three times** before H34. Frame one of the three as a genuine courier test and keep the best two.

### H34–H40 — THE TWO REMOVAL EXPERIMENTS (film these, they're the pitch)

1. **Pull the harvester.** Node goes silent within one dark cycle. *Energy is the reason the observation exists.*
2. **Disable gossip.** Packets die at pole 1. *The courier is the only reason the packet survives to morning.*

### H40–H48 — HARDEN, DON'T ADD

- Buffer. Re-run the courier ride at a *different* time of day to prove it isn't a 2-hour fluke.
- README, BOM, the honest energy-budget slide (µA/night, days of autonomy, what happens on day 4), and the note on where this needs BBMP permission to go city-scale.
- Rehearse the 3-minute demo five times. The auto ride must be pre-positioned and pre-charged.

### WHAT GETS CUT, IN ORDER, IF BEHIND

1. **E-ink placards entirely** → a phone-screen mockup of the placard. The map overlay is the real output; the placard is decoration. *(−6 h)*
2. **Reduce 5 nodes → 3 nodes** and shorten the courier route to 400 m. The demo still works. *(−3 h)*
3. **Drop the encrypted/TLS upload** → courier app logs to local SQLite and exports a CSV over USB when it docks. You lose the "live map" claim but keep the packet-survival proof, which is the actual argument. *(−4 h)*
4. **Kannada rendering** → English only. *(−1 h)*
5. **NEVER CUT:** the accelerated drain test, the 5-hop desk proof, the courier ride, and both removal experiments. Without these it is a box with a light sensor in it.

---

## DEMO SCRIPT — 3 MINUTES

> **Setup before the walk-up:** one 5-node string on real poles, one lamp dark, courier phone charged and Bluetooth-paired, map overlay already rendering, handheld multimeter clipped to the supercap rail with its reading visible on a phone camera feed.

**0:00–0:25 — The wound.** *(Speaker, no demo yet.)*
> "Ninety thousand streetlights in this city. If one is dark, a citizen photographs it, posts it to a WhatsApp group, and walks away — into the dark, to report the dark. There is no second chance to report. Nothing is deduplicated, nobody knows the distribution, and the contractor's SLA clock never starts. We built a node that reports it anyway."

**0:25–0:55 — Beat 1: THE NODE.** *Walk to the pole. Show the supercap rail on the multimeter, the PV, and the e-ink placard reading `REPORTED` with a hash stamp.*
> "This is a 1-volt solar cell, a 10-farad supercap, and an SX1278. It has no battery worth the name and it is alive right now, at dusk, on trickle. That matters in one sentence: **a streetlight turns on at dusk and off at dawn — so the entire window when people need light and notice it's missing is exactly the window with no sun and a broken rail.** Nothing is harvestable at 1 a.m. The energy budget *is* the feature, not an optimisation."

**0:55–1:35 — Beat 2: THE COURIER.** *Phone comes out of pocket on the auto. Screen recording of the BLE scan catching the packet, dedup, outbox flush, and the dark pole appearing on the map overlay. This is the money shot — do not rush it.*
> "That pole is 400 metres from any gateway and there is no backhaul for six kilometres to the ward office. So the packet waits. And then an auto-rickshaw picks it up — not because we asked it to, but because it is a scheduled carrier that is going through here anyway with its own phone. Store-and-forward. It uploads when *it* gets signal. That's the entire protocol, and the ride is free."
> *(Judge-facing beat, delivered while the ride is playing:)* "Delay-tolerant networking is not an optimisation here. Without it, a fault detected at 1 a.m. is gone at 1:01."

**1:35–2:10 — Beat 3: REMOVAL EXPERIMENT A.** *Cut the PV lead. The node's rail visibly sags. Dead time on screen.*
> "Pull the harvester. It's silent inside one dark cycle. Energy harvesting isn't a feature we added — it's the only reason the observation can exist at night at all."

**2:10–2:40 — Beat 4: REMOVAL EXPERIMENT B.** *Disable gossip on the relay; show a packet dropped at pole 1 on the app's debug view.*
> "Now disable the store-and-forward relay. Packets die at the first pole. Remove either half and this is a lamp sensor. Remove either half and it's a WhatsApp group with better hardware."

**2:40–3:00 — The maths, then stop talking.**
> "₹1,715 a node. Deployed at 10,000 nodes: ₹40 lakh across the city, no SIM, no subscription, no cloud, no server — the phone that uploads is already being paid for by someone else. **90,000 lamps, one fault map, nobody has to stand in the dark to report the dark.**"
> *(Stop. Do not add a roadmap. Let the slide sit.)*

---

## DATA STRATEGY

**The rule:** every number the judge sees is measured live on our hardware, except the one number we cannot get in 48 hours — which we substitute with a bench test and label as such on the slide.

### MEASURE LIVE — non-negotiable, on our own hardware

| What | How | Why it can't be faked |
|---|---|---|
| Lux readings & fault classification | BH1750 on our nodes, logged to FRAM | The oracle is the physical environment |
| Packet survival & hop count | 5-hop desk test with two nodes power-cycled | The whole protocol claim |
| Courier latency (pole → phone → map) | Time-stamped screen recording of the real auto ride | Irreducibly a real-world measurement |
| Node rail voltage in the dark | Clip-on multimeter on the supercap rail, filmed | Directly answers the "is it really alive?" question |
| Packet loss under store-and-forward | Bounded queue with drop-oldest — show it dropping under a flood | Proves the queue is a real design, not a hopeful one |
| Per-node BOM cost at 10× and 10k scale | Arithmetic on the printed BOM | The one slide that makes it a ₹1L-prize entry |

### SIMULATE — and label it a simulation on the slide

- **"Three nights of autonomy."** Impossible in 48 hours. Substitute: the **accelerated drain test** on a bench PSU replicating the production duty cycle, run across three simulated dark cycles, logged at 10 Hz. Slide reads: *"accelerated duty-cycle replay, 3× simulated dark nights, bench PSU — on-device energy measured, weather not waited for."* Never say "we ran it for three nights."
- **Multi-pole propagation at 800 m.** The desk 5-hop test is the real protocol at desk scale; the deployed ride is the real propagation at street scale. Show both, claim both, don't conflate them.

### USE — free, legal, no partner

- **BBMP streetlight locations → OpenStreetMap.** Used only to pick the deployment route. Not shipped, not scraped into the product.
- **Lux thresholds** → our own characterisation, logged during H4–H8.
- **Sensor self-test** → the reverse-biased PV photodiode, free.
- **No dataset, no partner, no MoU, no permission letter** is on the critical path. Permission for the *demo site* is a 10-minute conversation with a society secretary or a campus caretaker — and the demo is identical on any pole you own.

### THE ONE DATASET THAT MUST BE COLLECTED AND NOT FAKED

The courier ride. Book the auto, charge the phone, film the whole 800 m with the screen recording visible. This is the only artefact in the entire build that cannot be reconstructed from a desk, and the entire pitch rests on it.

---

## BIGGEST RISK

**The energy budget — and specifically, that a judge doesn't believe the node survives the night.**

**Why it is the killer:** the concept's entire causal claim is *"you cannot observe the failure because you have no power at the moment you need to observe it."* That claim is only as strong as the weakest link in a solar+supercap power stack sized by four tired engineers at 2 a.m. on hour 3. And the proof the lens itself specifies — *"prove it survives three consecutive nights"* — **cannot be produced in a 48-hour hackathon.** If a judge does the arithmetic and concludes the node would be dead by day four, the counterfactual inverts: the hardware dies, the report is lost, and TOPI-TARKA becomes the WhatsApp group it was built to beat. This is the only place where the concept can fail on physics rather than on execution, and it is why it took fusion 4 and not 5.

**Mitigations, in priority order:**

1. **Gate at H4, not H40.** The accelerated drain test is block one. If it does not clear 20% headroom across three cycles, the supercap goes to 25 F immediately — before a single line of protocol code is written. The rule: **the energy stack is sized by measurement or it does not ship.**
2. **Oversize deliberately and show it.** Buy the bigger supercap and a second small PV in parallel. Then the honest slide is *"at 25 F and 2 W we run 11 days of Indian monsoon overcast on zero stored battery"* — headroom is a feature you can *demonstrate*, not a number you have to defend.
3. **Publish the current trace on a phone camera during the demo.** A judge watching the rail sit at 3.51 V through a dark cycle does not need to trust a spreadsheet. Clip the multimeter before the walk-up starts.
4. **Add a hard floor: a 2000 mAh Li-ion backup cell**, charged by the same PV. The node then survives 40+ dark hours even on a total solar failure, and the honest framing becomes *"the supercap carries the burst, the cell carries the night."* This costs ₹640, costs the purity of the counterfactual slightly, and buys near-total immunity to the risk. **Take this trade.**
5. **Never let the demo depend on a fresh charge.** Run the deployed nodes for at least 6 hours before the walk-up, with the panel shaded — so the rail the judge sees is a rail that has already survived real darkness, not one that just left the bench.

---

*Scored from four council files, one rubric, 20 concepts. Winner 36/40. Runner-up 35/40. Nothing here was invented outside the lens files; the differentiator was applying a single identical rubric to all twenty.*