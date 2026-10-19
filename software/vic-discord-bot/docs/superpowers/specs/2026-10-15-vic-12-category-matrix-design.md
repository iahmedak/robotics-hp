# VIC Discord — 13-Category Role & Channel Matrix

- **Date:** 2026-10-15
- **Guild:** VIC (`1559667956877893713`)
- **Bot:** VIC-BOT (`1559666838768459776`)
- **Status:** Design approved in chat. Awaiting written-spec review.

## 1. Goal

Rebuild the VIC Discord server onto a 13-category, 16-role governance matrix that
matches — and exceeds — the co-founder's reference matrix on detail, while
keeping every working capability the bot already has (verified access ladder,
15 slash commands, live application/ticket approval flow).

Exceeding means: every permission claim is enforced against Discord's API and
verified programmatically, not asserted in a document.

### Non-goals

- Deleting the 19 profile/tag roles (`🐍 Python`, `⚡ Embedded C/C++`, pronouns, …).
- Enabling Community Mode, Rules Screening, or Onboarding.
- Building the Supabase portal. The Discord-native approval path stays primary — but note that the Charter (Art. II) makes a Central Administration System mandatory, so this is deferred, not cancelled. See §11.
- Reducing privilege on the bot's Administrator role. Deferred until provisioning completes.

## 2. What exists today

Measured against the live guild on 2026-10-15:

| | Current | Target |
|---|---|---|
| Total channels | 76 | ~90 |
| Categories | 15 | 13 |
| Text channels | 52 | ~59 |
| Forum channels | 7 | 5 |
| Voice channels | 2 | 8 |
| Governance roles | 11 | 16 |
| Profile/tag roles | 19 (untouched) | 19 |
| Managed/legacy roles | 2 (`vic-t1`, `carl-bot`) | 2 |
| Slash commands | 15 | 18 |
| Verified permission checks | 52 | full matrix |

Current governance ladder, top to bottom:

```
28 vic-t1 (managed)      22 ✅ Member
27 ⚡ Founder             21 ⏳ Applicant
26 🛡️ Admin              20 ⚙️ ERS
25 🧭 Moderator          19 💻 CIS
24 🤖 VIC Bot            18 📣 EWO
23 🎓 Mentor             17 🛠️ OAD
```

### 2.1 Role-management constraint

`vic-t1` (28), `⚡ Founder` (27), `🛡️ Admin` (26), and `🧭 Moderator` (25) all
sit **above** `🤖 VIC Bot` (24). Discord refuses role edits on any role above
the actor's own highest role, so the bot cannot move, rename, or reorder those
four — no matter what.

The design therefore never asks the bot to touch them. The five new roles are
created at the bottom and inserted **above** `🤖 VIC Bot`; Discord renumbers
everything above on insert. Net effect:

```
33 vic-t1 (managed)
32 ⚡ Founder
31 🛡️ Admin
30 🧭 Moderator
29 🤖 VIC Bot
28 🎖️ Executive Director       NEW — Omer Ruknuddin (pending invite)
27 ⚙️ Director of Operations   NEW — Abdullah Saami (+ OOA division)
26 💻 CIS Director            NEW — Ahmed Irfan
25 📋 ERS Director            NEW — Mohammad Zaid (pending invite)
24 📣 EWO Director            NEW — Shamveel Bukhari (pending invite)
23 🎓 Mentor
22 ✅ Member
21 ⏳ Applicant
20 ⚙️ ERS        19 💻 CIS        18 📣 EWO        17 📋 OOA (Ops & Admin)
```

**The officers sit below `🤖 VIC Bot`, not above it.** This is a platform
constraint discovered on 2026-10-15, not a preference. A bot cannot insert a
role above its own highest role: doing it requires renumbering the roles
already above it — `vic-t1`, `⚡ Founder`, `🛡️ Admin`, `🧭 Moderator` — and
Discord refuses any payload that moves those (*`Missing Permissions`*). A
sparse patch is worse: Discord derives position from array index, so sending
only the new roles scatters them into the member tier.

Keeping the officers under the bot is also the only arrangement that is
functionally safe: the bot must outrank every role it grants, or
`/set-divisions` fails at runtime with a permission error no test catches.
Since every Director role carries full channel access anyway (§3.1.2), nothing
user-visible depends on their ordering relative to the bot.

See §2.1 and §3.1.2 for the guild owner, who sits above all of this without
being a role at all.

## 3. Governance roles

### 3.1 New roles (5)

Charter-mandated officers plus one Board-established role. Assignments come
from the founding members on 2026-10-15.

| Role | Charter basis | Assigned to | In server? |
|---|---|---|---|
| `🎖️ Executive Director` | Art. V — "any other role established by the Board" | Omer Ruknuddin (VIC-FND-02) | **no** |
| `⚙️ Director of Operations` | Art. I + Art. V + Art. VI (4) | Abdullah Saami (VIC-FND-01) | yes — `saamisada` |
| `📋 ERS Director` | Art. VI (1) | Mohammad Zaid (VIC-FND-03) | **no** |
| `💻 CIS Director` | Art. VI (2) | Ahmed Irfan (VIC-FND-05) | yes — `iahmedak` |
| `📣 EWO Director` | Art. VI (3) | Shamveel Bukhari (VIC-FND-04) | **no** |

**`📋 OOA Director` is not created.** The founding members decided that
Operations Director and OOA Division lead are the same function and combine
into one role. `⚙️ Director of Operations` therefore carries both: it gates
category 05 *and* grants the OOA division channels in category 09.

This is a deliberate divergence from Saami's server rules §3.4 (*"There is NO
Logistics Director, NO OOA Director"*), which matches, and from the co-founder's
Discord matrix, which also omits it. Charter Art. VI (4) requires the
Operations and Administration Division to be led; merging satisfies that
without a second role. See §11 for the amendment this implies.

`🎖️ Executive Director` is **not** a named charter office. Art. V lists Director
of Operations, Division Directors, and Project Coordinators, then permits
"any other role established by the Board." A Board-established Executive
Director is therefore legitimate, and it is the founders' own choice — but it
is not written into Article V and must not be described as though it were.

### 3.1.0 Owner

`iahmedak` (Ahmed Irfan, VIC-FND-05) is the **Discord server owner** — guild
owner id `751643959884775494`, confirmed against the API. The founding members
decided on 2026-10-15 that ultimate authority over roles, channels,
permissions, divisions, and membership rests with the server owner.

Discord guild ownership is **not transferable by a bot**. Only the owner may
transfer it through the server settings. No role is created for it; ownership is
intrinsic to the account. `⚡ Founder` is explicitly *not* a substitute —
see §3.1.2.

This conflicts with Charter Art. V, which makes Executive Board decisions final
overturnable only by a two-thirds majority of founding members, and gives the
Director of Operations a casting vote. The Charter has no Owner and no
single-holder override. **This requires a Charter amendment** — see §11.

### 3.1.1 Founder is a permission role

Saami's server rules §4.1 state that *"Founder is an informational TAG, not a
permission role. It grants zero access, zero admin power."* **Rejected.**

The founding members decided on 2026-10-15 that `⚡ Founder` grants access to
**all channels** but carries **no ultimate power** — that sits with the server
owner alone.

Saami's §3.5 (*"Director title does NOT grant automatic access to all
channels"*) is **also rejected.** Director roles grant full channel access;
they simply do not outrank the owner.

Net effect: `⚡ Founder`, all four Director roles, and `🛡️ Admin` can read and
write everywhere. Only the server owner holds permissions that cannot be
overridden by any role, and only the owner can alter ownership itself.

### 3.1.2 Unassignable roles

Three of the five new roles belong to people who are **not in the Discord
guild**. Discord cannot assign a role to a non-member. The roles are created
and fully permissioned; the assignment is deferred until the holder joins and
is claimed. `verify-tiers.js` reports these as `pending-invite`, not as
failures.

Missing from the guild entirely: Omer Ruknuddin, Mohammad Zaid, Shamveel
Bukhari, and Mohiddin Ahmed (VIC-FND-06, no office held). Mohiddin is a
founding member bound by the Charter with no role and no Discord presence —
worth raising at the next Board meeting.

Founding members are bound by a constitutional instrument. Three of the six
cannot currently reach the server that implements it.

### 3.2 Target hierarchy

See §2.1 for the measured ladder and why the five new roles are inserted above
`🤖 VIC Bot` rather than by reordering existing roles.

Division member roles sit **below** `✅ Member` deliberately. `✅ Member` is the
gate to the community layer; division roles only add the division category on
top. This makes the stacking rule expressible as a single hierarchy check.

### 3.3 Division rename

`🛠️ OAD` → `📋 OOA (Ops & Admin)`.

The division **id** stays `VIC-DIV-004`. The id is the contract shared with
`https://vic-official.pages.dev/`, the application form, and
`config.roles.divisions`. Only the display name changes, so no application data
becomes orphaned.

### 3.4 Profile/tag roles — unchanged

Positions 1–12 hold interest tags and pronouns. These are self-assigned in
`#introductions` and are **not** part of the governance matrix. No permission
in this spec references them.

## 4. Categories

Thirteen categories, ordered so a newcomer's eye travels: who we are → how to
join → what the rules are → the community → governance → the work → support.

| # | Category | Gate | Purpose |
|---|---|---|---|
| 01 | `🚪 START HERE` | `@everyone` | **Applicants only.** Pre-membership. |
| 02 | `🌍 PUBLIC COMMUNITY` | `@everyone` | Open to everyone, including non-applicants |
| 03 | `📄 INFORMATION` | `✅ Member` | Everything a member needs to know |
| 04 | `💬 COMMUNITY` | `✅ Member` | Conversation |
| 05 | `🏛️ EXECUTIVE BOARD` | `🎖️ Executive Director` | Governance |
| 06 | `⚙️ OPERATIONS & ADMINISTRATION` | `⚙️ Director of Operations` | Operations |
| 07 | `📋 ERS — Electronics & Robotics` | `⚙️ ERS` | Division |
| 08 | `💻 CIS — Computing & Intelligent Sciences` | `💻 CIS` | Division |
| 09 | `📣 EWO — Events, Workshops & Outreach` | `📣 EWO` | Division |
| 10 | `📋 OOA (Ops & Admin)` | `⚙️ Director of Operations` | Division |
| 11 | `🤝 PROJECTS & COLLABORATION` | `✅ Member` | Work |
| 12 | `🔊 MEETINGS & LIVE COLLABORATION` | `✅ Member` | Voice |
| 13 | `🗂️ BOT & MODERATION LOGS` | staff (`view-only` for Exec) | Audit |

### 4.0 START HERE vs INFORMATION

The founding members split these on 2026-10-15:

**01 START HERE is applicant-only.** It exists to get someone from *"who is
this?"* to *"I have applied."* It carries the welcome, how membership works,
where to apply, and what VIC is. Once a member is approved they have no further
reason to read it.

**03 INFORMATION is the member reference.** It carries the binding rules, the
official record of announcements, and the resources a working member needs. It
is where the §1–12 ruleset lives, and where a member looks up policy rather
than scrolling conversation.

This changes the category count from 12 to 13. `💬 COMMUNITY-WIDE` splits into
`📄 INFORMATION` (reference material — rules, announcements, resources, FAQ)
and `💬 COMMUNITY` (conversation — general, introductions, opportunities,
events, off-talks, memes, polls).

Both audiences read the same ruleset — see §4.0.1 for why there is one copy and
not two.

Discord does not support subcategories. The four divisions are therefore
top-level siblings placed consecutively (07–10), which reads as a block
without a container. An earlier attempt to nest them under a `🧭 Divisions`
parent failed with `CHANNEL_PARENT_INVALID_PARENT` and is not retried.

### 4.1 Channel inventory

**01 START HERE — applicants only** — `@everyone`

| Channel | Access | Purpose |
|---|---|---|
| `#welcome` | view | who VIC is |
| `#server-info` | view | what VIC is, where, founding date |
| `#membership-information` | view | how to become a member |
| `#verification-help` | view + chat | **apply here** |
| `#rules-and-regulations` | view | **canonical §1–12 ruleset** |

**02 PUBLIC COMMUNITY** — `@everyone`

| Channel | Access |
|---|---|
| `#public-general` | view + chat |
| `#open-source-public` | view + chat |
| `#public-announcements` | view |

**03 INFORMATION — the member reference** — `✅ Member`

| Channel | Access | Purpose |
|---|---|---|
| `#policy-updates` | view + chat | change log — rules §12.3 lives here |
| `#announcements` | view (`🎓 Mentor`+ and Director roles post) | official record |
| `#community-updates` | view + chat | what VIC has been doing |
| `#resources-and-files` | view + chat + upload | reference material |
| `#faq` | view + chat | common questions |

### 4.0.1 Where the ruleset lives

The founding members decided on 2026-10-15 that the §1–12 ruleset must be
readable by **both applicants and members**.

A Discord channel belongs to exactly one category. So rather than seed two
copies — which would drift the first time either was edited — the ruleset gets
one canonical home:

> **`#rules-and-regulations` lives in `01 🚪 START HERE`.**

Category 01 is `@everyone`-readable, so a prospective member reads the full
rules **before** applying and a member reads the same channel **after**. Both
audiences, one source of truth. This also satisfies rules §12.3 (*"Check … for
changes"*) because an applicant can always see what they agreed to.

Category 03 then carries `#policy-updates`, a member-facing change log that
records every amendment to §1–12 with date and author. The log is how members
learn the rules changed; the rules channel is where the current text lives.

**If the founders would rather have a literal second copy** of the ruleset in
category 03, that is a one-line change to `phase5.js` plus a note that both
copies must be edited together. It is not recommended — two copies of a
binding document is a correctness risk, not a feature.

**04 COMMUNITY — conversation** — `✅ Member`

| Channel | Access |
|---|---|
| `#general-discussion` | view + chat |
| `#introductions` | view + chat (post your `VIC-MEM-NNN`) |
| `#opportunities` | view + chat |
| `#events` | view + chat |
| `#off-talks` | view + chat |
| `#memes` | view + chat |
| `#polls-and-feedback` | view + chat + vote |

**05 EXECUTIVE BOARD** — `🎖️ Executive Director` + the Director of Operations and
all Division Directors

`#executive-board` · `#leadership-coordination` · `#executive-decisions` ·
`#meeting-agendas-and-minutes` · 🔊 `Executive Meeting`

**06 OPERATIONS & ADMINISTRATION** — `⚙️ Director of Operations`

`#operations-control` · `#membership-registry` · `#membership-approvals` ·
`#member-role-assignments` · `#administrative-records` ·
`#internal-documentation` · `#operations-meetings` · `#bot-commands`

`#mod-log` is **not** here — it lives in category 13. A channel has exactly one
parent; an earlier draft of this section listed it in both 06 and 13, which the
layout test (`test/layout.test.js`) caught.

**07–10 DIVISIONS** — one division role each, except 10

Per division `X` ∈ {ERS, CIS, EWO}, gated by `X`:

| Channel | Access |
|---|---|
| `#x` | view + chat |
| `#x-announcements` | view (`<X> Director` posts) |
| `#x-discussion` | view + chat |
| `#x-documentation` | view + chat + upload |
| `#x-projects` | view + chat |
| 🔊 `<X> Team Meeting` | connect + speak |

**10 OOA** is gated by `⚙️ Director of Operations` rather than a separate
`📋 OOA Director`, per §3.1. It uses the same five-channel shape: `#ooa`,
`#ooa-announcements`, `#ooa-discussion`, `#ooa-documentation`, `#ooa-projects`,
and 🔊 `OOA Team Meeting`.

**11 PROJECTS & COLLABORATION** — `✅ Member`

`#project-proposals` · `#looking-for-team` · `#active-projects` ·
`#cross-division-collaboration` · `#project-showcase` · `#code-review` ·
`#hardware-lab` · `#build-logs` · `#media`

**12 MEETINGS & LIVE COLLABORATION** — `✅ Member`

🔊 `VIC General Meeting` · 🔊 `Project Room 1` · 🔊 `Project Room 2`

**13 BOT & MODERATION LOGS** — staff

| Channel | Access |
|---|---|
| `#mod-log` | view + chat (`⚙️ Director of Operations`, staff) |
| `#audit-log` | view — `🎖️ Executive Director` included |

`🎖️ Executive Director` receives **view without send** on both. Read access
without write is the deliberate separation between strategy and operations:
leadership sees what happened, operations owns the record.

## 5. Migration map

### 5.1 Category moves (15 → 13)

| Current | Becomes |
|---|---|
| `🚪 Start Here` | `01 🚪 START HERE` — applicant-only, `#server-info` joins it |
| `🌍 Public Community` | `02 🌍 PUBLIC COMMUNITY` |
| `📢 Information` | **`03 📄 INFORMATION` — restored, becomes the member reference** |
| `💬 Community` | `04 💬 COMMUNITY` |
| *(new)* | `05 🏛️ EXECUTIVE BOARD` |
| *(new)* | `06 ⚙️ OPERATIONS & ADMINISTRATION` |
| `⚙️ ERS — Electronics & Robotics` | `07 📋 ERS — Electronics & Robotics` |
| `💻 CIS — Computing & Intelligent Sciences` | `08 💻 CIS — Computing & Intelligent Sciences` |
| `📣 EWO — Events, Workshops & Outreach` | `09 📣 EWO — Events, Workshops & Outreach` |
| `🛠️ OAD — Operations & Administration` | `10 📋 OOA (Ops & Admin)` |
| `🤝 Collaboration` + `🔨 Build & Showcase` | `11 🤝 PROJECTS & COLLABORATION` |
| `❓ Help` | dissolved into 03, 08, 07 |
| `🗓️ Events` | dissolved into 04 |
| `🔊 Voice` | `12 🔊 MEETINGS & LIVE COLLABORATION` |
| `🎟️ Applications` | dissolved into 06 |
| `🛡️ Staff` | split into 06 and 13 |

`📢 Information` is **revived, not dissolved**. Its three channels
(`#announcements`, `#resources`, `#rules`) seed category 03, and `#faq`
joins them from 01.

### 5.2 Channel renames

| Current | Becomes |
|---|---|
| `#rules` | `#rules-and-regulations` (stays in 01 — §4.0.1) |
| `#how-to-join` | `#membership-information` |
| `#rules-screening-help` | `#verification-help` |
| `#general` | `#general-discussion` |
| `#off-topic` | `#off-talks` |
| `#resources` | `#resources-and-files` |
| `#project-rooms` | `#active-projects` |
| `#project-showcase` | `#showcase` |
| `#applications-review` | `#membership-approvals` |
| `#staff-chat` | `#internal-documentation` |
| `Lounge` | `VIC General Meeting` |
| `Meeting Room` | `Project Room 1` |
| `#welcome-and-rules` | **deleted** (legacy duplicate of `#welcome` + `#rules-and-regulations`) |

Division channels (4 × 6, driven by a table not 24 literals):

| Current | Becomes |
|---|---|
| `#ers` `#ers-announcements` `#ers-discussion` `#ers-documentation` `#ers-projects` | unchanged (`07 ERS`) |
| `#cis-*` | unchanged (`08 CIS`) |
| `#ewo-*` | unchanged (`09 EWO`) |
| `#oad` | `#ooa` |
| `#oad-announcements` | `#ooa-announcements` |
| `#oad-discussion` | `#ooa-discussion` |
| `#oad-documentation` | `#ooa-documentation` |
| `#oad-projects` | `#ooa-projects` |

### 5.3 Channel re-homing

| Channel | From | To |
|---|---|---|
| `#server-info` | 01 START HERE | **stays in 01** — it is applicant-facing |
| `#faq` | 01 START HERE | `03 📄 INFORMATION` — member-facing |
| `#announcements` | `📢 Information` | `03 📄 INFORMATION` |
| `#resources` → `#resources-and-files` | `📢 Information` | `03 📄 INFORMATION` |
| `#help-desk` (forum) | `❓ Help` | `04 💬 COMMUNITY` |
| `#code-help` (forum) | `❓ Help` | `08 CIS` |
| `#hardware-help` (forum) | `❓ Help` | `07 ERS` |
| `#workshops` | `🗓️ Events` | `09 EWO` |
| `#competition-war-room` | 12 Events | 10 PROJECTS |

### 5.4 New channels (21)

Text and forum (15):

| Category | Channels |
|---|---|
| 03 | `#polls-and-feedback`, `#community-updates` |
| 04 | `#executive-board`, `#leadership-coordination`, `#executive-decisions`, `#meeting-agendas-and-minutes` |
| 05 | `#operations-control`, `#membership-registry`, `#member-role-assignments`, `#administrative-records`, `#operations-meetings`, `#bot-commands` |
| 10 | `#project-proposals`, `#looking-for-team` |
| 12 | `#audit-log` |

Voice (6): `Project Room 2`, `Executive Meeting`, `ERS Team Meeting`,
`CIS Team Meeting`, `EWO Team Meeting`, `OOA Team Meeting`

The four `#x-announcements` channels already exist from the Phase 3 division
split and are **renamed**, not created — see §5.2 and §4.1.

## 6. Permission model

### 6.1 Stacking

A member holds `✅ Member` **plus** 1–4 division roles. Effective access is the
union of every role's grants. Nothing is subtractive: holding `⚙️ ERS` adds
category 07 and never removes anything from 03, 04 or 11.

Examples:

| Roles | Sees |
|---|---|
| `✅ Member` + `⚙️ ERS` | 01, 02, 03, 04, 11, 12, 07 |
| `✅ Member` + `⚙️ ERS` + `💻 CIS` | 01, 02, 03, 04, 11, 12, 07, 08 |
| `✅ Member` + all 4 divisions | 01, 02, 03, 04, 11, 12, 07, 08, 09, 10 |
| `⚙️ Director of Operations` | every category |

### 6.2 Read-only channels

Channels that are view-only to their tier:

`#welcome` · `#server-info` · `#membership-information` ·
`#public-announcements` · `#announcements` · `#x-announcements` ×4 ·
`#audit-log` · `#mod-log`

`#announcements` is writable by `🎓 Mentor` and above, plus every
`<X> Director` role — this is what makes a Director's role observable the day
it is assigned.

`#cis-announcements` is writable today by the holder of `💻 CIS Director`
(Ahmed Irfan). `#ers-announcements`, `#ewo-announcements`, and
`#ooa-announcements` are read-only until their directors join.

### 6.3 Guild-level gate

`⏳ Applicant` sees 01 and 02 only — 01 is the applicant surface. `@everyone` is denied on 03–13. A member's
role set is the single source of truth for what they see.

## 7. Bot changes

### 7.1 New commands (3)

| Command | Access | Behaviour |
|---|---|---|
| `/set-divisions <user> <ERS,CIS,EWO,OOA>` | Director of Operations | Replaces division roles without touching `✅ Member` |
| `/register <user>` | Director of Operations | Issues the permanent `VIC-MEM-NNN` ID and writes it to `#membership-registry` |

### 7.1.1 Permanent member ID

Replaces the current `APP-YYYY-XXXXXX` scheme. Rules adopted 2026-10-15,
matching Saami's server rules §2:

| Rule | Behaviour |
|---|---|
| Format | `VIC-MEM-001`, `VIC-MEM-002`, … zero-padded, sequential |
| Issued at | **approval**, not application submission |
| Never reused | the counter never decrements, even on member exit |
| Never changes | division change, director appointment, or founder-tag change leave it intact |
| Stored | `.data/members.json` plus `#membership-registry` |

Leaving a division does not delete the ID or any history (rules §10.3). The
`APP-` prefix is retired; existing application records keep their old IDs for
audit, and new approvals use `VIC-MEM-NNN`.
| `/logs <channel> <n>` | staff | Pulls recent `#mod-log` or `#audit-log` entries into the invoking channel |

### 7.2 Behaviour changes

- **Announcement posting:** the allow-list for `#announcements` and each
  `#x-announcements` gains the Director roles alongside Founder/Admin/Moderator.
- **Division changes:** `/set-divisions` preserves `✅ Member` and the permanent
  ID, matching the spec's "Division Change" rule.
- **Channel relocation:** `#mod-log` moves to 12; the moderation audit target
  updates from the old `#staff-chat` location.

### 7.3 Unchanged

The application/ticket flow, warnings, timeouts, panic lock, welcomer,
`/membercount`, `/activerank`, role commands, `/close`, `/resolvewarn`,
`/userinfo`, `/lookup`, and every deferredReply timeout fix stay as they are.

## 8. Verification

`verify-tiers.js` currently checks 52 channels against a flat ladder. It is
rewritten to assert **every cell of the matrix**:

| Probe | Assertion |
|---|---|
| `@everyone` on 01, 02 | view (chat where specified) |
| `@everyone` on 03–13 | denied |
| `✅ Member` on 03, 04, 11, 12 | view + chat |
| `✅ Member` on 05, 06, 10, 13 | denied |
| Each division role on its own category | view + chat |
| Each division role on other division categories | denied |
| `⚙️ Director of Operations` on 10 | view + chat (merged OOA gate) |
| `✅ Member` + 2 divisions | both categories visible, third denied |
| Mentor on `#announcements` | view + send |
| Division Director on own `#x-announcements` | view + send |
| `🎖️ Executive Director` on 13 | view, no send |
| `⚙️ Director of Operations` on 06, 13 | view + send |
| `⚡ Founder` on all 13 categories | view + send (**no zero-power tag**) |
| Every Director role on all 13 categories | view + send (**§3.5 rejected**) |
| Voice: each tier | connect where specified, denied elsewhere |

Target: **0 wrong cells.** Plus `npm test` (76 tests) and `doctor.js` (0 fail).

## 9. Files

| File | Change |
|---|---|
| `src/phase5.js` | **new** — the whole restructure |
| `src/config.js` | 5 new role keys; `🛠️ OAD` → `📋 OOA (Ops & Admin)` default |
| `.env` / `.env.example` | 5 new `ROLE_*` ids |
| `src/gate-tiers.js` | rewritten for 13 categories |
| `src/verify-tiers.js` | rewritten as a matrix verifier |
| `src/seed.js` | seed 21 new channels, charter-aligned copy, drop mentor names |
| `src/index.js` | register 3 new commands |
| `src/roleadmin.js` | `/set-divisions` |
| `docs/BOTS.md` | final category tree + 18 commands |
| `docs/UPGRADE-ROADMAP.md` | close the division/director gaps |

## 10. Risks and rollback

| Risk | Mitigation |
|---|---|
| Renames break shared channel links | Accepted; the server is young and links are not distributed |
| `vic-t1`, `⚡ Founder`, `🛡️ Admin`, `🧭 Moderator` sit above the bot and cannot be reordered by it | Design inserts the 5 new roles around `🤖 VIC Bot` instead of moving the existing four — see §2.1. No manual step required. |
| 3 of the 5 new roles belong to non-members | Roles are created and permissioned; assignment deferred until the holder joins. Verifier reports `pending-invite`, not failure — see §3.1.2. |
| Category move cascade loses channels | `phase5.js` is **idempotent** — resolve by name, skip if absent, print a diff, and never delete a non-empty category |
| Role position shifts break hierarchy guards | Reassign in one pass, top-down; `verify-tiers.js` re-probes afterwards |
| `gate-tiers.js` runs against stale names | Rewritten before `phase5.js` runs |
| Permission regression | Full matrix verification is a gate, not a report |

**Rollback:** Discord keeps channel history through a rename or move, and every
permission overwrite is reversible by re-running the previous permission map.
The one irreversible step is `#welcome-and-rules` deletion; it has no unique
content beyond `#welcome` + `#rules-and-regulations`.

## 11. Charter obligations outside this spec

The Founding Charter (VIC-CHARTER-2026-001) imposes three requirements this
matrix does **not** deliver. They are tracked here so they are not lost, and
each needs its own spec before implementation.

| Charter clause | Obligation | Gap | Note |
|---|---|---|---|
| Art. II | *"All digital records, member data, project archives, and community assets shall be maintained in the Central Administration System operated by the Director of Operations."* | No system of record exists | Currently `.data/*.json` on the bot host. The portal is the intended home. |
| Art. VIII | *"A member wishing to exit VIC shall submit a written notice to the Director of Operations. Upon exit, all official credentials and access shall be revoked."* | No offboarding flow | `/revokerole` removes one role. Nothing revokes all credentials and logs the exit. |
| Art. IV | Admission requires *"review by the Executive Board, and formal approval"* | `/approve` is staff-gated, not Board-gated | Approval authority should be restricted to Board officers, not every moderator. |
| Art. IV | *"No individual shall be discriminated against on the basis of gender, religion, caste, language, or socioeconomic background."* | Not reflected in `#rules-and-regulations` | Must be stated in the rules channel and the application review flow. |
| Art. I / Art. V | Charter term is **"General Member"**, not "Approved Member" | Discord uses `✅ Member` | Role name should be `✅ General Member` for fidelity. |
| Art. VII | Every project designates a **Project Lead, Team Captain, and Guide/Mentor** | No project registry | Sanctioned-project tracking is a Central Administration System feature. |
| Art. I | **Role Term** — executive roles expire and revert to General Member unless renewed | No expiry for officer roles | `/temprole` has the mechanism; officer roles have no term. |

The Charter PDF supplied on 2026-10-15 is **v1.0 and marked by the founders as
superseded**. Articles II, VI, and VIII are the ones most likely to have
changed. Confirm the current text before implementing anything in this table.

### 11.1 Charter amendments implied by this design

Three decisions in this spec cannot be reconciled with the Charter text as
supplied. Each needs an Article amendment under Art. IX (two-thirds of founding
members, seven days' notice, four signatures) before the two documents are
internally consistent.

| Decision | Charter text in tension |
|---|---|
| Server owner holds ultimate authority over roles, channels, permissions, divisions, and membership (§3.1.0) | Art. V — Executive Board decisions are final unless overturned by a two-thirds majority of founding members; Director of Operations holds a casting vote. No Owner exists. |
| `⚡ Founder` grants all-channel access (§3.1.2) | Art. V defines executive roles narrowly; Art. I defines "General Member". Nothing forbids a broad tag, but nothing grants one either. |
| Operations Director and OOA Division lead merged into one role (§3.1) | Art. VI (4) — "Operations and Administration Division, focused on records management, logistics, and institutional governance." The Division must be led; the merging role leads it, but no separate Division Director is named. |
| General Member → approval by Executive Board only | Art. IV allows "review by the Executive Board, and formal approval". Current `/approve` is staff-gated. |

Also noted: the supplied PDF carries **no signatures**. All six signature
blocks, both witness blocks, and all dates are blank, while the footer states
the document is *"legally binding upon all signatories."*

## 12. Out of scope

Community Mode, Rules Screening, Onboarding, `#demo-stage`, Supabase RLS
hardening, bot least-privilege reduction, and `/purge`, `/slowmode`, `/nick`.

Deleting and re-seeding existing bot-authored channel messages is also out of
scope for this spec.