import { Module } from "@nestjs/common";
import { ConfigModule as CoreConfigModule } from "@nestjs/config";
import Joi from "joi";
import { appRegister } from "src/common/registers/app.register";
import { cacheRegister } from "src/common/registers/cache.register";
import { dbRegister } from "src/common/registers/db.register";
import { environmentRegister } from "src/common/registers/environment.register";
import { jwtRegister } from "src/common/registers/jwt.register";
import { proxyRegister } from "src/common/registers/proxy.register";
import { rateLimitRegister } from "src/common/registers/rate-limit.register";
import { swaggerRegister } from "src/common/registers/swagger.register";

@Module({
	imports: [
		CoreConfigModule.forRoot({
			envFilePath: [".env", "../.env", "../../.env"],
			isGlobal: true,
			load: [
				swaggerRegister,
				dbRegister,
				environmentRegister,
				appRegister,
				jwtRegister,
				cacheRegister,
				rateLimitRegister,
				proxyRegister,
			],
			validationSchema: Joi.object({}),
		}),
	],
})
export class ConfigModule {}
