import { Link, useParams } from "react-router-dom";
import { RequestLogsTableComponent } from "../components/request-logs-table.component";
import { useEndpointsList } from "../hooks/endpoints.hooks";
import { useLogsByEndpoint } from "../hooks/logs.hooks";

export const LogsPage = () => {
	const { endpointId } = useParams<{ endpointId?: string }>();
	const { data: endpoints = [] } = useEndpointsList();
	const { data, isLoading, isError, error } = useLogsByEndpoint(endpointId, {
		limit: 50,
	});

	if (!endpointId) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-medium">Request logs</h1>
				<p className="text-white/60">Select an endpoint:</p>
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
				{endpoints.length === 0 && (
					<p className="text-white/60">No endpoints yet.</p>
				)}
			</div>
		);
	}

	if (isLoading) {
		return <p className="text-white/60">Loading logs...</p>;
	}

	if (isError) {
		return (
			<p className="text-red-400/90">
				{error instanceof Error ? error.message : "Failed to load logs"}
			</p>
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
