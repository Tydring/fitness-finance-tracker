const NETWORK_ERRORS = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN'];

/**
 * Returns true for errors that should be retried (429, 5xx, network errors).
 * Returns false for 4xx client errors (permanent failures).
 */
export function isRetryableError(error) {
  // Notion SDK wraps HTTP errors with a `status` property
  const status = error?.status ?? error?.response?.status;
  if (status) {
    if (status === 429) return true;       // rate-limited
    if (status >= 500 && status < 600) return true;  // server error
    if (status >= 400 && status < 500) return false;  // client error — permanent
  }

  // Network-level errors
  const code = error?.code ?? error?.cause?.code;
  if (code && NETWORK_ERRORS.includes(code)) return true;

  // Unknown errors — default to retryable so Cloud Functions retry picks them up
  return !status;
}
