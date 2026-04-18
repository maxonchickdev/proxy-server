import type { Endpoint, Prisma } from "@prisma/generated/client";
import type { RateLimitConfig } from "@proxy-server/shared";
import type { RedisType } from "../core/config/types/redis.type.js";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { ConfigKeyEnum } from "../common/enums/config.enum.js";

const RATE_KEY_PREFIX = "ratelimit:";

@Injectable()
export class ProxyRateLimitService {
	private readonly logger = new Logger(ProxyRateLimitService.name);
	private readonly redis: Redis | null;
	private readonly memory = new Map<string, number[]>();
	private useMemoryOnly = false;

	constructor(@Inject(ConfigService) readonly configService: ConfigService) {
		const { url } = configService.getOrThrow<RedisType>(ConfigKeyEnum.REDIS);

		if (url.trim()) {
			this.redis = new Redis(url, {
				maxRetriesPerRequest: 1,
				enableOfflineQueue: false,
				lazyConnect: true,
			});
			this.redis.on("error", (err: Error) => {
				this.logger.warn(`Redis rate limit: ${err.message}`);
				this.useMemoryOnly = true;
			});
			void this.redis.connect().catch(() => {
				this.useMemoryOnly = true;
			});
		} else {
			this.redis = null;
		}
	}

	parseConfig(value: Prisma.JsonValue | null): RateLimitConfig | null {
		if (value === null || typeof value !== "object" || Array.isArray(value)) {
			return null;
		}
		const o = value as Record<string, unknown>;
		const maxRequests = o.maxRequests;
		const windowSeconds = o.windowSeconds;
		if (
			typeof maxRequests !== "number" ||
			typeof windowSeconds !== "number" ||
			!Number.isFinite(maxRequests) ||
			!Number.isFinite(windowSeconds) ||
			maxRequests < 1 ||
			windowSeconds < 1
		) {
			return null;
		}
		return { maxRequests, windowSeconds };
	}

	async shouldReject(endpoint: Endpoint, clientKey: string): Promise<boolean> {
		const cfg = this.parseConfig(endpoint.rateLimitConfig ?? null);
		if (!cfg) return false;
		const windowMs = cfg.windowSeconds * 1000;
		const now = Date.now();
		const redisKey = `${RATE_KEY_PREFIX}${endpoint.id}:${clientKey}`;
		if (this.redis && !this.useMemoryOnly) {
			try {
				await this.redis.zremrangebyscore(redisKey, 0, now - windowMs);
				const count = await this.redis.zcard(redisKey);
				if (count >= cfg.maxRequests) return true;
				await this.redis.zadd(redisKey, now, `${now}-${Math.random()}`);
				await this.redis.pexpire(redisKey, windowMs);
				return false;
			} catch {
				this.useMemoryOnly = true;
			}
		}
		const memKey = `${endpoint.id}:${clientKey}`;
		let stamps = this.memory.get(memKey) ?? [];
		stamps = stamps.filter((t) => t > now - windowMs);
		if (stamps.length >= cfg.maxRequests) {
			this.memory.set(memKey, stamps);
			return true;
		}
		stamps.push(now);
		this.memory.set(memKey, stamps);
		return false;
	}
}
