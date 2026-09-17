import { NextRequest, NextResponse } from "next/server";
import { symbolSchema } from "@/lib/validation/schemas";
import { finnhubProvider } from "@/lib/finnhub";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { clientIp, rateLimitPresets } from "@/lib/utils/rate-limit";

/** Batch quotes for a small list of symbols (max 12), used by ticker/watchlist. */
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

    const settled = await Promise.allSettled(
      symbols.map((s) => finnhubProvider.getQuote(s))
    );

    const quotes = symbols.map((symbol, i) => {
      const result = settled[i];
      if (result.status === "fulfilled") {
        return { ...result.value, symbol, state: "live" as const };
      }
      return {
        symbol,
        price: null, change: null, changePercent: null, dayHigh: null,
        dayLow: null, dayOpen: null, previousClose: null, timestamp: null,
        state: "unavailable" as const,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        quotes,
        asOf: new Date().toISOString(),
      },
    });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
