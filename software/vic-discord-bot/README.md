# VIC Discord Bot

Verification and role-assignment bot for the **VoltEdge Innovation Community**
(Team 007, Bhatkal).

Turns a pending application into an approved, role-granted, DM'd member.

---

## Status

| Component | State |
|---|---|
| Bot application `vic-t1` | created, id `1559666838768459776` |
| In server **VIC** | yes — guild `1559667956877893713` |
| Bot permissions | Administrator (role `vic-t1`) |
| Dependencies installed | yes (34 packages) |
| Syntax check (7 files) | pass |
| Logic tests | 8/8 pass |
| Server provisioned | **not yet** — run `npm run provision` |
| Supabase linked | **not yet** — needs service-role key |

---

## Quick start

```powershell
npm install
Copy-Item .env.example .env     # then fill in values
npm run healthcheck             # proves token works
npm run provision               # builds the whole server
npm start                       # runs the bot
```

---

## What `npm run provision` creates

**Roles** — Founder, Admin, Moderator, Mentor, Member, Applicant, VIC Bot,
plus one per division (ERS, CIS, EWO, OAD).

**Categories & channels**

```
Start Here     #welcome  #rules  #how-to-join
               #member-verification  #introductions
Divisions      #ers  #cis  #ewo  #oad
Build          #project-rooms  #code-review  #hardware-lab
Community      #general  #events  #opportunities  #memes
Staff          #applications-review  #mod-log  #staff-chat
```

**Permission model** — gated. `@everyone` sees only Start Here. Members get
divisional channels. Only Moderator/Admin/Founder see Staff. Applicants can read
`#member-verification` while waiting.

Provision is idempotent: re-running reuses anything that already exists by name,
so it never duplicates.

---

## The approval flow

1. Applicant submits on https://vic-official.pages.dev/ → Supabase row with
   `status = 'PENDING'`
2. Within `POLL_INTERVAL_MINUTES`, the bot posts a card to
   `#applications-review` (staff-only) with the VIC ID, name, Discord handle,
   division, skills, interests
3. Moderator clicks **Approve** or **Reject**
4. **Approve** → grants `✅ Member` + the correct division role, strips
   `⏳ Applicant`, marks the row `APPROVED`, DMs the applicant their name,
   VIC ID and division, logs to `#mod-log`
5. **Reject** → marks `REJECTED`, DMs the reason, logs to `#mod-log`, no public
   mention

Guards: only staff can click. 5 actions per 5 minutes per user. Double-approving
an already-decided application is refused.

---

## Configuration

All secrets live in `.env` (git-ignored). See `.env.example` for the full list.

| Variable | Required | Notes |
|---|---|---|
| `DISCORD_TOKEN` | yes | bot token |
| `DISCORD_CLIENT_ID` | yes | application id |
| `DISCORD_GUILD_ID` | yes | target server |
| `SUPABASE_URL` | for automation | project url |
| `SUPABASE_SERVICE_ROLE_KEY` | for automation | bypasses RLS — server-side only |

Without Supabase vars the bot still runs in Discord-only mode; it just won't
auto-post applications.

---

## Security

- **Never commit `.env`.** It is git-ignored.
- **Never paste the token or service key into chat.** Rotate the bot token if
  it is ever exposed: Developer Portal → your app → Bot → Reset Token.
- **Run the RLS hardening SQL before going live.** See
  `sql/001_hardening.sql`. The site's anon key ships in the public JS bundle;
  without RLS lockdown, anyone can read every applicant's data and self-approve.
- **Least privilege.** The bot currently has Administrator, which is correct for
  one-time provisioning. After provisioning, narrow it to
  `Manage Roles`, `Manage Channels`, `View Channel`, `Send Messages`,
  `Embed Links`, `Read Message History`, `Read Message Content`.

---

## Troubleshooting

**Bot shows "0 permissions"** — misleading field on the REST guild object.
Check the bot's own role instead (`npm run healthcheck`).

**Cards don't post** — verify `#applications-review` exists and Supabase
credentials are set. Check startup logs for `⚠️`.

**Bot can't grant a role** — Discord refuses role assignment above the bot's
own highest role. Raise `vic-t1` in Server Settings → Roles.

**"An invalid token was provided"** — the token is wrong or was reset. Confirm
with `npm run healthcheck`.