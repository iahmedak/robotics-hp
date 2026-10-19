# Lens 1 — Computer Vision & Imaging × Energy & Power
**Citi-Zen 2.0 · Bengaluru · Build-wize / Nature-based Bengaluru · 2–5 members · ₹799**

Tech pair (both load-bearing in every concept below):
- **A = Computer Vision & Imaging** — RGB/multispectral, thermal IR, depth/stereo, LiDAR, drone imagery, edge CV
- **B = Energy & Power** — PV, thermoelectric (TEG), Li-ion / LiFePO4, supercapacitors, heat pumps, PCM thermal storage, kinetic harvesting

Counterfactual rule applied: **if you removed A the device has no input; if you removed B the device has no power or no physics.** Anything where a ₹20 thermistor could replace the camera was rejected.

---

### [1]. SURYA-DHULA  ✅ **TOP 2**
- **Integration:** Per-string **RGB multispectral + micro-thermal camera array** (MLX90640 + OV5640/ESP32-CAM over each PV group) doing soiling-ratio imaging and hot-spot **classification** (loose dust vs. conductive soot vs. organic droppings) → **per-string DC string optimisers + LiFePO4 buffer** that electrically bypass dirty/hot strings and power a low-water cleaning head (electrostatic brush + air-knife) triggered by the camera.
- **The product:** A clip-on rooftop-PV retrofit node: 1 camera per 4 strings, a 4-channel string optimiser on the DC bus, and a water-frugal cleaning head, all fed by the array's own buffer battery.
- **Which track / which special award it targets:** **Track 1 — Build-wize.** Explicitly aimed at **Best Sustainable Infrastructure Innovation** (and secondarily Impact Award). Bengaluru = dry-season dust episodes + severe water scarcity, so "clean more often" is not the answer.
- **Why BOTH are required:** The camera output is the *only* input to the optimiser (it decides which strings get bypassed) and the only trigger for cleaning — the system has no timer, no schedule, no sensor fallback by design. Remove the imaging and you have a fixed-schedule cleaner, which in a dust-event city either wastes scarce water or leaves 3–9 %/month on the table. Crucially, a temperature probe alone cannot do this job: it returns a *scalar* per string, whereas the required output is a **2-D soiling-type field** (uniform mineral dust is harmless; conductive/biological deposits create hot spots). Remove the DC optimiser + buffer and you have a camera photographing a roof. Both parents break; neither survives alone.
- **Bill of materials:**
  - 1× MLX90640 24-pixel IR array board — ₹4,200
  - 1× OV5640 + ESP32-CAM node (or 1× Pi Zero 2 W + CSI cam, shared) — ₹6,500
  - 4-channel string optimiser PCB (4× MPPT buck + 16× N-MOSFET, custom board) — ₹2,400
  - 1× 12 V 7 Ah LiFePO4 buffer + BMS — ₹6,200
  - 12 V DC blower + electrostatic brush + solenoid micro-valve — ₹3,600
  - 100 Wp 12 V panel + 10 A MPPT — ₹2,600 (junction box for the node's own power)
  - 2× poly-Si reference cell + 1× shunt + 1× INA219 current sense — ₹1,500
  - IP65 enclosure, IP-rated glands, MC4, cable — ₹2,000
  - Consumables (brush bristles, seal, 2 L water tank) — ₹1,200
  - **Total ≈ ₹30,200** (≈ ₹22,000 if the Pi Zero is shared / borrowed)
- **Build time:** **110 hours** (2 members) / **80 hours** (4 members split: imaging, power electronics, mechanical, test rig)
- **Measurable impact claim:** *Soiling loss is not taken from a paper — the team measures it in week 1 with the IEC 61724-1 reference-cell method, then reports "Wh lost to soiling, baseline vs. post-autocorrect over 21 days."* Target: **≥50 % recovery of the measured monthly soiling loss** (published Indian dry/dusty-site losses run ~3–9 %/month; Bengaluru's construction-dust season is at the top of that band). A judge can verify with one ₹900 reference cell and a weekly `Wh = V·I·h` log on the string optimiser's UART.

---

### [2]. TAAP-TEG
- **Integration:** **Thermographic IR camera** mounted on the exhaust duct of a DG set / chiller / kitchen exhaust mapping the **ΔT field** across the TEG bank → **TEG strings + variable-speed DC fan / duct damper + DC-DC boost harvesters** that reconfigure the thermoelectric strings (series-parallel) onto the hottest rows and pre-cool them with forced airflow.
- **The product:** A bolt-on exhaust-heat harvester for IT-park and commercial back-of-house exhausts: a finned TEG cassette, an IR sensor pod, and an adaptive harvest controller that turns waste heat into usable watts.
- **Which track / which special award it targets:** **Track 1 — Build-wize.** Explicitly aimed at **Best Sustainable Infrastructure Innovation**. Bengaluru IT parks run DG + chillers year-round and every kWh harvested is a kWh not drawn.
- **Why BOTH are required:** TEG power scales **superlinearly with ΔT**, so the entire value of the device is reading *which rows are hot*, not what the average is — and it cannot be inferred from electrical telemetry because a TEG's own voltage collapses when it is too hot or too cold. The IR camera supplies that spatial field; without it the controller must default to a fixed series string governed by the mean ΔT, which is dragged down by fouled, bypassed or stagnant rows. The TEG bank is equally load-bearing: it is the *power source for the camera pod, the fan and the DC-DC stage* — the whole sensing-and-actuation loop runs on the waste heat it recovers. Remove either and there is no product: no camera = no adaptive harvest; no TEG = no heat-capture and no power to run anything.
- **Bill of materials:**
  - 20× 40 × 40 mm TEG modules (ΔT-rated, ~ΔT 250 K capable) — ₹11,000
  - 4-channel programmable TEG string selector (bipolar MOSFET bank + 5 A boost) — ₹3,800
  - MLX90640 + wide-angle IR lens on a duct rail — ₹5,600
  - 6× 12 V DC fan (2× 120 mm duct + 4× 40 mm heatsink) + PWM driver — ₹2,400
  - Aluminium fin cassette, cold-side plates, spring-loaded thermal clamp — ₹4,200
  - ESP32 + 4-ch current/thermocouple logging — ₹2,900
  - 3 kW resistive load bank + a centrifugal blower rig (stands in for DG exhaust if no generator access) — ₹9,500
  - 12 V 7 Ah LiFePO4 buffer + BMS — ₹3,200
  - Enclosure, wiring, safety guards — ₹2,700
  - **Total ≈ ₹45,300** (≈ ₹33,000 if a real DG exhaust is available from a college generator room or a hotel, dropping the load bank)
- **Build time:** **95 hours** (4 members: TEG cassette, controller PCB, IR optics, load-bank rig) / **140 hours** for 2 members
- **Measurable impact claim:** *"Wh harvested per kWh of exhaust thermal energy, adaptive-IR topology vs. uniform fixed-string topology on the identical cassette, run for 2 hours each."* Because ΔT-TEG output is superlinear, targeting the top-30 % ΔT rows should deliver **≥25 % more Wh/kWh_th** than a uniform string — and the IR image must show that band exists. Verifiable with a ₹900 watt-hour meter and one screenshot of the ΔT map with the selected rows highlighted.

---

### [3]. NEER-TARA  ✅ **TOP 2**
- **Integration:** **Over-water thermal + RGB multispectral imaging** from a floating mast measuring surface-temperature stratification, algal greenness and turbidity of a stratified city lake → **floating PV array + Li-ion battery + brushless solar pump + variable-speed aerator** whose duty cycle and depth are set by that imaging (oxygenate the hypolimnion when the thermocline is strongest; stop during daylight algal blooms).
- **The product:** A solar float-aerator that breathes a lake on a camera's instruction instead of a clock's.
- **Which track / which special award it targets:** **Track 2 — Nature-based Bengaluru.** Explicitly aimed at **Best Nature Based Solution** (and secondarily Impact Award). Targets a BBMP lake (Bellandur / Hebbal / Ulsoor class) where night-time algal bloom and dawn dissolved-oxygen crashes are the actual failure.
- **Why BOTH are required:** The camera output *is* the control law — a fixed aeration timer provably fails, because the dissolved-oxygen crash time drifts with the thermocline, and daytime aeration actively worsens blooms by stripping CO₂. Point sensors cannot substitute: they need a fixed mounting depth, and the whole problem is that the useful aeration depth (the hypolimnion) **moves** with season — you must see the layer, not a point. Remove the imaging and you are back to a ₹3,000 bubbler with a timer, which is what is already failing in the lake. Remove the energy hardware (PV + battery + pump) and the camera has nowhere to draw from — a 24 V camera mast on a lake has no grid within 500 m, and the sensor must run through every night to be worth anything. Each parent is a hard precondition for the other.
- **Bill of materials:**
  - 150 Wp marine/float PV panels (2× 75 Wp) + MPPT — ₹5,800
  - 12 V 20 Ah LiFePO4 + BMS + IP67 junction box — ₹11,000
  - 24 V brushless air-lift/bubble pump (≈ 60 L/min) + 1.5 kW solar pump controller — ₹7,400
  - MLX90640 IR array (surface stratification) — ₹4,200
  - ESP32-CAM + OV2640 (greenness/turbidity field) — ₹2,300
  - 600 mm HDPE float module + 304SS frame + 40 kg counterweight ballast — ₹8,200
  - Aeration manifold, check valves, 1.5" PVC plumbing — ₹3,600
  - Waterproofing, anode, anti-fouling, IP68 connectors — ₹2,900
  - **Verification rig:** dissolved-oxygen probe + 10 L Winkler titration kit (independent DO check, do not let the build depend on it) — ₹4,200
  - Lab oxygenation trials (a 200 L bucket + aquarium air pump, to establish the DO-curve first) — ₹2,600
  - **Total ≈ ₹52,200** (≈ ₹40,000 with a borrowed DO probe and college lab access)
- **Build time:** **90 hours** (4 members) / **135 hours** (2 members). Add 40 hours of on-site lake access and permits.
- **Measurable impact claim:** *A/B on the same lake, same fortnight:* run **Week 1 on a fixed timer** and **Week 2 on camera guidance**, logging dissolved oxygen with the independent probe at dawn (05:30) and at dusk. Target: **dawn DO held above 5 mg/L on ≥5 of 7 nights in the imaging week vs. ≤2 of 7 in the timer week**, plus **≥30 % lower aerator runtime** because daytime/over-clear hours are suppressed. Judges can re-run the Winkler titration themselves on one trip.

---

### [4]. THERMAL-PLAY ("LEYA Kit")
- **Integration:** A **thermal IR camera as the state-of-charge instrument for a segmented phase-change-material (PCM) thermal battery**, run off a small PV + Li-ion pack in a classroom.
- **The product:** A ₹12,000 classroom kit where a slab of salt PCM is charged by solar during recess, plate-state is read off the IR camera as a visible isotherm plateau, and it runs the evening light-load with no grid and no battery inverter.
- **Which track / which special award it targets:** **Track 1 — Build-wize.** Explicitly aimed at **Best School Innovation** — and it is also the strongest *teaching* artifact in the set, because the 55 °C melting plateau is physically visible on the IR image as a flat isotherm band that students can measure with a ruler.
- **Why BOTH are required:** PCM hides its own state of charge by design — that is the entire point of latent heat, an isothermal plateau at the melting point where a thermostat sees nothing. On a **segmented 4-plate bank** a single box thermocouple returns the *average* of four plates and therefore the wrong charge level, while IR resolves **which plates are charged, which are bypassed, and which are still liquid**. Remove the camera and the "thermal battery" degrades into an unmeasurable hot box that you charge on a guess and discharge blind. Remove the PCM/PV and the camera is a €40 thermometer looking at a phase-change demo with no energy stored at all. Each one without the other is a physics demo, not a device.
- **Bill of materials:**
  - MLX90640 IR array + 25° lens — ₹4,200
  - ESP32-CAM + OV2640 (teaching record + chart logging) — ₹2,300
  - 2× 6 V 1.5 W polycrystalline PV + 10 A MPPT — ₹1,400
  - 2× 18650 cells + holder + BMS + 5 V boost — ₹1,300
  - 4× copper plate (100 × 100 × 2 mm) + 1× HDPE insulated box + PU lid — ₹2,100
  - 1.5 kg Rubitherm-type PCM (or anhydrous salt/Glauber's mix, school-lab grade) — ₹2,400
  - NTC + MAX31855 breakout (control + independent verification) — ₹1,200
  - LED lamp + fan load mock (the "evening load") + energy meter — ₹1,100
  - FDM-printed cradles, handle, labels, safety enclosures — ₹1,500
  - **Total ≈ ₹17,500** → **₹12,000 build** (team-owned IR reused from concept 1/2, or 2-member teams buy the ₹4,200 array)
- **Build time:** **70 hours** (2 members) / **50 hours** (4 members). Includes a 3,000-cycle PCM charge/discharge validation over 5 days.
- **Measurable impact claim:** *"How many classroom-evening lighting hours does one solar hour buy, with versus without the PCM?"* Target: **≥3 h of LED lighting per kWh stored**, with the IR image showing the 55 °C plateau onset and end as the charge/discharge receipt. The teaching payoff is separately verifiable: a student must predict plateau duration within ±10 % before running the kit.

---

### [5]. PUNAR-CELL
- **Integration:** **Thermal IR thermography under a controlled charge pulse** used to sort retired EV **LiFePO₄** modules by internal imbalance → **BMS re-grouping + per-pack inverter firmware** that converts those graded packs into a shared community storage unit for a colony with 3-hour outages.
- **The product:** A thermography-based grading bench for dead auto/ebike battery modules, feeding a 5 kWh second-life storage that only exists because the modules could be graded.
- **Which track / which special award it targets:** **Track 1 — Build-wize.** Explicitly aimed at **Impact Award** — Bengaluru has a very large EV two-wheeler population, a real second-life cell waste stream, and lakhs of households with unreliable supply.
- **Why BOTH are required:** The image is the *sort key*. A surface thermal field under a known 0.2 C charge pulse exposes the internal ΔT signature of a weak cell or a corroded busbar that the terminal voltage never reveals — and without it the pack is the usual all-cells-identical gamble (scrap it, or trust it equally and accept a fire risk and a sudden 60 % capacity cliff). The energy hardware is equally constitutive: **the graded class becomes the pack's usable capacity and the firmware's per-pack current limit**, so the grade is not a report — it is the parameter that sets kWh and C-rate. Remove the imaging and you cannot assign a class, so the pack has no capacity claim at all; remove the LFP reuse/BMS and you have a thermography service with no product.
- **Bill of materials:**
  - 2× MLX90640 wide-angle IR arrays (dual view, top + side of the cell rack) — ₹8,400
  - ESP32-CAM ×2 for visual classification (swelling, casing deformation, terminal corrosion) — ₹4,600
  - Programmable 60 V / 20 A charge-discharge fixture + precision voltage sense (0.02 % class) — ₹13,000
  - 48 used LFP 18650 cells (procured at scrap value from a Bengaluru EV workshop — ≈ ₹110/cell) — ₹5,300
  - 4× 4S BMS boards + pack busbars + nickel strip — ₹4,800
  - 5 kWh inverter/charger with per-pack current profile support — ₹6,500
  - Fire enclosure, thermal cutouts, 2S fuse bus — ₹2,900
  - Fixtures, camera rail, black-body calibration plate — ₹3,200
  - Shared laptop + logger (existing) — ₹0
  - **Total ≈ ₹48,700**
- **Build time:** **105 hours** (4 members: thermal rig, charge fixture, cell sourcing + safety, firmware/inverter) / **150 hours** for 2 members.
- **Measurable impact claim:** *"Sort accuracy and recovered capacity."* Run a 0.2 C reference capacity test on 10 randomly chosen cells the camera graded, blind: target **≥80 % correct class assignment** and **≥2.5× the usable Wh/kg** of a naive all-pack build, with zero thermal events over a 30-cell 200-cycle soak. Then publish the colony-facing number: **kWh delivered per ₹ of scrap cell value**, which judges can recompute from the cell invoice.

---

## Ranking rationale

| # | Concept | Track | Special award targeted | Fusion strength |
|---|---|---|---|---|
| 1 | SURYA-DHULA | Build-wize | Best Sustainable Infrastructure Innovation | Camera output is the sole control law; scalar sensors provably cannot classify soiling type |
| 2 | TAAP-TEG | Build-wize | Best Sustainable Infrastructure Innovation | TEG output is superlinear in ΔT → spatial field is mandatory; TEG powers its own sensor loop |
| 3 | NEER-TARA | **Nature-based** | **Best Nature Based Solution** | Point sensors can't track a moving thermocline; the camera *is* the aeration schedule; solar powers the sensor |
| 4 | THERMAL-PLAY | Build-wize | Best School Innovation | PCM hides SOC by design; segmented bank needs a field, not an average |
| 5 | PUNAR-CELL | Build-wize | Impact Award | Thermal image under load pulse is the only sort key; grade sets the capacity claim |

**Coverage check:** 1 Nature-based Bengaluru concept (NEER-TARA), 4 Build-wize; all four ₹4,000 special awards are targeted by name; every concept has a measurement a judge can re-run, and none of the five can be reduced to "an AI dashboard for X."