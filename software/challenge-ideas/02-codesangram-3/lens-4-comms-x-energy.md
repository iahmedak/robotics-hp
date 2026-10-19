# Lens 4 — Communications & Protocols × Energy & Power
### CodeSangram 3.0 — "technology-driven solutions to real-world challenges in Namma Bengaluru"

**Assigned pair (both load-bearing):**
- **A — CONNECTIVITY & PROTOCOLS:** BLE mesh, LoRa/LoRaWAN, Matter/Thread, local-first sync, store-and-forward sync, delay-tolerant networking, e-ink, ambient network, federated sync
- **B — ENERGY & POWER:** silicon/perovskite PV, supercapacitors, Li-ion, vibration/kinetic harvesting, thermoelectric, phase-change materials, energy-harvesting ICs

**Design rule enforced:** remove either technology and the product must stop working. If it still works, the technology was decoration.

**Terrain chosen deliberately:** battery-free / intermittent-power hardware where the *protocol* — store-and-forward, delay-tolerant gossip, energy-aware duty cycling — is the actual engineering content, and the energy harvest is the only reason the device is alive at all.

---
---

### 1. **BESCOM-OUT** — the neighbourhood outage ledger

- **Integration:** A-energy = BLE mesh **federated store-and-forward gossip + CRDT-style last-writer-wins reconciliation** with **e-ink** community display · B-energy = **mains current-transformer (CT) energy harvesting** + **supercapacitor** RTC-backed buffer + **silicon PV trickle + PCM thermal standby** on the shared display node
- **The product:** A transformer-tap-sized dongle on each low-voltage distribution transformer that cryptographically logs exactly when power died and when it came back, gossips those outage windows neighbour-to-neighbour through the low-income apartments it feeds, and drives a solar/e-ink community board on the society wall showing a crowd-sourced **"power back in ~N minutes"** number that everyone in the block reads off the same board.
- **Bengaluru problem it solves:** Old-city wards — Jayanagar 4th Block, Richmond Town, Gandhi Bazar, Kalasipalya — brown out constantly during summer peak. There is no BESCOM acknowledgement, no restoration ETA, and no shared truth; residents discover outage/restoration by standing in the dark and shouting. Two blocks on the same feeder routinely get contradictory answers. **The defined failure mode of this product's own power source is identical to the problem it measures** — so it must, and does, log while dark and reconcile when alive.
- **Why BOTH are required:**
  - *Remove the energy tech and it is dead exactly when needed.* The CT-harvester + supercap is not an optimisation, it is the reason the log exists at all: the node is bolted to the transformer whose failure is the event, so there is no ambient light at 2 a.m. during the outage and no grid to harvest. Remove harvesting and you have a 6-hour box that dies before the next morning peak — you would log only outages shorter than its own battery, i.e. the *uninteresting* ones. Remove it and you are back to a WhatsApp group.
  - *Remove the protocol and the observation is unreachable.* BESCOM SCADA is 10–15 km away and useless to a resident. A single node's BLE range is ~40 m and there is no backhaul. The 6-hour supercap buffer holds ~200 signed log entries during the outage; without gossip + store-and-forward reconciliation, that backlog has no delivery path when the neighbourhood comes back, and each transformer node's history remains private to whoever happened to stand next to it. The product's entire user-visible output (the shared ETA) is produced by *reconciliation across nodes that were mutually offline during the event.*
- **Bill of materials** (prototype, 4 tap nodes + 1 community board):
  - ZMCT103C current transformer clamp, 5A/5mA — ₹120 each ×4 = ₹480
  - BQ25504 / BQ25570 energy-harvesting PMIC breakout (SPI telemetry tap) — ₹340 ×4 = ₹1,360
  - Supercapacitor 2.7 V 10 F + protection — ₹95 ×4 = ₹380
  - FRAM MB85RC256 (append-only, tamper-evident, survives power loss with no wear) — ₹95 ×4 = ₹380
  - RV-3028-C7 low-power RTC with its own backup cell — ₹210 ×4 = ₹840
  - ESP32-WROOM-32E dev boards — ₹380 ×4 = ₹1,520
  - Community board: Waveshare 2.9" e-ink SPI — ₹850
  - Community board power: 2 W silicon PV cell + boost converter + 6 V 2500 mAh Li-ion + supercap — ₹620
  - Community board compute: nRF52840 + e-ink driver board — ₹720
  - 3D-printed enclosures ×5, silicone gaskets, cable glands — ₹900
  - **Total ≈ ₹7,950** (buildable at ~₹1,600/node; ₹0.40/node at 10k volume)
- **48-hour build plan:**
  - **H0–3** — Bench rig: one CT + one harvester board proving sustained operation from mains only. Verify supercap holds RTC + FRAM through a hard power cut. *Gate: oscilloscope shows harvested rail stable across a simulated brownout.*
  - **H3–7** — Firmware: FRAM append-only log with hash chaining (`prev_hash || seq || monotonic_us || epoch_at_boot`), supercap brownout-safe commit, monotonic-clock reconstruction after full discharge. *Gate: pull the supercap at 1 ms intervals and confirm zero lost/duplicated entries.*
  - **H7–12** — BLE gossip: each node periodically advertises `(feed_id, window_id, vector_clock)`; receivers append what they're missing; CRDT LWW merge on `(feed_id, start_epoch)`. Multi-hop over 8 nodes on a desk.
  - **H12–16** — Android courier app: BLE scan → gossip sync → local SQLite (local-first) → outbound HTTPS queue. Offline-tolerant; verifiable after airplane mode.
  - **H16–22** — Physical build ×4 tap nodes + e-ink board. Photocell auto-dim, e-ink full-refresh only on hash change (energy discipline), PCM pack strapped to the board for heat soak.
  - **H22–30** — **Field deployment in a real Jayanagar/Richmond society.** Install 4 nodes on one feeder over a day, measure actual supercap ride-through vs. real outage duration. Backfill a week of community reports as ground truth.
  - **H30–36** — Restoration-time predictor (rolling median of recent outage windows per feeder), live e-ink dashboard, bilingual (ಕನ್ನಡ/English) rendering.
  - **H36–44** — Polish: tamper-evidence demo (physically short the FRAM, show log chain break), "hold the button to accuse BESCOM" export, judge-facing failure-mode writeup.
  - **H44–48** — Buffer, backup video, README with the two **removal experiments**: pull the harvester, then disable gossip — record both.
- **Data: free/open vs needing partnership** — Fully open: outage windows are crowd-sourced by the device itself; **the only partnership ask is a written BESCOM/BBMP ward-officer consent letter for pole access**, which is optional — the demo runs entirely on private society distribution boards in 4 locations.

**TOP 2**

---
---

### 2. **TOPI-TARKA** — streetlight faults couriered by autos

- **Integration:** A-energy = **store-and-forward delay-tolerant networking over sub-GHz LoRa with opportunistic BLE pickup** + **e-ink** street-level fault placards · B-energy = **silicon PV trickle charge + supercapacitor** riding the lamp's own photocell rail, with an **energy-harvesting IC** duty-cycling the radio
- **The product:** Solar-trickle nodes inside streetlight poles that log "this lamp is dark" and push the packet to the nearest passing **auto-rickshaw or two-wheeler**, which carries it as a store-and-forward parcel and uploads it when *it* next gets signal — producing a live, self-built map of which BBMP streetlights are dead, and in which order they fail.
- **Bengaluru problem it solves:** BBMP has ~90,000 streetlights and no reliable fault reporting. Dark poles are reported by chance — a citizen walking home at 11 p.m. sees one, screenshots it, posts it to a ward WhatsApp group; nothing is tracked, nothing is deduplicated, no one knows the *distribution*, and the contractor SLA clock never starts. Crucially, **a dark lamp post is also a dark place to stand and hold your phone up** — and the reporter walks away immediately. There is no second chance to report.
- **Why BOTH are required:**
  - *Remove the energy tech and the node cannot observe the failure.* A streetlight turns on at dusk and off at dawn. The interesting window — 9 p.m. to 4 a.m., when people need light and actually notice it is missing — is precisely when the PV has no sun and the lamp is drawing from the one rail that is broken. Nothing is harvestable at night. The node's entire observation window is the window in which it has zero energy budget, so the supercap+PV sizing *is* the feature that makes fault detection possible rather than merely nice.
  - *Remove the protocol and the packet has no path home.* A single pole's LoRa peer is 300–800 m away at best and its neighbours are equally dark and equally isolated; there is no gateway within a kilometre of most BBMP poles, and the ward office endpoint is 6–12 km away. Without store-and-forward plus an opportunistic mobile sink, a fault detected at 1 a.m. is simply lost at 1:01 a.m. The auto-as-courier is not an optimisation — it is the **only** reason the packet survives to morning, and it gives you latency for free (the auto is a scheduled carrier, not a latency-sensitive one).
- **Bill of materials** (prototype, 5 pole nodes + 1 courier phone):
  - nRF52840 DK or Seeed XIAO nRF52840 (BLE 5.2, ~5 µA average, coin-cell capable) — ₹780 ×5 = ₹3,900 *(switches to ₹380 ESP32 + ₹150 LoRa hat if budget-tight)*
  - RFM95W / SX1278 LoRa 433 MHz module — ₹320 ×5 = ₹1,600
  - 1 V 60 mA polycrystalline silicon PV cell + ultra-low-power boost (TPS62740) + 10 F supercap — ₹215 ×5 = ₹1,075
  - BH1750 ambient light sensor (the actual fault oracle — measures *installed* light, not whether the relay fired) — ₹180 ×5 = ₹900
  - Ambient light sensor backup: reverse-biased small solar cell as a free photodiode — ₹0 (replaces BH1750 where budget-limited)
  - 3D-printed IP65 pole mock-up, acrylic diffuser, cable glands — ₹900
  - e-ink 2.13" placards (4.2" optional) for "REPORTED / FIXED" status — ₹600 ×2 = ₹1,200
  - Courier: any Android phone, Loco/Bluetooth mesh install — ₹0 (existing)
  - **Total ≈ ₹8,575** with LoRa; **≈ ₹5,675** on the BLE-only mesh variant
- **48-hour build plan:**
  - **H0–4** — Energy first (this is the hard constraint). Prove nRF52840 + PV + 10 F supercap survives **three consecutive nights** at 9 µA average with one 3-second LoRa burst at 2 a.m. *Gate: three real nights, or a 72-hour accelerated drain test on a bench PSU with a load-switch profile.*
  - **H4–8** — Sense: BH1750 sampling at 1 lux resolution, 3-sample median over 90 s, hysteresis so a passing headlight doesn't false-trigger. Log `{node_id, seq, lum_lux, battery_mv, prev_hash}` into FRAM before transmission.
  - **H8–13** — Store-and-forward relay: a "carrier" role where any node that hears a packet with a foreign `node_id` buffers and re-emits it on its own schedule, bounded queue (64 slots) with drop-oldest-on-full and a per-packet TTL. Prove 5-hop propagation on a desk with nodes 40 m apart and two nodes deliberately powered off.
  - **H13–18** — Courier app: BLE foreground service scanning for TOPI frames, dedup by `(node_id, seq)`, store-and-forward into a local SQLite outbox, HTTPS batch upload on any connectivity. Deep-link into Google Maps for the dark-pole overlay.
  - **H18–24** — Fault classifier + e-ink placard: three-state model (LIGHT_OK / DARK / SENSOR_FAULT via PV-self-test). Placard flips to "REPORTED" on verified darkness, "FIXED" on first lux recovery, both hash-stamped.
  - **H24–34** — **Live deploy on a real Bengaluru street** — Marathahalli OR road, say — 5 poles, 800 m of actual footpath, then a real auto ride to prove courier latency. Time-stamped screen recording.
  - **H34–40** — SLA clock + BBMP-shaped export: automatic "fault detected → reported → acknowledged" timestamps, and a contractor-facing CSV that matches the format BBMP actually asks for.
  - **H40–48** — Buffer; film the two removal experiments (harvester pulled → node silent at night; gossip disabled → packets die at pole 1).
- **Data: free/open vs needing partnership** — Completely free/open: BBMP streetlight locations are on OpenStreetMap, lux readings are our own hardware, and the courier is volunteers' own phones. **Zero partnership required** — deploy on private society perimeter lights or any publicly accessible pole with permission, and the demo is identical.

**TOP 2**

---
---

### 3. **SEERAM** — tanker water delivery attestation with slosh power

- **Integration:** A-energy = **store-and-forward sync over LoRa (BWSSB-area dead zones) + append-only FRAM hash chain + QR/optical fallback handoff** with a **e-ink** delivery receipt · B-energy = **kinetic/slosh vibration harvesting** from the tanker's own water motion + **silicon PV on the tank crown** + **supercapacitor** ride-through
- **The product:** A bolt-on tank-top unit that, on every delivery, measures the tanker's water (TDS + temperature + turbidity), signs a tamper-evident **delivery + quality attestation** with the tanker's licence ID, and stores it locally through signal dead zones — so a resident or society can later prove exactly what was delivered, by whom, and at what quality.
- **Bengaluru problem it solves:** Roughly 40% of summer water supply in Bengaluru is tanker-borne, and there is **no record whatsoever** of what any given tanker delivered. Tanker water is a documented vector for sewage/contamination mixing (illegal bore + treated-water blending at roadside pumps), residents have no way to test it themselves, and when it happens there is no evidence. Meanwhile the tanker *itself* spends 30–45 minutes parked with the engine off at a standpost, inside apartment basements and under flyovers — precisely where there is no signal and where a naive always-connected tracker would have recorded nothing.
- **Why BOTH are required:**
  - *Remove the energy tech and the attestation only exists while the truck is moving.* A conventional tracker runs off the vehicle's 12 V while the engine is on — which is when it is driving past, not when it is delivering. At the delivery point (basement, standpost, society gate) the engine is off and the battery is the leak. Kinetic harvesting from the **sloshing water mass inside the tank** keeps the unit alive precisely during the 30–45 min static window, which is the only window in which a delivery is actually happening. Remove harvesting and you have a device that logs "I was moving" — which is not a delivery record.
  - *Remove the protocol and the attestation is lost exactly where it's generated.* The delivery event physically occurs in an apartment basement ramp and inside a gated society compound in outer Bellandur/Yelahanka — the two most RF-hostile environments in the city (reinforced concrete + metal roller shutters + 900 MHz reflection). The signature is minted at the point of delivery and would die there. Store-and-forward with a FRAM-backed append-only log plus an **optical/QR** handoff (a rotating QR on the e-ink receipt that the watchman's phone scans, which also works with zero network) is what makes the receipt physically reach the consumer. Without it, the data is not merely delayed — it does not exist.
- **Bill of materials** (prototype, 1 tanker unit + 1 society reader + QR/optical fallback):
  - ESP32-C6 + SX1262 LoRa (sub-GHz, better in-wall penetration) — ₹780
  - TDS/EC conductivity probe + BNC adapter — ₹520
  - DS18B20 waterproof temperature probe ×1 — ₹110
  - Turbidity sensor (optical 90°, analog) — ₹480
  - Electromagnetic vibration harvester + rectifier (kinetic; e.g. discarded stepper-motor generator) — ₹750
  - 3 W silicon PV on tank crown + boost + 10 F supercap + 2 Ah Li-ion — ₹640
  - MB85RC256 FRAM — ₹95
  - 4.2" e-ink SPI panel (delivery receipt + QR) — ₹1,200
  - Secure element ATECC608B (signing key — this is what makes it evidence, not decoration) — ₹410
  - IP68 tank-top enclosure, cable glands, gasket — ₹780
  - TDS calibration solution (1413 µS/cm) — ₹320
  - **Total ≈ ₹6,085**
- **48-hour build plan:**
  - **H0–5** — Kinetic harvester bench: strap the generator to a 20 L bucket on a wobble plate, scope the rectified output through a simulated 30-minute rest. *Gate: ≥3.3 V sustained for the full sensor+radio burst, or fall back to PV + supercap and reframe the pitch around PV-with-tunnel-brightness.* **This is the highest-risk item — do it first.**
  - **H5–9** — Sensing: TDS + temperature + turbidity, 3-sample median, calibration against the 1413 µS/cm standard on a bench (show the meter agreeing with a known value — judges will ask).
  - **H9–14** — Trust chain: ATECC608B key provisioning, FRAM append-only log with hash chain (`prev_hash || gps_time || tanker_id || tds || temp || turbidity || volume_declared`), tamper flag bit. Physical short of FRAM must be *detectable*, not just recorded.
  - **H14–20** — Store-and-forward: FRAM queue of 512 attestations, LoRa beacon to any listening society reader, exponential-backoff retry with TTL. Prove delivery out of a "basement" — literally build a Faraday-cage test box and show the packet arriving when the cage opens.
  - **H20–26** — Optical fallback: e-ink shows a compressed signed QR; the watchman's phone (a plain web page, no app install) scans and appends to the society's own ledger. Works with zero connectivity — prove in airplane mode.
  - **H26–34** — Deployment: ride along with a real water tanker in one ward (permission letter + ride-along), attach the unit, log 8–12 real deliveries including at least one dead-zone basement.
  - **H34–42** — Reader app + e-ink receipt: per-tanker trust score, delivery timeline, and a "show this to your landlord/BWSSB" export.
  - **H42–48** — Buffer, sanitise any real tanker identifiers for the video, write up the two removal experiments.
- **Data: free/open vs needing partnership** — Free/open: sensor data is entirely ours; the ride-along is the only ask. **Partnership needed: one water-tanker operator (they exist within 1 km of any hackathon venue) + written BWSSB/BBMP awareness letter** — the operator ask is a 2-hour ride, not an MoU; if it fails, run the full demo on our own 40 L test tank in a lab basement and it is still convincing.

---
---

### 4. **NAADI-NODE** — flood sensing that survives its own radio dying

- **Integration:** A-energy = **LoRa 433 MHz delay-tolerant store-and-forward with gossip-based log reconciliation** (sub-GHz chosen specifically because 2.4 GHz is absorbed by floodwater) + **e-ink** street-level depth placards · B-energy = **silicon PV + supercapacitor + PCM thermal standby** for multi-day overcast survival
- **The product:** A fist-sized, IP68 depth node that logs water level through Bengaluru's monsoon flooding and, when it comes back above water, **reconciles its backlog of missed hours against its neighbours by gossip** — so the community gets an accurate, retro-filled flood timeline instead of a graph with holes in it exactly when the holes matter.
- **Bengaluru problem it solves:** Low-lying pockets — Hebbal'sChallaghatta-adjacent underpasses, Domlur drain, Madiwala's Lake View, Old Airport Road underpass, BTM's Software Parks Layout — flood in under 40 minutes during the June–September burst, and it floods *visually* (the rain is the signal) exactly when all radio telemetry degrades. Aftermath, you have CCTV fragments, auto-rickshaw videos, and WhatsApp forwards — no timeline. There is no reconstruction of *when* water entered versus when it receded versus how deep it got, so there is no defensible record for insurance, for BBMP, or for a family deciding whether to enter a ground-floor flat.
- **Why BOTH are required:**
  - *Remove the energy tech and the node dies in the exact weather it exists for.* Monsoon means 5–10 days of continuous overcast; PV current drops 80–90% and there is no window to recharge. A Li-ion-only node at 20 µA average lasts ~10 days but starts the burst already flat, and the recovery/re-entry phase is often several more days of rain. The supercap supplies the peak current for the ultrasonic ping + LoRa TX, while the **PCM pack** (paraffin phase-change, ~45 °C) holds the ESP32 above its brownout threshold through the cold wet nights — cold ambient, not just flat battery, is what kills naive devices in a wet enclosure. Remove the energy stack and the node survives clear days only.
  - *Remove the protocol and the record develops holes exactly when they matter.* Standing water in a metal-hung underpass or between concrete walls is a near-perfect RF black hole; 2.4 GHz BLE dies within ~15 m of it, and even sub-GHz degrades hard. A naive always-uplink node therefore reports *"I saw nothing for 9 hours"* — indistinguishable from *"there was no water."* Store-and-forward with FRAM-buffered samples plus **gossip-based reconciliation** against spatially-adjacent nodes (whose log is continuous because they sat on higher ground) lets each node *infer its own missing window* and retro-fill it with a confidence flag. That retro-filled timeline **is** the product. Without it you have a sensor that goes mute in a storm.
- **Bill of materials** (prototype, 8 nodes):
  - SX1276/RFM95W LoRa 433 MHz — ₹320 ×8 = ₹2,560
  - ESP32 (deep-sleep 10 µA) or ESP32-C6 — ₹380 ×8 = ₹3,040
  - JSN-SJ2000 waterproof ultrasonic distance sensor (2 m range, IP67) — ₹420 ×8 = ₹3,360
  - MB85RC256 FRAM (logs ~4,000 hourly samples) — ₹95 ×8 = ₹760
  - 1 W silicon PV + TTP4056 + 3000 mAh Li-ion + 10 F supercap — ₹430 ×8 = ₹3,440
  - PCM pack, 200 g, ~45 °C paraffin (clamped to the enclosure, doubles as thermal mass) — ₹180 ×8 = ₹1,440
  - DS18B20 (enclosure temperature, feeds the thermal model + proves the PCM worked) — ₹110 ×8 = ₹880
  - IP68 ABS enclosure, cable glands, epoxy — ₹260 ×8 = ₹2,080
  - e-ink 2.13" depth placards (3 mounted at low/medium/high banks) — ₹600 ×3 = ₹1,800
  - **Total ≈ ₹19,360** (≈ ₹2,420/node; drops to ₹1,500/node with a $5 STM32 clone in place of ESP32)
- **48-hour build plan:**
  - **H0–4** — Range/rig: ultrasonic in a 60 L drum + LoRa in a screened box. *Gate: 3 m of water logged correctly, 8-hop LoRa mesh alive.*
  - **H4–9** — Node firmware: hourly depth sample → FRAM, plus **event-triggered fast sampling** (rate jumps to 1/min when depth crosses a threshold) so the rising limb is dense and the falling limb is not missed. Depth + temperature + battery_mv + `prev_hash` per entry.
  - **H9–15** — Store-and-forward: 512-entry FRAM ring, exponential retry, and the reconciliation gossip: each node periodically advertises `(site_id, last_seq, coverage_bitmap[0..24])` over 24 hourly slots; on hearing a neighbour with contiguous coverage where it has holes, it requests the missing window and back-fills with `inferred: true`. **This gossip protocol is the core deliverable — build and demo it on a desk with 8 nodes and manually pulling power from random nodes.**
  - **H15–20** — Power budget: measure real draw across 24 h, size the PV and supercap, then **prove the PV-starved case** by shading the array 80% for 48 h and showing the node still logs, with PCM keeping the rail up.
  - **H20–28** — Physical build ×8, potting, e-ink placards with a bank-relative depth scale.
  - **H28–36** — Deploy around one real low-lying pocket (Madiwala Lake View / Old Airport Road underpass). If it does not rain, **manufacture the water**: controlled hose-flash flood test in a real underpass with a **before/after drainage contractor on record** — and be honest in the writeup that it is a controlled test, not a natural event.
  - **H36–44** — Timeline UI: animated retro-filled flood timeline with confidence shading, "how long was my street under water" answer per address, static export.
  - **H44–48** — Buffer; run and record the two removal experiments on the deployed hardware.
- **Data: free/open vs needing partnership** — Free/open: rainfall and terrain from **OpenStreetMap + IMD Bengaluru's freely published station data**; all depth data is our own hardware. **Partnership: written permission from BBMP/ward engineer for underpass deployment, or use private society storm-water drains — a 3-line email to a society secretary, usually granted same-day.**

---
---

### 5. **THANDA-BOX** — the federated cold-chain custody ledger at society gates

- **Integration:** A-energy = **Matter/Thread (802.15.4) federated store-and-forward custody ledger** across multiple delivery agents + **local-first** resident-held replicas + **e-ink** parcel labels · B-energy = **silicon PV + phase-change-material (PCM) thermal storage** + supercapacitor, sized to hold sub-5 °C through a 4-hour BESCOM cut
- **The product:** A solar-and-PCM cold box at an apartment society's gate that holds perishables through a power cut and keeps a **federated, offline-tolerant custody ledger** across every delivery agent — so the daily *"I never got my milk"* dispute resolves from evidence instead of memory.
- **Bengaluru problem it solves:** Every high-rise society in Bengaluru is a dark store's last mile. Four or five different agents (Zepto, Blinkit, Swiggy Instamart, a local kirana, a homemaker's tiffin dabba) drop into the same gate area within the same hour, in the same unlit basement ramp, with each agent keeping its *own* delivery record on *its own* phone. When something is warm, missing, or wrong, there is no shared truth — and the society has no thermal record, only an argument. Power cuts are routine, so a plug-in cooler is unavailable exactly when perishables are sitting in it.
- **Why BOTH are required:**
  - *Remove the energy tech and the box cannot keep food cold through the only event it exists for.* A Bangalore summer cut is 2–5 hours; a plug-in compressor cooler has zero thermal mass and gains ~8–12 °C in the first hour alone. The **PCM blocks** (frozen, ~−20 °C latent capacity) plus PV + supercap are the *only* reason a 24 L box stays under 5 °C across a 4-hour outage — remove them and the box is a warm box, and the entire product claim ("cold through a cut") evaporates. This is not a battery-life tweak; passive refrigeration across a cut has no other solution at this price point.
  - *Remove the protocol and there is no shared truth to argue about.* Handoffs happen **in the basement parking ramp** — zero signal, agents' phones offline, and each agent's app buffers its own scan separately with no reconciliation path. Without **Thread (802.15.4) federated store-and-forward**, every agent maintains a divergent private version of "who has parcel #47," and the dispute is unresolvable by construction. Without **local-first** resident replicas, the ledger lives on the box and dies with the box's storage. The federation across 4–5 mutually-distrusting agents is the feature; the cold is only what makes the federation worth having.
- **Bill of materials** (prototype, 1 box + 4 agent tags + 1 resident app):
  - ESP32-H2 (802.15.4 / Thread-capable) ×2 (box node + tag beacon repeater) — ₹780 ×2 = ₹1,560
  - ESP32 (BLE for phone pairing) — ₹380
  - 10 W silicon PV panel + MPPT boost (TP5100) + 18650 ×2 (7.4 V pack) + 10 F supercap — ₹1,450
  - PCM blocks, −20 °C, 600 g total (frozen solid, phase-change at the right point) — ₹720
  - Passive cold box: 24 L EPS-insulated container, 60 mm walls, silvered liner — ₹1,250
  - DS18B20 ×4 (air, near-fruit, near-dairy, box wall) — ₹110 ×4 = ₹440
  - PN532 NFC reader + 6 NFC parcel tags — ₹380 + ₹180 = ₹560
  - Waveshare 4.2" e-ink for the box's public parcel board — ₹1,200
  - Battery temp sensor + hardware charge-inhibit (never charge a lithium pack below 0 °C — this is a real bug people ship) — ₹260
  - 3D-printed parcel carriers, wiring, terminals — ₹600
  - **Total ≈ ₹8,420**
- **48-hour build plan:**
  - **H0–5** — Thermal first, because PCM sizing is the whole claim. Build the box with frozen PCM + 4 temp sensors; log a **simulated 4-hour cut** (compressor off, PV disconnected) with a 12 kg load of warm bottles. *Gate: box air stays < 6 °C for 4 h.* If it fails, increase PCM mass before touching any code.
  - **H5–9** — Power: PV + MPPT + supercap, charge-inhibit below 0 °C, and a real low-temp Li-ion safety note in the BOM (lithium charging while freezing is a fire risk — say so out loud, judges notice).
  - **H9–15** — Thread mesh: ESP32-H2 nodes joining an IP/SRP Thread border router on a laptop, proving multi-hop over the 60 m from the box to the gate camera point (a real metal/concrete challenge). Fallback documented: BLE-only mesh if Thread provisioning fights us in 48 h.
  - **H15–21** — Federated store-and-forward custody ledger: each agent's node holds a replicated append-only log; `(parcel_id, event_hash, agent_id, monotonic_us, temp_ref)` entries; CRDT merge on `(parcel_id, seq)`, no central server, agents may be mutually offline for hours. **Simulate the basement: Faraday box around all nodes, agents scan out of order on reconnect, and the merged log must converge.**
  - **H21–26** — Local-first resident app (PWA, no install): scan a tag to see current custody + full temperature history; holds its own replica and syncs opportunistically.
  - **H26–32** — e-ink parcel board + the dispute resolver: "who had parcel #47 at 19:40 and what was the box temp then" answered in one screen, with a signed export.
  - **H32–40** — **Field test in a real society** (Day 1 walkthrough, Day 2 collection, one forced 4-hour cut) with 3 named packets of spoilage-prone items (curd, cut fruit, ice cream) as the A/B test.
  - **H40–48** — Buffer; record the two removal experiments (PCM blocks removed → box hits 11 °C in 90 min; federation disabled → agents' logs diverge permanently on a reordered scan sequence).
- **Data: free/open vs needing partnership** — Free/open: every event is generated by our own hardware; the PWA is self-hosted; no external dataset needed. **Partnership: one apartment society willing to let us bolt a box to their gate ramp for 48 hours** — the single most common yes in Bengaluru, since the gate area is already a shared mess.

---
---

## Ranking rationale (why this order)

| # | Concept | Counterfactual strength | Demo-ability in 48 h | Locality | Killer-moment risk |
|---|---|---|---|---|---|
| 1 | **BESCOM-OUT** | **Maximal** — the protocol must outlive its own power source, which is *definitionally* the problem | High (bench rig is trivial, field deploy is 4 screws) | Deep (a specific ward's specific failure) | Medium — need a real outage or a staged one |
| 2 | **TOPI-TARKA** | **Very strong** — no harvest at night = no observation; no courier = no packet | **Very high** (a real auto ride is a genuinely great 60-second video) | Very deep (90k dark lamps is a national meme) | Low — works even without rain/outage |
| 3 | SEERAM | Strong — power dies exactly when the event happens | High | Deep | Medium — tanker ride-along permission |
| 4 | NAADI-NODE | Strong — RF dies with the water | Medium (needs manufactured flood demo if no rain) | Deep | High — weather-dependent |
| 5 | THANDA-BOX | Strong — no PCM, no cold through a cut | High | Broad (every high-rise) | Low |

## Top 2

**1. BESCOM-OUT** — the cleanest counterfactual in the set (the protocol must survive the exact power loss it is measuring), the deepest local wound (no one knows when power is coming back), and a hardware BOM that fits ₹8k while producing a community-scale product. The two removal experiments are trivially demonstrable on real hardware, which is the single strongest thing a judge can watch.

**2. TOPI-TARKA** — the best live demo in the set: a solar node on a real pole, a dark lamp, and a genuine auto-rickshaw ride serving as a delay-tolerant courier across 800 m of real Bengaluru. The "the reporter walks away and it's gone forever" framing lands instantly, and no storm, outage, or partner is required to show it working.