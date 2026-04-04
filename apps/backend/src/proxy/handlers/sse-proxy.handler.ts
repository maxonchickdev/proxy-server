import type { Request } from "express";
import type { ProxyContext } from "../proxy-context.type.js";
import type { ProtocolHandler } from "./protocol-handler.interface.js";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { type Endpoint, EndpointProtocol } from "@prisma/generated/client";
import { ProxyService } from "../proxy.service.js";
import { proxyRequestConstants } from "../proxy-request.constants.js";
import { TransformPipelineService } from "../transform-pipeline.service.js";

@Injectable()
export class SseProxyHandler implements ProtocolHandler {
	private readonly logger = new Logger(SseProxyHandler.name);
	readonly protocol = EndpointProtocol.SSE;

	constructor(
		@Inject(ProxyService) private readonly proxyService: ProxyService,
		@Inject(TransformPipelineService)
		private readonly transforms: TransformPipelineService,
	) {}

	canHandle(req: Request, endpoint: Endpoint): boolean {
		if (endpoint.protocol === EndpointProtocol.SSE) return true;
		const accept = req.headers.accept;
		return (
			endpoint.protocol === EndpointProtocol.HTTP &&
			typeof accept === "string" &&
			accept.toLowerCase().includes("text/event-stream")
		);
	}

	async handle(ctx: ProxyContext): Promise<void> {
		const method = ctx.req.method ?? "GET";
		const flat = this.transforms.flattenHeaders(ctx.headers);
		const applied = this.transforms.applyRequestPhase(
			ctx.endpoint,
			ctx.path,
			flat,
			ctx.requestBody,
			method,
		);
		const targetUrl = this.proxyService.buildTargetUrl(
			ctx.endpoint,
			applied.path,
			ctx.queryString,
		);
		const targetHost = new URL(ctx.endpoint.targetUrl).host;
		const upstreamHeaders = this.proxyService.cleanHeadersForUpstream(
			applied.headers as Record<string, string | string[] | undefined>,
			targetHost,
		);
		const upstreamBody = this.buildUpstreamBody(method, applied.requestBody);
		const logRequestHeaders = upstreamHeaders;
		let eventCount = 0;
		let bytesTransferred = 0;
		try {
			const upstreamRes = await fetch(targetUrl, {
				method,
				headers: upstreamHeaders as HeadersInit,
				body: upstreamBody,
				signal: AbortSignal.timeout(proxyRequestConstants.UPSTREAM_TIMEOUT_MS),
			});
			const headerObj: Record<string, string> = {};
			upstreamRes.headers.forEach((v, k) => {
				headerObj[k] = v;
			});
			const adjustedHeaders = this.transforms.applyStreamingResponseHeaders(
				ctx.endpoint,
				headerObj,
			);
			const hopByHop = new Set([
				"transfer-encoding",
				"content-encoding",
				"connection",
				"content-length",
			]);
			ctx.res.status(upstreamRes.status);
			for (const [key, value] of Object.entries(adjustedHeaders)) {
				if (hopByHop.has(key.toLowerCase())) continue;
				ctx.res.setHeader(key, value);
			}
			const body = upstreamRes.body;
			if (!body) {
				ctx.res.end();
				this.logSseComplete(
					ctx,
					upstreamRes.status,
					logRequestHeaders,
					eventCount,
					bytesTransferred,
					headerObj,
				);
				return;
			}
			const reader = body.getReader();
			const decoder = new TextDecoder();
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					if (value) {
						bytesTransferred += value.byteLength;
						ctx.res.write(Buffer.from(value));
						const text = decoder.decode(value, { stream: true });
						const matches = text.match(/\n\n/g);
						eventCount += matches ? matches.length : 0;
					}
				}
			} finally {
				reader.releaseLock();
			}
			ctx.res.end();
			const durationMs = Date.now() - ctx.startTime;
			this.proxyService.logRequest({
				endpointId: ctx.endpoint.id,
				method,
				path: ctx.path,
				queryParams: ctx.queryString || null,
				requestHeaders:
					this.proxyService.maskSensitiveHeaders(logRequestHeaders),
				requestBody: this.proxyService.truncateForLog(
					ctx.requestBody,
					proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
				),
				responseStatus: upstreamRes.status,
				responseHeaders: this.proxyService.maskSensitiveHeaders(headerObj),
				responseBody: null,
				durationMs,
				clientIp: this.proxyService.getClientIp(ctx.req.headers),
				protocol: EndpointProtocol.SSE,
				metadata: {
					sseApproxEventCount: eventCount,
					sseBytesTransferred: bytesTransferred,
				},
			});
		} catch (err: unknown) {
			const durationMs = Date.now() - ctx.startTime;
			this.logger.error(
				JSON.stringify({
					msg: "sse_upstream_failed",
					targetUrl,
					error: err instanceof Error ? err.message : String(err),
				}),
				err instanceof Error ? err.stack : undefined,
			);
			if (!ctx.res.headersSent) {
				ctx.res.status(proxyRequestConstants.HTTP_BAD_GATEWAY).json({
					error: "Bad Gateway",
					message: "Could not reach target",
				});
			} else {
				ctx.res.end();
			}
			this.proxyService.logRequest({
				endpointId: ctx.endpoint.id,
				method,
				path: ctx.path,
				queryParams: ctx.queryString || null,
				requestHeaders:
					this.proxyService.maskSensitiveHeaders(logRequestHeaders),
				requestBody: this.proxyService.truncateForLog(
					ctx.requestBody,
					proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
				),
				responseStatus: proxyRequestConstants.HTTP_BAD_GATEWAY,
				responseHeaders: null,
				responseBody: null,
				durationMs,
				clientIp: this.proxyService.getClientIp(ctx.req.headers),
				protocol: EndpointProtocol.SSE,
				metadata: {
					sseApproxEventCount: eventCount,
					sseBytesTransferred: bytesTransferred,
					sseError: true,
				},
			});
		}
	}

	private buildUpstreamBody(
		method: string,
		requestBody: Buffer | null,
	): BodyInit | undefined {
		const bodyAllowed = !["GET", "HEAD"].includes(method.toUpperCase());
		if (!bodyAllowed || !requestBody?.length) return undefined;
		return Uint8Array.from(requestBody);
	}

	private logSseComplete(
		ctx: ProxyContext,
		status: number,
		logRequestHeaders: Record<string, string>,
		eventCount: number,
		bytesTransferred: number,
		responseHeaders: Record<string, string>,
	): void {
		const durationMs = Date.now() - ctx.startTime;
		this.proxyService.logRequest({
			endpointId: ctx.endpoint.id,
			method: ctx.req.method ?? "GET",
			path: ctx.path,
			queryParams: ctx.queryString || null,
			requestHeaders: this.proxyService.maskSensitiveHeaders(logRequestHeaders),
			requestBody: this.proxyService.truncateForLog(
				ctx.requestBody,
				proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
			),
			responseStatus: status,
			responseHeaders: this.proxyService.maskSensitiveHeaders(responseHeaders),
			responseBody: null,
			durationMs,
			clientIp: this.proxyService.getClientIp(ctx.req.headers),
			protocol: EndpointProtocol.SSE,
			metadata: {
				sseApproxEventCount: eventCount,
				sseBytesTransferred: bytesTransferred,
			},
		});
	}
}
