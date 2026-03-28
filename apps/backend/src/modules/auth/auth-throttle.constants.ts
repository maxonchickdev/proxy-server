/**
 * Per-route rate limits for unauthenticated auth endpoints (Nest Throttler).
 */
export const authThrottle = {
	SIGN_IN: { limit: 10, ttlMs: 60_000 },
	SIGN_UP: { limit: 5, ttlMs: 60_000 },
	VERIFY_EMAIL: { limit: 20, ttlMs: 60_000 },
	RESEND_VERIFICATION: { limit: 3, ttlMs: 60_000 },
	FORGOT_PASSWORD: { limit: 3, ttlMs: 60_000 },
	RESET_PASSWORD: { limit: 10, ttlMs: 60_000 },
} as const;
