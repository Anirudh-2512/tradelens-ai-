"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CandlestickChart as ChartIcon,
  Wallet,
  Eye,
  Newspaper,
  Settings,
  LogOut,
  Search,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StockSearch } from "@/components/dashboard/StockSearch";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/markets", label: "Markets", icon: ChartIcon },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/dashboard/watchlists", label: "Watchlists", icon: Eye },
  { href: "/dashboard/news", label: "News", icon: Newspaper },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export interface ShellUser {
  id: number;
  name: string;
  email: string;
}

export function DashboardShell({
  user,
  disclaimer,
  children,
}: {
  user: ShellUser;
  disclaimer: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const navLinks = (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            isActive(item.href)
              ? "bg-[var(--gold)]/10 text-[var(--gold)]"
              : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]"
          )}
        >
          <item.icon className="h-4 w-4" strokeWidth={1.75} />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(5,5,5,0.85)] backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
          <button
            className="rounded p-1.5 text-[var(--muted)] hover:bg-white/5 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="tl-numerical text-sm tracking-[0.25em]">
            <span className="text-[var(--gold)]">TRADE</span>LENS
            <span className="ml-1.5 rounded border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-1 py-0.5 text-[8px] font-bold align-middle tracking-normal">
              AI
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden min-w-[220px] sm:block">
              <StockSearch placeholder="Search securities…" />
            </div>
            <span
              title={user.email}
              className="hidden items-center gap-2 text-xs text-[var(--muted)] md:flex"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--gold)]/15 text-[11px] font-bold text-[var(--gold)]">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              {user.name}
            </span>
            <button
              onClick={logout}
              aria-label="Sign out"
              className="rounded p-2 text-[var(--muted)] transition-colors hover:text-[var(--negative)]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] p-3 lg:flex lg:flex-col">
          {navLinks}
          <div className="mt-auto p-3">
            <p className="flex items-center gap-1.5 text-[10px] leading-relaxed text-[var(--muted)]">
              <Search className="h-3 w-3" /> Search from the top bar to jump straight to any security.
            </p>
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-64 border-r border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="mb-4 lg:hidden">
                <StockSearch placeholder="Search securities…" />
              </div>
              {navLinks}
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>

      <footer className="border-t border-[var(--border)] px-4 py-3 lg:px-6">
        <p className="text-[10px] leading-relaxed text-[var(--muted)]">{disclaimer}</p>
      </footer>
    </div>
  );
}
