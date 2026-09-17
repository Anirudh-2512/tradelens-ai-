# TradeLens AI

**Production-grade, full-stack, AI-powered market intelligence platform.**

TradeLens AI is not a static website — it is a functioning market terminal: real-time-ish market data from Finnhub, deterministic technical analysis (RSI / MACD / Bollinger Bands), multi-provider news aggregation, Groq-powered AI market summaries, persistent watchlists and portfolios valued against live market prices, all secured server-side.

> ⚠️ **Informational disclaimer** — TradeLens AI provides market information and AI-generated analysis for informational purposes only. It does not constitute financial, investment, or trading advice. AI output is labeled analysis and is never presented as guaranteed prediction or advice.

**Live site:** https://tradelens-ai-chi.vercel.app

---

## 1. The Theory of the Website

### 1.1 Product philosophy — Observe → Understand → Analyze → Decide

The entire product is built around a four-stage information funnel. Every screen, data pipeline and component maps to a stage:

| Stage | Meaning | Where it lives in the product |
|---|---|---|
| **OBSERVE** | See what the market is doing — raw, live, honest | Live ticker, trending grid, price headers, connection-state badges |
| **UNDERSTAND** | Context: what did this look like over time? | Candlestick charts, timeframes (1D–5Y), volume |
| **ANALYZE** | Measure, quantify, interpret — computationally and linguistically | RSI / MACD / Bollinger indicators + AI-generated summaries |
| **DECIDE** | Orientation, not advice — the user remains the decision-maker | Watchlists, portfolios with live valuation, always-on disclaimers |

### 1.2 Core thesis: information ≠ signal

- **Information is everywhere.** Everyone sees the same price at the same time.
- **Signal is rare.** What matters is structure: how indicators align, what the news flow says relative to price, where risk is concentrated.
- TradeLens AI exists to *find the signal*, while being explicit that **no system predicts the market with certainty**.

### 1.3 The honesty principle (the most important design rule)

Financial UIs fail through silent deception: stale numbers silently treated as live, AI pretending to know the future, fake data filling gaps. TradeLens enforces the opposite:

1. **Explicit connection state** — every live widget shows `LIVE / CONNECTING / RECONNECTING / OFFLINE`. Stale values are retained and labeled ("showing last known data"), never silently dressed as live.
2. **Nothing is fabricated** — when the provider has no data (e.g., candle history beyond the free plan), the UI says exactly that. No synthetic prices, candles or news are ever generated.
3. **AI is a lens, not an oracle** — generation is constrained *by prompt* to use only the market context supplied to it, to distinguish fact from interpretation, and to express uncertainty. Confidence is labeled as a model judgment, "not a statistical probability."
4. **Advice boundary** — AI never recommends buying or selling; output is analysis, and the disclaimer "Not financial advice" is always adjacent to it.

### 1.4 Information-density theory

The terminal aesthetic (dark, monospaced numerics, tabular alignment, borders over cards, dense grids) exists for a reason: professional traders scan, they don't read. Layout theory applied:

- **F-pattern scanning** — dense, aligned numeric grids along the left/top
- **Tabular-nums everywhere** — digits must not jitter as prices change
- **Progressive disclosure** — overview first; detail inside security pages
- **Status as color, color as meaning** — gold = brand/action, green/red = up/down only; no decorative color on data

### 1.5 Design language

Dark luxury financial terminal: near-black surfaces (`#050505`/`#0B0B0D`), hairline borders (`rgba(255,255,255,0.08)`), and **gold used only as an accent** — for brand, primary actions and highlights. Everything is driven by CSS variables (design tokens) so no color is ever scattered through components.

---

## 2. Screenshots / Experience Map

```
LANDING (cinematic 3D storytelling)
   ↓  "ENTER TRADELENS"
AUTHENTICATION (register / login)
   ↓
DASHBOARD (market overview)
   ↓
MARKETS → SECURITY DETAIL (live price, chart, indicators, news, AI)
   ↓
WATCHLISTS / PORTFOLIO / SETTINGS
```

- **Experience A — Landing:** 3D hero (abstract candlestick terrain + gold particles rendered via React Three Fiber), scroll-driven storytelling, feature grid, AI showcase, final CTA.
- **Experience B — Terminal:** institutional dashboard with sidebar (desktop) / drawer (mobile), global search, security pages, watchlists, portfolios, news, settings.

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router, RSC, Route Handlers) | Server Components keep secrets on the server; routes give a clean API layer |
| Language | **TypeScript** (strict) | Financial data demands type safety |
| Styling | **Tailwind CSS v4** + CSS-variable design tokens | Reusable, consistent design system |
| UI | Framer Motion, GSAP, Lenis, Lucide | Purposeful animation: storytelling + feedback only |
| 3D | **React Three Fiber + Drei** (lazy-loaded) | Cinematic hero isolated from the rest of the bundle |
| Charts | **TradingView Lightweight Charts v5** | Industry-standard candle/line rendering; never hand-rolled |
| Database | **Turso (libSQL/SQLite)** | Fast, persistent, generous free tier |
| Auth hashing | **argon2id** (`@node-rs/argon2`) | OWASP-recommended password hashing |
| Market data | **Finnhub** | Quotes, search, profiles, news |
| AI | **Groq** (`openai/gpt-oss-120b`) | Fast inference with strict JSON output |
| Optional news | Marketaux, Currents | Enrichment; degrade gracefully when absent |
| Optional email | Resend | Verification delivery |
| Testing | **Vitest** | Unit tests for all financial math |

---

## 4. Security Architecture

The non-negotiable rule: **the browser never sees a secret.**

```
Browser ──▶ Next.js Route Handlers (server-side) ──> Finnhub · Groq · Turso
```

- `FINNHUB_API_KEY`, `GROQ_API_KEY`, `TURSO_AUTH_TOKEN`, `RESEND_API_KEY`, `MARKETAUX_API_TOKEN`, `CURRENTS_API_KEY` are only read server-side via `lib/config/env.ts`.
- **Authentication:** argon2id password hashing; opaque server-side sessions (200+ bits of entropy) stored in the DB with expiry; cookies are `HttpOnly + Secure + SameSite=Lax`. No secrets in `localStorage`/`sessionStorage`.
- **Authorization:** the server derives identity **only** from the session cookie. Every user-resource query doubles the check:

```sql
WHERE portfolio_id = ? AND user_id = <authenticated user id>
```

Client-supplied user IDs are never trusted.

- **Validation:** every request body, query param and URL symbol is validated with **Zod** (server-side is the security boundary; frontend validation is only UX).
- **Rate limiting:** sliding-window limiter on auth (10/5min), AI (10/min/user), market endpoints (elevated budget — see §6), news. Auth attempts are uniformly rejected (no user enumeration).
- **Security headers:** CSP (no third-party scripts), HSTS, X-Frame-Options DENY, nosniff, strict Referrer-Policy, Permissions-Policy.
- **Logging:** structured JSON with request IDs/timestamps/endpoints. **Never logged:** passwords, keys, tokens, or sensitive user data. Failures surface as sanitized `{ code, message }` responses — no stack traces or infra details.

### Consistent API error model

```json
{ "success": false, "error": { "code": "MARKET_DATA_UNAVAILABLE", "message": "..." } }
```

Known codes: `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `VALIDATION_ERROR`, `MARKET_DATA_UNAVAILABLE`, `CANDLES_UNAVAILABLE_ON_PLAN`, `AI_UNAVAILABLE`, `NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_ERROR`.

---

## 5. Project Structure

```
tradelens-ai/
├── app/
│   ├── (marketing)/            landing experience (layout + page)
│   ├── (auth)/login|register   authentication pages
│   ├── dashboard/
│   │   ├── page.tsx            overview (ticker + watchlists + news)
│   │   ├── markets/[symbol]    security detail: chart, AI, news
│   │   ├── portfolio|watchlists|news|settings
│   └── api/
│       ├── auth/{register,login,logout,me}
│       ├── stocks/{search,[symbol],[symbol]/candles,quotes}
│       ├── news/{,[symbol]}
│       ├── ai/summary
│       ├── portfolio/{,[id]}
│       └── watchlists/{,[id],[id]/items}
├── components/                 landing·dashboard·charts·portfolio·watchlists·news·ai·auth·ui
├── lib/
│   ├── config/env.ts           validated env access (server-only)
│   ├── db/                     Turso client + schema + typed query helpers
│   ├── auth/                   argon2 crypto, sessions, user repo, edge constants
│   ├── finnhub/                MarketDataProvider impl + news + shared quote cache
│   ├── groq/                   AIProvider (JSON contract + prompt safety)
│   ├── marketaux/ currents/news/ provider abstraction + aggregation
│   ├── indicators/             RSI · MACD · Bollinger (pure functions)
│   ├── portfolio/              owner-checked queries + integer-cents valuation
│   ├── watchlists/             owner-checked watchlist service
│   ├── validation/             all Zod schemas
│   └── utils/                  api errors, cache, rate limit, logger, format
├── hooks/useMarketData.ts      single shared poller (per tab) + connection state
├── components/…                UI (see §8)
├── types/ constants/ tests/ scripts/ tests
├── middleware.ts               edge cookie-presence guard for /dashboard
└── next.config.ts              security headers, server externals
```

---

## 6. Data-Flow Theory

### 6.1 Market data pipeline (the interesting part)

```
Widgets (ticker/grid/price header)
        │  ONE shared poller per browser tab
        ▼
GET /api/stocks/quotes?symbols=…        (rate-limited per client)
        │
        ▼
lib/finnhub/quote-cache.ts   ◄── THE load-leveler
   1. Turso quotes_cache row fresh (<25s)?  → serve from DB (0 provider calls)
   2. otherwise → Finnhub → upsert row + serve (flag "live")
   3. Finnhub fails + row exists → serve row (flagged "stale")
   4. Finnhub fails + no row     → MARKET_DATA_UNAVAILABLE (honest error)
```

**Why a DB-backed cache:** Vercel serverless instances each hold private memory, so an in-instance cache alone cannot bound global provider usage; Turso provides a single shared cache across every instance. Result: sustained dashboard usage consumes ~6–20 Finnhub calls/minute worst case, far under the free plan's 60/min.

**Why "stale, labeled" instead of "N/A":** a last-known price with a visible stale flag conveys far more information than a blank — and is never presented as live (spec-level honesty rules).

### 6.2 Universal HTTP caching (in-process TTL)

| Data | TTL | Reason |
|---|---|---|
| Quote rows | 25s (shared DB) | near-real-time under free-plan caps |
| Company profiles | 12 h | slow-moving |
| Search results | 10 min | low volatility |
| News | 5 min | balance freshness vs caps |
| AI summary | ~5 min | identical context should not re-bill tokens |

### 6.3 Technical analysis theory

Indicators are **pure functions** (`lib/indicators/`), fully decoupled from UI and network, and unit-tested against known datasets:

- **RSI (Wilder, 14):** momentum oscillator in `[0,100]`. Wilder-smoothed average gains/losses. Convention: zero-loss → 100. Signal: >70 overbought / <30 oversold (display only).
- **MACD (12/26/9):** `macd = EMA12 − EMA26`, `signal = EMA9(macd)`, `histogram = macd − signal`. Histogram sign ≈ momentum direction shift.
- **Bollinger Bands (20, 2σ):** SMA20 ± 2 × population-σ. Band width tracks realized volatility; squeeze/expansion is visible at a glance.

They are rendered as chart overlays + header readouts, and **the same computed values become the AI's technical context** — the AI sees exactly what the chart shows.

### 6.4 AI intelligence theory

The AI layer is **constraint-bound summarization**, not prediction:

1. **Input contract** (`MarketAnalysisInput`): symbol, live quote, indicator values (RSI/MACD/Bollinger), last-known trend context, and recent real headlines. Nothing more, nothing invented.
2. **System prompt rules:** use only supplied data; do not invent prices/news; distinguish facts from interpretation; express uncertainty; never guarantee outcomes; never give personalized advice.
3. **Output contract** (strict JSON, invalid output is rejected):

```json
{
  "summary": "2–4 factual sentences",
  "sentiment": "bullish | neutral | bearish",
  "keyFactors": ["…"],
  "technicalContext": ["…"],
  "risks": ["…"],
  "confidence": "low | medium | high"
}
```

4. **Presentation:** sentiment is labeled **AI sentiment**; confidence is labeled as a model judgment, not a probability; the disclaimer is always rendered nearby.

### 6.5 Portfolio calculation theory

Valuation is **always from live market data** — never from user-entered prices.

- **Average cost basis:** buys include fees → `avg = Σ(qty·price + fees) / Σqty`; sells keep basis and reduce quantity.
- **Money math in integer cents** (`Math.round(x·100)`) with conversion at display — avoids floating-point drift across aggregations.
- Per holding: invested, current value, unrealized P/L, P/L %, allocation % (of current value).
- Selling more than held is rejected at the validation layer; holdings vanish at zero quantity.
- Transactions are the source of truth; holdings are derived state.

### 6.6 Real-time theory

Finnhub's free plan does not expose WSS streams, so `hooks/useMarketData` implements a **resilient polling store**:

- One module-level polling store per browser tab: all widgets subscribe — bounded traffic regardless of how many components mount
- Exponential backoff on failure; explicit state transitions `CONNECTING → LIVE → RECONNECTING → OFFLINE`
- Stale detection at 45s; watchdog re-poll
- Values are never cleared — only re-labeled

---

## 7. Security Invariants (checklist that the code enforces)

| Invariant | Mechanism |
|---|---|
| Secrets server-only | `server-only` env access; all external calls in Route Handlers |
| No client-supplied user IDs | identity from DB-backed session only |
| Ownership on every access | `AND user_id = ?` in watchlist/portfolio queries |
| No plaintext tokens | email-verification tokens stored SHA-256 hashed (architecture ready) |
| Strong passwords | argon2id, cost params, complexity rules |
| Unknown-user == wrong password | uniform login errors |
| Input hygiene | Zod on every body/param/query |
| Brute force / spam | rate limits on auth/AI/stocks/news |
| No internals leak | sanitized error envelopes; full detail stays in structured logs |
| Stale ≠ live | connection-state badges + stale labels |
| No fabricated data | empty/missing → explicit N/A with explanation |

---

## 8. Component Theory (design system)

**Primitives** (`components/ui/`): Button, Card(+Header), Badge, Input, Label, FieldError, Skeleton, Modal — no duplicated styles anywhere.

**Dashboard set:** MarketTicker, TrendingMarkets, PriceHeader, ConnectionStateBadge, StockSearch (debounced dropdown), WatchlistQuickPanel, WatchlistAction, CandlestickChart, IndicatorPanel readouts, NewsFeed, AISummaryCard, PortfolioManager (+Holdings/Transactions tables + modals), WatchlistManager, DashboardShell (responsive sidebar→drawer).

**Landing set:** HeroScene/HeroCanvas (lazy, reduced-motion aware), SmoothScroll (Lenis), CinematicText/FeatureStory via Framer Motion scroll.

**A11y:** semantic landmarks, focus-visible outlines, `aria-*` where it adds meaning, keyboard-friendly modals, `prefers-reduced-motion` respected globally (Lenis + 3D disabled).

---

## 9. Getting Started

```bash
git clone https://github.com/Anirudh-2512/tradelens-ai-.git
cd tradelens-ai
npm install
cp .env.example .env.local    # fill real values
npm run db:init               # applies full schema to Turso
npm run dev                   # http://localhost:3000
```

Quality gates (all must pass):

```bash
npm run lint        # ESLint, zero warnings
npm run typecheck   # tsc --noEmit
npm run test        # vitest indicator suite (16 tests)
npm run build       # production build
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `FINNHUB_API_KEY` | ✅ | market data |
| `FINNHUB_WEBHOOK_SECRET` | optional | future webhook verification |
| `GROQ_API_KEY` | ✅ | AI summaries |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | ✅ | persistence + shared quote cache |
| `JWT_SECRET` | ✅ | secret material (≥32 chars) |
| `MARKETAUX_API_TOKEN`, `CURRENTS_API_KEY` | optional | extra news sources |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | optional | email verification delivery |

Optional providers are skipped automatically when keys are absent — the app never breaks on their absence.

---

## 10. Database Setup (Turso)

1. Create a DB: `turso db create tradelens-ai` → copy URL + auth token into `.env.local`
2. `npm run db:init` applies the schema:

- `users` (argon2 hash, email_verified flag), `sessions` (opaque server-side, expiry)
- `watchlists` + `watchlist_items` (UNIQUE(watchlist, symbol) → duplicate prevention at DB level)
- `portfolios` + `holdings` + `transactions` (UNIQUE(per-portfolio, symbol))
- `email_verification_tokens` (hashed; architecture exists, delivery optional via Resend)
- `quotes_cache` (shared cross-instance quote cache — see §6.1)

Ownership is enforced in queries, not trust: every user-scoped query filters `user_id`.

---

## 11. API Overview

| Endpoint | Auth | Notes |
|---|---|---|
| `GET /api/stocks/search?q=` | public | cached 10 min |
| `GET /api/stocks/[symbol]` | public | quote (shared cache) + profile + `priceState` |
| `GET /api/stocks/[symbol]/candles?tf=` | public | 1D·5D·1M·3M·6M·1Y·5Y; premium-plan dependent |
| `GET /api/stocks/quotes?symbols=` | public | batch ≤12, shared cache |
| `GET /api/news`, `GET /api/news/[symbol]` | public | normalized, de-duplicated |
| `POST /api/ai/summary` | ✅ | 10/min/user; strict JSON contract; ~5min cache |
| `GET/POST /api/watchlists` | ✅ | CRUD + item add/remove via `/[id]/items` |
| `GET/POST/PATCH/DELETE /api/portfolio(/id)` | ✅ | transactions, holdings, valuation |

Every response: `{ success, data | error:{code,message} }`.

---

## 12. Testing

```bash
npm run test   # vitest
```

**Indicator suite** covers: insufficient data, known datasets, monotonic rise (RSI=100) / fall (RSI=0), flat series, volatile data, band symmetry/width relationships, MACD histogram mechanics (`h = macd − signal`), boundary alignment. 16/16 passing.

**Runtime smoke testing** (performed against the real deployment): register/login, live quotes, search, watchlist CRUD + duplicate prevention, cross-user 403s, unauthenticated 401, dashboard 307→login, portfolio live-price valuation, AI 200 with strict JSON, production security headers.

---

## 13. Deployment (Vercel)

- Repo: GitHub → Vercel project (env vars per §9) → deploy
- Provider flags: Node.js runtime, `serverExternalPackages: ["@node-rs/argon2"]`
- `.npmrc` sets `legacy-peer-deps` (R3F optional-expo peer chain)
- CLI deploys also supported: `npx vercel deploy --prod --yes`
- Same Turso DB is shared/authoritative in production

## 14. Known Limitations

1. **Historical candles & WSS require a paid Finnhub plan** (HTTP 403 on `/stock/candle` free tier). The UI state is explicit about it; quotes/search/news/AI all work on the free plan. Candle overlays activate automatically with a paid key — no code changes needed.
2. AI "confidence" is a model judgment — labeled, not statistical.
3. Email-verification tokens are persisted (hashed) but delivery requires the optional Resend keys.
4. The rate limiter is in-memory per instance; a distributed limiter (Upstash/Redis) can replace it via the existing abstraction without touching handlers.
5. Near-real-time prices are best-effort polling in a 15s cadence with 25s shared freshness — not tick-by-tick WSS.

## 15. License & Disclaimer

Private project. Market information and AI output are **informational only** and are not financial, investment, or trading advice. Markets carry risk; past behavior never guarantees future results.
