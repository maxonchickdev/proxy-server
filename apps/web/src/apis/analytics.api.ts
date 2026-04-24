import type {
	AnalyticsBreakdownDto,
	AnalyticsSummaryDto,
	AnalyticsTimeseriesPointDto,
} from "@proxy-server/shared";
import type { HttpClient } from "./helpers/http-client";
import { httpClient } from "./helpers/http-client";

class AnalyticsApi {
	constructor(private readonly http: HttpClient) {}

	summary(endpointId: string) {
		return this.http.request<AnalyticsSummaryDto>(
			`/analytics/${endpointId}/summary`,
		);
	}

	timeseries(
		endpointId: string,
		params?: { bucket?: "hour" | "day"; limit?: number },
	) {
		const search = new URLSearchParams();
		if (params?.bucket) search.set("bucket", params.bucket);
		if (params?.limit) search.set("limit", String(params.limit));
		const q = search.toString();
		return this.http.request<AnalyticsTimeseriesPointDto[]>(
			`/analytics/${endpointId}/timeseries${q ? `?${q}` : ""}`,
		);
	}

	breakdown(endpointId: string) {
		return this.http.request<AnalyticsBreakdownDto>(
			`/analytics/${endpointId}/breakdown`,
		);
	}
}

export const analyticsApi = new AnalyticsApi(httpClient);
