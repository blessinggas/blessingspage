#!/usr/bin/env node
/**
 * TrueLayer → dashboard connector (read-only, runs on YOUR Mac).
 *
 * Live balances + transactions from your real banks (Revolut, NatWest, Halifax,
 * …) with nothing hosted publicly. The whole OAuth exchange happens on
 * localhost, so your client secret and bank tokens never leave your machine.
 *
 * SETUP
 *   1. Make a free app at https://console.truelayer.com/ — Data API.
 *      Add redirect URI:  http://localhost:3000/callback
 *      Copy Client ID + Client Secret into .env (TL_CLIENT_ID / TL_CLIENT_SECRET).
 *      Start in TL_ENV=sandbox to test, switch to live when ready.
 *   2. node truelayer.mjs link     # opens your browser, pick each bank, approve
 *   3. node truelayer.mjs fetch    # writes out/bank.json (balances + transactions)
 *
 * Read-only scopes only (info accounts balance cards transactions) — it can see,
 * never move money. UK Open Banking requires re-consent (`link`) about every 90 days.
 *
 * Requires Node 18+. No dependencies.
 *
 * HARDENING: out/.tl-tokens.json holds your access/refresh tokens. It is
 * git-ignored. For extra safety move it into the macOS Keychain (see
 * ../MCP-SETUP.md) — this file is written to be easy to swap to `security
 * add-generic-password` storage.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { exec } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
try {
  for (const line of readFileSync(join(HERE, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const ID = process.env.TL_CLIENT_ID, SECRET = process.env.TL_CLIENT_SECRET;
const ENV = (process.env.TL_ENV || "sandbox").toLowerCase();
const REDIRECT = "http://localhost:3000/callback";
const AUTH = ENV === "live" ? "https://auth.truelayer.com" : "https://auth.truelayer-sandbox.com";
const API  = ENV === "live" ? "https://api.truelayer.com"  : "https://api.truelayer-sandbox.com";
const SCOPES = "info accounts balance cards transactions offline_access";
const TOKENS = join(HERE, "out", ".tl-tokens.json");

if (!ID || !SECRET) { console.error("Missing TL_CLIENT_ID / TL_CLIENT_SECRET in .env"); process.exit(1); }

const saveTokens = (o) => { mkdirSync(join(HERE, "out"), { recursive: true }); writeFileSync(TOKENS, JSON.stringify(o, null, 2)); };
const loadTokens = () => existsSync(TOKENS) ? JSON.parse(readFileSync(TOKENS, "utf8")) : null;

async function exchange(body) {
  const res = await fetch(`${AUTH}/connect/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: ID, client_secret: SECRET, redirect_uri: REDIRECT, ...body }),
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`);
  return res.json();
}

async function accessToken() {
  const t = loadTokens();
  if (!t) throw new Error("Not linked yet — run `node truelayer.mjs link` first.");
  if (Date.now() < (t.obtained + t.expires_in * 1000 - 60000)) return t.access_token;
  const nt = await exchange({ grant_type: "refresh_token", refresh_token: t.refresh_token });
  saveTokens({ ...nt, obtained: Date.now() });
  return nt.access_token;
}

function link() {
  const url = `${AUTH}/?response_type=code&client_id=${ID}` +
    `&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(REDIRECT)}` +
    `&providers=${encodeURIComponent("uk-ob-all uk-oauth-all")}`;
  const server = createServer(async (req, res) => {
    if (!req.url.startsWith("/callback")) { res.writeHead(404).end(); return; }
    const code = new URL(req.url, REDIRECT).searchParams.get("code");
    try {
      const t = await exchange({ grant_type: "authorization_code", code });
      saveTokens({ ...t, obtained: Date.now() });
      res.end("✅ Connected. You can close this tab and run: node truelayer.mjs fetch");
      console.log("  linked — tokens saved to out/.tl-tokens.json");
    } catch (e) { res.end("Error: " + e.message); console.error(e.message); }
    finally { setTimeout(() => server.close(), 500); }
  }).listen(3000, "127.0.0.1", () => {
    console.log("Opening your browser to approve each bank…\nIf it doesn't open, visit:\n  " + url);
    exec(`open "${url}"`); // macOS
  });
}

async function fetchData() {
  const tok = await accessToken();
  const h = { Authorization: `Bearer ${tok}` };
  const out = { source: "truelayer", env: ENV, fetchedAt: new Date().toISOString(), accounts: [], transactions: [] };
  const grab = async (p) => (await fetch(`${API}${p}`, { headers: h })).json();

  const accounts = (await grab("/data/v1/accounts")).results || [];
  const cards = (await grab("/data/v1/cards").catch(() => ({}))).results || [];
  for (const a of [...accounts, ...cards.map((c) => ({ ...c, _card: true }))]) {
    const id = a.account_id;
    const bal = (await grab(`/data/v1/${a._card ? "cards" : "accounts"}/${id}/balance`)).results?.[0] || {};
    const txns = (await grab(`/data/v1/${a._card ? "cards" : "accounts"}/${id}/transactions`).catch(() => ({}))).results || [];
    out.accounts.push({
      name: a.display_name || a.provider?.display_name || "Account",
      kind: a._card ? "Credit" : "Current",
      currency: bal.currency || "GBP",
      balance: Number(bal.current ?? 0),
      dashboardAccount: { name: a.display_name || "Account", kind: a._card ? "Credit" : "Current", bal: Math.round(Number(bal.current ?? 0)) },
    });
    for (const t of txns) out.transactions.push({
      date: (t.timestamp || "").slice(0, 10),
      desc: t.description || t.merchant_name || "",
      amount: Number(t.amount || 0),   // TrueLayer: negative = debit
      acct: a.display_name || "Account",
    });
  }
  mkdirSync(join(HERE, "out"), { recursive: true });
  writeFileSync(join(HERE, "out", "bank.json"), JSON.stringify(out, null, 2));
  out.accounts.forEach((a) => console.log(`  ${a.name}: ${a.currency} ${a.balance.toFixed(2)}`));
  console.log(`  ${out.transactions.length} transactions → out/bank.json`);
}

const cmd = process.argv[2] || "fetch";
Promise.resolve(({ link, fetch: fetchData }[cmd] || fetchData)())
  .catch((e) => { console.error("Failed:", e.message); process.exit(1); });
