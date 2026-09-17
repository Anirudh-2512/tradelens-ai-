import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md bg-[var(--surface-elevated)] border border-[var(--border)]",
        "px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]",
        "transition-colors focus:border-[var(--gold)]/60 focus:outline-none",
        "disabled:opacity-40",
        className
      )}
      {...props}
    />
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-xs font-medium uppercase tracking-wider text-[var(--muted)] mb-1.5",
        className
      )}
      {...props}
    />
  );
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-[var(--negative)]">
      {message}
    </p>
  );
}
