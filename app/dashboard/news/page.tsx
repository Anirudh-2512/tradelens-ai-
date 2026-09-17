import { Card, CardHeader } from "@/components/ui/Card";
import { NewsFeed } from "@/components/news/NewsFeed";

export const metadata = { title: "News" };

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide">MARKET NEWS</h1>
        <p className="text-xs text-[var(--muted)]">
          Aggregated from market data providers — links lead to the original source
        </p>
      </div>
      <Card>
        <CardHeader title="Latest headlines" subtitle="Updated on demand, cached for a few minutes" />
        <NewsFeed limit={25} />
      </Card>
    </div>
  );
}
