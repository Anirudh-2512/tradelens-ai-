# TradeLens AI

Production-grade full-stack AI market-intelligence platform. Cinematic landing experience + institutional-style terminal combining **market data, technical analysis, news, portfolio intelligence and AI-generated summaries**.

> TradeLens AI provides market information and AI-generated analysis for informational purposes only. It does not constitute financial, investment, or trading advice.

## Overview

- **Experience A** — cinematic marketing landing (3D hero, scroll storytelling, feature sections, AI showcase).
- **Experience B** — the Terminal: authenticated dashboard with live market data, candlestick charts, technical indicators (RSI / MACD / Bollinger), news, AI market summaries, watchlists and portfolios.

Product flow: `Observe → Understand → Analyze → Decide`.

## Architecture

```
Browser ──> Next.js (Route Handlers / RSC) ──> Finnhub · Groq · Turso
```

- All secret-key API calls are **server-side only**. The browser never receives `FINNHUB_API_KEY`, `GROQ_API_KEY`, `TURSO_AUTH_TOKEN`, etc. (spec §5).
- Business logic lives in `lib/` modules; UI components stay presentation-only.
- Provider abstractions: `MarketDataProvider`, `NewsProvider`, `AIProvider` (swap-in replaceable).

```
tradelens-ai/
├── app/
│   ├── (marketing)/            landing experience
│   ├── (auth)/login|register   authentication pages
│   ├── dashboard/              terminal (markets, portfolio, watchlists, news, settings)
│   └── api/                    auth · stocks · news · ai · portfolio · watchlists
├── components/                 landing · dashboard · charts · portfolio · watchlists · news · ai · ui
├── lib/
│   ├── db/ client·schema·query helpers
│   ├── auth/ sessions·crypto·users
│   ├── finnhub/ provider·news
│   ├── groq/ AI provider (strict JSON contract, prompt-safety)
│   ├── marketaux/ currents/ optional news sources
│   ├── news/ aggregation + normalization
│   ├── indicators/ RSI · MACD · Bollinger (pure, tested)
│   ├── portfolio/ queries·valuation (integer-cents math)
│   ├── watchlists/ service
│   ├── validation/ Zod schemas
│   └── utils/ api errors·cache·rate-limit·logging·format
├── hooks/ useMarketData (LIVE/CONNECTING/RECONNECTING/OFFLINE + stale detection)
├── types/ constants/ scripts/ tests/
├── middleware.ts
└── config files
```

## Tech stack

- **Next.js 15** (App Router, RSC, Route Handlers), **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-variable design tokens), Framer Motion, GSAP, Lenis, React Three Fiber + Drei, Lucide icons
- **TradingView Lightweight Charts v5** (candlestick + volume + Bollinger overlays)
- **Turso (libSQL)** persistence, **argon2id** (`@node-rs/argon2`) password hashing
- **Finnhub** market data, **Groq** AI, optional Marketaux / Currents / Resend
- **Vitest** unit tests

## Setup

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run db:init              # applies schema to your Turso DB
npm run dev
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `FINNHUB_API_KEY` | ✅ | quotes / search / news |
| `FINNHUB_WEBHOOK_SECRET` | optional | webhook verification |
| `GROQ_API_KEY` | ✅ | AI summaries |
| `TURSO_DATABASE_URL` | ✅ | libSQL URL |
| `TURSO_AUTH_TOKEN` | ✅ | libSQL auth token |
| `JWT_SECRET` | ✅ | session signing material (min 32 chars) |
| `MARKETAUX_API_TOKEN` | optional | extra financial news |
| `CURRENTS_API_KEY` | optional | extra general news |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | optional | email verification delivery |

Optional providers degrade gracefully when keys are absent. Required providers fail with clear configuration errors. Never commit `.env.local`.

## Commands

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve production build
npm run lint       # ESLint (0 warnings allowed)
npm run typecheck  # tsc --noEmit
npm run test       # vitest (indicators unit tests)
npm run db:init    # create/verify Turso schema
```

## API overview

| Endpoint | Notes |
|---|---|
| `GET  /api/stocks/search?q=` | cached 10 min |
| `GET  /api/stocks/[symbol]` | quote + profile (profile cached) |
| `GET  /api/stocks/[symbol]/candles?tf=` | 1D·5D·1M·3M·6M·1Y·5Y |
| `GET  /api/stocks/quotes?symbols=` | batch quotes ≤ 12 |
| `GET  /api/news` · `GET /api/news/[symbol]` | normalized `NewsArticle[]` |
| `POST /api/ai/summary` | auth; rate-limited; strict JSON contract |
| `GET/POST /api/watchlists` · `PATCH/DELETE /api/watchlists/[id]` | auth + ownership |
| `POST/DELETE /api/watchlists/[id]/items` | duplicates prevented via UNIQUE index |
| `GET/POST /api/portfolio` · `GET/POST/PATCH/DELETE /api/portfolio/[id]` | auth + ownership |

Consistent error shape: `{ success: false, error: { code, message } }`. No stack traces, keys or infra details reach the client.

## Security notes

- Secrets server-only; all external calls proxied through Route Handlers.
- Auth: argon2id hashing, opaque 200-bit+ session IDs stored server-side, HttpOnly + Secure + SameSite=Lax cookies.
- Every user-resource query verifies ownership (`WHERE id = ? AND user_id = ?`); client-supplied user IDs are never trusted (spec §43 flow).
- Zod validation on all bodies/params; in-memory sliding-window rate limits on auth/AI/stocks/news; security headers incl. CSP, HSTS, X-Frame-Options, nosniff, Referrer/Permissions-Policy.
- Structured JSON logging with request IDs; secrets/tokens/user data never logged.

## Database setup (Turso)

1. Create a Turso database (`turso db create tradelens-ai`), copy its URL + auth token into `.env.local`.
2. Run `npm run db:init` to apply the schema (16 DDL statements: users, sessions, watchlists + items, portfolios, holdings, transactions, email_verification_tokens with indices and FKs).
3. Sensitive tokens (email verification) are stored hashed; sessions can be pruned opportunistically.

## Testing

```bash
npm run test   # vitest suite
```

Covers indicators (insufficient data, flat, monotonic rise/fall, volatile, boundary conditions) — 16 tests. Smoke-tested end-to-end against the real database and live Finnhub/Groq during development, including ownership authorization (cross-user access returns 403) and brute-force/rate-limit behavior.

## Deployment (Vercel)

1. Push the repo to GitHub, import in Vercel.
2. Add all environment variables from `.env.example` in the Vercel project settings.
3. Run `npm run db:init` against production credentials once.
4. Deploy; verify headers, cookies (Secure) and rate limits in production.

## Known limitations

- **Historical candles / WSS require a paid Finnhub plan.** On the free tier, `/stock/candle` returns `403`; the chart then shows an explicit "data unavailable from provider" state (never fabricated). Quotes, search and news work on the free plan.
- AI confidence is a model judgment, not statistical probability, and is labeled as such in the UI.
- Email verification architecture exists (hashed tokens in DB) but delivery requires the optional Resend keys; accounts work unverified while UX marks the state.
- Rate limiter is in-memory (per-instance); swap-in distributed limiter fits the existing abstraction.
