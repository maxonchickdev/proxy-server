export const swaggerConst = {
	tag: "Auth",
	route: "auth",
	routes: {
		signUp: {
			route: "sign-up",
			operation: {
				summary: "Register a new user",
				descr:
					"Sends a verification code to email. Use verify-email to complete registration.",
			},
			responses: {
				created: "User created; check email for code",
				conflict: "Conflict - Resource already exists or state conflict",
				tooManyRequests: "Too Many Requests - Rate limit exceeded",
				internalServerError: "Internal Server Error - Unexpected server error",
			},
		},
		verifyEmail: {
			route: "verify-email",
			operation: {
				summary: "Verify email with 6-digit code",
				descr: "",
			},
			responses: {
				ok: "Verified; tokens issued",
				unauthorized: "Invalid or expired code",
			},
		},
		resendVerification: {
			route: "resend-verification",
			operation: {
				summary: "Resend verification code",
				descr: "",
			},
			responses: {
				ok: "Generic success message",
			},
		},
		signIn: {
			route: "sign-in",
			operation: {
				summary: "Authenticate user",
				descr:
					"Requires verified email. Refresh token is set as httpOnly cookie.",
			},
			responses: {
				ok: "Successfully authenticated",
				unauthorized: "Unauthorized - Missing or invalid authentication",
				forbidden: "Email not verified",
				tooManyRequests: "Too Many Requests - Rate limit exceeded",
				internalServerError: "Internal Server Error - Unexpected server error",
			},
		},
		forgotPassword: {
			route: "forgot-password",
			operation: {
				summary: "Request password reset code",
				descr: "",
			},
			responses: {
				ok: "Generic message (no email enumeration)",
			},
		},
		resetPassword: {
			route: "reset-password",
			operation: {
				summary: "Reset password with code",
				descr: "",
			},
			responses: {
				ok: "Password reset",
				unauthorized: "Invalid or expired code",
			},
		},
		refresh: {
			route: "refresh",
			operation: {
				summary: "Refresh access token",
				descr: "Uses httpOnly refresh cookie; rotates refresh token.",
			},
			responses: {
				ok: "New access token; rotated refresh cookie set",
				unauthorized: "Invalid or missing refresh session",
			},
		},
		logout: {
			route: "logout",
			operation: {
				summary: "Revoke refresh session",
				descr:
					"Requires Bearer access token. Clears refresh cookie and revokes server-side session.",
			},
			responses: {
				ok: "Logged out",
			},
		},
		me: {
			route: "me",
			operation: {
				summary: "Current user",
				descr: "",
			},
			responses: {
				ok: "Current user profile",
				unauthorized: "Unauthorized",
			},
		},
	},
};
