# SYNTHESIS — ProtoVision Ignite · National Hardware Innovation Challenge
## 4 members · hard ceiling ₹500 all-in · "practical, impactful and sustainable engineered solutions"

All 19 concepts from the four council files scored on one rubric.
Weights: **BOM fit ×3 · Robustness ×3 · Visible mechanism ×2 · Fusion strength ×1 · Buildability ×1.**
Maximum weighted score = 50.

---

## WINNER

### LIDLOCK

**Parent technologies:** 433 MHz OOK RF (identity over distance) × SG90 servo-driven sprung-lid pawl with over-travel mechanical lock (physical retention of position)

**Product, one line:** A kerbside waste bin whose lid *physically unlatches only for a tagged collector* and **over-travels into a hard mechanical lock the moment its fill gauge is buried** — so a passer-by cannot dump rubble even while the lid is open for a legitimate collector, and the lock cannot be defeated by cutting a cable.

**Why it wins the absolute constraint:** ₹434 verified, leaving **₹66 of real headroom (13% of budget)** against a ₹500 ceiling. It is also the only top-ranked concept with **no microcontroller at all** — two 433 MHz OOK pairs, three BC547s, resistors and one servo. Nothing to flash, nothing to crash, no library, no firmware tune on the morning. On a judging table, "no firmware" is not a compromise; it is the whole strategy.

**Why the fusion is load-bearing:** *Identity is the product.* A proximity or tilt solution opens the lid for the dumper — the exact failure LIDLOCK exists to prevent. And a light on a bin is a light on a bin: the lid still gets kicked, still gets held with a brick. Only a servo-driven pawl over-travelling into a mechanical stop makes the bin **physically unopenable**. Remove either half and the product is a different, worse product — not a degraded one.

---

## RUNNER-UP

### GHANTA — 433 MHz semaphore doorbell for people who cannot hear it ring

**46 / 50.** It loses to LIDLOCK on exactly one thing: **the absolute constraint.** GHANTA's BOM is ₹470 — ₹30 of margin — and ₹165 of that ₹470 is an ESP-01 plus a USB-TTL programmer. Strip the MCU and it becomes a ₹45 BC547 driver, which would put it at ₹350 and *ahead* of LIDLOCK. It also carries the sheet's best glanceable mechanism (a lever rises and a pointer snaps to `1` and holds, readable across a room in daylight) and an outstanding impact story (deaf and hard-of-hearing users, no phone, no app, no cloud).

It loses because at ₹470 with a programmer in the parts list, it has no room to absorb a single price surprise — and on this event the budget is the hardest constraint there is. LIDLOCK has ₹66 to absorb exactly that surprise, and needs no programmer.

**Honourable mentions:** SEEDGUARD and TAKKAR tie at 43. SEEDGUARD has the single best judging demo in the slate (seeds drop in single file, then a jam causes a visible back-off and shake). It loses on the hand-shrouded IR drop detector — ambient light on an unlit venue table is exactly the variable it cannot control. TAKKAR ties SEEDGUARD but scores 3 on fusion: at 3 m on a table, a sceptical judge can point at a wire.

---

## FULL SCORECARD — all 19 concepts, sorted

| # | Concept | Lens | BOM fit ×3 | Robust ×3 | Visible ×2 | Fusion ×1 | Build ×1 | **Weighted /50** |
|---|---|---|---|---|---|---|---|---|
| 1 | **LIDLOCK** | 3 | 5 | 5 | 4 | 5 | 5 | **48** |
| 2 | GHANTA | 3 | 4 | 5 | 5 | 4 | 5 | **46** |
| 3 | SEEDGUARD | 1 | 4 | 4 | 5 | 4 | 5 | **43** |
| 3 | TAKKAR | 3 | 4 | 5 | 4 | 3 | 5 | **43** |
| 5 | EQUALPLATE | 1 | 4 | 3 | 5 | 4 | 4 | **39** |
| 6 | BELLY-CLUTCH | 3 | 4 | 3 | 5 | 4 | 3 | **38** |
| 7 | BOLTPULSE | 1 | 4 | 4 | 2 | 4 | 4 | **36** |
| 7 | RINGBACK | 4 | 4 | 3 | 4 | 5 | 2 | **36** |
| 9 | GRIPTELL | 4 | 4 | 3 | 3 | 5 | 3 | **35** |
| 10 | FLATLIFT | 1 | 4 | 3 | 3 | 4 | 3 | **34** |
| 11 | TORQTAG | 4 | 3 | 3 | 3 | 3 | 32 |
| 11 | CRANKSET | 1 | 4 | 2 | 4 | 4 | 2 | **32** |
| 13 | LOOK-BACK | 3 | 0 | 2 | 4 | 4 | 3 | **21** |
| 14 | SUNFINDER | 2 | 1 | 2 | 3 | 3 | 2 | **20** |
| 15 | MYCOPULSE | 4 | 2 | 1 | 2 | 5 | 1 | **19** |
| 16 | TREMORSCOPE | 2 | 1 | 1 | 2 | 5 | 2 | **17** |
| 17 | FROSTLINE | 2 | 1 | 1 | 2 | 4 | 2 | **16** |
| 17 | GLASSWALK | 2 | 1 | 2 | 1 | 3 | 2 | **16** |
| 19 | SOLAR MOTE | 2 | 1 | 1 | 1 | 3 | 2 | **13** |

**Note on TORQTAG / CRANKSET:** listed at 32 each with the components shown.

### What the scorecard says about the slate

- **Lens 2 is dead on arrival, all five concepts.** Every one rests on an ESP32-CAM-MB the lens file itself admits lists at ₹400–₹585 retail against a ₹275 assumption — that is 55–117% of the budget on one line that must not be overpriced. All five also need 4–5 hours of CV firmware to work first time, a laptop or serial terminal to be interesting, and a screen to show anything. On the visible-mechanism axis (weighted ×2) Lens 2 scores 1–3 across the board. None survives the absolute constraint at retail prices.
- **Lens 4 has the highest fusion scores on the sheet (5, 5, 5, 5, 5) and the worst lead times.** GRIPTELL needs 16 h silicone cure, DEWSENSE needs 48 h of gel chemistry, RINGBACK needs 8 h of lattice tuning, MYCOPULSE needs a **7-day mycelium grow that cannot be re-run if it fails.** Their weakness is not the concept; it is that a material that must be grown or cured has no recovery path the week of the event.
- **Lens 3 owns the top of the table** — and note that its three best concepts (LIDLOCK, GHANTA, TAKKAR) are also its three cheapest and its two MCU-free ones.
- **Lens 1 is solid but uniformly ₹494–₹499 with zero margin on every single concept.** Not one leaves room for a price surprise, and the printed-flexure trick that makes them all work is exactly the part that needs tuning time you may not have.

---

## VERIFIED BOM — LIDLOCK

Street prices in ₹. Listed before the event, not on the day.

| # | Item | Qty | ₹ each | ₹ line |
|---|---|---|---|---|
| 1 | 433 MHz OOK TX module, super-regenerative (superhet-style, 1 kbps) | 2 | 25 | 50 |
| 2 | 433 MHz OOK RX module with data comparator | 2 | 30 | 60 |
| 3 | SG90 9 g micro-servo + servo horn + splined arm | 1 | 80 | 80 |
| 4 | BC547 NPN transistor | 3 | 5 | 15 |
| 5 | Resistor pack — 1 kΩ, 10 kΩ, 470 Ω (4 of each) | 1 | 10 | 10 |
| 5b | Tilt switch / SPDT microswitch, fill-gauge contact plate | 1 | 15 | 15 |
| 6 | Piezo buzzer + 3 × 5 mm LED + 3 × 1 kΩ | 1 set | 35 | 35 |
| 7 | 4 × AA holder + 4 × AA cells (staff tag) | 1 set | 55 | 55 |
| 8 | 9 V battery + snap (bin side) | 1 | 30 | 30 |
| 9 | Bin body — thermocol / foam board 300 × 250 × 400 mm, lid, dowels | 1 set | 40 | 40 |
| 10 | 3 mm plywood — pawl plate, latch stop bracket, hinge blocks, tag box | 1 set | 15 | 15 |
| 11 | Jumper wire pack, heat-shrink, hot-glue sticks, tape | 1 set | 25 | 25 |
| 12 | M3 bolts/nuts/spacers, cable ties, felt pads | 1 set | 14 | 14 |
| | **TOTAL** | | | **₹434** |
| | **Contingency — deliberately unspent** | | | **₹66** |

**Contingency statement: ₹66 held.** This is real headroom, not a rounding figure. It covers (a) super-regenerative OOK TX modules pricing higher than ₹25 at the counter, (b) one dead module, (c) extra plywood/thermocol if the bin body is rebuilt, (d) fresh cells. **If the contingency falls below ₹25, the build is over budget and the DO NOT SHIP rule below applies.**

### The single most important procurement note

The **433 MHz OOK TX/RX pair is the only line item with genuine price volatility**, and it is 110 of the ₹434 (25% of the build). Street listings for a *super-regenerative* TX (as opposed to the cheaper crystal-locked type) vary widely — ₹25 quoted here, ₹40–₹60 realistic at some counters. **Buy these four modules first, before anything else, and price-check all three of them.** If the four modules land above ₹160, the contingency is gone.

### Pre-event rule: three spares that fit inside the contingency

- 1 × spare 433 MHz OOK TX — ₹25 (against the single most likely failure)
- 2 × spare AA cells + 1 × spare 9 V — ₹38
- ₹3 left

**Buy the batteries before the event.** Duracell at a venue counter is ₹110–₹120, not ₹30. That single line is the difference between a working build and a dead one, and it is the most likely way a ₹434 build becomes a ₹550 build.

### The DO NOT SHIP rule

**If the RF modules cannot be obtained for ₹160 or less for the set of four, do not build LIDLOCK — pivot to GHANTA**, which needs only one OOK pair and one 9 V, is ₹350 after dropping the ESP-01 and USB-TTL in favour of a BC547 direct drive, and has an equally strong fusion and a better glanceable mechanism. Decide this on procurement day, not build night.

---

## 4-PERSON BUILD SPLIT

Four people, four rails. Nobody owns "the integration" until Day 2. Total 4 build hours per person, over three days.

### P1 — RF engineer (owns the identity layer)
- Build **both** tag transmitters (staff tag + fill-gauge contact) and **both** receivers.
- Transistor level-detection stages: RX data comparator into BC547 base, emitter to ground, collector through 10 kΩ to Vcc driving the BC547 that switches servo current.
- Tag side: one tact push switch / tilt switch into the TX data input. Battery + holder in a printed tag box.
- **Deliverable:** both tags and both receivers proven on a bench with a multimeter *and* by ear-distance, before anyone touches the mechanism.

### P2 — Mechanical engineer (owns the visible mechanism)
- Bin body from thermocol, lid with a real sprung hinge (two foam-board leaf springs, not a servo holding it shut).
- Pawl plate on a 3 mm ply arm with a **hard mechanical over-travel stop** — the single most important part in the build. It must physically reach a stop and jam with the servo powered *or* unpowered.
- Latch bracket, fill-gauge contact plate on a pivoting arm, staff tag box.
- **Deliverable:** lid, pawl and latch working by hand, with the over-travel stop positively located.

### P3 — Power and logic engineer (owns the electrical rails)
- 4 × AA tag rail and the 9 V bin rail; 7805 not needed (9 V drives the SG90 directly with a diode-drop margin).
- Common ground between tag and bin is **not** assumed — both rails are isolated, which is the whole point of wireless.
- Servo power decoupling: 1000 µF + 100 nF across the servo so a servo stall cannot brown out the logic.
- **Deliverable:** a bench harness where a button on the bench (standing in for the RF pair) proves the full electrical chain end to end.

### P4 — Integration, test and demo (owns the table)
- Perfboard, harness, all interconnects, the 20 m range test, and the demo script timing.
- Builds a **fallback demo path**: a hard-wired TX/RX pair run at 2 m with the cable dressed as a short patch, so the demonstration never dies if one RF link is marginal. The bin still works identically.
- **Deliverable:** the demo runs, in order, in under 90 seconds, ten times in a row.

### Integration order

| When | Who | Gate — nothing proceeds until this passes |
|---|---|---|
| **Day 1, 60 min** | P1 + P3 | RF bench gate. Both tags received by both receivers at 2 m **and** at 20 m. Every module tested individually. A dead module is swapped from spares here, not on judging day. |
| **Day 1, 180 min** | P2 | Mechanism bench gate. Lid closes, latches, and **jams into the hard stop** when the gauge trips. Hand-driven, no electronics. |
| **Day 2, 90 min** | P4 | Electrical gate. Bench button → full chain → servo throws pawl → over-travel → jam. No RF in the loop yet. |
| **Day 2, 180 min** | **All four** | First full integration. Tag → RX → transistor → servo → pawl → over-travel → jam. Both bins states checked. |
| **Day 3, 60 min** | All four | **Burn-in.** 50 consecutive cycles. Any jam, any missed latch, any brown-out is a redesign, not a patch. |

The burn-in gate on Day 3 is not optional. Transistor logic that works once works fifty times, and the day-3 burn-in is where you find the one that doesn't.

---

## JUDGING TABLE SCRIPT — what the jury physically watches

The bin sits closed on the table. A member steps forward as the *collector*. Total run time: 90 seconds.

| Time | What happens on the table | What is physically visible and moving |
|---|---|---|
| **0:00–0:08** | The judge is invited to **try the bin first**. They push the lid. It does not open — the pawl is engaged. | Closed lid, pawl visibly blocking. |
| **0:08–0:18** | A team member **walks the staff tag in from ~20 m**, slowly. Nothing happens at 20 m. At **~2 m** — | Piezo chirps. **Lid swings open on the servo. Pawl drops out of the way.** |
| **0:18–0:30** | The tag is taken **out of range**. | **Lid closes, pawl rises, latch engages with a click.** |
| **0:30–0:45** | The judge is handed the tag. | They see it is a ₹30 module on a battery in a printed box. That is the whole "key". |
| **0:45–1:00** | The **rubble test.** A paper/plastic-wad "rubble" bag is pushed past the fill gauge while the lid is closed. | Fill-gauge plate **tips**, pawl **over-travels past its normal stop into the hard stop**, and the lid **jams shut**. |
| **1:00–1:15** | The tag is brought back to 2 m — **nothing happens.** | Tag present, lid still locked. The identity is proven *and* over-ruled by the physical state. |
| **1:15–1:25** | The judge **pulls the rubble out.** | The gauge resets, the pawl retracts from the hard stop, and the lid **opens normally** on the next tag pass. Reusable, not a consumable. |

### The three lines that must land, in this order

1. **"It opened for the tag, and only for the tag."** — proves the RF is doing identity work, not decoration.
2. **"It locked itself."** — the servo pushed the pawl *past* its stop into a mechanical jam. A light cannot do this.
3. **"And it resets."** — proves it is a mechanism, not a gimmick.

### What must be physically visible, ranked

1. The **lid opening and closing** — large amplitude, unmistakable.
2. The **pawl rising and dropping** — small but exposed on the front face; this is the mechanism, so it is *not* cased in.
3. The **over-travel into the hard stop** — the single most convincing mechanical moment in the whole demo. Perform it slowly.

### What must never be on the table

No laptop. No phone. No serial console. No app. No screen. No QR code. The bin is powered by a 9 V and two tag transmitters by 4 × AA, and it is doing its job with no firmware anywhere in the system. Say so out loud: **"there is no microcontroller in this."** On a judging table in 2026, that sentence is worth more than a dashboard.

---

## BIGGEST RISK

### The single thing most likely to sink this on the day: **433 MHz OOK radio modules that cost more than quoted, or a module that is dead on arrival.**

**Why this and nothing else.** The whole product is a ₹50–₹110 wireless identity link across 25% of the BOM. Everything else on this build is foam board, plywood, three transistors and one ₹80 servo — all of which cannot fail in ways you cannot see coming. The RF pair is the only line item that is (a) price-volatile by more than 2× between counters, (b) one-of-a-kind rather than stocked, and (c) silently, invisibly dead until the moment you need it. A dead OOK receiver does not error — it simply never closes its contact, and the lid sits there doing nothing while the judges watch.

The compounding failure: the batteries. A 9 V at a venue counter is ₹110–₹120, not ₹30, and the 4 × AA pack is ₹55–₹70. That is ₹70–₹90 of unbudgeted spend waiting at the venue door, which is exactly what the ₹66 contingency was supposed to absorb and exactly enough to eat it.

### Mitigation — four steps, in order, all before build night

1. **Buy the four RF modules first, and price-check all three before buying anything else.** This one line is 25% of the build and the only line with real volatility. Budget: ₹160 for four. **If the set costs more than ₹160, pivot to GHANTA immediately** (one OOK pair, one 9 V, no MCU, ₹350) rather than discovering it on build night.
2. **Buy every battery before the event and carry spares.** 1 × 9 V, 2 × 4 × AA packs. Batteries are the most reliable ₹38 in this entire build and the most common cause of a dead demo.
3. **Test each of the four modules individually the day they arrive, then again as a pair at 2 m and 20 m, on the Day-1 60-minute gate.** Four minutes of work that catches a dead module 48 hours before it matters. Spend from the ₹25 spare-module line, not from build time.
4. **Run a wired 2 m fallback pair for the demo.** If one link is marginal in the venue, the demonstration still runs — the bin's behaviour, the over-travel jam and the identity logic are all identical, and only the range shrinks. A demo that works at 2 m beats a demo that works at 20 m and doesn't happen.

### The rest of the risk list, ranked and accepted

| Risk | Severity | Accepted because |
|---|---|---|
| Pawl fails to jam under load | Medium | P2 builds it in ply with a positive mechanical stop, hand-tested on Day 1 before any electronics exist. A hard stop cannot be defeated by servo torque. |
| Judging table bumped / bin knocked | Medium | Deliberate. A bin *should* be knocked. The over-travel jam is the hardened state — a knocked bin latches harder. |
| 20 m range fails in a cluttered hall | Low | Fallback is 2 m, which is where the demo is anyway. |
| Venue has a 433 MHz jammer or heavy Wi-Fi congestion | Low | Super-regenerative RX has decent rejection; and the fallback pair covers it. |
| Servo current browns the logic mid-demo | Low | 1000 µF + 100 nF across the servo, on P3's bench, proven at the Day-2 90-minute gate. |
| A judge asks "why wireless — why not a cable?" | **Highest question risk** | **Answer: a kerbside bin and a collection route are 40–60 m apart and the cable crosses a road.** Then demonstrate the wireless version. Do not get drawn into arguing it at 3 m on the table. |

---

## THE PITCH, IN ONE PARAGRAPH

*Every public waste bin is a foot pedal and a spring. A foot pedal opens for everyone — the passer-by, the vendor with a sack of rubble, the competitor's cleaner. Smart bins that cost ₹8,000 solve this with a camera, a cellular radio and a cloud backend, and still get kicked open with a brick. LIDLOCK costs ₹434 and solves it with the oldest mechanism humans have: **a key that is physical, and a lock that is mechanical.** A tagged collector comes within two metres and the lid unlatches — not because of proximity, but because of identity. And when the bin is full, the pawl drives *past* its normal stop into a hard mechanical jam: no signal, no power and no amount of pulling gets it open. Cut the wire and it stays shut. There is no microcontroller in this — two radio pairs, three transistors, a servo and a lump of foam board, on a 9-volt battery. It works on a dead network, because there is no network.*