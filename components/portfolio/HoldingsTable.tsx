"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils/format";
import type { HoldingView } from "@/types";

export function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value?: string | null;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p
        className={cn(
          "tl-numerical mt-2 text-xl font-semibold",
          tone === "positive" && "text-[var(--positive)]",
          tone === "negative" && "text-[var(--negative)]"
        )}
      >
        {value ?? "N/A"}
      </p>
    </div>
  );
}

export function HoldingsTable({
  holdings,
  currency,
  onRemove,
}: {
  holdings: HoldingView[];
  currency: string;
  onRemove: (holdingId: number) => Promise<void>;
}) {
  void currency;
  if (holdings.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-[var(--muted)]">
        No holdings yet. Record a buy transaction to start tracking a position.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pt-4">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
            <th className="pb-2 pr-3 font-medium">Symbol</th>
            <th className="pb-2 pr-3 text-right font-medium">Qty</th>
            <th className="pb-2 pr-3 text-right font-medium">Avg price</th>
            <th className="pb-2 pr-3 text-right font-medium">Price</th>
            <th className="pb-2 pr-3 text-right font-medium">Value</th>
            <th className="pb-2 pr-3 text-right font-medium">Unrealized P/L</th>
            <th className="pb-2 pr-3 text-right font-medium">Allocation %</th>
            <th className="pb-2 font-medium"><span className="sr-only">Remove</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {holdings.map((h) => (
            <tr key={h.id} className="align-middle">
              <td className="py-2.5 pr-3">
                <Link
                  href={`/dashboard/markets/${h.symbol}`}
                  className="tl-numerical font-semibold hover:text-[var(--gold)]"
                >
                  {h.symbol}
                </Link>
              </td>
              <td className="tl-numerical py-2.5 pr-3 text-right">{formatNumber(h.quantity, 4)}</td>
              <td className="tl-numerical py-2.5 pr-3 text-right">{formatCurrency(h.averagePrice)}</td>
              <td className="tl-numerical py-2.5 pr-3 text-right" title={h.priceState === "stale" ? "Stale" : undefined}>
                {h.priceState === "unavailable" ? (
                  <span className="text-[var(--muted)]">N/A</span>
                ) : (
                  formatCurrency(h.currentPrice)
                )}
              </td>
              <td className="tl-numerical py-2.5 pr-3 text-right">
                {h.currentValue != null ? formatCurrency(h.currentValue) : "N/A"}
              </td>
              <td
                className={cn(
                  "tl-numerical py-2.5 pr-3 text-right",
                  h.unrealizedPL == null
                    ? "text-[var(--muted)]"
                    : h.unrealizedPL >= 0
                      ? "text-[var(--positive)]"
                      : "text-[var(--negative)]"
                )}
              >
                {h.unrealizedPL != null
                  ? `${h.unrealizedPL >= 0 ? "+" : "−"}${formatCurrency(Math.abs(h.unrealizedPL))} (${formatPercent(h.unrealizedPLPercent)})`
                  : "N/A"}
              </td>
              <td className="tl-numerical py-2.5 pr-3 text-right">
                {h.allocationPercent != null ? `${h.allocationPercent.toFixed(1)}%` : "N/A"}
              </td>
              <td className="py-2.5">
                <button
                  onClick={() => onRemove(h.id)}
                  aria-label={`Remove ${h.symbol}`}
                  className="rounded p-1.5 text-[var(--muted)] transition-colors hover:text-[var(--negative)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
