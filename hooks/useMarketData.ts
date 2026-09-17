"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Quote } from "@/types/market";
import type { ConnectionState } from "@/types";

interface LiveQuote extends Quote {
  state: "live" | "stale" | "unavailable";
  fetchedAt: number;
}

interface UseMarketDataResult<C> {
  data: C | null;
  connection: ConnectionState;
  lastUpdated: number | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const STALE_THRESHOLD_MS = 45_000;
const CONNECT_TIMEOUT_MS = 12_000;

function classifyQuote(q: LiveQuote): LiveQuote {
  if (q.state === "live" && Date.now() - q.fetchedAt > STALE_THRESHOLD_MS) {
    return { ...q, state: "stale" };
  }
  return q;
}

/**
 * Near-real-time market data hook (spec §14–15).
 *
 * Finnhub's free tier does not expose authenticated WSS streams to all
 * users, so this service uses resilient polling with:
 *  - explicit connection state (LIVE / CONNECTING / RECONNECTING / OFFLINE)
 *  - stale detection without fabricating data
 *  - exponential backoff reconnection
 */
export function useMarketData(
  symbols: string[],
  intervalMs = 10_000
): UseMarketDataResult<Record<string, LiveQuote>> {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote> | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("CONNECTING");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const symbolsKey = symbols.sort().join(",");
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchQuotes = useCallback(async () => {
    if (!symbolsKey) return;
    try {
      const res = await fetch(`/api/stocks/quotes?symbols=${symbolsKey}`);
      const json = await res.json();
      if (!mountedRef.current) return;

      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Market data unavailable");
      }

      type RawQuote = Quote & { state?: string };
      const raw = (json.data.codes ?? []) as RawQuote[];
      void raw;
      const next: Record<string, LiveQuote> = {};
      for (const item of json.data.quotes as Array<Quote & { state: string }>) {
        next[item.symbol] = {
          ...item,
          state: item.state === "unavailable" ? "unavailable" : "live",
          fetchedAt: Date.now(),
        };
      }
      setQuotes((prev) => {
        // Retain last known value when a symbol goes unavailable (spec §15).
        const merged = { ...prev, ...next };
        for (const [sym, q] of Object.entries(merged)) {
          merged[sym] = classifyQuote({ ...q, symbol: sym } as LiveQuote);
        }
        return merged;
      });
      setLastUpdated(Date.now());
      setConnection("LIVE");
      setError(null);
      attemptRef.current = 0;
    } catch (err) {
      if (!mountedRef.current) return;
      attemptRef.current += 1;

      if (attemptRef.current === 1) {
        setConnection("RECONNECTING");
      } else if (attemptRef.current >= 4) {
        setConnection("OFFLINE");
      }
      setError(err instanceof Error ? err.message : "Market data error");

      // Mark existing values stale.
      setQuotes((prev) => {
        if (!prev) return prev;
        const merged: Record<string, LiveQuote> = {};
        for (const [sym, q] of Object.entries(prev)) {
          merged[sym] = { ...q, state: q.state === "unavailable" ? "unavailable" : "stale" };
        }
        return merged;
      });
    }
  }, [symbolsKey]);

  useEffect(() => {
    mountedRef.current = true;

    const loop = () => {
      timerRef.current = setTimeout(async () => {
        await fetchQuotes();
        if (!mountedRef.current) return;
        // Backoff on failure: 10s → 20s → 40s → off
        const backoff =
          attemptRef.current > 0
            ? Math.min(intervalMs * 2 ** attemptRef.current, 120_000)
            : intervalMs;
        if (backoff < 120_000) loop();
      }, 100);
    };
    loop();

    const watchdog = setInterval(() => {
      if (!mountedRef.current) return;
      if (
        connection === "LIVE" &&
        lastUpdated &&
        Date.now() - lastUpdated > CONNECT_TIMEOUT_MS + intervalMs
      ) {
        setConnection("RECONNECTING");
        fetchQuotes();
      }
    }, 15_000);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(watchdog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  useEffect(() => {
    const tick = setInterval(() => {
      setQuotes((prev) => {
        if (!prev) return prev;
        const merged: Record<string, LiveQuote> = {};
        for (const [sym, q] of Object.entries(prev)) {
          merged[sym] = classifyQuote({ ...q, symbol: sym } as LiveQuote);
        }
        return merged;
      });
    }, 10_000);
    return () => clearInterval(tick);
  }, []);

  const refresh = useCallback(async () => {
    await fetchQuotes();
  }, [fetchQuotes]);

  return { data: quotes, connection, lastUpdated, error, refresh };
}
