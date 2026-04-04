import type { EnvironmentType } from "../types/environment.type.js";
import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";

export const environmentRegister = registerAs(
	ConfigKeyEnum.ENVIRONMENT,
	(): EnvironmentType => {
		return {
			nodeEnv: process.env.NODE_ENV || "",
		};
	},
);
