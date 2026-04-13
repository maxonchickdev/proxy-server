import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";
import { JwtType } from "../types/jwt.type";

export const jwtRegister = registerAs(ConfigKeyEnum.JWT, (): JwtType => {
	const secret = process.env.JWT_SECRET;
	const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
	const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN;

	if (!secret || !accessExpiresIn || !refreshExpiresIn) {
		throw new Error("Missing some envs");
	}

	return {
		secret,
		accessExpiresIn,
		refreshExpiresIn,
	};
});
