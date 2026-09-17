import Link from "next/link";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { DISCLAIMER } from "@/constants";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--border)] bg-[rgba(5,5,5,0.75)] backdrop-blur-md">
        <div className="tl-container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-widest">
            <span className="tl-numerical text-sm">
              <span className="text-[var(--gold)]">TRADE</span>LENS
            </span>
            <span className="rounded border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-1.5 py-0.5 text-[9px] font-bold text-[var(--gold)]">
              AI
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm" aria-label="Main">
            <Link
              href="/login"
              className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-[var(--gold)] px-4 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-[var(--gold-bright)]"
            >
              ENTER TRADELENS
            </Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-[var(--border)] py-10">
        <div className="tl-container">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="tl-numerical text-xs tracking-[0.3em] text-[var(--gold)]">
              OBSERVE → UNDERSTAND → ANALYZE → DECIDE
            </span>
            <p className="max-w-2xl text-[10px] leading-relaxed text-[var(--muted)]">
              {DISCLAIMER}
            </p>
            <p className="text-[10px] text-[var(--muted)]">
              © {new Date().getFullYear()} TradeLens AI
            </p>
          </div>
        </div>
      </footer>
    </SmoothScroll>
  );
}
