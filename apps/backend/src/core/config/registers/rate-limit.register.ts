import type { RateLimitType } from "../types/rate-limiting.type";
import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";

export const rateLimitRegister = registerAs(
	ConfigKeyEnum.RATE_LIMIT,
	(): RateLimitType => {
		const ttl = Number(process.env.THROTTLE_TTL_MS || "");
		const limit = Number(process.env.THROTTLE_LIMIT || "");

		return {
			ttl,
			limit,
		};
	},
);
