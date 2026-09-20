import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { AppError, publicErrorBody } from "@/lib/errors";

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
}

export function jsonOk<T>(
  request: Request,
  data: T,
  status = 200,
  extraHeaders?: HeadersInit,
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "x-request-id": getRequestId(request),
      ...extraHeaders,
    },
  });
}

export function jsonError(request: Request, error: AppError) {
  return NextResponse.json(publicErrorBody(error, getRequestId(request)), {
    status: error.status,
    headers: { "x-request-id": getRequestId(request) },
  });
}

export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  throw new AppError(
    "VALIDATION_ERROR",
    "Request validation failed",
    400,
    result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}

export function logServerError(request: Request, error: unknown) {
  const payload = {
    level: "error",
    requestId: getRequestId(request),
    method: request.method,
    url: request.url,
    message: error instanceof Error ? error.message : "Unknown error",
  };
  console.error(JSON.stringify(payload));
}

type RouteContext = { params: Promise<Record<string, string>> };

type Handler = (
  request: Request,
  context: RouteContext,
) => Promise<Response> | Response;

export function apiHandler(handler: Handler): Handler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AppError) {
        return jsonError(request, error);
      }
      logServerError(request, error);
      return jsonError(
        request,
        new AppError(
          "INTERNAL_ERROR",
          "An unexpected error occurred",
          500,
        ),
      );
    }
  };
}
