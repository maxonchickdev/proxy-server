import "reflect-metadata";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { setupSwagger } from "./bootstrap/setup-swagger";
import { ConfigKeyEnum } from "./common/enums/config.enum";
import { EnvironmentsEnum } from "./common/enums/environments.enum";
import { CatchEverythingFilter } from "./common/filters/catch-everything.filter";
import { LoggingInterceptor } from "./common/interceptors/logger.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { WebSocketProxyService } from "./proxy/websocket-proxy.service";

const logger = new Logger("Bootstrap");

(async () => {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	app.use(cookieParser());

	const configService = app.get(ConfigService);
	const corsOrigins = configService.getOrThrow<string[]>(
		`${ConfigKeyEnum.APP}.corsOrigins`,
	);
	const isProduction =
		configService.getOrThrow<string>(`${ConfigKeyEnum.ENVIRONMENT}.nodeEnv`) ===
		EnvironmentsEnum.PRODUCTION;
	const appPort = configService.getOrThrow<number>(
		`${ConfigKeyEnum.APP}.appPort`,
	);

	app.enableVersioning({
		defaultVersion: "1",
		prefix: "api/v",
		type: VersioningType.URI,
	});

	const swaggerPath = !isProduction
		? setupSwagger(app, configService, appPort)
		: "";

	const httpAdapterHost = app.get(HttpAdapterHost);

	app.useGlobalFilters(
		new CatchEverythingFilter(httpAdapterHost, configService),
	);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	app.enableCors({
		origin: corsOrigins,
		credentials: true,
	});

	app.use(
		helmet({
			contentSecurityPolicy: isProduction,
		}),
	);

	app.enableShutdownHooks();

	app.useGlobalInterceptors(
		new TimeoutInterceptor(configService),
		new LoggingInterceptor(configService),
	);

	await app.listen(appPort);

	const webSocketProxy = app.get(WebSocketProxyService);
	webSocketProxy.attach(app.getHttpServer());

	const baseUrl = await app.getUrl();
	logger.log(`Application listening at ${baseUrl}`);

	if (swaggerPath) {
		logger.log(`OpenAPI docs: ${baseUrl}/${swaggerPath}`);
	}
})().catch((error: unknown) => {
	const detail = error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : undefined;
	logger.error(`Failed to start application: ${detail}`, stack);
});
