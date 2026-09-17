"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Radar, Activity, BrainCircuit, Newspaper, Wallet } from "lucide-react";
import { HeroScene } from "@/components/landing/HeroScene";

const HEADLINE = "THE MARKET DOESN'T WAIT.";
const SUBLINE = "See the market. Understand the signal. Move with intelligence.";

const FEATURES = [
  {
    icon: Activity,
    title: "REAL-TIME",
    body: "Market movement, streamed through a resilient live-data architecture with explicit connection state — never silently stale, never fabricated.",
  },
  {
    icon: Radar,
    title: "TECHNICAL",
    body: "RSI, MACD and Bollinger Bands computed deterministically on historical candles, rendered directly on the chart you're reading.",
  },
  {
    icon: BrainCircuit,
    title: "INTELLIGENCE",
    body: "AI-generated market summaries built strictly from the data you supply — quotes, indicators, and news. Labeled analysis, never advice.",
  },
  {
    icon: Wallet,
    title: "PORTFOLIO",
    body: "Track positions and exposure. Unrealized P/L and allocation valued against live market data — never against numbers you typed in.",
  },
  {
    icon: Newspaper,
    title: "NEWS",
    body: "Aggregated market intelligence across providers, normalized into one clean feed tied to the securities you follow.",
  },
];

const AI_DEMO = {
  symbol: "AAPL",
  sentiment: "NEUTRAL",
  keyFactors: ["Price momentum", "RSI conditions", "Recent news flow", "Volatility regime"],
  risks: ["Earnings uncertainty", "Market volatility", "Sector rotation"],
  confidence: "MEDIUM",
};

export function LandingPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  const ambitionY = useTransform(progress, [0.1, 0.35], [60, -60]);
  const ambitionOpacity = useTransform(progress, [0.12, 0.22], [0, 1]);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  return (
    <main className="relative">
      {/* ── SECTION 1 — HERO ─────────────────────────────────── */}
      <section
        ref={sectionRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      >
        <HeroScene reducedMotion={reducedMotion} />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_78%)]" />

        <div className="relative z-10 tl-container flex flex-col items-center py-24 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--gold)]"
          >
            TradeLens AI
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="tl-gold-text max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl"
          >
            {HEADLINE}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 max-w-xl text-base text-[var(--muted)] sm:text-lg"
          >
            {SUBLINE}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10"
          >
            <Link
              href="/register"
              className="group inline-flex h-12 items-center gap-2 rounded-md bg-[var(--gold)] px-8 text-sm font-semibold text-black shadow-[0_0_40px_rgba(212,175,55,0.25)] transition-all hover:bg-[var(--gold-bright)] hover:shadow-[0_0_60px_rgba(212,175,55,0.35)]"
            >
              ENTER TRADELENS
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <div className="mx-auto h-10 w-px animate-pulse bg-gradient-to-b from-transparent via-[var(--gold)] to-transparent" />
        </div>
      </section>

      {/* ── SECTION 2 — AMBITION ────────────────────────────── */}
      <section className="relative tl-container py-40 text-center">
        <motion.div
          style={reducedMotion ? undefined : { y: ambitionY, opacity: ambitionOpacity }}
          className="mx-auto max-w-3xl"
        >
          <p className="text-3xl font-light leading-relaxed text-[var(--muted)] sm:text-4xl md:text-5xl">
            Information is <em className="not-italic text-[var(--foreground)]">everywhere</em>.
          </p>
          <p className="mt-4 text-3xl font-light leading-relaxed text-[var(--muted)] sm:text-4xl md:text-5xl">
            Signal is <span className="tl-gold-text not-italic font-semibold">rare</span>.
          </p>
          <p className="mt-10 text-lg text-[var(--muted)]">
            TradeLens AI was built to find it.
          </p>
        </motion.div>
      </section>

      {/* ── SECTION 3 — POWER ───────────────────────────────── */}
      <section className="relative tl-container py-28">
        <h2 className="mb-16 text-center text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gold)]">
          The System
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="tl-card group relative overflow-hidden p-6 transition-colors hover:border-[var(--gold)]/30"
            >
              <f.icon className="mb-5 h-6 w-6 text-[var(--gold)]" strokeWidth={1.5} />
              <h3 className="mb-3 text-sm font-semibold tracking-[0.2em] text-[var(--foreground)]">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{f.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── SECTION 4 — AI EDGE ─────────────────────────────── */}
      <section className="relative tl-container py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: relative(reducedMotion) }}
            whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gold)]">
              The AI Edge
            </h2>
            <p className="mt-6 text-2xl font-light leading-relaxed sm:text-3xl">
              A structured intelligence layer that reads{" "}
              <span className="text-[var(--foreground)]">what the data actually says</span>{" "}
              — and is honest about what it cannot know.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">
              Every summary is generated strictly from supplied market context: live
              quotes, computed indicators, recent news. Output is labeled analysis —
              with sentiment, key factors, and explicit risk factors. Confidence is a
              model judgment, not a statistical probability.
            </p>
            <p className="mt-6 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-xs leading-relaxed text-[var(--muted)]">
              AI-generated market analysis. For informational purposes only. Not
              financial advice.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="tl-card-elevated p-6"
            aria-label="Product preview of AI market intelligence output"
          >
            <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-4">
              <span className="tl-numerical text-lg font-semibold text-[var(--foreground)]">
                {AI_DEMO.symbol}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--gold)]">
                AI Market Intelligence
              </span>
            </div>
            <div className="mb-5 flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                Sentiment
              </span>
              <span className="rounded border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2 py-0.5 text-[11px] font-medium uppercase text-[var(--warning)]">
                {AI_DEMO.sentiment}
              </span>
              <span className="ml-auto text-[11px] text-[var(--muted)]">
                Confidence: {AI_DEMO.confidence}
              </span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h4 className="mb-2.5 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  Key factors
                </h4>
                <ul className="space-y-1.5">
                  {AI_DEMO.keyFactors.map((k) => (
                    <li key={k} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--gold)]" />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2.5 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  Risk factors
                </h4>
                <ul className="space-y-1.5">
                  {AI_DEMO.risks.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--negative)]" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-5 border-t border-[var(--border)] pt-3 text-[10px] text-[var(--muted)]">
              Illustrative output. Real summaries are generated live from your selected security.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 5 — FINAL CTA ───────────────────────────── */}
      <section className="relative tl-container py-40 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="tl-gold-text mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            READY TO SEE THE MARKET DIFFERENTLY?
          </h2>
          <Link
            href="/register"
            className="group mt-12 inline-flex h-14 items-center gap-3 rounded-md bg-[var(--gold)] px-10 text-base font-semibold text-black shadow-[0_0_50px_rgba(212,175,55,0.3)] transition-all hover:bg-[var(--gold-bright)]"
          >
            LAUNCH TRADELENS
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-6 text-xs text-[var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--gold)] hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}

function relative(reduced: boolean) {
  return reduced ? 0 : -40;
}
