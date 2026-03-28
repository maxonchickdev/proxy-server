import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type {
	AnalyticsBreakdownDto,
	AnalyticsSummaryDto,
	AnalyticsTimeseriesPointDto,
} from "@proxy-server/shared";
import { PrismaService } from "../../core/prisma/prisma.service";
import { analyticsConstants } from "./analytics.constants";

/**
 * Aggregates request log metrics per endpoint for dashboards.
 */
@Injectable()
export class AnalyticsService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async ensureEndpointAccess(
		endpointId: string,
		userId: string,
	): Promise<{ id: string }> {
		const endpoint = await this.prisma.endpoint.findFirst({
			where: { id: endpointId, userId },
		});
		if (!endpoint) {
			throw new ForbiddenException("Access denied");
		}
		return endpoint;
	}

	/** Aggregates totals, latency, uptime and error rate for dashboards. */
	async getSummary(
		endpointId: string,
		userId: string,
	): Promise<AnalyticsSummaryDto> {
		await this.ensureEndpointAccess(endpointId, userId);
		const now = new Date();
		const last24h = new Date(now.getTime() - analyticsConstants.LAST_24H_MS);
		const [total, last24hCount, avgLatency, errorCount, successCount] =
			await Promise.all([
				this.prisma.requestLog.count({ where: { endpointId } }),
				this.prisma.requestLog.count({
					where: { endpointId, createdAt: { gte: last24h } },
				}),
				this.prisma.requestLog.aggregate({
					where: { endpointId, durationMs: { not: null } },
					_avg: { durationMs: true },
				}),
				this.prisma.requestLog.count({
					where: {
						endpointId,
						OR: [
							{
								responseStatus: {
									gte: analyticsConstants.HTTP_STATUS_SERVER_ERROR_THRESHOLD,
								},
							},
							{ responseStatus: null },
						],
					},
				}),
				this.prisma.requestLog.count({
					where: {
						endpointId,
						responseStatus: {
							gte: analyticsConstants.HTTP_STATUS_SUCCESS_MIN,
							lt: analyticsConstants.HTTP_STATUS_SUCCESS_MAX,
						},
					},
				}),
			]);
		const totalForUptime = total || analyticsConstants.UPTIME_DIVISOR_FALLBACK;
		const uptimePercent = ((successCount / totalForUptime) * 100).toFixed(2);
		const errorRate = ((errorCount / totalForUptime) * 100).toFixed(2);
		return {
			totalRequests: total,
			requestsLast24h: last24hCount,
			avgLatencyMs: Math.round(avgLatency._avg.durationMs ?? 0),
			uptimePercent: parseFloat(uptimePercent),
			errorRate: parseFloat(errorRate),
		};
	}

	/** Returns time-bucketed request volume and latency for charts. */
	async getTimeseries(
		endpointId: string,
		userId: string,
		options: { bucket: "hour" | "day"; limit?: number },
	): Promise<AnalyticsTimeseriesPointDto[]> {
		await this.ensureEndpointAccess(endpointId, userId);
		const limit = Math.min(
			options.limit ?? analyticsConstants.DEFAULT_TIMESERIES_LIMIT,
			analyticsConstants.MAX_TIMESERIES_LIMIT,
		);
		const bucket = options.bucket ?? "hour";
		const truncUnit = bucket === "hour" ? "hour" : "day";
		type Row = {
			bucket: Date;
			requests: bigint;
			avgLatencyMs: bigint | null;
		};
		const rows = await this.prisma.$queryRawUnsafe<Row[]>(
			`SELECT * FROM (
				SELECT date_trunc($1::text, "created_at") AS bucket,
					COUNT(*)::bigint AS requests,
					COALESCE(ROUND(AVG("duration_ms"))::bigint, 0) AS "avgLatencyMs"
				FROM "request_logs"
				WHERE "endpoint_id" = $2::uuid
				GROUP BY 1
				ORDER BY 1 DESC
				LIMIT $3
			) sub ORDER BY 1 ASC`,
			truncUnit,
			endpointId,
			limit,
		);
		const prefixLen =
			bucket === "hour"
				? analyticsConstants.ISO_HOUR_BUCKET_PREFIX_LENGTH
				: analyticsConstants.ISO_DAY_BUCKET_PREFIX_LENGTH;
		return rows.map((r) => ({
			bucket: r.bucket.toISOString().slice(0, prefixLen),
			requests: Number(r.requests),
			avgLatencyMs: Number(r.avgLatencyMs ?? 0),
		}));
	}

	/** Groups request counts by HTTP method and response status. */
	async getBreakdown(
		endpointId: string,
		userId: string,
	): Promise<AnalyticsBreakdownDto> {
		await this.ensureEndpointAccess(endpointId, userId);
		const [byMethod, byStatus] = await Promise.all([
			this.prisma.requestLog.groupBy({
				by: ["method"],
				where: { endpointId },
				_count: { id: true },
			}),
			this.prisma.requestLog.groupBy({
				by: ["responseStatus"],
				where: { endpointId },
				_count: { id: true },
			}),
		]);
		return {
			byMethod: byMethod.map((m) => ({
				method: m.method,
				count: m._count.id,
			})),
			byStatus: byStatus
				.filter((s) => s.responseStatus != null)
				.map((s) => ({
					status: s.responseStatus as number,
					count: s._count.id,
				})),
		};
	}
}
