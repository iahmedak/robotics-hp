# LENS 1 — Advanced Materials & Structure × Connectivity & Protocols
**Yuktih "Innovate Today, Sustain Tomorrow" · 24-hour overnight hackathon · 2–4 people · ₹1,500 fee · Winner ₹10,000 / 1st Runner-up ₹7,500 / 2nd Runner-up ₹5,000**

---

## The assigned pair

- **A — Advanced materials & structure:** shape-memory alloys, hydrogels, metamaterials, aerogels, mycelium composites, self-healing materials, phase-change materials, graphene/CNT, transparent ceramics, bio-based composites, 3-D printed lattices
- **B — Connectivity & protocols:** BLE mesh, LoRaWAN, Matter/Thread, local-first sync, store-and-forward sync, WebRTC/peer-to-peer, e-ink displays, ambient network protocols, delay-tolerant networking, QR/optical communication

**Discipline applied throughout**
1. *Counterfactual gate.* Strip either parent and the product must stop existing. Any concept where one parent survives as decoration is rejected, not ranked. Rejected fusions are listed at the bottom with the reason.
2. *Overnight gate.* The material is bought, cast or printed. The protocol layer is what the team actually builds between 22:00 and 05:00. No concept below needs lab equipment, gas cylinders, CVD graphene, or a climate chamber.
3. *Sustainability gate.* Sustainability is stated as a number with units (mass, count, grams CO₂e, replacement frequency), not as a colour. Where a number is an order-of-magnitude estimate from generic EPDs, it is labelled as such.

**Budget reality.** All BOMs are street-price estimates for India (Amazon.in / Robu / SP Road / local laminate-and-resin shops), assumed fetched the night of the hackathon. Everything is held under ₹4,000 so a ₹3,000 build does not eat the prize.

---

### 1. THERMOLATCH — the cold-chain verdict that survives a dead battery

**TOP 2**

- **Integration:** paraffin **phase-change material** (cut-open reusable pharmacy gel-pack, ~42 °C plateau) seated in a 3-D printed PETG carrier + **LoRaWAN OTAA uplink running a delay-tolerant store-and-forward sync layer** (RFC-9172-style bundle queue → local gateway → MQTT → dashboard).
- **The product:** A 34 g hang-tag for pharma cold-chain crates that *latches the worst thermal excursion it has ever experienced* into the physical phase state of wax, and radio-reports that verdict plus a queued custody log the instant a LoRa link exists.
- **Why BOTH are required:**
  - **Remove the PCM** and the tag is an ordinary temperature logger that answers "what is the temperature *now*". The defining failure of a cold chain is the excursion that happened **while nobody was watching and the truck had no uplink for 11 hours**. A flash log buffer answers that only if flash, battery and firmware are still alive *after* the incident. With the PCM you get a passive, zero-power, indestructible bit: when the wax melted and re-froze across the full plateau into the "excursion" mould, it is still in that state with the cell dead, the PCB cracked, or the crate in a morgue. **The wax is a non-volatile latch, not a battery.**
  - **Remove LoRaWAN/DTN** and you have a wax latch nobody can read without prying the crate open and melting the wax on a hotplate. The commercial value of a cold-chain record is that it is *remotely* auditable without unpacking regulated product. The PCM bit is ground truth; LoRaWAN + DTN is what converts a stuck wax blob into a signed, timestamped, chain-of-custody event.
  - **The coupling that makes this a fusion rather than two halves:** the LoRaWAN transmit scheduler is physically budgeted by phase state. Firmware transmits only when `cell_ok || thermal_budget_ok`, and — the neat trick — **a wax grain that melted and resolidified across the complete plateau is the permission token that lets the node emit an "OK" report.** You are not permitted to declare the load compliant unless the phase-change actually completed a clean cycle. The protocol state machine is written in the material's phase-transition vocabulary. No datasheet-driven part can be swapped in and keep that invariant.
- **Sustainability claim (measurable):**
  - The **latch function consumes 0 J** — no battery, no MCU, no radio. The device class this replaces (Li-SOCl₂ excursion taggers) ships a ~2200 mAh primary lithium cell per crate purely so a microcontroller can remember a boolean. We ship **one CR2032 (220 mAh)** and only because the radio needs it.
  - **Primary cells per 1,000 shipments: 1,000 × Li-SOCl₂ → 1,000 × CR2032 ≈ −90% cell mass.** Non-rechargeable lithium is the hardest fraction of a tagger to recover.
  - Enclosure is snap-fit PETG: end-of-life separation is two screws; the wax is commodity paraffin and can return to a candle. No potting compound, no ultrasonic weld, no disposable pouch.
- **Bill of materials**

  | Item | ₹ |
  |---|---|
  | NodeMCU ESP8266 (or ESP32 DevKit V1) | 400 |
  | RFM95W SX1278 LoRa 868/915 MHz module ×2 (node + gateway) | 900 |
  | 868/915 MHz SMA pigtail + stub antenna | 300 |
  | Waterproof DS18B20 ×2 (ambient + pack probe) | 200 |
  | Reusable pharmacy gel cold-pack (PCM donor), 1 | 200 |
  | 3-D printed PETG carrier + latch mould (200 g filament) | 280 |
  | CR2032 + holder, TP4056 + 18650 holder (bench backup) | 220 |
  | microSD + SPI module (offline event log) | 350 |
  | LED, buzzer, buttons, breadboard, jumpers, solder | 350 |
  | **Total** | **≈ ₹3,200** |

- **24-hour build plan:**
  - **21:00–22:00 — Parts run (split the team).** One person hits SP Road / Robu for LoRa + NodeMCU + DS18B20 + SD. Second person hits the pharmacy and any 3-D print shop for gel packs; if no shop is open, **start the PETG carrier printing on the hackathon printer at 21:15** and go buy filament. Third person (if present) sets up the laptop gateway: `lora-python`/`pySX127x` receiver → Node-RED or a 40-line Flask/MQTT sink → dashboard. *Cut:* the dashboard. A terminal that prints `VERDICT / MIN / MAX / ACKED` is a legitimate demo target.
  - **22:00–00:30 — Two independent tracks.** Track 1: melt the gel pack, drain it into the printed carrier, seat the DS18B20 in the wax, and hand-verify that the PCM actually holds its state (melt it with a lighter, freeze it in a tray, cut the carrier open and look). If this fails at 00:30 the concept dies here — do it first, deliberately. Track 2: LoRa uplink node → gateway over the air, measure RSSI and airtime, get a packet every 30 s.
  - **00:30–02:30 — Make it a fusion.** Implement the DTN layer for real: monotonic counter, CRC-protected bundle, ack-queue, exponential backoff, and the `thermal_budget_ok` gate. Deliberately pull the gateway antenna to prove the queue accumulates and replays.
  - **02:30–04:30 — The demo beat.** "Crate is fine" → melt the wax with a lighter → **remove the battery entirely** → the dashboard still flips to EXCURSION because the bundle replayed on the node's own supercap-free path… *honest correction, build it this way instead:* the wax state gates the **OK** report, so with the wax melted the node refuses to send "OK" and escalates to the burner's stored bundle. Then show the reverse: unplug the node completely, then photograph the cut-open wax to prove the verdict survives with zero electronics.
  - **04:30–06:30 — Hardening.** Solar/gateway on a laptop, not the laptop's Wi-Fi. Log timestamps in IST with an RTC (DS3231 ₹180) so the custody claim is honest.
  - **06:30–09:00 — Report and dry runs.** Three dry runs, one of them with the router unplugged. *Cuts made and final:* no RTC in v1 (added later only if time), no dashboard styling, no enclosure rendering, no MQTT broker (a local Flask sink is fine), no second sensor node.
- **Why it wins here:** Every part is on an Indian electronics street by 22:00, the money shot is "melt it with a lighter and the record changes state", and the sustainability story is a **subtraction** (−90% primary-lithium mass) rather than a green label.

---

### 2. PEAKLATCH — a crash recorder that *is* the bumper

**TOP 2**

- **Integration:** **shape-memory alloy** (Nitinol strip) bonded into a **3-D printed auxetic mechanical-metamaterial lattice** + **optical (camera-read) multi-frame barcode read-out with DTN store-and-forward sync** of the crash record.
- **The product:** A printed helmet insert / chute or crush-guard panel that is simultaneously the impact-energy absorber **and** the peak-load recorder — the SMA strip takes a permanent set at peak deformation, freezing the crash magnitude into a physical geometry that any phone camera reads as a 12-bit code, which then store-and-forwards to the fleet log whenever a network appears.
- **Why BOTH are required:**
  - **Remove the SMA** and you have a spring. Nitinol *stores* the load and gives it straight back; there is no record. Spring steel is elastic. A plastic hinge gives you a crude one-bit snap. **Peak-load magnitude (how much, not just whether) requires a material whose post-event geometry is a frozen analogue of the load** — which is the definition of a shape-memory alloy taken past its recovery temperature and then mechanically constrained from returning. The digital equivalent is a dashcam + battery + storage + rigid mount (₹4,000–8,000 of electronics) bolted to a part you designed to be destroyed.
  - **Remove the lattice** and you have a flat strip. It bends about one axis, the read-out is angle-only (1 bit), and — fatally — **it absorbs no energy.** You have not replaced the bumper; you have taped electronics to a plastic toy. The auxetic (negative-Poisson-ratio) topology is what turns a monotone curve into a long, flat, repeatable plateau, i.e. what makes the angle→load mapping *linear* over the range you care about. Without it the tag needs a calibration table per part, which nobody will trust.
  - **Remove the protocol layer** and the frozen geometry is a bent ribbon sitting in wreckage. Without the multi-frame optical code plus DTN there is no number, no timestamp, no location, and no fleet-level answer to "which of the 900 helmets on site has been hit." Nobody flies a camera out to a quarry.
  - **Both are load-bearing in the same physical act:** the lattice's auxetic collapse *is* the excitation that sets the SMA. **The material deformation is the write operation; the optical read is the read operation.** There is no sensor, no MCU and no battery in the tag at all. The sensor *is* the structure.
- **Sustainability claim (measurable):**
  - Retires one ₹4,000–8,000 electronic dashcam per vehicle/helmet and replaces it with a ~₹250 printed part. **Net e-waste introduced per unit ≈ 0; net e-waste retired per unit = 1 dashcam.** In a 900-helmet site that is 900 electronic units retired per refresh cycle.
  - Because the recorder *is* the sacrificial bumper, a crash destroys a 38 g recyclable PETG lattice and a separable SMA strip — **not an electronics assembly.** Failure cost per incident drops from "₹6,000 device write-off" to "₹850 of consumables."
  - **Battery-void logistics removed.** Electronic recorders are UN38.3 restricted goods for air freight; a zero-battery passive tag is not. For sites that ship PPE internationally this is a real, citable logistics saving, not a green label.
- **Bill of materials**

  | Item | ₹ |
  |---|---|
  | Nitinol (NiTi) strip, superelastic, 0.5 mm × 150 mm | 600 |
  | PLA/PETG filament, 500 g (lattice + hooks) | 250 |
  | FSR402 force-sensitive resistors ×2 — **calibration rig only, not in the tag** | 220 |
  | ESP32-CAM — lives in the *reader*, never in the tag | 1,700 |
  | 1 kg steel drop mass + foam sled + drop rig | 300 |
  | Digital calipers, laser-cut acrylic jig, markers, zip ties, hot glue | 300 |
  | Budget (camera is a team phone, ₹0) | 0 |
  | **Total** | **≈ ₹3,370** |

- **24-hour build plan:**
  - **21:00–21:30 — Risk call, front-loaded.** Nitinol on next-day Amazon delivery is the single point of failure. **Buy a 0.5 mm × 150 mm strip and a 0.3 mm brass shim at 21:30 from any hardware shop.** The brass shim is the demo fallback: it takes a permanent one-shot mechanical set by the same mechanism, minus the shape memory. The report says plainly which one was in the drop test. Also: **start the lattice printing immediately** — the auxetic cell is a simple re-entrant geometry, one hour of slicing at most.
  - **21:30–23:00 — Material proof, before any code.** Bolt-mount a strip in a 3-D printed two-plate clamp, load it with the 1 kg mass in steps, and confirm it *holds* a set instead of springing back. Nitinol held; great. Nitinol sprang back and the brass did not; switch the mechanism to "creep-set under sustained load" and rebuild the clamp as a wedge. **Do not write a line of protocol code before this passes.**
  - **23:00–01:00 — Calibration, which is the real engineering.** Mount a strip in the auxetic cell with a printed angle-transducer, drop known masses, and produce the angle→load curve with the FSR rig. Then engrave 12 radial tick marks (0–11) around the pivot with a 0.4 mm pen or a laser-etched mask, so each tick is one digit. This curve becomes the report's Figure 1.
  - **01:00–03:00 — Optical read-out.** ESP32-CAM captures the dial, perspective-corrects it with a homography from four printed fiducials, decodes the tick under the fiducials, and writes a signed JSON bundle to SPIFFS. Add a DTN layer: bundles queue with a monotonic sequence, retry with backoff, and only delete on ack. A phone hotspot is the "network" — pull it and prove the queue survives.
  - **03:00–05:00 — The fusion moment.** Bind the two: the camera must refuse to report a load unless the fiducial ring also confirms the SMA is *in a set state* (asymmetric kink visible). A spring-back tag is not a valid tag. That is the same shape of invariant as THERMOLATCH, arrived at from the other direction, and it is the sentence the judges need.
  - **05:00–07:00 — Demo hardening.** Black tent over the drop rig (optical read needs contrast), 20 pre-printed drop cards (0.5 / 1.0 / 2.0 kg / lateral / no-drop), and a printed calibration chart taped to the rig. **Pre-drop 6 tags** so the demo is six guaranteed-good tags, not one.
  - **07:00–09:00 — Report, dry runs, pack.** *Cuts, final:* no ESP32-CAM firmware-level fiducial detection (do the homography in OpenCV on the laptop); no fleet dashboard (a single terminal + a JSON log is the demo); no lateral-impact test rig (vertical only); no second reader unit.
- **Why it wins here:** The highest fusion purity in the list — the material is simultaneously the structure, the sensor, the memory and the power source — and the demo is 20 seconds long and unmistakable: drop a weight, break the part, then photograph the wreckage and read the number off it.

---

### 3. INKSTAMP — the pallet label you wash and reuse

- **Integration:** **self-healing polymer-clay hydrogel** (PVA / borax–hectorite nanocomposite, cast overnight) as the flexible re-armable optical coupling layer + **e-ink (bistable) display with local-first delta-sync / store-and-forward over BLE GATT**.
- **The product:** A reusable smart pallet label — a printed bio-composite chassis holding a stretchable self-healing hydrogel layer over an e-ink panel that shows live status for years off a coin cell, and syncs its change-log to any nearby phone with conflict-free offline merging (no cloud, no account).
- **Why BOTH are required:**
  - **Remove the hydrogel** and the label is a rigid printed tag with an e-ink window glued behind a plastic lens. Pallet labels live on forklifts: they crease, are crushed by stretch-wrap, and abrade against rack beams daily. A crease through the polariser stack kills a ₹1,100 panel. The **self-healing layer re-flows across micro-cracks on contact heat**, and it also *is* the optical coupling medium — remove it and you need an acrylic lens, which is rigid, brittle, non-repairable, and therefore turns the product back into a disposable part.
  - **Remove the e-ink** and you have a lovely rugged label with no readout. Any LED or OLED readout must be **powered** to be visible. A node that has to display its current verdict therefore either sleeps (and is blank exactly when a worker needs to check it) or drains a cell within weeks. **E-ink is bistable: the state lives on the panel with zero current.** That single physical property is the only reason the power budget can be CR2032 and the only reason an always-on node is possible at all.
  - **Remove the sync** and it is a passive human-readable tag. The product thesis is that it is *addressable* and merges conflict-free offline — two scanners hit the same pallet in a warehouse dead-zone and both edits survive without a server deciding who won.
  - **Fusion:** the self-healing polymer is what makes a bistable display *mechanically survivable*; bistability is what makes a years-long, always-legible node possible. Neither alone produces a reusable addressable label.
- **Sustainability claim (measurable):**
  - Today's equivalent is a **single-use thermal label plus a disposable USB tracker**: ~₹20 tracker amortised over a 30-day battery at a ~2,000 €/yr tracker, so roughly **₹6,000 of tracker spend per 1,000 pallet-years**, plus 1,000 landfill-bound labels.
  - This chassis is **printed once and re-armed by washing**: ≥200 wipe/re-arm cycles per chassis → **5 printed labels replace 1,000 single-use labels and ~13 disposable trackers per 1,000 pallet-years.** Packaging waste per unit: 1 → 0.02.
  - The hydrogel is PVA/borax/water — a washable film, not a glass-fibre laminate, so end-of-life is a compost bin and a coin cell, not a resin part.
- **Bill of materials**

  | Item | ₹ |
  |---|---|
  | Waveshare 2.13" e-Paper HAT (or TTGO T-echo) | 1,250 |
  | ESP32 DevKit V1 | 450 |
  | PVA + borax + (hectorite clay optional) | 350 |
  | PLA/PETG filament, 500 g (chassis + mould) | 250 |
  | CR2032 + holder ×2, battery test leads | 120 |
  | 0.96" OLED + small ESP32 (as the *second* node / range demo) | 700 |
  | Silicone, sample pots, a tray for the gel bath | 250 |
  | Jumpers, breadboard, solder, hot plate | 300 |
  | **Total** | **≈ ₹3,670** |

- **24-hour build plan:**
  - **21:00–21:30 — Buy e-ink first.** It is the long-lead item and the one with driver-library risk. Waveshare 2.13" HAT or a T-echo. **Fallback if neither is in stock: a 2.9" e-Paper V2 module (₹700) — same driver family, fewer features.** Start the chassis print immediately after.
  - **21:30–23:30 — Make the hydrogel.** Borax + PVA in hot water, stir, add a spatula-load of hectorite if available. Test three things and write the results down: (a) does it re-flow a hairline cut, (b) does it stay optically clear, (c) does it survive a −20 °C overnight? **(c) fails ⇒ swap to the 2.9" module and a room-temperature-only chassis.** Do this first — the material is the risk.
  - **23:30–01:30 — Panel bring-up.** Waveshare's `EPD` driver, deep sleep, partial/full refresh. Measure real current in deep sleep and write the number on the report's cover — "e-ink node draws X µA idle" is the sentence that makes the sustainability claim auditable.
  - **01:30–03:30 — Protocol: local-first, honestly.** Not a toy CRDT. Two ESP32 nodes, each holding an append-only op-log of `{seq, ts, event}`; a scanner merges by sequence number; conflicts on the same field resolve last-writer-wins *per field* while independent fields always merge. Demonstrate the classic case: cut the phones, scan from both, reconnect, show both changes present.
  - **03:30–05:30 — Re-arm loop.** The money shot: crease the hydrogel with a scalpel, press, and watch the panel go from unreadable to readable again after a warm rinse. If it does not self-heal visibly, fall back to demonstrating re-armability (a hydrogel that swells back to shape when soaked is still a real, honest win — say so precisely).
  - **05:30–07:00 — Physically abuse it.** Drop test from 1 m onto concrete, then the fold test on a printed PETG mandrel. Photograph every failure honestly; the judges will respect the failure table more than a clean render.
  - **07:00–09:00 — Report + dry runs.** *Cuts, final:* no OLED second node (a phone is the second reader); no mobile app (a Web Bluetooth page served from the laptop is 30 lines); no barcode item-level IDs (QR labels from a print sheet are enough); no wash-cycle automation timer.
- **Why it wins here:** Cheapest, fastest, most certain build of the five. The e-ink "on with zero current" reading is a genuinely non-obvious engineering fact that judges can verify by eye, and the wash-and-reuse beat is a live, physical demo that no slide can fake.

---

### 4. AEROSHIP — the cold box you never throw away

- **Integration:** **silica aerogel** (or a VIP panel as the documented substitute) in a 3-D printed bio-composite crate insert + **WebRTC peer-to-peer with local-first sync** over an optical custody tag.
- **The product:** A reusable pharma/biological-shipment crate whose *insulation is the payload* — not a disposable gel pack — with a chain-of-custody ledger that a phone reads optically, merges offline-first, then P2P-syncs straight to the receiving warehouse with no server in the path.
- **Why BOTH are required:**
  - **Remove the aerogel** and the reusable crate has no insulation, so it must be packed with **phase-change gel packs — single-use, landfilled, and the exact reason reusable pharma shippers never got adopted.** A "reusable" box that quietly ships with 14 throwaway packs a week is not reusable; it is a rental. The insulation material is the difference between an asset you own and a consumable you re-buy. Aerogel is the only insulation class that makes the crate genuinely returnable at clinical hold times.
  - **Remove the protocol layer** and you own a beautiful box nobody trusts. **Trust in a returned high-value asset is entirely a records problem** — nobody releases ₹40,000 of biologics back into a container with no custody chain. Optical read gives zero-touch provisioning at a dock scanner; **local-first** gives correct merges when two dock scanners have no link in the yard; **WebRTC P2P** delivers the custody record to the destination system in ~150 ms without ever transiting our cloud, which is the only condition on which a hospital quality team will accept the record.
  - **Fusion:** the aerogel's **thermal-hold time is the sync window.** The crate's guaranteed hold time (e.g. 96 h) is simultaneously the maximum time the offline-first ledger has to reconcile before a record is legally stale. Both specs bind to a single `holdWindowHours` constant — the insulation datasheet and the CRDT conflict policy literally read the same number. Change the aerogel, you change the protocol. That is a fusion, not a feature list.
- **Sustainability claim (measurable):**
  - **Packaging waste per shipment: 1.0 shipper → 0.05 shippers** at a 20-trip return cycle; the accompanying PCM waste (4–6 gel packs per shipment) goes to **zero**.
  - **Embodied carbon per shipment, order-of-magnitude estimate from generic EPDs** (labelled as an estimate; the team should replace these with real supplier EPDs in the report): single-use EPS shipper + 4 PCM packs ≈ 19 kg CO₂e per shipment, versus a ~12 kg CO₂e aerogel box amortised over 20 trips ≈ 0.6–2.4 kg CO₂e per shipment → **roughly 8× lower per shipment.** *(Directionally right; the magnitude is the thing to verify with real numbers before printing it on a slide.)*
  - Every return trip also amortises the crate's moulded-in tooling, so unit cost falls with fleet size — the standard argument for reusable transport, made with a number attached.
- **Bill of materials**

  | Item | ₹ |
  |---|---|
  | Aerogel insulation panel 10 mm, ~200×200 mm (Amazon India) | 900 |
  | PLA filament, 500 g (crate insert + lid) | 250 |
  | ESP32 DevKit V1 + battery management | 550 |
  | DS18B20 ×3 (pack air, core, ambient) | 250 |
  | 18650 + TP4056 holder | 180 |
  | Printed optical custody tags + a QR label sheet | 100 |
  | Dry-ice / ice-bath test consumables for the thermal demo | 300 |
  | Laptop (WebRTC signalling + local-first store) | 0 (owned) |
  | **Total** | **≈ ₹2,530** |

- **24-hour build plan:**
  - **21:00–21:30 — Buy aerogel first, and have a fallback queued.** An aerogel blanket/panel is a 10-minute trip to Amazon pickup or an industrial-supply dealer. **Fallback if unavailable: a vacuum-insulated panel (VIP) from an appliance-repair shop, or a compression-moulded bio-composite (jute + PLA) panel made in your own printed mould.** All three are legitimate insulators; the report must state which one was actually dropped in. Start the insert print at 21:30.
  - **21:30–23:00 — Thermal rig, before any software.** Ice-bath the packed crate, log with three DS18B20s on a laptop, and find out how long your build actually holds. *This is a real risk and it is the first thing you must know* — if a plain PLA insert leaks heat, aerogel will save you; if it does not, you may need to drop the foam and keep only the lid seal. Write the actual curve down; it becomes Figure 1 of the report.
  - **23:00–01:00 — Insert design iteration.** Iterate on the printed insert until it holds. Print is cheap; do four versions.
  - **01:00–03:00 — The protocol work: local-first custody ledger.** A single append-only op-log served over WebRTC DataChannels between two browser tabs (dock A and dock B) with a small CRDT-style merge. Demonstrate: scan at dock A with the network down, scan at dock B with the network down, connect, both survive, no operator decision required. **Cut:** a real CRDT library. Last-writer-wins per field on an op-log is honest and demonstrable; a Yjs dependency is not worth the debug time at 03:00.
  - **03:00–05:00 — WebRTC with no signalling server.** Two tabs, SDP/ICE copied as a text blob (or a QR of the SDP) — this is a legitimate, impressive P2P demo with zero infrastructure, which is exactly the product claim: *the receiving warehouse needs no account and no vendor cloud.* Use a public STUN server; note in the report that TURN would be required behind symmetric NAT.
  - **05:00–07:00 — The fusion moment.** Expose `holdWindowHours` in one place and show the report's thermal curve and the ledger's conflict policy both read it. Then change it to 48 h and show the ledger start rejecting stale custody on its own. This is the single sentence that turns five components into one system.
  - **07:00–09:00 — Report and dry runs.** *Cuts, final:* no door-scanner hardware (a phone is the scanner); no CO₂e spreadsheet beyond a one-page table; no full WebRTC datachannel multiplexing (one channel, JSON); no print of the aerogel datasheet (cite the source).
- **Why it wins here:** The strongest *judge-facing* sustainability story in the list (waste and carbon, both with units) plus a zero-infrastructure custody story that is commercially real. The thermal demo is tactile: judges can put a hand inside a box that has been in ice for an hour.

---

### 5. HIVE-GATE — the door seal that reports its own integrity

- **Integration:** **compression-moulded jute/hemp-fibre bio-composite** (mycelium family; a mycelium panel is the ideal substitute if one can be sourced) as a humidity-buffering, compostable enclosure + **BLE mesh** multi-hop door/gasket integrity sensing.
- **The product:** A cold-room door seal module whose moulded natural-fibre composite body is a moisture-buffering, end-of-life-compostable conformal housing for a self-healing membrane switch; the module joins a BLE mesh so a 40-door cold room reports which door is leaking — with no per-door gateway, no wiring, and no Wi-Fi in the ceiling void.
- **Why BOTH are required:**
  - **Remove the bio-composite** and you need an IP-rated ABS/ASA enclosure — which needs its own gasket seal, and the gasket is the part that actually dies. Cold-room doors slam 200–400 times a day; conventional gasket-mounted sensor modules crack and are replaced every 6–12 months. A compression-moulded jute/hemp + PLA-bio-resin body (pressed overnight in the team's own 3-D printed mould) is dimensionally repairable — **you re-press it** — and its fibrous matrix buffers the condensation that corrodes the PCB and delaminates the sensor. **The material is the maintenance strategy.**
  - **Remove BLE mesh** and 40 doors each need their own gateway or a wired bus. That converts a compostable, coin-cell, infrastructure-free sensor into a permanently wired node — the exact opposite of what the material is for. Mesh is the architectural fact that makes "every door is its own battery-free node with no infrastructure" possible at all; **without it, the bio-composite enclosure is not viable and you go back to ABS and a maintenance contract.**
  - **Fusion:** the composite's moisture buffering extends node service life (fewer replacements), and mesh's multi-hop, duty-cycled, *always-beaconing* mode is what makes a 3-year coin-cell node legible to a phone that walks past once per shift. A Wi-Fi node must either transmit constantly (kills the coin cell) or sleep (nobody notices a leaking door until the load fails). **The message duty cycle is set by battery budget; the battery budget is set by the material's humidity ingress rate.** Both budgets are the same number.
- **Sustainability claim (measurable):**
  - **Sensor/gasket replacements per cold-room door per year: 2 → 0.2** (self-healing conformal membrane + repairable fibre housing). Each avoided replacement also avoids a discarded ABS enclosure, a discarded coin cell and a technician visit.
  - **Electronics are separable in two screws** and the fibre body is compostable. **End-of-life is verifiable on stage:** drop the composite puck in a compost tumbler and pop the electronics out — a checkable claim, not a label.
  - Per-door infrastructure cost: **₹0 (mesh) vs ₹3,000–8,000 per wired/baselined door** across a 40-door room = ₹1.2–3.2 lakh avoided, and no cable in a wet, cold, food-adjacent ceiling void.
- **Bill of materials**

  | Item | ₹ |
  |---|---|
  | Jute/burlap cloth (2 m) + PLA bio-resin or PLA scrap | 600 |
  | PLA filament, 500 g (mould + electronics cradle) | 250 |
  | ESP32 DevKit ×2 | 900 |
  | SHT31 humidity/temperature sensors ×2 | 360 |
  | CR2032 + holders ×2 | 100 |
  | Self-healing PDMS membrane / sealant sheet | 250 |
  | Compression press (a heavy book + a printed mould will do) | 0 |
  | Silicone release agent, mixing cup, gloves | 250 |
  | **Total** | **≈ ₹2,710** |

- **24-hour build plan:**
  - **21:00–22:00 — Buy ESP32s and the fibre. Start the mould print immediately.** The mould is the long pole for the composite, so it prints while you shop. Source jute or burlap from any textile or packaging shop; bio-resin from a craft supplier, or **use PLA scrap ground from failed prints** and say so in the report.
  - **22:00–00:00 — Press the composite and let it cure.** This must start early because it is the only step with chemistry in it. Hand-lay a 6×6 layer stack, cure in the printed mould under weight for 4 hours. **Checkpoint at 00:00: if the puck delaminates when you flex it, abandon the fibre composite and pivot to 3-D printed PLA with a moisture-buffering gasket lip.** The rest of the build (mesh, sensors, app) is material-agnostic — only the enclosure story changes, and the report says which was used.
  - **00:00–02:00 — Mesh.** Two ESP32 nodes advertising a door-state service UUID, plus a phone in the middle acting as a relay. **Be honest about scope:** true BLE Mesh provisioning needs a Nordic/Android mesh app that you will not finish at 02:00 on a budget board. The defensible demo is **multi-hop BLE relay using GATT connections** (node A → phone → node B), which is the same topology and the same power story, and the report must describe it as "BLE multi-hop relay (GATT)," **not** as certified Bluetooth Mesh. If one of you has done mesh provisioning before, upgrade it; otherwise do not claim it.
  - **02:00–04:00 — The sensor story that makes it real.** A flex/pressure sensor in the door leaf reporting "this door did not close fully" plus SHT31 humidity reporting "condensation is rising here." The failure mode being caught is a door left ajar overnight, which is worth real money in a cold room.
  - **04:00–06:00 — Seam the fusion.** Add a self-healing PDMS membrane over the electronics window: cut it, press it, show it closes. Then show the SP31 humidity trend over a fake condensation cycle (a beaker of warm water under the enclosure) and demonstrate that the fibrous body keeps the case 6–8 h longer before the humidity alarm fires than a bare ABS box would. That number is the sustainability claim, measured.
  - **06:00–09:00 — Report, dry runs, compost bin.** Set up the compost tumbler as a live demo station. *Cuts, final:* no power-management IC (CR2032 + deep sleep only); no enclosure CAD styling; no fleet dashboard (a phone page showing door state and humidity is enough); no humidity trend database.
- **Why it wins here:** The only concept whose green claim is *physically falsifiable on stage* — put the puck in a compost tumbler and pull the electronics out — and the only one where the protocol choice is the reason the material is viable at all, which is the cleanest possible statement of a true fusion.

---

## Ranking rationale

| # | Concept | Material (A) | Protocol (B) | Fusion purity | 24 h build risk | Demo punch |
|---|---|---|---|---|---|---|
| 1 | **THERMOLATCH** | Phase-change material (paraffin PCM) | LoRaWAN + DTN store-and-forward | High — PCM state is a *permission token* in the protocol state machine | **Low** — all parts on an Indian electronics street | High — lighter + live dashboard |
| 2 | **PEAKLATCH** | Shape-memory alloy in a printed auxetic metamaterial | Optical multi-frame code + DTN | **Highest** — deformation is the write operation; no electronics in the tag | Medium — Nitinol sourcing (mitigated by brass-shim fallback) | **Highest** — drop a weight, photograph the wreckage |
| 3 | **INKSTAMP** | Self-healing polymer-clay hydrogel | E-ink (bistable) + local-first delta sync | High — self-healing is what makes bistability mechanically survivable | **Low** | Medium-high |
| 4 | **AEROSHIP** | Silica aerogel / VIP | WebRTC P2P + local-first | Medium-high — the hold-time *is* the sync window | Medium — aerogel sourcing + thermal-hold iteration | Medium-high — tactile |
| 5 | **HIVE-GATE** | Moulded jute/hemp bio-composite | BLE multi-hop relay | High — mesh is what makes the material viable | Medium-high — composite cure + honest BLE-mesh scoping | Medium — compost demo is the standout |

**If the team has zero risk appetite:** build THERMOLATCH. **If the team has one member who is genuinely good at optics and CV:** build PEAKLATCH — it has the highest ceiling at the judging table and the highest ceiling for "we actually did a fusion here."

---

## Fusions considered and REJECTED (decorative-parent failures)

| Rejected idea | Why it fails the counterfactual |
|---|---|
| Graphene/CNT heater film + BLE telemetry for a smart bottle | Remove the graphene and substitute a copper trace or a PTC film; the product still works identically. The material is a BOM line, not a load-bearing choice. |
| Mycelium composite enclosure + LoRaWAN soil node | Remove the mycelium and use ABS; the telemetry is unchanged. The only difference is a greener enclosure — a label, not a property. |
| Aerogel-lined phone case + BLE battery monitoring | Removing the aerogel changes thermal mass by a few watts and nothing else. Pure decoration. |
| Hydrogel sensor + Matter/Thread smart-home node | The hydrogel contributes a non-critical analog channel; the product's entire behaviour is the protocol. Swapping in a $2 thermistor changes nothing. Also unbuildable overnight: no cheap Matter/Thread dev board exists in India. |
| PCM "smart" packaging + blockchain/QR traceability | No genuine material function; the CRC/hash is software. Rejected as generic-SaaS-adjacent. |
| CNT-graphene flexible antenna + WebRTC video | The antenna is copper in practice; the WebRTC works over any radio. Neither is load-bearing for the other. |
| 3-D printed lattice phone stand + wireless charging | Neither technology is required by the other; both are decoration on a commodity product. |

**Standing rule for the team:** if you cannot finish the sentence *"if we removed the ___ , this product would ___, therefore it is not a product"* with a *specific mechanical or electrical consequence*, you have not fused anything yet — you have stapled two BOM lines together.
