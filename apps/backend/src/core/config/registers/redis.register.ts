import type { RedisType } from "../types/redis.type";
import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";

export const redisRegister = registerAs(ConfigKeyEnum.REDIS, (): RedisType => {
	const url = process.env.REDIS_URL || "";

	return { url };
});
