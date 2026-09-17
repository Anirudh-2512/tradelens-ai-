import Link from "next/link";
import { MarketTicker } from "@/components/dashboard/MarketTicker";
import { WatchlistQuickPanel } from "@/components/dashboard/WatchlistQuickPanel";
import { NewsFeed } from "@/components/news/NewsFeed";
import { Card, CardHeader } from "@/components/ui/Card";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide">MARKET OVERVIEW</h1>
        <p className="text-xs text-[var(--muted)]">
          Live snapshot of headline securities
        </p>
      </div>

      <MarketTicker />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Your watchlists"
            subtitle="Track the securities you follow"
            actions={
              <Link
                href="/dashboard/watchlists"
                className="flex items-center gap-1 text-[11px] text-[var(--gold)] hover:underline"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <WatchlistQuickPanel />
        </Card>

        <Card>
          <CardHeader
            title="Market news"
            subtitle="Latest headlines"
            actions={
              <Link
                href="/dashboard/news"
                className="flex items-center gap-1 text-[11px] text-[var(--gold)] hover:underline"
              >
                All news <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <NewsFeed limit={5} />
        </Card>
      </div>
    </div>
  );
}
