import { describe, expect, it } from "vitest";
import { computeRSI, computeMACD, computeBollingerBands } from "@/lib/indicators";

/** Known dataset: rising then falling closes (textbook-style). */
const SERIES = [
  44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08, 45.89,
  46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64, 46.21, 46.25,
  45.71, 46.45, 45.78, 45.35, 44.03, 44.18, 44.22, 44.57, 43.55, 43.37, 42.61,
];

describe("computeRSI", () => {
  it("returns nulls for insufficient data", () => {
    const rsi = computeRSI([10, 11, 12], 14);
    expect(rsi.last).toBeNull();
    rsi.values.forEach((v) => expect(v).toBeNull());
  });

  it("returns 100 for monotonic rise (no losses)", () => {
    const closes = Array.from({ length: 20 }, (_, i) => i + 1);
    const rsi = computeRSI(closes, 14);
    expect(rsi.last).toBe(100);
  });

  it("returns bounded values for known dataset", () => {
    const rsi = computeRSI(SERIES, 14);
    const lastVal = rsi.values[SERIES.length - 1];
    expect(lastVal).not.toBeNull();
    expect(lastVal).toBeGreaterThanOrEqual(0);
    expect(lastVal).toBeLessThanOrEqual(100);
    // First `period` entries are null
    for (let i = 0; i < 14; i++) expect(rsi.values[i]).toBeNull();
    expect(rsi.values[14]).not.toBeNull();
    expect(rsi.last).toBe(lastVal);
  });

  it("handles flat data without NaN (zero loss side)", () => {
    const flat = Array.from({ length: 30 }, () => 10);
    const rsi = computeRSI(flat, 14);
    expect(rsi.values.slice(0, 14).every((v) => v === null)).toBe(true);
    // Flat closes: all equal so avgGain=avgLoss=0 → convention 100
    expect(rsi.values[14]).toBe(100);
  });

  it("returns low RSI on monotonic decline", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 - i);
    const rsi = computeRSI(closes, 14);
    expect(rsi.last).toBe(0);
  });

  it("handles volatile data within bounds", () => {
    const volatile = [10, 12, 9, 15, 8, 16, 7, 14, 9, 13, 10, 12, 8, 14, 11, 12, 9, 13, 10, 12];
    const rsi = computeRSI(volatile, 14);
    expect(rsi.last).not.toBeNull();
    expect(rsi.last!).toBeGreaterThanOrEqual(0);
    expect(rsi.last!).toBeLessThanOrEqual(100);
  });
});

describe("computeMACD", () => {
  it("returns nulls for insufficient data", () => {
    const m = computeMACD([1, 2, 3, 4, 5]);
    expect(m.macd.every((v) => v === null)).toBe(true);
    expect(m.signal.every((v) => v === null)).toBe(true);
  });

  it("rejects fast >= slow", () => {
    const m = computeMACD(SERIES, 26, 12);
    expect(m.macd.every((v) => v === null)).toBe(true);
  });

  it("produces alignments for known dataset", () => {
    const m = computeMACD(SERIES);
    const macdValid = m.macd.filter((v) => v !== null);
    expect(macdValid.length).toBe(SERIES.length - 25);
    // First valid MACD at index 25
    expect(m.macd[24]).toBeNull();
    expect(m.macd[25]).not.toBeNull();
    // Histogram = macd - signal where computed
    for (let i = 0; i < SERIES.length; i++) {
      if (m.histogram[i] !== null) {
        expect(m.histogram[i]).toBeCloseTo((m.macd[i] ?? 0) - (m.signal[i] ?? 0), 10);
      }
    }
  });

  it("identifies a shift from up to down trend", () => {
    const up = Array.from({ length: 40 }, (_, i) => 100 + i);
    const series = [...up, ...up.slice().reverse().map((v) => v - 10)];
    const m = computeMACD(series);
    const h = m.histogram.filter((v) => v !== null) as number[];
    expect(h.length).toBeGreaterThan(0);
    // by construction the first histogram tick is 0; early trend is positive
    expect(h[h.length - 1]).toBeLessThan(0);
    expect(h[1]).toBeGreaterThan(0);
  });

  it("handles flat series with finite numbers", () => {
    const flat = Array.from({ length: 40 }, () => 50);
    const m = computeMACD(flat);
    const values = m.macd.filter((v) => v !== null) as number[];
    expect(values.every((v) => Number.isFinite(v))).toBe(true);
    // MACD of a flat series converges to 0
    expect(Math.abs(values[values.length - 1])).toBeLessThan(0.01);
  });
});

describe("computeBollingerBands", () => {
  it("returns nulls for insufficient data", () => {
    const b = computeBollingerBands([1, 2, 3], 20);
    expect(b.middle.every((v) => v === null)).toBe(true);
  });

  it("flat data: bands equal the constant", () => {
    const flat = Array.from({ length: 40 }, () => 10);
    const b = computeBollingerBands(flat, 20, 2);
    const i = flat.length - 1;
    expect(b.middle[i]).toBe(10);
    expect(b.upper[i]).toBe(10);
    expect(b.lower[i]).toBe(10);
  });

  it("known dataset: symmetric around mean", () => {
    const b = computeBollingerBands(SERIES, 20, 2);
    const i = SERIES.length - 1;
    expect(b.middle[i]).not.toBeNull();
    expect(b.upper[i]! - b.middle[i]!).toBeCloseTo(b.middle[i]! - b.lower[i]!, 10);
    expect(b.upper[i]!).toBeGreaterThan(b.lower[i]!);
  });

  it("volatile data produces wider bands than flat", () => {
    const volatile = [10, 20, 5, 25, 2, 30, 8, 22, 4, 27, 12, 18, 6, 24, 14, 16, 9, 21, 11, 19];
    const v = computeBollingerBands(volatile, 20, 2);
    const f = computeBollingerBands(Array.from({ length: 20 }, () => 10), 20, 2);
    const volWidth = v.upper[19]! - v.lower[19]!;
    const flatWidth = f.upper[19]! - f.lower[19]!;
    expect(volWidth).toBeGreaterThan(flatWidth);
  });

  it("only fills indices >= period-1", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
    const b = computeBollingerBands(closes, 20, 2);
    for (let i = 0; i < 19; i++) expect(b.middle[i]).toBeNull();
    for (let i = 19; i < 30; i++) expect(b.middle[i]).not.toBeNull();
  });
});

