// ── Environment configuration ────────────────────────────────
// Server-only. Never import this from client components.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `See .env.example for setup instructions.`
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  get FINNHUB_API_KEY() {
    return required("FINNHUB_API_KEY");
  },
  get GROQ_API_KEY() {
    return required("GROQ_API_KEY");
  },
  get TURSO_DATABASE_URL() {
    return required("TURSO_DATABASE_URL");
  },
  get TURSO_AUTH_TOKEN() {
    return required("TURSO_AUTH_TOKEN");
  },
  get JWT_SECRET() {
    return required("JWT_SECRET");
  },
  FINNHUB_WEBHOOK_SECRET: () => optional("FINNHUB_WEBHOOK_SECRET"),
  MARKETAUX_API_TOKEN: () => optional("MARKETAUX_API_TOKEN"),
  CURRENTS_API_KEY: () => optional("CURRENTS_API_KEY"),
  RESEND_API_KEY: () => optional("RESEND_API_KEY"),
  RESEND_FROM_EMAIL: () => optional("RESEND_FROM_EMAIL"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  IS_PROD: process.env.NODE_ENV === "production",
};
