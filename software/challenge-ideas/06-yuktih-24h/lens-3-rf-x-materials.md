# Yuktih 24-Hour Hackathon — Lens 3: RF & Wireless × Advanced Materials & Structure

**Tech pair A (RF):** UWB, LoRa/LoRaWAN, NFC, mmWave, SDR, RFID, GNSS/GPS, Wi-Fi sensing, BLE, Zigbee, phased-array radar
**Tech pair B (Materials):** shape-memory alloys, hydrogels, metamaterials, aerogels, mycelium composites, self-healing materials, graphene/CNT, transparent ceramics, bio-composites, 3D-printed lattices

**Design rule applied:** every concept below fails if either parent technology is removed. Where the RF side only "carries data," that is called out and the concept is reframed so RF is doing power/ID/sensing work, or the concept is rejected.

**India short-notice parts reality check used throughout:** no SMT, no reflow, no 3D-print-on-demand queues, no RF cert lab. Everything is hand-soldered, module-based (LoRa SX1276/SX1262 breakout ~₹450–900, ESP32 ~₹450, UWB DWM3000 module ~₹1,600–2,200, NFC PN532 ~₹400, PN5180 RFID reader IC ~₹250, GNSS NEO-M8N ~₹350), sourced from Robu/Amazon.in/Electronicscomp. Materials are locally procurable: SS316 strip from a scrap dealer, mycelium from a local bakery/mushroom grower's spent substrate, hydrogel from PVA + borax, aerogel from silica source, 3D-printed lattices on a college FDM printer.

---

### TOP 2 — 1. LOADBEAR
- **Integration:** NFC (PN532) as the interrogation/power field + mycelium-composite panel with self-healing mycelial binder
- **The product:** A structural wall/roof panel tile whose load-bearing body IS the NFC-tag substrate — a phone tap reports structural moisture load, flood ingress, and panel integrity with zero electronics in the panel.
- **Why BOTH are required:** Remove mycelium and you are left with a bare NFC sticker on a brick — the NFC reads an ID, it does not sense, and the panel is a conventional dead mass that cannot report its own loading. Remove NFC and the mycelium panel is a nice biodegradable brick that carries ZERO data and ZERO energy; the "sensing" would need a battery, an MCU, and a LoRa node, which is a 3-day build and a permanent e-waste component. The magic here is that the *material* is the antenna substrate and the *material's dielectric/geometry is the sensor*, and the phone's NFC field is the entire power and read channel. Counterfactual: neither removal leaves a working product.
- **Sustainability claim:** Panel is 100% biomass composite (wheat straw substrate + mycelium *Pleurotus* binder grown in-situ 9 days), compressive strength target ≥ 3 MPa (measured with a phone-load rig + spring scale), water absorption < 22% by mass with 48-hour self-heal recovery of ≥ 85% of flexural strength after damage. Zero PCB in the leaf panel — NFC is the only "chip" and it is removable at end-of-life for reuse.
- **Bill of materials:**
  - Wheat-straw / husk board, 30×30×3 cm — scrap agri-waste, ₹0 (free from local mill, ₹0–150 transport)
  - Mycelium starter (*Pleurotus ostreatus*) — free from a local baker/mushroom grower, ₹0–80
  - PVA glue + borax or casein binder — ₹120
  - 13.56 MHz NFC tag inlay (NTAG213, 14 mm) — ₹22 each ×10 = ₹220
  - Flat copper trace/electrodes routed to the inlay terminals on the panel face — ₹180 (copper foil + acrylic etchant)
  - NFC "sensor tag" (a programmable NTAG216-E or an I²C sensor tag) for one demo panel — ₹650
  - ESP32 + SX1262 LoRa breakout (for the greenhouse/apartment receiver demo only) — ₹1,250
  - PN532 NFC reader module for the panel-reader device — ₹400
  - Water tank, silicone moulds, gloves, seed trays — ₹400
  - 3D-printed NFC-to-load-cell jigs / enclosure for the reader — filament + ₹0
  - **Total ≈ ₹3,400–4,200**
- **24-hour build plan:**
  - **Hour 0–3 (evening):** Cut 6 straw blocks; inoculate mycelium culture. This is the long pole — mycelium needs 5–9 days. **CRITICAL REALISM NOTE:** you cannot grow mycelium in 24h. **The 24-h build grows a FAST mycelium substitute:** a *Pleurotus* spawn-block slurry in a mould, or a pre-inoculated straw block sourced in the morning. Documented honestly as "mycelium composite at agar-block stage, industrial growth curve attached." Start the PN532 + LoRa wiring in parallel tonight.
  - **Hour 3–8 (night 1):** Hand-solder PN532 reader + ESP32/SX1262 receiver. Get NFC tap → LoRa packet → serial monitor working with a hardcoded "panel #3, load 412 kg" before any material is involved. This de-risks the whole build.
  - **Hour 8–14 (night 2):** Embed NFC inlays into straw panels, route copper electrodes to the inlay, pour the mycelium/spawn slurry into moulds, cure.
  - **Hour 14–20 (night 3):** Load-test rig (spring scale + threaded rod), flood test (spray bottle), write the reader firmware to actually sense the embedded resistance change.
  - **Hour 20–24 (night 4 / dawn):** Demo: flood a panel, watch the tap report higher "moisture-load" and confirm self-heal over 48h via timelapse. **Cut if behind:** drop the LoRa receiver, keep NFC-only (still wins — zero power). **Cut if behind harder:** skip real mycelium, use casein/PVA bio-composite and honestly relabel.
- **Why it wins here:** It is the only concept where a phone alone powers and reads a real structural material, and it is 90% biology-free, low-embodied-carbon, and fully repairable (swap the NFC, keep the wall).

---

### TOP 2 — 2. COLDCHAIN
- **Integration:** NFC energy-harvesting write + shape-memory alloy (Nitinol) actuator on a bio-based composite pallet/collar
- **The product:** A reusable shipping-pallet collar that harvests its own NFC power from a phone tap and drives a Nitinol "clamp-release" that mechanically opens the pallet for inspection without ever replacing a battery.
- **Why BOTH are required:** Remove the shape-memory alloy and you have a passive NFC-labelled collar — the NFC tag is an ID sticker and the collar does zero sensing or actuating, so the "smart" claim collapses. Remove NFC and you must ship the Nitinol actuator with a coin cell or a harvested solar cell — a permanent battery in every pallet collar is a 10,000-unit e-waste problem and an unbudgetable 3-day build. The NFC field is not decorative: it is the ONLY power source, and the Nitinol spring is the ONLY way to actuate without an actuator motor (which would need its own battery). Counterfactual is clean.
- **Sustainability claim:** 100% reuses: the Nitinol latch has > 10⁵ actuation cycles (fatigue-claimable), the NFC tag is harvestable, and the composite collar is jute-fibre + bio-epoxy (renewable, biodegradable matrix). Payback claim: the collar replaces single-use plastic pallet straps; mass of one collar = 140 g vs 90 g for a disposable PP strap but survives 200+ trips.
- **Bill of materials:**
  - Jute-fibre cloth + bio-epoxy (or PLA-fibre + epoxy) for collar shell — ₹300
  - Nitinol strip, 1.5 mm × 100 mm (from a dental-orthodontic supplier or medical reseller) — ₹650 (this is the hardest part to source; order the morning of, or a local orthodontic clinic has offcuts)
  - NTAG213 NFC inlay + a small NFC-power energy-harvesting front-end (or a cheap NFC-power-to-3V3 boost board) — ₹450
  - Supercapacitor 0.1 F (for the Nitinol actuation charge) — ₹120
  - ESP32-C3 (sensor aggregation + BLE) — ₹280
  - NTC + a thin strain strip for load sense — ₹90
  - Hand tools, jig for Nitinol heat-set (butane torch / heat gun), epoxy — ₹350
  - 3D-printed Nitinol guide-bushings and the actuator housing — filament + ₹0
  - **Total ≈ ₹2,300–3,100**
- **24-hour build plan:**
  - **Hour 0–2:** Order Nitinol first thing (call orthodontic suppliers). Fallback if no Nitinol by hour 6: a heat-set PLA/memory-wire spring is NOT allowed (fails counterfactual) — so the fallback is to re-scope to a mechanical cam instead. Flag this loudly.
  - **Hour 2–6:** Build the NFC-power → supercap → Nitinol actuation chain on a breadboard with a raw Nitinol strip and a heat gun. This is the riskiest 4 hours of the build. Get a cold finger twitch by hour 6 or the actuator concept is dead.
  - **Hour 6–12:** Lay up the jute-composite collar shell, cut the Nitinol into the latch geometry.
  - **Hour 12–18:** Wire NFC tap → BLE phone readout of the internal NTC (pallet temperature). Embed the collar.
  - **Hour 18–24:** Demo: tap phone to open (actuate) collar, tap again to read internal temp, show no battery anywhere. **Cut if behind:** drop BLE, NFC-only tap-to-read + tap-to-open. **Cut if behind:** simplified collar to a single clamp jaw.
- **Why it wins here:** Battery-free NFC harvesting plus a fatigue-rated mechanical actuator is the rare project where "sustainability" is a *number* (0 batteries) and not a vibe.

---

### 3. PHASEFENCE
- **Integration:** Wi-Fi sensing (ESP32 CSI) as the excitation/detection layer + 3D-printed lattice metamaterial panel with a tunable auxetic geometry
- **The product:** A non-powered structural panel whose 3D-printed auxetic lattice geometry is tuned so that a person leaning / a forklift passing changes the panel's RF channel enough for off-the-shelf Wi-Fi CSI to read "this wall is being overloaded" with no sensor, no battery, and no wiring.
- **Why BOTH are required:** Remove Wi-Fi sensing and you have a beautiful auxetic wall with no sensing at all. Remove the auxetic lattice and you are back to a solid wall — Wi-Fi CSI sees nothing because there's no RF-scattering structure to distort the multipath; you would need powered sensors glued on, which is a 3-day build plus permanent electronics. The lattice's *geometry* is what couples human/load into the RF field. Counterfactual is clean.
- **Sustainability claim:** 100% recycled-PETG or recycled-wood-fill printed lattice, load-bearing (auxetic means it stiffens when compressed — measurable peak-load with a spring scale), and 100% electronics-free in the leaf (the Wi-Fi sensing is done by existing infrastructure, not by the panel). Embodied energy = filament only.
- **Bill of materials:**
  - Recycled PETG / PLA filament, 2 kg — ₹450
  - ESP32 ×3 (one TX/RX pair + one CSI sniffer) — ₹1,300
  - 5 GHz router (existing) — ₹0 (borrow) / ₹1,200 if buying
  - FDM printer time (borrow a college printer; 8–12 h for 3 panels) — ₹0–200 service
  - Calipers, spring scale for load test — ₹400
  - **Total ≈ ₹2,200–3,400** (mostly the 3× ESP32)
- **24-hour build plan:**
  - **Hour 0–4:** Get Wi-Fi CSI capture running (ESP32 CSI sniffer firmware is open-source; flash 3 boards). Confirm a human lean changes CSI amplitude in an empty room. **This is the kill-or-live gate.**
  - **Hour 4–12:** Design and start 3D-printing 3–4 auxetic lattice panels (start printing immediately — FDM is the second long pole after the code).
  - **Hour 12–18:** Assemble panels, run the lean/load test, calibrate a threshold that distinguishes "lean" from "no lean."
  - **Hour 18–24:** Demo: lean on the far wall, phone dashboard shows the CSI scatter plot changing with load. **Cut if behind:** reduce to a single panel and one ESP32 pair. **Cut if behind harder:** drop the auxetic geometry for a plain perforated panel (still detects, but flag it weakens the counterfactual).
- **Why it wins here:** Pure passive, zero-powered, zero-waste sensing that reuses the Wi-Fi already in the building — an honest "sustainability is the point" demo.

---

### 4. CRYO-MARK
- **Integration:** mmWave/UWB ranging (DWM3000) for positioning + transparent ceramic (or aerogel) lens window for a pointer's optics
- **The product:** A reusable produce-crate locator: a transparent-ceramic (or aerogel) window lets a low-power UWB beacon's field pass through while mmWave measures crate stack depth — a "smart pallet" that reports cold-chain position with no visible electronics.
- **Why BOTH are required:** Remove UWB and you have a beautiful transparent window on a crate with no idea where it is. Remove the transparent ceramic/aerogel and the UWB beacon's field is blocked by the crate wall — you would need to drill a hole and expose the module, ruining the "seamless" build and adding a manufacturing step. The transparent material is *functionally* required to let mmWave through a sealed crate. Counterfactual is clean, but this concept is ranked below the top two only because sourcing transparent ceramic or a proper aerogel slab in 24 h in India is genuinely hard (see risk note below).
- **Sustainability claim:** Reusable crate with embedded, non-removable-by-accident UWB tag; the transparent ceramic/aerogel is a single reusable optic, not a per-shipment consumable. Cryogenic insulation stays in the crate, not in the tag.
- **Bill of materials:**
  - DWM3000 UWB module ×2 (anchor + tag) — ₹3,800
  - Transparent ceramic tile (alumina, 1 mm) or silica aerogel slab — ₹1,200–2,500 (SOURCES THIS MORNING OR SUBSTITUTE a thin acrylic sheet and honestly relabel)
  - ESP32-C3 + small LiPo — ₹450
  - Potted electronics (epoxy + a plastic puck) — ₹150
  - Reusable crate (borrow / DIY from reclaimed pallet wood) — ₹0–800
  - **Total ≈ ₹5,600–7,700**
- **24-hour build plan:**
  - **Hour 0–2:** Source the transparent ceramic/aerogel FIRST (this is the highest-risk part). If not found by hour 4, substitute thin acrylic and mark the ceramic as a "next iteration" slide.
  - **Hour 2–6:** Get two DWM3000 boards ranging in cm accuracy (firmware is fiddly; this is the code long pole).
  - **Hour 6–14:** Pot the tag, build the crate stack, assemble.
  - **Hour 14–20:** Range-test through the ceramic with crates stacked; confirm the ceramic doesn't kill the mmWave link (a real test that could fail).
  - **Hour 20–24:** Demo: move a tagged crate in a cold-store mock, watch position update. **Cut if behind:** two tags only, no stack.
- **Why it wins here:** Nice, but ranked 4th because the transparent-ceramic supply chain is the one part that can kill a 24-h build at hour 4.

---

### 5. MYCELGRID
- **Integration:** Zigbee/2.4 GHz (CC2530 / ESP32-Zigbee) mesh + 3D-printed mycelium-composite sensor substrate with printed-graphene resistive traces
- **The product:** A soil-moisture sensing mesh where each node is a mycelium-composite puck with screen-printed graphene-Ag resistive traces — the mycelium holds the shape and holds moisture (acting as the hygroscopic dielectric), the graphene traces change resistance with moisture, and the node is powered by a single CR2032 harvested/reused cell for years.
- **Why BOTH are required:** Remove the graphene traces and the mycelium puck has no electrical readout at all. Remove the mycelium/graphene composite and you are left with a discrete capacitive soil sensor on a PCB — a plastic-and-silicon node that doesn't biodegrade and doesn't use a bio-composite substrate. The mycelium+graphene layer IS the sensor's sensing element and its structural substrate. Counterfactual is clean.
- **Sustainability claim:** Node substrate is 100% biodegradable mycelium composite (the only non-degradable part is a single CR2032 cell and a 20 g PCB, both standard-recyclable); lifetime target > 5 years on one cell; the whole node costs under ₹700 to build and is designed for repair (cell + PCB are both field-swappable).
- **Bill of materials:**
  - Mycelium composite pucks (grown during the term before, or spawn-block slurry — see realism note) — ₹0 material, ~₹200 in moulds
  - Graphene nanoplatelet ink (small jar) — ₹600
  - Silver-paste electrode pads + printed traces — ₹300
  - CC2530 / ESP32-Zigbee node — ₹650
  - CR2032 + holder — ₹60
  - Moisture bath (two beakers, soil, sand) for calibration — ₹200
  - **Total ≈ ₹2,000–2,600**
- **24-hour build plan:**
  - **REALISM NOTE up front:** real mycelium growth does not finish in 24 h — same issue as LOADBEAR. Use a spawn-block slurry moulded in the morning; the substrate is genuinely mycelium-bound but only at hour-20 stage. Both LOADBEAR and this concept share this constraint, which is why they lead with the *material-does-the-work* framing rather than pretending to a full 9-day cure.
  - **Hour 0–4:** Flash Zigbee nodes, get a 3-node mesh pinging over serial. Gate: if the mesh doesn't form by hour 4, drop to a single ESP32 BLE node (still passes counterfactual, just loses the "mesh" adjective).
  - **Hour 4–10:** Mould the mycelium/graphene composite pucks, screen-print resistive traces (or dab-on silver paste).
  - **Hour 10–18:** Wire node, calibrate resistance-vs-moisture against two beakers, assemble.
  - **Hour 18–24:** Demo: dry vs wet puck → node resistance → mesh graph. **Cut if behind:** 2 nodes, no PCB (battery + bare ESP32 + painted electrodes).
- **Why it wins here:** A repairable, biodegradable, sub-₹700 sensor node is a very tangible sustainability story — but it ranks 5th because the mycelium cure is the hardest 24-h truth to tell and Zigbee mesh is extra code risk on top.

---

## Cross-concept honesty notes

- **Mycelium cure is the single biggest honesty risk in this document.** LOADBEAR and MYCELGRID both use mycelium composite. Neither can fully cure a mycelium block in 24 h. The honest framing is: *mycelium-bound bio-composite at hour-20 stage, with the industrial growth curve documented*, and pre-inoculated blocks sourced from a local grower if the team wants a genuinely grown sample. Every other part of these two builds is fully 24-h-doable.
- **Nitinol sourcing (COLDCHAIN) is the second-biggest risk.** An orthodontic or dental supplier is the realistic source; call them the morning of. If no Nitinol lands by hour 6, COLDCHAIN's actuator premise collapses and it should fall behind PHASEFENCE.
- **Transparent ceramic (CRYO-MARK) is the third-biggest risk** and the reason it sits at 4.
- **Highest-confidence, lowest-risk build is PHASEFENCE** (pure Wi-Fi CSI + printed lattice, both fully 24-h-doable, no exotic sourcing) — it is the "safe" runner-up if a team wants to minimise overnight supply risk, and LOADBEAR is the highest-ceiling project if the team can secure a pre-grown mycelium block and accept the honesty caveat.