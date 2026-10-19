# PC / Laptop Outreach Pack

Written 2026-10-17. 47 targets across four lanes. Every email is an offer to
*do work on their hardware and publish it*, not a request for a handout.

## Read this first

**Sending these unchanged will get you zero replies.** They're written as
scaffolds. Each one has a bracketed slot you must fill with a real detail
about that specific machine, or delete the email.

Three rules before you send anything:

1. **Find the real address.** Most of these go to `press@`, `contact@`, or a
   community manager's public address, not a sales inbox. Check the brand's
   own contact page. If you can't find one, don't guess at patterns.
2. **No attachments, no HTML, plain text.** Links kill deliverability.
3. **Verify the list right before upload** and keep bounces under 2%.

Subject lines are 2 to 4 words, lowercase, and they read like internal mail
on purpose. Don't "improve" them.

## Lane 1 — AI PC and NPU (local LLM benchmarks)

The strongest lane. Every NPU vendor is shipping performance claims with
almost no independent data behind them. That gap is real and you can fill it.

Brands: Intel, AMD, Qualcomm, ASUS, Lenovo, HP, Dell, Acer, Samsung, MSI, Gigabyte

## Lane 2 — Robotics and simulation

Smaller companies, far more receptive than big tech. They need people
actually validating hardware in sim.

Brands: NVIDIA, Universal Robots, Franka, Dobot, Unitree, Robotnik, UFactory,
AgileX, RealMan, Elephant Robotics, plus simulation tooling vendors

## Lane 3 — Workstation and GPU

Reviews and benchmarks are currency here.

Brands: Dell Precision, HP Z, ASUS ProArt, MSI Creator, Lenovo ThinkPad P-series,
Gigabyte, Zotac, PNY, Gainward, Inno3D, Palit, PowerColor, Sapphire, ASRock,
Razer Blade, Alienware, Origin PC, Maingear, System76, Tuxedo, Framework

## Lane 4 — Refurb and budget (highest odds)

These vendors answer email. Use them if you need hardware before the
outreach above lands.

Brands: Back Market, Renewed, eBay certified refurb, Recompute, Newegg Business

## Cadence

| Day | Send | Angle |
|---|---|---|
| 1 | Email 1 | The core offer |
| 4 | Email 2 | A new proof point or a narrower ask |
| 9 | Email 3 | Offer to do it on their existing public build instead |
| 16 | Breakup | Last touch, then stop |

Every follow-up must add something new. "Just checking in" is the single
worst follow-up sentence in outbound. Stop all channels the moment anyone
replies, including if the reply is "not now."

## What actually gets you a machine fastest

Nothing in this folder will arrive in under three weeks. If you need a
computer now, buy refurbished:

- **ThinkCentre T14 / OptiPlex**, Xeon, 64GB RAM: ~$150 to $250. Fine for
  compiling, servers, most day-to-day dev.
- **Dell Precision T5820 or HP Z2 G8 with RTX 3090 or A5000**: ~$400 to $600
  used. A 3090 gives you 24GB VRAM, and VRAM capacity alone decides whether
  Isaac Sim is usable. Nothing else substitutes for it.

Then run the Lane 1 benchmarks on that machine, publish them, and pitch
vendors with data instead of a request. That's the version that gets replies.

## Tracking

Use `targets.csv`. Columns are self-explanatory. Update `status` the moment
anything happens, especially on a reply, so you don't accidentally follow up
on someone who already answered.