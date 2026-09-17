import { NextRequest, NextResponse } from "next/server";
import { symbolSchema } from "@/lib/validation/schemas";
import { getAggregatedNews } from "@/lib/news";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { clientIp, rateLimitPresets } from "@/lib/utils/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "GET /api/news/[symbol]";
  try {
    if (!rateLimitPresets.news(clientIp(request)).allowed) throw errors.rateLimited();

    const { symbol: raw } = await params;
    const parsed = symbolSchema.safeParse(raw);
    if (!parsed.success) throw errors.badRequest("Invalid symbol.");

    const articles = await getAggregatedNews({ symbol: parsed.data, limit: 20 });
    return NextResponse.json({ success: true, data: { articles } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
