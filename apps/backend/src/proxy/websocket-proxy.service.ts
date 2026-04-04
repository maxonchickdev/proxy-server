import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Endpoint, EndpointProtocol } from "@prisma/generated/client";
import WebSocket, { WebSocketServer } from "ws";
import { ConfigKeyEnum } from "../common/enums/config.enum.js";
import { ProxyService } from "./proxy.service.js";
import { extractSlugAndPathFromProxyRequest } from "./proxy-routing.util.js";

@Injectable()
export class WebSocketProxyService {
	private readonly logger = new Logger(WebSocketProxyService.name);

	constructor(
		@Inject(ProxyService) private readonly proxyService: ProxyService,
		@Inject(ConfigService) private readonly config: ConfigService,
	) {}

	attach(server: import("node:http").Server): void {
		server.on("upgrade", (request, socket, head) => {
			void this.handleUpgrade(request, socket, head);
		});
	}

	private async handleUpgrade(
		request: IncomingMessage,
		socket: Duplex,
		head: Buffer,
	): Promise<void> {
		const rawUrl = request.url ?? "/";
		const pathOnly = rawUrl.split("?")[0];
		const queryString = rawUrl.includes("?")
			? rawUrl.slice(rawUrl.indexOf("?") + 1)
			: "";
		const host = request.headers.host ?? "";
		const baseDomain =
			this.config.get<string>(`${ConfigKeyEnum.PROXY}.baseDomain`) ?? "lvh.me";
		const extracted = extractSlugAndPathFromProxyRequest(
			host,
			pathOnly,
			baseDomain,
		);
		if (!extracted.isProxy || !extracted.slug) {
			socket.destroy();
			return;
		}
		const endpoint = await this.proxyService.resolveEndpoint(extracted.slug);
		if (!endpoint || endpoint.protocol !== EndpointProtocol.WEBSOCKET) {
			socket.destroy();
			return;
		}
		const targetWsUrl = this.buildWsTargetUrl(
			endpoint,
			extracted.path,
			queryString,
		);
		const targetUrl = new URL(targetWsUrl);
		const headers: Record<string, string> = {};
		for (const [key, value] of Object.entries(request.headers)) {
			if (value === undefined) continue;
			const lower = key.toLowerCase();
			if (lower === "host") continue;
			headers[key] = Array.isArray(value) ? value.join(", ") : value;
		}
		headers.Host = targetUrl.host;
		let framesClientToUpstream = 0;
		let framesUpstreamToClient = 0;
		let bytesClientToUpstream = 0;
		let bytesUpstreamToClient = 0;
		const started = Date.now();
		let logged = false;
		const finishLog = (): void => {
			if (logged) return;
			logged = true;
			const durationMs = Date.now() - started;
			this.proxyService.logRequest({
				endpointId: endpoint.id,
				method: "WEBSOCKET",
				path: extracted.path,
				queryParams: queryString || null,
				requestHeaders: this.proxyService.maskSensitiveHeaders(headers),
				requestBody: null,
				responseStatus: null,
				responseHeaders: null,
				responseBody: null,
				durationMs,
				clientIp: this.proxyService.getClientIp(
					request.headers as Record<string, string | string[] | undefined>,
				),
				protocol: EndpointProtocol.WEBSOCKET,
				metadata: {
					framesClientToUpstream,
					framesUpstreamToClient,
					bytesClientToUpstream,
					bytesUpstreamToClient,
				},
			});
		};
		const wss = new WebSocketServer({ noServer: true });
		wss.handleUpgrade(request, socket, head, (clientWs) => {
			const upstream = new WebSocket(targetWsUrl, { headers });
			const closeBoth = (): void => {
				if (clientWs.readyState === WebSocket.OPEN) {
					clientWs.close();
				}
				if (upstream.readyState === WebSocket.OPEN) {
					upstream.close();
				}
				finishLog();
			};
			upstream.on("open", () => {
				clientWs.on("message", (data, isBinary) => {
					framesClientToUpstream++;
					const buf = toBuffer(data);
					bytesClientToUpstream += buf.length;
					upstream.send(data, { binary: Boolean(isBinary) });
				});
				upstream.on("message", (data, isBinary) => {
					framesUpstreamToClient++;
					const buf = toBuffer(data);
					bytesUpstreamToClient += buf.length;
					clientWs.send(data, { binary: Boolean(isBinary) });
				});
				clientWs.on("close", closeBoth);
				upstream.on("close", closeBoth);
			});
			upstream.on("error", (err: Error) => {
				this.logger.warn(`websocket_upstream_error: ${err.message}`);
				closeBoth();
			});
			clientWs.on("error", (err: Error) => {
				this.logger.warn(`websocket_client_error: ${err.message}`);
				closeBoth();
			});
		});
	}

	private buildWsTargetUrl(
		endpoint: Endpoint,
		path: string,
		queryString: string,
	): string {
		const httpUrl = this.proxyService.buildTargetUrl(
			endpoint,
			path,
			queryString,
		);
		const u = new URL(httpUrl);
		u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
		return u.toString();
	}
}

function toBuffer(data: WebSocket.RawData): Buffer {
	if (Buffer.isBuffer(data)) return data;
	if (Array.isArray(data)) return Buffer.concat(data);
	if (data instanceof ArrayBuffer) return Buffer.from(data);
	return Buffer.from(new Uint8Array(data as ArrayBuffer));
}
