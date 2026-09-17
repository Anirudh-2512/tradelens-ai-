export type ConnectionState = "LIVE" | "CONNECTING" | "RECONNECTING" | "OFFLINE";

export interface PortfolioSummary {
  investedCapital: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface HoldingView {
  id: number;
  symbol: string;
  quantity: number;
  averagePrice: number;
  investedCapital: number;
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPL: number | null;
  unrealizedPLPercent: number | null;
  allocationPercent: number | null;
  priceState: "live" | "stale" | "unavailable";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
