# Lens 2 — RF & Wireless × Sensing & Feedback

Five concepts where the RF tech and the sensor tech are each **physically unusable** without the other. No dashboards, no wrappers, no biology.

---

### 1. ARCSEAM — mmWave + PID
**TOP 2**

- **Integration:** 60 GHz FMCW mmWave radar (seam + puddle tracking) + PID closed-loop control (wire-feed + travel-speed trim)
- **The product:** A retrofit kit for GMAW/MIG welding cells that senses the arc and puddle through spatter, smoke and blackout, then closed-loops wire feed speed and travel speed to hold penetration and bead height in real time.
- **What existing product becomes better:** Automated/robotic arc welding. Today every "adaptive weld" cell is **vision-based** (Cognex, APTIV) — cameras get destroyed by spatter and blinded by arc glare, so real-world adaptive welding exists almost exclusively on low-heat GTAW. This converts GMAW (the highest-volume, most spattery process) into a closed-loop process for the first time.
- **Why BOTH are required:** Remove the radar and the only remaining sensor is optical — spatter occlusion and 20,000 K arc emission put it outside its operating envelope on exactly the jobs that need adaptive control. Remove the PID loop and you have a *measurement* of penetration and interpass temperature, but an open-loop torch still runs at the programmed parameters — the whole point of the product is that the controller moves the wire during the pass, which requires a continuous error signal at ≥50 Hz. Neither half is a product alone.
- **Bill of materials:** BGT60TR13C / IWR6843 FMCW radar module ₹4,500 · STM32G4 PID board with isolated DAC + watchdog ₹2,500 · Shunt + optocoupler-isolated current sensing (arc current = penetration proxy) ₹1,200 · Wire-feed actuator + trim potentiometer interface ₹2,000 · MIG torch, liner and feeder (shared rig asset) ₹12,000 · 24 V PSU, safety contactor, cabinet ₹6,000 · Cross-check camera (optional, for setup only) ₹4,000 · Enclosure, shielded cable, IPC, harness ₹9,000 · **Total demo BOM ≈ ₹41,200** (production ≈ ₹18,000–22,000 @1k units)
- **Venture case:**
  - **Who buys:** Tier-1 welding automation integrators and the welding cells inside auto, shipbuilding and pressure-pipe shops — they currently sell "robotic welding" and then burn their margin on weld-repair, rework and NCRs.
  - **Why:** Weld repair and distortion rework is 8–15 % of the cost of a welded assembly. Closing the loop on penetration is the cheapest available scrap reduction, and it is measurable on the customer's own scrap report within one shift.
  - **Moat:** The closed-loop tuning constants per wire/transfer mode are process IP that only exists after thousands of real welds — a data moat a camera vendor cannot jump without owning the actuator. Layered on: field-retrofit install base, and each new cell teaches the PID model.
  - **Survives 5 years:** Yes. Welding is a 300-year-old, non-software, extremely conservative market that is *slowly* automating; a retrofit product with a serviceable, non-disruptive install is the only form this market will accept.
- **Build time to demo:** 55 hours (two MIG passes on a 6 mm plate, one open-loop and one closed-loop, with logged wire-feed traces)

---

### 2. SEATBEAT — Wi-Fi sensing + IMU
**TOP 2**

- **Integration:** 802.11n/ac Wi-Fi CSI sensing (through-seat presence + respiration) + 6-axis IMU (per-seat micro-motion signature)
- **The product:** A seat-embedded sensor module that classifies rear-cabin occupants as *living child / adult / pet / empty / bag* from the RF alone — no camera, no pressure mat, no seat-occupancy mat.
- **What existing product becomes better:** In-cabin occupant detection (IDIS / UltraSense systems). The incumbents are either **pressure mats** (a 500 g grocery bag reads as a 9 kg adult) or **cameras** (privacy lawsuits, GDPR exposure, blocked by every OEM). Euro NCAP's roadmap makes rear-occupant/child-presence detection a scored, dated requirement, and pressure mats do not pass it.
- **Why BOTH are required:** Remove the IMU and CSI alone cannot tell a **live but motionless** rear passenger from a **wig-weighted child seat** or a heavy laptop bag — both produce the same quasi-static RF channel, and CSI alone will happily classify a bag as an occupant. The IMU supplies the micro-tremor signature (respiration and cardiac-induced seat-frame vibration at 0.5–4 Hz) that separates a breathing mass from dead weight. Remove the Wi-Fi and you are left with an IMU on a seat frame that **has no excitation** — you cannot measure what you are trying to sense, because the RF is what physically shakes the structure; the IMU is merely the readout of a vibration the radio induces.
- **Bill of materials:** 802.11n CSI MiniPCIe card (AR9271-class) + host SBC ₹6,000 · Secondary ESP32-S3 CSI anchor (angular diversity) ₹1,200 · BMI088 6-axis IMU on a flexure-mounted seat tap ₹900 · IMU + RF hub MCU with DSP firmware ₹1,500 · Seat-foam integration tooling and jig ₹3,000 · Enclosure, harness, connector ₹1,200 · **Total demo BOM ≈ ₹13,800** (production ≈ ₹3,200–4,000 @50k units)
- **Venture case:**
  - **Who buys:** Automotive Tier-1s and OEMs — as a content-per-vehicle line item to earn a Euro NCAP / ASEAN NCAP point, and as the ADAS fallback sensor for occupant classification.
  - **Why:** It is a regulatory score point, not a comfort feature. Score points are non-discretionary and OEMs will pay a premium for a solution that also removes the privacy liability of a cabin camera.
  - **Moat:** Tier-1 qualification is a 3–5 year gate (IATF 16949, PPAP, ASIL-B path) — once designed into a platform, the part is locked for 5–7 years of that vehicle's life. The classifier itself is commodity; the *certified dataset inside the customer's own vehicle fleet* is not.
  - **Survives 5 years:** Yes — a design-in per vehicle programme guarantees revenue well beyond five years, which is why Tier-1s fund this class of thing.
- **Build time to demo:** 40 hours (four labelled scenarios: adult, weighted child seat, laptop bag, empty; RF-only vs RF+IMU confusion matrix on screen)

---

### 3. TIPTRUE — UWB + force-torque
- **Integration:** UWB (independent tool-tip metrology, angle-of-arrival) + 6-axis strain-gauge force-torque sensor (contact-state truth)
- **The product:** A non-contact **verification** station for EV battery-pack and aircraft-harness connector insertion that independently proves the joint seated — correct tip position, correct axial force, correct no-rotation signature — instead of trusting the robot's own kinematics.
- **What existing product becomes better:** Force-guided insertion and insertion-QA cells. Today insertion verification is (a) robot-joint encoder replay, which is a self-report, or (b) a post-hoc pull test. Neither survives a real cell: a compliant harness mount, cable drag and thermal growth make robot TCP differ from tool TCP by millimetres.
- **Why BOTH are required:** Remove the UWB and the only position reference left is the robot's own forward kinematics — which means the QA station is auditing the robot with the robot's own numbers, exactly the blind spot it exists to catch; in a metal-dense battery pack, optical cameras additionally cannot see the mating face at all. Remove the F/T sensor and UWB gives you a **hovering** tool 3 mm from a fully-seated connector, perfectly seamed connector and a connector that is 1 mm proud read identically in position — you cannot distinguish seated from not-seated without contact force, and seating is a force-defined event, not a position-defined one.
- **Bill of materials:** DWM3000-class UWB module + 2 AoA anchors (bearing tags) ₹14,000 · Custom 6-axis strain-gauge F/T head (8 gauges, 350 Ω foil) ₹11,000 · Signal-conditioning breakout + isolation ₹3,000 · Industrial SBC, storage, isolated I/O ₹12,000 · Safety relay + PLC handshake for cell integration ₹6,000 · Fixture, shielded harness, guarding ₹8,000 · **Total demo BOM ≈ ₹54,000** (production head ≈ ₹28,000–34,000 with a bought F/T at volume)
- **Venture case:**
  - **Who buys:** EV battery-pack and e-axle assemblers, e-harness/connector makers, and Tier-1 harness integrators — whose warranty cost is driven by high-resistance joints from unseated pins.
  - **Why:** One undetected unseated HV connector is a thermal-event recall, not a scrap part. The station's value is insurance, priced against the customer's recall exposure, not against its BOM.
  - **Moat:** The force-signature library per connector family (seated vs proud vs skewed vs partially latched) is the asset; it grows with every station installed and is impossible to synthesise without physical connectors. Calibration fixtures and customer sign-off are slow to replicate.
  - **Survives 5 years:** Reasonably — EV platforms are refreshed faster than 5 years, so the moat has to be cross-platform. The signature library plus the metrology-integrity argument (independent, non-self-reporting) is what carries across platforms.
- **Build time to demo:** 60 hours (four fault injections: seated, 1 mm proud, 2° skewed, partially latched; UWB-only vs UWB+F/T verdict table)

---

### 4. SYNCLINE — GNSS 1PPS + strain gauge
- **Integration:** GNSS disciplined 1 PPS timing reference + bridge strain gauges (dynamic structural strain)
- **The product:** A wireless, wire-free node that measures **time-synchronised dynamic strain** across a structure — bridges, rail track, crane jibs, wind-turbine blades — so modal parameters (natural frequency, damping, mode shapes) can be extracted continuously without laying fibre.
- **What existing product becomes better:** Structural health monitoring. The incumbent is **fibre Bragg grating with fibre daisy-chained from a central interrogator** — which means kilometres of cable, trenching, and a fixed instrument budget that puts monitoring only on prestige assets.
- **Why BOTH are required:** Remove the GNSS and you lose the **common timebase**, and synchronous dynamic strain is unobtainable: unsynchronised nodes let you see static deflection and low-frequency wander, but you cannot compute a cross-correlation phase relationship between nodes, which is the entire mechanism of modal analysis — you'd have to fall back to fibre, which is the thing being displaced. Remove the strain gauge and the GNSS is only a clock; it measures nothing about the asset. Neither is a product alone — one is the instrument's timebase, the other is its transducer.
- **Bill of materials:** ZED-F9P-class GNSS module with 1 PPS + disciplined TCXO ₹6,500 · 350 Ω foil strain gauge + ADS1232 bridge ADC ₹750 · LoRa SX1262 radio + antenna ₹1,400 · Solar-harvest + LiFePO₂ battery pack ₹2,500 · MCU with timestamped-sample interrupt chain ₹600 · IP67 enclosure, strain-gauge adhesive/pad, mounting hardware ₹1,800 · **Total demo BOM ≈ ₹13,550** (production ≈ ₹9,000–10,500 @500 units)
- **Venture case:**
  - **Who buys:** Railways and highway authorities, port crane operators, and insurers underwriting large structures — where a structural failure is existential but a wired fibre rollout is uneconomic on secondary assets.
  - **Why:** Insurance and asset-finance premiums reprice on objective, continuously-verified structural health. Wireless + wireless-timebase is the only way to reach the long tail of structures that fibre cannot economically serve.
  - **Moat:** GNSS PPS disciplined to <1 µs across a wireless node, at 10 kHz, in an industrial RF environment, is a genuinely hard engineering barrier; plus each installed structure is a multi-year data stream of real modal behaviour that becomes the reference model for the next structure.
  - **Survives 5 years:** Yes, if the reference design wins one railway or highway framework contract — public infrastructure frameworks are multi-year and spec-listed, which is the strongest possible incumbency protection.
- **Build time to demo:** 35 hours (cantilever bench with a shaker, three wireless nodes, 1 µs cross-correlation, mode-1 frequency extracted live)

---

### 5. WEIGHPOINT — chipless UHF RFID + load cell
- **Integration:** Chipless (passive, no-IC) UHF RFID resonator whose backscatter is modulated by a strain-gauge-loaded flexure
- **The product:** A battery-free, electronics-free load point — a hanging tag that reports **tonnes** to a handheld RFID reader at 10 m, and survives 10 years outdoors with no maintenance.
- **What existing product becomes better:** Heavy-equipment monitoring: silo/bin fill level, truck tare and gross weight, rooftop HVAC plant verification, shipping-container loaded weight. Today every one of these is a wired load cell, a battery load cell replaced every 2–3 years, or a fixed gantry weigher.
- **Why BOTH are required:** Remove the RFID and the strain-gauge flexure has **no way to be read** — it produces millivolts, needs excitation, needs a digitiser, and needs a battery, which is exactly the ₹4,000 battery-replacement treadmill that kills maintenance-based weight monitoring. Remove the strain gauge and the RFID is a passive identity tag that reports nothing but its own ID — a serial number, not a measurement. Here the RF is simultaneously the power source, the excitation and the readout: **there is no version of this product where either component is optional.**
- **Bill of materials:** Chipless dual-resonator (I/Q) RFID PCB, 915 MHz substrate, custom layout ₹350 · 120 Ω strain gauge bonded to a machined/PCB flexure beam ₹600 · Flexure beam machining or FPC flexure ₹500 · Protective overmould + stainless hanging eye + weather seal ₹700 · Calibration jig and RF-reader development unit ₹18,000 (one-time tool) · **Total demo BOM ≈ ₹20,150** (production tag ≈ ₹900–1,400 @5k units)
- **Venture case:**
  - **Who buys:** Cement, grain and chemical silo operators; port and weighbridge operators; facility-management firms verifying rooftop plant weights; insurers and municipal inspectors.
  - **Why:** It replaces a maintenance contract. A battery load cell costs ₹4,000–9,000 every two years in cell + labour; a 10-year passive tag costs ₹1,400 once. The pitch is a maintenance line-item deletion, not a new capability.
  - **Moat:** Chipless resonant antenna design + the calibration transfer function from backscatter shift to tonnes is the know-how, and it is defensible through the calibration jig and the reader firmware lock-in; plus legal-for-trade certification, if pursued, is a real but expensive barrier.
  - **Survives 5 years:** The technology comfortably survives; the risk is **price**, not obsolescence. It has to win on total cost of ownership in a market with brutal price competition, so it needs a segment where a maintenance line item is genuinely painful — silo inventory reconciliation and weighbridge legal-for-trade are the two.
- **Build time to demo:** 22 hours (flexure rig, bucket of known weight stepped in 5 kg increments, reader plots shift-vs-load; then a 30-day outdoor soak showing zero drift)

---

## Ranking rationale

| # | Concept | Why ranked here |
|---|---|---|
| 1 | ARCSEAM | Only one that opens a process category currently closed by a hard physical limit (arc glare destroys cameras). Largest addressable spend, best ACV, real actuator lock-in. Slowest sales cycle. |
| 2 | SEATBEAT | Regulatory pull rather than technology push; the date is external and the design-in is 5–7 years per platform. Smallest BOM, best volume. |
| 3 | TIPTRUE | Strong technical necessity, but the self-report-vs-independent-metrology argument is a harder sell to a plant manager than to an engineer. |
| 4 | SYNCLINE | Durably defensible if it wins one framework spec; limited to infrastructure budgets and long tender cycles. |
| 5 | WEIGHPOINT | Best demo-to-product ratio, worst margin structure. A strong technical artifact, a commodity business. |
