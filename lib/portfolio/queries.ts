import type { HoldingRow, PortfolioRow, TransactionRow } from "@/types/db";
import { query, queryOne, execute, executeReturning } from "@/lib/db";

export async function listPortfolios(userId: number): Promise<PortfolioRow[]> {
  return query<PortfolioRow>(
    "SELECT id, name, base_currency, created_at FROM portfolios WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
}

export async function assertOwnedPortfolio(
  userId: number,
  portfolioId: number
): Promise<PortfolioRow | null> {
  return queryOne<PortfolioRow>(
    "SELECT id, name, base_currency, created_at FROM portfolios WHERE id = ? AND user_id = ?",
    [portfolioId, userId]
  );
}

export async function createPortfolio(
  userId: number,
  name: string,
  baseCurrency = "USD"
): Promise<PortfolioRow> {
  const now = Math.floor(Date.now() / 1000);
  const id = await executeReturning(
    "INSERT INTO portfolios (user_id, name, base_currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    [userId, name, baseCurrency, now, now]
  );
  return { id: Number(id), name, base_currency: baseCurrency, created_at: now };
}

export async function renamePortfolio(portfolioId: number, name: string) {
  const now = Math.floor(Date.now() / 1000);
  await execute("UPDATE portfolios SET name = ?, updated_at = ? WHERE id = ?", [
    name,
    now,
    portfolioId,
  ]);
}

export async function deletePortfolio(portfolioId: number) {
  await execute("DELETE FROM portfolios WHERE id = ?", [portfolioId]);
}

export async function listHoldings(portfolioId: number): Promise<HoldingRow[]> {
  return query<HoldingRow>(
    "SELECT id, portfolio_id, symbol, quantity, average_price FROM holdings WHERE portfolio_id = ?",
    [portfolioId]
  );
}

export async function upsertHolding(
  portfolioId: number,
  symbol: string,
  type: "buy" | "sell",
  quantity: number,
  price: number,
  fees: number,
  executedAt: number
): Promise<{ error?: string }> {
  const existing = await queryOne<HoldingRow>(
    "SELECT id, quantity, average_price FROM holdings WHERE portfolio_id = ? AND symbol = ?",
    [portfolioId, symbol]
  );

  await executeReturning(
    "INSERT INTO transactions (portfolio_id, symbol, type, quantity, price, fees, executed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [portfolioId, symbol, type, quantity, price, fees, executedAt, Math.floor(Date.now() / 1000)]
  );

  if (type === "buy") {
    if (!existing) {
      const totalCost = quantity * price + fees;
      const avg = totalCost / quantity;
      const now = Math.floor(Date.now() / 1000);
      await execute(
        "INSERT INTO holdings (portfolio_id, symbol, quantity, average_price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [portfolioId, symbol, quantity, avg, now, now]
      );
    } else {
      const newQuantity = existing.quantity + quantity;
      const oldCost = existing.quantity * existing.average_price;
      const totalCost = oldCost + quantity * price + fees;
      const avg = totalCost / newQuantity;
      const now = Math.floor(Date.now() / 1000);
      await execute(
        "UPDATE holdings SET quantity = ?, average_price = ?, updated_at = ? WHERE id = ?",
        [newQuantity, avg, now, existing.id]
      );
    }
    return {};
  }

  // SELL
  if (!existing) return { error: "No holding exists for this symbol to sell." };
  if (quantity > existing.quantity) {
    return { error: `Cannot sell more than held (${existing.quantity}).` };
  }

  const remainingQty = Math.max(0, existing.quantity - quantity);
  const now = Math.floor(Date.now() / 1000);
  if (remainingQty === 0) {
    await execute("DELETE FROM holdings WHERE id = ?", [existing.id]);
  } else {
    // Average cost basis is unchanged on sell.
    await execute("UPDATE holdings SET quantity = ?, updated_at = ? WHERE id = ?", [
      remainingQty,
      now,
      existing.id,
    ]);
  }
  return {};
}

export async function deleteHolding(
  portfolioId: number,
  holdingId: number
): Promise<boolean> {
  const res = await queryOne<HoldingRow>(
    "SELECT id FROM holdings WHERE id = ? AND portfolio_id = ?",
    [holdingId, portfolioId]
  );
  if (!res) return false;
  await execute("DELETE FROM holdings WHERE id = ?", [holdingId]);
  return true;
}

export async function listTransactions(
  portfolioId: number,
  limit = 50
): Promise<TransactionRow[]> {
  return query<TransactionRow>(
    "SELECT id, symbol, type, quantity, price, fees, executed_at FROM transactions WHERE portfolio_id = ? ORDER BY executed_at DESC LIMIT ?",
    [portfolioId, limit]
  );
}
