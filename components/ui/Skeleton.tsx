export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-white/[0.06] ${className ?? ""}`}
      {...props}
    />
  );
}
