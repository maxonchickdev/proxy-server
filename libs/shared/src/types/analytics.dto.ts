/** Aggregated metrics for an endpoint dashboard. */
export type AnalyticsSummaryDto = {
	totalRequests: number;
	requestsLast24h: number;
	avgLatencyMs: number;
	uptimePercent: number;
	errorRate: number;
};

/** One bucket in a timeseries chart. */
export type AnalyticsTimeseriesPointDto = {
	bucket: string;
	requests: number;
	avgLatencyMs: number;
};

/** Breakdown of traffic by HTTP method and status. */
export type AnalyticsBreakdownDto = {
	byMethod: Array<{ method: string; count: number }>;
	byStatus: Array<{ status: number; count: number }>;
};
