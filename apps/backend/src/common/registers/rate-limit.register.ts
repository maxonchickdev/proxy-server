import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import type { RateLimitType } from "../types/rate-limiting.type.js";

export const rateLimitRegister = registerAs(
	ConfigKeyEnum.RATE_LIMIT,
	(): RateLimitType => {
		const ttl = Number(process.env.THROTTLE_TTL_MS);
		const limit = Number(process.env.THROTTLE_LIMIT);
		return {
			ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : 60_000,
			limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
		};
	},
);
