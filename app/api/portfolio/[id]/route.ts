import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/sessions";
import {
  assertOwnedPortfolio,
  renamePortfolio,
  deletePortfolio,
  upsertHolding,
  deleteHolding,
  listTransactions,
} from "@/lib/portfolio/queries";
import {
  portfolioPatchSchema,
  transactionSchema,
  idSchema,
} from "@/lib/validation/schemas";
import { errors, getRequestId, handleApiError, badRequestOr } from "@/lib/utils/api-extra";
import { computePortfolioSummary } from "@/lib/portfolio/valuation";
import { logDbFailure } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "GET /api/portfolio/[id]";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const { id } = await params;
    const pid = idSchema.safeParse(id);
    if (!pid.success) throw errors.badRequest("Invalid portfolio id.");

    const owned = await assertOwnedPortfolio(userId, pid.data);
    if (!owned) throw errors.forbidden();

    const summary = await computePortfolioSummary(userId, pid.data);
    const transactions = await listTransactions(pid.data);

    return NextResponse.json({
      success: true,
      data: {
        portfolio: owned,
        holdings: summary.holdings,
        totals: summary.totals,
        currency: summary.currency,
        transactions,
      },
    });
  } catch (err) {
    logDbFailure(endpoint, err, requestId);
    return handleApiError(err, { endpoint, requestId });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "PATCH /api/portfolio/[id]";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const { id } = await params;
    const pid = idSchema.safeParse(id);
    if (!pid.success) throw errors.badRequest("Invalid portfolio id.");

    const owned = await assertOwnedPortfolio(userId, pid.data);
    if (!owned) throw errors.forbidden();

    const body = await request.json().catch(() => null);
    const parsed = portfolioPatchSchema.safeParse(body);
    if (!parsed.success) throw errors.invalidBody("Invalid name.");

    await renamePortfolio(pid.data, parsed.data.name);
    return NextResponse.json({ success: true, data: { ok: true } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "POST /api/portfolio/[id]";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const { id } = await params;
    const pid = idSchema.safeParse(id);
    if (!pid.success) throw errors.badRequest("Invalid portfolio id.");

    const owned = await assertOwnedPortfolio(userId, pid.data);
    if (!owned) throw errors.forbidden();

    const body = await request.json().catch(() => null);
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      throw errors.invalidBody(parsed.error.issues[0]?.message ?? "Invalid transaction");
    }

    const executedAt = parsed.data.executedAt
      ? Math.floor(new Date(parsed.data.executedAt).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    const result = await upsertHolding(
      pid.data,
      parsed.data.symbol,
      parsed.data.type,
      parsed.data.quantity,
      parsed.data.price,
      parsed.data.fees,
      executedAt
    );
    if (result.error) throw badRequestOr(result.error);

    return NextResponse.json({ success: true, data: { ok: true } }, { status: 201 });
  } catch (err) {
    logDbFailure(endpoint, err, requestId);
    return handleApiError(err, { endpoint, requestId });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId();
  const endpoint = "DELETE /api/portfolio/[id]";
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) throw errors.unauthorized();

    const { id } = await params;
    const pid = idSchema.safeParse(id);
    if (!pid.success) throw errors.badRequest("Invalid portfolio id.");

    const owned = await assertOwnedPortfolio(userId, pid.data);
    if (!owned) throw errors.forbidden();

    // Two modes: remove holding (?holdingId=) or delete whole portfolio.
    const holdingIdRaw = request.nextUrl.searchParams.get("holdingId");
    if (holdingIdRaw) {
      const holdingId = idSchema.safeParse(holdingIdRaw);
      if (!holdingId.success) throw errors.badRequest("Invalid holding id.");
      const removed = await deleteHolding(pid.data, holdingId.data);
      if (!removed) throw errors.forbidden();
      return NextResponse.json({ success: true, data: { ok: true, removedHolding: true } });
    }

    await deletePortfolio(pid.data);
    return NextResponse.json({ success: true, data: { ok: true, deleted: true } });
  } catch (err) {
    return handleApiError(err, { endpoint, requestId });
  }
}
