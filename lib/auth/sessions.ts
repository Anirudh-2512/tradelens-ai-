import { cookies } from "next/headers";
import { query, queryOne, execute } from "@/lib/db";
import { env } from "@/lib/config/env";

export const SESSION_COOKIE = "tl_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export interface Session {
  id: string;
  userId: number;
  expiresAt: number;
}

/**
 * Sessions are opaque 128-bit+ random IDs stored server-side with expiry.
 * The database record is the single source of truth. Cookies are
 * HttpOnly + Secure (in prod) + SameSite=Lax. No auth secrets in
 * localStorage/sessionStorage (spec §10).
 */
function newSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const rand = Buffer.from(bytes).toString("base64url");
  return crypto.randomUUID().replace(/-/g, "") + rand;
}

export async function createSession(userId: number): Promise<void> {
  const id = newSessionId();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_TTL_SECONDS;

  await execute(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    [id, userId, expiresAt, now]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: env.IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const session = await queryOne<{
    id: string;
    user_id: number;
    expires_at: number;
  }>("SELECT id, user_id, expires_at FROM sessions WHERE id = ?", [id]);

  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at <= now) {
    await execute("DELETE FROM sessions WHERE id = ?", [session.id]);
    return null;
  }

  return { id: session.id, userId: session.user_id, expiresAt: session.expires_at };
}

export async function getAuthenticatedUserId(): Promise<number | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) {
    await execute("DELETE FROM sessions WHERE id = ?", [id]);
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Housekeeping: remove expired sessions. */
export async function pruneExpiredSessions(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await query("DELETE FROM sessions WHERE expires_at <= ?", [now]);
}

