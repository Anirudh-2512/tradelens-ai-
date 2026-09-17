import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/sessions";
import { aiSummarySchema } from "@/lib/validation/schemas";
import { finnhubProvider } from "@/lib/finnhub";
import { computeRSI, computeMACD, computeBollingerBands } from "@/lib/indicators";
import { timeframeToCandleOptions } from "@/constants";
import { getFinnhubNews } from "@/lib/finnhub/news";
import { aiProvider } from "@/lib/groq/provider";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { cached, CACHE_TTL } from "@/lib/utils/cache";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";
import { getDb } from "@/lib/db/client";
import type { Candle, CandleOptions, CompanyProfile, MarketAnalysisInput, NewsArticle, Quote } from "@/types/market";

export async function POST(request: NextRequest) {
  const requestId = getRequestId();
  const endpoint = "POST /api/ai/summary";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const ip = clientIp(request);
    if (!rateLimit(`ai:${userId}`, 10, 60_000).allowed || !rateLimit(`ai:${ip}`, 30, 60_000).allowed) {
      throw errors.rateLimited();
    }

    const body = await request.json().catch(() => null);
    const parsed = aiSummarySchema.safeParse(body);
    if (!parsed.success) throw errors.invalidBody("Invalid symbol.");
    const symbol = parsed.data.symbol;

    // Assemble context strictly from real sources (spec §21, §57).
    const cacheKey = `ai:summary:${symbol}:${Math.floor(Date.now() / (5 * 60_000))}`;
    const summary = await cached(cacheKey, CACHE_TTL.quote * 30, async () => {
      const [quoteRes, profileRes, candlesRes, newsRes] = await Promise.allSettled([
        finnhubProvider.getQuote(symbol),
        finnhubProvider.getCompanyProfile(symbol),
        getCandlesSafe(symbol, timeframeToCandleOptions("3M")),
        getNewsSafe(symbol),
      ]);

      const quote: Quote | null = quoteRes.status === "fulfilled" ? quoteRes.value : null;
      if (!quote || quote.price == null) throw errors.marketDataUnavailable();

      const profile: CompanyProfile | null = profileRes.status === "fulfilled" ? profileRes.value : null;
      const candles: Candle[] = candlesRes.status === "fulfilled" ? candlesRes.value : [];

      const closes = candles.map((c) => c.close);
      const rsi = computeRSI(closes, 14);
      const macd = computeMACD(closes);
      const bb = computeBollingerBands(closes, 20, 2);

      const lastIdx = (arr: Array<number | null>) => {
        for (let i = arr.length - 1; i >= 0; i--) if (arr[i] !== null) return arr[i];
        return null;
      };

      const news: NewsArticle[] = newsRes.status === "fulfilled" ? newsRes.value : [];

      const input: MarketAnalysisInput = {
        symbol,
        companyName: profile?.name ?? undefined,
        quote,
        indicators: {
          rsi: rsi.last,
          macd: {
            macd: lastIdx(macd.macd),
            signal: lastIdx(macd.signal),
            histogram: lastIdx(macd.histogram),
          },
          bollinger: {
            upper: lastIdx(bb.upper),
            middle: lastIdx(bb.middle),
            lower: lastIdx(bb.lower),
          },
        },
        recentNews: news.slice(0, 5).map((n) => ({
          title: n.title,
          source: n.source,
          publishedAt: n.publishedAt,
        })),
        candleContext: {
          timeframe: "3M",
          trend:
            candles.length > 5
              ? closes[closes.length - 1] > closes[Math.max(0, closes.length - Math.floor(candles.length * 0.2))]
                ? "up"
                : closes[closes.length - 1] < closes[Math.max(0, closes.length - Math.floor(candles.length * 0.2))]
                  ? "down"
                  : "sideways"
              : "unknown",
          periodChangePercent:
            candles.length > 1 && candles[0].close !== 0
              ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100
              : null,
        },
      };

      return aiProvider.generateMarketSummary(input);
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (err) {
    void getDb;
    return handleApiError(err, { endpoint, requestId });
  }
}

async function getCandlesSafe(symbol: string, options: CandleOptions): Promise<Candle[]> {
  try {
    const { finnhubProvider } = await import("@/lib/finnhub");
    void finnhubProvider;
    return await (await import("@/lib/finnhub")).finnhubProvider.getCandles(symbol, options);
  } catch {
    return [];
  }
}

async function getNewsSafe(symbol: string): Promise<NewsArticle[]> {
  try {
    return await getFinnhubNews({ symbol, limit: 8 });
  } catch {
    return [];
  }
}
