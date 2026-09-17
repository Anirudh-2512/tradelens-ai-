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

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("✗ Missing Turso credentials");
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const emails = ["smoke.test@example.com", "attacker@example.com"];

try {
  const placeholders = emails.map(() => "?").join(",");
  const users = await db.execute(`SELECT id FROM users WHERE email IN (${placeholders})`, emails);
  for (const u of users.rows) {
    const id = u.id;
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
      await db.execute(t, [id]);
    }
  }
  console.log(`✓ Cleaned ${users.rows.length} smoke-test users`);
  process.exit(0);
} catch (err) {
  console.error("✗ Cleanup failed:", err.message);
  process.exit(1);
}
