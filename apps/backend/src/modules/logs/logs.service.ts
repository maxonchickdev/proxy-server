import type { Endpoint, Prisma, RequestLog } from "@prisma/generated/client";
import type { LogsListQueryDto } from "./dto/logs-list-query.dto";
import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { paginationConstants } from "../../common/constants/pagination.constants";
import { PrismaService } from "../../core/prisma/prisma.service";
import { type ProxyLogPayload, ProxyService } from "../../proxy/proxy.service";
import { proxyRequestConstants } from "../../proxy/proxy-request.constants";

@Injectable()
export class LogsService {
	constructor(
		@Inject(PrismaService) private readonly prismaService: PrismaService,
		@Inject(ProxyService) private readonly proxyService: ProxyService,
	) {}

	async findByEndpoint(
		endpointId: string,
		userId: string,
		query: LogsListQueryDto,
	): Promise<{ logs: RequestLog[]; total: number }> {
		const endpoint = await this.prismaService.endpoint.findFirst({
			where: { id: endpointId, userId },
		});
		if (!endpoint) {
			throw new ForbiddenException("Access denied");
		}
		const limit =
			query.limit ??
			Math.min(
				paginationConstants.DEFAULT_LIST_LIMIT,
				paginationConstants.MAX_LIST_LIMIT,
			);
		const offset = query.offset ?? paginationConstants.DEFAULT_OFFSET;
		const where: Record<string, unknown> = { endpointId };
		if (query.method) where.method = query.method;
		if (query.status != null) where.responseStatus = query.status;
		const [logs, total] = await Promise.all([
			this.prismaService.requestLog.findMany({
				where,
				orderBy: { createdAt: "desc" },
				take: Math.min(limit, paginationConstants.MAX_LIST_LIMIT),
				skip: offset,
			}),
			this.prismaService.requestLog.count({ where }),
		]);
		return { logs, total };
	}

	async findOne(
		logId: string,
		userId: string,
	): Promise<
		RequestLog & {
			endpoint: Endpoint;
		}
	> {
		const log = await this.prismaService.requestLog.findUnique({
			where: { id: logId },
			include: { endpoint: true },
		});
		if (!log) {
			throw new NotFoundException("Log not found");
		}
		if (log.endpoint.userId !== userId) {
			throw new ForbiddenException("Access denied");
		}
		return log;
	}

	async replay(
		logId: string,
		userId: string,
	): Promise<{
		newLogId: string;
		responseStatus: number | null;
		responseBody: string | null;
		durationMs: number;
	}> {
		const log = await this.findOne(logId, userId);
		const { endpoint } = log;
		const targetUrl = this.proxyService.buildTargetUrl(
			endpoint,
			log.path,
			log.queryParams ?? "",
		);
		const targetHost = new URL(endpoint.targetUrl).host;
		const storedHeaders = jsonHeadersToRecord(log.requestHeaders);
		const headers = this.proxyService.cleanHeadersForUpstream(
			storedHeaders,
			targetHost,
		);
		const method = log.method;
		const bodyAllowed = !["GET", "HEAD"].includes(method.toUpperCase());
		const body = bodyAllowed && log.requestBody ? log.requestBody : undefined;
		const started = Date.now();
		try {
			const upstreamRes = await fetch(targetUrl, {
				method,
				headers: headers as HeadersInit,
				...(body !== undefined ? { body } : {}),
				signal: AbortSignal.timeout(proxyRequestConstants.UPSTREAM_TIMEOUT_MS),
			});
			const durationMs = Date.now() - started;
			const buf = Buffer.from(await upstreamRes.arrayBuffer());
			const responseHeaders: Record<string, string> = {};
			upstreamRes.headers.forEach((v, k) => {
				responseHeaders[k] = v;
			});
			const entry: ProxyLogPayload = {
				endpointId: endpoint.id,
				method: `${method} (replay)`,
				path: log.path,
				queryParams: log.queryParams,
				requestHeaders: this.proxyService.maskSensitiveHeaders(headers),
				requestBody: log.requestBody,
				responseStatus: upstreamRes.status,
				responseHeaders:
					this.proxyService.maskSensitiveHeaders(responseHeaders),
				responseBody: this.proxyService.truncateForLog(
					buf,
					proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
				),
				durationMs,
				clientIp: null,
				protocol: endpoint.protocol,
				metadata: {
					replayedFromLogId: logId,
				},
			};
			const newLogId = await this.proxyService.persistRequestLog(entry);
			return {
				newLogId,
				responseStatus: upstreamRes.status,
				responseBody: entry.responseBody,
				durationMs,
			};
		} catch {
			const durationMs = Date.now() - started;
			const entry: ProxyLogPayload = {
				endpointId: endpoint.id,
				method: `${method} (replay)`,
				path: log.path,
				queryParams: log.queryParams,
				requestHeaders: this.proxyService.maskSensitiveHeaders(headers),
				requestBody: log.requestBody,
				responseStatus: proxyRequestConstants.HTTP_BAD_GATEWAY,
				responseHeaders: null,
				responseBody: null,
				durationMs,
				clientIp: null,
				protocol: endpoint.protocol,
				metadata: {
					replayedFromLogId: logId,
					replayError: true,
				},
			};
			const newLogId = await this.proxyService.persistRequestLog(entry);
			return {
				newLogId,
				responseStatus: proxyRequestConstants.HTTP_BAD_GATEWAY,
				responseBody: null,
				durationMs,
			};
		}
	}
}

function jsonHeadersToRecord(
	value: Prisma.JsonValue | null,
): Record<string, string | string[] | undefined> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}
	const out: Record<string, string | string[] | undefined> = {};
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
		if (typeof v === "string") out[k] = v;
		else if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
			out[k] = v as string[];
		}
	}
	return out;
}
