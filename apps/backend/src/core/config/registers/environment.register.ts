import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";
import { EnvironmentType } from "../types/environment.type";

export const environmentRegister = registerAs(
	ConfigKeyEnum.ENVIRONMENT,
	(): EnvironmentType => {
		const nodeEnv = process.env.NODE_ENV || "";

		return {
			nodeEnv,
		};
	},
);
