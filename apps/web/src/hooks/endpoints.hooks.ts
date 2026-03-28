import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpointsApi, type EndpointListResponse } from "@/api/client.api";

const endpointsQueryKey = ["endpoints"] as const;

export function useEndpointsList(params?: { limit?: number; offset?: number }) {
	return useQuery({
		queryKey: [...endpointsQueryKey, params] as const,
		queryFn: (): Promise<EndpointListResponse> => endpointsApi.list(params),
	});
}

export function useEndpointDetail(id: string | undefined) {
	return useQuery({
		queryKey: ["endpoints", id],
		queryFn: () => endpointsApi.get(id!),
		enabled: Boolean(id),
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
