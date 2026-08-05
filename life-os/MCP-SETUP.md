# Life OS — MCP setup (iMessage + money manager)

This is the **local, on-your-Mac** half of the system. The website
(`index.html`) is your visual dashboard. The intelligence — reading your
iMessages, watching your money, giving recommendations, chatting with you and
updating things — runs as **Claude Desktop (or Claude Code) on your Mac**, using
MCP servers.

> **Why not in the website?** The site is a static page on GitHub Pages with no
> server. It can't safely hold bank/Trading-212 logins (anything in a public web
> page is readable by anyone), and it can't run background jobs. MCP servers
> connect to an AI *client* on your machine, not to a web page. So: **Mac = the
> manager, website = the dashboard.** They meet through one shared JSON file
> (see Part C).

---

## Part A — iMessage + friendships (iMCP)

[iMCP](https://github.com/mattt/iMCP) is a macOS app that exposes your
**Messages, Contacts, Calendar, Reminders, Location, Maps and Weather** to an
MCP client. This is what lets Claude help you stay on top of friendships and
"I'll let you know" type threads.

### Install
1. macOS 15.3+ required.
2. `brew install --cask mattt/tap/iMCP` (or download from https://iMCP.app/download).
3. Open iMCP → click its menu-bar icon → turn on **Messages**, **Contacts**,
   **Calendar**, **Reminders**. Grant each macOS permission when prompted
   (Messages needs **Full Disk Access**, granted in System Settings → Privacy).

### Connect to Claude Desktop
Claude Desktop → Settings → Developer → **Edit Config**, then:
```json
{
  "mcpServers": {
    "iMCP": {
      "command": "/Applications/iMCP.app/Contents/MacOS/imcp-server"
    }
  }
}
```
(or just click the iMCP icon → **Configure Claude Desktop**). Restart Claude
Desktop; you should see the iMCP tools appear.

### What to ask Claude once it's connected
- "Who have I left on read that I said I'd reply to? Draft warm replies."
- "Whose birthday is coming up in Contacts/Calendar in the next 2 weeks?"
- "I haven't spoken to [friend] in a while — remind me and suggest a message."
- "Log what I promised people this week into `life-os/friendships.md`."

Claude reads the messages **locally** — nothing leaves your Mac except the model
request itself. Keep the `friendships.md` tracker (in this folder) as the memory
so it survives across chats.

---

## Part B — The money manager (via MCP)

The honest layout of what's possible today:

| Source | How it connects | Live? | Notes |
|---|---|---|---|
| **Trading 212** | Official **public API** (beta), API key from the T212 mobile app | ✅ live (read) | Endpoints for account, portfolio, cash, pies. Live env is read + market orders only. Wrap it in a tiny local MCP server or let Claude Code call it with a script. |
| **Banks + credit cards + debts** | **Open Banking** aggregator — [GoCardless Bank Account Data](https://gocardless.com/bank-account-data/) (free tier), [TrueLayer](https://truelayer.com), or [Plaid](https://plaid.com) | ✅ live (read) | UK banks require an FCA-registered aggregator (these are). Needs a small local server holding the token — never in the website. Community "Plaid MCP" servers exist. |
| **Manual / statements** | Type figures into the dashboard, or paste a statement to Claude | ⚪ manual | Your spec's stated preference. Works today with zero setup. |

### Security — non-negotiable
- API keys and bank tokens live **only** on your Mac, in a file that is **never
  committed to git** (add it to `.gitignore`). Never paste them into the website
  or a public repo.
- Start Trading 212 in **Practice/Demo** mode while wiring it up.
- Prefer **read-only** scopes. You want a manager that *sees* and *advises*, not
  one that can move money on its own.

### The manager loop (what your spec actually wants)
Once the sources above feed Claude on your Mac, a scheduled Claude Code run
(your `launchd` job) can, a few times a day:
1. Pull balances (bank + T212), recent transactions, and this dashboard's data.
2. Update the trackers + the shared JSON (Part C).
3. Tell you, in plain language: what's safe to spend, how much to move to LISA
   (grab the 25% bonus first), what to invest, and flag anything off — then text
   it to you via the iMessage pipeline in your Life OS spec.
4. You reply in chat ("got paid £2,000", "put £300 to the house pot") and it
   updates the numbers.

That chat-driven manager **is Claude** — you don't need to build a separate AI;
you give Claude the MCP tools + the data and it does the reasoning.

---

## Part C — Bridging the Mac manager and this dashboard

The website already has **Back up my progress / Restore from backup** (bottom of
the page) which export/import the whole state as JSON. That JSON is the bridge:

1. Add the **Filesystem MCP** server to Claude so it can read/write a file, e.g.
   `~/life-os/dashboard-state.json`.
2. Export the dashboard once to seed that file.
3. Claude (on your Mac) reads it for context and writes updates back to it —
   your savings pots, ledger inputs, income.
4. Re-import it into the website when you want the dashboard to reflect the
   latest. (A future step could make the site read that JSON directly if you
   ever host it with a tiny local server.)

So the numbers you see on the pretty dashboard and the numbers Claude reasons
over stay the same set of numbers.

---

## What I could not do from here
I'm running in a cloud sandbox, so I can't install apps on your Mac, hold your
API keys, or connect to your accounts. Everything above is set up so **you** run
it locally in a few minutes. If you paste a bank statement or Trading 212
figures into a chat with me, I can still parse them and update the dashboard's
numbers for you manually any time.
