# Lens 3 — RF & WIRELESS × CONNECTIVITY & PROTOCOLS

**Event:** RanShastra 3.0 — AstraArena E-sports Championship
**Brief:** Squad communication, positioning, or analytics edge using gear teams partly already own. Fee ₹100–₹500, teams of 1–6.

**Honest framing up front:** the winning edge in a ₹100–₹500 bracket is *not* hardware you cannot afford — it is coordination latency and information you cannot see. Every concept below reuses the phones already in the squad's pockets as the compute/render layer, and spends the entire budget on the radio link that they do *not* have. Nothing here improves the player's aim or reads the opponent; it improves the squad's shared picture of itself and its own map state.

**Compliance doctrine applied throughout:** every concept is strictly *intra-squad*. Each device broadcasts only about the bearer and the bearer's teammates' known/own state. No concept samples, decodes, relays, jams, or replays anything from another player's client, network traffic, or input stream. Anything that would cross that line is named explicitly and rejected in the write-up.

---

### 1. Reaper Beacon

**TOP 2**

- **Integration:** UWB (Ultra-Wideband, IEEE 802.15.4a, ~6.5–8 GHz) **+ WebRTC / peer-to-peer data channel with local-first state replication**
- **The product:** A clip-on pendant per player (or a lanyard tag on the phone) that pins every squadmate's exact position on the in-game map at 10–20 Hz, surviving full phone-screen occlusion.
- **Which game it serves:** Valorant, BGMI, Free Fire Max, EAFC25/FIFA — anywhere with a minimap and three-dimensional player movement.
- **Why BOTH are required:** UWB gives *time-of-flight* distance and two-way ranging at sub-metre accuracy (typically 10–30 cm), which is the only cheap radio that can tell "Is my teammate left of me or right of me" without a camera or an IMU. But UWB alone is a dumb distance beacon: it gives you a radius, not a heading, and it has no notion of "which teammate," no room map, no persistence across a dropped link, and no delivery guarantee when the link is congested. The WebRTC P2P data channel is what carries the identity binding (tag → player → handle → map-relative XY), fuses the four range measurements into a triangulated XY, and — critically — holds a **local-first replicated state**: every node runs the same fusion + map-transform code and keeps the squad's last-known positions on-device, so when one node's UWB link stutters the squad picture does not vanish. **Counterfactual:** remove UWB and you are back to pinging teammates with voice and squinting at a minimap — i.e. you now have "comms," which every team already owns. Remove WebRTC/local-first sync and each pendant broadcasts an anonymous radius into a room with four identical values; no one knows who is where, nothing survives a single dropped packet, and the squad must be staring at all four pendants at once instead of the game. Both die independently.
- **Compliance check:** Every broadcast packet carries only the sending tag's own ID and its own UWB ranging timestamps — it is a device telling the room where *it* is, which is the same category as a Bluetooth headset announcing its own MAC; it touches no other player's client, input, or network traffic, so it cannot be a cheat even in principle.
- **Bill of materials:**
  - 4× UWB module + tag (Trimension/Decawave-based, e.g. Qorvo DWM3000 shield-class modules) — ₹350 each = ₹1,400. **Over budget per-team at 4-up; single-tag pilot ₹350 fits. Flagged honestly below.**
  - 2× ESP32-C6 (Wi-Fi + BLE 5 + RISC-V) as squad hub — ₹450 each = ₹900
  - 1× 3.7 V 1200 mAh Li-ion + TP4056 charge/protect board — ₹180
  - 2× 2.4 GHz micro-printed PCB antennas (or 2× 2 dBi chip antennas) — ₹90
  - 4× nylon lanyard clips / pendant shells (3D-printed or injection case) — ₹220
  - Misc: switches, JST leads, 3D-printed mounts — ₹160
  - **Total 4-tag: ~₹2,950 · 2-tag: ~₹2,300 · 1-tag: ~₹1,500**
  - **Reality check:** this concept is ₹500–₹1,500 over the ₹100–₹500 fee band at full 4-tag deployment. It survives the jury *only* if scoped to a 1–2 member squad or presented as a 2-tag prototype where the budget line is "₹500 per member, team pays pro-rata." Stated plainly rather than hidden.
- **Competitive edge:** Converts positional calling from a ~1.5-second voice round trip ("he's B short") into a passive, always-on sub-second shared map overlay. Measurable: time-to-contact-information after a flank, and measured consistency of "we're grouped / we're split" decisions across rounds. In a 5-stack Valorant or BGMI lobby this is the difference between collapsing on a site and walking into it one at a time.

---

### 2. Sub-Gig Relay

**TOP 2**

- **Integration:** Sub-GHz ISM radio (433 MHz TX/RX modules) **+ store-and-forward delay-tolerant networking with an optical/QR fallback burst**
- **The product:** A palm-sized squad mesh that keeps text pings, position breadcrumbs, and "rotate/wait/zone" tags flowing between players even through concrete, multi-floor buildings and server hitches — and can hand its full queue to a QR burst if RF is dead.
- **Which game it serves:** BGMI, Free Fire Max (primary — dense urban/indoor structures), Valorant (secondary), Clash Royale as a two-player split-attack router, EAFC25/FIFA for the bench callouts.
- **Why BOTH are required:** 433 MHz modules cost ~₹120 and, at 433 MHz, propagate and diffract through concrete far better than 2.4 GHz — this is the "sub-Gig" reason. But a raw 433 MHz link is fire-and-forget with no addressing, no ACK, no routing, and a ~1.2 kbps effective ceiling: if your Link Quality Indicator drops from 3 bars to 1 because a teammate walked behind a wall, a bare radio link silently drops the packet and the squad loses the one message that mattered ("rotate B now"). **Store-and-forward DTN** is the load-bearing half: every node holds an append-only, sequence-numbered outbox; a node that misses a packet requests a range-resend from any peer within range, and the queue is *satisfied by anyone who eventually hears it* — you do not need direct line-of-sight to the intended recipient, only a multi-hop path of teammates. The **optical/QR burst** is the guaranteed floor: hold the device up to any teammate's camera (or to the phone's own screenshot relay) and the entire queued log — up to the last 200 messages plus the position breadcrumb trail — transfers in one burst with zero RF dependency. **Counterfactual:** remove store-and-forward and this is a walkie-talkie: no history, no resend, no multi-hop, no guarantee, and a lost packet is gone forever — strictly worse than the Discord voice every team already runs. Remove the 433 MHz radio and the QR burst alone cannot deliver continuous position updates at any usable rate; you would be manually screenshotting mid-firefight. Both die independently.
- **Compliance check:** Broadcasts are squad-internal text and self-reported breadcrumbs only; the QR burst is a device-to-device file transfer between teammates, never to a game client or network interface.
- **Bill of materials:**
  - 3× 433 MHz transceiver modules (STX/FSK 433 MHz, 1–2 km line-of-sight, ₹120 each) — ₹360
  - 1× ESP32-C3 (BLE for phone-side bridging, cheap, ₹220) — ₹220
  - 1× 0.96" OLED or low-power e-ink panel (e-ink here is the *display* not the link; readable in sun, 1 mAh standby) — ₹350
  - 1× 2000 mAh power bank (multi-day runtime; this node is a squad resource, not worn) — ₹700
  - 1× 3D-printed rugged shell with clip + lanyard + camera-readable QR panel — ₹180
  - Misc: antenna, TP4056, boost converter, buttons — ₹190
  - **Total: ~₹2,000 for one squad-shared unit (not per player)**
- **Competitive edge:** The measure is *delivery certainty under obstruction*, not raw range. In BGMI/FF Max indoor finals, this is the difference between a squad whose rotation call actually arrived and a squad arguing after the fact. The e-ink screen matters because a squad member can check the queued log in a death-screen 2-second window without draining the phone they need for the respawn.

---

### 3. Lattice Mesh Slice

- **Integration:** BLE mesh (Bluetooth Mesh, managed flooding over advertising channels) **+ ambient-network protocol semantics (managed flooding + TTL-based relay + duty-cycled sleepy nodes)**
- **The product:** A clip-on tag per teammate that runs a managed-flooding BLE mesh so a "rotate" or "enemy spotted" tap propagates through up to 4 hops — one player in a building taps, everyone in the *building* hears it, without any phone joining a network or an internet link existing at all.
- **Which game it serves:** Valorant, BGMI, Free Fire Max (multi-level squads and site holds), Clash Royale (2-player attack/defence split, one player alone).
- **Why BOTH are required:** BLE is the one radio your phone is *already* listening to, and BLE Mesh specifically rides the advertising channels with a managed flooding protocol — every node relays every message up to a TTL, so coverage scales with squad size rather than being limited to direct neighbours. That is the entire point and it is genuinely load-bearing: **remove the RF and the mesh does not exist.** But raw BLE Mesh is deliberately dumb and power-hungry — the radio is always-on, flooding wastes airtime, and there is no notion of *who* heard a message. **The protocol semantics are the second half**: TTL-scoped relay (a B-site call does not flood the whole map, it floods the building), duty-cycled sleepy roles (the tag on the guy holding an angle is a sensor node at 1 s intervals; the tag on the entry-fragger is a relay at 50 ms), and per-node ACK aggregation that lets the *sender's* tag display "delivered to 4/4" before it flashes confirm. **Counterfactual:** remove BLE and you have a wired/phone-mesh app needing a live server connection — a store with Wi-Fi and a shared internet link, which a BGMI tournament hall may not have; the squad goes dark the moment the venue network saturates. Remove the protocol layer and BLE Mesh becomes 4 tags shouting at each other at full power, draining a 200 mAh cell in 40 minutes and flooding irrelevant calls across the whole map. Both die independently.
- **Compliance check:** Managed flooding of squad-internal tags only; no packet is addressed to, sniffed from, or injected toward any game process, and BLE advertising carries the squad's own device IDs, not intercepted game data.
- **Bill of materials:**
  - 5× BLE-capable tag modules — realistically an nRF52832/ESP32-C6 micro-dev board each at ₹350 = ₹1,750, or 5× cheap BLE-only SoC boards at ₹150 = ₹750 (**preferred, keeps it in band**)
  - 1× ESP32-C6 squad hub that bridges to the team's existing Discord/WhatsApp via phone BLE — ₹450
  - 5× 150 mAh LiPo cells + TP4056 — ₹600
  - 5× injection-moulded-style clip shells (or 3D-printed TPU clips) — ₹450
  - 1× e-ink squad board, 2.9", showing the live roster mesh + "who has heard what" — ₹600
  - Misc: switches, straps, antenna — ₹250
  - **Total: ~₹3,100 (BLE-only SoC build) / ~₹3,900 (dev-board build)**
  - Band-honest: this is again above ₹500 for a 5-node mesh. It is the *most* naturally per-member-distributed of the five concepts, so pro-rata per member it is the cheapest per-player node; a 2-node squad pilot lands near ₹1,100.
- **Competitive edge:** Coverage is measured in *hops, not metres*, and the metric is "did the flank call reach the player holding site" — measurable as end-to-end delivery confirmation displayed on the hub, plus audit of how many rotation calls were received in-round versus chased in chat after the fact.

---

### 4. Pose Pin

- **Integration:** UWB (two-way ranging, IEEE 802.15.4a) **+ WebRTC P2P data channel with store-and-forward replay for dropped ranges**
- **The product:** A minimal two-tag version of Reaper Beacon purpose-built for the *bench-and-restart* case: it records where each teammate's phone was physically set down between rounds, so substitute players and half-time handovers do not lose their bearings in the venue.
- **Which game it serves:** Clash Royale (5-minute matches, frequent physical repositioning of two phones), EAFC25/FIFA (duels and replays), BGMI/FF Max lobby staging.
- **Why BOTH are required:** UWB two-way ranging is the only sub-₹400 radio that produces a *centimetre* distance measurement without a camera line-of-sight — two tags on two phones on the same bench return a 20 cm-accurate separation, which is what tells the substitute player "your controller is here, your phone is 30 cm behind the monitor." The WebRTC P2P channel + **store-and-forward replay** is what turns a stream of range samples into a *map*: it timestamps each range against the shared match clock, and when a sample is dropped mid-scene (a hand crosses the tag, a phone sleeps) the node replays the gap from its outbox rather than leaving a hole in the breadcrumb. **Counterfactual:** remove UWB and the substitute player is back to verbal "no, it's the *other* one" with two identical phones on a table — a genuinely common and genuinely lost 20 seconds. Remove the sync/replay layer and you have four tags whose ranges are never fused or placed in time, so you know the players are 40 cm apart and nothing about *where*. Both die independently.
- **Compliance check:** Pure intra-squad device-to-device ranging; no game process is queried and no other player's device is involved in the measurement.
- **Bill of materials:**
  - 2× UWB modules (DWM3000-class) — ₹350 each = ₹700
  - 1× ESP32-C6 hub — ₹450
  - 1× 3D-printed clip shells ×2 — ₹140
  - 1× 500 mAh power bank — ₹450
  - Misc: battery, switches, wiring, TP4056 — ₹160
  - **Total: ~₹1,900 for a 2-tag squad kit**
  - **Band-honest:** over ₹500; survives as a 2-person pilot at ~₹950 or as a "₹500/member, sponsor-submitted" concept.
- **Competitive edge:** The metric is restart-time — seconds from "we're back" to both substitutes correctly configured and in the right seat — plus measured accuracy of the bench layout (how many times a squad plugs in the wrong controller/gamepad after a swap). In a 5-minute Clash Royale bracket where every team plays back-to-back, cutting dead time per round is a real, measurable tournament edge.

---

### 5. Band Beacon

- **Integration:** LoRa / LoRaWAN-compatible sub-GHz radio **+ local-first sync (CRDT-style last-writer-wins squad state replicated peer-to-peer, no server required)**
- **The product:** A cheap *long-range* squad tag that does not do fine positioning at all — it does the opposite job: it publishes a squad-level zone claim ("we are holding C, do not rotate to B") that survives 300 m and a dead internet connection.
- **Which game it serves:** BGMI, Free Fire Max (endgame circle holds across 200–400 m, where voice chat drops), Valorant (site-claim discipline), EAFC25/FIFA (bench-level substitution signals).
- **Why BOTH are required:** LoRa's spread-spectrum modulation buys ~1–2 km line-of-sight at ₹150 per node, which is the only budget radio that carries a squad signal across an open BGMI final circle where everyone's phones have long since dropped Wi-Fi and cellular is congested by 40 other players at the venue. That reach is load-bearing and irreplaceable with the RF parent. **But LoRa alone is a one-way beacon with a 300-byte payload and no store, no retry, and no shared truth** — if the node holding the circle link loses power, the claim vanishes and nobody knows it ever existed. **Local-first CRDT sync** is the second half: each node keeps the *entire* squad zone-state log locally and reconciles merges automatically in any order, on any partial topology, with zero server — so a node that was out of LoRa range for 90 seconds comes back in and *converges* to the same state as everyone else without a single request/response. **Counterfactual:** remove LoRa and the reach collapses to the ~30 m of a phone hotspot or BLE, so the "zone claim" simply does not cross the circle — the concept stops existing. Remove the CRDT/local-first layer and you have a LoRa ping that repeats every 5 seconds and can be received by nobody; there is no squad-shared state, no convergence after a dropout, and it is strictly worse than yelling. Both die independently.
- **Compliance check:** Transmits a squad-internal, human-authored tactical claim to other squad members' tags; it is a walkie-talkie discipline broadcast, carrying no observation of, and no interaction with, any opposing player.
- **Bill of materials:**
  - 4× SX1278/RFM95 433–868 MHz LoRa modules (₹150 each) — ₹600
  - 2× ESP32-C6 squad hubs (₹450 each) — ₹900
  - 1× 2000 mAh power bank (hub) — ₹700
  - 4× 3D-printed clip shells / wrist straps — ₹340
  - 1× e-ink 2.9" hub display showing the reconciled zone log — ₹600
  - Misc: antenna (SMA whip ×2), regulators, wiring, TP4056 — ₹260
  - **Total: ~₹3,400 for a 4-tag squad kit**
- **Competitive edge:** The measurable win is **endgame coordination error rate** — how many times a squad rotates off a zone it had correctly claimed, and how quickly a returning node converges to the correct shared state after RF dropout. Measured as convergence latency after a 60–120 s disconnection, and as contested-rotations-per-game in the final circle.

---

## Ranking rationale

1. **Reaper Beacon** — highest tournament impact and the only one that produces a live in-game-relevant shared picture; sub-metre UWB + P2P fusion is the single strongest combination of "uses gear they partly own" and "measurably changes how a team plays." Its ₹-band overage is the main risk.
2. **Sub-Gig Relay** — best honest fit to the ₹100–₹500 *spirit* (one squad-shared unit, genuine delivery guarantees, real engineering in the DTN + QR handoff), and it targets the actual structural problem in tournament halls: RF-obstructed, network-saturated indoor play. Cheapest *concept* per team even if the BOM is above the literal band.
3. **Lattice Mesh Slice** — genuinely good hop-based comms, but the weakest new information gain over Discord voice; it buys reliability, not a new capability.
4. **Pose Pin** — narrow but real, and cheap in engineering complexity; solves a real but small problem.
5. **Band Beacon** — elegant CRDT design, but deliberately coarse; it is a discipline channel, not a positioning edge.

## Explicit cheat-boundary statement (for the jury)

Across all five concepts, the following are **never** done and must be stated on the pitch deck:
- No reading, intercepting, decoding, sniffing, or relaying of any other player's game input, network traffic, packet stream, voice, or device radio.
- No injection of input, macro replay, or automation into any game client.
- No second account, smurf, or cross-play identity usage.
- No jamming, denial-of-service, or spectrum interference of any kind.
- No scanning of the venue's Wi-Fi/Bluetooth/cellular infrastructure for opponent data.

Every radio described here is a **transmitter that announces the bearer team's own hand-entered tactical intent**, plus **intra-squad ranging between the squad's own tags**. That is communication equipment, in the same class as a gaming headset — it is legally and competitively a comms peripheral, not an information-gathering or input-automation device. The one concept with any conceivable proximity to a grey area is Reaper Beacon, because knowing teammate position *implies* inference about enemy position; the mitigation is that it only ever reports teammate positions, and the squad must still make the tactical call themselves.