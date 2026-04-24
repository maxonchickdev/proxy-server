export const Swagger = {
	Tag: "Auth",
	Route: "auth",
	Routes: {
		SignUp: {
			Route: "sign-up",
			Operation: {
				Summary: "Register a new user",
				Descr:
					"Creates an unverified account, hashes the password, stores a time-limited verification code (hashed), and sends a 6-digit code by email. Does not return tokens; call **verify-email** after checking the inbox. Rate limited.",
			},
			Responses: {
				Created:
					"Account created. Response body contains only a **message**; no tokens.",
				BadRequest:
					"Validation failed (e.g. invalid email, password shorter than 8 characters).",
				Conflict: "Email is already registered.",
				TooManyRequests: "Rate limit exceeded for this endpoint.",
				InternalServerError: "Unexpected server error while creating the user.",
			},
		},
		VerifyEmail: {
			Route: "verify-email",
			Operation: {
				Summary: "Verify email with 6-digit code",
				Descr:
					"Confirms ownership of the email using the code from sign-up. On success, returns **accessToken** and **user** in the JSON body and sets the **refresh_token** httpOnly cookie (rotating refresh sessions use the same cookie name). Rate limited.",
			},
			Responses: {
				Ok: "Email verified. **accessToken** and **user** in body; **refresh_token** cookie set.",
				BadRequest: "Email is already verified.",
				Unauthorized:
					"Unknown email, wrong or expired code, or missing code data.",
			},
		},
		ResendVerification: {
			Route: "resend-verification",
			Operation: {
				Summary: "Resend verification code",
				Descr:
					"If the account exists and is still unverified, generates a new code and emails it. Response is always a generic **message** to avoid email enumeration. Rate limited.",
			},
			Responses: {
				Ok: "Generic success **message** (whether or not an email was sent).",
				BadRequest: "Email is already verified.",
				TooManyRequests: "Rate limit exceeded for this endpoint.",
			},
		},
		SignIn: {
			Route: "sign-in",
			Operation: {
				Summary: "Authenticate user",
				Descr:
					"Requires a **verified** email. Returns **accessToken** and **user** in the JSON body and sets the **refresh_token** httpOnly, **Secure** (in production), **SameSite=Lax** cookie. Rate limited.",
			},
			Responses: {
				Ok: "Authenticated. **accessToken** and **user** in body; **refresh_token** cookie set.",
				BadRequest: "Validation failed (e.g. missing password).",
				Unauthorized: "Wrong email or password.",
				Forbidden: "Email exists but is not verified yet.",
				TooManyRequests: "Rate limit exceeded for this endpoint.",
				InternalServerError: "Unexpected server error during sign-in.",
			},
		},
		ForgotPassword: {
			Route: "forgot-password",
			Operation: {
				Summary: "Request password reset code",
				Descr:
					"If the account exists, stores a time-limited reset code (hashed) and emails a 6-digit code. Response is always a generic **message** to avoid email enumeration. Rate limited.",
			},
			Responses: {
				Ok: "Generic **message** (no indication whether the email exists).",
				BadRequest: "Validation failed (e.g. invalid email).",
				TooManyRequests: "Rate limit exceeded for this endpoint.",
			},
		},
		ResetPassword: {
			Route: "reset-password",
			Operation: {
				Summary: "Reset password with code",
				Descr:
					"Validates the 6-digit code, sets a new password, clears reset fields, and revokes all refresh tokens for the user. Does not set a new session cookie; sign in again after reset. Rate limited.",
			},
			Responses: {
				Ok: "Password updated. Generic **message**; sign in to obtain new tokens.",
				BadRequest:
					"Validation failed (e.g. password too short, invalid code format).",
				Unauthorized: "Unknown email, wrong code, or expired reset code.",
				TooManyRequests: "Rate limit exceeded for this endpoint.",
			},
		},
		Refresh: {
			Route: "refresh",
			Operation: {
				Summary: "Refresh access token",
				Descr:
					"Reads the **refresh_token** httpOnly cookie, validates the session, **revokes** the previous refresh token, issues a new pair, and sets a fresh **refresh_token** cookie. No `Authorization` header required. Not rate-limited at the application layer.",
			},
			Responses: {
				Ok: "New **accessToken** and **user** in body; new **refresh_token** cookie.",
				Unauthorized:
					"Missing cookie, invalid or revoked token, expired session, or unverified email on record.",
			},
		},
		Logout: {
			Route: "logout",
			Operation: {
				Summary: "Revoke refresh session",
				Descr:
					"Requires a valid **Bearer** access token (global JWT guard). Revokes the refresh token identified by the **refresh_token** cookie (if present) and clears that cookie. Idempotent if the cookie is already absent.",
			},
			Responses: {
				Ok: "Session revoked. Body is **{ success: true }**; refresh cookie cleared.",
				Unauthorized: "Missing or invalid access token.",
			},
		},
		Me: {
			Route: "me",
			Operation: {
				Summary: "Current user",
				Descr:
					"Returns the authenticated user (**id**, **email**, **name**) from the database using the **Bearer** access token subject. Fails if the user was deleted after the token was issued.",
			},
			Responses: {
				Ok: "Current user profile (**id**, **email**, **name**).",
				Unauthorized:
					"Missing, invalid, or expired access token; or user no longer exists.",
			},
		},
	},
};
