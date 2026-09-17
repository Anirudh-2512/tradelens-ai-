import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/sessions";
import { listWatchlists, createWatchlist } from "@/lib/watchlists/service";
import { watchlistCreateSchema } from "@/lib/validation/schemas";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { rateLimit } from "@/lib/utils/rate-limit";

export async function GET() {
  const requestId = getRequestId();
  const endpoint = "GET /api/watchlists";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const watchlists = await listWatchlists(userId);
    return NextResponse.json({ success: true, data: { watchlists } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId();
  const endpoint = "POST /api/watchlists";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();
    if (!rateLimit(`wl:${userId}`, 20, 60_000).allowed) throw errors.rateLimited();

    const body = await request.json().catch(() => null);
    const parsed = watchlistCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw errors.invalidBody(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const watchlist = await createWatchlist(userId, parsed.data.name);
    return NextResponse.json({ success: true, data: { watchlist } }, { status: 201 });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
