import {
	type MiddlewareConsumer,
	Module,
	type NestModule,
} from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { EmailModule } from "./modules/email/email.module";
import { EndpointsModule } from "./modules/endpoints/endpoints.module";
import { HealthModule } from "./modules/health/health.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { LogsModule } from "./modules/logs/logs.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProxyMiddleware } from "./proxy/proxy.middleware";
import { ProxyModule } from "./proxy/proxy.module";

@Module({
	imports: [
		AnalyticsModule,
		AuthModule,
		EmailModule,
		EndpointsModule,
		HealthModule,
		IntegrationsModule,
		LogsModule,
		NotificationsModule,
		ProxyModule,
	],
	providers: [
		CorrelationIdMiddleware,
		ProxyMiddleware,
		{ provide: APP_GUARD, useClass: JwtAuthGuard },
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(CorrelationIdMiddleware, ProxyMiddleware).forRoutes("*");
	}
}
