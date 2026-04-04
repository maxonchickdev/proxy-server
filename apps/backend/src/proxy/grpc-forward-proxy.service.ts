import { join } from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EndpointProtocol } from "@prisma/generated/client";
import { ConfigKeyEnum } from "../common/enums/config.enum.js";
import { PrismaService } from "../core/prisma/prisma.service.js";
import { ProxyService } from "./proxy.service.js";

type ForwardRequestMsg = {
	slug: string;
	grpc_method: string;
	metadata: Record<string, string>;
	message: Buffer;
};

type ForwardReplyMsg = {
	message: Buffer;
	grpc_status: number;
	error_message: string;
};

@Injectable()
export class GrpcForwardProxyService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(GrpcForwardProxyService.name);
	private server: grpc.Server | null = null;

	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
		private readonly proxyService: ProxyService,
	) {}

	async onModuleInit(): Promise<void> {
		const port = this.config.get<number>(
			`${ConfigKeyEnum.PROXY}.grpcProxyPort`,
		);
		if (!port || port <= 0) {
			return;
		}
		const protoPath = join(__dirname, "proto", "grpc-forward.proto");
		const packageDefinition = protoLoader.loadSync(protoPath, {
			keepCase: true,
			longs: String,
			enums: String,
			defaults: true,
			oneofs: true,
		});
		const loaded = grpc.loadPackageDefinition(packageDefinition) as {
			proxyforward: {
				ProxyForward: grpc.ServiceClientConstructor & {
					service: grpc.ServiceDefinition;
				};
			};
		};
		const server = new grpc.Server();
		server.addService(loaded.proxyforward.ProxyForward.service, {
			Unary: (
				call: grpc.ServerUnaryCall<ForwardRequestMsg, ForwardReplyMsg>,
				cb: grpc.sendUnaryData<ForwardReplyMsg>,
			): void => {
				void this.handleUnary(call, cb);
			},
		});
		await new Promise<void>((resolve, reject) => {
			server.bindAsync(
				`0.0.0.0:${port}`,
				grpc.ServerCredentials.createInsecure(),
				(err, boundPort) => {
					if (err) {
						reject(err);
						return;
					}
					server.start();
					this.logger.log(`gRPC forward gateway listening on ${boundPort}`);
					resolve();
				},
			);
		});
		this.server = server;
	}

	onModuleDestroy(): void {
		if (this.server) {
			this.server.forceShutdown();
			this.server = null;
		}
	}

	private async handleUnary(
		call: grpc.ServerUnaryCall<ForwardRequestMsg, ForwardReplyMsg>,
		cb: grpc.sendUnaryData<ForwardReplyMsg>,
	): Promise<void> {
		const started = Date.now();
		const req = call.request;
		const slug = req.slug;
		const method = req.grpc_method;
		const endpoint = await this.prisma.endpoint.findUnique({
			where: { slug, isActive: true },
		});
		if (!endpoint || endpoint.protocol !== EndpointProtocol.GRPC) {
			cb(null, {
				message: Buffer.alloc(0),
				grpc_status: grpc.status.NOT_FOUND,
				error_message: "Endpoint not found for slug",
			});
			return;
		}
		const target = new URL(
			endpoint.targetUrl.includes("://")
				? endpoint.targetUrl
				: `http://${endpoint.targetUrl}`,
		);
		const host = target.hostname;
		const port =
			target.port !== ""
				? Number.parseInt(target.port, 10)
				: target.protocol === "https:"
					? 443
					: 80;
		const useSsl = target.protocol === "https:";
		const address = `${host}:${port}`;
		const creds = useSsl
			? grpc.credentials.createSsl()
			: grpc.credentials.createInsecure();
		const client = new grpc.Client(address, creds);
		const md = new grpc.Metadata();
		for (const [k, v] of Object.entries(req.metadata ?? {})) {
			md.add(k, String(v));
		}
		const payload = Buffer.isBuffer(req.message)
			? req.message
			: Buffer.from(req.message ?? []);
		await new Promise<void>((resolve) => {
			client.makeUnaryRequest(
				method,
				(b: Buffer) => b,
				(b: Buffer) => b,
				payload,
				md,
				(err, response) => {
					client.close();
					const durationMs = Date.now() - started;
					const outBuf =
						response != null && Buffer.isBuffer(response)
							? response
							: Buffer.alloc(0);
					if (err) {
						this.proxyService.logRequest({
							endpointId: endpoint.id,
							method: "GRPC",
							path: method,
							queryParams: null,
							requestHeaders: null,
							requestBody: null,
							responseStatus: err.code ?? grpc.status.UNKNOWN,
							responseHeaders: null,
							responseBody: null,
							durationMs,
							clientIp: null,
							protocol: EndpointProtocol.GRPC,
							metadata: { grpcMethod: method, slug },
						});
						cb(null, {
							message: Buffer.alloc(0),
							grpc_status: err.code ?? grpc.status.UNKNOWN,
							error_message: err.message,
						});
						resolve();
						return;
					}
					this.proxyService.logRequest({
						endpointId: endpoint.id,
						method: "GRPC",
						path: method,
						queryParams: null,
						requestHeaders: null,
						requestBody: null,
						responseStatus: grpc.status.OK,
						responseHeaders: null,
						responseBody: null,
						durationMs,
						clientIp: null,
						protocol: EndpointProtocol.GRPC,
						metadata: { grpcMethod: method, slug },
					});
					cb(null, {
						message: outBuf,
						grpc_status: grpc.status.OK,
						error_message: "",
					});
					resolve();
				},
			);
		});
	}
}
