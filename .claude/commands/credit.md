Auto-update Blessing's credit score from her inbox — no manual typing.

There is no consumer credit-score API, but the bureaus email her every update, so
read it from Gmail instead:

1. Via the Gmail connector, find the most recent score email, e.g.:
   `from:clearscore (score OR "credit score") newer_than:45d`
   `from:creditkarma newer_than:45d`  ·  `from:experian newer_than:45d`
2. Read the **current score** and the change it states (and provider).
3. Update `life-os/dashboard-state.json` → `__fin.credit`:
   - set `score`, `provider` (Experian 999 / Equifax via ClearScore 1000 / TransUnion via Credit Karma 710),
   - append `{date, score}` to `history` (skip if the same score/date is already the latest).
4. Tell her the new score + movement. If it **dropped**, name the likely cause from
   the email (missed/late payment, higher card utilisation, a new credit search, a
   closed account) and one concrete fix. If it **rose**, a quick well done.

Only ever log the number the email actually states — never estimate. The launchd
schedule can run this monthly; she can also just say `/credit` anytime.
