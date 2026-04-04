import type { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigKeyEnum } from "../common/enums/config.enum";
import { EnvironmentsEnum } from "../common/enums/environments.enum";
import { AuthResponseSchema } from "../common/swagger/schemas/auth-response.schema";
import { AuthUserSchema } from "../common/swagger/schemas/auth-user.schema";
import { ErrorResponseSchema } from "../common/swagger/schemas/error-response.schema";

export const setupSwagger = (
	app: NestExpressApplication,
	configService: ConfigService,
	appPort: number,
): string => {
	const swaggerPath = configService.getOrThrow<string>(
		`${ConfigKeyEnum.SWAGGER}.swaggerPath`,
	);
	const appName = configService.getOrThrow<string>(
		`${ConfigKeyEnum.SWAGGER}.swaggerName`,
	);
	const appDescription = configService.getOrThrow<string>(
		`${ConfigKeyEnum.SWAGGER}.swaggerDescr`,
	);
	const siteTitle = configService.getOrThrow<string>(
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
