import { auth401NoRefreshConst } from "../consts/auth-401-no-refresh.const";
import { getApiClientConfig } from "./configure-api-client.helper";
import { parseResponseHelper } from "./parse-response.helper";
import { refreshAccessTokenHelper } from "./refresh-access-token.helper";

class HttpClient {
	async request<T>(
		path: string,
		options: RequestInit = {},
		retried = false,
	): Promise<T> {
		const cfg = getApiClientConfig();
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...(options.headers as Record<string, string>),
		};

		const token = cfg.getAccessToken();
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const res = await fetch(path, {
			...options,
			headers,
			credentials: "include",
		});

		if (res.status === 401 && !retried && !auth401NoRefreshConst.has(path)) {
			const refreshed = await refreshAccessTokenHelper();
			if (refreshed) {
				cfg.setSession(refreshed.accessToken, refreshed.user);
				return this.request<T>(path, options, true);
			}
			cfg.onSessionExpired();
			throw new Error("Unauthorized");
		}
		return parseResponseHelper<T>(res);
	}
}

const httpClient = new HttpClient();

export { HttpClient, httpClient };
