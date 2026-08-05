# START HERE — dummy-proof, copy-paste setup

Your repo: **https://github.com/blessinggas/blessingspage**
Your branch (where all the new stuff lives): **claude/design-system-integration-iym8oc**

Do it in order. Copy each grey block, paste into the app it names, press enter. If a
step doesn't apply, skip it. You can stop anytime — nothing breaks.

---

## PART 1 — Just see your dashboard (5 min, no terminal)
1. Open this link on your Mac: https://github.com/blessinggas/blessingspage/tree/claude/design-system-integration-iym8oc
2. Click the green **Code** button → **Download ZIP**.
3. Open the ZIP in Downloads → double-click **index.html**.
4. That's your Life OS. It works and saves to your Mac. 🎉

## PART 2 — Turn on security (2 min)
System Settings → Privacy & Security → **FileVault** → **Turn On**.

## PART 3 — Install the tools (10 min)
1. Install **Node**: open https://nodejs.org → click the big green **LTS** button →
   open the download → click Continue/Install through it.
2. Install **Homebrew** — open the **Terminal** app (Cmd+Space, type "Terminal"), paste this, press enter, follow prompts:
   ```
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. Get the project properly (so Claude can use it). Paste this whole block into Terminal:
   ```
   cd ~ && git clone https://github.com/blessinggas/blessingspage && cd blessingspage && git checkout claude/design-system-integration-iym8oc
   ```
   ✅ Worked if it ends inside a folder called `blessingspage`.

## PART 4 — Claude Code + your commands (5 min)
1. Install Claude Code — paste into Terminal:
   ```
   npm install -g @anthropic-ai/claude-code
   ```
2. Open your project in it — paste:
   ```
   cd ~/blessingspage && claude
   ```
3. Now you can type these anytime (just type the word with a slash):
   `/money`  `/credit`  `/career`  `/apply`  `/habits`  `/selfcare`  `/checkin`
   `/sync`  `/link-banks`

## PART 5 — Connect your banks, live (15 min)
1. Go to https://console.truelayer.com → sign up (free) → make an app → **Data API**.
2. In its settings, add this redirect URL exactly:
   ```
   http://localhost:3000/callback
   ```
3. Copy your **Client ID** and **Client Secret**. In Terminal, paste:
   ```
   cd ~/blessingspage/life-os/connectors && cp .env.example .env && open -e .env
   ```
   A text file opens — paste your Client ID after `TL_CLIENT_ID=` and the secret after
   `TL_CLIENT_SECRET=`. Save (Cmd+S), close it.
4. In Claude Code, type:  `/link-banks`  → your browser opens → approve **Revolut,
   NatWest, Halifax**.
5. Then type:  `/sync`  → your real balances appear. In the dashboard click
   **Restore from backup** and pick `life-os/dashboard-state.json`.

## PART 6 — iMessage & friendships (10 min, optional)
```
brew install --cask mattt/tap/iMCP
```
Open iMCP → turn on Messages, Contacts, Calendar (allow the pop-ups) → in Claude Desktop
add it (see MCP-SETUP.md). Then ask Claude: "who have I left on read?"

---

## Safety (already handled / quick ticks)
- Your keys sit in `.env`, which is git-ignored — they never leave your Mac.
- Turn on 2FA in TrueLayer and each bank app.
- Nothing you build is on the public internet.

## If stuck
Paste the error into Claude Code and say "fix this". That's literally what it's for.
