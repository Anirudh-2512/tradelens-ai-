import { NextRequest, NextResponse } from "next/server";
import { searchQuerySchema } from "@/lib/validation/schemas";
import { finnhubProvider } from "@/lib/finnhub";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { clientIp, rateLimitPresets } from "@/lib/utils/rate-limit";

export async function GET(request: NextRequest) {
  const requestId = getRequestId();
  const endpoint = "GET /api/stocks/search";
  try {
    if (!rateLimitPresets.stocks(clientIp(request)).allowed) {
      throw errors.rateLimited();
    }

    const q = request.nextUrl.searchParams.get("q");
    const parsed = searchQuerySchema.safeParse({ q });
    if (!parsed.success) throw errors.badRequest("Provide a search query (?q=).");

    const results = await finnhubProvider.search(parsed.data.q);
    return NextResponse.json({ success: true, data: { results } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
