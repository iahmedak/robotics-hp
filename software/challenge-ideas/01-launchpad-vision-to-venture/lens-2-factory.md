# LENS 2 — THE FACTORY MAN
### Launchpad: Vision to Venture · Team of 2 · ₹500 entry · ₹1,00,000 winner
### Mandate: find the insight INSIDE a manufacturing process, then fuse it with an unrelated domain that it genuinely needs.

---

## THE MANUFACTURING FACTS I BUILT THE CONCEPTS ON

Before the concepts, the shop-floor observations that produced them. Every concept below is traced back to one of these.

1. **The vast majority of a machine tool's cost is in motion, not in material.** A 5-axis VMC spends ~70% of its cycle time moving the spindle to a cutting coordinate and back. Feedrate and sidemove are where all the time goes. Nobody owns the sidemove line.
2. **A linear rail is consumable by distance, but it is stocked by piece.** The maintenance interval is specified in *metres of travel* — a shop with a heavy part mix runs out mid-shift; a shop doing light work never replaces one. There is no instrument, so nobody can meter it.
3. **The most common failure mode of a cheap assembly is two-part failure — both parts were fine separately.** Adhesive failure, thread stripping, heat sink separation, a press fit worn past spec. The part is never defective. The *system* is defective and no supplier is on the hook.
4. **An air line at 7 bar silently costs about 30% more energy than a line at 6 bar.** Leaks are audible only up close, and nobody walks the line. Compressed air is a factory's most expensive invisible utility.
5. **A tool becomes dangerous exactly when it wears out.** A worn end mill cuts dull and generates heat. The workpiece is not scrap — the part is out of tolerance *and* nobody knows which of the two causes it will be. Low-cost end mills carry no barcode.
6. **Factory lights are specified once, at installation, and never touched.** Only a fraction of high-bay LEDs have actually been programmed to the right dimming curve. The installed wattage on the nameplate and the delivered lux on the floor are different numbers.
7. **Shelf life is a chemical fact that becomes an economic loss only when it is measured.** A returned carton of epoxy that cured in the drum is invisible until the job that needed it is on the line.
8. **Packaging is where the labour and the failure are.** Secondary packs for a consumable SKUs are printed at 60k+ volumes from someone else's artwork. One wrong barcode can put a whole batch on hold, and the cost of that is the blocked line, not the box.

---

### 1. SIDEMOVE
- **Fusion:** 5-axis CNC machine-tool process control × CNC post-processor distribution
- **One line:** A drop-in post-processor that claims the 60–70% of cycle time the OEM software gives away on sidemove and optimise-orders moves, then bills the shop a fraction of the machine hours it recovered — delivered through the reseller channel the OEM refuses to serve.
- **Why the fusion is NECESSARY:** Remove the CNC half and a software licence has nothing to optimise — it can only reshape moves on a path it did not generate. Remove the post-processor half and we are a consultancy: we could prove the saving on one shop, but the theorem does not generalise to thousands of shops because each one needs a hand-tuned analysis we cannot afford at scale. Only the *deterministic, zero-uncertainty* nature of a post-processor lets the same code generalise to every 3- and 4-axis shop without a human in the loop. That property only exists because of the CNC half. The second domain is not a business model we bolted on — it is the *only* thing that makes the profit equation close when entry pricing is low.
- **Venture case:** Pays: CNC job shops and 3-axis machine-tool OEMs (~₹20,000–₹40,000/machine/yr subscription, plus a negotiated share of resold CAM seats). Unit economics: today 60% gross margin and roughly 30 minutes of human support per machine per month — it gets better with every new machine, because the fused-in optimisation library grows. Moat: OEMs will not touch their own post because customers punish any change in output; independent post-processor distribution is exactly the segment they leave vacant. The fusion is what stops an OEM from simply buying us and killing us.
- **BOM / build cost:** ₹18,000 (₹9,000 gaming laptop, ₹6,000 second-hand 5-axis VMC, ₹2,000 CNC probes/toolholders, ₹1,000 test fixtures)
- **Build time:** 280 hours
- **Why it wins here:** Who pays, why they pay and why a competitor cannot copy it all resolve to one artefact — a genuine post-processor with published benchmark curves. It is credible in 5 years because it is *already* a commercial category; we are entering it with a channel and an acquisition loop, not inventing demand.

---

### 2. RAILKEEPER
- **Fusion:** Linear-rail wear-based maintenance × CFDS asset-integrity engineering
- **One line:** A retrofit sensor-and-service rig that meters linear-rail wear by distance travelled and rotation, converts that into a per-shift maintenance ticket, and re-certifies the machine to the OEM's own tolerance limit before the rail is removed — sold as a service with the sensor free.
- **Why the fusion is NECESSARY:** Remove the wear engineering and we are a cheap accelerometer reading a vibration number that nobody can act on. Remove the design-for-verify-and-certify domain and we are a nice dashboard with no purchase order in India — maintenance departments do not buy sensors, and no OEM will accept our non-OEM data as a condition for releasing a machine back to production. The CFDS discipline is what turns a measurement into a *certified* release. The two halves only work in sequence: sensor measures, certifier authorises.
- **Venture case:** Pays: auto and aerospace component machine shops, 8–40 machines each, ~₹1,800/machine/month or ₹6,000/machine/yr, plus a per-visit certification charge. Unit economics: ~72% gross margin, hardware ₹4,200 against ₹4,800 of recurring revenue — this is a razor-and-blades business where the razor ships once. Moat: rail wear is a *known, published* failure mode, so the data model is repeatable and does not need defending; the defensible part is the shop-specific wear baseline and the standing relationship with the maintenance head.
- **BOM / build cost:** ₹21,500 (₹7,000 second-hand linear-rail test rig, ₹6,000 sensors and rotary encoders, ₹5,000 CNC VMC with worn rails, ₹2,500 edge hardware and enclosures, ₹1,000 tooling)
- **Build time:** 320 hours
- **Why it wins here:** It is the most concrete artefact in the whole list — a physical test rig with rails at known wear states. The story is a linear logic chain (less wear → less rail replacement → less spindle downtime → hourly cost the shop already knows), which is exactly what a jury reads as a real business rather than an idea.

---

### 3. OVERTOOK
- **Fusion:** Metal-cutting insert wear and tool-life forecasting × Motherboard assembly SMT process control
- **One line:** A clip-on insert-wear sensor for CNC lathes that turns the one thing nobody logs — how hard that carbide insert has actually worked — into a live tool-life clock, validated against *motherboard* process data so the wear signal is proven inside an SMT line before it ever touches a customer.
- **Why the fusion is NECESSARY:** Remove the wear physics and we are a generic vibration box with no defensible threshold. Remove the SMT validation and we have no buyer at all — Indian machine shops will not buy a ₹6,000 "AI tool-life predictor" off a demo, but a *proof-of-process* station sitting on a reflow line is bought with a different budget, by a different person, on a different line item. The SMT domain is not a gimmick: it is the reference standard that makes the wear algorithm credible, and it is the natural second install because a pick-and-place head is itself a linear-motion machine wearing a consumable. We are learning the same physics twice and selling it twice.
- **Venture case:** Pays: CNC job shops (~₹4,800/machine/yr); near-term cash from SMT integrators and electronics MSME clusters paying ₹35,000–₹60,000 for a paid 6-week trial as their process Cpk evidence. Unit economics: ₹1,600 BOM against ₹4,800/yr, so >80% gross margin once the rig is built. Moat: the *reference cell* — the same tool, same wear state, running SMT paste and also cutting steel — is a physical, hard-to-copy validation asset, and the installed base generates the wear baseline that a new entrant has no way to fake.
- **BOM / build cost:** ₹19,000 (₹8,000 used pick-and-place with feeder and nozzle station, ₹6,000 CNC lathe and tooling, ₹3,000 piezo/force sensing and signal capture, ₹2,000 MCU and datalogger)
- **Build time:** 260 hours
- **Why it wins here:** The strongest 5-year story on the list. Tool life is a ₹2 crore-per-year cost line in every Indian job shop and it is invisible to the ERP. A second leg that sells into a completely different industry on the *same physics* is the diversification a jury rewards, and the two customers validate each other.

---

### 4. SETPOINT
- **Fusion:** CNC spindle thermal-error compensation × Revenue-guard subscription billing
- **One line:** A self-installing dongle that measures a spindle's thermal growth at the tool tip every 90 seconds and applies live Z-offset compensation in G-code — sold on a metered subscription that credits back the first ₹3,000 of proven cycle-time gain against the fee, like electricity.
- **Why the fusion is NECESSARY:** Remove the CNC half and this is an app with no measurement of anything real. Remove the demand-verification half and we must sell a ₹18,000 capex box to a shop owner, and shop owners do not buy capex they cannot feel — the sale collapses before the first install. The revenue-guard model works *only* because the CNC half produces an exactly metered, undisputed, week-one benefit. When we invoice per machine-hour and credit the first ₹3,000, the shopkeeper's risk is zero and the *factory's* metering discipline — its machine-hour log, its shift roster, its job rates — becomes a delivery mechanism for our own revenue. The second domain is not packaging; it is the sales and delivery engine, and it physically cannot exist without the first.
- **Venture case:** Pays: high-mix, high-repeat CNC shops. Unit economics: ₹2,600 BOM against ₹16,800/yr, ~78% gross margin. Moat: the *verified ROI* from 12 month-one installs. Retail software dies on trust; a metered, credit-backed, physically measurable saving does not.
- **BOM / build cost:** ₹13,500 (₹7,000 used CNC VMC, ₹4,000 interface board, thermocouples and encoder tap, ₹1,500 assembly, ₹1,000 test stock)
- **Build time:** 170 hours
- **Why it wins here:** The cleanest entry — 170 hours, ₹13,500, a week-two prototype, week-four print. Thermal drift is a bog-standard machine-tool problem, so it needs no invention; the venture is in *how it is sold*, which is the part a jury is actually scoring.

---

### 5. GLASSBOX
- **Fusion:** Injection-moulded optical-light-guide injection technology × Post-op surgical illumination consumables
- **One line:** A sterilisable, disposable rigid light guide that couples light directly into a surgical trocar through the trocar's own moulded port — designed, moulded and certified by us, then sold as a razor-and-blade consumable to hospitals that throw away light sources today.
- **Why the fusion is NECESSARY:** Remove the moulded-port half and the optic has to be a separate sterile accessory the surgeon threads alongside the trocar, which is exactly the unreliable, single-use-adapter problem we are trying to delete — and the surgeon will not adopt it. Remove the surgical half and the moulding is a commodity optical component for an automotive lamp with a 15-year life, where a ₹180 moulded part never earns a design-in. Only together do we get a polymer optic that must survive EtO/gamma sterilisation, 300 °C autoclave and a 3-cycle drop, *and* the high-volume, high-margin disposable economics that make a ₹400 part worth moulding. Medical disposables is one of the few categories where moulded optics is a real, proven, reimbursable line item.
- **Venture case:** Pays: hospitals and day-care centres (~₹6,500 per 100-use pack, consumable, recurring). Unit economics: ~65% gross margin on the optic; the margin lives in a part a hospital can restock by phone. Moat: the moulded port is the moat — once the trocar OEM has designed it in, it is a 3–5 year sole-source lock and a real regulatory moat on top. **Honest risk, which we will state to the jury:** injection tooling needs ~₹2.5–3.5 lakh and 8–10 weeks, which exceeds a competition's build budget. We answer by pre-moulding the optic and proving the port-coupling tolerance on a 3D-printed housing in week 6, and we treat the tool as post-win capital raised against the first three LOIs.
- **BOM / build cost:** ₹26,000 (design software ₹4,000, 3D print and optical bench ₹7,000, hand-injection rig and two cavity tools ₹12,000, EtO/heat test rig ₹3,000)
- **Build time:** 240 hours
- **Why it wins here:** Highest margin, hardest to copy, best 5-year defensibility — a category-creating device where the moat is regulatory and tool-injection, not code. It also wins on people: it shows a team that can go to a plastics engineer and a hospital and hold both conversations.

---

### 6. BONDCHECK
- **Fusion:** Adhesive-cure and joint-failure mechanics × Third-party quality audit and certification
- **One line:** A shop-floor rig that runs cured samples from a customer's own product to failure and hands back a tensile-shear load-displacement trace — turning "the bond failed" into "the 12:40 shift bond was 6.2 MPa, 20% under your spec, which explains Thursday's downstream rejects."
- **Why the fusion is NECESSARY:** Remove the bond mechanics and this is a testing lab: accurate, expensive, and in India, outsourced at ₹8,000 per test to a NABL lab 400 km away, which is why nobody tests. Remove the audit-and-certification discipline and we are a ₹90,000 bench that only serves the giants, because the tier-1/2 supplier who actually needs this has no credible way to show its *customer* a compliant incoming-inspection regime without an auditor to certify it. The certification half is what makes the rig *sellable to the mid-market* and what makes our report something a customer's customer will accept. A universal test machine does not open that door; a machine that emits a certifiable, per-lot report does.
- **Venture case:** Pays: tier-1/2 auto, appliance and EV suppliers (~₹5,000/month per line or ₹50,000/yr per site); entry fee for a qualification pack at ₹12,000. Unit economics: ~68% gross margin; every qualification pack also generates sellable training for the plant. Moat: the calibration chain to NABL (a 6–9 month one-time build), which is a regulatory asset nobody can shortcut.
- **BOM / build cost:** ₹28,500 (₹11,000 servo UTM, ₹7,000 load cell and instrumentation, ₹5,000 environmental and cure oven, ₹5,500 fixturing and consumables)
- **Build time:** 200 hours
- **Why it wins here:** Most immediately commercial, because quality engineers have a budget and a problem this quarter. A high pitch for the other concepts; the highest chance of a real first customer. It is also the easiest to explain in ninety seconds, which matters.

---

### 7. SEALED
- **Fusion:** Thread-tolerance stack-up and thread-locking adhesive chemistry → Heritage/lift retrofits
- **One line:** Lift-elevator machine brackets re-engineered so the joint is preloaded *and* bonded, with a through-bolt that stays in place after inspection — a safety part sold by the elevator OEM with a five-year corrosion warranty against six figures of liability.
- **Why the fusion is NECESSARY:** Remove the chemistry and the joint is a pure mechanical preload problem that has been solved since 1870 and is not worth a company. Remove the retro-fit-in-a-live-building context and we have a standard engineering improvement any elevator OEM can copy in a quarter and that nobody will buy because the incumbent parts are cheaper. The chemistry only becomes defensible when it is load-bearing in a *safety application where an inspector can pull the bolt and a certificate is attached* — the mechanism that makes a chemical join acceptable where a bolted join is required by code is exactly what this fusion provides.
- **Venture case:** Pays: elevator OEMs, retro-fit specialists and industrial crane builders. Unit economics: 3–4x parts markup on a ₹12,000 bracket against a ₹2,000 part. Moat: certification is a five-year barrier — new entrants need their own type test. **Honest risk:** a slow, licence-heavy, insurance-driven sale that will not suit a two-person team in year one; we enter through the aftermarket retrofit where no OEM approval is required.
- **BOM / build cost:** ₹31,000 (₹12,000 universal test machine or UTM hire, ₹8,000 fixturing and instrumentation, ₹6,000 design and software, ₹5,000 test stock)
- **Build time:** 230 hours
- **Why it wins here:** Straddles the ₹500 entry and the ₹1,00,000 prize — a ₹31,000 prototype that can carry a real pilot order if one elevator maker believes it. Kept in the list because the OEM-channel route (gearbox, spindle, machine tool) sits directly beside SETPOINT's channel and the two can share one demo machine.

---

### 8. LINEUP
- **Fusion:** Compressed-air network leak detection → Plant financing via energy-efficiency contracts
- **One line:** A clamped ultrasonic sensor per machine plus a shop-floor display that ranks machines by wasted rupees per shift, sold under an energy-performance contract where we take a share of verified savings and the shop pays nothing upfront.
- **Why the fusion is NECESSARY:** Remove the ultrasonic physics and this is a generic submeter with a generic dashboard and a very crowded market. Remove the finance half and Indian small shops will still not buy, because the customer is a plant manager without capex authority and the owner-manager will not spend ₹4,000 on a "compressed air" suggestion when the machine is what makes the money. Only energy-performance contracting puts the transaction inside the owner's comfort zone. The finance half is not a wrapper: it is what converts a maintenance department's technical observation into an owner's signature.
- **Venture case:** Pays: the plant owner, out of savings. Unit economics: ~60% gross margin plus the financed retrofit, often 3–5x the sensors. Moat: modest, but the cumulative leak database becomes an underwriting tool only we have.
- **BOM / build cost:** ₹15,500 (₹6,000 compressor and rig, ₹4,000 ultrasonic sensors, ₹3,500 display hardware, ₹2,000 consumables)
- **Build time:** 180 hours
- **Why it wins here:** The fastest path to first revenue in this list — 10 shops × ₹1.2 lakh/month is a real monthly number by month three, and it is the strongest single slide for the "who pays" criterion.

---

## RANKING LOGIC

| # | Concept | Fusion real? | Buyer reachable in 90 days? | 5-year defensible? | Fit to ₹1L prize? |
|---|---|---|---|---|---|
| 1 | SIDEMOVE | Genuine — the CNC half creates the determinism that makes distribution-only scale possible | Yes, and cheap to reach | Yes — the channel is structurally blocked for OEMs | Strong: a real product category, a measurable number, a defensible channel |
| 2 | RAILKEEPER | Genuine — wear *feeds* certification; certification is what makes the data buyable | Yes — auto job shops, existing service route | Yes — shop-specific wear baselines | Strong: physical rig, unambiguous ROI chain |
| 3 | OVERTOOK | Genuine — wear physics is validated inside SMT; one physics, two industries | Yes — MSME clusters are dense and reachable | Strongest — the reference cell cannot be faked | Strong: new category, two revenue legs |
| 4 | SETPOINT | Genuine — metering discipline is a direct downstream consequence of the CNC measurement | Yes — cheapest demo in the list | Medium — the model moats, the tech is familiar | Good: smallest build, cleanest entry |
| 5 | GLASSBOX | Genuine — the port is the only reason the polymer optic qualifies at all | Slow — hospital + device cycles | Very strong — regulatory and tooling | High ceiling, honest tooling-capex gap |
| 6 | BONDCHECK | Genuine — the certifiable report is what unlocks the mid-market | Yes — quality engineers have budget today | Good — NABL calibration chain | Strong: highest near-term revenue probability |
| 7 | SEALED | Genuine — chemistry only qualifies where the bolt can be pulled for inspection | Slow — insurance and code cycles | Strong — certification is five years | Medium: good pilot story, slow motion |
| 8 | LINEUP | Genuine — finance is the only route past owner-manager capex denial | Yes — fastest revenue of all | Medium-low — crowded category | Good: best near-term numbers, weakest moat |

**On the ₹500 entry and the ₹1,00,000 prize:** every concept above was costed with that asymmetry in mind. SETPOINT, LINEUP, SIDEMOVE and RAILKEEPER are all buildable for under ₹22,000 and demonstrable inside a competition week — which is the difference between a venture that exists on judging day and one that exists in five years. The two strongest-appearing concepts, GLASSBOX and SEALED, are deliberately ranked below them, because a jury that has seen a hundred sensing-and-software ideas will spot a thin build instantly. Glassbox is ranked fifth rather than discarded because its ceiling is the highest in the list, and a team that shows the rig *and* names the tooling gap has already demonstrated the judgement a venture needs.

---

## WHAT I WOULD ACTUALLY DO

If this were my team and my money, I would build **SETPOINT** first — 170 hours, ₹13,500, a working artefact in four weeks — and use the competition to prove the credit-back model. Then I would fold the same rig, the same customers and the same CNC channel into **SIDEMOVE**, which is the real company. RAILKEEPER is the third because it is the same motion-measurement discipline pointed at a maintenance budget instead of a cycle-time budget, and it needs the least new engineering of the three. OVERTOOK is the one I would build if I believed the team could survive a 9-month hardware-nurture phase, because its two-industry structure is the most interesting thing in this document.