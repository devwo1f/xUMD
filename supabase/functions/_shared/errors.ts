export type FunctionErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'upstream_error'
  | 'internal_error';

export class HttpError extends Error {
  status: number;
  code: FunctionErrorCode;
  details?: unknown;

  constructor(status: number, code: FunctionErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isHttpError(value: unknown): value is HttpError {
  return value instanceof HttpError;
}

export function toErrorPayload(error: unknown) {
  if (isHttpError(error)) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
    };
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';
  return {
    status: 500,
    body: {
      error: {
        code: 'internal_error' as const,
        message,
        details: null,
      },
    },
  };
}