/**
 * Deterministic, testable technical indicator library (spec §19–20).
 * Pure functions — no React, no network.
 */

export interface RSIResult {
  /** RSI values aligned to input; earlier entries are null (insufficient period). */
  values: Array<number | null>;
  last: number | null;
}

export interface MACDResult {
  macd: Array<number | null>;
  signal: Array<number | null>;
  histogram: Array<number | null>;
}

export interface BollingerResult {
  middle: Array<number | null>;
  upper: Array<number | null>;
  lower: Array<number | null>;
}

/** Wilder's smoothing for RSI (industry standard). */
export function computeRSI(closes: number[], period = 14): RSIResult {
  const n = closes.length;
  const values: Array<number | null> = new Array(n).fill(null);

  if (period < 2 || n < period + 1) return { values, last: null };

  let sumGain = 0;
  let sumLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) sumGain += diff;
    else sumLoss -= diff;
  }

  let avgGain = sumGain / period;
  let avgLoss = sumLoss / period;

  const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  values[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  let last = avgLoss === 0 ? 100 : values[period];

  for (let i = period + 1; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const r = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    const value = avgLoss === 0 ? 100 : 100 - 100 / (1 + r);
    values[i] = Math.min(100, Math.max(0, value));
    last = value;
  }

  return { values, last: last ?? values[period] ?? null };
}

/** Classic 12/26/9 MACD using EMA. */
export function computeMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): MACDResult {
  const n = closes.length;
  const empty: MACDResult = {
    macd: new Array(n).fill(null),
    signal: new Array(n).fill(null),
    histogram: new Array(n).fill(null),
  };

  if (n < slow || fast >= slow) return empty;

  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);

  const macdLine: Array<number | null> = new Array(n).fill(null);
  const macdValidFrom = slow - 1;
  for (let i = macdValidFrom; i < n; i++) {
    macdLine[i] = emaFast[i] - emaSlow[i];
  }

  // Signal = EMA of the MACD line over its valid segment.
  const valid = macdLine.slice(macdValidFrom).filter((v): v is number => v !== null);
  const signalEma = ema(valid, signalPeriod);

  const signalLine: Array<number | null> = new Array(n).fill(null);
  const histogram: Array<number | null> = new Array(n).fill(null);
  for (let i = 0; i < signalEma.length; i++) {
    const idx = macdValidFrom + i;
    if (signalEma[i] !== null) {
      signalLine[idx] = signalEma[i];
      histogram[idx] = macdLine[idx]! - signalEma[i]!;
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  const prev = values[0];
  out[0] = prev;
  for (let i = 1; i < values.length; i++) {
    out[i] = values[i] * k + out[i - 1] * (1 - k);
  }
  void prev;
  return out;
}

/** SMA-based Bollinger Bands (20, 2). */
export function computeBollingerBands(
  closes: number[],
  period = 20,
  multiplier = 2
): BollingerResult {
  const n = closes.length;
  const middle: Array<number | null> = new Array(n).fill(null);
  const upper: Array<number | null> = new Array(n).fill(null);
  const lower: Array<number | null> = new Array(n).fill(null);

  if (period < 2 || n < period) return { middle, upper, lower };

  for (let i = period - 1; i < n; i++) {
    const window = closes.slice(i - period + 1, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    middle[i] = mean;
    upper[i] = mean + multiplier * sd;
    lower[i] = mean - multiplier * sd;
  }

  return { middle, upper, lower };
}
