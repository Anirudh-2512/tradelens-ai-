import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email("Enter a valid email address")
  .transform((v) => v.toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a digit");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});

export const symbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9.\-:]{1,20}$/, "Invalid symbol");

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "Query required").max(40),
});

export const portfolioCreateSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(60),
  baseCurrency: z.string().trim().length(3).default("USD"),
});

export const portfolioPatchSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(60),
});

export const holdingAddSchema = z.object({
  symbol: symbolSchema,
  quantity: z.number().positive("Quantity must be positive").max(1_000_000_000),
  price: z.number().positive("Price must be positive").max(10_000_000).optional(),
  fees: z.number().min(0).max(1_000_000).default(0),
});

export const transactionSchema = z.object({
  symbol: symbolSchema,
  type: z.enum(["buy", "sell"]),
  quantity: z.number().positive("Quantity must be positive").max(1_000_000_000),
  price: z.number().min(0.0001, "Price must be positive").max(10_000_000),
  fees: z.number().min(0).max(1_000_000).default(0),
  executedAt: z.string().datetime().optional(),
});

export const watchlistCreateSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(60),
});

export const watchlistPatchSchema = watchlistCreateSchema;

export const watchlistItemSchema = z.object({
  symbol: symbolSchema,
});

export const idSchema = z.coerce.number().int().positive();

export const aiSummarySchema = z.object({
  symbol: symbolSchema,
});

export const timeframeSchema = z
  .enum(["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"])
  .default("1M");
