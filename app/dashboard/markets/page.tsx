import { MarketTicker } from "@/components/dashboard/MarketTicker";
import { TrendingMarkets } from "@/components/dashboard/TrendingMarkets";

export const metadata = { title: "Markets" };

export default function MarketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide">MARKETS</h1>
        <p className="text-xs text-[var(--muted)]">
          Search any security, or browse the headline names
        </p>
      </div>
      <MarketTicker />
      <TrendingMarkets />
    </div>
  );
}
