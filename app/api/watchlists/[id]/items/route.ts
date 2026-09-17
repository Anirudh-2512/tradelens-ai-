import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/sessions";
import {
  assertOwnedWatchlist,
  addSymbol,
  removeSymbol,
} from "@/lib/watchlists/service";
import { idSchema, watchlistItemSchema } from "@/lib/validation/schemas";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "POST /api/watchlists/[id]/items";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const { id } = await params;
    const watchlistId = idSchema.safeParse(id);
    if (!watchlistId.success) throw errors.badRequest("Invalid watchlist id.");

    const owned = await assertOwnedWatchlist(userId, watchlistId.data);
    if (!owned) throw errors.forbidden();

    const body = await request.json().catch(() => null);
    const parsed = watchlistItemSchema.safeParse(body);
    if (!parsed.success) throw errors.invalidBody("Invalid symbol.");

    const existed = owned;
    void existed;
    await addSymbol(watchlistId.data, parsed.data.symbol);
    return NextResponse.json({ success: true, data: { ok: true } }, { status: 201 });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "DELETE /api/watchlists/[id]/items";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const { id } = await params;
    const watchlistId = idSchema.safeParse(id);
    if (!watchlistId.success) throw errors.badRequest("Invalid watchlist id.");

    const owned = await assertOwnedWatchlist(userId, watchlistId.data);
    if (!owned) throw errors.forbidden();

    const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
    const parsed = watchlistItemSchema.safeParse({ symbol });
    if (!parsed.success) throw errors.badRequest("Invalid symbol.");

    await removeSymbol(watchlistId.data, parsed.data.symbol);
    return NextResponse.json({ success: true, data: { ok: true } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
