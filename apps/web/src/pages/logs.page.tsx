import { Link, useParams } from "react-router-dom";
import { RequestLogsTableComponent } from "@/components/request-logs-table.component";
import { LoadingSkeletonComponent } from "@/components/ui/loading-skeleton.component";
import { useEndpointsList } from "@/hooks/endpoints.hooks";
import { useLogsByEndpoint } from "@/hooks/logs.hooks";

export const LogsPage = () => {
	const { endpointId } = useParams<{ endpointId?: string }>();
	const {
		data: endpointsData,
		isLoading: endpointsLoading,
		isError: endpointsError,
		error: endpointsListError,
	} = useEndpointsList();
	const endpoints = endpointsData?.items ?? [];
	const { data, isLoading, isError, error } = useLogsByEndpoint(endpointId, {
		limit: 50,
	});

	if (!endpointId) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-medium">Request logs</h1>
				<p className="text-white/60">Select an endpoint:</p>
				{endpointsError ? (
					<p className="text-red-400/90" role="alert">
						{endpointsListError instanceof Error
							? endpointsListError.message
							: "Failed to load endpoints"}
					</p>
				) : endpointsLoading ? (
					<LoadingSkeletonComponent rows={6} className="max-w-md" />
				) : (
					<ul className="space-y-2">
						{endpoints.map((ep) => (
							<li key={ep.id}>
								<Link
									to={`/logs/${ep.id}`}
									className="underline hover:no-underline"
								>
									{ep.name} ({ep.slug})
								</Link>
							</li>
						))}
					</ul>
				)}
				{!endpointsLoading && !endpointsError && endpoints.length === 0 ? (
					<p className="text-white/60">No endpoints yet.</p>
				) : null}
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-medium">Request logs</h1>
				<LoadingSkeletonComponent rows={8} />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-medium">Request logs</h1>
				<p className="text-red-400/90" role="alert">
					{error instanceof Error ? error.message : "Failed to load logs"}
				</p>
			</div>
		);
	}

	const logs = data?.logs ?? [];
	const total = data?.total ?? 0;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-medium">Request logs</h1>
			<p className="text-white/60">{total} total requests</p>
			<div className="overflow-hidden border border-white/20">
				<RequestLogsTableComponent logs={logs} />
			</div>
		</div>
	);
};
