import {
  assertOwnedPortfolio,
  listHoldings,
} from "./queries";
import { finnhubProvider } from "@/lib/finnhub";
import type { HoldingView } from "@/types";

/**
 * Portfolio valuation (spec §27–28):
 * - Current value ALWAYS from live market data, never user-entered prices.
 * - Money math via integer cents to avoid floating-point drift.
 */

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function computeInvestedCapitalCents(
  quantity: number,
  averagePrice: number
): number {
  // quantity * price, kept in cents; quantity may be fractional shares.
  return Math.round(quantity * averagePrice * 100);
}

export async function computePortfolioSummary(
  userId: number,
  portfolioId: number
): Promise<{
  holdings: HoldingView[];
  totals: {
    investedCapital: number;
    currentValue: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
  };
  currency: string;
}> {
  const portfolio = await assertOwnedPortfolio(userId, portfolioId);
  if (!portfolio) throw new Error("NOT_OWNED");

  const holdings = await listHoldings(portfolioId);
  const symbols = [...new Set(holdings.map((h) => h.symbol))].slice(0, 12);

  const priceMap = new Map<string, { price: number | null; state: HoldingView["priceState"] }>();
  if (symbols.length > 0) {
    const settled = await Promise.allSettled(symbols.map((s) => finnhubProvider.getQuote(s)));
    symbols.forEach((symbol, i) => {
      const r = settled[i];
      if (r.status === "fulfilled" && r.value.price != null) {
        priceMap.set(symbol, { price: r.value.price, state: "live" });
      } else {
        priceMap.set(symbol, { price: null, state: "unavailable" });
      }
    });
  }

  let investedCents = 0;
  let valueCents = 0;
  let anyUnavailable = false;

  const views: Array<Omit<HoldingView, "allocationPercent" | "unrealizedPL" | "unrealizedPLPercent" | "currentValue" | "investedCapital"> & {
    investedCapital: number;
    currentValue: number | null;
  }> = [];

  for (const h of holdings) {
    const invested = computeInvestedCapitalCents(h.quantity, h.average_price);
    investedCents += invested;

    const p = priceMap.get(h.symbol);
    const currentPrice = p?.price ?? null;
    const priceState: HoldingView["priceState"] = p?.state ?? "unavailable";
    if (priceState === "unavailable") anyUnavailable = true;

    const currentValue = currentPrice != null ? Math.round(h.quantity * currentPrice * 100) : null;
    if (currentValue != null) valueCents += currentValue;

    views.push({
      id: h.id,
      symbol: h.symbol,
      quantity: h.quantity,
      averagePrice: h.average_price,
      investedCapital: fromCents(invested),
      currentPrice,
      currentValue: currentValue != null ? fromCents(currentValue) : null,
      priceState,
    });
  }

  // P/L per holding + allocation
  const withDerived: HoldingView[] = views.map((v) => {
    const unrealizedPL =
      v.currentValue != null ? fromCents(toCents2(v.currentValue) - toCents2(v.investedCapital)) : null;
    const unrealizedPLPercent =
      v.currentValue != null && v.investedCapital !== 0
        ? ((v.currentValue - v.investedCapital) / v.investedCapital) * 100
        : null;
    const allocationPercent =
      v.currentValue != null && valueCents > 0
        ? (toCents2(v.currentValue) / valueCents) * 100
        : null;
    return {
      id: v.id,
      symbol: v.symbol,
      quantity: v.quantity,
      averagePrice: v.averagePrice,
      investedCapital: v.investedCapital,
      currentPrice: v.currentPrice,
      currentValue: v.currentValue,
      priceState: v.priceState,
      unrealizedPL,
      unrealizedPLPercent,
      allocationPercent,
    };
  });

  const unrealizedPLCents = valueCents - investedCents;
  const unrealizedPLPercent =
    investedCents > 0 ? (unrealizedPLCents / investedCents) * 100 : 0;

  return {
    holdings: withDerived,
    totals: {
      investedCapital: fromCents(investedCents),
      currentValue: anyUnavailable && valueCents === 0 ? 0 : fromCents(valueCents),
      unrealizedPL: fromCents(unrealizedPLCents),
      unrealizedPLPercent,
    },
    currency: portfolio.base_currency ?? "USD",
  };
}

function toCents2(n: number): number {
  return Math.round(n * 100);
}
