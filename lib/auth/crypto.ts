import { hash, verify } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";

const ARGON_OPTS = {
  memoryCost: 19_456, // 19 MiB — OWASP recommended
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON_OPTS);
}

export function verifyPassword(
  storedHash: string,
  password: string
): Promise<boolean> {
  return verify(storedHash, password).catch(() => false);
}

/** Cryptographically secure opaque token (not the stored value). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** SHA-256 hash for storing verification tokens at rest. */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
