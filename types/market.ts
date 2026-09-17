export type Sentiment = "bullish" | "neutral" | "bearish";

export type AiConfidence = "low" | "medium" | "high";

export interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  dayOpen: number | null;
  previousClose: number | null;
  timestamp: number | null;
}

export interface Security {
  symbol: string;
  description: string;
  exchange: string | null;
  type: string | null;
}

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleOptions {
  resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M";
  from: number; // unix seconds
  to: number; // unix seconds
}

export interface CompanyProfile {
  ticker: string;
  name: string | null;
  exchange: string | null;
  industry: string | null;
  website: string | null;
  logo: string | null;
  country: string | null;
  marketCap: number | null;
}

export type NewsCategory =
  | "general"
  | "forex"
  | "crypto"
  | "merger"
  | "earnings";

export interface NewsOptions {
  category?: NewsCategory;
  symbol?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  limit?: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string; // ISO 8601
  symbol?: string;
}

// ── Provider interfaces (spec §55) ───────────────────────────

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getCandles(symbol: string, options: CandleOptions): Promise<Candle[]>;
  search(query: string): Promise<Security[]>;
  getCompanyProfile(symbol: string): Promise<CompanyProfile | null>;
}

export interface NewsProvider {
  readonly name: string;
  getNews(options: NewsOptions): Promise<NewsArticle[]>;
}

// ── AI contract (spec §21–22) ────────────────────────────────

export interface MarketAnalysisInput {
  symbol: string;
  companyName?: string;
  quote: Quote | null;
  indicators: {
    rsi?: number | null;
    macd?: {
      macd: number | null;
      signal: number | null;
      histogram: number | null;
    };
    bollinger?: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
    };
  };
  recentNews?: Array<{ title: string; source: string; publishedAt: string }>;
  candleContext?: {
    timeframe: string;
    trend: "up" | "down" | "sideways" | "unknown";
    periodChangePercent: number | null;
  };
}

export interface MarketSummary {
  summary: string;
  sentiment: Sentiment;
  keyFactors: string[];
  technicalContext: string[];
  risks: string[];
  confidence: AiConfidence;
}

export interface AIProvider {
  generateMarketSummary(input: MarketAnalysisInput): Promise<MarketSummary>;
}
