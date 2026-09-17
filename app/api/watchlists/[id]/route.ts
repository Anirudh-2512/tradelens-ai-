import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/sessions";
import {
  assertOwnedWatchlist,
  renameWatchlist,
  deleteWatchlist,
} from "@/lib/watchlists/service";
import { watchlistPatchSchema, idSchema } from "@/lib/validation/schemas";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { logDbFailure } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "PATCH /api/watchlists/[id]";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const { id } = await params;
    const watchlistId = idSchema.safeParse(id);
    if (!watchlistId.success) throw errors.badRequest("Invalid watchlist id.");

    const body = await request.json().catch(() => null);
    const parsed = watchlistPatchSchema.safeParse(body);
    if (!parsed.success) throw errors.invalidBody("Invalid name.");

    // Ownership check (spec §43): WHERE id = ? AND user_id = ?
    const owned = await assertOwnedWatchlist(userId, watchlistId.data);
    if (!owned) throw errors.forbidden();

    await renameWatchlist(watchlistId.data, parsed.data.name);
    return NextResponse.json({ success: true, data: { ok: true } });
  } catch (err) {
    logDbFailure(endpoint, err, requestId);
    return handleApiError(err, { endpoint, requestId });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "DELETE /api/watchlists/[id]";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const { id } = await params;
    const watchlistId = idSchema.safeParse(id);
    if (!watchlistId.success) throw errors.badRequest("Invalid watchlist id.");

    const owned = await assertOwnedWatchlist(userId, watchlistId.data);
    if (!owned) throw errors.forbidden();

    await deleteWatchlist(watchlistId.data);
    return NextResponse.json({ success: true, data: { ok: true } });
  } catch (err) {
    logDbFailure(endpoint, err, requestId);
    return handleApiError(err, { endpoint, requestId });
  }
}
