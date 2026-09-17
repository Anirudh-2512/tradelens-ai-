"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, TriangleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { AI_DISCLAIMER } from "@/constants";
import type { MarketSummary } from "@/types/market";

export function AISummaryCard({ symbol }: { symbol: string }) {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? "AI analysis unavailable");
      }
      setSummary(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis unavailable");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
            AI market intelligence · {symbol}
          </span>
        }
        subtitle="Generated strictly from current market context"
      />
      <div className="pt-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <TriangleAlert className="h-5 w-5 text-[var(--warning)]" />
            <p className="text-xs text-[var(--muted)]">{error}. AI generation is rate-limited — retry shortly.</p>
            <button onClick={() => void load()} className="text-xs text-[var(--gold)] hover:underline">
              Retry
            </button>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                tone={
                  summary.sentiment === "bullish"
                    ? "positive"
                    : summary.sentiment === "bearish"
                      ? "negative"
                      : "warning"
                }
              >
                AI sentiment: {summary.sentiment}
              </Badge>
              <span className="text-[11px] text-[var(--muted)]">
                AI confidence: {summary.confidence} (not a statistical probability)
              </span>
            </div>
            <p className="text-sm leading-relaxed">{summary.summary}</p>
            {summary.keyFactors.length > 0 ? (
              <Section title="Key factors" items={summary.keyFactors} gold />
            ) : null}
            {summary.technicalContext.length > 0 ? (
              <Section title="Technical context" items={summary.technicalContext} />
            ) : null}
            {summary.risks.length > 0 ? (
              <Section title="Risk factors" items={summary.risks} danger />
            ) : null}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-[var(--muted)]">No analysis available.</p>
        )}

        <p className="mt-4 border-t border-[var(--border)] pt-3 text-[10px] leading-relaxed text-[var(--muted)]">
          {AI_DISCLAIMER}
        </p>
      </div>
    </Card>
  );
}

function Section({
  title,
  items,
  gold = false,
  danger = false,
}: {
  title: string;
  items: string[];
  gold?: boolean;
  danger?: boolean;
}) {
  return (
    <div>
      <h4 className="mb-2 text-[11px] uppercase tracking-wider text-[var(--muted)]">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-snug">
            <span
              className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${
                danger
                  ? "bg-[var(--negative)]"
                  : gold
                    ? "bg-[var(--gold)]"
                    : "bg-[var(--muted)]"
              }`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
