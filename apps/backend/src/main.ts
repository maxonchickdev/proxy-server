import "reflect-metadata";
import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { ConfigKeyEnum } from "./common/enums/config.enum";
import { EnvironmentsEnum } from "./common/enums/environments.enum";
import { CatchEverythingFilter } from "./common/filters/catch-everything.filter";
import { LoggingInterceptor } from "./common/interceptors/logger.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import {
	AuthResponseSchema,
	AuthUserSchema,
} from "./common/swagger/schemas/auth-response.schema";
import { ErrorResponseSchema } from "./common/swagger/schemas/error-response.schema";

const logger: Logger = new Logger("Bootstrap");

(async () => {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	const configService = app.get(ConfigService);
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

	let swaggerPath = "";
	if (!isProduction) {
		swaggerPath = configService.getOrThrow<string>(
			`${ConfigKeyEnum.SWAGGER}.swaggerPath`,
		);
		const appName: string = configService.getOrThrow<string>(
			`${ConfigKeyEnum.SWAGGER}.swaggerName`,
		);
		const appDescription: string = configService.getOrThrow<string>(
			`${ConfigKeyEnum.SWAGGER}.swaggerDescr`,
		);
		const siteTitle: string = configService.getOrThrow<string>(
			`${ConfigKeyEnum.SWAGGER}.swaggerSiteTitle`,
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
						"Enter JWT token obtained from /auth/login or /auth/register",
					in: "header",
					name: "Authorization",
					scheme: "bearer",
					type: "http",
				},
				"Bearer",
			)
			.addSecurityRequirements("Bearer")
			.addTag("Auth", "Authentication endpoints (no Bearer token required)")
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
			customCss: ".swagger-ui .topbar { display: none }",
			explorer: true,
			jsonDocumentUrl: `${swaggerPath}/json`,
			yamlDocumentUrl: `${swaggerPath}/yaml`,
			swaggerOptions: {
				filter: true,
				showRequestDuration: true,
				persistAuthorization: true,
				docExpansion: "list",
				syntaxHighlight: { activate: true, theme: "monokai" },
				tryItOutEnabled: true,
				displayRequestDuration: true,
			},
		});
	}

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

	app.enableCors({ origin: true, credentials: true });

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

	logger.log(`Proxy Server application is running on: ${await app.getUrl()}`);

	if (!isProduction && swaggerPath) {
		logger.log(
			`Swagger docs available at: ${await app.getUrl()}/${swaggerPath}`,
		);
	}
})().catch((e) => {
	logger.error(`Failed to start nestjs boilerplate admin application: ${e}`);
});
