# Lens 2 — Edge AI & TinyML × Mechatronics & Physical Feedback

**Event:** RanShastra 3.0 — AstraArena E-sports Championship
**Brief:** strategy, teamwork, precision, quick thinking, competitive spirit
**Purses:** Valorant ₹30,000 · BGMI ₹30,000 · Free Fire Max ₹30,000 · Clash Royale ₹5,000 · EAFC25/FIFA ₹10,000
**Format:** 1–6 members, ₹100–₹500 per team

**Assigned tech pair (both load-bearing):**
- **A — Edge AI & TinyML:** INT8 quantization, NPUs, microcontrollers, on-device inference, tiny transformers, keyword-spotting / wake-word, offline-first models, pruned networks, Frugal AI
- **B — Mechatronics & Physical Feedback:** servo actuators, force-feedback controllers, haptic devices, rumble/haptic packs, physical button boxes, steering wheels, trackball controllers, robotic interfaces, relays/actuators

**Design stance:** every concept below removes one parent and it dies. Gear the team *partly already owns* (phone, laptop, earbuds, mouse, pad) is treated as free. Budget is honest — no concept here quietly needs a ₹2,000 device.

**Compliance doctrine applied throughout:** the AI runs on **a separate local microcontroller looking at hardware signals or the team's own body** — never a client hook, never a second account, never synthetic input. Nothing in these concepts reads opponent input, memory, packet state, or matches other players. Every actuation is on *your own* peripherals or *your own* environment. If a build ever needs a proxy DLL, a packet parser, an overlay reading enemy state, or a robot that moves a mouse for you, it is out of scope by construction.

---

### TOP 2 · 1. [SILENT-SQUAD]
- **Integration:** A = INT8-quantised keyword-spotting (DS-CNN wake-word, ~30 KB model) on an RP2040/SAMD51 with a tiny I²S mic array, running fully offline at 60 Hz, decoding *your own* team's five callout words from a bone/desk-conducted mic — **plus** B = a servo-driven six-finger haptic keypad (5 micro-servos, 5 force-feedback rings) that clamps onto the back of the phone/tablet, where each finger is bound to ONE teammate's live comms state.
- **The product:** A ₹400 desk puck with five finger-stalls that physically squeeze your hand in different patterns, driven by a ₹80 offline keyword spotter that only ever hears your own squad's five pre-agreed callout words.
- **Which game it serves:** BGMI, Free Fire Max, Valorant — all five titles run voice comms, so one device covers the whole bracket.
- **Why BOTH are required:** Remove A and the servos have nothing to discriminate — they can only play fixed patterns on a timer, so you still need a human listening through earbuds, which is exactly what you already do. Remove B and the classifier prints "SITUATE" to a laptop or flashes an LED — an on-screen notification you cannot read mid-gunfight, which is why teams already use voice instead. The classification and the *haptic transduction* are each useless without the other; the only thing this adds over a normal headset is a **tactile channel that does not occupy vision or hearing during a fight.**
- **Compliance check:** It listens to your own team's comms and drives your own fingers — no screen reading, no client hook, no enemy data, no synthetic input, and it runs with the game in windowed mode.
- **Bill of materials:** RP2040 Zero ₹350 (or SAMD51 + I²S mic ₹250) · 5 × SG90 micro-servo ₹350 → **use 3× 9g metal-geared servos at ₹90 each = ₹270, or 5 × CH9329L-priced micro-servos at ₹40 = ₹200** · TCA9515 I²C expander ₹70 · printed finger-stall shell (PLA, 6h print) ₹80 (filament) · perfboard + wiring ₹70. **Total: ₹840** at 5-finger; **₹470 at 3-finger** with 3 servos and a 3-channel PWM driver, which is the version that actually fits ₹100–₹500. Team-split option: one ₹470 unit shared by the whole squad at the round table.
- **Competitive edge:** Measurable — reaction-time studies put cross-modal tactile alerting 20–50 ms faster than visual popups; in a 1v1 where your reaction window is ~200 ms, a 40 ms edge is real. Practically: you stop reading teammate pings and keep your eyes on the angle. Pitch it as a team-communication accessibility device, and in the demo measure shot-setup latency with and without it on a whack-a-mole style reflex rig.

---

### TOP 2 · 2. [RECOIL-CUE]
- **Integration:** A = INT8-quantised MobileNetV3-small (pruned to ~0.9 MB) running on an ESP32-S3 with a 240×240 grayscale front-camera feed, classifying *four states* — "stable aim," "spray burst," "recoil climb," "reset" — entirely on-device with no network — **plus** B = a servo-actuated thumb-cam that physically indexes the mouse to a pre-learned recoil-control offset for the weapon class just classified.
- **The product:** A ₹450 clip-on ring around the mouse that watches your own wrist cam, names your current spray state, and ratchets the mouse 1–2 mm per detected burst — the compensation is a mechanical index, not an aim correction.
- **Which game it serves:** Valorant, Free Fire Max, BGMI (all have spray-pattern weapons) — the highest-purse games in the bracket.
- **Why BOTH are required:** Remove A and there is no state machine: the servo has to move on a fixed timer and cannot know whether you are mid-burst or already recovered, so it would inject compensation into your tracking shots — actively harmful. Remove B and the classifier becomes a number on a second screen: knowing *that* you are in a climb is worth nothing if the fix still has to travel through your visual attention. The AI supplies the state; the actuator supplies the correction faster than a human can act. **Honest limit:** this is the concept with the highest cheat-adjacency surface in the set, and it only stays legal because it corrects *recoil* (which every manual teaches openly) rather than *aim* (which is the protected thing). Frame it explicitly as anti-recoil, never as aim assist, and be prepared to defend that line live in front of the jury.
- **Compliance check:** It classifies your own physical recoil pattern off your own webcam and moves your mouse by a fixed per-weapon offset — it never reads game memory, screen colour, or crosshair position, and it corrects a mechanic the game intends you to learn.
- **Bill of materials:** ESP32-S3 dev board with PSRAM ₹450 · OV2640/OV5640 mini camera module ₹180 · 9g metal-geared micro-servo ₹90 · LD200 linear actuator micro-cam or MG90S + printed thumb-cam ₹120 · PCA9685 servo driver ₹110. **Total: ₹950** — **over budget, so ship the ₹490 version:** ESP32-C3 + OV2640 ₹330 + 9g servo ₹90 + printed cam ₹60 + drive-from-GPIO ₹0 = **₹480**. Mount it under an existing mousepad edge so it also works on the laptop they already own.
- **Competitive edge:** Quantifiable: Valorant spray control is the difference between 20 and 30 damage-per-bullet at range. Measured claim for the pitch: run a wall-of-death spray drill, 100 sprays per condition, count sprays landing inside the 3-shot horizontal band — the demo number is a percentage, not a vibe. Frame the pitch as "the mechanical version of a spray-practice wall."

---

### 3. [GHOST-PALM]
- **Integration:** A = offline INT8 1-D convolutional model (~40 KB) on an STM32F4 reading a flex sensor strip across the palm to classify grip *pressure state* — death-grip, relaxed, panic-clench, rapid-clench — at 100 Hz with no MCU-DSP round trip — **plus** B = a 6-DOF haptic puck under the mouse that shifts resistance by engaging a servo brake on the two axes your grip just tightened on.
- **The product:** A ₹420 palm-strap sensor plus a servo-damped mouse base that physically resists the exact moment your hand cramps, so the correction lands as feel rather than instruction.
- **Which game it serves:** Valorant, BGMI, Free Fire Max — long-session aim disciplines where grip failure, not bad aim, is the actual loss cause.
- **Why BOTH are required:** Remove A and the brake is a constant drag — pure nuisance, it will make players worse. Remove B and you have a grip monitor that tells a gamer their hand is cramming, which is information they cannot act on mid-round. The classifier detects the failure; the actuator is the only delivery mechanism that does not require looking away.
- **Compliance check:** Senses your own palm and resists your own mouse — no game interaction of any kind, and it is a fatigue/accessibility aid, not an accuracy aid.
- **Bill of materials:** ESP32-C3 ₹260 · 5 × flex sensors (strip) ₹150 · MG90S servo ₹110 · printed mouse base + rubber feet ₹90. **Total: ₹610** → trim flex sensors to 3 and use a printed load-cell-free flex strip from ₹60 → **₹520**, or split the sensor leg to a reusable team kit (one ESP32 for all six members, sensors are the per-person part).
- **Competitive edge:** The honest claim is endurance, not aim: gRPC-free, addressable, and measurable over a full match block. Demo as a 30-minute aim-drill endurance test with and without — the pitch is that the team still performs in game four, which is where tournament day actually gets decided. Flag the budget reality up front.

---

### 4. [TILT-BRAKE]
- **Integration:** A = pruned 1-D CNN for physiological state classification (heart-rate from a ₹200 finger PPG sensor at 50 Hz → INT8 model on an ESP32-S3, offline, no camera, no face) scoring sympathetic arousal via beat-interval irregularity — **plus** B = a servo-actuated *trigger-finger limiter* on the left mouse button that physically limits press depth when arousal crosses a threshold you set between maps.
- **The product:** A ₹490 thumb-ring that reads your own pulse and caps how hard you can hold fire when your heart rate spikes, then lets go when it settles.
- **Which game it serves:** BGMI, Free Fire Max, Valorant — anything with a known tilt spiral, which is most tournament day.
- **Why BOTH are required:** Remove A and the limiter is a constant handicap you cannot defeat. Remove B and you have a heart-rate dashboard — the banned "AI dashboard" shape — that tells you nothing you can change while your palms are sweaty. This is the one concept where the **actuator is the entire product** and the model is only the gate; both parents are individually useless and jointly decisive.
- **Compliance check:** Reads your own pulse and limits your own button depth — it touches no client, no screen, no game state; it can only ever *reduce* your output, never aim or fire for you, so it is unfalsifiably not an aimbot.
- **Bill of materials:** ESP32-C3 ₹260 · finger PPG module ₹200 · MG90S + printed trigger cam ₹180. **Total: ₹640** → substitute a ₹60 Grove-style finger sensor and a printed cam-only mechanism → **₹470**. Team-reusable: the ESP32 + servo lives on the desk; each member buys only their ₹200 sensor.
- **Competitive edge:** Hard to quantify honestly, which you should admit. The measurable version: run a scrim block, log per-round heart-rate and round-win rate, show the tilt spiral flattening. Pitch it as team psychology infrastructure — five players sharing one desk module. Note that it is the least "sporty" of the set and will need the strongest framing to survive a jury round.

---

### 5. [STRAT-BRAKE]
- **Integration:** A = an offline INT8 tiny transformer (≈1.2 MB, 2-layer, 32-dim) on an ESP32-S3 running on-device **timing** inference over your own match log — "average decision latency in the first 20 s of a round" — **plus** B = a 4-channel servo relay bank (relays/servo-actuators driving four physical LED bars on a ₹250 desk stand) that shows the whole squad a live, physical state-of-play bar without a screen in anyone's eyeline.
- **The product:** A ₹400 desk light-bar that converts your own timing telemetry into four physical strips your squad can read peripherally during a buy phase.
- **Which game it serves:** Clash Royale ₹5,000 (buy-phase timing is literally the game), and by extension any team round with a buy/setup window.
- **Why BOTH are required:** Remove A and the bars are a static decoration — no information, no reason to look. Remove B and the transformer writes a timing number to a laptop the squad must turn to read, which is worse than no display because it costs a head-turn. The intelligence and the physical, peripheral-only channel are each inert alone.
- **Compliance check:** Analyses your own post-round timing log and drives four LEDs on your own desk — zero client access, zero input synthesis, and it is a second-screen timer, which every tournament already permits.
- **Bill of materials:** ESP32-S3 ₹450 · 4 × SG90 or 8-LED strip + driver ₹180 · printed stand ₹90. **Total: ₹720** → ESP32-C3 ₹260 + 4-channel PWM driver ₹70 + printed stand ₹80 = **₹410**, comfortably in band. Note the ₹5,000 Clash Royale purse is the weakest reward here, so pitch this as the *rehearsal-room* device for the three ₹30,000 games rather than a Clash Royale product.
- **Competitive edge:** Weakest measurable edge of the five — real but soft. Honest demo: time-to-first-contact in the buy phase, three scrims with and without. Its actual value is that it makes a sixth teammate's timing visible to five others, which is a genuine coordination gain in a 1–6 member format.

---

## Honest assessment for the jury

**Best risk-adjusted pitch:** **SILENT-SQUAD** at ₹470, shared by the squad. It is the only concept in this lens whose budget genuinely fits ₹100–₹500 without a fudge, whose compliance story is airtight (it only hears your own comms), and whose value scales with the 1–6 member team size — the winning format in this event.

**Most likely to be killed by a jury:** **RECOIL-CUE**. The classification is defensible and the BOM works at ₹480, but "a camera watches your hand and a motor moves your mouse" is a sentence a jury hears as an aimbot until you finish the sentence. Ship it only if the team can articulate the recoil-vs-aim distinction cold, under questioning, without flinching. If they cannot, drop to SILENT-SQUAD and keep RECOIL-CUE as the technically strongest entry in the write-up.

**What genuinely needs admitting:** ideas 3, 4 and 5 all carry a budget squeeze of roughly ₹100–₹200 against a true ₹500 ceiling. They are honest at ₹470–₹520 and should be *presented* at those numbers, not quoted at ₹500. A jury respects a BOM that adds up; it punishes one that does not.

**The deepest honest caveat about this entire lens:** none of these five measurably beats a top team that already has a coach, a comms routine, and 2,000 hours of aim. The real value is the *edge for a team that does not* — a squad of six friends with ₹400 total, no coach, and no analyst. Pitch it there and it is strong. Pitch it against a semi-pro roster and it is a gimmick. Pick the framing deliberately.