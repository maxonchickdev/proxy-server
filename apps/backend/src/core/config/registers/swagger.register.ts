import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";
import { SwaggerType } from "../types/swagger.type";

export const swaggerRegister = registerAs(
	ConfigKeyEnum.SWAGGER,
	(): SwaggerType => {
		const path = process.env.SWAGGER_PATH;
		const name = process.env.SWAGGER_NAME;
		const descr = process.env.SWAGGER_DESCR;
		const siteTitle = process.env.SWAGGER_SITE_TITLE;

		if (!path || !name || !descr || !siteTitle) {
			throw new Error("Missing some envs");
		}

		return {
			path,
			name,
			descr,
			siteTitle,
		};
	},
);
