import "reflect-metadata";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { ConfigKeyEnum } from "./common/enums/config.enum";
import { EnvironmentsEnum } from "./common/enums/environments.enum";
import { CatchEverythingFilter } from "./common/filters/catch-everything.filter";
import { LoggingInterceptor } from "./common/interceptors/logger.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { AuthResponseSchema } from "./common/swagger/schemas/auth-response.schema";
import { AuthUserSchema } from "./common/swagger/schemas/auth-user.schema";
import { ErrorResponseSchema } from "./common/swagger/schemas/error-response.schema";

const logger = new Logger("Bootstrap");

export const setupSwagger = (
	app: NestExpressApplication,
	configService: ConfigService,
	appPort: number,
): string => {
	const swaggerPath = configService.getOrThrow<string>(
		`${ConfigKeyEnum.SWAGGER}.path`,
	);
	const appName = configService.getOrThrow<string>(
		`${ConfigKeyEnum.SWAGGER}.name`,
	);
	const appDescription = configService.getOrThrow<string>(
		`${ConfigKeyEnum.SWAGGER}.descr`,
	);
	const siteTitle = configService.getOrThrow<string>(
		`${ConfigKeyEnum.SWAGGER}.siteTitle`,
	);

	const swaggerConfig = new DocumentBuilder()
		.setTitle(appName)
		.setDescription(appDescription)
		.setVersion("1.0")
		.setContact("Proxy Server", "", "")
		.setLicense("ISC", "")
		.addServer(`http://localhost:${appPort}`, EnvironmentsEnum.DEVELOPMENT)
		.addServer(`http://lvh.me:${appPort}`, EnvironmentsEnum.PRODUCTION)
		.addBearerAuth(
			{
				bearerFormat: "JWT",
				description:
					"Enter JWT access token from /auth/sign-in, /auth/verify-email, or /auth/refresh",
				in: "header",
				name: "Authorization",
				scheme: "bearer",
				type: "http",
			},
			"Bearer",
		)
		.addSecurityRequirements("Bearer")
		.addTag("Auth", "Authentication endpoints (no Bearer token required)")
		.addTag("Health", "Liveness and readiness probes")
		.addTag("Endpoints", "Proxy endpoint management")
		.addTag("Analytics", "Request analytics and metrics")
		.addTag("Logs", "Request log access")
		.addTag("Notifications", "Alert rules and notification channels")
		.build();

	const document = SwaggerModule.createDocument(app, swaggerConfig, {
		deepScanRoutes: true,
		ignoreGlobalPrefix: false,
		operationIdFactory: (controllerKey: string, methodKey: string) =>
			`${controllerKey}_${methodKey}`,
		extraModels: [AuthResponseSchema, AuthUserSchema, ErrorResponseSchema],
	});

	SwaggerModule.setup(swaggerPath, app, document, {
		customSiteTitle: siteTitle,
		explorer: false,
		jsonDocumentUrl: `${swaggerPath}/json`,
		yamlDocumentUrl: `${swaggerPath}/yaml`,
		swaggerOptions: {
			persistAuthorization: true,
		},
	});

	return swaggerPath;
};

(async () => {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	app.use(cookieParser());

	const configService = app.get(ConfigService);
	const corsOrigins = configService.getOrThrow<string[]>(
		`${ConfigKeyEnum.APP}.corsOrigin`,
	);
	const isProduction =
		configService.getOrThrow<string>(`${ConfigKeyEnum.ENVIRONMENT}.nodeEnv`) ===
		EnvironmentsEnum.PRODUCTION;
	const appPort = configService.getOrThrow<number>(`${ConfigKeyEnum.APP}.port`);

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
