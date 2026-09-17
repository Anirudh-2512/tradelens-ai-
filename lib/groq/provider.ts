import Groq from "groq-sdk";
import type {
  AIProvider,
  MarketAnalysisInput,
  MarketSummary,
} from "@/types/market";
import { env } from "@/lib/config/env";
import { logger } from "@/lib/utils/logger";

/**
 * Groq-backed AIProvider (spec §21–23).
 * - Uses ONLY the supplied market context; the prompt forbids invention.
 * - Response is JSON with a strict contract; invalid output is rejected.
 * - Never presents itself as financial advice.
 */

const MODEL = "openai/gpt-oss-120b";

function buildSystemPrompt(): string {
  return [
    "You are a market analysis engine for TradeLens AI, a financial intelligence platform.",
    "You will be given a JSON object containing: the ticker, current quote data, technical indicator values (RSI/MACD/Bollinger), optionally recent news headlines and price-trend context.",
    "",
    "STRICT RULES:",
    "1. Use ONLY the numbers and facts supplied in the input JSON. Do NOT invent, estimate, or recall prices, dates, earnings figures, or news. If data is missing, say so.",
    "2. Clearly distinguish observed facts from interpretation.",
    "3. Express uncertainty. Avoid guaranteed or probabilistic claims about future prices.",
    "4. Never give personalized financial advice, never recommend buying or selling.",
    "5. Keep tone factual and terse, like a Bloomberg terminal analyst note.",
    "",
    "Respond with ONLY a JSON object (no markdown fences) matching exactly:",
    '{"summary": string (2-4 sentences), "sentiment": "bullish"|"neutral"|"bearish", "keyFactors": string[] (3-5 items), "technicalContext": string[] (2-4 items), "risks": string[] (2-4 items), "confidence": "low"|"medium"|"high"}',
  ].join("\n");
}

function buildUserPrompt(input: MarketAnalysisInput): string {
  return JSON.stringify({
    symbol: input.symbol,
    companyName: input.companyName ?? null,
    quote: input.quote,
    indicators: input.indicators,
    recentNews: input.recentNews ?? null,
    candleContext: input.candleContext ?? null,
  });
}

function validate(raw: string, symbol: string): MarketSummary | null {
  void symbol;
  let parsed: unknown;
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.summary !== "string" || typeof obj.sentiment !== "string") return null;
  if (!["bullish", "neutral", "bearish"].includes(obj.sentiment)) return null;
  if (!Array.isArray(obj.keyFactors) || !Array.isArray(obj.risks)) return null;

  return {
    summary: obj.summary,
    sentiment: obj.sentiment as MarketSummary["sentiment"],
    keyFactors: (obj.keyFactors as unknown[]).filter((k): k is string => typeof k === "string"),
    technicalContext: Array.isArray(obj.technicalContext)
      ? (obj.technicalContext as unknown[]).filter((c): c is string => typeof c === "string")
      : [],
    risks: (obj.risks as unknown[]).filter((r): r is string => typeof r === "string"),
    confidence: ["low", "medium", "high"].includes(String(obj.confidence))
      ? (obj.confidence as MarketSummary["confidence"])
      : "medium",
  };
}

export class GroqProvider {
  private client: Groq | null = null;

  private getClient(): Groq {
    if (!this.client) this.client = new Groq({ apiKey: env.GROQ_API_KEY });
    return this.client;
  }

  async generateMarketSummary(input: MarketAnalysisInput): Promise<MarketSummary> {
    try {
      const completion = await this.getClient().chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(input) },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const summary = validate(raw, input.symbol);
      if (!summary) {
        logger.error("groq.invalid_output", "generateMarketSummary");
        throw new Error("AI_UNAVAILABLE");
      }
      return summary;
    } catch (err) {
      if (!(err instanceof Error) || err.message !== "AI_UNAVAILABLE") {
        logger.error("groq.request_failed", "generateMarketSummary", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
      throw new Error("AI_UNAVAILABLE");
    }
  }
}

export const aiProvider: AIProvider = new GroqProvider();
