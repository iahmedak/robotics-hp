# Lens 3 — Mechatronics & Actuation × Advanced Materials & Structure
**CodeSangram 3.0 · Namma Bengaluru · 24–48 h build · ₹1.5k entry**

Both technologies are load-bearing in every concept below. If you can delete the material
and the mechanism still performs its function, the concept is dead on arrival.

---

### 1. SURTI — Heat-Driven Self-Resetting Rake for Surface Litter Skimming
**TOP 2**

- **Integration:** Conveyor-drum surface skimmer head (BLDC drive, geared brush drum, optical
  sorting sensor) + **Nitinol shape-memory alloy wire** rake fingers that close on the trash
  and **spring back open on cooling alone**.
- **The product:** A lake/litter skimmer head whose grabbers need no servos, no gearbox, no
  reopening motor — the jaws are one 0.5 mm SMA wire and a heatsink.
- **Bengaluru problem it solves:** Ulsoor, Hebbal, Kumara Swamy and Bellandur lakes collect
  bottles, sheets, thermocol and fallen foliage after every monsoon. BBMP's lake-cleaning
  contract uses human boats with **hand rakes**, and mechanised skimmer trials stall on the
  grabber: servos die at the waterline (IP rating vs cost), cable glands leak, and a jam
  in a jaw means a boat sits dead for a shift.
- **Why BOTH are required:** The counterfactual is brutal. Remove the SMA and you need
  **one servo + horn + linkage per finger, a heatsink, and a closed-loop re-open angle
  (4 servos/finger at ~₹350 each, ~₹1,400/jaw, and a mechanical fail-open linkage)** —
  that is the exact thing that keeps failing on the water. Remove the mechanism and
  Nitinol is just a very expensive bimetal strip: it has no path to the surface, no
  transport of sorted waste, no duty cycle. Nitinol supplies ~60–120 N of pull per 0.5 mm
  wire at 4% strain — far beyond picking a 500 ml bottle — and **heats to close, cools to
  open**, so it is a *self-resetting* actuator with a genuine fail-safe: power loss mid-grab
  and the jaw relaxes and drops the item into the hopper instead of freezing shut.
  Cost per jaw collapses from ~₹1,400 to ~₹230.
- **Bill of materials:**
  - Nitinol SMA wire 0.5 mm, 3 m — ₹250
  - Nitinol sheet 0.5 mm, 100×100 mm (finger tabs) — ₹350
  - Heatsink + NTC + MOSFET driver + 5 V buck — ₹450
  - 2× micro metal servo (indexer + brush drum lead screw), or NEMA8 + belt — ₹900
  - NEMA 14 + L298/TB6612 + 12 V 10 Ah pack + charger — ₹1,600
  - ESP32 + INA219 + IR break-beam array — ₹650
  - Acrylic/HDPE drum head, chute, 3D-printed jaw frames (PLA) — ₹1,800
  - Bolts, shaft, bearings, PTFE rod, wire, marine epoxy, cable glands — ₹900
  - **Total ≈ ₹7,900** (entry+travel ≈ ₹8,000 of ₹16,000)
- **48-hour build plan:**
  - H0–H4: Cut a 300 mm acrylic conveyor drum + chute; 3D-print jaw frames; assemble.
  - H4–H8: Bench the SMA wire alone. Characterise **force vs. % contraction vs. current vs.
    temperature** with a 5 kg kitchen scale and an IR camera. Log the numbers — this curve
    is the technical spine of the whole project.
  - H8–H14: Single finger: build the closed finger (heat → grip 250 g bottle → cool → release).
    Log cycle time. **Design constraint you will hit: 2–5 s per cycle**, so drive the drum at
    a matched cadence with a fixed indexer, not free-running.
  - H14–H20: 4-finger rake head + heat spreader; wire ESP32 for dwell/index/monitor.
  - H20–H28: **Load rig** — 300 mm conveyor, 20-item mixed waste stream (bottles, cups,
    thermocol, leaves, wet plastic), score logged picks/minute, miss rate, and per-item
    damage. Bench-mount the SAME rig with a servo jaw and **A/B it against SURTI**. This
    comparison is your entire pitch: throughput + failure count + ₹/jaw.
  - H28–H34: Weatherproof: conformal coat, IP54 glands, 6-hour soak test in a tub of
    lake-ish water with grit. Log drift.
  - H34–H40: Pool test with a floating raft over a 200 L tank of dyed water and mixed debris.
  - H40–H48: Dashboard-less writeup (printed A/B chart), backup video, one-dashboard-free
    build. **No AI dashboard.**
- **Data: free/open vs needing partnership:** All free — CPCB/AQI for site selection,
  BBMP ward GeoJSON, IMD rainfall open data; only a **partnership for a live lake
  berth and safety cover** is needed, and that's an access request, not a data licence.

---

### 2. JALAGAMA — Auxetic Lift-and-Release Drain Screen
**TOP 2**

- **Integration:** Single-actuator lift well (12 V actuator + lead screw, or a 3-position
  servo winch) with a **re-entrant honeycomb auxetic metamaterial screen** that is
  **designed to widen its own apertures when lifted.**
- **The product:** A drain-inlet screen that a single worker lifts with one actuator to
  shake out what it has trapped — and *releases* it, because the holes open as it rises.
- **Bengaluru problem it solves:** Bengaluru's inlets jam with plastic sheet, bottles,
  fallen leaves and silt-cemented film — every monsoon, at Silk Board underpasses,
  KR Puram, Madiwala drains and the Hebbal corridor. A normal slotted/grated screen
  **lifts the blockage straight up through its own slots and re-plugs**. Crews currently
  hand-clear with rods, or pull the whole chamber open with a crane.
- **Why BOTH are required:** Remove the material and the auxetic effect vanishes, so
  lifting still drags the film through the slots — you would need a raking arm, a
   two-stage screen, or a full chamber hoist (**3–4 mechanisms instead of 1**). Remove
  the mechanism and a lattice panel is just a filter. The negative Poisson's ratio is the
  *only* reason one actuator can do the work: as the top rail rises, each re-entrant cell
  flattens and pushes radially outward, so aperture and screen area **increase** with lift.
  Mechanical stops prevent over-travel; if the cable snaps the screen falls back and
  **covers** the inlet. One actuator replaces a rake + hinge + shear + a crane.
- **Bill of materials:**
  - PETG/PLA, ~450 g for a 600×600 mm re-entrant honeycomb panel (multi-object, variable
    wall/infill pass) — ₹300
  - Actuator: 12 V 100 mm linear + lead screw, or servo + worm winch — ₹900
  - FRP/HDPE frame, guide rails, PTFE/stainless rod, cable, limit switches — ₹1,200
  - Wet cell mock: 600×600×450 mm FRP tank + silt/clay mix — ₹800
  - ESP32 + timer + IR beam — ₹500
  - Consumables: nozzles, glue, PTFE tape, EPDM gasket — ₹400
  - **Total ≈ ₹4,100**
- **48-hour build plan:**
  - H0–H4: Write the auxetic cell generator (parametric, Python/OpenSCAD). Print four
    100 mm test coupons of different re-entrant angle. **Measure lateral expansion vs.
    vertical pull** — this is the load-bearing experiment and it must be done before
    anything else.
  - H4–H8: Pick the cell geometry with the best aperture-opening-per-mm-lift; print the
    full 600 mm panel in 4 quadrants with alignment keys so it can be lifted.
  - H8–H12: Build the lift well: FRP cell, rails, screw, actuator, end stops.
  - H12–H18: **Clog benchmark.** Load a cell with a realistic mix — wet plastic sheet,
    bottles, leaves, silt. Run 10 clog/lift cycles. Record mass retained, mass released,
    release distance. Photograph every cycle from a fixed camera.
  - H18–H24: Build the **control**: indexed actuator, 250 mm lift, 1.5 s hold, return.
    Log mass released per cycle into a CSV.
  - H24–H30: A/B against a conventional slotted screen of identical open-area ratio. Same
    clog, same 10 cycles. Side-by-side retention/release curves.
  - H30–H36: Rain/silt robustness: charge with clay, run a spray test, check jamming.
  - H36–H42: 1:1 mock inlet (600×600 grate set into a poured concrete surround).
  - H42–H48: Print the A/B charts, write the mechanism explanation as one board, record
    the demo reel, clean and pack.
- **Data: free/open vs needing partnership:** Fully free — CPCB, IMD rainfall, BBMP ward
  layers, and your own logged bench CSV. One **partnership ask: a real BBMP storm-drain
  chamber inspection slot** (access only, no data licence).

---

### 3. KADAMU — SMA Superelastic Foot for a Drain-Manhole Quadruped
- **Integration:** 12-DOF servo quadruped (12 × MG996R/DS3218, inverse kinematics on an
  ESP32) with **Nitinol superelastic SMA wire feet** that damp impact when cold, stiffen
  when heated, and **always spring back to an exact original height** — plus a
  load-sensing role, since martensite fraction shifts the wire's resistance with strain.
- **The product:** A legged robot whose feet absorb a 30 mm pothole edge and a broken
  kerb step without sprung legs, blisters, or a shock absorber per foot — and whose
  ground clearance never sags over a shift.
- **Bengaluru problem it solves:** BBMP drains, manholes and metro underpass shafts are
  cramped, wet and stepped. A wheeled robot can't enter; a cage/drone can't close the gap.
  The alternative today is a human in a confined space. Feet also determine whether the
  bot can walk on Bengaluru's actual pavements — the damaged kerb-and-slab geometry that
  put potholes there in the first place.
- **Why BOTH are required:** Delete the SMA and each foot needs a **separate
  damper + rigid sole**, or a soft foot that either kills ground clearance or protects
  nothing — the single-element trick disappears and the mass goes up. Delete the
  mechanism and a SMA strip cannot walk. Load-bearing claim: nitinol's
  superelastic/one-way recovery means the foot **returns to its exact designed height
  after every step** — rubber and plastic soles take a permanent set over a few thousand
  steps, and a quadruped that loses 2 mm per step per foot has to be re-levelled. Also,
  one heated (martensitic) element can **lock the foot rigid for pushing/prying**, and its
  resistance tracks strain — a free force sensor replacing four ₹700 load cells.
- **Bill of materials:**
  - Nitinol 0.75 mm wire, 8 m (4 feet × 2 elements) + 2 mm plate for foot yokes — ₹900
  - ESP32 ×2, PCA9685 ×2, MPU6050, current-sense — ₹1,400
  - 12 × DS3218 servos — ₹2,100
  - Carbon-fibre or bamboo/3D-printed chassis, feet, brackets — ₹1,200
  - 3S 5200 mAh + XT60 + charger — ₹1,500
  - Driver/MOSFET per foot, heatsinks, NTCs — ₹700
  - **Total ≈ ₹7,800**
- **48-hour build plan:**
  - H0–H6: Print and bolt the quadruped chassis; get it standing with servos only.
  - H6–H12: Implement the gait state machine + inverse kinematics. **Get it walking
    before any material work exists.**
  - H12–H18: Characterise one foot: drop it from 300 mm on a load cell; log peak
    impulse and **residual height after 1000 cycles**, cold vs hot (heated = martensitic,
    rigid). This comparison is the project.
  - H18–H24: Fabricate 4 SMA feet (wire wrapped over a printed mandrel, crimped to a
    printed yoke), add per-foot MOSFET + NTC.
  - H24–H30: Gait over the test obstacles: a 30 mm steel lip, a 25 mm broken-slab step,
    wet PVC floor tile. Video 1000 cycles, measure height drift.
  - H30–H36: Stiffening demo: same step, cold feet vs heated feet — show load transfer.
  - H36–H42: Strain-resistive load readout — plot resistance vs. drop impulse, with a
    kitchen scale as the reference instrument.
  - H42–H48: Drain-chamber mock (600 mm, steps, low light), write the comparative
    report, pack.
- **Data: free/open vs needing partnership:** Free — all gait/force data is your own
  instrumentation; IMD/BBMP open data only for site context. **Partnership: one drain
  chamber + BBMP safety protocol for a live demo** (access, not licence).

---

### 4. GADDE-BLOCK — Superabsorbent Silt Block and Its Single-Actuator Lifter
- **Integration:** Lined silt-cell with a **superabsorbent polymer (SAP) / hydrogel
  composite** bag that converts 90%-water dredge spoil into a **self-supporting block**,
  lifted out by **one 300 N linear actuator** on a screw jack.
- **The product:** A dewatering cell that turns muck into a solid cake a small mechanism
  can pick up, instead of a slurry that needs a pump truck.
- **Bengaluru problem it solves:** BBMP dredges lake and tank silt (Ulsoor, Kumara Swamy,
  Lalbagh, Yelahanka tank bunds) and GPRCs remove construction silt — all of it arriving
  at transfer points as **60–90% water slurry**. Handling it means dewatering plant, trucks,
  and a dry-weather window that Bengaluru's monsoon schedule does not always give.
- **Why BOTH are required:** Remove the SAP and the cell is a slurry: to lift it you need
  a **truck-mounted pump or a centrifuge** (₹/m³, off-site, weather-bound), not an
  actuator. Remove the actuator and the SAP just makes a **bigger wet mass** — nothing
  improves without a pickup mechanism. The material does the *structural* work: SAP at
  3–5% dry solids absorbs 30–50× its mass in water, and the swollen polymer gel plus the
  geotextile skin forms a cake with real shear strength — strong enough for a 300 N screw
  jack to lift and drop into a skip. **One actuator replaces a dewatering plant.**
- **Bill of materials:**
  - Sodium polyacrylate — sourced as **6 sanitary pads** (shredded) or 1 kg chemical
    supplier — ₹250
  - Nonwoven geotextile 200 GSM, 2 m² + HDPE liner — ₹700
  - Actuator 12 V 150 mm + brass screw jack + gantry frame (aluminium profile) — ₹1,400
  - Kettle, drill, paddle mixer, perforated drain crate — ₹900
  - ESP32 + load cell (HX711) + timer — ₹800
  - Silt/clay test medium, dyed water, buckets, lab scale — ₹400
  - **Total ≈ ₹4,450**
- **48-hour build plan:**
  - H0–H3: **Sourcing risk first** — buy 3–4 different SAP sources (pad-grade vs agri-grade)
    and test absorption. Pad-grade is fast but weak, agri is bulkier. This decides the design.
  - H3–H8: **Mix-ratio experiment.** Clay/silt slurry at 3 solids ratios, 3 SAP dosages.
    Measure: absorbed mass, cake height, and **the number the whole project depends on —
    peak lift force**, measured with a load cell + hand winch.
  - H8–H14: Build the lined cell: perforated crate + geotextile bag + drain layer.
    Verify the cake can be lifted whole.
  - H14–H20: Build the screw-jack lifter + gantry; load cell readout; ESP32 log.
  - H20–H26: **Benchmark:** N cycles of fill → absorb → lift → drop, logging mass in,
    mass retained by SAP, lift peak force, mass out. Plot force vs. cake mass.
  - H26–H32: Failure drill — over-absorb, under-absorb, partially lifted cake, and
    show the **gantry's force limit** refusing an over-loaded cake. Document the safe
    working envelope.
  - H32–H38: Silt variant (real dredge silt from a BBMP site if access allows; else a
    calibrated kaolin+organic mix) — show it still gels.
  - H38–H44: Cost-per-litre math on a board: **₹/100 L spoil dewatered**, versus a
    quoted truck-pump rate.
  - H44–H48: Report + demo reel + pack.
- **Data: free/open vs needing partnership:** All free/open — CPCB silt data, BBMP tender
  documents (public), your own CSV. **Partnership: 100 L of real dredged silt and a
  transfer-station bay** (material + access, not data).

---

### 5. KADABE — Auxetic Self-Levelling Patch Mould for Pavement Repairs
- **Integration:** 2-axis servo gantry driving a patching head + a **re-entrant auxetic
  honeycomb core** frame that squares and conforms to an irregular slab from **one
  central actuator**.
- **The product:** A reusable road-patch mould that one hydraulic/servo push levels and
  squares, instead of four hand-set screw jacks.
- **Bengaluru problem it solves:** BBMP/GPRC night pothole patching fails at the edges of
  a ragged cut — nobody squares the form, so the patch keys off. A crew sets 4–6 screw
  jacks by eye, which is exactly why the seal fails after the next downpour.
- **Why BOTH are required:** Remove the auxetic core and a rigid frame cannot be levelled
  by one point: pulling the centre square tells you nothing about the four corners, so
  you are back to **four independent jacks** (₹3,000–4,000, four alignment failure modes,
  and slow hand-setting). With a re-entrant core, **one central actuator driving a cone
  expands the frame perimeter uniformly** — the auxetic core *is* the levelling
  mechanism. Remove the gantry and you have a hand-carried mould, back to jack-setting.
- **Bill of materials:**
  - Birch ply + laser-cut auxetic core ribs (2× 8 mm ply core) — ₹1,400
  - 2 × NEMA 17 steppers + leadscrews + linear rails (gantry, 400 mm) — ₹1,800
  - 12 V linear actuator + cone expander, 300 N — ₹1,000
  - Asphalt/bitumen patch compound + 20 kg of mix — ₹600
  - Arduino/ESP32 + limit switches + level sensor — ₹700
  - Safety cone, grit, tamper, seal tape — ₹500
  - **Total ≈ ₹6,000**
- **48-hour build plan:**
  - H0–H6: Laser-cut the auxetic rib core; build the frame; **measure how square the
    frame stays when the cone is driven to 15/25/35 mm expansion.** Numbers first.
  - H6–H10: Assemble the 2-axis servo gantry over a 600×600 mm broken concrete slab
    (cast a deliberately irregular one).
  - H10–H16: Write the patch sequence: set frame → expand → verify squareness with
    callipers at 4 corners → dispense → strike off → lift.
  - H16–H22: Run 6 patches. Log corner-gap deviation vs. frame expansion.
  - H22–H28: **A/B against 4-screw-jack frames** at the same expansion. Measure time
    to square and corner-gap spread.
  - H28–H34: Water test: 20-minute soak + hose spray on one SAP-patched and one
    jack-patched edge. Log seepage.
  - H34–H40: Repeat the whole cycle 3× for durability; print time-to-patch table.
  - H40–H48: Report, demo reel, pack.
- **Data: free/open vs needing partnership:** Free — BBMP pothole complaint data and
  BBMP/GPRC public tender documents give the real failure rates. **Partnership: one
  permission to patch a small test lane near campus**, which is the single highest-risk
  ask — have a video-only fallback ready.

---

## Counterfactual audit

| # | Product | Delete material | Delete mechanism | Verdict |
|---|---------|-----------------|------------------|---------|
| 1 | SURTI | Need 4 servos + linkages per jaw, ₹1,400/jaw, IP65 problem unsolved | No path to surface | **Both load-bearing** |
| 2 | JALAGAMA | Slots drag the film straight back through; needs rake+hinge+crane | Just a filter | **Both load-bearing** |
| 3 | KADAMU | Need a damper + a rigid sole per foot; mass goes up | Cannot walk | **Both load-bearing** |
| 4 | GADDE-BLOCK | Back to a pump truck and a dry-weather window | Just a bigger wet mass | **Both load-bearing** |
| 5 | KADABE | Back to four screw jacks and four failure modes | Hand-setting, back to square-off | **Both load-bearing** |

## Shared build discipline
- Every concept ships with an **A/B comparator** built from the same rig (servo vs SMA;
  slotted vs auxetic; pump vs SAP; 4-jack vs 1-actuator). The comparator is the prize case.
- Characterise the material's property curve **in the first six hours**, before any frame
  is printed. All five concepts fail if the property is measured late.
- Entry ₹1,500 + travel. Budget cap **₹8,000**. Total build cost of all five: **₹31,250**.
- No dashboards, no CRMs, no wrappers. The output is a machine that measurably beats a
  conventional machine, with the curves to prove it.