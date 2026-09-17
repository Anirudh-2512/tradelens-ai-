import type { NewsArticle, NewsCategory, NewsOptions, NewsProvider } from "@/types/market";
import { cached, CACHE_TTL } from "@/lib/utils/cache";
import { logger } from "@/lib/utils/logger";

interface FinnhubNewsItem {
  category?: string;
  datetime?: number;
  headline?: string;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
  id?: number;
}

/**
 * Finnhub market news provider (spec §25).
 * Normalizes into NewsArticle so the UI never depends on provider shape (§26).
 */
export class FinnhubNewsProvider implements NewsProvider {
  readonly name = "finnhub";

  async getNews(options: NewsOptions): Promise<NewsArticle[]> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) throw new Error("FINNHUB_API_KEY missing");

    const category: NewsCategory = options.category ?? options.symbol ? ("general" as NewsCategory) : "general";
    void category;

    const params = new URLSearchParams({ token: apiKey });
    if (options.symbol) {
      params.set("symbol", options.symbol);
      const data = await fetch(
        `https://finnhub.io/api/v1/company-news?${params.toString()}${dateParams(options)}`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (!data.ok) {
        logger.error("finnhub.news_http", "company-news", { status: data.status });
        return [];
      }
      const items = (await data.json()) as FinnhubNewsItem[];
      return items.slice(0, options.limit ?? 20).map(mapArticle);
    }

    const data = await fetch(`https://finnhub.io/api/v1/news?category=${options.category ?? "general"}&token=${apiKey}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!data.ok) {
      logger.error("finnhub.news_http", "news", { status: data.status });
      return [];
    }
    const items = (await data.json()) as FinnhubNewsItem[];
    return items.slice(0, options.limit ?? 20).map(mapArticle);
  }
}

function dateParams(options: NewsOptions): string {
  const to = options.to ?? new Date().toISOString().slice(0, 10);
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const from = options.from ?? d.toISOString().slice(0, 10);
  return `&from=${from}&to=${to}`;
}

function mapArticle(item: FinnhubNewsItem, index: number): NewsArticle {
  return {
    id: item.id != null ? `fh-${item.id}` : `fh-${item.headline?.slice(0, 24) ?? index}`,
    title: item.headline ?? "(untitled)",
    description: item.summary || undefined,
    source: item.source || "Finnhub",
    url: item.url ?? "",
    imageUrl: item.image || undefined,
    publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString(),
  };
}

export function getFinnhubNews(options: NewsOptions): Promise<NewsArticle[]> {
  const provider = new FinnhubNewsProvider();
  const key = `news:${provider.name}:${options.symbol ?? options.category ?? "general"}`;
  return cached(key, CACHE_TTL.news, () => provider.getNews(options));
}
