import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type EndpointListResponse, endpointsApi } from "@/apis/client.api";
import { useCanQueryProtectedApi } from "@/contexts/auth.context";

const endpointsQueryKey = ["endpoints"] as const;

const useEndpointsList = (params?: { limit?: number; offset?: number }) => {
	const canQuery = useCanQueryProtectedApi();
	return useQuery({
		queryKey: [...endpointsQueryKey, params] as const,
		queryFn: (): Promise<EndpointListResponse> => endpointsApi.list(params),
		enabled: canQuery,
	});
};

const useEndpointDetail = (id: string | undefined) => {
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

const useCreateEndpoint = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: endpointsApi.create,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: endpointsQueryKey });
		},
	});
};

const useUpdateEndpoint = () => {
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

export {
	useCreateEndpoint,
	useEndpointDetail,
	useEndpointsList,
	useUpdateEndpoint,
};
