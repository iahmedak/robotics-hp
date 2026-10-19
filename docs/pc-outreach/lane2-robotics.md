# Lane 2 — Robotics and simulation

Subject lines vary per brand. This lane has the highest reply rate because
these companies are small enough that a human actually reads the message.

---

## NVIDIA

Subject: `isaac sim on consumer hardware`

To: Isaac Sim developer relations / Omniverse forums

```
Hey,

I run Isaac Sim regularly and most of the "will this run" answers are guesswork.
People with a single consumer GPU want to know what's actually feasible
before they buy.

I'd like to write a tested compatibility series: which Sim versions run on a
given card, real frame times for a documented scene, VRAM breakpoints, and
the exact settings that matter. Independent, reproducible, and useful to your
docs team.

I can start with hardware on loan if that's easier than a review unit.
Interested?
```

---

## Universal Robots

Subject: `ur sim on a workstation`

```
Hey,

I use UR arms in sim and the gap between the URDF that ships and how the arm
behaves in Isaac or MuJoCo is where most of my debugging time goes.

If I can borrow a workstation I'd put together a validated UR arm setup:
collision meshes checked against the real arm, joint limits verified, and a
documented set of sim scenes that actually converge. I can also test your
newest gripper if you're shipping one.

The write-up would be public and reusable. Interested?
```

---

## Franka Emika

Subject: `franka sim validation`

```
Hey,

I do Franka work in Isaac Sim and I'd like to make your sim assets more
trustworthy for people outside your own team.

Borrow a workstation and I'll validate the Franka model: FK against the
real arm, collision mesh accuracy, joint limit behavior, and a set of
reproducible tasks that stress the controller limits you document. Public
write-up, corrected by your team before it goes anywhere.

Interested?
```

---

## Dobot

Subject: `dobot sim accuracy`

```
Hey,

Dobot arms show up in sim with joint limits that don't match the spec sheet,
and that causes real problems for people writing off-line programs.

With a workstation on loan I'd validate the Dobot sim model against the real
arm: FK, joint limits, TCP offsets, and a set of pick-and-place tasks that
work without manual fudging. Public write-up, corrected by you before
publication.

Worth doing?
```

---

## Unitree

Subject: `unitree go2 sim setup`

```
Hey,

I work with Go2 in Isaac Sim and the biggest friction is getting the sim
model to match real behavior closely enough that a policy trained in sim
does something sensible on hardware.

With a workstation I can build a documented setup: sensor noise models,
latency injection, actuator limits, and a comparison of sim return against
real Go2 telemetry where available. Open write-up.

Interested?
```

---

## Robotnik

Subject: `mobile manipulator sim`

```
Hey,

Your mobile manipulator platforms are common in sim but the standard setups
tend to be stale by a few releases.

With a workstation on loan I'd refresh and document a working Isaac Sim setup
for one of your platforms: correct meshes, honest joint and wheel limits,
navigation config that actually runs, and a note on what breaks.

Happy to publish it. Interested?
```

---

## UFactory

Subject: `xarm collision meshes`

```
Hey,

I'd like to help with a recurring problem: the xArm collision meshes in sim
don't match the physical arm closely enough for reliable grasp planning.

With a workstation borrowed I can measure the real arm, correct the meshes,
and document the offsets people need to apply. Public write-up, corrected by
your team before it goes out.

Interested?
```

---

## AgileX

Subject: `agilex arm in sim`

```
Hey,

AgileX arms are increasingly common in research setups and the sim configs
people pass around are inconsistent.

Borrow a workstation and I'll build a verified Isaac Sim setup for one of
your arms: accurate meshes, verified joint limits, documented kinematics,
plus a pick-and-place task that works out of the box. Open write-up.

Worth doing?
```

---

## RealMan

Subject: `rm65 sim accuracy`

```
Hey,

I'd like to verify and document the RM65 sim model against the real arm,
since the published parameters and the physical unit drift in places.

With a workstation on loan I can check FK, joint limits, and TCP accuracy,
then write up what needs correcting so others stop rediscovering it.

Interested?
```

---

## Elephant Robotics

Subject: `mycobot sim notes`

```
Hey,

myCobot is everywhere in education and the sim setup docs are thin, so
people lose hours to avoidable friction.

I'd use a borrowed workstation to write a verified Isaac Sim setup for one
of your arms: correct frames, working collision geometry, joint limit
checks, and a documented task that runs without manual fixes.

Open write-up. Interested?
```

---

## Simulation tooling vendors

Subject: `validation writeup`

Applies to: Any Isaac Sim plugin, robot description tool, or URDF authoring
tool with a docs team small enough to read email.

```
Hey,

I noticed your tool gets recommended a lot in forums, usually alongside
questions about whether a given model is actually accurate.

I'd like to write an independent validation piece: what the tool gets right,
what it gets wrong on real hardware, and the workflow that produces correct
results. Corrected by your team before publication.

I have hardware access problems and would value a loaner for the work.
Interested?
```