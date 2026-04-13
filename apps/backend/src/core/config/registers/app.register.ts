import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";
import { AppType } from "../types/app.type";

export const appRegister = registerAs(ConfigKeyEnum.APP, (): AppType => {
	const port = Number(process.env.APP_PORT);
	const requestTimeout = Number(process.env.APP_REQUEST_TIMEOUT);
	const corsOrigin = process.env.APP_CORS_ORIGIN;
	const dashboardBaseUrl = corsOrigin;

	if (!port || !requestTimeout || !corsOrigin || !dashboardBaseUrl) {
		throw new Error("Missing some envs");
	}

	return {
		port,
		requestTimeout,
		corsOrigin,
		dashboardBaseUrl,
	};
});
