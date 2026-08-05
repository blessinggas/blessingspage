# Money connectors (run on your Mac)

Small, read-only scripts that pull your real balances so Claude (and the
dashboard) can use live numbers. They run **on your machine** — your API keys
live in a git-ignored `.env` and never touch the website or this repo.

> Read-only by design. These scripts can *see* your money, not move it.

## One-time setup
```bash
cd life-os/connectors
cp .env.example .env      # then paste your keys into .env
```
You need Node 18+ ( `node --version` ). No packages to install.

## Trading 212
1. In the Trading 212 **mobile app**: Settings → API (Beta) → create a key
   (start in **Practice** mode).
2. Put it in `.env` as `T212_API_KEY`, leave `T212_ENV=demo` to test.
3. Run:
   ```bash
   node trading212.mjs
   ```
   → prints your total/free/invested and writes `out/trading212.json`.

## Bank + credit cards (Open Banking, free via GoCardless)
1. Free account at <https://bankaccountdata.gocardless.com/> → create a secret
   (Secret ID + Key) → put both in `.env`.
2. Find your bank's id, then link and fetch:
   ```bash
   node gocardless.mjs institutions     # list bank IDs, copy yours into .env as GC_INSTITUTION
   node gocardless.mjs link             # open the printed link, log in to your bank, approve
   node gocardless.mjs fetch            # writes out/bank.json
   ```
   Access lasts ~90 days per approval, then you re-run `link`.

## Getting the numbers into the dashboard
Each script writes a `dashboardAccount` block (name / kind / balance). Two ways
to use it:
- **Quick:** read the number and type/paste it into the dashboard's Accounts, or
  tell the command box (e.g. `add account Trading 212 8400`).
- **Automatic (with Claude on your Mac):** give Claude the **Filesystem MCP**
  (see `../MCP-SETUP.md`). Then: *"read out/trading212.json and out/bank.json,
  update dashboard-state.json's accounts to match, and tell me what changed."*
  Re-import that JSON into the site via **Restore from backup**.

## Letting Claude run these itself
In **Claude Code** on your Mac, Claude can run `node trading212.mjs` directly and
read the output — no extra server needed. If you prefer **Claude Desktop**, add
the Filesystem MCP so it can read the `out/*.json` files, and run the scripts on
a schedule with `cron`/`launchd` (your Life OS spec's proactive pipeline).

## Security
- Never commit `.env` or `out/` (already git-ignored).
- Prefer read-only scopes; keep Trading 212 in Practice mode until you trust it.
- If a key ever leaks, revoke it in the provider's app and generate a new one.
