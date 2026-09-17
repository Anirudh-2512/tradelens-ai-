#!/usr/bin/env node
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnvLocal();

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
if (!url || !token) {
  console.error("✗ Missing Turso credentials in .env.local");
  process.exit(1);
}
const db = createClient({ url, authToken: token });

const emails = [
  "localtest@example.com",
  "smoke.test@example.com",
  "attacker@example.com",
  "prodcheck@example.com",
  "prodcheck2@example.com",
  "t4check@example.com",
  "t5check@example.com",
];

const ph = emails.map(() => "?").join(",");
const users = await db.execute(`SELECT id FROM users WHERE email IN (${ph})`, emails);
for (const r of users.rows) {
  for (const t of [
    "DELETE FROM watchlist_items WHERE watchlist_id IN (SELECT id FROM watchlists WHERE user_id = ?)",
    "DELETE FROM watchlists WHERE user_id = ?",
    "DELETE FROM transactions WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = ?)",
    "DELETE FROM holdings WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = ?)",
    "DELETE FROM portfolios WHERE user_id = ?",
    "DELETE FROM sessions WHERE user_id = ?",
    "DELETE FROM email_verification_tokens WHERE user_id = ?",
    "DELETE FROM users WHERE id = ?",
  ]) {
    await db.execute(t, [r.id]);
  }
}
console.log(`cleaned ${users.rows.length} test users`);
process.exit(0);
