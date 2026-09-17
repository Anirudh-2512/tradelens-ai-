"use client";

import { MarketDetailClient } from "@/components/dashboard/MarketDetailClient";

export function MarketDetail({ symbol }: { symbol: string }) {
  return <MarketDetailClient symbol={symbol} />;
}
