# Lens 4 — Connectivity & Protocols × Edge AI / TinyML
**Citi-Zen 2.0 · Bengaluru · two tracks · 2–5 members · ₹799**

**Assigned pair — both must be load-bearing in every concept below:**
- **A — Connectivity & protocols:** BLE mesh · LoRaWAN · Matter/Thread · local-first sync · store-and-forward sync · WebRTC/P2P · e-ink · delay-tolerant networking · optical/QR · ambient network protocols · federated sync
- **B — Edge AI & TinyML:** INT8 quantization · NPUs · microcontrollers · on-device inference · tiny transformers · keyword-spotting/wake-word · offline-first models · pruned networks · Frugal AI

**Counterfactual gate applied before writing.** For each concept: *remove A — does it still work?* and *remove B — does it still work?* If either answer is "yes" it was deleted. All five below fail **both** removals independently.

**Named parents used (no generic hand-waving):** RFC 9177 Bundle Protocol v7 (DTN store-and-forward) · ION-DTN · LoRaWAN 1.0.4 Class A on SX1262 + ChirpStack · WebRTC host-candidate ICE + insertable streams (no STUN/TURN) · Matter 1.3 OnOff-Plug / Energy-Management clusters over Thread 1.3 MLE with offline commissioning · Automerge / Yjs CRDT federated sync · e-ink partial refresh · camera visible-light ("data-over-light") transport with QR fallback · TFLite Micro + CMSIS-NN INT8 kernels · RK3588 NPU (6 TOPS, RKNN) · Silero VAD INT8 · Porcupine-style KWS · pruned 1D-CNN · ~5 M-parameter INT8 CTC Conformer.

**Targeting map (deliberate, not incidental):** four of five concepts name a specific ₹4,000 special award; #2 carries the Nature-based Bengaluru track, #1/#3/#4/#5 sit in Build-wize.

---

### 1. BOL — the caption mesh  **TOP 2**

- **Integration:** WebRTC mesh using **host-candidate ICE only** (no STUN, no TURN, no server — it runs on the school LAN or an ESP32 soft-AP with zero internet), plus local-first / federated sync via **Automerge CRDTs** so the transcript ledger converges device-to-device instead of through a cloud; e-ink is deliberately *not* used (live text needs >2 fps). On B: a **fine-tuned ~5 M-parameter INT8 CTC Conformer** (TFLite Micro + CMSIS-NN) running on the teacher mic's ESP32-S3, gated by **Silero VAD INT8 keyword-spotting** so it only transcribes the teacher's channel.
- **The product:** A ₹7,800-per-classroom offline speech-to-caption server — one RK3588 NPU box plus one ₹1,300 ESP32-S3 push-to-talk teacher mic — streaming INT8-captioned text over WebRTC straight into every student's **existing Android phone browser**. Better version of: Google Classroom Live Captions / Zoom Live Transcription, which need ~3 Mbit/s per room and a vendor account.
- **Which track / which special award it targets:** **Build-wize · Best School Innovation ₹4,000** (primary target). Karnataka has ~55,000 government schools and the majority have no working internet; this is the least-contested award on the board.
- **Why BOTH are required:** *Remove A* → there is no server path by design — the entire product is host-candidate LAN mesh plus CRDT convergence, so a school with no internet gets no captions at all. *Remove B* → the room is 40 students plus the teacher on one channel; you cannot separate speakers without an on-device model, and you cannot send it out: cloud ASR is ₹2/min and drops on a 200 kbps link. Each removal is independently fatal.
- **Bill of materials (per classroom):**
  - Orange Pi 5 Plus 8 GB (RK3588, 6-TOPS NPU, RKNN) — ₹6,500
  - ESP32-S3 DevKit-1 (8 MB PSRAM) — ₹400
  - INMP441 I2S MEMS mic + foam windscreen — ₹140
  - MAX98357A I2S amp + 3 W speaker (local monitoring) — ₹180
  - 3D-printed ABS belt-clip enclosure — ₹150
  - 2000 mAh Li-ion + 2 A protection/charger — ₹350
  - Student displays — ₹0 (BYO phones, browser client)
  - **Total ₹7,720 → ₹7,800/classroom → ~₹32 per child per academic year**
- **Build time:** 30 h (18 h caption pipeline + KWS gating + dataset, 6 h KWS gating, 6 h mesh/CRDT sync)
- **Measurable impact claim:** *40 minutes of a real class, with the WAN cable physically unplugged, produces ≥95% caption word accuracy on a held-out speaker set at ≤400 ms end-to-end word latency, with 0 bytes leaving the LAN.* A judge can verify the whole claim in 4 minutes by pulling the cable mid-class.

---

### 2. BHOOMI — the silt-aware rain-garden gate  **TOP 2**

- **Integration:** **LoRaWAN 1.0.4 Class A** (SX1262 + ChirpStack — burst, not stream, duty-cycle limited) carrying **RFC 9177 Bundle Protocol v7 store-and-forward** with a deliberately unbounded delay budget (a node must survive an entire monsoon week with the gateway down), plus **federated sync** so one garden's learned silt behaviour propagates to the next; on B, an **INT8 pruned 1D-CNN + TCN on the ESP32-S3** (CMSIS-NN) classifies what is arriving in the runoff and drives a 12 V linear sluice actuator locally.
- **The product:** A ₹5,200 node per rain garden that opens and closes its inlet and overflow gates based on what is *actually arriving* in the runoff — a **new product**: these gates today are either manual or on a fixed weekly timer, which is exactly why Bengaluru's rain gardens silt up in their first season.
- **Which track / which special award it targets:** **Nature-based Bengaluru · Best Nature Based Solution ₹4,000** (primary target). Rain gardens, percolation trenches and restored tank-bunds are the city's own nature-based retrofit programme; none of them are instrumented.
- **Why BOTH are required:** *Remove A* → six nodes around a 2-hectare rain garden have no cellular coverage, LoRaWAN Class A delivers bursts that a gateway reboot during peak inflow will truncate, and without Bundle Protocol v7 store-and-forward the **first-flush record is lost** — and the first flush is the single event that decides whether the garden works or silts up. *Remove B* → you are left with float-switch plus turbidity thresholds, which on real Bengaluru runoff fire ~25 false events on a Monday morning and miss sewage-surcharge events entirely; the model also cannot be moved to a cloud because there is no cloud.
- **Bill of materials (per node):**
  - ESP32-S3 DevKit-1 — ₹400
  - SX1262 LoRaWAN 1.0.4 module + antenna — ₹650
  - SEN0189 turbidity sensor (analog out) — ₹320
  - EC/conductivity analog probe — ₹180
  - VL53L1X ToF module + float guide (level) — ₹450
  - 12 V linear actuator + SS rod + gate frame — ₹1,800
  - 5 V 2 W solar panel + 18650 ×2 + TP4056 — ₹830
  - IP65 ABS enclosure — ₹350
  - Connectors, glands, wiring — ₹300
  - **Total ₹5,280 → ₹5,200/node** (vs ₹1.2 lakh for a PLC + VFD retrofit of the same gates)
- **Build time:** 16 h
- **Measurable impact claim:** *On a 2-hectare rain garden, the node classifies ≥90% of inlet events correctly on a 200-event labelled set, and holds turbidity at overflow below the silt-loading limit across a 50 mm simulated storm — against a float-switch baseline that passes silt on 3 of 5 runs.* Judge-verifiable with a hose, a graduated bucket and two turbidity probes.

---

### 3. JYOTI — the submeter that tells you what to switch off

- **Integration:** **Matter 1.3** (OnOff-Plug + Energy-Management clusters) over **Thread 1.3** MLE, commissioned and controlled **local-first** — Matter's own offline-commissioned path, so the device keeps working when the ISP link does not — plus an **e-ink partial-refresh** face that draws no backlight power; on B, an **INT8 pruned 1D-CNN/MLP on the SoC NPU** disaggregating 30-minute kWh series into appliance classes (compressor / AC / pump / fridge) from load shape + power factor.
- **The product:** A ₹3,900 DIN-rail submeter with a load-shed solid-state relay and an e-ink face, for Bengaluru's small commercial shops and apartment complexes — better version of: the ₹2,500 import submeter that reports kWh to a vendor cloud and tells you nothing.
- **Which track / which special award it targets:** **Build-wize · Best Sustainable Infrastructure Innovation ₹4,000**
- **Why BOTH are required:** *Remove A* → sixty sub-meters across a six-floor building need a Wi-Fi hub per floor and cloud polling — and a load-shed event is precisely when the hub and the link are gone, so the one moment you need the data is the one moment the network fails; Matter+Thread exists to make that moment survivable. *Remove B* → you have a better kWh meter that cannot answer the only question the owner has ("what changed?"), because disaggregation *is* the model — and at ₹2/MB, cloud inference over a year of 30-minute series costs more than the hardware.
- **Bill of materials (per unit):**
  - ESP32-P4 + ESP32-C6 module board (Matter / Thread) — ₹2,100
  - 3 × SCT-013 100 A CT clamp — ₹250
  - ZMPT101B isolated voltage sense + op-amp — ₹80
  - 2.13" e-ink SPI display (partial refresh) — ₹420
  - 40 A solid-state relay + heatsink — ₹380
  - 3D-printed DIN-rail enclosure + DIN clip — ₹300
  - Terminals, wiring — ₹200
  - **Total ₹3,730 → ₹3,900/unit**; a 60-point building = ₹2.34 lakh
- **Build time:** 20 h
- **Measurable impact claim:** *On a real shop's metered supply the node assigns ≥85% of energy to the correct appliance class over 7 days (F1 score) and trips the shed relay on a 12% sustained overshoot of sanctioned load; the following month's bill shows ≥8% kWh reduction against the same shop's previous month.* Judge-verifiable with a clamp meter and a 1 kW test load.

---

### 4. SAFAI-TAG — the sanitation worker's offline voice log

- **Integration:** **LoRaWAN 1.0.4 Class A** (SX1262, ChirpStack) as the opportunistic backhaul plus **RFC 9177 store-and-forward** with a multi-day delay budget and a **BLE mesh** drain-to-phone when the worker reaches the ward depot; on B, **INT8 Silero VAD + Porcupine-style keyword spotting** on the ESP32-S3 to segment the shift into typed events.
- **The product:** A ₹2,330 IP65 belt-tag for Bengaluru's ~85,000 contract sanitation workers: two big rubber buttons (Complaint / Handed-over), press and speak, and the tag segments, geo-stamps and stores the entire 8-hour shift on-device — better version of: the WhatsApp-plus-paper-slip-plus-handover-register that BCC's SWM non-convergence metric is measured against.
- **Which track / which special award it targets:** **Build-wize · Impact Award ₹4,000**
- **Why BOTH are required:** *Remove A* → a sweeper spends ~90% of a shift with no uplink, and the record of a broken drain cover or a skipped house is created exactly in those minutes; without delay-tolerant store-and-forward there is no way to move it later, which is precisely the failure today's paper process exists to survive. *Remove B* → 8 hours of un-segmented audio is 230 MB per worker per shift; collapsing it into complaint / handover / noise is a 1.4 MB INT8 model running on the tag — and no server can do it, because the audio never gets there in the first place.
- **Bill of materials (per unit):** ESP32-S3 DevKit-1 ₹400 · SX1262 + antenna ₹600 · 2 × IP67 push buttons + LEDs ₹150 · MEMS mic + foam windscreen ₹180 · 3D-printed IP65 body + belt clip ₹250 · 2000 mAh Li-ion + 2 W solar trickle panel + TP4056 ₹750 · **Total ₹2,330/worker** (a 30-worker ward = ₹69,900)
- **Build time:** 10 h
- **Measurable impact claim:** *With the radio in airplane mode for a full 8-hour shift, ≥92% of pressed events are correctly segmented and geo-tagged, and 100% of them appear in the ward log within 4 hours of the worker returning to the depot.* Judge-verifiable in 30 seconds: airplane mode, then hold it against the sink.

---

### 5. NETRA — the sub-centre that syncs over light

- **Integration:** **Camera visible-light transport ("data-over-light") with QR fallback** as an ambient network that needs no radio pairing, no router and no internet, wrapped in **RFC 9177 store-and-forward** so a missed visual handshake is simply retried on the next walk-past; on B, an **INT8 TFLite-Micro image classifier (5.6 M params)** reading the rapid test strip on-device, with a confidence gate that refuses to report below threshold rather than guessing.
- **The product:** Two BYO Android phones become the internet for a Bengaluru sub-centre: the ANM's phone reads the rapid test strip **on-device** and flashes the record as a high-contrast data card; the PHC's phone reads it back with its camera at 20–60 cm while walking past and files it offline — better version of: paper register plus weekly HMIS upload.
- **Which track / which special award it targets:** **Build-wize · Impact Award ₹4,000** (alternate framing for **Best Sustainable Infrastructure Innovation**, if pitched as primary-care infrastructure)
- **Why BOTH are required:** *Remove A* → the sub-centre has no connectivity and the day's records exist only on paper; they cannot be batch-sent later because they were never captured digitally in the first place. *Remove B* → the result depends on the PHC, so there is nothing to send; the INT8 classifier must run on the phone precisely because the phone has no uplink to send the image to.
- **Bill of materials:** BYO Android phones ₹0 · LED light-gate rig for the PHC door (12 W COB panel + diffuser + 3D-printed stand; lifts throughput ~4×) ₹1,100 · trickle charger for off-day field visits ₹600 · **Total ₹1,700** — the cheapest transport in this document, and the easiest to demo
- **Build time:** 12 h
- **Measurable impact claim:** *≥120 records/minute transferred optically at 20–60 cm with a 0.01% bit-error rate and CRC-verified frames; 30/30 printed test strips classified correctly offline at ≥95% accuracy; sub-centre records go from paper-same-day to digital-same-minute.*

---

### Why the top two

**BOL** and **BHOOMI** are the only two entries where the award, the failure mode and the demo reinforce each other: BOL owns an under-contested award (*Best School Innovation*) with a four-minute, unplug-the-cable proof, and BHOOMI carries the *Nature-based Bengaluru* track with a track-specific award (*Best Nature Based Solution*) where the winning claim — a silted rain garden — is visible, physical and unforgeable. Both also have the cleanest cost story (₹32/child/year, ₹5.2k/node) and neither can be reduced to a dashboard.

*Rejected before drafting, per the counterfactual gate:* "LoRaWAN sensor + cloud dashboard" (works with either parent removed), "AI irrigation adviser" (needs neither mesh nor on-device inference), "QR attendance register" (works with no TinyML — the AI is decorative), and anything using `qr`-as-a-billboard rather than `qr`-as-a-transport.