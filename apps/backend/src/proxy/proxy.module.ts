import { Module } from "@nestjs/common";
import { PrismaModule } from "../core/prisma/prisma.module";
import { EndpointsModule } from "../modules/endpoints/endpoints.module";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { HttpProxyHandler } from "./handlers/http-proxy.handler.js";
import { ProxyService } from "./proxy.service";
import { ProxyRateLimitService } from "./proxy-rate-limit.service.js";
import { TransformPipelineService } from "./transform-pipeline.service.js";

@Module({
	imports: [EndpointsModule, NotificationsModule, PrismaModule],
	providers: [
		ProxyService,
		TransformPipelineService,
		ProxyRateLimitService,
		HttpProxyHandler,
	],
	exports: [
		ProxyService,
		TransformPipelineService,
		ProxyRateLimitService,
		HttpProxyHandler,
	],
})
export class ProxyModule {}
