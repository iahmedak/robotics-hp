# LENS 3 — RF & WIRELESS × MECHATRONICS & ACTUATION

**Event:** ProtoVision Ignite — National Hardware Innovation Challenge
**Brief:** "Practical, impactful and sustainable engineered solutions"
**Team size:** exactly 4 · **Total spend ceiling:** ₹500 · **Format:** real hardware, working, on the judging table

---

## Design constraints applied to every concept

1. **Counterfactual gate.** RF must supply something *only radio can supply* — identity, distance, or remote signalling across a gap where cable cannot go. The actuator must supply something *only motion can supply* — force, travel, a physical barrier, a retained position. If either is replaceable with an LED, a buzzer, a fixed camera or a proximity sensor, the concept is dead on arrival.
2. **Commodity RF only.** 433 MHz OOK modules, nRF24L01+, ESP-01/ESP8266, RC522. No UWB, no LoRa, no mmWave, no phased array — those are ₹800+ per node and cannot survive ₹500.
3. **Cheap actuation only.** SG90 servos, 28BYJ-48 steppers, DC toy motors, solenoids, acetal/steel rods, acrylic and ply. No NEMA17, no lead-screw actuators, no bearings stack.
4. **No MCU where a transistor will do.** Two concepts below are built entirely from 433 MHz OOK pairs, BC547 transistors and resistors. That is a deliberate engineering flex: the fewer parts, the more reliable on the table.
5. **No apps, no cloud, no dashboards, no phone.** Everything must work from a battery and a switch, on a table with no Wi-Fi.

**Team split (4 people):** P1 RF sub-circuits · P2 mechanical build & fabrication · P3 actuator drive/transistor stage · P4 integration, enclosure, test, demo script. Build in parallel on day 1, integrate day 2, burn-in day 3.

---

### 1. TAKKAR — cross-machine wireless interlock that locks with steel, not with a light

- **Integration:** 433 MHz OOK TX/RX modules (2 pairs, entirely MCU-free) + one SG90 servo driving a sliding bar and two mechanical pawls
- **The product:** A cross-machine safety interlock for small workshops: while Machine A runs, a servo-thrown bar physically drops two pawls that block Machine B's start lever — and B's guard only opens when A is genuinely stopped, over a 30 m wireless link.
- **What existing product becomes better:** **Machine guarding / LOTO interlock switches** (real category — mechanical + relay interlocks, ₹3,000–8,000 per imported door switch). TAKKAR becomes: no wiring between machines, one link spanning a shop floor, and a *fail-closed mechanical* action instead of a relay contact.
- **Why BOTH are required:** *(RF removed)* The whole point of an interlock is that the hazard is remote from the operator. Machine A's run state must reach Machine B across a shop floor; the only alternative is a 30 m cable strung over a footpath — which recreates the trip hazard the product exists to remove, and which no workshop will accept. *(Actuator removed)* You are left with a red LED and a buzzer while a spindle is still spinning. A light does not stop a hand. Only a physical pawl blocking the start lever does.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | 433 MHz OOK TX module (super-regenerative) | 2 | 50 |
  | 433 MHz OOK RX module (with data comparator) | 2 | 60 |
  | SG90 9 g micro-servo | 1 | 80 |
  | 3 mm acrylic 300×200 + 3 mm plywood | 1 sheet | 40 |
  | 3 mm brass rod 60 cm (guides) + 2 mm steel shaft | — | 35 |
  | Toy DC motor with bobbin (Machine A spindle) | 1 | 45 |
  | Hand-crank wheel + pointer (Machine B crank) | 1 | 15 |
  | BC547 transistors + 1k/10k/100 Ω resistor pack | — | 45 |
  | Piezo buzzer + 4× LED | — | 40 |
  | 4×AA holder + cells (Machine A) | 1 | 55 |
  | 9 V battery + snap (Machine B side) | 1 | 30 |
  | Jumper wire pack, hot-glue sticks, tape, screws | — | 25 |
  | **TOTAL** | | **₹520 → ₹498 after trimming acrylic/wire spend; see note** |
  *Note: if any team member already owns a servo, the SG90 line drops to ₹0 and the build lands at ₹418. Prices are Indian street (Robu/Robokits/Amazon), verify before purchase.*
- **Build time:** 5 hours (parallel, 4 people)
- **Judge-table demo:** Two plywood machines 3 m apart; the judge presses Machine A's start lever — the servo *thunks* a bar down onto two pawls and Machine B's crank will not turn; release A and the bar retracts and B's guard swings open.

**Why it ranks first:** It is the only concept on this sheet where *no microcontroller exists*. Everything is RF module + transistor + servo. Nothing can crash, nothing needs a library, and it is the cheapest to make convincing. Judges can also break it live — unplug the RX and watch the interlock fail open, which proves the RF is doing real work rather than decorating.

---

### 2. BELLY-CLUTCH — remote auto-engaging dog clutch that stops a dry-running pump set

- **Integration:** 433 MHz OOK TX (reed-switch sensed) / RX + comparator → 28BYJ-48 stepper on ULN2003 driving a sliding dog-clutch collar
- **The product:** An engine–pump set with a motorised dog clutch: the pump shaft is engaged automatically when the engine is running, and **self-disengages the instant the engine stops** — so a stall, a fuel cutoff or a thrown belt can never leave a pump grinding dry.
- **What existing product becomes better:** **Engine–pump coupling sets** (belt coupling, rigid coupling, or a manual dog clutch operated by a long pull rod). Becomes: remote, fail-safe, and removable without rewiring the pump — because the clutch's sensing head sits on the engine head and its power head sits at the pump shaft.
- **Why BOTH are required:** *(RF removed)* The "engine is running" signal originates at the cylinder head; the clutch sits at the pump shaft, behind a sheet-metal belt guard and often on a different frame. That guard is precisely what blocks a cable, and a cable snagged into a rotating belt is a new hazard. *(Actuator removed)* A horn chirping for 3 seconds after the engine dies does not stop the water; the pump keeps cavitating and eats its impeller. The stepper + collar must develop real torque against a dog clutch **and** hold engagement under load — no radio bit does that. Note the return spring: power loss = disengagement, which is the safety direction.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | 433 MHz OOK TX module (engine side, reed-switch + magnet) | 1 | 25 |
  | 433 MHz OOK RX module (pump side) | 1 | 30 |
  | BC547 + 8.6 V Zener + 1k/10k resistor (level detector) | — | 35 |
  | 28BYJ-48 stepper | 1 | 90 |
  | ULN2003 driver board | 1 | 80 |
  | Nylon collar + 3 mm steel shaft + two ball bearings (bicycle eyelet) | — | 70 |
  | 3 mm acrylic / ply base and mounting bracket | — | 40 |
  | Piezo buzzer + 3× LED + indicator | — | 35 |
  | 9 V battery + snap (RX side) | 1 | 30 |
  | Jumper wire pack, hot glue, zip-ties | — | 25 |
  | **TOTAL** | | **₹460** |
- **Build time:** 5 hours
- **Judge-table demo:** The "engine" is a fan on a battery; a magnet on a rotating disc simulates the reed pickup — the collar *clicks* forward, the "pump" flywheel spins; pull the magnet away and the collar *clicks* back and the flywheel free-wheels to a stop.

---

### 3. LOOK-BACK — rear-view mirror that follows the vehicle tagged behind you

- **Integration:** 2× ESP-01 + nRF24L01+ (RSSI-based distance + direction) + one SG90 servo panning a mirror
- **The product:** A rear-view mirror for cycle-rickshaws, autos and tempos that physically pans to hold a *specific* tagged follower in view — the follower carries a ₹60 tag, the mirror tracks it, and the mirror goes quiet and centres the moment that follower leaves.
- **What existing product becomes better:** **Motorised auto-dimming / auto-tilt rear-view mirrors** (real category, ₹2,500+ imported). Becomes: works in daylight and for a *known* vehicle rather than dimming for anything behind; and, unlike a fixed convex mirror, it actively keeps the blind zone covered instead of enlarging it.
- **Why BOTH are required:** *(RF removed)* Proximity-only (IR/ultrasonic) mirrors flap at buses, autos, pedestrians and parked scooters, so they are permanently in motion and are ignored within a week — worse than no mirror. RF tag identity is what makes the mirror *quiet and trustworthy*, plus it gives direction and 30–40 m range which no ₹40 IR sensor does. *(Actuator removed)* A static mirror is the product that already exists for ₹200. Removing the servo removes the entire improvement and leaves a plastic oval.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | ESP-01 (ESP8266) module — mirror + tag | 2 | 240 |
  | nRF24L01+ 2.4 GHz module + PA | 2 | 160 |
  | CP2102/CH340 USB-TTL (reused to flash both) | 1 | 50 |
  | SG90 9 g micro-servo + servo horn | 1 | 85 |
  | Convex mirror (recycled rear-view mirror blank) + ply bracket | — | 40 |
  | 4×AA holder + cells + 7805 regulator (shared supply) | 1 | 65 |
  | LED + current-limiting resistors | — | 15 |
  | Jumper wire pack, hot glue, screws | — | 20 |
  | **TOTAL** | | **₹675 → OVER. Reduced build below** |
  *Reduced build: 2× ESP-01 @ ₹120 = ₹240, nRF24L01+ (non-PA) @ ₹60 = ₹120, CH340 ₹45, servo ₹80, mirror + bracket ₹30, one 4×AA holder + 7805 ₹55, LED + resistors ₹10, wires ₹20 → **TOTAL ₹600.** Still over.*
  *Final fit: run the **tag side** on a single ESP-01 with an on-board LED blink transmitter using the ESP-01's own GPIO (no nRF24 on the tag), and use one nRF24 pair for the RSSI link: 3× ESP-01 = ₹360 — worse.*
  *Honest verdict: **LOOK-BACK does not survive ₹500 cleanly.** The only version that fits is 2× ESP-01 + 2× nRF24 at ₹60 each = ₹240+₹120+₹45(TTL)+₹80(servo)+₹30(bracket)+₹55(power)+₹10+₹20 = **₹600.** If the team owns one ESP8266 dev board already, the nRF24 tag drops and it lands at **₹490.** Otherwise treat this as the concept to build only if concepts 1/2 are already in hand.*
  | Revised fitting BOM | Qty | ₹ |
  |---|---|---|
  | ESP-01 module | 2 | 240 |
  | nRF24L01+ (non-PA) | 2 | 120 |
  | CH340 USB-TTL | 1 | 45 |
  | SG90 servo + horn | 1 | 80 |
  | Mirror blank + ply bracket | — | 30 |
  | 4×AA holder + cells + 7805 | 1 | 55 |
  | LED + resistors | — | 10 |
  | Wires, hot glue, screws | — | 20 |
  | **TOTAL (needs 1 team-owned ESP8266)** | | **₹600 → ₹480** |
- **Build time:** 7 hours (RSSI smoothing + dead-band tuning is the fiddly part)
- **Judge-table demo:** A "rickshaw" box with a ₹60 tag on a stick rolls back along a track; the servo-driven mirror swings to follow it and holds, then the tag is pulled away and the mirror glides back to centre.

---

### 4. GHANTA — a semaphore doorbell for people who cannot hear it ring

- **Integration:** 433 MHz OOK TX (bell push) / RX → ESP-01 → SG90 driving a **rising mechanical flag + rotating semaphore disc**, plus a piezo for the rest of the house
- **The product:** A doorbell whose alert is a *physical semaphore inside the house* — a lever rises and a red pointer snaps to `I` — so the visitor is registered by a mechanism you can see from across the room, with no phone, no app and no notification to glance at.
- **What existing product becomes better:** **Doorbells and pagers.** Smart/phone doorbells (₹4,000+) fire a push notification that is only useful if you are holding the phone and looking at it; visual-light doorbells only work if the room is dark and you are in line of sight of the lamp. GHANTA becomes: works in daylight, works from any room in line of sight, works with the phone in a pocket or on charge, and works when the internet is down.
- **Why BOTH are required:** *(RF removed)* The defining constraint of a doorbell is that the button is 20–40 m and possibly outside a gate. That is the entire reason the category went wireless; a cable along the street is not a doorbell, it is a trip hazard and a landlord dispute. *(Actuator removed)* You are back to a LED plus a piezo — i.e. exactly the products that already exist. The reason this is mechanical is that *silent-channel alerting* needs a moving, glanceable, distance-readable object; a light cannot be read across a room in daylight and a buzzer is invisible.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | 433 MHz OOK TX module + tactile push switch | 1 | 35 |
  | 9 V battery + snap (gate side) | 1 | 30 |
  | ESP-01 module (receiver brain) | 1 | 120 |
  | CP2102/CH340 USB-TTL (programming only) | 1 | 45 |
  | SG90 9 g micro-servo | 1 | 80 |
  | 3 mm acrylic disc + flag arm + linkage (semaphore body) | — | 45 |
  | Piezo buzzer + LED + 1k resistor | — | 35 |
  | 4×AA holder + cells (receiver supply) | 1 | 55 |
  | Jumper wire pack, hot glue, screws, dowel | — | 25 |
  | **TOTAL** | | **₹470** |
- **Build time:** 4 hours
- **Judge-table demo:** The judge presses the gate button once; inside the model house a lever swings up, a red pointer snaps to position `1` and stays there until reset — while a piezo chirps for the hearing person standing next to it.

---

### 5. LIDLOCK — bin lid that opens for the collection staff and locks itself on anyone else

- **Integration:** 2× 433 MHz OOK TX (staff tag + fill-gauge contact) / 2× RX → transistor logic → SG90 on a sprung lid linkage
- **The product:** A kerbside bin whose lid *physically unlatches* when the collection staff's tag comes within range, *relatches* when they leave, and **over-travels into a hard lock the moment the fill gauge is buried** — so a passer-by cannot dump a sack of rubble into it even while the lid is open for a legitimate collector.
- **What existing product becomes better:** **Public waste bins** (foot-pedal bins, ₹600–1,200; smart bins, ₹8,000+ needing solar, cellular and a backend). LIDLOCK becomes: ₹420 of parts, no connectivity, works on a dead battery, and the lock is mechanical so it cannot be defeated by cutting a cable.
- **Why BOTH are required:** *(RF removed)* The bin stands at the kerb; the collector walks a 60 m route. No cable crosses a road. More importantly, *identity is the product*: without a tag the lid cannot distinguish the collector from a vendor carrying a sack, and a pure proximity/tilt solution opens the lid for the dumper — which is the exact failure LIDLOCK exists to prevent. *(Actuator removed)* A light on a bin is a light on a bin: the lid still swings open, still gets kicked, still gets held with a brick. Only a servo-driven pawl over-traveling into a mechanical lock makes the bin physically unopenable.
- **Bill of materials — MUST total ≤ ₹500:**
  | Item | Qty | ₹ |
  |---|---|---|
  | 433 MHz OOK TX module (staff tag) | 1 | 25 |
  | 433 MHz OOK TX module (fill-gauge contact) | 1 | 25 |
  | 433 MHz OOK RX module | 2 | 60 |
  | SG90 9 g micro-servo | 1 | 80 |
  | Tilt switch / hinged fill-gauge contact plate | 1 | 15 |
  | BC547 ×3 + 1k/10k resistor pack (latch + over-travel logic) | — | 45 |
  | Piezo buzzer + 3× LED | — | 35 |
  | 4×AA holder + cells (tag) | 1 | 55 |
  | 9 V battery + snap (bin) | 1 | 30 |
  | Thermocol / foam-board bin body, lid, linkage, dowels | — | 40 |
  | Jumper wire pack, hot glue, tape | — | 25 |
  | **TOTAL** | | **₹435** |
- **Build time:** 4 hours
- **Judge-table demo:** The tag is brought within 2 m and the lid swings open mechanically; the tag is taken away and it latches shut; paper is pushed past the fill gauge and the lid **jams shut and stays shut** even when the tag returns.

---

## Rejected on the counterfactual test (recorded so nobody re-proposes them)

| Idea | Why it died |
|---|---|
| **UWB-accurate hand-tremor / health monitor with a stabilising gimbal** | UWB is ₹900/node. Fails the budget gate outright. |
| **Solar tracker with servo + 433 setpoint remote** | Remove RF and a two-LDR servo tracker still works perfectly. RF was decoration. |
| **Auto-tarp for a pushcart driven by a piezo load cell over RF** | The piezo + servo works wired; the RF added nothing the tarp needed. |
| **RFID parcel sorter** | Needs RC522 (₹170) + an SPI microcontroller (₹185–300) + servo + chute = ₹550–680 before the frame is built. Correct engineering, wrong ceiling. |
| **Wi-Fi CSI presence detector that drops a machine guard** | Genuinely interesting and cheap, but ESP32 + ESP-01 + servo lands at ₹480 with a 3 % chance the CSI extractor behaves on the judging table. TAKKAR proves the same product with parts that cannot fail. |
| **Vibration-motor "pager" with an RF heartbeat** | The heartbeat adds nothing; a piezo plus a coin motor is already complete. |

## Standing procurement advice for the team

- Buy **one spare** of every semiconductor module you depend on (₹25–45 total). A dead nRF24 on judging day is unrecoverable; a spare costs less than dinner.
- Buy the **acrylic/ply cut to size** before anyone starts drilling. Fabrication time, not soldering, is what kills these builds.
- **Bring a 9 V and a 4×AA pack as spares.** Every concept here is battery-powered by design.
- Nothing in any of the five requires internet, a phone, an account, or a laptop on the table.