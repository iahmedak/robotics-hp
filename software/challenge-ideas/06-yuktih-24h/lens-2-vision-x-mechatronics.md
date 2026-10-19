# Lens 2 — Computer Vision & Imaging × Mechatronics & Actuation

**Event:** Yuktih – Innovate Today, Sustain Tomorrow · 24h · team of 2–4 · ₹1,500 entry · ₹10k / ₹7.5k / ₹5k

**Assigned pair (both load-bearing):**
- **A — Vision/Imaging:** thermal IR, depth/stereo, monocular CV, event camera, pose estimation, optical flow, edge CV on MCU/NPU, drone/satellite imagery, multispectral
- **B — Mechatronics/Actuation:** servos/steppers/BLDC, servomechanisms, pneumatics, hydraulics, linear actuators, 3D printing, CNC, robot arms, delta robots, gantries, linkages, compliant mechanisms

**Filter applied to every concept below:**
1. Remove vision → does it still work? If yes, reject.
2. Remove actuation → does it still work? If yes, reject.
3. Can 2–4 people physically assemble, wire, debug and demo this between 9pm and 9am?
4. Is "sustainable" an *engineering property* (embodied energy, service life, repairability, waste mass) rather than a green label?

---

### 1. THERMAL CRACK MONITOR — "Substrate"

**TOP 2**

- **Integration:** Thermal IR camera (MLX90640 / ST7735 160×120, or cheap USB thermistor array) reading surface temperature field of a bonded/composite structure + a **two-axis servo pan-tilt scanner** (2× SG90/MG996R or 2× NEMA17 stepper on a printed gimbal) that automatically hunts, tracks and re-measures the **same physical points** across sessions so drift is measurable, not eyeballed.

- **The product:** A clamp-on, self-aiming thermal monitor that locks onto an ID-marked fiducial grid bonded to a building joint, composite panel or PCB-potted sensor, and re-scans only those spots so thermal drift is quantified and logged for the life of the part.

- **Why BOTH are required:** Remove the camera and there is no non-contact measurement of a subsurface delamination or a failing bond — the whole point is that the part cannot be opened to check. Remove the scanner and the camera still works, *but only if a human aims it* — and a human-aimed thermal camera over months of intermittent inspection is the entire failure mode this product eliminates. A fixed tripod cannot re-register on a fiducial to ±0.5° after a panel flexes or a bracket is bumped; the gimbal + fiducial lock is what turns N photographs into one time series. Counterfactual fails both ways → both load-bearing.

- **Sustainability claim:** Concrete thermal delamination behind a facade or inside a composite panel is the failure mode that ends a structure's life; the current repair path is *replacing the whole panel* because nobody can locate the defect. This product converts "replace on suspicion" into "measure, then repair a 200 mm² spot." Engineering property: **cut avoided embodied carbon per structural repair from ~panel-scale to patch-scale (typically 10–30× material reduction), and extend inspected service life by making inspection autonomous and repeatable rather than skipped because it "takes too long."**

- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | ESP32-CAM or ESP32-S3 dev board | 600 |
  | MLX90640 wide-angle thermal breakout (160×120) | 3,200 |
  | 2× NEMA17 stepper + A4988 drivers | 900 |
  | 2× MG996R servo + SG90 micro servo (backup) | 500 |
  | Printed gimbal carriage (PLA, printed in 4h) | 200 |
  | 8× IR-pass filter foils + aluminium aperture ring | 350 |
  | High-emissivity reference tape + printed fiducial grid (matte black PETG) | 300 |
  | Power bank + 5V/3A buck | 450 |
  | Laptop / cheap tablet for the UI | — |
  | **Total** | **~₹6,500** |

- **24-hour build plan:**
  - **9–11pm:** Cube assembled; ESP32-CAM streaming; MLX90640 dump raw 16-bit frame dumps over UART to laptop Python. Get *a* thermal image on screen. *Cut if needed:* drop to the 32×24 MLX90614 ($ cheaper but coarser — only acceptable if the claim is worded as "trend", not "defect size").  *This is the highest-risk hour block; do it first, before any mechanics.*
  - **11pm–1am:** Printed gimbal in hand. Wire 2× stepper + drivers to a spare stepper-driver board or DRV8825 on the ESP32/S3, or offload motion to a TMC2209 module driven from the same MCU. First successful closed-loop sweep.
  - **1–3am:** Fiducial registration — the actual intellectual content. Print a 3×3 ArUco/hartley marker grid, mount it on the panel, and write the score: search for marker → compute homography → warp the thermal frame so the *same 9 cells* are always the same pixels. This is what makes longitudinal comparison legitimate.
  - **3–5am:** Longitudinal UI. Store per-cell ΔT vs. baseline in SQLite + a text CSV. Add emissivity calibration against the reference tape.
  - **5–7am:** Heat-source test: put a hot resistor or a mains-heated patch behind a taped acrylic sheet, *behind the material*, and show the scanner finding it without anyone moving the camera.
  - **7–9am:** Rehearse the 3-min demo. Write the fallback: a recorded 24-hour drift run so the demo never depends on live hardware behaving.
  - **What gets cut:** multi-material emissivity table, cloud sync, battery operation (run on USB). Never cut: fiducial registration and the ΔT-over-time view — they are the claim.

- **Why it wins here:** Both halves are commodity parts, the demo has a visceral "ghost under the panel" moment, and the sustainability claim is a physical 10–30× material reduction that judges can verify on a single slide.

---

### 2. ADAPTIVE BIN-PICKING ARM — "Sift"

**TOP 2**

- **Integration:** Monocular RGB camera (esp32-cam / USB webcam) running **on-device pose estimation of the waste stream** (a light OpenPose/MoveNet-class skeleton over a calibrated overhead frame — a 2D bin-fill profile, not a robot arm) + a **2-DOF delta/scissor linkage sorter**: a printed delta-style parallel arm driven by 2× NEMA17s + belts, with a passive flexure pusher finger, cycling on a fixed cam-triggered schedule.

- **The product:** A low-cost open-loop sorter that sits above a dry recyclables chute and uses an overhead vision pass to *measure which material is dominant this week*, then mechanically re-tunes its own diverter geometry so contamination stays under a target ratio — with zero closed-loop robotic control.

- **Why BOTH are required:** Remove vision and the arm re-tunes on a fixed schedule — which is exactly today's behaviour, and exactly why contamination creeps back after every material mix change. Remove the arm and the vision produces a *report* of contamination with no way to act on it; a dashboard that nobody can act on is the banned "AI dashboard for X." The insight: **vision's job here is not to pick the object, it is to retune a passive mechanism.** Vision sets three dial positions; a printed cam-driven linkage does the sorting. That division is what makes it buildable in a night — no servo IK, no grasp planning, no grasp failure modes.

- **Sustainability claim:** Contamination is the mechanism by which a recyclable stream gets landfilled — a binned load fails and goes to landfill because a wrong item got in. Quantifiable property: **target contaminant fraction under 10% in the sorted stream, versus a typical 20–30% un-sorted baseline — i.e. roughly halving the landfill mass per tonne of dry recyclables processed**, at a machine cost of ₹8k against a manual sort cost that pays a human per hour.

- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | ESP32-S3 (or Raspberry Pi 4, if one is available) | 900 |
  | OV2640/USB webcam + overhead mount | 700 |
  | 2× NEMA17 stepper + A4988/TMC2209 | 900 |
  | GT2 belts/pulleys, printed frame, printed pusher finger | 600 |
  | Limit switches + hall sensors | 300 |
  | 5V supply + wiring | 500 |
  | Test waste: 400 g mixed shredded plastic/paper/card | 500 |
  | **Total** | **~₹4,400** |

- **24-hour build plan:**
  - **9–11pm:** Vision *first, again*. Get the overhead camera streaming; run a lightweight MoveNet/MobileNet-class classifier or pure blob/HSV segmentation to classify a coarse fill profile (plastic / paper / card / other) per bin. MobileNet on an S3 is ~30 min of work and is the entire "vision" claim.
  - **11pm–1am:** Print the delta/scissor linkage. Hand-crank the geometry first — before any electronics exist — to prove the mechanical range of motion. *If the delta is fighting you after 90 min, drop to a single scissor linkage driven by one stepper. Do not debug a 3-axis IK overnight.*
  - **1–3am:** Belt drive + limit switches. Manual jog to prove the two end stops.
  - **3–5am:** Write the scheduler: camera classifies → one dial angle per material → arm cycles at a fixed 1.2 s period. **No closed loop.** Log what was sorted.
  - **5–7am:** Run 200 g through it three times; measure captured-vs-missed by hand and log the numbers. Real numbers on a slide beat a smooth animation.
  - **7–9am:** Rehearse. Have a bag of mixed waste ready and a timer app visible.
  - **What gets cut:** all robotic picking, all servo IK, any CV model beyond a coarse classifier, any sorting of wet/organic material. Never cut: the two-dial mechanism and the real contamination measurement.

- **Why it wins here:** Cheapest build on this list, the mechanism is genuinely the hard part, and the demo is a machine visibly *reconfiguring itself* in response to what it sees — which reads as intelligence without any of the robotics risk.

---

### 3. PASSIVE-SOLAR WATER ROUTER — "Drip"

- **Integration:** Thermal IR camera reading **leaf/surface temperature of plants and of the surrounding soil** to find where moisture actually evaporates, driving **a cam-driven 4-way valve manifold** (printed progressive-cavity splitter + 4× micro-servo ball valves) that physically routes a single gravity-fed tank to whichever bed is actually drying.

- **The product:** A solar-powered, no-pump irrigation splitter that re-routes one reservoir to the driest bed using thermal-IR transpiration as the moisture proxy, and closes its own flow when night temperature collapse proves transpiration has stopped.

- **Why BOTH are required:** Remove IR and the valve manifold still runs on a fixed timer — that is a mechanical timer, not a sensing system, and it is the incumbent (a ₹400 mechanical timer already exists). Remove the manifold and the IR data goes nowhere. The vision is the *only* input; the actuator is the *only* output; there is no software product in between.

- **Sustainability claim:** Timers over-water because plants' transpiration demand is set by temperature and radiation, neither of which the timer knows. Property: **match delivered water to actual evapotranspiration rather than a fixed schedule — measured against a timer baseline on identical beds, target ≥30% lower water delivered for equal plant biomass**, plus a hard 1.5-hour night-flow cutoff that bounds worst-case over-watering to one night cycle instead of a week of timer drift.

- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | MLX90640 thermal breakout | 3,200 |
  | ESP32-S3 + microSD logging | 700 |
  | 4× SG90 micro-servos + printed ball-valve bodies | 800 |
  | 20 L reservoir + printed manifold + gravity feed line | 500 |
  | 2× 5W solar panels + 18650 pack + charge IC | 1,200 |
  | Six potted plants, soil, thermometer | 700 |
  | **Total** | **~₹7,100** |

- **24-hour build plan:**
  - **9–11pm:** Get IR frames. Build 2 beds. Baseline one bed on a timer, one on nothing, for a real reference number.
  - **11pm–1am:** Print valve manifold. **Cut early if it leaks:** a printed ball valve that seals is the single biggest mechanical risk in this concept. Fallback: printed peristaltic pinch valves squeezing silicone tube (much easier, worse life — and say so honestly on the slide).
  - **1–3am:** Solenoid/servo actuation + a night-cutoff on temperature *drop* rather than clock time (more defensible, and cheap).
  - **3–5am:** Log mass delivered per bed per night via load cells under the reservoir — you need a number, not a vibe.
  - **5–7am:** Run the comparison. Graph water-vs-night vs. timer baseline.
  - **7–9am:** Rehearse; solar is a *feature* for the demo if it's daylight outside the window, so pre-charge the pack.
  - **What gets cut:** pump control, weather forecast, multi-zone logic, any flow meter finer than load-cell mass.

- **Why it wins here:** Very legible sustainability story (water is the most politically legible resource in India) and the night-cutoff is a genuinely clever, cheap, buildable trick. Ranks below the top 2 on mechanical risk (leaking printed valves).

---

### 4. VIBRATION-DAMPED RECLAIM JIG — "Rock"

- **Integration:** Smartphone-accelerometer-as-camera alternative — **high-frame-rate optical-flow camera (PMW3901 / optical-flow sensor, or 200 fps phone burst)** measuring micromotion of a surface + a **tuned-mass-damper compliant mechanism**: a printed flexure-hinge frame with a sliding mass on a printed leaf-spring rail, tuned by slot count, that mechanically de-couples the machine mount.

- **The product:** A 3D-printed, slot-tunable vibration isolator whose internal spring-mass is tuned *against measured* residual motion so a small machine's frame stays still without bolting it to concrete.

- **Why BOTH are required:** Remove the motion sensor and the damper is a passive mass-spring you tune by ear (or not at all) — no measurement-driven design. Remove the damper and the vision becomes a vibration *dashboard*, which is the banned generic dashboard. The product's intellectual content is: **measure the residual motion, then cut slots in a printed leaf spring until the measured number hits target.** Vision sets the tuning; mechanics does the work.

- **Sustainability claim:** Vibration is the primary cause of fastener fatigue, bearing wear and eventual machine scrapping; the standard industrial fix is *bolting to concrete*, which is permanently unextractable, non-repairable, and unheard-in-practice at this machine size. Property: **≥60% reduction in measured frame displacement at machine-speed frequency, using a fully unserviceable-parts-free printed isolator with 5 tunable profiles and a repairable (reprintable) spring — versus a non-tunable printed mount baseline.** Embodied framing: no concrete, no anchor holes, no permanent bond, and the whole thing is one polymer part you can shred and reprint.

- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | ESP32-CAM or Pi Zero 2 W + optical-flow sensor breakout | 2,600 |
  | Vibration test source (small 3D-printed eccentric motor, or a phone on a speaker) | 600 |
  | PLA/PETG filament, ~1.2 kg for 5 printed isolator profiles | 450 |
  | M3 bolts, heat-set inserts, rubber feet | 250 |
  | Bench with a deliberately wobbling leg (built into the demo table) | 300 |
  | **Total** | **~₹4,200** |

- **24-hour build plan:**
  - **9–11pm:** Get the optical-flow or 200 fps burst pipeline producing a displacement-vs-time number. If phone burst is too noisy by hour 11, **cut to a fixed-position PMW3901 module** — cheaper, always works, and honest.
  - **11pm–1am:** Print 5 isolator variants with different slot counts. This is the fastest physical iteration loop in the whole list — a print is 45 min, so 5 variants overnight is realistic.
  - **1–3am:** Measure each variant on the wobbling bench. Plot displacement vs. frequency. **The 5 data points are the deliverable.**
  - **3–5am:** Pick the winner profile, print the final, mount it.
  - **5–7am:** Write the "what breaks without this" slide: fastener fatigue life estimate vs. measured displacement reduction.
  - **7–9am:** Rehearse.
  - **What gets cut:** any velocity matching, any active actuation, any claim beyond "passive isolation with a measured number." Never cut: the 5-profile measurement sweep.

- **Why it wins here:** Lowest mechanical risk of all five (everything is printed, nothing leaks or jams) and the "5 printed variants, one wins, here's the graph" story is very strong for judges. Ranks fourth because its sustainability framing is the least obvious of the set.

---

### 5. EDGE-SPECTRAL SORT GATE — "Amber"

- **Integration:** **Multispectral reflectance (NDVI-style red + NIR bands via a 2-channel filtered sensor or a cheap 8-bit RGB + blue-channel-ratio proxy)** scoring resin/polymer pellet contamination + a **pneumatic burst-jet air-knife array over a printed vibrating pan**: fixed-angle air jets that deflect one material fraction off the pan into a reject bin, no per-object motion planning.

- **The product:** A passive optical-sorting gate for a small plastic-recycling stream: pellets free-fall past a fixed air-knife curtain, and the vision only decides *which of four fixed jets fires and for how long* — geometry does the sorting.

- **Why BOTH are required:** Remove the multispectral vision and the air-knife array is a blind pneumatic separator with no discrimination — it either fires constantly (throws everything away) or never fires (sorts nothing). Remove the jets and the vision is a QC *report* on contaminated feedstock, i.e. the banned dashboard. Same load-bearing structure as Sift, but with a harder actuator (pneumatic timing) and a more contested science claim (does two-band reflectance actually separate these polymers?).

- **Sustainability claim:** Polymer-to-polymer contamination is unrecoverable in mechanical recycling — one contaminated batch downgrades the whole output to low-grade. Property: **recover and re-inject the air-sorted reject fraction back into the same stream, reducing virgin-resin make-up feed by the recovered mass — target ≥20% virgin resin displacement on a measured batch** — with the pneumatic stage itself consuming only compressed air, no consumables.

- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | Pi Zero 2 W / ESP32-S3 + red/NIR filter mod | 2,200 |
  | 12 V solenoid valves ×4 + compressor + regulator | 1,800 |
  | Printed vibrating pan + air-knife manifold | 700 |
  | Nozzle array, 3D-printed or brass | 600 |
  | Test feedstock: shredded PET vs PP vs ABS, 1 kg | 800 |
  | Compressed-air bottle (borrow or rent) | 500 |
  | **Total** | **~₹6,600** |

- **24-hour build plan:**
  - **9–11pm:** Confirm the discriminator actually works *before* building any pneumatics. Hold 3 plastic types under the filtered sensor, plot red/NIR ratio. **If the three types do not separate on two bands, cut this concept entirely and substitute Sift's mechanism** — do not spend 6 hours building an air knife for a signal that doesn't exist.
  - **11pm–1am:** Printed pan + fixed nozzles. Bench-test with a hand-triggered air line and a slow feed.
  - **1–3am:** Solenoids + compressor + timing. Verify the curtain geometry throws one fraction clean and leaves another.
  - **3–5am:** Camera classification → jet-selection logic, with a **debounce** (jets are 30 ms, vision is 30 fps — fire on a detected streak, not a single frame).
  - **5–7am:** 1 kg batch run, mass-balance the three output bins. Real masses on the slide.
  - **7–9am:** Rehearse; compressor noise is a problem — pre-charge the bottle.
  - **What gets cut:** NIR camera upgrade (filters on a sensor is fine), any per-object trajectory, any closed-loop feedback.

- **Why it wins here:** Most aggressive material-recovery claim of the set and pneumatic actuation is a real mechatronics flex. Ranks fifth only because the two-band spectral premise is the least certain thing to validate in an 11pm-to-midnight window — though it is honestly scoped as a kill-or-continue gate.

---

## Ranking rationale

| # | Concept | Cheap vision? | Mechanical risk | Sustainability legibility | 24h realism |
|---|---|---|---|---|---|
| 1 | Thermal Crack Monitor | ₹3.2k IR, easy API | Low (2-axis gimbal) | Very high (avoided panel replacement) | High |
| 2 | Adaptive Bin-Picking Arm | ₹0.7k webcam, easy | Low–medium (delta geometry) | High (contamination → landfill) | High |
| 3 | Passive-Solar Water Router | ₹3.2k IR | **Medium-high (leaking valve)** | Very high (water) | Medium |
| 4 | Vibration-Damped Reclaim Jig | Cheap motion sensor | **Very low (all printed)** | Medium (fatigue life) | Very high |
| 5 | Edge-Spectral Sort Gate | Medium | Medium (pneumatic timing) | High (virgin resin) | Medium |

**If the team has a thermal camera on hand or a good parts budget → #1.**
**If the team has nothing and wants the cheapest, most reliably-demoable build → #2.**