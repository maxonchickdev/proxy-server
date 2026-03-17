import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import type { RateLimitType } from "../types/rate-limiting.type.js";

export const rateLimitRegister = registerAs(
	ConfigKeyEnum.RATE_LIMIT,
	(): RateLimitType => {
		return {
			limit: Number(process.env.THROTTLE_LIMIT) || 0,
			ttl: Number(process.env.THROTTLE_TTL) || 0,
		};
	},
);
