import {
	Inject,
	Injectable,
	Logger,
	type NestMiddleware,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NextFunction, Request, Response } from "express";
import { ConfigKeyEnum } from "../common/enums/config.enum";
import { ProxyService } from "./proxy.service";

const BODY_LIMIT = 1024 * 1024;

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
	private readonly logger = new Logger(ProxyMiddleware.name);

	constructor(
		@Inject(ProxyService) private readonly proxyService: ProxyService,
		@Inject(ConfigService) private readonly config: ConfigService,
	) {}

	async use(req: Request, res: Response, next: NextFunction) {
		const { slug, path, isProxy } = this.extractSlugAndPath(req);
		if (!isProxy || !slug) {
			return next();
		}

		const endpoint = await this.proxyService.resolveEndpoint(slug);
		if (!endpoint) {
			res.status(404).json({
				error: "Endpoint not found",
				message: `No proxy endpoint found for slug: ${slug}`,
			});
			return;
		}

		const startTime = Date.now();
		let requestBody: Buffer | null = null;

		try {
			requestBody = await this.bufferBody(req, BODY_LIMIT);
		} catch {
			res.status(413).json({ error: "Request entity too large" });
			return;
		}

		const queryString = req.url.includes("?")
			? req.url.slice(req.url.indexOf("?") + 1)
			: "";
		const targetUrl = this.proxyService.buildTargetUrl(
			endpoint,
			path,
			queryString,
		);

		const targetHost = new URL(endpoint.targetUrl).host;
		const headers = this.proxyService.cleanHeadersForUpstream(
			req.headers as Record<string, string | string[] | undefined>,
			targetHost,
		);

		const method = req.method ?? "GET";
		const bodyAllowed = !["GET", "HEAD"].includes(method.toUpperCase());
		const upstreamBody: BodyInit | undefined =
			bodyAllowed && requestBody?.length
				? Uint8Array.from(requestBody)
				: undefined;

		try {
			const upstream = await fetch(targetUrl, {
				method,
				headers,
				body: upstreamBody,
				signal: AbortSignal.timeout(30_000),
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
				requestBody: this.proxyService.truncateForLog(requestBody, 100 * 1024),
				responseStatus: upstream.status,
				responseHeaders:
					this.proxyService.maskSensitiveHeaders(responseHeadersObj),
				responseBody: this.proxyService.truncateForLog(
					responseBuffer,
					100 * 1024,
				),
				durationMs,
				clientIp: this.proxyService.getClientIp(
					req.headers as Record<string, string | string[] | undefined>,
				),
			});
		} catch (err: unknown) {
			const durationMs = Date.now() - startTime;
			const status = 502;
			const body = {
				error: "Bad Gateway",
				message: "Could not reach target",
			};

			this.logger.error(
				`Upstream fetch failed: ${err instanceof Error ? err.message : err}`,
				err instanceof Error ? err.stack : undefined,
			);

			res.status(status).json(body);

			this.proxyService.logRequest({
				endpointId: endpoint.id,
				method: req.method,
				path,
				queryParams: queryString || null,
				requestHeaders: this.proxyService.maskSensitiveHeaders(
					headers as Record<string, string>,
				),
				requestBody: this.proxyService.truncateForLog(requestBody, 100 * 1024),
				responseStatus: status,
				responseHeaders: null,
				responseBody: null,
				durationMs,
				clientIp: this.proxyService.getClientIp(
					req.headers as Record<string, string | string[] | undefined>,
				),
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
