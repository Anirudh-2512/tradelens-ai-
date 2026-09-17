import { queryOne, execute } from "@/lib/db";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  email_verified: number;
  created_at: number;
  updated_at: number;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
}

export async function findUserById(id: number): Promise<UserRow | null> {
  return queryOne<UserRow>("SELECT * FROM users WHERE id = ?", [id]);
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string
): Promise<UserRow> {
  const now = Math.floor(Date.now() / 1000);
  await execute(
    "INSERT INTO users (email, password_hash, name, email_verified, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)",
    [email, passwordHash, name, now, now]
  );
  const user = await findUserByEmail(email);
  if (!user) throw new Error("User creation failed");
  return user;
}

export async function markUserVerified(userId: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await execute("UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?", [
    now,
    userId,
  ]);
}

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.email_verified === 1,
    createdAt: user.created_at,
  };
}
