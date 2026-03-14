import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureEndpointAccess(endpointId: string, userId: string) {
    const endpoint = await this.prisma.endpoint.findFirst({
      where: { id: endpointId, userId },
    });
    if (!endpoint) {
      throw new ForbiddenException('Access denied');
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
            OR: [
              { responseStatus: { gte: 500 } },
              { responseStatus: null },
            ],
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
    options: { bucket: 'hour' | 'day'; limit?: number },
  ) {
    await this.ensureEndpointAccess(endpointId, userId);

    const limit = Math.min(options.limit ?? 24, 168); // max 7 days hourly
    const bucket = options.bucket ?? 'hour';

    const logs = await this.prisma.requestLog.findMany({
      where: { endpointId },
      select: {
        createdAt: true,
        durationMs: true,
        responseStatus: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const buckets = new Map<string, { count: number; totalLatency: number }>();
    const formatKey = (d: Date) => {
      if (bucket === 'hour') {
        d.setMinutes(0, 0, 0);
        return d.toISOString().slice(0, 13);
      }
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    };

    for (const log of logs) {
      const key = formatKey(new Date(log.createdAt));
      const cur = buckets.get(key) ?? { count: 0, totalLatency: 0 };
      cur.count += 1;
      cur.totalLatency += log.durationMs ?? 0;
      buckets.set(key, cur);
    }

    const sorted = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-limit)
      .map(([bucketKey, data]) => ({
        bucket: bucketKey,
        requests: data.count,
        avgLatencyMs:
          data.count > 0
            ? Math.round(data.totalLatency / data.count)
            : 0,
      }));

    return sorted;
  }

  async getBreakdown(endpointId: string, userId: string) {
    await this.ensureEndpointAccess(endpointId, userId);

    const [byMethod, byStatus] = await Promise.all([
      this.prisma.requestLog.groupBy({
        by: ['method'],
        where: { endpointId },
        _count: { id: true },
      }),
      this.prisma.requestLog.groupBy({
        by: ['responseStatus'],
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
          status: s.responseStatus,
          count: s._count.id,
        })),
    };
  }
}
