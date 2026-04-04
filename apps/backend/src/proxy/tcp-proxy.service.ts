import {
	createConnection,
	createServer,
	type Server,
	type Socket,
} from "node:net";
import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from "@nestjs/common";
import { EndpointProtocol } from "@prisma/generated/client";
import { PrismaService } from "../core/prisma/prisma.service.js";
import { ProxyService } from "./proxy.service.js";

@Injectable()
export class TcpProxyService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(TcpProxyService.name);
	private readonly servers: Server[] = [];

	constructor(
		private readonly prisma: PrismaService,
		private readonly proxyService: ProxyService,
	) {}

	async onModuleInit(): Promise<void> {
		const endpoints = await this.prisma.endpoint.findMany({
			where: {
				isActive: true,
				protocol: EndpointProtocol.TCP,
				tcpProxyPort: { not: null },
			},
		});
		for (const ep of endpoints) {
			const listenPort = ep.tcpProxyPort;
			if (listenPort == null) continue;
			const target = parseTcpTarget(ep.targetUrl);
			const server = createServer((clientSocket) => {
				this.relayTcp(clientSocket, ep.id, target);
			});
			await new Promise<void>((resolve, reject) => {
				server.once("error", reject);
				server.listen(listenPort, () => resolve());
			});
			this.logger.log(
				`TCP proxy listening on ${listenPort} → ${target.host}:${target.port}`,
			);
			this.servers.push(server);
		}
	}

	onModuleDestroy(): void {
		for (const s of this.servers) {
			s.close();
		}
	}

	private relayTcp(
		clientSocket: Socket,
		endpointId: string,
		target: { host: string; port: number },
	): void {
		const started = Date.now();
		let clientBytes = 0;
		let upstreamBytes = 0;
		let logged = false;
		const finish = (): void => {
			if (logged) return;
			logged = true;
			const durationMs = Date.now() - started;
			this.proxyService.logRequest({
				endpointId,
				method: "TCP",
				path: `${target.host}:${target.port}`,
				queryParams: null,
				requestHeaders: null,
				requestBody: null,
				responseStatus: null,
				responseHeaders: null,
				responseBody: null,
				durationMs,
				clientIp: clientSocket.remoteAddress ?? null,
				protocol: EndpointProtocol.TCP,
				metadata: {
					tcpClientBytes: clientBytes,
					tcpUpstreamBytes: upstreamBytes,
				},
			});
		};
		const upstream = createConnection(
			{ host: target.host, port: target.port },
			() => {
				clientSocket.pipe(upstream);
				upstream.pipe(clientSocket);
			},
		);
		clientSocket.on("data", (chunk: Buffer) => {
			clientBytes += chunk.length;
		});
		upstream.on("data", (chunk: Buffer) => {
			upstreamBytes += chunk.length;
		});
		upstream.on("error", (err: Error) => {
			this.logger.warn(`tcp_upstream_error: ${err.message}`);
			clientSocket.destroy();
			finish();
		});
		clientSocket.on("error", (err: Error) => {
			this.logger.warn(`tcp_client_error: ${err.message}`);
			upstream.destroy();
			finish();
		});
		clientSocket.on("close", () => {
			upstream.destroy();
			finish();
		});
		upstream.on("close", () => {
			clientSocket.destroy();
			finish();
		});
	}
}

function parseTcpTarget(raw: string): { host: string; port: number } {
	try {
		const withProto = raw.includes("://") ? raw : `tcp://${raw}`;
		const u = new URL(withProto);
		const port = u.port ? Number.parseInt(u.port, 10) : 6379;
		return { host: u.hostname, port };
	} catch {
		return { host: "127.0.0.1", port: 6379 };
	}
}
