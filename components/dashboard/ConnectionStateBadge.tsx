import type { ConnectionState } from "@/types";
import { Badge } from "@/components/ui/Badge";

export function ConnectionStateBadge({
  connection,
  asOf,
}: {
  connection: ConnectionState;
  asOf: number | null;
}) {
  const tone =
    connection === "LIVE"
      ? "positive"
      : connection === "OFFLINE"
        ? "negative"
        : "warning";

  const label =
    connection === "LIVE"
      ? "LIVE"
      : connection === "RECONNECTING"
        ? "RECONNECTING"
        : connection === "OFFLINE"
          ? "OFFLINE"
          : "CONNECTING";

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <Badge tone={tone} className="w-max">
        <span
          className={cn2(connection)}
        />
        {label}
      </Badge>
      {connection !== "LIVE" && asOf ? (
        <span className="text-[9px] text-[var(--muted)]">
          showing last known data
        </span>
      ) : null}
    </div>
  );
}

function cn2(connection: ConnectionState): string {
  return connection === "LIVE"
    ? "h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--positive)]"
    : "h-1.5 w-1.5 rounded-full bg-current opacity-60";
}
