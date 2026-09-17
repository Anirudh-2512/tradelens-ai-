"use client";

import { TransactionRow } from "@/types/db";
import { formatCurrency, formatNumber, formatDateTime, cn } from "@/lib/utils/format";

export function TransactionsTable({ transactions }: { transactions: TransactionRow[] }) {
  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-[var(--muted)]">
        No transactions recorded yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto pt-4">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
            <th className="pb-2 pr-3 font-medium">Executed</th>
            <th className="pb-2 pr-3 font-medium">Type</th>
            <th className="pb-2 pr-3 font-medium">Symbol</th>
            <th className="pb-2 pr-3 text-right font-medium">Qty</th>
            <th className="pb-2 pr-3 text-right font-medium">Price</th>
            <th className="pb-2 text-right font-medium">Fees</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {transactions.map((t) => (
            <tr key={t.id}>
              <td className="py-2.5 pr-3 text-xs text-[var(--muted)]">{formatDateTime(t.executed_at * 1000)}</td>
              <td
                className={cn(
                  "py-2.5 pr-3 text-xs font-semibold uppercase",
                  t.type === "buy" ? "text-[var(--positive)]" : "text-[var(--negative)]"
                )}
              >
                {t.type}
              </td>
              <td className="tl-numerical py-2.5 pr-3 font-semibold">{t.symbol}</td>
              <td className="tl-numerical py-2.5 pr-3 text-right">{formatNumber(t.quantity, 4)}</td>
              <td className="tl-numerical py-2.5 pr-3 text-right">{formatCurrency(t.price)}</td>
              <td className="tl-numerical py-2.5 text-right text-[var(--muted)]">{formatCurrency(t.fees)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
