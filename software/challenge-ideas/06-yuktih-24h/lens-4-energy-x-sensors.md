# Lens 4 — Energy & Power × Sensing & Feedback

**Event:** Yuktih — Innovate Today, Sustain Tomorrow (24h, 2–4 pax, ₹1,500 entry, ₹10,000 / ₹7,500 / ₹5,000)
**Tech A (must be load-bearing):** PV (silicon/perovskite), thermoelectrics (TEG), supercapacitors, Li-ion/LFP, fuel cells, kinetic/vibration harvesting, phase-change materials (PCM), heat pumps, thermal storage, energy-harvesting ICs (BQ25570-class, LTC/NFC tag harvesters, PMIC).
**Tech B (must be load-bearing):** encoders, limit/Hall switches, force-torque, IMU/accel/gyro, load cells, slip detection, tactile arrays, strain gauges, gas/CO₂/ToF/ultrasonic, PID closed-loop control.

**Rejection rule applied:** every concept below fails the counterfactual test — remove the sensor or remove the energy path and the product does not function. No dashboards, no SaaS, no cloud, no app.

---

### 1. TEGARD — Thermoelectric Gutters that Only Wake When Cold
**TOP 2**

- **Integration:** Bismuth-telluride TEG array bonded to aluminium heat-sink fins + LTO (Li-thionyl) battery pack + **TMP107/TMP117 die temp sensors + a cascaded PID loop** switching TEG segments between open-circuit (measuring ΔT) and loaded (charging) states.
- **The product:** A rain-gutter-integrated cold-fin thermal harvester that charges a sensor-and-RTC battery pack only when the metal is actually cold, and shuts down to protect device life when it isn't.
- **Why BOTH are required:** A TEG without sensing is a resistor bolted to a gutter. A TEG only produces power proportional to ΔT — but its *input impedance is low, so shorting it when ΔT is small destroys efficiency, and leaving it loaded when ΔT collapses to ~0 K (no sun, no rain) drains the battery into a dead Li cell.* The TMP117 pair reads both faces, a PID loop continuously reconfigures the series/parallel topology of the TEG string (4S → 2S1P → open) against a measured V-oc. Strip the sensor and the harvester slowly destroys its own storage over ~200 charge cycles. Strip the TEG and you have a very expensive temperature logger.
- **Sustainability claim:** **Measurable:** harvested energy per cold-night (Wh) and **cumulative battery capacity retained after N charge cycles (%).** The demo shows a fixed 500-cycle accelerated charge run on both a fixed-duty harvester and the PID version, charting retained capacity on the two LTO cells. Concrete claim: *fixed-duty loses >30% capacity by cycle 500; adaptive holds >90%* — because cold-start idle self-discharge was the killer, and the loop stops drawing below a measured terminal-voltage floor. Also publish Wh/°C-day so it's a real engineering number, not a vibe.
- **Bill of materials (2 pax build, per unit):**
  | Item | ₹ |
  |---|---|
  | TEG modules (40×40 mm, ~1.2 W each, 8 off, AliExpress) | 1,600 |
  | Aluminium fin heatsink + gutter clip bracket (local fab, laser-cut acrylic shroud) | 400 |
  | TMP117 breakout ×2 (SparkFun) | 900 |
  | LTO 3.6 V 2.4 Ah cell (Thundersky) + protected boost charger (IP5306 / BQ24074) | 850 |
  | SS34 diode ring + 100 µF/low-ESR + 1 MΩ bleed | 150 |
  | ESP32-C3 dev board (data logging + BLE readout, *not* cloud) | 450 |
  | MOSFET load-switch board + 0.1 Ω shunt (current-sense for the energy ledger) | 350 |
  | INA219 current sensor (energy metering, the "ledger") | 300 |
  | Wires, perfboard, XT60, heat-paste, Kapton, acrylic, fasteners | 600 |
  | **Total** | **₹5,600** |
- **24-hour build plan:**
  - **Night 1 (0–6 h):** TEG mechanical. Bond modules to fin array with thermal paste + clamp (not glue — glue insulates), crimp the string, prove ΔT with an ice-cube-in-a-bucket rig and a multimeter. Log V-oc per configuration. **Cut list if behind:** drop to 4 TEGs and 1 temp sensor; the topology demo still works.
  - **Night 2 (6–12 h):** The control board. TMP117 read → PID over MOSFET load switch → three TEG topologies. Scope the duty cycle. Cut: replace PID library with a hand-rolled threshold+state-machine (2 h saved) — still sensor-load-bearing, slightly less elegant.
  - **Night 3 (12–18 h):** Energy ledger + storage. INA219 → ESP32 logs to SD card, LTO charge/discharge rig, begin the accelerated-cycle bench.
  - **Night 4 (18–24 h):** Gutter mock-up (two half-gutters, one fixed-duty one PID-controlled, identical ambient). Run overnight = 6 h real data. Pre-load the 500-cycle chart from the accelerated run. Write the numbers on a printed board. **Cut:** the accelerated 500-cycle claim gets replaced by a 50-cycle extrapolation clearly labelled as such.
- **Why it wins here:** It is the only concept where the *sensor is literally the reason the energy budget closes* — the judging criterion the brief names — and the 6-hour overnight head-to-head gives real, unfakeable data on the morning.

---

### 2. HALF-PULL — Self-Powered Hand-Pump Controller for Community Water
**TOP 2**

- **Integration:** Hand-pump linear motion converted by a **voice-coil/damper generator** (or PMDC micro-turbine on a hydraulic vane) charging a **supercapacitor + LFP buffer** through a **BQ25570-class energy-harvesting PMIC**, with **Hall-effect limit switches on the pump handle's end-stops and a 6-DOF IMU reading handle velocity** to gate energy capture.
- **The product:** A retro-fit lever module on an existing village hand pump that captures the otherwise-wasted oscillation energy of each stroke and powers a village LED light + water-quality sensor head, with the electronics asleep (nW) except during a stroke.
- **Why BOTH are required:** A human pumping water *is* an energy source (a 20 kg × 0.4 m stroke ≈ 78 J per pull, orders of magnitude more than any ambient harvester) — but it's also an *unpredictable, mechanical-stress* source that will fatigue the pump linkage if you freewheel it. The **Hall switch + IMU** tell the controller the precise stroke phase (pull velocity, end-stop crossing, dwell) so the MPPT-equivalent rectifier only latches energy during the low-force recovery phase and shorts nothing at the dead-stop. Remove the sensing and the generator back-drags the handle, making the pump measurably *harder* to operate (measurable with a load cell — the demo's killer graph: pumping effort J/stroke, fixed vs. gated). Remove the generator and you have an ordinary pump with an accelerometer glued on it.
- **Sustainability claim:** **Measurable:** (a) **J/stroke of human effort** — prove the smart controller *increases* pumping efficiency by ≥10% over the stock pump rather than degrading it; (b) **hours of LED autonomy per 100 strokes** at defined lux; (c) **pump-linkage fatigue delta.** Sustainability here is literally "human labour per litre of water" — the most defensible sustainability metric in the whole event.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | 24 V PMDC micro-turbine + gearbox (surplus, or 12 V one + belt) | 1,200 |
  | Flyback/rectifier + 10 F supercap bank + protection | 700 |
  | 2S LiFePO4 18650 (3000 mAh) + BQ25574 charger | 900 |
  | BQ25570 energy-harvesting boost PMIC breakout | 650 |
  | Hall effect limit switches ×2 + magnet set (for end-stop) | 200 |
  | MPU-6050 / MPU-9250 IMU breakout | 350 |
  | HX711 load cell (1 kg S-beam) + 2 kg bucket — the effort meter | 450 |
  | 3 W LED head + 12 V panel (optional) | 600 |
  | 6061 aluminium lever housing, coupler to standard India Mark II handle, hardware | 800 |
  | ESP32-C3 + microSD logger | 450 |
  | Wiring, crimps, epoxy, machining stock, fasteners | 700 |
  | **Total** | **₹7,000** |
- **24-hour build plan:**
  - **Night 1 (0–7 h):** Rig a hand pump on a plywood jig. Measure baseline effort with the load cell (this is the control datum and must be honest). Splice the generator to the pump shaft with a belt + coupler. Cut: skip the gearbox, direct-belt a 24 V turbine; slightly lower voltage, far faster.
  - **Night 2 (7–13 h):** Storage chain: turbine → rectifier → supercap → LFP. Get energy in. **Cut if behind:** drop the BQ25570 and use a plain boost converter — loses the "energy-harvesting IC" name but keeps all physics. Accept the 1-hour risk.
  - **Night 3 (13–19 h):** The gating logic. Hall + IMU state machine, 6 h of logging effort-vs-stroke with the gate ON and OFF, alternating trials so the comparison is statistically fair. This is the money data.
  - **Night 4 (19–24 h):** LED + autonomy demo, 100-stroke endurance run, poster with the J/stroke chart, mount the rig so judges can pump it themselves. **Cut:** the water-quality sensor head (it was always garnish) and the 12 V solar panel.
- **Why it wins here:** Judges physically lift the handle. The sensor is unambiguously load-bearing because without it the *user's arm pays the tax* — a counterfactual the judge can feel in five seconds.

---

### 3. PHASEWALL — PCM Thermal Battery with Occupancy-Scheduled Discharge
**Integration:** Form-stable paraffin PCM (n-eicosane, 60 °C) in a copper-foam-embedded aluminium can + copper coil heat exchanger + LFP buffer, discharged only into a useful load, gated by a **gas/CO₂ sensor (SCD-30/MH-Z19) plus a cheap thermistor array**, driven by a **PID schedule**.
- **The product:** A wall-plug thermal storage brick for a small room that holds cooling for 4 hours after a 2-hour charge, and only melts its charge when the room's CO₂/heat signature says somebody is home and it will actually be absorbed.
- **Why BOTH are required:** PCM's entire value proposition is *latent heat at a set point* — but a wall of PCM slowly conducts into the room and dumps its charge into nothing. The CO₂ + thermal sensor closes the loop: discharge is actively promoted to the load when the room can absorb it, and *held* when the room is already warm or empty. That's a genuine control problem with a genuine energy payoff, and the payback number is measurable in wall-clock minutes.
- **Sustainability claim:** **Measurable:** peak cooling power delivered per PCM charge (W), and **charge retained when the room is unattended (%)** — demo one PCM block on free-discharge, one PID-gated, overnight, with two thermocouples in the "room."
- **Bill of materials:** PCM n-eicosane 1 kg (₹700) + copper foam + 2 mm copper sheet (₹900) + brazed coil / TIG or epoxy-gasket coil (₹600) + LFP 2S + BMS (₹800) + SCD-30 (₹750) + MAX31855 K-type amp (₹400) + ESP32 + SSR + heatsink (₹1,000) + 4 K-type thermocouples (₹400) + insulation, foam, container, fasteners (₹900) + 80 W Peltier or resistive charge source (₹1,500) + misc (₹500) = **₹8,450.**
- **24-hour build plan:**
  - Night 1: PCM pot, coil, insulation can, charge source, first melt curve with 4 thermocouples on the MAX31855. Cut: drop to 2 thermocouples.
  - Night 2: discharge chain + SSR + LFP buffer. Cut: drop LFP, run directly off the Peltier during the demo (weakens the "battery" story — flag it).
  - Night 3: CO₂ gating logic + the SCD-30 calibration dance (these sensors drift and need burn-in — **do this early**, it's the #1 schedule killer).
  - Night 4: A/B overnight run, poster, sealed-can demo (a leaking molten-paraffin demo is a fire/cleanup risk). Cut: the wall form factor — present as a bench block, not a wall unit.
- **Why it wins here:** The most visual demo (a solid block you can touch, then a puddle you can feel), but the sensor duty is the weakest of the three and the SCD-30 is a schedule risk.

---

### 4. CRYONOSE — Harvest-and-Store Cold Chain Sentinel
**Integration:** Thin-film amorphous-silicon flexible PV on an insulated parcel wall + supercapacitor + coin LTO, with a **ToF (VL53L1X) + temperature/RH** head at the parcel lid running a duty-cycled wake/sleep on a **PID-tuned cold-chain forecast.**
- **The product:** A passive parcel insert that harvests ambient/room light to run a temperature logger + ToF tamper/arrival detector for 30 days, and only wakes the radio hourly.
- **Why BOTH are required:** Amorphous PV under a warehouse's terrible lighting produces too little to power a radio continuously. The **ToF** detects the parcel being opened or a pallet moving (a real event, not a guess) and wakes the sensor instantly; the PID loop then decides how much of the harvested energy goes to logging versus radio versus staying dark. Remove the sensor and the radio never wakes on the event that matters — you have a paperweight. Remove the PV and it's a normal data logger, i.e. the incumbent product, and we've invented nothing.
- **Sustainability claim:** **Measurable:** days of autonomy per lumen-hour, and radio duty-cycle percentage — plus a hard number the judges like: **shipped-vessel CO₂e avoided**, computed from measured logger uptime vs. the disposable dry-ice/dry-block equivalent.
- **Bill of materials:** Flexible a-Si PV 100×60 mm (₹400) + boost + supercap (₹500) + LTO coin cell (₹350) + VL53L1X (₹700) + SHT45 temp/RH (₹400) + ESP32-C3 + antenna (₹450) + EPS insulation block + acrylic window (₹800) + 3D-printed/acrylic shell (₹700) + solar-simulator lamp for the bench test (₹1,200) + misc (₹450) = **₹5,950.**
- **24-hour build plan:**
  - Night 1: PV + boost + supercap, measure harvested power at three light levels (LED-lab, office, "warehouse" = darkened room with one strip light). Cut: drop to one light condition, one supercap.
  - Night 2: energy budget math in a spreadsheet → pick duty cycle; wire ESP32 deep-sleep, measure real sleep current with the supercap sagging.
  - Night 3: ToF head, event-triggered wake, OLED or LED readout.
  - Night 4: 24 h endurance run under bench light, autonomy extrapolation, poster. Cut: the RF radio entirely — a USB-serial logger with a screen reads honestly and the energy argument is unchanged.
- **Why it wins here:** Cleanest "energy budget closes because of the sensor" story after TEGARD, and the cheapest BOM — but the ambient PV numbers look unimpressive on a poster and the whole thing risks reading as "a fancier data logger."

---

### 5. STRAINHARV — Footfall-Powered Stairway Health Monitor
**Integration:** Stack of **PZT-5H piezo bimorph "energy harvester tiles"** under a stair tread + full-wave bridge + supercapacitor bank, gated by a **strain-gauge load-cell pair** that also *measures* the footfall force.
- **The product:** Stair treads that count footfalls, classify them as overloaded / normal / elderly-assisted, and harvest a few milliwatts per step to run the classifier with no wiring.
- **Why BOTH are required:** The piezo tile's output is a single spike per step — impossible to store usefully *and* impossible to classify without knowing the impact force, which is exactly what the strain gauge reports. The load cell **doubles as the energy-management signal**: only latch the spike when the force profile shows a real human loading rather than the building's thermal/ambient micro-vibration (which is what makes naive piezo harvesters read garbage forever). Remove the strain gauge and the output is a meaningless click counter; remove the piezo and you have a load-cell stair counter, i.e. the cheap existing product.
- **Sustainability claim:** **Measurable:** joules harvested per 10,000 footsteps, classifier accuracy vs. a hand-labelled ground truth (≥95% target), and false-positive rate from ambient vibration over 24 h. Also: no wiring over a 2-floor staircase = no retrofit embodied carbon, which you can state in one line.
- **Bill of materials:** PZT-5H bimorph patches ×6 (₹1,200) + bridge rectifiers + SS34 (₹250) + 2 F supercap ×4 (₹500) + HX711 + 5 kg load cells ×2 + S-beam mounts (₹900) + ESP32-C3 (₹450) + step tread acrylic/ply rig (₹700) + accelerometer for the false-positive study (₹350) + LEDs + display (₹300) + misc (₹500) = **₹5,150.**
- **24-hour build plan:**
  - Night 1: piezos bonded to a tread rig, bridge rect, scope the spikes, hand-load the rig. Cut: 6 → 3 piezo patches.
  - Night 2: supercap bank sizing, ESP32 deep-sleep, get a step logged end-to-end.
  - Night 3: the classifier — this is the risky part. Threshold + simple features (peak force, rise time, step interval) beat anything fancy in 24 h. Cut: 3 features → 1 (peak force) if the timeline slips.
  - Night 4: 1,000-step endurance run, ambient-vibration false-positive study overnight, poster. Cut: drop the energy-harvesting *claim* to a measured side-note and lead entirely with the health classifier — still a real product, honestly framed.
- **Why it wins here:** Cheapest BOM and the most human demo (people will stair-climb it), but a milliwatt-scale harvest is a weak headline number and the classifier can fall into "just a threshold" territory if the timeline tightens.

---

## Ranking logic

| # | Concept | Sensor truly load-bearing? | Measurable sustainability number | 24-h risk |
|---|---|---|---|---|
| 1 | **TEGARD** | Yes — without it the harvester eats its own battery | Charge-retention % vs. cycles | Low |
| 2 | **HALF-PULL** | Yes — without it the *user* pays in joules | J/stroke human effort | Medium |
| 3 | **PHASEWALL** | Yes, but softer duty | Charge retained when unattended | High (CO₂ sensor burn-in) |
| 4 | **CRYONOSE** | Yes — event-triggered wake is the whole budget | Days autonomy / radio duty cycle | Low |
| 5 | **STRAINHARV** | Yes — force gates the latch | J/10k steps + classifier accuracy | Medium (classifier) |

**Recommend building TEGARD with HALF-PULL as the backup.** If the team stalls on thermal bonding (the single most likely 24-h killer), pivot the thermal-bonding progress into HALF-PULL's mechanical rig — both reward "we physically built the energy path and measured it."