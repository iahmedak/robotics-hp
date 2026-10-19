# VIC — Upgrade Roadmap & Bot Recommendations

Audited against Discord's official documentation, October 2026.

---

## What was blocking you (and is now fixed)

**Onboarding could not be enabled at all.** Discord's own requirement
([Community Onboarding FAQ](https://support.discord.com/hc/en-us/articles/11074987197975-Community-Onboarding-FAQ)):
you need **≥7 Default Channels**, and **≥5 of them readable *and writable* by
`@everyone`**.

The server had 4 readable and **0 writable**. Both gates failed.

**Now:** 13 public sendable channels. Onboarding is eligible.

### Manual step — enable Community Mode first
Onboarding cannot be switched on without it, and Rules Screening depends on it.

`Server Settings → Enable Community → Enable`

Do this before anything else in the checklist. It is irreversible (you cannot
un-enable Community later without losing Community features).

---

## Manual steps a bot cannot do

Three things are client-side only. Everything else in this doc is automated.

| # | Step | Where |
|---|---|---|
| 1 | **Enable Community Mode** | Server Settings → Enable Community |
| 2 | **Rules Screening** — max 16 rules | Server Settings → Safety Setup |
| 3 | **Community Onboarding** — pick 7+ default channels, write the questions | Server Settings → Onboarding |

### Suggested onboarding questions

Discord's guidance ([Onboarding Examples](https://support.discord.com/hc/en-us/articles/10394859532823-Community-Onboarding-Examples)):
max ~6 answers per question, keep answers short, don't put rules in questions.

**Q1 — "What are you here to build?"** *(required, assigns channels)*
- Robotics & hardware → `#hardware-lab` + 🤖 Robotics/ROS, ⚙️ Electronics
- Software & AI → `#code-review` + 🐍 Python, 🧠 AI/ML, 🌐 Web Dev
- Events & outreach → `#events` + 📣 Announcements, 🎓 Workshops
- Operations → `#opportunities` + 💼 Opportunities

**Q2 — "Which skills do you want visible on your profile?"** *(multi-select)*
Assigns the 7 skill roles created in phase 2.

**Q3 — "What should we ping you about?"** *(multi-select)*
Assigns 📣 Announcements, 🎓 Workshops, 🏆 Competitions, 💼 Opportunities.

**Q4 — "Your pronouns?"** *(optional)*
Assigns 🧑‍💻 / 👩‍💻 / 🧑‍🎨.

> Division is deliberately **not** a question — it is assigned by the bot on
> approval from your VIC application. Don't let people self-select it.

---

## Bots worth adding

Ranked by value for a student robotics community. All free tiers listed are as
of August 2026 per vendor docs.

### 1. Carl-bot or Vetox — role picker *(strongly recommended)*
The self-service role picker. Discord's native Onboarding handles the join flow,
but many communities want a permanent, always-visible `#get-roles` panel.

| Bot | Free reaction roles | Notes |
|---|---|---|
| **Carl-bot** | Unlimited, via Tagscript | Most flexible. Scriptable. |
| **Vetox** | Unlimited panels, 20–25 per panel | Reactions + buttons + dropdowns, exclusive groups |
| **Zira** | 100 per server (all types combined) | DM on role change is premium |
| **Dyno** | **3** | Effectively unusable as a picker |
| **Arcane** | 10 | Workable for a small picker, short for regions+skills |

**Recommendation:** **Carl-bot**. Unlimited and scriptable, and it can
self-grant roles from Tagscript if you ever want it to.

### 2. Wick or Zeppelin — moderation *(recommended)*
Handles warns, mutes, modmail, and server backups.

- **Wick** — free, simple, good warn/mute system
- **Zeppelin** — free, deeper permission logic
- **Clyde** — free modmail + tickets

You already have Discord's built-in AutoMod under Safety Setup — enable that
first. It covers keyword blocks and link spam natively, free.

### 3. Ticket tool — support
Only worth it once you exceed ~200 members. Until then `#help-desk` as a
**Forum channel** does the same job natively: one thread per question,
auto-solved/locked, tags for filtering. **Skip the bot for now.**

### 4. GitHub — *(only if you merge code publicly)*
Posts commits and PRs to a dev channel. Worth it only if `#project-rooms` becomes
an active code space. Free.

### What to avoid
- **Level/XP bots** — rewards posting volume, which is exactly the wrong
  incentive for a community that should reward shipping projects.
- **Music bots** — voice channel clutter.
- **Anything asking for Administrator.** Grant per-channel, per-permission.

---

## What was added in this pass

**15 picker roles**
```
Notifications   📣 Announcements  🎓 Workshops  🏆 Competitions
                💼 Opportunities  🔔 All Events
Skills          🧠 AI/ML  🤖 Robotics/ROS  ⚡ Embedded C/C++
                🐍 Python  🌐 Web Dev  📐 CAD/3D  ⚙️ Electronics
Pronouns        🧑‍💻 He/Him  👩‍💻 She/Her  🧑‍🎨 They/Them
```

**3 new categories, 15 new channels**
```
Help       [FORUM] #help-desk  [FORUM] #code-help  [FORUM] #hardware-help
Showcase   [FORUM] #project-showcase  #build-logs  #media
Events     #workshops  #competition-war-room
Community  [FORUM] #suggestions  [FORUM] #opportunities-forum
           [FORUM] #looking-for-team
Start Here #server-info  #faq  #rules-screening-help
```

Forum channels were chosen over text channels for help and showcase because they
give per-thread organisation, tags, and auto-archiving — natively, no bot.

**Not created:** `#demo-stage`. Discord rejected it with `50024` — stage
channels need a higher boost tier or Community features enabled. Once you enable
Community Mode, create it manually under the Events category. Suggested perms:
members get View + Connect but **not Speak**; staff get Speak.

---

## Security notes

**Fixed during this pass:** the phase-2 channels inherited a public allow
profile and were briefly readable by `@everyone`. Caught by verification and
patched with raw REST calls. All 38 channels now verified correct against
Discord's API — 13 public, 25 member-only.

**Still outstanding:**
1. **Rotate the bot token** — it was pasted in chat.
2. **Run `sql/001_hardening.sql`** — your anon key is public in the JS bundle.
   Without RLS lockdown anyone can read `applications` and self-approve by
   setting their own row to `status='APPROVED'`.
3. **Drop the bot from Administrator** to least privilege once provisioning is
   final: `Manage Roles`, `Manage Channels`, `View Channel`, `Send Messages`,
   `Embed Links`, `Read Message History`, `Read Message Content`.

---

## Suggested rules text for Rules Screening

Max 16 rules. Keep them short and behavioural.

1. Be respectful. No harassment, slurs, or personal attacks.
2. No spam, self-promotion, or unsolicited DMs.
3. Keep it technical and on-topic in divisional channels.
4. No sharing of other members' personal information.
5. Ask before posting someone's photo, name, or work.
6. No NSFW content.
7. No piracy, cracked software, or cheating.
8. Don't argue with moderators. Take it to DMs.
9. Use the help forums instead of DMing mentors for debugging.
10. Credit collaborators and mentors when you share work.