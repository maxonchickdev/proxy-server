import type { JwtType } from "../types/jwt.type.js";
import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";

export const jwtRegister = registerAs(ConfigKeyEnum.JWT, (): JwtType => {
	return {
		secret: process.env.JWT_SECRET ?? "",
		accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
		refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
	};
});
