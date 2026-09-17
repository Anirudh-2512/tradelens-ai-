import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

/** Known, safe error codes. Internal failures map to a generic 500. */
export const errors = {
  unauthorized: (
    msg = "Authentication required."
  ): ApiError => ({ code: "UNAUTHORIZED", message: msg, status: 401 }),
  forbidden: (
    msg = "You do not have access to this resource."
  ): ApiError => ({ code: "FORBIDDEN", message: msg, status: 403 }),
  notFound: (
    msg = "Resource not found."
  ): ApiError => ({ code: "NOT_FOUND", message: msg, status: 404 }),
  badRequest: (
    msg = "Invalid request."
  ): ApiError => ({ code: "BAD_REQUEST", message: msg, status: 400 }),
  rateLimited: (
    msg = "Too many requests. Please slow down."
  ): ApiError => ({ code: "RATE_LIMITED", message: msg, status: 429 }),
  marketDataUnavailable: (): ApiError => ({
    code: "MARKET_DATA_UNAVAILABLE",
    message: "Market data is temporarily unavailable.",
    status: 503,
  }),
  aiUnavailable: (): ApiError => ({
    code: "AI_UNAVAILABLE",
    message: "AI analysis is temporarily unavailable. Please try again later.",
    status: 503,
  }),
  configuration: (): ApiError => ({
    code: "SERVICE_NOT_CONFIGURED",
    message: "This feature is not configured on the server.",
    status: 503,
  }),
  invalidBody: (msg = "Request body failed validation."): ApiError => ({
    code: "VALIDATION_ERROR",
    message: msg,
    status: 422,
  }),
  internal: (): ApiError => ({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    status: 500,
  }),
};

export function errorResponse(err: ApiError) {
  return NextResponse.json(
    { success: false, error: { code: err.code, message: err.message } },
    { status: err.status }
  );
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Wrap a route handler: converts thrown ApiError instances into shaped
 * responses; converts unexpected failures into sanitized 500s while
 * logging full context server-side.
 */
export function handleApiError(
  err: unknown,
  context: { endpoint: string; requestId: string }
): NextResponse {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    "status" in err &&
    "message" in err
  ) {
    const apiErr = err as ApiError;
    logger.warn("api.error", context.endpoint, {
      requestId: context.requestId,
      code: apiErr.code,
      status: apiErr.status,
    });
    return errorResponse(apiErr);
  }

  logger.error("api.unhandled", context.endpoint, {
    requestId: context.requestId,
    error: err instanceof Error ? err.message : String(err),
  });
  return errorResponse(errors.internal());
}

export function getRequestId(): string {
  return crypto.randomUUID();
}
