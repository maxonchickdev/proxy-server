import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/client.api";

export function useAnalyticsSummary(endpointId: string | undefined) {
	return useQuery({
		queryKey: ["analytics", endpointId, "summary"],
		queryFn: () => analyticsApi.summary(endpointId!),
		enabled: Boolean(endpointId),
	});
}

export function useAnalyticsTimeseries(
	endpointId: string | undefined,
	params?: { bucket?: "hour" | "day"; limit?: number },
) {
	return useQuery({
		queryKey: ["analytics", endpointId, "timeseries", params],
		queryFn: () => analyticsApi.timeseries(endpointId!, params),
		enabled: Boolean(endpointId),
	});
}
