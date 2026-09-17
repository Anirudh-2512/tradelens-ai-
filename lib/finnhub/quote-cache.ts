import { getDb } from "@/lib/db/client";
import { finnhubProvider } from "@/lib/finnhub";
import { logger } from "@/lib/utils/logger";
import { errors } from "@/lib/utils/api";
import type { Quote } from "@/types/market";

/**
 * Cross-instance quote cache backed by Turso (spec §44).
 *
 * WHY: Vercel serverless spawns many instances, each with a private
 * in-memory cache — provider-side bursts still exhaust the free-plan
 * rate caps. A shared DB cache means ALL instances dedupe against one
 * row per symbol, and the last-known payload survives upstream outages.
 *
 * Behavior:
 * - Fresh row (< QUOTE_FRESH_MS)  → served without touching Finnhub
 * - Stale/missing                  → fetch Finnhub; on success upsert
 * - Fetch failure + existing row   → serve last-known payload, flagged stale
 * - Fetch failure + no row         → MARKET_DATA_UNAVAILABLE
 * Nothing is ever fabricated (spec §57).
 */

interface CachedRow {
  payload: string;
  fetched_at: number;
}

export interface QuoteEnvelope {
  quote: Quote;
  fresh: boolean;
}

const QUOTE_FRESH_MS = 25_000;

export async function getQuoteShared(symbol: string): Promise<QuoteEnvelope> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  let row: CachedRow | null = null;
  try {
    const res = await db.execute({
      sql: "SELECT payload, fetched_at FROM quotes_cache WHERE symbol = ?",
      args: [symbol],
    });
    row = (res.rows[0] as unknown as CachedRow) ?? null;
  } catch (err) {
    logger.error("quotecache.read_failed", "getQuoteShared", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const rowFresh =
    row !== null &&
    typeof row.fetched_at === "number" &&
    now - row.fetched_at < QUOTE_FRESH_MS;

  if (rowFresh && row) {
    try {
      return { quote: JSON.parse(row.payload) as Quote, fresh: true };
    } catch {
      // fall through to a live fetch
    }
  }

  try {
    const quote = await finnhubProvider.getQuote(symbol);
    try {
      await db.execute({
        sql: "INSERT INTO quotes_cache (symbol, payload, fetched_at) VALUES (?, ?, ?) ON CONFLICT(symbol) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at",
        args: [symbol, JSON.stringify(quote), now],
      });
    } catch (err) {
      // Cache write failure must never break the request.
      logger.warn("quotecache.write_failed", "getQuoteShared", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return { quote, fresh: true };
  } catch (err) {
    void err;
    if (row && typeof row.fetched_at === "number") {
      logger.warn("quotecache.stale_served", "getQuoteShared", {
        symbol,
        ageSeconds: now - row.fetched_at,
      });
      // Last-known value, explicitly labeled stale.
      return { quote: JSON.parse(row.payload) as Quote, fresh: false };
    }
    // No last-known value exists — nothing to fabricate (spec §57).
    throw errors.marketDataUnavailable();
  }
}
