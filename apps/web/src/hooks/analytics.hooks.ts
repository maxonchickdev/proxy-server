import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/apis/analytics.api";
import { useCanQueryProtectedApi } from "@/contexts/auth.context";

const ANALYTICS_POLL_MS = 10_000;

const analyticsQueryKeys = {
	summary: (endpointId: string | undefined) =>
		["analytics", endpointId, "summary"] as const,
	timeseries: (
		endpointId: string | undefined,
		params?: { bucket?: "hour" | "day"; limit?: number },
	) => ["analytics", endpointId, "timeseries", params] as const,
};

export const useAnalyticsSummary = (endpointId: string | undefined) => {
	const canQuery = useCanQueryProtectedApi();

	if (!endpointId) {
		throw new Error("Error occured");
	}

	return useQuery({
		queryKey: analyticsQueryKeys.summary(endpointId),
		queryFn: () => analyticsApi.summary(endpointId),
		enabled: canQuery && Boolean(endpointId),
		staleTime: 5_000,
		refetchOnWindowFocus: true,
		refetchInterval: endpointId ? ANALYTICS_POLL_MS : false,
	});
};

export const useAnalyticsTimeseries = (
	endpointId: string | undefined,
	params?: { bucket?: "hour" | "day"; limit?: number },
) => {
	const canQuery = useCanQueryProtectedApi();

	if (!endpointId) {
		throw new Error("Error occured");
	}

	return useQuery({
		queryKey: analyticsQueryKeys.timeseries(endpointId, params),
		queryFn: () => analyticsApi.timeseries(endpointId, params),
		enabled: canQuery && Boolean(endpointId),
		staleTime: 5_000,
		refetchOnWindowFocus: true,
		refetchInterval: endpointId ? ANALYTICS_POLL_MS : false,
	});
};
