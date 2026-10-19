# SYNTHESIS — Citi-Zen 2.0 Bengaluru

Twenty concepts scored on one rubric. Weighting: buildability ×1, impact verifiability ×2, fusion strength ×2, prize-capture ×2, longevity ×1. Maximum weighted score 40.

---

## WINNER

### BHOOMI — the silt-aware rain-garden gate

**Parents:** A = LoRaWAN 1.0.4 Class A (SX1262 + ChirpStack) carrying RFC 9177 Bundle Protocol v7 store-and-forward · B = INT8 pruned 1D-CNN + TCN on the ESP32-S3 (CMSIS-NN), on-device runoff classifier.

**One-line product:** A ₹5,200 rain-garden node that opens and closes its sluice gates on what is *actually arriving* in the runoff rather than on a weekly timer, and that survives a monsoon week of gateway outage without losing the first-flush record.

Weighted score **34/40**.

Why it wins on the rubric and not on charm: it is the only concept in the set that carries a *quantified environmental quantity with a built-in control* into the one award category where that is the whole question. Every other Nature-based candidate brings either a two-week A/B nobody can stage (NEER-TARA), a certifiability argument with no resource number at all (MycoPass), or no environmental payload whatsoever (TILAK). BHOOMI brings silt mass past the gate, measured against a float-switch baseline, on the same gate, same storm.

---

## WHICH AWARD IT TARGETS

**Primary: Best Nature Based Solution (₹4,000).** Secondary framing, only if the day goes badly: Build-wize track entry with the same hardware.

Why it should beat the field for that award:

**The award-fit is structural, not rhetorical.** Rain gardens, percolation trenches and restored tank bunds *are* Bengaluru's own nature-based retrofit programme. BHOOMI is not a garden with a sensor bolted on; it is the missing instrumentation for a programme the city is already running. Judges in this category reward "you solved a problem we have" over "we invented a new problem."

**It brings the artifact judges actually want.** In the Nature-based category the standard failure is a proposal with no number. BHOOMI has a number, a control, and an independent instrument the judge can read themselves.

**Contention is real but shallow.** On my reading of all twenty concepts, four target Best Nature Based Solution (BHOOMI, NEER-TARA, MycoPass, TILAK). The deeper field is thinner still, because most nature-based entries will be planters, biodiversity gardens and water-harvesting demos with no measurement on the day. Two of my four nominees are disqualified by their own claims, not by their build quality. BHOOMI is the strongest of a weak field.

**The DTN half is unfakeable.** The specific claim that a gateway outage during peak inflow truncates LoRaWAN bursts and destroys the first-flush record is a real, checkable, protocol-level failure. Pulling the gateway on stage is a two-second demonstration that no competitor in this category can perform, because they have no store-and-forward layer to demonstrate.

---

## RUNNER-UP

### BOL — the caption mesh (WebRTC host-candidate ICE + Automerge CRDT sync + INT8 CTC Conformer)

**Weighted 33/40.** Also 33: THERMAL-PLAY (the PCM classroom thermal battery).

BOL is the most memorable thing anyone will build at this event, and the only concept whose entire headline claim is verified by a four-second gesture: pull the WAN cable mid-sentence and the captions keep running. That is worth real points in a room of judges.

It lost to BHOOMI on two weighted criteria:

**Longevity (4 vs 5).** BOL's ₹32-per-child-per-year claim does not survive 1000 classrooms without per-language, per-speaker retraining. Karnataka's government schools span Kannada, Tamil, Urdu, English and Tulu; a model tuned on one teacher's voice in one language generalises to one classroom. BHOOMI's classification is a physical signal (turbidity, conductivity, level) that transfers across sites without retraining.

**Fusion (4 vs 5).** BOL's WebRTC mesh is separable from the ML: a single ESP32 streaming to one laptop over a local WebSocket would caption one screen fine, and a hub-based distribution would still reach the phones. The demo survives either removal in degraded form. BHOOMI's two halves are not separable.

BOL also carries execution risk BHOOMI does not: 30 hours is a hardware-assembly figure, not a project figure. Fine-tuning a 5M-parameter CTC Conformer, quantising to INT8, porting through CMSIS-NN and hitting ≥95% word accuracy on held-out speakers is a multi-week ML project with a single point of failure. If accuracy lands at 88%, the headline number collapses and there is no fallback.

**THERMAL-PLAY** scored 33 on buildability (5/5, nothing about it is hard) and verifiability (5/5, trivial A/B), but has the weakest impact payload of any top-ranked concept: hours of LED lighting per kWh stored, with no user and no city. It also loses Best School Innovation head-to-head to BOL, which is why it is third and not second.

---

## FULL SCORECARD

| # | Concept | Lens | Track | Target award | Build | Impact verif | Fusion | Prize capture | Longevity | **Weighted** |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **BHOOMI** — silt-aware rain-garden gate | 4 | Nature-based | Best Nature Based Solution | 3 | 4 | 5 | 4 | 5 | **34** |
| 2 | **BOL** — caption mesh | 4 | Build-wize | Best School Innovation | 3 | 5 | 4 | 4 | 4 | **33** |
| 3 | **THERMAL-PLAY** — PCM thermal classroom kit | 1 | Build-wize | Best School Innovation | 5 | 5 | 4 | 3 | 4 | **33** |
| 4 | **HEALGRADE** — UWB-verified NiTi self-healing beam | 2 | Build-wize | Best Sustainable Infra | 3 | 5 | 5 | 2 | 4 | **31** |
| 5 | **TILTA-DRUM** — self-tuning sludge screw press | 3 | Nature-based | Best Sustainable Infra | 3 | 5 | 4 | 2 | 5 | **30** |
| 6 | **CADAVER-PROOF** — passive damper cooler | 3 | Nature-based | Best School Innovation | 4 | 5 | 3 | 3 | 4 | **30** |
| 7 | **EARTHWAVE** — earth-wall LoRaWAN antenna | 2 | Build-wize | Impact Award | 4 | 5 | 3 | 2 | 5 | **29** |
| 8 | **BRICKPASS** — NFC PET gyroid school desk | 2 | Build-wize | Best School Innovation | 5 | 3 | 4 | 3 | 4 | **29** |
| 9 | **BHASINI** — self-priming rainwater main | 3 | Nature-based | Best Sustainable Infra | 3 | 4 | 4 | 2 | 5 | **28** |
| 10 | **PUNAR-CELL** — thermographic LFP grading bench | 1 | Build-wize | Impact Award | 3 | 4 | 4 | 2 | 4 | **27** |
| 11 | **MYCOPASS** — RFID passport in mycelium pavers | 2 | Nature-based | Best Nature Based Solution | 4 | 2 | 4 | 3 | 5 | **27** |
| 12 | **SAFAI-TAG** — sanitation worker offline log | 4 | Build-wize | Impact Award | 5 | 3 | 4 | 2 | 4 | **27** |
| 13 | **NEER-TARA** — imaging-guided lake aerator | 1 | Nature-based | Best Nature Based Solution | 2 | 2 | 5 | 3 | 4 | **26** |
| 14 | **SURYA-DHULA** — CV soiling classifier + string optimiser | 1 | Build-wize | Best Sustainable Infra | 3 | 2 | 5 | 2 | 4 | **25** |
| 15 | **COOLPANE** — mmWave-through-aerogel panel | 2 | Build-wize | Best Sustainable Infra | 2 | 3 | 5 | 2 | 3 | **25** |
| 16 | **TAAP-TEG** — IR-guided waste-heat TEG harvester | 1 | Build-wize | Best Sustainable Infra | 3 | 3 | 5 | 2 | 2 | **25** |
| 17 | **JYOTI** — Matter/Thread disaggregating submeter | 4 | Build-wize | Best Sustainable Infra | 2 | 3 | 4 | 2 | 5 | **25** |
| 18 | **AEROLITH** — auto jam-clearing co-extruder | 3 | Build-wize | Impact Award | 3 | 3 | 4 | 2 | 2 | **23** |
| 19 | **NETRA** — data-over-light sub-centre transport | 4 | Build-wize | Impact Award | 4 | 4 | 2 | 2 | 2 | **22** |
| 20 | **TILAK** — leaf-wetting measurement wand | 3 | Nature-based | Best Nature Based Solution | 5 | 1 | 3 | 2 | 2 | **19** |

### Why the top of the table looks the way it does

**Fusion strength is the discriminator, not buildability.** Six concepts score 5/5 on fusion (BHOOMI, HEALGRADE, NEER-TARA, SURYA-DHULA, COOLPANE, TAAP-TEG). Four of those six collapse on verifiability or prize-capture, because strong fusion without a measurable number buys nothing. SURYA-DHULA needs 21 days of soiling data it will not have. NEER-TARA needs two weeks on a lake plus a BBMP permit. TAAP-TEG harvests milliwatts. COOLPANE needs a tuned dielectric matching face that 26 hours will not produce. BHOOMI is the only 5-fusion concept whose number can be produced, with a control, in one afternoon.

**Buildability is a trap.** The cheapest concepts (BrickPass ₹3,150, SAFAI-TAG ₹2,330, NETRA ₹1,700, TILAK ₹4,100) all score 4-5 and all finish outside the top ten. Cheap and fast is not the same as competitive. BOL's 30 hours and BHOOMI's real 55 hours buy far more than their lighter-weight neighbours because the hours go into the claim rather than the enclosure.

**The bottom of the table fails on one specific test.** NETRA scores 2 on fusion and that is the correct score: a phone hotspot or a USB cable carries the same bytes as the optical transport, so removing the transport parent leaves a working product. TILAK scores 1 on impact verifiability because it has no environmental quantity at all: it measures canopy roughness faster, and nobody at a Best Nature Based Solution judging table is buying that.

**Prize-capture is brutal because the good awards are crowded.** Counting my own twenty: Best Sustainable Infrastructure Innovation attracts 7, Impact Award 5, Best Nature Based Solution 4, Best School Innovation 4. Every concept that targets the top-contested award carries a 2. BHOOMI and BOL score 4 because they do the thing fewer teams do, which is bring a controlled number to a category that is usually entered with enthusiasm and no measurement.

---

## BUILD PLAN

### Revised ₹ BOM

The source figure of ₹5,280 is the node only. A real build needs a gateway, a spare actuator, a dosing rig and consumables. Honest total for a team of four: **₹8,350**.

| Item | ₹ |
|---|---|
| ESP32-S3 DevKit-1 | 400 |
| SX1262 LoRaWAN 1.0.4 module + 915 MHz antenna | 650 |
| SEN0189 turbidity sensor (analog out) | 320 |
| EC / conductivity analog probe | 180 |
| VL53L1X ToF module + float guide | 450 |
| 12 V linear actuator + SS rod + gate frame | 1,800 |
| 5 V 2 W solar panel + 18650 ×2 + TP4056 | 830 |
| IP65 ABS enclosure | 350 |
| Connectors, glands, wiring | 300 |
| **Node subtotal (as specified)** | **5,280** |
| ChirpStack gateway: laptop + USB LoRa dongle (or borrow a campus gateway) | 1,200 |
| Spare linear actuator + spare ToF and turbidity modules (demo insurance) | 900 |
| Test rig: 60 L reservoir, dosing pump, silt (kaolin + laterite mix), graduated catch vessels | 750 |
| Turbidity reference probe (judge-visible, independent of the node) | 220 |
| **Total** | **8,350** |

Entry fee ₹799. Total exposure **₹9,149** for four people. Comfortably inside a normal student/early-stage team budget.

### Build hours

The source says 16 hours. That is solder time, not project time. Realistic allocation across **4 members, 55 hours total**:

| Phase | Hours | Owner |
|---|---|---|
| Gate frame fabrication, actuator mounting, sluice assembly | 12 | M1 |
| Node PCB wiring, enclosure, solar and battery integration | 8 | M2 |
| ChirpStack gateway bring-up, LoRaWAN join, DTN bundle layer | 7 | M2 |
| **Test rig build (reservoir, silt dosing, graduated capture)** | **10** | M3 |
| **Labelling campaign: 200 events, 6 silt levels × 3 first-flush magnitudes + 15 negatives** | **12** | M3 + M4 |
| 1D-CNN + TCN training, INT8 quantisation, CMSIS-NN port | 12 | M4 |
| Gate control logic, event logger, OTARA sync to downstream gardens | 6 | M1 |
| Integration, storm simulation rig, rehearsal ×3 | 6 | All |
| **Total** | **73** | — |

The 73 hours assumes the labelling rig and the gateway come up first time. Budget 90 if the LoRaWAN join or the actuator alignment fights. Start the labelling campaign in week one, not week three: it is the long pole and it gates the fallback.

### What to bring to the judging table

1. **The node, working, with its own solar charging**, not on a bench supply. Judges read this as a field product.
2. **A second turbidity probe on a caliper stand**, visibly independent of the node, wired to nothing but its own readout. This is the judge-trust instrument. If they do not believe your sensor, they will not believe your model.
3. **The gate frame and sluice, physically swappable.** The whole demonstration is controller A versus controller B on one gate. Bring both controllers and a screwdriver.
4. **A printed turbidity-vs-EC scatter** from your own labelling campaign, with the class boundary drawn on it. This is the artefact that makes the classifier look like engineering rather than magic.
5. **The held-out confusion matrix**, printed, with the 40 test events individually labelled. Invite the judge to pick an event and check it.
6. **The DTN demonstration already loaded and buffered** before you walk up. Pull the gateway, show a queued first-flush record, restore the gateway, watch it arrive CRC-clean. Pre-arm it; do not discover it live.
7. **A one-page claim card** with three numbers and nothing else: held-out classification accuracy, silt mass past the gate (BHOOMI vs baseline), and first-flush records preserved through a simulated outage (n of n).
8. **Screenshots of a real Bengaluru rain garden or percolation trench**, so the judge can connect the bench demo to the city. The award is Nature Based Solution; the name has to appear somewhere other than in your award target line.

Do not bring: a laptop battery, a Wi-Fi hotspot, or any cloud dashboard. The entire product is that these are absent.

---

## MEASUREMENT PLAN

The impact number on the day, step by step. This is the run-of-show, and it has to complete in eight minutes.

### Phase 0 — Before the event (three weeks minimum)

**Build the labelled set.** On the test rig: 60 L reservoir, dosing pump delivering a kaolin-plus-laterite silt slurry at six calibrated load levels (0, 2, 5, 10, 25, 50 g/L). For each silt level, generate three event types: a **steady rain inflow**, a **first-flush surge** (high flow, high silt, occurring in the first 90 seconds), and an **overflow surge** (flow above gate capacity). That is 18 positive conditions. Add 15 negatives: pure rain, post-cleaning water flush, and clear overflow. **Total 200 events**, each logged with the true silt mass delivered.

**Label by delivered mass, not by intuition.** Every event's ground truth is the mass of silt dosed into the reservoir, weighed. This is what makes the confusion matrix defensible.

**Split 160 / 40.** Train on 160, hold out 40, never touch the 40 again. Photograph the held-out set before you train, so the audit trail is visible.

**Train and quantise.** Pruned 1D-CNN + TCN over a rolling window of (turbidity, EC, ToF level, flow proxy). Quantise to INT8, port through CMSIS-NN, deploy to the ESP32-S3. Confirm the port matches the desktop model to within one percentage point before the event.

**Sanity-check separability before anything else.** Plot turbidity against EC for all 200 events. If the classes do not separate, you have found out in week two rather than on stage. See the risk section.

### Phase 1 — The day, setup (before judging)

1. Gate frame rigged over the catch vessel, sluice installed, actuator powered from the node's battery.
2. Node logging turbidity at the **inlet**, EC at the inlet, level at the sluice. Independent reference turbidity probe at the **overflow**, on its own display.
3. ChirpStack gateway running on the laptop, suppressed from view or on a second screen.
4. Pre-arm the DTN proof: stage a first-flush event record, kill the gateway link (unplug the USB dongle), confirm the record is buffered and flagged.

### Phase 2 — Run A: BHOOMI controller

1. Run the **50 mm simulated storm** through the gate. Dose silt at the calibrated level, record the true delivered mass on the balance.
2. Node classifies the inlet event on-device, opens or holds the sluice accordingly. Log every classification with its confidence.
3. Catch the overflow in a graduated vessel. Weigh the **silt mass that passed the gate**: filter, dry, weigh on the balance.
4. Log peak overflow turbidity from the **independent probe**, not from the node.
5. Record first-flush preservation count and any gateway-dropout windows.

### Phase 3 — Run B: baseline controller

6. **Swap only the controller.** Same gate, same sluice, same actuator, same storm profile, same silt load. Replace the node with a float switch plus a fixed turbidity threshold, wired to the same actuator.
7. Repeat steps 1 to 5 exactly. Same dosed mass, same overflow vessel, same independent probe.

The swap must take under 90 seconds on stage. Rehearse it until it is boring.

### Phase 4 — Scoring

8. **Classification accuracy:** compare the node's event log against the dosed truth log, on the **held-out 40**. Report the confusion matrix, not just the accuracy figure. Publish the misses.
9. **Silt past the gate:** Run A mass versus Run B mass, same delivered input. This is the headline number. Report the ratio and the absolute grams.
10. **Overflow turbidity peak:** Run A versus Run B, from the independent probe. This is what the judge can read off a screen without trusting your model at all.
11. **First-flush preservation:** number of first-flush records preserved through a full gateway outage versus events generated during the outage.

### Phase 5 — The two gestures

12. **Unplug the gateway mid-run.** Show the node continuing to classify and actuate locally with no uplink at all. Then restore it and show the queued first-flush record arriving intact. Ten seconds, and it is the most memorable ten seconds in the Nature-based category.
13. **Hand the judge the reference probe.** Let them read the overflow turbidity themselves. A judge who has independently confirmed your number is a judge who will vote for you.

### The three numbers on the card

- Held-out classification accuracy on 40 unseen events: **target ≥90%**
- Silt mass past the gate, BHOOMI versus float-switch baseline, same 50 mm storm: **target ≥60% reduction**
- First-flush records preserved through a simulated gateway outage: **target 3 of 3**

If the classifier underperforms, the fallback claim still works and is stated in advance so it does not look like a rescue: *silt mass past the gate with the node's fixed silt threshold versus float-switch baseline*, with the DTN first-flush preservation number as the second figure. That fallback requires no model at all and still demonstrates the full fusion, because the transport parent is doing load-bearing work in both claims.

---

## BIGGEST RISK

**The 200-event labelled set may not separate cleanly, and the 200 events themselves are the single point of failure.**

Concretely: in real Bengaluru runoff, electrical conductivity is confounded. Road salt and construction dust raise EC independently of sewage, storm dilution collapses EC while sewage is still present, and first-flush turbidity and first-flush EC can decorrelate depending on what is washed off the surface that day. If turbidity and EC do not separate the classes on your own data, the classifier is learning noise, the held-out accuracy lands near chance, and the headline number collapses with no on-stage recovery. Everything else on this build is mechanical and recoverable; this is not.

There is a second-order version of the same risk: a team that labels its own test set has no defence when a judge asks whether the labels are honest. Self-labelled ground truth is the oldest hole in this category and experienced judges look straight for it.

### Mitigation

**Start the labelling rig in week one.** It is the longest-lead item and it gates every other decision. Do not begin it in week three.

**Answer the separability question before you build the model.** In week two, plot turbidity against EC across all 200 events. If the classes overlap badly, you need to know then, not on stage. The likely fixes, in order of preference: add a third channel (a cheap turbidity-plus-particle-size split, or flow rate alongside level), relabel onto a two-class problem (silting runoff versus everything else) which is what the gate actually needs to decide, or drop the classifier entirely and lean on the fixed-threshold fallback plus the DTN demonstration. A two-class model that works beats a five-class model that does not, and the gate does not care about the difference between a silt surcharge and a clean overflow: both of them close the inlet.

**Make the labelling auditable.** Weigh every dose on a balance with a photo of the weighing taped to the logbook. Dose from a numbered, pre-weighed slurry batch, so the judge can reconstruct any single event. Ground truth that is reproducible beats ground truth that is merely claimed.

**Build the fallback first, not last.** Get the fixed-threshold configuration running and demo-ready before you write a line of model code. The fallback still carries the full fusion argument (LoRaWAN + DTN still protect the first-flush record through a gateway outage, which is the half that no competitor in this category can demonstrate) and still produces a controlled number. The classifier is the upside, not the floor.

**Bring the scatter plot.** A printed turbidity-versus-EC plot from your own data, with the boundary drawn, converts the most dangerous question in the session into a conversation about your method instead of a challenge to your integrity. If the boundary is visible and you drew it yourself, the judge is reading your rigour. If it is not there, the judge is guessing, and you are losing.