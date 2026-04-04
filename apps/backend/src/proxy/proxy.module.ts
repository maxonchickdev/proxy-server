import { Module } from "@nestjs/common";
import { EndpointsModule } from "../modules/endpoints/endpoints.module";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { GrpcForwardProxyService } from "./grpc-forward-proxy.service.js";
import { GraphqlProxyHandler } from "./handlers/graphql-proxy.handler.js";
import { HttpProxyHandler } from "./handlers/http-proxy.handler.js";
import { SseProxyHandler } from "./handlers/sse-proxy.handler.js";
import { ProxyService } from "./proxy.service";
import { ProxyRateLimitService } from "./proxy-rate-limit.service.js";
import { TcpProxyService } from "./tcp-proxy.service.js";
import { TransformPipelineService } from "./transform-pipeline.service.js";
import { WebSocketProxyService } from "./websocket-proxy.service.js";

@Module({
	imports: [EndpointsModule, NotificationsModule],
	providers: [
		ProxyService,
		TransformPipelineService,
		ProxyRateLimitService,
		HttpProxyHandler,
		GraphqlProxyHandler,
		SseProxyHandler,
		WebSocketProxyService,
		TcpProxyService,
		GrpcForwardProxyService,
	],
	exports: [
		ProxyService,
		TransformPipelineService,
		ProxyRateLimitService,
		WebSocketProxyService,
		HttpProxyHandler,
		GraphqlProxyHandler,
		SseProxyHandler,
	],
})
export class ProxyModule {}
