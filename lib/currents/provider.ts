import type { NewsArticle, NewsOptions, NewsProvider } from "@/types/market";
import { cached, CACHE_TTL } from "@/lib/utils/cache";
import { logger } from "@/lib/utils/logger";

interface CurrentsArticle {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  published?: string;
  author?: string;
  category?: string;
}

/** Optional provider — inactive when CURRENTS_API_KEY is unset. */
export class CurrentsNewsProvider implements NewsProvider {
  readonly name = "currents";
  private key: string | undefined;

  constructor(key?: string) {
    this.key = key ?? process.env.CURRENTS_API_KEY;
  }

  available(): boolean {
    return Boolean(this.key);
  }

  async getNews(options: NewsOptions): Promise<NewsArticle[]> {
    if (!this.available()) return [];
    try {
      const category = options.category === "crypto" ? "technology" : options.category ?? "general";
      const res = await fetch(
        `https://api.currentsapi.services/v1/latest-news?apiKey=${this.key}&category=${category}`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (!res.ok) {
        logger.error("currents.http_failure", "getNews", { status: res.status });
        return [];
      }
      const json = (await res.json()) as { news?: CurrentsArticle[] };
      return (json.news ?? []).slice(0, options.limit ?? 20).map(mapArticle);
    } catch (err) {
      logger.error("currents.failure", "getNews", { error: String(err) });
      return [];
    }
  }
}

function mapArticle(a: CurrentsArticle, i: number): NewsArticle {
  return {
    id: a.id ?? `cu-${i}`,
    title: a.title ?? "(untitled)",
    description: a.description || undefined,
    source: a.author || "Currents",
    url: a.url ?? "",
    imageUrl: a.image || undefined,
    publishedAt: a.published ?? new Date().toISOString(),
  } as NewsArticle;
}

export async function getCurrentsNews(options: NewsOptions): Promise<NewsArticle[]> {
  const provider = new CurrentsNewsProvider();
  if (!provider.available()) return [];
  const key = `news:${provider.name}:${options.category ?? "general"}`;
  return cached(key, CACHE_TTL.news, () => provider.getNews(options));
}
