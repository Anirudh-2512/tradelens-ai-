import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--gold)] text-black font-semibold hover:bg-[var(--gold-bright)] active:translate-y-px shadow-[0_0_24px_rgba(212,175,55,0.15)]",
  secondary:
    "bg-[var(--surface-elevated)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--gold)]/40 hover:bg-[#16161a]",
  ghost:
    "bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5",
  danger:
    "bg-transparent text-[var(--negative)] border border-[var(--negative)]/30 hover:bg-[var(--negative)]/10",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md transition-all duration-200",
        "disabled:opacity-40 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
