import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { ConfigKeyEnum } from "../../common/enums/config.enum";
import { alertThrottleConstants } from "./alert-throttle.constants";

/**
 * Redis-backed (or in-memory fallback) cooldown for alert spam prevention.
 */
@Injectable()
export class AlertThrottleService {
	private readonly logger = new Logger(AlertThrottleService.name);
	private readonly redis: Redis | null;
	private readonly memory = new Map<string, number>();
	private useMemoryOnly = false;

	constructor(private readonly config: ConfigService) {
		const url =
			this.config.get<string>(`${ConfigKeyEnum.CACHE}.redisUrl`) ?? "";
		if (url.trim()) {
			this.redis = new Redis(url, {
				maxRetriesPerRequest: 1,
				enableOfflineQueue: false,
				lazyConnect: true,
			});
			this.redis.on("error", (err: Error) => {
				this.logger.warn(`Redis throttle: ${err.message}`);
				this.useMemoryOnly = true;
			});
			void this.redis.connect().catch(() => {
				this.useMemoryOnly = true;
			});
		} else {
			this.redis = null;
		}
	}

	private key(endpointId: string, channelId: string): string {
		return `alert:throttle:${endpointId}:${channelId}`;
	}

	async isThrottled(endpointId: string, channelId: string): Promise<boolean> {
		const k = this.key(endpointId, channelId);
		if (this.redis && !this.useMemoryOnly) {
			try {
				const v = await this.redis.get(k);
				return v !== null;
			} catch {
				this.useMemoryOnly = true;
			}
		}
		const last = this.memory.get(k);
		if (!last) return false;
		return Date.now() - last < alertThrottleConstants.COOLDOWN_MS;
	}

	async markSent(endpointId: string, channelId: string): Promise<void> {
		const k = this.key(endpointId, channelId);
		if (this.redis && !this.useMemoryOnly) {
			try {
				await this.redis.set(k, "1", "PX", alertThrottleConstants.COOLDOWN_MS);
				return;
			} catch {
				this.useMemoryOnly = true;
			}
		}
		this.memory.set(k, Date.now());
	}
}
