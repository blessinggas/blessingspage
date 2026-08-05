Run Blessing's friendship inbox — read her Messages, fill the inbox, send what she approved.

Needs iMCP connected (Messages, Contacts) — see life-os/MCP-SETUP.md.

PART 1 — Refill the inbox (suggestions):
1. Via iMCP, scan recent Messages + Contacts + Calendar for:
   - Threads she left on read / said she'd reply to ("I'll let you know", a question to her).
   - People she's gone quiet with (no exchange in a while) who matter.
   - Upcoming birthdays / plans.
2. For each, write a warm, natural draft **in her voice** (warm, funny, a bit of sparkle — not formal). Keep it short and real.
3. Write them into life-os/dashboard-state.json → `__life.friends.actions` as
   `{person, kind:'reply'|'reachout', why, draft, status:'suggested'}` (don't
   duplicate ones already there). Add birthdays/plans to `friends.upcoming`.
   She reviews them in the app's Friendships inbox and approves.

PART 2 — Send the approved ones:
4. For every action with `status:'approved'`, send the `draft` to that person via
   iMessage (iMCP / Messages), then set `status:'sent'` and append
   `{date, person, draft}` to `friends.log`.
5. Tell her plainly what you sent and to whom. Never send anything not marked
   'approved' — she green-lights every message.

Tone: this lane is about keeping the people she loves close. Warm, low-pressure,
human. Never robotic, never spammy.
