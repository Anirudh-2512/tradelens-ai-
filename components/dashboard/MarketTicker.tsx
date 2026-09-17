"use client";

import Link from "next/link";
import { useMarketData } from "@/hooks/useMarketData";
import { ConnectionStateBadge } from "@/components/dashboard/ConnectionStateBadge";
import { formatCurrency, formatPercent, cn } from "@/lib/utils/format";
import { DEFAULT_SYMBOLS } from "@/constants";
import { Skeleton } from "@/components/ui/Skeleton";

export function MarketTicker() {
  const { data, connection, lastUpdated } = useMarketData([...DEFAULT_SYMBOLS], 12_000);

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      <ConnectionStateBadge connection={connection} asOf={lastUpdated} />
      {data === null ? (
        <div className="flex gap-4">
          {DEFAULT_SYMBOLS.map((s) => (
            <Skeleton key={s} className="h-10 w-24 shrink-0" />
          ))}
        </div>
      ) : (
        Object.values(data).map((q) => (
          <Link
            key={q.symbol}
            href={`/dashboard/markets/${q.symbol}`}
            onClick={() => void 0}
            className="group flex shrink-0 items-baseline gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 transition-colors hover:border-[var(--gold)]/40"
            title={q.state === "stale" ? "Stale — last known value" : undefined}
          >
            <span className="tl-numerical text-xs font-semibold">{q.symbol}</span>
            <span
              className={cn(
                "tl-numerical text-xs",
                q.price == null ? "text-[var(--muted)]" :
                (q.change ?? 0) >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
              )}
            >
              {q.price == null
                ? "N/A"
                : formatCurrency(q.price)}
            </span>
            <span
              className={cn(
                "tl-numerical hidden text-[10px] sm:inline",
                (q.changePercent ?? 0) >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
              )}
            >
              {formatPercent(q.changePercent)}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
