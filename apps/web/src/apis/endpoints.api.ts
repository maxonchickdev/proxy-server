import type {
	EndpointDto,
	EndpointListResponseDto,
	RateLimitConfig,
	TransformRule,
} from "@proxy-server/shared";
import type { HttpClient } from "./helpers/http-client";
import { httpClient } from "./helpers/http-client";

class EndpointsApi {
	constructor(private readonly http: HttpClient) {}

	list(params?: { limit?: number; offset?: number }) {
		const search = new URLSearchParams();
		if (params?.limit != null) search.set("limit", String(params.limit));
		if (params?.offset != null) search.set("offset", String(params.offset));
		const qs = search.toString();
		return this.http.request<EndpointListResponseDto>(
			`/endpoints${qs ? `?${qs}` : ""}`,
		);
	}

	create(data: {
		name: string;
		targetUrl: string;
		rateLimitConfig?: RateLimitConfig;
		transformRules?: TransformRule[];
		isActive?: boolean;
	}) {
		return this.http.request<EndpointDto>("/endpoints", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	get(id: string) {
		return this.http.request<EndpointDto>(`/endpoints/${id}`);
	}

	update(
		id: string,
		data: {
			name?: string;
			targetUrl?: string;
			rateLimitConfig?: RateLimitConfig | null;
			transformRules?: TransformRule[] | null;
			isActive?: boolean;
		},
	) {
		return this.http.request<EndpointDto>(`/endpoints/${id}`, {
			method: "PATCH",
			body: JSON.stringify(data),
		});
	}

	delete(id: string) {
		return this.http.request<{ success: boolean }>(`/endpoints/${id}`, {
			method: "DELETE",
		});
	}
}

const endpointsApi = new EndpointsApi(httpClient);

export { EndpointsApi, endpointsApi };
