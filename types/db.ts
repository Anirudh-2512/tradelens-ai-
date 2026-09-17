export interface WatchlistWithSymbols {
  id: number;
  name: string;
  symbols: string[];
}

export interface PortfolioRow {
  id: number;
  name: string;
  base_currency: string;
  created_at: number;
}

export interface HoldingRow {
  id: number;
  portfolio_id: number;
  symbol: string;
  quantity: number;
  average_price: number;
}

export interface TransactionRow {
  id: number;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  fees: number;
  executed_at: number;
}
