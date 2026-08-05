#!/usr/bin/env node
/**
 * Life OS sync — merges the connector outputs into the dashboard's data file.
 *
 * Reads:  ../connectors/out/trading212.json, ../connectors/out/bank.json
 * Writes: ../dashboard-state.json  (import into the dashboard via Restore, or
 *         let it be the shared file Claude Code + the app both use)
 *
 * Claude Code runs this (see /sync command). It:
 *   - updates account balances (match by name, add if new)
 *   - appends new bank transactions (deduped), auto-categorised
 *   - stamps fin.syncedAt
 * It never deletes your manual data — only augments it.
 *
 * Node 18+. No dependencies.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "connectors", "out");
const STATE = join(HERE, "..", "dashboard-state.json");
const readJson = (p, d) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return d; } };

function catFor(d) {
  d = (d || "").toLowerCase();
  const R = [["Income", /salary|wages|payroll|hmrc|refund|interest|dividend|received|trading ?212|bonus|stipend/],
    ["Groceries", /tesco|sainsbury|aldi|lidl|asda|morrison|waitrose|co-?op|iceland|ocado|m&s food/],
    ["Eating out", /mcdonald|kfc|nando|greggs|costa|starbucks|pret|deliveroo|uber ?eats|just ?eat|domino|pizza|restaurant|cafe|coffee/],
    ["Transport", /uber|bolt|trainline|\btfl\b|oyster|national ?rail|\brail\b|shell|\bbp\b|esso|fuel|petrol|parking/],
    ["Shopping", /amazon|asos|zara|boots|superdrug|primark|\bnext\b|argos|john ?lewis|shein|h&m|sephora/],
    ["Subscriptions", /netflix|spotify|disney|youtube|prime|icloud|patreon|audible|adobe|canva/],
    ["Bills", /gym|virgin|\bsky\b|\bbt\b|\bee\b|\bo2\b|vodafone|octopus|british ?gas|thames ?water|council ?tax|\brent\b|insurance|energy/],
    ["Health & beauty", /pharmacy|nails|hair|salon|beauty|barber|spa|dental/],
    ["Cash", /cash|\batm\b|withdrawal/]];
  for (const [name, re] of R) if (re.test(d)) return name;
  return "Other";
}

const state = readJson(STATE, {});
const fin = (state.__fin = state.__fin || {});
fin.accounts = fin.accounts || [];
fin.txns = fin.txns || [];

function upsertAccount(a) {
  if (!a) return;
  const found = fin.accounts.find((x) => x.name.toLowerCase() === a.name.toLowerCase());
  if (found) found.bal = a.bal;
  else fin.accounts.push({ name: a.name, kind: a.kind || "Current", bal: a.bal });
}

// Trading 212
const t212 = readJson(join(OUT, "trading212.json"), null);
if (t212?.dashboardAccount) { upsertAccount(t212.dashboardAccount); console.log(`T212: ${t212.currency} ${t212.total}`); }

// Bank (TrueLayer / other)
const bank = readJson(join(OUT, "bank.json"), null);
let added = 0;
if (bank) {
  (bank.accounts || []).forEach((a) => upsertAccount(a.dashboardAccount || { name: a.name, kind: a.kind, bal: Math.round(a.balance) }));
  const seen = new Set(fin.txns.map((t) => `${t.date}|${t.desc}|${t.amount}`));
  (bank.transactions || []).forEach((t) => {
    const key = `${t.date}|${t.desc}|${t.amount}`;
    if (seen.has(key)) return;
    seen.add(key);
    fin.txns.push({ date: t.date, desc: t.desc, amount: t.amount, cat: catFor(t.desc), acct: t.acct || "" });
    added++;
  });
}

fin.syncedAt = new Date().toISOString();
writeFileSync(STATE, JSON.stringify(state, null, 2));
console.log(`Synced. Accounts: ${fin.accounts.length}, new transactions: ${added}. → dashboard-state.json`);
console.log("Import it into the dashboard with Restore from backup (or open your local app).");
