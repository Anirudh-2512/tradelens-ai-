import type { NewsArticle, NewsOptions } from "@/types/market";
import { getFinnhubNews } from "@/lib/finnhub/news";
import { getMarketauxNews } from "@/lib/marketaux/provider";
import { getCurrentsNews } from "@/lib/currents/provider";
import { env } from "@/lib/config/env";

/**
 * Aggregated news pipeline (spec §25–26).
 * - Symbol-specific news comes from Finnhub company-news (primary).
 * - General market news merges optional providers, de-duplicating by URL.
 * - Optional providers failing or absent never break the pipeline.
 */
export async function getAggregatedNews(options: NewsOptions): Promise<NewsArticle[]> {
  const limit = options.limit ?? 20;

  const articles = await getFinnhubNews(options);
  if (options.symbol) return articles.slice(0, limit);

  const extras: NewsArticle[] = [];
  if (env.MARKETAUX_API_TOKEN()) {
    const mx = await getMarketauxNews({ ...options, category: undefined });
    extras.push(...mx);
  }
  if (env.CURRENTS_API_KEY()) {
    const cu = await getCurrentsNews(options);
    extras.push(...cu);
  }

  const seen = new Set(articles.map((a) => a.url || a.id));
  for (const a of extras) {
    if (!a.url || seen.has(a.url)) continue;
    seen.add(a.url);
    articles.push(a);
  }

  return articles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}
