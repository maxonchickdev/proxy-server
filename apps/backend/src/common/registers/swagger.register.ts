import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import type { SwaggerType } from "../types/swagger.type.js";

export const swaggerRegister = registerAs(
	ConfigKeyEnum.SWAGGER,
	(): SwaggerType => {
		return {
			swaggerPath: process.env.SWAGGER_PATH || "",
			swaggerName: process.env.SWAGGER_NAME || "",
			swaggerDescr: process.env.SWAGGER_DESCR || "",
			swaggerSiteTitle: process.env.SWAGGER_SITE_TITLE || "",
		};
	},
);
