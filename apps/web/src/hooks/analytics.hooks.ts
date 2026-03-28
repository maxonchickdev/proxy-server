import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/client.api";

const analyticsQueryKeys = {
	summary: (endpointId: string | undefined) =>
		["analytics", endpointId, "summary"] as const,
	timeseries: (
		endpointId: string | undefined,
		params?: { bucket?: "hour" | "day"; limit?: number },
	) => ["analytics", endpointId, "timeseries", params] as const,
};

export function useAnalyticsSummary(endpointId: string | undefined) {
	return useQuery({
		queryKey: analyticsQueryKeys.summary(endpointId),
		queryFn: () => analyticsApi.summary(endpointId!),
		enabled: Boolean(endpointId),
	});
}

export function useAnalyticsTimeseries(
	endpointId: string | undefined,
	params?: { bucket?: "hour" | "day"; limit?: number },
) {
	return useQuery({
		queryKey: analyticsQueryKeys.timeseries(endpointId, params),
		queryFn: () => analyticsApi.timeseries(endpointId!, params),
		enabled: Boolean(endpointId),
	});
}
