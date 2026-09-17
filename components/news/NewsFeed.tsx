"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { NewsArticle } from "@/types/market";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/utils/format";

export function NewsFeed({
  symbol,
  limit = 10,
  compact = false,
}: {
  symbol?: string;
  limit?: number;
  compact?: boolean;
}) {
  const [articles, setArticles] = useState<NewsArticle[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = symbol
          ? `/api/news/${encodeURIComponent(symbol)}`
          : `/api/news`;
        const res = await fetch(url);
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setArticles(json.data.articles?.slice(0, limit) ?? []);
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
  }, [symbol, limit]);

  if (error) {
    return (
      <p className="py-6 text-center text-xs text-[var(--muted)]">
        Unable to load news right now. Please try again later.
      </p>
    );
  }

  if (articles === null) {
    return compact ? (
      <div className="space-y-3 pt-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    ) : (
      <div className="space-y-4 pt-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-[var(--muted)]">
        {symbol
          ? "No news available for this symbol."
          : "No market news available right now."}
      </p>
    );
  }

  return (
    <div className="pt-4">
      <ul className="space-y-4">
        {articles.map((a) => (
          <li key={a.id} className="group">
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3"
            >
              {a.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.imageUrl}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded-md object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-14 w-20 shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-[var(--gold)]">
                  {a.title}
                  <ExternalLink className="ml-1 inline h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                </p>
                {!compact && a.description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                    {a.description}
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  {a.source} · {formatDateTime(a.publishedAt)}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
