Refresh Blessing's money data, then summarise.

Steps:
1. Run `node life-os/connectors/trading212.mjs` (skip if no T212 key set).
2. Run `node life-os/connectors/truelayer.mjs fetch` (if not linked yet, tell her to run `/link-banks`).
3. Run `node life-os/run/sync.mjs`.
4. Read `life-os/dashboard-state.json` and report, briefly: total cash, total owed,
   net worth, spend so far this month vs last, and anything unusual (a big charge,
   a new subscription, a bill that jumped).
5. Remind her to import the file with **Restore from backup** if she's on the
   hosted dashboard (skip if she's on the local app).

Keep it short and human. Don't print tokens or raw transaction dumps.
