import { useQuery } from "@tanstack/react-query";
import { logsApi } from "@/api/client.api";

const logsQueryKeys = {
	byEndpoint: (
		endpointId: string | undefined,
		params?: { limit?: number; offset?: number },
	) => ["logs", "endpoint", endpointId, params] as const,
};

export function useLogsByEndpoint(
	endpointId: string | undefined,
	params?: { limit?: number; offset?: number },
) {
	return useQuery({
		queryKey: logsQueryKeys.byEndpoint(endpointId, params),
		queryFn: () => logsApi.byEndpoint(endpointId!, params),
		enabled: Boolean(endpointId),
	});
}
