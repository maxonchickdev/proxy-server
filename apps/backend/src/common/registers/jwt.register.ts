import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import type { JwtType } from "../types/jwt.type.js";

export const jwtRegister = registerAs(ConfigKeyEnum.JWT, (): JwtType => {
	return {
		expiresIn: Number(process.env.JWT_EXPIRES_IN) || 0,
		secret: process.env.JWT_SECRET || "",
	};
});
