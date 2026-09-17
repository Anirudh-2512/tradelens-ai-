import { getDb } from "./client";
import { logger } from "@/lib/utils/logger";

/** Thin typed helpers over @libsql/client used by repository modules. */

export async function query<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await getDb().execute(sql, params as never);
  return res.rows as unknown as T[];
}

export async function queryOne<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  await getDb().execute(sql, params as never);
}

export async function executeReturning(
  sql: string,
  params: unknown[] = []
): Promise<number | null> {
  const res = await getDb().execute(sql, params as never);
  return res.lastInsertRowid ? Number(res.lastInsertRowid) : null;
}

export function logDbFailure(endpoint: string, err: unknown, requestId?: string) {
  logger.error("db.failure", endpoint, {
    requestId,
    error: err instanceof Error ? err.message : String(err),
  });
}
