# Lens 1 — Computer Vision & Imaging × Edge AI & TinyML

**Assigned pair.** A = Computer Vision & Imaging (monocular/depth/stereo, LiDAR, thermal, hyperspectral, IR, structured light, OCR, event cameras, mmWave radar imaging). B = Edge AI & TinyML (quantization/INT8, NPUs, microcontrollers, on-device inference, tiny transformers, wake-word/keyword-spotting, offline-first models, Frugal AI).

**Filter applied before writing.** Every candidate below was rejected unless, with the *other* technology physically removed, the product either stops existing or stops being economic. Each "Why BOTH are required" states the concrete failure, not the abstraction. No dashboards, no wrappers, no biologists, no heritage framing. Both parents are named, purchasable, specific implementations.

**Ranked best-first** on: who actually signs the PO, gross margin at 1,000 units, and whether the moat compounds.

---

## 1. ZONEGUARD  **TOP 2**

- **Integration:** TI **IWR6843AOP 60 GHz FMCW radar imaging module** (on-board patch antenna, per-azimuth range–Doppler occupancy map, immune to dust/steam/coolant mist) + **STM32N6** (Cortex-M55 + Neural-ART NPU) running an INT8-quantised tiny CNN classifier over the per-frame occupancy map.
- **The product:** A DIN-rail cell-safety controller that replaces a safety laser curtain and outputs a *permissive/mute* signal — it holds the machine running when stock passes and stops it when a person enters.
- **What existing product becomes better:** **Safety laser curtains / light guards** (₹35k–1.2L per zone). A laser curtain is a binary beam-break: a pallet of cartons on the conveyor breaks the beam, the press stops, the operator hits reset. Plants either live with 10–30 nuisance stops a shift or disable the guard (unsafe and illegal). ZONEGUARD sees *through* the stock and reasons about it.
- **Why BOTH are required:** Remove the **edge NPU** and a raw radar returns a single "presence in volume" bit — every carton on the conveyor trips it and the press stops 40+ times a shift; the plant removes it inside a week, and the incumbent laser is re-installed. The classification (`clear` / `material-pass` / `human-entry` / `fault` / `debris`) *is* the product, and a threshold cannot express it. Remove the **radar** and you are back to lasers or a camera: both fail in the exact environments this is sold into (steel dust, textile lint, weld spatter, coolant mist), and a camera additionally needs lens cleaning every shift, which is why these cells run lasers in the first place.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | TI IWR6843AOP 60 GHz FMCW radar module (SPI, integrated antenna) | 4,600 |
  | STM32N6 NUCLEO / NPU MCU board (M55 + Neural-ART) | 3,400 |
  | 2-channel force-guided safety relay + 24 V DIN PSU + e-stop loop interface | 2,900 |
  | IP66 enclosure, DIN-rail + mast mount, M12 connectors | 3,800 |
  | Mounting bracket kit for press / rolling mill / packer (4 variants) | 900 |
  | Harness, bring-up PCB, alignment jig, 72 h burn-in, assembly labour | 1,600 |
  | **Total per unit** | **₹17,200** |
- **Venture case:**
  - **Who buys:** Safety managers and maintenance heads at press, rolling-mill, packer and packaging-line plants (steel, cement, textile, FMCG) — plus OEM line builders. It is funded from *safety compliance capex*, which is never a discretionary "AI budget".
  - **Why:** Laser curtains generate nuisance stops that cost a press line ₹15k–₹40k per shift in lost output, and they are the single most commonly bypassed safety device in Indian discrete manufacturing. ZONEGUARD is cheaper than the curtain it replaces, installs in under 4 hours on an existing guard, and pays for itself on recovered uptime in week one.
  - **Unit economics:** ₹17.2k COGS → ₹72k–1.4L ASP per zone group. 76–88% gross margin. No re-guarding, no shutdown window; channel is the ~200 safety integrators who already own the customer relationship. PL e / SIL 2 certification is the first use of seed capital and is the first moat.
  - **Moat:** Safety certification *plus* a per-plant nuisance-stop dataset no competitor can collect, sold through integrators who will not dual-source once they have certified one model.
- **Build time to demo:** **90 h** — radar bring-up + STM32N6 INT8 pipeline 55 h, safety relay logic + local HMI 20 h, ruggedisation + two pilot trials 15 h.

---

## 2. SPINWARD  **TOP 2**

- **Integration:** **Prophesee GenX320 event camera** (1280×720 DVS, microsecond latency, 10–50 M events/s, records micro-motion no frame-rate camera can resolve) + **STM32N6 Neural-ART NPU** running an INT8 tiny transformer that collapses each event window into a 16-dim fault embedding, on-device, offline.
- **The product:** A clamp-on optical tool/spindle monitor that reads cutting-tool state, chip ejection and bearing wear without touching the machine.
- **What existing product becomes better:** **Contact accelerometers + FFT vibration analysers** (₹8k–40k per point, cabled, installed on a running spindle, and blind to what the edge is actually doing).
- **Why BOTH are required:** Remove the **event camera** and you are left with a 1 kHz accelerometer that reports *vibration*, not *tool state* — a dull-but-cool edge and a chipped-but-cooling edge produce the same spectrum. The camera resolves the µs-scale impact/flash pattern of tooth contact, chip ejection and coolant discontinuity at spindle speed, from 300 mm away, with no sensor on the rotating assembly. Remove the **edge NPU** and a 1280×720 DVS firing at tens of millions of events per second must be streamed somewhere: that is a 25 W GPU box per spindle, ~₹2L of hardware, and no way to retro-fit onto an existing machine. The INT8 tiny transformer is what turns a sensor into a ₹31k bolt-on.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | Prophesee GenX320 event sensor module (1280×720, µs latency) | 16,500 |
  | STM32N6 NPU MCU board + event capture/serialiser bridge | 3,600 |
  | 8 mm F1.8 lens, 850 nm IR illuminator, IR-pass filter | 2,100 |
  | Machined spindle-nose clamp mount with vibration isolator | 2,400 |
  | Machined aluminium housing with conduction heat path + 5 m shielded harness | 4,300 |
  | Bring-up PCB, INT8 compile/flash tooling, 72 h burn-in, assembly | 1,900 |
  | **Total per unit** | **₹30,800** |
- **Venture case:**
  - **Who buys:** Rotating-equipment OEMs and retrofit buyers in spinning mills (Coimbatore, Pune, Ahmedabad), CNC and grinder shops, and gear/pinion cutting lines — bought as a condition-monitoring add-on to spindles that are already installed.
  - **Why:** Spindle and tool failure is an unplanned stop with a ₹2–8L/hour line rate. Accelerometer condition monitoring is already owned by the incumbent vendors and is being tolerated, not trusted; a channel that shows the operator *the tool edge* is a category shift, and it is the only one that works on the 2,000-spindle machines that will never get a wired retrofit.
  - **Unit economics:** ₹30.8k COGS → ₹1.45–2.4L per monitored zone. ~78% gross margin. Clamp ships in a day, zero spindle downtime; paid out of the maintenance spares budget, not a new capex line.
  - **Moat:** A labelled failure-mode library in **event-camera space** that no FFT-based vendor can reproduce, plus OEM spec-in. Once the library is 1,000+ labelled events, a CNN competitor starts from zero and the incumbent cannot enter at all without a camera.
- **Build time to demo:** **110 h** — event capture + timestamp pipeline 30 h, STM32N6 INT8 model training and quantisation 40 h, mechanical clamp + housing 20 h, bench + live spindle trials 20 h.

---

## 3. SPECLINE

- **Integration:** **Line-scan hyperspectral imaging** — a 2048-px monochrome CMOS line sensor behind a motorised 8-position VIS–NIR linear filter wheel (450–1000 nm, 10 nm steps), giving 80-class reflectance spectra per product cross-section — + **K230 / RV1106-class NPU SoC** (1 TOPS INT8) running an INT8 tiny transformer over the full spectral vector.
- **The product:** An inline, 100%-inspection quality gate that classifies every unit on a conveyor by its reflectance spectrum and ejects rejects.
- **What existing product becomes better:** **Offline NIR / hyperspectral lab instruments** (₹6–18L per test point) plus the spot-sampling workflow buyers are forced into because the instrument cannot run at line speed.
- **Why BOTH are required:** Remove the **hyperspectral** channel and a plain RGB gate cannot see chloroform extractability, API degradation, coating-weight uniformity, or the spectral signature that distinguishes an adulterated spice lot from a clean one — the whole reason a QA head signs the PO disappears. Remove the **edge NPU** and the problem inverts: an 80-band reflectance vector per line is a compute problem, and a PC/GPU classifier cannot keep up with a 3-tonne/hour line, so the customer goes back to pulling 1 sample in 500 — which is precisely the pain we sold against. Line-scan + filter wheel is what makes the spectral vector *cheap*; the INT8 tiny transformer is what makes it *in-line*.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | 2048-px 12-bit monochrome CMOS line-scan sensor module | 9,200 |
  | Motorised linear filter wheel, 8-position VIS–NIR + servo | 8,400 |
  | K230 / RV1106-class NPU SoC module (1 TOPS INT8) | 2,600 |
  | Encoder + strobe + diffuse dome lighting rig | 4,100 |
  | IP65 stainless enclosure, rail mount, calibration-target jig | 8,300 |
  | Bring-up, Hg-Ar/Ne spectral calibration, assembly | 2,300 |
  | **Total per station** | **₹34,900** |
- **Venture case:**
  - **Who buys:** QA/QC managers at pharmaceutical formulation units, spice and botanical ingredient exporters, and seed/feed mills — where one rejected lot or one export rejection costs 50–500× the instrument price.
  - **Why:** These QA heads already pay for lab NIR but sample 0.2% of the line because the instrument takes 4 minutes per result. We are not selling "new analytics"; we are selling the move from *sample-based release* to *100% automatic release*, which lets them drop retained-sample testing and defend a release decision to a regulator.
  - **Unit economics:** ₹34.9k COGS → ₹2.4–4.8L per station. 85–93% gross margin. The recurring line is per-ingredient/per-formula calibration at ₹40–90k per year — it is not optional, so revenue compounds with each new SKU onboarded.
  - **Moat:** The per-customer spectral library plus the drift-corrected calibration pipeline. Once a customer's spec is expressed as a calibrated band model in our pipeline, switching costs equal a full re-validation trial — which for a pharma QA head is a quarter of work.
- **Build time to demo:** **130 h** — line-scan rig + encoder 35 h, filter wheel mechanics and spectral calibration 30 h, synthetic-seed to real-lot data collection 30 h, INT8 training and NPU deployment 25 h, enclosure + line trials 10 h.

---

## 4. THERMWATCH

- **Integration:** **320×240 radiometric thermal module** (NETD ≤ 50 mK, 30 Hz, per-pixel °C) + **STM32N6 NPU** running an INT8 tiny CNN on-device, offline-first, with an event spooling to microSD and only exceptions transmitted over LoRa/4G.
- **The product:** A solar-powered, unattended thermal camera that watches one asset 24×7 and reports only classified, actionable defects.
- **What existing product becomes better:** **Quarterly IR thermography surveys and drone-based clip-on inspections** — a certified thermographer plus a flight, every 90 days.
- **Why BOTH are required:** Remove the **thermal** sensor and it is an ordinary camera watching hot metal: no absolute temperature, no emissivity correction, and no view into an enclosed cubicle or a switchgear panel door. Remove the **edge NPU** and you need a 25–40 W GPU or a per-site gateway to run a CNN at usable frame rates — which means AC power, trenching, and a site IT project, so the "one technician covers sixty poles a week" economics evaporate and the unit costs 3× the panel and install. On-device classification is the only reason this is a ₹29k pole clip instead of a ₹1.2L site install.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | 320×240 radiometric thermal module (NETD ≤ 50 mK, 30 Hz) | 9,800 |
  | STM32N6 NPU MCU board + microSD event spool | 3,300 |
  | 6 W monocrystalline panel + MPPT charger + 6600 mAh LiFePO₄ | 4,600 |
  | IP66 enclosure, desiccant heater, solar shield, pole clamp | 7,100 |
  | LoRaWAN / 4G modem, antenna, surge protection | 2,200 |
  | Blackbody-reference calibration jig, burn-in, assembly | 2,000 |
  | **Total per unit** | **₹29,000** |
- **Venture case:**
  - **Who buys:** Solar IPP O&M contractors, DISCOM field teams, and cement/steel rotating-equipment maintenance units — anyone currently paying for a thermographer's visit schedule.
  - **Why:** Periodic IR surveys structurally give a failing bushing three more months of damage, and when the failure happens nobody has the evidence: insurers and OEMs routinely reject claims that lack continuous, calibrated, timestamped thermal records. We are selling the evidence, and the inspection is the hook.
  - **Unit economics:** ₹29k COGS → ₹1.9–3.6L per pole, plus ₹9k/yr SIM and cloud. 82–92% gross margin. Solar + battery means zero trenching and zero site AC — one technician services 60+ poles a week, which is what makes the field economics work at all.
  - **Moat:** A claim-ready, calibration-traceable thermal evidence format that insurers and OEMs accept, plus an accumulated hotspot-defect history. A competitor can copy the sensor and the enclosure in a quarter; they cannot copy three years of what actually failed on our fleet.
- **Build time to demo:** **70 h** — thermal module driver + radiometric pipeline 20 h, STM32N6 INT8 classification model and training data 25 h, solar/power and IP enclosure 15 h, one live pilot site 10 h.

---

## 5. DOCKTRACE

- **Integration:** **Global-shutter stereo depth pair** (2× 1 MP, 60 mm baseline, hardware-synchronised, for real-time dense depth under warehouse lighting) + **RV1106-class RISC-V NPU SoC** (1 TOPS INT8) running a quantised keypoint/pose network entirely on the device.
- **The product:** A dock-mounted sensor that measures, verifies and records every load that crosses a loading bay — and drives the dock leveller's interlock.
- **What existing product becomes better:** **Barcode/RFID warehouse management plus manual spot checks** — systems that know *what* was scanned but not *what was physically loaded*.
- **Why BOTH are required:** Remove the **stereo depth** and a single camera cannot tell a 40 mm pallet overhang from empty floor at night, in backlight, or against a black tyre sidewall — overhang, over-height and trailer-missed-load verification, the actual reason to buy this, all disappear into "we looked at the photo". Remove the **edge NPU** and every dock becomes a video stream to a server: dead zones in cold stores and basements, per-bay Ethernet, and a ₹18k-box-becomes-₹1.5L-install price jump. The quantised net is also what survives transparent stretch-wrap and mixed-SKU pallets, where any rule-based geometry check simply fails and the customer goes back to inspecting loads by eye.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | Global-shutter stereo pair, 1 MP, 60 mm baseline, hardware sync | 6,200 |
  | RV1106-class NPU SoC module (1 TOPS INT8, quad A55) + carrier | 3,100 |
  | IP66 DIN enclosure + 24 V PSU + hardwired relay to leveller/gate | 5,400 |
  | Industrial 4G dual-SIM router, wired backhaul | 3,300 |
  | Encoder, wheel/leg-reader inputs, harness and connectors | 1,600 |
  | Bring-up, INT8 compile pipeline, 7-day burn-in, assembly | 1,500 |
  | **Total per dock** | **₹21,100** |
- **Venture case:**
  - **Who buys:** 3PL and cold-storage dock managers, tyre/automotive inbound operations, and the warehouse-automation integrators who already specify dock hardware.
  - **Why:** Overhang and trailer-missed-load claims are settled by argument today and paid for by the carrier whether or not they are right. This is the only device that turns "the load was wrong" from a claim into a measurement — and the hardwired leveller interlock also removes the dock-injury risk that a 3PL's insurer already prices in.
  - **Unit economics:** ₹21.1k COGS → ₹72k–1.3L per dock. ~80% gross margin. Sells on recovered claim leakage first and labour second, so the ROI case does not depend on a headcount reduction the customer has to defend.
  - **Moat:** Dock-hardware OEM spec-in plus the audited-accuracy dataset that lets the device be sold as an arbiter in a carrier dispute. The real lock-in is the relay integration — once the leveller interlock is wired through us, we are in the safety path and cannot be silently swapped.
- **Build time to demo:** **85 h** — stereo driver + depth pipeline 25 h, RV1106 INT8 model training and quantisation 30 h, relay interlock and enclosure 20 h, one live dock trial 10 h.

---

## Filter notes

- **Both parents named in every concept** — no concept survives on "AI dashboard for X": each ships as a discrete box with a relay, a lens/radar, or a sensor head on an asset.
- **Counterfactual failures are physical, not rhetorical.** In 4 of 5 the removal of one parent changes a cost line by 3–6× or a latency class, not a feature list.
- **Weakest link, stated honestly:** #5 DOCKTRACE has the most crowded competitive set (WMS/ANPR vendors will copy it) and its moat is the weakest of the five. #3 SPECLINE has the best gross margin but the slowest sales cycle and the heaviest validation burden per customer.
- **What is deliberately not here:** LiDAR and structured-light variants were cut because the same fusion (depth imaging + TinyML) produced three near-identical logistics concepts, and a single `OPTICAM` family would have read as one idea wearing five names.