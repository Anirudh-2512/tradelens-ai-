"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  type IChartApi,
  type CandlestickData,
  type Time,
  type UTCTimestamp,
  type ISeriesApi,
  type LineData,
} from "lightweight-charts";
import type { Candle } from "@/types/market";
import type { Timeframe } from "@/constants";
import { TIMEFRAMES } from "@/constants";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/Skeleton";
import { computeRSI, computeMACD, computeBollingerBands } from "@/lib/indicators";

interface CandlestickChartProps {
  symbol: string;
  candles: Candle[] | null;
  loading: boolean;
  error: string | null;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  showVolume?: boolean;
}


export function CandlestickChart({
  symbol,
  candles,
  loading,
  error,
  timeframe,
  onTimeframeChange,
  showVolume = true,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [showBB, setShowBB] = useState(true);
  const [ready, setReady] = useState(false);

  // Create chart once.
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8A8A8F",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: {
        vertLine: { color: "rgba(212,175,55,0.35)" },
        horzLine: { color: "rgba(212,175,55,0.35)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: timeframe === "1D" || timeframe === "5D" },
      autoSize: true,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22C55E",
      downColor: "#EF4444",
      borderUpColor: "#22C55E",
      borderDownColor: "#EF4444",
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "vol",
      priceFormat: { type: "volume" },
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    setReady(true);
    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply data without recreating the chart.
  useEffect(() => {
    if (!ready || !candleSeriesRef.current || !candles) return;

    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(data);

    if (showVolume && volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
        }))
      );
    } else if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData([]);
    }

    // Bollinger overlays
    if (candles.length >= 20 && showBB) {
      const bb = computeBollingerBands(candles.map((c) => c.close), 20, 2);
      const overlay = (values: Array<number | null>): LineData<UTCTimestamp>[] =>
        candles
          .map((c, i) => ({ time: c.time as UTCTimestamp, v: values[i] ?? null }))
          .filter((d): d is { time: UTCTimestamp; v: number } => d.v !== null)
          .map((d) => ({ time: d.time, value: d.v }));

      const middle = overlay(bb.middle);
      const upper = overlay(bb.upper);
      const lower = overlay(bb.lower);
      if (!chartRef.current) return;
      for (const [series, color] of [
        [middle, "rgba(212,175,55,0.9)"],
        [upper, "rgba(212,175,55,0.35)"],
        [lower, "rgba(212,175,55,0.35)"],
      ] as const) {
        let ws = overlaySeriesRefs.current.get(color);
        if (!ws) {
          ws = chartRef.current.addSeries(LineSeries, {
            color,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          overlaySeriesRefs.current.set(color, ws);
        }
        ws.setData(series as LineData<UTCTimestamp>[]);
      }
    } else {
      for (const ws of overlaySeriesRefs.current.values()) {
        ws.setData([]);
      }
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, ready, showBB, showVolume, timeframe]);

  const overlaySeriesRefs = useRef(new Map<string, ISeriesApi<"Line">>());  const rsiState = useMemo(() => {
    if (!candles || candles.length < 15) return null;
    const { last } = computeRSI(candles.map((c) => c.close));
    return last;
  }, [candles]);

  const macdState = useMemo(() => {
    if (!candles || candles.length < 26) return null;
    const m = computeMACD(candles.map((c) => c.close));
    const lastIdx = (arr: Array<number | null>) => {
      for (let i = arr.length - 1; i >= 0; i--) if (arr[i] !== null) return i;
      return -1;
    };
    const i = lastIdx(m.histogram);
    if (i === -1) return null;
    return { macd: m.macd[i], signal: m.signal[i], histogram: m.histogram[i] };
  }, [candles]);

  return (
    <div className="tl-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1" role="tablist" aria-label="Chart timeframe">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              role="tab"
              aria-selected={tf === timeframe}
              onClick={() => onTimeframeChange(tf)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                tf === timeframe
                  ? "bg-[var(--gold)]/15 text-[var(--gold)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
          {rsiState !== null ? (
            <span className="tl-numerical">
              RSI <span className={rsiState >= 70 ? "text-[var(--negative)]" : rsiState <= 30 ? "text-[var(--positive)]" : ""}>{rsiState.toFixed(1)}</span>
            </span>
          ) : null}
          {macdState?.histogram != null ? (
            <span className="tl-numerical">
              MACD <span className={macdState.histogram >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>{macdState.histogram.toFixed(2)}</span>
            </span>
          ) : null}
          <label className="flex cursor-pointer items-center gap-1.5 select-none">
            <input
              type="checkbox"
              checked={showBB}
              onChange={(e) => setShowBB(e.target.checked)}
              className="accent-[var(--gold)]"
            />
            BB
          </label>
        </div>
      </div>

      <div className="relative h-[360px] w-full" data-chart={symbol}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full space-y-2 px-2">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
            {error}
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0" />
        )}
      </div>
    </div>
  );
}
