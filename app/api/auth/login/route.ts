import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/schemas";
import { findUserByEmail, toPublicUser } from "@/lib/auth/users";
import { verifyPassword } from "@/lib/auth/crypto";
import { createSession, pruneExpiredSessions } from "@/lib/auth/sessions";
import { clientIp, rateLimitPresets } from "@/lib/utils/rate-limit";
import { getRequestId, handleApiError, errors } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  const requestId = getRequestId();
  const endpoint = "POST /api/auth/login";
  try {
    const ip = clientIp(request);
    if (!rateLimitPresets.auth(ip).allowed) {
      throw errors.rateLimited("Too many sign-in attempts. Try again in a few minutes.");
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Invalid input";
      throw errors.invalidBody(first);
    }

    const { email, password } = parsed.data;
    const user = await findUserByEmail(email);

    // Uniform error for unknown user / bad password (no user enumeration).
    if (!user || !(await verifyPassword(user.password_hash, password))) {
      logger.warn("auth.login_failed", endpoint, { requestId });
      throw errors.badRequest("Invalid email or password.");
    }

    await createSession(user.id);
    await pruneExpiredSessions();

    logger.info("auth.login", endpoint, { requestId });
    return NextResponse.json({ success: true, data: { user: toPublicUser(user) } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
