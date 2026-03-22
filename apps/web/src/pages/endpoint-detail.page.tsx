import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { RequestLogsTableComponent } from "../components/request-logs-table.component";
import { ButtonComponent } from "../components/ui/button.component";
import { CardComponent } from "../components/ui/card.component";
import {
	useAnalyticsSummary,
	useAnalyticsTimeseries,
} from "../hooks/analytics.hooks";
import { useEndpointDetail, useUpdateEndpoint } from "../hooks/endpoints.hooks";
import { useLogsByEndpoint } from "../hooks/logs.hooks";

export const EndpointDetailPage = () => {
	const { id } = useParams<{ id: string }>();
	const [copied, setCopied] = useState(false);

	const {
		data: endpoint,
		isLoading: epLoading,
		isError: epError,
		error: epErr,
	} = useEndpointDetail(id);
	const { data: summary } = useAnalyticsSummary(id);
	const { data: timeseries = [] } = useAnalyticsTimeseries(id, {
		limit: 24,
	});
	const { data: logsData } = useLogsByEndpoint(id, { limit: 20 });
	const updateMutation = useUpdateEndpoint();

	const apiBase =
		import.meta.env.VITE_API_URL ??
		`${window.location.origin.replace(/:\d+$/, "")}:3000`;
	const proxyUrl = endpoint ? `${apiBase}/r/${endpoint.slug}` : "";

	const copyProxyUrl = () => {
		void navigator.clipboard.writeText(proxyUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (!id) {
		return <div className="text-white/60">Invalid route</div>;
	}

	if (epLoading) {
		return <div className="text-white/60">Loading...</div>;
	}

	if (epError || !endpoint) {
		return (
			<div>
				<p className="text-white/80">
					{epErr instanceof Error ? epErr.message : "Endpoint not found"}
				</p>
				<Link
					to="/endpoints"
					className="mt-4 inline-block underline hover:no-underline"
				>
					Back to endpoints
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Link
						to="/endpoints"
						className="text-sm text-white/60 hover:text-white"
					>
						← Endpoints
					</Link>
					<h1 className="mt-2 text-2xl font-medium">{endpoint.name}</h1>
				</div>
				<ButtonComponent
					type="button"
					onClick={() => {
						if (!id) return;
						void updateMutation.mutateAsync({
							id,
							data: { isActive: !endpoint.isActive },
						});
					}}
					disabled={updateMutation.isPending}
				>
					{endpoint.isActive ? "Deactivate" : "Activate"}
				</ButtonComponent>
			</div>

			<CardComponent>
				<h3 className="mb-2 text-sm font-medium text-white/60">Proxy URL</h3>
				<div className="flex items-center gap-2">
					<code className="flex-1 border border-white/20 bg-black px-3 py-2 font-mono text-sm text-white/80">
						{proxyUrl}
					</code>
					<ButtonComponent type="button" onClick={copyProxyUrl}>
						{copied ? "Copied!" : "Copy"}
					</ButtonComponent>
				</div>
				<p className="mt-2 text-sm text-white/60">
					Target: {endpoint.targetUrl}
				</p>
			</CardComponent>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="border border-white/20 p-4">
					<p className="text-sm text-white/60">Total requests</p>
					<p className="mt-1 text-xl font-medium">
						{summary?.totalRequests ?? "—"}
					</p>
				</div>
				<div className="border border-white/20 p-4">
					<p className="text-sm text-white/60">Last 24h</p>
					<p className="mt-1 text-xl font-medium">
						{summary?.requestsLast24h ?? "—"}
					</p>
				</div>
				<div className="border border-white/20 p-4">
					<p className="text-sm text-white/60">Avg latency</p>
					<p className="mt-1 text-xl font-medium">
						{summary?.avgLatencyMs != null ? `${summary.avgLatencyMs}ms` : "—"}
					</p>
				</div>
				<div className="border border-white/20 p-4">
					<p className="text-sm text-white/60">Uptime</p>
					<p className="mt-1 text-xl font-medium">
						{summary?.uptimePercent != null
							? `${summary.uptimePercent.toFixed(1)}%`
							: "—"}
					</p>
				</div>
			</div>

			{timeseries.length > 0 && (
				<CardComponent>
					<h3 className="mb-4 text-lg font-medium">Request volume</h3>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={timeseries}>
								<CartesianGrid strokeDasharray="3 3" stroke="#444" />
								<XAxis
									dataKey="bucket"
									stroke="#888"
									tick={{ fill: "#888", fontSize: 12 }}
								/>
								<YAxis stroke="#888" tick={{ fill: "#888", fontSize: 12 }} />
								<Tooltip
									contentStyle={{
										backgroundColor: "#000",
										border: "1px solid #444",
									}}
									labelStyle={{ color: "#fff" }}
								/>
								<Area
									type="monotone"
									dataKey="requests"
									stroke="#fff"
									fill="#fff"
									fillOpacity={0.2}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</CardComponent>
			)}

			<CardComponent>
				<h3 className="mb-4 text-lg font-medium">Recent requests</h3>
				<RequestLogsTableComponent logs={logsData?.logs ?? []} />
			</CardComponent>
		</div>
	);
};
