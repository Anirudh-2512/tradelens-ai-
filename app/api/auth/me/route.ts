import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/sessions";
import { findUserById, toPublicUser } from "@/lib/auth/users";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";

export async function GET() {
  const requestId = getRequestId();
  const endpoint = "GET /api/auth/me";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const user = await findUserById(userId);
    if (!user) throw errors.unauthorized();

    return NextResponse.json({ success: true, data: { user: toPublicUser(user) } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
