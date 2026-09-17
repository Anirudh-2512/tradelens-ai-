export function dbInitStatus(kind: "configured" | "optional"): React.ReactNode {
  return kind === "configured" ? (
    <span className="text-[var(--positive)]">Configured</span>
  ) : (
    <span className="text-[var(--muted)]">Optional — active when keys are present</span>
  );
}
