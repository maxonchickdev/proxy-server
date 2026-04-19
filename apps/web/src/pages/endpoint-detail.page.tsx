import { useEffect, useState } from "react";
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
import { ButtonComponent } from "@/components/button.component";
import { CardComponent } from "@/components/card.component";
import { InputComponent } from "@/components/input.component";
import { RequestLogsTableComponent } from "@/components/request-logs-table.component";
import {
	useAnalyticsSummary,
	useAnalyticsTimeseries,
} from "@/hooks/analytics.hooks";
import { useEndpointDetail, useUpdateEndpoint } from "@/hooks/endpoints.hooks";
import { useLogsByEndpoint, useReplayLog } from "@/hooks/logs.hooks";

const EndpointDetailPage = () => {
	const { id } = useParams<{ id: string }>();
	const [copied, setCopied] = useState(false);
	const [toggleError, setToggleError] = useState<string | null>(null);
	const [rateMax, setRateMax] = useState("");
	const [rateWindowSec, setRateWindowSec] = useState("");
	const [transformJson, setTransformJson] = useState("");
	const [advError, setAdvError] = useState<string | null>(null);
	const [replayMsg, setReplayMsg] = useState<string | null>(null);
	const {
		data: endpoint,
		isLoading: epLoading,
		isError: epError,
		error: epErr,
	} = useEndpointDetail(id);
	const {
		data: summary,
		isError: summaryError,
		error: summaryErr,
		isLoading: summaryLoading,
	} = useAnalyticsSummary(id);
	const {
		data: timeseries = [],
		isError: timeseriesError,
		error: timeseriesErr,
		isLoading: timeseriesLoading,
	} = useAnalyticsTimeseries(id, { limit: 24 });
	const {
		data: logsData,
		isError: logsError,
		error: logsErr,
		isLoading: logsLoading,
	} = useLogsByEndpoint(id, { limit: 20 });
	const updateMutation = useUpdateEndpoint();
	const replayMutation = useReplayLog(id);

	const apiBase = "http://localhost:3000";
	const proxyUrl = endpoint ? `${apiBase}/r/${endpoint.slug}` : "";

	const handleCopyProxyUrl = () => {
		void navigator.clipboard.writeText(proxyUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	useEffect(() => {
		if (!endpoint) return;
		setTransformJson(
			endpoint.transformRules
				? JSON.stringify(endpoint.transformRules, null, 2)
				: "",
		);
		if (endpoint.rateLimitConfig) {
			setRateMax(String(endpoint.rateLimitConfig.maxRequests));
			setRateWindowSec(String(endpoint.rateLimitConfig.windowSeconds));
		} else {
			setRateMax("");
			setRateWindowSec("");
		}
	}, [endpoint]);

	const handleSaveAdvancedClick = async () => {
		if (!id || !endpoint) return;
		setAdvError(null);
		let transformRules: unknown;
		if (transformJson.trim()) {
			try {
				transformRules = JSON.parse(transformJson) as unknown;
				if (!Array.isArray(transformRules)) {
					setAdvError("Transform rules must be a JSON array");
					return;
				}
			} catch {
				setAdvError("Invalid JSON for transform rules");
				return;
			}
		}
		const rateLimitConfig =
			rateMax.trim() && rateWindowSec.trim()
				? {
						maxRequests: Number.parseInt(rateMax, 10),
						windowSeconds: Number.parseInt(rateWindowSec, 10),
					}
				: null;
		if (
			rateLimitConfig &&
			(!Number.isFinite(rateLimitConfig.maxRequests) ||
				!Number.isFinite(rateLimitConfig.windowSeconds))
		) {
			setAdvError("Invalid rate limit");
			return;
		}
		try {
			await updateMutation.mutateAsync({
				id,
				data: {
					...(rateLimitConfig
						? { rateLimitConfig }
						: { rateLimitConfig: null }),
					transformRules:
						transformJson.trim() && transformRules
							? (transformRules as never)
							: null,
				},
			});
		} catch (err) {
			setAdvError(
				err instanceof Error ? err.message : "Failed to save advanced settings",
			);
		}
	};

	const handleReplayLog = (logId: string) => {
		setReplayMsg(null);
		replayMutation.mutate(logId, {
			onSuccess: (r) => {
				setReplayMsg(
					`Replay complete — new log ${r.newLogId}, status ${r.responseStatus}`,
				);
			},
			onError: (err) => {
				setReplayMsg(err instanceof Error ? err.message : "Replay failed");
			},
		});
	};

	const handleToggleActiveClick = async () => {
		if (!id || !endpoint) return;
		try {
			setToggleError(null);
			await updateMutation.mutateAsync({
				id,
				data: { isActive: !endpoint.isActive },
			});
		} catch (err) {
			setToggleError(
				err instanceof Error ? err.message : "Failed to update endpoint status",
			);
		}
	};

	if (!id) {
		return <div className="text-white/60">Invalid route</div>;
	}

	if (epLoading) {
		return (
			<p className="text-white/60" aria-busy="true">
				Loading...
			</p>
		);
	}

	if (epError || !endpoint) {
		return (
			<div role="alert">
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
				<div className="flex flex-col items-end gap-2">
					<ButtonComponent
						type="button"
						onClick={() => void handleToggleActiveClick()}
						disabled={updateMutation.isPending}
					>
						{endpoint.isActive ? "Deactivate" : "Activate"}
					</ButtonComponent>
					{toggleError ? (
						<p
							className="max-w-xs text-right text-sm text-red-400/90"
							role="alert"
						>
							{toggleError}
						</p>
					) : null}
				</div>
			</div>

			<CardComponent>
				<h2 className="mb-2 text-sm font-medium text-white/60">Proxy URL</h2>
				<div className="flex items-center gap-2">
					<code className="flex-1 border border-white/20 bg-black px-3 py-2 font-mono text-sm text-white/80">
						{proxyUrl}
					</code>
					<ButtonComponent type="button" onClick={handleCopyProxyUrl}>
						{copied ? "Copied!" : "Copy"}
					</ButtonComponent>
				</div>
				<p className="mt-2 text-sm text-white/60">
					Target: {endpoint.targetUrl}
				</p>
				<p className="mt-1 text-sm text-white/60">
					HTTP reverse proxy to{" "}
					<span className="text-white">http:// or https://</span> upstream
				</p>
			</CardComponent>

			<CardComponent>
				<h2 className="mb-4 text-lg font-medium">Routing & limits</h2>
				{advError ? (
					<p className="mb-2 text-sm text-red-400/90" role="alert">
						{advError}
					</p>
				) : null}
				<div className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<InputComponent
							label="Rate limit max requests"
							type="number"
							name="rateMax"
							value={rateMax}
							onChange={(e) => setRateMax(e.target.value)}
							placeholder="leave empty to clear"
						/>
						<InputComponent
							label="Rate limit window (sec)"
							type="number"
							name="rateWindow"
							value={rateWindowSec}
							onChange={(e) => setRateWindowSec(e.target.value)}
							placeholder="leave empty to clear"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="adv-transforms" className="text-sm text-white/80">
							Transform rules JSON
						</label>
						<textarea
							id="adv-transforms"
							name="advTransforms"
							value={transformJson}
							onChange={(e) => setTransformJson(e.target.value)}
							rows={5}
							className="w-full border border-white/30 bg-black px-3 py-2 font-mono text-sm text-white"
						/>
					</div>
					<ButtonComponent
						type="button"
						onClick={() => void handleSaveAdvancedClick()}
						disabled={updateMutation.isPending}
					>
						{updateMutation.isPending ? "Saving…" : "Save routing settings"}
					</ButtonComponent>
				</div>
			</CardComponent>

			{summaryError ? (
				<p className="text-red-400/90" role="alert">
					{summaryErr instanceof Error
						? summaryErr.message
						: "Failed to load analytics summary"}
				</p>
			) : summaryLoading ? (
				<p className="text-white/60 text-sm" aria-busy="true">
					Loading metrics...
				</p>
			) : null}

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

			{timeseriesError ? (
				<p className="text-red-400/90" role="alert">
					{timeseriesErr instanceof Error
						? timeseriesErr.message
						: "Failed to load chart data"}
				</p>
			) : timeseriesLoading ? (
				<p className="text-white/60 text-sm" aria-busy="true">
					Loading chart...
				</p>
			) : timeseries.length > 0 ? (
				<CardComponent>
					<h2 className="mb-4 text-lg font-medium">Request volume</h2>
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
			) : (
				<CardComponent>
					<h2 className="mb-2 text-lg font-medium">Request volume</h2>
					<p className="text-sm text-white/60">No data yet for this period.</p>
				</CardComponent>
			)}

			<CardComponent>
				<h2 className="mb-4 text-lg font-medium">Recent requests</h2>
				{replayMsg ? (
					<p className="mb-2 text-sm text-white/80" role="status">
						{replayMsg}
					</p>
				) : null}
				{logsError ? (
					<p className="text-red-400/90" role="alert">
						{logsErr instanceof Error ? logsErr.message : "Failed to load logs"}
					</p>
				) : logsLoading ? (
					<p className="text-white/60 text-sm" aria-busy="true">
						Loading logs...
					</p>
				) : (
					<RequestLogsTableComponent
						logs={logsData?.logs ?? []}
						onReplay={handleReplayLog}
					/>
				)}
			</CardComponent>
		</div>
	);
};

export { EndpointDetailPage };
