import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../enums/config.enum.js";
import type { CacheType } from "../types/cache.type.js";

export const cacheRegister = registerAs(ConfigKeyEnum.CACHE, (): CacheType => {
	const explicit = process.env.REDIS_URL?.trim();
	if (explicit) {
		return { redisUrl: explicit };
	}
	const host = process.env.REDIS_HOST?.trim();
	if (!host) {
		return { redisUrl: "" };
	}
	const port = process.env.REDIS_PORT?.trim() || "6379";
	const pass = process.env.REDIS_PASSWORD?.trim();
	const auth = pass ? `:${encodeURIComponent(pass)}@` : "";
	return { redisUrl: `redis://${auth}${host}:${port}` };
});
