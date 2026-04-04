interface RetryOptions {
  attempts?: number;
  initialDelayMs?: number;
  factor?: number;
  retryableStatuses?: number[];
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    attempts = 3,
    initialDelayMs = 300,
    factor = 2,
    retryableStatuses = [408, 409, 425, 429, 500, 502, 503, 504],
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status: number }).status)
          : undefined;

      const isRetryable = status ? retryableStatuses.includes(status) : attempt < attempts - 1;
      if (!isRetryable || attempt === attempts - 1) {
        throw error;
      }

      await wait(initialDelayMs * factor ** attempt);
    }
  }

  throw lastError;
}