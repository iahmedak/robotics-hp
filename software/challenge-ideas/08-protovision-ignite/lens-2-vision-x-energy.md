# Lens 2 — COMPUTER VISION & IMAGING × ENERGY & POWER
## ProtoVision Ignite · National Hardware Innovation Challenge · 4 members · ₹500

**Assigned lens:** A = computer vision & imaging (cameras, depth/stereo, thermal IR, event, mmWave, drone imagery, optical flow, edge CV on cheap MCU/NPU) · B = energy & power (PV, TEG, supercapacitors, Li-ion, fuel cells, kinetic harvesting, PCM, heat pumps, thermal storage, energy-harvesting ICs).

**The recurring engineering fact that makes this lens work at ₹500:** a vision node and an energy source are normally two independent systems bolted together. That is decorative. The only fusion that survives the counterfactual is **a closed loop where the energy state is what lets the vision happen at all, and the vision reading is what decides how the energy is spent.** Every concept below is built on that loop. That is also why we deliberately rejected LiDAR, thermal cameras, hyperspectral, mmWave and event sensors — they are ₹8,000–₹60,000 class parts and cannot survive ₹500. Stated plainly: **any concept here that needed a stereo rig, a thermal imager or a drone is a failure for this event, not a stretch goal.**

**Vision platform used by all five (named, real, specific):** ESP32-CAM-MB (ESP32-S3 Xtensa LX7 dual-core @240 MHz, 8 MB PSRAM) + **OmniVision OV2640** 2 MP CMOS sensor with on-chip hardware JPEG encoder. The OV2640 JPEG engine is the reason a ₹275 board can do real edge CV — the sensor downsamples and compresses *before* the CPU sees the pixels, so frame differencing, blob counting and brightness-centroid search all run on 10-frame ring buffers of 1.5 KB each.

**Budget reality check (read this before shopping):** ESP32-CAM-MB is listed at ₹400–₹585 by marketplace retailers (ElectroPi ₹585 incl. GST, Hubtronics ₹547). **That single line item busts the budget.** Every BOM below assumes the wholesale/local-module rate of **₹275** (Robu / QuartzComponents / component-bazaar bulk pricing, OV2640 included). If your team buys at ₹400, you must substitute — see the contingency note under Concept 1. Do not discover this at 11 pm.

---

### 1. SUNFINDER — a solar tracker with no light sensor

**TOP 2**

- **Integration:** OV2640 frame-centroid sun localisation (brightest-minutiae blob search with a chromatic-disc discriminator, run on the ESP32-S3's hardware-JPEG frames) **+** 6 V 1 W silicon PV as the tracked payload, MT3608 boost converter and 2 × 1 F supercapacitors as the burst-energy buffer.
- **The product:** A two-axis sun tracker that finds the sun by looking at it, not by measuring lux, and runs its servo in duty-cycled micro-bursts off a 1-watt panel.
- **What existing product becomes better:** The ₹2,000–₹4,000 four-photocell trackers sold for rooftop panels and water pumps. They use a photodiode *array* with a fixed az/el ratio, so they collapse under thin cloud, haze, or when a bright cloud edge sits at the same zenith angle as the sun — a well-documented failure. SUNFINDER replaces the four photodiodes with one camera and one discriminator.
- **Why BOTH are required:** *Remove the camera* and you must go back to photodiodes, which cannot distinguish the solar disc (small, ~0.5°, extremely hot, high blue fraction) from diffuse skylight or a specular cloud edge — the tracker's whole reason for existing. A ₹25 LDR + a servo would oscillate toward the brightest *region*, not the sun. *Remove the energy side* and it is not a tracker at all, it is a servo on a USB cable — a different product with a different bill of materials and a different failure mode. The supercap specifically is what makes it work: a 1 W panel cannot supply a 9 g servo's 180 mA stall current continuously, so the servo is given a 900 ms pulse from a 1 F cap, charges back over 30 s, and re-aims. The vision decides *where*; the energy system decides *how often*, and neither can be deleted.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | ₹ |
  |---|---|
  | ESP32-CAM-MB development board + OV2640 2 MP camera (wholesale rate) | 275 |
  | 9 g micro servo SG90 + horn + 2 × M3 clevis | 60 |
  | Mini mono PV panel 6 V / 1 W (60 × 120 mm, epoxy) | 45 |
  | MT3608 boost converter module | 15 |
  | Supercapacitor 1 F 2.7 V ×2 (series) + holder | 45 |
  | 1000 µF 25 V electrolytic + 1N4007 + 1 kΩ | 15 |
  | Perfboard, pin headers, hookup wire, solder | 30 |
  | Bracket from scrap aluminium/acrylic, cable ties, felt pads | 15 |
  | **TOTAL** | **500** |
- **Build time:** 11–13 hours (2 h mechanical bracket and servo linkage, 5 h firmware: JPEG ring buffer → luminance downsample → 3×3 median → brightest-16 search → chromaticity test → servo pulse budget → capacitor charge accounting, 3 h power board, 1–2 h testing).
- **Judge-table demo:** They rotate the panel away from the sun — it locks on within two seconds and the servo ticks; then a judge holds a sheet of white paper in front of the *brightest part of the room* and the tracker does **not** move, then removes the paper and it re-locks.

---

### 2. TREMORSCOPE — an oscilloscope for energy harvesters, powered by the thing under test

**TOP 2**

- **Integration:** OV2640 blob-tracking frequency measurement (frame differencing on a 160 × 120 luminance window, centroid path fitted to a zero-crossing period) **+** a piezo-buzzer ceramic element harvested through a 1N4148 full-wave rectifier into a 1 F supercapacitor, with a coin vibration motor as the specimen being characterised.
- **The product:** A contactless, non-invasive, wiring-free bench instrument that optically measures the frequency and amplitude of a kinetic or piezoelectric energy harvester — and whose own operating power comes from the harvester it is measuring.
- **What existing product becomes better:** The ₹4,000–₹12,000 lab rig for characterising energy harvesters: a bench oscilloscope plus a piezo accelerometer glued to the specimen with epoxy plus a 3 mm phone connector. The accelerometer adds mass to the very thing being measured (it changes the resonant frequency), needs a wired BNC cable that constrains the mounting, and aliases badly above its own sample rate. A camera at 30–60 fps watches the mass from 200 mm away through a clear acrylic wall and touches nothing.
- **Why BOTH are required:** *Remove the camera* and you have a vibrating motor and a capacitor — there is no measurement at all. Getting one requires an accelerometer (₹250+) plus a host machine, which is the exact cost problem this lens is escaping, and which contaminates the specimen. *Remove the energy-harvesting side* and there is nothing powering the camera and nothing to characterise: the supercapacitor voltage **is** the instrument's energy reading and the piezo **is** the transducer under test. This is the one concept where the energy technology is simultaneously the power supply and the object of study — remove it and both halves of the product die simultaneously.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | ₹ |
  |---|---|
  | ESP32-CAM-MB + OV2640 (wholesale rate) | 275 |
  | Piezo buzzer element 27 mm (transducer under test, + spare) | 25 |
  | Coin vibration motor 10 mm (specimen) + 2 mm adhesive foam | 20 |
  | Micro servo 9 g (rubber-band tensioner arm) | 55 |
  | Supercapacitor 1 F 2.7 V module | 35 |
  | MT3608 boost converter | 15 |
  | 1N4148 ×4, 1N4007, resistive divider resistors | 10 |
  | Perfboard, headers, hookup wire | 30 |
  | Green 3 mm LED + 1 kΩ (raw-energy indicator, unmetered) | 5 |
  | Aluminium foil, hot-glue, M3, cable ties | 20 |
  | **TOTAL** | **490** |
- **Build time:** 9–11 hours (1 h specimen mount and optical window, 5 h firmware: luminance downsample → binary motion mask → connected-component centroid → period estimator with hysteresis, 3 h rectifier/boost/supercap build and bring-up).
- **Judge-table demo:** Judges shake the table and the LED and the frame counter pulse in lock-step; stop shaking and within ~3 seconds the LED dies and the last frame freezes — the camera is visibly running on the harvester.

---

### 3. FROSTLINE — a ₹500 thermal-camera surrogate for cold-plate and heat-sink design

- **Integration:** OV2640 imaging of the **condensation and evaporation front** (fog bloom, melt-front advance, symmetry analysis of the vapour plume) **+** a TEC1-12706 bismuth-telluride module operated *in reverse* as a thermoelectric generator, harvesting the gradient between a phase-change cold mass and ambient air to charge a supercapacitor that powers the camera.
- **The product:** An optical instrument that turns a temperature gradient into a *visible, quantifiable* image — so you can design a cold plate, a fin stack or a thermal-storage wall without owning an ₹8,000 thermal camera.
- **What existing product becomes better:** The pocket thermal camera (FLIR C-series, ₹15,000–₹45,000) and, at the other end, the ₹90 DHT22 temperature probe. The probe gives you exactly one number, so it cannot tell a finned sink from a flat plate, cannot find the mounting hot-spot, cannot measure melt-front advance rate, and cannot detect an asymmetric gasket leak — because all of those are *spatial* phenomena. The thermal camera solves them but costs 30–90× the total event budget.
- **Why BOTH are required:** *Remove the camera* and you are left with a TEC module and a thermocouple: one scalar, no spatial information, and no way to compare two competing heat-sink geometries — the actual engineering task is lost. *Remove the energy side* and there is no temperature gradient and no frost: an ordinary camera in a lit room sees a dry aluminium plate, because the entire subject is a thermally-induced optical phase change. It is also true at the sub-system level — the TEG's output is proportional to the plate-to-air ΔT, so covering the PV or letting the ice melt *visibly throttles the camera's frame rate*, which is the cleanest possible demonstration that the two are the same system.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | ₹ |
  |---|---|
  | ESP32-CAM-MB + OV2640 (wholesale rate) | 275 |
  | TEC1-12706 thermoelectric module (operated as TEG) + brushed copper fins | 85 |
  | MT3608 boost converter | 15 |
  | Supercapacitor 1 F 2.7 V module | 30 |
  | Scrap aluminium plate, 4 cut fin strips, thermal paste, cotton wick | 25 |
  | Perfboard, headers, hookup wire | 35 |
  | M3 bolts, silicone gasket strip, cable ties | 20 |
  | **TOTAL** | **485** |
  | *Supplied free by the team:* ice, a stainless-steel plate or tumbler, a cloth | 0 |
- **Build time:** 8–10 hours (3 h finned-plate machining and TEG mounting with thermal paste, 4 h firmware: luminance → fog-segmentation by local-contrast threshold → front-advance centroid tracking → symmetry score, 2–3 h TEG/supercap bring-up and gel-plate trial-and-error).
- **Judge-table demo:** Lay ice on the plate and fog blooms across the fins on camera while the raw-energy LED climbs; then slide a finger over the TEG's hot side and the fog retreats, the LED drops, and the frame rate visibly falls.

---

### 4. GLASSWALK — the solar panel that inspects itself, powered by its own light

- **Integration:** OV2640 surface metrology on the panel under test — row/column current-shadow profiling, Laplacian-variance edge energy, and grey-scale coverage statistics to separate **soiling and debris coverage %**, **shading-band width** and **cell-boundary fracture** **+** a 6 V 1 W silicon PV with 2 × 1 F supercapacitor buffer as the whole power budget for a burst-capture-then-sleep inspection cycle.
- **The product:** A palm-sized puck you place on a module for ten seconds; it returns a pass/fail verdict on soiling, shading and visible cell damage without a laptop, a multimeter or a technician.
- **What existing product becomes better:** Drone IV-curve thermography inspection of utility-scale solar farms, which costs ₹3–₹15 lakh per visit and needs clear sky, a licensed pilot and a truck. GLASSWALK does the optical half of that inspection — the part that actually catches soiling and hairline cell damage — for the price of a school lunch, and it works at ground level with no drone.
- **Why BOTH are required:** *Remove the camera* and you are left with electrical-only methods: an IV-curve tracer or electroluminescence imaging (₹3,000+ and ₹50,000+ respectively). Both detect damage only once it has become an electrical fault; **soiling coverage percentage and hairline micro-cracking are optically visible long before the electrical signature appears.** A four-photocell shading detector cannot distinguish 4% uniform soiling from 4% partial shade, because both reduce irradiance by the same amount. *Remove the energy side* and the puck needs a USB cable and a laptop — at which point you have an expensive webcam on a bench, and the entire field-deployable proposition that justifies the product evaporates. The supercapacitor is not optional either: the panel being inspected may be the failing one, and a burst-capable buffer is what lets the same hardware serve both healthy and dead modules.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | ₹ |
  |---|---|
  | ESP32-CAM-MB + OV2640 (wholesale rate) | 275 |
  | Mini mono PV panel 6 V / 1 W | 45 |
  | Supercapacitor 1 F 2.7 V ×2 (series) + holder | 45 |
  | MT3608 boost converter | 15 |
  | 1000 µF 25 V electrolytic + 1N5819 Schottky + divider | 10 |
  | Perfboard, headers, hookup wire | 30 |
  | Acrylic sled, M3, felt anti-scratch pads, adhesive | 30 |
  | Spare 1 W mini panel to serve as the specimen | 40 |
  | **TOTAL** | **490** |
- **Build time:** 9–11 hours (2 h sled machining, 5 h firmware: 6-frame column-profile acquisition → slope/edge test → Laplacian variance → binary-coverage integration → verdict UART out, 2 h power cycling, 1–2 h calibration against a soiled sample).
- **Judge-table demo:** The puck sits on a clean panel and prints PASS, then a judge taps a smear of grease onto the second panel and the same ten-second run prints SOILED with a coverage percentage — while the puck runs with no cable attached.

---

### 5. SOLAR MOTE — a vision node whose wake-up schedule is set by harvested energy

- **Integration:** OV2640 frame-differencing change detection with a two-stage gate (ADC brightness threshold → full-image motion diff → keep-or-discard) **+** a 6 V 1 W PV charging a TP4056 / 18650 Li-ion cell through an MT3608 boost with a 1000 µF buffer, with the MCU's own duty cycle governed by measured state-of-charge rather than a timer.
- **The product:** A sub-₹500 always-outdoor vision node that a 1-watt panel keeps alive for weeks, because it captures only when the frame actually contains something new — and the capture rate is set by how much energy the panel actually made today.
- **What existing product becomes better:** The ₹3,000–₹8,000 solar Wi-Fi IP camera, which is either always-on and flattens its battery in 3–5 cloudy days, or is sold with a 20,000 mAh pack. Both keep capturing frames that contain no information. SOLAR MOTE makes the energy budget and the vision budget the *same* budget.
- **Why BOTH are required:** *Remove the vision* and the cheapest trigger is an LDR or a ₹40 PIR — and both are wrong in the exact way that kills this product: a PIR fires on a moving shadow or a hot engine with nothing in it, and an LDR fires on a cloud crossing. Either one converts a six-week deployment into a four-day one, and neither can say *what* changed. *Remove the energy side* and it becomes a mains-powered Wi-Fi camera — a mature ₹800 product with no engineering content in it at all. The PV is what creates the 20 mW ceiling that makes the vision algorithm non-negotiable.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | ₹ |
  |---|---|
  | ESP32-CAM-MB + OV2640 (wholesale rate) | 275 |
  | Mini mono PV panel 6 V / 1 W | 45 |
  | TP4056 micro-USB Li-ion charge module | 12 |
  | 18650 Li-ion cell + 2-slot holder | 70 |
  | MT3608 boost converter | 15 |
  | 1000 µF 25 V electrolytic + 1N4007 | 10 |
  | Perfboard, headers, hookup wire | 35 |
  | Enclosure from scrap acrylic, cable ties, adhesive | 18 |
  | M3, hook-and-loop strap | 15 |
  | **TOTAL** | **495** |
- **Build time:** 10–12 hours (5 h firmware: charge-state-aware scheduler, brightness gate, 3-frame motion diff with a discard path, deep-sleep wake source, Wi-Fi burst transmit, 3 h power board, 2 h solar-window profiling).
- **Judge-table demo:** It sits in the sun logging to serial; a judge walks past and it transmits exactly one frame — then the build log shows it captured 1 image in 90 minutes while a naive always-on cam would have transmitted 5,400.

---

## Contingency if the ESP32-CAM-MB arrives at ₹400+

Do **not** abandon the vision. Substitute, in order of preference:
1. **ESP32-C3 dev board (₹220) + OV7725 DVP module (₹130)** = ₹350. Smaller frame (320 × 240 QVGA fits the ESP32-C3's 400 KB SRAM as greyscale), so drop resolution and raise frame rate. All five concepts still work; SUNFINDER and GLASSWALK lose nothing.
2. **STM32F103C8T6 Blue Pill (₹120) + OV7670 (₹150)** = ₹270 — cheapest, but only 20 KB RAM and you will hand-roll the pipeline in C. Only attempt this with someone who has written a DMA-fed camera capture loop before.

## What we deliberately did not propose, and why

- **LiDAR / mmWave radar / hyperspectral / event camera / thermal camera** — ₹8,000–₹60,000 class parts. A concept that needs one does not survive a ₹500 budget and would be scored as non-viable.
- **Fuel cells** — the smallest methanol cell that will light an LED is a ₹350 kit that will not charge a Li-ion, let alone run an OV2640.
- **Anything that needs a laptop to be interesting.** All five run standalone; a laptop is used only as a serial terminal to watch frames, never as part of the product.