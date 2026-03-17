import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import type { CacheType } from "../types/cache.type.js";

export const cacheRegister = registerAs(ConfigKeyEnum.CACHE, (): CacheType => {
	return {
		redisUrl: process.env.REDIS_URL || "",
	};
});
