import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { logsApi } from "@/apis/client.api";
import { useCanQueryProtectedApi } from "@/contexts/auth.context";

const LOGS_POLL_MS = 10_000;

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
	const canQuery = useCanQueryProtectedApi();
	return useQuery({
		queryKey: logsQueryKeys.byEndpoint(endpointId, params),
		queryFn: () => logsApi.byEndpoint(endpointId!, params),
		enabled: canQuery && Boolean(endpointId),
		staleTime: 5_000,
		refetchOnWindowFocus: true,
		refetchInterval: endpointId ? LOGS_POLL_MS : false,
	});
}

export function useReplayLog(endpointId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (logId: string) => logsApi.replay(logId),
		onSuccess: () => {
			if (endpointId) {
				void queryClient.invalidateQueries({
					queryKey: logsQueryKeys.byEndpoint(endpointId),
				});
			}
		},
	});
}
