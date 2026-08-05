Help Blessing connect her banks to the Life OS (read-only, local).

1. Check `life-os/connectors/.env` has TL_CLIENT_ID and TL_CLIENT_SECRET. If not,
   walk her through making a free TrueLayer Data API app at
   https://console.truelayer.com/, adding redirect URI `http://localhost:3000/callback`,
   and pasting the keys into `.env` (never commit it).
2. Run `node life-os/connectors/truelayer.mjs link`. Her browser opens — she picks
   each bank (Revolut, NatWest, Halifax) and approves read-only access.
3. When done, run `/sync`.

Remind her: UK Open Banking needs re-approval (`link`) about every 90 days — you'll
flag it when a fetch starts failing.
