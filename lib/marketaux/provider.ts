import type { NewsArticle, NewsOptions, NewsProvider } from "@/types/market";
import { cached, CACHE_TTL } from "@/lib/utils/cache";
import { logger } from "@/lib/utils/logger";

interface MarketauxArticle {
  uuid?: string;
  title?: string;
  description?: string;
  url?: string;
  image_url?: string;
  published_at?: string;
  source?: string;
  entities?: Array<{ symbol?: string }>;
}

/** Optional provider — inactive when MARKETAUX_API_TOKEN is unset. */
export class MarketauxNewsProvider implements NewsProvider {
  readonly name = "marketaux";
  private token: string | undefined;

  constructor(token?: string) {
    this.token = token ?? process.env.MARKETAUX_API_TOKEN;
  }

  available(): boolean {
    return Boolean(this.token);
  }

  async getNews(options: NewsOptions): Promise<NewsArticle[]> {
    if (!this.available()) return [];
    try {
      const params = new URLSearchParams({
        api_token: this.token!,
        limit: String(options.limit ?? 20),
      });
      if (options.symbol) params.set("symbols", options.symbol);

      const res = await fetch(`https://api.marketaux.com/v1/news/all?${params}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        logger.error("marketaux.http_failure", "getNews", { status: res.status });
        return [];
      }
      const json = (await res.json()) as { data?: MarketauxArticle[] };
      return (json.data ?? []).map(mapArticle);
    } catch (err) {
      logger.error("marketaux.failure", "getNews", { error: String(err) });
      return [];
    }
  }
}

function mapArticle(a: MarketauxArticle, i: number): NewsArticle {
  return {
    id: a.uuid ?? `mx-${i}`,
    title: a.title ?? "(untitled)",
    description: a.description || undefined,
    source: a.source || "Marketaux",
    url: a.url ?? "",
    imageUrl: a.image_url || undefined,
    publishedAt: a.published_at ?? new Date().toISOString(),
    symbol: a.entities?.find((e) => e.symbol)?.symbol,
  };
}

export async function getMarketauxNews(options: NewsOptions): Promise<NewsArticle[]> {
  const provider = new MarketauxNewsProvider();
  if (!provider.available()) return [];
  const key = `news:${provider.name}:${options.symbol ?? "general"}`;
  return cached(key, CACHE_TTL.news, () => provider.getNews(options));
}
