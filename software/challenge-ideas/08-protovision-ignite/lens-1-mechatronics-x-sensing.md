# LENS 1 — MECHATRONICS & ACTUATION × SENSING & FEEDBACK
### ProtoVision Ignite · National Hardware Innovation Challenge · 4 members · ₹500 entry
### Mandate: fuse one mechatronic from A with one sensing technology from B so that **neither half survives alone.**

---

## THE ₹500 ARCHITECTURE (read this before the concepts)

At ₹500 the build is essentially forced into a very specific shape, and every concept below obeys the same envelope. Pretending otherwise is how ₹500 prototypes die.

**The envelope**

| Slot | Part | Cost |
|---|---|---|
| Brain | 1× Arduino Nano V3 clone (CH340) | ₹220–230 |
| Actuator | 1× 28BYJ-48 geared 5 V stepper (1/64, ~0.9 kg·cm at output) | ₹90–95 |
| Actuator drive | 4× 2N2222 + 4× 1N4148 discrete H-bridge legs (replaces the ULN2003 module) | ₹14–16 |
| Sensing | A3144 Hall ×2 + 5 mm neodymium discs ×2 | ₹36 |
| Mechanism | 3D-printed PLA/PETG, 130–200 g | ₹30–55 |
| Everything else | wire, passives, fasteners, rubber, spares | ₹90–130 |

**Three tricks do all the precision work:**

1. **The encoder we don't buy.** The 28BYJ-48 is fully open-loop — it has no idea whether it missed a step. We glue a ₹6 neodymium disc to its **output** shaft and park a ₹12 Hall sensor 1.5 mm from the housing. That gives a genuine incremental encoder on the thing that actually matters (post-gearbox position) for ₹18. This is the load-bearing trick of the whole set.
2. **The force sensor we don't buy.** A printed cantilever flexure + magnet + Hall is a calibrated force sensor. Combined with a printed flexure of known geometry it reads grams. A 5 kg load cell + HX711 costs ₹120–130 — a quarter of the entire budget — for one channel.
3. **The whole point of printed compliance.** A *rigid* linkage cannot be measured by one sensor. A *compliant* linkage (flexure-hinged parallelogram) can, because its deflection is a designed, calculable function of load. Designing the mechanism to be measurable is how we buy sensor channels for ₹18 instead of ₹130.

**Total per build: ₹494–₹499. Every concept below runs from any USB 5 V source (laptop / phone charger) — no battery pack is affordable and none is needed on a judging table.**

---

## 1. SEEDGUARD
- **Integration:** 28BYJ-48-driven **volumetric seed metering drum** with a printed bridge-breaker wiper (A) + **IR drop-detector cross-checked against a Hall drum-index encoder** (B), closed into a detect → back-off → shake → resume recovery loop.
- **The product:** A bolt-on metering head for a hand seed-cum-fertiliser drill that guarantees **one seed, one hole, one spacing** and physically clears its own bridge jams.
- **What existing product becomes better:** Indian seed drills (₹8,000–₹15,000 mechanical precision models) meter by drum geometry and are **blind to whether a seed actually landed**. A pocket can hold 0, 1, or 2 seeds and the drill cannot tell. Result in the field: silently doubled and gappy rows, reseeding cost, and no farmer able to diagnose why. SeedGUARD adds ₹500-worth of verification to the same ₹8,000 drill.
- **Why BOTH are required:** The drum alone counts **pockets**, not seeds — bridging, a light seed that falls back into the hopper, and a double drop are all identical from the drum side, so the machine advances confidently through a row it has failed to plant. Strip out the actuator and the IR beam has nothing to place a seed with and no authority to unstick itself: you are left with two sensors and a hopper. Strip out the sensing and you have a meter that is confidently wrong — the exact failure mode it is supposed to fix. **The recovery action (reverse + shake) is only possible because the loop can prove the drop failed.**
- **Bill of materials — total ₹499:**
  - Arduino Nano V3 clone (CH340) — **₹224**
  - 28BYJ-48 geared 5 V stepper — **₹90**
  - 4× 2N2222 + 4× 1N4148 stepper driver — **₹16**
  - A3144 Hall ×2 + 5 mm neodymium discs ×2 (drum index, height stop) — **₹36**
  - 3 mm 940 nm LED + phototransistor, hand-shrouded drop detector — **₹20**
  - PLA ~130 g: metering drum (12 pockets), hopper, chute, bridge-breaker finger, frame, crank knob — **₹30**
  - M3 fasteners, stand-offs, cable ties — **₹16**
  - Wire, heat-shrink, jumper set — **₹20**
  - 1000 µF, 100 nF, 10 kΩ pull-ups — **₹12**
  - 5 mm LED + tact switch — **₹11**
  - Rubber band drive, PTFE tape, offcuts — **₹8**
  - Spares (1 Hall, 2× 2N2222, 2× 1N4148, extra M3) — **₹16**
- **Build time:** 14 person-hours (mechanism 5 · electronics 3 · print-and-fit 4 · jam-recovery logic 2)
- **Judge-table demo:** Seeds in the hopper, the head cranked across a tray — the seeds land in a visibly perfect single file; then a toothpick is pushed into the chute and the drum stops, backs off, shakes, and resumes on its own.

---

### 2. FLATLIFT **TOP 2**
- **Integration:** 28BYJ-48-driven **printed lead-screw lift-assist** (A) built on a **flexure-hinged compliant parallelogram whose deflection is read by a Hall sensor and fed back as a load-compensating PID** (B).
- **The product:** A delivery-crate / farm-lift handle that keeps the weight in your hand **constant at 5 kg, whatever the crate actually holds**, and warns before the printed structure is over-stressed.
- **What existing product becomes better:** Powered lift-assists and hand trucks are sold with a **fixed** assist ratio — 3 kg of assist. A 6 kg parcel still hurts, a 30 kg one still drops you, and the aluminium frame is over-stressed with no one watching. Our version senses the true load and **continuously re-matches the assist**, so the operator's perceived load is a design parameter, not an accident.
- **Why BOTH are required:** Remove the sensing and the assist is a fixed 3 kg — the worker is crushed by the heavy crate *and* gets no overload warning on the structure; that is the entire problem, restated. Remove the actuation and you have a printed load cell with a hook on it: a ₹40 product wearing ₹230 of electronics, and the counterfactual answer to "would it still work?" is *yes, and badly*. The two are entangled at a deeper level than usual here: **one Hall sensor can only measure load because the mechanism was designed as a compliant parallelogram** — a rigid lever pivoting on a pin needs two sensors and still cannot separate load from rotation. We are buying sensor channels by designing the structure to be measurable.
- **Bill of materials — total ₹499:**
  - Arduino Nano V3 clone (CH340) — **₹224**
  - 28BYJ-48 geared 5 V stepper — **₹90**
  - 4× 2N2222 + 4× 1N4148 stepper driver — **₹16**
  - A3144 Hall ×2 + 5 mm neodymium discs ×2 (flexure deflection, lift position) — **₹36**
  - PLA ~170 g: flexure parallelogram, cradle, lead-screw nut, forked frame, handle, hook — **₹38**
  - M3 fasteners, stand-offs, cable ties — **₹18**
  - Wire, heat-shrink, jumper set — **₹22**
  - 1000 µF, 100 nF, pull-ups, trim pots — **₹16**
  - 3× 5 mm LED load bar + tact switch — **₹13**
  - Rubber grip wrap, PTFE tape — **₹10**
  - Spares (1 Hall, transistors, extra M3, 20 g filament) — **₹16**
- **Build time:** 16 person-hours (flexure design + print tuning 6 · mechanism 4 · electronics 3 · PID 3)
- **Judge-table demo:** A judge lifts the handle and adds water bottles one at a time — the handle **never gets heavier**, and the LED bar quietly climbs to show the true mass; past the limit the lift visibly sags and warns.

---

### 3. BOLTPULSE **TOP 2**
- **Integration:** Printed **eccentric-flywheel vibration actuator** in the tool handle (A) + **flexure-beam torque beam read by a Hall sensor, driving a vibration-envelope haptic encoder** (B).
- **The product:** A torque driver that **feels the reaction torque back through your hand** — usable by a blind or low-vision mechanic, who today has no way to know when a screw is seated.
- **What existing product becomes better:** Every torque wrench and torque screwdriver on the market shows torque on a **dial or a screen**. Both are useless to a blind user, and a stripped screw head still costs more than the entire tool. BOLTPULSE re-specifies the same product for the human who cannot read the dial: torque is encoded as a **vibration pattern**, not as a number.
- **Why BOTH are required:** Remove the sensing and the vibration motor has nothing to encode — it is a buzzer in a screwdriver, and the product reverts to being a plain handle. Remove the actuation and there is no output channel at all: a printed flexure beam deflecting invisibly inside a handle. Crucially, the signal is chosen for its *absence*: we deliberately encode torque as **vibration amplitude and pulse rate, not pitch**, because high-frequency hearing loss is near-universal in the older blind users this serves — a buzzer that gets higher-pitched is the wrong channel for the exact person who needs it.
- **Bill of materials — total ₹464:**
  - Arduino Nano V3 clone (CH340) — **₹224**
  - Vibration / pager motor 6 V (haptic generator) — **₹40**
  - 2N2222 + 1N4148 + 100 Ω (motor drive and haptic envelope) — **₹14**
  - A3144 Hall ×2 + 5 mm neodymium discs ×2 (torque beam, preset collar position) — **₹36**
  - PLA ~130 g: handle shell, flexure torque beam, 1/4" bit chuck, 3-setting preset collar, needle dial, flywheel housing — **₹38**
  - M3 fasteners, stand-offs, cable ties — **₹20**
  - Wire, heat-shrink, jumper set — **₹24**
  - 1000 µF, 100 nF, pull-ups, trim pot — **₹14**
  - 5 mm LED + tact switch + 3-position toggle — **₹12**
  - Rubber grip wrap, PTFE tape, sandpaper (flexure tuning) — **₹12**
  - Spares (1 Hall, transistors, extra M3, 20 g filament) — **₹30**
- **Build time:** 12 person-hours (flexure design + tuning 4 · handle build 3 · haptic encoder 3 · calibration 2)
- **Judge-table demo:** Hand the tool to a blindfolded judge and let them drive a screw — they feel it flutter, firm up, and settle into a smooth continuous hold at seated torque, and say so before we tell them anything.

---

### 4. EQUALPLATE
- **Integration:** 28BYJ-48-driven **printed Archimedes-screw dispenser** (A) + **printed flexure weighing vessel read by a Hall sensor**, PID-closed on mass rather than on screw revolutions (B).
- **The product:** A portion dispenser that puts **exactly 100 g of rice or dal in every plate** — by weight, not by guess — for mid-day meal kitchens, RTE canteens, community kitchens and ration shops.
- **What existing product becomes better:** Commercial portion controllers (₹8,000+) exist and are calibrated for **one material, at one moisture**. An auger meters a *geometric* volume per revolution; bridging and wall-slip mean the delivered mass per revolution is material- and moisture-dependent, so the same setting gives 140 g of dry rice and 78 g of the wet second serving. Every real kitchen serves both. EQUALPLATE tars itself and closes the loop on mass, so the setting means grams.
- **Why BOTH are required:** Remove the sensing and the dispenser is a machine that converts *material variability* into *portion error* at 500 plates a day. Remove the actuator and the weighing vessel is a very accurate scale that a person must still operate by hand, 500 times. Neither half has meaning alone.
- **Bill of materials — total ₹499:**
  - Arduino Nano V3 clone (CH340) — **₹220**
  - 28BYJ-48 geared 5 V stepper — **₹95**
  - 4× 2N2222 + 4× 1N4148 stepper driver — **₹16**
  - A3144 Hall ×2 + 5 mm neodymium discs ×2 (vessel deflection, auger index) — **₹36**
  - PLA ~160 g: auger, hopper, flexure weighing vessel, frame, chute, anti-spill lip — **₹40**
  - M3 fasteners, stand-offs, cable ties — **₹18**
  - Wire, heat-shrink, jumper set — **₹22**
  - 1000 µF, 100 nF, pull-ups — **₹12**
  - 2× 5 mm LED, tact switch, SPDT toggle (auto / manual trickle) — **₹14**
  - PTFE tape, rubber feet, offcuts — **₹6**
  - Spares (1 Hall, transistors, extra M3, 20 g filament) — **₹20**
- **Build time:** 13 person-hours (auger + hopper 4 · flexure vessel design and calibration 4 · electronics 3 · PID 2)
- **Judge-table demo:** Eight plates of dry rice, each 100 g to the gram; then the wet, sticky second serving goes in and the machine slows down, shivers, and still lands 100 g every time.

---

### 5. CRANKSET
- **Integration:** Printed **3-stage planetary/gear train with a one-way clutch and a variable brake** (A) + **torsion-shaft Hall torque sensing + crank-RPM Hall, PID-holding constant output power** (B), read out on a printed needle dial and LED power bar.
- **The product:** A hand-crank unit whose **output stays constant** whether you crank slowly or frantically — a school-lab dynamometer that replaces ₹30,000 motorpool sets, and a rehab ergometer that keeps resistance therapeutic.
- **What existing product becomes better:** Every hand ergometer and dynamometer is a fixed-friction load: power goes as ω³, so the readout swings wildly with cadence and is useless as a training target. A physics teacher today either buys a ₹30,000 motorpool or accepts numbers that are wrong by a factor of five depending on how fast the student spun. CRANKSET holds **constant power** by modulating brake load against measured crank torque.
- **Why BOTH are required:** Remove the sensing and you are back to a fixed brake — the one thing the product exists to fix. Remove the gear train and the one-way clutch and the user's cadence is rigidly coupled to the load: they either spin free at zero watts or bog down and stall. The gear train is what *decouples* a variable human input from a constant machine demand; the sensor is what closes the loop across that decoupling.
- **Bill of materials — total ₹494:**
  - Arduino Nano V3 clone (CH340) — **₹220**
  - Small 6 V DC gearmotor (the controllable load) — **₹70**
  - PLA ~230 g: 3-stage gear train, crank + handle, brake drum, frame, dial face, needle — **₹50**
  - 2N2222 ×2 + 1N4148 ×2 + 100 Ω (PWM load drive) — **₹16**
  - A3144 Hall ×2 + 5 mm neodymium discs ×2 (crank RPM, needle position) — **₹36**
  - 0.1 Ω 3 W shunt, 100 Ω, 10 kΩ trim — **₹12**
  - 1000 µF, 100 nF, pull-ups — **₹10**
  - 5 mm LED ×5 (power bar) — **₹14**
  - M3 fasteners, stand-offs, cable ties (printed bushings, no bearings) — **₹18**
  - Wire, heat-shrink, jumper set — **₹22**
  - Rubber grip, drive band, tape — **₹12**
  - Spares (transistors, extra M3, 20 g filament) — **₹14**
- **Build time:** 18 person-hours (gear train print + meshing 6 · torque path + clutch 4 · electronics 3 · PID + dial 5)
- **Judge-table demo:** A judge cranks it; the needle and the LED bar sit rock-steady, and as they crank harder the brake **bites back** so the watts do not move — then they stop and it coasts freely.

---

## WHAT I DELIBERATELY REJECTED AT ₹500

These are not bad ideas. They are ideas that need money this brief does not have, and pretending otherwise is how a prototype fails in front of judges.

- **Any load cell + HX711 build** (₹120–130 for one channel). Every concept above gets calibrated force from a **printed flexure** instead. If a sponsor later hands us ₹3,000, the flexure is the first thing we replace — not the architecture.
- **Pneumatic or hydraulic logic.** A 12 V compressor, solenoid valves and a regulator is ₹900 before a single printed part exists. Above the budget by 2×.
- **A BLDC or NEMA-17 servo with a real encoder.** A GA12-N20 with a magnetic encoder is ₹200–250 and would eat half the budget for *one* axis, when the 28BYJ-48 plus a ₹18 magnet-and-Hall output encoder does the same job for ₹108.
- **A delta robot, robot arm or CNC gantry.** These need three or four coordinated axes. At ₹500 we can afford exactly one, so every concept here is a **single-axis, deeply instrumented mechanism** — which is also what you can actually finish and debug in the build window.
- **Anything needing a camera, a display or a "smart dashboard".** A ₹900 OLED and the hours to lay it out are both unavailable, and a screen is a worse story than a physical LED bar or a mechanical needle.

---

## THE PATTERN UNDERNEATH ALL FIVE

The fusion that survives at ₹500 is never *sensor added to machine*. It is **mechanism designed so that one cheap sensor becomes sufficient**: a magnet-and-Hall instead of an encoder, a printed flexure instead of a load cell, a compliant parallelogram instead of a second sensor channel, a printed geared drum instead of a position servo. In every case, if you strip out the sensing the machine is confidently wrong, and if you strip out the mechanism the sensing has nothing to act on. That is the test the brief asked for, and all five concepts are built to pass it.
