import {
	type MiddlewareConsumer,
	Module,
	type NestModule,
} from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { CoreModule } from "./core/core.module";
import { PrismaModule } from "./core/prisma/prisma.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { EndpointsModule } from "./modules/endpoints/endpoints.module";
import { LogsModule } from "./modules/logs/logs.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProxyMiddleware } from "./proxy/proxy.middleware";
import { ProxyModule } from "./proxy/proxy.module";

@Module({
	imports: [
		ThrottlerModule.forRoot([
			{ name: "short", ttl: 1000, limit: 10 },
			{ name: "medium", ttl: 10000, limit: 50 },
			{ name: "long", ttl: 60000, limit: 200 },
		]),
		PrismaModule,
		AuthModule,
		EndpointsModule,
		LogsModule,
		AnalyticsModule,
		NotificationsModule,
		ProxyModule,
		CoreModule,
	],
	providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(ProxyMiddleware).forRoutes("*");
	}
}
