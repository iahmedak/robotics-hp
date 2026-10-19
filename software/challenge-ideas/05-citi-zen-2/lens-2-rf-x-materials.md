# Lens 2 — RF & WIRELESS × ADVANCED MATERIALS & STRUCTURE

Citi-Zen 2.0 · Bengaluru · Tracks: Build-wize / Nature-based Bengaluru
Assigned parents: **A** = UWB, LoRa/LoRaWAN, NFC, mmWave, SDR, RFID, GNSS, Wi-Fi sensing, BLE, Zigbee, phased-array radar · **B** = shape-memory alloys, hydrogels, metamaterials, aerogels, mycelium composites, self-healing materials, graphene/CNT, transparent ceramics, bio-based composites, 3D-printed lattices

Counterfactual rule applied to every entry below: **remove either parent and the product stops existing** — not "works with slightly less polish."

---

### 1. HealGrade

**TOP 2**

- **Integration:** UWB (DWM3000-class ranging, 2–8 GHz) + nickel–titanium **shape-memory alloy** rebar/skin
- **The product:** A 900 mm reinforced concrete beam whose cast-in NiTi layer self-closes cracks under thermal cycling, with battery-free UWB tags reporting residual deflection to ±1.5 mm at 30 m **through** the slab — sold as "verified-healing-as-a-service," one annual certificate per beam.
- **Which track / which special award:** **Build-wize**. Primary target: **Best Sustainable Infrastructure Innovation (₹4,000)**; positioned to beat the ₹15,000 track prize because the demo *closes a commercial gap*, not a technical one.
- **Why BOTH are required:** NiTi alone heals **silently**. There is no artefact proving the beam recovered, so a structural auditor has nothing to certify and the owner refuses to pay the 20–30% "self-healing rebar" premium — it gets specified back to plain rebar on the very next tender. UWB alone measures deflection beautifully and still leaves a beam that crack-creeps to failure in 8–12 years. The product only exists as the pair: healing that is **measured, signed and invoiceable**. Remove the SMA and it is a $15 sensor on a doomed beam; remove the UWB and it is an expensive material nobody can prove works.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | NiTi SMA wire 0.5 mm, 600 g | 3,600 |
  | UWB dev kits (DWM3000) ×2 | 4,200 |
  | UHF ceramic patch antennas ×4 | 1,800 |
  | STM32 + SX1276 LoRa + SD/RTC | 2,100 |
  | M20 mix, river sand, 12 mm rebar cage, mould | 900 |
  | PLA sealed housings ×6 | 600 |
  | DS18B20 thermistors ×8 | 400 |
  | 5 V power bank, cabling, consumables | 900 |
  | **Total** | **₹14,500** |
- **Build time:** 30 hours (2 members × 15 h)
- **Measurable impact claim:** Crack closure of 0.6–1.2 mm, verified twice — by optical comparator (ground truth) and by UWB; beam retains **>90% pre-crack flexural stiffness** after 10 freeze–thaw cycles vs **~60%** for the plain-rebar control. Zero batteries and zero wiring over the slab, which is where the whole cost argument lives.

---

### 2. EarthWave

**TOP 2**

- **Integration:** LoRaWAN (868/915 MHz) + **bio-based composite**: rammed earth (Bengaluru laterite/clay) + paddy husk + rice straw, percolated with **CNT** to create a DC-conductive phase
- **The product:** A 3D-printed rammed-earth wall panel in which the CNT-percolated soil-and-husk mix **is** the 915 MHz antenna — a sealed LoRaWAN node buried in the wall reports soil moisture and creep from inside the wall, with no puck, no cable and no coin cell anywhere.
- **Which track / which special award:** **Build-wize**. Primary target: **Impact Award (₹4,000)** — the scale story is a city, not a beam: ~4,000 dead coin cells and ABS enclosures removed from Bengaluru's municipal sensor fleet, which is the exact number a BCCMP/BBMP judge can audit.
- **Why BOTH are required:** LoRaWAN alone means an IP65 plastic puck glued to the wall with a CR2032 inside. That cell dies in 18–24 months, the puck is binned, and Bengaluru's sensor fleet becomes **4,000 pieces of e-waste** — the sustainability case dies on contact. CNT-doped earth alone is just a wall. The pairing makes the **structure itself the radiator**: permanent, repairable with a trowel, zero epoxy, zero ABS, zero lithium. Remove the composite and the node is a disposable battery product; remove LoRaWAN and you have a conductive mud wall.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | Multi-wall CNT powder, 2 g | 1,500 |
  | Paddy husk + rice straw aggregate, clay, soil | 500 |
  | 3D-printed compaction moulds (PLA, reusable ×6) | 1,200 |
  | SX1262 LoRaWAN node + SMA + custom PCB | 1,900 |
  | 2 W thin-film solar cell + supercap | 1,100 |
  | RP2040 + capacitive moisture + crack gauge | 1,200 |
  | Bitumen-free sealing tape, tools | 800 |
  | **Total** | **₹8,200** |
- **Build time:** 24 hours
- **Measurable impact claim:** Packet delivery ratio and RSSI margin from a node sealed inside a 300 mm earth wall vs. an identical wall-mounted puck, measured over 1,000 packets; node lifetime **>10 solar cycles (~10 yr) vs 1.5 yr** coin-cell; **0 g ABS + 0 g Li-ion per node vs 180 g + 1 coin cell**. Put three of these in a BBMP field and the number writes itself.

---

### 3. MycoPass — *"a mycelium block that can get paid"*

- **Integration:** Passive **UHF RFID** (860–960 MHz, read through soil and masonry) + **mycelium composite** (paddy-stubble spawn, moulded in PLA)
- **The product:** Grow-mycelium kerb-pavers, rain-garden planters and storm-drain covers for BBMP that carry a passport **written into the block while the fungus is still growing** — species, substrate batch, growth days, compressive strength and embodied carbon, machine-readable at the point of delivery.
- **Which track / which special award:** **Nature-based Bengaluru**. Primary target: **Best Nature Based Solution (₹4,000)**. Explicitly *not* a Build-wize entry — the deliverable is a certified, procurable bio-material, which is what makes it nature-based infrastructure rather than a garden curiosity.
- **Why BOTH are required:** Mycelium composite alone has no identity. A grown block has no spec sheet, no batch number and a compressive strength that swings **±30%** with humidity and growth days, so no BBMP engineer can certify it, no vendor can invoice it, and mycelium dies on the procurement desk. An RFID tag alone is a sticker — peel it, swap it, and the claim is worthless. The pairing writes the tag **during growth and inside the block**, so material and identity are physically inseparable: that is precisely what makes the block procurable, and procurable is what makes it nature-based at scale. Remove the composite and you have a label on nothing; remove the RFID and you have an uncertifiable mushroom brick.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | Paddy stubble substrate + mycelium spawn (5 species) | 900 |
  | UHF RFID ceramic inlays, 13.56-compatible ×12 | 900 |
  | Bench-top NFC writer + read/write SDK | 600 |
  | 3D-printed moulds (reusable ×8) | 1,200 |
  | Incubator chamber + temp/RH loggers | 900 |
  | Handheld UHF reader (₹2,800 — **borrow from a logistics depot or campus RFID lab**) | 2,800 |
  | Press, sealer, test rig | 700 |
  | **Total** | **₹8,000** (₹5,200 if reader borrowed) |
- **Build time:** 20 hours hands-on (fungal growth runs in parallel for 6–8 days; batch 3 spawns 72 h apart so a harvest is always on the bench)
- **Measurable impact claim:** UHF read success rate on a paver buried 150 mm in soil at 1.5 m range (target >95% over 100 reads). The headline number is a **paper** one: blocks that pass a certification body with an embedded passport = **100%; with the same blocks and no passport = 0%** — same material, same cost, same sustainability claim, opposite commercial outcome.

---

### 4. CoolPane — *the wall you can see through, but not heat through*

- **Integration:** 60 GHz **mmWave radar** presence/breathing sensing (IWR6843-class) + **rice-husk aerogel** bio-composite with a printed dielectric-matching face
- **The product:** A 500 mm insulation panel made from Bengaluru paddy-husk aerogel, tuned to sub-1 dB loss at 60 GHz, so a **camera-free** mmWave radar tracks occupancy, respiration and bed-motion inside windowless, air-conditioned low-income rooms.
- **Which track / which special award:** **Build-wize**. Primary target: **Best Sustainable Infrastructure Innovation (₹4,000)** — strong challenger to HealGrade, and the better fit if the jury weights "does anyone actually want this."
- **Why BOTH are required:** The radar alone is blind in exactly the room it is needed for — a windowless low-income room has an AC condenser, a door and a curtain across the only wall, and a family will not accept a camera. Ordinary insulation makes it worse: AAC block, glass wool and even *unmodified* aerogel attenuate 60 GHz by **>25 dB**, so the radar dies behind its own wall. Only an ultra-low-permittivity aerogel, tuned with a thin printed matching face, insulates **and** passes the beam in the same 50 mm. Remove the aerogel and the radar has nothing to see through; remove the radar and you have expensive foam that cannot tell an occupied room from an empty one, and no proof the AC can be switched off.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | Rice-husk aerogel blocks, 2 × 500×500×50 mm | 2,600 |
  | Polysilazane binder + feedstock prep | 800 |
  | Printed λ-matching dielectric tiles (copper on RO4350) | 1,900 |
  | TI IWR6843 mmWave module + antenna array | 6,800 |
  | 5 V supply + USB-serial | 400 |
  | 3D-printed waveguide shroud (PLA) | 400 |
  | Thermal-resistance test rig + IR camera | 900 |
  | **Total** | **₹13,800** |
- **Build time:** 26 hours
- **Measurable impact claim:** Range and detection of a 1 mm chest-wall motion at 2.5 m, **panel present vs 50 mm glass-wool control present vs panel removed** — one module, three configurations, one number that separates the physics from the marketing. Pair it with panel R-value and a logged AC kWh delta over one afternoon.

---

### 5. BrickPass — *the school that finally gets paid for its bottles*

- **Integration:** **NFC** (NTAG216, 13.56 MHz, phone-tap) + **3D-printed recycled-PET gyroid lattice** (shredded classroom water bottles, single-piece load-bearing)
- **The product:** A load-bearing classroom sit-stand + storage brick printed from a school's **own** collected PET in one gyroid lattice, with the NFC tag bonded into the print bed mid-layer so it opens a municipal waste-diversion claim the school can actually collect.
- **Which track / which special award:** **Build-wize**, entered for **Best School Innovation (₹4,000)** — the cheapest build on this list (₹3,150) and the only one a class of students can repeat themselves, which is what that award is actually judging.
- **Why BOTH are required:** The gyroid lattice is the only way a classroom-scale brick can be printed from shredded PET and still take a real load at 2.1 g/cm³ infill — remove the lattice and it is brittle flake that snaps at the first desk slam, so it is decorative and cannot be a product. The NFC tag is the only way the school can prove the brick came from **its** 3,200 collected bottles: the municipal diversion bounty pays per *verified* kilogram, and without a tag physically embedded in the print the claim is self-attested, pays nothing, and the entire loop collapses back to buying bricks. The brick is the evidence; the tag is the receipt. Neither survives being removed.
- **Bill of materials:**
  | Item | ₹ |
  |---|---|
  | Shredded PET flake, 4 kg (**collected from the school's own bins**) + shredder rental | 400 |
  | NTAG216 NFC tags ×16 | 450 |
  | Antenna trace: copper tape + flex PCB | 600 |
  | FDM filament for moulds and test fixtures | 900 |
  | Non-toxic epoxy-free PET binder | 500 |
  | Compression test rig (school lab) | 300 |
  | Phone + tap-to-read web page (no server, offline PWA) | 0 |
  | **Total** | **₹3,150** |
- **Build time:** 14 hours (2 members × 7 h)
- **Measurable impact claim:** Compressive strength in MPa at 2.1 g/cm³ gyroid infill against an ISO reference block; **2.4 kg of plastic diverted per brick**; and the number that actually pays — rupees released per tonne diverted **with** the embedded tag vs **without** it (₹0). A judge can verify all three in one afternoon with a school lab and a kitchen scale.

---

## Notes for the pitch

- **Award spread:** Build-wize ×4, Nature-based Bengaluru ×1 (MycoPass). All four special awards are named; **Best Sustainable Infrastructure Innovation is contested twice** (HealGrade #1, CoolPane #4) so the team can pick on the day based on which demo is working.
- **Bring both to the demo:** If HealGrade and EarthWave are both alive, enter HealGrade for Build-wize ₹15,000 and EarthWave for Impact ₹4,000 — two bites, no rule against it.
- **Cheapest fallback if something breaks:** BrickPass at ₹3,150 and 14 hours survives any single hardware failure.