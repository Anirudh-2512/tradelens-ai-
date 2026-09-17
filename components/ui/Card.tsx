import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("tl-card p-5", className)} {...props} />
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 pb-4 border-b border-[var(--border)]",
        className
      )}
    >
      <div>
        <h3 className="text-sm font-semibold tracking-wide uppercase text-[var(--foreground)]">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
