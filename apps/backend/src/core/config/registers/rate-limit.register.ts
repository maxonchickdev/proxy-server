import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";
import { RateLimitType } from "../types/rate-limiting.type";

export const rateLimitRegister = registerAs(
	ConfigKeyEnum.RATE_LIMIT,
	(): RateLimitType => {
		const ttl = Number(process.env.THROTTLE_TTL_MS);
		const limit = Number(process.env.THROTTLE_LIMIT);

		if (!ttl || !limit) {
			throw new Error("Missing some envs");
		}

		return {
			ttl,
			limit,
		};
	},
);
