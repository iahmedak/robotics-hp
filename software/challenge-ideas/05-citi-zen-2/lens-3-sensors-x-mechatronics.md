# Lens 3 — SENSING & FEEDBACK × MECHATRONICS & ACTUATION

**Tech pair (both load-bearing):**
- **A — Sensing & Feedback:** encoders, limit/hall switches, F/T sensors, IMU/accel/gyro, load cells, slip detection, tactile arrays, strain gauges, gas/CO₂/ToF/ultrasonic sensors, PID closed-loop control
- **B — Mechatronics & Actuation:** servo/stepper/BLDC motors, servomechanisms, pneumatics, hydraulics, linear actuators, 3D printing, CNC, robot arms, delta robots, gantries, linkages, compliant mechanisms

**Counterfactual rule applied to every concept:** remove A and the mechanism runs open-loop into a known failure. Remove B and there is no delivered physical effect — only measurement. If a concept survives either removal it is decorative and was rejected.

**Deliberate award targeting:** Concepts 1 and 3 are engineered to win **Best Sustainable Infrastructure Innovation** by name. Concept 4 targets **Best Nature Based Solution**. Concepts 2 and 5 carry **Impact Award** and **Best School Innovation** angles respectively. Concept 2 is a **Build-wize** entry; Concepts 1, 3, 4 are **Nature-based Bengaluru** entries.

---

### 1. TILTA-DRUM Sludge Dewatering Screw Press  **TOP 2**

- **Integration:** Bosch REA 35-series magnetic **encoders on the screw drive + load-cell strain-gauge bed** (senses how much cake is actually being squeezed and how torque is climbing) driving a **Parker/Chandler direct-drive servo + pneumatic stroke cylinder with a compliant torque-limiting slip coupling** that reverses and re-plates the press.
- **The product:** A low-cost dewatering screw press for Bengaluru septic-tankers and lake-silt operations that auto-adjusts its own squeezing force from what the load cells actually feel, rather than a fixed motor current that stalls and burns out.
- **Which track / which special award it targets:** **Nature-based Bengaluru** track · explicitly targets **Best Sustainable Infrastructure Innovation** (₹4,000).
- **Why BOTH are required:** Remove A (load cells + encoders) and the unit is a fixed-RPM screw that stalls the instant a wetter sludge batch arrives — the exact failure that makes existing presses useless in the field. The feedback loop is what converts "run it and hope" into stall-free operation. Remove B (servo + compliant coupling) and you have a load-cell box wired to nothing — measurement with no delivered dewatering. The sensor determines the actuator's force curve; that is the product.
- **Bill of materials:**
  - 3-phase 1 HP BLDC servo motor with servo drive (Nidec/Delta) — ₹9,500
  - 120 mm helical-welding flight auger, 3D-printed split housing (PLA-CF 3-roll flexure for easy field disassembly) — ₹4,200
  - 4× 5 kg sealed load cells + HX711 ADC + Arduino Nano-class MCU — ₹1,300
  - 2× optical encoders + slip-clutch spring set (laser-cut MS, 2 mm) — ₹1,900
  - 60/40 pneumatic cylinder + 5 L compressor + FRL unit — ₹4,800
  - Galvanised 55-gal-per-chassis frame + perforated drain pan with 80-mesh cloth — ₹7,500
  - Gate valve + bypass piping (2" UPVC) — ₹1,800
  - Wiring, IP65 enclosure, connectors, fasteners — ₹1,500
  **≈ ₹32,500** build cost (vs. ₹2.5–6 lakh for a commercial volute press)
- **Build time:** 32–40 hours
- **Measurable impact claim:** **20 kg sludge cake at 70% vs 80% moisture in under 25 minutes**, **≥ 40 minutes stall-free continuous runtime** on a controlled mixed batch, and **25–30 litres of drain water recovered per cycle** — verifiable with a stopwatch, a load scale, and a graduated bucket, with stall rate compared against a fixed-RPM control run on the identical sludge batch.

---

### 2. AEROLITH Damp-Proof Awning Extruder  **TOP 2**

- **Integration:** NEMA-17 **steppers with magnetic encoders on both screw axes + an inductive load cell on the filament breakaway** driving a **dual-screw co-extruder built from 3D-printed PLA-CF platens + an aluminium tension-arm linkage that trips the breaker within one rotation**.
- **The product:** A benchtop extruder that, when its load cell senses the rising resistance of clay entering the molten zone, automatically lifts the breaker and clears the jam and re-purges — so a 5–8-person school team recycles broken terracotta planters and broken bricks into 2 kg spools of PLA-CF for FDM printing instead of buying virgin filament.
- **Which track / which special award it targets:** **Build-wize** track · explicitly targets **Impact Award** (₹4,000) via its per-school material-recovery economics, with **Best School Innovation** as the secondary hook.
- **Why BOTH are required:** Remove A (load cell + encoders) and the auger keeps grinding clay into the barrel until the stepper stalls and shears — the exact failure every school-built extruder hits on first contamination, and there is no field-recoverable path around it. Remove B (the tension-arm linkage + strain-gauged trip) and you have a torque sensor watching an auger with no mechanism to unload the jam, so the loop never terminates. The actuator's mechanical trip length is *set by the sensor reading* — that coupling is the mechanism.
- **Bill of materials:**
  - 2× NEMA-17 steppers + TMC2209 drivers — ₹2,400
  - 2× magnetic encoders + INA219 load cell + ADS1115 16-bit ADC — ₹1,700
  - 16 mm 1.5-turn steel screw pair + brass heat-break + 750 W cartridge heater + PTC 100 °C + silicone sock + worm-drive gearmotor — ₹8,800
  - PLA-CF platens and frame plates (PLA-CF, printed) + 10 mm acrylic safety panels — ₹4,100
  - MS/aluminium tension arms, one-way dog clutch, torsion spring — ₹2,300
  - Load cell + relay + 24 V 10 A PSU — ₹1,800
  - Extruder nozzle set, PTFE tube, and **400 g batch feeder hopper (2 mm PETG wall)** — ₹2,900
  **≈ ₹24,000** build cost, and ~₹0 material cost per kg of terracotta feedstock
- **Build time:** 20–26 hours
- **Measurable impact claim:** **1 kg of broken terracotta/brick recovered into spools in ~40 minutes**, **3 successful jam-and-recover cycles on contaminated feedstock** without disassembly (measured by the trip counter), and **₹40–60 per-kg filament cost avoided per school** versus market PLA-CF — verifiable by weighing input/output on a kitchen scale and reading the trip log.

---

### 3. BHASINI Self-Priming Rain-Snow Main

- **Integration:** Fused **ToF + VL53L1X ToF + HC-SR04 ultrasonic + a rain/immersion reed switch** driving a **24 V peristaltic pump servo-valve assembly — a modified bicycle dynamo hub motor rewound into a DC micro-turbine pump, with a 3D-printed PLA-CF centrifugal volute and a servo-actuated inlet flap**.
- **The product:** A ₹2,500 kerbside water self-priming main that, with the inlet flap servo actively breaking the air lock, lifts a column of clean water from a 1 m sump up to a rooftop tank or a groundwater recharge pit — no electricity, no fixed priming foot-valve.
- **Which track / which special award it targets:** **Nature-based Bengaluru** track · explicitly targets **Best Sustainable Infrastructure Innovation** (₹4,000), aimed at the city's groundwater-recharge mandate. (A rooftop harvesting tank is not a nature-based solution; the *discharge destination is a recharge pit or percolation well*, which makes it one.)
- **Why BOTH are required:** Remove A (ToF + ultrasonic + reed) and the pump is either dead-headed (bursts in seconds on a 1 m static head) or instantly air-locks again on the next cycle — this failure *is* the ToF/ultrasonic gate's job to catch. Remove B (the servo-actuated inlet flap that momentarily dips below the waterline to break the air lock) and you have a working level sensor wired to a pump that will still never prime, because priming is a *geometric* problem solved by moving a flap, not by measuring. The measurement decides *when*; the linkage makes it *possible*.
- **Bill of materials:**
  - 24 V 250 W high-speed DC motor (dynamo-style, laser-cut MS housing) + MOSFET PWM driver + buck converter — ₹2,600
  - PLA-CF 3D-printed centrifugal volute + diffuser (0.75 mm radial layer lines for the wet seal) — ₹1,900
  - SG90 servo + 3D-printed lever arm + micro rod for the inlet flap — ₹450
  - 10 mm PPR pipe + NRPT coupler + brass gate valve + foot valve + 60 L sump liner — ₹1,100
  - VL53L1X ToF + HC-SR04 ultrasonic + IP67 reed float switch + ESP32-C3 + 12 V 5 Ah SLA battery + TP4056 solar-charge controller — ₹2,900
  - 10 W mono panel + silicone wire + MC4 + IP65 junction box — ₹2,200
  **≈ ₹11,150** build cost, entirely off-grid
- **Build time:** 18–24 hours
- **Measurable impact claim:** **0.5–1.0 L/s sustained delivery across a 1.0 m vertical lift and 15 m of pipe run with no prime cycle and no foot-valve**, **≥ 15 priming operations over 15 consecutive dry cycles with zero user intervention**, and **each unit supplies ~500–600 L/day of harvested water** — verifiable with a graduated bucket and stopwatch on the discharge, plus a boot counter reading 15 of 15.

---

### 4. TILAK Leaf-Wetting-Robot (Leaf-Classifier Actuator)

- **Integration:** 30 mm capacitive **ToF sensor + IMU (ICM-42688 accel/gyro)** driving a **servo-driven compliant leaf clamp on a hand-held sensor wand** that rolls onto the lamina and holds it flat and level until the ToF reads a settled canopy.
- **The product:** A 4-minute measurement protocol — a hand-held wand whose servo gently grips, flattens and steadies one leaf while the ToF and IMU read surface roughness and leaf-angle variation from the tripod at eye level. The numbers come out of a plot, not out of a notebook. It measures; it does not count species.
- **Which track / which specific award it targets:** **Nature-based Bengaluru** track · explicitly targets **Best Nature Based Solution** (₹4,000), using wet-canopy measurement as a verifiable field proxy for ecosystem service delivery.
- **Why BOTH are required:** Remove A (ToF + IMU) and the unit is a hand grip — the operator's own unstable wrist supplies the tremor, so the roughness data is uninterpretable and the surface must be held dead still. Remove B (the servo clamp with its compliant leaf-conforming pad) and you have two good sensors producing numbers the geometry of a natural leaf always corrupts. The wand cannot be positioned on a curved wet leaf without a mechanism that actively levels and dampens the sample; the sensors cannot produce a clean number without that mechanism. The servo also drives the read-validity flag: the IMU gates the ToF sample.
- **Bill of materials:**
  - ESP32-C3-CAM (bundles the Wi-Fi needed for later build-wize dashboards) — ₹650
  - VL53L1X ToF sensor + ICM-42688-P IMU breakout boards — ₹900
  - MG996R servo + 3D-printed PLA-CF articulated arm, pivot and compliant pad — ₹1,150
  - 18650 Li-ion + charger + buck boost module — ₹550
  - Laser-cut MS handle bar with grip tape — ₹500
  - Cast acrylic calibration block + 100 mm precision scale target (jig + reference ground-truth) — ₹350
  **≈ ₹4,100** build cost (well inside a 2–5 member student budget)
- **Build time:** 12–16 hours
- **Measurable impact claim:** **Leaf-surface roughness and leaf-angle variation captured in 4 minutes per plot** (target ≤ 5 min) with **hand-position repeatability of ±0.5 mm leaf contact**, verifiable against the calibration block with a stopwatch on the UI and a repeatability spread across three operators on the same leaf.

---

### 5. CADAVER-PROOF Subterranean Cooler for Slum Pantries

- **Integration:** A hermetically sealed **DS18B20 probe + a mechanical analogue **dew-triggered bimetal** wired to a **3-axle **miniature 3D-printed SLA slider-crank linkage driving a spring-loaded damper blade** in the vent stack.
- **The product:** A fridge-free cold box for 5 kg of vegetables in a Bengaluru slum unit without a grid connection: double-wall cavity filled with phase-change material, closed with a dual-wall roof vent. When the PCMs melt, the vent pressure drops, and the linked damper auto-opens a chimney path so the box rejects heat by buoyancy alone instead of drawing in warm ambient air. Passive ventilation that closes the vents when the vents would only hurt — and the damper is machined by the team's own desktop SLA printer or an XY laser-cut frame.
- **Which track / which special award it targets:** **Nature-based Bengaluru** track · targets **Best School Innovation** (₹4,000) as a low-cost food-preservation build a 5-student team can fabricate and field-test.
- **Why BOTH are required:** Remove A (temperature probe + dew switch) and it becomes a permanently open vent — which is a real failure mode, because an open vent on a hot humid day *injects* heat and actively worsens the box's hold time. The sensing decides the actuator's open *or* closed state; there is no fixed setting that works across Bengaluru's 18 °C nights and 38 °C afternoons. Remove B (the slider-crank damper linkage) and the sensing has nothing to move — the whole mechanism of the box is the moving plate, and it must slide to open a pressure path and return to seal.
- **Bill of materials:**
  - 40 L EPS cooler box (or 3D-printed PLA shell), double-wall PC liner — ₹1,100
  - 1.2 kg GSP 32 °C PCM (salad-comfort packs, salvaged from medical cold-chain) — ₹2,000
  - ESP32-C3 + DS18B20 probe + LDR (light lock) + LMC5552 humidity/dew-pulse or DHT22 + micro servo or 28BYJ-2848 stepper — ₹900
  - 3D-printed PLA-CF link plates and slider-crank mounts + M3 hardware (3D printing here is one of the named B technologies, in a structurally load-bearing role) — ₹800
  - Acrylic vent chimney, silicone gasket, sealing wax, aluminium foil vapour barrier, twin-bellows damper seal — ₹600
  **≈ ₹5,400** build cost, no grid power
- **Build time:** 12–18 hours
- **Measurable impact claim:** **Holds 5 kg of vegetables below 8 °C for 24 hours at 34 °C ambient** (target ≥ 20 h), **demonstrably better than a non-vented identical PCM box** in a back-to-back 24-hour test, with **measured internal-vs-ambient temperature logged every 5 minutes** — verified with two data loggers, the same vegetable load, and a vent-closed control.

---

## Cross-check against the counterfactual rule

| # | Remove sensing (A) | Remove actuation (B) | Verdict |
|---|---|---|---|
| 1 TILTA-DRUM | screw stalls on wet batch | load cells drive nothing | **Both load-bearing** |
| 2 AEROLITH | clay shears the screw, no recovery | torque sensor can't clear the jam | **Both load-bearing** |
| 3 BHASINI | dead-head burst / re-airlock | sensor set can't prime a pump | **Both load-bearing** |
| 4 TILAK | operator tremor ruins the data | sensors can't hold a curved leaf flat | **Both load-bearing** |
| 5 CADAVER-PROOF | open vent injects heat on hot days | sensing can't move the damper | **Both load-bearing** |

## Constraints honoured

- No biologists, no anthropology, no heritage framing anywhere.
- No "AI dashboard" concept and no generic SaaS — every concept delivers a physical mechanism.
- Both parents are named, real, specific technologies: specific encoder and sensor families (RE/HD/ICM-42688/VL53L1X/DS18B20/load cells with HX711), and specific actuator families (NEMA-17, direct-drive servo, MG996R, BLDC/24 V DC, peristaltic and centrifugal pumps, slider-crank and compliant linkages, SLA/FDM 3D printing).
- One concept is explicitly a **Build-wize** entry; three are **Nature-based Bengaluru**; two name a ₹4,000 special award as the primary target.