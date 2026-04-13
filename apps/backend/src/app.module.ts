import {
	type MiddlewareConsumer,
	Module,
	type NestModule,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ConfigKeyEnum } from "./common/enums/config.enum";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { ConfigModule } from "./core/config/config.module";
import { PrismaModule } from "./core/prisma/prisma.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { EndpointsModule } from "./modules/endpoints/endpoints.module";
import { HealthModule } from "./modules/health/health.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { LogsModule } from "./modules/logs/logs.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProxyMiddleware } from "./proxy/proxy.middleware";
import { ProxyModule } from "./proxy/proxy.module";

@Module({
	imports: [
		ConfigModule,
		PrismaModule,
		ScheduleModule.forRoot(),
		ThrottlerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				const ttl =
					config.get<number>(`${ConfigKeyEnum.RATE_LIMIT}.ttl`) ?? 60_000;
				const limit =
					config.get<number>(`${ConfigKeyEnum.RATE_LIMIT}.limit`) ?? 100;
				return [{ name: "default", ttl, limit }];
			},
		}),
		PrismaModule,
		AuthModule,
		HealthModule,
		EndpointsModule,
		LogsModule,
		AnalyticsModule,
		NotificationsModule,
		IntegrationsModule,
		ProxyModule,
	],
	providers: [
		CorrelationIdMiddleware,
		ProxyMiddleware,
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_GUARD, useClass: JwtAuthGuard },
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(CorrelationIdMiddleware, ProxyMiddleware).forRoutes("*");
	}
}
