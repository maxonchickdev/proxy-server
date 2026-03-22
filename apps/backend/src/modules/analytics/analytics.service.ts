import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";

@Injectable()
export class AnalyticsService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async ensureEndpointAccess(endpointId: string, userId: string) {
		const endpoint = await this.prisma.endpoint.findFirst({
			where: { id: endpointId, userId },
		});
		if (!endpoint) {
			throw new ForbiddenException("Access denied");
		}
		return endpoint;
	}

	async getSummary(endpointId: string, userId: string) {
		await this.ensureEndpointAccess(endpointId, userId);

		const now = new Date();
		const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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
						OR: [{ responseStatus: { gte: 500 } }, { responseStatus: null }],
					},
				}),
				this.prisma.requestLog.count({
					where: {
						endpointId,
						responseStatus: { gte: 200, lt: 300 },
					},
				}),
			]);

		const totalForUptime = total || 1;
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

	async getTimeseries(
		endpointId: string,
		userId: string,
		options: { bucket: "hour" | "day"; limit?: number },
	) {
		await this.ensureEndpointAccess(endpointId, userId);

		const limit = Math.min(options.limit ?? 24, 168);
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

		return rows.map((r) => ({
			bucket:
				bucket === "hour"
					? r.bucket.toISOString().slice(0, 13)
					: r.bucket.toISOString().slice(0, 10),
			requests: Number(r.requests),
			avgLatencyMs: Number(r.avgLatencyMs ?? 0),
		}));
	}

	async getBreakdown(endpointId: string, userId: string) {
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
