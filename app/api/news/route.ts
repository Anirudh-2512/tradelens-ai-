import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAggregatedNews } from "@/lib/news";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { clientIp, rateLimitPresets } from "@/lib/utils/rate-limit";

const querySchema = z.object({
  category: z.enum(["general", "forex", "crypto", "merger", "earnings"]).default("general"),
  limit: z.coerce.number().int().min(1).max(30).default(15),
});

export async function GET(request: NextRequest) {
  const requestId = getRequestId();
  const endpoint = "GET /api/news";
  try {
    if (!rateLimitPresets.news(clientIp(request)).allowed) throw errors.rateLimited();

    const qs = request.nextUrl.searchParams;
    const parsed = z.safeParse(
      querySchema,
      Object.fromEntries(
        ["category", "limit"].filter((k) => qs.get(k) !== null).map((k) => [
          k,
          qs.get(k),
        ])
      )
    );
    if (!parsed.success) throw errors.badRequest("Invalid parameters.");

    const articles = await getAggregatedNews({
      category: parsed.data.category,
      limit: parsed.data.limit,
    });
    return NextResponse.json({ success: true, data: { articles } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
