import type {
	ForgotPassword,
	ResendVerification,
	ResetPassword,
	SignIn,
	SignUp,
	UserDto,
	VerifyEmail,
} from "@proxy-server/shared";
import { type HttpClient, httpClient } from "./helpers/http-client";
import { toApiUrl } from "./helpers/to-api-url.helper";

class AuthApi {
	constructor(private readonly http: HttpClient) {}

	signUp(data: SignUp) {
		return this.http.request<{ message: string }>("/auth/sign-up", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	signIn(data: SignIn) {
		return this.http.request<{ accessToken: string; user: UserDto }>(
			"/auth/sign-in",
			{
				method: "POST",
				body: JSON.stringify(data),
			},
		);
	}

	verifyEmail(data: VerifyEmail) {
		return this.http.request<{ accessToken: string; user: UserDto }>(
			"/auth/verify-email",
			{
				method: "POST",
				body: JSON.stringify(data),
			},
		);
	}

	resendVerification(data: ResendVerification) {
		return this.http.request<{ message: string }>("/auth/resend-verification", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	forgotPassword(data: ForgotPassword) {
		return this.http.request<{ message: string }>("/auth/forgot-password", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	resetPassword(data: ResetPassword) {
		return this.http.request<{ message: string }>("/auth/reset-password", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	me() {
		return this.http.request<UserDto>("/auth/me");
	}

	async logout(accessToken: string | null) {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
		await fetch(toApiUrl("/auth/logout"), {
			method: "POST",
			credentials: "include",
			headers,
		});
	}
}

export const authApi = new AuthApi(httpClient);
