/**
 * Limits and HTTP semantics for the public reverse-proxy middleware.
 */
export const proxyRequestConstants = {
	BODY_LIMIT_BYTES: 1024 * 1024,
	UPSTREAM_TIMEOUT_MS: 30_000,
	LOG_BODY_TRUNCATION_BYTES: 100 * 1024,
	HTTP_NOT_FOUND: 404,
	HTTP_PAYLOAD_TOO_LARGE: 413,
	HTTP_BAD_GATEWAY: 502,
} as const;
