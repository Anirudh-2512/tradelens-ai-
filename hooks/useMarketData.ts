"use client";

import { useSyncExternalStore, useState, useEffect } from "react";
import type { Quote } from "@/types/market";
import type { ConnectionState } from "@/types";

/**
 * Shared market-data service (spec §14–15).
 *
 * A single module-level store drives ALL subscribers: every dashboard
 * widget (ticker, trending grid, price header) subscribes to the same
 * poller instead of each starting its own loop. This keeps total
 * provider traffic bounded regardless of how many components are mounted.
 *
 * - Live polling with exponential backoff on failure
 * - Explicit connection state (never silently stale)
 * - Retains last known value; marks it stale rather than fabricating
 */

interface LiveQuote extends Quote {
  state: "live" | "stale" | "unavailable";
  fetchedAt: number;
}

const STALE_THRESHOLD_MS = 45_000;
const DEFAULT_INTERVAL_MS = 15_000;

interface StoreState {
  quotes: Record<string, LiveQuote>;
  connection: ConnectionState;
  lastUpdated: number | null;
  error: string | null;
}

class PollStore {
  private listeners = new Set<() => void>();
  private subs = new Set<string>();
  private state: StoreState = {
    quotes: {},
    connection: "CONNECTING",
    lastUpdated: null,
    error: null,
  };
  private timer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private inFlight = false;

  subscribe(symbols: string[], onChange: () => void): () => void {
    const key = symbols.sort().join(",");
    this.subs.add(key);
    this.listeners.add(onChange);
    this.startLoop(symbols);
    return () => {
      this.subs.delete(key);
      this.listeners.delete(onChange);
      if (this.listeners.size === 0) this.stop();
    };
  }

  getSnapshot(): StoreState {
    return this.state;
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private startLoop(symbols: string[]) {
    if (this.timer) return; // already polling
    const run = () => {
      this.timer = setTimeout(async () => {
        await this.fetchAll(symbols);
        if (this.listeners.size === 0) {
          this.timer = null;
          return;
        }
        const backoff =
          this.attempts > 0
            ? Math.min(DEFAULT_INTERVAL_MS * 2 ** Math.min(this.attempts, 4), 120_000)
            : DEFAULT_INTERVAL_MS;
        if (backoff < 120_000) run();
        else this.timer = null;
      }, 0);
    };
    run();
  }

  private stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.attempts = 0;
  }

  private async fetchAll(symbols: string[]) {
    const key = [...new Set(symbols)].sort().join(",");
    if (!key) return;
    try {
      const res = await fetch(`/api/stocks/quotes?symbols=${key}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Market data unavailable");
      }

      const next: Record<string, LiveQuote> = { ...this.state.quotes };
      const now = Date.now();
      for (const item of json.data.quotes as Array<Quote & { state: string }>) {
        const prev = this.state.quotes[item.symbol];
        if (item.state === "unavailable" && prev) {
          // retain last known value, flag stale (spec §15)
          next[item.symbol] = { ...prev, state: prev.fetchedAt + STALE_THRESHOLD_MS < now ? "stale" : prev.state };
        } else {
          next[item.symbol] = {
            ...item,
            state: item.state === "unavailable" ? "unavailable" : "live",
            fetchedAt: now,
          };
        }
      }
      this.state = {
        quotes: this.markStale(next),
        connection: "LIVE",
        lastUpdated: now,
        error: null,
      };
      this.attempts = 0;
    } catch (err) {
      this.attempts += 1;
      this.state = {
        ...this.state,
        connection:
          this.attempts <= 1
            ? "RECONNECTING"
            : this.attempts >= 4
              ? "OFFLINE"
              : this.state.connection === "OFFLINE"
                ? "OFFLINE"
                : "RECONNECTING",
        error: err instanceof Error ? err.message : "Market data error",
        quotes: this.markStale(this.state.quotes),
      };
    }
    this.emit();
  }

  private markStale(
    quotes: Record<string, LiveQuote>
  ): Record<string, LiveQuote> {
    const now = Date.now();
    const out: Record<string, LiveQuote> = {};
    for (const [sym, q] of Object.entries(quotes)) {
      out[sym] = {
        ...q,
        state:
          q.state === "unavailable"
            ? "unavailable"
            : now - q.fetchedAt > STALE_THRESHOLD_MS
              ? "stale"
              : q.state,
      };
    }
    return out;
  }

  async refresh(symbols: string[]) {
    await this.fetchAll(symbols);
  }
}

const store = new PollStore();

export function useMarketData(
  symbols: string[],
  _intervalMs = 15_000
): {
  data: Record<string, LiveQuote> | null;
  connection: ConnectionState;
  lastUpdated: number | null;
  error: string | null;
  refresh: () => Promise<void>;
} {
  void _intervalMs;
  const [key, setKey] = useState(() => symbols.sort().join(","));
  const snapshot = useSyncExternalStore(
    (cb) => store.subscribe(symbols, cb),
    () => store.getSnapshot(),
    () => null
  );

  // Re-subscribe when the symbol set changes identity.
  useEffect(() => {
    const k = symbols.sort().join(",");
    if (k !== key) setKey(k);
  }, [symbols, key]);

  function mapData(s: StoreState | null): Record<string, LiveQuote> | null {
    if (s === null) return null;
    const entries = key.split(",").filter(Boolean);
    if (entries.length === 0) return null;
    if (!(entries[0] in s.quotes)) return null;
    const out: Record<string, LiveQuote> = {};
    for (const sym of entries) {
      if (s.quotes[sym]) out[sym] = s.quotes[sym];
    }
    return out;
  }

  const data = key ? mapData(snapshot) : null;

  return {
    data: key ? (data ?? null) : null,
    connection: snapshot?.connection ?? "CONNECTING",
    lastUpdated: snapshot?.lastUpdated ?? null,
    error: snapshot?.error ?? null,
    refresh: () => store.refresh(symbols),
  };
}

