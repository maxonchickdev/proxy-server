import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type EndpointListResponse, endpointsApi } from "@/apis/client.api";
import { useCanQueryProtectedApi } from "@/contexts/auth.context";

const endpointsQueryKey = ["endpoints"] as const;

export function useEndpointsList(params?: { limit?: number; offset?: number }) {
	const canQuery = useCanQueryProtectedApi();
	return useQuery({
		queryKey: [...endpointsQueryKey, params] as const,
		queryFn: (): Promise<EndpointListResponse> => endpointsApi.list(params),
		enabled: canQuery,
	});
}

export function useEndpointDetail(id: string | undefined) {
	const canQuery = useCanQueryProtectedApi();
	return useQuery({
		queryKey: ["endpoints", id],
		queryFn: () => endpointsApi.get(id!),
		enabled: canQuery && Boolean(id),
		staleTime: 10_000,
		refetchOnWindowFocus: true,
	});
}

export function useCreateEndpoint() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: endpointsApi.create,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: endpointsQueryKey });
		},
	});
}

export function useUpdateEndpoint() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: Parameters<typeof endpointsApi.update>[1];
		}) => endpointsApi.update(id, data),
		onSuccess: (_data, { id }) => {
			void queryClient.invalidateQueries({ queryKey: endpointsQueryKey });
			void queryClient.invalidateQueries({ queryKey: ["endpoints", id] });
		},
	});
}
