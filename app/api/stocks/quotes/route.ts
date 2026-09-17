import { NextRequest, NextResponse } from "next/server";
import { symbolSchema } from "@/lib/validation/schemas";
import { getQuoteShared } from "@/lib/finnhub/quote-cache";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { clientIp, rateLimitPresets } from "@/lib/utils/rate-limit";
import type { Quote } from "@/types/market";

function nullQuote(symbol: string): Quote {
  return {
    symbol,
    price: null,
    change: null,
    changePercent: null,
    dayHigh: null,
    dayLow: null,
    dayOpen: null,
    previousClose: null,
    timestamp: null,
  };
}

/** Batch quotes with a shared cross-instance cache (max 12 symbols). */
export async function GET(request: NextRequest) {
  const requestId = getRequestId();
  const endpoint = "GET /api/stocks/quotes";
  try {
    if (!rateLimitPresets.stocks(clientIp(request)).allowed) {
      throw errors.rateLimited();
    }

    const raw = request.nextUrl.searchParams.get("symbols") ?? "";
    const symbols = raw
      .split(",")
      .map((s) => symbolSchema.safeParse(s.trim()))
      .filter((r) => r.success)
      .map((r) => (r as { data: string }).data)
      .slice(0, 12);

    if (symbols.length === 0) {
      throw errors.badRequest("Provide up to 12 valid symbols (?symbols=AAPL,MSFT).");
    }

    // Shared cache: repeated widget polls collapse to a provider call only
    // when the DB row is older than QUOTE_FRESH_MS.
    const settled = await Promise.allSettled(
      symbols.map((symbol) => getQuoteShared(symbol))
    );

    const quotes = symbols.map((symbol, i) => {
      const result = settled[i];
      if (result.status === "fulfilled") {
        return {
          ...result.value.quote,
          state: result.value.fresh ? ("live" as const) : ("stale" as const),
        };
      }
      return { ...nullQuote(symbol), state: "unavailable" as const };
    });

    return NextResponse.json({
      success: true,
      data: { quotes, asOf: new Date().toISOString() },
    });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
