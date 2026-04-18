import type { SwaggerType } from "../types/swagger.type";
import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";

export const swaggerRegister = registerAs(
	ConfigKeyEnum.SWAGGER,
	(): SwaggerType => {
		const path = process.env.SWAGGER_PATH || "";
		const name = process.env.SWAGGER_NAME || "";
		const descr = process.env.SWAGGER_DESCR || "";
		const siteTitle = process.env.SWAGGER_SITE_TITLE || "";

		return {
			path,
			name,
			descr,
			siteTitle,
		};
	},
);
