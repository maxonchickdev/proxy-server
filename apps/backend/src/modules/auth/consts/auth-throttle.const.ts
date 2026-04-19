export const authThrottleConst = {
	signIn: { limit: 10, ttlMs: 60_000 },
	signUp: { limit: 5, ttlMs: 60_000 },
	verifyEmail: { limit: 20, ttlMs: 60_000 },
	resendVerification: { limit: 3, ttlMs: 60_000 },
	forgotPassword: { limit: 3, ttlMs: 60_000 },
	resetPassword: { limit: 10, ttlMs: 60_000 },
} as const;
