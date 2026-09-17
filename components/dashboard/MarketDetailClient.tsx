"use client";

import { useCallback, useEffect, useState } from "react";
import { CandlestickChart } from "@/components/charts/CandlestickChart";
import { PriceHeader } from "@/components/dashboard/PriceHeader";
import { NewsFeed } from "@/components/news/NewsFeed";
import { AISummaryCard } from "@/components/ai/AISummaryCard";
import { WatchlistAction } from "@/components/dashboard/WatchlistAction";
import { Card, CardHeader } from "@/components/ui/Card";
import type { Candle } from "@/types/market";
import type { Timeframe } from "@/constants";

interface CompanyProfile {
  name: string | null;
  exchange: string | null;
  industry: string | null;
  website: string | null;
}

export function MarketDetailClient({ symbol }: { symbol: string }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  const loadCandles = useCallback(async (tf: Timeframe) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/stocks/${encodeURIComponent(symbol)}/candles?tf=${tf}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Chart data unavailable");
      }
      setCandles(json.data.candles);
      if (json.data.candles.length === 0) {
        setError("No chart data available for this timeframe from the data provider.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chart data unavailable");
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    void loadCandles(timeframe);
  }, [timeframe, loadCandles]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}`);
        const json = await res.json();
        if (!cancelled && json.success && json.data.profile) {
          setProfile(json.data.profile);
        }
      } catch {
        // Profile fetch is non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PriceHeader symbol={symbol} companyName={profile?.name ?? undefined} />
        <WatchlistAction symbol={symbol} />
      </div>

      <CandlestickChart
        symbol={symbol}
        candles={candles}
        loading={loading}
        error={error}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AISummaryCard symbol={symbol} />
        <Card>
          <CardHeader title="Related news" subtitle="From market data providers" />
          <NewsFeed symbol={symbol} limit={8} />
        </Card>
      </div>

      {profile?.industry || profile?.exchange ? (
        <p className="text-[11px] text-[var(--muted)]">
          {profile.industry ? `Industry: ${profile.industry}` : ""}
          {profile.industry && profile.exchange ? " · " : ""}
          {profile.exchange ? `Exchange: ${profile.exchange}` : ""}
        </p>
      ) : null}
    </div>
  );
}
