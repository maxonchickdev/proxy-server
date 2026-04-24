export const AuthThrottle = {
	SignIn: { Limit: 10, TtlMs: 60_000 },
	SignUp: { Limit: 5, TtlMs: 60_000 },
	VerifyEmail: { Limit: 20, TtlMs: 60_000 },
	ResendVerification: { Limit: 3, TtlMs: 60_000 },
	ForgotPassword: { Limit: 3, TtlMs: 60_000 },
	ResetPassword: { Limit: 10, TtlMs: 60_000 },
} as const;
