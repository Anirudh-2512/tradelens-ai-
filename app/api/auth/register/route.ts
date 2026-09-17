import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/schemas";
import { createUser, findUserByEmail, toPublicUser } from "@/lib/auth/users";
import { hashPassword } from "@/lib/auth/crypto";
import { createSession, pruneExpiredSessions } from "@/lib/auth/sessions";
import { clientIp, rateLimitPresets } from "@/lib/utils/rate-limit";
import { getRequestId, handleApiError, errors } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  const requestId = getRequestId();
  const endpoint = "POST /api/auth/register";
  try {
    const ip = clientIp(request);
    if (!rateLimitPresets.auth(ip).allowed) {
      throw errors.rateLimited("Too many registration attempts. Try again shortly.");
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Invalid input";
      throw errors.invalidBody(first);
    }

    const { email, password, name } = parsed.data;

    const existing = await findUserByEmail(email);
    if (existing) {
      throw errors.badRequest("An account with this email already exists.");
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash, name);

    await createSession(user.id);
    await pruneExpiredSessions();

    logger.info("auth.register", endpoint, { requestId });

    return NextResponse.json(
      { success: true, data: { user: toPublicUser(user) } },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
