"use client";

import Link from "next/link";
import { DEFAULT_SYMBOLS } from "@/constants";
import { useMarketData } from "@/hooks/useMarketData";
import { formatCurrency, formatPercent, cn } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";

export function TrendingMarkets() {
  const { data } = useMarketData([...DEFAULT_SYMBOLS], 15_000);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {data === null
        ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        : Object.values(data).map((q) => (
            <Link
              key={q.symbol}
              href={`/dashboard/markets/${q.symbol}`}
              className="tl-card p-4 transition-colors hover:border-[var(--gold)]/40"
            >
              <div className="flex items-baseline justify-between">
                <span className="tl-numerical font-semibold">{q.symbol}</span>
                <span
                  className={cn(
                    "tl-numerical text-[11px]",
                    (q.changePercent ?? 0) >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                  )}
                >
                  {formatPercent(q.changePercent)}
                </span>
              </div>
              <p className="tl-numerical mt-2 text-xl">{formatCurrency(q.price)}</p>
              <p className="mt-1 truncate text-[10px] text-[var(--muted)]">
                {q.state === "stale" ? "Last known value" : q.price == null ? "N/A" : "Live"}
              </p>
            </Link>
          ))}
    </div>
  );
}
