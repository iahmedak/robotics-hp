# Lens 2 — Computer Vision & Imaging × Edge AI & TinyML
### CodeSangram 3.0 — National Hackathon, "technology-driven solutions to real-world challenges in Namma Bengaluru"

Mandate applied to every concept: **remove either technology and the product stops working.** If it still functions, it is decorative and gets cut. No cloud-in-a-box, no dashboards, no CRMs — the deliverable is a device.

---

### 1. ONEWAY Box

**TOP 2**

- **Integration:** Fixed HDR RGB camera (IMX708, night-capable) + INT8 YOLO-class detector with ByteTrack-style tracking and a lane-axis direction classifier running on an RK3588S NPU (6 TOPS) in a solar pole box, with an on-device 8-second ring buffer.

- **The product:** A ~₹21k pole-mounted box that watches one unstaffed Bengaluru junction and decides *locally* — wrong-side rider, helmetless rider, triple-rider — keeps the clip on its own SSD, and pushes only the violation.

- **Bengaluru problem it solves:** Bengaluru Traffic Police covers 1,200+ junctions with a few hundred field staff. The rest are watched by CCTV towers that go blind at night and, even where footage exists, nobody triages it — so wrong-side riding on ORR, Sarjapur Road, Old Airport Road and 100 Feet Road produces head-on crashes weekly, and helmet enforcement stays manual and seasonal. Every existing "smart policing" analytics stack is cloud-side and assumes fibre that most junctions do not have.

- **Why BOTH are required:** Delete the edge tier and the box must stream 1080p25 (~4 Mbps) per junction to a cloud — 1,200 junctions is a ~1 Gbps sustained pipe plus per-frame cloud inference on a city with patchy backhaul; the economics and the latency both die. Delete the camera and there is no substitute sensing layer: two-wheelers in India carry no mandated telematics, and there are no inductive loops or beacons at these junctions. The pairing is precisely what makes *one thousand boxes* affordable rather than one demo booth. Neither technology is decoration; either one alone is either impossible or unaffordable.

- **Bill of materials:**
  - Orange Pi 5 8GB (RK3588S, 6 TOPS NPU) — ₹3,299
  - Raspberry Pi Camera v3, IMX708, autofocus + HDR — ₹4,299
  - NVMe 256 GB (clip store) — ₹3,299
  - Active cooler + copper spreader — ₹500
  - Aluminium IP-rated enclosure (local fab) — ₹1,200
  - Pole U-clamp + 12 V 3 A SMPS + MCB/earthing — ₹900
  - 20 W panel + 20 Ah LiFePO4 + charge controller — ₹3,000
  - SIM7600E Cat-4 modem (optional store-and-backhaul) — ₹1,200
  - Supercap / UPS ride-through — ₹800
  - Cabling, glands, connectors, misc — ₹1,500
  - **Total ≈ ₹21,500** (swap to Pi 5 8 GB + Hailo-8L for +₹9,000 if you want 13 TOPS)

- **48-hour build plan:**
  - **H0–3** — Two members at a live 3-arm junction (12th Main Indiranagar or a Domlur inner-ring leg) *at night*, capturing 400+ frames of correct-side vs wrong-side two-wheelers plus rider count and helmet state; label by hand. Member 3 does enclosure CAD and pole clamp. Member 4 sources all BOM locally (Robu / LootCoder / Sunrom) and confirms RK3588 NPU toolchain on H0–H2 — **this is the day-one risk, kill it first.**
  - **H3–8** — Annotate → 320 px training pipeline on Colab free T4 (₹0). Train YOLOv8n, 30 epochs, with hard night augmentation (HDR gain, headlight bloom, motion blur, rain smear) so it survives 8 PM lighting rather than noon. Export ONNX → INT8 → RKNN for the NPU.
  - **H8–14** — Inference service on the OPi: capture → NPU infer → track → direction classifier from track displacement vector against the road axis (per-junction calibrated axis, not a vanishing-point research project). Ring buffer writes 8 s @ 15 fps continuously.
  - **H14–20** — Violation logic + clip writer + backhaul of *only* the 8-second clip and a JSON record. Reconnect-tolerant queue.
  - **H20–28** — Power stack, supercap hold-up, enclosure fab, pole clamp, surge protection. **In parallel, build a replay harness**: a 30-minute recorded junction night video the box runs on and draws boxes to, so the live demo can never be a coin flip on catching a violation.
  - **H28–36** — Install at a permitted location (your own building frontage, or a terrace with a street-facing angle). Tune thresholds on real night footage. Measure and record: NPU FPS, watts drawn, GB stored/day, recall on the labelled set.
  - **H36–44** — Deliverable is the enforcement officer's output, not a product dashboard: one static page + a shareable clip link. Spend the rest of the time on the accuracy slide — precision/recall at night, cost per junction per year versus one human post.
  - **H44–48** — README, recorded demo reel, BOM/BOI, fallback video from the replay harness, and one printed page titled "the maths": ₹21,500 capex ÷ 1,200 junctions, against what a human post costs.

- **Data: free/open vs needing partnership:** ~80% free — self-captured night junction footage plus CC-BY dashcam, COCO/Kaggle rider classes for pretraining; partnership is only a sanctioned pilot junction and BTP sign-off, neither of which the demo depends on.

---

### 2. HOTLINE

**TOP 2**

- **Integration:** MLX4064-class MLX90640 32-pixel thermal IR array + a ~40 KB INT8 thermal-anomaly autoencoder running on an ESP32-S3 (Xtensa LX7, 8 MB PSRAM) in a 2-minute duty cycle on 10 W solar.

- **The product:** A ~₹6,500 solar node clamped to every distribution transformer that learns *that specific transformer's* normal winding-temperature-vs-load signature and raises a pre-failure alarm hours or days before a burnout.

- **Bengaluru problem it solves:** BESCOM's ~15,000+ distribution transformers fail disproportionately through summer and monsoon, and the dominant failure modes are thermal — loose joints, degraded bushings, overloading, LT animal damage. Cause is always discovered *after* the outage in a post-mortem. The only non-contact measurement of winding temperature is an IR camera, and IR cameras today are handheld, expensive, and produce a PDF a month later.

- **Why BOTH are required:** Delete the edge tier and you are pushing 16-bit 384×288 thermal at 25 fps (~5 MB/s) off thousands of poles to a command centre that does not exist and would not be staffed 24×7 — a thermal failure alarm that arrives after the outage has zero value. Delete the thermal camera and there is no remaining non-contact probe: contact RTDs require wiring every winding, cost more per point, return a single number instead of a field, and — critically — destroy the hotspot-vs-winding distinction that separates a bad bushing from a bad joint, and the adjacent LT-drop signature that tells you animal bite from overload. The edge model is also the only thing that makes the alert *specific to one transformer* rather than a universal threshold that false-alarms every monsoon.

- **Bill of materials:**
  - MLX90640 32-pixel thermal array module (Melexis, 55 °C) — ₹1,250
  - ESP32-S3-WROOM-1 N16R8 dev board — ₹650
  - SIM800L / EC200U Cat-0/1 modem — ₹500
  - 2600 mAh Li-ion + TP4056 + 5 V boost — ₹600
  - 10 W IP-rated solar panel + PWM charge controller — ₹1,800
  - IP67 ABS enclosure + cable glands — ₹600
  - SCT-013 current clamp for load correlation — ₹350
  - Stainless banding strap, sealant, ties — ₹500
  - **Total ≈ ₹6,250** — cheapest concept here by roughly 3×, which is itself the Frugal-AI argument

- **48-hour build plan:**
  - **H0–2** — Safety and scope, agreed before anyone touches hardware: no pole work in 48 hours. Build around a **campus HT/LT switchgear or the transformer outside our own building**, and simulate a fault with a 100 W load across a deliberately poor joint. Write the safety note; it becomes a judge-facing artefact.
  - **H2–6** — Member A: ESP32-S3 TFLite-Micro harness — deep-sleep wake → MLX90640 read over I²C → 32 px reduced to an 8×4 feature vector → model → NVS flash log → radio only on alarm.
  - **H6–12** — Member B: the dataset, built the honest way and therefore self-supervised on purpose. Run the node across a full thermal day at 5 load states (idle, 30 %, 60 %, 110 %, and the faulted joint), logging time-of-day, load, ambient, per-pixel ΔT-vs-ambient, and hotspot location. Train INT8 autoencoder + 2-class head in Colab, convert, target < 40 KB.
  - **H12–18** — Member C: the part that is actually the IP — normalise against a **per-transformer rolling baseline** (EMA of the previous 7 days at the same hour *and* the same load band), so one model transfers across hardware and climates. This is the slide.
  - **H18–26** — Member D firmware: alarm debounce over 3 consecutive windows, brownout handling on sagging 3.3 V rails, SMS/LoRa payload ("Jayanagar 4th Block — ΔT 41 K over ambient at 96 % load, hotspot B-phase"), and a separate "sensor healthy, node starving" state so a flat battery is never mistaken for a healthy transformer.
  - **H26–32** — Physical build: IP67 box, banding clamp, 45° solar, drip loop. Survive one real evening peak.
  - **H32–40** — Validation run: hold the simulated fault 2–3 hours and show the alarm fires *before* the smoke and smell, not after. Capture evening-peak thermal frames against the alarm timestamp. **The single plot — ΔT vs ambient over time with the alarm line at T−3 h — is the money slide.**
  - **H40–48** — Energy budget (30 s awake / 12 min asleep ≈ 180 mAh/day ≈ 4 days autonomy on 2 days of sun), the fleet-cost slide (500 nodes = ₹32.5 lakh, versus one thermal-inspection contract that returns a PDF a month later), and a static view the judges see once so we can stop talking about UI.

- **Data: free/open vs needing partnership:** 100% self-generated and free — no dataset exists, which is the entire point; training data comes from our own instrumented load rig and the open TinyML toolchain, with a BESCOM liaison letter and a sanctioned install as credibility, not as a dependency.

---

### 3. NIGHTRIDER

- **Integration:** Stereo RGB pair (2× IMX219, 6 cm baseline) + 850 nm IR illumination + INT8 2-D classifier + 32-bit disparity on the RK3588S NPU, fused with BNO085 IMU and NEO-M8N GNSS, entirely on-vehicle.

- **The product:** A ~₹11,800 rear-corner alert for auto-rickshaws and two-wheelers that says *what* is behind you — cattle, pedestrian, parked bike, autorickshaw — and how close, in under 60 ms, with no radar.

- **Bengaluru problem it solves:** Bengaluru's fatal-accident profile is dominated by two-wheelers and, on the ORR stretch past Nelamangala, Sarjapur Road, Whitefield and Old Airport Road, by cattle and stray dogs — largely at night on unlit road. Radar ADAS modules start around ₹6,000–15,000 and still cannot tell a cow from a parked motorcycle, so every affordable system is either expensive or semantically blind. Auto-rickshaws here have no rear sensing whatsoever.

- **Why BOTH are required:** Delete the edge tier and the stereo pipeline — rectify, disparity, depth, 3-D tracking, classification — cannot round-trip through a network in time: Bengaluru's median mobile RTT on a moving vehicle is 150–400 ms, and there are tunnels and underpasses with zero coverage. A brake warning that arrives late is worse than none. Delete the camera and the alternatives are ultrasonic, which is centimetre-range and only tells you something is *there*, or radar, which costs 2–3× our BOM and still cannot classify the object. The pitch is exact: **stereo depth on an 8 TOPS edge NPU makes classification cheap enough for a ₹12k two-wheeler box.**

- **Bill of materials:**
  - Orange Pi 5 8GB (RK3588S) — ₹3,299
  - 2× Raspberry Pi Camera v2 (IMX219) + 6 cm baseline bracket — ₹1,000
  - 850 nm IR illuminator array (4× 3 W) + driver — ₹1,800
  - BNO085 9-axis IMU — ₹450
  - NEO-M8N GNSS + patch antenna — ₹900
  - 5" HDMI panel + bezel (demo unit only) — ₹1,200
  - 12 V→5 V 3 A automotive buck + ignition sense + fuse — ₹600
  - 64 GB microSD — ₹450
  - 3D-printed enclosure + seat/handlebar mount — ₹1,000
  - Buzzer + haptic puck + relay stub — ₹400
  - Wiring, loom, misc — ₹700
  - **Total ≈ ₹11,800** (drop the display → ₹10,600)

- **48-hour build plan:**
  - **H0–3** — Night recon. Ride the ORR stretch past Doddaballapur with a spotter, or — safer and honest — stage it in a dim corridor with a borrowed cow statue, a cardboard cutout, a real bike and a real pedestrian, lit only by headlights. Capture stereo pairs.
  - **H3–9** — Calibrate stereo offline (`stereoRectify` + `StereoSGBM` → disparity). Establish usable depth at 0.5–6 m from a 6 cm baseline at 320×240. **This is the riskiest block — have the mono-depth fallback (MiDaS-small INT8, ~14 MB) written by H9 or the whole concept collapses.**
  - **H9–16** — Train INT8 YOLOv8n on six classes (cow, dog, pedestrian, parked motorcycle, moving motorcycle, autorickshaw) using free COCO pretrain plus hard-negative-mined night frames. Quantise and land it on the NPU.
  - **H16–22** — Runtime: paired capture in one process → rectify → disparity (or mono depth) → 2-D detect → depth at box centre → ego-motion compensation from IMU + GNSS → tracks in the rear frustum → time-to-collision from bearing + depth + yaw rate → tiered buzzer/haptic.
  - **H22–28** — Print and fit the housing on a two-wheeler underseat or an auto grab rail; power from vehicle 12 V; dusk ride test.
  - **H28–36** — Night validation: 100 logged runs with a spotter. Report precision at 3 m and 6 m, false-alarm rate, and true end-to-end latency from frame capture to buzzer.
  - **H36–44** — Competitive slide: SR020/SR410 module price against our BOM *plus* the label our system provides and theirs cannot. Second slide: our compute vs a cloud-only design — uplink bytes and monthly bandwidth at 1 million vehicles.
  - **H44–48** — Rehearse the 90-second walkthrough with no slides. The demo beat is the buzzer firing for a cow at 4.2 m.

- **Data: free/open vs needing partnership:** free/open — BDD100K, Cityscapes, COCO, plus ~200 self-captured night frames; no partnership needed, and one auto-driver association for a fleet pilot is a post-win conversation, not a build dependency.

---

### 4. SETU

- **Integration:** HDR mono camera (IMX708) + a two-stage edge model — fast INT8 road-surface segmentation, then a monocular inverse-perspective **depression-residual** head — on RK3588S, fused with BNO085 IMU and a BH1750 ambient-light gate.

- **The product:** A ~₹11,300 in-vehicle unit that warns you *before* you drop into a road depression — a 3-second buzzer — with no dashboard, because the uplink does not exist where the damage is.

- **Bengaluru problem it solves:** BBMP has no public, continuously-updated pothole inventory; Mapillary and Google coverage in Bengaluru is sparse and frequently months stale; most reports are X posts. The damage that actually hurts riders is not the sharp-edge pothole a ₹200 IMU app already catches — it is the shallow, wide depression: collapsed service-line trenches, sunken road edges, post-monsoon "waves", producing hundreds of high-centre-of-mass falls a month with **no accelerometer signature at all**.

- **Why BOTH are required:** Delete the edge tier and the warning must arrive in under 150 ms at 50 km/h — roughly two metres of travel — which no network can deliver, and Silk Board, Marathahalli and KR Pura underpasses have no coverage at all. Delete the camera and the IMU is provably blind to the target class: a 60 mm depression spread over 1.2 m produces well under 1 g at two-wheeler vertical-band frequencies, while a real pothole produces 3–6 g. IMU can only say "something happened", which is exactly why every existing phone app misses the ones that hospitalise people.

- **Bill of materials:**
  - Orange Pi 5 4GB — ₹2,900
  - Raspberry Pi Camera v3 (IMX708, HDR, autofocus) — ₹4,299
  - BNO085 IMU — ₹450
  - BH1750 ambient light sensor — ₹180
  - 3.5" SPI TFT or small HDMI panel + bezel (demo only) — ₹900
  - Piezo buzzer + driver — ₹120
  - 12 V→5 V 3 A buck + fuse + ignition sense — ₹600
  - 64 GB microSD ring buffer — ₹450
  - Enclosure + vented windscreen mount — ₹800
  - Wiring, loom, adhesive mount — ₹600
  - **Total ≈ ₹11,300** (a ₹400 OV5647 instead of Camera v3 gives ₹7,400, at real cost in HDR headlight performance — do not trade it away)

- **48-hour build plan:**
  - **H0–3** — Find and film three real Bengaluru road depressions: a service-line trench on an ORR feeder road, a sunken road edge near Whitefield, a collapsed trench slab beside a stormwater drain. Film from a moving two-wheeler at 20/30/40 km/h; log IMU at 200 Hz. Ground truth the honest way: a folding ruler in the depression, photos with a reference object.
  - **H3–8** — Annotate 300–500 frames as road / road-depressed / edge-drop / not-road. Start with a fast INT8 BiSeNetV2- or MobileNetV3-class segmentation at 256×160 — it also yields the free-space mask we need next.
  - **H8–16** — The bit that wins the hackathon: from the free-space mask, fit a per-frame **inverse-perspective transform** using the vanishing point recovered from the segmentation boundary, then measure the road plane's cross-slope and the local vertical residual in rectified road coordinates. A depression is a smooth, wide, low-curvature anomaly that survives a Gaussian filter; a pothole is a sharp, high-curvature one. Train a second INT8 stage (< 30 KB) on residual-curvature energy, width, longitudinal extent and headlight-illumination ratio. BH1750 gates the whole model to night only, so daytime cost is zero.
  - **H16–22** — Fuse with IMU under an explicit policy: CV raises "depression 8–20 m ahead"; an IMU shock within 1.5 s of passing it confirms. Both go to the SD log as CSV — the record is the product.
  - **H22–28** — Print the housing with real ventilation (the OPi throttles in a sealed box), windscreen mount, vehicle power, dusk ride.
  - **H28–36** — Night validation on the same three depressions at three speeds **plus 2 km of clean road as the false-positive control.** Target: FP < 1 per km. Print that number.
  - **H36–44** — Invert the value proposition: BBMP has no inventory, so the unit *generates* one — a static map built from the GPX + clip index the box writes itself, a crowd-sourced depression inventory at ₹9,500 per car and zero BBMP budget. (The product is the box; the map is the proof it works at scale.)
  - **H44–48** — Live demo on a dark quiet lane near the venue with a weighted foam depression (2 m × 0.6 m × 8 cm, with permission) so the warning fires guaranteed. Rehearse the 60-second cut: rolling at 20 km/h, warning at 12 m, drop.

- **Data: free/open vs needing partnership:** free/open — BDD100K road masks plus ~500 self-captured video frames and IMU logs; no partnership needed; BBMP or a road-engineering partner is the deployment path only.

---

### 5. GERE

- **Integration:** Free multispectral satellite imagery (Sentinel-2 L2A, 10 m, six-band; ISRO Bhuvan tiles) + a sub-2 MB INT8 change-segmentation network executed **on-device** on a ₹9k Android phone via NNAPI, fully offline-first.

- **The product:** A field-verification app that, with the radio off and a 2 MB model, diffs this season's lake tile against the last, paints the encroachment delta onto a 20 MB cached basemap, and captures a geo-tagged, sun-azimuth-normalised photo into a tamper-evident local bundle.

- **Bengaluru problem it solves:** Bellandur, Ulsoor, Hebbal, Yelahanka and Agara are the site of the city's most contested land disputes — encroachment, illegal reclamation, sewage discharge, water hyacinth. BBMP/BRT's own surveys are 6–18 months stale and unpublished, and because they are the disputed document, they cannot settle anything. Residents are doing the surveillance manually with WhatsApp photos that carry no trustworthy date, no consistent geolocation, and no way to prove "this was here in March and it is not now."

- **Why BOTH are required:** Delete the on-device tier and this becomes a hosted notebook: per-request GPU cost, a server to operate, and connectivity — for a user standing on a Bellandur lake bund with two bars and 5 % battery. The offline-first INT8 constraint is a geographic and economic requirement here, not a preference. Delete the imagery and there is no dated, geometric, independent baseline at all: BBMP's own shapefiles are the thing in dispute, and the only competing record is a phone photo whose date is a claim, not a measurement.

- **Bill of materials:**
  - Used/refurbished Redmi Note 12/13 (4–6 GB, has an APU for INT8 NNAPI) — ₹9,000
  - On-device INT8 runtime (ONNX Runtime Mobile / TFLite) — ₹0
  - Coral USB Accelerator (optional, for the live-lab demo only) — ₹7,500
  - 20,000 mAh power bank (field reality) — ₹1,200
  - GNSS accuracy jig + phone tripod — ₹900
  - Training: Google Colab T4 or Kaggle P100, free tier — ₹0
  - Offline basemap tiles (Sentinel-2 + OSM), pre-cached — ₹0
  - **Total ≈ ₹11,100 core, ₹18,600 with the optional Coral**

- **48-hour build plan:**
  - **H0–3** — Pull 4–8 seasons of Sentinel-2 L2A for a three-lake AOI (Ulsoor, Hebbal, Bellandur) at 10 m; stack six bands (B2/B3/B4/B5/B6/B8); compute an NDWI baseline; hand-label ~400 tiles as water / encroached / vegetated lake / urban / bare.
  - **H3–10** — Train MobileNetV2-encoder U-Net at 128×128, INT8, target **< 2 MB**. Add a second **change head** consuming (current, T−1 season) as a 12-channel input and emitting an encroachment-delta mask. That reframing is the real innovation: single-date lake classification has been done a thousand times; season-over-season encroachment delta at 2 MB on a phone has not.
  - **H10–16** — Build the Android app (Kotlin + TFLite): offline tile pack, a swipe gallery of candidate change polygons, one-tap "confirm encroachment" that geotags + timestamps + hashes the photo into a local hash-linked ledger, and "share" producing a self-verifying bundle a BBMP official can open cold. No login, no server, no CRUD.
  - **H16–22** — Field-run it on a real lake bund. **Reakridge the AOI**: download the tile pack over Wi-Fi, then switch to airplane mode and complete the entire flow with the radio off. That is the demo, and it must be rehearsed twice.
  - **H22–30** — Stretch that fits: use the phone's own GNSS samples against the DEM to report encroachment as **pond-area change in m² per season**, which is the unit a dispute actually turns on.
  - **H30–38** — Accuracy: IoU/F1 per lake and a table of the six largest documented encroachments we detect in the last two years versus what appears in the public record.
  - **H38–48** — Rehearse the two-minute story: *the record is a photograph; we are making it a measurement.* Show the offline pack loading, the delta polygons, the verifiable bundle, and the cost slide — ₹0/month, zero servers, working on a ₹9k phone in a place with no signal. Print the model card: 1.8 MB, INT8, F1 on two lakes, transfer required on the third.

- **Data: free/open vs needing partnership:** entirely free/open — Sentinel-2 L2A, ISRO Bhuvan, OSM, plus ~400 self-labelled tiles; no partnership to build or demo, and BBMP/BRT collaboration is the deployment path we earn after the win, not a prerequisite.

---

## Ranking rationale

| # | Concept | Why it ranks here |
|---|---------|-------------------|
| 1 | **ONEWAY Box** | Tightest counterfactual on both axes, quantified (bandwidth maths, cost per junction), demoable without permission, and the "replay harness" fallback removes the live-demo coin flip. |
| 2 | **HOTLINE** | Cheapest BOM by 3×, purest Frugal AI, the per-transformer baseline is genuine defensible IP, and the "alarm at T−3 h, not T+0" plot is a single-slide proof. |
| 3 | **NIGHTRIDER** | Strong radar-killer economics, but stereo calibration is the real 48-hour risk and the night demo depends on staging. |
| 4 | **SETU** | Excellent technical wedge (depression vs pothole is a genuinely unsolved CV distinction) and a real inventory output, but the IMU counterfactual needs a chart to land with a generalist judge. |
| 5 | **GERE** | Best offline-first TinyML story and free data, but satellite change detection reads as less operationally urgent than power or road safety to a Bengaluru panel. |