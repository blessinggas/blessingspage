# Start here — Blessing's Life OS, first day

Do these in order. ~1 focused hour, most of it waiting on signups. Everything runs
on your Mac; nothing goes online. Deeper detail is in `ARCHITECTURE.md`,
`MCP-SETUP.md` and `connectors/README.md` — this page is just the path.

---

## 0. Before anything (5 min)
- [ ] Turn on **FileVault**: System Settings → Privacy & Security → FileVault → On.
      (This encrypts your whole disk — the foundation of the security story.)
- [ ] Install **Node 18+**: download from nodejs.org, then check in Terminal:
      `node --version`
- [ ] Get the project on your Mac: `git clone <your repo URL>` then `cd blessingspage`

## 1. See the dashboard (2 min)
- [ ] Open `index.html` in your browser (double-click it). That's your Life OS —
      it already works, saving to your device.

## 2. Money: Trading 212 (10 min) — the quick first win
- [ ] In the **Trading 212 app**: Settings → API (Beta) → generate a key
      (leave it in **Practice** mode for now).
- [ ] `cd life-os/connectors` → `cp .env.example .env` → paste the key as
      `T212_API_KEY`.
- [ ] Run `node trading212.mjs`.
      ✅ Worked when it prints your total/free/invested.

## 3. Money: your banks via TrueLayer (20 min)
- [ ] Make a free app at <https://console.truelayer.com/> (Data API).
      Add redirect URI **exactly**: `http://localhost:3000/callback`
- [ ] Put `TL_CLIENT_ID` and `TL_CLIENT_SECRET` into the same `.env`
      (keep `TL_ENV=sandbox` to test first).
- [ ] `node truelayer.mjs link` → your browser opens → approve **Revolut,
      NatWest, Halifax** (read-only).
- [ ] `node truelayer.mjs fetch`.
      ✅ Worked when it lists your bank balances.
- [ ] Switch `TL_ENV=live` in `.env` when you're ready for real data, and
      `link` again.

## 4. Pull it all into the dashboard (2 min)
- [ ] From `life-os/`: `node run/sync.mjs` → writes `dashboard-state.json`.
- [ ] In the dashboard, click **Restore from backup** and choose that file.
      ✅ Your real accounts + transactions now show in Finances.

## 5. Claude Code as your manager (10 min)
- [ ] Open the repo folder in **Claude Code**.
- [ ] Try the commands: **`/sync`** (refresh money), **`/money`** (advice),
      **`/checkin`** (daily check-in), **`/link-banks`** (redo bank consent).
- [ ] It follows `CLAUDE.md` — your tone, cycle-aware days, ADHD step-by-step.

## 6. iMessage + friendships (10 min)
- [ ] `brew install --cask mattt/tap/iMCP` → open it → turn on Messages,
      Contacts, Calendar (grant permissions).
- [ ] Connect it to **Claude Desktop** (config in `MCP-SETUP.md`).
- [ ] Ask Claude: "who have I left on read?" / "update life-os/friendships.md".

## 7. Make it run itself (optional, 5 min)
- [ ] Edit the paths in `run/com.blessing.lifeos.plist`, then:
      `cp run/com.blessing.lifeos.plist ~/Library/LaunchAgents/`
      `launchctl load ~/Library/LaunchAgents/com.blessing.lifeos.plist`
      → syncs your money morning + evening automatically.

---

## Safety checklist (tick before going live)
- [ ] FileVault on (step 0).
- [ ] `.env` and `out/` are git-ignored (already set) — never commit keys.
- [ ] 2FA on Trading 212, TrueLayer and each bank.
- [ ] Bank scopes stay **read-only** (they are by default).
- [ ] Mac has a login password + short auto-lock.

## When something breaks
- Bank fetch fails after ~90 days → run `/link-banks` again (Open Banking rule).
- T212 401 → regenerate the key in the app, update `.env`.
- Lost the dashboard data → re-import your latest backup, or `node run/sync.mjs`.

You never *have* to touch the terminal after setup — `/sync`, `/money` and
`/checkin` in Claude Code do everything from here.
