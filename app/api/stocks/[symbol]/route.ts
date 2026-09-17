import { NextRequest, NextResponse } from "next/server";
import { symbolSchema } from "@/lib/validation/schemas";
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

    // Short-TTL cache protects the free provider cap under page polling.
    const quote = await cached(
      `quote:${symbol}`,
      CACHE_TTL.quote,
      () => finnhubProvider.getQuote(symbol)
    );
    const profile = await cached(
      `finnhub:profile:${symbol}`,
      CACHE_TTL.profile,
      () => finnhubProvider.getCompanyProfile(symbol)
    );

    return NextResponse.json({ success: true, data: { quote, profile } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
