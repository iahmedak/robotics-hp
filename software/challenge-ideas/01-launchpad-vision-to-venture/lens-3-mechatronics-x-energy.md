# Lens 3: Mechatronics & Actuation × Energy & Power

Event: Launchpad — Vision to Venture · Team of 2 · ₹500 entry · ₹1,00,000 winner / RU ₹50,000 / ₹25,000 runner-up
Judged as a real venture: who pays, unit economics, moat, survives 5 years.
Technique: each concept must be structurally impossible without BOTH parents (counterfactual test applied per concept).

---

### [1]. KilnLock — Waste-Heat Phase-Change Induction Kiln

**TOP 2**

- **Integration:** Delta robot pick-and-place gantry actuation (A) × phase-change materials + waste-heat thermoelectric/PCM thermal storage (B)
- **The product:** A desktop ceramic/glass kiln that stores waste heat from a previous firing cycle in a PCM-lined hot box, then re-fires a small piece using a stepper-indexed delta robot to swap workpieces — zero electricity after the first 20-minute prime.
- **What existing product becomes better:** Electric kilns. The Electric kiln assumes a continuous 2 kW grid draw and 30-minute cold-start every time. KilnLock makes the *cycle* free by making the *machine* autonomous and the *heat* persistent.
- **Why BOTH are required:** Remove actuation → you must open the kiln by hand, lose the stored heat, and re-fire from cold (the product dies; PCM is just insulation). Remove energy storage → the delta robot is a nice automatic loader on a grid-hungry kiln, i.e. exactly the decorative thing the brief bans. Neither alone is a product.
- **Bill of materials:**
  - PCM-lined steel hot box (aluminium shell + 4 kg eutectic PCM at ~58 °C) — ₹9,500
  - Peltier/TEC + copper fin stack for PCM melt/soak — ₹6,200
  - Delta robot: 3× NEMA-17 steppers, 3× cycloidal reducers, carbon-fiber arms, 450 mm reach — ₹14,000
  - K-type thermocouples ×4 + MAX31855 breakout — ₹1,100
  - SSR + zero-cross solid-state relay for boost element — ₹700
  - Refractory-lined chamber + hinged door seal — ₹5,800
  - KinetiCore microcontroller (STM32) + custom gantry PCB — ₹2,400
  - Enclosure, wiring, 230 V SMPS — ₹4,100
  - **Total ≈ ₹43,800**
- **Venture case:**
  - Who buys: potters, jewellery wax burnout, ceramics studios, 40+ college ceramic labs, small tile makers — anyone whose current kiln draws 2–3 kW and whose power bill is the whole reason they stopped firing.
  - Why: one 8-hour firing becomes ~₹2 of residual energy; hobbyists who gave up their kiln return to the hobby.
  - Moat: the PCM curve-match (charge/discharge temperature window) + the delta-to-kiln-geometry thermal mapping, tuned per clay body. Calibration data is the asset, not the hardware.
  - Unit economics: ~₹44k BOM, ~₹1.6 lakh MRP, 40% gross margin at ₹75k distributor; ₹90–140 gross per firing saved is a 3-year payback story the customer sells themselves.
- **Build time to demo:** 28 hours

---

### [2]. TorqueHarvest Actuated Trailer Hitch — Self-Powering Fifth Wheel Jack

**TOP 2**

- **Integration:** BLDC geared actuator + linear actuator jack assembly (A) × vibration/kinetic electromagnetic harvesting with supercapacitor buffering (B)
- **The product:** A fifth-wheel landing-gear jack whose raise/lower is driven by a 400 W BLDC + worm screw linear actuator, with that jack's own vibration and the tractor's road energy harvested through a dual-stage electromagnetic harvester into a supercapacitor bank that runs the motor for every cycle — no wiring to the tow vehicle.
- **What existing product becomes better:** Electric fifth-wheel landing gear and portable hydraulic jacks. Every existing jack needs the truck's 7-pin socket, a heavy 40 A lead, or hand-cranking. TorqueHarvest has a power budget because the motion *is* the fuel.
- **Why BOTH are required:** Remove harvesting → it's a wire-dependent powered jack (off the shelf). Remove actuation → it's a kinetic electricity generator with no load to power (a nice demo, zero market). The harvest exists *only* because there is a motor to charge, and the motor exists *only* because there is a harvester.
- **Bill of materials:**
  - 400 W BLDC motor + planetary reducer + worm screw jack assembly (rated 3,000 kg) — ₹18,500
  - Dual-stage electromagnetic harvester (road-damping + rotational) — ₹11,200
  - Supercapacitor bank 12 × 50 F / 2.7 V with balancing BMS — ₹9,600
  - 12 V Li-ion LiFePO₄ 10 Ah as cold-start buffer — ₹5,400
  - MPPT-boost charge controller + buck converter — ₹2,300
  - Hall-sensor position feedback, limit switches, CAN/RS-485 link to the truck ECU — ₹1,900
  - Load-rated 5th-wheel housing, forged steel mount — ₹6,700
  - IP67 enclosure, harness, strain relief — ₹3,800
  - **Total ≈ ₹59,400**
- **Venture case:**
  - Who buys: long-haul fleet operators, RV tow-vehicle owners, trailer manufacturers, off-highway equipment dealers — fleets that hate plugging in.
  - Why: jack actuation stops being an electrical liability; eliminates the "forgot to unplug" failure and the blown 7-pin fuse class of calls.
  - Moat: the harvester's dual-stage frequency-matching (road-roughness spectrum vs. actuator back-EMF) is a real engineering barrier, plus OEM certification with trailer builders.
  - Unit economics: ~₹60k BOM, ~₹1.45 lakh MRP; at 20% distributor, ₹1.16 lakh net, ~47% gross; fleet buyers amortise over 6–8 years and still win on downtime alone.
- **Build time to demo:** 24 hours (bench rig with shaker table + load cell, not a truck)

---

### [3]. PolyPulse — PCM-Backed Thermal-Cycling Actuator Test Bench

- **Integration:** Linear actuator + servo-driven load frame / 6-axis flexure bed (A) × phase-change material + thermoelectric thermal buffering (B)
- **The product:** A benchtop durability tester that cycles a linear actuator or servo 1–10 million times across a −10 °C to +85 °C profile using PCM heat sinks and TEG coolers, so the actuator lives in its real thermal environment while the test rig draws almost no compressor power.
- **What existing product becomes better:** Actuator life-test rigs. Every commercial one is a 3–5 kW chamber + compressor + data logger costing ₹8–25 lakh. PolyPulse is a ₹1.6 lakh unit that runs from a 1 kW supply.
- **Why BOTH are required:** Remove thermal (B) → it's a cheap cyclic test rig competing with free time; the load frame alone is a boring machine. Remove actuation (A) → it's a thermal chamber with no actuator in it, i.e. an incubator. The PCM only stores the *heat the actuator test generates and the cycle demands*, and the servo load frame only exists to *apply the duty cycle*.
- **Bill of materials:**
  - 400 mm servo-electric linear actuator (2 kN) + servo drive — ₹21,000
  - Servo-rotary arm + flexure cradle for rotary actuator testing — ₹9,800
  - PCM modules (6 × paraffin, phase window −5 to +85 °C) in Al cassettes — ₹7,400
  - 6× TEG 12706 modules + copper heatsink + DC fan bank — ₹8,900
  - Chamber: 0.4 mm SS insulated box, silicone gasket, hinged lid — ₹11,600
  - Load cell + rotary encoder + hall position sensing — ₹2,700
  - STM32 + CAN logger + 4-channel thermocouple — ₹3,200
  - **Total ≈ ₹64,600**
- **Venture case:**
  - Who buys: actuator and servo manufacturers, EV powertrain labs, Tier-2 auto suppliers, robotics startups — anyone whose customer asks "how many cycles at 85 °C?"
  - Why: certification-grade thermal cycling at a price a Tier-2 can afford, delivered in weeks not quarters.
  - Moat: PCM phase-window selection per actuator spec plus a duty-cycle recipe library that grows with every customer test — data moat with a hardware ship.
  - Unit economics: ~₹65k BOM, ~₹2.9 lakh MRP, 38% gross margin direct; SaaS-free, but the recipe library drives replacement-unit and fixture-kit attach revenue.
- **Build time to demo:** 32 hours

---

### [4]. ColdChain Fermenter — Thermoelectric Cold-Stage Kinetics Rig

- **Integration:** Servo-driven agitator + linear actuator press-stage on a lab fermenter (A) × thermoelectric generator + Peltier cold-stage with PCM thermal buffer (B)
- **The product:** A 5-litre bench fermenter whose jacket is Peltier-cooled and TEG-powered, with a servo-swept agitator and an actuated sampling press, so continuous fermentation kinetics can be studied overnight at a stable 30.00 °C with no glycol chiller and no mains-power brownout risk.
- **What existing product becomes better:** Lab-scale fermenters and bioreactor chiller units. Commercials need a recirculating chiller costing ₹1.5–4 lakh plus 24/7 supervision; insulin, alkaloid, and synthetic-biology labs cannot afford that per bench.
- **Why BOTH are required:** Remove the thermal stack (B) → it's a stirred vessel with two motors, a commodity. Remove the actuation (A) → it's a Peltier-cooled jar, i.e. a fridge — no kinetics, no controlled shear profile. The PCM/TEG only holds setpoint because the servo sweep *creates* the variable heat load; the servo/press only deliver real kinetic data *because* the setpoint never wanders.
- **Bill of materials:**
  - 5 L borosilicate fermenter with jacket, baffles, ports, glass dome head — ₹8,400
  - Servo motor + planetary drive + 2-blade pitched impeller shaft assembly — ₹6,200
  - Linear actuator sampling press + sterile needle valve array — ₹4,800
  - 6× Peltier (TEC1-12706) + copper cold plate + dual condenser loop — ₹12,600
  - 2× TEG (Peltier-grade TEG1-12611) harvesters on exhaust + fin array — ₹7,900
  - PCM buffer blocks, 1.2 kg, −5 to +35 °C — ₹4,200
  - PID controller (2-channel), RTD ×3, torque sensor, sterile inline filter — ₹3,700
  - Frame, casters, insulated lid — ₹6,000
  - **Total ≈ ₹53,800**
- **Venture case:**
  - Who buys: synthetic-biology and fermentation PhD labs, small nutraceutical makers, speciality breweries doing strain R&D, ag-biotech incubators.
  - Why: overnight runs finish instead of stalling at a chiller alarm; no glycol, no water bill, no attendant.
  - Moat: the servo-shear → fermentation-rate coupling model is a genuine methods asset; papers cite the rig, labs re-buy.
  - Unit economics: ~₹54k BOM, ~₹2.2 lakh MRP, 41% gross margin direct; consumable cold-plate filters and PCM replacement cartridges are a small annuity.
- **Build time to demo:** 30 hours

---

### [5]. SunSpine — Self-Orienting PV Tracker with Phase-Change Damping

- **Integration:** Stepper-actuated dual-axis tracker with compliant backlash-free linkage (A) × silicon PV bifacial modules + phase-change material thermal buffer + TEG-assisted motor supply (B)
- **The product:** A 1–3 kW off-grid rooftop tracker whose stepper axes run on TEG + PCM energy harvested from the back of its own PV array, so it tracks the sun through the day and returns to stow at night without a grid connection or a large battery.
- **What existing product becomes better:** Grid-tied PV trackers (which need a 400 V DC bus and a whole inverter) and small off-grid solar lanterns/generators. SunSpine is a tracker that is self-powered by the very panel it aims.
- **Why BOTH are required:** Remove the thermal-energy layer (B) → it is a bog-standard stepper tracker, a commodity bracket with two small motors on it. Remove actuation (A) → it is a TEG-powered trinket with no PV and no function. The PCM exists because the stepper's own back-EMF and dawn thermal soak create real thermal transients the axis must survive; the tracker exists because the harvested energy is only worth harvesting when something large and heavy must be physically aimed.
- **Bill of materials:**
  - Bifacial Si PV modules, 1.5 kWp (415 W × 4) + mounting frame — ₹34,000
  - Dual-axis stepper tracker base: 2× NEMA-23, worm + anti-backlash nut, torque tube, hall absolute encoders — ₹28,500
  - Compliant torsion-bar damping links + flexure bearings — ₹5,400
  - TEG array (48 modules) on PV backplane + fin sink — ₹13,200
  - PCM thermal buffer blocks on motor mounts + conduction straps — ₹5,800
  - LiFePO₄ 50 Ah buffer + MPPT Li-ion controller with motor-priority output — ₹16,400
  - Weatherproof enclosure, lightning/earthing kit, cable management — ₹9,700
  - **Total ≈ ₹1,13,000**
- **Venture case:**
  - Who buys:** off-grid telecom towers, farm pump controllers, roadside signage, disaster-relief microgrids, hill-station homestays.
  - Why: trackers normally raise yield only where a grid connection already exists; these sites have no grid to connect to.
  - Moat: the thermal-transient + back-EMF power-budget co-design and the field yield dataset across seasons — the module is a commodity, the energy budget is not.
  - Unit economics: ~₹1.13 lakh BOM, ~₹3.1 lakh MRP, 32% gross margin (module cost dominates); sold on energy-delta against fixed solar, ~14–18% annual yield gain justifies price in 5 years.
- **Build time to demo:** 34 hours

---

## Ranking rationale

1. **KilnLock** — smallest BOM-to-willingness-to-pay ratio, cleanest single-tenant beachhead, and the counterfactual is airtight: neither a robot nor a PCM buys anything alone.
2. **TorqueHarvest** — genuinely new product category, strongest moat per rupee (frequency-matched harvesting is hard), but needs a longer certification path to real fleets.
3. **PolyPulse** — real market with real incumbents, but higher BOM and a buyer who compares against an existing ₹8 lakh rig.
4. **ColdChain Fermenter** — small, delightful, but a niche buyer base that already tolerates chiller cost.
5. **SunSpine** — largest capital intensity, longest payback story, weakest demo-per-hour.

## Counterfactual audit (all five)

| Concept | Remove A (actuation) | Remove B (energy) | Verdict |
|---|---|---|---|
| KilnLock | manual firing, heat lost, PCM is just insulation | automatic loader on a grid kiln — decorative | PASS |
| TorqueHarvest | generator with no load | wire-dependent powered jack, commodity | PASS |
| PolyPulse | thermal chamber with nothing in it | cyclic rig competing with free time | PASS |
| ColdChain Fermenter | Peltier-cooled jar | stirred vessel with two motors | PASS |
| SunSpine | TEG trinket, no PV, no aim | commodity stepper tracker | PASS |