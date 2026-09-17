import type {
  Candle,
  CandleOptions,
  CompanyProfile,
  MarketDataProvider,
  Quote,
  Security,
} from "@/types/market";
import { cached, CACHE_TTL } from "@/lib/utils/cache";
import { errors } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { env } from "@/lib/config/env";

const BASE = "https://finnhub.io/api/v1";

const FINNHUB_TTL = {
  profile: 6 * 60 * 60_000, // profiles are slow-moving (spec §44)
  search: CACHE_TTL.search,
};

class FinnhubError extends Error {}

/** Historical candles are premium-only on Finnhub's free plan (HTTP 403). */
const CANDLES_NOT_CONFIGURED = () => ({
  code: "CANDLES_UNAVAILABLE_ON_PLAN",
  message:
    "Historical chart data is not included in the current market-data plan. Live quotes, news and AI analysis remain available.",
});

async function finnhubRequest<T>(
  path: string,
  params: Record<string, string>,
  on403?: () => { code: string; message: string; status: number }
): Promise<T> {
  const url = new URL(`https://finnhub.io/api/v1${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-Finnhub-Token": env.FINNHUB_API_KEY },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch (err) {
    logger.error("finnhub.network_failure", `finnhub${path}`, {
      error: err instanceof Error ? err.message : String(err),
    });
    throw errors.marketDataUnavailable();
  }

  if (res.status === 429) {
    throw errors.rateLimited("Market data request limit reached. Please slow down.");
  }
  if (res.status === 403 && on403) {
    throw on403();
  }
  if (!res.ok) {
    logger.error("finnhub.http_failure", `finnhub${path}`, { status: res.status });
    throw errors.marketDataUnavailable();
  }

  return res.json() as Promise<T>;
}

// ── Quote ────────────────────────────────────────────────────

interface FinnQuote {
  c: number;
  d: number | null;
  dp: number | null;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

function normalizeQuote(symbol: string, q: FinnQuote): Quote {
  return {
    symbol,
    price: q.c ?? null,
    change: q.d ?? null,
    changePercent: q.dp ?? null,
    dayHigh: q.h ?? null,
    dayLow: q.l ?? null,
    dayOpen: q.o ?? null,
    previousClose: q.pc ?? null,
    timestamp: q.t ?? null,
  };
}

// ── Candles ──────────────────────────────────────────────────

interface FinnCandles {
  s: "ok" | "no_data";
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
}

function normalizeCandles(raw: FinnCandles): Candle[] {
  if (raw.s !== "ok" || !raw.t || !raw.c) return [];
  const out: Candle[] = [];
  for (let i = 0; i < raw.t.length; i++) {
    out.push({
      time: raw.t[i],
      open: raw.o?.[i] ?? raw.c[i],
      high: raw.h?.[i] ?? raw.c[i],
      low: raw.l?.[i] ?? raw.c[i],
      close: raw.c[i],
      volume: raw.v?.[i] ?? 0,
    });
  }
  return out;
}

// ── Search ───────────────────────────────────────────────────

interface FinnSearch {
  result: Array<{
    symbol: string;
    description: string;
    type: string | null;
    displaySymbol?: string;
    mic?: string;
  }>;
}

interface FinnProfile {
  ticker?: string;
  name?: string | null;
  exchange?: string | null;
  finnhubIndustry?: string | null;
  weburl?: string | null;
  logo?: string | null;
  country?: string | null;
  marketCapitalization?: number | null;
}

// ── Provider ─────────────────────────────────────────────────

export const finnhubProvider: MarketDataProvider = {
  async getQuote(symbol) {
    const raw = await finnhubRequest<FinnQuote>("/quote", { symbol });
    // Free tier returns {c:0} with no timestamp for unavailable symbols.
    if (!raw || (raw.c === 0 && !raw.t)) {
      throw errors.marketDataUnavailable();
    }
    return normalizeQuote(symbol, raw);
  },

  async getCandles(symbol, options: CandleOptions) {
    const raw = await finnhubRequest<FinnCandles>(
      "/stock/candle",
      {
        symbol,
        resolution: options.resolution,
        from: String(options.from),
        to: String(options.to),
      },
      () => ({ ...CANDLES_NOT_CONFIGURED(), status: 503 })
    );
    return normalizeCandles(raw);
  },

  async search(query) {
    return cached(`finnhub:search:${query.toLowerCase()}`, FINNHUB_TTL.search, async () => {
      const raw = await finnhubRequest<FinnSearch>("/search", {
        q: query,
        token_alt: "",
      });
      return (raw.result ?? []).slice(0, 12).map((r) => ({
        symbol: r.symbol,
        description: r.description,
        exchange: r.mic ?? null,
        type: r.type ?? null,
      })) satisfies Security[];
    });
  },

  async getCompanyProfile(symbol) {
    return cached(`finnhub:profile:${symbol}`, FINNHUB_TTL.profile, async () => {
      try {
        const raw = await finnhubRequest<FinnProfile>("/stock/profile2", { symbol });
        if (!raw || !raw.name) return null;
        return {
          ticker: symbol,
          name: raw.name,
          exchange: raw.exchange ?? null,
          industry: raw.finnhubIndustry ?? null,
          website: raw.weburl ?? null,
          logo: raw.logo ?? null,
          country: raw.country ?? null,
          marketCap: raw.marketCapitalization
            ? raw.marketCapitalization * 1_000_000
            : null,
        } satisfies CompanyProfile;
      } catch {
        // Profiles can legitimately 404 for some tickers — non-fatal.
        void logger;
        return null;
      }
    });
  },
};

export class FinnhubProvider {
  static default(): MarketDataProvider {
    void FinnhubError;
    return finnhubProvider;
  }
}

export { BASE as FINNHUB_BASE };
