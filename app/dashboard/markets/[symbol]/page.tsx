import { MarketDetail } from "@/components/dashboard/MarketDetail";

export const metadata = { title: "Security" };

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <MarketDetail symbol={decodeURIComponent(symbol).toUpperCase()} />;
}
