export const swaggerConst = {
	tag: "Auth",
	route: "auth",
	routes: {
		signUp: {
			route: "sign-up",
			operation: {
				summary: "Register a new user",
				descr:
					"Creates an unverified account, hashes the password, stores a time-limited verification code (hashed), and sends a 6-digit code by email. Does not return tokens; call **verify-email** after checking the inbox. Rate limited.",
			},
			responses: {
				created:
					"Account created. Response body contains only a **message**; no tokens.",
				badRequest:
					"Validation failed (e.g. invalid email, password shorter than 8 characters).",
				conflict: "Email is already registered.",
				tooManyRequests: "Rate limit exceeded for this endpoint.",
				internalServerError: "Unexpected server error while creating the user.",
			},
		},
		verifyEmail: {
			route: "verify-email",
			operation: {
				summary: "Verify email with 6-digit code",
				descr:
					"Confirms ownership of the email using the code from sign-up. On success, returns **accessToken** and **user** in the JSON body and sets the **refresh_token** httpOnly cookie (rotating refresh sessions use the same cookie name). Rate limited.",
			},
			responses: {
				ok: "Email verified. **accessToken** and **user** in body; **refresh_token** cookie set.",
				badRequest: "Email is already verified.",
				unauthorized:
					"Unknown email, wrong or expired code, or missing code data.",
			},
		},
		resendVerification: {
			route: "resend-verification",
			operation: {
				summary: "Resend verification code",
				descr:
					"If the account exists and is still unverified, generates a new code and emails it. Response is always a generic **message** to avoid email enumeration. Rate limited.",
			},
			responses: {
				ok: "Generic success **message** (whether or not an email was sent).",
				badRequest: "Email is already verified.",
				tooManyRequests: "Rate limit exceeded for this endpoint.",
			},
		},
		signIn: {
			route: "sign-in",
			operation: {
				summary: "Authenticate user",
				descr:
					"Requires a **verified** email. Returns **accessToken** and **user** in the JSON body and sets the **refresh_token** httpOnly, **Secure** (in production), **SameSite=Lax** cookie. Rate limited.",
			},
			responses: {
				ok: "Authenticated. **accessToken** and **user** in body; **refresh_token** cookie set.",
				badRequest: "Validation failed (e.g. missing password).",
				unauthorized: "Wrong email or password.",
				forbidden: "Email exists but is not verified yet.",
				tooManyRequests: "Rate limit exceeded for this endpoint.",
				internalServerError: "Unexpected server error during sign-in.",
			},
		},
		forgotPassword: {
			route: "forgot-password",
			operation: {
				summary: "Request password reset code",
				descr:
					"If the account exists, stores a time-limited reset code (hashed) and emails a 6-digit code. Response is always a generic **message** to avoid email enumeration. Rate limited.",
			},
			responses: {
				ok: "Generic **message** (no indication whether the email exists).",
				badRequest: "Validation failed (e.g. invalid email).",
				tooManyRequests: "Rate limit exceeded for this endpoint.",
			},
		},
		resetPassword: {
			route: "reset-password",
			operation: {
				summary: "Reset password with code",
				descr:
					"Validates the 6-digit code, sets a new password, clears reset fields, and revokes all refresh tokens for the user. Does not set a new session cookie; sign in again after reset. Rate limited.",
			},
			responses: {
				ok: "Password updated. Generic **message**; sign in to obtain new tokens.",
				badRequest:
					"Validation failed (e.g. password too short, invalid code format).",
				unauthorized: "Unknown email, wrong code, or expired reset code.",
				tooManyRequests: "Rate limit exceeded for this endpoint.",
			},
		},
		refresh: {
			route: "refresh",
			operation: {
				summary: "Refresh access token",
				descr:
					"Reads the **refresh_token** httpOnly cookie, validates the session, **revokes** the previous refresh token, issues a new pair, and sets a fresh **refresh_token** cookie. No `Authorization` header required. Not rate-limited at the application layer.",
			},
			responses: {
				ok: "New **accessToken** and **user** in body; new **refresh_token** cookie.",
				unauthorized:
					"Missing cookie, invalid or revoked token, expired session, or unverified email on record.",
			},
		},
		logout: {
			route: "logout",
			operation: {
				summary: "Revoke refresh session",
				descr:
					"Requires a valid **Bearer** access token (global JWT guard). Revokes the refresh token identified by the **refresh_token** cookie (if present) and clears that cookie. Idempotent if the cookie is already absent.",
			},
			responses: {
				ok: "Session revoked. Body is **{ success: true }**; refresh cookie cleared.",
				unauthorized: "Missing or invalid access token.",
			},
		},
		me: {
			route: "me",
			operation: {
				summary: "Current user",
				descr:
					"Returns the authenticated user (**id**, **email**, **name**) from the database using the **Bearer** access token subject. Fails if the user was deleted after the token was issued.",
			},
			responses: {
				ok: "Current user profile (**id**, **email**, **name**).",
				unauthorized:
					"Missing, invalid, or expired access token; or user no longer exists.",
			},
		},
	},
};
