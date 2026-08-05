# Life OS — architecture & security

## The shape (local-first, Claude Code as the brain)

```
        ┌──────────────────────── your Mac (nothing public) ───────────────────────┐
        │                                                                            │
  banks │  connectors/truelayer.mjs ──┐                                              │
  T212  │  connectors/trading212.mjs ─┤→ run/sync.mjs → dashboard-state.json         │
        │                             │                        │                     │
        │  Claude Code (the brain) ───┘   reads/updates  ──────┘                     │
        │    • /sync  /money  /checkin  /link-banks                                   │
        │    • iMCP → Messages, Contacts, Calendar (friendships)                     │
        │    • launchd → runs sync + proactive check-ins on a schedule              │
        │                                    │                                       │
        │                     index.html (the dashboard you look at)                 │
        └────────────────────────────────────────────────────────────────────────┘
                     ↑ outbound HTTPS only, to your banks / TrueLayer / T212
```

Everything runs on your machine. Data flows **out** to your banks; nothing
listens for the internet. Claude Code is wired into all of it — money, messages,
check-ins.

## Your questions, answered
- **TrueLayer?** Yes — it's the bank connector (Revolut, NatWest, Halifax all
  supported). Local-first just means its login runs on `localhost`.
- **Supabase?** Optional. For maximum safety we use a **local encrypted file**
  (`dashboard-state.json`, git-ignored) instead. Add Supabase later *only* if you
  want to open the dashboard from your phone away from home — it's the one piece
  that would put a (hardened) server online. Recommendation: skip it for now.
- **Claude Code in everything?** Yes — see `CLAUDE.md` and `../.claude/commands/`.

## Security posture (bank-engineer mindset)
| Concern | Local-first answer |
|---|---|
| Remote hacking (IDOR, SQLi, exposed admin routes) | No public server exists to attack. The whole class is gone. |
| Secrets / bank tokens | In `.env` + `out/` (git-ignored) or macOS Keychain. Never committed, never printed. |
| Data at rest | `dashboard-state.json` stays on your Mac. Turn on **FileVault** so the disk is encrypted; optionally encrypt the file with a passphrase. |
| Money movement | Read-only Open Banking scopes. The system can see, never pay. |
| Injection / bad input | Statement/transaction parsing is sandboxed to your own data; no SQL; no eval. |
| Third-party calls | The dashboard makes none except the (optional) web font — self-host it for a zero-external-call build. |
| Device = the perimeter | FileVault + Mac password + auto-lock + 2FA on each bank, TrueLayer and T212. |

**Honest note:** nothing is 100% unhackable, but removing the public server
deletes essentially every *remote* attack. What remains is device security, which
is yours to control and straightforward to lock down.

## If you ever want "access from anywhere"
Then we add hosting (Supabase or Cloudflare) with: authenticated routes only,
Row-Level Security, parameterised queries, encrypted token storage, and secrets
server-side. It's more convenient but reintroduces a remote surface — so it's a
deliberate trade, not the default.
