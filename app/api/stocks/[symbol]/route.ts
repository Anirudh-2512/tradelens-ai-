import { NextRequest, NextResponse } from "next/server";
import { symbolSchema } from "@/lib/validation/schemas";
import { getQuoteShared } from "@/lib/finnhub/quote-cache";
import { finnhubProvider } from "@/lib/finnhub";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { clientIp, rateLimitPresets } from "@/lib/utils/rate-limit";
import { cached, CACHE_TTL } from "@/lib/utils/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "GET /api/stocks/[symbol]";
  try {
    if (!rateLimitPresets.stocks(clientIp(request)).allowed) {
      throw errors.rateLimited();
    }

    const { symbol: rawSymbol } = await params;
    const parsed = symbolSchema.safeParse(rawSymbol);
    if (!parsed.success) throw errors.badRequest("Invalid symbol.");
    const symbol = parsed.data;

    // Shared cross-instance cache bounds upstream usage globally.
    const { quote, fresh } = await getQuoteShared(symbol);
    const profile = await cached(
      `finnhub:profile:${symbol}`,
      CACHE_TTL.profile,
      () => finnhubProvider.getCompanyProfile(symbol)
    );

    return NextResponse.json({
      success: true,
      data: { quote, profile, priceState: fresh ? "live" : "stale" },
    });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
