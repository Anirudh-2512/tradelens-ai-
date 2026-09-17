"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { Security } from "@/types/market";

export function StockSearch({ placeholder = "Search securities…" }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Security[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (cancelled) return;
        setResults(json.success ? json.data.results : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(symbol: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(`/dashboard/markets/${encodeURIComponent(symbol)}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          ref={inputRef}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          className="pl-9"
          aria-label="Search securities"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 animate-spin text-[var(--muted)]" />
        ) : null}
      </div>

      {open && query.trim() ? (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] shadow-2xl">
          {loading && !results ? (
            <p className="p-4 text-center text-xs text-[var(--muted)]">Searching…</p>
          ) : results?.length === 0 ? (
            <p className="p-4 text-center text-xs text-[var(--muted)]">
              No securities found. Check the symbol and try again.
            </p>
          ) : (
            results?.map((s) => (
              <button
                key={s.symbol}
                onClick={() => go(s.symbol)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-white/5"
              >
                <span className="tl-numerical text-sm font-semibold">{s.symbol}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-[var(--muted)]">
                  {s.description}
                </span>
                {s.exchange ? (
                  <span className="shrink-0 text-[10px] uppercase text-[var(--muted)]">
                    {s.exchange}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
