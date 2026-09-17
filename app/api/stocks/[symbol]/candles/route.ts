import { NextRequest, NextResponse } from "next/server";
import { symbolSchema, timeframeSchema } from "@/lib/validation/schemas";
import { finnhubProvider } from "@/lib/finnhub";
import { timeframeToCandleOptions } from "@/constants";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { clientIp, rateLimitPresets } from "@/lib/utils/rate-limit";
import { cached, CACHE_TTL } from "@/lib/utils/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "GET /api/stocks/[symbol]/candles";
  try {
    if (!rateLimitPresets.stocks(clientIp(request)).allowed) {
      throw errors.rateLimited();
    }

    const { symbol: rawSymbol } = await params;
    const symbol = symbolSchema.safeParse(rawSymbol);
    if (!symbol.success) throw errors.badRequest("Invalid symbol.");

    const timeframe = timeframeSchema.safeParse(
      request.nextUrl.searchParams.get("tf")
    );
    if (!timeframe.success) throw errors.badRequest("Invalid timeframe.");

    const options = timeframeToCandleOptions(timeframe.data);
    const candles = await cached(
      `candles:${symbol.data}:${options.resolution}:${options.from}:${options.to}`,
      CACHE_TTL.candles,
      () => finnhubProvider.getCandles(symbol.data, options)
    );

    return NextResponse.json({ success: true, data: { candles, timeframe: timeframe.data } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
