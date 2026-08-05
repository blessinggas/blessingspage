#!/usr/bin/env node
/**
 * Trading 212 → dashboard connector (read-only).
 *
 * Pulls your account cash + open positions from the Trading 212 public API and
 * writes a small summary to ./out/trading212.json. Nothing here can trade or
 * move money — it only reads.
 *
 * SETUP
 *   1. In the Trading 212 *mobile app*: Settings → API (Beta) → generate a key.
 *      Start in **Practice** mode while testing.
 *   2. cp .env.example .env  and paste your key into it.
 *   3. node trading212.mjs
 *
 * Requires Node 18+ (uses global fetch). No dependencies.
 *
 * NOTE: The T212 API is in beta; if an endpoint 404s or the auth is rejected,
 * check the current docs at https://t212public-api-docs.redoc.ly/ and adjust
 * BASE / paths below. Auth is the raw API key in the Authorization header.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// tiny .env loader (no dependency)
try {
  for (const line of readFileSync(join(HERE, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* no .env — rely on real env vars */ }

const KEY = process.env.T212_API_KEY;
const ENV = (process.env.T212_ENV || "demo").toLowerCase(); // 'demo' or 'live'
if (!KEY) {
  console.error("Missing T212_API_KEY. Copy .env.example to .env and add your key.");
  process.exit(1);
}
const BASE = ENV === "live"
  ? "https://live.trading212.com/api/v0"
  : "https://demo.trading212.com/api/v0";

async function get(path) {
  const res = await fetch(BASE + path, { headers: { Authorization: KEY } });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

// Endpoints are rate-limited per-path, so space the calls out a little.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`Trading 212 (${ENV}) — reading account…`);
  const cash = await get("/equity/account/cash");        // { free, invested, ppl, result, total, ... }
  await sleep(1500);
  const info = await get("/equity/account/info").catch(() => ({})); // { currencyCode, id }
  await sleep(1500);
  const positions = await get("/equity/portfolio").catch(() => []); // [{ ticker, quantity, currentPrice, ppl, ... }]

  const currency = info.currencyCode || "GBP";
  const invested = Number(cash.invested || 0);
  const free = Number(cash.free || 0);
  const total = Number(cash.total ?? invested + free);
  const ppl = Number(cash.ppl || 0); // open profit/loss

  const summary = {
    source: "trading212",
    env: ENV,
    fetchedAt: new Date().toISOString(),
    currency,
    free, invested, total, openProfitLoss: ppl,
    positions: (positions || []).map((p) => ({
      ticker: p.ticker, quantity: p.quantity,
      value: Number(p.quantity || 0) * Number(p.currentPrice || 0),
      profitLoss: p.ppl,
    })),
    // ready to drop straight into the dashboard's Accounts as an investment line:
    dashboardAccount: { name: "Trading 212", kind: "Savings", bal: Math.round(total) },
  };

  mkdirSync(join(HERE, "out"), { recursive: true });
  writeFileSync(join(HERE, "out", "trading212.json"), JSON.stringify(summary, null, 2));

  console.log(`  Total value : ${currency} ${total.toFixed(2)}`);
  console.log(`  Free cash   : ${currency} ${free.toFixed(2)}`);
  console.log(`  Invested    : ${currency} ${invested.toFixed(2)}  (open P/L ${ppl.toFixed(2)})`);
  console.log(`  Positions   : ${summary.positions.length}`);
  console.log(`  → wrote out/trading212.json`);
}

main().catch((e) => { console.error("Failed:", e.message); process.exit(1); });
