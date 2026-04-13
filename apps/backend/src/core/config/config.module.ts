import { Module } from "@nestjs/common";
import { ConfigModule as CoreConfigModule } from "@nestjs/config";
import Joi from "joi";
import { appRegister } from "./registers/app.register";
import { emailRegister } from "./registers/email.register";
import { environmentRegister } from "./registers/environment.register";
import { jwtRegister } from "./registers/jwt.register";
import { prismaRegister } from "./registers/prisma.register";
import { proxyRegister } from "./registers/proxy.register";
import { rateLimitRegister } from "./registers/rate-limit.register";
import { redisRegister } from "./registers/redis.register";
import { swaggerRegister } from "./registers/swagger.register";

@Module({
	imports: [
		CoreConfigModule.forRoot({
			envFilePath: [".env", "../.env", "../../.env"],
			isGlobal: true,
			load: [
				environmentRegister,
				prismaRegister,
				redisRegister,
				jwtRegister,
				appRegister,
				rateLimitRegister,
				emailRegister,
				swaggerRegister,
				proxyRegister,
			],
			validationSchema: Joi.object({
				NODE_ENV: Joi.string()
					.valid("development", "test", "production")
					.default("development"),

				POSTGRES_URL: Joi.string().required(),

				REDIS_URL: Joi.string().required(),

				JWT_SECRET: Joi.string().required(),
				JWT_ACCESS_EXPIRES_IN: Joi.string().required(),
				JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

				APP_PORT: Joi.string().required(),
				APP_REQUEST_TIMEOUT: Joi.string().required(),
				APP_CORS_ORIGIN: Joi.string().required(),

				THROTTLE_TTL_MS: Joi.string().required(),
				THROTTLE_LIMIT: Joi.string().required(),

				SMTP_HOST: Joi.string().required(),
				SMTP_PORT: Joi.string().required(),
				SMTP_USER: Joi.string().required(),
				SMTP_PASS: Joi.string().required(),
				SMTP_FROM: Joi.string().required(),
				SMTP_LOG_OTP_ON_FAILURE: Joi.string().required(),

				SWAGGER_PATH: Joi.when("NODE_ENV", {
					is: Joi.string().valid("development", "test"),
					then: Joi.string().min(1).required(),
					otherwise: Joi.string().optional(),
				}),
				SWAGGER_NAME: Joi.when("NODE_ENV", {
					is: Joi.string().valid("development", "test"),
					then: Joi.string().min(1).required(),
					otherwise: Joi.string().optional(),
				}),
				SWAGGER_DESCR: Joi.when("NODE_ENV", {
					is: Joi.string().valid("development", "test"),
					then: Joi.string().required(),
					otherwise: Joi.string().optional(),
				}),
				SWAGGER_SITE_TITLE: Joi.when("NODE_ENV", {
					is: Joi.string().valid("development", "test"),
					then: Joi.string().min(1).required(),
					otherwise: Joi.string().optional(),
				}),

				PROXY_BASE_DOMAIN: Joi.string(),
			}),
		}),
	],
})
export class ConfigModule {}
