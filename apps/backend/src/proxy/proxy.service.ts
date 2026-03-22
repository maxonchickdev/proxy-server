import { Inject, Injectable, Logger } from "@nestjs/common";
import { type Endpoint, Prisma } from "@prisma/generated/client";
import { PrismaService } from "../core/prisma/prisma.service";
import { EndpointsService } from "../modules/endpoints/endpoints.service";
import { NotificationsService } from "../modules/notifications/notifications.service";

@Injectable()
export class ProxyService {
	private readonly logger = new Logger(ProxyService.name);

	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(EndpointsService)
		private readonly endpointsService: EndpointsService,
		@Inject(NotificationsService)
		private readonly notifications: NotificationsService,
	) {}

	async resolveEndpoint(slug: string): Promise<Endpoint | null> {
		return this.endpointsService.findBySlug(slug);
	}

	async logRequest(data: {
		endpointId: string;
		method: string;
		path: string;
		queryParams: string | null;
		requestHeaders: Record<string, string> | null;
		requestBody: string | null;
		responseStatus: number | null;
		responseHeaders: Record<string, string> | null;
		responseBody: string | null;
		durationMs: number;
		clientIp: string | null;
	}) {
		const payload = {
			endpointId: data.endpointId,
			method: data.method,
			path: data.path,
			queryParams: data.queryParams,
			requestHeaders: data.requestHeaders ?? Prisma.JsonNull,
			requestBody: data.requestBody,
			responseStatus: data.responseStatus,
			responseHeaders: data.responseHeaders ?? Prisma.JsonNull,
			responseBody: data.responseBody,
			durationMs: data.durationMs,
			clientIp: data.clientIp,
		};
		this.prisma.requestLog
			.create({ data: payload })
			.catch((err: unknown) =>
				this.logger.error(
					`Failed to log request: ${err instanceof Error ? err.message : err}`,
					err instanceof Error ? err.stack : undefined,
				),
			);

		this.notifications
			.evaluateAndNotify(data.endpointId, {
				responseStatus: data.responseStatus,
				durationMs: data.durationMs,
				method: data.method,
				path: data.path,
			})
			.catch((err: unknown) =>
				this.logger.error(
					`Notification evaluation failed: ${err instanceof Error ? err.message : err}`,
					err instanceof Error ? err.stack : undefined,
				),
			);
	}

	truncateForLog(value: string | Buffer | null, limit: number): string | null {
		if (value == null) return null;
		const str = Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
		if (str.length <= limit) return str;
		return `${str.slice(0, limit)}\n...[truncated]`;
	}

	buildTargetUrl(
		endpoint: Endpoint,
		path: string,
		queryString: string,
	): string {
		const base = endpoint.targetUrl.replace(/\/$/, "");
		const pathPart = path.startsWith("/") ? path : `/${path}`;
		const url = `${base}${pathPart}`;
		return queryString ? `${url}?${queryString}` : url;
	}

	maskSensitiveHeaders(
		headers: Record<string, string>,
	): Record<string, string> {
		const mask = "[REDACTED]";
		const sensitive = new Set([
			"authorization",
			"cookie",
			"x-api-key",
			"x-auth-token",
			"proxy-authorization",
		]);
		const result: Record<string, string> = {};
		for (const [key, value] of Object.entries(headers)) {
			result[key] = sensitive.has(key.toLowerCase()) ? mask : value;
		}
		return result;
	}

	getClientIp(
		headers: Record<string, string | string[] | undefined>,
	): string | null {
		const forwarded = headers["x-forwarded-for"];
		if (forwarded) {
			const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
			return first?.split(",")[0]?.trim() ?? null;
		}
		return null;
	}

	cleanHeadersForUpstream(
		headers: Record<string, string | string[] | undefined>,
		targetHost: string,
	): Record<string, string> {
		const skip = new Set([
			"host",
			"connection",
			"content-length",
			"transfer-encoding",
		]);
		const result: Record<string, string> = { Host: targetHost };
		for (const [key, value] of Object.entries(headers)) {
			const lower = key.toLowerCase();
			if (skip.has(lower)) continue;
			if (value === undefined) continue;
			const v = Array.isArray(value) ? value.join(", ") : value;
			result[key] = v;
		}
		return result;
	}
}
