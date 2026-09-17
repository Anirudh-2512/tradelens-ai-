import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/sessions";
import { getRequestId, handleApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

export async function POST() {
  const requestId = getRequestId();
  const endpoint = "POST /api/auth/logout";
  try {
    await destroySession();
    logger.info("auth.logout", endpoint, { requestId });
    return NextResponse.json({ success: true, data: { ok: true } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
