import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "positive" | "negative" | "warning" | "gold";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-white/5 text-[var(--muted)] border-white/10",
  positive: "bg-[var(--positive)]/10 text-[var(--positive)] border-[var(--positive)]/30",
  negative: "bg-[var(--negative)]/10 text-[var(--negative)] border-[var(--negative)]/30",
  warning: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
  gold: "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/30",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
