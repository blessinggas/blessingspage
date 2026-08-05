#!/usr/bin/env node
/**
 * Open Banking → dashboard connector (read-only) via GoCardless Bank Account
 * Data (formerly Nordigen). Free tier covers UK + EU banks. Read-only: it can
 * see balances and transactions, it cannot move money.
 *
 * Because a bank login needs YOU to authorise in the browser, this runs in two
 * steps:
 *
 *   1. node gocardless.mjs link          # prints a link — open it, pick your
 *                                         bank, log in, approve
 *   2. node gocardless.mjs fetch         # after approving, pulls balances +
 *                                         transactions → out/bank.json
 *
 * SETUP
 *   1. Make a free account at https://bankaccountdata.gocardless.com/ and
 *      create a "secret" (Secret ID + Secret Key).
 *   2. cp .env.example .env  and fill GC_SECRET_ID / GC_SECRET_KEY.
 *      Optionally set GC_INSTITUTION (e.g. MONZO_MONZGB2L). Run this file with
 *      `institutions` to list IDs for your country.
 *
 * Requires Node 18+. No dependencies.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
try {
  for (const line of readFileSync(join(HERE, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const API = "https://bankaccountdata.gocardless.com/api/v2";
const { GC_SECRET_ID, GC_SECRET_KEY, GC_INSTITUTION, GC_COUNTRY = "GB" } = process.env;
const STATE = join(HERE, "out", ".gc-state.json");

async function token() {
  const r = await fetch(`${API}/token/new/`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret_id: GC_SECRET_ID, secret_key: GC_SECRET_KEY }),
  });
  if (!r.ok) throw new Error(`token ${r.status}: ${await r.text()}`);
  return (await r.json()).access;
}
const auth = (t) => ({ Authorization: `Bearer ${t}`, "Content-Type": "application/json" });
const save = (o) => { mkdirSync(join(HERE, "out"), { recursive: true }); writeFileSync(STATE, JSON.stringify(o, null, 2)); };
const load = () => existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};

async function institutions() {
  const t = await token();
  const r = await fetch(`${API}/institutions/?country=${GC_COUNTRY}`, { headers: auth(t) });
  const list = await r.json();
  list.forEach((i) => console.log(`${i.id}\t${i.name}`));
}

async function link() {
  if (!GC_INSTITUTION) return console.error("Set GC_INSTITUTION in .env (run `node gocardless.mjs institutions` to find yours).");
  const t = await token();
  const r = await fetch(`${API}/requisitions/`, {
    method: "POST", headers: auth(t),
    body: JSON.stringify({ redirect: "https://localhost/ok", institution_id: GC_INSTITUTION }),
  });
  const req = await r.json();
  save({ requisitionId: req.id });
  console.log("\nOpen this link, choose your bank and approve access:\n");
  console.log("  " + req.link + "\n");
  console.log("Then run:  node gocardless.mjs fetch");
}

async function fetchData() {
  const { requisitionId } = load();
  if (!requisitionId) return console.error("Run `node gocardless.mjs link` first.");
  const t = await token();
  const req = await (await fetch(`${API}/requisitions/${requisitionId}/`, { headers: auth(t) })).json();
  if (!req.accounts || !req.accounts.length) return console.error("No linked accounts yet — finish the approval link first.");

  const out = { source: "gocardless", fetchedAt: new Date().toISOString(), accounts: [] };
  for (const id of req.accounts) {
    const bal = await (await fetch(`${API}/accounts/${id}/balances/`, { headers: auth(t) })).json();
    const det = await (await fetch(`${API}/accounts/${id}/details/`, { headers: auth(t) })).json();
    const amount = Number(bal.balances?.[0]?.balanceAmount?.amount || 0);
    out.accounts.push({
      id,
      name: det.account?.name || det.account?.ownerName || "Bank account",
      currency: bal.balances?.[0]?.balanceAmount?.currency || "GBP",
      balance: amount,
      dashboardAccount: { name: det.account?.name || "Bank account", kind: "Current", bal: Math.round(amount) },
    });
  }
  mkdirSync(join(HERE, "out"), { recursive: true });
  writeFileSync(join(HERE, "out", "bank.json"), JSON.stringify(out, null, 2));
  out.accounts.forEach((a) => console.log(`  ${a.name}: ${a.currency} ${a.balance.toFixed(2)}`));
  console.log("  → wrote out/bank.json");
}

const cmd = process.argv[2] || "fetch";
if (!GC_SECRET_ID || !GC_SECRET_KEY) { console.error("Missing GC_SECRET_ID / GC_SECRET_KEY in .env"); process.exit(1); }
({ institutions, link, fetch: fetchData }[cmd] || fetchData)().catch((e) => { console.error("Failed:", e.message); process.exit(1); });
