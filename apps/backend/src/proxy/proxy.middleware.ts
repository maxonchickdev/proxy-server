import type { NextFunction, Request, Response } from "express";
import type { ProtocolHandler } from "./handlers/protocol-handler.interface.js";
import { Inject, Injectable, type NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EndpointProtocol } from "@prisma/generated/client";
import { ConfigKeyEnum } from "../common/enums/config.enum.js";
import { GraphqlProxyHandler } from "./handlers/graphql-proxy.handler.js";
import { HttpProxyHandler } from "./handlers/http-proxy.handler.js";
import { SseProxyHandler } from "./handlers/sse-proxy.handler.js";
import { ProxyService } from "./proxy.service.js";
import { ProxyRateLimitService } from "./proxy-rate-limit.service.js";
import { proxyRequestConstants } from "./proxy-request.constants.js";
import { extractSlugAndPathFromProxyRequest } from "./proxy-routing.util.js";

type HeadersRecord = Record<string, string | string[] | undefined>;

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
	private readonly handlers: ProtocolHandler[];

	constructor(
		@Inject(ProxyService) private readonly proxyService: ProxyService,
		@Inject(ConfigService) private readonly config: ConfigService,
		@Inject(ProxyRateLimitService)
		private readonly rateLimit: ProxyRateLimitService,
		@Inject(GraphqlProxyHandler)
		private readonly graphqlHandler: GraphqlProxyHandler,
		@Inject(SseProxyHandler) private readonly sseHandler: SseProxyHandler,
		@Inject(HttpProxyHandler) private readonly httpHandler: HttpProxyHandler,
	) {
		this.handlers = [this.graphqlHandler, this.sseHandler, this.httpHandler];
	}

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
		if (
			endpoint.protocol === EndpointProtocol.GRPC ||
			endpoint.protocol === EndpointProtocol.TCP
		) {
			this.writeJson(res, proxyRequestConstants.HTTP_BAD_REQUEST, {
				error: "Invalid protocol for HTTP proxy",
				message:
					"This endpoint uses gRPC or TCP; connect to the dedicated proxy port.",
			});
			return;
		}
		if (endpoint.protocol === EndpointProtocol.WEBSOCKET) {
			const upgrade = req.headers.upgrade;
			const conn = req.headers.connection;
			const isWsUpgrade =
				typeof upgrade === "string" &&
				upgrade.toLowerCase() === "websocket" &&
				typeof conn === "string" &&
				conn.toLowerCase().includes("upgrade");
			if (!isWsUpgrade) {
				res.status(proxyRequestConstants.HTTP_UPGRADE_REQUIRED).json({
					error: "Upgrade Required",
					message: "Use a WebSocket client for this endpoint",
				});
				return;
			}
			next();
			return;
		}
		const clientKey =
			this.proxyService.getClientIp(req.headers as HeadersRecord) ??
			req.socket.remoteAddress ??
			"unknown";
		if (await this.rateLimit.shouldReject(endpoint, clientKey)) {
			res.status(proxyRequestConstants.HTTP_TOO_MANY_REQUESTS).json({
				error: "Too Many Requests",
				message: "Rate limit exceeded for this endpoint",
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
		const targetHost = new URL(endpoint.targetUrl).host;
		const headers = this.proxyService.cleanHeadersForUpstream(
			req.headers as HeadersRecord,
			targetHost,
		);
		const handler = this.handlers.find((h) => h.canHandle(req, endpoint));
		if (!handler) {
			this.writeJson(res, proxyRequestConstants.HTTP_BAD_REQUEST, {
				error: "No handler",
				message: "No protocol handler matched this endpoint",
			});
			return;
		}
		await handler.handle({
			req,
			res,
			next,
			endpoint,
			path,
			queryString,
			requestBody,
			headers: headers as HeadersRecord,
			targetUrl: this.proxyService.buildTargetUrl(endpoint, path, queryString),
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

	private extractSlugAndPath(req: Request): {
		slug: string | null;
		path: string;
		isProxy: boolean;
	} {
		const host = req.headers.host ?? "";
		const path = (req.originalUrl ?? req.url ?? req.path ?? "").split("?")[0];
		const baseDomain =
			this.config.get<string>(`${ConfigKeyEnum.PROXY}.baseDomain`) ?? "lvh.me";
		return extractSlugAndPathFromProxyRequest(host, path, baseDomain);
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
