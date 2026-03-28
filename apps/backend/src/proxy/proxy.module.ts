import { Module } from "@nestjs/common";
import { EndpointsModule } from "../modules/endpoints/endpoints.module";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { ProxyMiddleware } from "./proxy.middleware";
import { ProxyService } from "./proxy.service";

/**
 * Reverse proxy wiring (service invoked by global middleware).
 */
@Module({
	imports: [EndpointsModule, NotificationsModule],
	providers: [ProxyService, ProxyMiddleware],
	exports: [ProxyService],
})
export class ProxyModule {}
