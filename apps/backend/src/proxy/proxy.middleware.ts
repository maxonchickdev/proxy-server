import {
	Inject,
	Injectable,
	Logger,
	type NestMiddleware,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NextFunction, Request, Response } from "express";
import { ConfigKeyEnum } from "../common/enums/config.enum";
import { proxyRequestConstants } from "./proxy-request.constants";
import { ProxyService } from "./proxy.service";
import type { Endpoint } from "@prisma/generated/client";

type HeadersRecord = Record<string, string | string[] | undefined>;

/**
 * Intercepts `/r/:slug` (and subdomain) traffic and forwards to configured targets.
 */
@Injectable()
export class ProxyMiddleware implements NestMiddleware {
	private readonly logger = new Logger(ProxyMiddleware.name);

	constructor(
		@Inject(ProxyService) private readonly proxyService: ProxyService,
		@Inject(ConfigService) private readonly config: ConfigService,
	) {}

	async use(req: Request, res: Response, next: NextFunction): Promise<void> {
		const { slug, path, isProxy } = this.extractSlugAndPath(req);
		if (!isProxy || !slug) {
			next();
			return;
		}
		const endpoint = await this.proxyService.resolveEndpoint(slug);
		if (!endpoint) {
			this.writeJson(res, proxyRequestConstants.HTTP_NOT_FOUND, {
				error: "Endpoint not found",
				message: `No proxy endpoint found for slug: ${slug}`,
			});
			return;
		}
		const startTime = Date.now();
		let requestBody: Buffer | null = null;
		try {
			requestBody = await this.bufferBody(
				req,
				proxyRequestConstants.BODY_LIMIT_BYTES,
			);
		} catch {
			this.writeJson(res, proxyRequestConstants.HTTP_PAYLOAD_TOO_LARGE, {
				error: "Request entity too large",
			});
			return;
		}
		const queryString = this.extractQueryString(req.url);
		const targetUrl = this.proxyService.buildTargetUrl(
			endpoint,
			path,
			queryString,
		);
		const targetHost = new URL(endpoint.targetUrl).host;
		const headers = this.proxyService.cleanHeadersForUpstream(
			req.headers as HeadersRecord,
			targetHost,
		);
		await this.forwardToUpstreamAndLog({
			req,
			res,
			endpoint,
			path,
			queryString,
			requestBody,
			headers,
			targetUrl,
			startTime,
		});
	}

	private writeJson(res: Response, status: number, body: object): void {
		res.status(status).json(body);
	}

	private extractQueryString(rawUrl: string): string {
		const q = rawUrl.indexOf("?");
		return q >= 0 ? rawUrl.slice(q + 1) : "";
	}

	private async forwardToUpstreamAndLog(ctx: {
		req: Request;
		res: Response;
		endpoint: Endpoint;
		path: string;
		queryString: string;
		requestBody: Buffer | null;
		headers: HeadersRecord;
		targetUrl: string;
		startTime: number;
	}): Promise<void> {
		const {
			req,
			res,
			endpoint,
			path,
			queryString,
			requestBody,
			headers,
			targetUrl,
			startTime,
		} = ctx;
		const method = req.method ?? "GET";
		const bodyAllowed = !["GET", "HEAD"].includes(method.toUpperCase());
		const upstreamBody: BodyInit | undefined =
			bodyAllowed && requestBody?.length
				? Uint8Array.from(requestBody)
				: undefined;
		try {
			const upstream = await fetch(targetUrl, {
				method,
				headers: headers as HeadersInit,
				body: upstreamBody,
				signal: AbortSignal.timeout(proxyRequestConstants.UPSTREAM_TIMEOUT_MS),
			});
			const durationMs = Date.now() - startTime;
			const responseBuffer = Buffer.from(await upstream.arrayBuffer());
			res.status(upstream.status);
			const hopByHop = new Set([
				"transfer-encoding",
				"content-encoding",
				"connection",
			]);
			upstream.headers.forEach((value, key) => {
				if (hopByHop.has(key.toLowerCase())) return;
				res.setHeader(key, value);
			});
			res.send(responseBuffer);
			const responseHeadersObj: Record<string, string> = {};
			upstream.headers.forEach((value, key) => {
				responseHeadersObj[key] = value;
			});
			this.proxyService.logRequest({
				endpointId: endpoint.id,
				method: req.method,
				path,
				queryParams: queryString || null,
				requestHeaders: this.proxyService.maskSensitiveHeaders(
					headers as Record<string, string>,
				),
				requestBody: this.proxyService.truncateForLog(
					requestBody,
					proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
				),
				responseStatus: upstream.status,
				responseHeaders:
					this.proxyService.maskSensitiveHeaders(responseHeadersObj),
				responseBody: this.proxyService.truncateForLog(
					responseBuffer,
					proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
				),
				durationMs,
				clientIp: this.proxyService.getClientIp(req.headers as HeadersRecord),
			});
		} catch (err: unknown) {
			const durationMs = Date.now() - startTime;
			const status = proxyRequestConstants.HTTP_BAD_GATEWAY;
			this.logger.error(
				`Upstream fetch failed: ${err instanceof Error ? err.message : err}`,
				err instanceof Error ? err.stack : undefined,
			);
			res.status(status).json({
				error: "Bad Gateway",
				message: "Could not reach target",
			});
			this.proxyService.logRequest({
				endpointId: endpoint.id,
				method: req.method,
				path,
				queryParams: queryString || null,
				requestHeaders: this.proxyService.maskSensitiveHeaders(
					headers as Record<string, string>,
				),
				requestBody: this.proxyService.truncateForLog(
					requestBody,
					proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
				),
				responseStatus: status,
				responseHeaders: null,
				responseBody: null,
				durationMs,
				clientIp: this.proxyService.getClientIp(req.headers as HeadersRecord),
			});
		}
	}

	private extractSlugAndPath(req: Request): {
		slug: string | null;
		path: string;
		isProxy: boolean;
	} {
		const host = req.headers.host ?? "";
		const path = (req.originalUrl ?? req.url ?? req.path ?? "").split("?")[0];
		const pathMatch = path.match(/^\/r\/([a-z0-9]+)(\/.*)?$/i);
		if (pathMatch) {
			return {
				slug: pathMatch[1],
				path: pathMatch[2] ?? "/",
				isProxy: true,
			};
		}
		const baseDomain =
			this.config.get<string>(`${ConfigKeyEnum.PROXY}.baseDomain`) ?? "lvh.me";
		const parts = host.split(".");
		if (parts.length >= 2) {
			const subdomain = parts[0];
			const rest = parts.slice(1).join(".");
			if (rest === baseDomain || rest.endsWith(`.${baseDomain}`)) {
				const skip = ["www", "api", "app", "dashboard"];
				if (!skip.includes(subdomain.toLowerCase())) {
					return {
						slug: subdomain,
						path: path || "/",
						isProxy: true,
					};
				}
			}
		}
		return { slug: null, path, isProxy: false };
	}

	private bufferBody(req: Request, limit: number): Promise<Buffer | null> {
		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			let size = 0;
			req.on("data", (chunk: Buffer) => {
				size += chunk.length;
				if (size > limit) {
					req.destroy();
					reject(new Error("Body too large"));
					return;
				}
				chunks.push(chunk);
			});
			req.on("end", () =>
				resolve(chunks.length ? Buffer.concat(chunks) : null),
			);
			req.on("error", reject);
		});
	}
}
