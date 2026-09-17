export type Timeframe = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y";

export const TIMEFRAMES: Timeframe[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "1Y",
  "5Y",
];

/** Map a UI timeframe to a Finnhub resolution + lookback window. */
export function timeframeToCandleOptions(timeframe: Timeframe): {
  resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M";
  from: number;
  to: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const day = 86_400;

  const config: Record<
    Timeframe,
    { resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M"; days: number }
  > = {
    "1D": { resolution: "5", days: 1 },
    "5D": { resolution: "15", days: 5 },
    "1M": { resolution: "D", days: 30 },
    "3M": { resolution: "D", days: 91 },
    "6M": { resolution: "D", days: 182 },
    "1Y": { resolution: "D", days: 365 },
    "5Y": { resolution: "W", days: 365 * 5 },
  };

  const { resolution, days } = config[timeframe];
  return { resolution, from: now - days * day, to: now };
}

export const APP_NAME = "TradeLens AI";
export const APP_TAGLINE =
  "See the market. Understand the signal. Move with intelligence.";
export const DISCLAIMER =
  "TradeLens AI provides market information and AI-generated analysis for informational purposes only. It does not constitute financial, investment, or trading advice.";
export const AI_DISCLAIMER =
  "AI-generated market analysis. For informational purposes only. Not financial advice.";

export const DEFAULT_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "META",
  "GOOGL",
  "SPY",
] as const;
