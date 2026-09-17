import type { WatchlistWithSymbols } from "@/types/db";

export async function listWatchlists(userId: number): Promise<WatchlistWithSymbols[]> {
  const { query } = await import("@/lib/db");
  const lists = await query<{ id: number; name: string }>(
    "SELECT id, name FROM watchlists WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  if (lists.length === 0) return [];

  const placeholders = lists.map(() => "?").join(",");
  const items = await query<{ watchlist_id: number; symbol: string }>(
    `SELECT watchlist_id, symbol FROM watchlist_items WHERE watchlist_id IN (${placeholders}) ORDER BY created_at ASC`,
    lists.map((l) => l.id)
  );

  const byId = new Map<number, WatchlistWithSymbols>(
    lists.map((l) => [l.id, { ...l, symbols: [] as string[] }])
  );
  for (const item of items) {
    byId.get(item.watchlist_id)?.symbols.push(item.symbol);
  }
  return [...byId.values()];
}

export async function assertOwnedWatchlist(userId: number, watchlistId: number) {
  const { queryOne } = await import("@/lib/db");
  return queryOne<{ id: number; name: string }>(
    "SELECT id, name FROM watchlists WHERE id = ? AND user_id = ?",
    [watchlistId, userId]
  );
}

export async function createWatchlist(userId: number, name: string) {
  const { executeReturning } = await import("@/lib/db");
  const now = Math.floor(Date.now() / 1000);
  const id = await executeReturning(
    "INSERT INTO watchlists (user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
    [userId, name, now, now]
  );
  return { id: Number(id), name, symbols: [] as string[] };
}

export async function renameWatchlist(watchlistId: number, name: string) {
  const { execute } = await import("@/lib/db");

  const now = Math.floor(Date.now() / 1000);
  await execute("UPDATE watchlists SET name = ?, updated_at = ? WHERE id = ?", [
    name,
    now,
    watchlistId,
  ]);
}

export async function deleteWatchlist(watchlistId: number) {
  const { execute } = await import("@/lib/db");
  await execute("DELETE FROM watchlists WHERE id = ?", [watchlistId]);
}

export async function addSymbol(watchlistId: number, symbol: string) {
  const { execute } = await import("@/lib/db");
  const now = Math.floor(Date.now() / 1000);
  // UNIQUE(watchlist_id, symbol) prevents duplicates (spec §29).
  await execute(
    "INSERT OR IGNORE INTO watchlist_items (watchlist_id, symbol, created_at) VALUES (?, ?, ?)",
    [watchlistId, symbol, now]
  );
  await execute("UPDATE watchlists SET updated_at = ? WHERE id = ?", [now, watchlistId]);
}

export async function removeSymbol(watchlistId: number, symbol: string) {
  const { execute } = await import("@/lib/db");
  await execute("DELETE FROM watchlist_items WHERE watchlist_id = ? AND symbol = ?", [
    watchlistId,
    symbol,
  ]);
}
