import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/auth/sessions";
import { findUserById, toPublicUser } from "@/lib/auth/users";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DISCLAIMER } from "@/constants";

export const metadata = { title: { default: "Terminal", template: "%s · Terminal" } };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login?next=/dashboard");

  const user = await findUserById(userId);
  if (!user) redirect("/login");

  return (
    <DashboardShell
      user={toPublicUser(user)}
      disclaimer={DISCLAIMER}
    >
      {children}
    </DashboardShell>
  );
}
