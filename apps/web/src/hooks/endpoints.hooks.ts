import type { EndpointListResponse } from "@/apis/types/endpoint-list-response.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpointsApi } from "@/apis/endpoints.api";
import { useCanQueryProtectedApi } from "@/contexts/auth.context";

const endpointsQueryKey = ["endpoints"] as const;

export const useEndpointsList = (params?: {
	limit?: number;
	offset?: number;
}) => {
	const canQuery = useCanQueryProtectedApi();
	return useQuery({
		queryKey: [...endpointsQueryKey, params] as const,
		queryFn: (): Promise<EndpointListResponse> => endpointsApi.list(params),
		enabled: canQuery,
	});
};

export const useEndpointDetail = (id: string | undefined) => {
	const canQuery = useCanQueryProtectedApi();

	if (!id) {
		throw new Error("Error occured");
	}
	return useQuery({
		queryKey: ["endpoints", id],
		queryFn: () => endpointsApi.get(id),
		enabled: canQuery && Boolean(id),
		staleTime: 10_000,
		refetchOnWindowFocus: true,
	});
};

export const useCreateEndpoint = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: endpointsApi.create,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: endpointsQueryKey });
		},
	});
};

export const useUpdateEndpoint = () => {
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
};
