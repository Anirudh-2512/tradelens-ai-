/**
 * Simple TTL memory cache for non-critical server data
 * (company profiles, search results, news, candles).
 *
 * Quote data is intentionally NEVER cached here beyond a few seconds —
 * freshness matters for financial display (spec §44).
 */

interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Read-through helper. */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await fetcher();
  cacheSet(key, value, ttlMs);
  return value;
}

export const CACHE_TTL = {
  search: 10 * 60_000,
  profile: 12 * 60_000,
  candles: 5 * 60_000,
  news: 5 * 60_000,
  // Quote freshness vs provider cap: 25s keeps per-instance bursts well
  // inside Finnhub's free per-minute limit while remaining near-real-time.
  quote: 25_000,
} as const;
