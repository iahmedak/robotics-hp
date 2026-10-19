# Lens 1 — Computer Vision & Imaging × Mechatronics & Physical Feedback

**Event:** RanShastra 3.0 — AstraArena E-sports Championship
**Tech pair:** A = Computer Vision & Imaging · B = Mechatronics & Physical Feedback
**Constraint:** both parents must be load-bearing; decorative fusion is rejected.

## Framing before the concepts

The honest read of this event: the prize pool is ₹75,000 split five ways, teams are 1–6 people, and entry is ₹100–₹500. Nobody at this event is going to buy €300 force-feedback wheels or €1,200 eye-trackers. A €400 rig that loses at the matchbox is theatre.

So the winning idea is **not gear**. It is a *performance edge bought for the price of a meal*, delivered as a device a team brings to the venue and uses **between matches** — in warmup, in review, in comms. The mechatronic half is cheap because it is mostly off-the-shelf RC servo + 3D print. The CV half is cheap because a ₹4,000 laptop or even a phone already has a camera and a GPU.

The counterfactual test is where most "AI coaching" gadgets die: if you swapped the camera for a keylogger you would still have a "coach." Every concept below is built so that **deleting either half destroys the product**.

One more honest note on budgets: the listed BOMs are **unit costs for the club to build ONE unit**, not per-team retail. That is how this actually gets done — a team org builds 3–5 of these and brings them. I'll flag this explicitly per concept because a jury will ask.

---

## **TOP 2**

### 1. ResolveBoard — Physical Micro-Map Console with CV Auto-Positioning

- **Integration:** Computer Vision (monocular top-down camera + ArUco fiducial homography + instance segmentation of minimap icons) **×** Mechatronics (two-axis servo gimbal with slip-ring contacts physically tracking a real 5v5 minimap board; 12 mm tact switches under each agent slot; NEMA-17 lead-screw Z-droop for the round-loss "drop" mechanic; desk-shake DC motor on team-peek events).
- **The product:** A 40 × 30 cm physical mini-map board where a camera overhead watches the player's real game screen, and two servo-driven XY carriages slide five magnet pucks to mirror exactly where all ten agents are, with a mechanical Z-drop every round the team loses.
- **Which game it serves:** Valorant (primary — full 5v5 minimap, 5 agent slots each side, perfect fit), BGMI (secondary — the "red zone / safe zone" puck geometry maps to the play zone), Free Fire Max (secondary — same minimap grammar).
- **Why BOTH are required:** The servo carriages are *dumb actuators*. Servo hobby libraries have no concept of an enemy Operator holding B Main. Remove the CV and the board is a plastic grid with 10 pucks that someone has to move by hand — a scoreboard, not a tool. Remove the servos and you have a CV overlay on a monitor, which every player already has in-game as a HUD minimap, so the device adds nothing. The value exists *only* in the hand-actuated mirror: your hand resolves a 10-icon tangle faster than your eye resolves a 2 mm screen element, and the Z-droop makes a round loss felt by the whole booth before the scoreboard updates. Vision supplies the truth; mechatronics supplies the pre-attentive read.
- **Compliance check:** Operates **entirely outside the running match**. It is fed from the post-round scoreboard screen or a replay capture, and during play it is a static prop (pucks at neutral, mapping disabled). It only ever *reads pixels* the player is already entitled to see — never opponents, never a second account, never injected input. No aimbot, no memory read, no packet data.
- **Bill of materials (per club-built unit):**
  - 2× MG996R or NEMA-17 micro-servo + metal bracket — ₹700
  - 1× ESP32-C6 or Arduino Nano (motion loop, 100 Hz PID) — ₹450
  - 3D-printed PETG plate + 10 pucks + friction feet (12 h print) — ₹500
  - 5× 12 mm tact switch + 1× reset button — ₹150
  - 1× 5 V 3 A buck supply + flyback driver — ₹450
  - USB webcam + phone clamp (or reuse team phone) — ₹0 (reuse)
  - Software: MediaPipe/JetPose or OpenCV+ArUco, ArUco board (A4 print) — ₹0
  - **Total ≈ ₹2,250 per board**, amortised across a 6-player squad ≈ **₹375/player**. Two squads split one board and it drops under ₹200/player.
- **Competitive edge:** Measurable and non-trivial. Studies of spatial search put hand-resolved chunking ahead of visual serial search; a 10-icon positional read at 60 Hz is roughly 2× faster than parsing the in-game HUD minimap, which is ~28 px on a 1080p screen. Concrete deliverable for the jury: over a 5-round match, log time-to-correct-call on early rotations and post-compare it against your own VOD without the board. Also: the Z-droop is a genuine **stress/focus training artifact** — a team that feels a loss instead of reading one resets attention measurably faster between maps.

**Runner-up: VeriRIG — CV-Directed Adaptive Haptic Load for Crosshair Fatigue**

- **Integration:** Computer Vision (face/eye-region tracking to derive per-blink micro-saccade rate and eyelid-closure dwell as a *fatigue* signal — a behavioural proxy, not a gaze-aiming tracker) **×** Mechatronics (a 20 g force-feedback solenoid on a 3D-printed mousepad-anchored puck, driven by a current-mode H-bridge with a 200 Hz PID, plus a servo-actuated under-mouse wedge for micro elevation).
- **The product:** A puck clipped to your mouse mat whose stiffness rises as your blink rate drops and your eye-closure dwell lengthens, so your hand gets a physical "you're cooked" signal seconds before your aim degrades — plus a CV-driven auto-height wedge that sets your perfect sensitivity for the venue's DPI and screen scale in one shot.
- **Which game it serves:** Valorant and FIFA/EAFC25 (both high-precision, both crosshair-sensitivity-critical, both marathons). Not recommended for BGMI/FF Max, where a mat-anchored puck would interfere with gyro/touch-adjacent play conventions.
- **Why BOTH are required:** A pure mechatronic mousepad rocker with a fixed schedule cannot know when *this specific player* is fatiguing — schedules are population averages, and the whole point is individual variance. Remove the CV and it is a generic weighted mousepad. A pure CV eye-fatigue dashboard with no physical output is a "AI dashboard," which is explicitly banned and which the player will simply glance at and ignore. The fusion converts a *silent internal state* into a *tactile external cue* the hand acts on without taking eyes off the target — the only channel that is free during a 1v3 clutch.
- **Compliance check:** Uses only a 30 fps, 96×96-pixel eye-region crop processed locally on-device; **no mouse input is ever read or generated**, and the camera sees nothing but the player's own face. It is a fatigue trainer, not an aiming system — it cannot tell you where to aim even in principle. Nothing crosses into the game client.
- **Bill of materials:**
  - 1× 12 V 1 A solenoid + flyback diode — ₹180
  - 1× L298N/TB6612FMS current-mode H-bridge — ₹220
  - 1× 28BYJ-48 stepper + ULN2003 (auto-height wedge) — ₹280
  - 1× ESP32-C6 + OV2640/5MP webcam (reuse team phone if USB-OTG) — ₹500
  - 3D-printed PETG puck + housing (10 h print) — ₹200
  - **Total ≈ ₹1,380 per unit** → **₹230/player** across 6. Far under the ₹500 entry ceiling.
- **Competitive edge:** Fatigue is the most under-measured variable in a 5-hour scrim block. Blink-rate and eyelid-dwell are the standard psychophysiological fatigue markers; surfacing them *before* performance drop — as a hand cue — is worth measurably more than a post-match graph. Plus the auto-height wedge removes the single most common pre-tournament ritual: hand-tuning sensitivity in the venue for 30 minutes before your first map. Time-to-playable, measured from tournament start, is a real tournament metric.

---

### 3. DropZone Sentinel — CV Tracked Zone-Pressure Trainer with Haptic Zone Gates

- **Integration:** Computer Vision (webcam pose estimation on the player's phone tripod → normalised shoulder/torso position → zone-occupancy state machine) **×** Mechatronics (four 10 mm 3D-printed pressure gates on a 60 cm rail, each driven by a micro-servo with a sprung lever, plus one haptic puck that fires on the drone-event transition).
- **The product:** A desk rail with four sprung zone-gate levers that the player's hand physically occupies according to where their body position (tracked by a webcam) says the squad's information should be — a training rig for the exact moment a BGMI/Free Fire Max team loses a zone fight.
- **Which game it serves:** BGMI (primary — zone mechanics are the core strategic object) and Free Fire Max (primary — identical zone grammar).
- **Why BOTH are required:** The rail with four gates and no vision is a *static* prop — the player learns muscle memory for four named positions, which does not survive contact with an opponent's timing. The webcam with no rail is a screen-space posture trainer, which is the "AI dashboard" the brief bans. The fusion is what matters: the gate lever only closes when the tracked body position says the player is genuinely holding the angle, so the drill only *scores* when the player has actually repositioned. Vision supplies the truth about where the body is; mechatronics supplies the resistance that makes the reposition cost something in the hands.
- **Compliance check:** Solo training rig using the player's own phone recording their own body in an empty room. **The game is not running.** No opponent data, no second client, no automated input — a person physically practices a habit.
- **Bill of materials:**
  - 4× SG90 micro-servo + sprung lever set — ₹600
  - 1× ESP32-C6 + 2× relay channel — ₹450
  - 3D-printed PETG rail + 4 gates + haptic puck (14 h print) — ₹650
  - **Total ≈ ₹1,700 per unit** → **₹283/player**. Reuses the team's phone as the camera; the ₹0 sensor cost is what makes this fit the budget.
- **Competitive edge:** Zone discipline is the highest-leverage BGMI/FF skill and the hardest to train without a team. This converts it from a *review* item ("you got caught rotating") into a *reps* item (60 reps of "stop, reposition, hold"). The deliverable for a jury is a logged rotation-decision time series across a training week — and the physical gate makes the player commit to the reposition instead of acknowledging it.

### 4. ClapCast — Optical-Flow Replay Rewind Controller

- **Integration:** Computer Vision (screen recording + sparse optical flow / perceptual-hash keyframe extraction to auto-segment a replay into 15 high-information events — multi-kills, clutches, economy swings — with killfeed OCR for timestamps) **×** Mechatronics (a lead-screw shuttle with a servo-driven carriage that physically *scrubs* the timeline, with hard detents at event boundaries and a haptic click on each multi-kill).
- **The product:** A desk-mounted shuttle wheel whose physical position **is** the replay timestamp, so VOD review is done by scrubbing rather than by watching, and the machine physically clicks when you pass a round-deciding moment.
- **Which game it serves:** All five, but tuned for BGMI/FF Max (long replays, huge multi-kill swings) and Clash Royale (short, extremely dense matches where the scrub matters most).
- **Why BOTH are required:** Optical flow without a physical shuttle is a bot-generated highlight reel — a video, and the player knows from experience they will not watch it or learn much from it. A hardware shuttle with no CV is a jog wheel — it has no idea what a multi-kill is, so it is a manual scrubber competing with a mouse wheel. The fusion is the *auto-detent*: the CV finds the 15 events worth reviewing, the mechatronic carriage physically snaps to and stops at each one, and the haptic click marks it in the player's hand. Reviewing 5 hours of BGMI becomes 6 minutes of tactile scrubbing, and the physical detent makes the player physically slow down at each moment — which is the entire behavioural change a review is supposed to produce.
- **Compliance check:** Replays are the tournament organiser's own published broadcast feed or the player's own screen recording of their own match. No opponent client, no third-party account, no live interception. **Deliberately post-match only** — it must not touch the running game, and it ships disabled (shuttle mechanically locked out) until the match is over.
- **Bill of materials:**
  - 1× NEMA-17 + lead screw + 30 cm rail (or 2× 28BYJ-48 belt drive) — ₹900
  - 1× ESP32-C6 + rotary encoder + haptic motor — ₹550
  - 3D-printed PETG shuttle housing (10 h print) — ₹350
  - **Total ≈ ₹1,800 per unit** → **₹300/player**.
- **Competitive edge:** The most honest number here: teams spend effectively zero minutes on structured VOD review at this event level and all of them queue on the venue PC. A device that turns review into 6 minutes of physical scrubbing raises actual review volume by an order of magnitude. The measurable claim for a jury is *hours of review completed per tournament*, plus the fraction of flagged events a player can verbally recount correctly after 24 hours (a real retention check).

### 5. Referee Press — CV Cue-Only Split-Screen Judge

- **Integration:** Computer Vision (screen-capture OCR of the in-game public scoreboard/killfeed + template matching on the venue's own player webcams to detect the three signals an admin must act on: player leaving seat, visible distress/dispute gesture, headset removed) **×** Mechatronics (a 6-zone split-screen relay console, one physical illuminated switch per team, each with a 12 mm pushbutton, a relay-driven 24 V contactor that cuts that team's station power, and a ratcheting detent so an override is physically distinguishable from a routine call).
- **The product:** A referee's desk console with six mechanically latching, colour-coded station switches — a decision is a physical throw, not a keypress, so it is unambiguous, timestampable by the detent sound, and impossible to execute accidentally.
- **Which game it serves:** All five, and it is the only concept on this list that serves **the tournament rather than a team** — which matters, because an event needs a defensible integrity story more than it needs another player's gadget.
- **Why BOTH are required:** The CV half alone is a *notification*: "zone 4 needs attention." A human admin under time pressure will eventually miss it, especially across six stations and a noisy venue. The mechatronic half alone is a switch box: it has no idea when to throw one, and throwing a wrong switch disconnects a team unfairly. The fusion is the **ratcheting physical override** — a latching switch with a detent cannot be thrown in the same motion as a hand-wave, so the CV's confidence and the throw's physicality combine into a decision with a real audit trail (switch state + throw timestamp + which cue fired). Vision supplies *when*; mechanics supply *irreversibility*.
- **Compliance check:** This is a **tournament-official device**, not a player product, and it must be operated by the admin only, outside the players' reach, with camera scope limited to the public scoreboard plus the organiser's own venue cameras. It reads no private client state and injects nothing into any game. Its integrity value is exactly that it *cannot* be used by a competitor.
- **Bill of materials (organiser-funded, not from team fees):**
  - 6× 16A illuminated DPST switch + panel lamp — ₹1,200
  - 6× latching relay + 2× 24 V contactor + DIN enclosure — ₹1,900
  - 1× ESP32-C6 + USB capture dongle — ₹700
  - 3D-printed faceplate (6 h print) — ₹200
  - **Total ≈ ₹4,000 per 6-station bank.** Explicitly organiser capital, because it must be outside the ₹100–₹500 player budget by design.
- **Competitive edge:** This is the honest answer to "which concept actually matters most for the event." The near-constant BGMI/FF Max complaints in community play are dropped matches and admin disputes, and the failure mode is always the same: the decision happened, but nobody can reconstruct when or on what basis. A device that produces an immutable physical throw record per station converts disputes from argument to log. The jury-facing win is a **fairness artefact that exists only because vision and mechanics were fused** — no camera means no cue, no switch means no record.

---

## Ranking rationale

1. **ResolveBoard** — highest jury legibility (a physical map that moves itself is a 10-second demo), both halves provably load-bearing, best per-player amortised cost, serves the highest-weight game (Valorant, ₹30,000).
2. **VeriRIG** — cheapest, most novel fusion (vision as a *psychophysiological fatigue sensor* driving a haptic channel), strongest case that fatigue is the true hidden variable in a 5-hour scrim.
3. **DropZone Sentinel** — genuinely good, narrower game coverage (BGMI/FF Max only), body-tracking hardware mounts are the main fragility risk.
4. **ClapCast** — strong and broad, but partially competes with existing VOD-review tooling, so the fusion is less defensible as *novel*.
5. **Referee Press** — the biggest genuine event-level win, ranked last only because it is organiser-funded, serves no team directly, and is harder to demo live.

## Cross-cutting compliance statement

None of the five concepts automate play. All vision runs on the team's own hardware against one of four legal inputs: the team's own screen recording, organiser-published replays, the public in-game scoreboard, or a camera pointed at the team's own players in their own room. None of them read game memory, hook the client, hold a second account, or generate synthetic input. Every output is either (a) a physical device acting on the player's own body, or (b) a post-match analysis artifact. That line is the whole reason this lens produces a training edge rather than a cheat, and it should be stated out loud to the jury.

## One candid risk flag

The BVOs on screen are build costs, not sale prices. Concept 5 is explicitly organiser capital and should be presented as such. If a jury insists on per-player retail pricing including labour, ResolveBoard lands near ₹1,200–1,500 per player at one-off scale — still fundable from ₹75,000 of prize money, but it needs to be framed as a *club asset*, not something a ₹100 entry fee covers. Being upfront about that is worth more to this jury than a suspiciously clean BOM.