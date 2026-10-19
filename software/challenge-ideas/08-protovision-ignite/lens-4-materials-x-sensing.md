# LENS 4 — ADVANCED MATERIALS & STRUCTURE × SENSING & FEEDBACK

**Event:** ProtoVision Ignite – National Hardware Innovation Challenge · 4 participants · ₹500 total
**Tech pair:** (A) magnetoelastic / viscoelastic / cellular solids / aerogel / biocomposite / conductive printed composites — (B) Hall-effect switches, strain-gauge resistance bridges, piezo acoustic emission, dielectric-capacitance sensing, closed-loop feedback
**Design rule enforced here:** the material is the *transducer*. A stock ₹10–₹100 element does the reading; the material does the sensing. No dedicated force/torque sensors anywhere.

---

## 1. GRIPTELL — Magnetoelastic grip-force dynamometer with a Hall-switch ladder

- **Integration:** Ferrite-loaded silicone elastomer (ferrogel: neutral-cure PDMS + 50 wt% MnZn/NiZn ferrite powder, NdFeB bias magnet cast in) + **4× A3144 Hall-effect switches** on a graduated ladder with per-switch trim-pot thresholds
- **The product:** A hand-grip dynamometer where the compliant grip pad itself is the load cell — squeeze until it clicks, exactly like a mechanical snap gauge.
- **What existing product becomes better:** Clinical hand dynamometers (Jamar / Baseline / Saehan electronic models, ₹8,000–25,000) need a separate rigid load cell, a 2-axis alignment fixture and periodic recalibration because strain-gauge load cells drift and must be mounted against a stiff frame. GRIPTELL's sensor is the part your hand closes around, so there is no alignment fixture, no mounting-stiffness error, and the ferrogel — a self-healing elastomer — survives repeated 300 N crushes that would fatigue a bonded strain gauge.
- **Why BOTH are required:** Remove the ferrite powder and the pad is inert rubber with µr ≈ 1 — a magnetometer sees *nothing* change when you squeeze it, so there is no output. Remove the Hall switches and you have a squishy magnet with no readout whatsoever. Counterfactual: the sensor is only the transducer *because* the composite converts compression → field change; the switch is only the reader *because* the field crosses its threshold. Neither survives removal of the other.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | A3144 Hall-effect switch IC (TO-92) | 4 | 48 |
  | Bourns 3386 trimmer potentiometer (threshold set) | 4 | 40 |
  | 5 mm LED + 1 kΩ resistor (level ladder) | 4 set | 32 |
  | MnZn ferrite powder | 100 g | 70 |
  | Neutral-cure silicone sealant + catalyst | 30 ml | 80 |
  | NdFeB disc magnet 3×2 mm (bias field) | 4 | 50 |
  | PLA filament — cast mould + shell | 200 g | 60 |
  | Perfboard, hookup wire, heat-shrink, 9 V snap | — | 90 |
  | **TOTAL** | | **₹470** |
- **Build time:** 9 hours (mould print 2 h, pad cast + 16 h cure overlapped, magnet bonding 1 h, ladder wiring 3 h, threshold calibration 3 h).
- **Judge-table demo:** Judge squeezes the GRIPTELL exactly like a hand dynamometer — a lamp clicks on at 15 N, another at 30 N, another at 45 N, another at 60 N, and a fifth at 75 N, so the scale is readable by eye without ever being told the number.

---

## 2. TORQTAG — A 3D-printed conductive load-spreading washer that *is* the strain gauge

- **Integration:** Conductive (carbon-loaded) PLA load washer, 3D-printed as an integral strain-sensing ring + **4× LM393 comparators** driving an LED preload ladder (a passive Wheatstone divider — no MCU)
- **The product:** A bolt-preload telltale and loosening detector: you tighten the bolt you were going to tighten anyway, and the washer itself reports whether the joint is at preload and whether it has since relaxed.
- **What existing product becomes better:** Torque wrenches (₹4,000–14,000) require a calibrated tightening procedure, are one-per-size, and say nothing about whether the joint held six weeks later. Smart washers (VibrationNut, Ring-Lock) cost ₹15,000+ per set, need coin cells, and ship as a separate accessory you install *instead of* a washer. TORQTAG is a ₹60 printed washer that is the washer, needs no battery, and tells you both at assembly and at any later inspection — a mechanical "painted witness mark" upgraded to an electronic one.
- **Why BOTH are required:** Carbon-black-loaded PLA is the gauge element — no strain-gauge foil, no lead bonding, no strain-gauge adhesive, no separate load cell and no mount. Without the comparator ladder you own a slightly odd washer that cannot speak. Without the conductive filament the washer is steel: electrically silent, zero output. Counterfactual: printed PLA alone is only a load path; comparators alone on a plain washer read a fixed resistance forever. The readout is load-bearing only because the *material* changes resistance under the bolt's tension.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | Conductive PLA 1.75 mm filament (local 3D-print shop, per-metre sale) | 5 m | 225 |
  | LM393 dual comparator IC | 2 | 30 |
  | M8 flat steel washer (shim stack / platen) | 2 | 40 |
  | 5 mm LED + resistor threshold network | 4 set | 40 |
  | M8×40 bolt, nut, nyloc | 4 set | 80 |
  | Perfboard, hookup wire, heat-shrink, 9 V snap | — | 80 |
  | **TOTAL** | | **₹495** |
- **Build time:** 7 hours (design + print 3 h × 5 versions, assembly 2 h, pre-cycle + threshold calibration 2 h).
- **Judge-table demo:** With the circuit on and lights dim, the judge tightens the M8 bolt with a spanner and the LED ladder climbs one lamp per step — then they back the bolt off half a turn and watch the lamps drop back down, in real time.

---

## 3. RINGBACK — Resonant auxetic-lattice impact puck with acoustic-emission readout

- **Integration:** 3D-printed **re-entrant (auxetic) honeycomb metamaterial** lattice, tuned by lattice angle and FDM infill density, injection-moulded-in PLA/PETG + **piezoelectric AE pickup disc + ATtiny85** ring-down analyser
- **The product:** A reusable, resettable drop/impact indicator that reports the *energy* of a hit and whether the protected part is still structurally sound.
- **What existing product becomes better:** ShockWatch, Tempix and similar one-shot mechanical indicators (₹80–400 each, use up on a single threshold crossing, report "bumped / not bumped" and nothing more, and cannot be rearmed in the field). Ringback is reusable, rearmable, and reports peak impact energy *and* a health flag, so it becomes a shipping-crate / drone-battery / lab-equipment instrument rather than a consumable sticker.
- **Why BOTH are required:** The lattice is the instrument's transfer function, not a specimen — a solid puck of the same mass is heavily over-damped (ζ > 1) and just thuds, so there is no resolvable ring-down to read and no way to separate a 2 J hit from a 6 J hit. A bare piezo on a solid block returns a shape-less click. Remove the lattice and the piezo has nothing to hear; remove the piezo and the lattice is silent plastic. Counterfactual: an accelerometer alone gives you raw g; only the *tuned metamaterial* turns an unknown impulse into an interpretable signature.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | ATtiny85 DIP + 16 MHz crystal | 1 set | 110 |
  | Perfboard, headers, IC socket | — | 40 |
  | Piezoelectric AE pickup disc | 1 | 25 |
  | LED ×3 + comparator/threshold resistors | — | 40 |
  | PLA/PETG filament — puck body, lattice, shell | 400 g | 110 |
  | M6 bolt + rubber feet (impact surface) | 1 set | 40 |
  | 9 V battery, snap, hookup wire, heat-shrink | — | 100 |
  | **TOTAL** | | **₹465** |
- **Build time:** 14 hours (lattice parametric print + tuning sweep 8 h — most of it unattended printing, assembly 3 h, resonance calibration 3 h).
- **Judge-table demo:** A steel ball is dropped 30 cm onto the puck — the buzzer chirps and the LED ladder reports ~3 J — and then the same ball is dropped onto a puck that the team has pre-cracked, where it reports a visibly different resonance and flashes a red COMPROMISED flag.

---

## 4. DEWSENSE — Rice-husk silica aerogel granulate as the dielectric in a condensation alarm

- **Integration:** Self-made **rice-husk silica aerogel** (sodium silicate + acetic acid gel, dried and crushed to a granular bed in a breathable capsule — the form that avoids monolith cracking) + **74HC14 Schmitt oscillator + LM393 comparator** reading the bed as a genuine parallel-plate capacitor (εr ≈ 1.1 dry → ~10–40 water-loaded)
- **The product:** A reusable, self-resetting electronic "sweat" alarm for cold AC ducts, refrigeration lines, insulated pipes and cold-room doors.
- **What existing product becomes better:** Humidity Indicator Cards (₹40–150, single-use, one-shot, no electronics, no alarm, thrown away after one trip) and electronic dew-point sensors (₹2,500+). DEWSENSE re-arms itself the instant the surface dries, runs off a 9 V battery with no electronics beyond one comparator, and uses a waste rice husk as its active medium — turning an agricultural residue into the sensing element itself.
- **Why BOTH are required:** The oscillation frequency shift *is* the humidity measurement — the aerogel's water uptake changes its bulk permittivity by more than an order of magnitude, which is what moves the RC oscillator. A bare comparator pair on an empty copper-plate capacitor sees a fixed capacitance and can never report moisture. Conversely, a beautiful aerogel block with no oscillator and no comparator is just a block of sand. Counterfactual: neither element produces a reading alone.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | Sodium silicate ("water glass") 250 ml | 1 | 90 |
  | Rice husk 500 g | 1 | 20 |
  | White vinegar 250 ml (acetic acid) | 1 | 25 |
  | Copper plate pair + nylon mesh + PLA capsule | 1 set | 120 |
  | 74HC14 hex Schmitt inverter (RC oscillator) | 1 | 25 |
  | LM393 dual comparator + LED ladder | 1 set | 60 |
  | Piezo buzzer 5 V | 1 | 20 |
  | Perfboard, hookup wire, heat-shrink, 9 V snap | — | 110 |
  | **TOTAL** | | **₹470** |
- **Build time:** 11 hours active (gel chemistry 2 h, 24 h ambient cure + 4 h low-temperature oven dry, crush and pack 2 h, oscillator/trigger tuning 3 h). Start the gel **48 h before** event week.
- **Judge-table demo:** A COLD block of aerogel sits under the red lamp; the judge breathes on it and the buzzer chirps RED in under two seconds, then places it beside a hot mug and watches the LED walk back down to GREEN — the same indicator, rearmed, forever.

---

## 5. MYCOPULSE — Mycelium composite panel grader by tap signature

- **Integration:** Live *Pleurotus* mycelium composite grown on wheat straw at **two packing densities** (a graded-stiffness natural metamaterial) + **piezo contact microphone + ATtiny85** envelope/period counter (reverse-look ring test)
- **The product:** A field instrument that non-destructively grades biocomposite panels and packaging by their acoustic signature — telling you density, void fraction and whether a panel is within spec.
- **What existing product becomes better:** Mycelium insulation, mycelium packaging (Dell, Evrnu) and pulp boards ship with QC that is a visual look, a hand squeeze, or a destructive cut-and-weigh. Ultrasonic density meters that actually do this start around ₹25,000 and need couplant. MYCOPULSE is a ₹500 bench instrument: tap a panel, hear a pitch, read a class.
- **Why BOTH are required:** Closed-cell and plastic foams are strongly over-damped — they ring flat regardless of density — so an instrument built on foam cannot sort anything. The mycelium's graded, chitin-reinforced lattice is what produces a **monotonic ring frequency vs. density** that a listener or a counter can resolve. Remove the mycelium and the piezo reports noise; remove the piezo and you have four visually identical boards and only your ear, which is exactly the status quo this product replaces. Counterfactual: the material is the reference standard, not the specimen.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | ATtiny85 DIP (internal RC — no crystal needed) | 1 | 90 |
  | Perfboard, headers, socket | — | 40 |
  | Piezo contact microphone / buzzer disc | 1 | 20 |
  | LED ×3 + threshold resistors | — | 35 |
  | Wheat straw substrate | 1 kg | 30 |
  | *Pleurotus* spawn (local grower) | 100 g | 120 |
  | LDPE grow bags, twist ties, autoclave (household pressure cooker) | 1 set | 40 |
  | PLA filament — enclosure + strike plate | 150 g | 60 |
  | 9 V battery, snap, hookup wire, heat-shrink | — | 90 |
  | **TOTAL** | | **₹525 → ₹490** *(drop the third LED; 2-level class + pass/fail)* |
- **Build time:** 6 hours active after a **7-day grow** (panels must be spawned a week before event week; pressure-cooker sterilisation 1 h, inoculation 1 h, fruiting hold 7 days, bake + dry 1 day, instrument build 4 h, calibration by weighing 1 h).
- **Judge-table demo:** Four mycelium panels that look completely identical are laid out; the judge taps each with the instrument and hears four different pitches as the LED bar sorts them into LIGHT / MID / DENSE / REJECT — the panel that the team pre-starved reads visibly out of spec.

---

## TOP 2

**GRIPTELL** and **TORQTAG** are the strongest on this pairing.

Both make the material literally be the transducer and read it with the cheapest stock electronics available (₹12 Hall switches; a two-IC comparator ladder), which is the only way four people turn ₹500 into working, defensible hardware. Both replace a real ₹4,000–₹25,000 instrument category with a ₹60 printed part, both demos are instant, physical and instantly repeatable in front of a judge (squeeze-and-click; tighten-and-watch-the-lamps-climb), and neither depends on a firmware tune or an app — the failure modes are small and bounded. RINGBACK is the most dramatic demo of the five and the strongest NDT upgrade, but it carries the highest calibration risk; keep it as the first alternate if a print iteration goes wrong.