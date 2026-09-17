import { getAuthenticatedUserId } from "@/lib/auth/sessions";
import { findUserById } from "@/lib/auth/users";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { redirect } from "next/navigation";
import { dbInitStatus } from "@/components/dashboard/StatusHelpers";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login?next=/dashboard/settings");

  const user = await findUserById(userId);
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-wide">SETTINGS</h1>
        <p className="text-xs text-[var(--muted)]">Account details and data status</p>
      </div>

      <Card>
        <CardHeader title="Account" />
        <div className="space-y-3 pt-4 text-sm">
          <Row label="Name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row
            label="Email verified"
            value={
              user.email_verified === 1 ? (
                <Badge tone="positive">Verified</Badge>
              ) : (
                <Badge tone="warning">Not verified</Badge>
              )
            }
          />
          <Row label="Member since" value={new Date(user.created_at * 1000).toLocaleDateString("en-US")} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Platform status"
          subtitle="Optional providers degrade gracefully when not configured"
        />
        <div className="space-y-3 pt-4 text-sm">
          <Row label="Market data (Finnhub)" value={dbInitStatus("configured")} />
          <Row label="AI summaries (Groq)" value={dbInitStatus("configured")} />
          <Row label="Database (Turso)" value={dbInitStatus("configured")} />
          <Row label="Email verification (Resend)" value={dbInitStatus("optional")} />
          <Row label="News enrichment (Marketaux / Currents)" value={dbInitStatus("optional")} />
        </div>
      </Card>

      <p className="text-[10px] leading-relaxed text-[var(--muted)]">
        Session security: HTTP-only cookies, server-side sessions in the database. Your
        identifiers are never sent from the browser; all ownership checks are performed
        server-side.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <span>{value}</span>
    </div>
  );
}
