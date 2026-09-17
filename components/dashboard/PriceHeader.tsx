"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { ConnectionStateBadge } from "@/components/dashboard/ConnectionStateBadge";
import { formatCurrency, formatPercent, cn } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";

export function PriceHeader({
  symbol,
  companyName,
}: {
  symbol: string;
  companyName?: string;
}) {
  const { data, connection, lastUpdated, refresh } = useMarketData([symbol], 10_000);
  const q = data?.[symbol];

  return (
    <div className="tl-card flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="tl-numerical text-2xl font-bold">{symbol}</h1>
        </div>
        {companyName ? (
          <p className="mt-0.5 text-xs text-[var(--muted)]">{companyName}</p>
        ) : null}
        <div className="mt-3 flex items-center gap-3">
          <ConnectionStateBadge connection={connection} asOf={lastUpdated} />
          <button
            onClick={() => void refresh()}
            className="text-[11px] text-[var(--muted)] underline-offset-2 hover:text-[var(--gold)] hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="text-right">
        {q === undefined || q.price == null ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <>
            <p className="tl-numerical text-3xl font-semibold">
              {formatCurrency(q.price)}
            </p>
            <p
              className={cn(
                "tl-numerical mt-1 text-sm",
                (q.change ?? 0) >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
              )}
            >
              {formatCurrency(q.change)} ({formatPercent(q.changePercent)}){" "}
              <span className="text-[10px] text-[var(--muted)]">today</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
