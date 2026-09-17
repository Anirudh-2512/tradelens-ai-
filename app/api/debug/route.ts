import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";

/** Temporary diagnostic endpoint — REMOVE after provider debugging. */
export async function GET() {
  const probes: Record<string, unknown>[] = [];
  for (const sym of ["AAPL", "MSFT"]) {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}`, {
      headers: { "X-Finnhub-Token": env.FINNHUB_API_KEY },
      cache: "no-store",
    });
    let body = "";
    try {
      body = (await res.text()).slice(0, 120);
    } catch {
      body = "(no body)";
    }
    probes.push({ sym, status: res.status, body });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString(), probes });
}
