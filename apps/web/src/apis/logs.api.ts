import type { RequestLogDto } from "@/types/request-log.dto";
import type { HttpClient } from "./helpers/http-client";
import { httpClient } from "./helpers/http-client";

class LogsApi {
	constructor(private readonly http: HttpClient) {}

	byEndpoint(
		endpointId: string,
		params?: {
			limit?: number;
			offset?: number;
			method?: string;
			status?: number;
		},
	) {
		const search = new URLSearchParams();
		if (params?.limit) search.set("limit", String(params.limit));
		if (params?.offset) search.set("offset", String(params.offset));
		if (params?.method) search.set("method", params.method);
		if (params?.status) search.set("status", String(params.status));
		const q = search.toString();
		return this.http.request<{ logs: RequestLogDto[]; total: number }>(
			`/logs/endpoint/${endpointId}${q ? `?${q}` : ""}`,
		);
	}

	get(id: string) {
		return this.http.request<RequestLogDto>(`/logs/${id}`);
	}

	replay(id: string) {
		return this.http.request<{
			newLogId: string;
			responseStatus: number | null;
			responseBody: string | null;
			durationMs: number;
		}>(`/logs/${id}/replay`, { method: "POST" });
	}
}

export const logsApi = new LogsApi(httpClient);
