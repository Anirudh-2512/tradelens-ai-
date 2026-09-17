import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/sessions";
import { listPortfolios, createPortfolio } from "@/lib/portfolio/queries";
import { portfolioCreateSchema } from "@/lib/validation/schemas";
import { errors, getRequestId, handleApiError } from "@/lib/utils/api";
import { rateLimit } from "@/lib/utils/rate-limit";

export async function GET() {
  const requestId = getRequestId();
  const endpoint = "GET /api/portfolio";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const portfolios = await listPortfolios(userId);
    return NextResponse.json({ success: true, data: { portfolios } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId();
  const endpoint = "POST /api/portfolio";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();
    if (!rateLimit(`pf:${userId}`, 20, 60_000).allowed) throw errors.rateLimited();

    const body = await request.json().catch(() => null);
    const parsed = portfolioCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw errors.invalidBody(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const portfolio = await createPortfolio(userId, parsed.data.name, parsed.data.baseCurrency);
    return NextResponse.json({ success: true, data: { portfolio } }, { status: 201 });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
