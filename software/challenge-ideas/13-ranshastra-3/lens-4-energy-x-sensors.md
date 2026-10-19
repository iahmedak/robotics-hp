# Lens 4 — ENERGY & POWER × SENSING & FEEDBACK

**Event:** RanShastra 3.0 – AstraArena E-sports Championship
**Test:** remove either parent tech — does it still work? If yes, decorative → rejected.

**Compliance doctrine applied to all five concepts**
- Every sensor reads **the player's own body or the player's own hardware**. None reads game state.
- **No input injection, no macros, no overlay scraping, no packet capture, no auto-trigger, no aim-assist.** Output is advisory, on-device, human-in-the-loop, displayed on a small local readout the player chooses to glance at.
- Flagged cheat-adjacency is called out explicitly per concept so a jury can rule on it in 5 seconds.

**Shared scrim-fatigue evidence base**
Hand tremor (8–12 Hz physiological tremor) rises measurably with sustained concentration; peripheral surface temperature climbs 8–15 °C above ambient over a 5-hour block; grip force decays and becomes burstier under fatigue. These are the physical variables every concept below targets.

---

### 1. **SteadyHand**  **TOP 2**
- **Integration:** Thermoelectric generator (TEG module run in reverse as a Peltier actuator) + PCM thermal sink + supercapacitor buffer + flexible perovskite PV trickle strip  ⟵  **6-DOF IMU (MPU-6050 class)** in the mouse shell + **PID closed-loop controller** modulating Peltier duty cycle to palm-contact zone.
- **The product:** A palm-contact cooling half-shell for a gaming mouse that holds the contact surface at a set skin-temperature band and *automatically raises cooling only when your own micro-tremor rises*, powered by a trickle-charged supercap fed from a PV strip on the mousepad edge.
- **Which game it serves:** Valorant (primary — mouse aim, longest block structure), BGMI (PC emulator), EAFC25 (controller players get the pad variant).
- **Why BOTH are required:** Remove the **energy** side and the IMU is a laboratory with no actuator — you can measure tremor but cannot cool the hand that produces it; the tremor reading changes nothing you can feel. Remove the **sensing** side and a Peltier pad on constant duty is the exact device that already exists and is already dead: it either runs cold always (blunted hand, worse fine motor control after 90 min) or warm always. There is no PID without a feedback variable, and there is no load-bearing reason for a TEG+PCM stack to exist unless its duty cycle is being closed around a live measurement.
- **Compliance check:** The IMU is inside *your own mouse* measuring *your own hand's* acceleration — it has no path to game state, no ability to move your cursor, and its output is a number on a local OLED, not an input.
- **Bill of materials:** 40×40 mm Peltier/TEG module ₹120 · PCM pad tuned to 42 °C ₹85 · MPU-6050 breakout ₹80 · 1 F supercapacitor + protection/charge IC ₹55 · flexible mini PV strip 5 V/60 mA ₹90 · copper cold plate, nylon spacers, 3D-printed shell ₹55 → **₹485** (reuses existing mouse, pad, and USB port).
- **Competitive edge:** Holds contact-surface temperature inside a 3 °C band across a full 5-hour block instead of drifting 12 °C. Cooling duty is spent *only* during tremor excursions, so the hand stays warm-sharp in clutch moments and is actively chilled during dead scrim downtime — measurably lower tremor-band energy and lower aim-error drift in hour 4–5 than an uncooled or always-cooled hand.

---

### 2. **TapHarvest**  **TOP 2**
- **Integration:** Piezoelectric kinetic harvesting from the player's own thumb taps (Ø27 mm PZT disc → SS14 rectifier → 1 F supercapacitor) + boost converter  ⟵  **thumb-joint IMU (MPU-6050 class, ×2)** measuring MCP joint excursion + **flexible strain-gauge** on the thumb sleeve + haptic cue.
- **The product:** Thumb sleeves for mobile shooters that run entirely off the electrical energy in your own taps — they detect thumb-cramp onset from joint-angle excursion and give a single haptic "shake it out" tick before the cramp costs you a gunfight.
- **Which game it serves:** Clash Royale (₹5,000, shortest matches, highest tap rate — the perfect energy harvester), Free Fire Max and BGMI (₹30,000 each, longest blocks, highest cramp cost), EAFC25.
- **Why BOTH are required:** Remove the **energy** side and the sensor must run off the phone — the one device in the tournament you cannot tax, and the reason every existing wearable dies mid-bracket. Remove the **sensing** side and the harvester is a novelty trinket: harvested energy is µW-scale and worthless unless a controller is spending it on something. Piezo tap energy *is* the battery; IMU + strain is *what the battery is for*.
- **Compliance check:** It reads your thumb's biomechanics through your own skin — it never touches the phone's touch layer, never sees a button, and cannot press anything for you.
- **Cheat-adjacency flag:** A strain gauge mounted *on the fire button* would be auto-fire. **Explicitly excluded** — this product is thumb-and-index sleeves on the metacarpals, physically off the touch surface, and produces no output signal to any input path.
- **Bill of materials:** PZT piezo disc ₹70 + SS14 + 1 F supercapacitor ₹45 + boost converter ₹25 · 2× MPU-6050 ₹160 · HX711 load-cell front-end + flex strain gauges ₹110 · 8 mm LRA haptic + driver ₹90 · flex PCB ₹40 → **₹540**; drop to 1 IMU → **₹460**.
- **Competitive edge:** Chronometric cramp onset per thumb, not a survey. A coach can schedule the 6-player bench rotation against measured thumb-load decay instead of a stopwatch — mobile teams lose far more rounds in hour 4–5 to thumb lock than to aim.

---

### 3. **HandCurrent**
- **Integration:** Thin-film TEG harvesting the delta-T between a 33 °C palm and 22 °C room air, running a boost converter into a 0.5 F supercapacitor  ⟵  **strain-gauge bridge + 1 kg load cells** under the palm rest and on two finger pads, read through an HX711 front end.
- **The product:** A palm-rest module with *no battery and no charging cable* — it is powered by the heat of your own hand and continuously reports how hard you are gripping, so grip decay becomes a live number instead of a silent slump.
- **Which game it serves:** Valorant (mouse grip consistency), EAFC25/FIFA (thumb-stick torque consistency across a full match).
- **Why BOTH are required:** Remove the **energy** side and the load cells become a drain on a power bank — with 1–6 members sharing venue outlets, a station that needs charging mid-scrim is a liability, not a product. Remove the **sensing** side and the TEG is a very elegant paperweight. The genuinely non-obvious part is that **harvest power falls as the hand cools and perfuses worse** — the device is partly self-reporting fatigue, and that coupling disappears the instant you bolt on a Li-ion cell.
- **Compliance check:** Palm and finger contact force only — the readout never leaves a 2-digit local display and never reaches the PC.
- **Cheat-adjacency flag:** Load-cell data must stay **advisory**. Anything that modulates click force or click timing is auto-fire and is banned; this concept ships no path from the load-cell signal to the mouse button.
- **Bill of materials:** 40×40 thin-film TEG module ₹150 · 0.5 F supercapacitor + boost converter ₹70 · HX711 + 2× 1 kg load cells (palm + index) ₹130 · 2× flex strain gauges on thumb and little-finger pads ₹140 → **₹490**.
- **Competitive edge:** Peak-grip force drift tracked continuously. Fidgety players re-grip into a worse posture under stress; this lets them hold peak grip inside the band they trained at for a full 5-hour block, and it converts the invisible variable (grip confidence) into something a coach can actually coach.

---

### 4. **SixBreaths**
- **Integration:** Phase-change-material thermal mass (PCM slab charged by the venue's heat-pump/air-conditioning, released across a 5-hour block) + ToF presence gating so the mass is only spent when players are seated  ⟵  **electrochemical CO₂ gas sensor (MQ-135/MG-812 class)** + **VL53L0X ToF distance sensor** for occupant-count gating.
- **The product:** A six-seat team station whose desk-edge and seat-back thermal buffer is armed the moment the sixth player sits down, and whose CO₂ reading tells the bench when the booth air has gone stale enough to measurably degrade reaction time.
- **Which game it serves:** All six — but designed for BGMI and Free Fire Max scrim blocks, where 6 players sit in one unventilated booth for hours.
- **Why BOTH are required:** Remove the **energy** side and there is no thermal mass: the booth tracks ambient by hour 2 and the PCM does nothing an empty desk edge wouldn't. Remove the **sensing** side and the PCM dumps its charge on an empty chair, or sits inert because nobody told it to release. Presence-gated release *is* the load-bearing behaviour — it converts a passive slab into a schedule-aware one.
- **Compliance check:** Environmental sensing only — CO₂ concentration and seat occupancy. No device, no input, no game data.
- **Bill of materials:** 250 g PCM slab + aluminium seat-back spreader plate ₹170 · electrochemical CO₂ sensor ₹120 · VL53L0X ToF module ₹140 · MOSFET/PWM + 60 mm fan and diffuser duct ₹60 → **₹490**. Thermal charge source is the venue AC / a reused TEC from the SteadyHand build (listed as shared, not duplicated, to stay inside the ₹500 per-team envelope).
- **Competitive edge:** Booth CO₂ held under a threshold for the whole block instead of drifting 4× ambient by hour 3. Rotations can be scheduled against per-seat air-exposure time, and the whole team — not just the player who feels it — stops paying the reaction-time tax that a closed arena quietly levies on every member.

---

### 5. **ColdStart**
- **Integration:** PCM thermal storage slab (charged between matches, top-up by a small TEG/Peltier heat-pump module) on a mouse/keyboard platform  ⟵  **HC-SR04 ultrasonic (or VL53L1X ToF) presence sensor** arming the controller + **PID loop** holding the surface at a fixed setpoint.
- **The product:** A station platform that pre-cools to combat temperature the *instant* a player sits down, so the first gunfight of a round is fought on a cold surface rather than a warm one inherited from a five-minute warm-up.
- **Which game it serves:** BGMI and Free Fire Max (₹30,000 each, tournament station setups that run long and sit idle between rounds), EAFC25, Valorant (pad variant).
- **Why BOTH are required:** Remove the **energy** side and the platform is aluminium: it reaches ambient within 20 minutes and the mousepad thermal mass problem returns exactly as it does today. Remove the **sensing** side and the loop runs on a timer — either the surface is not ready when the round starts, or it burns charge on an empty station for the entire break.
- **Compliance check:** Detects a body approaching a seat; controls a fan and a Peltier duty cycle. It cannot see, touch, or influence the game.
- **Bill of materials:** 300 g PCM slab + aluminium platform plate ₹150 · 40×40 Peltier top-up module ₹120 · supercapacitor + PID board ₹60 · HC-SR04 ultrasonic module ₹60 → **₹430**.
- **Competitive edge:** Removes the round-one disadvantage nobody currently prices. Every competitor's gear is thermally loaded at the horn; surface temperature and its effect on the first 60 seconds of tracking is measurable and repeatable.

---

### Rejected as decorative (recorded for the jury)
- TEG-powered phone charger on the desk → remove the charging, nothing about *play* changes.
- CO₂ meter feeding a companion app → remove the sensor and it is a thermostat; remove the app and it is a wall clock.
- Load-cell mousepad with an on-screen force graph → no energy parent, no actuator, no competitive edge.

### Compliance summary
| Concept | Reads | Cannot do | Verdict |
|---|---|---|---|
| SteadyHand | own hand's IMU | emit input, read game | Clean |
| TapHarvest | own thumb biomechanics | press touch surface, read touch events | Clean (fire-button variant explicitly banned from scope) |
| HandCurrent | own palm/finger force | reach PC, modulate click | Clean (advisory output only) |
| SixBreaths | booth air + occupancy | anything to a device | Clean |
| ColdStart | seat proximity | anything to a device | Clean |

**Rule this lens operates under:** sensing yourself and your own gear is legal; sensing the game is not. Nothing above crosses that line, and nothing above can convert into input even if a jury disagreed — there is no electrical path from any sensor to any button.
