import { registerAs } from "@nestjs/config";
import { ConfigKeyEnum } from "../../../common/enums/config.enum";
import { RedisType } from "../types/redis.type";

export const redisRegister = registerAs(ConfigKeyEnum.REDIS, (): RedisType => {
	const url = process.env.REDIS_URL;

	if (!url) {
		throw new Error("Missing some envs");
	}

	return { url };
});
