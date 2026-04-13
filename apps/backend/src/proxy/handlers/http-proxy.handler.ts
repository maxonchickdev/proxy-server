import type { Request, Response } from "express";
import type { ProxyContext } from "../proxy-context.type.js";
import type { ProtocolHandler } from "./protocol-handler.interface.js";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { type Endpoint, EndpointProtocol } from "@prisma/generated/client";
import { ProxyService } from "../proxy.service.js";
import { mergeLogMetadata } from "../proxy-log-metadata.util.js";
import { proxyRequestConstants } from "../proxy-request.constants.js";
import { TransformPipelineService } from "../transform-pipeline.service.js";

type ForwardCtx = ProxyContext & {
	targetUrl: string;
	headers: Record<string, string | string[] | undefined>;
	requestBody: Buffer | null;
	path: string;
	logRequestHeaders: Record<string, string>;
};

@Injectable()
export class HttpProxyHandler implements ProtocolHandler {
	private readonly logger = new Logger(HttpProxyHandler.name);
	readonly protocol = EndpointProtocol.HTTP;

	constructor(
		@Inject(ProxyService) private readonly proxyService: ProxyService,
		@Inject(TransformPipelineService)
		private readonly transforms: TransformPipelineService,
	) {}

	canHandle(_req: Request, endpoint: Endpoint): boolean {
		return endpoint.protocol === EndpointProtocol.HTTP;
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
		const logRequestHeaders = upstreamHeaders as Record<string, string>;
		const forwardBase: ForwardCtx = {
			...ctx,
			targetUrl,
			headers: upstreamHeaders as Record<string, string | string[] | undefined>,
			requestBody: applied.requestBody,
			path: applied.path,
			logRequestHeaders,
		};
		if (this.acceptsEventStream(applied.headers)) {
			await this.forwardEventStreamAndLog(forwardBase);
			return;
		}
		await this.forwardToUpstreamAndLog(forwardBase);
	}

	private acceptsEventStream(headers: Record<string, string>): boolean {
		const accept = this.getHeaderCaseInsensitive(headers, "accept");
		return (
			typeof accept === "string" &&
			accept.toLowerCase().includes("text/event-stream")
		);
	}

	private getHeaderCaseInsensitive(
		headers: Record<string, string>,
		name: string,
	): string | undefined {
		const lower = name.toLowerCase();
		for (const [k, v] of Object.entries(headers)) {
			if (k.toLowerCase() === lower) return v;
		}
		return undefined;
	}

	private async forwardEventStreamAndLog(ctx: ForwardCtx): Promise<void> {
		const method = ctx.req.method ?? "GET";
		const upstreamBody = this.buildUpstreamBody(method, ctx.requestBody);
		let eventCount = 0;
		let bytesTransferred = 0;
		try {
			const upstreamRes = await fetch(ctx.targetUrl, {
				method,
				headers: ctx.headers as HeadersInit,
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
				this.logStreamComplete(
					ctx,
					upstreamRes.status,
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
				requestHeaders: this.proxyService.maskSensitiveHeaders(
					ctx.logRequestHeaders,
				),
				requestBody: this.proxyService.truncateForLog(
					ctx.requestBody,
					proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
				),
				responseStatus: upstreamRes.status,
				responseHeaders: this.proxyService.maskSensitiveHeaders(headerObj),
				responseBody: null,
				durationMs,
				clientIp: this.proxyService.getClientIp(ctx.req.headers),
				protocol: EndpointProtocol.HTTP,
				metadata: mergeLogMetadata(ctx.logMetadata, {
					streaming: true,
					sseApproxEventCount: eventCount,
					sseBytesTransferred: bytesTransferred,
				}),
			});
		} catch (err: unknown) {
			const durationMs = Date.now() - ctx.startTime;
			this.logger.error(
				JSON.stringify({
					msg: "streaming_upstream_failed",
					targetUrl: ctx.targetUrl,
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
				requestHeaders: this.proxyService.maskSensitiveHeaders(
					ctx.logRequestHeaders,
				),
				requestBody: this.proxyService.truncateForLog(
					ctx.requestBody,
					proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
				),
				responseStatus: proxyRequestConstants.HTTP_BAD_GATEWAY,
				responseHeaders: null,
				responseBody: null,
				durationMs,
				clientIp: this.proxyService.getClientIp(ctx.req.headers),
				protocol: EndpointProtocol.HTTP,
				metadata: mergeLogMetadata(ctx.logMetadata, {
					streaming: true,
					sseApproxEventCount: eventCount,
					sseBytesTransferred: bytesTransferred,
					streamError: true,
				}),
			});
		}
	}

	private logStreamComplete(
		ctx: ForwardCtx,
		status: number,
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
			requestHeaders: this.proxyService.maskSensitiveHeaders(
				ctx.logRequestHeaders,
			),
			requestBody: this.proxyService.truncateForLog(
				ctx.requestBody,
				proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
			),
			responseStatus: status,
			responseHeaders: this.proxyService.maskSensitiveHeaders(responseHeaders),
			responseBody: null,
			durationMs,
			clientIp: this.proxyService.getClientIp(ctx.req.headers),
			protocol: EndpointProtocol.HTTP,
			metadata: mergeLogMetadata(ctx.logMetadata, {
				streaming: true,
				sseApproxEventCount: eventCount,
				sseBytesTransferred: bytesTransferred,
			}),
		});
	}

	private async forwardToUpstreamAndLog(ctx: ForwardCtx): Promise<void> {
		const method = ctx.req.method ?? "GET";
		const upstreamBody = this.buildUpstreamBody(method, ctx.requestBody);
		try {
			const upstreamRes = await fetch(ctx.targetUrl, {
				method,
				headers: ctx.headers as HeadersInit,
				body: upstreamBody,
				signal: AbortSignal.timeout(proxyRequestConstants.UPSTREAM_TIMEOUT_MS),
			});
			const durationMs = Date.now() - ctx.startTime;
			const responseBuffer = Buffer.from(await upstreamRes.arrayBuffer());
			const afterTransform = this.transforms.applyResponsePhase(ctx.endpoint, {
				status: upstreamRes.status,
				headers: this.collectHeaders(upstreamRes),
				body: responseBuffer,
			});
			ctx.res.status(afterTransform.status);
			const responseHeadersObj = this.applyUpstreamHeadersToResponse(
				afterTransform.headers,
				ctx.res,
			);
			ctx.res.send(afterTransform.body);
			const truncatedBody = this.proxyService.truncateForLog(
				afterTransform.body,
				proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
			);
			this.logSuccessfulProxyRequest(
				ctx,
				upstreamRes.status,
				afterTransform.body,
				responseHeadersObj,
				durationMs,
				ctx.logRequestHeaders,
				truncatedBody,
			);
		} catch (err: unknown) {
			const durationMs = Date.now() - ctx.startTime;
			this.logger.error(
				JSON.stringify({
					msg: "upstream_fetch_failed",
					targetUrl: ctx.targetUrl,
					error: err instanceof Error ? err.message : String(err),
				}),
				err instanceof Error ? err.stack : undefined,
			);
			ctx.res.status(proxyRequestConstants.HTTP_BAD_GATEWAY).json({
				error: "Bad Gateway",
				message: "Could not reach target",
			});
			this.logFailedProxyRequest(
				ctx,
				proxyRequestConstants.HTTP_BAD_GATEWAY,
				durationMs,
			);
		}
	}

	private collectHeaders(
		upstreamRes: globalThis.Response,
	): Record<string, string> {
		const responseHeadersObj: Record<string, string> = {};
		upstreamRes.headers.forEach((value, key) => {
			responseHeadersObj[key] = value;
		});
		return responseHeadersObj;
	}

	private buildUpstreamBody(
		method: string,
		requestBody: Buffer | null,
	): BodyInit | undefined {
		const bodyAllowed = !["GET", "HEAD"].includes(method.toUpperCase());
		if (!bodyAllowed || !requestBody?.length) return undefined;
		return Uint8Array.from(requestBody);
	}

	private applyUpstreamHeadersToResponse(
		headersRecord: Record<string, string>,
		expressRes: Response,
	): Record<string, string> {
		const hopByHop = new Set([
			"transfer-encoding",
			"content-encoding",
			"connection",
		]);
		for (const [key, value] of Object.entries(headersRecord)) {
			if (hopByHop.has(key.toLowerCase())) continue;
			expressRes.setHeader(key, value);
		}
		return headersRecord;
	}

	private logSuccessfulProxyRequest(
		ctx: ProxyContext & {
			path: string;
			logRequestHeaders: Record<string, string>;
		},
		upstreamStatus: number,
		_responseBuffer: Buffer,
		responseHeadersObj: Record<string, string>,
		durationMs: number,
		logRequestHeaders: Record<string, string>,
		responseBodyTruncated: string | null,
	): void {
		const appended = ctx.appendMetadata?.({
			responseStatus: upstreamStatus,
			responseBodyTruncated,
		});
		const metadata = mergeLogMetadata(ctx.logMetadata, appended);
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
			responseStatus: upstreamStatus,
			responseHeaders:
				this.proxyService.maskSensitiveHeaders(responseHeadersObj),
			responseBody: responseBodyTruncated,
			durationMs,
			clientIp: this.proxyService.getClientIp(ctx.req.headers),
			protocol: ctx.endpoint.protocol,
			metadata,
		});
	}

	private logFailedProxyRequest(
		ctx: ProxyContext & {
			path: string;
			logRequestHeaders: Record<string, string>;
		},
		responseStatus: number,
		durationMs: number,
	): void {
		this.proxyService.logRequest({
			endpointId: ctx.endpoint.id,
			method: ctx.req.method ?? "GET",
			path: ctx.path,
			queryParams: ctx.queryString || null,
			requestHeaders: this.proxyService.maskSensitiveHeaders(
				ctx.logRequestHeaders,
			),
			requestBody: this.proxyService.truncateForLog(
				ctx.requestBody,
				proxyRequestConstants.LOG_BODY_TRUNCATION_BYTES,
			),
			responseStatus,
			responseHeaders: null,
			responseBody: null,
			durationMs,
			clientIp: this.proxyService.getClientIp(ctx.req.headers),
			protocol: ctx.endpoint.protocol,
			metadata: ctx.logMetadata ?? null,
		});
	}
}
