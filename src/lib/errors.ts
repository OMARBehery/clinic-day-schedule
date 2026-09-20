export type ErrorDetails = Record<string, unknown> | unknown[] | undefined;

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: ErrorDetails;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: ErrorDetails,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isExclusionViolation(error: unknown) {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const code = getErrorCode(current);
    if (code === "23P01") {
      return true;
    }
    current =
      (current as { cause?: unknown }).cause ??
      (current as { originalError?: unknown }).originalError;
  }
  return false;
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  const record = error as { code?: unknown };
  return typeof record.code === "string" ? record.code : undefined;
}

export function publicErrorBody(error: AppError, requestId: string) {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
    requestId,
  };
}
