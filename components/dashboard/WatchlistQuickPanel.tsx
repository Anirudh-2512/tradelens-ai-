"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatPercent, cn } from "@/lib/utils/format";

interface WatchlistSummary {
  id: number;
  name: string;
  symbols: string[];
}

export function WatchlistQuickPanel() {
  const [lists, setLists] = useState<WatchlistSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [quotes, setQuotes] = useState<Record<string, { price: number | null; changePercent: number | null; state: string }>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/watchlists");
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setLists(json.data.watchlists);
          const symbols = [
            ...new Set(json.data.watchlists.flatMap((w: WatchlistSummary) => w.symbols)),
          ].slice(0, 12);
          if (symbols.length > 0) {
            const q = await fetch(`/api/stocks/quotes?symbols=${symbols.join(",")}`);
            const qj = await q.json();
            if (cancelled) return;
            if (qj.success) {
              const map: Record<string, { price: number | null; changePercent: number | null; state: string }> = {};
              for (const item of qj.data.quotes) {
                map[item.symbol] = {
                  price: item.price,
                  changePercent: item.changePercent,
                  state: item.state,
                };
              }
              setQuotes(map);
            }
          }
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="py-6 text-center text-xs text-[var(--muted)]">Unable to load watchlists.</p>;
  }

  if (lists === null) {
    return (
      <div className="space-y-3 pt-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-[var(--muted)]">
        No watchlists yet.{" "}
        <Link href="/dashboard/watchlists" className="text-[var(--gold)] hover:underline">
          Create one
        </Link>{" "}
        to start tracking securities.
      </p>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {lists.map((w) => (
        <div key={w.id}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {w.name}
          </p>
          {w.symbols.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No symbols yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {w.symbols.map((sym) => {
                const q = quotes[sym];
                return (
                  <Link
                    key={sym}
                    href={`/dashboard/markets/${sym}`}
                    className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 transition-colors hover:border-[var(--gold)]/40"
                  >
                    <span className="tl-numerical text-sm font-semibold">{sym}</span>
                    <span className="flex flex-col items-end">
                      <span className="tl-numerical text-xs" title={q?.state === "stale" ? "Stale data" : undefined}>
                        {q?.price != null ? formatCurrency(q.price) : q?.state === "unavailable" ? "N/A" : "…"}
                      </span>
                      <span
                        className={cn(
                          "tl-numerical text-[10px]",
                          (q?.changePercent ?? 0) >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                        )}
                      >
                        {q?.changePercent != null ? formatPercent(q.changePercent) : "—"}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
