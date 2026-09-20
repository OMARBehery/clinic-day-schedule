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
  const code =
    getErrorCode(error) ??
    getErrorCode((error as { cause?: unknown }).cause) ??
    getErrorCode((error as { originalError?: unknown }).originalError);
  return code === "23P01";
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
