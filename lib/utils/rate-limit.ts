/**
 * In-memory sliding-window rate limiter (spec §12).
 * Abstraction is independent of business logic so a distributed
 * limiter (e.g. Upstash/Redis) can replace it later without
 * touching route handlers.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    const maxWindow = 15 * 60_000;
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < maxWindow);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * @param key      Unique identity, e.g. `ai:${userId}`, `auth:${ip}`
 * @param limit    Max requests in the window
 * @param windowMs Window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfterSec };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  return { allowed: true, remaining: limit - bucket.timestamps.length };
}

/** Rate limit presets aligned to the spec's sensitive endpoints. */
export const rateLimitPresets = {
  auth: (id: string) => rateLimit(`auth:${id}`, 10, 5 * 60_000),
  ai: (id: string) => rateLimit(`ai:${id}`, 10, 60_000),
  stocks: (id: string) => rateLimit(`stocks:${id}`, 60, 60_000),
  news: (id: string) => rateLimit(`news:${id}`, 30, 60_000),
} as const;

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
