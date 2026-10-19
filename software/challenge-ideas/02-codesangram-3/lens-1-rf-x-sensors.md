# Lens 1 — RF & Wireless × Sensor Instrumentation
### CodeSangram 3.0 · National Hackathon · Bengaluru

**Assigned pair (both load-bearing, no substitutes):**
**A = RF & Wireless** — UWB, LoRa/LoRaWAN, NFC, mmWave, SDR, RFID, GNSS, Wi-Fi sensing, Bluetooth, Zigbee, phased-array radar
**B = Sensor Instrumentation** — MEMS, IMU/accel/gyro, strain gauges, CO₂/gas, ultrasonic, ToF, pressure, radiation, magnetometer, tactile/force

**Filter applied to every concept below:** *if you deleted either parent technology, does the product still exist and still work?* If yes, the concept was cut. All five survivors pass with an engineering counterfactual, not a marketing one.

**Selection lens:** narrow wedge, commodity modules doing something that previously required a dedicated ₹2–8 lakh instrument; a demo a judge can watch happen in 90 seconds; a Bengaluru-specific failure the panel already recognises.

---

### 1. GIRIH — Swing-Risk Radar for Tower Cranes & Material Hoists **TOP 2**

- **Integration:** UWB (DWM3000-class 2-way ranging, 4 tags: hook ↔ trolley ↔ 2 building corner anchors) + MEMS IMU (BMI270, 6-DoF @ 200 Hz on the hook block and on the trolley)

- **The product:** A ₹12,000 retrofit kit that bolts onto an existing tower-crane jib or material hoist — UWB tags plus two IMU nodes that fuse to predict the suspended load's **swing envelope** and sound an alarm 2–4 seconds *before* the load crosses an exclusion zone over a live site floor or public road.

- **Bengaluru problem it solves:** Bengaluru's southern and eastern corridors (ORR, Sarjapur–Whitefield, Yelahanka, Electronic City) carry a continuous build-out of 30–40-storey towers, most run by small-to-mid developers on second-hand Chinese or Indian cranes whose anti-collision packages are the ₹1.5–8 lakh "top trim". The dominant fatal mechanism on these sites is not the free-fall — it is the **swinging load** swinging into the podium edge, into an occupied slab, or over a live ORR-side service road. Today that is prevented with a rope tag line and a human spotter. Telemetry on these cranes is typically "we get a camera feed of the hook."

- **Why BOTH are required:** *(counterfactual)*
  - **Remove UWB →** The IMU gives swing angle, angular velocity and hook-block acceleration — but in the hook's *own* frame, with no position. You cannot answer the only question that matters: *is this swing inside the exclusion zone or out over the road?* You also cannot compute a true minimum approach distance to a live façade. IMU-only is an inclinometer bolted to a pendulum.
  - **Remove IMU →** UWB returns hook position at ~10–20 Hz. A wind-driven swinging load and a load hanging dead-plumb produce *the same range samples*. The danger is not position, it is **growing amplitude**: a swing builds over 1–3 seconds and a positional fix at 20 Hz simply sees each sample as "in range." Radar/ranging alone is structurally blind to the failure it is meant to prevent.
  - **Together** the estimator is a damped 2-DOF spherical pendulum: the IMU supplies ω₀, ζ and phase; the UWB range-rate seeds the amplitude and supplies the anchor frame. Output is a *predicted* 3-second envelope, not a boundary trip. This is the whole innovation and it costs ₹120 of MCU to run.

- **Bill of materials:** *(Bengaluru street prices, incl. GST)*
  | Item | Qty | ₹ |
  |---|---|---|
  | Qorvo DWM3000 UWB modules | 4 | 3,800 |
  | ESP32-S3 dev boards (hook node, trolley node, anchors) | 4 | 1,800 |
  | BMI270 IMU breakout | 2 | 440 |
  | 10,000 mAh Li-ion + 5 V buck + IP65 enclosures | 2 | 1,500 |
  | SX1278 LoRa backhaul uplink | 1 | 250 |
  | Demo rig: 3 m aluminium profile gantry, pulleys, 6 mm rope, 12 kg deadweight, clamps | — | 3,500 |
  | Connectors, 18650 holders, solder, wiring, misc | — | 1,200 |
  | **Total** | | **₹12,090** |

- **48-hour build plan (hour-by-hour):**
  - **H0–4** — Collect BOM; fabricate the gantry rig (3 m beam, 2 uprights, pulley pair, hanging 12 kg weight). Build two anchors 4 m apart to represent a podium edge.
  - **H4–10** — Get UWB 2-way ranging stable hook↔anchor at ≥10 Hz. Target <15 cm RMS at 3–8 m. Log raw distance over UART with a timestamp.
  - **H10–16** — IMU node: BMI270 at 200 Hz over SPI, quaternion + gyro integration, time-aligned to the UWC log on the same ESP32 timer. Dump CSV to SD.
  - **H16–24** — Fusion. Fit ω₀ and ζ per swing episode from the IMU, seed amplitude from UWB range-rate, roll the pendulum forward 3 s, compute predicted min-distance to the nearest anchor-defined face. **No ML** — that is the selling point: it runs on a ₹350 MCU.
  - **H24–32** — Rule engine, local buzzer + LED zone map, hysteresis and minimum-swing-amplitude gating to kill false positives.
  - **H32–40** — Demo scripting: (a) steady lift = green; (b) hand-kicked swing that decays = amber; (c) operator pumps the trolley to build amplitude = alarm fires *before* entry. Add a reference clip of a real ORR-side site.
  - **H40–46** — Counterfactual A/B on stage: rerun with IMU disabled (alarm never fires on a growing swing), rerun with UWB disabled (envelope computed but unlocatable). This is the moment the judge gets it.
  - **H46–48** — README, BOM, calibration notes, safety disclaimers, and the failure-mode write-up.

- **Data available free vs needing partnership:** 100% free — Qorval's open DW3000AQ Arduino port, BMI270 datasheet, control-theory literature on spherical-pendulum damping is public, and all training data is self-generated. **No partnership needed**; a real site pilot with a Bengaluru developer would be a post-hackathon conversation.

---

### 2. NAALI — UWB-Tagged Drain Integrity Probe **TOP 2**

- **Integration:** UWB (DWM3000, 1 probe tag + 2 manhole-shaft anchors → local stationing where GNSS cannot reach) + MEMS strain-gauge (HX711 + 4-arm 120 Ω load cell on a tensioned cable) + MEMS IMU (BMI270) for invert slope

- **The product:** A ₹6,000 **throw-on inspection probe** for a stormwater/sewer lateral: a tensioned steel cable with a load cell reading catenary sag and an IMU reading invert grade, tagged with UWB so the resulting defect map is geo-referenced without GPS.

- **Bengaluru problem it solves:** BBMP has no trustworthy asset register or condition data for its stormwater rifts and sewer laterals. A settled/voided section or a silting blockage surfaces only as monsoon flooding — the recurring monsoon flooding in Ulsoor, Hombi layout, Challaghatta-adjacent layouts and the ORR drains — and the response is always blind excavation. The cheap inspection method (robotic CCTV crawler + operator + generator + road closure) costs ₹40,000–2,50,000 per run. A stethoscope-and-dive-and-probe check costs nothing, and nobody does it, because the standard way to locate a defect underground is a meter chain from a manhole.

- **Why BOTH are required:** *(counterfactual)*
  - **Remove UWB →** The probe still reads sag and grade perfectly — but you get a *shape* with no *location*. "There is a sag at cable payout 14.6 m" is not an actionable work order; "the collapse is 22.4 m downstream of manhole B-114 on 4th Main" is. Underground there is no GNSS fix, and a surface meter chain over a manhole cover is exactly the kind of measurement nobody signs off on. UWB is not the telemetry here, it is the **stake numbering system**.
  - **Remove strain + IMU →** The UWB tag becomes a location beacon. It tells you where the probe is; it cannot tell you whether there is pipe underneath, whether it has settled, or whether it is 50% full of silt. Location without condition is a survey tool; condition without location is a lab experiment.
  - **Together** — anchors at both shafts give ±10 cm stationing for ₹950 each; the load cell gives millimetre-accurate sag; the IMU gives grade. The output is a **digital twin of a buried pipe invert** with defect stations, at 1/20th the cost of the industry standard tool.

- **Bill of materials:**
  | Item | Qty | ₹ |
  |---|---|---|
  | Qorvo DWM3000 UWB modules (1 probe + 2 shaft anchors) | 3 | 2,850 |
  | HX711 24-bit ADC + 4-arm 120 Ω sealed load cell | 1 | 260 |
  | BMI270 IMU breakout | 1 | 220 |
  | ESP32-S3 + microSD logger | 1 | 450 |
  | 25 m 6 mm braided stainless cable + 15 kg drop weight + retrieval line | — | 700 |
  | Deployment kit: LED headlamp, laser distance meter, hand-crank winch | — | 1,200 |
  | IP68 housing, buoyancy foam, Kevlar retrieval line | — | 600 |
  | **Total** | | **₹6,280** |

- **48-hour build plan:**
  - **H0–3** — Build the mock: 6 m of 200 mm PVC in a darkened corridor, one section shimmed down 40 mm to simulate a settled/voided span, one with a partial "silting" plug. Two crate "manholes" 4 m apart.
  - **H3–8** — Load-cell cable rig: calibrate catenary sag → tension → depth, repeatable to ±10 mm. Log at 20 Hz.
  - **H8–14** — IMU: pitch/roll at 100 Hz, integrate the invert grade profile.
  - **H14–20** — UWB: anchors at each shaft, probe ranges to both → 2-D stationing. Target ±10 cm at 20 m. Force a station every 0.25 m of cable payout (winch odometer wheel).
  - **H20–28** — Multilateration with cable payout as a sanity constraint; defect classifier (sag spike + grade discontinuity = void; elevated steady tension + no slope = blockage).
  - **H28–36** — Field UI: laptop/phone render of the invert profile with colour-coded defect zones and a one-paragraph auto-written work order.
  - **H36–44** — Counterfactual A/B: rerun with anchors removed (shape, no location) and with the sensor removed (location, no condition).
  - **H44–48** — IP/retrieval hardening if the cable jams, BOM, write-up, demo script.

- **Data available free vs needing partnership:** 100% free — open DW3000AQ port, HX711 datasheet, catenary equations, and public sewer-inspection defect coding conventions (EN 13509-2 style) that we can cite and adapt. **No partnership needed**; a BBMP or ward-engineer pilot is a post-hackathon conversation.

---

### 3. GAMBHIR — Manhole & Wet-Well Worker Lifeline

- **Integration:** LoRa (SX1262, sub-GHz — the only link that gets out of a manhole) + UWB (which manhole, which of the dozens nearby) + MEMS gas instrumentation (electrochemical H₂S + CO, CO₂, MEMS humidity/temperature) + MEMS IMU (fall/impact/pose)

- **The product:** A ₹5,000 chest-strap pod for sewer, septic and storm-drain entry — NFC tap-to-log entry, continuous gas + pose sensing, a UWB beacon that locates the worker in the underground network, and a LoRa uplink that delivers the alarm when there is no bar of cellular signal.

- **Bengaluru problem it solves:** Bengaluru's sewage and septic network is entered by workers, often alone, often at night, often without a reliable spotter — and H₂S is the mechanism that kills. The counter-intuitive safety fact is the reason this is an instrumentation problem and not a training problem: **at roughly 100–200 ppm H₂S destroys the sense of smell, so the gas that will kill you is the gas you can no longer smell.** Smell-based warnings fail precisely at the concentration that matters. Add Bengaluru's monsoon inflow, which raises loading and shifts the danger curve, and the septic/gully cleaning cycle that state law has been trying to push onto machines.

- **Why BOTH are required:** *(counterfactual)*
  - **Remove RF →** In a 2 m-diameter, 8 m-deep manhole there is no signal and no line of sight. A gas reading that cannot leave the hole is worth nothing, and a worker carrying only a phone has no way to call at all — the phone finds zero bars at 4 m. UWB additionally answers *which* shaft: a single layout can have 40 manholes within 100 m, so "somewhere in the layout" is useless to a rescue team. LoRa answers "out of the hole at all."
  - **Remove sensors →** The RF pod becomes a dead-man switch. The only thing that justifies saying "this location is lethal" is the electrochemical H₂S/CO reading — a beacon cannot smell. And the IMU supplies the distinction that decides the response: a flat, motionless orientation after a 4 g impact is not "worker is tired," it is "worker is down," which is the difference between calling an ambulance and dispatching a recovery team with a tripod.
  - **Together** — you get the *chemistry* that says go/no-go and the *radio* that says where and who. Neither half is a safety device on its own.

- **Bill of materials:**
  | Item | Qty | ₹ |
  |---|---|---|
  | ESP32-S3 + SX1262 LoRa module | 1 | 1,100 |
  | Qorvo DWM3000 (pod + 2 shaft anchors) | 3 | 2,850 |
  | Electrochemical H₂S cell (K30-class / MQ-136 analogue) | 1 | 900 |
  | Electrochemical CO cell (2-year life) | 1 | 800 |
  | CO₂ (SGP30 or MH-Z19) | 1 | 1,100 |
  | BME280 (T/RH) + MPU-6050 | 2 | 350 |
  | NTAG213 NFC tags (entry/exit ledger) | 6 | 180 |
  | 3,000 mAh Li-ion + IP67 housing + lanyard | 1 | 1,200 |
  | Layout gateway: SX1262 + ESP32 + 5 V PSU | 1 | 1,800 |
  | Demo rig: 900 mm mock manhole, gas cylinder + regulator, tripod | — | 2,500 |
  | **Total** | | **₹12,780** |

- **48-hour build plan:**
  - **H0–4** — Build the mock manhole (900 mm PVC chamber, sealed, in a dark corridor). Collect and unpack the gas cells.
  - **H4–9** — Characterise each sensor: baseline in clean air, response curve, cross-sensitivity. Log H₂S at multiple concentrations from a metered release.
  - **H9–14** — UWB: pod ↔ 2 anchors, stationing to ±10 cm at 10 m, confirming it holds with the pod 6 m down a shaft and one steel grate in the path.
  - **H14–20** — LoRa link budget from the bottom of the mock shaft through a grate and a "basement" box, with the phone's bar count shown on screen for contrast (0 bars — this is the money shot).
  - **H20–26** — NFC entry/exit ledger + "no-exit-in-8-minutes" escalation. IMU fall detection (impact + orientation threshold) and a synthetic fall.
  - **H26–34** — Responder UI: gateway dashboard showing the worker's UWB position inside the layout's manhole map, live gas curve, and the entry/exit log.
  - **H34–44** — Counterfactual A/B: sensor pod with RF off (alarm goes nowhere), and RF pod with sensors off (a dead-man switch that reports nothing).
  - **H44–48** — Calibrated sensor curves, safety disclaimers, BOM, write-up.

- **Data available free vs needing partnership:** Free — all datasheets, NIOSH/OSHA IDLH and permissible-exposure values are public, and the gas response data is self-generated in the build window. **No partnership needed for the demo.** A real deployment *would* need a BBMP/BWSSB or a sewer-contractor pilot and an occupational-health sign-off, which is honest to state and out of scope for 48 hours.

---

### 4. JALDHARA — Sump Level & Pump-Health Early Warning

- **Integration:** LoRa (sub-GHz — cellular is dead at B2/B3 and the colony will not run 60 cables) + MEMS pressure (water level) + MEMS Hall current (pump health)

- **The product:** A ₹2,200 pod per sump: water level plus pump-current-derived health, reporting **"this sump overflows in ~2 h 40 m"** and **"this pump is ~3 weeks from failing"** to one layout-wide gateway and a single LED board in the lift lobby — no app, no per-household login.

- **Bengaluru problem it solves:** Gated layouts across Bengaluru flood when sump pumps fail or when rain exceeds pump capacity. The pump does not fail loudly — a silted impeller shows up first as rising run-hours per start, a soft-start current that climbs and a steady-state current that drops. Residents find out when their car is in the water. No layout in Bengaluru monitors a single pump; the sump is the one piece of infrastructure in the building that already has power and nobody watching.

- **Why BOTH are required:** *(counterfactual)*
  - **Remove RF →** At B2/B3 there is no GSM bar and no Wi-Fi AP; the alarm cannot leave the slab. But the real killer is topology and economics: 60 pumps each running its own SIM costs ₹18,000/month of airtime to a gated colony that will not approve it, and each home's Wi-Fi is a different network. Sub-GHz LoRa with one ₹1,700 wall-mounted gateway and a 3-year coin cell is the *only* topology that is both affordable and 3-concrete-slab-deep — 2.4 GHz Bluetooth dies at 20 m through one slab.
  - **Remove sensors →** A LoRa heartbeat node says "the pod is alive." That is not a product. The entire value is the **level trend** and the **pump signature** — run-hours per start, inrush vs steady current, stalled-current signature for a blocked impeller. Without pressure and Hall sensing you can only ever report the one state nobody needs reported: *flooded*.
  - **Together** it is a **forecasting** product, not an alarm: level + inflow rate gives time-to-overflow, current history gives a pump failure date. Two predictions, not one boolean.

- **Bill of materials:**
  | Item | Qty | ₹ |
  |---|---|---|
  | SX1262 + ESP32-S3 node (demo: 3 nodes) | 3 | 3,300 |
  | Waterproof pressure transducer 0–1 bar (alt: stainless 3-wire probe + HX711) | 3 | 1,350 |
  | TMCS1250A Hall current sensor + op-amp front end | 3 | 660 |
  | BME280 | 3 | 450 |
  | 18650 + 1 W solar trickle panel + IP68 enclosure | 3 | 3,300 |
  | Gateway: SX1262 + ESP32 + 5 V supply | 1 | 1,700 |
  | Demo rig: 60 L bin, 12 V diaphragm pump, float switch, PVC, drain hose | — | 1,400 |
  | Lobby LED board (MAX7219 + 8-digit display) | 1 | 800 |
  | **Total** | | **₹12,960** |

- **48-hour build plan:**
  - **H0–4** — Build the sump rig; wire the pump and the current sensor; verify current measurement against a bench multimeter.
  - **H4–10** — Calibrate the level probe in a calibration column; fit level→volume for the demo bin.
  - **H10–16** — Derive time-to-overflow from level slope against a metered inflow; validate the model against a controlled flood test.
  - **H16–24** — Pump health: log inrush vs steady-state current across 30 starts; then **deliberately clog the intake with a rag** and show inrush-current and run-hours diverging from the healthy baseline before the pump actually stalls.
  - **H24–32** — LoRa: node → gateway → lobby board; install the "basement" as a sealed dark box with the door shut and show the phone's zero bars next to the LoRa RSSI.
  - **H32–40** — Failure demos: (a) block the pump → countdown appears on the board; (b) simulate an inflow surge → countdown shortens; (c) cut the power → offline-alert path.
  - **H40–48** — Counterfactual A/B, BOM, and a per-node cost breakdown at 60-node scale.

- **Data available free vs needing partnership:** 100% free — Hall-effect current sensing and LoRa airtime/link-budget maths are textbook and public, and the level→time-to-overflow model is fitted from our own data. **No partnership needed for the demo**; a layout management committee pilot would be the follow-on.

---

### 5. KACHRA — Wet/Dry Separation Proof-of-Service Bin Node

- **Integration:** NFC (NTAG216 passive tags embedded in the bin lid — unforgeable identity + tamper evidence) + MEMS IMU (MPU-6050/BMI270 @ 1–2 kHz, listening to the tipping event) + strain-gauge/HX711 for fill state

- **The product:** A ₹700 lid retrofit for every wet and dry bin in a gated layout — an NFC-tagged lid with a vibration-sensing node that reconstructs, from the tipping event alone, **which bin was emptied, whether it was full, and whether its contents were wet or dry** — and emits a receipt to the SWM contractor's phone, which the layout already owns.

- **Bengaluru problem it solves:** BBMP dry/wet segregation is effectively unenforced in private gated layouts. Residents pay ₹200–900 a month for "wet waste management," but the collection date is unannounced, the contractor bills for collections that may not have happened, and the mixing that follows is exactly why compost gets rejected downstream. Residents blame the contractor; the contractor blames residents. There is **no proof-of-service anywhere in the chain** — and this is a Bengaluru-specific institutional gap, not a technology gap.

- **Why BOTH are required:** *(counterfactual)*
  - **Remove NFC →** You have a classifier but no identity. A vibration node on bin #42 reporting "wet, 92% full, emptied 07:10" proves nothing if it cannot prove *that was bin #42* — contractors swap lids, move bins and re-label them. And the identity cannot come from GPS: the contractor's phone location is spoofable, and a ₹299/month SIM per bin destroys a business running on ₹30,000/month margins. **This is exactly why Indian smart-bin vendors, who priced these at ₹8–15,000 a bin with SIM-based telemetry, never scaled** — the tag is the economic reason the whole category works.
  - **Remove the IMU + load cell →** NFC alone gives a five-second "tag presented at the hopper = bin X done." That is an *already-broken* product, and it fails the two complaints residents actually raise: the bin was **overfull** (the lid would not close) and it was the **wrong contents** (wet mixed with dry). Content and fullness are the entire substance of the claim; the tag is the entire *identity*. Without both, a receipt is a timestamp someone typed.
  - **Together** — a passive tag that cannot be cloned without its UID, a physical timestamp from the tipping dynamics, and a content verdict that the contractor did not produce. This is the one concept on the list where the *policy* win is as large as the technical win.

- **Bill of materials:**
  | Item | Qty | ₹ |
  |---|---|---|
  | NTAG216 NFC tags (50 in production, 6 in demo) | 6 / 50 | 150 / 1,250 |
  | NFC reader — Android phone's built-in reader (₹0) or ST25R3916 for production | 1 | 0 / 350 |
  | MPU-6050 IMU | 3 | 360 |
  | ESP32-C3 / Seeed XIAO module | 3 | 1,950 |
  | 3.7 V 250 mAh LiPo + 2 × 5 mm coin cell for NFC backup | 3 | 540 |
  | HX711 + 4-arm load cell on a compression spring (fill state) | 3 | 600 |
  | Test load: soaked newspaper vs dry leaves/cardboard | — | 300 |
  | Demo bins, hinged lid, springs, spray paint | — | 1,100 |
  | **Total (demo)** | | **₹5,000** |

- **48-hour build plan:**
  - **H0–4** — Cut and fit NFC tags into three bin lids; get a phone to read UID + write a bin identity record on first boot.
  - **H4–9** — IMU rig: MPU-6050 at 1.6 kHz on the lid hinge, capturing ~2 s windows of a full tip-and-return. Verify sampling rate and axis orientation.
  - **H9–18** — **Supervised trial: 24 tips across six classes** — dry full, dry half, dry overfull, wet full, wet half, mixed. Extract features: RMS, zero-crossing count, spectral centroid in 0–200–1000 Hz, tip duration, peak jerk, settle impulse.
  - **H18–26** — Classify **on-device** (a 4-feature decision stump set fits in 8 KB of flash) — no cloud, no app, which is the point for a ₹700 node. Log every classification with the tag UID.
  - **H26–34** — Receipt flow: contractor taps the bin, tips it, gets a one-screen receipt (bin ID, timestamp, contents, fill %, wet/dry verdict, layout).
  - **H34–42** — Failure honesty: deliberately overfill a bin beyond its limit and show the node catching it; mix wet into dry and show the *misclassification* honestly — then add the load cell's fill signal to break that tie.
  - **H42–48** — Counterfactual A/B: tags removed (identical bin treated as a different bin → invoice fraud reproduces) and sensors removed (identity without content → the overfull complaint is invisible again).

- **Data available free vs needing partnership:** Free — the entire classifier is trained on data we generate ourselves inside the build window, with plain accelerometer physics; nothing proprietary, no partner needed. **A partnership would be needed only for real deployment** (a BBMP or SWM-contractor pilot, municipal acceptance of the receipt as a billing artefact), which is honest to flag and out of scope for 48 hours.

---

## Selection logic

| # | Concept | RF parent | Sensor parent | Strongest asset |
|---|---|---|---|---|
| 1 | **GIRIH** | UWB | IMU | Unrepeatable demo — a physical 12 kg load swinging on a rig. The counterfactual is provable on stage in 20 seconds. |
| 2 | **NAALI** | UWB | Strain + IMU | Most distinctive; commodity parts replacing a ₹2.5 lakh inspection crawler; the underground-no-GNSS argument is genuinely non-obvious. |
| 3 | **GAMBHIR** | LoRa + UWB | Electrochemical gas + IMU | Strongest "why now" — olfactory paralysis is a fact no one in the room will know, and it converts a training problem into an instrumentation problem. |
| 4 | **JALDHARA** | LoRa | Pressure + Hall | Highest everyday Bengaluru resonance (cars underwater) and the only concept that produces *forecasts* rather than alarms. |
| 5 | **KACHRA** | NFC | IMU + strain | Biggest institutional gap and the most obvious equity win, but the least exotic hardware — deliberately placed at #5. |

**The two that most deserve the ₹1,00,000: GIRIH and NAALI.** In both, the RF layer is doing something an RF layer is normally *not* asked to do — GIRIH uses ranging to *localise* a mechanical risk so it can be predicted; NAALI uses it to *replace the stake numbering system* that makes buried pipe inspection unaffordable. Neither can be rebuilt with the other technology swapped out, which is precisely the fusion test this lens was asked to apply.