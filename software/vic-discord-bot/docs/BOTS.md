# VIC — The Two Bots

One bot, two modules. Not two bots, deliberately: the verification flow needs a
Supabase `service_role` key that bypasses RLS, and that is the highest-value
credential in this system. Keeping it in the same process as a surface that
reads untrusted user messages would widen its blast radius for no benefit at
this scale. One token, one process, one permission surface — simpler to audit and
one fewer secret to rotate.

If you later want them split, `verification.js` and `moderation.js` are already
independent modules. Moving either to its own process is a config change.

---

## 1. Verification bot (`vic-t1`)

**Status: built, wired, booted against the live server — but not yet end-to-end,
because the Supabase service-role key is still a placeholder.**

### Flow
1. Applicant submits on vic-official.pages.dev → row with `status='PENDING'`
2. Bot polls every `POLL_INTERVAL_MINUTES`, posts a card to `#applications-review`
3. Moderator clicks ✅ or ❌ (or runs `/approve vic_id:APP-2026-000123`)
4. **Approve** → grants `✅ Member` + the division role, strips `⏳ Applicant`,
   flips the row to `APPROVED`, DMs the applicant their **name, VIC ID and
   division**, logs to `#mod-log`
5. **Reject** → flips to `REJECTED`, DMs the reason, logs to `#mod-log`,
   no public mention

### Guards
- Staff-only — everyone else gets an ephemeral refusal
- 5 decisions per 5 minutes per moderator
- Double-deciding an already-decided application is refused
- Cannot approve someone who hasn't joined the server yet

### To finish it
Add your real key to `.env`:
```
SUPABASE_SERVICE_ROLE_KEY=<the service_role key>
```
Supabase → Project Settings → API → `service_role`.

**Run `sql/001_hardening.sql` first.** Without it the key reads a table anyone
can also read, and anyone can set their own row to `status='APPROVED'`.

---

## 2. Moderation module

**Status: built, unit-tested (11/11), and verified against the live server.**

### Commands (all ephemeral replies; moderation ones staff-only, all logged)
| Command | Who | Does |
|---|---|---|
| `/warn user reason` | staff | Records a warning, DMs the member, logs it |
| `/warnings user` | staff | Shows warning history, marks active vs resolved |
| `/timeout user 2h reason` | staff | Times a member out (capped at 28 days) |
| `/paniclock on\|off` | staff | Locks the whole server read-only, or reopens |
| `/approve vic_id` | staff | Approve an applicant without the button |
| `/membercount` | everyone | Live census: total, humans/bots, verified, applicants, divisions, staff |
| `/activerank` | everyone | Message leaderboard, 7d / 30d / all time. Staff channels excluded |

### Automatic behaviour
- **Audit logging** — joins, leaves, deleted messages, edited messages, role
  create/delete, channel create/delete, bans. All to `#mod-log`.
- **Content filters** — deletes and DMs the author for: Discord invite links,
  `@everyone`/`@here` mass mentions, and any word in `BANNED_WORDS`.
  Staff bypass. Add words like:
  ```
  BANNED_WORDS=spamword,badterm
  ```
- **Raid guard** — 5+ joins inside 10 seconds trips an alert and auto-locks the
  server. Reversible with `/paniclock off`.
- **Panic lock** — flips every text channel to read-only for `@everyone`.
  Staff channels stay writable so moderators can still work.

### Warnings persist
Stored in `.data/warnings.json`, so a restart does not erase a record.
Add `.data/` to `.gitignore` — it holds user identifiers.

---

## 3. Welcomer

**Status: built, unit-tested (10/10), attached on boot.**

Fires on every member join:

- **Public greeting in `#welcome`** — tags the member, three verification steps, divisions, mentor-role pointer
- **DM with the verification path** — apply → wait → approval unlocks everything + VIC ID. Warns that the form username must match the account

Skipped for bots, rapid re-joins (24h dedupe), and while panic-locked. Fails safe: if `#welcome` is missing it just DMs; if DMs are closed the public greeting still lands.

No named mentors anywhere — covered by tests.

---

## Security findings from this audit

### Carl-bot is far more powerful than it needs to be

It is already in your server. Its role holds **29 permissions**, including:

```
ManageGuild  ManageRoles  ManageChannels  ManageWebhooks
KickMembers  BanMembers  ManageMessages  ModerateMembers  ManageGuildExpressions
```

`ManageGuild` is effectively owner-level — it can change the server name,
ownership, verification level and region. A compromised Carl-bot token means a
compromised server.

**Recommended:** strip Carl-bot down to only what it needs for reaction roles
and Tagscript — typically `ViewChannel`, `SendMessages`, `EmbedLinks`,
`ManageRoles`, `UseApplicationCommands`, `ReadMessageHistory`. Everything above
that is a liability for a bot whose only job is handing out roles.

### @everyone is powerful at guild level

Your `@everyone` role has `MentionEveryone`, `CreateInstantInvite`,
`CreatePublicThreads`, `Stream` and voice permissions. That is Discord's
default, but on a gated community it means any member can mass-mention. The
content filter catches `@everyone` in messages; consider also removing
`MentionEveryone` from `@everyone` at Server Settings → Roles.

### Rotate the bot token
It was pasted into chat. Developer Portal → `vic-t1` → Bot → Reset Token, then
update `.env`.

---

## Running it

```powershell
cd C:\Users\ahmed\openwork-a\vic-discord-bot
npm start
```

For continuous operation — `npm start` dies when the terminal closes:

```powershell
npm install -g pm2
pm2 start src/index.js --name vic-bot
pm2 save
```

Set `BANNED_WORDS` in `.env` before starting. It is optional.

---

## Still needed from you

1. **Supabase service-role key** → `.env` (blocks the verification flow)
2. **Run `sql/001_hardening.sql`** (security — highest priority)
3. **Enable Community Mode** → then Onboarding (3 manual steps, listed in
   `UPGRADE-ROADMAP.md`)
4. **Rotate the bot token**
5. **Reduce Carl-bot's permissions**