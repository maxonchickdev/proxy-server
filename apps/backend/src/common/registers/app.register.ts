import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import type { AppType } from "../types/app.type.js";

export const appRegister = registerAs(ConfigKeyEnum.APP, (): AppType => {
	const raw = process.env.CORS_ORIGIN ?? "http://localhost:5173";
	const corsOrigins = raw
		.split(",")
		.map((o) => o.trim())
		.filter(Boolean);
	return {
		appPort: Number(process.env.APP_PORT) || 0,
		appRequestTimeout: Number(process.env.APP_REQUEST_TIMEOUT) || 0,
		corsOrigins,
	};
});
