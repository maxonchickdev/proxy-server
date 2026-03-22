import { useQuery } from "@tanstack/react-query";
import { logsApi } from "../api/client.api";

export function useLogsByEndpoint(
	endpointId: string | undefined,
	params?: { limit?: number; offset?: number },
) {
	return useQuery({
		queryKey: ["logs", "endpoint", endpointId, params],
		queryFn: () => logsApi.byEndpoint(endpointId!, params),
		enabled: Boolean(endpointId),
	});
}
